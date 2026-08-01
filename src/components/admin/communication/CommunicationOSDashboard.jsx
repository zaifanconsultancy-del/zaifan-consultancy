// CommunicationOSDashboard V5 PARTNER OS NO-OVERFLOW — Zaifan Communication OS
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
// - responsive communication portfolio rows with fully contained metadata boxes
// - Owner, Date, Priority, Channel and Type never extend beyond the record card
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
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
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

function statusTone(status = "") {
  const value = normalize(status);

  if (
    ["sent", "delivered", "completed", "resolved", "active", "confirmed"].some(
      (token) => value.includes(token)
    )
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    ["failed", "rejected", "cancelled", "canceled", "blocked", "overdue"].some(
      (token) => value.includes(token)
    )
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    ["pending", "open", "scheduled", "queued", "review"].some((token) =>
      value.includes(token)
    )
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    orange: "border-[#F97316] bg-[#FFF4EA]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}

function buildCommunicationPortfolio({
  inquiries,
  appointments,
  reminders,
  updates,
  campaigns,
}) {
  const inquiryRows = inquiries.map((record, index) => ({
    id: record.id || `inquiry-${index}`,
    type: "Lead",
    title: getRecordName(record),
    channel:
      getRecordEmail(record) && getRecordPhone(record)
        ? "Email + Phone"
        : getRecordEmail(record)
          ? "Email"
          : getRecordPhone(record)
            ? "Phone"
            : "Not contact-ready",
    status: record.status || record.stage || "Open",
    priority: record.priority || record.lead_priority || "Normal",
    owner:
      record.owner ||
      record.assigned_to ||
      record.counselor_name ||
      record.assigned_counselor ||
      "Unassigned",
    date: getRecordDate(record),
    detail:
      record.message ||
      record.notes ||
      record.country_interest ||
      record.service_interest ||
      "CRM inquiry record",
    source: "Inquiries",
    record,
  }));

  const appointmentRows = appointments.map((record, index) => ({
    id: record.id || `appointment-${index}`,
    type: "Meeting",
    title: getRecordName(record),
    channel: record.consultation_type || "Appointment",
    status: record.status || record.appointment_stage || "Scheduled",
    priority: record.priority || "Normal",
    owner:
      record.owner ||
      record.assigned_to ||
      record.counselor_name ||
      "Unassigned",
    date: getRecordDate(record),
    detail:
      record.notes ||
      record.message ||
      `${record.appointment_date || "Date not recorded"}${
        record.appointment_time ? ` · ${record.appointment_time}` : ""
      }`,
    source: "Appointments",
    record,
  }));

  const reminderRows = reminders.map((record, index) => ({
    id: record.id || `reminder-${index}`,
    type: "Follow-Up",
    title:
      record.title ||
      record.subject ||
      getRecordName(record) ||
      "Follow-up reminder",
    channel: record.channel || record.method || "Follow-up",
    status: record.status || "Open",
    priority: record.priority || "Normal",
    owner:
      record.owner ||
      record.assigned_to ||
      record.counselor_name ||
      "Unassigned",
    date: getRecordDate(record),
    detail: record.notes || record.detail || "Follow-up reminder",
    source: "Follow-up reminders",
    record,
  }));

  const updateRows = updates.map((record, index) => ({
    id: record.id || `update-${index}`,
    type: "Update",
    title: record.title || "Communication update",
    channel: record.channel || "System",
    status: record.status || "Recorded",
    priority: record.priority || "Normal",
    owner: record.owner || record.team || "System",
    date: record.created_at || record.updated_at || record.date || null,
    detail:
      record.detail ||
      record.description ||
      record.impact ||
      "Communication event",
    source: record.source || "Communication events",
    record,
  }));

  const campaignRows = campaigns.map((record, index) => ({
    id: record.id || `campaign-${index}`,
    type: "Campaign",
    title: record.title || record.name || "Campaign",
    channel: record.channel || "Multi-channel",
    status: record.status || "Unknown",
    priority: record.priority || "Normal",
    owner: record.owner || record.team || "Unassigned",
    date:
      record.created_at ||
      record.updated_at ||
      record.scheduled_at ||
      record.date ||
      null,
    detail:
      record.description ||
      record.detail ||
      "Connected communication campaign",
    source: record.source || "Campaigns",
    record,
  }));

  return [
    ...inquiryRows,
    ...appointmentRows,
    ...reminderRows,
    ...updateRows,
    ...campaignRows,
  ].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CommunicationRow({ item }) {
  const Icon =
    item.type === "Lead"
      ? Users
      : item.type === "Meeting"
        ? Video
        : item.type === "Follow-Up"
          ? Clock3
          : item.type === "Campaign"
            ? Send
            : Activity;

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(15rem,1.45fr)_repeat(5,minmax(0,1fr))] xl:items-stretch">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-[#F2F7FF] text-[#123865]">
              <Icon size={17} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
                  {item.title}
                </p>

                <span
                  className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">
                {item.detail}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Type
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]" title={String(item.type || "")}>{item.type}</p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Channel
          </p>
          <p
            className="mt-1 truncate text-xs font-black text-[#10233F]"
            title={String(item.channel || "")}
          >
            {item.channel}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Priority
          </p>
          <p
            className="mt-1 truncate text-xs font-black text-[#10233F]"
            title={String(item.priority || "")}
          >
            {item.priority}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Date
          </p>
          <p
            className="mt-1 truncate text-xs font-black text-[#10233F]"
            title={formatDate(item.date)}
          >
            {formatDate(item.date)}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Owner
          </p>
          <p
            className="mt-1 truncate text-xs font-black text-[#10233F]"
            title={String(item.owner || "")}
          >
            {item.owner}
          </p>
        </div>
      </div>
    </article>
  );
}

