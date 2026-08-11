// StudentApplicationPanel PARTNER OS EXTREME V5 — Italy Application Journey
// Full operational upgrade:
// - Italy-first plan → preparation → submission → university review → decision → Universitaly pre-enrolment → enrollment workflow
// - complete quick-action command rail with safe status/stage milestone updates
// - explicit Student View preview so internal notes, risk and portal credentials stay private
// - richer empty state, live journey progress and student-safe application requirements
// - preserves existing Supabase CRUD, notifications, audit history, timeline, archive, restore and portfolio logic
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
// - document-type application requirements bridge into student_document_requirements
// - existing document requirements backfill automatically when the application workspace opens
// - verified/rejected document decisions can now drive application-requirement completion safely

import { useEffect, useMemo, useRef, useState } from "react";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";
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
  "preparing",
  "documents_pending",
  "documents_received",
  "ready_to_submit",
  "submitted",
  "applied",
  "under_review",
  "interview_scheduled",
  "admission_test",
  "waitlisted",
  "conditional_admission",
  "offer_received",
  "admitted",
  "offer_accepted",
  "pre_enrollment_started",
  "pre_enrollment_submitted",
  "pre_enrollment_validated",
  "enrollment_pending",
  "enrolled",
  "deferred",
  "withdrawn",
  "rejected",
];

const APPLICATION_STAGE_OPTIONS = [
  "planning",
  "preparation",
  "submission",
  "submitted",
  "university_review",
  "decision",
  "pre_enrollment",
  "enrollment",
  "closed",
];

