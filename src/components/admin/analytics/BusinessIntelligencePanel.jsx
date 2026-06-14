import React from "react";

function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-white">
        {value}
      </p>

      {helper ? (
        <p className="mt-1 text-xs text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function FunnelCard({ title, value, color }) {
  return (
    <div
      className={`rounded-3xl border p-5 ${color}`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

export default function BusinessIntelligencePanel({
  analytics = {},
  compact = false,
}) {
  const metrics = analytics.metrics || {};

  const funnel = [
    {
      label: "Students",
      value: metrics.students || 0,
      color:
        "border-cyan-400/20 bg-cyan-500/10",
    },
    {
      label: "Applications",
      value: metrics.applications || 0,
      color:
        "border-violet-400/20 bg-violet-500/10",
    },
    {
      label: "Offers",
      value: metrics.offers || 0,
      color:
        "border-amber-400/20 bg-amber-500/10",
    },
    {
      label: "Visas",
      value: metrics.visas || 0,
      color:
        "border-emerald-400/20 bg-emerald-500/10",
    },
  ];

  if (compact) {
    return (
      <div className="rounded-3xl border border-white/10 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">
            Business Intelligence
          </h2>

          <p className="text-xs text-slate-500">
            Funnel Snapshot
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {funnel.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
            />
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
          Business Intelligence Center
        </h1>

        <p className="mt-2 text-slate-400">
          Funnel analytics, geography
          intelligence, conversion tracking,
          counselor performance and executive
          business visibility.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {funnel.map((item) => (
          <FunnelCard
            key={item.label}
            title={item.label}
            value={item.value}
            color={item.color}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Geography Intelligence
          </h2>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">
                United Kingdom
              </span>
              <span className="font-bold">
                High Demand
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Australia
              </span>
              <span className="font-bold">
                Growing
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Canada
              </span>
              <span className="font-bold">
                Stable
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Executive Insights
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              • Application funnel conversion
              monitoring
            </p>

            <p>
              • Revenue pipeline visibility
            </p>

            <p>
              • Counselor performance tracking
            </p>

            <p>
              • Agent performance tracking
            </p>

            <p>
              • Market demand intelligence
            </p>

            <p>
              • Student journey bottleneck
              detection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}