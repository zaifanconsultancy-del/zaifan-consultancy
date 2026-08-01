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

const CrmKpiAnalytics = lazy(() => import("../workspaces/leads-crm/CrmKpiAnalytics"));
const StaffPerformanceAnalytics = lazy(() => import("../workspaces/team/StaffPerformanceAnalytics"));
const LeadScoringAnalytics = lazy(() => import("../workspaces/leads-crm/LeadScoringAnalytics"));
const ConversionAnalytics = lazy(() => import("../workspaces/leads-crm/ConversionAnalytics"));
const LuxuryAnalyticsCharts = lazy(() => import("../workspaces/intelligence/LuxuryAnalyticsCharts"));
const AiLeadPrioritizationPanel = lazy(() => import("../workspaces/leads-crm/AiLeadPrioritizationPanel"));
const StaffLeaderboard = lazy(() => import("../workspaces/team/StaffLeaderboard"));
const ConversionFunnelChart = lazy(() => import("../workspaces/leads-crm/ConversionFunnelChart"));
const CrmCommandCenter = lazy(() => import("../workspaces/leads-crm/CrmCommandCenter"));
const AiLeadIntelligenceFeed = lazy(() => import("../workspaces/leads-crm/AiLeadIntelligenceFeed"));
import AnalyticsSectionWrapper from "../workspaces/core/AnalyticsSectionWrapper";
const LeadHealthPanel = lazy(() => import("../workspaces/leads-crm/LeadHealthPanel"));
const CounselorCommandCenter = lazy(() => import("../workspaces/team/CounselorCommandCenter"));
const VisaRiskAnalyzer = lazy(() => import("../workspaces/visa/VisaRiskAnalyzer"));
const CounselorPerformanceAI = lazy(() => import("../workspaces/team/CounselorPerformanceAI"));
const WorkloadBalancerAI = lazy(() => import("../workspaces/team/WorkloadBalancerAI"));
const ExecutiveCommandSystem = lazy(() => import("../workspaces/intelligence/ExecutiveCommandSystem"));
const StudentOSMissionControl = lazy(() => import("../workspaces/students/StudentOSMissionControl"));

const INTELLIGENCE_WORKSPACES = Object.freeze({
  "ai-command": {
    eyebrow: "AI Command",
    title: "Executive AI & Lead Intelligence",
    description:
      "Use AI for executive analysis and lead prioritization without mixing in team, risk or workflow operations.",
    icon: BrainCircuit,
    items: [
      { id: "ai-executive", label: "AI Executive", icon: Sparkles },
      { id: "intelligence", label: "AI Feed", icon: Bot },
    ],
  },
  "crm-analytics": {
    eyebrow: "CRM Analytics",
    title: "Performance & Conversion",
    description:
      "Measure CRM performance through KPIs, scoring, conversion, charts and funnel health.",
    icon: BarChart3,
    items: [
      { id: "kpi", label: "KPI Analytics", icon: CircleGauge },
      { id: "scoring", label: "Lead Scoring", icon: Target },
      { id: "conversion", label: "Conversion", icon: ChartNoAxesCombined },
      { id: "charts", label: "CRM Charts", icon: BarChart3 },
      { id: "funnel", label: "Funnel", icon: Funnel },
    ],
  },
  "team-intelligence": {
    eyebrow: "Team Intelligence",
    title: "Counselor & Workforce Intelligence",
    description:
      "Keep counselor operations, AI coaching, workload balancing and staff performance together.",
    icon: UsersRound,
    items: [
      { id: "operations", label: "Counselor Command", icon: BriefcaseBusiness },
      { id: "counselor-ai", label: "Counselor AI", icon: BrainCircuit },
      { id: "workload-ai", label: "Workload AI", icon: Gauge },
      { id: "staff", label: "Staff Analytics", icon: UsersRound },
    ],
  },
  "risk-intelligence": {
    eyebrow: "Risk & Health",
    title: "Student Risk Intelligence",
    description:
      "Focus only on visa risk and student/lead health signals that need intervention.",
    icon: ShieldCheck,
    items: [
      { id: "visa-risk", label: "Visa Risk", icon: ShieldCheck },
      { id: "lead-health", label: "Student Health", icon: HeartPulse },
    ],
  },
  "executive-intelligence": {
    eyebrow: "Executive Intelligence",
    title: "Mission Control & CRM Command",
    description:
      "Leadership-level mission control and CRM command stay together without embedding the rest of the company.",
    icon: Radar,
    items: [
      { id: "mission-control", label: "Mission Control", icon: Radar },
      { id: "command", label: "CRM Command", icon: Command },
    ],
  },
});