const OFFER_STATUS_OPTIONS = [
  "pending",
  "under_review",
  "waitlisted",
  "conditional_offer",
  "offer_received",
  "admitted",
  "offer_accepted",
  "declined",
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

const ITALY_APPLICATION_JOURNEY = [
  {
    id: "planning",
    label: "Plan",
    description: "University, programme and intake confirmed.",
    statuses: ["not_started"],
    stages: ["planning"],
  },
  {
    id: "preparation",
    label: "Prepare",
    description: "Documents, fees and submission details being prepared.",
    statuses: [
      "preparing",
      "documents_pending",
      "documents_received",
      "ready_to_submit",
    ],
    stages: ["preparation"],
  },
  {
    id: "submission",
    label: "Submit",
    description: "Application submitted through the university channel.",
    statuses: ["submitted", "applied"],
    stages: ["submission", "submitted"],
  },
  {
    id: "review",
    label: "University Review",
    description: "University assessment, interview or admission test.",
    statuses: ["under_review", "interview_scheduled", "admission_test"],
    stages: ["university_review"],
  },
  {
    id: "decision",
    label: "Decision",
    description: "Admission, conditional offer, waitlist or rejection.",
    statuses: [
      "waitlisted",
      "conditional_admission",
      "offer_received",
      "admitted",
      "offer_accepted",
      "rejected",
      "withdrawn",
      "deferred",
    ],
    stages: ["decision"],
  },
  {
    id: "pre_enrollment",
    label: "Pre-enrolment",
    description: "Universitaly pre-enrolment submitted and validated.",
    statuses: [
      "pre_enrollment_started",
      "pre_enrollment_submitted",
      "pre_enrollment_validated",
    ],
    stages: ["pre_enrollment"],
  },
  {
    id: "enrollment",
    label: "Enrollment",
    description: "Final university enrollment or matriculation.",
    statuses: ["enrollment_pending", "enrolled"],
    stages: ["enrollment"],
  },
];

const APPLICATION_QUICK_ACTIONS = [
  {
    id: "ready_to_submit",
    label: "Ready to Submit",
    tone: "orange",
    helper: "Preparation complete",
  },
  {
    id: "submitted",
    label: "Mark Submitted",
    tone: "blue",
    helper: "University application sent",
  },
  {
    id: "under_review",
    label: "Under Review",
    tone: "blue",
    helper: "University assessment started",
  },
  {
    id: "conditional_offer",
    label: "Conditional Admission",
    tone: "green",
    helper: "Decision with conditions",
  },
  {
    id: "offer_received",
    label: "Offer Received",
    tone: "green",
    helper: "Admission letter received",
  },
  {
    id: "admitted",
    label: "Admitted",
    tone: "green",
    helper: "Admission confirmed",
  },
  {
    id: "offer_accepted",
    label: "Accept Admission",
    tone: "orange",
    helper: "Student accepted the place",
  },
  {
    id: "pre_enrollment_started",
    label: "Start Pre-enrolment",
    tone: "violet",
    helper: "Universitaly preparation started",
  },
  {
    id: "pre_enrollment_submitted",
    label: "Universitaly Submitted",
    tone: "violet",
    helper: "Pre-enrolment sent",
  },
  {
    id: "pre_enrollment_validated",
    label: "Pre-enrolment Validated",
    tone: "violet",
    helper: "University validation received",
  },
  {
    id: "enrolled",
    label: "Mark Enrolled",
    tone: "green",
    helper: "Final enrollment complete",
  },
  {
    id: "waitlisted",
    label: "Waitlisted",
    tone: "slate",
    helper: "Decision pending a place",
  },
  {
    id: "rejected",
    label: "Rejected",
    tone: "red",
    helper: "University declined",
  },
  {
    id: "withdrawn",
    label: "Withdrawn",
    tone: "red",
    helper: "Application closed by choice",
  },
];

const workflowPatchForAction = (action, nowIso = new Date().toISOString()) => {
  switch (action) {
    case "ready_to_submit":
      return {
        application_stage: "preparation",
        application_status: "ready_to_submit",
      };
    case "submitted":
      return {
        application_stage: "submitted",
        application_status: "submitted",
        submitted_at: nowIso,
      };
    case "under_review":
      return {
        application_stage: "university_review",
        application_status: "under_review",
      };
    case "conditional_offer":
      return {
        application_stage: "decision",
        application_status: "conditional_admission",
        offer_status: "conditional_offer",
        conditional_offer: true,
        offer_received_at: nowIso,
        decision_at: nowIso,
      };
    case "offer_received":
      return {
        application_stage: "decision",
        application_status: "offer_received",
        offer_status: "offer_received",
        offer_received_at: nowIso,
        decision_at: nowIso,
      };
    case "admitted":
      return {
        application_stage: "decision",
        application_status: "admitted",
        offer_status: "admitted",
        offer_received_at: nowIso,
        decision_at: nowIso,
      };
    case "offer_accepted":
      return {
        application_stage: "pre_enrollment",
        application_status: "offer_accepted",
        offer_status: "offer_accepted",
        offer_accepted_at: nowIso,
      };
    case "pre_enrollment_started":
      return {
        application_stage: "pre_enrollment",
        application_status: "pre_enrollment_started",
      };
    case "pre_enrollment_submitted":
      return {
        application_stage: "pre_enrollment",
        application_status: "pre_enrollment_submitted",
      };
    case "pre_enrollment_validated":
      return {
        application_stage: "pre_enrollment",
        application_status: "pre_enrollment_validated",
      };
    case "enrolled":
      return {
        application_stage: "enrollment",
        application_status: "enrolled",
      };
    case "waitlisted":
      return {
        application_stage: "decision",
        application_status: "waitlisted",
        offer_status: "waitlisted",
        decision_at: nowIso,
      };
    case "rejected":
      return {
        application_stage: "closed",
        application_status: "rejected",
        offer_status: "rejected",
        decision_at: nowIso,
      };
    case "withdrawn":
      return {
        application_stage: "closed",
        application_status: "withdrawn",
        offer_status: "declined",
        decision_at: nowIso,
      };
    default:
      return null;
  }
};

const APPLICATION_WORKFLOW_NOTIFICATION_COPY = {
  ready_to_submit: {
    eventType: "application_ready_to_submit",
    eventLabel: "Application ready to submit",
    subject: "Your university application is ready for final submission",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} is marked ready to submit. Please check your Student Portal and respond quickly if Zaifan requests a final confirmation.`,
    trigger: "Application moved to Ready to Submit",
  },
  submitted: {
    eventType: "application_submitted",
    eventLabel: "Application submitted",
    subject: "Your university application has been submitted",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} has been marked as submitted. You can follow the next milestone from your Student Portal.`,
    trigger: "Application moved to Submitted",
  },
  under_review: {
    eventType: "application_under_review",
    eventLabel: "Application under review",
    subject: "Your application is under university review",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} is now under review. No action is required unless Zaifan publishes a new requirement or contacts you.`,
    trigger: "Application moved to Under Review",
  },
  conditional_offer: {
    eventType: "conditional_admission",
    eventLabel: "Conditional admission recorded",
    subject: "Conditional admission update",
    message: ({ university, program }) =>
      `A conditional admission has been recorded for your ${program} application at ${university}. Please open your Student Portal and complete every published condition before the deadline.`,
    trigger: "Application moved to Conditional Admission",
  },
  offer_received: {
    eventType: "offer_received",
    eventLabel: "Offer received",
    subject: "A university offer has been received",
    message: ({ university, program }) =>
      `Good news — an offer has been recorded for your ${program} application at ${university}. Please review the Student Portal for the offer details and next action.`,
    trigger: "Application moved to Offer Received",
  },
  admitted: {
    eventType: "application_admitted",
    eventLabel: "Admission confirmed",
    subject: "Your university admission is confirmed",
    message: ({ university, program }) =>
      `Admission has been confirmed for your ${program} application at ${university}. Please review the admission letter, acceptance deadline and any required payment in your Student Portal.`,
    trigger: "Application moved to Admitted",
  },
  offer_accepted: {
    eventType: "offer_accepted",
    eventLabel: "Admission accepted",
    subject: "Your university place has been accepted",
    message: ({ university, program }) =>
      `Your place for ${program} at ${university} has been marked as accepted. The next major step is Universitaly pre-enrolment.`,
    trigger: "Application moved to Offer Accepted",
  },
  pre_enrollment_started: {
    eventType: "pre_enrollment_started",
    eventLabel: "Pre-enrolment started",
    subject: "Universitaly pre-enrolment has started",
    message: ({ university, program }) =>
      `Universitaly pre-enrolment preparation has started for your ${program} application at ${university}. Please check your Student Portal for any document or confirmation required from you.`,
    trigger: "Application moved to Pre-enrolment Started",
  },
  pre_enrollment_submitted: {
    eventType: "pre_enrollment_submitted",
    eventLabel: "Universitaly submitted",
    subject: "Universitaly pre-enrolment has been submitted",
    message: ({ university, program }) =>
      `Universitaly pre-enrolment has been submitted for your ${program} application at ${university}. The case is now waiting for university validation.`,
    trigger: "Application moved to Universitaly Submitted",
  },
  pre_enrollment_validated: {
    eventType: "pre_enrollment_validated",
    eventLabel: "Pre-enrolment validated",
    subject: "Universitaly pre-enrolment is validated",
    message: ({ university, program }) =>
      `The university has validated Universitaly pre-enrolment for your ${program} application at ${university}. Please continue with the visa preparation shown in your Student Portal.`,
    trigger: "Application moved to Pre-enrolment Validated",
  },
  enrolled: {
    eventType: "application_enrolled",
    eventLabel: "Enrollment complete",
    subject: "Your university enrollment milestone is complete",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} has reached the enrolled milestone in Zaifan OS. Please review the remaining arrival, fee, housing and student-registration steps in your Student Portal.`,
    trigger: "Application moved to Enrolled",
  },
  waitlisted: {
    eventType: "application_waitlisted",
    eventLabel: "Application waitlisted",
    subject: "Your university application is waitlisted",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} has been marked as waitlisted. Please review your Student Portal and keep your alternative options active.`,
    trigger: "Application moved to Waitlisted",
  },
  rejected: {
    eventType: "application_rejected",
    eventLabel: "Application rejected",
    risk: "high",
    subject: "Important university application update",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} has been marked as rejected. Please review your Student Portal and contact your Zaifan counselor before choosing the next step.`,
    trigger: "Application moved to Rejected",
    confirmationPhrase: "SEND REJECTION",
  },
  withdrawn: {
    eventType: "application_withdrawn",
    eventLabel: "Application withdrawn",
    risk: "high",
    subject: "Your university application has been withdrawn",
    message: ({ university, program }) =>
      `Your ${program} application at ${university} has been marked as withdrawn in Zaifan OS. Please contact your counselor if this was unexpected.`,
    trigger: "Application moved to Withdrawn",
    confirmationPhrase: "SEND WITHDRAWAL",
  },
};

