import { motion } from "framer-motion";
import {
  AlertTriangle,
  Crown,
  Flame,
  Radar,
  Users,
  Zap,
} from "lucide-react";

function CounselorCommandCenter({
  inquiries = [],
  appointments = [],
  reminders = [],
}) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];

  const allLeads = [...safeInquiries, ...safeAppointments];

  const getName = (lead) =>
    lead.full_name || lead.name || lead.student_name || "Unnamed Lead";

  const getStatus = (lead) =>
    String(
      lead.status || lead.appointment_stage || lead.pipeline_stage || "pending"
    )
      .replaceAll("_", " ")
      .toLowerCase();

  const getPriority = (lead) =>
    String(lead.priority || "medium").toLowerCase();

  const getCreatedDate = (lead) => {
    const raw =
      lead.created_at ||
      lead.submitted_at ||
      lead.appointment_date ||
      lead.date;

    const date = raw ? new Date(raw) : new Date();
    return Number.isNaN(date.getTime()) ? new Date() : date;
  };

  const getAgeDays = (lead) =>
    Math.max(
      0,
      Math.floor((Date.now() - getCreatedDate(lead).getTime()) / 86400000)
    );

  const hasReminder = (lead) =>
    safeReminders.some(
      (reminder) =>
        String(reminder.student_id || reminder.lead_id || "") ===
        String(lead.id || "")
    );

  const isOverdue = (lead) =>
    safeReminders.some((reminder) => {
      const sameLead =
        String(reminder.student_id || reminder.lead_id || "") ===
        String(lead.id || "");

      if (!sameLead) return false;

      const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
      if (!dueDate || Number.isNaN(dueDate.getTime())) return false;

      return (
        String(reminder.status || "").toLowerCase() !== "completed" &&
        dueDate < new Date()
      );
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

    if (
      ageDays >= 7 &&
      (status.includes("new") || status.includes("pending"))
    ) {
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
      type:
        lead.appointment_date || lead.appointment_time
          ? "Appointment"
          : "Inquiry",
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
      tone: "orange",
    },
    {
      label: "Urgent Follow-Ups",
      value: urgentFollowUps.length,
      icon: Zap,
      tone: "red",
    },
    {
      label: "Unassigned",
      value: unassignedLeads.length,
      icon: Users,
      tone: "navy",
    },
    {
      label: "VIP Risk",
      value: vipRisks.length,
      icon: Crown,
      tone: "orange",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#E9802D]/45 bg-[#FFFDF8] p-6 shadow-[0_18px_50px_rgba(23,36,61,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E9802D] via-[#F2A766] to-[#E9802D]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#E9802D]/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1.5">
              <Radar className="h-4 w-4 text-[#D96C1F]" />

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B84F0E]">
                Counselor Command Center
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black text-[#17243D]">
              Today’s Priority Intelligence
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#667085]">
              Focus counselors on hot leads, overdue follow-ups, VIP risks,
              and unassigned opportunities.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#243A60]/25 bg-white p-5 text-right shadow-[0_10px_24px_rgba(23,36,61,0.05)]">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#667085]">
              Tracked Leads
            </p>

            <h3 className="mt-2 text-4xl font-black text-[#17243D]">
              {allLeads.length}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          const danger = item.tone === "red";
          const navy = item.tone === "navy";

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`rounded-[1.5rem] border p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)] ${
                danger
                  ? "border-[#C2413B]/30 bg-[#FFF0EE]"
                  : navy
                  ? "border-[#243A60]/30 bg-[#F3F5F8]"
                  : "border-[#E9802D]/35 bg-[#FFF3E7]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-black uppercase tracking-[0.22em] ${
                      danger
                        ? "text-[#A8342F]"
                        : navy
                        ? "text-[#243A60]"
                        : "text-[#B84F0E]"
                    }`}
                  >
                    {item.label}
                  </p>

                  <h3
                    className={`mt-3 text-4xl font-black ${
                      danger ? "text-[#A8342F]" : "text-[#17243D]"
                    }`}
                  >
                    {item.value}
                  </h3>
                </div>

                <Icon
                  className={`h-7 w-7 ${
                    danger
                      ? "text-[#C2413B]"
                      : navy
                      ? "text-[#243A60]"
                      : "text-[#D96C1F]"
                  }`}
                />
              </div>
            </motion.div>
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
          tone="navy"
        />

        <LeadList
          title="VIP Risk Leads"
          icon={Crown}
          leads={vipRisks}
          empty="No VIP risk leads right now."
          badge="VIP"
          tone="orange"
        />
      </div>
    </motion.section>
  );
}

function LeadList({ title, icon: Icon, leads, empty, badge, tone }) {
  const toneClass = {
    orange: "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]",
    red: "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]",
    navy: "border-[#243A60]/30 bg-[#F3F5F8] text-[#243A60]",
  }[tone];

  return (
    <div className="rounded-[1.75rem] border-2 border-[#243A60]/30 bg-[#FFFDF8] p-5 shadow-[0_14px_34px_rgba(23,36,61,0.06)]">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl border p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-black text-[#17243D]">{title}</h3>
      </div>

      {leads.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#243A60]/20 bg-[#F7F3EB] p-4">
          <p className="text-sm text-[#667085]">{empty}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {leads.map((lead) => (
            <div
              key={`${lead.type}-${lead.id}-${title}`}
              className="rounded-2xl border border-[#243A60]/22 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#E9802D]/50 hover:shadow-[0_10px_22px_rgba(23,36,61,0.06)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black text-[#17243D]">
                    {lead.displayName}
                  </p>

                  <p className="mt-1 text-xs font-medium text-[#747D8D]">
                    {lead.type} • {lead.displayStatus} • {lead.ageDays} days old
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#596579]">
                    Score: {lead.score}/100 • Priority: {lead.priority}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}
                >
                  {badge}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <MiniBadge active={lead.hasReminder} text="Reminder" />
                <MiniBadge active={lead.overdue} text="Overdue" danger />
                <MiniBadge
                  active={Boolean(lead.assigned_admin_id)}
                  text="Assigned"
                />
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
            ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
            : "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]"
          : "border-[#243A60]/18 bg-[#F3F5F8] text-[#7A8392]"
      }`}
    >
      {text}: {active ? "Yes" : "No"}
    </span>
  );
}

export default CounselorCommandCenter;