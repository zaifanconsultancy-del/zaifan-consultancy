// CommunicationAnalytics V3 EXTREME — Zaifan Communication OS
// Full replacement for:
// src/components/admin/communication/CommunicationAnalytics.jsx
//
// Production principles:
// - no fake engagement index, monthly lift, risk count or automation count
// - no unsupported causal claims
// - trend deltas require real current + previous values
// - channel telemetry stays unavailable until supplied
// - automation candidates only appear when explicitly supplied
// - unified Zaifan navy/orange/cream Communication OS visual language
//
// Supported props:
// compact?: boolean
// inquiries?: []
// appointments?: []
// followUpReminders?: []
// communicationData?: {
//   analytics?: {
//     metrics?: object,
//     trends?: [
//       { metric, current, previous, owner?, unit?, source? }
//     ],
//     intelligence?: [
//       { title, detail, source?, confidence? }
//     ],
//     automationCandidates?: [
//       { title, detail, impact?, source? }
//     ],
//     updatedAt?: string
//   },
//   email?: { metrics?: object },
//   whatsapp?: { metrics?: object },
//   calls?: { metrics?: object },
//   meetings?: { metrics?: object }
// }
// onSendToAutomation?: (candidate) => void

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video,
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

function calculateDelta(current, previous) {
  if (!hasValue(current) || !hasValue(previous)) return null;

  const currentNumber = number(current, NaN);
  const previousNumber = number(previous, NaN);

  if (
    !Number.isFinite(currentNumber) ||
    !Number.isFinite(previousNumber) ||
    previousNumber === 0
  ) {
    return null;
  }

  return ((currentNumber - previousNumber) / Math.abs(previousNumber)) * 100;
}

function deltaState(delta) {
  if (delta === null || !Number.isFinite(delta)) return "unknown";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function formatMetric(value, unit = "") {
  if (!hasValue(value)) return "—";

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  if (unit === "%" || normalize(unit).includes("percent")) {
    return `${Math.round(parsed)}%`;
  }

  return parsed.toLocaleString("en-GB");
}

function formatTimestamp(value) {
  if (!value) return "No update time supplied";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Update time unavailable";
  }
}

function getStatus(record = {}) {
  return normalize(
    record.status ||
      record.stage ||
      record.application_status ||
      record.appointment_stage ||
      ""
  );
}

function getPriority(record = {}) {
  return normalize(record.priority || record.lead_priority || "");
}

function isOpen(record = {}) {
  return ![
    "closed",
    "completed",
    "resolved",
    "cancelled",
    "canceled",
    "rejected",
    "archived",
    "done",
  ].includes(getStatus(record));
}

function isPriority(record = {}) {
  return ["vip", "high", "urgent", "critical"].includes(getPriority(record));
}

function isDueReminder(reminder = {}) {
  const status = normalize(reminder.status);
  return !["done", "completed", "cancelled", "canceled"].includes(status);
}

function telemetryConnected(value) {
  return Boolean(value && typeof value === "object" && Object.keys(value).length);
}

