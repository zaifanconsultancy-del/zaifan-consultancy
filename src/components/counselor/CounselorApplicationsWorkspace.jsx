import React, { useEffect, useMemo, useState } from "react";
import {
  buildCounselorApplicationQueue,
  createCounselorTask,
  formatRelativeTime,
  writeCounselorTimelineEvent,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "blocked", label: "Blocked" },
  { key: "offer", label: "Offer" },
  { key: "pre_enrollment", label: "Pre-enrolment" },
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "Review" },
];

const SORTS = [
  { key: "priority", label: "Priority" },
  { key: "updated", label: "Recently Updated" },
  { key: "student", label: "Student" },
  { key: "university", label: "University" },
  { key: "course", label: "Course" },
  { key: "status", label: "Application Status" },
  { key: "offer", label: "Offer Status" },
  { key: "pre_enrollment", label: "Pre-enrolment Status" },
];

const APPLICATION_FILTER_STORAGE_KEY = "zaifan_counselor_applications_filter";
const APPLICATION_SORT_STORAGE_KEY = "zaifan_counselor_applications_sort";
const APPLICATION_VIEW_STORAGE_KEY = "zaifan_counselor_applications_view";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function safeDateMs(value) {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function readSessionValue(key, fallback) {
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
    // Workspace preferences are optional.
  }
}

function normalizeFilter(value) {
  return VALID_FILTERS.has(value) ? value : "all";
}

function normalizeSort(value) {
  return VALID_SORTS.has(value) ? value : "priority";
}

function getStableApplicationKey(item = {}, index = 0) {
  return (
    item.id ||
    item.application_id ||
    `${item.studentName || "student"}-${item.universityName || "university"}-${item.courseName || index}`
  );
}

function applicationText(item = {}) {
  return lower(
    [
      item.studentName,
      item.universityName,
      item.courseName,
      item.status,
      item.offerStatus,
      item.preEnrollmentStatus,
      item.visaStatus,
      item.stageLabel,
      item.nextAction,
      item.intake,
      item.country,
    ].join(" ")
  );
}

function isBlocked(item = {}) {
  const text = applicationText(item);

  return (
    safeNumber(item.priorityScore) >= 70 ||
    text.includes("blocked") ||
    text.includes("rejected") ||
    text.includes("missing document") ||
    text.includes("action required")
  );
}

function hasOffer(item = {}) {
  const text = lower(`${item.offerStatus} ${item.status}`);
  return (
    text.includes("offer") ||
    text.includes("conditional") ||
    text.includes("unconditional") ||
    text.includes("accepted")
  );
}

function preEnrollmentValidated(item = {}) {
  const value = lower(item.preEnrollmentStatus);
  return value.includes("validated") || value.includes("completed");
}

function preEnrollmentPending(item = {}) {
  const value = lower(item.preEnrollmentStatus);

  return (
    value.includes("started") ||
    value.includes("submitted") ||
    value.includes("pending") ||
    value.includes("processing")
  );
}

function isSubmitted(item = {}) {
  const value = lower(item.status);

  return (
    value.includes("submitted") ||
    value.includes("applied") ||
    value.includes("lodged")
  );
}

function needsReview(item = {}) {
  const value = lower(`${item.status} ${item.nextAction}`);

  return (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("check") ||
    value.includes("verify")
  );
}

function calculateApplicationReadiness(item = {}) {
  const direct = safeNumber(
    item.readinessScore ?? item.journeyProgress,
    -1
  );

  if (direct >= 0) return Math.max(0, Math.min(100, direct));

  let score = 0;
  if (item.universityName && !lower(item.universityName).includes("not selected")) score += 20;
  if (item.courseName && !lower(item.courseName).includes("not selected")) score += 20;
  if (isSubmitted(item)) score += 20;
  if (hasOffer(item)) score += 20;
  if (preEnrollmentValidated(item)) score += 20;

  if (isBlocked(item)) score -= 25;

  return Math.max(0, Math.min(100, score));
}

