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
  { key: "cas", label: "CAS" },
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
  { key: "cas", label: "CAS Status" },
];

const APPLICATION_FILTER_STORAGE_KEY = "zaifan_counselor_applications_filter";
const APPLICATION_SORT_STORAGE_KEY = "zaifan_counselor_applications_sort";
const APPLICATION_VIEW_STORAGE_KEY = "zaifan_counselor_applications_view";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

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
      item.casStatus,
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

function casIssued(item = {}) {
  return lower(item.casStatus).includes("issued");
}

function casPending(item = {}) {
  const value = lower(item.casStatus);

  return (
    value.includes("pending") ||
    value.includes("requested") ||
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
  let score = 20;

  if (item.universityName) score += 15;
  if (item.courseName) score += 15;
  if (isSubmitted(item)) score += 15;
  if (hasOffer(item)) score += 20;
  if (casPending(item)) score += 5;
  if (casIssued(item)) score += 20;

  if (isBlocked(item)) score -= 25;
  if (lower(item.status).includes("reject")) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function getApplicationPressure(item = {}) {
  return (
    safeNumber(item.priorityScore) +
    (isBlocked(item) ? 35 : 0) +
    (needsReview(item) ? 12 : 0) +
    (casPending(item) ? 8 : 0) +
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

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
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

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function casTone(casStatus = "") {
  const value = lower(casStatus);

  if (value.includes("issued")) return "border-[#173f69] bg-[#173f69] text-white";
  if (value.includes("pending") || value.includes("requested") || value.includes("processing")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-[#b7c5d1] bg-[#eef5fb] text-[#173f69]";
}

function ApplicationStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p> : null}
    </div>
  );
}

function PriorityMeter({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold text-[#607487]">Priority pressure</span>
        <span className="font-black text-[#102b4c]">{score}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full ${
            score >= 70 ? "bg-rose-500" : score >= 45 ? "bg-orange-500" : "bg-[#173f69]"
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
        <span className="font-bold text-[#607487]">Journey readiness</span>
        <span className="font-black text-[#102b4c]">{score}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 80
              ? "bg-emerald-500"
              : score >= 55
                ? "bg-orange-500"
                : "bg-[#173f69]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ApplicationHealthBadge({ item }) {
  const readiness = calculateApplicationReadiness(item);

  let label = "Planning";
  let className = "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";

  if (isBlocked(item)) {
    label = "Recovery Required";
    className = "border-rose-300 bg-rose-50 text-rose-700";
  } else if (casIssued(item)) {
    label = "CAS Ready";
    className = "border-[#173f69] bg-[#173f69] text-white";
  } else if (hasOffer(item)) {
    label = "Offer Stage";
    className = "border-emerald-300 bg-emerald-50 text-emerald-700";
  } else if (readiness >= 60) {
    label = "Moving";
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
          casStatus: item.casStatus,
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
          casStatus: item.casStatus,
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
          casStatus: item.casStatus,
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
      className={`rounded-[1.6rem] border-2 p-4 shadow-[0_10px_30px_rgba(16,43,76,0.06)] transition duration-300 hover:-translate-y-0.5 sm:p-5 ${
        blocked
          ? "border-rose-300 bg-rose-50/80 hover:border-rose-400"
          : "border-[#c9d5de] bg-[#fffdf8] hover:border-orange-300"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.7fr_0.9fr_0.45fr] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#102b4c]">{item.studentName}</h3>
            {blocked ? (
              <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">
                Blocked
              </span>
            ) : null}

            <ApplicationHealthBadge item={item} />
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#607487]">
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

            <span className={`rounded-full border px-3 py-1 text-xs font-black ${casTone(item.casStatus)}`}>
              CAS {item.casStatus}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-3.5">
          <PriorityMeter value={item.priorityScore} />

          {!compact ? (
            <div className="mt-3">
              <ReadinessMeter value={readiness} />
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-[#718292]">
              Updated {formatRelativeTime(item.updatedAt)}
            </span>
            <span
              className={`rounded-full border px-2 py-1 font-black ${
                pressure >= 90
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : pressure >= 60
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-[#b7c5d1] bg-white text-[#173f69]"
              }`}
            >
              Pressure {Math.round(pressure)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-3.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Next Action
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#102b4c]">
            {item.nextAction || "Review application and define the next counselor action."}
          </p>

          {!compact ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#d8b892] bg-[#fffdf8] px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#7d684f]">
                  Offer
                </p>
                <p className="mt-1 text-xs font-black text-[#102b4c]">
                  {item.offerStatus || "Pending"}
                </p>
              </div>

              <div className="rounded-xl border border-[#d8b892] bg-[#fffdf8] px-3 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#7d684f]">
                  CAS
                </p>
                <p className="mt-1 text-xs font-black text-[#102b4c]">
                  {item.casStatus || "Not started"}
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
            className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102f52] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
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
    const cas = queue.filter(
      (item) =>
        lower(item.casStatus).includes("issued") ||
        lower(item.casStatus).includes("pending")
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

    const casIssuedCount = queue.filter((item) => casIssued(item)).length;
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
      cas,
      submitted,
      review,
      casIssued: casIssuedCount,
      highPressure,
      avgReadiness,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "blocked") next = next.filter((item) => isBlocked(item));
    if (filter === "offer") next = next.filter((item) => hasOffer(item));
    if (filter === "cas")
      next = next.filter((item) => casIssued(item) || casPending(item));
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
          item.casStatus,
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
      if (sort === "cas")
        return safeString(a.casStatus).localeCompare(safeString(b.casStatus));

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
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Application OS
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Assigned Application Queue
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Track blocked files, submissions, offers, CAS movement and the next counselor
            action across assigned students.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} records
          </span>
          <span className="rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">
            Pressure {stats.highPressure}
          </span>
          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            Avg Ready {stats.avgReadiness}%
          </span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <ApplicationStat label="Total" value={stats.total} helper="applications" tone="orange" />
        <ApplicationStat label="Blocked" value={stats.blocked} helper="needs recovery" tone="rose" />
        <ApplicationStat label="Offers" value={stats.offer} helper="conversion stage" tone="emerald" />
        <ApplicationStat
          label="CAS"
          value={stats.cas}
          helper={`${stats.casIssued} issued`}
          tone="violet"
        />
        <ApplicationStat label="Submitted" value={stats.submitted} helper="file sent" />
        <ApplicationStat label="Review" value={stats.review} helper="pending review" tone="amber" />
      </div>

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <div className="mb-5 grid gap-3 2xl:grid-cols-[minmax(0,1fr)_190px_210px_auto_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, university, course, offer, CAS or status..."
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

        <div className="flex rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] p-1">
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
                  : "text-[#173f69] hover:bg-orange-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
          Showing {filtered.length} of {queue.length} application records
        </p>
        <p className="text-xs font-semibold text-[#607487]">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Priority"} · View:{" "}
          {view === "compact" ? "Compact" : "Detailed"}
        </p>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <p className="text-sm font-black text-[#102b4c]">No application records found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
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
