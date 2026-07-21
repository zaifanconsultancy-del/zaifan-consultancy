import React, { useState } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function MarketList({ title, items = [], empty = "No records yet." }) {
  const max = Math.max(...items.map((item) => safeNumber(item.count)), 1);

  return (
    <div className="rounded-3xl border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
      <p className="text-sm font-black text-[#10233f]">{title}</p>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.slice(0, 8).map((item) => {
            const width = Math.max(
              4,
              Math.round((safeNumber(item.count) / max) * 100)
            );

            return (
              <div key={item.name}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-700">{item.name}</span>
                  <span className="font-black text-slate-500">{item.count}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full border border-slate-300 bg-[#fffaf2]">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
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

export default function MarketIntelligencePanel({
  growth = {},
  compact = false,
}) {
  const [view, setView] = useState("countries");
  const market = growth.market || {};

  const views = [
    { key: "countries", label: "Countries", title: "Top Countries" },
    { key: "universities", label: "Universities", title: "Top Universities" },
    { key: "courses", label: "Courses", title: "Top Courses" },
    { key: "sources", label: "Sources", title: "Top Sources" },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
      <div className="flex flex-col gap-2 border-b border-orange-200 bg-[#102f5c] p-5 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
            Market Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Demand Signals
          </h2>

          <p className="mt-1 text-sm text-slate-200">
            Countries, universities, courses, and source channels showing
            founder-level market demand.
          </p>
        </div>

        {!compact ? (
          <div className="flex flex-wrap gap-2">
            {views.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                  view === item.key
                    ? "border-orange-500 bg-orange-500 text-white shadow-[0_6px_16px_rgba(249,115,22,0.18)]"
                    : "border-white/20 bg-white/10 text-white hover:border-orange-300 hover:bg-orange-500/15"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="bg-[#fff8ee] p-5">
        {compact ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <MarketList title="Top Countries" items={market.countries || []} />
            <MarketList title="Top Sources" items={market.sources || []} />
          </div>
        ) : (
          <MarketList
            title={views.find((item) => item.key === view)?.title || "Market"}
            items={market[view] || []}
          />
        )}

        {!compact ? (
          <div className="mt-5 rounded-3xl border border-slate-300 bg-white p-4 shadow-[0_4px_14px_rgba(15,35,63,0.03)]">
            <p className="text-sm font-black text-[#10233f]">
              Founder interpretation
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Once real marketing and student data is inserted, this panel shows
              where Zaifan should invest counselor focus, university
              partnerships, content, and paid campaigns.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}