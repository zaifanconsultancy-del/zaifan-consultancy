import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: 1200,
    bounce: 0,
  });

  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  motionValue.set(value || 0);

  return <motion.span>{rounded}</motion.span>;
}

function AdminStats({
  cardClass = "",
  inquiries = [],
  inquiryNewCount = 0,
  inquiryContactedCount = 0,
  appointments = [],
  appointmentPendingCount = 0,
  appointmentConfirmedCount = 0,
  appointmentCompletedCount = 0,
  appointmentCancelledCount = 0,
}) {
  const allLeads = [...inquiries, ...appointments];
  const totalLeads = allLeads.length;
  const totalAppointments = appointments.length;
  const totalInquiries = inquiries.length;

  const assignedLeads = allLeads.filter((lead) => lead.assigned_admin_id).length;
  const openPoolLeads = Math.max(totalLeads - assignedLeads, 0);

  const vipLeads = allLeads.filter((lead) => lead.priority === "vip").length;
  const highLeads = allLeads.filter((lead) => lead.priority === "high").length;
  const urgentLeads = vipLeads + highLeads;

  const contactRate =
    totalInquiries === 0
      ? 0
      : Math.round((inquiryContactedCount / totalInquiries) * 100);

  const pendingRatio =
    totalAppointments === 0
      ? 0
      : Math.round((appointmentPendingCount / totalAppointments) * 100);

  const confirmRate =
    totalAppointments === 0
      ? 0
      : Math.round((appointmentConfirmedCount / totalAppointments) * 100);

  const completionRate =
    totalAppointments === 0
      ? 0
      : Math.round((appointmentCompletedCount / totalAppointments) * 100);

  const ownershipRate =
    totalLeads === 0 ? 0 : Math.round((assignedLeads / totalLeads) * 100);

  const urgentRate =
    totalLeads === 0 ? 0 : Math.round((urgentLeads / totalLeads) * 100);

  const stats = [
    {
      label: "Total Inquiries",
      value: totalInquiries,
      icon: "📨",
      color: "text-[#D4AF37]",
      description: `${inquiryNewCount} new · ${inquiryContactedCount} contacted`,
      progress: contactRate,
      progressLabel: "Contact rate",
      tone: "gold",
    },
    {
      label: "Appointments",
      value: totalAppointments,
      icon: "📅",
      color: "text-green-400",
      description: `${appointmentPendingCount} pending · ${appointmentConfirmedCount} confirmed`,
      progress: pendingRatio,
      progressLabel: "Pending ratio",
      tone: "green",
    },
    {
      label: "Lead Ownership",
      value: assignedLeads,
      icon: "📌",
      color: "text-cyan-300",
      description: `${openPoolLeads} leads still in open pool`,
      progress: ownershipRate,
      progressLabel: "Assigned rate",
      tone: "cyan",
    },
    {
      label: "Urgent Leads",
      value: urgentLeads,
      icon: "🔥",
      color: "text-red-300",
      description: `${vipLeads} VIP · ${highLeads} high priority`,
      progress: urgentRate,
      progressLabel: "Urgency ratio",
      tone: "red",
    },
    {
      label: "Confirmed",
      value: appointmentConfirmedCount,
      icon: "✅",
      color: "text-green-400",
      description: "Ready for consultation",
      progress: confirmRate,
      progressLabel: "Confirm rate",
      tone: "green",
    },
    {
      label: "Completed",
      value: appointmentCompletedCount,
      icon: "🎯",
      color: "text-blue-300",
      description: `${appointmentCancelledCount} cancelled appointments`,
      progress: completionRate,
      progressLabel: "Completion rate",
      tone: "blue",
    },
  ];

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:mb-6 xl:gap-4 2xl:grid-cols-3">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} stat={stat} index={index} cardClass={cardClass} />
      ))}
    </div>
  );
}

function StatCard({ stat, index, cardClass }) {
  const toneClasses = {
    gold: "from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent",
    green: "from-green-400/15 via-green-400/5 to-transparent",
    cyan: "from-cyan-400/15 via-cyan-400/5 to-transparent",
    red: "from-red-400/15 via-red-400/5 to-transparent",
    blue: "from-blue-400/15 via-blue-400/5 to-transparent",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`${cardClass} p-4 sm:p-5`}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br ${
          toneClasses[stat.tone] || toneClasses.gold
        } blur-3xl transition duration-500 group-hover:opacity-100`}
      ></div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
            {stat.label}
          </p>

          <h2
            className={`mt-2 text-3xl font-black leading-none sm:mt-3 sm:text-4xl ${stat.color}`}
          >
            <AnimatedNumber value={stat.value} />
          </h2>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xl sm:rounded-2xl sm:text-2xl">
            {stat.icon}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5 text-[11px] text-gray-400 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs">
            {stat.progress}%
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
        {stat.description}
      </p>

      <div className="relative mt-3 sm:mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-gray-500 sm:mb-2 sm:text-[11px]">
          <span>{stat.progressLabel}</span>
          <span>{stat.progress}%</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/10 sm:h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stat.progress}%` }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="h-full rounded-full bg-[#D4AF37]"
          ></motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminStats;