const buildExactApplicationWorkflowNotification = ({
  action,
  student,
  previous,
  next,
}) => {
  const copy = APPLICATION_WORKFLOW_NOTIFICATION_COPY[action];

  const fallback = buildStudentNotification({
    domain: "application",
    action,
    student,
    entity: previous,
    previous,
    next,
    relatedType: "application",
    relatedId: previous?.id || next?.id || null,
  });

  if (!copy) return fallback;

  const recipientName =
    fallback?.recipientName ||
    student?.full_name ||
    student?.student_name ||
    student?.name ||
    "Student";
  const recipientEmail = String(
    fallback?.recipientEmail || student?.email || student?.student_email || ""
  )
    .trim()
    .toLowerCase();
  const university = next?.university || "your university";
  const program = next?.program || "your selected programme";
  const message = copy.message({ university, program });

  return {
    ...(fallback || {}),
    eventType: copy.eventType,
    eventLabel: copy.eventLabel,
    risk: copy.risk || "normal",
    subject: copy.subject,
    message,
    trigger: copy.trigger,
    confirmationPhrase: copy.confirmationPhrase,
    domain: "application",
    recipientName,
    recipientEmail,
    studentId: student?.id ?? student?.student_id ?? null,
    studentType:
      student?.student_type || student?.__leadType || student?.type || "inquiry",
    relatedType: "application",
    relatedId: previous?.id || next?.id || null,
    sendable: Boolean(recipientEmail && copy.subject && message),
  };
};

const getApplicationJourneyIndex = (record = {}) => {
  const status = String(record.application_status || "")
    .trim()
    .toLowerCase();
  const stage = String(record.application_stage || "")
    .trim()
    .toLowerCase();

  if (["rejected", "withdrawn", "deferred"].includes(status)) {
    return Math.max(
      0,
      ITALY_APPLICATION_JOURNEY.findIndex((item) => item.id === "decision")
    );
  }

  const index = ITALY_APPLICATION_JOURNEY.findIndex(
    (item) => item.statuses.includes(status) || item.stages.includes(stage)
  );

  return index >= 0 ? index : 0;
};

