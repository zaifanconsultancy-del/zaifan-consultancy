import {
  Activity,
  CalendarDays,
  Flame,
  Grid3X3,
  HeartPulse,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

function ProductivityHeatmap({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
}) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeReminders = Array.isArray(followUpReminders)
    ? followUpReminders
    : [];

  const heatmapDays = buildHeatmapDays({
    inquiries: safeInquiries,
    appointments: safeAppointments,
    followUpReminders: safeReminders,
  });

  const busiestDay = [...heatmapDays].sort((a, b) => b.total - a.total)[0];
  const totalActivity = heatmapDays.reduce((sum, day) => sum + day.total, 0);
  const activeDays = heatmapDays.filter((day) => day.total > 0).length;
  const averageDailyActivity = heatmapDays.length
    ? Math.round(totalActivity / heatmapDays.length)
    : 0;
  const pressureDays = heatmapDays.filter((day) => day.level === "high").length;

  const metricCards = [
    {
      label: "Total Activity",
      value: totalActivity,
      icon: Activity,
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/20",
      bg: "bg-[#D4AF37]/10",
    },
    {
      label: "Active Days",
      value: activeDays,
      icon: CalendarDays,
      color: "text-blue-300",
      border: "border-blue-400/20",
      bg: "bg-blue-400/10",
    },
    {
      label: "Daily Avg",
      value: averageDailyActivity,
      icon: TrendingUp,
      color: "text-green-300",
      border: "border-green-400/20",
      bg: "bg-green-400/10",
    },
    {
      label: "Pressure Days",
      value: pressureDays,
      icon: Flame,
      color: "text-red-300",
      border: "border-red-400/20",
      bg: "bg-red-400/10",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-5 backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.13),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Grid3X3 className="h-3.5 w-3.5 text-[#D4AF37]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Productivity Heatmap
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              CRM Activity Intensity Map
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Visualizes lead activity, appointment pressure, reminder workload,
              and operational intensity across the last 35 days.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className={`rounded-2xl border ${metric.border} ${metric.bg} p-4 backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      {metric.label}
                    </p>

                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>

                  <h3 className={`mt-2 text-2xl font-black ${metric.color}`}>
                    {metric.value}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Last 35 Days
              </p>

              <h3 className="mt-2 text-xl font-black text-white">
                Operational workload grid
              </h3>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">
              <span>Low</span>
              <span className="h-3 w-3 rounded border border-white/10 bg-white/[0.04]"></span>
              <span className="h-3 w-3 rounded border border-[#D4AF37]/20 bg-[#D4AF37]/10"></span>
              <span className="h-3 w-3 rounded border border-orange-400/25 bg-orange-400/20"></span>
              <span className="h-3 w-3 rounded border border-red-400/30 bg-red-400/30"></span>
              <span>High</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {heatmapDays.map((day, index) => (
              <motion.div
                key={day.key}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, delay: index * 0.012 }}
                title={`${day.label}: ${day.total} total activity`}
                className={`group relative min-h-[82px] rounded-2xl border p-2 transition duration-300 hover:-translate-y-1 sm:min-h-[96px] sm:p-3 ${getHeatCellStyle(
                  day.level
                )}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    {day.shortDay}
                  </p>

                  {day.level === "high" && (
                    <Zap className="h-3.5 w-3.5 text-red-300" />
                  )}
                </div>

                <p className="mt-2 text-sm font-black text-white sm:text-base">
                  {day.dayNumber}
                </p>

                <div className="mt-2 space-y-1 text-[9px] text-gray-400 sm:text-[10px]">
                  <p>Leads: {day.inquiries}</p>
                  <p>Apps: {day.appointments}</p>
                  <p>FU: {day.reminders}</p>
                </div>

                <div className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                    style={{ width: `${Math.min(day.total * 18, 100)}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <InsightCard
            cardClass={cardClass}
            icon={Flame}
            title="Busiest Day"
            value={busiestDay?.label || "No activity"}
            text={
              busiestDay?.total
                ? `${busiestDay.total} CRM activities detected on this day.`
                : "No CRM activity detected in the heatmap window."
            }
            accent="text-red-300"
          />

          <InsightCard
            cardClass={cardClass}
            icon={Target}
            title="Workload Pattern"
            value={pressureDays > 0 ? "High pressure" : "Stable"}
            text={
              pressureDays > 0
                ? `${pressureDays} day(s) had heavy CRM workload. Consider staff balancing and automation.`
                : "Workload intensity looks stable across recent activity."
            }
            accent="text-[#D4AF37]"
          />

          <InsightCard
            cardClass={cardClass}
            icon={Sparkles}
            title="CRM Recommendation"
            value="Optimize timing"
            text="Use high-activity days to plan staff coverage, reminder batching, and follow-up campaigns."
            accent="text-green-300"
          />

          <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10">
                <Pulse className="h-5 w-5 text-blue-300" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                  Activity Mix
                </p>
                <h3 className="mt-1 text-lg font-black text-white">
                  Last 35 days
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ProgressRow
                label="Inquiries"
                value={safeInquiries.length}
                total={safeInquiries.length + safeAppointments.length + safeReminders.length}
              />
              <ProgressRow
                label="Appointments"
                value={safeAppointments.length}
                total={safeInquiries.length + safeAppointments.length + safeReminders.length}
              />
              <ProgressRow
                label="Follow-ups"
                value={safeReminders.length}
                total={safeInquiries.length + safeAppointments.length + safeReminders.length}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildHeatmapDays({ inquiries = [], appointments = [], followUpReminders = [] }) {
  const today = new Date();

  return Array.from({ length: 35 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - index));

    const key = date.toDateString();

    const inquiriesCount = inquiries.filter((item) =>
      item.created_at ? new Date(item.created_at).toDateString() === key : false
    ).length;

    const appointmentsCount = appointments.filter((item) => {
      const dateValue = item.appointment_date || item.created_at;
      return dateValue ? new Date(dateValue).toDateString() === key : false;
    }).length;

    const reminderCount = followUpReminders.filter((item) => {
      const dateValue = item.due_date || item.created_at;
      return dateValue ? new Date(dateValue).toDateString() === key : false;
    }).length;

    const total = inquiriesCount + appointmentsCount + reminderCount;

    let level = "none";
    if (total >= 7) level = "high";
    else if (total >= 4) level = "medium";
    else if (total >= 1) level = "low";

    return {
      key,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      shortDay: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      inquiries: inquiriesCount,
      appointments: appointmentsCount,
      reminders: reminderCount,
      total,
      level,
    };
  });
}

function getHeatCellStyle(level) {
  if (level === "high") {
    return "border-red-400/25 bg-red-400/20 shadow-[0_0_28px_rgba(248,113,113,0.12)]";
  }

  if (level === "medium") {
    return "border-orange-400/25 bg-orange-400/15";
  }

  if (level === "low") {
    return "border-[#D4AF37]/20 bg-[#D4AF37]/10";
  }

  return "border-white/10 bg-white/[0.035]";
}

function InsightCard({ cardClass, icon: Icon, title, value, text, accent }) {
  return (
    <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
            {title}
          </p>

          <h3 className={`mt-2 text-lg font-black ${accent}`}>{value}</h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total }) {
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
          {label}
        </p>
        <p className="text-xs font-black text-[#D4AF37]">
          {value} · {percent}%
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-emerald-300 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProductivityHeatmap;
