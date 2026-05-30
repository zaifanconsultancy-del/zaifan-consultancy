import { motion } from "framer-motion";
import {
  AlertTriangle,
  Crown,
  Flame,
  PhoneCall,
  Radar,
  Target,
  Users,
  Zap,
} from "lucide-react";

function CounselorCommandCenter({
  inquiries = [],
  appointments = [],
  reminders = [],
}) {
  const allLeads = [...inquiries, ...appointments];

  const getName = (lead) =>
    lead.full_name || lead.name || lead.student_name || "Unnamed Lead";

  const getStatus = (lead) =>
    String(
      lead.status || lead.appointment_stage || lead.pipeline_stage || "pending"
    )
      .replaceAll("_", " ")
      .toLowerCase();

  const getPriority = (lead) => String(lead.priority || "medium").toLowerCase();

  const getCreatedDate = (lead) => {
    const raw =
      lead.created_at || lead.submitted_at || lead.appointment_date || lead.date;

    const date = raw ? new Date(raw) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };

  const getAgeDays = (lead) =>
    Math.max(
      0,
      Math.floor((Date.now() - getCreatedDate(lead).getTime()) / 86400000)
    );

  const hasReminder = (lead) =>
    reminders.some(
      (reminder) =>
        String(reminder.student_id || reminder.lead_id || "") ===
        String(lead.id || "")
    );

  const isOverdue = (lead) =>
    reminders.some((reminder) => {
      const sameLead =
        String(reminder.student_id || reminder.lead_id || "") ===
        String(lead.id || "");

      if (!sameLead) return false;

      const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
      if (!dueDate || Number.isNaN(dueDate.getTime())) return false;

      return String(reminder.status || "").toLowerCase() !== "completed" && dueDate < new Date();
    });

  const enriched = allLeads.map((lead) => {
    const status = getStatus(lead);
    const priority = getPriority(lead);
    const ageDays = getAgeDays(lead);
    const reminderExists = hasReminder(lead);
    const overdue = isOverdue(lead);

    let score = 35;

    if (priority === "vip") score += 35;
    if (priority === "high") score += 25;
    if (lead.phone) score += 10;
    if (lead.email) score += 8;

    if (
      status.includes("confirmed") ||
      status.includes("contacted") ||
      status.includes("documents") ||
      status.includes("visa") ||
      status.includes("offer")
    ) {
      score += 15;
    }

    if (overdue) score += 25;
    if (!reminderExists) score += 10;
    if (ageDays >= 7 && (status.includes("new") || status.includes("pending"))) {
      score += 25;
    }

    score = Math.max(0, Math.min(score, 100));

    return {
      ...lead,
      displayName: getName(lead),
      displayStatus: status,
      priority,
      ageDays,
      hasReminder: reminderExists,
      overdue,
      score,
      type: lead.appointment_date || lead.appointment_time ? "Appointment" : "Inquiry",
    };
  });

  const hotLeads = enriched
    .filter((lead) => lead.score >= 75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const urgentFollowUps = enriched
    .filter((lead) => lead.overdue || (!lead.hasReminder && lead.ageDays >= 3))
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 5);

  const unassignedLeads = enriched
    .filter((lead) => !lead.assigned_admin_id)
    .slice(0, 5);

  const vipRisks = enriched
    .filter(
      (lead) =>
        (lead.priority === "vip" || lead.priority === "high") &&
        (lead.overdue || lead.ageDays >= 5 || !lead.hasReminder)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const stats = [
    {
      label: "Hot Leads",
      value: hotLeads.length,
      icon: Flame,
      tone: "text-orange-300 border-orange-400/20 bg-orange-500/10",
    },
    {
      label: "Urgent Follow-Ups",
      value: urgentFollowUps.length,
      icon: Zap,
      tone: "text-red-300 border-red-400/20 bg-red-500/10",
    },
    {
      label: "Unassigned",
      value: unassignedLeads.length,
      icon: Users,
      tone: "text-blue-300 border-blue-400/20 bg-blue-500/10",
    },
    {
      label: "VIP Risk",
      value: vipRisks.length,
      icon: Crown,
      tone: "text-[#D4AF37] border-[#D4AF37]/20 bg-[#D4AF37]/10",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_38%)]" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Radar className="h-4 w-4 text-[#D4AF37]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Counselor Command Center
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              Today’s Priority Intelligence
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              Focus counselors on hot leads, overdue follow-ups, VIP risks, and
              unassigned opportunities.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">
              Tracked Leads
            </p>
            <h3 className="mt-2 text-4xl font-black text-white">
              {allLeads.length}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className={`rounded-[1.5rem] border p-5 ${item.tone}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-75">
                    {item.label}
                  </p>
                  <h3 className="mt-3 text-4xl font-black">{item.value}</h3>
                </div>

                <Icon className="h-7 w-7" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LeadList
          title="Hot Leads"
          icon={Flame}
          leads={hotLeads}
          empty="No hot leads detected right now."
          badge="Hot"
          tone="orange"
        />

        <LeadList
          title="Urgent Follow-Ups"
          icon={AlertTriangle}
          leads={urgentFollowUps}
          empty="No urgent follow-ups right now."
          badge="Urgent"
          tone="red"
        />

        <LeadList
          title="Unassigned Leads"
          icon={Users}
          leads={unassignedLeads}
          empty="All leads are currently assigned."
          badge="Assign"
          tone="blue"
        />

        <LeadList
          title="VIP Risk Leads"
          icon={Crown}
          leads={vipRisks}
          empty="No VIP risk leads right now."
          badge="VIP"
          tone="gold"
        />
      </div>
    </motion.section>
  );
}

function LeadList({ title, icon: Icon, leads, empty, badge, tone }) {
  const toneClass = {
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
  }[tone];

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl border p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>

      {leads.length === 0 ? (
        <p className="mt-5 text-sm text-white/45">{empty}</p>
      ) : (
        <div className="mt-5 space-y-3">
          {leads.map((lead) => (
            <div
              key={`${lead.type}-${lead.id}-${title}`}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-white">{lead.displayName}</p>

                  <p className="mt-1 text-xs text-white/45">
                    {lead.type} • {lead.displayStatus} • {lead.ageDays} days old
                  </p>

                  <p className="mt-2 text-xs text-white/50">
                    Score: {lead.score}/100 • Priority: {lead.priority}
                  </p>
                </div>

                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}>
                  {badge}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <MiniBadge active={lead.hasReminder} text="Reminder" />
                <MiniBadge active={lead.overdue} text="Overdue" danger />
                <MiniBadge active={Boolean(lead.assigned_admin_id)} text="Assigned" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniBadge({ active, text, danger = false }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
        active
          ? danger
            ? "border-red-400/20 bg-red-500/10 text-red-300"
            : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-white/35"
      }`}
    >
      {text}: {active ? "Yes" : "No"}
    </span>
  );
}

export default CounselorCommandCenter;