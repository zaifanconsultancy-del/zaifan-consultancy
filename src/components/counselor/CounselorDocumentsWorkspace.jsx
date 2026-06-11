import React, { useMemo, useState } from "react";
import { buildCounselorDocumentQueue, formatRelativeTime } from "../../lib/counselorPortal";

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
  { key: "updated", label: "Updated" },
  { key: "student", label: "Student" },
  { key: "document", label: "Document" },
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function isApproved(item = {}) {
  const status = lower(item.status);
  return status.includes("approved") || status.includes("verified") || status.includes("accepted") || status.includes("cleared");
}

function isRejected(item = {}) {
  const status = lower(item.status);
  return status.includes("rejected") || status.includes("failed") || status.includes("invalid") || status.includes("declined");
}

function isPending(item = {}) {
  const status = lower(item.status);
  return (
    status.includes("pending") ||
    status.includes("review") ||
    status.includes("uploaded") ||
    status.includes("missing") ||
    status.includes("requested") ||
    !isApproved(item)
  );
}

function isVisaCritical(item = {}) {
  const text = lower(`${item.documentName} ${item.status} ${item.nextAction} ${item.criticality}`);
  return (
    text.includes("visa") ||
    text.includes("cas") ||
    text.includes("passport") ||
    text.includes("bank") ||
    text.includes("financial") ||
    text.includes("tb") ||
    text.includes("ielts")
  );
}

function criticalityRank(item = {}) {
  if (lower(item.criticality).includes("high")) return 3;
  if (isRejected(item)) return 3;
  if (isVisaCritical(item)) return 2;
  if (isPending(item)) return 1;
  return 0;
}

function statusTone(item = {}) {
  if (isRejected(item)) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (isApproved(item)) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";

  const status = lower(item.status);

  if (status.includes("missing") || status.includes("requested")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }

  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

function criticalityTone(item = {}) {
  const rank = criticalityRank(item);

  if (rank >= 3) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (rank === 2) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (rank === 1) return "border-amber-400/25 bg-amber-400/10 text-amber-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function DocumentStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function DocumentReadinessBar({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-400">Readiness</span>
        <span className="text-slate-300">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function calculateDocumentReadiness(queue = []) {
  if (!queue.length) return 0;

  const approved = queue.filter((item) => isApproved(item)).length;
  const rejected = queue.filter((item) => isRejected(item)).length;
  const critical = queue.filter((item) => criticalityRank(item) >= 2 && !isApproved(item)).length;

  const score = Math.round((approved / queue.length) * 100) - rejected * 6 - critical * 4;
  return Math.max(0, Math.min(100, score));
}

function DocumentCard({ item }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-400/25 hover:bg-slate-900/70">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr_0.55fr_1fr] lg:items-center">
        <div>
          <h3 className="text-lg font-black text-white">{item.studentName}</h3>
          <p className="mt-1 text-sm text-slate-400">{item.documentName}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {isVisaCritical(item) ? (
              <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100">
                Visa/CAS Critical
              </span>
            ) : null}

            {isRejected(item) ? (
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-100">
                Needs correction
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(item)}`}>{item.status}</span>
        </div>

        <div>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${criticalityTone(item)}`}>
            {item.criticality}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">{item.nextAction}</p>
          <p className="mt-1 text-xs text-slate-500">Updated {formatRelativeTime(item.updatedAt)}</p>
        </div>
      </div>
    </article>
  );
}

export default function CounselorDocumentsWorkspace({ snapshot }) {
  const queue = useMemo(() => buildCounselorDocumentQueue(snapshot || {}), [snapshot]);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("criticality");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const approved = queue.filter((item) => isApproved(item)).length;
    const rejected = queue.filter((item) => isRejected(item)).length;
    const pending = queue.filter((item) => isPending(item) && !isRejected(item) && !isApproved(item)).length;
    const critical = queue.filter((item) => criticalityRank(item) >= 2 && !isApproved(item)).length;
    const visa = queue.filter((item) => isVisaCritical(item)).length;

    return {
      total: queue.length,
      approved,
      rejected,
      pending,
      critical,
      visa,
      readiness: calculateDocumentReadiness(queue),
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "critical") next = next.filter((item) => criticalityRank(item) >= 2 && !isApproved(item));
    if (filter === "pending") next = next.filter((item) => isPending(item) && !isApproved(item) && !isRejected(item));
    if (filter === "rejected") next = next.filter((item) => isRejected(item));
    if (filter === "approved") next = next.filter((item) => isApproved(item));
    if (filter === "visa") next = next.filter((item) => isVisaCritical(item));

    if (search) {
      next = next.filter((item) =>
        [item.studentName, item.documentName, item.status, item.criticality, item.nextAction]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "updated") return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (sort === "student") return safeString(a.studentName).localeCompare(safeString(b.studentName));
      if (sort === "document") return safeString(a.documentName).localeCompare(safeString(b.documentName));

      return criticalityRank(b) - criticalityRank(a);
    });
  }, [queue, filter, query, sort]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Document OS</p>
          <h2 className="mt-2 text-2xl font-black">Document Readiness Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Missing, pending review, rejected, CAS-critical, and visa-critical documents.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length} records
        </span>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <DocumentStat label="Total" value={stats.total} helper="documents" tone="cyan" />
        <DocumentStat label="Critical" value={stats.critical} helper="needs review" tone="rose" />
        <DocumentStat label="Pending" value={stats.pending} helper="not cleared" tone="amber" />
        <DocumentStat label="Rejected" value={stats.rejected} helper="correction needed" tone="rose" />
        <DocumentStat label="Approved" value={stats.approved} helper="cleared" tone="emerald" />
        <DocumentStat label="Visa/CAS" value={stats.visa} helper="critical docs" tone="violet" />
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <DocumentReadinessBar value={stats.readiness} />
        <p className="mt-2 text-xs text-slate-500">
          Readiness score is based on approved documents minus rejected and unresolved critical document pressure.
        </p>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, document, status, criticality, action..."
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/40"
        >
          {FILTERS.map((item) => (
            <option key={item.key} value={item.key} className="bg-slate-950">
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/40"
        >
          {SORTS.map((item) => (
            <option key={item.key} value={item.key} className="bg-slate-950">
              Sort: {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No document records found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Assigned student documents will appear here once the counselor-scoped snapshot includes document records.
            </p>
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((item) => <DocumentCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}