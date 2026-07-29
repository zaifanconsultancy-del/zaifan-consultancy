// BusinessIntelligencePanel V3 EXTREME — Zaifan Analytics OS
// Full replacement for:
// src/components/admin/analytics/BusinessIntelligencePanel.jsx
//
// Production principles:
// - no fake country demand labels
// - no fake counselor / agent performance claims
// - use only analytics data actually supplied by the parent
// - funnel metrics remain deterministic and read-only
// - optional geography / counselor / source breakdowns are supported when supplied
// - missing business-intelligence inputs render honest empty states
// - unified Zaifan navy/orange/cream Analytics OS visual language
//
// Supported props:
// analytics = {
//   students?: [],
//   applications?: [],
//   offers?: [],
//   visas?: [],
//   payments?: [],
//   metrics?: {
//     students,
//     applications,
//     offers,
//     visas,
//     revenue,
//     applicationRate,
//     offerRate,
//     visaRate
//   },
//   geography?: [
//     { country, students, applications, offers, visas, revenue }
//   ],
//   counselors?: [
//     { name, students, applications, offers, visas, revenue }
//   ],
//   sources?: [
//     { name, students, applications, offers, visas, revenue }
//   ]
// }
// compact?: boolean

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleGauge,
  Database,
  FileText,
  GraduationCap,
  Globe2,
  Info,
  Landmark,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function money(value) {
  const amount = number(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `£${amount.toLocaleString("en-GB")}`;
  }
}

function percentage(part, total) {
  const partNumber = number(part, NaN);
  const totalNumber = number(total, NaN);

  if (
    !Number.isFinite(partNumber) ||
    !Number.isFinite(totalNumber) ||
    totalNumber <= 0
  ) {
    return null;
  }

  return Math.round((partNumber / totalNumber) * 100);
}

function formatPercent(value) {
  return hasValue(value) && Number.isFinite(Number(value))
    ? `${Math.round(Number(value))}%`
    : "—";
}

function deriveStageBreakdown(analytics = {}) {
  const students = safeArray(analytics.students);
  const applications = safeArray(analytics.applications);
  const offers = safeArray(analytics.offers);
  const visas = safeArray(analytics.visas);

  return [
    {
      key: "students",
      label: "Students",
      value: hasValue(analytics.metrics?.students)
        ? analytics.metrics.students
        : students.length,
      icon: Users,
      tone: "blue",
      detail: "Student records represented in the Analytics OS snapshot.",
    },
    {
      key: "applications",
      label: "Applications",
      value: hasValue(analytics.metrics?.applications)
        ? analytics.metrics.applications
        : applications.length,
      icon: FileText,
      tone: "navy",
      detail: "Application records represented in the operating snapshot.",
    },
    {
      key: "offers",
      label: "Offers",
      value: hasValue(analytics.metrics?.offers)
        ? analytics.metrics.offers
        : offers.length,
      icon: GraduationCap,
      tone: "green",
      detail: "Offer records represented in Analytics OS.",
    },
    {
      key: "visas",
      label: "Visas",
      value: hasValue(analytics.metrics?.visas)
        ? analytics.metrics.visas
        : visas.length,
      icon: ShieldCheck,
      tone: "green",
      detail: "Visa records represented in Analytics OS.",
    },
  ];
}

