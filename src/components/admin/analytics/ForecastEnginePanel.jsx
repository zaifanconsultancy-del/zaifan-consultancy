import React from "react";

function ForecastCard({
  title,
  current,
  projected,
  confidence,
  tone = "cyan",
}) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
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

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Current
          </p>

          <p className="text-2xl font-black text-white">
            {current}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-400">
            Forecast
          </p>

          <p className="text-2xl font-black text-white">
            {projected}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-slate-400">
          Confidence
        </p>

        <p className="font-bold text-cyan-300">
          {confidence}%
        </p>
      </div>
    </div>
  );
}

export default function ForecastEnginePanel({
  analytics = {},
  compact = false,
}) {
  const metrics = analytics.metrics || {};

  const forecasts = [
    {
      title: "Student Intake",
      current: metrics.students || 0,
      projected: Math.round(
        (metrics.students || 0) * 1.15
      ),
      confidence: 84,
      tone: "cyan",
    },
    {
      title: "Applications",
      current: metrics.applications || 0,
      projected: Math.round(
        (metrics.applications || 0) * 1.18
      ),
      confidence: 81,
      tone: "violet",
    },
    {
      title: "Offers",
      current: metrics.offers || 0,
      projected: Math.round(
        (metrics.offers || 0) * 1.22
      ),
      confidence: 79,
      tone: "amber",
    },
    {
      title: "Revenue",
      current: `£${metrics.revenue || 0}`,
      projected: `£${Math.round(
        (metrics.revenue || 0) * 1.25
      )}`,
      confidence: 86,
      tone: "emerald",
    },
  ];

  if (compact) {
    return (
      <div className="rounded-3xl border border-white/10 p-5">
        <h2 className="text-xl font-black text-white">
          Forecast Engine
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {forecasts.slice(0, 2).map((forecast) => (
            <div
              key={forecast.title}
              className="rounded-2xl border border-white/10 p-4"
            >
              <p className="font-bold text-cyan-300">
                {forecast.title}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Forecast: {forecast.projected}
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
          Forecast Engine
        </h1>

        <p className="mt-2 text-slate-400">
          Predict student growth, revenue,
          applications, offers, visas and
          future operational demand.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {forecasts.map((forecast) => (
          <ForecastCard
            key={forecast.title}
            {...forecast}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Forecast Models
          </h2>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span>30 Day</span>
              <span>Active</span>
            </div>

            <div className="flex justify-between">
              <span>90 Day</span>
              <span>Active</span>
            </div>

            <div className="flex justify-between">
              <span>180 Day</span>
              <span>Active</span>
            </div>

            <div className="flex justify-between">
              <span>365 Day</span>
              <span>Planned</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white">
            Executive Forecast Notes
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              • Revenue growth expected next
              quarter
            </p>

            <p>
              • Application volume increasing
            </p>

            <p>
              • Offer conversion improving
            </p>

            <p>
              • Visa demand remains strong
            </p>

            <p>
              • Counselor workload expected
              to increase
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}