function getApplicationPressure(item = {}) {
  return (
    safeNumber(item.priorityScore) +
    (isBlocked(item) ? 35 : 0) +
    (needsReview(item) ? 12 : 0) +
    (preEnrollmentPending(item) ? 8 : 0) +
    (!hasOffer(item) && isSubmitted(item) ? 6 : 0)
  );
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("reject") || value.includes("fail") || value.includes("block")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }
  if (value.includes("offer")) return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (value.includes("submitted") || value.includes("applied"))
    return "border-orange-300 bg-orange-50 text-orange-700";
  if (value.includes("review") || value.includes("pending"))
    return "border-amber-300 bg-amber-50 text-amber-700";

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function offerTone(offerStatus = "") {
  const value = lower(offerStatus);

  if (
    value.includes("accepted") ||
    value.includes("unconditional") ||
    value.includes("received")
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("conditional")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  if (value.includes("rejected") || value.includes("declined")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function preEnrollmentTone(preEnrollmentStatus = "") {
  const value = lower(preEnrollmentStatus);

  if (value.includes("validated") || value.includes("completed")) {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  if (
    value.includes("started") ||
    value.includes("submitted") ||
    value.includes("pending") ||
    value.includes("processing")
  ) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-[#AFC0D0] bg-[#eef5fb] text-[#123865]";
}

function ApplicationStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#123865] bg-[#F1F6FA]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <div className={`relative overflow-hidden rounded-[1.3rem] border-2 p-4 shadow-[0_9px_22px_rgba(16,35,63,0.08)] ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5B6D80]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-[#5B6D80]">{helper}</p> : null}
    </div>
  );
}

function PriorityMeter({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold text-[#5B6D80]">Priority pressure</span>
        <span className="font-black text-[#10233F]">{score}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EBF2]">
        <div
          className={`h-full rounded-full ${
            score >= 70 ? "bg-rose-500" : score >= 45 ? "bg-orange-500" : "bg-[#123865]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ReadinessMeter({ value }) {
  const score = Math.max(0, Math.min(100, safeNumber(value)));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold text-[#5B6D80]">Journey readiness</span>
        <span className="font-black text-[#10233F]">{score}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EBF2]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 80
              ? "bg-emerald-500"
              : score >= 55
                ? "bg-orange-500"
                : "bg-[#123865]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ApplicationHealthBadge({ item }) {
  const readiness = calculateApplicationReadiness(item);
  const stage = lower(item.stage || item.stageLabel);

  let label = item.stageLabel || "Plan";
  let className = "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";

  if (isBlocked(item)) {
    label = "Recovery Required";
    className = "border-rose-300 bg-rose-50 text-rose-700";
  } else if (stage.includes("enrollment") || readiness >= 100) {
    label = "Enrollment Complete";
    className = "border-emerald-300 bg-emerald-50 text-emerald-700";
  } else if (preEnrollmentValidated(item)) {
    label = "Pre-enrolment Validated";
    className = "border-violet-300 bg-violet-50 text-violet-700";
  } else if (hasOffer(item)) {
    label = "Decision Stage";
    className = "border-emerald-300 bg-emerald-50 text-emerald-700";
  } else if (readiness >= 50) {
    label = item.stageLabel || "Moving";
    className = "border-orange-300 bg-orange-50 text-orange-700";
  }

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${className}`}
    >
      {label}
    </span>
  );
}


function ApplicationJourneyRail({ queue = [] }) {
  const steps = [
    {
      key: "plan",
      label: "Plan",
      helper: "University, programme and intake",
      matches: ["plan", "planning"],
    },
    {
      key: "prepare",
      label: "Prepare",
      helper: "Documents, fees and final review",
      matches: ["prepare", "preparation", "ready"],
    },
    {
      key: "submit",
      label: "Submit",
      helper: "Application sent to university",
      matches: ["submit", "submitted"],
    },
    {
      key: "review",
      label: "Review",
      helper: "University assessment",
      matches: ["review", "under review"],
    },
    {
      key: "decision",
      label: "Decision",
      helper: "Offer, admission or outcome",
      matches: ["decision", "offer", "admitted", "waitlist", "reject"],
    },
    {
      key: "pre_enrollment",
      label: "Pre-enrolment",
      helper: "Universitaly submission and validation",
      matches: ["pre-enrol", "pre enrollment", "universitaly"],
    },
    {
      key: "enrollment",
      label: "Enrollment",
      helper: "Final university enrollment",
      matches: ["enroll"],
    },
  ];

  const counts = steps.reduce((result, step) => {
    result[step.key] = safeArray(queue).filter((item) => {
      const text = lower(
        `${item.stageLabel} ${item.stage} ${item.status} ${item.offerStatus} ${item.preEnrollmentStatus}`
      );
      return step.matches.some((match) => text.includes(match));
    }).length;
    return result;
  }, {});

  return (
    <div className="mb-5 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFFCF7] shadow-[0_14px_34px_rgba(16,35,63,0.10)]">
      <div className="flex flex-col gap-2 border-b-2 border-orange-500 bg-[#FFF8EF] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Italy Application Journey
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            The same seven-stage language used across Admin, Counselor and Student Portal
          </p>
        </div>
        <span className="self-start rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2 text-xs font-black text-white">
          {safeArray(queue).length} active record{safeArray(queue).length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="relative overflow-hidden rounded-[1.1rem] border-2 border-[#C9D6E2] bg-white p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#123865] bg-[#123865] text-xs font-black text-white">
                {index + 1}
              </span>
              <span className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-black text-orange-700">
                {counts[step.key] || 0}
              </span>
            </div>
            <p className="mt-3 text-sm font-black text-[#10233F]">{step.label}</p>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-[#5B6D80]">
              {step.helper}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({
  item,
  counselor,
  onRefresh,
  setStatus,
  compact = false,
}) {
  const [saving, setSaving] = useState("");
  const blocked = isBlocked(item);
  const readiness = calculateApplicationReadiness(item);
  const pressure = getApplicationPressure(item);

  const studentId =
    item.student_id ||
    item.inquiry_id ||
    item.appointment_id ||
    item.studentId ||
    item.id;

  const createFollowUp = async () => {
    if (saving) return;
    setSaving("task");
    setStatus(null);

    try {
      await createCounselorTask({
        studentId,
        studentName: item.studentName,
        title: item.nextAction || "Application follow-up",
        category: blocked ? "Application Recovery" : "Application Progress",
        priority: blocked ? "Urgent" : "High",
        counselor,
        metadata: {
          applicationId: item.id,
          universityName: item.universityName,
          courseName: item.courseName,
          status: item.status,
          offerStatus: item.offerStatus,
          preEnrollmentStatus: item.preEnrollmentStatus,
          priorityScore: safeNumber(item.priorityScore),
          readinessScore: readiness,
          blocked,
          actionSource: "CounselorApplicationsWorkspace",
        },
      });

      await writeCounselorTimelineEvent({
        studentId,
        studentName: item.studentName,
        eventType: "application_followup_created",
        title: "Application follow-up created",
        description: item.nextAction || "Application follow-up created by counselor.",
        counselor,
        metadata: {
          applicationId: item.id,
          universityName: item.universityName,
          courseName: item.courseName,
          status: item.status,
          offerStatus: item.offerStatus,
          preEnrollmentStatus: item.preEnrollmentStatus,
          readinessScore: readiness,
          blocked,
          actionSource: "CounselorApplicationsWorkspace",
        },
      });

      setStatus({
        type: "success",
        message: `Application follow-up created for ${item.studentName}.`,
      });
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Application follow-up failed", error);
      setStatus({
        type: "error",
        message:
          error?.message ||
          "Application follow-up could not be created. Check Supabase task access and try again.",
      });
    } finally {
      setSaving("");
    }
  };

  const logReview = async () => {
    if (saving) return;
    setSaving("review");
    setStatus(null);

    try {
      await writeCounselorTimelineEvent({
        studentId,
        studentName: item.studentName,
        eventType: "application_review",
        title: "Application reviewed by counselor",
        description: `${item.universityName} · ${item.courseName} · ${item.status}`,
        counselor,
        metadata: {
          applicationId: item.id,
          offerStatus: item.offerStatus,
          preEnrollmentStatus: item.preEnrollmentStatus,
          priorityScore: safeNumber(item.priorityScore),
          readinessScore: readiness,
          pressureScore: pressure,
          blocked,
          actionSource: "CounselorApplicationsWorkspace",
        },
      });

      setStatus({
        type: "success",
        message: `Application review logged for ${item.studentName}.`,
      });
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Application review failed", error);
      setStatus({
        type: "error",
        message:
          error?.message ||
          "Application review could not be logged. Check timeline access and try again.",
      });
    } finally {
      setSaving("");
    }
  };

  return (
    <article
      className={`overflow-hidden rounded-[1.6rem] border-[3px] p-4 shadow-[0_14px_34px_rgba(16,35,63,0.10)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(16,35,63,0.14)] sm:p-5 ${
        blocked
          ? "border-rose-300 bg-rose-50/80 hover:border-rose-400"
          : "border-[#B9C8D8] bg-[#FFFCF7] hover:border-orange-300"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.7fr_0.9fr_0.45fr] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#10233F]">{item.studentName}</h3>
            {blocked ? (
              <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">
                Blocked
              </span>
            ) : null}

            <ApplicationHealthBadge item={item} />
            <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
              {item.stageLabel || "Plan"} · {readiness}%
            </span>
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#5B6D80]">
            {item.universityName} · {item.courseName}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(item.status)}`}>
              {item.status}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${offerTone(
                item.offerStatus
              )}`}
            >
              Offer {item.offerStatus || "Pending"}
            </span>

            <span className={`rounded-full border px-3 py-1 text-xs font-black ${preEnrollmentTone(item.preEnrollmentStatus)}`}>
              Pre-enrolment {item.preEnrollmentStatus}
            </span>
          </div>
        </div>

        <div className="rounded-[1.25rem] border-2 border-[#AFC0D0] bg-[#F7FAFC] p-3.5">
          <PriorityMeter value={item.priorityScore} />

          {!compact ? (
            <div className="mt-3">
              <ReadinessMeter value={readiness} />
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[#6B7D8F]">
              Updated {formatRelativeTime(item.updatedAt)}
            </span>
            <span
              className={`rounded-full border px-2 py-1 font-black ${
                pressure >= 90
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : pressure >= 60
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-[#AFC0D0] bg-white text-[#123865]"
              }`}
            >
              Pressure {Math.round(pressure)}
            </span>
          </div>
        </div>

        <div className="rounded-[1.25rem] border-2 border-orange-300 bg-[#FFF4E8] p-3.5 shadow-inner">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Next Action
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#10233F]">
            {item.nextAction || "Review application and define the next counselor action."}
          </p>

          {!compact ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#D8B07B] bg-[#FFFCF7] px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#7d684f]">
                  Offer
                </p>
                <p className="mt-1 text-xs font-black text-[#10233F]">
                  {item.offerStatus || "Pending"}
                </p>
              </div>

              <div className="rounded-xl border border-[#D8B07B] bg-[#FFFCF7] px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#7d684f]">
                  Pre-enrolment
                </p>
                <p className="mt-1 text-xs font-black text-[#10233F]">
                  {item.preEnrollmentStatus || "Not started"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={createFollowUp}
            disabled={Boolean(saving)}
            className="rounded-xl border-2 border-orange-500 bg-orange-500 px-3 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving === "task" ? "Creating..." : "Create Task"}
          </button>
          <button
            type="button"
            onClick={logReview}
            disabled={Boolean(saving)}
            className="rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving === "review" ? "Saving..." : "Log Review"}
          </button>
        </div>
      </div>
    </article>
  );
}

function StatusToast({ status, onClear }) {
  if (!status?.message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
        status.type === "error"
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span>{status.message}</span>
      <button type="button" onClick={onClear} className="text-xs font-black">
        Clear
      </button>
    </div>
  );
}

export default function CounselorApplicationsWorkspace({
  snapshot,
  counselor,
  onRefresh,
}) {
  const queue = useMemo(
    () => buildCounselorApplicationQueue(snapshot || {}),
    [snapshot]
  );

  const [filter, setFilter] = useState(() =>
    normalizeFilter(readSessionValue(APPLICATION_FILTER_STORAGE_KEY, "all"))
  );
  const [sort, setSort] = useState(() =>
    normalizeSort(readSessionValue(APPLICATION_SORT_STORAGE_KEY, "priority"))
  );
  const [view, setView] = useState(() =>
    readSessionValue(APPLICATION_VIEW_STORAGE_KEY, "detailed") === "compact"
      ? "compact"
      : "detailed"
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    writeSessionValue(APPLICATION_FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(APPLICATION_SORT_STORAGE_KEY, sort);
  }, [sort]);

  useEffect(() => {
    writeSessionValue(APPLICATION_VIEW_STORAGE_KEY, view);
  }, [view]);

  const stats = useMemo(() => {
    const blocked = queue.filter((item) => isBlocked(item)).length;
    const offer = queue.filter((item) =>
      lower(`${item.offerStatus} ${item.status}`).includes("offer")
    ).length;
    const preEnrollment = queue.filter(
      (item) =>
        preEnrollmentValidated(item) ||
        preEnrollmentPending(item)
    ).length;
    const submitted = queue.filter(
      (item) =>
        lower(item.status).includes("submitted") ||
        lower(item.status).includes("applied")
    ).length;
    const review = queue.filter(
      (item) =>
        lower(item.status).includes("review") ||
        lower(item.status).includes("pending")
    ).length;

    const preEnrollmentValidatedCount = queue.filter((item) => preEnrollmentValidated(item)).length;
    const highPressure = queue.filter(
      (item) => getApplicationPressure(item) >= 90
    ).length;
    const avgReadiness = queue.length
      ? Math.round(
          queue.reduce(
            (sum, item) => sum + calculateApplicationReadiness(item),
            0
          ) / queue.length
        )
      : 0;

    return {
      total: queue.length,
      blocked,
      offer,
      preEnrollment,
      submitted,
      review,
      preEnrollmentValidated: preEnrollmentValidatedCount,
      highPressure,
      avgReadiness,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "blocked") next = next.filter((item) => isBlocked(item));
    if (filter === "offer") next = next.filter((item) => hasOffer(item));
    if (filter === "pre_enrollment")
      next = next.filter((item) => preEnrollmentValidated(item) || preEnrollmentPending(item));
    if (filter === "submitted") next = next.filter((item) => isSubmitted(item));
    if (filter === "review") next = next.filter((item) => needsReview(item));

    if (search) {
      next = next.filter((item) =>
        [
          item.studentName,
          item.universityName,
          item.courseName,
          item.status,
          item.offerStatus,
          item.preEnrollmentStatus,
          item.nextAction,
          item.intake,
          item.country,
        ]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "updated") {
        return safeDateMs(b.updatedAt) - safeDateMs(a.updatedAt);
      }
      if (sort === "student")
        return safeString(a.studentName).localeCompare(safeString(b.studentName));
      if (sort === "university")
        return safeString(a.universityName).localeCompare(safeString(b.universityName));
      if (sort === "course")
        return safeString(a.courseName).localeCompare(safeString(b.courseName));
      if (sort === "status")
        return safeString(a.status).localeCompare(safeString(b.status));
      if (sort === "offer")
        return safeString(a.offerStatus).localeCompare(safeString(b.offerStatus));
      if (sort === "pre_enrollment")
        return safeString(a.preEnrollmentStatus).localeCompare(safeString(b.preEnrollmentStatus));

      return getApplicationPressure(b) - getApplicationPressure(a);
    });
  }, [queue, filter, query, sort]);

  const reset = () => {
    setFilter("all");
    setSort("priority");
    setView("detailed");
    setQuery("");
    setStatus(null);
  };

  return (
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] xl:flex xl:items-start xl:justify-between xl:gap-5 sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
            Application OS
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Italy Application Command
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
            Track every assigned Italy application from planning through university review, decision, Universitaly pre-enrolment and enrollment.
          </p>
        </div>

        <div className="relative z-[1] flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-3 py-2 text-xs font-black text-orange-300">
            {filtered.length}/{queue.length} records
          </span>
          <span className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
            Pressure {stats.highPressure}
          </span>
          <span className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
            Avg Ready {stats.avgReadiness}%
          </span>
        </div>
      </div>

      <ApplicationJourneyRail queue={queue} />

      <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_12px_28px_rgba(16,35,63,0.08)] sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <ApplicationStat label="Total" value={stats.total} helper="applications" tone="orange" />
        <ApplicationStat label="Blocked" value={stats.blocked} helper="needs recovery" tone="rose" />
        <ApplicationStat label="Offers" value={stats.offer} helper="admission decisions" tone="emerald" />
        <ApplicationStat
          label="Pre-enrolment"
          value={stats.preEnrollment}
          helper={`${stats.preEnrollmentValidated} validated`}
          tone="violet"
        />
        <ApplicationStat label="Submitted" value={stats.submitted} helper="applications sent" />
        <ApplicationStat label="Review" value={stats.review} helper="university assessment" tone="amber" />
      </div>

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[inset_0_0_0_1px_rgba(255,90,10,0.12)] 2xl:grid-cols-[minmax(0,1fr)_190px_210px_auto_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, university, programme, stage, decision or pre-enrolment..."
          className={INPUT_CLASS}
        />

        <select value={filter} onChange={(event) => setFilter(event.target.value)} className={INPUT_CLASS}>
          {FILTERS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)} className={INPUT_CLASS}>
          {SORTS.map((item) => (
            <option key={item.key} value={item.key}>
              Sort: {item.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-2xl border-2 border-[#D8B07B] bg-[#FFFCF7] p-1">
          {[
            ["detailed", "Detailed"],
            ["compact", "Compact"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              aria-pressed={view === value}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                view === value
                  ? "bg-orange-500 text-white"
                  : "text-[#123865] hover:bg-orange-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-2xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-sm font-black text-white transition hover:bg-[#0B2A4B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
          Showing {filtered.length} of {queue.length} application records
        </p>
        <p className="text-xs font-semibold text-blue-100">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Priority"} · View:{" "}
          {view === "compact" ? "Compact" : "Detailed"}
        </p>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#FFFCF7] p-8 text-center shadow-inner">
            <p className="text-sm font-black text-[#10233F]">No application records found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#5B6D80]">
              Assigned applications will appear after student assignments and
              `student_applications` records are available to this counselor.
            </p>
            {query || filter !== "all" ? (
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((item, index) => (
            <ApplicationCard
              key={getStableApplicationKey(item, index)}
              item={item}
              counselor={counselor}
              onRefresh={onRefresh}
              setStatus={setStatus}
              compact={view === "compact"}
            />
          ))
        )}
      </div>
    </section>
  );
}
