import React, { useEffect, useMemo, useState } from "react";
import { buildCounselorUniversityQueue } from "../../lib/counselorPortal";
import {
  getUniversityRequirementMeta,
  groupUniversityRequirements,
} from "../../data/universityRequirementLibrary";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "action", label: "Needs Action" },
  { key: "linked", label: "Application Linked" },
  { key: "unlinked", label: "Not Linked" },
  { key: "deadline", label: "Deadline Risk" },
  { key: "requirements", label: "Requirement Attention" },
  { key: "dream", label: "Dream" },
  { key: "target", label: "Target" },
  { key: "safe", label: "Safe" },
  { key: "ready", label: "Ready" },
  { key: "incomplete", label: "Incomplete" },
];

const SORTS = [
  { key: "priority", label: "Operational Priority" },
  { key: "deadline", label: "Nearest Deadline" },
  { key: "readiness", label: "Readiness" },
  { key: "application", label: "Application Progress" },
  { key: "requirements", label: "Requirement Attention" },
  { key: "student", label: "Student" },
  { key: "university", label: "University" },
  { key: "country", label: "Country" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_universities_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_universities_sort";
const VIEW_STORAGE_KEY = "zaifan_counselor_universities_view";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return safeString(value).toLowerCase();
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
    // Workspace preferences are optional.
  }
}

function categoryKey(category = "") {
  const value = lower(category);

  if (value.includes("dream")) return "dream";
  if (value.includes("safe")) return "safe";
  if (value.includes("target")) return "target";

  return "other";
}