const DEFAULT_INTELLIGENCE_WORKSPACE = "crm-analytics";


// AnalyticsPage PARTNER OS EXTREME V2 — Intelligence Command Center

function AnalyticsPage({
  cardClass,
  adminProfile = null,
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
  workspaceMode = DEFAULT_INTELLIGENCE_WORKSPACE,
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
  const workspace =
    INTELLIGENCE_WORKSPACES[workspaceMode] ||
    INTELLIGENCE_WORKSPACES[DEFAULT_INTELLIGENCE_WORKSPACE];

  const analyticsNavItems = workspace.items;

  const effectiveAnalyticsSection = analyticsNavItems.some(
    (item) => item.id === activeAnalyticsSection
  )
    ? activeAnalyticsSection
    : analyticsNavItems[0]?.id;

  const activeAnalyticsNavItem =
    analyticsNavItems.find((item) => item.id === effectiveAnalyticsSection) ||
    analyticsNavItems[0];

  const ActiveAnalyticsNavIcon =
    activeAnalyticsNavItem?.icon || workspace.icon || BarChart3;

  const WorkspaceIcon = workspace.icon || BarChart3;


  const AnalyticsSection = AnalyticsSectionWrapper;

  const renderActiveAnalyticsSection = () => {
    if (effectiveAnalyticsSection === "ai-executive") {
  return (
    <AnalyticsSection
      eyebrow="Real CRM Intelligence"
      title="AI Executive Intelligence Center"
    >
      <div className="space-y-6">
  <ExecutiveCommandSystem
    adminProfile={adminProfile}
    inquiries={inquiries}
    appointments={appointments}
    followUpReminders={followUpReminders}
    executiveExecutionLogs={executiveExecutionLogs}
    studentDocuments={studentDocuments}

    /* Finance OS: forward only real finance records already loaded by Admin. */
    financeInvoices={studentInvoices}
    financePayments={studentPayments}

    /* HR OS: current signed-in Admin is a real person identity.
       Existing CRM work records are forwarded as operational evidence.
       No counselor/staff/leave/recruitment/training rows are fabricated. */
    hrAdminProfiles={adminProfile ? [adminProfile] : []}
    hrTasks={studentTasks}
    hrSupportRequests={supportRequests}
    hrApplications={studentApplications}
  />
</div>
    </AnalyticsSection>
  );
}
if (effectiveAnalyticsSection === "mission-control") {
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

    if (effectiveAnalyticsSection === "command") {
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

    if (effectiveAnalyticsSection === "operations") {
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

    if (effectiveAnalyticsSection === "visa-risk") {
      return (
        <AnalyticsSection eyebrow="Visa Intelligence" title="Visa Risk Analyzer">
          <VisaRiskAnalyzer inquiries={inquiries} appointments={appointments} />
        </AnalyticsSection>
      );
    }

    if (effectiveAnalyticsSection === "counselor-ai") {
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

    if (effectiveAnalyticsSection === "workload-ai") {
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

    if (effectiveAnalyticsSection === "kpi") {
      return (
        <CrmKpiAnalytics
          cardClass={cardClass}
          inquiries={inquiries}
          appointments={appointments}
        />
      );
    }

    if (effectiveAnalyticsSection === "intelligence") {
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

    if (effectiveAnalyticsSection === "staff") {
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

    if (effectiveAnalyticsSection === "scoring") {
      return (
        <LeadScoringAnalytics
          cardClass={cardClass}
          inquiries={inquiries}
          appointments={appointments}
        />
      );
    }

    if (effectiveAnalyticsSection === "conversion") {
      return (
        <ConversionAnalytics
          cardClass={cardClass}
          inquiries={inquiries}
          appointments={appointments}
        />
      );
    }

    if (effectiveAnalyticsSection === "charts") {
      return (
        <LuxuryAnalyticsCharts
          cardClass={cardClass}
          inquiries={inquiries}
          appointments={appointments}
          followUpReminders={followUpReminders}
        />
      );
    }

    if (effectiveAnalyticsSection === "lead-health") {
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

    if (effectiveAnalyticsSection === "funnel") {
      return (
        <ConversionFunnelChart
          cardClass={cardClass}
          inquiries={inquiries}
        />
      );
    }

    return (
      <AnalyticsSection
        eyebrow={workspace.eyebrow}
        title={workspace.title}
      >
        <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-7 text-center shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
          <p className="text-sm font-black text-[#10233F]">
            Select an intelligence module above.
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            This workspace now shows only tools that belong to this intelligence domain.
          </p>
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
      className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5"
    >
      <nav
        aria-label={`${workspace.title} navigation`}
        className="sticky top-3 z-20 min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.12)]"
      >
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <div className="flex min-w-0 items-start gap-4 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200 shadow-inner">
              <WorkspaceIcon size={19} />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-white">
                  Intelligence
                </span>

                <span className="rounded-full border border-[#FF5A0A]/30 bg-orange-400/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-orange-200">
                  {workspace.eyebrow}
                </span>
              </div>

              <h2 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
                {workspace.title}
              </h2>

              <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-200">
                {workspace.description}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-4 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-50">
                Active Module
              </p>

              <p className="mt-2 break-words text-xl font-black text-white">
                {activeAnalyticsNavItem?.label || workspace.title}
              </p>

              <p className="mt-1 text-[10px] font-semibold text-orange-50">
                {analyticsNavItems.length} focused modules
              </p>
            </div>

            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white shadow-inner">
              <ActiveAnalyticsNavIcon size={18} />
            </span>
          </div>
        </div>

        <div className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-3 sm:p-4">
          <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {analyticsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = effectiveAnalyticsSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveAnalyticsSection(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group min-w-0 rounded-[1.1rem] border-[3px] px-3.5 py-3 text-left shadow-[0_5px_14px_rgba(18,56,101,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                    isActive
                      ? "border-[#FF5A0A] bg-white text-[#10233F] shadow-[0_8px_20px_rgba(18,56,101,0.08)]"
                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#123865] hover:bg-[#F2F7FF]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
                        isActive
                          ? "border-[#FF5A0A] bg-[#FF5A0A] text-white"
                          : "border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]"
                      }`}
                    >
                      <Icon size={14} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[10px] font-black uppercase tracking-[0.08em]">
                        {item.label}
                      </span>

                      <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.08em] text-slate-400">
                        {isActive ? "Open module" : "View module"}
                      </span>
                    </span>
                  </span>

                  <span
                    className={`mt-3 block h-1.5 overflow-hidden rounded-full ${
                      isActive ? "bg-orange-100" : "bg-slate-100"
                    }`}
                  >
                    <span
                      className={`block h-full rounded-full transition-all duration-300 ${
                        isActive ? "w-full bg-[#FF5A0A]" : "w-0 bg-[#123865]"
                      } group-hover:w-full`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveAnalyticsSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="min-w-0"
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
    <div className="flex min-h-[300px] items-center justify-center rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-6 shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-[#FF5A0A]" />
        <p className="mt-4 text-sm font-black text-[#10233F]">Opening intelligence module</p>
        <p className="mt-1 text-xs text-slate-400">Loading only this analytics workspace.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
