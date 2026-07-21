import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DashboardAnalytics = lazy(() => import("../DashboardAnalytics"));
const DashboardOverview = lazy(() => import("../DashboardOverview"));
const ActivityTimeline = lazy(() => import("../ActivityTimeline"));
const CrmKpiAnalytics = lazy(() => import("../CrmKpiAnalytics"));
const StaffPerformanceAnalytics = lazy(() => import("../StaffPerformanceAnalytics"));
const LeadScoringAnalytics = lazy(() => import("../LeadScoringAnalytics"));
const ConversionAnalytics = lazy(() => import("../ConversionAnalytics"));
const OverdueEscalationPanel = lazy(() => import("../OverdueEscalationPanel"));
const AutoReminderGenerator = lazy(() => import("../AutoReminderGenerator"));
const LuxuryAnalyticsCharts = lazy(() => import("../LuxuryAnalyticsCharts"));
const AiLeadPrioritizationPanel = lazy(() => import("../AiLeadPrioritizationPanel"));
const StaffLeaderboard = lazy(() => import("../StaffLeaderboard"));
const AutoStageMovementPanel = lazy(() => import("../AutoStageMovementPanel"));
const ProductivityHeatmap = lazy(() => import("../ProductivityHeatmap"));
const NotificationActionCenter = lazy(() => import("../NotificationActionCenter"));
const FollowUpPerformancePanel = lazy(() => import("../FollowUpPerformancePanel"));
const ConversionFunnelChart = lazy(() => import("../ConversionFunnelChart"));
const CrmCommandCenter = lazy(() => import("../CrmCommandCenter"));
const AiLeadIntelligenceFeed = lazy(() => import("../AiLeadIntelligenceFeed"));
import AnalyticsSectionWrapper from "../AnalyticsSectionWrapper";
const LeadHealthPanel = lazy(() => import("../LeadHealthPanel"));
const CounselorCommandCenter = lazy(() => import("../CounselorCommandCenter"));
const VisaRiskAnalyzer = lazy(() => import("../VisaRiskAnalyzer"));
const CounselorPerformanceAI = lazy(() => import("../CounselorPerformanceAI"));
const WorkloadBalancerAI = lazy(() => import("../WorkloadBalancerAI"));
const ExecutiveCommandSystem = lazy(() => import("../ExecutiveCommandSystem"));
const StudentOSMissionControl = lazy(() => import("../StudentOSMissionControl"));

function AnalyticsPage({
  cardClass,
  inquiries = [],
  appointments = [],
  followUpReminders = [],

  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],

  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  studentPortalAccounts = [],
  supportRequests = [],
  counselorPaymentRequests = [],
  executiveExecutionLogs = [],
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
    ["mission-control", "Mission Control"],
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
      <div className="space-y-6">
  <ExecutiveCommandSystem
    executiveExecutionLogs={executiveExecutionLogs}
    studentRiskScores={studentRiskScores}
    studentApplications={studentApplications}
    studentTasks={studentTasks}
    supportRequests={supportRequests}
    counselorPaymentRequests={counselorPaymentRequests}
  />
</div>
    </AnalyticsSection>
  );
}
if (activeAnalyticsSection === "mission-control") {
  return (
    <AnalyticsSection
      eyebrow="Student OS Executive Layer"
      title="Mission Control"
    >
      <StudentOSMissionControl
        cardClass={cardClass}
        studentApplications={studentApplications}
        studentDocuments={studentDocuments}
        studentTasks={studentTasks}
        studentUniversities={studentUniversities}
        studentRiskScores={studentRiskScores}
        studentInvoices={studentInvoices}
        studentPayments={studentPayments}
        studentReceipts={studentReceipts}
        studentPortalAccounts={studentPortalAccounts}
        supportRequests={supportRequests}
        counselorPaymentRequests={counselorPaymentRequests}
        executiveExecutionLogs={executiveExecutionLogs}
        inquiries={inquiries}
        appointments={appointments}
        followUpReminders={followUpReminders}
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
  eyebrow="Student OS Intelligence"
  title="Student Success Health"
>
          <LeadHealthPanel
  cardClass={cardClass}
  inquiries={inquiries}
  appointments={appointments}
  reminders={followUpReminders}

  studentApplications={studentApplications}
  studentDocuments={studentDocuments}
  studentTasks={studentTasks}
  studentUniversities={studentUniversities}
  studentRiskScores={studentRiskScores}
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
      <div className="sticky top-3 z-20 rounded-[1.4rem] border border-slate-200/80 bg-white/95 p-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
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
                    ? "border-orange-500 bg-orange-500 text-white shadow-[0_6px_18px_rgba(249,115,22,0.18)]"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
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
          <Suspense fallback={<AnalyticsModuleLoader />}>
            {renderActiveAnalyticsSection()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function AnalyticsModuleLoader() {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-800">Opening intelligence module</p>
        <p className="mt-1 text-xs text-slate-400">Loading only this analytics workspace.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
