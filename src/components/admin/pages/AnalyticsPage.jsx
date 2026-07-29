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
        <AnalyticsSection eyebrow="Performance Overview" title="KPI Analytics">
          <CrmKpiAnalytics
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
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
        <AnalyticsSection eyebrow="Lead Quality" title="Lead Scoring">
          <LeadScoringAnalytics
            cardClass={cardClass}
            inquiries={inquiries}
            appointments={appointments}
          />
        </AnalyticsSection>
      );
    }

    if (effectiveAnalyticsSection === "conversion") {
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

    if (effectiveAnalyticsSection === "charts") {
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
        <AnalyticsSection eyebrow="Pipeline Health" title="Conversion Funnel">
          <ConversionFunnelChart cardClass={cardClass} inquiries={inquiries} />
        </AnalyticsSection>
      );
    }

    return (
      <AnalyticsSection
        eyebrow={workspace.eyebrow}
        title={workspace.title}
      >
        <div className="rounded-[1.4rem] border-2 border-slate-200 bg-white p-6 text-center">
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
      className="space-y-6"
    >
      <nav
        aria-label={`${workspace.title} navigation`}
        className="sticky top-3 z-20 overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_16px_42px_rgba(15,35,63,0.09)]"
      >
        <div className="grid xl:grid-cols-[1.3fr_0.7fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    Intelligence
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    {workspace.eyebrow}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {workspace.title}
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
                  {workspace.description}
                </p>
              </div>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
                <WorkspaceIcon size={20} />
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <IntelligenceHeroMetric
                label="Modules"
                value={analyticsNavItems.length}
              />
              <IntelligenceHeroMetric
                label="Active"
                value={activeAnalyticsNavItem?.label || "Module"}
              />
              <IntelligenceHeroMetric
                label="Mode"
                value="Live CRM"
              />
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
              Intelligence Focus
            </p>

            <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
              {activeAnalyticsNavItem?.label || workspace.title}
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-white">
              Only the selected intelligence module is loaded here, keeping the
              workspace focused and operational.
            </p>

            <div className="mt-5 rounded-2xl border border-white/30 bg-white/10 p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                Current Workspace
              </p>
              <div className="mt-2 flex items-center gap-2">
                <ActiveAnalyticsNavIcon size={16} />
                <p className="text-sm font-black text-white">
                  {activeAnalyticsNavItem?.label || "Intelligence Module"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-3 sm:p-4">
          <div className="flex min-w-0 gap-2 overflow-x-auto">
            {analyticsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = effectiveAnalyticsSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveAnalyticsSection(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-[11px] font-black transition duration-200 ${
                    isActive
                      ? "border-orange-600 bg-orange-500 text-white shadow-[0_6px_14px_rgba(249,115,22,0.16)]"
                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.div
          key={effectiveAnalyticsSection}
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

function IntelligenceHeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function AnalyticsModuleLoader() {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-[1.6rem] border-[3px] border-orange-300 bg-[#FFF8EF] shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-[#10233F]">Opening intelligence module</p>
        <p className="mt-1 text-xs text-slate-400">Loading only this analytics workspace.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
