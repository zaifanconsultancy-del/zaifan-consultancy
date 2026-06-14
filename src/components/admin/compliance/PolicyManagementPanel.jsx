import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function statusTone(status = "") {
  const value = lower(status);
  if (value.includes("active") || value.includes("approved")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("draft")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("review") || value.includes("pending")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function isReviewOverdue(policy = {}) {
  if (!policy.nextReview) return false;
  const time = new Date(policy.nextReview).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function PolicyCard({ policy, compact }) {
  const overdue = isReviewOverdue(policy);

  return (
    <article className={`rounded-3xl border p-4 ${overdue ? "border-rose-400/25 bg-rose-500/10" : "border-white/10 bg-slate-950/50"}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_0.45fr] lg:items-center">
        <div>
          <p className="font-black text-white">{policy.title}</p>
          <p className="mt-1 text-sm text-slate-400">{policy.category} · v{policy.version}</p>
          <p className="mt-1 text-xs text-slate-500">Owner: {policy.owner}</p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-300">
            Review: {policy.nextReview ? new Date(policy.nextReview).toLocaleDateString() : "Not scheduled"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Acknowledgement {policy.acknowledgementRate}%</p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(policy.status)}`}>{policy.status}</span>
          {overdue ? <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-black text-rose-100">Review overdue</span> : null}
        </div>
      </div>

      {!compact ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-bold text-slate-500">Acknowledgement</span>
            <span className="text-slate-300">{policy.acknowledgementRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, policy.acknowledgementRate)}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function PolicyManagementPanel({ compliance = {}, compact = false }) {
  const [query, setQuery] = useState("");
  const rows = compliance.policyRows || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((policy) =>
      [policy.title, policy.category, policy.owner, policy.status, policy.version].map((value) => lower(value)).join(" ").includes(search)
    );
  }, [rows, query]);

  const visible = compact ? filtered.slice(0, 4) : filtered;
  const overdue = rows.filter(isReviewOverdue).length;
  const active = rows.filter((policy) => lower(policy.status).includes("active") || lower(policy.status).includes("approved")).length;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Policy Management</p>
          <h2 className="mt-2 text-2xl font-black text-white">Policy Library</h2>
          <p className="mt-1 text-sm text-slate-400">Policies, review dates, versioning, owners, acknowledgements, and overdue reviews.</p>
        </div>
        <span className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-black text-violet-100">
          {active} active · {overdue} overdue
        </span>
      </div>

      {!compact ? (
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search policies..."
          className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
      ) : null}

      <div className="space-y-3">
        {visible.length ? visible.map((policy) => <PolicyCard key={policy.id} policy={policy} compact={compact} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No policies found.</p>
            <p className="mt-2 text-sm text-slate-400">Policy records will appear when policy data is connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
