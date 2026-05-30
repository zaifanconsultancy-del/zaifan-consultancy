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

export default AnalyticsPage;