import { motion } from "framer-motion";
import {
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
  Activity,
  Clock,
  Users,
  Crown,
  Flame,
  CalendarX,
  UserX,
  Gauge,
} from "lucide-react";

function LeadHealthPanel({ inquiries = [], appointments = [], reminders = [] }) {
  const now = new Date();
  const allLeads = [...inquiries, ...appointments];

  const enrichedLeads = allLeads.map((lead) => {
    const status = normalizeStatus(lead);
    const ageDays = getAgeDays(lead, now);
    const overdueReminder = hasOverdueReminder(lead, reminders, now);
    const upcomingReminder = hasUpcomingReminder(lead, reminders, now);
    const hasReminder = overdueReminder || upcomingReminder;
    const priority = String(lead.priority || "medium").toLowerCase();
    const isVip = priority === "vip" || priority === "high";
    const isUnassigned = !lead.assigned_admin_id;

    let health = "attention";
    let reason = "Needs counselor review or next action.";

    if (isRiskStatus(status)) {
      health = "risk";
      reason = "Lead status indicates lost, inactive, cancelled, or rejected.";
    } else if (overdueReminder) {
      health = "risk";
      reason = "Has an overdue follow-up reminder.";
    } else if (ageDays >= 7 && isPendingStatus(status)) {
      health = "risk";
      reason = "Pending for more than 7 days.";
    } else if (isVip && !hasReminder) {
      health = "risk";
      reason = "VIP/high-priority lead has no reminder.";
    } else if (isUnassigned) {
      health = "attention";
      reason = "Lead has no assigned counselor.";
    } else if (!hasReminder && !isPositiveStatus(status)) {
      health = "attention";
      reason = "No active reminder is attached.";
    } else if (ageDays > 3 && !isPositiveStatus(status)) {
      health = "attention";
      reason = "No strong progress signal after 3 days.";
    } else if (isPositiveStatus(status)) {
      health = "healthy";
      reason = "Lead is progressing through the pipeline.";
    }

    return {
      ...lead,
      health,
      reason,
      ageDays,
      priority,
      hasReminder,
      overdueReminder,
      upcomingReminder,
      isVip,
      isUnassigned,
      isStale: ageDays >= 7 && isPendingStatus(status),
      displayName: getLeadName(lead),
      displayType: getLeadType(lead),
      displayStatus: lead.status || lead.pipeline_stage || lead.appointment_stage || "No status",
    };
  });

  const healthy = enrichedLeads.filter((lead) => lead.health === "healthy");
  const attention = enrichedLeads.filter((lead) => lead.health === "attention");
  const risk = enrichedLeads.filter((lead) => lead.health === "risk");
  const unassigned = enrichedLeads.filter((lead) => lead.isUnassigned);
  const noReminder = enrichedLeads.filter((lead) => !lead.hasReminder);
  const stale = enrichedLeads.filter((lead) => lead.isStale);
  const vipRisk = enrichedLeads.filter(
    (lead) => lead.isVip && (lead.health === "risk" || lead.isStale || !lead.hasReminder)
  );

  const healthScore =
    allLeads.length === 0
      ? 0
      : Math.round(
          (healthy.length * 100 +
            attention.length * 55 +
            risk.length * 15 -
            unassigned.length * 5 -
            noReminder.length * 3) /
            allLeads.length
        );

  const safeHealthScore = Math.max(0, Math.min(100, healthScore));
  const teamHealth = getTeamHealth(safeHealthScore);

  const cards = [
    {
      label: "Healthy",
      value: healthy.length,
      icon: ShieldCheck,
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
      description: "Actively progressing.",
    },
    {
      label: "Attention",
      value: attention.length,
      icon: HeartPulse,
      color: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
      description: "Needs monitoring.",
    },
    {
      label: "At Risk",
      value: risk.length,
      icon: AlertTriangle,
      color: "border-red-400/20 bg-red-500/10 text-red-300",
      description: "Overdue or inactive.",
    },
    {
      label: "Unassigned",
      value: unassigned.length,
      icon: UserX,
      color: "border-blue-400/20 bg-blue-500/10 text-blue-300",
      description: "Needs ownership.",
    },
    {
      label: "No Reminder",
      value: noReminder.length,
      icon: CalendarX,
      color: "border-purple-400/20 bg-purple-500/10 text-purple-300",
      description: "No follow-up safety net.",
    },
    {
      label: "Stale",
      value: stale.length,
      icon: Flame,
      color: "border-orange-400/20 bg-orange-500/10 text-orange-300",
      description: "Pending 7+ days.",
    },
    {
      label: "VIP Risk",
      value: vipRisk.length,
      icon: Crown,
      color: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
      description: "High-value risk.",
    },
    {
      label: "Team Health",
      value: `${safeHealthScore}%`,
      icon: Gauge,
      color: teamHealth.color,
      description: teamHealth.text,
    },
  ];

  const watchlist = [...vipRisk, ...risk, ...stale, ...attention].slice(0, 8);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/12 via-white/[0.035] to-black/40 p-6 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Lead Health Engine V2
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              CRM Health Monitor
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Detect decay, overdue work, missing reminders, unassigned leads,
              and VIP risks before conversions are lost.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              Team Health
            </p>
            <h3 className="mt-2 text-4xl font-black text-white">
              {safeHealthScore}%
            </h3>
            <p className={`mt-1 text-xs ${teamHealth.textColor}`}>
              {teamHealth.label}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className={`rounded-[1.75rem] border p-5 ${card.color}`}>
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
        <InfoBox icon={Users} title="Lead Coverage">
          <p>Total leads tracked: {allLeads.length}</p>
          <p>Inquiries: {inquiries.length}</p>
          <p>Appointments: {appointments.length}</p>
        </InfoBox>

        <InfoBox icon={Clock} title="Reminder Risk">
          <p>Overdue reminders: {countOverdueReminders(reminders, now)}</p>
          <p>Active reminders: {reminders.length}</p>
          <p>No reminder leads: {noReminder.length}</p>
        </InfoBox>

        <InfoBox icon={Activity} title="System Reading">
          <p>
            {vipRisk.length > 0
              ? "VIP/high-priority leads need immediate review."
              : risk.length > 0
              ? "CRM needs immediate follow-up attention."
              : attention.length > healthy.length
              ? "CRM is stable, but many leads still need monitoring."
              : "CRM pipeline health is currently strong."}
          </p>
        </InfoBox>
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
                    {lead.displayType} • {lead.displayStatus} • {lead.ageDays} days old
                  </p>
                  <p className="mt-2 text-xs text-white/55">{lead.reason}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {lead.isVip && <Badge gold text="VIP" />}
                  {lead.isUnassigned && <Badge blue text="Unassigned" />}
                  {!lead.hasReminder && <Badge purple text="No Reminder" />}
                  <Badge red={lead.health === "risk"} yellow={lead.health !== "risk"} text={lead.health === "risk" ? "At Risk" : "Attention"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function InfoBox({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <Icon className="text-[#D4AF37]" size={20} />
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-sm text-white/60">{children}</div>
    </div>
  );
}

function Badge({ text, red, yellow, blue, purple, gold }) {
  const cls = red
    ? "border-red-400/20 bg-red-500/10 text-red-300"
    : yellow
    ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
    : blue
    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
    : purple
    ? "border-purple-400/20 bg-purple-500/10 text-purple-300"
    : gold
    ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
    : "border-white/10 bg-white/[0.04] text-white/50";

  return <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

function normalizeStatus(lead) {
  return String(lead.status || lead.pipeline_stage || lead.appointment_stage || "").toLowerCase();
}

function getLeadName(lead) {
  return lead.full_name || lead.name || lead.student_name || lead.client_name || "Unnamed Lead";
}

function getLeadType(lead) {
  return lead.appointment_date || lead.appointment_time ? "Appointment" : "Inquiry";
}

function getCreatedDate(lead, now) {
  const rawDate = lead.created_at || lead.submitted_at || lead.appointment_date || lead.date;
  const parsedDate = rawDate ? new Date(rawDate) : now;
  return Number.isNaN(parsedDate.getTime()) ? now : parsedDate;
}

function getAgeDays(lead, now) {
  const createdAt = getCreatedDate(lead, now);
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86400000));
}

function isReminderForLead(reminder, lead) {
  const reminderStudentId = String(reminder.student_id || "");
  const reminderLeadId = String(reminder.lead_id || "");
  const leadId = String(lead.id || "");
  return leadId && (reminderStudentId === leadId || reminderLeadId === leadId);
}

function hasOverdueReminder(lead, reminders, now) {
  return reminders.some((reminder) => {
    if (!isReminderForLead(reminder, lead)) return false;
    const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
    return (
      String(reminder.status || "").toLowerCase() !== "completed" &&
      dueDate &&
      !Number.isNaN(dueDate.getTime()) &&
      dueDate < now
    );
  });
}

function hasUpcomingReminder(lead, reminders, now) {
  return reminders.some((reminder) => {
    if (!isReminderForLead(reminder, lead)) return false;
    const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
    return (
      String(reminder.status || "").toLowerCase() !== "completed" &&
      dueDate &&
      !Number.isNaN(dueDate.getTime()) &&
      dueDate >= now
    );
  });
}

function isPositiveStatus(status) {
  return (
    status.includes("confirmed") ||
    status.includes("contacted") ||
    status.includes("completed") ||
    status.includes("approved") ||
    status.includes("converted") ||
    status.includes("enrolled")
  );
}

function isRiskStatus(status) {
  return (
    status.includes("lost") ||
    status.includes("rejected") ||
    status.includes("cancelled") ||
    status.includes("canceled") ||
    status.includes("inactive")
  );
}

function isPendingStatus(status) {
  return (
    status.includes("pending") ||
    status.includes("new") ||
    status.includes("open") ||
    status.includes("follow")
  );
}

function countOverdueReminders(reminders, now) {
  return reminders.filter((reminder) => {
    const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
    return (
      reminder.status !== "completed" &&
      dueDate &&
      !Number.isNaN(dueDate.getTime()) &&
      dueDate < now
    );
  }).length;
}

function getTeamHealth(score) {
  if (score >= 80) {
    return {
      label: "Excellent",
      text: "Strong CRM discipline.",
      textColor: "text-emerald-300",
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      text: "Stable but can improve.",
      textColor: "text-[#D4AF37]",
      color: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      text: "Follow-up pressure detected.",
      textColor: "text-orange-300",
      color: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    };
  }

  return {
    label: "Critical",
    text: "Immediate cleanup needed.",
    textColor: "text-red-300",
    color: "border-red-400/20 bg-red-500/10 text-red-300",
  };
}

export default LeadHealthPanel;