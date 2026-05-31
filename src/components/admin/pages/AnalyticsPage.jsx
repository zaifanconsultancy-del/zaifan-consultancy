import { AnimatePresence, motion } from "framer-motion";

import DashboardAnalytics from "../DashboardAnalytics";
import DashboardOverview from "../DashboardOverview";
import ActivityTimeline from "../ActivityTimeline";
import CrmKpiAnalytics from "../CrmKpiAnalytics";
import StaffPerformanceAnalytics from "../StaffPerformanceAnalytics";
import LeadScoringAnalytics from "../LeadScoringAnalytics";
import ConversionAnalytics from "../ConversionAnalytics";
import OverdueEscalationPanel from "../OverdueEscalationPanel";
import AutoReminderGenerator from "../AutoReminderGenerator";
import LuxuryAnalyticsCharts from "../LuxuryAnalyticsCharts";
import AiLeadPrioritizationPanel from "../AiLeadPrioritizationPanel";
import StaffLeaderboard from "../StaffLeaderboard";
import AutoStageMovementPanel from "../AutoStageMovementPanel";
import ProductivityHeatmap from "../ProductivityHeatmap";
import NotificationActionCenter from "../NotificationActionCenter";
import FollowUpPerformancePanel from "../FollowUpPerformancePanel";
import ConversionFunnelChart from "../ConversionFunnelChart";
import CrmCommandCenter from "../CrmCommandCenter";
import AiLeadIntelligenceFeed from "../AiLeadIntelligenceFeed";
import AnalyticsSectionWrapper from "../AnalyticsSectionWrapper";
import LeadHealthPanel from "../LeadHealthPanel";
import CounselorCommandCenter from "../CounselorCommandCenter";
import VisaRiskAnalyzer from "../VisaRiskAnalyzer";
import CounselorPerformanceAI from "../CounselorPerformanceAI";
import WorkloadBalancerAI from "../WorkloadBalancerAI";
import { buildAiLeadInsights } from "../../../services/aiLeadEngine";

