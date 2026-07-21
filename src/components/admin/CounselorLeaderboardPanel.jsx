import React, { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function getInitials(name = "") {
  return String(name || "Counselor")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getRankLabel(index) {
  if (index === 0) return "Top Performer";
  if (index === 1) return "Strong Momentum";
  if (index === 2) return "High Contributor";
  return `Rank ${index + 1}`;
}

function LeaderboardRow({ item = {}, index, compact = false, maxScore = 1 }) {
  const score = Math.round(performanceScore(item));
  const width = Math.max(4, Math.min(100, Math.round((score / maxScore) * 100)));

  const metrics = [
    { label: "Applications", short: "Apps", value: safeNumber(item.applications) },
    { label: "Offers", short: "Offers", value: safeNumber(item.offers) },
    { label: "CAS", short: "CAS", value: safeNumber(item.cas) },
    { label: "Visas", short: "Visas", value: safeNumber(item.visas) },
  ];

  return (
    <article className="rounded-[1.5rem] border border-[#243A60]/18 bg-white p-4 shadow-[0_10px_26px_rgba(23,36,61,0.05)] transition hover:-translate-y-0.5 hover:border-[#E9802D]/40 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E9802D]/35 bg-[#FFF1E3] text-sm font-black text-[#B84F0E]">
              {getInitials(item.name)}
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-black text-[#17243D]">
                  {item.name || "Unnamed Counselor"}
                </p>
                <span className="rounded-full border border-[#243A60]/16 bg-[#F6F7F9] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-[#596579]">
                  {getRankLabel(index)}
                </span>
              </div>

              <p className="mt-1 text-xs leading-5 text-[#7A8392]">
                {safeNumber(item.students)} students · {money(item.revenue)} collected
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[410px]">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-[#243A60]/16 bg-[#FFFDF8] p-3 text-center"
            >
              <p className="text-xl font-black text-[#17243D]">{metric.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8992A1]">
                {metric.short}
              </p>
            </div>
          ))}
        </div>
      </div>

      {!compact ? (
        <div className="mt-5 border-t border-[#243A60]/10 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[#667085]">Founder performance score</span>
            <span className="rounded-full border border-[#E9802D]/30 bg-[#FFF1E3] px-3 py-1 font-black text-[#B84F0E]">
              {score}
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#EDF0F4]">
            <div
              className="h-full rounded-full bg-[#E9802D] transition-all duration-500"
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function CounselorLeaderboardPanel({ growth = {}, compact = false }) {
  const rows = useMemo(() => {
    const source = Array.isArray(growth.counselorLeaderboard)
      ? growth.counselorLeaderboard
      : [];

    const sorted = [...source].sort(
      (a, b) => performanceScore(b) - performanceScore(a)
    );

    return compact ? sorted.slice(0, 4) : sorted;
  }, [growth.counselorLeaderboard, compact]);

  const maxScore = Math.max(
    1,
    ...rows.map((item) => Math.round(performanceScore(item)))
  );

  const totalStudents = rows.reduce(
    (sum, item) => sum + safeNumber(item.students),
    0
  );

  const totalRevenue = rows.reduce(
    (sum, item) => sum + safeNumber(item.revenue),
    0
  );

  return (
    <section className="rounded-[1.75rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8] p-5 shadow-[0_18px_48px_rgba(23,36,61,0.07)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[#243A60]/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#B84F0E]">
            Counselor Leaderboard
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-[#17243D]">
            Team Performance
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            Founder view of counselor output across applications, offers, CAS,
            visas, student support, task completion, and collected revenue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#243A60]/18 bg-white px-4 py-2 text-xs font-black text-[#344054]">
            {rows.length} counselors
          </span>
          <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-4 py-2 text-xs font-black text-[#B84F0E]">
            {totalStudents} students
          </span>
          {!compact ? (
            <span className="rounded-full border border-[#243A60]/18 bg-white px-4 py-2 text-xs font-black text-[#344054]">
              {money(totalRevenue)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length ? (
          rows.map((item, index) => (
            <LeaderboardRow
              key={`${item.name || "counselor"}-${index}`}
              item={item}
              index={index}
              compact={compact}
              maxScore={maxScore}
            />
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#243A60]/22 bg-white p-7 text-center">
            <p className="text-sm font-black text-[#17243D]">
              No counselor performance data yet.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Assign students and add real workflow records to populate this
              leaderboard.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}