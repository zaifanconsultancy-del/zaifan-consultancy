// KPICommandCenter V4 PARTNER-OS ALIGNED — Zaifan Analytics OS
// Full replacement for:
// src/components/admin/analytics/KPICommandCenter.jsx
//
// Production principles:
// - no invented KPI targets
// - no fake performance labels
// - actual values come from analytics.metrics
// - targets are optional and only shown when supplied
// - supports richer future KPI configuration without breaking today's parent
// - honest "Not configured" states
// - unified Zaifan navy/orange/cream Analytics OS visual language
//
// Supported props:
// analytics = {
//   metrics?: {
//     students, applications, offers, visas, revenue,
//     applicationRate, offerRate, visaRate
//   },
//   kpiTargets?: {
//     students, applications, offers, visas, revenue,
//     applicationRate, offerRate, visaRate
//   },
//   targets?: { ...same keys },
//   kpiMetadata?: {
//     [key]: { owner?, period?, source?, description? }
//   }
// }
// compact?: boolean

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleGauge,
  FileText,
  GraduationCap,
  Info,
  Landmark,
  Search,
  ShieldCheck,
  Target,
  Users,
  WalletCards,
  X,
} from "lucide-react";

const KPI_DEFINITIONS = [
  {
    key: "students",
    group: "Pipeline",
    label: "Students",
    description: "Student records currently represented in Analytics OS.",
    icon: Users,
    format: "number",
    tone: "blue",
  },
  {
    key: "applications",
    group: "Pipeline",
    label: "Applications",
    description: "Application records currently represented in the operating snapshot.",
    icon: FileText,
    format: "number",
    tone: "navy",
  },
  {
    key: "offers",
    group: "Outcomes",
    label: "Offers",
    description: "Offer records currently represented in Analytics OS.",
    icon: GraduationCap,
    format: "number",
    tone: "green",
  },
  {
    key: "visas",
    group: "Outcomes",
    label: "Visas",
    description: "Visa records currently represented in Analytics OS.",
    icon: ShieldCheck,
    format: "number",
    tone: "green",
  },
  {
    key: "revenue",
    group: "Commercial",
    label: "Connected Revenue",
    description: "Collected payment value supplied to the Analytics OS snapshot.",
    icon: WalletCards,
    format: "money",
    tone: "orange",
  },
  {
    key: "applicationRate",
    group: "Conversion",
    label: "Application Rate",
    description: "Student-to-application operating indicator calculated by Analytics OS.",
    icon: CircleGauge,
    format: "percent",
    tone: "navy",
  },
  {
    key: "offerRate",
    group: "Conversion",
    label: "Offer Rate",
    description: "Application-to-offer operating indicator calculated by Analytics OS.",
    icon: Target,
    format: "percent",
    tone: "green",
  },
  {
    key: "visaRate",
    group: "Conversion",
    label: "Visa Rate",
    description: "Offer-to-visa operating indicator calculated by Analytics OS.",
    icon: Landmark,
    format: "percent",
    tone: "green",
  },
];

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

function formatValue(value, format) {
  if (!hasValue(value)) return "—";
  if (format === "money") return money(value);
  if (format === "percent") return `${Math.round(number(value))}%`;
  return number(value).toLocaleString("en-GB");
}

function calculateProgress(value, target) {
  if (!hasValue(value) || !hasValue(target)) return null;

  const targetNumber = number(target, NaN);
  const valueNumber = number(value, NaN);

  if (
    !Number.isFinite(targetNumber) ||
    !Number.isFinite(valueNumber) ||
    targetNumber <= 0
  ) {
    return null;
  }

  return Math.max(0, Math.round((valueNumber / targetNumber) * 100));
}

function targetStatus(progress) {
  if (progress === null) {
    return {
      label: "Target not configured",
      tone: "neutral",
      icon: Info,
    };
  }

  if (progress >= 100) {
    return {
      label: "Target reached",
      tone: "green",
      icon: CheckCircle2,
    };
  }

  if (progress >= 75) {
    return {
      label: "Near target",
      tone: "blue",
      icon: ArrowUpRight,
    };
  }

  return {
    label: "Below configured target",
    tone: "orange",
    icon: AlertTriangle,
  };
}

