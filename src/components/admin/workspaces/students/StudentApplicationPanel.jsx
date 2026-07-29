// StudentApplicationPanel V6 MAXIMUM — Reliability & Workflow Integrity
// Zaifan Admin OS functional overhaul:
// - true multi-application architecture per student
// - application portfolio + active workspace
// - persistent Supabase CRUD using student_applications
// - application requirements / conditions using student_application_requirements
// - application-specific audit history using student_application_events
// - broader Student OS timeline logging preserved
// - deadlines, priority, risk, next action, fees, deposits, scholarships
// - archive / restore, optimistic local updates, recoverable errors
// - compact purpose-first UI; navy surfaces use white text only
// - student_id + student_type identity isolation
// - stale-request protection for portfolio and support data
// - no optimistic fake-save success after watchdog timeout
// - timeout cleanup + post-timeout reconciliation
// - readiness distinguishes 'no requirements configured' from 'requirements complete'
// - operational portfolio signals for deadlines, money pressure, missing next actions and contradictions
// - audit sync reporting after core application saves

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  History,
  Landmark,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Undo2,
  University,
  WalletCards,
  X,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import StudentNotificationPreviewModal from "./StudentNotificationPreviewModal";
import StudentNotificationComposer from "./StudentNotificationComposer";
import {
  buildStudentNotification,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../../../../services/studentNotificationService";

const REQUEST_TIMEOUT_MS = 20000;

const EMPTY_FORM = {
  country: "",
  university: "",
  program: "",
  intake: "",
  source_university_id: "",
  source_university_name: "",

  application_reference: "",
  application_channel: "",
  portal_url: "",
  portal_username: "",

  application_status: "not_started",
  application_stage: "planning",
  offer_status: "pending",
  visa_status: "not_started",

  application_priority: "normal",
  risk_level: "low",
  risk_reason: "",

  submission_deadline: "",
  submitted_at: "",
  decision_at: "",
  offer_received_at: "",
  offer_acceptance_deadline: "",
  offer_accepted_at: "",

  next_action: "",
  next_action_due: "",

  conditional_offer: false,
  conditions_text: "",
  conditions_completed: false,

  application_fee_required: false,
  application_fee_amount: "",
  application_fee_currency: "EUR",
  application_fee_paid: false,
  application_fee_paid_at: "",

  deposit_required: false,
  deposit_amount: "",
  deposit_currency: "EUR",
  deposit_deadline: "",
  deposit_paid: false,
  deposit_paid_at: "",

  scholarship_status: "",
  scholarship_amount: "",
  scholarship_currency: "EUR",

  counselor_notes: "",
  university_notes: "",
  offer_notes: "",
  internal_notes: "",
};

const APPLICATION_STATUS_OPTIONS = [
  "not_started",
  "documents_pending",
  "documents_received",
  "applied",
  "under_review",
  "offer_received",
  "offer_accepted",
  "rejected",
  "enrolled",
];

const APPLICATION_STAGE_OPTIONS = [
  "planning",
  "preparation",
  "submitted",
  "offer",
  "accepted",
  "closed",
];

const OFFER_STATUS_OPTIONS = [
  "pending",
  "under_review",
  "offer_received",
  "offer_accepted",
  "rejected",
];

const VISA_STATUS_OPTIONS = [
  "not_started",
  "visa_processing",
  "biometrics",
  "medical",
  "under_review",
  "visa_approved",
  "rejected",
];

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];
const RISK_OPTIONS = ["low", "medium", "high", "critical"];

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

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toLocalDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const deadlineMeta = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59`);
  if (Number.isNaN(date.getTime())) return null;

  const days = Math.ceil((date.getTime() - Date.now()) / 86400000);

  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "red" };
  if (days === 0) return { label: "Due today", tone: "red" };
  if (days <= 7) return { label: `${days}d left`, tone: "orange" };
  if (days <= 30) return { label: `${days}d left`, tone: "blue" };
  return { label: formatDate(value), tone: "slate" };
};

function StudentApplicationPanel({
  student,
  sharedApplication = null,
  onSharedDataChange = null,
}) {
  const [applications, setApplications] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [requirements, setRequirements] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState(() => new Set());

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [showNewApplication, setShowNewApplication] = useState(false);
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [requirementDraft, setRequirementDraft] = useState({
    title: "",
    requirement_type: "general",
    description: "",
    due_date: "",
    notes: "",
  });

  const [undoAction, setUndoAction] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_FORM);

  const mountedRef = useRef(true);
  const loadRequestRef = useRef(0);
  const supportRequestRef = useRef(0);
  const undoTimerRef = useRef(null);

  const [auditWarning, setAuditWarning] = useState("");
  const [pendingNotification, setPendingNotification] = useState(null);
  const [notificationBusy, setNotificationBusy] = useState(false);

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const studentType = String(
    student?.student_type || student?.__leadType || student?.type || "inquiry"
  )
    .trim()
    .toLowerCase();
  const hasStudentId =
    studentId !== null &&
    studentId !== undefined &&
    String(studentId).trim() !== "";

  const dbStudentId = Number.isFinite(numericStudentId)
    ? numericStudentId
    : studentId;

  const studentName = useMemo(
    () =>
      student?.full_name ||
      student?.name ||
      student?.student_name ||
      "Student",
    [student?.full_name, student?.name, student?.student_name]
  );

  const activeApplication = useMemo(
    () =>
      activeId === "__new__"
        ? null
        : applications.find((item) => String(item.id) === String(activeId)) ||
          null,
    [activeId, applications]
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSnapshot),
    [form, savedSnapshot]
  );

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const startSaving = (key) => {
    if (!key) return;
    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });
    });
  };

  const stopSaving = (key) => {
    if (!key) return;
    safeSet(() => {
      setSavingKeys((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    });
  };

  const isSaving = (key) => savingKeys.has(key);

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

  const normalizeApplication = (record) => ({
    ...EMPTY_FORM,
    ...(record || {}),
    submission_deadline: toDateInput(record?.submission_deadline),
    submitted_at: toLocalDateTimeInput(record?.submitted_at),
    decision_at: toLocalDateTimeInput(record?.decision_at),
    offer_received_at: toLocalDateTimeInput(record?.offer_received_at),
    offer_acceptance_deadline: toDateInput(record?.offer_acceptance_deadline),
    offer_accepted_at: toLocalDateTimeInput(record?.offer_accepted_at),
    next_action_due: toDateInput(record?.next_action_due),
    deposit_deadline: toDateInput(record?.deposit_deadline),
    deposit_paid_at: toLocalDateTimeInput(record?.deposit_paid_at),
    application_fee_paid_at: toLocalDateTimeInput(
      record?.application_fee_paid_at
    ),
  });

  const buildNewApplicationForm = () => ({
    ...EMPTY_FORM,
    // Zaifan is currently Italy-first. New applications start with Italy,
    // but stored existing applications are never silently rewritten.
    country: "Italy",
    program: student?.program || student?.field_of_interest || "",
    intake: student?.intake || "",
  });

  const createTimelineEvent = async ({
    applicationId = null,
    eventType,
    title,
    description = "",
    oldValue = "",
    newValue = "",
  }) => {
    try {
      const { error: timelineError } = await supabase
        .from("student_application_timeline")
        .insert({
          student_id: dbStudentId,
          student_type: studentType,
          application_id: applicationId ? String(applicationId) : null,
          event_type: eventType,
          title,
          description,
          old_value: oldValue ? String(oldValue) : null,
          new_value: newValue ? String(newValue) : null,
        });

      if (timelineError) throw timelineError;
      return true;
    } catch (timelineError) {
      console.warn("Student OS timeline event failed:", timelineError);
      return false;
    }
  };

  const createApplicationEvent = async ({
    applicationId = null,
    eventType,
    eventLabel = "",
    oldValue = "",
    newValue = "",
    reason = null,
    metadata = {},
  }) => {
    try {
      const { data, error: eventError } = await supabase
        .from("student_application_events")
        .insert({
          student_id: dbStudentId,
          student_type: studentType,
          application_id: applicationId || null,
          event_type: eventType,
          event_label: eventLabel || eventType,
          old_value: oldValue ? String(oldValue) : null,
          new_value: newValue ? String(newValue) : null,
          reason,
          metadata,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      safeSet(() => {
        setEvents((previous) => [data, ...previous].slice(0, 150));
      });

      return data;
    } catch (eventError) {
      console.warn("Application event failed:", eventError);
      return null;
    }
  };

  const notifyParent = async (savedApplication = null) => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await withTimeout(
        Promise.resolve(onSharedDataChange(savedApplication)),
        "Student OS refresh timed out."
      );
    } catch (refreshError) {
      console.warn("Application saved but parent refresh was delayed:", refreshError);
    }
  };

  const loadApplications = async ({ keepActive = true } = {}) => {
    const requestId = Date.now();
    loadRequestRef.current = requestId;

    if (!hasStudentId) {
      safeSet(() => {
        setApplications([]);
        setActiveId(null);
        setForm(EMPTY_FORM);
        setLoading(false);
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      setError("");
    });

    try {
      const { data, error: loadError } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("student_id", dbStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(100),
        "Application portfolio loading timed out."
      );

      if (loadError) throw loadError;
      if (loadRequestRef.current !== requestId) return;

      const rows = data || [];

      // Merge a shared application if parent already has one but it is not in the response yet.
      const merged = [...rows];
      if (
        sharedApplication?.id &&
        !merged.some((item) => String(item.id) === String(sharedApplication.id))
      ) {
        merged.unshift(sharedApplication);
      }

      safeSet(() => {
        setApplications(merged);

        const stillValid =
          keepActive &&
          activeId &&
          activeId !== "__new__" &&
          merged.some((item) => String(item.id) === String(activeId));

        const nextActive = stillValid
          ? activeId
          : sharedApplication?.id
          ? sharedApplication.id
          : merged.find((item) => !item.is_archived)?.id ||
            merged[0]?.id ||
            null;

        setActiveId(nextActive);

        const nextRecord = merged.find(
          (item) => String(item.id) === String(nextActive)
        );

        const nextForm = nextRecord
          ? normalizeApplication(nextRecord)
          : buildNewApplicationForm();

        setForm(nextForm);
        setSavedSnapshot(nextForm);
      });
    } catch (loadError) {
      safeSet(() => {
        setError(loadError.message || "Application portfolio could not be loaded.");

        if (sharedApplication) {
          setApplications([sharedApplication]);
          setActiveId(sharedApplication.id);
          setForm(normalizeApplication(sharedApplication));
        }
      });
    } finally {
      if (loadRequestRef.current === requestId) {
        safeSet(() => setLoading(false));
      }
    }
  };

  const loadSupportData = async (applicationId) => {
    const requestId = Date.now();
    supportRequestRef.current = requestId;

    if (!applicationId || applicationId === "__new__") {
      safeSet(() => {
        setRequirements([]);
        setEvents([]);
        setSupportLoading(false);
      });
      return;
    }

    safeSet(() => {
      setSupportLoading(true);
      setError("");
    });

    try {
      const [requirementsResult, eventsResult] = await Promise.all([
        withTimeout(
          supabase
            .from("student_application_requirements")
            .select("*")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: true }),
          "Application requirements loading timed out."
        ),

        withTimeout(
          supabase
            .from("student_application_events")
            .select("*")
            .eq("application_id", applicationId)
            .eq("student_id", dbStudentId)
            .eq("student_type", studentType)
            .order("created_at", { ascending: false })
            .limit(150),
          "Application history loading timed out."
        ),
      ]);

      if (supportRequestRef.current !== requestId) return;

      if (requirementsResult.error) throw requirementsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      safeSet(() => {
        setRequirements(requirementsResult.data || []);
        setEvents(eventsResult.data || []);
      });
    } catch (supportError) {
      if (supportRequestRef.current !== requestId) return;

      safeSet(() => {
        setError(
          supportError.message ||
            "Application requirements/history could not be loaded."
        );
      });
    } finally {
      if (supportRequestRef.current === requestId) {
        safeSet(() => setSupportLoading(false));
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    loadRequestRef.current += 1;
    supportRequestRef.current += 1;
    setAuditWarning("");
    void loadApplications({ keepActive: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentType]);

  useEffect(() => {
    if (!activeId || activeId === "__new__") {
      setRequirements([]);
      setEvents([]);
      return;
    }

    void loadSupportData(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, studentType]);

  useEffect(() => {
    if (!sharedApplication?.id) return;

    setApplications((previous) => {
      const exists = previous.some(
        (item) => String(item.id) === String(sharedApplication.id)
      );

      if (exists) {
        return previous.map((item) =>
          String(item.id) === String(sharedApplication.id)
            ? { ...item, ...sharedApplication }
            : item
        );
      }

      return [sharedApplication, ...previous];
    });

    if (String(activeId) === String(sharedApplication.id)) {
      const nextForm = normalizeApplication(sharedApplication);
      setForm(nextForm);
      setSavedSnapshot(nextForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedApplication?.id, sharedApplication?.updated_at]);

  const selectApplication = (application) => {
    if (
      hasUnsavedChanges &&
      !window.confirm("You have unsaved application changes. Discard them and switch applications?")
    ) {
      return;
    }

    const nextForm = normalizeApplication(application);

    setActiveId(application.id);
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setActiveTab("overview");
    setError("");
    setSuccessMessage("");
  };

  const beginNewApplication = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm("You have unsaved application changes. Discard them and create a new application?")
    ) {
      return;
    }

    const nextForm = buildNewApplicationForm();

    setActiveId("__new__");
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setRequirements([]);
    setEvents([]);
    setActiveTab("overview");
    setShowNewApplication(true);
    setError("");
    setSuccessMessage("");
  };

  const buildPayload = () => ({
    student_id: dbStudentId,
    student_type: studentType,

    country: form.country || "",
    university: form.university || "",
    program: form.program || "",
    intake: form.intake || "",

    source_university_id: form.source_university_id || null,
    source_university_name: form.source_university_name || "",

    application_reference: form.application_reference || null,
    application_channel: form.application_channel || null,
    portal_url: form.portal_url || null,
    portal_username: form.portal_username || null,

    application_status: form.application_status || "not_started",
    application_stage: form.application_stage || "planning",
    offer_status: form.offer_status || "pending",
    visa_status: form.visa_status || "not_started",

    application_priority: form.application_priority || "normal",
    risk_level: form.risk_level || "low",
    risk_reason: form.risk_reason || null,

    submission_deadline: form.submission_deadline || null,
    submitted_at: toIsoOrNull(form.submitted_at),
    decision_at: toIsoOrNull(form.decision_at),
    offer_received_at: toIsoOrNull(form.offer_received_at),
    offer_acceptance_deadline: form.offer_acceptance_deadline || null,
    offer_accepted_at: toIsoOrNull(form.offer_accepted_at),

    next_action: form.next_action || null,
    next_action_due: form.next_action_due || null,

    conditional_offer: Boolean(form.conditional_offer),
    conditions_text: form.conditions_text || null,
    conditions_completed: Boolean(form.conditions_completed),

    application_fee_required: Boolean(form.application_fee_required),
    application_fee_amount:
      form.application_fee_amount === ""
        ? null
        : Number(form.application_fee_amount),
    application_fee_currency: form.application_fee_currency || null,
    application_fee_paid: Boolean(form.application_fee_paid),
    application_fee_paid_at: toIsoOrNull(form.application_fee_paid_at),

    deposit_required: Boolean(form.deposit_required),
    deposit_amount:
      form.deposit_amount === "" ? null : Number(form.deposit_amount),
    deposit_currency: form.deposit_currency || null,
    deposit_deadline: form.deposit_deadline || null,
    deposit_paid: Boolean(form.deposit_paid),
    deposit_paid_at: toIsoOrNull(form.deposit_paid_at),

    scholarship_status: form.scholarship_status || null,
    scholarship_amount:
      form.scholarship_amount === "" ? null : Number(form.scholarship_amount),
    scholarship_currency: form.scholarship_currency || null,

    counselor_notes: form.counselor_notes || "",
    university_notes: form.university_notes || "",
    offer_notes: form.offer_notes || "",
    internal_notes: form.internal_notes || "",

    updated_at: new Date().toISOString(),
  });

  const reconcileTimedOutSave = async (applicationId, expectedPayload) => {
    if (!applicationId) return null;

    try {
      const { data, error: reconcileError } = await withTimeout(
        supabase
          .from("student_applications")
          .select("*")
          .eq("id", applicationId)
          .eq("student_id", dbStudentId)
          .eq("student_type", studentType)
          .single(),
        "Application reconciliation timed out."
      );

      if (reconcileError) throw reconcileError;

      if (!data) return null;

      const expectedUpdatedAt = expectedPayload?.updated_at;
      const actualUpdatedAt = data?.updated_at;

      if (
        expectedUpdatedAt &&
        actualUpdatedAt &&
        String(expectedUpdatedAt) === String(actualUpdatedAt)
      ) {
        return data;
      }

      return null;
    } catch (reconcileError) {
      console.warn("Application reconciliation failed:", reconcileError);
      return null;
    }
  };

  const performSaveApplication = async () => {
    if (!hasStudentId) return;

    const operationKey =
      activeId === "__new__" ? "create-application" : `save-${activeId}`;

    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");
    setSuccessMessage("");
    setAuditWarning("");

    const previous = activeApplication;
    const payload = buildPayload();

    try {
      let result;

      if (activeId && activeId !== "__new__") {
        try {
          result = await withTimeout(
            supabase
              .from("student_applications")
              .update(payload)
              .eq("id", activeId)
              .eq("student_id", dbStudentId)
              .eq("student_type", studentType)
              .select()
              .single(),
            "Application update timed out."
          );
        } catch (updateError) {
          if (
            String(updateError?.message || "")
              .toLowerCase()
              .includes("timed out")
          ) {
            const reconciled = await reconcileTimedOutSave(activeId, payload);

            if (reconciled) {
              result = { data: reconciled, error: null };
            } else {
              throw new Error(
                "Application update timed out and could not be verified. The form has not been marked as saved. Refresh before retrying to avoid duplicate edits."
              );
            }
          } else {
            throw updateError;
          }
        }
      } else {
        result = await withTimeout(
          supabase
            .from("student_applications")
            .insert(payload)
            .select()
            .single(),
          "Application creation timed out."
        );
      }

      if (result.error) throw result.error;

      const saved = result.data;
      const wasCreated = activeId === "__new__";

      safeSet(() => {
        setApplications((items) => {
          if (wasCreated) return [saved, ...items];

          return items.map((item) =>
            String(item.id) === String(saved.id) ? saved : item
          );
        });

        const nextForm = normalizeApplication(saved);

        setActiveId(saved.id);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setShowNewApplication(false);
        setSuccessMessage(
          wasCreated
            ? "New university application created."
            : "Application saved."
        );
      });

      const changedFields = getChangedFields(previous, saved);
      const auditJobs = [];

      if (wasCreated) {
        auditJobs.push(
          createApplicationEvent({
            applicationId: saved.id,
            eventType: "application_created",
            eventLabel: "Application created",
            newValue: saved.application_status || "not_started",
            metadata: {
              university: saved.university || null,
              program: saved.program || null,
              country: saved.country || null,
            },
          }),
          createTimelineEvent({
            applicationId: saved.id,
            eventType: "application_created",
            title: "Application Created",
            description: `${studentName}'s application for ${
              saved.university || "a university"
            } was created.`,
            newValue: saved.application_status || "not_started",
          })
        );
      } else {
        changedFields.forEach((change) => {
          auditJobs.push(
            createApplicationEvent({
              applicationId: saved.id,
              eventType: `${change.field}_changed`,
              eventLabel: `${pretty(change.field)} updated`,
              oldValue: change.oldValue,
              newValue: change.newValue,
            }),
            createTimelineEvent({
              applicationId: saved.id,
              eventType: `${change.field}_changed`,
              title: `${pretty(change.field)} Updated`,
              description: `${pretty(change.field)} changed from "${
                change.oldValue || "empty"
              }" to "${change.newValue || "empty"}".`,
              oldValue: change.oldValue,
              newValue: change.newValue,
            })
          );
        });

        if (!changedFields.length) {
          auditJobs.push(
            createApplicationEvent({
              applicationId: saved.id,
              eventType: "application_saved",
              eventLabel: "Application saved",
              newValue: "saved",
            })
          );
        }
      }

      const auditResults = await Promise.allSettled(auditJobs);
      const auditFailures = auditResults.filter((result) => {
        if (result.status === "rejected") return true;
        return result.value === null || result.value === false;
      }).length;

      if (auditFailures > 0) {
        safeSet(() => {
          setAuditWarning(
            `Application data saved, but ${auditFailures} audit/timeline write${
              auditFailures === 1 ? "" : "s"
            } did not confirm. Core application data is preserved.`
          );
        });
      }

      void notifyParent(saved);
      return saved;
    } catch (saveError) {
      safeSet(() => {
        setError(saveError.message || "Application save failed.");
      });
      return null;
    } finally {
      stopSaving(operationKey);
    }
  };

  const openNotificationPreview = async (preview, execute) => {
    if (!preview) return execute();

    setError("");

    // Open the UI immediately. The signed server token is prepared in the
    // background so a slow network never makes the Admin action feel frozen.
    setPendingNotification({
      preview,
      execute,
      previewToken: null,
      expiresAt: null,
      preparing: Boolean(preview.sendable),
      preparationError: "",
    });

    if (!preview.sendable) return null;

    void prepareStudentNotification(preview)
      .then((prepared) => {
        setPendingNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                ...prepared,
                preparing: false,
                preparationError: "",
              }
            : current
        );
      })
      .catch((previewError) => {
        setPendingNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                preparing: false,
                preparationError:
                  previewError?.message ||
                  "Notification security preparation failed. No student-facing change was made.",
              }
            : current
        );
      });

    return null;
  };

  const confirmPendingNotification = async (confirmationText = "") => {
    const pending = pendingNotification;
    if (
      !pending ||
      notificationBusy ||
      pending.preparing ||
      pending.preparationError
    ) return;

    setNotificationBusy(true);
    setError("");

    try {
      const saved = await pending.execute();
      if (!saved) return;

      setPendingNotification(null);

      if (pending.preview.sendable) {
        const delivery = await sendPreparedStudentNotification({
          preview: pending.preview,
          previewToken: pending.previewToken,
          confirmationText,
        });

        setSuccessMessage(
          delivery.communicationWarning
            ? delivery.communicationWarning
            : "Application updated and student email sent safely."
        );
      } else {
        setSuccessMessage("Application updated. No email was sent because the student has no email address.");
      }

    } catch (notificationError) {
      setError(
        notificationError?.message ||
          "The application change was saved, but the student email could not be sent. Review Communication OS before retrying."
      );
    } finally {
      setNotificationBusy(false);
    }
  };

  const saveApplication = async () => {
    const previous = activeApplication || {};
    const next = { ...previous, ...buildPayload() };
    const preview = activeApplication?.id
      ? buildStudentNotification({
          domain: "application",
          student,
          entity: activeApplication,
          previous,
          next,
          relatedType: "application",
          relatedId: activeApplication.id,
        })
      : null;

    if (!preview) return performSaveApplication();
    return openNotificationPreview(preview, performSaveApplication);
  };

  const registerUndo = (action) => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);

    setUndoAction(action);

    undoTimerRef.current = window.setTimeout(() => {
      setUndoAction(null);
      undoTimerRef.current = null;
    }, 12000);
  };

  const performQuickWorkflow = async (action) => {
    if (!activeApplication?.id || savingKeys.size > 0) return;

    const nowIso = new Date().toISOString();
    const patch =
      action === "submitted"
        ? {
            application_stage: "submitted",
            application_status: "applied",
            submitted_at: nowIso,
          }
        : action === "offer_received"
        ? {
            application_stage: "offer",
            application_status: "offer_received",
            offer_status: "offer_received",
            offer_received_at: nowIso,
          }
        : action === "offer_accepted"
        ? {
            application_stage: "accepted",
            application_status: "offer_accepted",
            offer_status: "offer_accepted",
            offer_accepted_at: nowIso,
          }
        : action === "rejected"
        ? {
            application_stage: "closed",
            application_status: "rejected",
            offer_status: "rejected",
            decision_at: nowIso,
          }
        : null;

    if (!patch) return;

    const operationKey = `workflow-${activeApplication.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: workflowError } = await withTimeout(
        supabase
          .from("student_applications")
          .update({ ...patch, updated_at: nowIso })
          .eq("id", activeApplication.id)
          .select()
          .single(),
        "Application workflow update timed out."
      );

      if (workflowError) throw workflowError;

      const nextForm = normalizeApplication(data);

      safeSet(() => {
        setApplications((items) =>
          items.map((item) =>
            String(item.id) === String(data.id) ? data : item
          )
        );
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setSuccessMessage(
          action === "submitted"
            ? "Application marked submitted."
            : action === "offer_received"
            ? "Offer marked received."
            : action === "offer_accepted"
            ? "Offer marked accepted."
            : "Application marked rejected."
        );
      });

      void createApplicationEvent({
        applicationId: data.id,
        eventType: `quick_${action}`,
        eventLabel: pretty(action),
        oldValue: activeApplication.application_status || "",
        newValue: data.application_status || "",
      });

      void createTimelineEvent({
        applicationId: data.id,
        eventType: `quick_${action}`,
        title: pretty(action),
        description: `${data.university || "Application"} moved to ${pretty(
          data.application_status
        )}.`,
        oldValue: activeApplication.application_status || "",
        newValue: data.application_status || "",
      });

      void notifyParent(data);
      return data;
    } catch (workflowError) {
      safeSet(() =>
        setError(workflowError.message || "Workflow action failed.")
      );
      return null;
    } finally {
      stopSaving(operationKey);
    }
  };

  const applyQuickWorkflow = async (action) => {
    if (!activeApplication?.id || savingKeys.size > 0) return;

    const nowIso = new Date().toISOString();
    const patch =
      action === "submitted"
        ? { application_stage: "submitted", application_status: "applied", submitted_at: nowIso }
        : action === "offer_received"
        ? { application_stage: "offer", application_status: "offer_received", offer_status: "offer_received", offer_received_at: nowIso }
        : action === "offer_accepted"
        ? { application_stage: "accepted", application_status: "offer_accepted", offer_status: "offer_accepted", offer_accepted_at: nowIso }
        : action === "rejected"
        ? { application_stage: "closed", application_status: "rejected", offer_status: "rejected", decision_at: nowIso }
        : null;

    if (!patch) return;

    const next = { ...activeApplication, ...patch };
    const preview = buildStudentNotification({
      domain: "application",
      action,
      student,
      entity: activeApplication,
      previous: activeApplication,
      next,
      relatedType: "application",
      relatedId: activeApplication.id,
    });

    if (!preview) return performQuickWorkflow(action);
    return openNotificationPreview(preview, () => performQuickWorkflow(action));
  };

  const duplicateApplication = async () => {
    if (!activeApplication?.id || savingKeys.size > 0) return;

    const confirmed = window.confirm(
      `Duplicate "${activeApplication.university || "this application"}" as a new application?`
    );
    if (!confirmed) return;

    const payload = {
      ...buildPayload(),
      university: `${form.university || "University"} Copy`,
      application_reference: null,
      application_stage: "planning",
      application_status: "not_started",
      offer_status: "pending",
      visa_status: "not_started",
      submitted_at: null,
      decision_at: null,
      offer_received_at: null,
      offer_accepted_at: null,
      is_archived: false,
      archived_at: null,
      updated_at: new Date().toISOString(),
    };

    delete payload.student_id;
    delete payload.student_type;

    const operationKey = "duplicate-application";
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: duplicateError } = await withTimeout(
        supabase
          .from("student_applications")
          .insert({
            ...payload,
            student_id: dbStudentId,
            student_type: studentType,
          })
          .select()
          .single(),
        "Application duplication timed out."
      );

      if (duplicateError) throw duplicateError;

      const nextForm = normalizeApplication(data);

      safeSet(() => {
        setApplications((items) => [data, ...items]);
        setActiveId(data.id);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setSuccessMessage("Application duplicated. Change the university/program and save.");
      });

      void createApplicationEvent({
        applicationId: data.id,
        eventType: "application_duplicated",
        eventLabel: "Application duplicated",
        metadata: { source_application_id: activeApplication.id },
      });

      void notifyParent(data);
    } catch (duplicateError) {
      safeSet(() => setError(duplicateError.message || "Duplicate failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const permanentlyDeleteApplication = async (application) => {
    if (!application?.id || !application.is_archived) return;

    const confirmed = window.confirm(
      `PERMANENTLY delete "${application.university || "this application"}"?\n\nThis is intended only for accidental/test applications and cannot be undone.`
    );

    if (!confirmed) return;

    const operationKey = `delete-${application.id}`;
    startSaving(operationKey);
    setError("");

    try {
      // Requirements are ON DELETE CASCADE.
      // Application events keep their audit rows and set application_id to NULL.
      const { error: deleteError } = await withTimeout(
        supabase
          .from("student_applications")
          .delete()
          .eq("id", application.id)
          .eq("student_id", dbStudentId)
          .eq("student_type", studentType),
        "Permanent application deletion timed out."
      );

      if (deleteError) throw deleteError;

      const remaining = applications.filter(
        (item) => String(item.id) !== String(application.id)
      );

      safeSet(() => {
        setApplications(remaining);

        const nextActive =
          remaining.find((item) => !item.is_archived)?.id ||
          remaining[0]?.id ||
          null;

        setActiveId(nextActive);

        const nextRecord = remaining.find(
          (item) => String(item.id) === String(nextActive)
        );

        const nextForm = nextRecord
          ? normalizeApplication(nextRecord)
          : buildNewApplicationForm();

        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setSuccessMessage("Archived application permanently deleted.");
      });

      void createApplicationEvent({
        applicationId: null,
        eventType: "application_permanently_deleted",
        eventLabel: "Application permanently deleted",
        metadata: {
          deleted_application_id: application.id,
          university: application.university || null,
          program: application.program || null,
        },
      });

      void notifyParent(null);
    } catch (deleteError) {
      safeSet(() =>
        setError(deleteError.message || "Permanent application deletion failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const archiveApplication = async (application) => {
    if (!application?.id || isSaving(`archive-${application.id}`)) return;

    const operationKey = `archive-${application.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const archivedAt = new Date().toISOString();

      const { error: archiveError } = await withTimeout(
        supabase
          .from("student_applications")
          .update({
            is_archived: true,
            archived_at: archivedAt,
            updated_at: archivedAt,
          })
          .eq("id", application.id),
        "Application archive timed out."
      );

      if (archiveError) throw archiveError;

      const next = {
        ...application,
        is_archived: true,
        archived_at: archivedAt,
      };

      safeSet(() => {
        setApplications((items) =>
          items.map((item) =>
            String(item.id) === String(application.id) ? next : item
          )
        );
        setSuccessMessage(`${application.university || "Application"} archived.`);
      });

      registerUndo({
        type: "archive",
        applicationId: application.id,
        previousIsArchived: Boolean(application.is_archived),
        previousArchivedAt: application.archived_at || null,
      });

      void createApplicationEvent({
        applicationId: application.id,
        eventType: "application_archived",
        eventLabel: "Application archived",
        newValue: "archived",
      });

      void notifyParent(next);
    } catch (archiveError) {
      safeSet(() => setError(archiveError.message || "Archive failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const restoreApplication = async (application) => {
    if (!application?.id || isSaving(`archive-${application.id}`)) return;

    const operationKey = `archive-${application.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const { error: restoreError } = await withTimeout(
        supabase
          .from("student_applications")
          .update({
            is_archived: false,
            archived_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", application.id),
        "Application restore timed out."
      );

      if (restoreError) throw restoreError;

      const next = { ...application, is_archived: false, archived_at: null };

      safeSet(() => {
        setApplications((items) =>
          items.map((item) =>
            String(item.id) === String(application.id) ? next : item
          )
        );
        setSuccessMessage(`${application.university || "Application"} restored.`);
      });

      void createApplicationEvent({
        applicationId: application.id,
        eventType: "application_restored",
        eventLabel: "Application restored",
        newValue: "active",
      });

      void notifyParent(next);
    } catch (restoreError) {
      safeSet(() => setError(restoreError.message || "Restore failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const undoLastAction = async () => {
    if (!undoAction || undoAction.type !== "archive") return;

    const application = applications.find(
      (item) => String(item.id) === String(undoAction.applicationId)
    );

    if (!application) return;

    if (undoAction.previousIsArchived) {
      await archiveApplication(application);
    } else {
      await restoreApplication(application);
    }

    setUndoAction(null);
  };

  const addRequirement = async () => {
    if (!activeApplication?.id || !requirementDraft.title.trim()) return;

    const operationKey = `requirement-create-${activeApplication.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_application_requirements")
          .insert({
            application_id: activeApplication.id,
            requirement_type: requirementDraft.requirement_type || "general",
            title: requirementDraft.title.trim(),
            description: requirementDraft.description.trim() || null,
            status: "pending",
            due_date: requirementDraft.due_date || null,
            notes: requirementDraft.notes.trim() || null,
          })
          .select()
          .single(),
        "Requirement creation timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) => [...previous, data]);
        setRequirementDraft({
          title: "",
          requirement_type: "general",
          description: "",
          due_date: "",
          notes: "",
        });
        setShowAddRequirement(false);
        setSuccessMessage("Application requirement added.");
      });

      void createApplicationEvent({
        applicationId: activeApplication.id,
        eventType: "requirement_created",
        eventLabel: "Requirement added",
        newValue: data.title,
      });
    } catch (requirementError) {
      safeSet(() =>
        setError(requirementError.message || "Requirement could not be added.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const updateRequirementStatus = async (requirement, status) => {
    if (!requirement?.id) return;

    const operationKey = `requirement-${requirement.id}`;
    if (isSaving(operationKey)) return;

    startSaving(operationKey);
    setError("");

    try {
      const completed = status === "completed";

      const patch = {
        status,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_application_requirements")
          .update(patch)
          .eq("id", requirement.id)
          .select()
          .single(),
        "Requirement update timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) =>
          previous.map((item) => (item.id === requirement.id ? data : item))
        );
      });

      void createApplicationEvent({
        applicationId: activeApplication?.id,
        eventType: "requirement_status_changed",
        eventLabel: "Requirement status updated",
        oldValue: requirement.status,
        newValue: status,
        metadata: { requirement_title: requirement.title },
      });
    } catch (requirementError) {
      safeSet(() =>
        setError(requirementError.message || "Requirement update failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const deleteRequirement = async (requirement) => {
    if (!requirement?.id) return;

    const confirmed = window.confirm(`Delete requirement "${requirement.title}"?`);
    if (!confirmed) return;

    const operationKey = `requirement-delete-${requirement.id}`;
    startSaving(operationKey);

    try {
      const { error: deleteError } = await withTimeout(
        supabase
          .from("student_application_requirements")
          .delete()
          .eq("id", requirement.id),
        "Requirement deletion timed out."
      );

      if (deleteError) throw deleteError;

      safeSet(() => {
        setRequirements((previous) =>
          previous.filter((item) => item.id !== requirement.id)
        );
      });

      void createApplicationEvent({
        applicationId: activeApplication?.id,
        eventType: "requirement_deleted",
        eventLabel: "Requirement deleted",
        oldValue: requirement.title,
      });
    } catch (deleteError) {
      safeSet(() =>
        setError(deleteError.message || "Requirement deletion failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const filteredApplications = useMemo(() => {
    const query = normalize(search);

    return applications.filter((application) => {
      if (!showArchived && application.is_archived) return false;
      if (showArchived && !application.is_archived) return false;

      if (!query) return true;

      return normalize(
        [
          application.university,
          application.program,
          application.country,
          application.intake,
          application.application_reference,
          application.application_status,
          application.application_stage,
        ].join(" ")
      ).includes(query);
    });
  }, [applications, search, showArchived]);

  const portfolioStats = useMemo(() => {
    const active = applications.filter((item) => !item.is_archived);
    const archived = applications.length - active.length;

    const submitted = active.filter((item) =>
      ["applied", "under_review", "offer_received", "offer_accepted", "enrolled"].includes(
        item.application_status
      )
    ).length;

    const offers = active.filter((item) =>
      ["offer_received", "offer_accepted"].includes(item.offer_status)
    ).length;

    const critical = active.filter((item) =>
      ["high", "critical"].includes(item.risk_level)
    ).length;

    const deadlines = active.filter((item) => {
      const meta = deadlineMeta(item.submission_deadline);
      return meta && ["red", "orange"].includes(meta.tone);
    }).length;

    return {
      total: active.length,
      archived,
      submitted,
      offers,
      critical,
      deadlines,
    };
  }, [applications]);

  const requirementStats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(
      (item) => item.status === "completed"
    ).length;
    const pending = total - completed;
    const overdue = requirements.filter((item) => {
      if (!item.due_date || item.status === "completed") return false;
      return new Date(`${item.due_date}T23:59:59`).getTime() < Date.now();
    }).length;

    return { total, completed, pending, overdue };
  }, [requirements]);

  const readiness = useMemo(() => {
    const checks = [
      form.country,
      form.university,
      form.program,
      form.intake,
      form.application_status !== "not_started" ? "status" : "",
      form.next_action,
      form.submission_deadline,
      requirements.length > 0 && requirementStats.pending === 0
        ? "requirements"
        : "",
    ];

    return Math.round(
      (checks.filter(Boolean).length / checks.length) * 100
    );
  }, [form, requirements.length, requirementStats.pending]);

  const operationalIntelligence = useMemo(() => {
    const active = applications.filter((item) => !item.is_archived);

    const deadlineCandidates = active
      .flatMap((item) => [
        {
          type: "Submission",
          application: item,
          value: item.submission_deadline,
        },
        {
          type: "Offer acceptance",
          application: item,
          value: item.offer_acceptance_deadline,
        },
        {
          type: "Deposit",
          application: item,
          value:
            item.deposit_required && !item.deposit_paid
              ? item.deposit_deadline
              : null,
        },
        {
          type: "Next action",
          application: item,
          value: item.next_action_due,
        },
      ])
      .filter((item) => item.value)
      .map((item) => ({
        ...item,
        timestamp: new Date(`${item.value}T23:59:59`).getTime(),
      }))
      .filter((item) => Number.isFinite(item.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    const nearestDeadline = deadlineCandidates.find(
      (item) => item.timestamp >= Date.now() - 86400000
    );

    const missingNextAction = active.filter(
      (item) =>
        !String(item.next_action || "").trim() &&
        !["rejected", "enrolled"].includes(item.application_status)
    );

    const moneyPressure = active.filter(
      (item) =>
        (item.application_fee_required && !item.application_fee_paid) ||
        (item.deposit_required && !item.deposit_paid)
    );

    const staleApplications = active.filter((item) => {
      const date = new Date(item.updated_at || item.created_at || 0);
      if (Number.isNaN(date.getTime())) return false;
      return Date.now() - date.getTime() >= 14 * 86400000;
    });

    const contradictions = active.filter((item) => {
      const status = item.application_status;
      const stage = item.application_stage;
      const offer = item.offer_status;

      return (
        (["offer_received", "offer_accepted"].includes(status) &&
          ["planning", "preparation"].includes(stage)) ||
        (offer === "offer_accepted" && stage !== "accepted") ||
        (status === "rejected" && stage !== "closed")
      );
    });

    return {
      nearestDeadline,
      missingNextAction,
      moneyPressure,
      staleApplications,
      contradictions,
    };
  }, [applications]);

  const deadline = deadlineMeta(form.submission_deadline);
  const nextActionDeadline = deadlineMeta(form.next_action_due);

  return (
    <div className="space-y-4 bg-[#fffaf4] p-3 text-[#10233f] sm:p-4 lg:p-5">
      <StudentNotificationPreviewModal
        pending={pendingNotification}
        busy={notificationBusy}
        onCancel={() => !notificationBusy && setPendingNotification(null)}
        onConfirm={confirmPendingNotification}
      />
      {/* APPLICATION OS COMMAND */}
      <section className="rounded-[1.7rem] border-[3px] border-orange-500 bg-white p-4 shadow-[0_12px_32px_rgba(121,72,40,0.08)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-orange-700">
                Application OS
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                Student #{studentId || "—"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#10233f]">
              Multi-Application Command Center
            </h2>

            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">
              Run every university application independently with deadlines,
              requirements, offer conditions, payments, risks and next actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StudentNotificationComposer
              student={student}
              context="application"
              buttonLabel="Send Application Update"
              compact
            />

            <button
              type="button"
              onClick={beginNewApplication}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-orange-600"
            >
              <Plus size={15} />
              New Application
            </button>

            <button
              type="button"
              onClick={() => void loadApplications()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Active" value={portfolioStats.total} icon={University} />
          <Metric
            label="Submitted"
            value={portfolioStats.submitted}
            icon={FileCheck2}
            tone="blue"
          />
          <Metric
            label="Offers"
            value={portfolioStats.offers}
            icon={BadgeCheck}
            tone="green"
          />
          <Metric
            label="Deadline Risk"
            value={portfolioStats.deadlines}
            icon={CalendarClock}
            tone="orange"
          />
          <Metric
            label="High Risk"
            value={portfolioStats.critical}
            icon={ShieldAlert}
            tone="red"
          />
          <Metric
            label="Archived"
            value={portfolioStats.archived}
            icon={Archive}
            tone="slate"
          />
        </div>
      </section>

      {error ? (
        <Feedback tone="red" onClose={() => setError("")}>
          {error}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="green" onClose={() => setSuccessMessage("")}>
          <div className="flex flex-wrap items-center gap-2">
            <span>{successMessage}</span>
            {undoAction ? (
              <button
                type="button"
                onClick={undoLastAction}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#0b2a57] bg-[#0b2a57] px-3 py-1.5 text-xs font-black"
                style={{ color: "#ffffff" }}
              >
                <Undo2 size={13} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff" }}>Undo</span>
              </button>
            ) : null}
          </div>
        </Feedback>
      ) : null}

      {/* APPLICATION SWITCHER */}
      <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-3 shadow-[0_8px_24px_rgba(15,35,63,0.05)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find university, program, intake or reference..."
                className="h-10 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:border-orange-400"
              />
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowArchived(false)}
                className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                  !showArchived
                    ? "border-orange-500 bg-orange-50 text-orange-800"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setShowArchived(true)}
                className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                  showArchived
                    ? "border-[#0b2a57] bg-[#0b2a57]"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
                style={{ color: showArchived ? "#ffffff" : undefined }}
              >
                Archived
              </button>
            </div>
          </div>

          <div className="shrink-0 text-xs font-black text-slate-500">
            {filteredApplications.length} application
            {filteredApplications.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading && applications.length === 0 ? (
          <div className="mt-3 flex min-h-[90px] items-center justify-center rounded-2xl border-2 border-dashed border-orange-200 bg-[#fffaf4]">
            <div className="text-center">
              <LoaderCircle
                size={22}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-2 text-xs font-black text-[#10233f]">
                Loading applications
              </p>
            </div>
          </div>
        ) : null}

        {!loading && filteredApplications.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-orange-300 bg-[#fffaf4] p-5 text-center">
            <University size={26} className="mx-auto text-orange-400" />
            <p className="mt-2 text-sm font-black text-[#10233f]">
              {showArchived ? "No archived applications" : "No applications yet"}
            </p>

            {!showArchived ? (
              <button
                type="button"
                onClick={beginNewApplication}
                className="mt-3 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-white"
              >
                Create first application
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredApplications.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filteredApplications.map((application) => (
              <ApplicationSwitcherCard
                key={application.id}
                application={application}
                active={String(application.id) === String(activeId)}
                onClick={() => selectApplication(application)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* ACTIVE WORKSPACE */}
      <main className="min-w-0">

          {!activeId ? (
            <EmptyWorkspace onCreate={beginNewApplication} />
          ) : (
            <div className="space-y-4">
              {/* ACTIVE APPLICATION HEADER */}
              <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4 shadow-[0_8px_24px_rgba(15,35,63,0.05)] sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge value={form.application_stage} />
                      <PriorityBadge value={form.application_priority} />
                      <RiskBadge value={form.risk_level} />
                      {activeApplication?.is_archived ? (
                        <span className="rounded-full border border-slate-400 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-700">
                          Archived
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 truncate text-2xl font-black text-[#10233f]">
                      {form.university || "New University Application"}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {[form.program, form.country, form.intake]
                        .filter(Boolean)
                        .join(" · ") || "Complete the application details below."}
                    </p>

                    {form.application_reference ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Reference: {form.application_reference}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hasUnsavedChanges ? (
                      <span className="inline-flex items-center rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                        Unsaved changes
                      </span>
                    ) : null}

                    {activeApplication?.id && !activeApplication.is_archived ? (
                      <button
                        type="button"
                        onClick={duplicateApplication}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
                      >
                        <Plus size={14} />
                        Duplicate
                      </button>
                    ) : null}

                    {activeApplication?.is_archived ? (
                      <>
                        <button
                          type="button"
                          onClick={() => restoreApplication(activeApplication)}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            permanentlyDeleteApplication(activeApplication)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-black text-red-800"
                        >
                          <Trash2 size={14} />
                          Delete Permanently
                        </button>
                      </>
                    ) : activeApplication?.id ? (
                      <button
                        type="button"
                        onClick={() => archiveApplication(activeApplication)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-400 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                      >
                        <Archive size={14} />
                        Archive
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={saveApplication}
                      disabled={savingKeys.size > 0}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-700 bg-orange-500 px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
                    >
                      {savingKeys.size > 0 ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {activeId === "__new__" ? "Create Application" : "Save"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <CompactStat
                    label="Readiness"
                    value={`${readiness}%`}
                    icon={Sparkles}
                  />
                  <CompactStat
                    label="Requirements"
                    value={`${requirementStats.completed}/${requirementStats.total}`}
                    icon={CheckCircle2}
                  />
                  <CompactStat
                    label="Submission"
                    value={deadline?.label || "No deadline"}
                    icon={CalendarClock}
                    tone={deadline?.tone}
                  />
                  <CompactStat
                    label="Next Action"
                    value={nextActionDeadline?.label || "Not scheduled"}
                    icon={ArrowRight}
                    tone={nextActionDeadline?.tone}
                  />
                </div>
              </section>

              <section className="rounded-[1.45rem] border-[3px] border-slate-300 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                      Portfolio Operations
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#10233f]">
                      Cross-application pressure check
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      Real signals from application deadlines, unpaid obligations,
                      missing next actions, stale records and contradictory workflow states.
                    </p>
                  </div>

                  <span className="rounded-full border-2 border-slate-300 bg-[#fffaf4] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                    {portfolioStats.total} active applications
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  <OperationalTile
                    label="Nearest Deadline"
                    value={
                      operationalIntelligence.nearestDeadline
                        ? `${operationalIntelligence.nearestDeadline.type}: ${formatDate(
                            operationalIntelligence.nearestDeadline.value
                          )}`
                        : "None scheduled"
                    }
                    tone={operationalIntelligence.nearestDeadline ? "orange" : "slate"}
                  />
                  <OperationalTile
                    label="No Next Action"
                    value={operationalIntelligence.missingNextAction.length}
                    tone={
                      operationalIntelligence.missingNextAction.length
                        ? "red"
                        : "green"
                    }
                  />
                  <OperationalTile
                    label="Money Pressure"
                    value={operationalIntelligence.moneyPressure.length}
                    tone={
                      operationalIntelligence.moneyPressure.length
                        ? "orange"
                        : "green"
                    }
                  />
                  <OperationalTile
                    label="Stale 14d+"
                    value={operationalIntelligence.staleApplications.length}
                    tone={
                      operationalIntelligence.staleApplications.length
                        ? "orange"
                        : "green"
                    }
                  />
                  <OperationalTile
                    label="State Conflicts"
                    value={operationalIntelligence.contradictions.length}
                    tone={
                      operationalIntelligence.contradictions.length
                        ? "red"
                        : "green"
                    }
                  />
                </div>
              </section>

              {activeApplication?.id && !activeApplication.is_archived ? (
                <section className="rounded-[1.35rem] border-[3px] border-orange-300 bg-white p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">
                        Quick Workflow
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        One-click actions update status, stage and milestone dates together.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyQuickWorkflow("submitted")}
                        className="rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
                      >
                        Mark Submitted
                      </button>

                      <button
                        type="button"
                        onClick={() => applyQuickWorkflow("offer_received")}
                        className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
                      >
                        Offer Received
                      </button>

                      <button
                        type="button"
                        onClick={() => applyQuickWorkflow("offer_accepted")}
                        className="rounded-xl border-2 border-orange-400 bg-orange-50 px-3 py-2 text-xs font-black text-orange-800"
                      >
                        Accept Offer
                      </button>

                      <button
                        type="button"
                        onClick={() => applyQuickWorkflow("rejected")}
                        className="rounded-xl border-2 border-red-400 bg-red-50 px-3 py-2 text-xs font-black text-red-800"
                      >
                        Mark Rejected
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* TABS */}
              <div className="grid grid-cols-2 gap-2 rounded-[1.3rem] border-[3px] border-orange-300 bg-white p-2 sm:grid-cols-4">
                {[
                  ["overview", "Overview"],
                  ["requirements", `Requirements (${requirementStats.pending})`],
                  ["notes", "Notes"],
                  ["history", `History (${events.length})`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-xs font-black ${
                      activeTab === value
                        ? "border-[#0b2a57] bg-[#0b2a57]"
                        : "border-slate-300 bg-white text-slate-600 hover:border-orange-300"
                    }`}
                    style={{
                      color: activeTab === value ? "#ffffff" : undefined,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" ? (
                <OverviewTab
                  form={form}
                  setForm={setForm}
                  disabled={savingKeys.size > 0}
                  deadline={deadline}
                />
              ) : null}

              {activeTab === "requirements" ? (
                <RequirementsTab
                  requirements={requirements}
                  stats={requirementStats}
                  loading={supportLoading}
                  savingKeys={savingKeys}
                  onAdd={() => setShowAddRequirement(true)}
                  onStatusChange={updateRequirementStatus}
                  onDelete={deleteRequirement}
                />
              ) : null}

              {activeTab === "notes" ? (
                <NotesTab
                  form={form}
                  setForm={setForm}
                  disabled={savingKeys.size > 0}
                />
              ) : null}

              {activeTab === "history" ? (
                <HistoryTab
                  events={events}
                  loading={supportLoading}
                  onRefresh={() => loadSupportData(activeId)}
                />
              ) : null}
            </div>
          )}
      </main>

      {/* NEW APP INFO */}
      {showNewApplication && activeId === "__new__" ? (
        <div className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          You are creating a new independent application. Saving it will not overwrite any existing university application.
        </div>
      ) : null}

      {/* ADD REQUIREMENT */}
      {showAddRequirement ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[1.6rem] border-[3px] border-orange-400 bg-[#fffaf4] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                  Application Requirement
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  Add operational requirement
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRequirement(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-slate-500"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <input
                  value={requirementDraft.title}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Upload CIMEA Statement"
                  className={inputClass}
                />
              </Field>

              <Field label="Type">
                <select
                  value={requirementDraft.requirement_type}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      requirement_type: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="general">General</option>
                  <option value="document">Document</option>
                  <option value="payment">Payment</option>
                  <option value="condition">Offer condition</option>
                  <option value="university">University</option>
                </select>
              </Field>

              <Field label="Due date">
                <input
                  type="date"
                  value={requirementDraft.due_date}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      due_date: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Description" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={requirementDraft.description}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  className={textareaClass}
                />
              </Field>

              <Field label="Internal notes" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={requirementDraft.notes}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      notes: event.target.value,
                    }))
                  }
                  className={textareaClass}
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRequirement(false)}
                className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addRequirement}
                disabled={!requirementDraft.title.trim()}
                className="rounded-xl border-2 border-orange-700 bg-orange-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
              >
                Add Requirement
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:opacity-60";

const textareaClass =
  "w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:opacity-60";

function OverviewTab({ form, setForm, disabled, deadline }) {
  return (
    <div className="space-y-4">
      <Section title="Application Identity" subtitle="University, program, intake and application reference.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Country">
            <input
              value={form.country}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  country: event.target.value,
                }))
              }
              placeholder="Italy"
              className={inputClass}
            />
          </Field>

          <Field label="University">
            <input
              value={form.university}
              disabled={disabled}
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

          <Field label="Program">
            <input
              value={form.program}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  program: event.target.value,
                }))
              }
              placeholder="Computer Science"
              className={inputClass}
            />
          </Field>

          <Field label="Intake">
            <input
              value={form.intake}
              disabled={disabled}
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

          <Field label="Application reference">
            <input
              value={form.application_reference}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  application_reference: event.target.value,
                }))
              }
              placeholder="University application ID"
              className={inputClass}
            />
          </Field>

          <Field label="Application channel">
            <input
              value={form.application_channel}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  application_channel: event.target.value,
                }))
              }
              placeholder="Universitaly / University Portal / Email"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Operational Status" subtitle="Where the application is and how urgently staff should act.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Application stage"
            value={form.application_stage}
            options={APPLICATION_STAGE_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                application_stage: value,
              }))
            }
          />

          <SelectField
            label="Application status"
            value={form.application_status}
            options={APPLICATION_STATUS_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                application_status: value,
              }))
            }
          />

          <SelectField
            label="Offer status"
            value={form.offer_status}
            options={OFFER_STATUS_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                offer_status: value,
              }))
            }
          />

          <SelectField
            label="Visa status"
            value={form.visa_status}
            options={VISA_STATUS_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                visa_status: value,
              }))
            }
          />

          <SelectField
            label="Priority"
            value={form.application_priority}
            options={PRIORITY_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                application_priority: value,
              }))
            }
          />

          <SelectField
            label="Risk level"
            value={form.risk_level}
            options={RISK_OPTIONS}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                risk_level: value,
              }))
            }
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Risk reason">
            <textarea
              rows={3}
              value={form.risk_reason}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  risk_reason: event.target.value,
                }))
              }
              placeholder="Why is this application risky?"
              className={textareaClass}
            />
          </Field>

          <Field label="Next action">
            <textarea
              rows={3}
              value={form.next_action}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  next_action: event.target.value,
                }))
              }
              placeholder="What should the counselor/admin do next?"
              className={textareaClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Deadlines & Milestones" subtitle="Critical dates that should drive operational pressure.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DateField
            label="Submission deadline"
            value={form.submission_deadline}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                submission_deadline: value,
              }))
            }
            meta={deadline}
          />

          <DateTimeField
            label="Submitted at"
            value={form.submitted_at}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, submitted_at: value }))
            }
          />

          <DateTimeField
            label="Decision at"
            value={form.decision_at}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, decision_at: value }))
            }
          />

          <DateTimeField
            label="Offer received"
            value={form.offer_received_at}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                offer_received_at: value,
              }))
            }
          />

          <DateField
            label="Offer acceptance deadline"
            value={form.offer_acceptance_deadline}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                offer_acceptance_deadline: value,
              }))
            }
          />

          <DateField
            label="Next action due"
            value={form.next_action_due}
            disabled={disabled}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                next_action_due: value,
              }))
            }
          />
        </div>
      </Section>

      <Section title="Offer Conditions" subtitle="Control conditional offers and outstanding conditions.">
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleCard
            label="Conditional offer"
            checked={form.conditional_offer}
            disabled={disabled}
            onChange={(checked) =>
              setForm((previous) => ({
                ...previous,
                conditional_offer: checked,
              }))
            }
          />

          <ToggleCard
            label="Conditions completed"
            checked={form.conditions_completed}
            disabled={disabled}
            onChange={(checked) =>
              setForm((previous) => ({
                ...previous,
                conditions_completed: checked,
              }))
            }
          />

          <Field label="Conditions / requirements" className="md:col-span-2">
            <textarea
              rows={4}
              value={form.conditions_text}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  conditions_text: event.target.value,
                }))
              }
              placeholder="Describe offer conditions, missing evidence, grades, language requirements..."
              className={textareaClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Fees, Deposit & Scholarship" subtitle="Application money obligations and award tracking.">
        <div className="grid gap-4 xl:grid-cols-3">
          <FinanceBlock
            title="Application Fee"
            icon={WalletCards}
            required={form.application_fee_required}
            paid={form.application_fee_paid}
            amount={form.application_fee_amount}
            currency={form.application_fee_currency}
            disabled={disabled}
            onRequired={(value) =>
              setForm((previous) => ({
                ...previous,
                application_fee_required: value,
              }))
            }
            onPaid={(value) =>
              setForm((previous) => ({
                ...previous,
                application_fee_paid: value,
                application_fee_paid_at:
                  value && !previous.application_fee_paid_at
                    ? toLocalDateTimeInput(new Date())
                    : previous.application_fee_paid_at,
              }))
            }
            onAmount={(value) =>
              setForm((previous) => ({
                ...previous,
                application_fee_amount: value,
              }))
            }
            onCurrency={(value) =>
              setForm((previous) => ({
                ...previous,
                application_fee_currency: value,
              }))
            }
          />

          <FinanceBlock
            title="Deposit"
            icon={Banknote}
            required={form.deposit_required}
            paid={form.deposit_paid}
            amount={form.deposit_amount}
            currency={form.deposit_currency}
            disabled={disabled}
            onRequired={(value) =>
              setForm((previous) => ({
                ...previous,
                deposit_required: value,
              }))
            }
            onPaid={(value) =>
              setForm((previous) => ({
                ...previous,
                deposit_paid: value,
                deposit_paid_at:
                  value && !previous.deposit_paid_at
                    ? toLocalDateTimeInput(new Date())
                    : previous.deposit_paid_at,
              }))
            }
            onAmount={(value) =>
              setForm((previous) => ({
                ...previous,
                deposit_amount: value,
              }))
            }
            onCurrency={(value) =>
              setForm((previous) => ({
                ...previous,
                deposit_currency: value,
              }))
            }
            dueDate={form.deposit_deadline}
            onDueDate={(value) =>
              setForm((previous) => ({
                ...previous,
                deposit_deadline: value,
              }))
            }
          />

          <div className="rounded-2xl border-2 border-orange-300 bg-[#fffaf4] p-3">
            <div className="flex items-center gap-2">
              <Landmark size={17} className="text-orange-600" />
              <div>
                <h4 className="text-sm font-black text-[#10233f]">Scholarship</h4>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                  Award/support attached to this specific university application.
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              <Field label="Status">
                <input
                  value={form.scholarship_status}
                  disabled={disabled}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      scholarship_status: event.target.value,
                    }))
                  }
                  placeholder="Pending / Awarded / Rejected"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-[1fr_100px] gap-2">
                <Field label="Amount">
                  <input
                    type="number"
                    value={form.scholarship_amount}
                    disabled={disabled}
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
                    disabled={disabled}
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
            </div>
          </div>
        </div>
      </Section>

      <Section title="Portal & Source" subtitle="Where the application came from and where staff manage it.">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Source university">
            <input
              value={form.source_university_name}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  source_university_name: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Portal username">
            <input
              value={form.portal_username}
              disabled={disabled}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  portal_username: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Portal URL" className="md:col-span-2">
            <div className="flex gap-2">
              <input
                value={form.portal_url}
                disabled={disabled}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    portal_url: event.target.value,
                  }))
                }
                placeholder="https://..."
                className={inputClass}
              />

              {form.portal_url ? (
                <button
                  type="button"
                  onClick={() =>
                    window.open(form.portal_url, "_blank", "noopener,noreferrer")
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-700"
                  title="Open portal"
                >
                  <ExternalLink size={16} />
                </button>
              ) : null}
            </div>
          </Field>
        </div>
      </Section>
    </div>
  );
}

function RequirementsTab({
  requirements,
  stats,
  loading,
  savingKeys,
  onAdd,
  onStatusChange,
  onDelete,
}) {
  return (
    <Section
      title="Application Requirements"
      subtitle="Track every condition, missing item, payment or university requirement."
      action={
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-3 py-2 text-xs font-black text-white"
        >
          <Plus size={14} />
          Add Requirement
        </button>
      }
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <CompactStat label="Pending" value={stats.pending} icon={Clock3} />
        <CompactStat
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
        />
        <CompactStat
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          tone={stats.overdue ? "red" : "slate"}
        />
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 text-center">
          <LoaderCircle size={22} className="mx-auto animate-spin text-orange-500" />
        </div>
      ) : null}

      {!loading && requirements.length === 0 ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-orange-300 bg-[#fffaf4] p-7 text-center">
          <CheckCircle2 size={30} className="mx-auto text-orange-400" />
          <h4 className="mt-3 text-base font-black text-[#10233f]">
            No application requirements yet
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            No requirements are configured yet. This is treated as
            <span className="font-black text-[#10233f]"> not assessed</span>,
            not automatically complete.
          </p>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {requirements.map((requirement) => {
          const due = deadlineMeta(requirement.due_date);
          const busy = savingKeys.has(`requirement-${requirement.id}`);

          return (
            <div
              key={requirement.id}
              className="rounded-2xl border-2 border-slate-300 bg-white p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-[#10233f]">
                      {requirement.title}
                    </h4>
                    <RequirementStatus value={requirement.status} />
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                      {requirement.requirement_type}
                    </span>
                  </div>

                  {requirement.description ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {requirement.description}
                    </p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    {due ? <span>{due.label}</span> : null}
                    {requirement.completed_at ? (
                      <span>Completed {formatDate(requirement.completed_at)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {requirement.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        onStatusChange(requirement, "completed")
                      }
                      className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-40"
                    >
                      Complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onStatusChange(requirement, "pending")}
                      className="rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 disabled:opacity-40"
                    >
                      Reopen
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDelete(requirement)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 text-red-700 disabled:opacity-40"
                    title="Delete requirement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function NotesTab({ form, setForm, disabled }) {
  return (
    <Section
      title="Application Intelligence Notes"
      subtitle="Separate counseling, university, offer and private internal context."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <NoteField
          label="Counselor Notes"
          value={form.counselor_notes}
          disabled={disabled}
          onChange={(value) =>
            setForm((previous) => ({
              ...previous,
              counselor_notes: value,
            }))
          }
        />
        <NoteField
          label="University Notes"
          value={form.university_notes}
          disabled={disabled}
          onChange={(value) =>
            setForm((previous) => ({
              ...previous,
              university_notes: value,
            }))
          }
        />
        <NoteField
          label="Offer Notes"
          value={form.offer_notes}
          disabled={disabled}
          onChange={(value) =>
            setForm((previous) => ({
              ...previous,
              offer_notes: value,
            }))
          }
        />
        <NoteField
          label="Internal Notes"
          value={form.internal_notes}
          disabled={disabled}
          onChange={(value) =>
            setForm((previous) => ({
              ...previous,
              internal_notes: value,
            }))
          }
        />
      </div>
    </Section>
  );
}

function HistoryTab({ events, loading, onRefresh }) {
  return (
    <Section
      title="Application Audit History"
      subtitle="Application-specific permanent event trail."
      action={
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-[#10233f]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {events.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-[#fffaf4] p-7 text-center">
          <History size={28} className="mx-auto text-orange-400" />
          <p className="mt-3 text-sm font-black text-[#10233f]">
            No application events recorded yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border-2 border-slate-300 bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[#10233f]">
                    {event.event_label || pretty(event.event_type)}
                  </p>

                  {(event.old_value || event.new_value) ? (
                    <p className="mt-2 text-xs font-semibold text-slate-600">
                      {event.old_value || "—"} → {event.new_value || "—"}
                    </p>
                  ) : null}

                  {event.reason ? (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      {event.reason}
                    </p>
                  ) : null}
                </div>

                <span className="shrink-0 text-xs font-semibold text-slate-500">
                  {formatDateTime(event.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ApplicationSwitcherCard({ application, active, onClick }) {
  const deadline = deadlineMeta(application.submission_deadline);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[250px] max-w-[320px] flex-1 rounded-2xl border-2 p-3 text-left transition ${
        active
          ? "border-orange-500 bg-orange-50 shadow-[0_8px_20px_rgba(249,115,22,0.10)]"
          : "border-slate-300 bg-white hover:border-orange-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            active
              ? "border-orange-400 bg-orange-500 text-white"
              : "border-orange-200 bg-orange-50 text-orange-600"
          }`}
        >
          <GraduationCap size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#10233f]">
            {application.university || "Unnamed application"}
          </p>

          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {[application.program, application.intake]
              .filter(Boolean)
              .join(" · ") || "Program not set"}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge value={application.application_stage} compact />
            <RiskBadge value={application.risk_level} compact />
            {deadline ? <DeadlineBadge meta={deadline} /> : null}
          </div>
        </div>

        <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />
      </div>
    </button>
  );
}

function EmptyWorkspace({ onCreate }) {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-[1.7rem] border-[3px] border-dashed border-orange-300 bg-white p-8 text-center">
      <div>
        <University size={42} className="mx-auto text-orange-400" />
        <h3 className="mt-4 text-xl font-black text-[#10233f]">
          Select or create an application
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Every university application now has its own independent operational
          workspace.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-white"
        >
          Create Application
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, action = null, children }) {
  return (
    <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4 shadow-[0_8px_24px_rgba(15,35,63,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[#10233f]">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-black text-[#10233f]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectField({ label, value, options, onChange, disabled }) {
  return (
    <Field label={label}>
      <select
        value={value}
        disabled={disabled}
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

function DateField({ label, value, onChange, disabled, meta = null }) {
  return (
    <Field label={label}>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {meta ? (
        <div className="mt-1.5">
          <DeadlineBadge meta={meta} />
        </div>
      ) : null}
    </Field>
  );
}

function DateTimeField({ label, value, onChange, disabled }) {
  return (
    <Field label={label}>
      <input
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function ToggleCard({ label, checked, onChange, disabled }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5">
      <span className="text-sm font-black text-[#10233f]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-orange-500"
      />
    </label>
  );
}

function FinanceBlock({
  title,
  icon: Icon,
  required,
  paid,
  amount,
  currency,
  disabled,
  onRequired,
  onPaid,
  onAmount,
  onCurrency,
  dueDate = "",
  onDueDate = null,
}) {
  return (
    <div className="rounded-2xl border-2 border-orange-300 bg-[#fffaf4] p-3">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-orange-600" />
        <div>
          <h4 className="text-sm font-black text-[#10233f]">{title}</h4>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {title === "Application Fee"
              ? "Fee paid to submit the application."
              : "Payment used to secure/confirm the offered seat."}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <ToggleCard
          label="Required"
          checked={required}
          disabled={disabled}
          onChange={onRequired}
        />

        <ToggleCard
          label="Paid"
          checked={paid}
          disabled={disabled || !required}
          onChange={onPaid}
        />

        <div className="grid grid-cols-[1fr_100px] gap-2">
          <Field label="Amount">
            <input
              type="number"
              value={amount}
              disabled={disabled || !required}
              onChange={(event) => onAmount(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Currency">
            <input
              value={currency}
              disabled={disabled || !required}
              onChange={(event) => onCurrency(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {onDueDate ? (
          <Field label="Deposit Deadline">
            <input
              type="date"
              value={dueDate}
              disabled={disabled || !required}
              onChange={(event) => onDueDate(event.target.value)}
              className={inputClass}
            />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

function NoteField({ label, value, onChange, disabled }) {
  return (
    <Field label={label}>
      <textarea
        rows={7}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={textareaClass}
      />
    </Field>
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
      <button type="button" onClick={onClose} className="shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

function OperationalTile({ label, value, tone = "slate" }) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    slate: "border-slate-300 bg-[#fffaf4] text-slate-700",
  };

  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        styles[tone] || styles.slate
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] opacity-75">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-slate-300 bg-white text-[#10233f]",
    orange: "border-orange-400 bg-orange-50 text-orange-800",
    green: "border-emerald-400 bg-emerald-50 text-emerald-800",
    blue: "border-blue-400 bg-blue-50 text-blue-800",
    red: "border-red-400 bg-red-50 text-red-800",
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border-2 p-3 ${tones[tone]}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-lg font-black leading-none">{value}</p>
        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] opacity-75">
          {label}
        </p>
      </div>
    </div>
  );
}

function CompactStat({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-slate-300 bg-[#fffaf4] text-[#10233f]",
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border-2 p-3 ${tones[tone] || tones.slate}`}>
      <Icon size={15} />
      <div className="min-w-0">
        <p className="truncate text-xs font-black">{value}</p>
        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ value, compact = false }) {
  const styles = {
    planning: "border-slate-300 bg-slate-50 text-slate-700",
    preparation: "border-blue-300 bg-blue-50 text-blue-800",
    submitted: "border-violet-300 bg-violet-50 text-violet-800",
    offer: "border-emerald-300 bg-emerald-50 text-emerald-800",
    accepted: "border-orange-400 bg-orange-50 text-orange-800",
    closed: "border-slate-400 bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`rounded-full border font-black uppercase ${
        compact
          ? "px-2 py-0.5 text-[8px]"
          : "px-2.5 py-1 text-[9px]"
      } ${styles[value] || styles.planning}`}
    >
      {pretty(value || "planning")}
    </span>
  );
}

function PriorityBadge({ value }) {
  const styles = {
    low: "border-slate-300 bg-slate-50 text-slate-700",
    normal: "border-blue-300 bg-blue-50 text-blue-800",
    high: "border-orange-400 bg-orange-50 text-orange-800",
    urgent: "border-red-400 bg-red-50 text-red-800",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${styles[value] || styles.normal}`}>
      {pretty(value || "normal")} priority
    </span>
  );
}

function RiskBadge({ value, compact = false }) {
  const styles = {
    low: "border-emerald-300 bg-emerald-50 text-emerald-800",
    medium: "border-amber-300 bg-amber-50 text-amber-800",
    high: "border-orange-400 bg-orange-50 text-orange-800",
    critical: "border-red-400 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`rounded-full border font-black uppercase ${
        compact ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[9px]"
      } ${styles[value] || styles.low}`}
    >
      {pretty(value || "low")} risk
    </span>
  );
}

function DeadlineBadge({ meta }) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-orange-400 bg-orange-50 text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    slate: "border-slate-300 bg-slate-50 text-slate-700",
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${styles[meta.tone] || styles.slate}`}>
      {meta.label}
    </span>
  );
}

function RequirementStatus({ value }) {
  const completed = value === "completed";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
        completed
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-blue-300 bg-blue-50 text-blue-800"
      }`}
    >
      {pretty(value || "pending")}
    </span>
  );
}

function getChangedFields(previous, next) {
  if (!previous || !next) return [];

  const tracked = [
    "country",
    "university",
    "program",
    "intake",
    "application_status",
    "application_stage",
    "offer_status",
    "visa_status",
    "application_priority",
    "risk_level",
    "submission_deadline",
    "next_action",
    "next_action_due",
    "conditional_offer",
    "conditions_completed",
    "deposit_paid",
    "application_fee_paid",
    "scholarship_status",
  ];

  return tracked
    .map((field) => ({
      field,
      oldValue: previous[field] ?? "",
      newValue: next[field] ?? "",
    }))
    .filter(
      (item) => String(item.oldValue) !== String(item.newValue)
    );
}

export default StudentApplicationPanel;
