import React from "react";

function KPISection({ title, items = [] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="text-lg font-black text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-2xl border border-white/5 p-3"
          >
            <div>
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>

            <div className="text-right">
              <p className="text-xl font-black text-cyan-300">
                {item.value}
              </p>
              <p className="text-xs text-slate-500">
                Target {item.target}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KPICommandCenter({ analytics = {}, compact = false }) {
  const metrics = analytics?.metrics || {};

  const sections = [
    {
      title: "Student KPIs",
      items: [
        {
          label: "Students",
          value: metrics.students || 0,
          target: 1000,
          description: "Tracked students"
        },
        {
          label: "Applications",
          value: metrics.applications || 0,
          target: 500,
          description: "Application volume"
        }
      ]
    },
    {
      title: "Revenue KPIs",
      items: [
        {
          label: "Revenue",
          value: `£${metrics.revenue || 0}`,
          target: "£250k",
          description: "Revenue generated"
        }
      ]
    },
    {
      title: "Executive KPIs",
      items: [
        {
          label: "Offers",
          value: metrics.offers || 0,
          target: 250,
          description: "Offer generation"
        },
        {
          label: "Visas",
          value: metrics.visas || 0,
          target: 200,
          description: "Visa outcomes"
        }
      ]
    }
  ];

  if (compact) {
    return (
      <div className="rounded-3xl border border-white/10 p-5">
        <h2 className="text-xl font-black text-white">
          KPI Command Center
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-white/10 p-4"
            >
              <p className="font-bold text-cyan-300">
                {section.title}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {section.items.length} KPIs tracked
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
        <h1 className="text-3xl font-black text-white">
          KPI Command Center
        </h1>

        <p className="mt-2 text-slate-400">
          Executive KPI monitoring, ownership, targets,
          thresholds and performance tracking.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {sections.map((section) => (
          <KPISection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>
    </div>
  );
}
