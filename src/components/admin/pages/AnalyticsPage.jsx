import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleGauge,
  Command,
  Funnel,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";

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
  const analyticsNavGroups = [
    {
      id: "command",
      eyebrow: "Live Intelligence",
      title: "Command & AI",
      icon: Sparkles,
      tone: "orange",
      items: [
        { id: "ai-executive", label: "AI Executive", icon: Sparkles },
        { id: "mission-control", label: "Mission Control", icon: Radar },
        { id: "command", label: "CRM Command", icon: Command },
        { id: "operations", label: "Ops Center", icon: BriefcaseBusiness },
        { id: "intelligence", label: "AI Feed", icon: Bot },
      ],
    },
    {
      id: "people",
      eyebrow: "Risk & Team",
      title: "People Intelligence",
      icon: UsersRound,
      tone: "blue",
      items: [
        { id: "visa-risk", label: "Visa Risk", icon: ShieldCheck },
        { id: "counselor-ai", label: "Counselor AI", icon: BrainCircuit },
        { id: "workload-ai", label: "Workload AI", icon: Gauge },
        { id: "staff", label: "Staff Analytics", icon: UsersRound },
        { id: "lead-health", label: "Lead Health", icon: HeartPulse },
      ],
    },
    {
      id: "performance",
      eyebrow: "Performance",
      title: "CRM Analytics",
      icon: BarChart3,
      tone: "green",
      items: [
        { id: "kpi", label: "KPI Analytics", icon: CircleGauge },
        { id: "scoring", label: "Lead Scoring", icon: Target },
        { id: "conversion", label: "Conversion", icon: ChartNoAxesCombined },
        { id: "charts", label: "CRM Charts", icon: BarChart3 },
        { id: "funnel", label: "Funnel", icon: Funnel },
      ],
    },
    {
      id: "execution",
      eyebrow: "Execution",
      title: "Workflow & Control",
      icon: Workflow,
      tone: "violet",
      items: [
        { id: "automation", label: "Automation", icon: Workflow },
        { id: "actions", label: "Action Center", icon: ListChecks },
        { id: "followup-performance", label: "Follow-Ups", icon: HeartPulse },
        { id: "overview", label: "Overview", icon: LayoutDashboard },
      ],
    },
  ];

  const analyticsNavItems = analyticsNavGroups.flatMap((group) => group.items);

  const activeAnalyticsNavItem =
    analyticsNavItems.find((item) => item.id === activeAnalyticsSection) ||
    analyticsNavItems[0];

  const activeAnalyticsGroup =
    analyticsNavGroups.find((group) =>
      group.items.some((item) => item.id === activeAnalyticsSection)
    ) || analyticsNavGroups[0];

  const ActiveAnalyticsNavIcon =
    activeAnalyticsNavItem?.icon || LayoutDashboard;

  const ActiveAnalyticsGroupIcon =
    activeAnalyticsGroup?.icon || BarChart3;

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
          <div className="space-y-6">
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
          <div className="space-y-7">
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
          <div className="space-y-7">
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
        <div className="space-y-7">
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

          <ActivityTimeline
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />
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
      <nav
        aria-label="Analytics workspace navigation"
        className="sticky top-3 z-20 min-w-0 rounded-[2rem] border-[3px] border-[#173F6B] bg-[#FFFDF8] p-3 shadow-[0_16px_44px_rgba(15,35,63,0.10)] sm:p-4"
      >
        <div className="mb-3 flex min-w-0 flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#F97316] bg-[#173F6B] p-4 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
              <ActiveAnalyticsGroupIcon size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                Analytics Workspace Navigator
              </p>

              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="break-words text-lg font-black leading-6 text-white">
                  {activeAnalyticsNavItem.label}
                </h2>

                <span className="rounded-full border-2 border-orange-300/40 bg-orange-400/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-orange-200">
                  {activeAnalyticsGroup.title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/70">
                Current Module
              </p>
              <p className="mt-0.5 text-sm font-black text-white">
                {analyticsNavItems.findIndex((item) => item.id === activeAnalyticsSection) + 1}
                /{analyticsNavItems.length}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-orange-200">
              <ActiveAnalyticsNavIcon size={17} />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {analyticsNavGroups.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = group.items.some(
              (item) => item.id === activeAnalyticsSection
            );

            const groupTheme =
              group.tone === "orange"
                ? {
                    shell: "border-[#F97316] bg-[#FFF4E8]",
                    icon: "border-[#F97316] bg-[#E96512] text-white",
                    eyebrow: "text-orange-700",
                  }
                : group.tone === "green"
                ? {
                    shell: "border-[#34D399] bg-[#F0FFF8]",
                    icon: "border-[#34D399] bg-[#047857] text-white",
                    eyebrow: "text-emerald-700",
                  }
                : group.tone === "violet"
                ? {
                    shell: "border-[#9B6CFF] bg-[#F8F5FF]",
                    icon: "border-[#9B6CFF] bg-[#6D28D9] text-white",
                    eyebrow: "text-violet-700",
                  }
                : {
                    shell: "border-[#60A5FA] bg-[#F2F7FF]",
                    icon: "border-[#60A5FA] bg-[#315B88] text-white",
                    eyebrow: "text-blue-700",
                  };

            return (
              <section
                key={group.id}
                className={`min-w-0 rounded-[1.45rem] border-[3px] p-3 transition ${
                  groupActive
                    ? `${groupTheme.shell} shadow-[0_8px_20px_rgba(15,35,63,0.06)]`
                    : "border-[#C9D7E6] bg-white"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3 px-1 pb-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
                      groupActive
                        ? groupTheme.icon
                        : "border-[#C9D7E6] bg-[#FFF8EE] text-[#173F6B]"
                    }`}
                  >
                    <GroupIcon size={17} />
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-[8px] font-black uppercase tracking-[0.11em] ${
                        groupActive ? groupTheme.eyebrow : "text-slate-500"
                      }`}
                    >
                      {group.eyebrow}
                    </p>

                    <h3 className="mt-0.5 break-words text-sm font-black leading-5 text-[#10233F]">
                      {group.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeAnalyticsSection === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveAnalyticsSection(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`group flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition duration-200 ${
                          isActive
                            ? "border-[#F97316] bg-[#E96512] text-white shadow-[0_6px_16px_rgba(249,115,22,0.18)]"
                            : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4E8]"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                            isActive
                              ? "border-white/25 bg-white/10 text-white"
                              : "border-[#D1DCE7] bg-[#FFF8EE] text-[#173F6B] group-hover:border-orange-200 group-hover:text-orange-700"
                          }`}
                        >
                          <Icon size={13} />
                        </span>

                        <span className="min-w-0 flex-1 break-words text-[11px] font-black leading-4">
                          {item.label}
                        </span>

                        <span
                          className={`shrink-0 text-xs font-black ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        >
                          ↗
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </nav>

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
