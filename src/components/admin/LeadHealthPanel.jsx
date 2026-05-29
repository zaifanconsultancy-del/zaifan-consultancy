import { motion } from "framer-motion";
import {
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
  Activity,
  Clock,
  Users,
} from "lucide-react";

function LeadHealthPanel({
  inquiries = [],
  appointments = [],
  reminders = [],
}) {
  const now = new Date();

  const normalizeStatus = (lead) =>
    String(lead.status || lead.pipeline_stage || "").toLowerCase();

  const getLeadName = (lead) =>
    lead.full_name ||
    lead.name ||
    lead.student_name ||
    lead.client_name ||
    "Unnamed Lead";

  const getLeadType = (lead) => {
    if (lead.appointment_date || lead.appointment_time) return "Appointment";
    return "Inquiry";
  };

  const getCreatedDate = (lead) => {
    const rawDate =
      lead.created_at ||
      lead.submitted_at ||
      lead.appointment_date ||
      lead.date;

    const parsedDate = rawDate ? new Date(rawDate) : now;
    return Number.isNaN(parsedDate.getTime()) ? now : parsedDate;
  };

  const getAgeDays = (lead) => {
    const createdAt = getCreatedDate(lead);
    return Math.max(
      0,
      Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  };

  const isReminderForLead = (reminder, lead) => {
    const reminderStudentId = String(reminder.student_id || "");
    const reminderLeadId = String(reminder.lead_id || "");
    const leadId = String(lead.id || "");

    if (!leadId) return false;

    return reminderStudentId === leadId || reminderLeadId === leadId;
  };

  const hasOverdueReminder = (lead) =>
    reminders.some((reminder) => {
      if (!isReminderForLead(reminder, lead)) return false;

      const reminderStatus = String(reminder.status || "").toLowerCase();
      const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;

      if (!dueDate || Number.isNaN(dueDate.getTime())) return false;

      return reminderStatus !== "completed" && dueDate < now;
    });

  const hasUpcomingReminder = (lead) =>
    reminders.some((reminder) => {
      if (!isReminderForLead(reminder, lead)) return false;

      const reminderStatus = String(reminder.status || "").toLowerCase();
      const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;

      if (!dueDate || Number.isNaN(dueDate.getTime())) return false;

      return reminderStatus !== "completed" && dueDate >= now;
    });

  const isPositiveStatus = (status) =>
    status.includes("confirmed") ||
    status.includes("contacted") ||
    status.includes("completed") ||
    status.includes("approved") ||
    status.includes("converted") ||
    status.includes("enrolled");

  const isRiskStatus = (status) =>
    status.includes("lost") ||
    status.includes("rejected") ||
    status.includes("cancelled") ||
    status.includes("canceled") ||
    status.includes("inactive");

  const isPendingStatus = (status) =>
    status.includes("pending") ||
    status.includes("new") ||
    status.includes("open") ||
    status.includes("follow");

  const allLeads = [...inquiries, ...appointments];

  const enrichedLeads = allLeads.map((lead) => {
    const status = normalizeStatus(lead);
    const ageDays = getAgeDays(lead);
    const overdueReminder = hasOverdueReminder(lead);
    const upcomingReminder = hasUpcomingReminder(lead);

    let health = "attention";
    let reason = "Needs counselor review or next action.";

    if (isRiskStatus(status)) {
      health = "risk";
      reason = "Lead status indicates lost, inactive, cancelled, or rejected.";
    } else if (overdueReminder) {
      health = "risk";
      reason = "Has an overdue follow-up reminder.";
    } else if (ageDays > 7 && isPendingStatus(status)) {
      health = "risk";
      reason = "Pending for more than 7 days.";
    } else if (ageDays > 3 && !isPositiveStatus(status)) {
      health = "attention";
      reason = "No strong progress signal after 3 days.";
    } else if (upcomingReminder && !isPositiveStatus(status)) {
      health = "attention";
      reason = "Follow-up is scheduled but lead still needs monitoring.";
    } else if (isPositiveStatus(status)) {
      health = "healthy";
      reason = "Lead is progressing through the pipeline.";
    }

    return {
      ...lead,
      health,
      reason,
      ageDays,
      displayName: getLeadName(lead),
      displayType: getLeadType(lead),
      displayStatus: lead.status || lead.pipeline_stage || "No status",
    };
  });

  const healthy = enrichedLeads.filter((lead) => lead.health === "healthy");
  const attention = enrichedLeads.filter((lead) => lead.health === "attention");
  const risk = enrichedLeads.filter((lead) => lead.health === "risk");

  const healthScore =
    allLeads.length === 0
      ? 0
      : Math.round(
          ((healthy.length * 100 + attention.length * 55 + risk.length * 15) /
            allLeads.length)
        );

  const cards = [
    {
      label: "Healthy Leads",
      value: healthy.length,
      icon: ShieldCheck,
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
      description: "Actively progressing through the CRM.",
    },
    {
      label: "Attention Needed",
      value: attention.length,
      icon: HeartPulse,
      color: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
      description: "Needs follow-up or counselor monitoring.",
    },
    {
      label: "At Risk",
      value: risk.length,
      icon: AlertTriangle,
      color: "border-red-400/20 bg-red-500/10 text-red-300",
      description: "Overdue, inactive, or potentially lost leads.",
    },
  ];

  const watchlist = [...risk, ...attention].slice(0, 6);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Lead Health Engine
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              CRM Health Monitor
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Detect lead decay, overdue follow-ups, and CRM bottlenecks before
              conversions are lost.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              Health Score
            </p>
            <h3 className="mt-2 text-4xl font-black text-white">
              {healthScore}%
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Based on lead activity and follow-up risk.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`rounded-[1.75rem] border p-5 ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{card.label}</p>
                  <h3 className="mt-3 text-4xl font-black">{card.value}</h3>
                </div>

                <Icon size={28} />
              </div>

              <p className="mt-4 text-xs opacity-70">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Users className="text-[#D4AF37]" size={20} />
            <h3 className="text-lg font-bold text-white">Lead Coverage</h3>
          </div>

          <div className="mt-4 space-y-3 text-sm text-white/60">
            <p>Total leads tracked: {allLeads.length}</p>
            <p>Inquiries: {inquiries.length}</p>
            <p>Appointments: {appointments.length}</p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Clock className="text-[#D4AF37]" size={20} />
            <h3 className="text-lg font-bold text-white">Reminder Risk</h3>
          </div>

          <div className="mt-4 space-y-3 text-sm text-white/60">
            <p>
              Overdue reminders:{" "}
              {
                reminders.filter((reminder) => {
                  const dueDate = reminder.due_date
                    ? new Date(reminder.due_date)
                    : null;

                  return (
                    reminder.status !== "completed" &&
                    dueDate &&
                    !Number.isNaN(dueDate.getTime()) &&
                    dueDate < now
                  );
                }).length
              }
            </p>
            <p>Active reminders: {reminders.length}</p>
            <p>Risk leads detected: {risk.length}</p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <Activity className="text-[#D4AF37]" size={20} />
            <h3 className="text-lg font-bold text-white">System Reading</h3>
          </div>

          <p className="mt-4 text-sm text-white/60">
            {risk.length > 0
              ? "CRM needs immediate follow-up attention."
              : attention.length > healthy.length
              ? "CRM is stable, but many leads still need monitoring."
              : "CRM pipeline health is currently strong."}
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-lg font-bold text-white">Priority Watchlist</h3>

        {watchlist.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">
            No risky or attention-needed leads detected right now.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {watchlist.map((lead) => (
              <div
                key={`${lead.displayType}-${lead.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{lead.displayName}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {lead.displayType} • {lead.displayStatus} • {lead.ageDays}{" "}
                    days old
                  </p>
                  <p className="mt-2 text-xs text-white/55">{lead.reason}</p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                    lead.health === "risk"
                      ? "border-red-400/20 bg-red-500/10 text-red-300"
                      : "border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  {lead.health === "risk" ? "At Risk" : "Attention"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default LeadHealthPanel;