export default function CommunicationAnalytics({
  compact = false,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  communicationData = {},
  onSendToAutomation,
}) {
  const [search, setSearch] = useState("");

  const safeInquiries = useMemo(() => safeArray(inquiries), [inquiries]);
  const safeAppointments = useMemo(() => safeArray(appointments), [appointments]);
  const safeReminders = useMemo(
    () => safeArray(followUpReminders),
    [followUpReminders]
  );

  const analytics = communicationData?.analytics || {};

  const trends = useMemo(
    () =>
      safeArray(analytics.trends).map((item, index) => {
        const current = item?.current;
        const previous = item?.previous;
        const delta = calculateDelta(current, previous);

        return {
          id: item?.id || `trend-${index}`,
          metric: item?.metric || item?.label || item?.title || `Trend ${index + 1}`,
          current,
          previous,
          owner: item?.owner || "",
          unit: item?.unit || "",
          source: item?.source || "",
          detail: item?.detail || item?.description || "",
          delta,
          state: deltaState(delta),
        };
      }),
    [analytics.trends]
  );

  const intelligence = useMemo(
    () =>
      safeArray(analytics.intelligence).map((item, index) => ({
        id: item?.id || `intelligence-${index}`,
        title:
          typeof item === "string"
            ? `Insight ${index + 1}`
            : item?.title || item?.label || `Insight ${index + 1}`,
        detail:
          typeof item === "string"
            ? item
            : item?.detail || item?.description || "No detail supplied.",
        source: typeof item === "string" ? "" : item?.source || "",
        confidence:
          typeof item === "string" ? undefined : item?.confidence,
      })),
    [analytics.intelligence]
  );

  const automationCandidates = useMemo(
    () =>
      safeArray(analytics.automationCandidates).map((item, index) => ({
        id: item?.id || `automation-${index}`,
        title:
          typeof item === "string"
            ? item
            : item?.title || item?.name || `Automation candidate ${index + 1}`,
        detail:
          typeof item === "string"
            ? ""
            : item?.detail || item?.description || "",
        impact:
          typeof item === "string"
            ? ""
            : item?.impact || item?.priority || "",
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
        raw: item,
      })),
    [analytics.automationCandidates]
  );

  const baseMetrics = useMemo(() => {
    const crmRecords = safeInquiries.length + safeAppointments.length;
    const openRecords = [...safeInquiries, ...safeAppointments].filter(isOpen).length;
    const priorityRecords = [...safeInquiries, ...safeAppointments].filter(isPriority).length;
    const dueFollowUps = safeReminders.filter(isDueReminder).length;

    return {
      crmRecords,
      openRecords,
      priorityRecords,
      dueFollowUps,
    };
  }, [safeInquiries, safeAppointments, safeReminders]);

  const channelTelemetry = useMemo(
    () => [
      {
        id: "email",
        label: "Email",
        icon: Mail,
        connected: telemetryConnected(communicationData?.email?.metrics),
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        connected: telemetryConnected(communicationData?.whatsapp?.metrics),
      },
      {
        id: "calls",
        label: "Calls",
        icon: Phone,
        connected: telemetryConnected(communicationData?.calls?.metrics),
      },
      {
        id: "meetings",
        label: "Meetings",
        icon: Video,
        connected: telemetryConnected(communicationData?.meetings?.metrics),
      },
    ],
    [communicationData]
  );

  const connectedTelemetryCount = channelTelemetry.filter(
    (item) => item.connected
  ).length;

  const query = normalize(search);

  const visibleTrends = useMemo(
    () =>
      trends.filter((item) =>
        normalize(
          [
            item.metric,
            item.owner,
            item.source,
            item.detail,
            item.current,
            item.previous,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [trends, query]
  );

  const visibleIntelligence = useMemo(
    () =>
      intelligence.filter((item) =>
        normalize(
          [item.title, item.detail, item.source, item.confidence]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [intelligence, query]
  );

  const visibleAutomationCandidates = useMemo(
    () =>
      automationCandidates.filter((item) =>
        normalize(
          [item.title, item.detail, item.impact, item.source]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [automationCandidates, query]
  );

  const comparableTrendCount = trends.filter(
    (item) => item.delta !== null
  ).length;

  const canSendAutomation = typeof onSendToAutomation === "function";

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Communication OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Communication Analytics
            </h2>
          </div>

          <BarChart3 size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <CompactMetric label="CRM Records" value={baseMetrics.crmRecords} />
          <CompactMetric label="Open" value={baseMetrics.openRecords} />
          <CompactMetric label="Priority" value={baseMetrics.priorityRecords} />
          <CompactMetric label="Telemetry" value={`${connectedTelemetryCount}/4`} />
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
              <HeaderChip icon={BarChart3} label="Communication Analytics" />
              <HeaderChip icon={ShieldCheck} label="Evidence First" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Communication Intelligence Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Analyze real CRM communication pressure and only show trend,
              engagement, channel or automation metrics when the underlying
              telemetry actually exists.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="CRM Records" value={baseMetrics.crmRecords} />
              <DarkMetric label="Open" value={baseMetrics.openRecords} />
              <DarkMetric label="Priority" value={baseMetrics.priorityRecords} />
              <DarkMetric label="Follow-Ups" value={baseMetrics.dueFollowUps} />
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Telemetry coverage
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {connectedTelemetryCount}/4
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  channels connected
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Activity size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                {comparableTrendCount} comparable trend metrics
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                Updated: {formatTimestamp(analytics.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-3">
        <Search
          size={17}
          className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search trends, intelligence, automation candidates or sources..."
          aria-label="Search Communication Analytics"
          className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />

        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear Communication Analytics search"
            className="absolute right-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="CRM Records"
          value={baseMetrics.crmRecords}
          detail="Current inquiry + appointment records in Communication OS."
          tone="blue"
        />
        <MetricCard
          icon={Clock3}
          label="Open Records"
          value={baseMetrics.openRecords}
          detail="CRM records not in a terminal/closed state."
          tone="navy"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Priority Records"
          value={baseMetrics.priorityRecords}
          detail="Records marked VIP, high, urgent or critical."
          tone="orange"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Follow-Ups"
          value={baseMetrics.dueFollowUps}
          detail="Follow-up reminders not completed or cancelled."
          tone="green"
        />
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Channel Evidence"
          title="Telemetry Coverage"
          description="Channel analytics only become available when real metrics are supplied."
          icon={Database}
          count={connectedTelemetryCount}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {channelTelemetry.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.id}
                className={`rounded-xl border-2 p-4 ${
                  item.connected
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[#10233F]">{item.label}</p>
                    <p
                      className={`mt-1 text-[9px] font-black uppercase tracking-[0.07em] ${
                        item.connected ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {item.connected ? "Telemetry connected" : "Telemetry unavailable"}
                    </p>
                  </div>

                  <Icon
                    size={18}
                    className={item.connected ? "text-emerald-700" : "text-slate-400"}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Historical Movement"
            title="Communication Performance Trends"
            description="Trend deltas are calculated only when current and previous values are both supplied."
            icon={TrendingUp}
            count={visibleTrends.length}
          />

          <div className="p-4">
            {!trends.length ? (
              <EmptyState
                title="No communication trend data connected"
                text="The old hard-coded 94%, 89%, 71%, 84% and 76% performance values have been removed."
              />
            ) : visibleTrends.length ? (
              <div className="space-y-3">
                {visibleTrends.map((item) => (
                  <TrendCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No trends match this search"
                text="Try another search term."
                onClear={() => setSearch("")}
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
          <SectionHeader
            eyebrow="Executive Intelligence"
            title="Evidence-Backed Insights"
            description="Insights only appear when an actual analytics or intelligence source supplies them."
            icon={Sparkles}
            count={visibleIntelligence.length}
          />

          <div className="p-4">
            {!intelligence.length ? (
              <EmptyState
                title="No communication intelligence connected"
                text="Unsupported claims such as 'WhatsApp reminders reduce document delays by 31%' are no longer generated."
              />
            ) : visibleIntelligence.length ? (
              <div className="space-y-3">
                {visibleIntelligence.map((item) => (
                  <InsightCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No insights match this search"
                text="Try another search term."
                onClear={() => setSearch("")}
              />
            )}
          </div>
        </section>
      </div>

      {!compact ? (
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Automation Bridge"
            title="Communication Automation Candidates"
            description="Candidates appear only when a real rules/analytics layer supplies them."
            icon={Bot}
            count={visibleAutomationCandidates.length}
          />

          <div className="p-4">
            {!automationCandidates.length ? (
              <EmptyState
                title="No automation candidates connected"
                text="The old static CAS chase, payment reminder and visa-prep recommendations are removed."
              />
            ) : visibleAutomationCandidates.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleAutomationCandidates.map((item) => (
                  <AutomationCard
                    key={item.id}
                    item={item}
                    canSend={canSendAutomation}
                    onSend={() =>
                      onSendToAutomation?.(item.raw ?? item)
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No automation candidates match this search"
                text="Try another search term."
                onClear={() => setSearch("")}
              />
            )}
          </div>
        </section>
      ) : null}

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-[#123865]"
            />
            <div>
              <p className="font-black text-[#10233F]">
                Analytics integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                No engagement index, monthly lift, channel health, risk
                conversation count or automation estimate is fabricated.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Database
              size={18}
              className="mt-0.5 shrink-0 text-orange-700"
            />
            <div>
              <p className="font-black text-[#10233F]">
                CRM truth first
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Until channel telemetry exists, this workspace reports only what
                Zaifan's current CRM and follow-up records can actually prove.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function TrendCard({ item }) {
  const Icon =
    item.state === "up"
      ? ArrowUpRight
      : item.state === "down"
        ? ArrowDownRight
        : Activity;

  return (
    <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">{item.metric}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {item.owner ? `Owner: ${item.owner}` : "Owner unavailable"}
          </p>
        </div>

        <Icon
          size={17}
          className={
            item.state === "up"
              ? "text-emerald-700"
              : item.state === "down"
                ? "text-red-700"
                : "text-slate-400"
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Current" value={formatMetric(item.current, item.unit)} />
        <MiniStat label="Previous" value={formatMetric(item.previous, item.unit)} />
        <MiniStat
          label="Change"
          value={
            item.delta === null
              ? "Unavailable"
              : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)}%`
          }
        />
      </div>

      {item.detail ? (
        <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-600">
          {item.detail}
        </p>
      ) : null}

      {item.source ? (
        <span className="mt-3 inline-flex rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
          {item.source}
        </span>
      ) : null}
    </article>
  );
}

function InsightCard({ item }) {
  return (
    <article className="rounded-xl border-2 border-orange-300 bg-white p-4">
      <div className="flex items-start gap-3">
        <Sparkles size={17} className="mt-0.5 shrink-0 text-orange-700" />
        <div>
          <p className="font-black text-[#10233F]">{item.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
            {hasValue(item.confidence) ? (
              <MetaChip label={`Confidence: ${item.confidence}%`} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function AutomationCard({ item, canSend, onSend }) {
  return (
    <article className="rounded-[1.25rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">{item.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail || "No candidate detail supplied."}
          </p>
        </div>

        <Bot size={17} className="shrink-0 text-[#123865]" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.impact ? <MetaChip label={`Impact: ${item.impact}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>

      <button
        type="button"
        disabled={!canSend}
        onClick={onSend}
        className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-lg border-2 border-orange-500 bg-orange-50 px-3 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {canSend ? "Send to Automation OS" : "Automation Bridge Not Connected"}
        <ArrowRight size={12} />
      </button>
    </article>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {Number(value || 0).toLocaleString("en-GB")}
          </p>
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

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
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

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
          {count}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
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
      <p className="mt-1 text-xl font-black text-white">
        {Number(value || 0).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function CompactMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {typeof value === "number" ? value.toLocaleString("en-GB") : value}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function MetaChip({ label }) {
  return (
    <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black text-slate-600">
      {label}
    </span>
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
          className="mt-3 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
        >
          Clear search
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}
