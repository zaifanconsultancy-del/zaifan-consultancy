import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function statusTone(status = "") {
  const value = lower(status);
  if (value.includes("approved")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("reject") || value.includes("declined")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (value.includes("pending") || value.includes("requested")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

function LeaveCard({ leave }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.5fr] lg:items-center">
        <div>
          <p className="font-black text-white">{leave.employee}</p>
          <p className="mt-1 text-sm text-slate-400">{leave.type}</p>
          <p className="mt-1 text-xs text-slate-500">{leave.reason}</p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-200">{leave.start || "No start"} → {leave.end || "No end"}</p>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone(leave.status)}`}>{leave.status}</span>
      </div>
    </article>
  );
}

export default function LeaveManagementPanel({ hr = {}, compact = false }) {
  const [filter, setFilter] = useState("all");
  const leaves = hr.leaves || [];

  const filtered = useMemo(() => {
    if (filter === "all") return leaves;
    return leaves.filter((leave) => lower(leave.status).includes(filter) || lower(leave.type).includes(filter));
  }, [leaves, filter]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const pending = leaves.filter((leave) => lower(leave.status).includes("pending") || lower(leave.status).includes("requested")).length;
  const approved = leaves.filter((leave) => lower(leave.status).includes("approved")).length;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Leave Management</p>
          <h2 className="mt-2 text-2xl font-black text-white">Time Off Control</h2>
          <p className="mt-1 text-sm text-slate-400">Leave requests, approvals, absences, and availability planning.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "approved"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                filter === item ? "bg-white text-slate-950" : "border border-white/10 bg-white/[0.04] text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Total</p>
          <p className="mt-3 text-3xl font-black text-white">{leaves.length}</p>
        </div>
        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Pending</p>
          <p className="mt-3 text-3xl font-black text-white">{pending}</p>
        </div>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Approved</p>
          <p className="mt-3 text-3xl font-black text-white">{approved}</p>
        </div>
      </div>

      <div className="space-y-3">
        {visible.length ? visible.map((leave) => <LeaveCard key={leave.id} leave={leave} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No leave records found.</p>
            <p className="mt-2 text-sm text-slate-400">Leave records will appear when HR leave tables are connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
