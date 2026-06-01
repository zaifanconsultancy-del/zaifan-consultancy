import { useMemo } from "react";
import { calculatePortfolioHealth } from "../../lib/executiveAI";

function ExecutivePortfolioSummary({ students = [] }) {
  const portfolio = useMemo(() => {
    return calculatePortfolioHealth(students);
  }, [students]);

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Portfolio Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Portfolio Health Summary
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Local executive scoring across all loaded students, combining risk,
            opportunity, priority, and CRM movement signals.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold text-white/45">
          {portfolio.total} Students
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total" value={portfolio.total} />
        <MetricCard label="Critical" value={portfolio.critical} tone="red" />
        <MetricCard label="High" value={portfolio.high} tone="orange" />
        <MetricCard label="Medium" value={portfolio.medium} tone="blue" />
        <MetricCard
          label="Avg Risk"
          value={portfolio.averageRisk}
          tone="gold"
        />
        <MetricCard
          label="Avg Opportunity"
          value={portfolio.averageOpportunity}
          tone="green"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <PortfolioList
          title="Highest Risk"
          items={portfolio.rankedByRisk.slice(0, 5)}
          scoreKey="risk_score"
          tone="red"
          emptyText="No risk records yet."
        />

        <PortfolioList
          title="Highest Opportunity"
          items={portfolio.rankedByOpportunity.slice(0, 5)}
          scoreKey="opportunity_score"
          tone="gold"
          emptyText="No opportunity records yet."
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function PortfolioList({
  title,
  items = [],
  scoreKey,
  tone = "gold",
  emptyText = "No records.",
}) {
  const style = getToneStyle(tone);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-black text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => {
            const student = item.student || {};
            const executive = item.executive || {};
            const name =
              student.full_name ||
              student.name ||
              executive.student_name ||
              "Unknown Student";

            return (
              <div
                key={`${name}-${index}`}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{name}</p>

                    <p className="mt-1 text-xs text-white/40">
                      {executive.student_type || student.__leadType || "student"} •{" "}
                      {executive.priority_level || "Standard"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${style}`}
                  >
                    {executive[scoreKey] || 0}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/45">
                  {executive.summary || "No executive summary."}
                </p>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") {
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (tone === "orange") {
    return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  }

  if (tone === "gold") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  if (tone === "green") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  }

  if (tone === "blue") {
    return "border-blue-400/25 bg-blue-500/10 text-blue-300";
  }

  return "border-white/10 bg-white/[0.03] text-white/60";
}

export default ExecutivePortfolioSummary;