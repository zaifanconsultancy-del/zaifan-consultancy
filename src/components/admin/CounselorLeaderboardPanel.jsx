import React from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function performanceScore(item = {}) {
  return (
    safeNumber(item.visas) * 40 +
    safeNumber(item.cas) * 25 +
    safeNumber(item.offers) * 15 +
    safeNumber(item.applications) * 8 +
    safeNumber(item.tasks) * 2 +
    safeNumber(item.support) * 2 +
    safeNumber(item.revenue) / 1000
  );
}

function LeaderboardRow({ item, index, compact }) {
  const score = Math.round(performanceScore(item));
  const max = 160;
  const width = Math.max(4, Math.min(100, Math.round((score / max) * 100)));

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-sm font-black text-cyan-100">
              {index + 1}
            </span>
            <div>
              <p className="font-black text-white">{item.name}</p>
              <p className="text-xs text-slate-500">{item.students} students · {money(item.revenue)} collected</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs lg:min-w-[360px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{item.applications}</p>
            <p className="text-slate-500">Apps</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{item.offers}</p>
            <p className="text-slate-500">Offers</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{item.cas}</p>
            <p className="text-slate-500">CAS</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{item.visas}</p>
            <p className="text-slate-500">Visas</p>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-bold text-slate-500">Founder performance score</span>
            <span className="text-slate-300">{score}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CounselorLeaderboardPanel({ growth = {}, compact = false }) {
  const rows = compact ? (growth.counselorLeaderboard || []).slice(0, 4) : growth.counselorLeaderboard || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Counselor Leaderboard</p>
          <h2 className="mt-2 text-2xl font-black text-white">Team Performance</h2>
          <p className="mt-1 text-sm text-slate-400">
            Founder view of counselor output across applications, offers, CAS, visas, tasks, support, and revenue.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">
          {rows.length} counselors
        </span>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((item, index) => <LeaderboardRow key={`${item.name}-${index}`} item={item} index={index} compact={compact} />)
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No counselor performance data yet.</p>
            <p className="mt-2 text-sm text-slate-400">Assign students and insert real workflow records to populate this leaderboard.</p>
          </div>
        )}
      </div>
    </section>
  );
}
