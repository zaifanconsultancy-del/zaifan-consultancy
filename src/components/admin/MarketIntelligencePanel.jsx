import React, { useState } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function MarketList({ title, items = [], empty = "No records yet." }) {
  const max = Math.max(...items.map((item) => safeNumber(item.count)), 1);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-sm font-black text-white">{title}</p>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.slice(0, 8).map((item) => {
            const width = Math.max(4, Math.round((safeNumber(item.count) / max) * 100));

            return (
              <div key={item.name}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-300">{item.name}</span>
                  <span className="text-slate-500">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

export default function MarketIntelligencePanel({ growth = {}, compact = false }) {
  const [view, setView] = useState("countries");
  const market = growth.market || {};

  const views = [
    { key: "countries", label: "Countries", title: "Top Countries" },
    { key: "universities", label: "Universities", title: "Top Universities" },
    { key: "courses", label: "Courses", title: "Top Courses" },
    { key: "sources", label: "Sources", title: "Top Sources" },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Market Intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-white">Demand Signals</h2>
          <p className="mt-1 text-sm text-slate-400">
            Countries, universities, courses, and source channels showing founder-level market demand.
          </p>
        </div>

        {!compact ? (
          <div className="flex flex-wrap gap-2">
            {views.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`rounded-2xl px-3 py-2 text-xs font-black ${
                  view === item.key ? "bg-white text-slate-950" : "border border-white/10 bg-white/[0.04] text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {compact ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <MarketList title="Top Countries" items={market.countries || []} />
          <MarketList title="Top Sources" items={market.sources || []} />
        </div>
      ) : (
        <MarketList title={views.find((item) => item.key === view)?.title || "Market"} items={market[view] || []} />
      )}

      {!compact ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-black text-white">Founder interpretation</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Once real marketing and student data is inserted, this panel shows where Zaifan should invest counselor focus,
            university partnerships, content, and paid campaigns.
          </p>
        </div>
      ) : null}
    </section>
  );
}
