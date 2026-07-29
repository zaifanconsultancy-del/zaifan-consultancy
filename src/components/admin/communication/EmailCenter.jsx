// EmailCenter V3 EXTREME — Zaifan Communication OS
// Full replacement for:
// src/components/admin/communication/EmailCenter.jsx
//
// Production principles:
// - no fake inbox, fake students, fake workflow owners, SLA values or success percentages
// - real CRM records with email addresses form the actionable email queue
// - no fake sent/open/reply/delivery analytics without real email telemetry
// - outbound email actions only activate when a real handler is supplied
// - optional communicationData.email can enrich workflows/templates/activity/metrics
// - unified Zaifan navy/orange/cream Communication OS visual language
//
// Supported props:
// compact?: boolean
// inquiries?: []
// appointments?: []
// followUpReminders?: []
// communicationData?: {
//   email?: {
//     metrics?: object,
//     workflows?: [],
//     recentActivity?: [],
//     templates?: [],
//     updatedAt?: string
//   }
// }
// onOpenRecord?: (record) => void
// onOpenEmail?: (record) => void

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getName(record = {}) {
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

function getEmail(record = {}) {
  return String(record.email || record.student_email || "").trim();
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

function isClosed(record = {}) {
  return [
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

function hasEmail(record = {}) {
  return Boolean(getEmail(record));
}

function isDueReminder(reminder = {}) {
  const status = normalize(reminder.status);
  return !["done", "completed", "cancelled", "canceled"].includes(status);
}

export default function EmailCenter({
  compact = false,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  communicationData = {},
  onOpenRecord,
  onOpenEmail,
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const safeInquiries = useMemo(() => safeArray(inquiries), [inquiries]);
  const safeReminders = useMemo(
    () => safeArray(followUpReminders),
    [followUpReminders]
  );

  const emailData = communicationData?.email || {};

  const contactable = useMemo(
    () => safeInquiries.filter(hasEmail),
    [safeInquiries]
  );

  const stats = useMemo(() => {
    const open = contactable.filter((record) => !isClosed(record)).length;
    const priority = contactable.filter(isPriority).length;
    const followUps = safeReminders.filter(isDueReminder).length;

    return {
      total: contactable.length,
      open,
      priority,
      followUps,
    };
  }, [contactable, safeReminders]);

  const filters = ["All", "Open", "Priority", "Closed"];

  const visibleQueue = useMemo(() => {
    const query = normalize(search);

    return contactable.filter((record) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Open" && !isClosed(record)) ||
        (filter === "Priority" && isPriority(record)) ||
        (filter === "Closed" && isClosed(record));

      if (!matchesFilter) return false;

      const haystack = normalize(
        [
          getName(record),
          getEmail(record),
          record.phone,
          record.country_interest,
          record.status,
          record.stage,
          record.application_status,
          record.priority,
          record.assigned_to_name,
          record.counselor_name,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return !query || haystack.includes(query);
    });
  }, [contactable, filter, search]);

  const workflows = useMemo(
    () => safeArray(emailData.workflows),
    [emailData.workflows]
  );

  const recentActivity = useMemo(
    () => safeArray(emailData.recentActivity),
    [emailData.recentActivity]
  );

  const templates = useMemo(
    () => safeArray(emailData.templates),
    [emailData.templates]
  );

  const telemetry = emailData.metrics || {};
  const canOpenEmail = typeof onOpenEmail === "function";
  const canOpenRecord = typeof onOpenRecord === "function";

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Communication OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Email Center
            </h2>
          </div>

          <Mail size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <CompactMetric label="Email Ready" value={stats.total} />
          <CompactMetric label="Open" value={stats.open} />
          <CompactMetric label="Priority" value={stats.priority} />
          <CompactMetric label="Follow-Ups" value={stats.followUps} />
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
              <HeaderChip icon={Mail} label="Email Center" />
              <HeaderChip icon={ShieldCheck} label="CRM Contact Queue" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Email Communication Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Work from real CRM records that contain email addresses. Outbound
              email actions activate only through a connected handler, and
              delivery/open/reply analytics stay unavailable until a real email
              event source supplies them.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Email Ready" value={stats.total} />
              <DarkMetric label="Open" value={stats.open} />
              <DarkMetric label="Priority" value={stats.priority} />
              <DarkMetric label="Follow-Ups" value={stats.followUps} />
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Email telemetry
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {Object.keys(telemetry).length ? "LIVE" : "OFF"}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  {Object.keys(telemetry).length
                    ? "event metrics supplied"
                    : "no inbox/event telemetry"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Send size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                Production-safe distinction
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                A working outbound email function does not automatically mean
                Zaifan has inbox, open-rate, reply-rate or delivery analytics.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                  filter === item
                    ? "border-[#123865] bg-[#123865] text-white"
                    : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                {item}
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
              placeholder="Search student, email, country, status or counselor..."
              aria-label="Search Email Center"
              className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear email search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!Object.keys(telemetry).length ? (
        <InlineNotice
          icon={Info}
          title="Email event telemetry is not connected"
          detail="Sent, delivered, opened, bounced, replied and response-time metrics remain unavailable. CRM email actions can still be connected safely."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Email Ready"
          value={stats.total}
          detail="Inquiry records with a usable email address."
          tone="blue"
        />
        <MetricCard
          icon={UserCheck}
          label="Open Records"
          value={stats.open}
          detail="Email-ready CRM records not in a terminal/closed state."
          tone="navy"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Priority"
          value={stats.priority}
          detail="Email-ready records marked VIP, high, urgent or critical."
          tone="orange"
        />
        <MetricCard
          icon={Clock3}
          label="Follow-Ups"
          value={stats.followUps}
          detail="Current follow-up reminders not completed or cancelled."
          tone="green"
        />
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Action Queue"
          title="Email-Ready CRM Records"
          description="Real CRM records with usable email addresses."
          icon={Mail}
          count={visibleQueue.length}
        />

        <div className="p-4 sm:p-5">
          {!contactable.length ? (
            <EmptyState
              title="No email-ready CRM records"
              text="This queue populates automatically when inquiries contain email addresses."
            />
          ) : visibleQueue.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Student",
                      "Email",
                      "Country",
                      "Status",
                      "Priority",
                      "Counselor",
                      "Email Action",
                      "Record",
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
                  {visibleQueue.map((record, index) => (
                    <EmailRow
                      key={record.id || `${getName(record)}-${index}`}
                      record={record}
                      canOpenEmail={canOpenEmail}
                      onOpenEmail={() => onOpenEmail?.(record)}
                      canOpenRecord={canOpenRecord}
                      onOpenRecord={() => onOpenRecord?.(record)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No email records match these filters"
              text="Clear the search or choose another queue filter."
              onClear={() => {
                setSearch("");
                setFilter("All");
              }}
            />
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
          <SectionHeader
            eyebrow="Workflow Layer"
            title="Connected Email Workflows"
            description="Reusable workflows only appear when a real source supplies them."
            icon={FileText}
            count={workflows.length}
          />

          <div className="p-4">
            {workflows.length ? (
              <div className="space-y-3">
                {workflows.map((item, index) => (
                  <WorkflowCard
                    key={item.id || item.name || index}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No email workflows connected"
                text="The old fake nurture, offer, CAS and payment workflow cards are removed."
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Template Layer"
            title="Connected Email Templates"
            description="Templates appear only when supplied by a real communication source."
            icon={Send}
            count={templates.length}
          />

          <div className="p-4">
            {templates.length ? (
              <div className="space-y-3">
                {templates.map((item, index) => (
                  <TemplateCard
                    key={item.id || item.title || index}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No email templates connected"
                text="Communication OS does not invent email templates or campaign copy."
              />
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Telemetry"
          title="Email Activity"
          description="Real email activity appears only when an email event source supplies it."
          icon={Sparkles}
          count={recentActivity.length}
        />

        <div className="p-4">
          {recentActivity.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {recentActivity.map((item, index) => (
                <ActivityCard
                  key={item.id || item.title || index}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No email activity feed connected"
              text="No fake sent/opened/replied/delivered events are generated locally."
            />
          )}
        </div>
      </section>
    </section>
  );
}

function EmailRow({
  record,
  canOpenEmail,
  onOpenEmail,
  canOpenRecord,
  onOpenRecord,
}) {
  return (
    <tr>
      <td className="border-b border-slate-200 px-3 py-3">
        <div>
          <p className="font-black text-[#10233F]">{getName(record)}</p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {record.phone || "No phone shown"}
          </p>
        </div>
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {getEmail(record)}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {record.country_interest || "—"}
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        <StatusBadge
          label={record.status || record.stage || "Status unavailable"}
          tone={isClosed(record) ? "green" : "navy"}
        />
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        {record.priority ? (
          <StatusBadge
            label={record.priority}
            tone={
              ["critical", "urgent"].includes(getPriority(record))
                ? "red"
                : getPriority(record) === "high"
                  ? "orange"
                  : "navy"
            }
          />
        ) : (
          <span className="text-xs font-semibold text-slate-400">—</span>
        )}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {record.counselor_name ||
          record.assigned_to_name ||
          record.assigned_to ||
          "—"}
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        {canOpenEmail ? (
          <button
            type="button"
            onClick={onOpenEmail}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-orange-500 bg-orange-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-100"
          >
            <Mail size={12} />
            Compose
          </button>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
            Email action not connected
          </span>
        )}
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        {canOpenRecord ? (
          <button
            type="button"
            onClick={onOpenRecord}
            className="rounded-lg border-2 border-[#234E78] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865] transition hover:bg-[#123865] hover:text-white"
          >
            Open
          </button>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
            Read only
          </span>
        )}
      </td>
    </tr>
  );
}

function WorkflowCard({ item }) {
  return (
    <article className="rounded-xl border-2 border-orange-300 bg-white p-4">
      <p className="font-black text-[#10233F]">
        {item.name || item.title || "Email workflow"}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {item.description || item.detail || "No workflow detail supplied."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.owner ? <MetaChip label={`Owner: ${item.owner}`} /> : null}
        {item.status ? <MetaChip label={`Status: ${item.status}`} /> : null}
        {item.sla ? <MetaChip label={`SLA: ${item.sla}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>
    </article>
  );
}

function TemplateCard({ item }) {
  return (
    <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
      <p className="font-black text-[#10233F]">
        {item.title || item.name || "Email template"}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {item.description || item.subject || item.body || "No template content supplied."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.category ? <MetaChip label={`Category: ${item.category}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>
    </article>
  );
}

function ActivityCard({ item }) {
  return (
    <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">
            {item.title || item.event || "Email activity"}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail || item.description || item.message || "No activity detail supplied."}
          </p>
        </div>

        <Mail size={17} className="shrink-0 text-orange-700" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.status ? <MetaChip label={`Status: ${item.status}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>
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
        {Number(value || 0).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function StatusBadge({ label, tone }) {
  const classes =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "orange"
        ? "border-orange-300 bg-orange-50 text-orange-800"
        : tone === "green"
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${classes}`}>
      {label}
    </span>
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
          Clear filters
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
