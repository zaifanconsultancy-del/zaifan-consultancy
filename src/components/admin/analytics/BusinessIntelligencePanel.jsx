// BusinessIntelligencePanel V5 PARTNER OS EXTREME — Growth Intelligence Command
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
    <section className="min-w-0 space-y-5">
      <header className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <HeaderChip icon={Landmark} label="Founder Growth OS" />
              <HeaderChip icon={ShieldCheck} label="Business Intelligence" />
              <HeaderChip icon={Database} label="Evidence First" />
            </div>

            <h1 className="mt-4 max-w-5xl break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              Business Intelligence Command
            </h1>

            <p className="mt-3 max-w-5xl break-words text-sm font-semibold leading-6 text-slate-100">
              Pipeline conversion, geography, counselor performance and
              acquisition-source evidence in one founder-level operating workspace.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Students" value={metrics.students ?? funnel[0]?.value ?? 0} />
              <DarkMetric label="Applications" value={metrics.applications ?? funnel[1]?.value ?? 0} />
              <DarkMetric label="Offers" value={metrics.offers ?? funnel[2]?.value ?? 0} />
              <DarkMetric label="Visas" value={metrics.visas ?? funnel[3]?.value ?? 0} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Business Operating Position
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {formatPercent(visaRate)}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              End-to-End Conversion
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric label="Application" value={formatPercent(applicationRate)} />
              <OrangeMetric label="Offer" value={formatPercent(offerRate)} />
              <OrangeMetric label="Visa" value={formatPercent(visaRate)} />
              <OrangeMetric label="Revenue" value={money(metrics.revenue)} />
            </div>

            <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Command Rule
              </p>
              <p className="mt-1 text-xs font-black leading-5 text-white">
                Fix the weakest funnel stage first, then assign ownership using
                only the geography, counselor and source evidence supplied.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Growth Operations Board
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Funnel health and connected business evidence
            </h2>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
              Grouped founder intelligence replaces the loose signal-card row.
            </p>
          </div>

          <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
            {connectedBreakdowns}/3 breakdowns connected
          </span>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <SignalCard
            label="Student Volume"
            value={metrics.students ?? funnel[0]?.value ?? 0}
            detail="Student records represented in this snapshot."
            tone="navy"
            icon={Users}
          />
          <SignalCard
            label="Application Rate"
            value={formatPercent(applicationRate)}
            detail="Student-to-application conversion indicator."
            tone="blue"
            icon={CircleGauge}
          />
          <SignalCard
            label="Offer Rate"
            value={formatPercent(offerRate)}
            detail="Application-to-offer conversion indicator."
            tone="green"
            icon={Target}
          />
          <SignalCard
            label="Visa Rate"
            value={formatPercent(visaRate)}
            detail="Offer-to-visa conversion indicator."
            tone="orange"
            icon={ShieldCheck}
          />
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">BI Command Workspace</p>
            <h2 className="mt-1 text-xl font-black text-white">Business evidence portfolio</h2>
            <p className="mt-1 max-w-3xl text-xs font-semibold text-slate-200">
              One dominant workspace for funnel and supplied breakdown evidence.
            </p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(14rem,1fr)_10rem]">
            <label className="relative block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search BI evidence..." className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold" />
            </label>
            <select value={activeView} onChange={(event) => setActiveView(event.target.value)} className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black">
              <option value="funnel">Funnel</option>
              <option value="geography">Geography</option>
              <option value="counselors">Counselors</option>
              <option value="sources">Sources</option>
            </select>
          </div>
        </div>

        <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        {activeView === "funnel" ? <FunnelWorkspace funnel={funnel} metrics={metrics} /> : null}
        {activeView === "geography" ? <BreakdownWorkspace title="Geography evidence" icon={Globe2} rows={visibleGeography} emptyText="No geography evidence supplied." /> : null}
        {activeView === "counselors" ? <BreakdownWorkspace title="Counselor evidence" icon={Users} rows={visibleCounselors} emptyText="No counselor evidence supplied." /> : null}
        {activeView === "sources" ? <BreakdownWorkspace title="Source evidence" icon={Database} rows={visibleSources} emptyText="No source evidence supplied." /> : null}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <SignalCard label="Evidence Integrity" value="No synthetic rankings" detail="Breakdowns appear only when supplied." tone="green" icon={ShieldCheck} />
        <SignalCard label="Revenue Evidence" value={money(metrics.revenue)} detail="Connected collected value in the snapshot." tone="blue" icon={WalletCards} />
        <SignalCard label="Coverage" value={`${geography.length + counselors.length + sources.length} rows`} detail="Optional BI evidence currently connected." tone="orange" icon={Database} />
      </div>
    </section>
  );
}


function OrangeMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}


function FunnelWorkspace({ funnel, metrics }) {
  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFF8EF]">
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
        <div className="mt-3 rounded-lg border-2 border-[#C9D7E6] bg-white/75 p-2.5">
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
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-4">
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
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFF8EF]">
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
    <article className="rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4">
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

      <div className="mt-3 rounded-lg border-2 border-[#FF5A0A] bg-[#FFF4E8] p-3">
        <p className="text-[8px] font-black uppercase tracking-[0.07em] text-[#B84F0E]">
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
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-4 py-4 text-white">
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
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
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
    <div className="rounded-lg border-2 border-[#E1E8F0] bg-white p-2.5">
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
    <div className="rounded-[1.25rem] border-2 border-dashed border-[#C9D7E6] bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-[#FF5A0A] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4E8]"
        >
          Clear search
          <ArrowRight size={12} />
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "orange") return "border-[#FF5A0A] bg-[#FFF4E8]";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#C9D7E6] bg-[#FFF8EF]";
}
}
