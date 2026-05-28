import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Crown,
  Flame,
  Gauge,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { buildAiLeadInsights } from "../../services/aiLeadEngine";
import { buildAutoStageSuggestions } from "../../services/autoStageEngine";

function CrmCommandCenter({
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

  const aiInsights = buildAiLeadInsights({
    inquiries: safeInquiries,
    appointments: safeAppointments,
  });

  const stageSuggestions = buildAutoStageSuggestions({
    inquiries: safeInquiries,
    appointments: safeAppointments,
  });

  const now = new Date();
  const pendingReminders = safeReminders.filter(
    (item) => String(item.status || "pending").toLowerCase() !== "completed"
  );
  const overdueReminders = pendingReminders.filter((item) => {
    if (!item.due_date) return false;
    const dueDate = new Date(item.due_date);
    return !Number.isNaN(dueDate.getTime()) && dueDate < now;
  });

  const totalLeads = safeInquiries.length + safeAppointments.length;
  const contactedCount = safeInquiries.filter(
    (item) => String(item.status || "new").toLowerCase() !== "new"
  ).length;
  const approvedCount = safeInquiries.filter(
    (item) => String(item.status || "").toLowerCase() === "approved"
  ).length;
  const confirmedAppointments = safeAppointments.filter(
    (item) => String(item.status || "pending").toLowerCase() === "confirmed"
  ).length;

  const engagementRate = safeInquiries.length
    ? Math.round((contactedCount / safeInquiries.length) * 100)
    : 0;

  const approvalRate = safeInquiries.length
    ? Math.round((approvedCount / safeInquiries.length) * 100)
    : 0;

  const appointmentConfirmationRate = safeAppointments.length
    ? Math.round((confirmedAppointments / safeAppointments.length) * 100)
    : 0;

  const alertScore =
    aiInsights.hotLeads.length * 8 +
    aiInsights.immediateLeads.length * 10 +
    overdueReminders.length * 10 +
    stageSuggestions.highUrgency.length * 7;

  const positiveScore =
    engagementRate * 0.25 +
    approvalRate * 0.35 +
    appointmentConfirmationRate * 0.2 +
    aiInsights.averageScore * 0.2;

  const crmHealthScore = Math.max(
    0,
    Math.min(100, Math.round(positiveScore + 45 - alertScore * 0.35))
  );

  const health = getHealthConfig(crmHealthScore);
  const priorityAction = getPriorityAction({
    hotLeads: aiInsights.hotLeads.length,
    immediateLeads: aiInsights.immediateLeads.length,
    overdueReminders: overdueReminders.length,
    stageSuggestions: stageSuggestions.highUrgency.length,
    pendingReminders: pendingReminders.length,
    engagementRate,
  });

  const metricCards = [
    {
      label: "CRM Health",
      value: `${crmHealthScore}%`,
      icon: Gauge,
      color: health.color,
      border: health.border,
      bg: health.bg,
    },
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Target,
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/20",
      bg: "bg-[#D4AF37]/10",
    },
    {
      label: "Hot Leads",
      value: aiInsights.hotLeads.length,
      icon: Flame,
      color: "text-red-300",
      border: "border-red-400/20",
      bg: "bg-red-400/10",
    },
    {
      label: "Overdue Follow-ups",
      value: overdueReminders.length,
      icon: AlertTriangle,
      color: "text-orange-300",
      border: "border-orange-400/20",
      bg: "bg-orange-400/10",
    },
  ];

  const intelligenceRows = [
    {
      title: "Lead quality",
      value: `${aiInsights.averageScore}/100 avg AI score`,
      text:
        aiInsights.averageScore >= 70
          ? "Lead quality looks strong. Prioritize quick response."
          : "Lead quality can improve with better qualification and follow-up.",
      icon: Brain,
      accent: "text-[#D4AF37]",
    },
    {
      title: "Pipeline movement",
      value: `${stageSuggestions.total} suggestions`,
      text:
        stageSuggestions.total > 0
          ? "Automation found pipeline cleanup opportunities."
          : "Pipeline stages look stable right now.",
      icon: Radar,
      accent: "text-blue-300",
    },
    {
      title: "Reminder discipline",
      value: `${pendingReminders.length} pending`,
      text:
        overdueReminders.length > 0
          ? "Overdue follow-ups are hurting CRM discipline."
          : "Reminder workload is under control.",
      icon: ShieldCheck,
      accent: overdueReminders.length > 0 ? "text-red-300" : "text-green-300",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2.2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/15 via-white/[0.04] to-black/40 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_38%)]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5">
              <Crown className="h-3.5 w-3.5 text-[#D4AF37]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
                CRM Command Center
              </p>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl xl:text-5xl">
              Executive Operating View
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
              A top-level control panel showing CRM health, urgent work,
              automation pressure, lead quality, and the first action staff
              should take today.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 backdrop-blur-xl xl:min-w-[360px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
                  Health Score
                </p>

                <h2 className={`mt-2 text-5xl font-black ${health.color}`}>
                  {crmHealthScore}
                </h2>
              </div>

              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${health.border} ${health.bg}`}>
                <health.icon className={`h-8 w-8 ${health.color}`} />
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 via-[#D4AF37] to-green-300 transition-all duration-700"
                style={{ width: `${crmHealthScore}%` }}
              />
            </div>

            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              {health.message}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`rounded-[1.7rem] border ${metric.border} ${metric.bg} p-5 backdrop-blur-xl`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
                  {metric.label}
                </p>

                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>

              <h3 className={`mt-3 text-3xl font-black ${metric.color}`}>
                {metric.value}
              </h3>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
              <Zap className="h-7 w-7 text-red-300" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-red-300">
                First Priority
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                {priorityAction.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                {priorityAction.message}
              </p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
                Intelligence Summary
              </p>

              <h3 className="text-lg font-black text-white">
                What the CRM sees right now
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {intelligenceRows.map((row) => {
              const Icon = row.icon;

              return (
                <div
                  key={row.title}
                  className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${row.accent}`} />

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-white">
                          {row.title}
                        </p>

                        <span className={`text-xs font-bold ${row.accent}`}>
                          {row.value}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-relaxed text-gray-400">
                        {row.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function getHealthConfig(score) {
  if (score >= 80) {
    return {
      label: "Excellent",
      color: "text-green-300",
      border: "border-green-400/25",
      bg: "bg-green-500/10",
      icon: CheckCircle2,
      message:
        "CRM health looks excellent. Keep response speed high and continue moving leads through the funnel.",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/25",
      bg: "bg-[#D4AF37]/10",
      icon: TrendingUp,
      message:
        "CRM health is good, but there are still improvement opportunities in reminders, stage movement, or lead response.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      color: "text-orange-300",
      border: "border-orange-400/25",
      bg: "bg-orange-500/10",
      icon: AlertTriangle,
      message:
        "CRM health needs attention. Prioritize overdue reminders, hot leads, and stale pipeline stages.",
    };
  }

  return {
    label: "Critical",
    color: "text-red-300",
    border: "border-red-400/25",
    bg: "bg-red-500/10",
    icon: Flame,
    message:
      "CRM health is under pressure. Clear urgent follow-ups and handle hot leads before adding more workload.",
  };
}

function getPriorityAction({
  hotLeads,
  immediateLeads,
  overdueReminders,
  stageSuggestions,
  pendingReminders,
  engagementRate,
}) {
  if (immediateLeads > 0) {
    return {
      title: "Call immediate hot leads first",
      message: `${immediateLeads} immediate AI-priority lead(s) need fast human action before they cool down.`,
    };
  }

  if (overdueReminders > 0) {
    return {
      title: "Clear overdue follow-ups",
      message: `${overdueReminders} overdue follow-up reminder(s) are creating CRM pressure. Complete or reschedule them first.`,
    };
  }

  if (hotLeads > 0) {
    return {
      title: "Prioritize hot leads",
      message: `${hotLeads} hot lead(s) are available. Contact them before normal inquiries.`,
    };
  }

  if (stageSuggestions > 0) {
    return {
      title: "Review automation suggestions",
      message: `${stageSuggestions} high-urgency stage movement suggestion(s) can clean your pipeline.`,
    };
  }

  if (pendingReminders > 0) {
    return {
      title: "Process pending reminders",
      message: `${pendingReminders} pending reminder(s) should be handled to keep follow-up rhythm strong.`,
    };
  }

  if (engagementRate < 50) {
    return {
      title: "Improve first response rate",
      message: "Many inquiries may still be new. Contact them and move them into the pipeline.",
    };
  }

  return {
    title: "CRM is stable",
    message: "No critical action detected. Continue nurturing leads and improving conversion movement.",
  };
}

export default CrmCommandCenter;