export default function BusinessIntelligencePanel({
  analytics = {},
  compact = false,
}) {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("funnel");

  const metrics = analytics.metrics || {};

  const funnel = useMemo(
    () => deriveStageBreakdown(analytics),
    [analytics]
  );

  const geography = useMemo(
    () => safeArray(analytics.geography),
    [analytics.geography]
  );

  const counselors = useMemo(
    () => safeArray(analytics.counselors),
    [analytics.counselors]
  );

  const sources = useMemo(
    () => safeArray(analytics.sources),
    [analytics.sources]
  );

  const query = normalize(search);

  const visibleGeography = useMemo(
    () =>
      geography.filter((item) =>
        normalize(
          [
            item.country,
            item.name,
            item.students,
            item.applications,
            item.offers,
            item.visas,
            item.revenue,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [geography, query]
  );

  const visibleCounselors = useMemo(
    () =>
      counselors.filter((item) =>
        normalize(
          [
            item.name,
            item.students,
            item.applications,
            item.offers,
            item.visas,
            item.revenue,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [counselors, query]
  );

  const visibleSources = useMemo(
    () =>
      sources.filter((item) =>
        normalize(
          [
            item.name,
            item.students,
            item.applications,
            item.offers,
            item.visas,
            item.revenue,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [sources, query]
  );

  const applicationRate = hasValue(metrics.applicationRate)
    ? metrics.applicationRate
    : percentage(metrics.applications, metrics.students);

  const offerRate = hasValue(metrics.offerRate)
    ? metrics.offerRate
    : percentage(metrics.offers, metrics.applications);

  const visaRate = hasValue(metrics.visaRate)
    ? metrics.visaRate
    : percentage(metrics.visas, metrics.offers);

  const conversionSignals = [
    {
      label: "Student → Application",
      value: formatPercent(applicationRate),
      detail: "Current student-to-application operating indicator.",
      tone: "navy",
      icon: CircleGauge,
    },
    {
      label: "Application → Offer",
      value: formatPercent(offerRate),
      detail: "Current application-to-offer operating indicator.",
      tone: "green",
      icon: Target,
    },
    {
      label: "Offer → Visa",
      value: formatPercent(visaRate),
      detail: "Current offer-to-visa operating indicator.",
      tone: "green",
      icon: ShieldCheck,
    },
    {
      label: "Connected Revenue",
      value: money(metrics.revenue),
      detail: "Collected payment value supplied to Analytics OS.",
      tone: "orange",
      icon: WalletCards,
    },
  ];

  const connectedBreakdowns =
    Number(geography.length > 0) +
    Number(counselors.length > 0) +
    Number(sources.length > 0);

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Analytics OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Business Intelligence
            </h2>
          </div>

          <Landmark size={18} />
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {funnel.map((item) => (
            <CompactMetric key={item.key} item={item} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_16px_42px_rgba(23,36,61,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Landmark} label="Business Intelligence" />
              <HeaderChip icon={ShieldCheck} label="Read Only" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Business Intelligence Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Inspect the real student funnel, conversion indicators and
              optional geography, counselor and acquisition-source breakdowns
              without inventing market demand or performance claims.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Students" value={metrics.students ?? 0} />
              <DarkMetric label="Applications" value={metrics.applications ?? 0} />
              <DarkMetric label="Offers" value={metrics.offers ?? 0} />
              <DarkMetric label="Visas" value={metrics.visas ?? 0} />
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  BI data depth
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {connectedBreakdowns}/3
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  optional breakdowns connected
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <BarChart3 size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                Funnel works today
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                Geography, counselor and source intelligence activate only when
                their real breakdown arrays are supplied.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {[
              ["funnel", "Funnel"],
              ["geography", "Geography"],
              ["counselors", "Counselors"],
              ["sources", "Sources"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key)}
                className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                  activeView === key
                    ? "border-[#123865] bg-[#123865] text-white"
                    : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search geography, counselor or acquisition-source intelligence..."
              aria-label="Search Business Intelligence"
              className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear BI search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {conversionSignals.map((item) => (
          <SignalCard key={item.label} {...item} />
        ))}
      </div>

      {activeView === "funnel" ? (
        <FunnelWorkspace funnel={funnel} metrics={metrics} />
      ) : null}

      {activeView === "geography" ? (
        <BreakdownWorkspace
          eyebrow="Geography Intelligence"
          title="Country Performance"
          description="Country intelligence only appears when a real geography breakdown is supplied."
          icon={Globe2}
          items={visibleGeography}
          emptyTitle="No geography breakdown connected"
          emptyText="This workspace will not guess that the UK is high demand, Australia is growing or Canada is stable. Supply analytics.geography to activate country intelligence."
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      {activeView === "counselors" ? (
        <BreakdownWorkspace
          eyebrow="Counselor Intelligence"
          title="Counselor Performance"
          description="Counselor-level operating metrics appear only when a real counselor breakdown is supplied."
          icon={Users}
          items={visibleCounselors}
          emptyTitle="No counselor analytics connected"
          emptyText="Supply analytics.counselors before this workspace labels or ranks counselor performance."
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      {activeView === "sources" ? (
        <BreakdownWorkspace
          eyebrow="Acquisition Intelligence"
          title="Lead & Referral Sources"
          description="Source-level volume and outcome intelligence appears only when supplied."
          icon={Activity}
          items={visibleSources}
          emptyTitle="No acquisition-source breakdown connected"
          emptyText="Supply analytics.sources to compare real lead, agent, referral or campaign sources."
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#123865]" />
            <div>
              <p className="font-black text-[#10233F]">
                BI integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                The old static UK, Australia and Canada demand labels are gone.
                Funnel values remain deterministic; richer breakdowns stay
                unavailable until real data exists.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Database size={18} className="mt-0.5 shrink-0 text-orange-700" />
            <div>
              <p className="font-black text-[#10233F]">
                Extensible data contract
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Geography, counselor and acquisition intelligence can be added
                later without redesigning this component.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function FunnelWorkspace({ funnel, metrics }) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow="Pipeline Intelligence"
        title="Student Journey Funnel"
        description="Current operating counts and deterministic conversion indicators."
        icon={TrendingUp}
      />

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {funnel.map((item, index) => (
            <FunnelCard
              key={item.key}
              item={item}
              index={index}
              previous={index > 0 ? funnel[index - 1] : null}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ConversionRow
            label="Student → Application"
            numerator={metrics.applications}
            denominator={metrics.students}
          />
          <ConversionRow
            label="Application → Offer"
            numerator={metrics.offers}
            denominator={metrics.applications}
          />
          <ConversionRow
            label="Offer → Visa"
            numerator={metrics.visas}
            denominator={metrics.offers}
          />
        </div>
      </div>
    </section>
  );
}

function FunnelCard({ item, index, previous }) {
  const Icon = item.icon;
  const conversion = previous
    ? percentage(item.value, previous.value)
    : null;

  return (
    <article className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass(item.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-slate-500">
            Stage {index + 1}
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {item.label}
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-black text-[#10233F]">
        {number(item.value).toLocaleString("en-GB")}
      </p>

      <p className="mt-2 min-h-[40px] text-[10px] font-semibold leading-4 text-slate-600">
        {item.detail}
      </p>

      {previous ? (
        <div className="mt-3 rounded-lg border-2 border-slate-300 bg-white/75 p-2.5">
          <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
            From {previous.label}
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {formatPercent(conversion)}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function ConversionRow({ label, numerator, denominator }) {
  const value = percentage(numerator, denominator);

  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">
        {formatPercent(value)}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-slate-500">
        Operating indicator only
      </p>
    </div>
  );
}

function BreakdownWorkspace({
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
  emptyTitle,
  emptyText,
  query,
  onClear,
}) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={Icon}
      />

      <div className="p-4 sm:p-5">
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <BreakdownCard key={item.id || item.name || item.country || index} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No records match this search" : emptyTitle}
            text={query ? "Try another search term." : emptyText}
            onClear={query ? onClear : undefined}
          />
        )}
      </div>
    </section>
  );
}

function BreakdownCard({ item }) {
  const label = item.country || item.name || "Unnamed segment";

  return (
    <article className="rounded-[1.25rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            Segment
          </p>
          <h3 className="mt-1 text-sm font-black text-[#10233F]">{label}</h3>
        </div>

        <CheckCircle2 size={17} className="text-[#123865]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat label="Students" value={item.students} />
        <MiniStat label="Applications" value={item.applications} />
        <MiniStat label="Offers" value={item.offers} />
        <MiniStat label="Visas" value={item.visas} />
      </div>

      <div className="mt-3 rounded-lg border-2 border-orange-300 bg-orange-50 p-3">
        <p className="text-[8px] font-black uppercase tracking-[0.07em] text-orange-800">
          Revenue
        </p>
        <p className="mt-1 text-lg font-black text-[#10233F]">
          {hasValue(item.revenue) ? money(item.revenue) : "—"}
        </p>
      </div>
    </article>
  );
}

function SignalCard({ label, value, detail, tone, icon: Icon }) {
  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function SectionHeader({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
        <Icon size={17} />
      </span>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-black text-white">
        {number(value).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function CompactMetric({ item }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {item.label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {number(item.value).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border-2 border-slate-200 bg-white p-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-[#10233F]">
        {hasValue(value) ? number(value).toLocaleString("en-GB") : "—"}
      </p>
    </div>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
        >
          Clear search
          <ArrowRight size={12} />
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}
