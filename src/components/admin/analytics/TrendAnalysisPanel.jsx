import React from "react";

function TrendCard({
  title,
  value,
  trend,
  description,
  tone = "cyan",
}) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div
      className={`rounded-3xl border p-5 ${
        tones[tone] || tones.cyan
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black text-white">
        {value}
      </p>

      <p className="mt-2 font-bold text-cyan-300">
        {trend}
      </p>

      <p className="mt-2 text-sm text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function TrendAnalysisPanel({
  analytics = {},
  compact = false,
}) {
  const metrics = analytics.metrics || {};

  const trends = [
    {
      title: "Student Growth",
      value: metrics.students || 0,
      trend: "+12%",
      description:
        "Student intake continues to grow.",
      tone: "cyan",
    },
    {
      title: "Application Trend",
      value: metrics.applications || 0,
      trend: "+18%",
      description:
        "Application submissions increasing.",
      tone: "violet",
    },
    {
      title: "Offer Trend",
      value: metrics.offers || 0,
      trend: "+9%",
      description:
        "Offer generation improving.",
      tone: "amber",
    },
    {
      title: "Revenue Trend",
      value: `£${metrics.revenue || 0}`,
      trend: "+21%",
      description:
        "Revenue growth above target.",
      tone: "emerald",
    },
  ];

  if (compact) {
    return (
      <div className="rounded-3xl border border-white/10 p-5">
        <h2 className="text-xl font-black text-white">
          Trend Analysis
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {trends.slice(0, 2).map((trend) => (
            <div
              key={trend.title}
              className="rounded-2xl border border-white/10 p-4"
            >
              <p className="font-bold text-cyan-300">
                {trend.title}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                {trend.trend}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
          Analytics OS
        </p>

        <h1 className="mt-2 text-3xl font-black text-white">
          Trend Analysis Center
        </h1>

        <p className="mt-2 text-slate-400">
          Analyze growth patterns, market
          movement, performance changes,
          opportunities and emerging risks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {trends.map((trend) => (
          <TrendCard
            key={trend.title}
            {...trend}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Opportunity Signals
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              • UK demand remains strong
            </p>

            <p>
              • Visa conversion improving
            </p>

            <p>
              • Revenue growth accelerating
            </p>

            <p>
              • Application pipeline healthy
            </p>

            <p>
              • Agent channels expanding
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Risk Signals
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              • Counselor capacity pressure
            </p>

            <p>
              • Offer delays possible
            </p>

            <p>
              • Seasonal application spikes
            </p>

            <p>
              • Compliance workload growth
            </p>

            <p>
              • Support volume increasing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}