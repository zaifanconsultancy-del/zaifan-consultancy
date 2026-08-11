// CounselorVisaWorkspace PARTNER OS EXTREME V3 — persistent Visa follow-up task fix — Visa Operations Command
// New file: src/components/counselor/CounselorVisaWorkspace.jsx
//
// Counselor-scoped Visa OS workspace:
// - consumes the shared counselorPortal assigned snapshot for the same student_visas / student_visa_requirements / student_visa_events used by Admin + Student
// - Visa, requirement and event privacy scope is enforced centrally before this workspace renders
// - keeps Admin authoritative: counselors do not mutate Visa case/status/requirement records here
// - counselor actions create follow-up tasks + Student OS timeline entries + best-effort Visa audit events
// - application/document context remains linked rather than duplicated
// - deterministic readiness, requirement pressure, deadlines, appointments, refusals and next-action intelligence
// - shared-snapshot refresh with no duplicate Visa fetch path
// - Partner OS visual parity with Counselor Applications / Documents / Universities
// - shared navy/orange/cream shell + shared decorative ring motif

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileWarning,
  History,
  Landmark,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Stamp,
  University,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  buildCounselorVisaQueue,
  createCounselorTask,
  formatRelativeTime,
  writeCounselorTimelineEvent,
  writeCounselorVisaEvent,
} from "../../lib/counselorPortal";

const REQUEST_TIMEOUT_MS = 15000;
const QUERY_CHUNK_SIZE = 90;

const FILTERS = [
  { key: "all", label: "All Visa Cases" },
  { key: "attention", label: "Needs Action" },
  { key: "appointment", label: "Appointment" },
  { key: "requirements", label: "Requirement Attention" },
  { key: "submitted", label: "Submitted / Review" },
  { key: "approved", label: "Approved" },
  { key: "refused", label: "Refusal / Reapply" },
  { key: "archived", label: "Archived" },
];

const SORTS = [
  { key: "priority", label: "Operational Priority" },
  { key: "appointment", label: "Nearest Appointment" },
  { key: "due", label: "Nearest Next Action" },
  { key: "readiness", label: "Lowest Readiness" },
  { key: "updated", label: "Recently Updated" },
  { key: "student", label: "Student" },
  { key: "status", label: "Visa Status" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_visa_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_visa_sort";
const VIEW_STORAGE_KEY = "zaifan_counselor_visa_view";

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

const JOURNEY = [
  { key: "preparation", label: "Prepare", helper: "Visa file readiness" },
  { key: "appointment_booked", label: "Appointment", helper: "Center / embassy booking" },
  { key: "biometrics", label: "Biometrics", helper: "Biometric milestone" },
  { key: "medical", label: "Medical", helper: "Medical where required" },
  { key: "submitted", label: "Submit", helper: "Formal visa submission" },
  { key: "embassy_review", label: "Review", helper: "Embassy / consular review" },
  { key: "decision", label: "Decision", helper: "Decision recorded" },
  { key: "passport_collection", label: "Passport", helper: "Passport return / collection" },
  { key: "completed", label: "Complete", helper: "Visa journey closed" },
];

const STAGE_ALIASES = {
  preparation: "preparation",
  preparing: "preparation",
  "not started": "preparation",
  "appointment booked": "appointment_booked",
  appointment: "appointment_booked",
  booked: "appointment_booked",
  biometrics: "biometrics",
  biometric: "biometrics",
  medical: "medical",
  submitted: "submitted",
  submission: "submitted",
  "visa submitted": "submitted",
  "embassy review": "embassy_review",
  review: "embassy_review",
  "under review": "embassy_review",
  processing: "embassy_review",
  decision: "decision",
  approved: "decision",
  rejected: "decision",
  refused: "decision",
  "visa approved": "decision",
  "passport collection": "passport_collection",
  "passport returned": "passport_collection",
  closed: "completed",
  completed: "completed",
  complete: "completed",
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, safeNumber(value)));
}

