// UniversityManagementPanel PARTNER OS EXTREME — University Strategy Command Center
// Zaifan Admin OS functional overhaul:
// - dedicated shortlist workspace with Dream / Target / Safe strategy
// - real structured Supabase persistence using student_universities
// - exact university → application linkage (never falls back to another application)
// - fit, readiness, risk, deadlines, costs, scholarship/DSU and next-action tracking
// - edit, archive, restore, permanent delete, compare and audit history
// - structured university requirements using student_university_requirements
// - permanent audit trail using student_university_events
// - compact practical UI; every section has an operational purpose
// - identity-safe reads/writes/deletes using student_id + student_type
// - request-generation protection when switching students/universities
// - timeout cleanup and stronger post-timeout recovery
// - per-record concurrency instead of globally locking the workspace
// - authoritative shared university data when supplied
// - parent sync/audit failures separated from core database saves
// - exact application linkage preserved across all actions
// - application-link transition now reconciles university status safely
// - safer permanent delete with student scoping
// - requirement actions scoped to the active university
// - deterministic shortlist health / portfolio pressure intelligence
// - affordability, deadline, ownership and requirement pressure surfaced
// - no fake AI; scoring remains transparent deterministic rules
// - application reconciliation detects Application OS records missing a university shortlist row
// - one-click create/link repair preserves exact application identity and prevents duplicates

import { useEffect, useMemo, useRef, useState } from "react";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Columns3,
  FileCheck2,
  FileWarning,
  GraduationCap,
  History,
  Landmark,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  University,
  WalletCards,
  X,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import ProgramTracker from "./ProgramTracker";
import {
  UNIVERSITY_REQUIREMENT_CATEGORIES,
  UNIVERSITY_REQUIREMENT_LIBRARY,
  getRecommendedUniversityRequirements,
  getUniversityRequirementCategory,
  getUniversityRequirementLibraryStats,
  getUniversityRequirementMeta,
  groupUniversityRequirements,
} from "../../../../data/universityRequirementLibrary";

const REQUEST_TIMEOUT_MS = 20000;

const CATEGORY_OPTIONS = [
  { id: "dream", label: "Dream", description: "Ambitious but possible" },
  { id: "target", label: "Target", description: "Strong realistic match" },
  { id: "safe", label: "Safe", description: "Backup / higher probability" },
];

const STATUS_OPTIONS = [
  "interested",
  "researching",
  "shortlisted",
  "application_ready",
  "applied",
  "offer_received",
  "accepted",
  "rejected",
  "enrolled",
];

const RISK_OPTIONS = ["low", "medium", "high", "critical"];

const SCHOLARSHIP_OPTIONS = [
  "not_checked",
  "eligible",
  "applied",
  "awarded",
  "rejected",
  "not_available",
];

const REQUIREMENT_STATUS_OPTIONS = [
  "missing",
  "requested",
  "received",
  "under_review",
  "verified",
  "rejected",
  "not_required",
];