const getApplicationJourneyProgress = (record = {}) => {
  const index = getApplicationJourneyIndex(record);
  const denominator = Math.max(1, ITALY_APPLICATION_JOURNEY.length - 1);
  return Math.round((index / denominator) * 100);
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const DOCUMENT_REQUIREMENT_META_PREFIX = "ZAIFAN_REQUEST_META::";

const isApplicationDocumentRequirement = (requirement = {}) =>
  normalize(requirement?.requirement_type) === "document";

const isRequirementSchemaMismatch = (error) => {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
};

const buildApplicationDocumentRequestNotes = ({
  instructions = "",
  dueDate = "",
  requestedAt = "",
  requestCount = 1,
}) =>
  `${DOCUMENT_REQUIREMENT_META_PREFIX}${JSON.stringify({
    instructions,
    priority: "normal",
    dueDate,
    requestedAt,
    requestedBy: null,
    requestCount: Math.max(1, Number(requestCount || 1)),
    notifyStudent: false,
    source: "application_requirement",
  })}`;

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

  const syncDocumentRequestForApplicationRequirement = async (
    requirement,
    { forceStatus = null, silent = true } = {}
  ) => {
    if (
      !requirement?.id ||
      !isApplicationDocumentRequirement(requirement) ||
      !hasStudentId
    ) {
      return { ok: true, skipped: true, requirement: null };
    }

    const documentName = String(requirement.title || "").trim();
    if (!documentName) {
      return { ok: false, skipped: true, requirement: null };
    }

    const desiredStatus =
      forceStatus ||
      (normalize(requirement.status) === "completed" ? "inactive" : "active");

    try {
      const strictLookup = await supabase
        .from("student_document_requirements")
        .select("*")
        .eq("student_id", dbStudentId)
        .eq("student_type", studentType)
        .eq("document_name", documentName)
        .order("created_at", { ascending: false })
        .limit(1);

      let existingRequirement =
        !strictLookup.error && strictLookup.data?.[0]
          ? strictLookup.data[0]
          : null;

      if (!existingRequirement) {
        const fallbackLookup = await supabase
          .from("student_document_requirements")
          .select("*")
          .eq("student_id", dbStudentId)
          .eq("document_name", documentName)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!fallbackLookup.error && fallbackLookup.data?.[0]) {
          existingRequirement = fallbackLookup.data[0];
        }
      }

      if (!existingRequirement && desiredStatus === "inactive") {
        return { ok: true, skipped: true, requirement: null };
      }

      const nowIso = new Date().toISOString();
      const instructions =
        String(requirement.description || "").trim() ||
        `Upload a clear, complete and readable copy of ${documentName}.`;
      const previousRequestCount = Math.max(
        1,
        Number(existingRequirement?.request_count || 1)
      );
      const notes = buildApplicationDocumentRequestNotes({
        instructions,
        dueDate: requirement.due_date || "",
        requestedAt: existingRequirement?.requested_at || nowIso,
        requestCount: previousRequestCount,
      });

      const corePayload = {
        student_id: dbStudentId,
        student_type: studentType,
        document_name: documentName,
        group_name: "Application Requirements",
        required: true,
        verification_required: true,
        expiry_tracking: false,
        student_can_upload: true,
        counselor_can_upload: true,
        admin_only: false,
        status: desiredStatus,
      };

      const safePayload = {
        ...corePayload,
        notes,
      };

      const richPayload = {
        ...safePayload,
        stage_name: "Application",
        instructions,
        priority: "normal",
        due_date: requirement.due_date || null,
        requested_at: existingRequirement?.requested_at || nowIso,
        request_count: previousRequestCount,
        updated_at: nowIso,
      };

      const runMutation = async (payload) => {
        if (existingRequirement?.id) {
          return supabase
            .from("student_document_requirements")
            .update(payload)
            .eq("id", existingRequirement.id)
            .select("*")
            .single();
        }

        return supabase
          .from("student_document_requirements")
          .insert(payload)
          .select("*")
          .single();
      };

      let result = await withTimeout(
        runMutation(richPayload),
        "Application document request sync timed out."
      );

      if (result.error && isRequirementSchemaMismatch(result.error)) {
        result = await withTimeout(
          runMutation(safePayload),
          "Application document request fallback timed out."
        );
      }

      if (result.error && isRequirementSchemaMismatch(result.error)) {
        result = await withTimeout(
          runMutation(corePayload),
          "Application document request compatibility save timed out."
        );
      }

      if (result.error) throw result.error;

      if (!silent) {
        safeSet(() => {
          setSuccessMessage(
            desiredStatus === "active"
              ? `${documentName} is now available in Student Portal Documents.`
              : `${documentName} was removed from the active student document requests.`
          );
        });
      }

      return {
        ok: true,
        skipped: false,
        requirement: result.data || existingRequirement || null,
      };
    } catch (bridgeError) {
      console.warn(
        "Application requirement → Documents bridge failed:",
        bridgeError
      );

      if (!silent) {
        safeSet(() => {
          setAuditWarning(
            `The application requirement was saved, but "${documentName}" could not be synchronized to Student Portal Documents. Reopen this application and retry.`
          );
        });
      }

      return {
        ok: false,
        skipped: false,
        requirement: null,
        error: bridgeError,
      };
    }
  };

  const syncLoadedDocumentRequirements = async (loadedRequirements = []) => {
    const documentRequirements = loadedRequirements.filter(
      (requirement) =>
        isApplicationDocumentRequirement(requirement) &&
        normalize(requirement.status || "pending") !== "completed"
    );

    if (!documentRequirements.length) return;

    const results = await Promise.allSettled(
      documentRequirements.map((requirement) =>
        syncDocumentRequestForApplicationRequirement(requirement, {
          forceStatus: "active",
          silent: true,
        })
      )
    );

    const failures = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && result.value?.ok === false)
    ).length;

    if (failures > 0) {
      safeSet(() => {
        setAuditWarning(
          `${failures} document-type application requirement${
            failures === 1 ? "" : "s"
          } could not be mirrored into Student Portal Documents. Core application data is unchanged.`
        );
      });
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

      const loadedRequirements = requirementsResult.data || [];

      safeSet(() => {
        setRequirements(loadedRequirements);
        setEvents(eventsResult.data || []);
      });

      void syncLoadedDocumentRequirements(loadedRequirements);
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
    const patch = workflowPatchForAction(action, nowIso);

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
          `Application moved to ${pretty(action)}.`
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
    const patch = workflowPatchForAction(action, nowIso);

    if (!patch) return;

    const next = { ...activeApplication, ...patch };
    const preview = buildExactApplicationWorkflowNotification({
      action,
      student,
      previous: activeApplication,
      next,
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

      const bridgeResult = isApplicationDocumentRequirement(data)
        ? await syncDocumentRequestForApplicationRequirement(data, {
            forceStatus: "active",
            silent: true,
          })
        : { ok: true, skipped: true };

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
        setSuccessMessage(
          isApplicationDocumentRequirement(data)
            ? bridgeResult.ok
              ? "Application requirement added and sent to Student Portal Documents."
              : "Application requirement added. Documents sync needs attention."
            : "Application requirement added."
        );
      });

      if (isApplicationDocumentRequirement(data) && !bridgeResult.ok) {
        safeSet(() => {
          setAuditWarning(
            `"${data.title}" was saved as an application requirement, but its Student Portal document request could not be confirmed.`
          );
        });
      }

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
        setSuccessMessage(
          completed
            ? "Requirement completed."
            : "Requirement reopened."
        );
      });

      if (isApplicationDocumentRequirement(data)) {
        void syncDocumentRequestForApplicationRequirement(data, {
          forceStatus: completed ? "inactive" : "active",
          silent: true,
        });
      }

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

      if (isApplicationDocumentRequirement(requirement)) {
        void syncDocumentRequestForApplicationRequirement(requirement, {
          forceStatus: "inactive",
          silent: true,
        });
      }

      safeSet(() => {
        setRequirements((previous) =>
          previous.filter((item) => item.id !== requirement.id)
        );
        setSuccessMessage("Application requirement deleted.");
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
      [
        "submitted",
        "applied",
        "under_review",
        "interview_scheduled",
        "admission_test",
        "waitlisted",
        "conditional_admission",
        "offer_received",
        "admitted",
        "offer_accepted",
        "pre_enrollment_started",
        "pre_enrollment_submitted",
        "pre_enrollment_validated",
        "enrollment_pending",
        "enrolled",
      ].includes(item.application_status)
    ).length;

    const offers = active.filter((item) =>
      [
        "conditional_offer",
        "offer_received",
        "admitted",
        "offer_accepted",
      ].includes(item.offer_status)
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
        !["rejected", "withdrawn", "enrolled"].includes(item.application_status)
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
      const status = String(item.application_status || "").toLowerCase();
      const stage = String(item.application_stage || "").toLowerCase();
      const offer = String(item.offer_status || "").toLowerCase();

      return (
        (["conditional_admission", "offer_received", "admitted", "offer_accepted"].includes(status) &&
          ["planning", "preparation", "submission", "submitted"].includes(stage)) ||
        (offer === "offer_accepted" && !["pre_enrollment", "enrollment"].includes(stage)) ||
        (["pre_enrollment_submitted", "pre_enrollment_validated"].includes(status) &&
          stage !== "pre_enrollment") ||
        (status === "enrolled" && stage !== "enrollment") ||
        (["rejected", "withdrawn"].includes(status) && stage !== "closed")
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
  const journeyIndex = getApplicationJourneyIndex(form);
  const journeyProgress = getApplicationJourneyProgress(form);
  const activeJourneyStep =
    ITALY_APPLICATION_JOURNEY[journeyIndex] || ITALY_APPLICATION_JOURNEY[0];

  return (
    <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <StudentNotificationPreviewModal
        pending={pendingNotification}
        busy={notificationBusy}
        onCancel={() => !notificationBusy && setPendingNotification(null)}
        onConfirm={confirmPendingNotification}
      />
      {/* APPLICATION OS COMMAND */}
      <section className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap gap-2">
              <span className="rounded-full border border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-orange-700">
                Application OS
              </span>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                Student #{studentId || "—"}
              </span>
            </div>

            <h2 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Multi-Application Command Center
            </h2>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Run every university application independently with deadlines,
              requirements, offer conditions, payments, risks and next actions.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">Application Actions</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">Create, communicate, and refresh the student application portfolio safely.</p>
            <div className="mt-4 flex min-w-0 flex-col items-start gap-2">
            <StudentNotificationComposer
              student={student}
              context="application"
              buttonLabel="Send Application Update"
              compact
            />

            <button
              type="button"
              onClick={beginNewApplication}
              className="inline-flex min-h-11 w-fit max-w-full self-start items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-white bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
            >
              <Plus size={15} className="text-[#123865]" />
              New Application
            </button>

            <button
              type="button"
              onClick={() => void loadApplications()}
              disabled={loading}
              className="inline-flex min-h-10 w-fit max-w-full self-start items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-white bg-white px-3.5 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-5">
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
      <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_12px_34px_rgba(18,56,101,0.07)] sm:p-5">
        <div className="flex min-w-0 flex-col gap-3">
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
                className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowArchived(false)}
                className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                  !showArchived
                    ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
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
          <div className="mt-3 flex min-h-[90px] items-center justify-center rounded-[1.35rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF]">
            <div className="text-center">
              <LoaderCircle
                size={22}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-2 text-xs font-black text-[#10233F]">
                Loading applications
              </p>
            </div>
          </div>
        ) : null}

        {!loading && filteredApplications.length === 0 ? (
          <div className="mt-3 rounded-[1.35rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-5 text-center">
            <University size={26} className="mx-auto text-orange-400" />
            <p className="mt-2 text-sm font-black text-[#10233F]">
              {showArchived ? "No archived applications" : "No applications yet"}
            </p>

            {!showArchived ? (
              <button
                type="button"
                onClick={beginNewApplication}
                className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-white px-4 py-2 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
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
              <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
                <div className="flex min-w-0 flex-col gap-4">
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

                    <h3 className="mt-3 break-words text-2xl font-black text-[#10233F] sm:text-3xl">
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
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 py-2 text-xs font-black text-white transition hover:bg-orange-600 disabled:opacity-50"
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

                <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
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

              <ApplicationJourneyRail
                record={form}
                activeIndex={journeyIndex}
                progress={journeyProgress}
                activeStep={activeJourneyStep}
              />

              <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
                <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                    Student-Safe Application Summary
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#10233F]">
                    What the student should understand right now
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    This preview intentionally excludes internal notes, risk reasons, portal credentials and staff-only context.
                  </p>

                  <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <OperationalTile
                      label="Application"
                      value={pretty(form.application_status || "not_started")}
                      tone="blue"
                    />
                    <OperationalTile
                      label="Admission"
                      value={pretty(form.offer_status || "pending")}
                      tone="green"
                    />
                    <OperationalTile
                      label="Current Stage"
                      value={activeJourneyStep?.label || "Plan"}
                      tone="orange"
                    />
                    <OperationalTile
                      label="Next Deadline"
                      value={
                        nextActionDeadline?.label ||
                        deadline?.label ||
                        "No student deadline"
                      }
                      tone={nextActionDeadline?.tone || deadline?.tone || "slate"}
                    />
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border-2 border-[#FF5A0A] bg-[#FFF8EF] p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-700">
                      Next student-facing move
                    </p>
                    <p className="mt-2 text-sm font-black leading-6 text-[#10233F]">
                      {form.next_action ||
                        "No next action is published yet. Add a clear next action before saving."}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                    Visibility Guard
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#10233F]">
                    Private fields stay in Admin OS
                  </h3>

                  <div className="mt-4 space-y-2">
                    {[
                      ["Student can see", "University, programme, intake, statuses, deadlines, next action, conditions and requirements."],
                      ["Admin only", "Internal notes, counselor notes, risk reason, portal username and operational credentials."],
                      ["Safe notification", "Important saved changes still pass through the existing student notification preview."],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border-2 border-orange-200 bg-white p-3"
                      >
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                          {label}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                      Portfolio Operations
                    </p>
                    <h3 className="mt-1 text-lg font-black text-[#10233F]">
                      Cross-application pressure check
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      Real signals from application deadlines, unpaid obligations,
                      missing next actions, stale records and contradictory workflow states.
                    </p>
                  </div>

                  <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                    {portfolioStats.total} active applications
                  </span>
                </div>

                <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <section className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)] sm:p-5">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-700">
                          Italy Application Workflow
                        </p>
                        <h3 className="mt-1 text-lg font-black text-[#10233F]">
                          Move the application without mismatched stages
                        </h3>
                        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                          Each action updates the application status, workflow stage and the relevant milestone date together.
                        </p>
                      </div>

                      <span className="w-fit rounded-full border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.09em] text-white">
                        {journeyProgress}% journey progress
                      </span>
                    </div>

                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {APPLICATION_QUICK_ACTIONS.map((item) => (
                        <ApplicationWorkflowAction
                          key={item.id}
                          item={item}
                          active={
                            normalize(form.application_status) ===
                            normalize(
                              workflowPatchForAction(item.id)?.application_status
                            )
                          }
                          disabled={savingKeys.size > 0}
                          onClick={() => applyQuickWorkflow(item.id)}
                        />
                      ))}
                    </div>

                    <div className="rounded-xl border-2 border-orange-200 bg-white p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                        Current operational meaning
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                        {activeJourneyStep?.description ||
                          "Select a workflow action or update the detailed fields below."}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* TABS */}
              <div className="grid min-w-0 grid-cols-2 gap-2 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-2 shadow-[0_8px_22px_rgba(18,56,101,0.04)] sm:grid-cols-3 lg:grid-cols-5">
                {[
                  ["overview", "Overview"],
                  ["requirements", `Requirements (${requirementStats.pending})`],
                  ["student_view", "Student View"],
                  ["notes", "Admin Notes"],
                  ["history", `History (${events.length})`],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-xs font-black ${
                      activeTab === value
                        ? "border-[#0b2a57] bg-[#0b2a57]"
                        : "border-slate-300 bg-white text-slate-600 hover:border-[#FF5A0A]"
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

              {activeTab === "student_view" ? (
                <StudentApplicationPreview
                  form={form}
                  requirements={requirements}
                  events={events}
                  deadline={deadline}
                  nextActionDeadline={nextActionDeadline}
                  journeyIndex={journeyIndex}
                  journeyProgress={journeyProgress}
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
          <div className="w-full max-w-xl rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                  Application Requirement
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Add operational requirement
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRequirement(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-white text-slate-500"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-800">
              This requirement is student-visible. When Type is Document, the same title is automatically created as an upload request in Student Portal → Documents. Use the exact document name you want the student to see. Private staff notes belong in Admin Notes, not here.
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

              {requirementDraft.requirement_type === "document" ? (
                <div className="sm:col-span-2 rounded-xl border-2 border-blue-300 bg-blue-50 p-3 text-xs font-semibold leading-5 text-blue-800">
                  <span className="font-black">Documents bridge active:</span>{" "}
                  adding this requirement will immediately create the same
                  student upload request. When Admin verifies the matching file,
                  this application requirement will complete automatically.
                </div>
              ) : null}

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
                className="rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"
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
  "h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:opacity-60";

const textareaClass =
  "w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:opacity-60";


function ApplicationJourneyRail({
  record,
  activeIndex = 0,
  progress = 0,
  activeStep = null,
}) {
  const terminalStatus = normalize(record?.application_status);
  const isClosed = ["rejected", "withdrawn", "deferred"].includes(
    terminalStatus
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-3 border-b-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
            Italy Application Journey
          </p>
          <h3 className="mt-1 text-lg font-black text-[#10233F]">
            {isClosed
              ? `Application ${pretty(terminalStatus)}`
              : `${activeStep?.label || "Plan"} is the current stage`}
          </h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
            {activeStep?.description ||
              "Follow the application from planning to final enrollment."}
          </p>
        </div>

        <div className="min-w-[170px] rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
              Journey progress
            </span>
            <span className="text-sm font-black text-[#123865]">
              {progress}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                isClosed ? "bg-red-500" : "bg-[#FF5A0A]"
              }`}
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 sm:p-5">
        {ITALY_APPLICATION_JOURNEY.map((step, index) => {
          const complete = !isClosed && index < activeIndex;
          const current = index === activeIndex;
          const blocked = isClosed && index > activeIndex;

          return (
            <div
              key={step.id}
              className={`min-w-0 rounded-xl border-2 p-3 ${
                current
                  ? isClosed
                    ? "border-red-400 bg-red-50"
                    : "border-[#FF5A0A] bg-[#FFF4E8]"
                  : complete
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-[#C9D7E6] bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-black ${
                    current
                      ? isClosed
                        ? "bg-red-500 text-white"
                        : "bg-[#FF5A0A] text-white"
                      : complete
                      ? "bg-emerald-600 text-white"
                      : "bg-[#123865] text-white"
                  }`}
                >
                  {complete ? <Check size={14} /> : index + 1}
                </span>
                {current ? (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase ${
                      isClosed
                        ? "border-red-300 bg-white text-red-700"
                        : "border-orange-300 bg-white text-orange-700"
                    }`}
                  >
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-3 break-words text-xs font-black text-[#10233F]">
                {step.label}
              </p>
              <p className="mt-1 text-[9px] font-semibold leading-4 text-slate-500">
                {blocked ? "Not reached" : step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ApplicationWorkflowAction({
  item,
  active = false,
  disabled = false,
  onClick,
}) {
  const tones = {
    blue: active
      ? "border-blue-700 bg-blue-700 text-white"
      : "border-blue-400 bg-blue-50 text-blue-800 hover:bg-blue-100",
    green: active
      ? "border-emerald-700 bg-emerald-700 text-white"
      : "border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    orange: active
      ? "border-[#FF5A0A] bg-[#FF5A0A] text-white"
      : "border-[#FF5A0A] bg-white text-orange-800 hover:bg-orange-50",
    violet: active
      ? "border-violet-700 bg-violet-700 text-white"
      : "border-violet-400 bg-violet-50 text-violet-800 hover:bg-violet-100",
    red: active
      ? "border-red-700 bg-red-700 text-white"
      : "border-red-400 bg-red-50 text-red-800 hover:bg-red-100",
    slate: active
      ? "border-slate-700 bg-slate-700 text-white"
      : "border-slate-400 bg-slate-50 text-slate-700 hover:bg-slate-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-0 rounded-xl border-2 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 ${
        tones[item.tone] || tones.slate
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black">{item.label}</span>
        {active ? <CheckCircle2 size={15} className="shrink-0" /> : null}
      </div>
      <p className={`mt-1 text-[9px] font-bold leading-4 ${active ? "text-white/80" : "opacity-70"}`}>
        {item.helper}
      </p>
    </button>
  );
}

function StudentApplicationPreview({
  form,
  requirements = [],
  events = [],
  deadline,
  nextActionDeadline,
  journeyIndex = 0,
  journeyProgress = 0,
}) {
  const safeEvents = events
    .filter((event) => {
      const key = normalize(
        `${event?.event_type || ""} ${event?.event_label || ""}`
      );
      return ![
        "internal notes",
        "internal_notes",
        "counselor notes",
        "counselor_notes",
        "risk reason",
        "risk_reason",
        "portal username",
        "portal_username",
        "portal url",
        "portal_url",
      ].some((privateKey) => key.includes(normalize(privateKey)));
    })
    .slice(0, 5);

  const pendingRequirements = requirements.filter(
    (item) => normalize(item.status) !== "completed"
  );
  const completedRequirements = requirements.length - pendingRequirements.length;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
              Student Portal Preview
            </p>
            <h3 className="mt-2 break-words text-2xl font-black text-white">
              {form.university || "University Application"}
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
              {[form.program, form.country, form.intake]
                .filter(Boolean)
                .join(" · ") || "Programme and intake not published yet."}
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white lg:border-l-[3px] lg:border-t-0 sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Student-safe status
            </p>
            <p className="mt-2 text-xl font-black text-white">
              {pretty(form.application_status || "not_started")}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              Journey progress: {journeyProgress}% · Stage{" "}
              {ITALY_APPLICATION_JOURNEY[journeyIndex]?.label || "Plan"}
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <CompactStat
            label="Application"
            value={pretty(form.application_status || "not_started")}
            icon={FileCheck2}
          />
          <CompactStat
            label="Admission"
            value={pretty(form.offer_status || "pending")}
            icon={BadgeCheck}
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

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section
          title="What the student sees"
          subtitle="Only clear journey information is shown here."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <OperationalTile
              label="Current next action"
              value={form.next_action || "No next action published"}
              tone={form.next_action ? "orange" : "red"}
            />
            <OperationalTile
              label="Offer conditions"
              value={
                form.conditional_offer
                  ? form.conditions_completed
                    ? "Conditions completed"
                    : "Conditions still open"
                  : "No conditional offer"
              }
              tone={
                form.conditional_offer && !form.conditions_completed
                  ? "orange"
                  : "green"
              }
            />
            <OperationalTile
              label="Requirements"
              value={
                requirements.length
                  ? `${completedRequirements}/${requirements.length} completed`
                  : "Not assessed"
              }
              tone={pendingRequirements.length ? "orange" : "green"}
            />
            <OperationalTile
              label="Scholarship"
              value={form.scholarship_status || "Not recorded"}
              tone={form.scholarship_status ? "green" : "slate"}
            />
          </div>

          {form.conditions_text ? (
            <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Published conditions
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-700">
                {form.conditions_text}
              </p>
            </div>
          ) : null}
        </Section>

        <Section
          title="Privacy confirmation"
          subtitle="These operational fields remain hidden from the student."
        >
          <div className="space-y-2">
            {[
              ["Internal Notes", Boolean(form.internal_notes)],
              ["Counselor Notes", Boolean(form.counselor_notes)],
              ["Risk Reason", Boolean(form.risk_reason)],
              ["Portal Username", Boolean(form.portal_username)],
              ["Portal URL", Boolean(form.portal_url)],
            ].map(([label, hasValue]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3"
              >
                <span className="text-xs font-black text-[#10233F]">
                  {label}
                </span>
                <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-600">
                  {hasValue ? "Stored · Admin only" : "Empty · Admin only"}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Section
          title="Student-visible Requirements"
          subtitle="Application conditions and tasks that the student can act on."
        >
          {requirements.length ? (
            <div className="space-y-2">
              {requirements.slice(0, 8).map((requirement) => {
                const complete = normalize(requirement.status) === "completed";
                const due = deadlineMeta(requirement.due_date);
                return (
                  <div
                    key={requirement.id}
                    className={`rounded-xl border-2 p-3 ${
                      complete
                        ? "border-emerald-300 bg-emerald-50"
                        : due?.tone === "red"
                        ? "border-red-300 bg-red-50"
                        : "border-orange-300 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-black text-[#10233F]">
                          {requirement.title || "Application requirement"}
                        </p>
                        {requirement.description ? (
                          <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
                            {requirement.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 rounded-full border border-current bg-white/70 px-2 py-0.5 text-[8px] font-black uppercase">
                        {complete ? "Completed" : due?.label || "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-orange-300 bg-[#FFF8EF] p-5 text-center">
              <p className="text-sm font-black text-[#10233F]">
                No application requirements configured
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                This will appear as not assessed, not falsely complete.
              </p>
            </div>
          )}
        </Section>

        <Section
          title="Student-safe Activity"
          subtitle="Private operational field changes are excluded."
        >
          {safeEvents.length ? (
            <div className="space-y-2">
              {safeEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[#10233F]">
                        {event.event_label || pretty(event.event_type)}
                      </p>
                      {(event.old_value || event.new_value) ? (
                        <p className="mt-1 text-[10px] font-semibold text-slate-600">
                          {event.old_value || "—"} → {event.new_value || "—"}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[9px] font-semibold text-slate-500">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-orange-300 bg-[#FFF8EF] p-5 text-center">
              <p className="text-sm font-black text-[#10233F]">
                No student-safe activity yet
              </p>
            </div>
          )}
        </Section>
      </section>
    </div>
  );
}

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

          <div className="rounded-2xl border-2 border-[#FF5A0A] bg-[#FFF8EF] p-3">
            <div className="flex items-center gap-2">
              <Landmark size={17} className="text-orange-600" />
              <div>
                <h4 className="text-sm font-black text-[#10233F]">Scholarship</h4>
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] text-orange-700"
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
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-3 py-2 text-xs font-black text-white"
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
        <div className="mt-4 rounded-[1.35rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-7 text-center">
          <CheckCircle2 size={30} className="mx-auto text-orange-400" />
          <h4 className="mt-3 text-base font-black text-[#10233F]">
            No application requirements yet
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            No requirements are configured yet. This is treated as
            <span className="font-black text-[#10233F]"> not assessed</span>,
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
                    <h4 className="font-black text-[#10233F]">
                      {requirement.title}
                    </h4>
                    <RequirementStatus value={requirement.status} />
                    <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                      {requirement.requirement_type}
                    </span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">
                      Student visible
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
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-[#10233F]"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      }
    >
      {events.length === 0 ? (
        <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-7 text-center">
          <History size={28} className="mx-auto text-orange-400" />
          <p className="mt-3 text-sm font-black text-[#10233F]">
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
                  <p className="text-sm font-black text-[#10233F]">
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
      className={`min-w-[250px] max-w-[320px] flex-1 rounded-[1.25rem] border-[3px] p-3 text-left shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        active
          ? "border-[#FF5A0A] bg-white"
          : "border-[#C9D7E6] bg-white hover:border-[#FF5A0A]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 shadow-sm ${
            active
              ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-700"
              : "border-[#C9D7E6] bg-[#FFF8EF] text-[#315B88]"
          }`}
          aria-hidden="true"
        >
          <GraduationCap size={18} strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black leading-5 text-[#10233F]">
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

        <ChevronRight
          size={16}
          className={`mt-1 shrink-0 transition ${active ? "text-[#FF5A0A]" : "text-slate-400"}`}
        />
      </div>
    </button>
  );
}

function EmptyWorkspace({ onCreate }) {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-[1.7rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-8 text-center">
      <div>
        <University size={42} className="mx-auto text-orange-400" />
        <h3 className="mt-4 text-xl font-black text-[#10233F]">
          Select or create an application
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Every university application now has its own independent operational
          workspace.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-xl bg-[#FF5A0A] px-4 py-2.5 text-xs font-black text-white"
        >
          Create Application
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, action = null, children }) {
  return (
    <section className="rounded-[1.6rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_8px_24px_rgba(15,35,63,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[#10233F]">{title}</h3>
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
      <span className="mb-1.5 block text-xs font-black text-[#10233F]">
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
      <span className="text-sm font-black text-[#10233F]">{label}</span>
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
    <div className="rounded-2xl border-2 border-[#FF5A0A] bg-[#FFF8EF] p-3">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-orange-600" />
        <div>
          <h4 className="text-sm font-black text-[#10233F]">{title}</h4>
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
  return <ZaifanMetricCard level="coBoss" label={label} value={value} tone={toZaifanMetricTone(tone)} />;
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} icon={Icon} tone={toZaifanMetricTone(tone)} />;
}

function CompactStat({ label, value, icon: Icon, tone = "slate" }) {
  return <ZaifanMetricCard level="baby" label={label} value={value} icon={Icon} tone={toZaifanMetricTone(tone)} />;
}

function StatusBadge({ value, compact = false }) {
  const styles = {
    planning: "border-slate-300 bg-slate-50 text-slate-700",
    preparation: "border-blue-300 bg-blue-50 text-blue-800",
    submitted: "border-violet-300 bg-violet-50 text-violet-800",
    offer: "border-emerald-300 bg-emerald-50 text-emerald-800",
    accepted: "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
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
    high: "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
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
    high: "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
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
    orange: "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
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

export default StudentApplicationPanel;
