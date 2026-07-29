// CommunicationOSDashboard V3 EXTREME — Zaifan Communication OS
// Full replacement for:
// src/components/admin/communication/CommunicationOSDashboard.jsx
//
// Production principles:
// - no fake channel volumes, health scores, response times or campaign impact
// - parent acts as the real Communication OS data/wiring anchor
// - child modules receive CRM records instead of static template queues
// - communication telemetry remains unavailable until explicitly supplied
// - campaign creation only appears when a real handler exists
// - unified Zaifan navy/orange/cream Admin OS visual language
//
// Supported props:
// compact?: boolean
// adminProfile?: object
// inquiries?: []
// appointments?: []
// followUpReminders?: []
// communicationData?: {
//   email?: object,
//   whatsapp?: object,
//   calls?: object,
//   meetings?: object,
//   analytics?: object,
//   campaigns?: [],
//   recentUpdates?: [],
//   channelMetrics?: [],
//   updatedAt?: string
// }
// onCreateCampaign?: () => void
// onOpenRecord?: (record) => void
// onOpenWhatsApp?: (record) => void
// onOpenEmail?: (record) => void
// onOpenCall?: (record) => void
// onOpenMeeting?: (record) => void

import React, { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Info,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";

import EmailCenter from "./EmailCenter";
import WhatsAppCenter from "./WhatsAppCenter";
import CallCenter from "./CallCenter";
import MeetingCenter from "./MeetingCenter";
import CommunicationAnalytics from "./CommunicationAnalytics";

const TABS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "meetings", label: "Meetings", icon: Video },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCount(value) {
  if (!hasValue(value)) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-GB") : String(value);
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

function getRecordName(record = {}) {
  return (
    record.full_name ||
    record.fullName ||
    record.name ||
    record.student_name ||
    record.studentName ||
    record.email ||
    record.phone ||
    "Unnamed record"
  );
}

function getRecordEmail(record = {}) {
  return String(record.email || record.student_email || "").trim();
}

function getRecordPhone(record = {}) {
  return String(
    record.phone ||
      record.phone_number ||
      record.mobile ||
      record.whatsapp ||
      record.whatsapp_number ||
      ""
  ).trim();
}

function getRecordStatus(record = {}) {
  return normalize(
    record.status ||
      record.stage ||
      record.application_status ||
      record.appointment_stage ||
      ""
  );
}

function getRecordPriority(record = {}) {
  return normalize(record.priority || record.lead_priority || "");
}

function getRecordDate(record = {}) {
  return (
    record.created_at ||
    record.updated_at ||
    record.appointment_date ||
    record.follow_up_date ||
    record.due_date ||
    null
  );
}

function isOpenLike(record = {}) {
  const status = getRecordStatus(record);
  if (!status) return true;

  return ![
    "closed",
    "completed",
    "resolved",
    "cancelled",
    "canceled",
    "rejected",
    "archived",
    "done",
  ].includes(status);
}

function isPriority(record = {}) {
  return ["vip", "high", "urgent", "critical"].includes(getRecordPriority(record));
}

function isDueReminder(reminder = {}) {
  const status = normalize(reminder.status);
  if (["done", "completed", "cancelled", "canceled"].includes(status)) {
    return false;
  }

  return true;
}

function deriveChannelRows({
  inquiries,
  appointments,
  reminders,
  communicationData,
}) {
  const supplied = safeArray(communicationData?.channelMetrics);

  if (supplied.length) {
    return supplied.map((row, index) => ({
      id: row.id || row.channel || `channel-${index}`,
      channel: row.channel || row.name || `Channel ${index + 1}`,
      volume: row.volume,
      open: row.open,
      health: row.health,
      response: row.response || row.avgResponse,
      owner: row.owner || row.team,
      risk: row.risk || row.issue,
      source: row.source,
    }));
  }

  const emailReady = inquiries.filter((record) => getRecordEmail(record)).length;
  const whatsappReady = inquiries.filter((record) => getRecordPhone(record)).length;
  const callbackReady = inquiries.filter((record) => getRecordPhone(record) && isOpenLike(record)).length;
  const meetings = appointments.length;

  return [
    {
      id: "email",
      channel: "Email",
      volume: emailReady,
      open: null,
      health: null,
      response: null,
      owner: null,
      risk: null,
      source: "CRM contact availability",
    },
    {
      id: "whatsapp",
      channel: "WhatsApp",
      volume: whatsappReady,
      open: null,
      health: null,
      response: null,
      owner: null,
      risk: null,
      source: "CRM phone availability",
    },
    {
      id: "calls",
      channel: "Calls",
      volume: callbackReady,
      open: null,
      health: null,
      response: null,
      owner: null,
      risk: null,
      source: "Open CRM records with phone",
    },
    {
      id: "meetings",
      channel: "Meetings",
      volume: meetings,
      open: appointments.filter(isOpenLike).length,
      health: null,
      response: null,
      owner: null,
      risk: null,
      source: "Appointments table",
    },
  ];
}

export default function CommunicationOSDashboard({
  compact = false,
  adminProfile = null,

  inquiries = [],
  appointments = [],
  followUpReminders = [],
  communicationData = {},

  onCreateCampaign,
  onOpenRecord,
  onOpenWhatsApp,
  onOpenEmail,
  onOpenCall,
  onOpenMeeting,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");

  const safeInquiries = useMemo(() => safeArray(inquiries), [inquiries]);
  const safeAppointments = useMemo(() => safeArray(appointments), [appointments]);
  const safeReminders = useMemo(
    () => safeArray(followUpReminders),
    [followUpReminders]
  );

  const channelRows = useMemo(
    () =>
      deriveChannelRows({
        inquiries: safeInquiries,
        appointments: safeAppointments,
        reminders: safeReminders,
        communicationData,
      }),
    [safeInquiries, safeAppointments, safeReminders, communicationData]
  );

  const recentUpdates = useMemo(
    () => safeArray(communicationData?.recentUpdates),
    [communicationData?.recentUpdates]
  );

  const campaigns = useMemo(
    () => safeArray(communicationData?.campaigns),
    [communicationData?.campaigns]
  );

  const totals = useMemo(() => {
    const totalCrmRecords = safeInquiries.length + safeAppointments.length;
    const openCrmRecords = [...safeInquiries, ...safeAppointments].filter(
      isOpenLike
    ).length;

    const urgentRecords = [...safeInquiries, ...safeAppointments].filter(
      isPriority
    ).length;

    const dueFollowUps = safeReminders.filter(isDueReminder).length;

    const emailReady = safeInquiries.filter((record) =>
      getRecordEmail(record)
    ).length;

    const phoneReady = safeInquiries.filter((record) =>
      getRecordPhone(record)
    ).length;

    return {
      totalCrmRecords,
      openCrmRecords,
      urgentRecords,
      dueFollowUps,
      emailReady,
      phoneReady,
    };
  }, [safeInquiries, safeAppointments, safeReminders]);

  const queryText = normalize(query);

  const filteredChannelRows = useMemo(
    () =>
      channelRows.filter((row) =>
        normalize(
          [
            row.channel,
            row.owner,
            row.risk,
            row.source,
            row.volume,
            row.open,
          ]
            .filter((value) => hasValue(value))
            .join(" ")
        ).includes(queryText)
      ),
    [channelRows, queryText]
  );

  const filteredUpdates = useMemo(
    () =>
      recentUpdates.filter((item) =>
        normalize(
          [
            item.title,
            item.channel,
            item.status,
            item.impact,
            item.detail,
            item.source,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(queryText)
      ),
    [recentUpdates, queryText]
  );

  const updatedAt =
    communicationData?.updatedAt ||
    communicationData?.generatedAt ||
    communicationData?.lastUpdated ||
    null;

  const hasCreateCampaign = typeof onCreateCampaign === "function";

  const childProps = {
    compact,
    inquiries: safeInquiries,
    appointments: safeAppointments,
    followUpReminders: safeReminders,
    communicationData,
    adminProfile,
    onOpenRecord,
    onOpenWhatsApp,
    onOpenEmail,
    onOpenCall,
    onOpenMeeting,
  };

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Zaifan Enterprise OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Communication OS
            </h2>
          </div>

          <MessageCircle size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <CompactMetric
            label="CRM Records"
            value={totals.totalCrmRecords}
          />
          <CompactMetric
            label="Follow-Ups"
            value={totals.dueFollowUps}
          />
          <CompactMetric
            label="Email Ready"
            value={totals.emailReady}
          />
          <CompactMetric
            label="Phone Ready"
            value={totals.phoneReady}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_18px_48px_rgba(23,36,61,0.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={MessageCircle} label="Communication OS" />
              <HeaderChip icon={ShieldCheck} label="Real CRM Context" />
              <HeaderChip
                icon={Database}
                label={`${totals.totalCrmRecords} CRM records`}
              />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  Communication Command Center
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Coordinate email, WhatsApp, callbacks, appointments and
                  follow-up actions from real Zaifan CRM records. Channel
                  telemetry remains unavailable until an actual communication
                  integration supplies it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
                <DarkMetric label="CRM Records" value={totals.totalCrmRecords} />
                <DarkMetric label="Open" value={totals.openCrmRecords} />
                <DarkMetric label="Urgent" value={totals.urgentRecords} />
                <DarkMetric label="Follow-Ups" value={totals.dueFollowUps} />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Communication readiness
                </p>

                <p className="mt-3 text-4xl font-black leading-none text-white">
                  {totals.emailReady + totals.phoneReady}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  contact-ready records
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Activity size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.09em] text-white">
                  Data freshness
                </span>
                <Clock3 size={13} />
              </div>

              <p className="mt-2 text-xs font-black text-white">
                {formatTimestamp(updatedAt)}
              </p>

              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                CRM availability can be derived locally. Response times,
                delivery rates and channel health require real telemetry.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)_auto]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                    active
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search channels, updates, sources or owners..."
              aria-label="Search Communication OS"
              className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear Communication OS search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onCreateCampaign}
            disabled={!hasCreateCampaign}
            title={
              hasCreateCampaign
                ? "Create communication campaign"
                : "Campaign creation is not connected"
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Plus size={15} />
            {hasCreateCampaign ? "Create Campaign" : "Campaigns Not Connected"}
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <OverviewWorkspace
          totals={totals}
          channelRows={filteredChannelRows}
          updates={filteredUpdates}
          allUpdates={recentUpdates}
          campaigns={campaigns}
          query={queryText}
          onClear={() => setQuery("")}
          communicationData={communicationData}
        />
      ) : null}

      {activeTab === "email" ? <EmailCenter {...childProps} /> : null}
      {activeTab === "whatsapp" ? <WhatsAppCenter {...childProps} /> : null}
      {activeTab === "calls" ? <CallCenter {...childProps} /> : null}
      {activeTab === "meetings" ? <MeetingCenter {...childProps} /> : null}
      {activeTab === "analytics" ? (
        <CommunicationAnalytics {...childProps} />
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
                Communication integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This anchor no longer invents conversation volumes, response
                times, channel health, campaign impact or automation coverage.
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
                Real-data anchor
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Child modules now receive CRM records, appointments and
                follow-ups through one shared Communication OS contract.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function OverviewWorkspace({
  totals,
  channelRows,
  updates,
  allUpdates,
  campaigns,
  query,
  onClear,
  communicationData,
}) {
  const telemetryConnected =
    safeArray(communicationData?.channelMetrics).length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="CRM Records"
          value={formatCount(totals.totalCrmRecords)}
          detail="Current inquiry + appointment records available to Communication OS."
          tone="navy"
        />
        <MetricCard
          icon={Clock3}
          label="Open Follow-Ups"
          value={formatCount(totals.dueFollowUps)}
          detail="Follow-up reminders not marked completed or cancelled."
          tone="orange"
        />
        <MetricCard
          icon={Mail}
          label="Email Ready"
          value={formatCount(totals.emailReady)}
          detail="Inquiry records with an email address available."
          tone="blue"
        />
        <MetricCard
          icon={Phone}
          label="Phone Ready"
          value={formatCount(totals.phoneReady)}
          detail="Inquiry records with a phone/WhatsApp-capable contact value."
          tone="green"
        />
      </div>

      {!telemetryConnected ? (
        <InlineNotice
          icon={Info}
          title="Channel telemetry is not connected yet"
          detail="Communication OS can use real CRM contact availability today, but response time, delivery rate, health score and conversation volume remain unavailable until a channel integration supplies them."
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Channel Command"
            title="Communication Readiness"
            description="Real CRM availability plus supplied telemetry where it exists."
            icon={Activity}
            count={channelRows.length}
          />

          <div className="p-4 sm:p-5">
            {channelRows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr>
                      {[
                        "Channel",
                        "Available / Volume",
                        "Open",
                        "Response",
                        "Owner",
                        "Risk",
                        "Health",
                        "Source",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border-b-2 border-slate-300 bg-[#F7F1E8] px-3 py-3 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {channelRows.map((row) => (
                      <tr key={row.id}>
                        <td className="border-b border-slate-200 px-3 py-3 font-black text-[#10233F]">
                          {row.channel}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
                          {formatCount(row.volume)}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
                          {formatCount(row.open)}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
                          {hasValue(row.response) ? row.response : "—"}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
                          {row.owner || "—"}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
                          {row.risk || "—"}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
                          {hasValue(row.health) ? `${safeNumber(row.health)}%` : "—"}
                        </td>
                        <td className="border-b border-slate-200 px-3 py-3 text-[10px] font-semibold text-slate-500">
                          {row.source || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No communication channels match this search"
                text="Try another search term."
                onClear={onClear}
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
          <SectionHeader
            eyebrow="System Activity"
            title="Recent Communication Updates"
            description="Only supplied communication events are displayed."
            icon={Send}
            count={updates.length}
          />

          <div className="p-4">
            {!allUpdates.length ? (
              <EmptyState
                title="No communication event feed connected"
                text="The old fake campaign updates have been removed. Supply communicationData.recentUpdates when real communication events are logged."
              />
            ) : updates.length ? (
              <div className="space-y-3">
                {updates.map((item, index) => (
                  <UpdateCard
                    key={item.id || item.title || index}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No updates match this search"
                text="Try another search term."
                onClear={query ? onClear : undefined}
              />
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Campaign Layer"
          title="Connected Campaigns"
          description="Campaigns appear only when a real campaign source supplies them."
          icon={FileText}
          count={campaigns.length}
        />

        <div className="p-4">
          {campaigns.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((item, index) => (
                <CampaignCard
                  key={item.id || item.title || index}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No communication campaigns connected"
              text="This workspace does not create placeholder campaigns or fake campaign impact."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {formatCount(value)}
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
        {formatCount(value)}
      </p>
    </div>
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

function SectionHeader({ eyebrow, title, description, icon: Icon, count }) {
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

function InlineNotice({ icon: Icon, title, detail }) {
  return (
    <div className="rounded-[1.25rem] border-[3px] border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-blue-700" />
        <div>
          <p className="font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function UpdateCard({ item }) {
  return (
    <article className="rounded-xl border-2 border-orange-300 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">
            {item.title || "Communication update"}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail || item.description || item.impact || "No detail supplied."}
          </p>
        </div>

        {item.status ? (
          <span className="shrink-0 rounded-lg border-2 border-slate-300 bg-slate-50 px-2.5 py-1 text-[8px] font-black uppercase text-slate-600">
            {item.status}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.channel ? <MetaChip label={`Channel: ${item.channel}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>
    </article>
  );
}

function CampaignCard({ item }) {
  return (
    <article className="rounded-xl border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">
            {item.title || item.name || "Campaign"}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.description || item.detail || "No campaign description supplied."}
          </p>
        </div>

        <Send size={17} className="shrink-0 text-[#123865]" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.status ? <MetaChip label={`Status: ${item.status}`} /> : null}
        {item.channel ? <MetaChip label={`Channel: ${item.channel}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>
    </article>
  );
}

function MetaChip({ label }) {
  return (
    <span className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[8px] font-black text-slate-600">
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
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}