function AnalyticsPage({
  cardClass,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  activeAnalyticsSection,
  setActiveAnalyticsSection,
  toggleInquiryStatus,
  updateAppointmentStage,
  updateAppointmentStatus,
  setActiveTab,
  todayInquiriesCount,
  todayAppointmentsCount,
  latestInquiry,
  latestAppointment,
}) {
  const analyticsNavItems = [
    ["ai-executive", "AI Executive"],
    ["command", "Command"],
    ["operations", "Ops Center"],
    ["visa-risk", "Visa Risk"],
    ["counselor-ai", "Counselor AI"],
    ["workload-ai", "Workload AI"],
    ["kpi", "KPI"],
    ["intelligence", "AI Feed"],
    ["staff", "Staff"],
    ["scoring", "Scoring"],
    ["conversion", "Conversion"],
    ["charts", "Charts"],
    ["automation", "Automation"],
    ["actions", "Actions"],
    ["followup-performance", "Follow-Ups"],
    ["lead-health", "Lead Health"],
    ["funnel", "Funnel"],
    ["overview", "Overview"],
  ];

  const AnalyticsSection = AnalyticsSectionWrapper;

  const renderActiveAnalyticsSection = () => {
    if (activeAnalyticsSection === "ai-executive") {
      return (
        <AnalyticsSection
          eyebrow="Real CRM Intelligence"
          title="AI Executive Intelligence Center"
        >
          <AIExecutiveIntelligenceCenter
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            setActiveTab={setActiveTab}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "command") {
      return (
        <AnalyticsSection eyebrow="Enterprise Control" title="CRM Command Center">
          <CrmCommandCenter
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "operations") {
      return (
        <AnalyticsSection
          eyebrow="AI Operations"
          title="Counselor Command Center"
        >
          <CounselorCommandCenter
            inquiries={inquiries}
            appointments={appointments}
            reminders={followUpReminders}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "visa-risk") {
      return (
        <AnalyticsSection eyebrow="Visa Intelligence" title="Visa Risk Analyzer">
          <VisaRiskAnalyzer inquiries={inquiries} appointments={appointments} />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "counselor-ai") {
      return (
        <AnalyticsSection
          eyebrow="Team Intelligence"
          title="Counselor Performance AI"
        >
          <CounselorPerformanceAI
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "workload-ai") {
      return (
        <AnalyticsSection
          eyebrow="Operations Intelligence"
          title="Workload Balancer AI"
        >
          <WorkloadBalancerAI
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "kpi") {
      return (
        <AnalyticsSection eyebrow="Performance Overview" title="KPI Analytics">
          <CrmKpiAnalytics
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "intelligence") {
      return (
        <AnalyticsSection eyebrow="AI Intelligence" title="Lead Intelligence Feed">
          <div className="grid gap-6 2xl:grid-cols-2">
            <AiLeadIntelligenceFeed
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
            <AiLeadPrioritizationPanel
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
          </div>
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "staff") {
      return (
        <AnalyticsSection eyebrow="Team Performance" title="Staff Analytics">
          <div className="grid gap-6 2xl:grid-cols-2">
            <StaffPerformanceAnalytics
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
            <StaffLeaderboard
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
          </div>
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "scoring") {
      return (
        <AnalyticsSection eyebrow="Lead Quality" title="Lead Scoring">
          <LeadScoringAnalytics
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "conversion") {
      return (
        <AnalyticsSection eyebrow="Revenue Movement" title="Conversion Analytics">
          <ConversionAnalytics
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "charts") {
      return (
        <AnalyticsSection eyebrow="Visual Intelligence" title="Luxury Charts">
          <LuxuryAnalyticsCharts
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "automation") {
      return (
        <AnalyticsSection
          eyebrow="Automation Layer"
          title="Escalations, Reminders & Stage Movement"
        >
          <div className="grid gap-6 2xl:grid-cols-2">
            <OverdueEscalationPanel cardClass={cardClass} />

            <AutoReminderGenerator
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />

            <AutoStageMovementPanel
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
              updateInquiryStatus={toggleInquiryStatus}
              updateAppointmentStage={updateAppointmentStage}
              updateAppointmentStatus={updateAppointmentStatus}
            />

            <ProductivityHeatmap
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
              followUpReminders={followUpReminders}
            />
          </div>
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "actions") {
      return (
        <AnalyticsSection eyebrow="Action Center" title="Notification Actions">
          <NotificationActionCenter
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            updateInquiryStatus={toggleInquiryStatus}
            updateAppointmentStatus={updateAppointmentStatus}
            setActiveTab={setActiveTab}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "followup-performance") {
      return (
        <AnalyticsSection
          eyebrow="Follow-Up Health"
          title="Follow-Up Performance Analytics"
        >
          <FollowUpPerformancePanel
            cardClass={cardClass}
            reminders={followUpReminders}
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "lead-health") {
      return (
        <AnalyticsSection
          eyebrow="AI Lead Intelligence"
          title="Lead Health Analytics"
        >
          <LeadHealthPanel
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
            reminders={followUpReminders}
          />
        </AnalyticsSection>
      );
    }

    if (activeAnalyticsSection === "funnel") {
      return (
        <AnalyticsSection eyebrow="Pipeline Health" title="Conversion Funnel">
          <ConversionFunnelChart cardClass={cardClass} inquiries={inquiries} />
        </AnalyticsSection>
      );
    }

    return (
      <AnalyticsSection
        eyebrow="Classic Dashboard"
        title="Overview, Analytics & Timeline"
      >
        <div className="grid gap-6 2xl:grid-cols-2">
          <DashboardAnalytics
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />

          <DashboardOverview
            cardClass={cardClass}
            todayInquiriesCount={todayInquiriesCount}
            todayAppointmentsCount={todayAppointmentsCount}
            latestInquiry={latestInquiry}
            latestAppointment={latestAppointment}
            inquiries={inquiries}
            appointments={appointments}
          />

          <div className="2xl:col-span-2">
            <ActivityTimeline
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
          </div>
        </div>
      </AnalyticsSection>
    );
  };

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="space-y-6"
    >
      <div className="sticky top-3 z-20 rounded-[1.5rem] border border-white/10 bg-black/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {analyticsNavItems.map(([id, label]) => {
            const isActive = activeAnalyticsSection === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveAnalyticsSection(id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  isActive
                    ? "border-[#D4AF37]/60 bg-[#D4AF37] text-black"
                    : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeAnalyticsSection}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveAnalyticsSection()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function AIExecutiveIntelligenceCenter({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  setActiveTab = () => {},
}) {
  const insights = buildAiLeadInsights({ inquiries, appointments });
  const urgentLeads = [
    ...insights.immediateLeads,
    ...insights.highUrgencyLeads,
  ].sort((a, b) => b.ai_score - a.ai_score);

  const topOpportunities = insights.topLeads.slice(0, 6);
  const riskLeads = urgentLeads.slice(0, 6);
  const weakLeads = insights.allLeads
    .filter((lead) => lead.ai_score < 45)
    .slice(0, 6);

  const overdueReminders = followUpReminders.filter((reminder) => {
    const dueDate = reminder.due_date || reminder.reminder_date || reminder.date;
    const status = String(reminder.status || "").toLowerCase();

    if (!dueDate || status === "completed" || status === "done") return false;

    return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  });

  const stats = [
    {
      label: "Analyzed Leads",
      value: insights.totalAnalyzed,
      icon: "🧠",
      tone: "gold",
    },
    {
      label: "Average AI Score",
      value: `${insights.averageScore}/100`,
      icon: "📊",
      tone: "blue",
    },
    {
      label: "Hot + Warm",
      value: insights.hotLeads.length + insights.warmLeads.length,
      icon: "🔥",
      tone: "red",
    },
    {
      label: "Urgent Risks",
      value: urgentLeads.length,
      icon: "🚨",
      tone: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`${cardClass} relative overflow-hidden p-5 sm:p-6`}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
                Executive AI Layer
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                No Silent GPT Calls
              </span>
            </div>

            <h2 className="text-2xl font-black text-white sm:text-4xl">
              CRM Intelligence Command View
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/55">
              This center ranks opportunities, urgency, and weak leads using the existing CRM AI engine. Real GPT is reserved for counselor-generated outputs inside each student workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-3 text-sm font-black text-[#D4AF37] transition hover:-translate-y-0.5 hover:bg-[#D4AF37] hover:text-black"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <ExecutiveStatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-3">
        <ExecutiveLeadList
          title="Top Opportunities"
          eyebrow="Conversion Priority"
          icon="🏆"
          leads={topOpportunities}
          emptyText="No opportunities detected yet."
          tone="gold"
        />

        <ExecutiveLeadList
          title="Urgency Risks"
          eyebrow="Immediate Attention"
          icon="🚨"
          leads={riskLeads}
          emptyText="No urgent risks right now."
          tone="red"
        />

        <ExecutiveLeadList
          title="Weak Leads"
          eyebrow="Nurture / Recovery"
          icon="🌱"
          leads={weakLeads}
          emptyText="No weak leads detected right now."
          tone="blue"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className={`${cardClass} p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
                Follow-Up Pressure
              </p>
              <h3 className="mt-2 text-xl font-black text-white">
                Reminder Risk Monitor
              </h3>
            </div>
            <span className="rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
              {overdueReminders.length} overdue
            </span>
          </div>

          {overdueReminders.length ? (
            <div className="space-y-3">
              {overdueReminders.slice(0, 6).map((reminder, index) => (
                <div
                  key={reminder.id || index}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {reminder.title || reminder.notes || "Follow-up reminder"}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        Due: {formatDate(reminder.due_date || reminder.reminder_date || reminder.date)}
                      </p>
                    </div>
                    <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300">
                      Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No overdue reminders detected." />
          )}
        </div>

        <div className={`${cardClass} p-5`}>
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4AF37]">
              Forecast
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              Conversion Forecast
            </h3>
          </div>

          <div className="space-y-4">
            <ForecastRow
              label="Strong Conversion Pool"
              value={insights.hotLeads.length + insights.warmLeads.length}
              total={Math.max(insights.totalAnalyzed, 1)}
            />
            <ForecastRow
              label="Recovery / Nurture Pool"
              value={weakLeads.length}
              total={Math.max(insights.totalAnalyzed, 1)}
            />
            <ForecastRow
              label="Immediate Counselor Load"
              value={urgentLeads.length}
              total={Math.max(insights.totalAnalyzed, 1)}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.05] p-4 text-sm leading-6 text-white/60">
            Best move: handle urgent risks first, then contact the top opportunities. Use Real GPT inside the student profile only when you need a polished WhatsApp, email, call script, summary, or follow-up plan.
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveStatCard({ stat }) {
  const toneClass =
    stat.tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : stat.tone === "orange"
      ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
      : stat.tone === "blue"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
      : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
          {stat.label}
        </p>
        <span className="text-xl">{stat.icon}</span>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{stat.value}</p>
    </div>
  );
}

function ExecutiveLeadList({ title, eyebrow, icon, leads, emptyText, tone }) {
  const toneClass =
    tone === "red"
      ? "text-red-300 border-red-400/20 bg-red-500/10"
      : tone === "blue"
      ? "text-blue-300 border-blue-400/20 bg-blue-500/10"
      : "text-[#D4AF37] border-[#D4AF37]/20 bg-[#D4AF37]/10";

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
        </div>
        <span className={`rounded-2xl border p-3 text-xl ${toneClass}`}>{icon}</span>
      </div>

      {leads.length ? (
        <div className="space-y-3">
          {leads.map((lead, index) => (
            <div
              key={`${lead.lead_type || "lead"}-${lead.id || index}`}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {lead.full_name || "Unnamed Student"}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {lead.lead_type || "lead"} • {lead.country || lead.country_interest || "No country"}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${toneClass}`}>
                  {lead.ai_score}/100
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/50">
                {lead.ai_recommended_action || lead.ai_urgency?.message || "No recommendation available."}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text={emptyText} />
      )}
    </div>
  );
}

function ForecastRow({ label, value, total }) {
  const percent = Math.min(100, Math.round((value / total) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-white/70">{label}</span>
        <span className="text-white/40">{value} • {percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">
      {text}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "No date";

  return new Date(date).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default AnalyticsPage;
