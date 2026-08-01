// MarketIntelligencePanel V3 MAXIMUM — Founder Demand Intelligence
// src/components/admin/MarketIntelligencePanel.jsx

import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Building2,
  CircleGauge,
  Globe2,
  GraduationCap,
  Megaphone,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function normalizeMarketItems(items = []) {
  return safeArray(items)
    .map((item, index) => ({
      name: item?.name || `Unknown ${index + 1}`,
      count: Math.max(0, safeNumber(item?.count)),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

function percentage(part, total) {
  const denominator = safeNumber(total);
  if (denominator <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((safeNumber(part) / denominator) * 100)));
}

function MarketList({
  title,
  items = [],
  empty = "No records yet.",
  query = "",
  sortMode = "count",
  compact = false,
}) {
  const reduceMotion = useReducedMotion();

  const filteredItems = useMemo(() => {
    const cleanQuery = normalize(query);
    let rows = normalizeMarketItems(items).filter((item) =>
      cleanQuery ? normalize(item.name).includes(cleanQuery) : true
    );

    if (sortMode === "name") {
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    }

    return rows;
  }, [items, query, sortMode]);

  const max = Math.max(...filteredItems.map((item) => safeNumber(item.count)), 1);
  const total = filteredItems.reduce((sum, item) => sum + safeNumber(item.count), 0);
  const rows = compact ? filteredItems.slice(0, 5) : filteredItems.slice(0, 12);

  return (
    <div className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)] sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold text-[#65748B]">
            {filteredItems.length} ranked signal{filteredItems.length === 1 ? "" : "s"}
          </p>
        </div>

        {total > 0 ? (
          <span className="rounded-full border-2 border-[#FFB38A] bg-[#FFF4EA] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#9B3E08]">
            {total} total demand
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((item, index) => {
            const width = Math.max(5, Math.round((safeNumber(item.count) / max) * 100));
            const share = percentage(item.count, total);

            return (
              <motion.div
                key={`${item.name}-${index}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  delay: reduceMotion ? 0 : index * 0.025,
                }}
                className="rounded-xl border-2 border-slate-200 bg-[#fffdf9] p-3 transition hover:border-[#FFB38A] hover:bg-white"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[#10233F]">
                      #{index + 1} {item.name}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-[#65748B]">
                      {share}% of visible demand
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border-2 border-[#C9D7E6] bg-white px-3 py-1 text-xs font-black text-[#10233F]">
                    {item.count}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full border border-[#C9D7E6] bg-[#FFF8EF]">
                  <div
                    className="h-full rounded-full bg-[#FF5A0A] transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-6 text-center">
            <BarChart3 className="mx-auto h-7 w-7 text-[#D94B00]" />
            <p className="mt-3 text-sm font-semibold text-[#65748B]">{empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketIntelligencePanel({ growth = {}, compact = false }) {
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState("countries");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState("count");

  const market = growth?.market || {};

  const normalizedMarket = useMemo(
    () => ({
      countries: normalizeMarketItems(market.countries),
      universities: normalizeMarketItems(market.universities),
      courses: normalizeMarketItems(market.courses),
      sources: normalizeMarketItems(market.sources),
    }),
    [market.countries, market.universities, market.courses, market.sources]
  );

  const views = [
    { key: "countries", label: "Countries", title: "Top Countries", icon: Globe2 },
    { key: "universities", label: "Universities", title: "Top Universities", icon: Building2 },
    { key: "courses", label: "Courses", title: "Top Courses", icon: GraduationCap },
    { key: "sources", label: "Sources", title: "Top Sources", icon: Megaphone },
  ];

  const activeView = views.find((item) => item.key === view) || views[0];
  const activeItems = normalizedMarket[view] || [];

  const metrics = useMemo(() => {
    const allLists = Object.values(normalizedMarket);
    const totalSignals = allLists.reduce(
      (sum, list) => sum + list.reduce((inner, item) => inner + safeNumber(item.count), 0),
      0
    );
    const categoriesWithData = allLists.filter((list) => list.length > 0).length;
    const activeTotal = activeItems.reduce((sum, item) => sum + safeNumber(item.count), 0);
    const topItem = activeItems[0] || null;
    const topShare = topItem ? percentage(topItem.count, activeTotal) : 0;
    const diversification = activeItems.length <= 1 ? 0 : Math.max(0, 100 - topShare);

    return {
      totalSignals,
      categoriesWithData,
      activeTotal,
      topItem,
      topShare,
      diversification,
    };
  }, [normalizedMarket, activeItems]);

  const interpretation = useMemo(() => {
    if (!metrics.topItem) {
      return {
        title: "Waiting for real market signals",
        detail:
          "Once student and marketing records populate this category, Zaifan can use the ranking to guide counselor focus, content, partnerships, and campaign allocation.",
        tone: "navy",
      };
    }

    if (metrics.topShare >= 60) {
      return {
        title: `Demand is highly concentrated around ${metrics.topItem.name}`,
        detail: `${metrics.topItem.name} currently represents ${metrics.topShare}% of visible ${activeView.label.toLowerCase()} demand. This supports focused execution, but concentration should be watched before committing too much counselor capacity or budget.`,
        tone: "warning",
      };
    }

    if (metrics.topShare >= 35) {
      return {
        title: `${metrics.topItem.name} is the strongest current demand signal`,
        detail: `${metrics.topItem.name} represents ${metrics.topShare}% of visible ${activeView.label.toLowerCase()} demand. The market has a clear leader while retaining meaningful secondary opportunities.`,
        tone: "orange",
      };
    }

    return {
      title: "Demand is relatively diversified",
      detail: `No single ${activeView.label.toLowerCase()} signal dominates the current data. This supports a broader content and counselor strategy rather than a single-market concentration.`,
      tone: "good",
    };
  }, [metrics.topItem, metrics.topShare, activeView.label]);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#FFB38A] bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]"
    >
      <div
        className="border-b-[3px] border-[#FF5A0A] bg-[#123865] p-5 sm:p-6"
        style={{ color: "#FFFFFF" }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Sparkles size={13} style={{ color: "#FDBA74" }} />
              <p className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: "#FFFFFF" }}>
                Market Intelligence
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black sm:text-3xl" style={{ color: "#FFFFFF" }}>
              Demand Signals
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6" style={{ color: "#F8FAFC" }}>
              Countries, universities, courses, and acquisition sources showing where real Zaifan demand is forming.
            </p>
          </div>

          {!compact ? (
            <div className="flex flex-wrap gap-2">
              {views.map((item) => {
                const Icon = item.icon;
                const active = view === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setView(item.key);
                      setQuery("");
                    }}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-black transition ${
                      active
                        ? "border-[#FFB38A] bg-[#FF5A0A] text-white"
                        : "border-white/25 bg-white/10 text-white hover:border-[#FFB38A] hover:bg-white/15"
                    }`}
                  >
                    <Icon size={13} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <IntelligenceMetric
            label="Total Market Signals"
            value={metrics.totalSignals}
            helper="Combined visible demand across all market categories."
            icon={Target}
            tone="navy"
          />
          <IntelligenceMetric
            label="Data Coverage"
            value={`${metrics.categoriesWithData}/4`}
            helper="Market categories currently containing usable records."
            icon={CircleGauge}
            tone={metrics.categoriesWithData >= 3 ? "good" : "warning"}
          />
          <IntelligenceMetric
            label="Top Signal Share"
            value={`${metrics.topShare}%`}
            helper={
              metrics.topItem
                ? `${metrics.topItem.name} leads the current ${activeView.label.toLowerCase()} view.`
                : "No leading signal yet."
            }
            icon={TrendingUp}
            tone="orange"
          />
          <IntelligenceMetric
            label="Diversification"
            value={`${metrics.diversification}%`}
            helper="Higher means demand is spread across more than one leading option."
            icon={BarChart3}
            tone="cream"
          />
        </div>

        {!compact ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${activeView.label.toLowerCase()}...`}
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#10233F] outline-none focus:border-[#FF5A0A]"
            >
              <option value="count">Sort: Demand</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        ) : null}

        {compact ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <MarketList title="Top Countries" items={normalizedMarket.countries} compact />
            <MarketList title="Top Sources" items={normalizedMarket.sources} compact />
          </div>
        ) : (
          <div className="mt-5">
            <MarketList
              title={activeView.title}
              items={activeItems}
              query={query}
              sortMode={sortMode}
            />
          </div>
        )}

        {!compact ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
            <FounderInterpretation
              title={interpretation.title}
              detail={interpretation.detail}
              tone={interpretation.tone}
            />

            <div className="rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
                Current Leader
              </p>
              <p className="mt-2 text-xl font-black text-[#10233F]">
                {metrics.topItem?.name || "No signal yet"}
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#51627A]">
                {metrics.topItem
                  ? `${metrics.topItem.count} visible demand record${
                      metrics.topItem.count === 1 ? "" : "s"
                    } in the current ${activeView.label.toLowerCase()} view.`
                  : "Add real CRM and marketing records to identify a leading market signal."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

function IntelligenceMetric({ label, value, helper, icon: Icon, tone = "orange" }) {
  const dark = tone === "navy";

  const surface =
    tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : tone === "cream"
      ? "border-[#C9D7E6] bg-white"
      : "border-[#FFB38A] bg-[#FFF4EA]";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${surface}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em]" style={{ color: dark ? "#FDBA74" : "#64748B" }}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-black" style={{ color: dark ? "#FFFFFF" : "#10233F" }}>
            {value}
          </p>
        </div>
        <Icon size={18} style={{ color: dark ? "#FDBA74" : "#C2410C" }} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5" style={{ color: dark ? "#F8FAFC" : "#64748B" }}>
        {helper}
      </p>
    </div>
  );
}

function FounderInterpretation({ title, detail, tone = "orange" }) {
  const style =
    tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-[#FFB38A] bg-[#FFF4EA]";

  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_5px_16px_rgba(15,35,63,0.03)] ${style}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
          dark ? "border-white/25 bg-white/10" : "border-[#FFB38A] bg-white"
        }`}>
          <Sparkles size={17} style={{ color: dark ? "#FDBA74" : "#C2410C" }} />
        </div>
        <div>
          <p className="font-black" style={{ color: dark ? "#FFFFFF" : "#10233F" }}>{title}</p>
          <p className="mt-2 text-sm font-semibold leading-6" style={{ color: dark ? "#F8FAFC" : "#64748B" }}>{detail}</p>
        </div>
      </div>
    </div>
  );
}
