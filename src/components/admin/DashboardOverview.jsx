import { motion } from "framer-motion";
import { buildAiLeadInsights } from "../../services/aiLeadEngine";

function DashboardOverview({
  cardClass = "",
  todayInquiriesCount = 0,
  todayAppointmentsCount = 0,
  latestInquiry = null,
  latestAppointment = null,
  inquiries = [],
  appointments = [],
}) {
  const totalToday = todayInquiriesCount + todayAppointmentsCount;

  const inquiryPercent =
    totalToday === 0 ? 0 : Math.round((todayInquiriesCount / totalToday) * 100);

  const appointmentPercent =
    totalToday === 0
      ? 0
      : Math.round((todayAppointmentsCount / totalToday) * 100);

  const aiInsights = buildAiLeadInsights({ inquiries, appointments });

  const latestCards = [
    {
      title: "Latest Inquiry",
      icon: "📨",
      lead: latestInquiry,
      fallbackTitle: "No inquiry yet",
      fallbackText: "Waiting for first website inquiry",
      type: "inquiry",
      accent: "gold",
      detail: latestInquiry?.country || latestInquiry?.field_of_interest,
      time: latestInquiry?.created_at,
    },
    {
      title: "Latest Appointment",
      icon: "📅",
      lead: latestAppointment,
      fallbackTitle: "No booking yet",
      fallbackText: "Waiting for first consultation booking",
      type: "appointment",
      accent: "green",
      detail: latestAppointment
        ? `${latestAppointment.appointment_date || "No date"} · ${
            latestAppointment.appointment_time || "No time"
          }`
        : "",
      time: latestAppointment?.created_at,
    },
  ];

  const todayBars = [
    {
      label: "Inquiries",
      value: inquiryPercent,
      count: todayInquiriesCount,
      icon: "📨",
    },
    {
      label: "Appointments",
      value: appointmentPercent,
      count: todayAppointmentsCount,
      icon: "📅",
    },
  ];

  const pulseBars = buildPulseBars(todayInquiriesCount, todayAppointmentsCount);

  return (
    <div className="mb-5 space-y-4 xl:mb-6">
      <AIExecutiveBriefing cardClass={cardClass} aiInsights={aiInsights} />

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.95fr] xl:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`${cardClass} p-4 sm:p-5`}
        >
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[11px] sm:tracking-[0.35em]">
                Daily Operations
              </p>

              <h2 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-3xl">
                Today&apos;s CRM Pulse
              </h2>

              <p className="mt-1.5 text-xs leading-relaxed text-gray-400 sm:mt-2 sm:text-sm">
                Real-time overview of today&apos;s student activity from inquiries and consultation bookings.
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-xs font-bold text-[#D4AF37] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
              {totalToday} Today
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.5rem] border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                Activity Count
              </p>

              <h3 className="mt-3 text-5xl font-black text-[#D4AF37]">
                {totalToday}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {totalToday === 0
                  ? "No new CRM activity today yet."
                  : `${todayInquiriesCount} inquiries and ${todayAppointmentsCount} appointments logged today.`}
              </p>

              <div className="mt-5 space-y-4">
                {todayBars.map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {bar.icon} {bar.label}
                      </span>
                      <span>
                        {bar.count} · {bar.value}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                        className="h-full rounded-full bg-[#D4AF37]"
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-64 items-end gap-2 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:gap-3 sm:p-5">
              {pulseBars.map((bar, index) => (
                <div
                  key={bar.label}
                  className="flex flex-1 flex-col items-center gap-2 sm:gap-3"
                >
                  <div className="flex h-40 w-full items-end rounded-full bg-white/[0.04] p-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${bar.value}%` }}
                      transition={{ duration: 0.7, delay: index * 0.05 }}
                      className={`w-full rounded-full ${
                        bar.active
                          ? "bg-gradient-to-t from-[#D4AF37] to-[#E7C768]"
                          : "bg-white/10"
                      }`}
                    ></motion.div>
                  </div>

                  <span className="text-[10px] text-gray-500 sm:text-[11px]">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-3 xl:gap-4">
          {latestCards.map((card, index) => (
            <LatestLeadCard
              key={card.title}
              card={card}
              cardClass={cardClass}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AIExecutiveBriefing({ cardClass, aiInsights }) {
  const totalAnalyzed = aiInsights.totalAnalyzed || 0;
  const hotCount = aiInsights.hotLeads.length;
  const warmCount = aiInsights.warmLeads.length;
  const urgentCount = aiInsights.immediateLeads.length + aiInsights.highUrgencyLeads.length;
  const averageScore = aiInsights.averageScore || 0;

  const topOpportunity = aiInsights.topLeads?.[0] || null;
  const topRisk = [...aiInsights.immediateLeads, ...aiInsights.highUrgencyLeads]
    .sort((a, b) => b.ai_score - a.ai_score)?.[0];

  const briefingLines = buildBriefingLines({
    totalAnalyzed,
    hotCount,
    warmCount,
    urgentCount,
    averageScore,
    topOpportunity,
    topRisk,
  });

  const statCards = [
    {
      label: "AI Score Avg",
      value: averageScore,
      suffix: "/100",
      icon: "🧠",
      tone: "gold",
    },
    {
      label: "Hot Leads",
      value: hotCount,
      suffix: "",
      icon: "🔥",
      tone: "red",
    },
    {
      label: "Warm Leads",
      value: warmCount,
      suffix: "",
      icon: "⚡",
      tone: "gold",
    },
    {
      label: "Urgent Follow-Ups",
      value: urgentCount,
      suffix: "",
      icon: "🚨",
      tone: "orange",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`${cardClass} overflow-hidden p-4 sm:p-5`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-52 w-52 rounded-full bg-cyan-400/5 blur-3xl" />

      <div className="relative grid gap-5 2xl:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Real CRM Intelligence
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              No Auto GPT Cost
            </span>
          </div>

          <h2 className="text-2xl font-black text-white sm:text-3xl">
            AI Executive Briefing
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            This briefing uses your CRM data and local AI scoring engine. Real GPT remains available inside the student workspace when a counselor needs generated messages, summaries, scripts, or strategy.
          </p>

          <div className="mt-5 space-y-2.5">
            {briefingLines.map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-white/70"
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {statCards.map((stat) => (
            <AIStatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function AIStatCard({ stat }) {
  const toneClass =
    stat.tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : stat.tone === "orange"
      ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
      : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
          {stat.label}
        </p>
        <span className="text-xl">{stat.icon}</span>
      </div>

      <p className="mt-4 text-4xl font-black text-white">
        {stat.value}
        <span className="text-base text-white/35">{stat.suffix}</span>
      </p>
    </div>
  );
}

function LatestLeadCard({ card, cardClass, index }) {
  const hasLead = Boolean(card.lead);
  const assignedAdmin =
    card.lead?.assigned_admin_name || card.lead?.assigned_to || null;

  const priority = card.lead?.priority || "low";
  const status =
    card.type === "inquiry"
      ? card.lead?.status || "new"
      : card.lead?.status || "pending";

  const accentClass =
    card.accent === "green"
      ? "border-green-400/20 bg-green-400/10 text-green-300"
      : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className={`${cardClass} group relative p-4 sm:p-5`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="flex items-start justify-between gap-3 sm:gap-5">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.3em]">
            {card.title}
          </p>

          <h2 className="mt-2 break-words text-xl font-black leading-tight text-white sm:mt-3 sm:text-2xl">
            {hasLead ? card.lead.full_name || "Unnamed Student" : card.fallbackTitle}
          </h2>

          <p className="mt-1.5 text-xs leading-relaxed text-gray-400 sm:mt-2 sm:text-sm">
            {hasLead ? card.detail || "No detail available" : card.fallbackText}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-xl border p-2.5 text-lg sm:rounded-2xl sm:p-3 sm:text-xl ${accentClass}`}
        >
          {card.icon}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${accentClass}`}>
          {card.type}
        </span>

        {hasLead && (
          <>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-300">
              {priority}
            </span>

            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
              {status}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                assignedAdmin
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "border-orange-400/20 bg-orange-400/10 text-orange-300"
              }`}
            >
              {assignedAdmin ? `Assigned: ${assignedAdmin}` : "Open Pool"}
            </span>
          </>
        )}
      </div>

      {hasLead && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <MiniInfo label="Email" value={card.lead.email} />
          <MiniInfo label="Created" value={formatDate(card.time)} />
        </div>
      )}
    </motion.div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-gray-300">
        {value || "-"}
      </p>
    </div>
  );
}

function buildBriefingLines({
  totalAnalyzed,
  hotCount,
  warmCount,
  urgentCount,
  averageScore,
  topOpportunity,
  topRisk,
}) {
  if (!totalAnalyzed) {
    return [
      "No leads have been analyzed yet. Once inquiries or appointments arrive, this panel will show AI-ranked opportunities and risks.",
      "Real GPT generation remains available inside each student profile when a counselor needs written output.",
    ];
  }

  const lines = [
    `${totalAnalyzed} active CRM records analyzed with an average AI score of ${averageScore}/100.`,
  ];

  if (hotCount > 0 || warmCount > 0) {
    lines.push(
      `${hotCount} hot lead${hotCount === 1 ? "" : "s"} and ${warmCount} warm lead${warmCount === 1 ? "" : "s"} should be prioritized before cold follow-ups.`
    );
  } else {
    lines.push("No hot leads detected yet. Focus on nurturing and improving lead qualification quality.");
  }

  if (urgentCount > 0) {
    lines.push(
      `${urgentCount} urgent follow-up${urgentCount === 1 ? "" : "s"} need counselor attention before momentum drops.`
    );
  } else {
    lines.push("No urgent follow-up pressure detected right now.");
  }

  if (topOpportunity) {
    lines.push(
      `Top opportunity: ${topOpportunity.full_name || "Unnamed Student"} with ${topOpportunity.ai_score}/100 AI score.`
    );
  }

  if (topRisk) {
    lines.push(
      `Highest urgency risk: ${topRisk.full_name || "Unnamed Student"} — ${topRisk.ai_urgency.message}`
    );
  }

  return lines.slice(0, 5);
}

function buildPulseBars(todayInquiriesCount, todayAppointmentsCount) {
  const total = todayInquiriesCount + todayAppointmentsCount;

  if (total === 0) {
    return [
      { label: "Now", value: 18, active: false },
      { label: "Leads", value: 28, active: false },
      { label: "Calls", value: 20, active: false },
      { label: "Apps", value: 32, active: false },
      { label: "CRM", value: 24, active: false },
      { label: "Flow", value: 36, active: false },
      { label: "Live", value: 22, active: false },
    ];
  }

  const inquiryBoost = Math.min(90, 30 + todayInquiriesCount * 15);
  const appointmentBoost = Math.min(95, 35 + todayAppointmentsCount * 18);

  return [
    { label: "Start", value: 25, active: true },
    { label: "Inq", value: inquiryBoost, active: todayInquiriesCount > 0 },
    { label: "Follow", value: Math.max(35, inquiryBoost - 12), active: true },
    { label: "Book", value: appointmentBoost, active: todayAppointmentsCount > 0 },
    { label: "Work", value: Math.max(40, appointmentBoost - 15), active: true },
    { label: "Close", value: Math.min(88, 45 + total * 10), active: true },
    { label: "Live", value: Math.min(96, 50 + total * 12), active: true },
  ];
}

function formatDate(date) {
  if (!date) return "No date";

  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default DashboardOverview;