function IntegrityCard({ icon: Icon, eyebrow, title, helper, tone = "blue" }) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon
          size={17}
          className={`mt-0.5 shrink-0 ${
            tone === "green"
              ? "text-emerald-700"
              : tone === "amber"
                ? "text-amber-700"
                : "text-blue-700"
          }`}
        />
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
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
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("All");

  const safeInquiries = useMemo(() => safeArray(inquiries), [inquiries]);
  const safeAppointments = useMemo(() => safeArray(appointments), [appointments]);
  const safeReminders = useMemo(
    () => safeArray(followUpReminders),
    [followUpReminders]
  );

  const recentUpdates = useMemo(
    () => safeArray(communicationData?.recentUpdates),
    [communicationData?.recentUpdates]
  );

  const campaigns = useMemo(
    () => safeArray(communicationData?.campaigns),
    [communicationData?.campaigns]
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

  const portfolio = useMemo(
    () =>
      buildCommunicationPortfolio({
        inquiries: safeInquiries,
        appointments: safeAppointments,
        reminders: safeReminders,
        updates: recentUpdates,
        campaigns,
      }),
    [safeInquiries, safeAppointments, safeReminders, recentUpdates, campaigns]
  );

  const filteredPortfolio = useMemo(() => {
    const needle = normalize(search);

    return portfolio.filter((item) => {
      if (recordType !== "All" && item.type !== recordType) return false;
      if (!needle) return true;

      return [
        item.title,
        item.channel,
        item.status,
        item.priority,
        item.owner,
        item.source,
        item.type,
      ]
        .map(normalize)
        .join(" ")
        .includes(needle);
    });
  }, [portfolio, search, recordType]);

  const filtersActive = Boolean(search.trim()) || recordType !== "All";
  const hasCreateCampaign = typeof onCreateCampaign === "function";
  const hasHubActions =
    hasCreateCampaign || typeof communicationData?.onRefresh === "function";


  function clearFilters() {
    setSearch("");
    setRecordType("All");
  }

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-3 text-white">
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
          <MetricCard
            label="CRM Records"
            value={totals.totalCrmRecords}
            helper="Inquiry and appointment records."
            tone="navy"
            icon={Users}
          />
          <MetricCard
            label="Follow-Ups"
            value={totals.dueFollowUps}
            helper="Open communication follow-ups."
            tone="orange"
            icon={Clock3}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <MessageCircle size={12} />
                Communication OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Relationship communication
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Communication Command Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Email, WhatsApp, callbacks, appointments, campaigns and follow-up
              activity from real Zaifan CRM records. Missing channel telemetry
              remains unavailable instead of becoming fabricated health or
              response metrics.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">Communication Overview</p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin communication view for ${adminProfile.email}`
                : "Admin communication operations workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {totals.totalCrmRecords} CRM records
              </span>
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {totals.dueFollowUps} follow-ups
              </span>
            </div>
          </div>
        </div>
      </header>

      {hasHubActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasCreateCampaign ? (
            <button
              type="button"
              onClick={onCreateCampaign}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#F97316] bg-[#FF5A0A] px-4 text-xs font-black text-white transition hover:bg-[#E94F00]"
            >
              <Plus size={13} />
              Create Campaign
            </button>
          ) : null}

          {typeof communicationData?.onRefresh === "function" ? (
            <button
              type="button"
              onClick={communicationData.onRefresh}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          ) : null}
        </div>
      ) : null}

      <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="CRM Records"
              value={totals.totalCrmRecords}
              helper={`${totals.openCrmRecords} currently remain open across inquiries and appointments.`}
              tone="navy"
              icon={Users}
              badge="CRM context"
            />

            <MetricCard
              label="Open Follow-Ups"
              value={totals.dueFollowUps}
              helper="Reminders not marked completed or cancelled."
              tone={totals.dueFollowUps ? "amber" : "green"}
              icon={Clock3}
              badge="Action queue"
            />

            <MetricCard
              label="Email Ready"
              value={totals.emailReady}
              helper="Inquiry records with a usable email address."
              tone="blue"
              icon={Mail}
              badge="Contactability"
            />

            <MetricCard
              label="Phone Ready"
              value={totals.phoneReady}
              helper="Inquiry records with a phone or WhatsApp-capable contact."
              tone="green"
              icon={Phone}
              badge="Contactability"
            />
          </div>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                  Communication Command
                </p>
                <h2 className="mt-1 text-xl font-black text-[#10233F]">
                  Relationship communication portfolio
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Search and review real leads, meetings, follow-ups, updates and
                  campaigns supplied to Communication OS.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_10rem_auto]">
                <label className="relative block">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search communication..."
                    className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
                  />
                </label>

                <select
                  value={recordType}
                  onChange={(event) => setRecordType(event.target.value)}
                  className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
                >
                  <option>All</option>
                  <option>Lead</option>
                  <option>Meeting</option>
                  <option>Follow-Up</option>
                  <option>Update</option>
                  <option>Campaign</option>
                </select>

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!filtersActive}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-40"
                >
                  <X size={13} />
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredPortfolio.length ? (
                filteredPortfolio.map((item) => (
                  <CommunicationRow
                    key={`${item.type}-${item.id}`}
                    item={item}
                  />
                ))
              ) : (
                <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
                  <MessageCircle
                    size={24}
                    className="mx-auto text-orange-700"
                  />
                  <p className="mt-3 font-black text-[#10233F]">
                    {portfolio.length
                      ? "No communication records match these filters."
                      : "No real communication records yet."}
                  </p>
                  <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                    {portfolio.length
                      ? "Clear or change the communication filters."
                      : "Connect genuine CRM, appointment, follow-up, event or campaign records before Communication OS reports operational activity."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            <IntegrityCard
              icon={ShieldCheck}
              eyebrow="Communication Integrity"
              title="No fake channel health"
              helper="Response times, delivery rates and channel-health percentages remain unavailable until real telemetry supplies them."
              tone="green"
            />

            <IntegrityCard
              icon={Database}
              eyebrow="Data Boundary"
              title={`${channelRows.length} channel source${
                channelRows.length === 1 ? "" : "s"
              } visible`}
              helper="CRM contactability is derived from real records; channel telemetry is shown only when explicitly supplied."
              tone="blue"
            />

            <IntegrityCard
              icon={CheckCircle2}
              eyebrow="Action Boundary"
              title={`${totals.urgentRecords} urgent record${
                totals.urgentRecords === 1 ? "" : "s"
              }`}
              helper="Priority pressure comes only from explicit CRM priority values, not invented campaign urgency."
              tone={totals.urgentRecords ? "amber" : "green"}
            />
          </div>
      </>
    </div>
  );
}