export default function KPICommandCenter({
  analytics = {},
  compact = false,
}) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");

  const metrics = analytics?.metrics || {};
  const targets = analytics?.kpiTargets || analytics?.targets || {};
  const metadata = analytics?.kpiMetadata || {};

  const kpis = useMemo(
    () =>
      KPI_DEFINITIONS.map((definition) => {
        const value = metrics?.[definition.key];
        const target = targets?.[definition.key];
        const progress = calculateProgress(value, target);
        const status = targetStatus(progress);
        const meta = metadata?.[definition.key] || {};

        return {
          ...definition,
          value,
          target,
          progress,
          status,
          meta,
        };
      }),
    [metrics, targets, metadata]
  );

  const configuredTargets = useMemo(
    () => kpis.filter((item) => hasValue(item.target)).length,
    [kpis]
  );

  const reachedTargets = useMemo(
    () =>
      kpis.filter(
        (item) => item.progress !== null && item.progress >= 100
      ).length,
    [kpis]
  );

  const groups = useMemo(
    () => ["All", ...new Set(kpis.map((item) => item.group))],
    [kpis]
  );

  const filteredKpis = useMemo(() => {
    const query = normalize(search);

    return kpis.filter((item) => {
      const matchesGroup =
        activeGroup === "All" || item.group === activeGroup;

      const haystack = normalize(
        [
          item.label,
          item.group,
          item.description,
          item.meta?.owner,
          item.meta?.period,
          item.meta?.source,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return matchesGroup && (!query || haystack.includes(query));
    });
  }, [kpis, activeGroup, search]);

  if (compact) {
    return (
    <section className="min-w-0 space-y-5 rounded-[2rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Target} label="KPI OS" />
              <HeaderChip icon={ShieldCheck} label="Target Evidence" />
            </div>
            <h1 className="mt-3 text-3xl font-black text-white">KPI Command Center</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Current operating values, optional business targets and explicit ownership in one command portfolio.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">Current Workspace</p>
            <p className="mt-2 text-2xl font-black">KPI Portfolio</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase">{configuredTargets}/{kpis.length} targets</span>
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase">{reachedTargets} reached</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiSummary label="Total KPIs" value={kpis.length} helper="Operating definitions in this workspace." tone="navy" icon={BarChart3} />
        <KpiSummary label="Targets Set" value={configuredTargets} helper="KPIs with explicit business targets." tone="blue" icon={Target} />
        <KpiSummary label="Targets Reached" value={reachedTargets} helper="Configured targets currently reached." tone="green" icon={CheckCircle2} />
        <KpiSummary label="Unconfigured" value={kpis.length - configuredTargets} helper="KPIs without an explicit target." tone="amber" icon={Info} />
      </div>

      <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">KPI Command</p>
            <h2 className="mt-1 text-xl font-black text-[#10233F]">Operating KPI portfolio</h2>
            <p className="mt-1 text-xs font-semibold text-slate-600">Search and review real values, targets, ownership and target position.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_10rem]">
            <label className="relative block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search KPIs..." className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold" />
            </label>
            <select value={activeGroup} onChange={(event) => setActiveGroup(event.target.value)} className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black">
              {groups.map((group) => <option key={group}>{group}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredKpis.length ? filteredKpis.map((item) => (
            <KpiPortfolioRow key={item.key} item={item} />
          )) : <EmptyState onClear={() => { setSearch(""); setActiveGroup("All"); }} />}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <GovernanceRow icon={ShieldCheck} title="No invented targets" text="Progress is calculated only when an explicit target exists." tone="green" />
        <GovernanceRow icon={Info} title="Unknown stays unknown" text="Missing owners, periods and sources remain visibly unconfigured." tone="blue" />
        <GovernanceRow icon={CircleGauge} title={`${configuredTargets} configured targets`} text="Target governance remains separate from current KPI values." tone="orange" />
      </div>
    </section>
  );
}

function KpiSummary({ label, value, helper, tone = "blue", icon: Icon }) {
  const tones = {
    navy: "border-[#123865] bg-[#123865] text-white",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-[#10233F]",
    green: "border-[#34D399] bg-[#F0FFF8] text-[#10233F]",
    amber: "border-[#F59E0B] bg-[#FFF8E8] text-[#10233F]",
  };
  return (
    <article className={`min-h-[170px] rounded-[1.4rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[9px] font-black uppercase tracking-[0.11em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
        <Icon size={17} />
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 opacity-80">{helper}</p>
    </article>
  );
}

function KpiPortfolioRow({ item }) {
  return (
    <article className="grid gap-3 rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-4 xl:grid-cols-[minmax(16rem,1.35fr)_9rem_9rem_10rem_12rem] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-[#10233F]">{item.label}</p>
          <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase text-blue-700">{item.group}</span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">{item.description}</p>
      </div>
      <MiniValue label="Current" value={formatValue(item.value, item.format)} />
      <MiniValue label="Target" value={hasValue(item.target) ? formatValue(item.target, item.format) : "Not configured"} />
      <MiniValue label="Progress" value={item.progress === null ? "Unavailable" : `${item.progress}%`} />
      <MiniValue label="Owner" value={item.meta?.owner || "Not assigned"} />
    </article>
  );
}

function MiniValue({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
      <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function KPICard({ item }) {
  const Icon = item.icon;
  const StatusIcon = item.status.icon;

  return (
    <article
      className={`overflow-hidden rounded-[1.45rem] border-[3px] shadow-[0_9px_24px_rgba(23,36,61,0.05)] ${toneClass(
        item.tone
      )}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
              {item.group}
            </p>
            <h3 className="mt-1 text-sm font-black text-[#10233F]">
              {item.label}
            </h3>
          </div>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
            <Icon size={17} />
          </span>
        </div>

        <p className="mt-4 break-words text-3xl font-black tracking-[-0.025em] text-[#10233F]">
          {formatValue(item.value, item.format)}
        </p>

        <p className="mt-2 min-h-[40px] text-[10px] font-semibold leading-4 text-slate-600">
          {item.meta?.description || item.description}
        </p>

        <div className="mt-4 rounded-xl border-2 border-[#C9D7E6] bg-white/75 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
              Target
            </span>
            <span className="text-xs font-black text-[#10233F]">
              {hasValue(item.target)
                ? formatValue(item.target, item.format)
                : "Not configured"}
            </span>
          </div>

          {item.progress !== null ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#FF5A0A]"
                  style={{
                    width: `${Math.min(100, item.progress)}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-right text-[9px] font-black text-slate-600">
                {item.progress}% of target
              </p>
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t-2 border-[#E1E8F0] bg-white/55 px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusIcon
            size={14}
            className={statusIconClass(item.status.tone)}
          />
          <p className="text-[9px] font-black uppercase tracking-[0.07em] text-[#10233F]">
            {item.status.label}
          </p>
        </div>

        {(item.meta?.owner || item.meta?.period || item.meta?.source) ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.meta?.owner ? (
              <MetaChip label={`Owner: ${item.meta.owner}`} />
            ) : null}
            {item.meta?.period ? (
              <MetaChip label={`Period: ${item.meta.period}`} />
            ) : null}
            {item.meta?.source ? (
              <MetaChip label={`Source: ${item.meta.source}`} />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CompactKPI({ item }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {item.label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {formatValue(item.value, item.format)}
      </p>
      <p className="mt-1 text-[9px] font-semibold text-slate-500">
        Target:{" "}
        {hasValue(item.target)
          ? formatValue(item.target, item.format)
          : "Not configured"}
      </p>
    </div>
  );
}

function ProgressRow({ item }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-[#10233F]">{item.label}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {formatValue(item.value, item.format)} current ·{" "}
            {formatValue(item.target, item.format)} target
          </p>
        </div>

        <span className="w-fit rounded-lg border-2 border-[#F97316] bg-[#FFF4EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] text-[#B84F0E]">
          {item.progress}% of target
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#FF5A0A]"
          style={{ width: `${Math.min(100, item.progress)}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-4 text-white">
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

function GovernanceRow({ icon: Icon, title, text, tone }) {
  const style =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "orange"
        ? "border-[#F97316] bg-[#FFF4EA]"
        : tone === "blue"
          ? "border-blue-300 bg-blue-50"
          : "border-[#B8CBE0] bg-[#F2F7FF]";

  return (
    <div className={`rounded-xl border-2 p-3 ${style}`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="text-xs font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function PanelEmpty({ title, text }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-slate-50 p-5 text-center">
      <Target size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function EmptyState({ onClear }) {
  return (
    <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#C9D7E6] bg-slate-50 p-6 text-center">
      <Search size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">
        No KPIs match these filters
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-600">
        Clear the search and group filter to restore the full KPI workspace.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 rounded-lg border-2 border-[#F97316] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4EA]"
      >
        Clear filters
      </button>
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
        {value}
      </p>
    </div>
  );
}

function MetaChip({ label }) {
  return (
    <span className="rounded-md border border-[#C9D7E6] bg-white px-2 py-0.5 text-[8px] font-black text-slate-600">
      {label}
    </span>
  );
}

function toneClass(tone) {
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA]";
  if (tone === "green") return "border-[#34D399] bg-[#F0FFF8]";
  if (tone === "blue") return "border-[#60A5FA] bg-[#F2F7FF]";
  return "border-[#234E78] bg-[#F2F7FF]";
}

function statusIconClass(tone) {
  if (tone === "green") return "text-emerald-700";
  if (tone === "orange") return "text-[#B84F0E]";
  if (tone === "blue") return "text-blue-700";
  return "text-slate-500";
}
}
