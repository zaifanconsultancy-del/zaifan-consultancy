import React, { useEffect, useMemo, useState } from "react";
import {
  buildCounselorDocumentQueue,
  formatRelativeTime,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
  { key: "approved", label: "Approved" },
  { key: "visa", label: "Visa/CAS" },
];

const SORTS = [
  { key: "criticality", label: "Criticality" },
  { key: "updated", label: "Recently Updated" },
  { key: "oldest", label: "Oldest Updated" },
  { key: "student", label: "Student" },
  { key: "document", label: "Document" },
  { key: "status", label: "Status" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_documents_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_documents_sort";

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function safeDateMs(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
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
    // Workspace preferences are helpful, but never allowed to break the portal.
  }
}

function isApproved(item = {}) {
  const status = lower(item.status);
  return (
    status.includes("approved") ||
    status.includes("verified") ||
    status.includes("accepted") ||
    status.includes("cleared")
  );
}

function isRejected(item = {}) {
  const status = lower(item.status);
  return (
    status.includes("rejected") ||
    status.includes("failed") ||
    status.includes("invalid") ||
    status.includes("declined")
  );
}

function isPending(item = {}) {
  if (isApproved(item) || isRejected(item)) return false;

  const status = lower(item.status);

  return (
    status.includes("pending") ||
    status.includes("review") ||
    status.includes("uploaded") ||
    status.includes("missing") ||
    status.includes("requested") ||
    status.includes("await") ||
    !status
  );
}

function isVisaCritical(item = {}) {
  const text = lower(
    `${item.documentName} ${item.status} ${item.nextAction} ${item.criticality}`
  );

  return (
    text.includes("visa") ||
    text.includes("cas") ||
    text.includes("passport") ||
    text.includes("bank") ||
    text.includes("financial") ||
    text.includes("tb") ||
    text.includes("ielts") ||
    text.includes("english test") ||
    text.includes("police") ||
    text.includes("medical")
  );
}

function criticalityRank(item = {}) {
  const criticality = lower(item.criticality);

  if (
    criticality.includes("urgent") ||
    criticality.includes("critical") ||
    criticality.includes("high")
  ) {
    return 3;
  }

  if (isRejected(item)) return 3;
  if (isVisaCritical(item) && !isApproved(item)) return 2;
  if (isPending(item)) return 1;
  return 0;
}

function criticalityLabel(item = {}) {
  const explicit = safeString(item.criticality).trim();
  if (explicit) return explicit;

  const rank = criticalityRank(item);
  if (rank >= 3) return "High";
  if (rank === 2) return "Important";
  if (rank === 1) return "Pending";
  return "Normal";
}

function documentSearchText(item = {}) {
  return lower(
    [
      item.studentName,
      item.documentName,
      item.status,
      item.criticality,
      item.nextAction,
      item.category,
      item.documentType,
      item.notes,
    ].join(" ")
  );
}

function documentKey(item = {}, index = 0) {
  return (
    item.id ||
    item.document_id ||
    item.file_id ||
    `${item.studentName || "student"}-${item.documentName || "document"}-${
      item.updatedAt || index
    }`
  );
}

function statusTone(item = {}) {
  if (isRejected(item)) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  if (isApproved(item)) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  const status = lower(item.status);

  if (status.includes("missing") || status.includes("requested")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  if (status.includes("uploaded") || status.includes("review")) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function criticalityTone(item = {}) {
  const rank = criticalityRank(item);

  if (rank >= 3) return "border-rose-300 bg-rose-50 text-rose-700";
  if (rank === 2) return "border-violet-300 bg-violet-50 text-violet-700";
  if (rank === 1) return "border-amber-300 bg-amber-50 text-amber-700";

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function DocumentStat({ label, value, helper, tone = "navy", active, onClick }) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
          {label}
        </p>
        {active ? (
          <span className="rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
            Active
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p>
      ) : null}
    </>
  );

  const className = `rounded-2xl border-2 p-4 text-left shadow-sm transition ${
    tones[tone] || tones.navy
  } ${
    onClick
      ? "cursor-pointer hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
      : ""
  } ${active ? "ring-2 ring-orange-200" : ""}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function DocumentReadinessBar({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  const label =
    score >= 85
      ? "Strong readiness"
      : score >= 65
      ? "Progressing"
      : score >= 40
      ? "Needs attention"
      : "High document pressure";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
            Portfolio Document Readiness
          </p>
          <p className="mt-1 text-sm font-black text-[#102b4c]">{label}</p>
        </div>

        <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-1.5 text-sm font-black text-white">
          {score}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-[#c9d5de] bg-[#e7eef4]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 85
              ? "bg-emerald-500"
              : score >= 65
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

function calculateDocumentReadiness(queue = []) {
  if (!queue.length) return 0;

  const approved = queue.filter((item) => isApproved(item)).length;
  const rejected = queue.filter((item) => isRejected(item)).length;
  const critical = queue.filter(
    (item) => criticalityRank(item) >= 2 && !isApproved(item)
  ).length;

  const base = Math.round((approved / queue.length) * 100);
  const penalty = rejected * 6 + critical * 4;

  return Math.max(0, Math.min(100, base - penalty));
}

function DocumentPressurePanel({ stats, onFilter }) {
  const unresolved = stats.pending + stats.rejected;
  const pressure =
    stats.critical > 0
      ? "Critical documents require counselor attention."
      : unresolved > 0
      ? "The document portfolio still has unresolved work."
      : stats.total > 0
      ? "The visible document portfolio is currently clear."
      : "Document pressure will appear when assigned records are available.";

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
      <div className="rounded-[1.4rem] border-2 border-[#173f69] bg-[#f7fbff] p-4">
        <DocumentReadinessBar value={stats.readiness} />

        <p className="mt-3 text-xs leading-5 text-[#607487]">
          Readiness combines approved-document coverage with penalties for rejected
          files and unresolved high-pressure documents. It is an operational signal,
          not a visa or admission decision.
        </p>
      </div>

      <div className="rounded-[1.4rem] border-2 border-orange-300 bg-orange-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
          Counselor Focus
        </p>
        <p className="mt-2 text-sm font-black leading-6 text-[#102b4c]">{pressure}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {stats.critical > 0 ? (
            <button
              type="button"
              onClick={() => onFilter("critical")}
              className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:border-rose-400"
            >
              Review {stats.critical} critical
            </button>
          ) : null}

          {stats.rejected > 0 ? (
            <button
              type="button"
              onClick={() => onFilter("rejected")}
              className="rounded-xl border-2 border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-50"
            >
              Fix {stats.rejected} rejected
            </button>
          ) : null}

          {stats.pending > 0 ? (
            <button
              type="button"
              onClick={() => onFilter("pending")}
              className="rounded-xl border-2 border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50"
            >
              Check {stats.pending} pending
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const rank = criticalityRank(item);
  const approved = isApproved(item);
  const rejected = isRejected(item);

  return (
    <article
      className={`rounded-[1.55rem] border-2 p-4 shadow-[0_8px_26px_rgba(16,43,76,0.055)] transition duration-300 hover:-translate-y-0.5 sm:p-5 ${
        rejected
          ? "border-rose-300 bg-rose-50/70 hover:border-rose-400"
          : rank >= 2 && !approved
          ? "border-orange-300 bg-[#fffaf2] hover:border-orange-400"
          : "border-[#c9d5de] bg-[#fffdf8] hover:border-orange-300"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_0.58fr_0.58fr_minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-black text-[#102b4c]">
              {item.studentName || "Assigned Student"}
            </h3>

            {isVisaCritical(item) ? (
              <span className="rounded-full border border-violet-300 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700">
                Visa/CAS
              </span>
            ) : null}

            {rejected ? (
              <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-rose-700">
                Correction
              </span>
            ) : null}

            {approved ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
                Cleared
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 break-words text-sm font-bold text-[#415674]">
            {item.documentName || "Document"}
          </p>

          {item.category || item.documentType ? (
            <p className="mt-1 text-xs font-medium text-[#718292]">
              {item.category || item.documentType}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
            Status
          </p>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusTone(
              item
            )}`}
          >
            {item.status || "Pending"}
          </span>
        </div>

        <div>
          <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
            Criticality
          </p>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${criticalityTone(
              item
            )}`}
          >
            {criticalityLabel(item)}
          </span>
        </div>

        <div className="rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-3.5">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
            Next Action
          </p>
          <p className="mt-1.5 text-sm font-bold leading-5 text-[#102b4c]">
            {item.nextAction || (approved ? "No immediate action required." : "Review document status.")}
          </p>
          <p className="mt-2 text-xs font-medium text-[#718292]">
            Updated {formatRelativeTime(item.updatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#102f52]"
        >
          {expanded ? "Less" : "Details"}
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3 border-t-2 border-[#e3d6c5] pt-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Student
            </p>
            <p className="mt-1 break-words text-xs font-bold text-[#102b4c]">
              {item.studentName || "Assigned Student"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Document
            </p>
            <p className="mt-1 break-words text-xs font-bold text-[#102b4c]">
              {item.documentName || "Document"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Updated
            </p>
            <p className="mt-1 text-xs font-bold text-[#102b4c]">
              {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Unknown"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Queue Pressure
            </p>
            <p className="mt-1 text-xs font-bold text-[#102b4c]">
              {rank >= 3 ? "Immediate" : rank === 2 ? "Important" : rank === 1 ? "Monitor" : "Clear"}
            </p>
          </div>

          {item.notes ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3 md:col-span-2 xl:col-span-4">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#415674]">
                {item.notes}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function CounselorDocumentsWorkspace({ snapshot }) {
  const queue = useMemo(
    () => buildCounselorDocumentQueue(snapshot || {}),
    [snapshot]
  );

  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });

  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "criticality");
    return VALID_SORTS.has(saved) ? saved : "criticality";
  });

  const [query, setQuery] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const stats = useMemo(() => {
    const approved = queue.filter((item) => isApproved(item)).length;
    const rejected = queue.filter((item) => isRejected(item)).length;
    const pending = queue.filter((item) => isPending(item)).length;
    const critical = queue.filter(
      (item) => criticalityRank(item) >= 2 && !isApproved(item)
    ).length;
    const visa = queue.filter((item) => isVisaCritical(item)).length;

    const students = new Set(
      queue.map((item) => lower(item.studentName)).filter(Boolean)
    ).size;

    return {
      total: queue.length,
      approved,
      rejected,
      pending,
      critical,
      visa,
      students,
      unresolved: rejected + pending,
      readiness: calculateDocumentReadiness(queue),
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "critical") {
      next = next.filter(
        (item) => criticalityRank(item) >= 2 && !isApproved(item)
      );
    }

    if (filter === "pending") {
      next = next.filter((item) => isPending(item));
    }

    if (filter === "rejected") {
      next = next.filter((item) => isRejected(item));
    }

    if (filter === "approved") {
      next = next.filter((item) => isApproved(item));
    }

    if (filter === "visa") {
      next = next.filter((item) => isVisaCritical(item));
    }

    if (search) {
      next = next.filter((item) => documentSearchText(item).includes(search));
    }

    return [...next].sort((a, b) => {
      if (sort === "updated") {
        return safeDateMs(b.updatedAt) - safeDateMs(a.updatedAt);
      }

      if (sort === "oldest") {
        return safeDateMs(a.updatedAt) - safeDateMs(b.updatedAt);
      }

      if (sort === "student") {
        return safeString(a.studentName).localeCompare(safeString(b.studentName));
      }

      if (sort === "document") {
        return safeString(a.documentName).localeCompare(safeString(b.documentName));
      }

      if (sort === "status") {
        return safeString(a.status).localeCompare(safeString(b.status));
      }

      const pressure = criticalityRank(b) - criticalityRank(a);
      if (pressure !== 0) return pressure;

      return safeDateMs(b.updatedAt) - safeDateMs(a.updatedAt);
    });
  }, [queue, filter, query, sort]);

  const reset = () => {
    setFilter("all");
    setSort("criticality");
    setQuery("");
  };

  const hasActiveControls =
    Boolean(query.trim()) || filter !== "all" || sort !== "criticality";

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Document OS
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Document Readiness Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Prioritize missing, pending, rejected and visa-critical documents across
            assigned students without losing sight of the overall readiness picture.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} visible
          </span>

          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {stats.students} students
          </span>

          <span
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${
              stats.unresolved
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-emerald-300 bg-emerald-50 text-emerald-700"
            }`}
          >
            {stats.unresolved} unresolved
          </span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <DocumentStat
          label="Total"
          value={stats.total}
          helper="documents"
          tone="orange"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <DocumentStat
          label="Critical"
          value={stats.critical}
          helper="needs attention"
          tone="rose"
          active={filter === "critical"}
          onClick={() => setFilter("critical")}
        />

        <DocumentStat
          label="Pending"
          value={stats.pending}
          helper="not cleared"
          tone="amber"
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        />

        <DocumentStat
          label="Rejected"
          value={stats.rejected}
          helper="correction needed"
          tone="rose"
          active={filter === "rejected"}
          onClick={() => setFilter("rejected")}
        />

        <DocumentStat
          label="Approved"
          value={stats.approved}
          helper="cleared"
          tone="emerald"
          active={filter === "approved"}
          onClick={() => setFilter("approved")}
        />

        <DocumentStat
          label="Visa/CAS"
          value={stats.visa}
          helper="readiness-sensitive"
          tone="violet"
          active={filter === "visa"}
          onClick={() => setFilter("visa")}
        />
      </div>

      <div className="mb-5">
        <DocumentPressurePanel stats={stats} onFilter={setFilter} />
      </div>

      <div className="mb-5 rounded-[1.4rem] border-2 border-[#d8b892] bg-[#fff8ef] p-3.5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_200px_220px_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student, document, status, criticality, action or notes..."
            className={INPUT_CLASS}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Filter document queue"
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
            aria-label="Sort document queue"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                Sort: {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={reset}
            disabled={!hasActiveControls}
            className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] disabled:cursor-default disabled:opacity-45"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
          Counselor document queue · {filtered.length} visible records
        </p>

        <p className="text-xs font-semibold text-[#607487]">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Criticality"}
        </p>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50 text-lg font-black text-orange-700">
              D
            </div>

            <p className="mt-3 text-sm font-black text-[#102b4c]">
              No document records found.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              Assigned student documents will appear when the counselor-scoped
              snapshot contains document records. If records exist but are hidden,
              clear the current search and filters.
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
            <DocumentCard key={documentKey(item, index)} item={item} />
          ))
        )}
      </div>
    </section>
  );
}