function normalize(value) {
  return safeString(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function pretty(value, fallback = "—") {
  const text = safeString(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeStudentType(value) {
  return normalize(value) === "appointment" ? "appointment" : "inquiry";
}

function normalizeStage(value) {
  const clean = normalize(value);
  return STAGE_ALIASES[clean] || clean.replace(/\s+/g, "_") || "preparation";
}

function stageIndex(value) {
  const stage = normalizeStage(value);
  const index = JOURNEY.findIndex((item) => item.key === stage);
  return index >= 0 ? index : 0;
}

function dateMs(value, endOfDay = false) {
  if (!value) return 0;
  const raw = safeString(value).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T${endOfDay ? "23:59:59" : "12:00:00"}`).getTime()
    : new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value) {
  const timestamp = dateMs(value);
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  const timestamp = dateMs(value);
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deadlineMeta(value) {
  const timestamp = dateMs(value, true);
  if (!timestamp) {
    return {
      days: null,
      label: "Not scheduled",
      tone: "slate",
      overdue: false,
      dueSoon: false,
      timestamp: 0,
    };
  }

  const days = Math.ceil((timestamp - Date.now()) / 86400000);

  if (days < 0) {
    return {
      days,
      label: `${Math.abs(days)}d overdue`,
      tone: "rose",
      overdue: true,
      dueSoon: false,
      timestamp,
    };
  }

  if (days === 0) {
    return {
      days,
      label: "Due today",
      tone: "rose",
      overdue: false,
      dueSoon: true,
      timestamp,
    };
  }

  if (days <= 7) {
    return {
      days,
      label: `${days}d left`,
      tone: "orange",
      overdue: false,
      dueSoon: true,
      timestamp,
    };
  }

  if (days <= 30) {
    return {
      days,
      label: `${days}d left`,
      tone: "blue",
      overdue: false,
      dueSoon: false,
      timestamp,
    };
  }

  return {
    days,
    label: formatDate(value),
    tone: "slate",
    overdue: false,
    dueSoon: false,
    timestamp,
  };
}

function isApprovedVisa(record = {}) {
  const text = normalize(`${record.visa_status} ${record.visa_stage}`);
  return text.includes("approved") || text.includes("granted");
}

function isRefusedVisa(record = {}) {
  const text = normalize(`${record.visa_status} ${record.visa_stage}`);
  return (
    text.includes("rejected") ||
    text.includes("refused") ||
    text.includes("declined") ||
    Boolean(record.previous_refusal)
  );
}

function isSubmittedOrReview(record = {}) {
  const text = normalize(`${record.visa_status} ${record.visa_stage}`);
  return (
    text.includes("submitted") ||
    text.includes("under review") ||
    text.includes("embassy review") ||
    text.includes("processing")
  );
}

function requirementBucket(requirement = {}) {
  const value = normalize(requirement.status);

  if (
    value.includes("completed") ||
    value.includes("approved") ||
    value.includes("verified") ||
    value.includes("accepted") ||
    value.includes("cleared")
  ) {
    return "cleared";
  }

  if (
    value.includes("rejected") ||
    value.includes("missing") ||
    value.includes("expired") ||
    value.includes("invalid") ||
    value.includes("declined") ||
    value.includes("failed")
  ) {
    return "attention";
  }

  return "open";
}

function summarizeRequirements(requirements = []) {
  const rows = safeArray(requirements);
  const summary = {
    total: rows.length,
    cleared: 0,
    open: 0,
    attention: 0,
    overdue: 0,
    dueSoon: 0,
    readiness: null,
  };

  rows.forEach((requirement) => {
    const bucket = requirementBucket(requirement);
    summary[bucket] += 1;

    const due = deadlineMeta(requirement.due_date);
    if (due.overdue) summary.overdue += 1;
    if (due.dueSoon) summary.dueSoon += 1;
  });

  if (summary.total > 0) {
    summary.readiness = Math.round((summary.cleared / summary.total) * 100);
  }

  return summary;
}

function riskMeta(value = "") {
  const risk = normalize(value);

  if (risk.includes("critical")) {
    return {
      label: "Critical",
      score: 90,
      badge: "border-rose-300 bg-rose-50 text-rose-700",
      card: "border-rose-300",
      bar: "bg-rose-500",
    };
  }

  if (risk.includes("high")) {
    return {
      label: "High",
      score: 70,
      badge: "border-rose-300 bg-rose-50 text-rose-700",
      card: "border-rose-300",
      bar: "bg-rose-500",
    };
  }

  if (risk.includes("medium") || risk.includes("moderate")) {
    return {
      label: "Medium",
      score: 45,
      badge: "border-amber-300 bg-amber-50 text-amber-700",
      card: "border-amber-300",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "Low",
    score: 15,
    badge: "border-emerald-300 bg-emerald-50 text-emerald-700",
    card: "border-[#AFC0D0]",
    bar: "bg-emerald-500",
  };
}

function identityKey(studentType, studentId) {
  if (studentId === null || studentId === undefined || studentId === "") return "";
  return `${normalizeStudentType(studentType)}:${safeString(studentId)}`;
}

function studentIdFromRow(row = {}, allowIdFallback = false) {
  return (
    row.student_id ??
    row.studentId ??
    row.inquiry_id ??
    row.appointment_id ??
    row.person_id ??
    (allowIdFallback ? row.id : null)
  );
}

function studentTypeFromRow(row = {}) {
  if (row.student_type || row.studentType) {
    return normalizeStudentType(row.student_type || row.studentType);
  }
  if (row.appointment_id) return "appointment";
  return "inquiry";
}

function studentNameFromRow(row = {}) {
  return (
    row.student_name ||
    row.studentName ||
    row.full_name ||
    row.fullName ||
    row.name ||
    row.lead_name ||
    row.inquiry_name ||
    row.email ||
    "Assigned Student"
  );
}

function buildAssignedIdentityMap(snapshot = {}) {
  const map = new Map();

  const sources = [
    { rows: snapshot?.priorityStudents, allowIdFallback: true },
    { rows: snapshot?.students, allowIdFallback: true },
    { rows: snapshot?.applications, allowIdFallback: false },
    { rows: snapshot?.documents, allowIdFallback: false },
  ];

  sources.forEach(({ rows, allowIdFallback }) => {
    safeArray(rows).forEach((row) => {
      const studentId = studentIdFromRow(row, allowIdFallback);
      if (studentId === null || studentId === undefined || studentId === "") return;

      const studentType = studentTypeFromRow(row);
      const key = identityKey(studentType, studentId);
      if (!key) return;

      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        studentId,
        studentType,
        name: existing.name || studentNameFromRow(row),
        email: existing.email || row.email || row.student_email || row.studentEmail || "",
        phone: existing.phone || row.phone || row.student_phone || row.studentPhone || "",
      });
    });
  });

  return map;
}

function buildApplicationMap(snapshot = {}) {
  const map = new Map();

  safeArray(snapshot?.applications).forEach((application) => {
    const id = application.id ?? application.application_id ?? application.applicationId;
    if (id === null || id === undefined || id === "") return;
    map.set(safeString(id), application);
  });

  return map;
}

function applicationUniversityName(application = {}, visa = {}) {
  return (
    application.university_name ||
    application.universityName ||
    application.university ||
    visa.source_university_name ||
    "University not linked"
  );
}

function applicationCourseName(application = {}) {
  return (
    application.course_name ||
    application.courseName ||
    application.program_name ||
    application.programName ||
    application.programme ||
    application.course ||
    "Programme not recorded"
  );
}

function applicationStatus(application = {}) {
  return application.status || application.application_status || application.applicationStatus || "";
}

function chunkArray(values = [], size = QUERY_CHUNK_SIZE) {
  const rows = safeArray(values);
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function withTimeout(promise, message = "Request timed out.", timeoutMs = REQUEST_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function readSessionValue(key, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Workspace preferences are optional and must never break counselor operations.
  }
}

function sourceTone(value) {
  if (value === "live") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (value === "partial") return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-rose-300 bg-rose-50 text-rose-700";
}

function statusTone(value = "") {
  const text = normalize(value);

  if (text.includes("approved") || text.includes("granted") || text.includes("completed")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (text.includes("rejected") || text.includes("refused") || text.includes("declined")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  if (text.includes("review") || text.includes("processing") || text.includes("submitted")) {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  if (text.includes("appointment") || text.includes("biometric") || text.includes("medical")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function requirementTone(bucket) {
  if (bucket === "cleared") return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (bucket === "attention") return "border-rose-300 bg-rose-50 text-rose-700";
  return "border-amber-300 bg-amber-50 text-amber-700";
}

function deadlineTone(meta = {}) {
  if (meta.tone === "rose") return "border-rose-300 bg-rose-50 text-rose-700";
  if (meta.tone === "orange") return "border-orange-300 bg-orange-50 text-orange-700";
  if (meta.tone === "blue") return "border-sky-300 bg-sky-50 text-sky-700";
  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function calculatePressure(record = {}) {
  let score = riskMeta(record.risk_level).score;
  const requirements = record.requirementStats || summarizeRequirements(record.requirements);
  const nextAction = deadlineMeta(record.next_action_due);
  const appointment = deadlineMeta(record.appointment_date);

  if (requirements.attention > 0) score += Math.min(30, requirements.attention * 7);
  if (requirements.overdue > 0) score += Math.min(18, requirements.overdue * 6);
  if (requirements.total === 0) score += 8;
  if (nextAction.overdue) score += 20;
  else if (nextAction.dueSoon) score += 10;
  if (appointment.overdue && !isSubmittedOrReview(record) && !isApprovedVisa(record)) score += 8;
  if (record.previous_refusal) score += 15;
  if (isRefusedVisa(record)) score += 12;
  if (!safeString(record.next_action).trim() && !isApprovedVisa(record)) score += 8;

  return clamp(score);
}

function getCounselorIdentity(counselor = {}) {
  return {
    id: counselor.id || counselor.user_id || counselor.counselor_id || counselor.email || null,
    name:
      counselor.full_name ||
      counselor.fullName ||
      counselor.name ||
      counselor.display_name ||
      counselor.email ||
      "Counselor",
  };
}

function latestRecordEvent(events = []) {
  return [...safeArray(events)].sort((a, b) => dateMs(b.created_at) - dateMs(a.created_at))[0] || null;
}

function groupRequirements(requirements = []) {
  const groups = new Map();

  safeArray(requirements).forEach((requirement) => {
    const category = pretty(requirement.requirement_category || "General", "General");
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(requirement);
  });

  return [...groups.entries()];
}

function SignalBadge({ children, tone = "navy" }) {
  const tones = {
    navy: "border-white/20 bg-white/10 text-white",
    orange: "border-orange-300/70 bg-orange-400/15 text-orange-200",
    rose: "border-rose-300/70 bg-rose-400/15 text-rose-100",
    green: "border-emerald-300/70 bg-emerald-400/15 text-emerald-100",
    amber: "border-amber-300/70 bg-amber-400/15 text-amber-100",
  };

  return (
    <span className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${tones[tone] || tones.navy}`}>
      {children}
    </span>
  );
}

function VisaStat({ label, value, helper, tone = "navy", active = false, onClick }) {
  const tones = {
    navy: "border-[#AFC0D0] bg-white text-[#123865]",
    orange: "border-orange-300 bg-orange-50 text-orange-700",
    rose: "border-rose-300 bg-rose-50 text-rose-700",
    amber: "border-amber-300 bg-amber-50 text-amber-700",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
    violet: "border-violet-300 bg-violet-50 text-violet-700",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`min-w-0 rounded-[1.15rem] border-2 p-3 text-left shadow-sm transition ${
        tones[tone] || tones.navy
      } ${active ? "ring-4 ring-orange-100" : ""} ${onClick ? "hover:-translate-y-0.5 hover:shadow-md" : ""}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-bold opacity-80">{helper}</p>
    </Component>
  );
}

function StatusToast({ status, onClear }) {
  if (!status) return null;

  const success = status.type === "success";

  return (
    <div
      role="status"
      className={`mb-5 flex flex-col gap-2 rounded-[1.2rem] border-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        success
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-rose-300 bg-rose-50 text-rose-800"
      }`}
    >
      <p className="text-xs font-black">{status.message}</p>
      <button
        type="button"
        onClick={onClear}
        className="self-start rounded-lg border border-current px-2.5 py-1 text-[10px] font-black sm:self-auto"
      >
        Dismiss
      </button>
    </div>
  );
}

function VisaJourneyRail({ records = [] }) {
  const counts = useMemo(() => {
    const next = Object.fromEntries(JOURNEY.map((step) => [step.key, 0]));
    safeArray(records).forEach((record) => {
      const index = stageIndex(record.visa_stage || record.visa_status);
      const step = JOURNEY[index] || JOURNEY[0];
      next[step.key] += 1;
    });
    return next;
  }, [records]);

  return (
    <div className="mb-5 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFFCF7] shadow-[0_12px_28px_rgba(16,35,63,0.08)]">
      <div className="flex flex-col gap-2 border-b-2 border-[#D8B07B] bg-[#FFF8EF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">Italy Visa Journey</p>
          <p className="mt-1 text-sm font-black text-[#10233F]">Assigned case movement across the real Visa OS stages</p>
        </div>
        <span className="self-start rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-xs font-black text-white sm:self-auto">
          {safeArray(records).length} active record{safeArray(records).length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-9">
        {JOURNEY.map((step, index) => (
          <div key={step.key} className="rounded-[1.1rem] border-2 border-[#C9D6E2] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#123865] bg-[#123865] text-xs font-black text-white">
                {index + 1}
              </span>
              <span className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-black text-orange-700">
                {counts[step.key] || 0}
              </span>
            </div>
            <p className="mt-3 text-xs font-black text-[#10233F]">{step.label}</p>
            <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">{step.helper}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisaStrategyPanel({ stats, onFilter }) {
  const recoveryCount = stats.highPressure + stats.overdueActions;
  const readinessCount = stats.requirementAttention + stats.noChecklist;
  const decisionCount = stats.submittedReview + stats.refused;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <button
        type="button"
        onClick={() => onFilter("attention")}
        className="rounded-[1.45rem] border-[3px] border-rose-300 bg-rose-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-rose-700">Immediate Recovery</p>
            <p className="mt-2 text-2xl font-black text-[#10233F]">{recoveryCount}</p>
          </div>
          <ShieldAlert className="h-6 w-6 text-rose-600" aria-hidden="true" />
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-rose-800">
          {stats.highPressure} high-pressure case{stats.highPressure === 1 ? "" : "s"} · {stats.overdueActions} overdue next action{stats.overdueActions === 1 ? "" : "s"}.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onFilter("requirements")}
        className="rounded-[1.45rem] border-[3px] border-amber-300 bg-amber-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700">Readiness Pressure</p>
            <p className="mt-2 text-2xl font-black text-[#10233F]">{readinessCount}</p>
          </div>
          <FileWarning className="h-6 w-6 text-amber-600" aria-hidden="true" />
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-amber-800">
          {stats.requirementAttention} requirement issue{stats.requirementAttention === 1 ? "" : "s"} · {stats.noChecklist} case{stats.noChecklist === 1 ? "" : "s"} without a checklist.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onFilter("submitted")}
        className="rounded-[1.45rem] border-[3px] border-violet-300 bg-violet-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700">Decision Movement</p>
            <p className="mt-2 text-2xl font-black text-[#10233F]">{decisionCount}</p>
          </div>
          <Stamp className="h-6 w-6 text-violet-600" aria-hidden="true" />
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-violet-800">
          {stats.submittedReview} submitted/review · {stats.approved} approved · {stats.refused} refusal/reapply signal{stats.refused === 1 ? "" : "s"}.
        </p>
      </button>
    </div>
  );
}

function RequirementPanel({ requirements = [], summary }) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => groupRequirements(requirements), [requirements]);

  return (
    <div className="rounded-[1.35rem] border-2 border-[#C9D6E2] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">Visa Requirements</p>
          <p className="mt-1 text-lg font-black text-[#10233F]">
            {summary.total ? `${summary.cleared}/${summary.total} cleared` : "Checklist not configured"}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#5B6D80]">
            {summary.attention} attention · {summary.open} open · {summary.overdue} overdue
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-xs font-black text-white hover:bg-[#0B2A4B]"
        >
          {open ? "Hide" : "Inspect"}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E8EEF4]">
        <div
          className={`h-full rounded-full ${
            summary.readiness === null
              ? "bg-[#AFC0D0]"
              : summary.readiness >= 80
                ? "bg-emerald-500"
                : summary.readiness >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
          }`}
          style={{ width: `${summary.readiness === null ? 0 : summary.readiness}%` }}
        />
      </div>

      {open ? (
        <div className="mt-4 grid gap-3">
          {groups.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#AFC0D0] bg-[#F8FBFD] p-4 text-xs font-semibold text-[#5B6D80]">
              No Visa requirements are configured for this case yet.
            </div>
          ) : (
            groups.map(([category, rows]) => (
              <div key={category} className="rounded-xl border-2 border-[#D8B07B] bg-[#FFF8EF] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#123865]">{category}</p>
                  <span className="rounded-lg border border-[#AFC0D0] bg-white px-2 py-1 text-[9px] font-black text-[#5B6D80]">
                    {rows.length}
                  </span>
                </div>
                <div className="grid gap-2">
                  {rows.map((requirement) => {
                    const bucket = requirementBucket(requirement);
                    const due = deadlineMeta(requirement.due_date);
                    return (
                      <div key={requirement.id || `${category}-${requirement.requirement_name}`} className="rounded-xl border border-[#D5E0E9] bg-white p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black text-[#10233F]">{requirement.requirement_name || "Visa requirement"}</p>
                            {requirement.notes ? (
                              <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">{requirement.notes}</p>
                            ) : null}
                          </div>
                          <span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${requirementTone(bucket)}`}>
                            {pretty(requirement.status || bucket)}
                          </span>
                        </div>
                        {requirement.due_date ? (
                          <span className={`mt-2 inline-flex rounded-lg border px-2 py-1 text-[9px] font-black ${deadlineTone(due)}`}>
                            Due {formatDate(requirement.due_date)} · {due.label}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function HistoryPanel({ events = [] }) {
  const [open, setOpen] = useState(false);
  const rows = safeArray(events).slice(0, 12);

  return (
    <div className="rounded-[1.35rem] border-2 border-[#C9D6E2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700">Visa Audit Trail</p>
          <p className="mt-1 text-lg font-black text-[#10233F]">{events.length} recorded event{events.length === 1 ? "" : "s"}</p>
          <p className="mt-1 text-xs font-semibold text-[#5B6D80]">
            {events[0]?.created_at ? `Latest ${formatRelativeTime(events[0].created_at)}` : "No Visa event history yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-violet-300 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:border-violet-400"
        >
          {open ? "Hide" : "History"}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-2">
          {rows.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#AFC0D0] bg-[#F8FBFD] p-4 text-xs font-semibold text-[#5B6D80]">
              No Visa audit events have been recorded for this case.
            </div>
          ) : (
            rows.map((event) => (
              <div key={event.id || `${event.created_at}-${event.event_type}`} className="rounded-xl border border-[#D5E0E9] bg-[#F8FBFD] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-black text-[#10233F]">{event.event_label || pretty(event.event_type, "Visa event")}</p>
                  <span className="text-[9px] font-bold text-[#73869A]">{formatDateTime(event.created_at)}</span>
                </div>
                {event.reason ? (
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">{event.reason}</p>
                ) : null}
                {event.old_value || event.new_value ? (
                  <p className="mt-1 text-[10px] font-black text-violet-700">
                    {event.old_value || "—"} → {event.new_value || "—"}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function InfoCell({ icon: Icon, eyebrow, value, helper, tone = "navy" }) {
  const iconTone = {
    navy: "border-[#123865] bg-[#123865] text-white",
    orange: "border-orange-300 bg-orange-50 text-orange-700",
    rose: "border-rose-300 bg-rose-50 text-rose-700",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
    violet: "border-violet-300 bg-violet-50 text-violet-700",
    amber: "border-amber-300 bg-amber-50 text-amber-700",
  }[tone] || "border-[#123865] bg-[#123865] text-white";

  return (
    <div className="min-w-0 rounded-[1.2rem] border-2 border-[#D5E0E9] bg-[#F8FBFD] p-3">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${iconTone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#73869A]">{eyebrow}</p>
          <p className="mt-1 break-words text-sm font-black text-[#10233F]">{value || "—"}</p>
          {helper ? <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}

function MiniJourney({ record }) {
  const currentIndex = stageIndex(record.visa_stage || record.visa_status);

  return (
    <div className="rounded-[1.35rem] border-2 border-[#123865] bg-[#123865] p-4 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">Case Journey</p>
          <p className="mt-1 text-sm font-black text-white">{JOURNEY[currentIndex]?.label || "Prepare"} · step {currentIndex + 1}/{JOURNEY.length}</p>
        </div>
        <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black text-white">
          {pretty(record.visa_stage || record.visa_status, "Preparation")}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-9 gap-1.5">
        {JOURNEY.map((step, index) => (
          <div key={step.key} className="min-w-0 text-center">
            <div
              className={`mx-auto h-2.5 rounded-full ${
                index < currentIndex
                  ? "bg-emerald-400"
                  : index === currentIndex
                    ? "bg-orange-400"
                    : "bg-white/15"
              }`}
              title={step.label}
            />
            <p className={`mt-1 hidden text-[8px] font-black 2xl:block ${index === currentIndex ? "text-orange-200" : "text-blue-100"}`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisaCard({ record, counselor, compact, actionKey, onAction }) {
  const [showOperationalDetail, setShowOperationalDetail] = useState(false);
  const requirements = record.requirementStats;
  const risk = riskMeta(record.risk_level);
  const nextActionDue = deadlineMeta(record.next_action_due);
  const appointmentDue = deadlineMeta(record.appointment_date);
  const busyFollowUp = actionKey === `followup-${record.id}`;
  const busyReview = actionKey === `review-${record.id}`;
  const pressure = record.pressureScore;
  const financeRequired = optionalNumber(record.required_funds);
  const financeAvailable = optionalNumber(record.available_funds);
  const financeCoverage =
    financeRequired && financeRequired > 0 && financeAvailable !== null
      ? Math.round((financeAvailable / financeRequired) * 100)
      : null;

  const latestEvent = latestRecordEvent(record.events);

  return (
    <article className={`overflow-hidden rounded-[1.7rem] border-[3px] bg-[#FFFCF7] shadow-[0_14px_34px_rgba(16,35,63,0.10)] ${risk.card}`}>
      <div className="relative overflow-hidden border-b-[3px] border-orange-500 bg-[#123865] p-4 text-white sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border-[18px] border-white/5" />
        <div className="relative z-[1] flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-orange-300/60 bg-orange-400/15 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                Visa OS
              </span>
              {record.is_archived ? (
                <span className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Archived
                </span>
              ) : null}
              <span className={`rounded-lg border px-2 py-1 text-[9px] font-black ${risk.badge}`}>{risk.label} Risk</span>
            </div>

            <div className="mt-3 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
                <UserRound className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">{record.student.name}</h3>
                <p className="mt-1 break-words text-xs font-semibold leading-5 text-blue-100">
                  {record.universityName} · {record.courseName}
                </p>
                <p className="mt-1 text-[10px] font-bold text-blue-200">
                  {record.case_name || "Visa Case"} · {pretty(record.country || "Italy")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
            <span className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${statusTone(record.visa_status)}`}>
              {pretty(record.visa_status, "Not Started")}
            </span>
            <span className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
              {pretty(record.visa_stage, "Preparation")}
            </span>
            <span className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
              requirements.readiness === null
                ? "border-slate-300 bg-slate-50 text-slate-700"
                : requirements.readiness >= 80
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : requirements.readiness >= 50
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-rose-300 bg-rose-50 text-rose-700"
            }`}>
              {requirements.readiness === null ? "Readiness —" : `Ready ${requirements.readiness}%`}
            </span>
          </div>
        </div>

        <div className="relative z-[1] mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
          <div className={`h-full rounded-full ${risk.bar}`} style={{ width: `${pressure}%` }} />
        </div>
        <div className="relative z-[1] mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-blue-100">
          <span>Operational pressure {pressure}%</span>
          <span>{record.updated_at ? `Updated ${formatRelativeTime(record.updated_at)}` : "Update time unavailable"}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCell
            icon={ClipboardCheck}
            eyebrow="Next Action"
            value={record.next_action || (isApprovedVisa(record) ? "Visa approved — close remaining travel steps" : "Define the next counselor action")}
            helper={record.next_action_due ? `${formatDate(record.next_action_due)} · ${nextActionDue.label}` : "No due date recorded"}
            tone={nextActionDue.overdue ? "rose" : nextActionDue.dueSoon ? "orange" : "navy"}
          />
          <InfoCell
            icon={CalendarClock}
            eyebrow="Visa Appointment"
            value={record.appointment_date ? formatDate(record.appointment_date) : "Not booked"}
            helper={[
              record.appointment_time,
              record.appointment_location || record.visa_center || record.embassy_or_consulate,
              record.appointment_date ? appointmentDue.label : "Schedule when ready",
            ].filter(Boolean).join(" · ")}
            tone={appointmentDue.overdue ? "rose" : record.appointment_date ? "orange" : "navy"}
          />
          <InfoCell
            icon={FileCheck2}
            eyebrow="Requirement Readiness"
            value={requirements.total ? `${requirements.cleared}/${requirements.total} cleared` : "No checklist"}
            helper={`${requirements.attention} attention · ${requirements.open} open`}
            tone={requirements.attention ? "rose" : requirements.open ? "amber" : requirements.total ? "emerald" : "navy"}
          />
          <InfoCell
            icon={Landmark}
            eyebrow="Embassy / Center"
            value={record.embassy_or_consulate || record.visa_center || "Not recorded"}
            helper={record.appointment_reference ? `Ref ${record.appointment_reference}` : "No appointment reference"}
            tone="violet"
          />
        </div>

        <div className="mt-3">
          <MiniJourney record={record} />
        </div>

        {!compact ? (
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <RequirementPanel requirements={record.requirements} summary={requirements} />
            <div className="grid gap-3">
              <div className="rounded-[1.35rem] border-2 border-[#C9D6E2] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">Financial & Stay Readiness</p>
                    <p className="mt-1 text-lg font-black text-[#10233F]">
                      {financeCoverage === null ? "Financial position not fully recorded" : `${financeCoverage}% funds coverage`}
                    </p>
                  </div>
                  <WalletCards className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#D5E0E9] bg-[#F8FBFD] p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#73869A]">Funds</p>
                    <p className="mt-1 text-xs font-black text-[#10233F]">
                      {financeRequired === null ? "Required —" : `${record.funds_currency || "EUR"} ${financeRequired.toLocaleString()}`}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-[#5B6D80]">
                      {financeAvailable === null ? "Available funds not recorded" : `Available ${record.funds_currency || "EUR"} ${financeAvailable.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#D5E0E9] bg-[#F8FBFD] p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#73869A]">Evidence</p>
                    <p className="mt-1 text-xs font-black text-[#10233F]">{pretty(record.financial_evidence_status, "Not recorded")}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[#5B6D80]">
                      Accommodation {pretty(record.accommodation_status, "—")} · Insurance {pretty(record.insurance_status, "—")}
                    </p>
                  </div>
                </div>
              </div>

              <HistoryPanel events={record.events} />
            </div>
          </div>
        ) : null}

        <div className="mt-3 rounded-[1.35rem] border-2 border-[#D8B07B] bg-[#FFF8EF] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">Counselor Operational Notes</p>
              <p className="mt-1 text-sm font-black text-[#10233F]">
                {record.risk_reason || record.embassy_notes || record.internal_notes || "No internal Visa note has been recorded."}
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">
                Application: {pretty(applicationStatus(record.application), "Status not recorded")}
                {latestEvent ? ` · Latest Visa event ${formatRelativeTime(latestEvent.created_at)}` : " · No Visa audit event yet"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOperationalDetail((value) => !value)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-[#123865] bg-white px-3 py-2 text-xs font-black text-[#123865] hover:bg-[#F1F6FA]"
            >
              {showOperationalDetail ? "Less Detail" : "More Detail"}
              {showOperationalDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showOperationalDetail ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCell icon={BadgeCheck} eyebrow="Biometrics" value={formatDate(record.biometrics_date)} helper="Recorded milestone" tone="emerald" />
              <InfoCell icon={ShieldCheck} eyebrow="Medical" value={formatDate(record.medical_date)} helper="Where applicable" tone="emerald" />
              <InfoCell icon={Stamp} eyebrow="Decision" value={formatDate(record.decision_at)} helper={isRefusedVisa(record) ? pretty(record.refusal_reason, "Refusal/reapply signal") : pretty(record.visa_status)} tone={isRefusedVisa(record) ? "rose" : isApprovedVisa(record) ? "emerald" : "violet"} />
              <InfoCell icon={Clock3} eyebrow="Passport Collection" value={formatDate(record.passport_collection_date)} helper={record.visa_valid_until ? `Valid until ${formatDate(record.visa_valid_until)}` : "Validity not recorded"} tone="navy" />
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t-2 border-[#D8B07B] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAction("followup", record)}
              disabled={Boolean(actionKey)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busyFollowUp ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {busyFollowUp ? "Creating..." : "Create Visa Follow-up"}
            </button>
            <button
              type="button"
              onClick={() => onAction("review", record)}
              disabled={Boolean(actionKey)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busyReview ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
              {busyReview ? "Logging..." : "Log Visa Review"}
            </button>
          </div>

          <p className="text-[10px] font-bold text-[#73869A]">
            Counselor view is operational. Visa case authority remains with Admin Visa OS.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CounselorVisaWorkspace({ snapshot, counselor, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [actionKey, setActionKey] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(() => readSessionValue(FILTER_STORAGE_KEY, "all"));
  const [sort, setSort] = useState(() => readSessionValue(SORT_STORAGE_KEY, "priority"));
  const [view, setView] = useState(() => readSessionValue(VIEW_STORAGE_KEY, "detailed"));

  useEffect(() => {
    if (!FILTERS.some((item) => item.key === filter)) setFilter("all");
  }, [filter]);

  useEffect(() => {
    if (!SORTS.some((item) => item.key === sort)) setSort("priority");
  }, [sort]);

  useEffect(() => {
    if (!["detailed", "compact"].includes(view)) setView("detailed");
  }, [view]);

  useEffect(() => writeSessionValue(FILTER_STORAGE_KEY, filter), [filter]);
  useEffect(() => writeSessionValue(SORT_STORAGE_KEY, sort), [sort]);
  useEffect(() => writeSessionValue(VIEW_STORAGE_KEY, view), [view]);

  const queue = useMemo(() => {
    return buildCounselorVisaQueue(snapshot || {}).map((record) => {
      const requirementStats = summarizeRequirements(record.requirements);
      const hydrated = {
        ...record,
        is_archived: Boolean(record.isArchived || record.is_archived || record.archived_at),
        requirementStats,
      };

      return {
        ...hydrated,
        pressureScore: calculatePressure(hydrated),
      };
    });
  }, [snapshot]);

  const stats = useMemo(() => {
    const active = queue.filter((record) => !record.is_archived);
    const uniqueStudents = new Set(
      active
        .map((record) => identityKey(record.studentType, record.studentId))
        .filter(Boolean)
    );
    const assessed = active.filter((record) => record.requirementStats.readiness !== null);
    const requirementAttention = active.reduce(
      (sum, record) => sum + record.requirementStats.attention,
      0
    );

    return {
      total: active.length,
      archived: queue.length - active.length,
      students: uniqueStudents.size,
      highPressure: active.filter((record) => record.pressureScore >= 60).length,
      appointments: active.filter((record) => {
        const meta = deadlineMeta(record.appointment_date);
        return meta.days !== null && meta.days >= 0 && meta.days <= 30;
      }).length,
      submittedReview: active.filter((record) => isSubmittedOrReview(record)).length,
      approved: active.filter((record) => isApprovedVisa(record)).length,
      refused: active.filter((record) => isRefusedVisa(record)).length,
      requirementAttention,
      noChecklist: active.filter((record) => record.requirementStats.total === 0).length,
      overdueActions: active.filter((record) => deadlineMeta(record.next_action_due).overdue).length,
      avgReadiness: assessed.length
        ? Math.round(
            assessed.reduce(
              (sum, record) => sum + safeNumber(record.requirementStats.readiness),
              0
            ) / assessed.length
          )
        : null,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = normalize(query);
    let next = queue;

    if (filter !== "archived") next = next.filter((record) => !record.is_archived);
    if (filter === "archived") next = next.filter((record) => record.is_archived);
    if (filter === "attention") {
      next = next.filter(
        (record) =>
          record.pressureScore >= 60 ||
          record.requirementStats.attention > 0 ||
          deadlineMeta(record.next_action_due).overdue
      );
    }
    if (filter === "appointment") {
      next = next.filter((record) => {
        const meta = deadlineMeta(record.appointment_date);
        return meta.days !== null && meta.days >= 0 && meta.days <= 30;
      });
    }
    if (filter === "requirements") {
      next = next.filter(
        (record) =>
          record.requirementStats.attention > 0 ||
          record.requirementStats.open > 0 ||
          record.requirementStats.total === 0
      );
    }
    if (filter === "submitted") next = next.filter((record) => isSubmittedOrReview(record));
    if (filter === "approved") next = next.filter((record) => isApprovedVisa(record));
    if (filter === "refused") next = next.filter((record) => isRefusedVisa(record));

    if (search) {
      next = next.filter((record) =>
        normalize(
          [
            record.student?.name,
            record.student?.email,
            record.case_name,
            record.universityName,
            record.courseName,
            record.country,
            record.visa_status,
            record.visa_stage,
            record.risk_level,
            record.risk_reason,
            record.next_action,
            record.visa_center,
            record.embassy_or_consulate,
            record.financial_evidence_status,
            applicationStatus(record.application),
            ...safeArray(record.requirements).map(
              (requirement) => requirement.requirement_name
            ),
          ].join(" ")
        ).includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "updated") {
        return dateMs(b.updated_at || b.created_at) - dateMs(a.updated_at || a.created_at);
      }
      if (sort === "student") {
        return safeString(a.student?.name).localeCompare(safeString(b.student?.name));
      }
      if (sort === "status") {
        return safeString(a.visa_status).localeCompare(safeString(b.visa_status));
      }
      if (sort === "readiness") {
        const aReady = a.requirementStats.readiness === null ? -1 : a.requirementStats.readiness;
        const bReady = b.requirementStats.readiness === null ? -1 : b.requirementStats.readiness;
        return aReady - bReady;
      }
      if (sort === "appointment") {
        const aTime = dateMs(a.appointment_date) || Number.MAX_SAFE_INTEGER;
        const bTime = dateMs(b.appointment_date) || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }
      if (sort === "due") {
        const aTime = dateMs(a.next_action_due) || Number.MAX_SAFE_INTEGER;
        const bTime = dateMs(b.next_action_due) || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }
      return b.pressureScore - a.pressureScore;
    });
  }, [queue, query, filter, sort]);

  const runAction = useCallback(
    async (kind, record) => {
      if (actionKey || !record) return;

      const key = `${kind}-${record.id}`;
      setActionKey(key);
      setStatus(null);

      try {
        if (kind === "followup") {
          const title = record.next_action || "Visa readiness follow-up";

          await createCounselorTask({
            studentId: record.studentId,
            studentType: record.studentType,
            studentName: record.student?.name || record.studentName,
            title,
            description: `Visa follow-up for ${record.universityName || "the active visa case"}: ${title}`,
            category: record.pressureScore >= 60 ? "Visa Recovery" : "Visa Readiness",
            priority: record.pressureScore >= 75 ? "Urgent" : "High",
            counselor,
            metadata: {
              visaId: record.id,
              applicationId: record.application_id || null,
              universityName: record.universityName,
              courseName: record.courseName,
              visaStatus: record.visa_status,
              visaStage: record.visa_stage,
              riskLevel: record.risk_level,
              readinessScore: record.requirementStats.readiness,
              pressureScore: record.pressureScore,
              studentType: record.studentType,
              actionSource: "CounselorVisaWorkspace",
            },
          });

          await writeCounselorTimelineEvent({
            studentId: record.studentId,
            studentName: record.student?.name || record.studentName,
            eventType: "visa_followup_created",
            title: "Visa follow-up created",
            description: title,
            counselor,
            metadata: {
              visaId: record.id,
              applicationId: record.application_id || null,
              visaStatus: record.visa_status,
              visaStage: record.visa_stage,
              riskLevel: record.risk_level,
              readinessScore: record.requirementStats.readiness,
              pressureScore: record.pressureScore,
              studentType: record.studentType,
              actionSource: "CounselorVisaWorkspace",
            },
          });

          await writeCounselorVisaEvent({
            visaId: record.id,
            studentId: record.studentId,
            studentType: record.studentType,
            applicationId: record.application_id || null,
            eventType: "counselor_followup_created",
            eventLabel: "Counselor Visa follow-up created",
            reason: title,
            counselor,
            metadata: { pressureScore: record.pressureScore },
          });

          setStatus({
            type: "success",
            message: `Visa follow-up created for ${record.student?.name || record.studentName}.`,
          });
        } else {
          const reviewDescription = `${pretty(
            record.visa_stage,
            "Preparation"
          )} · ${pretty(record.visa_status, "Not Started")} · ${record.universityName}`;

          await writeCounselorTimelineEvent({
            studentId: record.studentId,
            studentName: record.student?.name || record.studentName,
            eventType: "visa_review",
            title: "Visa case reviewed by counselor",
            description: reviewDescription,
            counselor,
            metadata: {
              visaId: record.id,
              applicationId: record.application_id || null,
              visaStatus: record.visa_status,
              visaStage: record.visa_stage,
              riskLevel: record.risk_level,
              readinessScore: record.requirementStats.readiness,
              pressureScore: record.pressureScore,
              requirementAttention: record.requirementStats.attention,
              studentType: record.studentType,
              actionSource: "CounselorVisaWorkspace",
            },
          });

          await writeCounselorVisaEvent({
            visaId: record.id,
            studentId: record.studentId,
            studentType: record.studentType,
            applicationId: record.application_id || null,
            eventType: "counselor_review",
            eventLabel: "Visa case reviewed by counselor",
            reason: reviewDescription,
            counselor,
            metadata: {
              readinessScore: record.requirementStats.readiness,
              requirementAttention: record.requirementStats.attention,
            },
          });

          setStatus({
            type: "success",
            message: `Visa review logged for ${record.student?.name || record.studentName}.`,
          });
        }

        await Promise.resolve(onRefresh?.());
      } catch (actionError) {
        console.error("Counselor Visa action failed", actionError);
        setStatus({
          type: "error",
          message:
            actionError?.message ||
            "Visa counselor action could not be completed. Check task/timeline access and try again.",
        });
      } finally {
        setActionKey("");
      }
    },
    [actionKey, counselor, onRefresh]
  );

  const refreshWorkspace = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setStatus(null);
    try {
      await Promise.resolve(onRefresh?.());
    } catch (refreshError) {
      console.error("Counselor Visa refresh failed", refreshError);
      setStatus({
        type: "error",
        message: refreshError?.message || "Visa workspace refresh could not be completed.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const reset = () => {
    setFilter("all");
    setSort("priority");
    setView("detailed");
    setQuery("");
    setStatus(null);
  };

  const hasActiveControls =
    Boolean(query) || filter !== "all" || sort !== "priority" || view !== "detailed";

  return (
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] sm:p-5 xl:flex xl:items-start xl:justify-between xl:gap-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1] min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Visa OS · Counselor Command</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Italy Visa Readiness & Decision Operations</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
            Operate assigned Visa cases with the same live Admin/Student Visa source: readiness, appointments, embassy movement, requirements, finance, risk, decisions and permanent counselor follow-up.
          </p>
        </div>

        <div className="relative z-[1] mt-4 flex flex-wrap gap-2 xl:mt-0 xl:max-w-lg xl:justify-end">
          <SignalBadge tone="orange">{filtered.length}/{queue.length} Visible</SignalBadge>
          <SignalBadge tone="navy">{stats.students} Students</SignalBadge>
          <SignalBadge tone={stats.highPressure ? "rose" : "green"}>{stats.highPressure} High Pressure</SignalBadge>
          <SignalBadge tone={stats.requirementAttention ? "amber" : "green"}>{stats.requirementAttention} Requirement Issues</SignalBadge>
          <button
            type="button"
            onClick={refreshWorkspace}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 rounded-[1.25rem] border-2 border-[#D8B07B] bg-[#FFFCF7] p-3">
        <span className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${sourceTone("live")}`}>
          Visa Cases · shared snapshot
        </span>
        <span className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${sourceTone("live")}`}>
          Requirements · shared snapshot
        </span>
        <span className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${sourceTone("live")}`}>
          Audit History · shared snapshot
        </span>
        <span className="rounded-lg border border-[#AFC0D0] bg-[#F1F6FA] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#123865]">
          Assigned Scope · {stats.students} students
        </span>
      </div>

      <VisaJourneyRail records={queue.filter((record) => !record.is_archived)} />

      <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_12px_28px_rgba(16,35,63,0.08)] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <VisaStat label="Active Cases" value={stats.total} helper={`${stats.students} students`} tone="orange" active={filter === "all"} onClick={() => setFilter("all")} />
        <VisaStat label="Needs Action" value={stats.highPressure} helper={`${stats.overdueActions} overdue`} tone="rose" active={filter === "attention"} onClick={() => setFilter("attention")} />
        <VisaStat label="Appointments" value={stats.appointments} helper="next 30 days" tone="amber" active={filter === "appointment"} onClick={() => setFilter("appointment")} />
        <VisaStat label="Submitted / Review" value={stats.submittedReview} helper="embassy movement" tone="violet" active={filter === "submitted"} onClick={() => setFilter("submitted")} />
        <VisaStat label="Approved" value={stats.approved} helper="positive decisions" tone="emerald" active={filter === "approved"} onClick={() => setFilter("approved")} />
        <VisaStat label="Requirement Attention" value={stats.requirementAttention} helper={`${stats.noChecklist} no checklist`} tone={stats.requirementAttention ? "rose" : "amber"} active={filter === "requirements"} onClick={() => setFilter("requirements")} />
        <VisaStat label="Refusal / Reapply" value={stats.refused} helper="recovery signal" tone={stats.refused ? "rose" : "navy"} active={filter === "refused"} onClick={() => setFilter("refused")} />
        <VisaStat label="Avg Readiness" value={stats.avgReadiness === null ? "—" : `${stats.avgReadiness}%`} helper={`${stats.archived} archived`} tone="navy" />
      </div>

      <div className="mb-5">
        <VisaStrategyPanel stats={stats} onFilter={setFilter} />
      </div>

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <div className="mb-5 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,90,10,0.12)]">
        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_210px_220px_auto_auto]">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, university, programme, Visa stage, requirement, embassy or next action..."
              className={`${INPUT_CLASS} pl-11`}
            />
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          </div>

          <select value={filter} onChange={(event) => setFilter(event.target.value)} className={INPUT_CLASS} aria-label="Filter Visa cases">
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>

          <select value={sort} onChange={(event) => setSort(event.target.value)} className={INPUT_CLASS} aria-label="Sort Visa cases">
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>Sort: {item.label}</option>
            ))}
          </select>

          <div className="flex rounded-2xl border-2 border-[#D8B07B] bg-[#FFFCF7] p-1">
            {[
              ["detailed", "Command"],
              ["compact", "Compact"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                  view === value ? "bg-orange-500 text-white" : "text-[#123865] hover:bg-orange-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={!hasActiveControls}
            className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] hover:shadow-md disabled:cursor-default disabled:opacity-45"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
          Visa command · {filtered.length} visible case{filtered.length === 1 ? "" : "s"}
        </p>
        <p className="text-xs font-semibold text-blue-100">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Operational Priority"} · View: {view === "compact" ? "Compact" : "Command"}
        </p>
      </div>

      <div className="grid min-w-0 gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#FFFCF7] p-8 text-center shadow-inner">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50">
              {safeArray(snapshot?.students).length === 0 ? <UserRound className="h-6 w-6 text-orange-700" /> : <ShieldCheck className="h-6 w-6 text-orange-700" />}
            </div>
            <p className="mt-3 text-sm font-black text-[#10233F]">
              {safeArray(snapshot?.students).length === 0
                ? "No assigned counselor student identities are available yet."
                : queue.length === 0
                  ? "No Visa cases exist yet for the assigned counselor scope."
                  : "No Visa cases match this command view."}
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#5B6D80]">
              {queue.length === 0
                ? "Create or link the Visa Case in Admin Visa OS after the student reaches the Visa stage. It will then appear here without creating a duplicate counselor-side Visa record."
                : "Clear the active search/filter controls to return to the full assigned Visa portfolio."}
            </p>
            {hasActiveControls ? (
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400"
              >
                Clear Search & Filters
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((record) => (
            <VisaCard
              key={record.id || `${record.studentType}-${record.studentId}-${record.application_id}`}
              record={record}
              counselor={counselor}
              compact={view === "compact"}
              actionKey={actionKey}
              onAction={runAction}
            />
          ))
        )}
      </div>

      <div className="mt-5 rounded-[1.35rem] border-2 border-[#123865] bg-[#123865] p-4 text-white">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" aria-hidden="true" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Architecture Guardrail</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">
              This counselor workspace reads the real Visa OS and adds counselor follow-up/audit activity only. It intentionally does not create a parallel Visa table or directly overwrite Admin-controlled Visa decisions, requirements or financial data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