const EMPTY_FORM = {
  university: "",
  country: "Italy",
  program: "",
  degree_level: "",
  intake: "",

  category: "target",
  status: "shortlisted",

  deadline_date: "",
  application_fee: "",
  application_fee_currency: "EUR",
  tuition_amount: "",
  tuition_currency: "EUR",
  living_cost_amount: "",
  living_cost_currency: "EUR",

  scholarship_status: "not_checked",
  scholarship_name: "",
  scholarship_amount: "",
  scholarship_currency: "EUR",
  dsu_eligible: false,

  fit_score: "",
  fit_level: "",
  fit_reasons: [],
  readiness_score: "",
  risk_level: "low",
  risk_reasons: [],

  next_action: "",
  next_action_due: "",
  counselor_recommendation: "",
  decision_reason: "",
  notes: "",

  is_archived: false,
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const pretty = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value, currency = "EUR") => {
  if (value === null || value === undefined || value === "") return "Not set";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${currency || "EUR"} ${numeric.toLocaleString()}`;
  }
};

const deadlineMeta = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;

  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);

  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "red", days };
  if (days === 0) return { label: "Due today", tone: "red", days };
  if (days <= 7) return { label: `${days}d left`, tone: "orange", days };
  if (days <= 30) return { label: `${days}d left`, tone: "blue", days };
  return { label: formatDate(value), tone: "slate", days };
};

const applicationUniversityName = (application = {}) =>
  String(
    application.university ||
      application.university_name ||
      application.source_university_name ||
      application.institution_name ||
      ""
  ).trim();

const applicationProgramName = (application = {}) =>
  String(
    application.program ||
      application.course_name ||
      application.course ||
      application.program_name ||
      ""
  ).trim();

const applicationCountryName = (application = {}) =>
  String(
    application.country ||
      application.destination_country ||
      application.country_interest ||
      "Italy"
  ).trim();

const applicationIntakeName = (application = {}) =>
  String(
    application.intake ||
      application.target_intake ||
      application.preferred_intake ||
      ""
  ).trim();

const applicationDegreeLevel = (application = {}) =>
  String(
    application.degree_level ||
      application.study_level ||
      application.qualification_level ||
      ""
  ).trim();

const universityStatusFromApplication = (application = {}) => {
  const status = normalize(
    application.application_status || application.status || "not started"
  );
  const offer = normalize(application.offer_status || "pending");

  if (status === "enrolled" || status.includes("enrollment complete")) {
    return "enrolled";
  }

  if (
    status.includes("offer accepted") ||
    status === "accepted" ||
    offer.includes("offer accepted") ||
    offer === "accepted"
  ) {
    return "accepted";
  }

  if (
    status.includes("offer received") ||
    status.includes("admitted") ||
    status.includes("conditional admission") ||
    offer.includes("offer received") ||
    offer.includes("admitted") ||
    offer.includes("conditional")
  ) {
    return "offer_received";
  }

  if (
    status.includes("submitted") ||
    status.includes("applied") ||
    status.includes("under review") ||
    status.includes("interview") ||
    status.includes("admission test")
  ) {
    return "applied";
  }

  if (
    status.includes("ready to submit") ||
    status.includes("documents received") ||
    status.includes("preparing") ||
    status.includes("pre enrollment")
  ) {
    return "application_ready";
  }

  if (status.includes("reject") || offer.includes("reject")) {
    return "rejected";
  }

  return "shortlisted";
};

const universityNextActionFromApplication = (application = {}) => {
  const status = universityStatusFromApplication(application);

  if (status === "enrolled") {
    return "Confirm enrollment evidence, arrival planning and final student registration.";
  }

  if (status === "accepted") {
    return "Confirm Universitaly pre-enrolment, deposit obligations and visa preparation.";
  }

  if (status === "offer_received") {
    return "Review the admission decision, conditions, acceptance deadline and funding plan.";
  }

  if (status === "applied") {
    return "Track university review, acknowledgement, interview and additional-document requests.";
  }

  if (status === "application_ready") {
    return "Complete the final application checklist and confirm submission readiness.";
  }

  if (status === "rejected") {
    return "Record the decision reason and move the student to the next suitable university option.";
  }

  return "Verify course fit, intake, costs, deadline and entry requirements before application movement.";
};

const universityMatchesApplication = (university = {}, application = {}) => {
  const universityName = normalize(university.university);
  const applicationName = normalize(applicationUniversityName(application));

  if (!universityName || !applicationName || universityName !== applicationName) {
    return false;
  }

  const universityProgram = normalize(university.program);
  const applicationProgram = normalize(applicationProgramName(application));
  const universityIntake = normalize(university.intake);
  const applicationIntake = normalize(applicationIntakeName(application));

  if (
    universityProgram &&
    applicationProgram &&
    universityProgram !== applicationProgram
  ) {
    return false;
  }

  if (
    universityIntake &&
    applicationIntake &&
    universityIntake !== applicationIntake
  ) {
    return false;
  }

  return true;
};

function UniversityManagementPanel({
  student = {},
  sharedUniversities = null,
  sharedApplication = null,
  onSharedDataChange = null,
  onOpenApplication = null,
}) {
  const [universities, setUniversities] = useState(
    Array.isArray(sharedUniversities) ? sharedUniversities : []
  );
  const [applications, setApplications] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [events, setEvents] = useState([]);

  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_FORM);

  const [activeTab, setActiveTab] = useState("shortlist");
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [comparisonIds, setComparisonIds] = useState([]);

  const [showEditor, setShowEditor] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [requirementDraft, setRequirementDraft] = useState({
    requirement_name: "",
    requirement_category: "general",
    target_value: "",
    current_value: "",
    status: "missing",
    due_date: "",
    notes: "",
  });
  const [showRequirementLibrary, setShowRequirementLibrary] = useState(false);
  const [requirementLibraryQuery, setRequirementLibraryQuery] = useState("");
  const [requirementLibraryCategory, setRequirementLibraryCategory] = useState("all");
  const [expandedRequirementGroups, setExpandedRequirementGroups] = useState(
    () => new Set()
  );

  const [loading, setLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState(() => new Set());

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [auditWarning, setAuditWarning] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const mountedRef = useRef(true);
  const coreRequestRef = useRef(0);
  const supportRequestRef = useRef(0);
  const identityRef = useRef("");

  const studentId = Number(student?.id);
  const hasValidStudentId = Number.isFinite(studentId) && studentId > 0;
  const studentType = normalize(
    student?.student_type || student?.__leadType || student?.type || "inquiry"
  );
  const studentIdentity = `${String(student?.id || "")}:${studentType}`;

  const sharedApplicationRows = useMemo(() => {
    if (Array.isArray(sharedApplication)) {
      return sharedApplication.filter(Boolean);
    }

    if (sharedApplication && typeof sharedApplication === "object") {
      return sharedApplication.id ? [sharedApplication] : [];
    }

    return [];
  }, [sharedApplication]);

  const preferredCountry =
    student?.country ||
    student?.preferred_country ||
    student?.country_interest ||
    "Italy";

  const preferredProgram =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    student?.study_field ||
    "";

  const activeUniversity = useMemo(
    () =>
      universities.find((item) => String(item.id) === String(activeId)) || null,
    [universities, activeId]
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  );

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const startSaving = (key) => {
    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });
    });
  };

  const stopSaving = (key) => {
    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    });
  };

  const withTimeout = (promise, message = "Request timed out.") => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error(message)),
        REQUEST_TIMEOUT_MS
      );
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      window.clearTimeout(timeoutId);
    });
  };

  const normalizeUniversity = (record) => ({
    ...EMPTY_FORM,
    ...(record || {}),
    deadline_date: toDateInput(record?.deadline_date),
    next_action_due: toDateInput(record?.next_action_due),
    fit_reasons: Array.isArray(record?.fit_reasons) ? record.fit_reasons : [],
    risk_reasons: Array.isArray(record?.risk_reasons) ? record.risk_reasons : [],
  });

  const notifyParent = async (payload = {}) => {
    if (typeof onSharedDataChange !== "function") {
      return { ok: true, skipped: true };
    }

    try {
      await withTimeout(
        Promise.resolve(onSharedDataChange(payload)),
        "Student OS background refresh timed out."
      );
      safeSet(() => setLastSyncedAt(new Date()));
      return { ok: true };
    } catch (refreshError) {
      console.warn(
        "University data saved but Student OS background refresh was delayed:",
        refreshError
      );
      return {
        ok: false,
        message:
          refreshError?.message ||
          "Student OS background refresh did not confirm.",
      };
    }
  };

  const createUniversityEvent = async ({
    studentUniversityId = null,
    applicationId = null,
    eventType,
    eventLabel = "",
    oldValue = "",
    newValue = "",
    reason = null,
    metadata = {},
  }) => {
    try {
      const { data, error: eventError } = await withTimeout(
        supabase
        .from("student_university_events")
        .insert({
          student_id: studentId,
          student_type: studentType,
          student_university_id: studentUniversityId,
          application_id: applicationId,
          event_type: eventType,
          event_label: eventLabel || pretty(eventType),
          old_value: oldValue || null,
          new_value: newValue || null,
          reason,
          metadata,
        })
        .select()
        .single(),
        "University audit event timed out."
      );

      if (eventError) throw eventError;

      safeSet(() => {
        setEvents((previous) => [data, ...previous].slice(0, 200));
      });

      return { ok: true, data };
    } catch (eventError) {
      console.warn("University event failed:", eventError);
      return {
        ok: false,
        message: eventError?.message || "University audit event did not confirm.",
      };
    }
  };

  const createTimelineEvent = async ({
    applicationId = null,
    eventType,
    title,
    description = "",
    oldValue = "",
    newValue = "",
  }) => {
    if (!hasValidStudentId) return { ok: false, message: "Invalid student identity." };

    try {
      const { error: timelineError } = await withTimeout(
        supabase.from("student_application_timeline").insert({
        student_id: studentId,
        student_type: studentType,
        application_id: applicationId,
        event_type: eventType,
        title,
        description,
        old_value: oldValue || null,
        new_value: newValue || null,
      }),
        "Student OS timeline event timed out."
      );

      if (timelineError) throw timelineError;
      return { ok: true };
    } catch (timelineError) {
      console.warn("Student OS timeline event failed:", timelineError);
      return {
        ok: false,
        message: timelineError?.message || "Timeline event did not confirm.",
      };
    }
  };

  const loadCoreData = async ({ force = false } = {}) => {
    if (!hasValidStudentId) return;

    const requestId = coreRequestRef.current + 1;
    coreRequestRef.current = requestId;

    if (Array.isArray(sharedUniversities) && !force) {
      const rows = sharedUniversities;
      const preferred =
        rows.find((item) => !item.is_archived) || rows[0] || null;
      const nextForm = preferred
        ? normalizeUniversity(preferred)
        : {
            ...EMPTY_FORM,
            country: preferredCountry || "Italy",
            program: preferredProgram || "",
          };

      safeSet(() => {
        setUniversities(rows);
        setActiveId(preferred?.id || null);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setLastSyncedAt(new Date());
      });

      if (preferred?.id) void loadSupportData(preferred.id);

      if (sharedApplicationRows.length) {
        safeSet(() => setApplications(sharedApplicationRows));
      }

      if (Array.isArray(sharedApplication)) {
        return;
      }

      safeSet(() => {
        setLoading(true);
        setError("");
      });

      try {
        const { data: applicationRows, error: applicationsError } =
          await supabase
            .from("student_applications")
            .select("*")
            .eq("student_id", studentId)
            .eq("student_type", studentType)
            .order("created_at", { ascending: false });

        if (applicationsError) throw applicationsError;

        if (requestId !== coreRequestRef.current) return;

        safeSet(() => {
          setApplications(applicationRows || []);
          setLastSyncedAt(new Date());
        });
      } catch (applicationLoadError) {
        safeSet(() =>
          setError(
            applicationLoadError.message ||
              "University options loaded, but Application OS records could not be checked."
          )
        );
      } finally {
        safeSet(() => setLoading(false));
      }

      return;
    }

    safeSet(() => {
      setLoading(true);
      setError("");
    });

    try {
      const [universitiesResult, applicationsResult] = await Promise.all([
        supabase
          .from("student_universities")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false }),

        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", studentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false }),
      ]);

      if (universitiesResult.error) throw universitiesResult.error;
      if (applicationsResult.error) throw applicationsResult.error;

      const universityRows = universitiesResult.data || [];
      const applicationRows = applicationsResult.data || [];

      const preferred =
        universityRows.find((item) => !item.is_archived) ||
        universityRows[0] ||
        null;

      const nextForm = preferred
        ? normalizeUniversity(preferred)
        : {
            ...EMPTY_FORM,
            country: preferredCountry || "Italy",
            program: preferredProgram || "",
          };

      if (requestId !== coreRequestRef.current) return;

      safeSet(() => {
        setUniversities(universityRows);
        setApplications(applicationRows);
        setActiveId(preferred?.id || null);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setLastSyncedAt(new Date());
      });

      if (preferred?.id) {
        void loadSupportData(preferred.id);
      } else {
        safeSet(() => {
          setRequirements([]);
          setEvents([]);
        });
      }
    } catch (loadError) {
      safeSet(() =>
        setError(loadError.message || "University workspace could not be loaded.")
      );
    } finally {
      safeSet(() => setLoading(false));
    }
  };

  const loadSupportData = async (studentUniversityId) => {
    if (!studentUniversityId) return;

    const requestId = supportRequestRef.current + 1;
    supportRequestRef.current = requestId;

    safeSet(() => setSupportLoading(true));

    try {
      const [requirementsResult, eventsResult] = await Promise.all([
        supabase
          .from("student_university_requirements")
          .select("*")
          .eq("student_university_id", studentUniversityId)
          .order("created_at", { ascending: true }),

        supabase
          .from("student_university_events")
          .select("*")
          .eq("student_university_id", studentUniversityId)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (requirementsResult.error) throw requirementsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      if (requestId !== supportRequestRef.current) return;

      safeSet(() => {
        setRequirements(requirementsResult.data || []);
        setEvents(eventsResult.data || []);
      });
    } catch (supportError) {
      safeSet(() =>
        setError(
          supportError.message ||
            "University requirements/history could not be loaded."
        )
      );
    } finally {
      safeSet(() => setSupportLoading(false));
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (identityRef.current === studentIdentity) return;

    identityRef.current = studentIdentity;
    coreRequestRef.current += 1;
    supportRequestRef.current += 1;

    setError("");
    setSuccessMessage("");
    setAuditWarning("");
    setComparisonIds([]);
    setSearch("");
    setShowArchived(false);

    void loadCoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIdentity]);

  useEffect(() => {
    setExpandedRequirementGroups(new Set());
  }, [activeId]);

  useEffect(() => {
    if (!Array.isArray(sharedUniversities)) return;

    setUniversities(sharedUniversities);
    setLastSyncedAt(new Date());

    if (
      activeId &&
      !sharedUniversities.some(
        (item) => String(item.id) === String(activeId)
      )
    ) {
      const next =
        sharedUniversities.find((item) => !item.is_archived) ||
        sharedUniversities[0] ||
        null;

      setActiveId(next?.id || null);

      const nextForm = next
        ? normalizeUniversity(next)
        : {
            ...EMPTY_FORM,
            country: preferredCountry || "Italy",
            program: preferredProgram || "",
          };

      setForm(nextForm);
      setSavedSnapshot(nextForm);
    }
  }, [sharedUniversities]);

  useEffect(() => {
    if (Array.isArray(sharedApplication)) {
      setApplications(sharedApplicationRows);
      setLastSyncedAt(new Date());
      return;
    }

    if (!sharedApplicationRows.length) return;

    setApplications((previous) => {
      const incomingIds = new Set(
        sharedApplicationRows.map((item) => String(item.id))
      );

      return [
        ...sharedApplicationRows,
        ...previous.filter((item) => !incomingIds.has(String(item.id))),
      ];
    });
    setLastSyncedAt(new Date());
  }, [sharedApplication, sharedApplicationRows]);

  const requirementStats = useMemo(() => {
    let verified = 0;
    let missing = 0;
    let review = 0;

    for (const item of requirements) {
      const status = String(item?.status || "");

      if (["verified", "not_required"].includes(status)) {
        verified += 1;
      } else if (["missing", "rejected"].includes(status)) {
        missing += 1;
      } else if (
        ["requested", "received", "under_review"].includes(status)
      ) {
        review += 1;
      }
    }

    const total = requirements.length;
    const readiness = total
      ? Math.round((verified / total) * 100)
      : 0;

    return {
      total,
      verified,
      missing,
      review,
      readiness,
    };
  }, [requirements]);

  const groupedRequirementSections = useMemo(
    () => groupUniversityRequirements(requirements),
    [requirements]
  );

  const toggleRequirementGroup = (groupId) => {
    setExpandedRequirementGroups((previous) => {
      const next = new Set(previous);

      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);

      return next;
    });
  };

  const expandAllRequirementGroups = () => {
    setExpandedRequirementGroups(
      new Set(groupedRequirementSections.map((group) => group.id))
    );
  };

  const collapseAllRequirementGroups = () => {
    setExpandedRequirementGroups(new Set());
  };

  const requirementLibraryStats = useMemo(() => getUniversityRequirementLibraryStats(), []);

  const recommendedRequirementTemplates = useMemo(
    () =>
      getRecommendedUniversityRequirements({
        university: { ...(activeUniversity || {}), ...form },
        student,
        application: activeUniversity
          ? exactLinkedApplication(activeUniversity)
          : sharedApplicationRows[0] || null,
      }),
    [activeUniversity, form, sharedApplicationRows, student]
  );

  const existingRequirementNameSet = useMemo(
    () => new Set(requirements.map((item) => normalize(item?.requirement_name)).filter(Boolean)),
    [requirements]
  );

  const missingRecommendedRequirementTemplates = useMemo(
    () => recommendedRequirementTemplates.filter((item) => !existingRequirementNameSet.has(normalize(item.name))),
    [existingRequirementNameSet, recommendedRequirementTemplates]
  );

  const filteredRequirementLibrary = useMemo(() => {
    const query = normalize(requirementLibraryQuery);
    return UNIVERSITY_REQUIREMENT_LIBRARY.filter((item) => {
      if (requirementLibraryCategory !== "all" && item.category !== requirementLibraryCategory) return false;
      if (!query) return true;
      return normalize([item.name,item.category,item.studentDescription,...(item.tags || []),...(item.programKeywords || [])].join(" ")).includes(query);
    });
  }, [requirementLibraryCategory, requirementLibraryQuery]);

  const calculatedIntelligence = useMemo(() => {
    const scoreParts = [];
    let fit = 50;
    let readiness = 0;
    let risk = 10;

    if (form.country && normalize(form.country) === normalize(preferredCountry)) {
      fit += 15;
      scoreParts.push("Matches preferred destination");
    }

    if (
      form.program &&
      preferredProgram &&
      normalize(form.program).includes(normalize(preferredProgram))
    ) {
      fit += 20;
      scoreParts.push("Program matches student interest");
    }

    if (form.category === "target") fit += 5;
    if (form.category === "safe") fit += 10;
    if (form.category === "dream") fit -= 5;

    if (form.scholarship_status === "eligible" || form.dsu_eligible) {
      fit += 10;
      scoreParts.push("Scholarship/DSU potential");
    }

    if (form.deadline_date) {
      const deadline = deadlineMeta(form.deadline_date);
      if (deadline?.tone === "red") {
        risk += 40;
      } else if (deadline?.tone === "orange") {
        risk += 25;
      } else if (deadline?.tone === "blue") {
        risk += 10;
      }
    } else {
      risk += 15;
    }

    if (requirementStats.total) {
      readiness = requirementStats.readiness;
      risk += requirementStats.missing * 7;
    } else {
      readiness = form.readiness_score
        ? Number(form.readiness_score)
        : [form.university, form.program, form.intake, form.deadline_date].filter(
            Boolean
          ).length * 20;
    }

    if (!form.program) risk += 10;
    if (!form.intake) risk += 10;
    if (form.risk_level === "critical") risk += 30;
    if (form.risk_level === "high") risk += 20;
    if (form.risk_level === "medium") risk += 10;

    fit = Math.max(0, Math.min(100, Number(form.fit_score) || fit));
    readiness = Math.max(
      0,
      Math.min(100, Number(form.readiness_score) || readiness)
    );
    risk = Math.max(0, Math.min(100, risk));

    const fitLevel =
      fit >= 80 ? "Excellent" : fit >= 65 ? "Strong" : fit >= 45 ? "Possible" : "Weak";

    const riskLevel =
      risk >= 75 ? "Critical" : risk >= 55 ? "High" : risk >= 30 ? "Medium" : "Low";

    return {
      fit,
      fitLevel,
      readiness,
      risk,
      riskLevel,
      fitReasons: scoreParts,
    };
  }, [
    form,
    preferredCountry,
    preferredProgram,
    requirementStats,
  ]);

  const buildPayload = () => ({
    student_id: studentId,
    student_type: studentType,

    university: form.university.trim(),
    country: form.country || "Italy",
    program: form.program || null,
    degree_level: form.degree_level || null,
    intake: form.intake || null,

    category: form.category || "target",
    status: form.status || "shortlisted",

    deadline_date: form.deadline_date || null,

    application_fee: toNumberOrNull(form.application_fee),
    application_fee_currency: form.application_fee_currency || "EUR",

    tuition_amount: toNumberOrNull(form.tuition_amount),
    tuition_currency: form.tuition_currency || "EUR",

    living_cost_amount: toNumberOrNull(form.living_cost_amount),
    living_cost_currency: form.living_cost_currency || "EUR",

    scholarship_status: form.scholarship_status || "not_checked",
    scholarship_name: form.scholarship_name || null,
    scholarship_amount: toNumberOrNull(form.scholarship_amount),
    scholarship_currency: form.scholarship_currency || "EUR",
    dsu_eligible: Boolean(form.dsu_eligible),

    fit_score: calculatedIntelligence.fit,
    fit_level: calculatedIntelligence.fitLevel,
    fit_reasons:
      form.fit_reasons?.length
        ? form.fit_reasons
        : calculatedIntelligence.fitReasons,

    readiness_score: calculatedIntelligence.readiness,

    risk_level: form.risk_level || calculatedIntelligence.riskLevel.toLowerCase(),
    risk_reasons: form.risk_reasons || [],

    next_action: form.next_action || null,
    next_action_due: form.next_action_due || null,
    counselor_recommendation: form.counselor_recommendation || null,
    decision_reason: form.decision_reason || null,
    notes: form.notes || null,

    updated_at: new Date().toISOString(),
  });

  const saveUniversity = async () => {
    if (!hasValidStudentId || !form.university.trim()) {
      return;
    }

    const operationKey = activeUniversity?.id
      ? `save-${activeUniversity.id}`
      : "create-university";

    if (savingKeys.has(operationKey)) return;

    startSaving(operationKey);
    setError("");
    setSuccessMessage("");
    setAuditWarning("");

    try {
      const payload = buildPayload();
      let result;

      if (activeUniversity?.id) {
        result = await withTimeout(
          supabase
            .from("student_universities")
            .update(payload)
            .eq("id", activeUniversity.id)
            .eq("student_id", studentId)
            .eq("student_type", studentType)
            .select()
            .single(),
          "University save timed out."
        );
      } else {
        result = await withTimeout(
          supabase
            .from("student_universities")
            .insert(payload)
            .select()
            .single(),
          "University creation timed out."
        );
      }

      if (result.error) throw result.error;

      const saved = result.data;
      const wasNew = !activeUniversity?.id;
      const nextForm = normalizeUniversity(saved);

      safeSet(() => {
        setUniversities((previous) => {
          if (wasNew) return [saved, ...previous];
          return previous.map((item) =>
            String(item.id) === String(saved.id) ? saved : item
          );
        });
        setActiveId(saved.id);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setShowEditor(false);
        setSuccessMessage(wasNew ? "University option added." : "University option saved.");
      });

      const [eventResult, timelineResult] = await Promise.all([
        createUniversityEvent({
          studentUniversityId: saved.id,
          eventType: wasNew ? "university_created" : "university_saved",
          eventLabel: wasNew ? "University added" : "University saved",
          newValue: saved.university,
        }),
        createTimelineEvent({
          eventType: wasNew ? "university_added" : "university_updated",
          title: wasNew ? "University Added" : "University Updated",
          description: `${saved.university} · ${saved.program || "Program not set"}.`,
          newValue: saved.category,
        }),
      ]);

      if (wasNew) {
        await seedDefaultRequirements(saved);
      } else {
        void loadSupportData(saved.id);
      }

      const syncResult = await notifyParent({
        source: "university_save",
        university: saved,
      });

      if (!eventResult?.ok || !timelineResult?.ok || !syncResult?.ok) {
        safeSet(() =>
          setAuditWarning(
            "University data saved, but one or more Student OS audit/background sync steps did not confirm."
          )
        );
      }
    } catch (saveError) {
      const message = String(saveError?.message || "");

      safeSet(() =>
        setError(
          message.includes("uq_student_universities_active_option")
            ? "This exact university, program and intake is already active in the shortlist. Open the existing option or archive it first."
            : message || "University save failed."
        )
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const insertRequirementTemplates = async (university, templates = [], { successMessage = "University requirements added.", requirementType = "library" } = {}) => {
    if (!university?.id || !Array.isArray(templates) || !templates.length) return [];
    const existingNames = new Set(requirements.map((item) => normalize(item?.requirement_name)).filter(Boolean));
    const rows = templates
      .filter((template) => !existingNames.has(normalize(template.name)))
      .map((template) => ({
        student_university_id: university.id,
        requirement_name: template.name,
        requirement_category: template.category,
        requirement_type: requirementType,
        required: true,
        status: "missing",
        target_value: template.defaultTarget || null,
        notes: template.studentDescription || null,
      }));
    if (!rows.length) {
      safeSet(() => setSuccessMessage("All selected university requirements already exist."));
      return [];
    }
    const { data, error: insertError } = await withTimeout(
      supabase.from("student_university_requirements").insert(rows).select(),
      "University requirement library insert timed out."
    );
    if (insertError) throw insertError;
    const inserted = Array.isArray(data) ? data : [];
    safeSet(() => {
      setRequirements((previous) => [...previous, ...inserted]);
      setSuccessMessage(`${successMessage} ${inserted.length} requirement${inserted.length === 1 ? "" : "s"} added.`);
    });
    void createUniversityEvent({
      studentUniversityId: university.id,
      eventType: "university_requirement_library_applied",
      eventLabel: "Requirement library applied",
      newValue: `${inserted.length} requirements`,
      metadata: { template_names: inserted.map((item) => item.requirement_name) },
    });
    return inserted;
  };

  const seedDefaultRequirements = async (university) => {
    if (!university?.id) return;
    const templates = getRecommendedUniversityRequirements({
      university,
      student,
      application: exactLinkedApplication(university) || sharedApplicationRows[0] || null,
    });
    try {
      await insertRequirementTemplates(university, templates, {
        successMessage: "Recommended university requirement set created.",
        requirementType: "recommended_library",
      });
    } catch (seedError) {
      console.warn("University requirement seed failed:", seedError);
    }
  };

  const loadRecommendedRequirements = async () => {
    if (!activeUniversity?.id || !missingRecommendedRequirementTemplates.length) {
      if (activeUniversity?.id) setSuccessMessage("All recommended requirements are already loaded.");
      return;
    }
    const operationKey = "load-recommended-requirements";
    startSaving(operationKey); setError("");
    try {
      await insertRequirementTemplates(activeUniversity, missingRecommendedRequirementTemplates, {
        successMessage: "Recommended requirement set expanded.",
        requirementType: "recommended_library",
      });
    } catch (libraryError) {
      safeSet(() => setError(libraryError.message || "Recommended requirement load failed."));
    } finally { stopSaving(operationKey); }
  };

  const addLibraryRequirement = async (template) => {
    if (!activeUniversity?.id || !template) return;
    const operationKey = `library-requirement-${template.id}`;
    startSaving(operationKey); setError("");
    try {
      await insertRequirementTemplates(activeUniversity, [template], {
        successMessage: "Requirement added from master library.",
        requirementType: "library",
      });
    } catch (libraryError) {
      safeSet(() => setError(libraryError.message || "Requirement library add failed."));
    } finally { stopSaving(operationKey); }
  };

  const addVisibleLibraryRequirements = async () => {
    if (!activeUniversity?.id || !filteredRequirementLibrary.length) return;
    const operationKey = "library-requirements-visible";
    startSaving(operationKey); setError("");
    try {
      await insertRequirementTemplates(activeUniversity, filteredRequirementLibrary, {
        successMessage: "Visible requirement library selection applied.",
        requirementType: "library",
      });
    } catch (libraryError) {
      safeSet(() => setError(libraryError.message || "Requirement library batch add failed."));
    } finally { stopSaving(operationKey); }
  };

  const beginNewUniversity = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved university changes. Discard them and add a new option?"
      )
    ) {
      return;
    }

    const nextForm = {
      ...EMPTY_FORM,
      country: preferredCountry || "Italy",
      program: preferredProgram || "",
    };

    setActiveId(null);
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setRequirements([]);
    setEvents([]);
    setShowEditor(true);
    setActiveTab("shortlist");
    setError("");
  };

  const selectUniversity = (university) => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved university changes. Discard them and switch?"
      )
    ) {
      return;
    }

    const nextForm = normalizeUniversity(university);

    setActiveId(university.id);
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setShowEditor(false);
    setActiveTab("details");
    void loadSupportData(university.id);
  };

  function exactLinkedApplication(university) {
    return (
      applications.find(
        (application) =>
          application.source_university_id &&
          String(application.source_university_id) === String(university.id)
      ) || null
    );
  }

  const applicationReconciliationItems = useMemo(() => {
    return applications
      .filter((application) => {
        if (!application?.id || !applicationUniversityName(application)) {
          return false;
        }

        if (
          application.source_university_id &&
          universities.some(
            (university) =>
              String(university.id) ===
              String(application.source_university_id)
          )
        ) {
          return false;
        }

        return true;
      })
      .map((application) => ({
        application,
        matchingUniversity:
          universities.find((university) =>
            universityMatchesApplication(university, application)
          ) || null,
      }));
  }, [applications, universities]);

  const reconcileApplicationUniversity = async ({
    application,
    matchingUniversity = null,
  }) => {
    if (!application?.id || !hasValidStudentId) return;

    const universityName = applicationUniversityName(application);

    if (!universityName) {
      setError(
        "This Application OS record has no university name, so it cannot be reconciled safely."
      );
      return;
    }

    const operationKey = `reconcile-application-${application.id}`;
    if (savingKeys.has(operationKey)) return;

    startSaving(operationKey);
    setError("");
    setSuccessMessage("");
    setAuditWarning("");

    const previousApplicationLink = {
      source_university_id: application.source_university_id || null,
      source_university_name: application.source_university_name || null,
    };

    let universityRecord = matchingUniversity;
    let createdUniversity = false;
    let linkedApplication = null;

    try {
      if (matchingUniversity?.id) {
        const conflictingApplication = applications.find(
          (item) =>
            String(item.id) !== String(application.id) &&
            item.source_university_id &&
            String(item.source_university_id) ===
              String(matchingUniversity.id)
        );

        if (conflictingApplication?.id) {
          throw new Error(
            `${matchingUniversity.university} is already linked to another Application OS record. Open both records and verify the duplicate before changing the link.`
          );
        }

        const { data: linkedRow, error: applicationLinkError } =
          await withTimeout(
            supabase
              .from("student_applications")
              .update({
                source_university_id: matchingUniversity.id,
                source_university_name: matchingUniversity.university,
                updated_at: new Date().toISOString(),
              })
              .eq("id", application.id)
              .eq("student_id", studentId)
              .eq("student_type", studentType)
              .select()
              .single(),
            "Application-to-university link timed out."
          );

        if (applicationLinkError) throw applicationLinkError;
        linkedApplication = linkedRow;

        const { data: updatedUniversity, error: universityUpdateError } =
          await withTimeout(
            supabase
              .from("student_universities")
              .update({
                country:
                  matchingUniversity.country ||
                  applicationCountryName(application) ||
                  "Italy",
                program:
                  matchingUniversity.program ||
                  applicationProgramName(application) ||
                  null,
                degree_level:
                  matchingUniversity.degree_level ||
                  applicationDegreeLevel(application) ||
                  null,
                intake:
                  matchingUniversity.intake ||
                  applicationIntakeName(application) ||
                  null,
                category: matchingUniversity.category || "target",
                status: universityStatusFromApplication(application),
                is_archived: false,
                archived_at: null,
                next_action:
                  matchingUniversity.next_action ||
                  universityNextActionFromApplication(application),
                updated_at: new Date().toISOString(),
              })
              .eq("id", matchingUniversity.id)
              .eq("student_id", studentId)
              .eq("student_type", studentType)
              .select()
              .single(),
            "University reconciliation update timed out."
          );

        if (universityUpdateError) {
          await supabase
            .from("student_applications")
            .update({
              ...previousApplicationLink,
              updated_at: new Date().toISOString(),
            })
            .eq("id", application.id)
            .eq("student_id", studentId)
            .eq("student_type", studentType);

          throw universityUpdateError;
        }

        universityRecord = updatedUniversity;
      } else {
        const universityPayload = {
          student_id: studentId,
          student_type: studentType,
          university: universityName,
          country: applicationCountryName(application) || "Italy",
          program: applicationProgramName(application) || null,
          degree_level: applicationDegreeLevel(application) || null,
          intake: applicationIntakeName(application) || null,
          category: "target",
          status: universityStatusFromApplication(application),
          scholarship_status: "not_checked",
          dsu_eligible: false,
          risk_level: "low",
          next_action: universityNextActionFromApplication(application),
          counselor_recommendation:
            "Application OS record detected. Complete university fit, cost, deadline, scholarship and requirement review.",
          updated_at: new Date().toISOString(),
        };

        const { data: createdRow, error: universityCreateError } =
          await withTimeout(
            supabase
              .from("student_universities")
              .insert(universityPayload)
              .select()
              .single(),
            "University reconciliation creation timed out."
          );

        if (universityCreateError) throw universityCreateError;

        universityRecord = createdRow;
        createdUniversity = true;

        const { data: linkedRow, error: applicationLinkError } =
          await withTimeout(
            supabase
              .from("student_applications")
              .update({
                source_university_id: createdRow.id,
                source_university_name: createdRow.university,
                updated_at: new Date().toISOString(),
              })
              .eq("id", application.id)
              .eq("student_id", studentId)
              .eq("student_type", studentType)
              .select()
              .single(),
            "Application reconciliation link timed out."
          );

        if (applicationLinkError) {
          await supabase
            .from("student_universities")
            .delete()
            .eq("id", createdRow.id)
            .eq("student_id", studentId)
            .eq("student_type", studentType);

          throw applicationLinkError;
        }

        linkedApplication = linkedRow;
      }

      const nextForm = normalizeUniversity(universityRecord);

      safeSet(() => {
        setApplications((previous) =>
          previous.map((item) =>
            String(item.id) === String(linkedApplication.id)
              ? linkedApplication
              : item
          )
        );

        setUniversities((previous) => {
          const exists = previous.some(
            (item) => String(item.id) === String(universityRecord.id)
          );

          if (!exists) return [universityRecord, ...previous];

          return previous.map((item) =>
            String(item.id) === String(universityRecord.id)
              ? universityRecord
              : item
          );
        });

        setActiveId(universityRecord.id);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setShowArchived(false);
        setShowEditor(false);
        setSuccessMessage(
          createdUniversity
            ? `${universityRecord.university} was created in University OS and linked to its existing application.`
            : `${universityRecord.university} was linked to the existing shortlist option.`
        );
      });

      if (createdUniversity) {
        await seedDefaultRequirements(universityRecord);
      } else {
        void loadSupportData(universityRecord.id);
      }

      const [eventResult, timelineResult, syncResult] = await Promise.all([
        createUniversityEvent({
          studentUniversityId: universityRecord.id,
          applicationId: linkedApplication.id,
          eventType: createdUniversity
            ? "application_reconciled_to_new_university"
            : "application_linked_to_existing_university",
          eventLabel: createdUniversity
            ? "University created from application"
            : "Application linked to university",
          newValue: universityRecord.university,
          metadata: {
            application_status:
              linkedApplication.application_status ||
              linkedApplication.status ||
              null,
            reconciliation_source: "UniversityManagementPanel",
          },
        }),
        createTimelineEvent({
          applicationId: linkedApplication.id,
          eventType: "university_application_reconciled",
          title: "University Planning Linked To Application",
          description: `${universityRecord.university} is now connected across University OS and Application OS.`,
          oldValue: previousApplicationLink.source_university_id || "unlinked",
          newValue: universityRecord.id,
        }),
        notifyParent({
          source: "university_application_reconciliation",
          university: universityRecord,
          application: linkedApplication,
        }),
      ]);

      if (!eventResult?.ok || !timelineResult?.ok || !syncResult?.ok) {
        safeSet(() =>
          setAuditWarning(
            "University and application were linked, but one or more background audit/sync steps did not confirm."
          )
        );
      }
    } catch (reconciliationError) {
      const message = String(reconciliationError?.message || "");

      safeSet(() =>
        setError(
          message.includes("uq_student_universities_active_option") ||
            message.toLowerCase().includes("duplicate")
            ? "A matching university option already exists. Refresh the workspace and use Link Existing instead of creating another row."
            : message || "University/application reconciliation failed."
        )
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const createOrOpenApplication = async (university) => {
    if (!university?.id || !hasValidStudentId) return;

    const operationKey = `application-${university.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const existing = exactLinkedApplication(university);

      if (existing?.id) {
        safeSet(() =>
          setSuccessMessage(
            `${university.university} already has an Application OS record. Open Applications to continue.`
          )
        );

        void notifyParent({
          source: "university_open_application",
          application: existing,
        });

        if (typeof onOpenApplication === "function") {
          onOpenApplication(existing);
        }

        return;
      }

      const payload = {
        student_id: studentId,
        student_type: studentType,
        country: university.country || "Italy",
        university: university.university,
        program: university.program || "",
        intake: university.intake || "",
        source_university_id: university.id,
        source_university_name: university.university,
        application_status: "not_started",
        offer_status: "pending",
        visa_status: "not_started",
        updated_at: new Date().toISOString(),
      };

      const { data, error: applicationError } = await withTimeout(
        supabase
          .from("student_applications")
          .insert(payload)
          .select()
          .single(),
        "Application creation timed out."
      );

      if (applicationError) throw applicationError;

      safeSet(() => {
        setApplications((previous) => [data, ...previous]);
        setUniversities((previous) =>
          previous.map((item) =>
            item.id === university.id
              ? { ...item, status: "application_ready" }
              : item
          )
        );
        setForm((previous) => ({ ...previous, status: "application_ready" }));
        setSuccessMessage(
          `${university.university} Application OS record created.`
        );
      });

      const { data: linkedUniversity, error: universityLinkError } =
        await withTimeout(
          supabase
            .from("student_universities")
            .update({
              status: "application_ready",
              updated_at: new Date().toISOString(),
            })
            .eq("id", university.id)
            .eq("student_id", studentId)
            .eq("student_type", studentType)
            .select()
            .single(),
          "University application-link update timed out."
        );

      if (universityLinkError) {
        await supabase
          .from("student_applications")
          .delete()
          .eq("id", data.id)
          .eq("student_id", studentId)
          .eq("student_type", studentType);

        throw new Error(
          `Application record was rolled back because the university link could not be confirmed: ${universityLinkError.message}`
        );
      }

      safeSet(() => {
        setUniversities((previous) =>
          previous.map((item) =>
            String(item.id) === String(linkedUniversity.id)
              ? linkedUniversity
              : item
          )
        );

        if (String(activeId) === String(linkedUniversity.id)) {
          const nextForm = normalizeUniversity(linkedUniversity);
          setForm(nextForm);
          setSavedSnapshot(nextForm);
        }
      });

      void createUniversityEvent({
        studentUniversityId: university.id,
        applicationId: data.id,
        eventType: "application_created_from_university",
        eventLabel: "Application created",
        newValue: data.id,
      });

      void createTimelineEvent({
        applicationId: data.id,
        eventType: "application_started_from_university",
        title: "Application Created From University Planning",
        description: `${university.university} moved into its own Application OS record.`,
        oldValue: university.status,
        newValue: "application_ready",
      });

      void notifyParent({
        source: "university_create_application",
        application: data,
      });
    } catch (applicationError) {
      safeSet(() =>
        setError(applicationError.message || "Application creation failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const unlinkApplication = async (university) => {
    if (!university?.id || !hasValidStudentId) return;

    const linkedApplication = exactLinkedApplication(university);

    if (!linkedApplication?.id) {
      setError("No linked Application OS record was found for this university.");
      return;
    }

    const confirmed = window.confirm(
      `Unlink the Application OS record from "${university.university}"?\n\nThe application itself will NOT be deleted. Its notes, requirements, history and all other data will remain available inside Applications. Only this university-shortlist connection will be removed.`
    );

    if (!confirmed) return;

    const operationKey = `unlink-application-${linkedApplication.id}`;
    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    try {
      const { data: updatedApplication, error: applicationError } =
        await withTimeout(
          supabase
            .from("student_applications")
            .update({
              source_university_id: null,
              source_university_name: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", linkedApplication.id)
            .eq("student_id", studentId)
            .eq("student_type", studentType)
            .select()
            .single(),
          "Application unlink timed out."
        );

      if (applicationError) throw applicationError;

      const nextUniversityStatus =
        university.status === "application_ready"
          ? "shortlisted"
          : university.status;

      const { data: updatedUniversity, error: universityError } =
        await withTimeout(
          supabase
            .from("student_universities")
            .update({
              status: nextUniversityStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", university.id)
            .eq("student_id", studentId)
            .eq("student_type", studentType)
            .select()
            .single(),
          "University unlink update timed out."
        );

      if (universityError) throw universityError;

      safeSet(() => {
        setApplications((previous) =>
          previous.map((item) =>
            item.id === updatedApplication.id ? updatedApplication : item
          )
        );

        setUniversities((previous) =>
          previous.map((item) =>
            item.id === updatedUniversity.id ? updatedUniversity : item
          )
        );

        if (String(activeId) === String(updatedUniversity.id)) {
          const nextForm = normalizeUniversity(updatedUniversity);
          setForm(nextForm);
          setSavedSnapshot(nextForm);
        }

        setSuccessMessage(
          "Application unlinked safely. The Application OS record and all of its data were preserved."
        );
      });

      void createUniversityEvent({
        studentUniversityId: university.id,
        applicationId: linkedApplication.id,
        eventType: "application_unlinked_from_university",
        eventLabel: "Application unlinked",
        oldValue: linkedApplication.id,
        newValue: "",
        metadata: {
          application_university: linkedApplication.university || null,
          application_program: linkedApplication.program || null,
        },
      });

      void createTimelineEvent({
        applicationId: linkedApplication.id,
        eventType: "application_unlinked_from_university",
        title: "Application Unlinked From University Planning",
        description: `${university.university} was disconnected from this Application OS record. The application itself was preserved.`,
        oldValue: university.id,
        newValue: "unlinked",
      });

      void notifyParent({
        source: "university_unlink_application",
        university: updatedUniversity,
        application: updatedApplication,
      });
    } catch (unlinkError) {
      safeSet(() =>
        setError(unlinkError.message || "Application unlink failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const updateQuickField = async (university, updates, eventType) => {
    if (!university?.id) return;

    const operationKey = `update-${university.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: updateError } = await withTimeout(
        supabase
          .from("student_universities")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", university.id)
          .select()
          .single(),
        "University update timed out."
      );

      if (updateError) throw updateError;

      safeSet(() => {
        setUniversities((previous) =>
          previous.map((item) => (item.id === data.id ? data : item))
        );

        if (String(activeId) === String(data.id)) {
          const nextForm = normalizeUniversity(data);
          setForm(nextForm);
          setSavedSnapshot(nextForm);
        }

        setSuccessMessage("University option updated.");
      });

      void createUniversityEvent({
        studentUniversityId: university.id,
        applicationId: exactLinkedApplication(university)?.id || null,
        eventType,
        eventLabel: pretty(eventType),
        oldValue: eventType.includes("category")
          ? university.category
          : university.status,
        newValue: eventType.includes("category")
          ? updates.category
          : updates.status,
      });

      void notifyParent({
        source: "university_quick_update",
        university: data,
      });
    } catch (updateError) {
      safeSet(() =>
        setError(updateError.message || "University update failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const archiveUniversity = async (university) => {
    if (!university?.id) return;

    const confirmed = window.confirm(
      `Archive "${university.university}" from the active shortlist?`
    );
    if (!confirmed) return;

    await updateQuickField(
      university,
      {
        is_archived: true,
        archived_at: new Date().toISOString(),
      },
      "university_archived"
    );

    setShowArchived(true);
  };

  const restoreUniversity = async (university) => {
    if (!university?.id) return;

    await updateQuickField(
      university,
      {
        is_archived: false,
        archived_at: null,
      },
      "university_restored"
    );

    setShowArchived(false);
  };

  const permanentlyDeleteUniversity = async (university) => {
    if (!university?.id || !university.is_archived) return;

    const linkedApplication = exactLinkedApplication(university);

    if (linkedApplication?.id) {
      setError(
        "This archived university still has a linked Application OS record. Keep it archived for history, or remove/archive the application through Applications first."
      );
      return;
    }

    const confirmed = window.confirm(
      `PERMANENTLY delete "${university.university}"?\n\nThis is intended only for accidental/test shortlist options. This cannot be undone.`
    );

    if (!confirmed) return;

    const operationKey = `delete-${university.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const { error: deleteError } = await withTimeout(
        supabase
          .from("student_universities")
          .delete()
          .eq("id", university.id),
        "Permanent university deletion timed out."
      );

      if (deleteError) throw deleteError;

      const remaining = universities.filter((item) => item.id !== university.id);
      const next = remaining.find((item) => !item.is_archived) || remaining[0] || null;
      const nextForm = next
        ? normalizeUniversity(next)
        : {
            ...EMPTY_FORM,
            country: preferredCountry || "Italy",
            program: preferredProgram || "",
          };

      safeSet(() => {
        setUniversities(remaining);
        setActiveId(next?.id || null);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setRequirements([]);
        setEvents([]);
        setShowArchived(false);
        setSuccessMessage("Archived university permanently deleted.");
      });

      void createUniversityEvent({
        studentUniversityId: null,
        eventType: "university_permanently_deleted",
        eventLabel: "University permanently deleted",
        newValue: university.university,
        metadata: {
          deleted_university_id: university.id,
          program: university.program || null,
        },
      });

      void notifyParent({
        source: "university_delete",
        universityId: university.id,
      });
    } catch (deleteError) {
      safeSet(() =>
        setError(deleteError.message || "Permanent deletion failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const addRequirement = async () => {
    if (!activeUniversity?.id || !requirementDraft.requirement_name.trim()) {
      return;
    }

    const operationKey = "add-requirement";
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_university_requirements")
          .insert({
            student_university_id: activeUniversity.id,
            requirement_name: requirementDraft.requirement_name.trim(),
            requirement_category:
              requirementDraft.requirement_category || "general",
            requirement_type: "manual",
            required: true,
            status: requirementDraft.status || "missing",
            target_value: requirementDraft.target_value || null,
            current_value: requirementDraft.current_value || null,
            due_date: requirementDraft.due_date || null,
            notes: requirementDraft.notes || null,
          })
          .select()
          .single(),
        "Requirement creation timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) => [...previous, data]);
        setRequirementDraft({
          requirement_name: "",
          requirement_category: "general",
          target_value: "",
          current_value: "",
          status: "missing",
          due_date: "",
          notes: "",
        });
        setShowRequirementModal(false);
        setSuccessMessage("University requirement added.");
      });

      void createUniversityEvent({
        studentUniversityId: activeUniversity.id,
        eventType: "university_requirement_added",
        eventLabel: "Requirement added",
        newValue: data.requirement_name,
      });
    } catch (requirementError) {
      safeSet(() =>
        setError(requirementError.message || "Requirement creation failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const updateRequirementStatus = async (requirement, status) => {
    if (!requirement?.id) return;

    const operationKey = `requirement-${requirement.id}`;
    startSaving(operationKey);

    try {
      const { data, error: updateError } = await withTimeout(
        supabase
          .from("student_university_requirements")
          .update({
            status,
            completed_at:
              status === "verified" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requirement.id)
          .eq("student_university_id", activeUniversity?.id)
          .select()
          .single(),
        "Requirement update timed out."
      );

      if (updateError) throw updateError;

      safeSet(() => {
        setRequirements((previous) =>
          previous.map((item) => (item.id === data.id ? data : item))
        );
      });

      void createUniversityEvent({
        studentUniversityId: activeUniversity?.id,
        eventType: "university_requirement_status_changed",
        eventLabel: "Requirement status changed",
        oldValue: requirement.status,
        newValue: status,
        metadata: {
          requirement_name: requirement.requirement_name,
        },
      });
    } catch (updateError) {
      safeSet(() =>
        setError(updateError.message || "Requirement update failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const grouped = useMemo(() => {
    const visible = universities.filter((item) =>
      showArchived ? item.is_archived : !item.is_archived
    );

    const query = normalize(search);

    const filtered = query
      ? visible.filter((item) =>
          normalize(
            [
              item.university,
              item.country,
              item.program,
              item.intake,
              item.category,
              item.status,
            ].join(" ")
          ).includes(query)
        )
      : visible;

    return CATEGORY_OPTIONS.reduce((accumulator, category) => {
      accumulator[category.id] = filtered.filter(
        (item) => (item.category || "target") === category.id
      );
      return accumulator;
    }, {});
  }, [universities, showArchived, search]);

  const visibleUniversities = useMemo(
    () => Object.values(grouped).flat(),
    [grouped]
  );

  const stats = useMemo(() => {
    const active = universities.filter((item) => !item.is_archived);

    return {
      total: active.length,
      dream: active.filter((item) => item.category === "dream").length,
      target: active.filter(
        (item) => !item.category || item.category === "target"
      ).length,
      safe: active.filter((item) => item.category === "safe").length,
      linked: active.filter((item) => exactLinkedApplication(item)).length,
      offers: active.filter((item) =>
        ["offer_received", "accepted", "enrolled"].includes(item.status)
      ).length,
      urgent: active.filter((item) => {
        const meta = deadlineMeta(item.deadline_date);
        return meta?.tone === "red" || meta?.tone === "orange";
      }).length,
      archived: universities.filter((item) => item.is_archived).length,
    };
  }, [universities, applications]);

  const portfolioIntelligence = useMemo(() => {
    const active = universities.filter((item) => !item.is_archived);
    const now = Date.now();

    const missingNextAction = active.filter(
      (item) =>
        !["rejected", "enrolled"].includes(normalize(item.status)) &&
        !String(item.next_action || "").trim()
    ).length;

    const overdueNextActions = active.filter((item) => {
      if (!item.next_action_due) return false;
      const due = new Date(`${item.next_action_due}T23:59:59`).getTime();
      return Number.isFinite(due) && due < now;
    }).length;

    const noDeadline = active.filter(
      (item) =>
        !item.deadline_date &&
        !["offer_received", "accepted", "rejected", "enrolled"].includes(
          normalize(item.status)
        )
    ).length;

    const noCost = active.filter(
      (item) =>
        item.tuition_amount === null ||
        item.tuition_amount === undefined ||
        item.tuition_amount === ""
    ).length;

    const noScholarshipCheck = active.filter((item) =>
      ["", "not checked", "not_checked"].includes(
        normalize(item.scholarship_status)
      )
    ).length;

    const weakFit = active.filter(
      (item) => Number(item.fit_score || 0) > 0 && Number(item.fit_score) < 45
    ).length;

    const balance = {
      dream: active.filter((item) => item.category === "dream").length,
      target: active.filter(
        (item) => !item.category || item.category === "target"
      ).length,
      safe: active.filter((item) => item.category === "safe").length,
    };

    const balanceWarnings = [];
    if (active.length >= 2 && balance.safe === 0) {
      balanceWarnings.push("No safe option");
    }
    if (active.length >= 3 && balance.target === 0) {
      balanceWarnings.push("No target option");
    }
    if (active.length >= 4 && balance.dream > Math.ceil(active.length / 2)) {
      balanceWarnings.push("Dream-heavy shortlist");
    }

    return {
      missingNextAction,
      overdueNextActions,
      noDeadline,
      noCost,
      noScholarshipCheck,
      weakFit,
      balance,
      balanceWarnings,
    };
  }, [universities]);

  const comparisonItems = useMemo(
    () =>
      comparisonIds
        .map((id) => universities.find((item) => String(item.id) === String(id)))
        .filter(Boolean),
    [comparisonIds, universities]
  );

  const toggleComparison = (universityId) => {
    setComparisonIds((previous) => {
      const exists = previous.includes(universityId);

      if (exists) {
        return previous.filter((id) => id !== universityId);
      }

      if (previous.length >= 4) {
        setError("Compare up to four universities at a time.");
        return previous;
      }

      return [...previous, universityId];
    });
  };

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(17rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                University Planning OS
              </span>
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                Italy First
              </span>
            </div>

            <h2 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              University Strategy Center
            </h2>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Build a practical Dream / Target / Safe shortlist, verify eligibility,
              compare cost and deadlines, then create one independent Application OS
              record per university.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">University Strategy Actions</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">Add a university option or refresh the live shortlist before changing strategy, requirements, applications, or archive state.</p>
            <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={beginNewUniversity}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-[#123865] px-3.5 py-2.5 text-xs font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-[#0d2b50] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 active:translate-y-0"
            >
              <Plus size={15} />
              Add University
            </button>

            <button
              type="button"
              onClick={() => loadCoreData({ force: true })}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-3.5 py-2.5 text-xs font-black text-[#123865] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-2 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Metric label="Active" value={stats.total} icon={University} />
          <Metric label="Dream" value={stats.dream} icon={Sparkles} tone="orange" />
          <Metric label="Target" value={stats.target} icon={Scale} tone="blue" />
          <Metric label="Safe" value={stats.safe} icon={ShieldAlert} tone="green" />
          <Metric label="Applications" value={stats.linked} icon={FileCheck2} tone="blue" />
          <Metric label="Offers" value={stats.offers} icon={BadgeCheck} tone="green" />
          <Metric label="Urgent" value={stats.urgent} icon={AlertTriangle} tone={stats.urgent ? "red" : "slate"} />
          <Metric label="Archived" value={stats.archived} icon={Archive} />
        </div>
      </section>

      {error ? (
        <Feedback tone="red" onClose={() => setError("")}>
          {error}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="green" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Feedback>
      ) : null}

      {auditWarning ? (
        <Feedback tone="orange" onClose={() => setAuditWarning("")}>
          {auditWarning}
        </Feedback>
      ) : null}

      <ApplicationReconciliationCenter
        items={applicationReconciliationItems}
        savingKeys={savingKeys}
        onReconcile={reconcileApplicationUniversity}
        onRefresh={() => loadCoreData({ force: true })}
        loading={loading}
      />

      <section className="min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
              Portfolio Intelligence
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233F]">
              Shortlist Pressure Check
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Deterministic checks for shortlist balance, deadlines, affordability,
              scholarship review and next-action discipline.
            </p>
          </div>

          {lastSyncedAt ? (
            <span className="rounded-full border border-[#C9D7E6] bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase text-slate-700">
              Synced{" "}
              {lastSyncedAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <PressureTile
            label="Overdue Actions"
            value={portfolioIntelligence.overdueNextActions}
            helper="Next-action dates already passed"
            tone={portfolioIntelligence.overdueNextActions ? "red" : "green"}
          />
          <PressureTile
            label="No Next Action"
            value={portfolioIntelligence.missingNextAction}
            helper="Active options without a clear next move"
            tone={portfolioIntelligence.missingNextAction ? "orange" : "green"}
          />
          <PressureTile
            label="No Deadline"
            value={portfolioIntelligence.noDeadline}
            helper="Open options missing deadline data"
            tone={portfolioIntelligence.noDeadline ? "orange" : "green"}
          />
          <PressureTile
            label="No Tuition"
            value={portfolioIntelligence.noCost}
            helper="Affordability not yet quantified"
            tone={portfolioIntelligence.noCost ? "orange" : "green"}
          />
          <PressureTile
            label="Scholarship Unchecked"
            value={portfolioIntelligence.noScholarshipCheck}
            helper="Funding review still pending"
            tone={portfolioIntelligence.noScholarshipCheck ? "orange" : "green"}
          />
          <PressureTile
            label="Weak Fit"
            value={portfolioIntelligence.weakFit}
            helper="Recorded fit score below 45%"
            tone={portfolioIntelligence.weakFit ? "red" : "green"}
          />
          <PressureTile
            label="Portfolio Balance"
            value={
              portfolioIntelligence.balanceWarnings.length
                ? portfolioIntelligence.balanceWarnings.join(" · ")
                : "Balanced"
            }
            helper={`D ${portfolioIntelligence.balance.dream} · T ${portfolioIntelligence.balance.target} · S ${portfolioIntelligence.balance.safe}`}
            tone={
              portfolioIntelligence.balanceWarnings.length ? "orange" : "green"
            }
          />
        </div>
      </section>

      <section className="min-w-0 rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find university, program, intake or status..."
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                !showArchived
                  ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
                  : "border-[#C9D7E6] bg-white text-slate-700"
              }`}
            >
              Active
            </button>

            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                showArchived
                  ? "border-[#123865] bg-[#123865]"
                  : "border-[#C9D7E6] bg-white text-slate-700"
              }`}
              style={{ color: showArchived ? "#ffffff" : undefined }}
            >
              Archived
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 grid-cols-2 gap-2 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-2 shadow-[0_8px_22px_rgba(18,56,101,0.04)] sm:grid-cols-4">
        {[
          ["shortlist", "Shortlist"],
          ["details", activeUniversity ? "University Workspace" : "New University"],
          ["compare", `Compare (${comparisonIds.length})`],
          ["history", `History (${events.length})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`rounded-xl border-2 px-3 py-2.5 text-xs font-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
              activeTab === value
                ? "border-[#123865] bg-[#123865]"
                : "border-[#C9D7E6] bg-white text-slate-700"
            }`}
            style={{ color: activeTab === value ? "#ffffff" : undefined }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "shortlist" ? (
        <ShortlistView
          grouped={grouped}
          applications={applications}
          comparisonIds={comparisonIds}
          savingKeys={savingKeys}
          showArchived={showArchived}
          onSelect={selectUniversity}
          onCompare={toggleComparison}
          onCategoryChange={(university, category) =>
            updateQuickField(
              university,
              { category },
              "university_category_changed"
            )
          }
          onStatusChange={(university, status) =>
            updateQuickField(university, { status }, "university_status_changed")
          }
          onCreateApplication={createOrOpenApplication}
          onUnlinkApplication={unlinkApplication}
          onArchive={archiveUniversity}
          onRestore={restoreUniversity}
          onDelete={permanentlyDeleteUniversity}
        />
      ) : null}

      {activeTab === "details" ? (
        <UniversityWorkspace
          form={form}
          setForm={setForm}
          activeUniversity={activeUniversity}
          activeApplication={
            activeUniversity ? exactLinkedApplication(activeUniversity) : null
          }
          calculatedIntelligence={calculatedIntelligence}
          requirements={requirements}
          requirementStats={requirementStats}
          supportLoading={supportLoading}
          savingKeys={savingKeys}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={saveUniversity}
          onNew={beginNewUniversity}
          onCreateApplication={() =>
            activeUniversity && createOrOpenApplication(activeUniversity)
          }
          onUnlinkApplication={() =>
            activeUniversity && unlinkApplication(activeUniversity)
          }
          onAddRequirement={() => setShowRequirementModal(true)}
          onOpenRequirementLibrary={() => setShowRequirementLibrary(true)}
          onLoadRecommended={loadRecommendedRequirements}
          recommendedMissingCount={missingRecommendedRequirementTemplates.length}
          requirementLibraryTotal={requirementLibraryStats.total}
          groupedRequirementSections={groupedRequirementSections}
          expandedRequirementGroups={expandedRequirementGroups}
          onToggleRequirementGroup={toggleRequirementGroup}
          onExpandAllRequirementGroups={expandAllRequirementGroups}
          onCollapseAllRequirementGroups={collapseAllRequirementGroups}
          onRequirementStatus={updateRequirementStatus}
          onArchive={() => activeUniversity && archiveUniversity(activeUniversity)}
          onRestore={() => activeUniversity && restoreUniversity(activeUniversity)}
          onDelete={() =>
            activeUniversity && permanentlyDeleteUniversity(activeUniversity)
          }
        />
      ) : null}

      {activeTab === "compare" ? (
        <ComparisonView
          items={comparisonItems}
          onRemove={toggleComparison}
          onSelect={(item) => {
            selectUniversity(item);
            setActiveTab("details");
          }}
        />
      ) : null}

      {activeTab === "history" ? (
        <HistoryView
          events={events}
          loading={supportLoading}
          activeUniversity={activeUniversity}
          onRefresh={() =>
            activeUniversity?.id && loadSupportData(activeUniversity.id)
          }
        />
      ) : null}

      <ProgramTracker student={student} />

      {showRequirementModal ? (
        <RequirementModal
          draft={requirementDraft}
          setDraft={setRequirementDraft}
          onClose={() => setShowRequirementModal(false)}
          onSave={addRequirement}
          disabled={
            !requirementDraft.requirement_name.trim() ||
            savingKeys.has("add-requirement")
          }
        />
      ) : null}

      {showRequirementLibrary ? (
        <RequirementLibraryModal
          requirements={filteredRequirementLibrary}
          existingNameSet={existingRequirementNameSet}
          query={requirementLibraryQuery}
          setQuery={setRequirementLibraryQuery}
          category={requirementLibraryCategory}
          setCategory={setRequirementLibraryCategory}
          total={requirementLibraryStats.total}
          recommendedIds={new Set(recommendedRequirementTemplates.map((item) => item.id))}
          savingKeys={savingKeys}
          onAdd={addLibraryRequirement}
          onAddVisible={addVisibleLibraryRequirements}
          onClose={() => setShowRequirementLibrary(false)}
        />
      ) : null}
    </div>
  );
}

function ApplicationReconciliationCenter({
  items = [],
  savingKeys,
  onReconcile,
  onRefresh,
  loading = false,
}) {
  if (!items.length) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.09)]">
      <div className="flex min-w-0 flex-col gap-4 border-b-[3px] border-[#123865] bg-[#123865] p-5 text-white lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-300/50 bg-orange-400/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Application Reconciliation
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              {items.length} unlinked
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black text-white sm:text-2xl">
            Application OS has university data missing from the shortlist
          </h3>

          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
            These are real application records. Create or connect the matching
            University OS row so Admin, Student and Counselor read one permanent
            university source of truth.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 py-2.5 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Recheck Records
        </button>
      </div>

      <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 lg:grid-cols-2">
        {items.map(({ application, matchingUniversity }) => {
          const operationKey = `reconcile-application-${application.id}`;
          const busy = savingKeys?.has(operationKey);
          const universityName = applicationUniversityName(application);
          const program = applicationProgramName(application);
          const intake = applicationIntakeName(application);
          const status =
            application.application_status ||
            application.status ||
            "not_started";

          return (
            <article
              key={application.id}
              className="min-w-0 rounded-[1.35rem] border-2 border-orange-300 bg-white p-4 shadow-[0_9px_24px_rgba(16,35,63,0.07)]"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
                    Application #{application.id}
                  </p>
                  <h4 className="mt-1 break-words text-lg font-black text-[#10233F]">
                    {universityName}
                  </h4>
                  <p className="mt-1 break-words text-xs font-semibold text-slate-600">
                    {program || "Programme not recorded"}
                    {intake ? ` · ${intake}` : ""}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-[#AFC0D0] bg-[#F1F6FA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#123865]">
                  {pretty(status)}
                </span>
              </div>

              <div
                className={`mt-4 rounded-xl border-2 p-3 ${
                  matchingUniversity
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <p
                  className={`text-[9px] font-black uppercase tracking-[0.14em] ${
                    matchingUniversity ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {matchingUniversity
                    ? "Existing shortlist match found"
                    : "University row missing"}
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#10233F]">
                  {matchingUniversity
                    ? `${matchingUniversity.university} will be linked without creating a duplicate.`
                    : "A permanent University OS row will be created from this application and linked back safely."}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onReconcile({ application, matchingUniversity })
                }
                disabled={busy}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : matchingUniversity ? (
                  <FileCheck2 size={15} />
                ) : (
                  <Plus size={15} />
                )}
                {busy
                  ? "Reconciling..."
                  : matchingUniversity
                    ? "Link Existing University"
                    : "Create & Link University"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShortlistView({
  grouped,
  applications,
  comparisonIds,
  savingKeys,
  showArchived,
  onSelect,
  onCompare,
  onCategoryChange,
  onStatusChange,
  onCreateApplication,
  onUnlinkApplication,
  onArchive,
  onRestore,
  onDelete,
}) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-3">
      {CATEGORY_OPTIONS.map((category) => (
        <section
          key={category.id}
          className="min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_12px_34px_rgba(18,56,101,0.06)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#10233F]">
                {category.label}
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {category.description}
              </p>
            </div>

            <span className="rounded-full border border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-xs font-black text-orange-700">
              {(grouped[category.id] || []).length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(grouped[category.id] || []).length ? (
              grouped[category.id].map((university) => {
                const linkedApplication =
                  applications.find(
                    (application) =>
                      application.source_university_id &&
                      String(application.source_university_id) ===
                        String(university.id)
                  ) || null;

                return (
                  <UniversityCard
                    key={university.id}
                    university={university}
                    linkedApplication={linkedApplication}
                    selectedForCompare={comparisonIds.includes(university.id)}
                    busy={
                      savingKeys.has(`update-${university.id}`) ||
                      savingKeys.has(`application-${university.id}`) ||
                      savingKeys.has(`delete-${university.id}`) ||
                      Boolean(
                        linkedApplication?.id &&
                          savingKeys.has(
                            `unlink-application-${linkedApplication.id}`
                          )
                      )
                    }
                    showArchived={showArchived}
                    onSelect={() => onSelect(university)}
                    onCompare={() => onCompare(university.id)}
                    onCategoryChange={(categoryValue) =>
                      onCategoryChange(university, categoryValue)
                    }
                    onStatusChange={(statusValue) =>
                      onStatusChange(university, statusValue)
                    }
                    onCreateApplication={() => onCreateApplication(university)}
                    onUnlinkApplication={() =>
                      onUnlinkApplication(university)
                    }
                    onArchive={() => onArchive(university)}
                    onRestore={() => onRestore(university)}
                    onDelete={() => onDelete(university)}
                  />
                );
              })
            ) : (
              <div className="rounded-[1.3rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-5 text-center">
                <University size={24} className="mx-auto text-orange-300" />
                <p className="mt-2 text-xs font-black text-slate-600">
                  No {category.label.toLowerCase()} options
                </p>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function UniversityCard({
  university,
  linkedApplication,
  selectedForCompare,
  busy,
  showArchived,
  onSelect,
  onCompare,
  onCategoryChange,
  onStatusChange,
  onCreateApplication,
  onUnlinkApplication,
  onArchive,
  onRestore,
  onDelete,
}) {
  const deadline = deadlineMeta(university.deadline_date);

  return (
    <article className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:border-[#FF5A0A] hover:shadow-md">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] text-orange-700">
            <GraduationCap size={17} />
          </span>

          <div className="min-w-0">
            <p className="break-words font-black text-[#10233F]">
              {university.university}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-600">
              {university.program || "Program not set"} ·{" "}
              {university.intake || "Intake not set"}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge value={university.status} />
              <RiskBadge value={university.risk_level || "low"} label="Manual" />
              {linkedApplication ? (
                <span className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[8px] font-black uppercase text-blue-800">
                  Application Linked
                </span>
              ) : null}
              {deadline ? <DeadlineBadge meta={deadline} /> : null}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onCompare}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            selectedForCompare
              ? "border-[#123865] bg-[#123865]"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
          style={{ color: selectedForCompare ? "#ffffff" : undefined }}
          title="Add/remove from comparison"
        >
          {selectedForCompare ? <Check size={15} /> : <Columns3 size={15} />}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <CompactInfo
          label="Fit"
          value={
            university.fit_score !== null && university.fit_score !== undefined
              ? `${university.fit_score}%`
              : "Not scored"
          }
        />
        <CompactInfo
          label="Tuition"
          value={formatMoney(
            university.tuition_amount,
            university.tuition_currency
          )}
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          value={university.category || "target"}
          onChange={(event) => onCategoryChange(event.target.value)}
          disabled={busy}
          className="h-10 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2 text-xs font-black capitalize text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={university.status || "shortlisted"}
          onChange={(event) => onStatusChange(event.target.value)}
          disabled={busy}
          className="h-10 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2 text-xs font-black capitalize text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {pretty(option)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="min-h-10 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-2 text-xs font-black text-orange-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0"
        >
          Open Workspace
        </button>

        {!showArchived ? (
          <>
            {linkedApplication ? (
              <>
                <button
                  type="button"
                  onClick={onCreateApplication}
                  disabled={busy}
                  className="min-h-10 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-xs font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#0d2b50] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 disabled:opacity-50"
                  style={{ color: "#ffffff" }}
                >
                  <span style={{ color: "#ffffff" }}>Open Application</span>
                </button>

                <button
                  type="button"
                  onClick={onUnlinkApplication}
                  disabled={busy}
                  title="Remove only the shortlist-to-application connection. The application and all of its data will remain."
                  className="rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-black text-red-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-100 hover:shadow-md active:translate-y-0 disabled:opacity-50"
                >
                  Unlink
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onCreateApplication}
                disabled={busy}
                className="min-h-10 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-3 py-2 text-xs font-black text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 disabled:opacity-50"
              >
                Create Application
              </button>
            )}

            <button
              type="button"
              onClick={onArchive}
              disabled={busy}
              className="rounded-xl border-2 border-slate-400 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-200 hover:shadow-md active:translate-y-0 disabled:opacity-50"
            >
              Archive
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onRestore}
              disabled={busy}
              className="rounded-xl border-2 border-blue-300 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
            >
              Restore
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={busy || Boolean(linkedApplication)}
              title={
                linkedApplication
                  ? "Remove/archive the linked Application OS record first."
                  : "Permanently delete this archived shortlist option."
              }
              className="rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-xs font-black text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Permanently
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function UniversityWorkspace({
  form,
  setForm,
  activeUniversity,
  activeApplication,
  calculatedIntelligence,
  requirements,
  requirementStats,
  supportLoading,
  savingKeys,
  hasUnsavedChanges,
  onSave,
  onNew,
  onCreateApplication,
  onUnlinkApplication,
  onAddRequirement,
  onOpenRequirementLibrary,
  onLoadRecommended,
  recommendedMissingCount,
  requirementLibraryTotal,
  groupedRequirementSections,
  expandedRequirementGroups,
  onToggleRequirementGroup,
  onExpandAllRequirementGroups,
  onCollapseAllRequirementGroups,
  onRequirementStatus,
  onArchive,
  onRestore,
  onDelete,
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <CategoryBadge value={form.category} />
              <StatusBadge value={form.status} />
              <RiskBadge value={calculatedIntelligence.riskLevel} label="Calculated" />
              {activeUniversity?.is_archived ? (
                <span className="rounded-full border border-slate-400 bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-700">
                  Archived
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 text-2xl font-black text-[#10233F]">
              {form.university || "New University Option"}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {form.program || "Program not selected"} ·{" "}
              {form.country || "Italy"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                Unsaved changes
              </span>
            ) : null}

            <button
              type="button"
              onClick={onNew}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-2 text-xs font-black text-[#10233F]"
            >
              <Plus size={14} />
              New
            </button>

            {activeUniversity?.is_archived ? (
              <>
                <button
                  type="button"
                  onClick={onRestore}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  disabled={Boolean(activeApplication)}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-xs font-black text-red-800 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  Delete Permanently
                </button>
              </>
            ) : activeUniversity?.id ? (
              <button
                type="button"
                onClick={onArchive}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
              >
                <Archive size={14} />
                Archive
              </button>
            ) : null}

            <button
              type="button"
              onClick={onSave}
              disabled={
                !form.university.trim() ||
                savingKeys.has(
                  activeUniversity?.id
                    ? `save-${activeUniversity.id}`
                    : "create-university"
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-700 bg-[#FF5A0A] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {savingKeys.has(
                activeUniversity?.id
                  ? `save-${activeUniversity.id}`
                  : "create-university"
              ) ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {activeUniversity?.id ? "Save University" : "Add University"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <CompactStat
            label="Fit"
            value={`${calculatedIntelligence.fit}% · ${calculatedIntelligence.fitLevel}`}
            icon={Scale}
          />
          <CompactStat
            label="Readiness"
            value={`${calculatedIntelligence.readiness}%`}
            icon={BadgeCheck}
          />
          <CompactStat
            label="Calculated Risk"
            value={`${calculatedIntelligence.risk}/100 · ${calculatedIntelligence.riskLevel}`}
            icon={ShieldAlert}
            tone={
              calculatedIntelligence.risk >= 55
                ? "red"
                : calculatedIntelligence.risk >= 30
                ? "orange"
                : "slate"
            }
          />
          <CompactStat
            label="Application"
            value={activeApplication ? "Linked" : "Not created"}
            icon={FileCheck2}
          />
        </div>
      </section>

      <Section
        title="University & Program Identity"
        subtitle="The exact destination, program, degree and intake being considered."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="University">
            <input
              value={form.university}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  university: event.target.value,
                }))
              }
              placeholder="University of Bologna"
              className={inputClass}
            />
          </Field>

          <Field label="Country">
            <input
              value={form.country}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  country: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Program">
            <input
              value={form.program}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  program: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Degree level">
            <input
              value={form.degree_level}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  degree_level: event.target.value,
                }))
              }
              placeholder="Bachelor / Master"
              className={inputClass}
            />
          </Field>

          <Field label="Intake">
            <input
              value={form.intake}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  intake: event.target.value,
                }))
              }
              placeholder="September 2027"
              className={inputClass}
            />
          </Field>

          <DateField
            label="Application deadline"
            value={form.deadline_date}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                deadline_date: value,
              }))
            }
          />
        </div>
      </Section>

      <Section
        title="Strategy & Operational Status"
        subtitle="Control shortlist category, progress, risk and the next action."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Shortlist category"
            value={form.category}
            options={CATEGORY_OPTIONS.map((item) => item.id)}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, category: value }))
            }
          />

          <SelectField
            label="Planning status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, status: value }))
            }
          />

          <SelectField
            label="Manual risk level"
            value={form.risk_level}
            options={RISK_OPTIONS}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, risk_level: value }))
            }
          />

          <DateField
            label="Next action due"
            value={form.next_action_due}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                next_action_due: value,
              }))
            }
          />

          <Field label="Next action" className="md:col-span-2">
            <input
              value={form.next_action}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  next_action: event.target.value,
                }))
              }
              placeholder="Check eligibility, confirm intake, prepare application..."
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Cost & Affordability"
        subtitle="Application fee, tuition and estimated living cost for this option."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <MoneyCard
            title="Application Fee"
            amount={form.application_fee}
            currency={form.application_fee_currency}
            onAmountChange={(value) =>
              setForm((previous) => ({
                ...previous,
                application_fee: value,
              }))
            }
            onCurrencyChange={(value) =>
              setForm((previous) => ({
                ...previous,
                application_fee_currency: value,
              }))
            }
          />

          <MoneyCard
            title="Tuition"
            amount={form.tuition_amount}
            currency={form.tuition_currency}
            onAmountChange={(value) =>
              setForm((previous) => ({
                ...previous,
                tuition_amount: value,
              }))
            }
            onCurrencyChange={(value) =>
              setForm((previous) => ({
                ...previous,
                tuition_currency: value,
              }))
            }
          />

          <MoneyCard
            title="Estimated Living Cost"
            amount={form.living_cost_amount}
            currency={form.living_cost_currency}
            onAmountChange={(value) =>
              setForm((previous) => ({
                ...previous,
                living_cost_amount: value,
              }))
            }
            onCurrencyChange={(value) =>
              setForm((previous) => ({
                ...previous,
                living_cost_currency: value,
              }))
            }
          />
        </div>
      </Section>

      <Section
        title="Scholarship & DSU"
        subtitle="Track affordability opportunities without creating a separate DSU workflow."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Scholarship status"
            value={form.scholarship_status}
            options={SCHOLARSHIP_OPTIONS}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                scholarship_status: value,
              }))
            }
          />

          <Field label="Scholarship name">
            <input
              value={form.scholarship_name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  scholarship_name: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <ToggleCard
            label="Potentially DSU eligible"
            checked={Boolean(form.dsu_eligible)}
            onChange={(checked) =>
              setForm((previous) => ({
                ...previous,
                dsu_eligible: checked,
              }))
            }
          />

          <Field label="Scholarship amount">
            <input
              type="number"
              value={form.scholarship_amount}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  scholarship_amount: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Currency">
            <input
              value={form.scholarship_currency}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  scholarship_currency: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Eligibility Requirements"
        subtitle="Structured requirements for this university/program, not one large text field."
        action={
          activeUniversity?.id ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onLoadRecommended} disabled={!recommendedMissingCount} className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:cursor-default disabled:opacity-45">
                <Sparkles size={14} /> Recommended +{recommendedMissingCount || 0}
              </button>
              <button type="button" onClick={onOpenRequirementLibrary} className="inline-flex items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-xs font-black text-white">
                <Search size={14} /> Library {requirementLibraryTotal}
              </button>
              <button type="button" onClick={onAddRequirement} className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-600 bg-[#FF5A0A] px-3 py-2 text-xs font-black text-white">
                <Plus size={14} /> Custom
              </button>
            </div>
          ) : null
        }
      >
        {!activeUniversity?.id ? (
          <div className="rounded-2xl border-2 border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-5 text-center">
            <p className="text-sm font-black text-[#10233F]">
              Save the university first to manage requirements.
            </p>
          </div>
        ) : supportLoading ? (
          <div className="rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-5 text-center">
            <LoaderCircle size={22} className="mx-auto animate-spin text-orange-500" />
          </div>
        ) : requirements.length ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <RequirementSummaryTile label="Total Applied" value={requirementStats.total} helper={`from ${requirementLibraryTotal} master templates`} tone="navy" />
              <RequirementSummaryTile label="Verified" value={requirementStats.verified} helper="confirmed / not required" tone="green" />
              <RequirementSummaryTile label="Needs Attention" value={requirementStats.missing} helper="missing / rejected" tone="rose" />
              <RequirementSummaryTile label="In Review" value={requirementStats.review} helper="requested / received / review" tone="amber" />
            </div>
            <div className="flex flex-col gap-3 rounded-[1.3rem] border-2 border-[#D8B07B] bg-[#FFF4E8] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                  Requirement Navigator
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-[#5B6D80]">
                  Categories stay collapsed until you need them, so the 96-template system never becomes a wall of requirements.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onExpandAllRequirementGroups}
                  disabled={!groupedRequirementSections.length}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#0B2A4B] disabled:cursor-default disabled:opacity-45"
                >
                  <ChevronDown size={14} />
                  Expand All
                </button>

                <button
                  type="button"
                  onClick={onCollapseAllRequirementGroups}
                  disabled={!expandedRequirementGroups.size}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#AFC0D0] bg-[#FFFCF7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#123865] transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-default disabled:opacity-45"
                >
                  <ChevronRight size={14} />
                  Collapse All
                </button>
              </div>
            </div>

            {groupedRequirementSections.map((group) => {
              const total = group.requirements.length;
              const verified = group.requirements.filter((requirement) =>
                ["verified", "not_required"].includes(
                  normalize(requirement.status)
                )
              ).length;
              const attention = group.requirements.filter((requirement) =>
                ["missing", "rejected"].includes(
                  normalize(requirement.status)
                )
              ).length;
              const review = group.requirements.filter((requirement) =>
                ["requested", "received", "under_review"].includes(
                  normalize(requirement.status)
                )
              ).length;
              const completionRate = total
                ? Math.round((verified / total) * 100)
                : 0;
              const isExpanded = expandedRequirementGroups.has(group.id);

              return (
                <section
                  key={group.id}
                  className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_12px_32px_rgba(18,56,101,0.09)]"
                >
                  <button
                    type="button"
                    onClick={() => onToggleRequirementGroup(group.id)}
                    aria-expanded={isExpanded}
                    className="flex min-w-0 w-full flex-col gap-3 bg-[#123865] p-4 text-left text-white transition hover:bg-[#163F70] sm:p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <span className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF8EF] text-[#123865] shadow-sm">
                        <GraduationCap size={19} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="break-words text-base font-black text-white sm:text-lg">
                            {group.label}
                          </span>
                          <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                            {total} item{total === 1 ? "" : "s"}
                          </span>
                        </span>

                        <span className="mt-1 block max-w-3xl text-[10px] font-semibold leading-4 text-white/65">
                          {group.description}
                        </span>

                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {verified ? (
                            <span className="rounded-full border border-emerald-200/40 bg-emerald-300/15 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                              {verified} verified
                            </span>
                          ) : null}

                          {attention ? (
                            <span className="rounded-full border border-orange-200/60 bg-orange-300/20 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                              {attention} attention
                            </span>
                          ) : null}

                          {review ? (
                            <span className="rounded-full border border-blue-200/40 bg-blue-300/15 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                              {review} review
                            </span>
                          ) : null}

                          {!verified && !attention && !review ? (
                            <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase text-white/80">
                              Ready for assessment
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </span>

                    <span className="flex min-w-0 w-full items-center gap-3 lg:w-auto lg:min-w-[15rem]">
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-white/70">
                          <span>Verified progress</span>
                          <span>{completionRate}%</span>
                        </span>
                        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/15">
                          <span
                            className="block h-full rounded-full bg-[#FF5A0A] transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </span>
                      </span>

                      {isExpanded ? (
                        <ChevronDown
                          size={19}
                          className="shrink-0 text-white"
                        />
                      ) : (
                        <ChevronRight
                          size={19}
                          className="shrink-0 text-white"
                        />
                      )}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="space-y-2.5 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-3 sm:p-4">
                      {group.requirements.map((requirement) => (
                        <RequirementRow
                          key={requirement.id}
                          requirement={requirement}
                          busy={savingKeys.has(
                            `requirement-${requirement.id}`
                          )}
                          onStatusChange={(status) =>
                            onRequirementStatus(requirement, status)
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-5 text-center">
            <p className="text-sm font-black text-[#10233F]">
              No structured requirements yet.
            </p>
          </div>
        )}
      </Section>

      <Section
        title="Counselor Decision"
        subtitle="Record why this option should stay, move category, or be rejected."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="Counselor recommendation">
            <textarea
              rows={5}
              value={form.counselor_recommendation}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  counselor_recommendation: event.target.value,
                }))
              }
              className={textareaClass}
            />
          </Field>

          <Field label="Decision reason">
            <textarea
              rows={5}
              value={form.decision_reason}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  decision_reason: event.target.value,
                }))
              }
              className={textareaClass}
            />
          </Field>

          <Field label="Internal notes" className="lg:col-span-2">
            <textarea
              rows={5}
              value={form.notes}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              className={textareaClass}
            />
          </Field>
        </div>
      </Section>

      {activeUniversity?.id && !activeUniversity.is_archived ? (
        <section className="rounded-[1.6rem] border-[3px] border-[#123865] bg-[#123865] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.16em]"
                style={{ color: "#ffffff" }}
              >
                Application Handoff
              </p>
              <h3
                className="mt-1 text-xl font-black"
                style={{ color: "#ffffff" }}
              >
                {activeApplication
                  ? "Application OS already linked"
                  : "Ready to create an independent Application OS record"}
              </h3>
              <p
                className="mt-1 text-sm font-semibold"
                style={{ color: "#ffffff" }}
              >
                {activeApplication
                  ? "This university will never overwrite another university's application."
                  : "The application will be linked only to this shortlist option."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCreateApplication}
                disabled={savingKeys.size > 0}
                className="rounded-xl border-2 border-white bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md active:translate-y-0 disabled:opacity-50"
              >
                {activeApplication ? "Open Application" : "Create Application"}
              </button>

              {activeApplication ? (
                <button
                  type="button"
                  onClick={onUnlinkApplication}
                  disabled={savingKeys.size > 0}
                  title="The application record remains safe; only this connection is removed."
                  className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-2.5 text-xs font-black text-red-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-100 hover:shadow-md active:translate-y-0 disabled:opacity-50"
                >
                  Unlink Application
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ComparisonView({ items, onRemove, onSelect }) {
  if (!items.length) {
    return (
      <section className="rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-8 text-center">
        <Columns3 size={34} className="mx-auto text-orange-400" />
        <h3 className="mt-3 text-lg font-black text-[#10233F]">
          Select universities to compare
        </h3>
        <p className="mt-1 text-sm text-slate-100">
          Use the compare button on up to four shortlist cards.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-x-auto rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-4">
      <div
        className="grid min-w-[900px] gap-3"
        style={{
          gridTemplateColumns: `180px repeat(${items.length}, minmax(220px, 1fr))`,
        }}
      >
        <CompareLabel label="University" />
        {items.map((item) => (
          <CompareHeader
            key={item.id}
            item={item}
            onRemove={() => onRemove(item.id)}
            onSelect={() => onSelect(item)}
          />
        ))}

        <CompareLabel label="Category" />
        {items.map((item) => (
          <CompareCell key={`${item.id}-category`} value={pretty(item.category)} />
        ))}

        <CompareLabel label="Program / Intake" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-program`}
            value={`${item.program || "Not set"} · ${item.intake || "Not set"}`}
          />
        ))}

        <CompareLabel label="Fit Score" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-fit`}
            value={
              item.fit_score !== null && item.fit_score !== undefined
                ? `${item.fit_score}% · ${item.fit_level || "Not rated"}`
                : "Not scored"
            }
          />
        ))}

        <CompareLabel label="Deadline" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-deadline`}
            value={formatDate(item.deadline_date)}
          />
        ))}

        <CompareLabel label="Tuition" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-tuition`}
            value={formatMoney(item.tuition_amount, item.tuition_currency)}
          />
        ))}

        <CompareLabel label="Living Cost" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-living`}
            value={formatMoney(
              item.living_cost_amount,
              item.living_cost_currency
            )}
          />
        ))}

        <CompareLabel label="Scholarship / DSU" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-scholarship`}
            value={`${pretty(item.scholarship_status || "not_checked")}${
              item.dsu_eligible ? " · DSU potential" : ""
            }`}
          />
        ))}

        <CompareLabel label="Manual Risk" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-risk`}
            value={pretty(item.risk_level || "low")}
          />
        ))}

        <CompareLabel label="Next Action" />
        {items.map((item) => (
          <CompareCell
            key={`${item.id}-action`}
            value={item.next_action || "Not set"}
          />
        ))}
      </div>
    </section>
  );
}

function HistoryView({ events, loading, activeUniversity, onRefresh }) {
  return (
    <Section
      title="University Audit History"
      subtitle={
        activeUniversity
          ? `Operational history for ${activeUniversity.university}.`
          : "Select a university to view its history."
      }
      action={
        activeUniversity ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-2 text-xs font-black text-[#10233F]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        ) : null
      }
    >
      {!activeUniversity ? (
        <div className="rounded-2xl border-2 border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-6 text-center">
          <History size={28} className="mx-auto text-orange-400" />
          <p className="mt-3 text-sm font-black text-[#10233F]">
            No university selected
          </p>
        </div>
      ) : events.length ? (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[#10233F]">
                    {event.event_label || pretty(event.event_type)}
                  </p>
                  {(event.old_value || event.new_value) ? (
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {event.old_value || "—"} → {event.new_value || "—"}
                    </p>
                  ) : null}
                  {event.reason ? (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      {event.reason}
                    </p>
                  ) : null}
                </div>

                <span className="text-xs font-semibold text-slate-600">
                  {formatDate(event.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-6 text-center">
          <History size={28} className="mx-auto text-orange-400" />
          <p className="mt-3 text-sm font-black text-[#10233F]">
            No university events recorded yet
          </p>
        </div>
      )}
    </Section>
  );
}

function RequirementSummaryTile({ label, value, helper, tone = "navy" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} detail={helper} tone={toZaifanMetricTone(tone)} />;
}

function RequirementLibraryModal({ requirements = [], existingNameSet, query, setQuery, category, setCategory, total, recommendedIds, savingKeys, onAdd, onAddVisible, onClose }) {
  const categoryOptions = Object.entries(UNIVERSITY_REQUIREMENT_CATEGORIES);
  const visibleMissing = requirements.filter((item) => !existingNameSet.has(normalize(item.name)));
  return (
    <div className="fixed inset-0 z-[1320] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.8rem] border-[4px] border-[#123865] bg-[#FFF8EF] shadow-2xl">
        <div className="flex flex-col gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white lg:flex-row lg:items-start lg:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.19em] text-orange-300">University Requirement Library</p><h3 className="mt-1 text-2xl font-black">{total} reusable admission requirement templates</h3><p className="mt-2 max-w-3xl text-xs leading-5 text-blue-100">Apply only the requirements relevant to this exact university, programme and applicant. The library is intentionally larger than any single student checklist.</p></div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 text-white"><X size={18} /></button>
        </div>
        <div className="grid gap-3 border-b border-[#DCC8AD] bg-[#FFF4E8] p-4 lg:grid-cols-[minmax(0,1fr)_260px_auto]">
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search GPA, CIMEA, IELTS, syllabus, TOLC, portfolio..." className={inputClass} />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="all">All categories</option>{categoryOptions.map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select>
          <button type="button" onClick={onAddVisible} disabled={!visibleMissing.length || savingKeys.has("library-requirements-visible")} className="rounded-xl border-2 border-orange-600 bg-[#FF5A0A] px-4 py-3 text-xs font-black text-white disabled:cursor-default disabled:opacity-45">Add Visible Missing ({visibleMissing.length})</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-2">
          {requirements.map((template) => {
            const exists = existingNameSet.has(normalize(template.name)); const recommended = recommendedIds.has(template.id); const categoryMeta = getUniversityRequirementCategory(template.category); const busy = savingKeys.has(`library-requirement-${template.id}`);
            return <article key={template.id} className={`rounded-[1.35rem] border-2 p-4 ${exists ? "border-emerald-300 bg-emerald-50/60" : recommended ? "border-orange-400 bg-[#FFF1DF]" : "border-[#AFC0D0] bg-[#FFFCF7]"}`}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap gap-1.5"><span className="rounded-full border border-[#AFC0D0] bg-white px-2 py-0.5 text-[8px] font-black uppercase text-[#123865]">{categoryMeta.label}</span>{recommended ? <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[8px] font-black uppercase text-orange-800">Recommended</span> : null}<span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600">{pretty(template.priority)}</span></div><h4 className="mt-2 text-sm font-black text-[#10233F]">{template.name}</h4><p className="mt-2 text-[11px] leading-5 text-slate-600">{template.studentDescription}</p></div>
              <button type="button" onClick={() => onAdd(template)} disabled={exists || busy} className={`shrink-0 rounded-xl border-2 px-3 py-2 text-[9px] font-black uppercase ${exists ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-[#123865] bg-[#123865] text-white"} disabled:cursor-default disabled:opacity-65`}>{exists ? "Added" : busy ? "Adding..." : "Add"}</button></div>
            </article>;
          })}
        </div></div>
      </div>
    </div>
  );
}

function RequirementModal({ draft, setDraft, onClose, onSave, disabled }) {
  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
              Eligibility Requirement
            </p>
            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              Add structured requirement
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white text-slate-600"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Requirement name" className="sm:col-span-2">
            <input
              value={draft.requirement_name}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  requirement_name: event.target.value,
                }))
              }
              placeholder="IELTS 6.5, Transcript, Portfolio..."
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <input
              value={draft.requirement_category}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  requirement_category: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <SelectField
            label="Status"
            value={draft.status}
            options={REQUIREMENT_STATUS_OPTIONS}
            onChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                status: value,
              }))
            }
          />

          <Field label="Target value">
            <input
              value={draft.target_value}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  target_value: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Current value">
            <input
              value={draft.current_value}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  current_value: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <DateField
            label="Due date"
            value={draft.due_date}
            onChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                due_date: value,
              }))
            }
          />

          <Field label="Notes">
            <input
              value={draft.notes}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  notes: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2.5 text-xs font-black text-slate-700"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={disabled}
            className="rounded-xl border-2 border-orange-700 bg-[#FF5A0A] px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
          >
            Add Requirement
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border-2 border-[#9FB2C5] bg-[#FFFCF7] px-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

const textareaClass =
  "w-full resize-y rounded-xl border-2 border-[#9FB2C5] bg-[#FFFCF7] px-3 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

function Section({ title, subtitle, action = null, children }) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_14px_34px_rgba(16,35,63,0.08)]">
      <div className="flex flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-4 py-4 text-white sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
            University Strategy Workspace
          </p>
          <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
          {subtitle ? (
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/75">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-black text-[#10233F]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {pretty(option)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="date"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function MoneyCard({
  title,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
}) {
  return (
    <div className="rounded-2xl border-2 border-[#FF5A0A] bg-[#FFF8EF] p-4">
      <div className="flex items-center gap-2">
        <WalletCards size={17} className="text-orange-600" />
        <h4 className="text-sm font-black text-[#10233F]">{title}</h4>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_100px] gap-2">
        <input
          type="number"
          value={amount || ""}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="Amount"
          className={inputClass}
        />

        <input
          value={currency || "EUR"}
          onChange={(event) => onCurrencyChange(event.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}

function ToggleCard({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-[#9FB2C5] bg-[#FFFCF7] px-3 py-2.5 shadow-sm">
      <span className="text-sm font-black text-[#10233F]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-orange-500"
      />
    </label>
  );
}

function RequirementRow({ requirement, busy, onStatusChange }) {
  const meta = getUniversityRequirementMeta(requirement);

  return (
    <div className="rounded-[1.25rem] border-2 border-[#D8B07B] border-l-[5px] border-l-[#FF5A0A] bg-[#FFFCF7] p-4 shadow-[0_6px_16px_rgba(16,35,63,0.05)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-[#10233F]">
              {requirement.requirement_name}
            </h4>
            <RequirementStatus value={requirement.status} />
            <span className="rounded-full border-2 border-[#AFC0D0] bg-[#EDF4F8] px-2 py-0.5 text-[9px] font-black uppercase text-[#123865]">
              {meta.categoryLabel}
            </span>
            {meta.priority === "core" ? (
              <span className="rounded-full border-2 border-orange-300 bg-[#FFF1DF] px-2 py-0.5 text-[9px] font-black uppercase text-orange-800">
                Core
              </span>
            ) : null}
          </div>

          {meta.description ? (
            <p className="mt-2 max-w-4xl text-[11px] font-semibold leading-5 text-[#5B6D80]">
              {meta.description}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-[#5B6D80]">
            <span>
              Target: <strong className="text-[#10233F]">{requirement.target_value || "Not set"}</strong>
            </span>
            <span>
              Current: <strong className="text-[#10233F]">{requirement.current_value || "Not set"}</strong>
            </span>
            {requirement.due_date ? (
              <span>
                Due: <strong className="text-[#10233F]">{formatDate(requirement.due_date)}</strong>
              </span>
            ) : null}
          </div>
        </div>

        <select
          value={requirement.status || "missing"}
          disabled={busy}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 min-w-[132px] rounded-xl border-2 border-[#123865] bg-[#FFF8EF] px-3 text-xs font-black capitalize text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:opacity-50"
        >
          {REQUIREMENT_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {pretty(option)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PressureTile({ label, value, helper = "", tone = "slate" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} detail={helper} tone={toZaifanMetricTone(tone)} />;
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} icon={Icon} tone={toZaifanMetricTone(tone)} />;
}

function CompactStat({ label, value, icon: Icon, tone = "slate" }) {
  return <ZaifanMetricCard level="baby" label={label} value={value} icon={Icon} tone={toZaifanMetricTone(tone)} />;
}

function CompactInfo({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-[#FFF8EF] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-200">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function CategoryBadge({ value }) {
  return (
    <span className="rounded-full border border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-[9px] font-black uppercase text-orange-800">
      {pretty(value || "target")}
    </span>
  );
}

function StatusBadge({ value }) {
  const normalized = normalize(value);

  const style =
    normalized.includes("offer") ||
    normalized === "accepted" ||
    normalized === "enrolled"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : normalized.includes("reject")
      ? "border-red-300 bg-red-50 text-red-800"
      : normalized.includes("applied") ||
        normalized.includes("application ready")
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${style}`}
    >
      {pretty(value || "shortlisted")}
    </span>
  );
}

function RiskBadge({ value, label = "" }) {
  const normalized = normalize(value);

  const style =
    normalized.includes("critical") || normalized.includes("high")
      ? "border-red-300 bg-red-50 text-red-800"
      : normalized.includes("medium")
      ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${style}`}
    >
      {label ? `${label} ` : ""}{pretty(value || "low")} Risk
    </span>
  );
}

function RequirementStatus({ value }) {
  const normalized = normalize(value);

  const style =
    normalized === "verified" || normalized === "not required"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : normalized === "received" || normalized === "under review"
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : normalized === "rejected"
      ? "border-red-300 bg-red-50 text-red-800"
      : "border-amber-300 bg-amber-50 text-amber-800";

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${style}`}
    >
      {pretty(value || "missing")}
    </span>
  );
}

function DeadlineBadge({ meta }) {
  if (!meta) return null;

  const styles = {
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    slate: "border-[#C9D7E6] bg-slate-50 text-slate-700",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${
        styles[meta.tone] || styles.slate
      }`}
    >
      {meta.label}
    </span>
  );
}

function Feedback({ tone, onClose, children }) {
  const tones = {
    red: "border-red-400 bg-red-50 text-red-800",
    green: "border-emerald-400 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${
        tones[tone] || tones.green
      }`}
    >
      <CircleAlert size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      <button type="button" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function CompareLabel({ label }) {
  return (
    <div className="flex items-center rounded-xl border-2 border-[#FFB37A] bg-[#FFF4E8] px-3 py-3 text-xs font-black text-orange-800">
      {label}
    </div>
  );
}

function CompareHeader({ item, onRemove, onSelect }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
      <button type="button" onClick={onSelect} className="w-full text-left">
        <p className="truncate text-sm font-black text-[#10233F]">
          {item.university}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-600">
          {item.program || "Program not set"}
        </p>
      </button>

      <button
        type="button"
        onClick={onRemove}
        className="mt-3 rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-black text-red-700"
      >
        Remove
      </button>
    </div>
  );
}

function CompareCell({ value }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-[#FFF8EF] px-3 py-3 text-xs font-semibold text-[#10233F]">
      {value}
    </div>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (
    value.includes("blue") ||
    value.includes("cyan") ||
    value.includes("teal") ||
    value.includes("info")
  ) return "blue";
  if (
    value.includes("slate") ||
    value.includes("gray") ||
    value.includes("grey") ||
    value.includes("muted") ||
    value.includes("neutral") ||
    value.includes("default")
  ) return "slate";

  return "navy";
}

export default UniversityManagementPanel;
