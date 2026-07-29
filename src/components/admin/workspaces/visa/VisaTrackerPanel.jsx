// VisaTrackerPanel V7 MAXIMUM — Visa Operations Center
// src/components/admin/VisaTrackerPanel.jsx
// Maximum Zaifan Admin OS pass. Preserves the mature V6 Visa OS feature set while
// hardening async reliability, student-context switching, validation, audit writes,
// requirement syncing, archive/restore/delete recovery, and shared-document refresh.
// Zaifan Admin OS functional overhaul:
// - dedicated student_visas case architecture
// - explicit visa-source application selection for multi-application students
// - visa requirements linked to Student Master File documents
// - visa-specific audit history using student_visa_events
// - broader Student OS timeline logging preserved
// - operational milestones, appointments, finance, risk, refusal/reapply, next actions
// - compact full-width workspace; navy/blue surfaces use white text only

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileWarning,
  History,
  Landmark,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Stamp,
  Undo2,
  University,
  WalletCards,
  X,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import StudentNotificationPreviewModal from "../students/StudentNotificationPreviewModal";
import StudentNotificationComposer from "../students/StudentNotificationComposer";
import {
  buildStudentNotification,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../../../../services/studentNotificationService";

const REQUEST_TIMEOUT_MS = 20000;

const VISA_STATUS_OPTIONS = [
  "not_started",
  "visa_processing",
  "biometrics",
  "medical",
  "under_review",
  "visa_approved",
  "rejected",
];

const VISA_STAGE_OPTIONS = [
  "preparation",
  "appointment_booked",
  "biometrics",
  "medical",
  "submitted",
  "embassy_review",
  "decision",
  "closed",
];

const RISK_OPTIONS = ["low", "medium", "high", "critical"];

const DEFAULT_REQUIREMENTS = [
  {
    requirement_name: "Passport",
    requirement_category: "identity",
    document_match_names: ["Passport"],
  },
  {
    requirement_name: "Offer Letter",
    requirement_category: "admission",
    document_match_names: ["Offer Letter", "Offer", "Admission Letter"],
  },
  {
    requirement_name: "Language Evidence",
    requirement_category: "language",
    document_match_names: ["IELTS", "PTE", "English Test", "Language"],
  },
  {
    requirement_name: "Financial Evidence",
    requirement_category: "financial",
    document_match_names: [
      "Financial Documents",
      "Financial Statement",
      "Bank Statement",
    ],
  },
  {
    requirement_name: "Accommodation Evidence",
    requirement_category: "accommodation",
    document_match_names: ["Accommodation", "Housing", "Residence"],
  },
  {
    requirement_name: "Insurance",
    requirement_category: "insurance",
    document_match_names: ["Insurance", "Health Insurance"],
  },
];

const EMPTY_VISA = {
  case_name: "",
  application_id: "",
  source_university_id: "",
  source_university_name: "",
  country: "Italy",

  visa_status: "not_started",
  visa_stage: "preparation",

  visa_center: "",
  embassy_or_consulate: "",
  appointment_reference: "",
  appointment_date: "",
  appointment_time: "",
  appointment_location: "",

  biometrics_date: "",
  medical_date: "",
  submitted_at: "",
  decision_at: "",
  passport_collection_date: "",

  visa_valid_from: "",
  visa_valid_until: "",

  visa_fee_required: false,
  visa_fee_amount: "",
  visa_fee_currency: "EUR",
  visa_fee_paid: false,
  visa_fee_paid_at: "",

  required_funds: "",
  available_funds: "",
  funds_currency: "EUR",
  sponsor_name: "",
  sponsor_relationship: "",
  financial_evidence_status: "",

  accommodation_status: "",
  insurance_status: "",

  risk_level: "low",
  risk_reason: "",

  next_action: "",
  next_action_due: "",

  previous_refusal: false,
  refusal_date: "",
  refusal_reason: "",
  reapply_planned: false,
  appeal_planned: false,

  internal_notes: "",
  embassy_notes: "",
  student_notes: "",

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
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
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

function VisaTrackerPanel({
  student = {},
  sharedApplication = null,
  sharedDocuments = null,
  onSharedDataChange = null,
}) {
  const [applications, setApplications] = useState([]);
  const [visaCases, setVisaCases] = useState([]);
  const [activeVisaId, setActiveVisaId] = useState(null);

  const [form, setForm] = useState(EMPTY_VISA);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_VISA);

  const [documents, setDocuments] = useState(
    Array.isArray(sharedDocuments) ? sharedDocuments : student?.documents || []
  );
  const [requirements, setRequirements] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [savingKeys, setSavingKeys] = useState(() => new Set());

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingNotification, setPendingNotification] = useState(null);
  const [notificationBusy, setNotificationBusy] = useState(false);

  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [requirementDraft, setRequirementDraft] = useState({
    requirement_name: "",
    requirement_category: "general",
    due_date: "",
    notes: "",
  });

  const mountedRef = useRef(true);
  const coreRequestRef = useRef(0);
  const supportRequestRef = useRef(0);
  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const studentType = useMemo(
    () =>
      String(
        student?.student_type ||
          student?.__leadType ||
          student?.type ||
          "inquiry"
      )
        .trim()
        .toLowerCase(),
    [student?.__leadType, student?.student_type, student?.type]
  );
  const hasStudentId = Number.isFinite(numericStudentId);

  const activeVisa = useMemo(
    () =>
      visaCases.find((item) => String(item.id) === String(activeVisaId)) || null,
    [visaCases, activeVisaId]
  );

  const activeApplication = useMemo(
    () =>
      applications.find(
        (item) => String(item.id) === String(form.application_id)
      ) || null,
    [applications, form.application_id]
  );

  const activeVisaApplicationIds = useMemo(
    () =>
      new Set(
        visaCases
          .filter((visa) => !visa.is_archived && visa.application_id)
          .map((visa) => String(visa.application_id))
      ),
    [visaCases]
  );

  const availableApplicationsForNewVisa = useMemo(
    () =>
      applications.filter(
        (application) =>
          !activeVisaApplicationIds.has(String(application.id))
      ),
    [applications, activeVisaApplicationIds]
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

  const withTimeout = async (
    promise,
    message = "Request timed out.",
    timeoutMs = REQUEST_TIMEOUT_MS
  ) => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error(message)),
        timeoutMs
      );
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const normalizeVisa = (record) => ({
    ...EMPTY_VISA,
    ...(record || {}),

    appointment_date: toDateInput(record?.appointment_date),
    biometrics_date: toDateInput(record?.biometrics_date),
    medical_date: toDateInput(record?.medical_date),
    submitted_at: toLocalDateTimeInput(record?.submitted_at),
    decision_at: toLocalDateTimeInput(record?.decision_at),
    passport_collection_date: toDateInput(record?.passport_collection_date),

    visa_valid_from: toDateInput(record?.visa_valid_from),
    visa_valid_until: toDateInput(record?.visa_valid_until),

    visa_fee_paid_at: toLocalDateTimeInput(record?.visa_fee_paid_at),
    next_action_due: toDateInput(record?.next_action_due),
    refusal_date: toDateInput(record?.refusal_date),
  });

  const notifyParent = async (payload = {}) => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await Promise.race([
        Promise.resolve(onSharedDataChange(payload)),
        new Promise((_, reject) =>
          window.setTimeout(
            () => reject(new Error("Student OS refresh timed out.")),
            10000
          )
        ),
      ]);
    } catch (refreshError) {
      console.warn("Visa saved but parent refresh was delayed:", refreshError);
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
    if (!hasStudentId) return;

    try {
      const { error: timelineError } = await withTimeout(
        supabase.from("student_application_timeline").insert({
        student_id: numericStudentId,
        student_type: studentType,
        application_id: applicationId ? String(applicationId) : null,
        event_type: eventType,
        title,
        description,
        old_value: oldValue || null,
        new_value: newValue || null,
      }),
        "Student OS timeline logging timed out.",
        10000
      );

      if (timelineError) {
        console.warn("Student OS timeline event failed:", timelineError);
      }
    } catch (timelineError) {
      console.warn("Student OS timeline event failed:", timelineError);
    }
  };

  const createVisaEvent = async ({
    visaId = null,
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
          .from("student_visa_events")
          .insert({
            student_id: numericStudentId,
            student_type: studentType,
            visa_id: visaId || null,
            application_id: applicationId || null,
            event_type: eventType,
            event_label: eventLabel || eventType,
            old_value: oldValue || null,
            new_value: newValue || null,
            reason,
            metadata,
          })
          .select()
          .single(),
        "Visa audit event timed out.",
        10000
      );

      if (eventError) throw eventError;

      safeSet(() => {
        setEvents((previous) => [data, ...previous].slice(0, 150));
      });

      return data;
    } catch (eventError) {
      console.warn("Visa event failed:", eventError);
      return null;
    }
  };

  const loadCoreData = async () => {
    if (!hasStudentId) {
      safeSet(() => {
        setApplications([]);
        setVisaCases([]);
        setActiveVisaId(null);
        setForm(EMPTY_VISA);
        setSavedSnapshot(EMPTY_VISA);
        setRequirements([]);
        setEvents([]);
        setError("A valid student record is required to open Visa OS.");
      });
      return;
    }

    const requestId = coreRequestRef.current + 1;
    coreRequestRef.current = requestId;

    safeSet(() => {
      setLoading(true);
      setError("");
    });

    try {
      const [applicationsResult, visaResult, documentsResult] =
        await withTimeout(Promise.all([
          supabase
            .from("student_applications")
            .select("*")
            .eq("student_id", numericStudentId)
            .eq("student_type", studentType)
            .order("created_at", { ascending: false }),

          supabase
            .from("student_visas")
            .select("*")
            .eq("student_id", numericStudentId)
            .eq("student_type", studentType)
            .order("created_at", { ascending: false }),

          Array.isArray(sharedDocuments) && sharedDocuments.length
            ? Promise.resolve({ data: sharedDocuments, error: null })
            : supabase
                .from("student_documents")
                .select("*")
                .eq("student_id", numericStudentId)
                .eq("student_type", studentType)
                .order("created_at", { ascending: true }),
        ]), "Visa workspace loading timed out.");

      if (!mountedRef.current || coreRequestRef.current !== requestId) return;

      if (applicationsResult.error) throw applicationsResult.error;
      if (visaResult.error) throw visaResult.error;
      if (documentsResult.error) throw documentsResult.error;

      const apps = applicationsResult.data || [];
      const cases = visaResult.data || [];

      const usedApplicationIds = new Set(
        cases
          .filter((visa) => !visa.is_archived && visa.application_id)
          .map((visa) => String(visa.application_id))
      );

      const preferredAppId =
        (sharedApplication?.id &&
        !usedApplicationIds.has(String(sharedApplication.id))
          ? sharedApplication.id
          : null) ||
        apps.find(
          (item) =>
            !usedApplicationIds.has(String(item.id)) &&
            ["offer_received", "offer_accepted", "enrolled"].includes(
              item.application_status
            )
        )?.id ||
        apps.find((item) => !usedApplicationIds.has(String(item.id)))?.id ||
        "";

      const preferredVisa =
        cases.find((item) => !item.is_archived) || cases[0] || null;

      const initialForm = preferredVisa
        ? normalizeVisa(preferredVisa)
        : {
            ...EMPTY_VISA,
            case_name:
              apps.find((item) => String(item.id) === String(preferredAppId))
                ?.university
                ? `${
                    apps.find(
                      (item) => String(item.id) === String(preferredAppId)
                    )?.university
                  } Visa Case`
                : "New Visa Case",
            application_id: preferredAppId || "",
            source_university_id:
              apps.find((item) => String(item.id) === String(preferredAppId))
                ?.source_university_id || "",
            source_university_name:
              apps.find((item) => String(item.id) === String(preferredAppId))
                ?.source_university_name ||
              apps.find((item) => String(item.id) === String(preferredAppId))
                ?.university ||
              "",
            country:
              apps.find((item) => String(item.id) === String(preferredAppId))
                ?.country || "Italy",
          };

      safeSet(() => {
        setApplications(apps);
        setVisaCases(cases);
        setDocuments(documentsResult.data || []);
        setActiveVisaId(preferredVisa?.id || null);
        setForm(initialForm);
        setSavedSnapshot(initialForm);
      });

      if (preferredVisa?.id) {
        void loadSupportData(preferredVisa.id);
      } else {
        safeSet(() => {
          setRequirements([]);
          setEvents([]);
        });
      }
    } catch (loadError) {
      safeSet(() =>
        setError(loadError.message || "Visa workspace could not be loaded.")
      );
    } finally {
      safeSet(() => setLoading(false));
    }
  };

  const loadSupportData = async (visaId) => {
    if (!visaId) return;

    const requestId = supportRequestRef.current + 1;
    supportRequestRef.current = requestId;

    safeSet(() => setSupportLoading(true));

    try {
      const [requirementsResult, eventsResult] = await withTimeout(Promise.all([
        supabase
          .from("student_visa_requirements")
          .select("*")
          .eq("visa_id", visaId)
          .order("created_at", { ascending: true }),

        supabase
          .from("student_visa_events")
          .select("*")
          .eq("visa_id", visaId)
          .order("created_at", { ascending: false })
          .limit(150),
      ]), "Visa requirements/history loading timed out.");

      if (!mountedRef.current || supportRequestRef.current !== requestId) return;

      if (requirementsResult.error) throw requirementsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      safeSet(() => {
        setRequirements(requirementsResult.data || []);
        setEvents(eventsResult.data || []);
      });
    } catch (supportError) {
      safeSet(() =>
        setError(
          supportError.message || "Visa requirements/history could not be loaded."
        )
      );
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
      coreRequestRef.current += 1;
      supportRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    void loadCoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, studentType]);

  useEffect(() => {
    if (Array.isArray(sharedDocuments)) {
      setDocuments(sharedDocuments);
    }
  }, [sharedDocuments]);

  const selectSourceApplication = (applicationId) => {
    const selected = applications.find(
      (item) => String(item.id) === String(applicationId)
    );

    const linkedVisa = visaCases.find(
      (visa) =>
        !visa.is_archived &&
        visa.application_id &&
        String(visa.application_id) === String(applicationId) &&
        String(visa.id) !== String(activeVisa?.id || "")
    );

    if (linkedVisa) {
      setError(
        `This application is already linked to "${linkedVisa.case_name || linkedVisa.source_university_name || "an active Visa Case"}". Open that case or archive it first.`
      );
      return;
    }

    setError("");

    setForm((previous) => {
      const sourceName =
        selected?.source_university_name || selected?.university || "";

      const shouldAutoName =
        !previous.case_name?.trim() ||
        previous.case_name === "New Visa Case" ||
        previous.case_name === "Visa Case";

      return {
        ...previous,
        case_name: shouldAutoName
          ? sourceName
            ? `${sourceName} Visa Case`
            : "New Visa Case"
          : previous.case_name,
        application_id: applicationId,
        source_university_id: selected?.source_university_id || "",
        source_university_name: sourceName,
        country: selected?.country || "Italy",
      };
    });
  };

  const buildPayload = () => ({
    student_id: numericStudentId,
    student_type: studentType,

    case_name:
      form.case_name?.trim() ||
      form.source_university_name?.trim() ||
      "Visa Case",

    application_id: form.application_id || null,
    source_university_id: form.source_university_id || null,
    source_university_name: form.source_university_name || null,
    country: form.country || "Italy",

    visa_status: form.visa_status || "not_started",
    visa_stage: form.visa_stage || "preparation",

    visa_center: form.visa_center || null,
    embassy_or_consulate: form.embassy_or_consulate || null,
    appointment_reference: form.appointment_reference || null,
    appointment_date: form.appointment_date || null,
    appointment_time: form.appointment_time || null,
    appointment_location: form.appointment_location || null,

    biometrics_date: form.biometrics_date || null,
    medical_date: form.medical_date || null,
    submitted_at: toIsoOrNull(form.submitted_at),
    decision_at: toIsoOrNull(form.decision_at),
    passport_collection_date: form.passport_collection_date || null,

    visa_valid_from: form.visa_valid_from || null,
    visa_valid_until: form.visa_valid_until || null,

    visa_fee_required: Boolean(form.visa_fee_required),
    visa_fee_amount:
      form.visa_fee_amount === "" ? null : Number(form.visa_fee_amount),
    visa_fee_currency: form.visa_fee_currency || "EUR",
    visa_fee_paid: Boolean(form.visa_fee_paid),
    visa_fee_paid_at: toIsoOrNull(form.visa_fee_paid_at),

    required_funds:
      form.required_funds === "" ? null : Number(form.required_funds),
    available_funds:
      form.available_funds === "" ? null : Number(form.available_funds),
    funds_currency: form.funds_currency || "EUR",
    sponsor_name: form.sponsor_name || null,
    sponsor_relationship: form.sponsor_relationship || null,
    financial_evidence_status: form.financial_evidence_status || null,

    accommodation_status: form.accommodation_status || null,
    insurance_status: form.insurance_status || null,

    risk_level: form.risk_level || "low",
    risk_reason: form.risk_reason || null,

    next_action: form.next_action || null,
    next_action_due: form.next_action_due || null,

    previous_refusal: Boolean(form.previous_refusal),
    refusal_date: form.refusal_date || null,
    refusal_reason: form.refusal_reason || null,
    reapply_planned: Boolean(form.reapply_planned),
    appeal_planned: Boolean(form.appeal_planned),

    internal_notes: form.internal_notes || null,
    embassy_notes: form.embassy_notes || null,
    student_notes: form.student_notes || null,

    updated_at: new Date().toISOString(),
  });

  const syncVisaStatusToApplication = async (applicationId, visaStatus) => {
    if (!applicationId) return;

    try {
      const { error: syncError } = await withTimeout(
        supabase
          .from("student_applications")
          .update({
            visa_status: visaStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", applicationId),
        "Application visa-status sync timed out.",
        10000
      );

      if (syncError) {
        console.warn("Application visa summary sync failed:", syncError);
      }
    } catch (syncError) {
      console.warn("Application visa summary sync failed:", syncError);
    }
  };

  const performSaveVisaCase = async () => {
    if (!hasStudentId || savingKeys.size > 0) return;

    if (!form.application_id) {
      setError("Select the university application this Visa Case belongs to before saving.");
      setActiveTab("overview");
      return;
    }

    if (form.visa_valid_from && form.visa_valid_until) {
      const validFrom = new Date(`${form.visa_valid_from}T12:00:00`);
      const validUntil = new Date(`${form.visa_valid_until}T12:00:00`);

      if (
        !Number.isNaN(validFrom.getTime()) &&
        !Number.isNaN(validUntil.getTime()) &&
        validUntil < validFrom
      ) {
        setError("Visa valid-until date cannot be earlier than the valid-from date.");
        setActiveTab("overview");
        return;
      }
    }

    const operationKey = activeVisa?.id ? `save-${activeVisa.id}` : "create-visa";
    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    const payload = buildPayload();

    try {
      let result;

      if (activeVisa?.id) {
        result = await withTimeout(
          supabase
            .from("student_visas")
            .update(payload)
            .eq("id", activeVisa.id)
            .select()
            .single(),
          "Visa case save timed out."
        );
      } else {
        result = await withTimeout(
          supabase.from("student_visas").insert(payload).select().single(),
          "Visa case creation timed out."
        );
      }

      if (result.error) throw result.error;

      const saved = result.data;
      const wasNew = !activeVisa?.id;
      const nextForm = normalizeVisa(saved);

      safeSet(() => {
        setVisaCases((previous) => {
          if (wasNew) return [saved, ...previous];
          return previous.map((item) =>
            String(item.id) === String(saved.id) ? saved : item
          );
        });
        setActiveVisaId(saved.id);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setSuccessMessage(
          wasNew ? "Visa case created." : "Visa case saved."
        );
      });

      await syncVisaStatusToApplication(saved.application_id, saved.visa_status);

      void createVisaEvent({
        visaId: saved.id,
        applicationId: saved.application_id,
        eventType: wasNew ? "visa_case_created" : "visa_case_saved",
        eventLabel: wasNew ? "Visa case created" : "Visa case saved",
        newValue: saved.visa_status,
      });

      void createTimelineEvent({
        applicationId: saved.application_id,
        eventType: wasNew ? "visa_case_created" : "visa_case_saved",
        title: wasNew ? "Visa Case Created" : "Visa Case Saved",
        description: `${saved.source_university_name || "Visa case"} — ${pretty(
          saved.visa_status
        )}.`,
        newValue: saved.visa_status,
      });

      if (wasNew) {
        await seedDefaultRequirements(saved.id);
      }

      void notifyParent({
        source: "visa_case_save",
        visa: saved,
      });
      return saved;
    } catch (saveError) {
      const message = String(saveError?.message || "");

      safeSet(() =>
        setError(
          message.includes("uq_student_visas_active_application")
            ? "This university application already has an active Visa Case. Open that case, or archive it before creating a replacement Visa Case."
            : message || "Visa save failed."
        )
      );
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
                  "Notification security preparation failed. The visa case was not changed.",
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
        setSuccessMessage(delivery.communicationWarning || "Visa case updated and student email sent safely.");
      } else {
        setSuccessMessage("Visa case updated. No email was sent because the student has no email address.");
      }

    } catch (notificationError) {
      setError(notificationError?.message || "The visa case changed, but the student email could not be sent. Review Communication OS before retrying.");
    } finally {
      setNotificationBusy(false);
    }
  };

  const saveVisaCase = async () => {
    const previous = activeVisa || EMPTY_VISA;
    const next = { ...previous, ...buildPayload() };
    const preview = buildStudentNotification({
      domain: "visa",
      student,
      entity: activeVisa || next,
      previous,
      next,
      relatedType: "visa",
      relatedId: activeVisa?.id || null,
    });

    if (!preview) return performSaveVisaCase();
    return openNotificationPreview(preview, performSaveVisaCase);
  };

  const seedDefaultRequirements = async (visaId) => {
    if (!visaId) return;

    const rows = DEFAULT_REQUIREMENTS.map((requirement) => {
      const matchedDocument = findBestDocumentMatch(
        requirement.document_match_names,
        documents
      );

      return {
        visa_id: visaId,
        requirement_name: requirement.requirement_name,
        requirement_category: requirement.requirement_category,
        document_match_names: requirement.document_match_names,
        linked_document_id: matchedDocument?.id || null,
        required: true,
        status: matchedDocument?.status || "missing",
      };
    });

    const { data: existingRows, error: existingError } = await withTimeout(
      supabase
        .from("student_visa_requirements")
        .select("id, requirement_name")
        .eq("visa_id", visaId),
      "Visa requirement check timed out."
    );

    if (existingError) {
      console.warn("Visa requirement seed check failed:", existingError);
      return;
    }

    const existingNames = new Set(
      (existingRows || []).map((item) => normalize(item.requirement_name))
    );

    const missingRows = rows.filter(
      (item) => !existingNames.has(normalize(item.requirement_name))
    );

    if (!missingRows.length) {
      await loadSupportData(visaId);
      return;
    }

    const { data, error: seedError } = await withTimeout(
      supabase
        .from("student_visa_requirements")
        .insert(missingRows)
        .select(),
      "Visa requirement seeding timed out."
    );

    if (seedError) {
      console.warn("Visa requirement seed failed:", seedError);
      return;
    }

    await loadSupportData(visaId);
  };

  const refreshRequirementLinks = async () => {
    if (!activeVisa?.id || savingKeys.size > 0) return;

    const operationKey = `requirements-sync-${activeVisa.id}`;
    startSaving(operationKey);
    setError("");

    try {
      const existingByName = new Map(
        requirements.map((item) => [normalize(item.requirement_name), item])
      );

      for (const base of DEFAULT_REQUIREMENTS) {
        const matchedDocument = findBestDocumentMatch(
          base.document_match_names,
          documents
        );

        const existing = existingByName.get(normalize(base.requirement_name));

        if (existing) {
          const { error: updateError } = await supabase
            .from("student_visa_requirements")
            .update({
              linked_document_id: matchedDocument?.id || null,
              status: matchedDocument?.status || "missing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("student_visa_requirements")
            .insert({
              visa_id: activeVisa.id,
              requirement_name: base.requirement_name,
              requirement_category: base.requirement_category,
              document_match_names: base.document_match_names,
              linked_document_id: matchedDocument?.id || null,
              required: true,
              status: matchedDocument?.status || "missing",
            });

          if (insertError) throw insertError;
        }
      }

      await loadSupportData(activeVisa.id);
      safeSet(() =>
        setSuccessMessage("Visa requirements synced with Student Master File.")
      );
    } catch (syncError) {
      safeSet(() =>
        setError(syncError.message || "Requirement sync failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const addRequirement = async () => {
    if (!activeVisa?.id || !requirementDraft.requirement_name.trim()) return;

    const operationKey = "add-visa-requirement";
    startSaving(operationKey);
    setError("");

    try {
      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_visa_requirements")
          .insert({
            visa_id: activeVisa.id,
            requirement_name: requirementDraft.requirement_name.trim(),
            requirement_category:
              requirementDraft.requirement_category || "general",
            required: true,
            status: "missing",
            due_date: requirementDraft.due_date || null,
            notes: requirementDraft.notes.trim() || null,
          })
          .select()
          .single(),
        "Visa requirement creation timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) => [...previous, data]);
        setRequirementDraft({
          requirement_name: "",
          requirement_category: "general",
          due_date: "",
          notes: "",
        });
        setShowAddRequirement(false);
        setSuccessMessage("Visa requirement added.");
      });

      void createVisaEvent({
        visaId: activeVisa.id,
        applicationId: activeVisa.application_id,
        eventType: "visa_requirement_created",
        eventLabel: "Visa requirement added",
        newValue: data.requirement_name,
      });
    } catch (requirementError) {
      safeSet(() =>
        setError(
          requirementError.message || "Visa requirement could not be added."
        )
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const updateRequirementStatus = async (requirement, status) => {
    if (!requirement?.id) return;

    const operationKey = `requirement-${requirement.id}`;
    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    try {
      const completed = status === "completed";

      const { data, error: requirementError } = await withTimeout(
        supabase
          .from("student_visa_requirements")
          .update({
            status,
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", requirement.id)
          .select()
          .single(),
        "Visa requirement update timed out."
      );

      if (requirementError) throw requirementError;

      safeSet(() => {
        setRequirements((previous) =>
          previous.map((item) => (item.id === requirement.id ? data : item))
        );
      });

      void createVisaEvent({
        visaId: activeVisa?.id,
        applicationId: activeVisa?.application_id,
        eventType: "visa_requirement_status_changed",
        eventLabel: "Visa requirement updated",
        oldValue: requirement.status,
        newValue: status,
        metadata: { requirement_name: requirement.requirement_name },
      });
    } catch (requirementError) {
      safeSet(() =>
        setError(requirementError.message || "Requirement update failed.")
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const archiveVisaCase = async () => {
    if (!activeVisa?.id) return;

    const confirmed = window.confirm(
      `Archive the visa case for ${
        activeVisa.source_university_name || "this application"
      }?`
    );

    if (!confirmed) return;

    const operationKey = `archive-${activeVisa.id}`;
    startSaving(operationKey);

    try {
      const archivedAt = new Date().toISOString();

      const { data, error: archiveError } = await withTimeout(
        supabase
          .from("student_visas")
          .update({
            is_archived: true,
            archived_at: archivedAt,
            updated_at: archivedAt,
          })
          .eq("id", activeVisa.id)
          .select()
          .single(),
        "Visa archive timed out."
      );

      if (archiveError) throw archiveError;

      const nextForm = normalizeVisa(data);

      safeSet(() => {
        setVisaCases((previous) =>
          previous.map((item) => (item.id === data.id ? data : item))
        );
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setSuccessMessage("Visa case archived.");
      });

      void createVisaEvent({
        visaId: data.id,
        applicationId: data.application_id,
        eventType: "visa_case_archived",
        eventLabel: "Visa case archived",
        newValue: data.case_name || data.source_university_name || "Visa Case",
      });

      void notifyParent({ source: "visa_case_archive", visa: data });
    } catch (archiveError) {
      safeSet(() => setError(archiveError.message || "Archive failed."));
    } finally {
      stopSaving(operationKey);
    }
  };

  const restoreVisaCase = async () => {
    if (!activeVisa?.id) return;

    const operationKey = `archive-${activeVisa.id}`;
    startSaving(operationKey);

    try {
      const { data, error: restoreError } = await withTimeout(
        supabase
          .from("student_visas")
          .update({
            is_archived: false,
            archived_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeVisa.id)
          .select()
          .single(),
        "Visa restore timed out."
      );

      if (restoreError) throw restoreError;

      const nextForm = normalizeVisa(data);

      safeSet(() => {
        setVisaCases((previous) =>
          previous.map((item) => (item.id === data.id ? data : item))
        );
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setSuccessMessage("Visa case restored.");
      });

      void createVisaEvent({
        visaId: data.id,
        applicationId: data.application_id,
        eventType: "visa_case_restored",
        eventLabel: "Visa case restored",
        newValue: data.case_name || data.source_university_name || "Visa Case",
      });

      void notifyParent({ source: "visa_case_restore", visa: data });
    } catch (restoreError) {
      const message = String(restoreError?.message || "");
      safeSet(() =>
        setError(
          message.includes("uq_student_visas_active_application")
            ? "This application already has another active Visa Case. Archive that active case before restoring this one."
            : message || "Restore failed."
        )
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const permanentlyDeleteVisaCase = async () => {
    if (!activeVisa?.id || !activeVisa.is_archived) return;

    const confirmed = window.confirm(
      `PERMANENTLY delete "${
        activeVisa.case_name ||
        activeVisa.source_university_name ||
        "this Visa Case"
      }"?\n\nThis is intended only for accidental/test cases. The linked university application and Student Master File documents will NOT be deleted.`
    );

    if (!confirmed) return;

    const operationKey = `delete-visa-${activeVisa.id}`;
    startSaving(operationKey);
    setError("");
    setSuccessMessage("");

    try {
      const deletedVisa = activeVisa;

      // Requirements use ON DELETE CASCADE.
      // Visa events use ON DELETE SET NULL, preserving audit history.
      const { error: deleteError } = await withTimeout(
        supabase
          .from("student_visas")
          .delete()
          .eq("id", activeVisa.id),
        "Permanent Visa Case deletion timed out."
      );

      if (deleteError) throw deleteError;

      const remaining = visaCases.filter(
        (item) => String(item.id) !== String(activeVisa.id)
      );

      const nextActive =
        remaining.find((item) => !item.is_archived) ||
        remaining[0] ||
        null;

      const nextForm = nextActive
        ? normalizeVisa(nextActive)
        : {
            ...EMPTY_VISA,
            case_name: "New Visa Case",
          };

      safeSet(() => {
        setVisaCases(remaining);
        setActiveVisaId(nextActive?.id || null);
        setForm(nextForm);
        setSavedSnapshot(nextForm);
        setRequirements([]);
        setEvents([]);
        setShowArchived(false);
        setSuccessMessage(
          "Archived Visa Case permanently deleted. Its university application is available again."
        );
      });

      void createVisaEvent({
        visaId: null,
        applicationId: deletedVisa.application_id,
        eventType: "visa_case_permanently_deleted",
        eventLabel: "Visa case permanently deleted",
        newValue:
          deletedVisa.case_name ||
          deletedVisa.source_university_name ||
          "Visa Case",
        metadata: {
          deleted_visa_id: deletedVisa.id,
          source_university_name: deletedVisa.source_university_name || null,
        },
      });

      void createTimelineEvent({
        applicationId: deletedVisa.application_id,
        eventType: "visa_case_permanently_deleted",
        title: "Visa Case Permanently Deleted",
        description: `${
          deletedVisa.case_name ||
          deletedVisa.source_university_name ||
          "Visa Case"
        } was permanently deleted. The linked application was preserved.`,
        newValue: "deleted",
      });

      void notifyParent({
        source: "visa_case_delete",
        visaId: deletedVisa.id,
        applicationId: deletedVisa.application_id,
      });
    } catch (deleteError) {
      safeSet(() =>
        setError(
          deleteError.message || "Permanent Visa Case deletion failed."
        )
      );
    } finally {
      stopSaving(operationKey);
    }
  };

  const readiness = useMemo(() => {
    const required = requirements.filter((item) => item.required);
    if (!required.length) return 0;

    const completed = required.filter((item) =>
      ["verified", "completed"].includes(item.status)
    ).length;

    return Math.round((completed / required.length) * 100);
  }, [requirements]);

  const requirementStats = useMemo(() => {
    const total = requirements.length;
    const ready = requirements.filter((item) =>
      ["verified", "completed"].includes(item.status)
    ).length;
    const missing = requirements.filter((item) =>
      ["missing", "rejected"].includes(item.status)
    ).length;
    const review = requirements.filter((item) =>
      ["received", "under_review"].includes(item.status)
    ).length;

    return { total, ready, missing, review };
  }, [requirements]);

  const calculatedRisk = useMemo(() => {
    let score = 10;
    const reasons = [];

    if (!form.application_id) {
      score += 35;
      reasons.push("No visa-source application selected");
    }

    if (
      !["offer_received", "offer_accepted", "enrolled"].includes(
        activeApplication?.application_status
      )
    ) {
      score += 20;
      reasons.push("Linked application is not offer-ready");
    }

    if (requirementStats.missing > 0) {
      score += Math.min(30, requirementStats.missing * 6);
      reasons.push(`${requirementStats.missing} missing/rejected visa requirement(s)`);
    }

    const appointment = deadlineMeta(form.appointment_date);
    if (appointment?.tone === "red" || appointment?.tone === "orange") {
      score += 15;
      reasons.push("Visa appointment is close/overdue");
    }

    if (form.previous_refusal) {
      score += 25;
      reasons.push("Previous visa refusal recorded");
    }

    if (form.risk_level === "critical") score += 25;
    if (form.risk_level === "high") score += 15;

    score = Math.min(100, score);

    return {
      score,
      level:
        score >= 75 ? "Critical" : score >= 55 ? "High" : score >= 30 ? "Medium" : "Low",
      reasons,
    };
  }, [
    form,
    activeApplication?.application_status,
    requirementStats.missing,
  ]);

  const filteredCases = useMemo(() => {
    const query = normalize(search);

    return visaCases.filter((visa) => {
      if (!showArchived && visa.is_archived) return false;
      if (showArchived && !visa.is_archived) return false;

      if (!query) return true;

      return normalize(
        [
          visa.source_university_name,
          visa.country,
          visa.visa_status,
          visa.visa_stage,
          visa.appointment_reference,
        ].join(" ")
      ).includes(query);
    });
  }, [visaCases, showArchived, search]);

  const selectVisaCase = (visa) => {
    if (
      hasUnsavedChanges &&
      !window.confirm("You have unsaved visa changes. Discard them and switch case?")
    ) {
      return;
    }

    const nextForm = normalizeVisa(visa);

    setActiveVisaId(visa.id);
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setActiveTab("overview");
    void loadSupportData(visa.id);
  };

  const beginNewVisaCase = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved visa changes. Discard them and start a new visa case?"
      )
    ) {
      return;
    }

    const availableApps = applications.filter(
      (application) =>
        !activeVisaApplicationIds.has(String(application.id))
    );

    if (!availableApps.length) {
      setError(
        "All current applications already have an active Visa Case. Archive an existing Visa Case first, or create another university application."
      );
      return;
    }

    const preferredApp =
      availableApps.find((item) =>
        ["offer_received", "offer_accepted", "enrolled"].includes(
          item.application_status
        )
      ) || availableApps[0];

    const nextForm = {
      ...EMPTY_VISA,
      case_name: preferredApp?.university
        ? `${preferredApp.university} Visa Case`
        : "New Visa Case",
      application_id: preferredApp?.id || "",
      source_university_id: preferredApp?.source_university_id || "",
      source_university_name:
        preferredApp?.source_university_name || preferredApp?.university || "",
      country: preferredApp?.country || "Italy",
    };

    setError("");
    setActiveVisaId(null);
    setForm(nextForm);
    setSavedSnapshot(nextForm);
    setRequirements([]);
    setEvents([]);
    setActiveTab("overview");
  };

  return (
    <div className="space-y-4 bg-[#fffaf4] p-3 text-[#10233f] sm:p-4 lg:p-5">
      <StudentNotificationPreviewModal
        pending={pendingNotification}
        busy={notificationBusy}
        onCancel={() => !notificationBusy && setPendingNotification(null)}
        onConfirm={confirmPendingNotification}
      />
      {/* COMMAND CENTER */}
      <section className="rounded-[1.7rem] border-[3px] border-orange-500 bg-white p-4 shadow-[0_12px_32px_rgba(121,72,40,0.08)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                Visa OS
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                Student #{studentId || "—"}
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black text-[#10233f]">
              Visa Operations Center
            </h2>

            <p className="mt-1 max-w-3xl text-sm font-medium text-slate-600">
              One visa case, one linked application, one source of truth for readiness,
              appointments, financial evidence, risk and decision tracking.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StudentNotificationComposer
              student={student}
              context="visa"
              buttonLabel="Send Visa Update"
              compact
            />

            {applications.length > 0 &&
            availableApplicationsForNewVisa.length === 0 ? (
              <div className="flex max-w-[310px] flex-col gap-1">
                <button
                  type="button"
                  disabled
                  title="Every current university application already has an active Visa Case."
                  className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-slate-400 bg-slate-100 px-3.5 py-2.5 text-xs font-black text-slate-700"
                >
                  <BadgeCheck size={15} />
                  All Applications Linked
                </button>

                <p className="px-1 text-[10px] font-bold leading-4 text-slate-500">
                  Every application already has an active Visa Case. Archive a
                  case or create another university application to add a new one.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={beginNewVisaCase}
                title="Create a Visa Case for an application without one."
                className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-orange-600"
              >
                <Plus size={15} />
                New Visa Case
              </button>
            )}

            <button
              type="button"
              onClick={loadCoreData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <Metric label="Readiness" value={`${readiness}%`} icon={BadgeCheck} tone="green" />
          <Metric label="Missing" value={requirementStats.missing} icon={FileWarning} tone="red" />
          <Metric label="Review" value={requirementStats.review} icon={FileCheck2} tone="blue" />
          <Metric label="Risk" value={calculatedRisk.level} icon={ShieldAlert} tone={calculatedRisk.level === "Low" ? "green" : calculatedRisk.level === "Medium" ? "orange" : "red"} />
          <Metric label="Appointment" value={form.appointment_date ? formatDate(form.appointment_date) : "Not set"} icon={CalendarClock} tone="orange" />
          <Metric label="Status" value={pretty(form.visa_status)} icon={Stamp} tone="slate" />
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

      {/* CASE SWITCHER */}
      {visaCases.length > 0 ? (
        <section className="rounded-[1.5rem] border-[3px] border-orange-300 bg-white p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find visa case..."
                className="h-10 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:border-orange-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
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

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filteredCases.map((visa) => (
              <VisaCaseCard
                key={visa.id}
                visa={visa}
                active={String(visa.id) === String(activeVisaId)}
                onClick={() => selectVisaCase(visa)}
              />
            ))}

            {!filteredCases.length ? (
              <div className="min-w-full rounded-xl border-2 border-dashed border-slate-300 bg-[#fffaf4] px-4 py-4 text-center text-xs font-bold text-slate-500">
                {search
                  ? "No Visa Cases match this search."
                  : showArchived
                  ? "No archived Visa Cases."
                  : "No active Visa Cases."}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ACTIVE CASE HEADER */}
      <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <StatusBadge value={form.visa_stage} />
              <RiskBadge value={calculatedRisk.level} />
              {activeVisa?.is_archived ? (
                <span className="rounded-full border border-slate-400 bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-700">
                  Archived
                </span>
              ) : null}
            </div>

            <h3 className="mt-3 truncate text-2xl font-black text-[#10233f]">
              {form.case_name || form.source_university_name || "New Visa Case"}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {activeApplication
                ? `${activeApplication.program || "Program not set"} · ${
                    activeApplication.country || form.country || "Italy"
                  }`
                : "Select the application this visa case belongs to."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                Unsaved changes
              </span>
            ) : null}

            {activeVisa?.is_archived ? (
              <>
                <button
                  type="button"
                  onClick={restoreVisaCase}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800"
                >
                  <RotateCcw size={14} />
                  Restore
                </button>

                <button
                  type="button"
                  onClick={permanentlyDeleteVisaCase}
                  disabled={savingKeys.size > 0}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-red-500 bg-red-50 px-3 py-2 text-xs font-black text-red-800 disabled:opacity-50"
                >
                  <X size={14} />
                  Delete Permanently
                </button>
              </>
            ) : activeVisa?.id ? (
              <button
                type="button"
                onClick={archiveVisaCase}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-400 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
              >
                <Archive size={14} />
                Archive
              </button>
            ) : null}

            <button
              type="button"
              onClick={saveVisaCase}
              disabled={savingKeys.size > 0}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-700 bg-orange-500 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {savingKeys.size > 0 ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {activeVisa?.id ? "Save Visa Case" : "Create Named Visa Case"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <CompactStat label="Readiness" value={`${readiness}%`} icon={BadgeCheck} />
          <CompactStat label="Requirements" value={`${requirementStats.ready}/${requirementStats.total}`} icon={FileCheck2} />
          <CompactStat
            label="Next Action"
            value={form.next_action_due ? deadlineMeta(form.next_action_due)?.label || formatDate(form.next_action_due) : "Not scheduled"}
            icon={Clock3}
          />
          <CompactStat
            label="Risk Score"
            value={`${calculatedRisk.score}/100`}
            icon={ShieldAlert}
            tone={calculatedRisk.score >= 55 ? "red" : calculatedRisk.score >= 30 ? "orange" : "slate"}
          />
        </div>
      </section>

      {/* TABS */}
      <div className="grid grid-cols-2 gap-2 rounded-[1.3rem] border-[3px] border-orange-300 bg-white p-2 sm:grid-cols-4">
        {[
          ["overview", "Overview"],
          ["requirements", `Requirements (${requirementStats.missing})`],
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
                : "border-slate-300 bg-white text-slate-600"
            }`}
            style={{ color: activeTab === value ? "#ffffff" : undefined }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <OverviewTab
          form={form}
          setForm={setForm}
          applications={applications}
          activeApplication={activeApplication}
          onSourceApplicationChange={selectSourceApplication}
          calculatedRisk={calculatedRisk}
          visaCases={visaCases}
          activeVisa={activeVisa}
        />
      ) : null}

      {activeTab === "requirements" ? (
        <RequirementsTab
          requirements={requirements}
          documents={documents}
          loading={supportLoading}
          savingKeys={savingKeys}
          onAdd={() => setShowAddRequirement(true)}
          onSync={refreshRequirementLinks}
          onStatusChange={updateRequirementStatus}
        />
      ) : null}

      {activeTab === "notes" ? (
        <NotesTab form={form} setForm={setForm} />
      ) : null}

      {activeTab === "history" ? (
        <HistoryTab
          events={events}
          loading={supportLoading}
          onRefresh={() => activeVisa?.id && loadSupportData(activeVisa.id)}
        />
      ) : null}

      {/* ADD REQUIREMENT */}
      {showAddRequirement ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[1.6rem] border-[3px] border-orange-400 bg-[#fffaf4] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                  Visa Requirement
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
              <Field label="Requirement name" className="sm:col-span-2">
                <input
                  value={requirementDraft.requirement_name}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      requirement_name: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Category">
                <input
                  value={requirementDraft.requirement_category}
                  onChange={(event) =>
                    setRequirementDraft((previous) => ({
                      ...previous,
                      requirement_category: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
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

              <Field label="Notes" className="sm:col-span-2">
                <textarea
                  rows={4}
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
                disabled={!requirementDraft.requirement_name.trim()}
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
  "h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const textareaClass =
  "w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function OverviewTab({
  form,
  setForm,
  applications,
  activeApplication,
  onSourceApplicationChange,
  calculatedRisk,
  visaCases,
  activeVisa,
}) {
  return (
    <div className="space-y-4">
      <Section
        title="Visa Source Application"
        subtitle="Name this case clearly, then choose exactly which university application/offer it belongs to."
      >
        <div className="mb-3">
          <Field label="Visa case name">
            <input
              value={form.case_name || ""}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  case_name: event.target.value,
                }))
              }
              placeholder="e.g. Bologna September 2027 Visa Case"
              className={inputClass}
            />
          </Field>
          <p className="mt-1.5 text-xs font-semibold text-slate-500">
            This is only the internal case label. You can rename it anytime without changing the linked application.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <Field label="Linked application">
            <select
              value={form.application_id || ""}
              onChange={(event) => onSourceApplicationChange(event.target.value)}
              className={inputClass}
            >
              <option value="">Select application...</option>
              {applications.map((application) => {
                const linkedVisa = visaCases.find(
                  (visa) =>
                    !visa.is_archived &&
                    visa.application_id &&
                    String(visa.application_id) === String(application.id) &&
                    String(visa.id) !== String(activeVisa?.id || "")
                );

                return (
                  <option
                    key={application.id}
                    value={application.id}
                    disabled={Boolean(linkedVisa)}
                  >
                    {application.university || "Unnamed application"} —{" "}
                    {application.program || "Program not set"} —{" "}
                    {pretty(application.application_status)}
                    {linkedVisa
                      ? ` — Already linked to ${
                          linkedVisa.case_name ||
                          linkedVisa.source_university_name ||
                          "active Visa Case"
                        }`
                      : ""}
                  </option>
                );
              })}
            </select>
            <p className="mt-1.5 text-xs font-semibold text-slate-500">
              One active Visa Case is allowed per university application. Used applications are disabled until their current Visa Case is archived.
            </p>
          </Field>

          <div className="rounded-2xl border-2 border-orange-300 bg-[#fffaf4] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">
              Linked Offer Context
            </p>
            <p className="mt-2 text-sm font-black text-[#10233f]">
              {activeApplication?.university || "No application selected"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Application: {pretty(activeApplication?.application_status || "not_started")} ·
              Offer: {pretty(activeApplication?.offer_status || "pending")}
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Visa Journey"
        subtitle="The actual visa stage and decision state."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Visa stage"
            value={form.visa_stage}
            options={VISA_STAGE_OPTIONS}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, visa_stage: value }))
            }
          />

          <SelectField
            label="Visa status"
            value={form.visa_status}
            options={VISA_STATUS_OPTIONS}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, visa_status: value }))
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
        </div>

        <div className="mt-4 rounded-2xl border-2 border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldAlert size={17} className="text-orange-600" />
            <h4 className="text-sm font-black text-[#10233f]">
              Operational Risk Intelligence
            </h4>
            <RiskBadge value={calculatedRisk.level} />
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            Score: {calculatedRisk.score}/100
          </p>

          {calculatedRisk.reasons.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {calculatedRisk.reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-800"
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No major visa risk detected.
            </p>
          )}
        </div>

        <Field label="Risk reason / counselor assessment">
          <textarea
            rows={3}
            value={form.risk_reason}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                risk_reason: event.target.value,
              }))
            }
            className={textareaClass}
          />
        </Field>
      </Section>

      <Section
        title="Appointment & Submission"
        subtitle="Visa center, appointment, biometrics, submission and passport collection."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Visa center">
            <input
              value={form.visa_center}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  visa_center: event.target.value,
                }))
              }
              placeholder="VFS / BLS / Embassy"
              className={inputClass}
            />
          </Field>

          <Field label="Embassy / Consulate">
            <input
              value={form.embassy_or_consulate}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  embassy_or_consulate: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Appointment reference">
            <input
              value={form.appointment_reference}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  appointment_reference: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <DateField
            label="Appointment date"
            value={form.appointment_date}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, appointment_date: value }))
            }
          />

          <Field label="Appointment time">
            <input
              type="time"
              value={form.appointment_time || ""}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  appointment_time: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Appointment location">
            <input
              value={form.appointment_location}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  appointment_location: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <DateField
            label="Biometrics date"
            value={form.biometrics_date}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, biometrics_date: value }))
            }
          />

          <DateField
            label="Medical date"
            value={form.medical_date}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, medical_date: value }))
            }
          />

          <DateTimeField
            label="Submitted at"
            value={form.submitted_at}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, submitted_at: value }))
            }
          />

          <DateTimeField
            label="Decision at"
            value={form.decision_at}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, decision_at: value }))
            }
          />

          <DateField
            label="Passport collection date"
            value={form.passport_collection_date}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,
                passport_collection_date: value,
              }))
            }
          />
        </div>
      </Section>

      <Section
        title="Financial Readiness"
        subtitle="Visa-specific money evidence, sponsor information and visa fee."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border-2 border-orange-300 bg-[#fffaf4] p-4">
            <div className="flex items-center gap-2">
              <WalletCards size={17} className="text-orange-600" />
              <h4 className="text-sm font-black text-[#10233f]">Visa Fee</h4>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ToggleCard
                label="Fee required"
                checked={form.visa_fee_required}
                onChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    visa_fee_required: checked,
                  }))
                }
              />

              <ToggleCard
                label="Fee paid"
                checked={form.visa_fee_paid}
                onChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    visa_fee_paid: checked,
                    visa_fee_paid_at:
                      checked && !previous.visa_fee_paid_at
                        ? toLocalDateTimeInput(new Date())
                        : previous.visa_fee_paid_at,
                  }))
                }
              />

              <Field label="Amount">
                <input
                  type="number"
                  value={form.visa_fee_amount}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      visa_fee_amount: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <input
                  value={form.visa_fee_currency}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      visa_fee_currency: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-orange-300 bg-[#fffaf4] p-4">
            <div className="flex items-center gap-2">
              <Landmark size={17} className="text-orange-600" />
              <h4 className="text-sm font-black text-[#10233f]">
                Financial Evidence
              </h4>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Required funds">
                <input
                  type="number"
                  value={form.required_funds}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      required_funds: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Available funds">
                <input
                  type="number"
                  value={form.available_funds}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      available_funds: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Currency">
                <input
                  value={form.funds_currency}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      funds_currency: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Evidence status">
                <input
                  value={form.financial_evidence_status}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      financial_evidence_status: event.target.value,
                    }))
                  }
                  placeholder="Missing / Review / Verified"
                  className={inputClass}
                />
              </Field>

              <Field label="Sponsor name">
                <input
                  value={form.sponsor_name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      sponsor_name: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Sponsor relationship">
                <input
                  value={form.sponsor_relationship}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      sponsor_relationship: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Other Visa Readiness"
        subtitle="Accommodation, insurance and internal next action."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Accommodation status">
            <input
              value={form.accommodation_status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  accommodation_status: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Insurance status">
            <input
              value={form.insurance_status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  insurance_status: event.target.value,
                }))
              }
              className={inputClass}
            />
          </Field>

          <DateField
            label="Next action due"
            value={form.next_action_due}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, next_action_due: value }))
            }
          />

          <Field label="Next action" className="md:col-span-2 xl:col-span-3">
            <textarea
              rows={3}
              value={form.next_action}
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

      <Section
        title="Decision / Refusal"
        subtitle="Final visa validity or refusal/reapplication handling."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <DateField
            label="Visa valid from"
            value={form.visa_valid_from}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, visa_valid_from: value }))
            }
          />

          <DateField
            label="Visa valid until"
            value={form.visa_valid_until}
            onChange={(value) =>
              setForm((previous) => ({ ...previous, visa_valid_until: value }))
            }
          />

          <ToggleCard
            label="Previous refusal"
            checked={form.previous_refusal}
            onChange={(checked) =>
              setForm((previous) => ({
                ...previous,
                previous_refusal: checked,
              }))
            }
          />

          {form.previous_refusal ? (
            <>
              <DateField
                label="Refusal date"
                value={form.refusal_date}
                onChange={(value) =>
                  setForm((previous) => ({ ...previous, refusal_date: value }))
                }
              />

              <ToggleCard
                label="Reapply planned"
                checked={form.reapply_planned}
                onChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    reapply_planned: checked,
                  }))
                }
              />

              <ToggleCard
                label="Appeal planned"
                checked={form.appeal_planned}
                onChange={(checked) =>
                  setForm((previous) => ({
                    ...previous,
                    appeal_planned: checked,
                  }))
                }
              />

              <Field label="Refusal reason" className="md:col-span-2 xl:col-span-3">
                <textarea
                  rows={4}
                  value={form.refusal_reason}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      refusal_reason: event.target.value,
                    }))
                  }
                  className={textareaClass}
                />
              </Field>
            </>
          ) : null}
        </div>
      </Section>
    </div>
  );
}

function RequirementsTab({
  requirements,
  documents,
  loading,
  savingKeys,
  onAdd,
  onSync,
  onStatusChange,
}) {
  return (
    <Section
      title="Visa Requirements"
      subtitle="These requirements are linked to Student Master File documents instead of duplicating file storage."
      action={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSync}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0b2a57] bg-[#0b2a57] px-3 py-2 text-xs font-black"
            style={{ color: "#ffffff" }}
          >
            <RefreshCw size={14} style={{ color: "#ffffff" }} />
            <span style={{ color: "#ffffff" }}>Sync Master File</span>
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-3 py-2 text-xs font-black text-white"
          >
            <Plus size={14} />
            Add Requirement
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-5 text-center">
          <LoaderCircle size={22} className="mx-auto animate-spin text-orange-500" />
        </div>
      ) : null}

      {!loading && requirements.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-[#fffaf4] p-7 text-center">
          <FileCheck2 size={30} className="mx-auto text-orange-400" />
          <p className="mt-3 text-sm font-black text-[#10233f]">
            No visa requirements yet
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {requirements.map((requirement) => {
          const linkedDocument = documents.find(
            (item) =>
              requirement.linked_document_id &&
              String(item.id) === String(requirement.linked_document_id)
          );
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
                      {requirement.requirement_name}
                    </h4>

                    <RequirementStatus value={requirement.status} />

                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                      {requirement.requirement_category}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {linkedDocument
                      ? `Linked: ${linkedDocument.document_name}`
                      : "No matching Master File document linked yet."}
                  </p>

                  {requirement.due_date ? (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Due: {formatDate(requirement.due_date)}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {requirement.status !== "completed" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onStatusChange(requirement, "completed")}
                      className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-40"
                    >
                      Complete
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onStatusChange(requirement, "missing")}
                      className="rounded-xl border-2 border-blue-400 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 disabled:opacity-40"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function NotesTab({ form, setForm }) {
  return (
    <Section
      title="Visa Notes"
      subtitle="Keep embassy, student-facing and internal context separate."
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <NoteField
          label="Internal Notes"
          value={form.internal_notes}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, internal_notes: value }))
          }
        />
        <NoteField
          label="Embassy Notes"
          value={form.embassy_notes}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, embassy_notes: value }))
          }
        />
        <NoteField
          label="Student Notes"
          value={form.student_notes}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, student_notes: value }))
          }
        />
      </div>
    </Section>
  );
}

function HistoryTab({ events, loading, onRefresh }) {
  return (
    <Section
      title="Visa Audit History"
      subtitle="Permanent visa-case operational history."
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
            No visa events recorded yet
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

function VisaCaseCard({ visa, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[250px] rounded-2xl border-2 p-3 text-left transition ${
        active
          ? "border-orange-500 bg-orange-50"
          : "border-slate-300 bg-white hover:border-orange-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-600">
          <Stamp size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#10233f]">
            {visa.case_name || visa.source_university_name || "Visa Case"}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {pretty(visa.visa_status)}
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge value={visa.visa_stage} compact />
            <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase text-slate-600">
              {visa.country || "Italy"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function findBestDocumentMatch(names, documents) {
  const candidates = (documents || []).filter((document) => !document.is_deleted);

  const scored = candidates
    .map((document) => {
      const documentName = normalize(document.document_name);
      const originalName = normalize(document.original_file_name);

      const matched = names.some((name) => {
        const normalizedName = normalize(name);
        return (
          documentName.includes(normalizedName) ||
          originalName.includes(normalizedName)
        );
      });

      if (!matched) return null;

      const statusScore =
        document.status === "verified"
          ? 4
          : document.status === "received"
          ? 3
          : document.status === "under_review"
          ? 2
          : 1;

      return { document, statusScore };
    })
    .filter(Boolean)
    .sort((a, b) => b.statusScore - a.statusScore);

  return scored[0]?.document || null;
}

function Section({ title, subtitle, action = null, children }) {
  return (
    <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4 sm:p-5">
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

function SelectField({ label, value, options, onChange }) {
  return (
    <Field label={label}>
      <select
        value={value}
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function DateTimeField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </Field>
  );
}

function ToggleCard({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5">
      <span className="text-sm font-black text-[#10233f]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-orange-500"
      />
    </label>
  );
}

function NoteField({ label, value, onChange }) {
  return (
    <Field label={label}>
      <textarea
        rows={8}
        value={value}
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
      <button type="button" onClick={onClose}>
        <X size={16} />
      </button>
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
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
        tones[tone] || tones.slate
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/70">
        <Icon size={16} />
      </span>

      <div className="min-w-0">
        <p className="truncate text-sm font-black">{value}</p>
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
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
        tones[tone] || tones.slate
      }`}
    >
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
  return (
    <span
      className={`rounded-full border border-orange-300 bg-orange-50 font-black uppercase text-orange-800 ${
        compact ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[9px]"
      }`}
    >
      {pretty(value || "preparation")}
    </span>
  );
}

function RiskBadge({ value }) {
  const normalized = normalize(value);

  const style =
    normalized.includes("critical") || normalized.includes("high")
      ? "border-red-400 bg-red-50 text-red-800"
      : normalized.includes("medium")
      ? "border-orange-400 bg-orange-50 text-orange-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${style}`}>
      {pretty(value || "Low")} Risk
    </span>
  );
}

function RequirementStatus({ value }) {
  const normalized = normalize(value);

  const style =
    normalized === "verified" || normalized === "completed"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : normalized === "received" || normalized === "under review"
      ? "border-blue-300 bg-blue-50 text-blue-800"
      : normalized === "rejected"
      ? "border-red-300 bg-red-50 text-red-800"
      : "border-amber-300 bg-amber-50 text-amber-800";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${style}`}>
      {pretty(value || "missing")}
    </span>
  );
}

export default VisaTrackerPanel;
