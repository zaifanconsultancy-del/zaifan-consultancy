// KPICommandCenter V3 EXTREME — Zaifan Analytics OS
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
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Analytics OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              KPI Command Center
            </h2>
          </div>

          <Target size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {kpis.slice(0, 4).map((item) => (
            <CompactKPI key={item.key} item={item} />
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
              <HeaderChip icon={Target} label="KPI Command" />
              <HeaderChip icon={ShieldCheck} label="Evidence Based" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              KPI Command Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Monitor the real operating metrics already connected to Analytics
              OS. Targets remain optional and are never invented by this
              workspace.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="KPIs" value={kpis.length} />
              <DarkMetric label="Targets Set" value={configuredTargets} />
              <DarkMetric label="Targets Reached" value={reachedTargets} />
              <DarkMetric
                label="Unconfigured"
                value={kpis.length - configuredTargets}
              />
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  KPI Governance
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {configuredTargets}/{kpis.length}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  targets configured
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <BarChart3 size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                No hidden benchmark assumptions
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                A KPI can have a real current value without having a configured
                business target. Those are kept separate.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search KPIs, owners, periods or sources..."
              aria-label="Search KPI Command Center"
              className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear KPI search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {groups.map((group) => {
              const active = group === activeGroup;

              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setActiveGroup(group)}
                  className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                    active
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {configuredTargets === 0 ? (
        <div className="rounded-[1.35rem] border-[3px] border-blue-300 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Info
              size={18}
              className="mt-0.5 shrink-0 text-blue-700"
            />
            <div>
              <p className="font-black text-[#10233F]">
                Business targets are not configured yet
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Current KPI values remain useful and visible. Progress,
                target-gap and target-status analytics will activate
                automatically when real targets are supplied through
                <code className="mx-1 rounded bg-white px-1 py-0.5 text-[10px] font-black text-[#123865]">
                  analytics.kpiTargets
                </code>
                or
                <code className="mx-1 rounded bg-white px-1 py-0.5 text-[10px] font-black text-[#123865]">
                  analytics.targets
                </code>.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filteredKpis.length ? (
          filteredKpis.map((item) => (
            <KPICard key={item.key} item={item} />
          ))
        ) : (
          <div className="sm:col-span-2 xl:col-span-4">
            <EmptyState
              onClear={() => {
                setSearch("");
                setActiveGroup("All");
              }}
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Performance"
            title="Configured Target Position"
            description="Only KPIs with explicit targets are evaluated."
            icon={CircleGauge}
          />

          <div className="p-4">
            {configuredTargets ? (
              <div className="space-y-3">
                {kpis
                  .filter((item) => item.progress !== null)
                  .map((item) => (
                    <ProgressRow key={item.key} item={item} />
                  ))}
              </div>
            ) : (
              <PanelEmpty
                title="No target performance to evaluate"
                text="Configure real business targets before Analytics OS labels any KPI as ahead, behind or complete."
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
          <SectionHeader
            eyebrow="Governance"
            title="KPI Evidence Rules"
            description="How this workspace protects executive analytics from template assumptions."
            icon={ShieldCheck}
          />

          <div className="grid gap-3 p-4">
            <GovernanceRow
              icon={CheckCircle2}
              title="Current values"
              text="Read directly from the Analytics OS metrics contract."
              tone="green"
            />
            <GovernanceRow
              icon={Target}
              title="Targets"
              text="Displayed only when a real target is supplied."
              tone="orange"
            />
            <GovernanceRow
              icon={CircleGauge}
              title="Progress"
              text="Calculated from current value ÷ configured target."
              tone="blue"
            />
            <GovernanceRow
              icon={ShieldCheck}
              title="Outcome language"
              text="Conversion percentages are operating indicators, not guaranteed student outcomes."
              tone="navy"
            />
          </div>
        </section>
      </div>
    </section>
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

        <div className="mt-4 rounded-xl border-2 border-slate-300 bg-white/75 p-3">
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
                  className="h-full rounded-full bg-orange-500"
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

      <div className="border-t-2 border-slate-200 bg-white/55 px-4 py-3">
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
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
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
    <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-[#10233F]">{item.label}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {formatValue(item.value, item.format)} current ·{" "}
            {formatValue(item.target, item.format)} target
          </p>
        </div>

        <span className="w-fit rounded-lg border-2 border-orange-300 bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] text-orange-800">
          {item.progress}% of target
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-orange-500"
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

function GovernanceRow({ icon: Icon, title, text, tone }) {
  const style =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "orange"
        ? "border-orange-300 bg-orange-50"
        : tone === "blue"
          ? "border-blue-300 bg-blue-50"
          : "border-[#B8CBE0] bg-[#EEF4FA]";

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
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
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
    <div className="rounded-[1.35rem] border-[3px] border-dashed border-slate-300 bg-slate-50 p-6 text-center">
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
        className="mt-3 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
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
    <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[8px] font-black text-slate-600">
      {label}
    </span>
  );
}

function toneClass(tone) {
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}

function statusIconClass(tone) {
  if (tone === "green") return "text-emerald-700";
  if (tone === "orange") return "text-orange-700";
  if (tone === "blue") return "text-blue-700";
  return "text-slate-500";
}