function categoryTone(category = "") {
  const key = categoryKey(category);

  if (key === "dream") {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  if (key === "safe") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (key === "target") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function readinessTone(score = 0) {
  const value = safeNumber(score);

  if (value >= 80) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (value >= 60) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (value >= 40) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-rose-300 bg-rose-50 text-rose-700";
}

function statusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("applied") ||
    value.includes("submitted") ||
    value.includes("offer") ||
    value.includes("accepted")
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("shortlist")
  ) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  if (
    value.includes("reject") ||
    value.includes("decline") ||
    value.includes("blocked")
  ) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function shortlistPressure(item = {}) {
  if (Number.isFinite(Number(item.planningPressure))) {
    return Math.max(0, Math.min(100, Math.round(Number(item.planningPressure))));
  }

  let score = 0;
  const readiness = safeNumber(item.readinessScore);
  const category = categoryKey(item.category);
  const status = lower(item.status);
  const nextAction = lower(item.nextAction);

  score += Math.max(0, 100 - readiness);
  if (category === "dream") score += 12;
  if (category === "target") score += 6;
  if (status.includes("blocked") || status.includes("reject")) score += 20;
  if (nextAction.includes("document")) score += 8;
  if (nextAction.includes("application")) score += 6;
  if (nextAction.includes("deadline")) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function universitySearchText(item = {}) {
  return lower(
    [
      item.studentName,
      item.studentEmail,
      item.universityName,
      item.country,
      item.city,
      item.courseName,
      item.degreeLevel,
      item.intake,
      item.category,
      item.status,
      item.nextAction,
      item.applicationStatus,
      item.applicationStage,
      item.scholarshipStatus,
      item.scholarshipName,
      item.latestEventLabel,
      ...(Array.isArray(item.requirements)
        ? item.requirements.flatMap((requirement) => [
            requirement.requirement_name,
            requirement.title,
            requirement.status,
            requirement.notes,
          ])
        : []),
    ].join(" ")
  );
}

function universityKey(item = {}, index = 0) {
  return (
    item.id ||
    item.university_id ||
    `${item.studentName || "student"}-${item.universityName || "university"}-${
      item.courseName || index
    }`
  );
}

function strategyLabel(queue = []) {
  const dream = queue.filter(
    (item) => categoryKey(item.category) === "dream"
  ).length;

  const target = queue.filter(
    (item) => categoryKey(item.category) === "target"
  ).length;

  const safe = queue.filter(
    (item) => categoryKey(item.category) === "safe"
  ).length;

  if (!queue.length) return "No shortlist yet";
  if (target > 0 && safe > 0 && dream > 0) return "Balanced shortlist";
  if (safe === 0) return "Needs safe option";
  if (target === 0) return "Needs target option";
  if (dream === 0) return "Conservative shortlist";

  return "Developing shortlist";
}

function UniversityStat({
  label,
  value,
  helper,
  tone = "navy",
  active = false,
  onClick,
}) {
  const tones = {
    navy: "border-[#123865] bg-[#F1F6FA]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  const className = `relative overflow-hidden rounded-[1.3rem] border-2 p-4 text-left shadow-[0_9px_22px_rgba(16,35,63,0.08)] transition ${
    tones[tone] || tones.navy
  } ${
    onClick
      ? "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
      : ""
  } ${active ? "ring-2 ring-orange-200" : ""}`;

  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5B6D80]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs font-medium text-[#5B6D80]">{helper}</p>
      ) : null}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function ReadinessBar({ value }) {
  const score = Math.max(0, Math.min(100, safeNumber(value)));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#5B6D80]">Shortlist readiness</span>
        <span className="font-black text-[#10233F]">{score}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EBF2]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 80
              ? "bg-emerald-500"
              : score >= 60
                ? "bg-orange-500"
                : score >= 40
                  ? "bg-amber-500"
                  : "bg-rose-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function PressureBar({ item }) {
  const score = shortlistPressure(item);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#5B6D80]">Planning pressure</span>
        <span className="font-black text-[#10233F]">{score}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EBF2]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 75
              ? "bg-rose-500"
              : score >= 50
                ? "bg-orange-500"
                : "bg-[#123865]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}


function pretty(value, fallback = "Not set") {
  const clean = safeString(value).trim();
  if (!clean) return fallback;

  return clean
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value, fallback = "Not set") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(value) {
  if (!value) return "No activity yet";

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "No activity yet";

  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatMoney(value, currency = "EUR") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Not recorded";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "EUR"} ${amount.toLocaleString()}`;
  }
}

function deadlineTone(deadline = {}) {
  if (deadline.isOverdue || deadline.tone === "danger") {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }

  if (deadline.isUrgent || deadline.tone === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (deadline.value) {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }

  return "border-[#C9D6E2] bg-[#F7FAFC] text-[#5B6D80]";
}

function requirementTone(status = "") {
  const value = lower(status);

  if (
    value.includes("verified") ||
    value.includes("complete") ||
    value.includes("cleared") ||
    value.includes("met") ||
    value.includes("waived") ||
    value.includes("not required")
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (
    value.includes("reject") ||
    value.includes("missing") ||
    value.includes("blocked") ||
    value.includes("urgent")
  ) {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }

  if (
    value.includes("review") ||
    value.includes("received") ||
    value.includes("requested")
  ) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-[#C9D6E2] bg-[#F7FAFC] text-[#123865]";
}

function applicationTone(item = {}) {
  if (!item.applicationLinked) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  const value = lower(`${item.applicationStatus} ${item.applicationStage}`);

  if (
    value.includes("enrolled") ||
    value.includes("accepted") ||
    value.includes("offer") ||
    value.includes("validated")
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (
    value.includes("review") ||
    value.includes("submitted") ||
    value.includes("applied")
  ) {
    return "border-sky-300 bg-sky-50 text-sky-800";
  }

  return "border-blue-300 bg-blue-50 text-blue-800";
}

function getRequirementOperationalCounts(item = {}) {
  const requirements = Array.isArray(item.requirements) ? item.requirements : [];

  if (!requirements.length) {
    const fallbackOpen = safeNumber(item.openRequirementsCount);
    const fallbackCleared = safeNumber(item.verifiedRequirementsCount);

    return {
      applied: fallbackOpen + fallbackCleared,
      attention: 0,
      open: fallbackOpen,
      cleared: fallbackCleared,
      unresolved: fallbackOpen,
    };
  }

  let attention = 0;
  let open = 0;
  let cleared = 0;

  requirements.forEach((requirement) => {
    const status = lower(
      requirement.status ||
        requirement.requirement_status ||
        requirement.review_status ||
        "missing"
    )
      .replace(/[\s-]+/g, "_")
      .trim();

    const isCleared =
      status.includes("verified") ||
      status.includes("complete") ||
      status.includes("cleared") ||
      status.includes("met") ||
      status.includes("waived") ||
      status.includes("not_required") ||
      status.includes("approved") ||
      status.includes("accepted");

    if (isCleared) {
      cleared += 1;
      return;
    }

    const isOpen =
      status.includes("requested") ||
      status.includes("received") ||
      status.includes("review") ||
      status.includes("pending") ||
      status.includes("submitted");

    if (isOpen) {
      open += 1;
      return;
    }

    // Missing, rejected, blocked, urgent and unknown unresolved states
    // require counselor/student attention rather than being labelled "open".
    attention += 1;
  });

  return {
    applied: requirements.length,
    attention,
    open,
    cleared,
    unresolved: attention + open,
  };
}

function SignalBadge({ children, tone = "navy" }) {
  const tones = {
    navy: "border-[#123865] bg-[#123865] text-white",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-800",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    slate: "border-[#C9D6E2] bg-[#F7FAFC] text-[#123865]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  );
}

function MetricTile({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#123865] bg-[#F1F6FA]",
    orange: "border-orange-300 bg-orange-50",
    green: "border-emerald-300 bg-emerald-50",
    blue: "border-blue-300 bg-blue-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div className={`rounded-2xl border-2 p-3 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#627487]">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-[#10233F]">{value}</p>
      {helper ? (
        <p className="mt-1 text-[10px] font-semibold leading-4 text-[#6B7D8F]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function ProgressBar({ label, value, tone = "navy" }) {
  const score = Math.max(0, Math.min(100, safeNumber(value)));
  const bars = {
    navy: "bg-[#123865]",
    orange: "bg-orange-500",
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#5B6D80]">{label}</span>
        <span className="font-black text-[#10233F]">{score}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EBF2]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            bars[tone] || bars.navy
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ApplicationJourney({ item }) {
  const progress = Math.max(0, Math.min(100, safeNumber(item.applicationProgress)));
  const steps = [
    ["Plan", 0],
    ["Prepare", 17],
    ["Submit", 33],
    ["Review", 50],
    ["Decision", 67],
    ["Pre-enrol", 83],
    ["Enrolled", 100],
  ];

  return (
    <div className="rounded-[1.25rem] border-2 border-blue-200 bg-blue-50/70 p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">
            Application Link
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {item.applicationLinked
              ? `${item.applicationStage || "Application"} · ${pretty(
                  item.applicationStatus,
                  "Status not set"
                )}`
              : "No Application OS record linked"}
          </p>
        </div>

        <SignalBadge tone={item.applicationLinked ? "blue" : "amber"}>
          {item.applicationLinked ? `${progress}% Progress` : "Link Required"}
        </SignalBadge>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {steps.map(([label, threshold]) => {
          const complete = item.applicationLinked && progress >= threshold;

          return (
            <div key={label} className="min-w-0 text-center">
              <div
                className={`mx-auto h-2.5 w-full rounded-full ${
                  complete ? "bg-blue-500" : "bg-blue-100"
                }`}
              />
              <p
                className={`mt-1 truncate text-[7px] font-black uppercase tracking-[0.05em] ${
                  complete ? "text-blue-800" : "text-blue-400"
                }`}
                title={label}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequirementPanel({ item }) {
  const requirements = Array.isArray(item.requirements) ? item.requirements : [];
  const groups = groupUniversityRequirements(requirements);
  const requirementCounts = getRequirementOperationalCounts(item);

  return (
    <div className="rounded-[1.25rem] border-2 border-[#C9D6E2] bg-white p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#6B7D8F]">
            University Requirements
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {requirementCounts.applied} applied · {requirementCounts.attention} attention ·{" "}
            {requirementCounts.open} open · {requirementCounts.cleared} cleared
          </p>
          <p className="mt-1 text-[10px] leading-4 text-[#6B7D8F]">
            This is the applied checklist for this exact student, university and programme—not the full master library.
          </p>
        </div>
        <SignalBadge tone={(item.urgentRequirementsCount || 0) > 0 ? "rose" : "green"}>
          {(item.urgentRequirementsCount || 0) > 0
            ? `${item.urgentRequirementsCount} Urgent`
            : "No Urgent Blocker"}
        </SignalBadge>
      </div>
      {groups.length ? (
        <div className="mt-3 max-h-[680px] space-y-3 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.id} className="overflow-hidden rounded-xl border-2 border-[#D7E1EA] bg-[#F8FBFD]">
              <div className="flex items-start justify-between gap-3 border-b border-[#D7E1EA] bg-white px-3 py-2.5"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#123865]">{group.label}</p><p className="mt-1 text-[9px] leading-4 text-[#6B7D8F]">{group.description}</p></div><span className="shrink-0 rounded-full border border-[#C9D6E2] bg-[#F7FAFC] px-2 py-0.5 text-[8px] font-black text-[#123865]">{group.requirements.length}</span></div>
              <div className="space-y-2 p-2.5">
                {group.requirements.map((requirement, index) => {
                  const status = requirement.status || requirement.requirement_status || requirement.review_status || "pending";
                  const title = requirement.requirement_name || requirement.title || requirement.name || `Requirement ${index + 1}`;
                  const dueDate = requirement.due_date || requirement.deadline || requirement.expires_at || null;
                  const meta = getUniversityRequirementMeta(requirement);
                  return (
                    <div key={requirement.id || `${title}-${index}`} className="rounded-xl border border-[#D7E1EA] bg-white p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><p className="break-words text-xs font-black text-[#10233F]">{title}</p>{meta.priority === "core" ? <SignalBadge tone="orange">Core</SignalBadge> : null}</div>{meta.description ? <p className="mt-1 text-[10px] leading-4 text-[#6B7D8F]">{meta.description}</p> : null}<p className="mt-1 text-[9px] font-semibold text-[#6B7D8F]">{requirement.current_value ? `Current: ${requirement.current_value}` : requirement.target_value ? `Target: ${requirement.target_value}` : meta.categoryLabel}</p></div>
                        <span className={`self-start rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${requirementTone(status)}`}>{pretty(status)}</span>
                      </div>
                      {dueDate ? <p className="mt-2 text-[9px] font-bold text-[#5B6D80]">Due {formatDate(dueDate)}</p> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : <div className="mt-3 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-4 text-center"><p className="text-xs font-black text-emerald-800">No structured university requirement is currently recorded.</p></div>}
    </div>
  );
}

function FinancePanel({ item }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <MetricTile
        label="Application Fee"
        value={formatMoney(item.applicationFee, item.applicationFeeCurrency)}
        helper="University application charge"
        tone="blue"
      />
      <MetricTile
        label="Tuition"
        value={formatMoney(item.tuitionAmount, item.tuitionCurrency)}
        helper="Recorded tuition amount"
        tone="orange"
      />
      <MetricTile
        label="Living Cost"
        value={formatMoney(item.livingCostAmount, item.livingCostCurrency)}
        helper="Recorded living-cost estimate"
        tone="amber"
      />
      <MetricTile
        label="Scholarship"
        value={pretty(item.scholarshipStatus, "Not checked")}
        helper={
          item.scholarshipName ||
          (item.dsuEligible ? "DSU / regional aid potential recorded" : "No award name recorded")
        }
        tone={lower(item.scholarshipStatus).includes("award") ? "green" : "violet"}
      />
    </div>
  );
}

function AuditPanel({ item }) {
  const events = Array.isArray(item.events) ? item.events.slice(0, 4) : [];

  return (
    <div className="rounded-[1.25rem] border-2 border-[#C9D6E2] bg-white p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#6B7D8F]">
            University Audit Pulse
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {item.eventsCount || 0} recorded event
            {(item.eventsCount || 0) === 1 ? "" : "s"}
          </p>
        </div>

        <SignalBadge tone="slate">
          {formatRelative(item.updatedAt || item.latestEvent?.created_at)}
        </SignalBadge>
      </div>

      {events.length ? (
        <div className="mt-3 space-y-2">
          {events.map((event, index) => {
            const title =
              event.event_label ||
              event.title ||
              pretty(event.event_type, `University Event ${index + 1}`);

            return (
              <div
                key={event.id || `${title}-${index}`}
                className="rounded-xl border border-[#D7E1EA] bg-[#F8FBFD] p-3"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-black text-[#10233F]">{title}</p>
                  <p className="text-[9px] font-bold text-[#6B7D8F]">
                    {formatDate(event.created_at || event.updated_at)}
                  </p>
                </div>

                {event.old_value || event.new_value ? (
                  <p className="mt-1 text-[10px] leading-4 text-[#6B7D8F]">
                    {event.old_value ? pretty(event.old_value) : "—"} →{" "}
                    {event.new_value ? pretty(event.new_value) : "—"}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border-2 border-dashed border-[#D7E1EA] bg-[#F8FBFD] p-4 text-center text-xs font-bold text-[#6B7D8F]">
          No university audit event is visible yet.
        </p>
      )}
    </div>
  );
}

function StrategySummary({ stats, queue, onFilter }) {
  const label = strategyLabel(queue);
  const priorityItem = [...queue].sort(
    (a, b) => shortlistPressure(b) - shortlistPressure(a)
  )[0];
  const priorityRequirementCounts = priorityItem
    ? getRequirementOperationalCounts(priorityItem)
    : null;

  const balanceTone =
    label === "Balanced shortlist"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-amber-300 bg-amber-50 text-amber-800";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <div className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#F7FAFC] shadow-[0_14px_32px_rgba(16,35,63,0.09)]">
        <div className="border-b-2 border-[#123865] bg-[#123865] px-4 py-4 text-white sm:px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
            Portfolio Strategy
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-black">{label}</h3>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-blue-100">
                Balance ambition, realistic fit and a protected backup route before
                moving every option into Application OS.
              </p>
            </div>

            <span
              className={`self-start rounded-xl border-2 px-3 py-2 text-xs font-black ${balanceTone}`}
            >
              Average readiness {stats.avgReadiness}%
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          {[
            ["Dream", stats.dream, "dream", "violet"],
            ["Target", stats.target, "target", "orange"],
            ["Safe", stats.safe, "safe", "green"],
          ].map(([title, value, key, tone]) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilter(key)}
              className={`rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                tone === "violet"
                  ? "border-violet-300 bg-violet-50"
                  : tone === "green"
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-orange-300 bg-orange-50"
              }`}
            >
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#627487]">
                {title}
              </p>
              <p className="mt-1 text-2xl font-black text-[#10233F]">{value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF4E8] shadow-[0_14px_32px_rgba(255,90,10,0.10)]">
        <div className="border-b-2 border-orange-300 bg-orange-500 px-4 py-4 text-white sm:px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-100">
            Counselor Command
          </p>
          <h3 className="mt-1 text-xl font-black">
            {priorityItem ? "Highest-priority university move" : "Queue ready"}
          </h3>
        </div>

        <div className="p-4 sm:p-5">
          {priorityItem ? (
            <>
              <div className="flex flex-wrap gap-2">
                <SignalBadge tone={priorityItem.isHighPressure ? "rose" : "orange"}>
                  Pressure {shortlistPressure(priorityItem)}
                </SignalBadge>
                <SignalBadge tone={priorityItem.applicationLinked ? "blue" : "amber"}>
                  {priorityItem.applicationLinked ? "Application Linked" : "Link Required"}
                </SignalBadge>
                {(priorityRequirementCounts?.unresolved || 0) > 0 ? (
                  <SignalBadge
                    tone={
                      (priorityRequirementCounts?.attention || 0) > 0
                        ? "rose"
                        : "amber"
                    }
                  >
                    {priorityRequirementCounts.unresolved} Requirement Action
                    {priorityRequirementCounts.unresolved === 1 ? "" : "s"}
                  </SignalBadge>
                ) : null}
              </div>

              <p className="mt-3 text-sm font-black text-[#10233F]">
                {priorityItem.studentName} · {priorityItem.universityName}
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#10233F]">
                {priorityItem.nextAction}
              </p>

              <button
                type="button"
                onClick={() => onFilter("action")}
                className="mt-4 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-xs font-black text-white transition hover:bg-[#0B2A4B]"
              >
                Open Action Queue
              </button>
            </>
          ) : (
            <p className="text-sm font-bold leading-6 text-[#10233F]">
              Assigned university records will appear here once they are connected to
              the counselor snapshot.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UniversityCard({ item, compact = false }) {
  const ready = Boolean(item.isReady) || safeNumber(item.readinessScore) >= 75;
  const pressure = shortlistPressure(item);
  const [expanded, setExpanded] = useState(false);
  const deadline = item.deadline || {};
  const blocked = Boolean(item.isBlocked);
  const requirementCounts = getRequirementOperationalCounts(item);
  const hasRequirements = requirementCounts.unresolved > 0;

  const borderClass = blocked
    ? "border-rose-400 bg-rose-50/40"
    : pressure >= 75
      ? "border-orange-400 bg-orange-50/35"
      : ready
        ? "border-emerald-400 bg-emerald-50/25"
        : "border-[#123865] bg-[#FFFCF7]";

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] shadow-[0_18px_44px_rgba(16,35,63,0.11)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(16,35,63,0.15)] ${borderClass}`}
    >
      <div
        className={`border-b-[3px] px-4 py-4 sm:px-5 ${
          blocked
            ? "border-rose-400 bg-[#10233F]"
            : "border-orange-500 bg-[#123865]"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                {item.studentName || "Assigned Student"}
              </p>
              {item.studentEmail ? (
                <span className="truncate text-[9px] font-semibold text-blue-100">
                  {item.studentEmail}
                </span>
              ) : null}
            </div>

            <h3 className="mt-2 break-words text-xl font-black text-white">
              {item.universityName || "University"}
            </h3>

            <p className="mt-1 break-words text-xs font-semibold leading-5 text-blue-100">
              {item.courseName || "Programme not selected"}
              {item.intake && item.intake !== "Not set" ? ` · ${item.intake}` : ""}
            </p>
          </div>

          <span
            className={`self-start rounded-full border-2 px-3 py-1.5 text-xs font-black ${categoryTone(
              item.category
            )}`}
          >
            {pretty(item.category, "Uncategorised")}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <SignalBadge tone="navy">{item.country || "Country not set"}</SignalBadge>
          {item.city ? <SignalBadge tone="slate">{item.city}</SignalBadge> : null}
          <SignalBadge tone={ready ? "green" : "amber"}>
            {ready ? "Application Ready" : "Planning Incomplete"}
          </SignalBadge>
          <SignalBadge tone={blocked ? "rose" : pressure >= 75 ? "orange" : "blue"}>
            Pressure {pressure}
          </SignalBadge>
          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${statusTone(
              item.status
            )}`}
          >
            {pretty(item.status, "Planning")}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Readiness"
            value={`${safeNumber(item.readinessScore)}%`}
            helper={ready ? "Ready for application movement" : "Planning work remains"}
            tone={ready ? "green" : "amber"}
          />
          <MetricTile
            label="Fit"
            value={
              safeNumber(item.fitScore) > 0
                ? `${safeNumber(item.fitScore)}%`
                : item.fitLevel || "Not scored"
            }
            helper={item.fitLevel || "Academic fit signal"}
            tone="blue"
          />
          <MetricTile
            label="Requirements"
            value={`${requirementCounts.attention} attention`}
            helper={`${requirementCounts.open} open · ${requirementCounts.cleared} cleared · ${requirementCounts.applied} applied`}
            tone={
              requirementCounts.attention > 0
                ? "rose"
                : requirementCounts.open > 0
                  ? "amber"
                  : "green"
            }
          />
          <MetricTile
            label="Application"
            value={item.applicationLinked ? item.applicationStage : "Not linked"}
            helper={
              item.applicationLinked
                ? `${safeNumber(item.applicationProgress)}% journey progress`
                : "Create or link Application OS"
            }
            tone={item.applicationLinked ? "violet" : "orange"}
          />
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-300 bg-[#FFF4E8] p-4 shadow-inner">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                Counselor Next Action
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[#10233F]">
                {item.nextAction ||
                  "Review university fit, readiness and application strategy."}
              </p>
            </div>

            {deadline.value ? (
              <span
                className={`self-start rounded-xl border-2 px-3 py-2 text-xs font-black ${deadlineTone(
                  deadline
                )}`}
              >
                {deadline.label || formatDate(deadline.value)}
              </span>
            ) : (
              <SignalBadge tone="slate">No Deadline</SignalBadge>
            )}
          </div>
        </div>

        <ApplicationJourney item={item} />

        <div className="grid gap-3 sm:grid-cols-2">
          <ProgressBar
            label="University readiness"
            value={item.readinessScore}
            tone={ready ? "green" : "orange"}
          />
          <ProgressBar
            label="Planning pressure"
            value={pressure}
            tone={pressure >= 75 ? "rose" : pressure >= 50 ? "orange" : "navy"}
          />
        </div>

        {!compact ? (
          <div className="flex flex-col gap-3 border-t-2 border-[#E2D6C7] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {item.dsuEligible ? <SignalBadge tone="green">DSU Eligible</SignalBadge> : null}
              {item.scholarshipStatus &&
              lower(item.scholarshipStatus) !== "not_checked" ? (
                <SignalBadge tone="violet">
                  Scholarship {pretty(item.scholarshipStatus)}
                </SignalBadge>
              ) : null}
              {item.latestEventLabel ? (
                <SignalBadge tone="slate">
                  {pretty(item.latestEventLabel)}
                </SignalBadge>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0B2A4B]"
            >
              {expanded ? "Close Command Detail" : "Open Command Detail"}
            </button>
          </div>
        ) : null}

        {expanded && !compact ? (
          <div className="space-y-4 rounded-[1.5rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3.5 shadow-inner sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Degree Level"
                value={item.degreeLevel || "Not recorded"}
                helper="Programme level"
              />
              <MetricTile
                label="Manual Risk"
                value={pretty(item.manualRiskLevel, "Low")}
                helper="Admin-recorded university risk"
                tone={
                  lower(item.manualRiskLevel).includes("high") ||
                  lower(item.manualRiskLevel).includes("critical")
                    ? "rose"
                    : "amber"
                }
              />
              <MetricTile
                label="Deadline"
                value={deadline.label || "Not set"}
                helper={deadline.value ? formatDate(deadline.value) : "No deadline recorded"}
                tone={deadline.isUrgent || deadline.isOverdue ? "rose" : "blue"}
              />
              <MetricTile
                label="Last Activity"
                value={formatRelative(item.updatedAt)}
                helper={item.latestEventLabel || "University record activity"}
                tone="violet"
              />
            </div>

            <FinancePanel item={item} />
            <RequirementPanel item={item} />
            <AuditPanel item={item} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function CounselorUniversitiesWorkspace({ snapshot }) {
  const queue = useMemo(
    () => buildCounselorUniversityQueue(snapshot || {}),
    [snapshot]
  );

  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });

  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "priority");
    return VALID_SORTS.has(saved) ? saved : "priority";
  });

  const [view, setView] = useState(() =>
    readSessionValue(VIEW_STORAGE_KEY, "detailed") === "compact"
      ? "compact"
      : "detailed"
  );

  const [query, setQuery] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  useEffect(() => {
    writeSessionValue(VIEW_STORAGE_KEY, view);
  }, [view]);

  const stats = useMemo(() => {
    const dream = queue.filter(
      (item) => categoryKey(item.category) === "dream"
    ).length;

    const target = queue.filter(
      (item) => categoryKey(item.category) === "target"
    ).length;

    const safe = queue.filter(
      (item) => categoryKey(item.category) === "safe"
    ).length;

    const ready = queue.filter(
      (item) => Boolean(item.isReady) || safeNumber(item.readinessScore) >= 75
    ).length;

    const incomplete = queue.length - ready;
    const linked = queue.filter((item) => item.applicationLinked).length;
    const unlinked = queue.length - linked;

    const requirementTotals = queue.reduce(
      (totals, item) => {
        const counts = getRequirementOperationalCounts(item);

        totals.applied += counts.applied;
        totals.attention += counts.attention;
        totals.open += counts.open;
        totals.cleared += counts.cleared;

        return totals;
      },
      {
        applied: 0,
        attention: 0,
        open: 0,
        cleared: 0,
      }
    );

    const openRequirements = requirementTotals.open;
    const attentionRequirements = requirementTotals.attention;
    const clearedRequirements = requirementTotals.cleared;
    const appliedRequirements = requirementTotals.applied;

    const urgentRequirements = queue.reduce(
      (sum, item) => sum + safeNumber(item.urgentRequirementsCount),
      0
    );

    const deadlineRisk = queue.filter(
      (item) => item.deadline?.isUrgent || item.deadline?.isOverdue
    ).length;

    const highPressure = queue.filter(
      (item) => shortlistPressure(item) >= 75
    ).length;

    const blocked = queue.filter((item) => item.isBlocked).length;

    const scholarships = queue.filter(
      (item) =>
        item.dsuEligible ||
        (item.scholarshipStatus &&
          !["", "not_checked", "not checked"].includes(
            lower(item.scholarshipStatus)
          ))
    ).length;

    const avgReadiness = queue.length
      ? Math.round(
          queue.reduce(
            (sum, item) => sum + safeNumber(item.readinessScore),
            0
          ) / queue.length
        )
      : 0;

    const avgPressure = queue.length
      ? Math.round(
          queue.reduce(
            (sum, item) => sum + shortlistPressure(item),
            0
          ) / queue.length
        )
      : 0;

    const students = new Set(
      queue.map((item) => lower(item.studentName)).filter(Boolean)
    ).size;

    const countries = new Set(
      queue.map((item) => lower(item.country)).filter(Boolean)
    ).size;

    return {
      total: queue.length,
      dream,
      target,
      safe,
      ready,
      incomplete,
      linked,
      unlinked,
      openRequirements,
      attentionRequirements,
      clearedRequirements,
      appliedRequirements,
      urgentRequirements,
      deadlineRisk,
      highPressure,
      blocked,
      scholarships,
      avgReadiness,
      avgPressure,
      students,
      countries,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "action") {
      next = next.filter(
        (item) =>
          item.isBlocked ||
          shortlistPressure(item) >= 75 ||
          getRequirementOperationalCounts(item).unresolved > 0 ||
          !item.applicationLinked ||
          item.deadline?.isUrgent ||
          item.deadline?.isOverdue
      );
    }

    if (filter === "linked") {
      next = next.filter((item) => item.applicationLinked);
    }

    if (filter === "unlinked") {
      next = next.filter((item) => !item.applicationLinked);
    }

    if (filter === "deadline") {
      next = next.filter(
        (item) => item.deadline?.isUrgent || item.deadline?.isOverdue
      );
    }

    if (filter === "requirements") {
      next = next.filter(
        (item) => getRequirementOperationalCounts(item).unresolved > 0
      );
    }

    if (filter === "dream") {
      next = next.filter(
        (item) => categoryKey(item.category) === "dream"
      );
    }

    if (filter === "target") {
      next = next.filter(
        (item) => categoryKey(item.category) === "target"
      );
    }

    if (filter === "safe") {
      next = next.filter(
        (item) => categoryKey(item.category) === "safe"
      );
    }

    if (filter === "ready") {
      next = next.filter(
        (item) => Boolean(item.isReady) || safeNumber(item.readinessScore) >= 75
      );
    }

    if (filter === "incomplete") {
      next = next.filter(
        (item) => !item.isReady && safeNumber(item.readinessScore) < 75
      );
    }

    if (search) {
      next = next.filter((item) =>
        universitySearchText(item).includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "priority") {
        if (Boolean(a.isBlocked) !== Boolean(b.isBlocked)) {
          return a.isBlocked ? -1 : 1;
        }

        const pressureDifference =
          shortlistPressure(b) - shortlistPressure(a);

        if (pressureDifference !== 0) return pressureDifference;

        const aRequirements = getRequirementOperationalCounts(a);
        const bRequirements = getRequirementOperationalCounts(b);

        const attentionDifference =
          bRequirements.attention - aRequirements.attention;

        if (attentionDifference !== 0) return attentionDifference;

        return bRequirements.open - aRequirements.open;
      }

      if (sort === "deadline") {
        const aDays = Number.isFinite(Number(a.deadline?.daysLeft))
          ? Number(a.deadline.daysLeft)
          : Number.POSITIVE_INFINITY;

        const bDays = Number.isFinite(Number(b.deadline?.daysLeft))
          ? Number(b.deadline.daysLeft)
          : Number.POSITIVE_INFINITY;

        return aDays - bDays;
      }

      if (sort === "application") {
        return (
          safeNumber(b.applicationProgress) -
          safeNumber(a.applicationProgress)
        );
      }

      if (sort === "requirements") {
        const aRequirements = getRequirementOperationalCounts(a);
        const bRequirements = getRequirementOperationalCounts(b);

        const attentionDifference =
          bRequirements.attention - aRequirements.attention;

        if (attentionDifference !== 0) return attentionDifference;

        return bRequirements.open - aRequirements.open;
      }

      if (sort === "student") {
        return safeString(a.studentName).localeCompare(
          safeString(b.studentName)
        );
      }

      if (sort === "university") {
        return safeString(a.universityName).localeCompare(
          safeString(b.universityName)
        );
      }

      if (sort === "country") {
        return safeString(a.country).localeCompare(
          safeString(b.country)
        );
      }

      if (sort === "category") {
        return safeString(a.category).localeCompare(
          safeString(b.category)
        );
      }

      if (sort === "status") {
        return safeString(a.status).localeCompare(
          safeString(b.status)
        );
      }

      const readinessDifference =
        safeNumber(b.readinessScore) -
        safeNumber(a.readinessScore);

      if (readinessDifference !== 0) {
        return readinessDifference;
      }

      return shortlistPressure(a) - shortlistPressure(b);
    });
  }, [queue, filter, query, sort]);

  const reset = () => {
    setFilter("all");
    setSort("priority");
    setView("detailed");
    setQuery("");
  };

  const hasActiveControls =
    Boolean(query.trim()) ||
    filter !== "all" ||
    sort !== "priority" ||
    view !== "detailed";

  return (
    <section className="min-w-0 overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] sm:p-5 xl:flex xl:items-start xl:justify-between xl:gap-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10"
        />

        <div className="relative z-[1] min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
            University OS · Live Command
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            University Strategy & Application Readiness
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
            Manage the counselor-side university queue with live application links,
            deadlines, requirements, affordability, scholarship signals, audit
            activity and the next operational move for every assigned student.
          </p>
        </div>

        <div className="relative z-[1] mt-4 flex flex-wrap gap-2 xl:mt-0 xl:max-w-md xl:justify-end">
          <SignalBadge tone="orange">
            {filtered.length}/{queue.length} Visible
          </SignalBadge>
          <SignalBadge tone="navy">{stats.students} Students</SignalBadge>
          <SignalBadge tone={stats.highPressure ? "rose" : "green"}>
            {stats.highPressure} High Pressure
          </SignalBadge>
          <SignalBadge tone={stats.deadlineRisk ? "rose" : "green"}>
            {stats.deadlineRisk} Deadline Risk
          </SignalBadge>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_12px_28px_rgba(16,35,63,0.08)] sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <UniversityStat
          label="Total Options"
          value={stats.total}
          helper={`${stats.students} students`}
          tone="orange"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <UniversityStat
          label="Needs Action"
          value={stats.highPressure + stats.blocked}
          helper={`${stats.avgPressure}% avg pressure`}
          tone="rose"
          active={filter === "action"}
          onClick={() => setFilter("action")}
        />

        <UniversityStat
          label="Application Linked"
          value={stats.linked}
          helper={`${stats.unlinked} not linked`}
          tone="violet"
          active={filter === "linked"}
          onClick={() => setFilter("linked")}
        />

        <UniversityStat
          label="Ready"
          value={stats.ready}
          helper={`${stats.avgReadiness}% avg`}
          tone="emerald"
          active={filter === "ready"}
          onClick={() => setFilter("ready")}
        />

        <UniversityStat
          label="Requirement Attention"
          value={stats.attentionRequirements}
          helper={`${stats.openRequirements} open · ${stats.clearedRequirements} cleared`}
          tone={
            stats.attentionRequirements
              ? "rose"
              : stats.openRequirements
                ? "amber"
                : "emerald"
          }
          active={filter === "requirements"}
          onClick={() => setFilter("requirements")}
        />

        <UniversityStat
          label="Deadline Risk"
          value={stats.deadlineRisk}
          helper="urgent / overdue"
          tone={stats.deadlineRisk ? "rose" : "emerald"}
          active={filter === "deadline"}
          onClick={() => setFilter("deadline")}
        />

        <UniversityStat
          label="Scholarship / DSU"
          value={stats.scholarships}
          helper="funding signals"
          tone="violet"
        />

        <UniversityStat
          label="Countries"
          value={stats.countries}
          helper={`${stats.incomplete} incomplete`}
        />
      </div>

      <div className="mb-5">
        <StrategySummary
          stats={stats}
          queue={queue}
          onFilter={setFilter}
        />
      </div>

      <div className="mb-5 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,90,10,0.12)]">
        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_205px_230px_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student, university, course, application, requirement, scholarship or action..."
            className={INPUT_CLASS}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Filter university command queue"
          >
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Sort university command queue"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                Sort: {item.label}
              </option>
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
            disabled={!hasActiveControls}
            className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] hover:shadow-md disabled:cursor-default disabled:opacity-45"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
          University command · {filtered.length} visible records
        </p>

        <p className="text-xs font-semibold text-blue-100">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Operational Priority"} ·
          View: {view === "compact" ? "Compact" : "Command"}
        </p>
      </div>

      <div
        className={`grid min-w-0 gap-4 ${
          view === "compact"
            ? "xl:grid-cols-2 2xl:grid-cols-3"
            : "xl:grid-cols-2"
        }`}
      >
        {filtered.length === 0 ? (
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#FFFCF7] p-8 text-center shadow-inner xl:col-span-2 2xl:col-span-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50 text-lg font-black text-orange-700">
              U
            </div>

            <p className="mt-3 text-sm font-black text-[#10233F]">
              No university command records match this view.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#5B6D80]">
              Assigned shortlist records, application links, requirements and audit
              activity appear here from the counselor-scoped live snapshot.
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
          filtered.map((item, index) => (
            <UniversityCard
              key={universityKey(item, index)}
              item={item}
              compact={view === "compact"}
            />
          ))
        )}
      </div>
    </section>
  );
}
