import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Bot,
  BrainCircuit,
  CalendarDays,
  CircleAlert,
  Database,
  FileSearch,
  Gauge,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  WandSparkles,
} from "lucide-react";

import SearchToolbar from "../workspaces/core/SearchToolbar";
import DashboardContent from "../workspaces/core/DashboardContent";

const EASE = [0.22, 1, 0.36, 1];

// PipelinePage PARTNER OS EXTREME V2 — CRM Pipeline Command Center

function PipelinePage({
  activeTab,
  search,
  setSearch,
  statusOptions,
  statusFilter,
  setStatusFilter,
  loading,
  inquiries = [],
  filteredInquiries = [],
  appointments = [],
  filteredAppointments = [],
  allLeads = [],
  cardClass,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  deleteInquiry,
  updateAppointmentStatus,
  updateAppointmentStage,
  deleteAppointment,
  role,
  adminProfile,
  permissions,
  reanalyzeLeadWithGpt = null,
  aiReanalysisState = {
    loading: false,
    leadId: null,
    leadType: null,
    message: "",
    error: "",
  },
}) {
  const shouldReduceMotion = useReducedMotion();

  const isAppointments = activeTab === "appointments";

  const visibleRecords = useMemo(
    () => (isAppointments ? filteredAppointments : filteredInquiries),
    [filteredAppointments, filteredInquiries, isAppointments]
  );

  const allCurrentRecords = useMemo(
    () => (isAppointments ? appointments : inquiries),
    [appointments, inquiries, isAppointments]
  );

  const visibleCount = visibleRecords.length;
  const totalCount = allCurrentRecords.length;

  const completeAllLeads = useMemo(
    () =>
      allLeads.length > 0
        ? allLeads
        : [
            ...inquiries.map((lead) => ({
              ...lead,
              student_type: lead.student_type || "inquiry",
              __leadType: "inquiry",
            })),
            ...appointments.map((lead) => ({
              ...lead,
              student_type: lead.student_type || "appointment",
              __leadType: "appointment",
            })),
          ],
    [allLeads, appointments, inquiries]
  );

  const pipelineMeta = isAppointments
    ? {
        eyebrow: "Consultation Operations",
        title: "Appointment Pipeline",
        description:
          "Manage consultation bookings, confirmations, stages, priorities, counselor actions, and student conversion readiness from one operating workspace.",
        icon: CalendarDays,
      }
    : {
        eyebrow: "Student Acquisition",
        title: "Inquiry Pipeline",
        description:
          "Review new student interest, qualify intent, prioritize opportunities, track follow-ups, and move each lead toward the right next action.",
        icon: UsersRound,
      };

  const metrics = useMemo(() => {
    const normalizedStatus = (record) =>
      String(record.status || record.stage || "")
        .trim()
        .toLowerCase();

    const urgentCount = allCurrentRecords.filter((record) => {
      const priority = String(record.priority || "")
        .trim()
        .toLowerCase();

      return (
        priority === "high" ||
        priority === "urgent" ||
        priority === "critical"
      );
    }).length;

    const activeCount = allCurrentRecords.filter((record) => {
      const status = normalizedStatus(record);

      return ![
        "completed",
        "cancelled",
        "canceled",
        "closed",
        "rejected",
      ].includes(status);
    }).length;

    const completedCount = allCurrentRecords.filter((record) => {
      const status = normalizedStatus(record);

      return ["completed", "closed", "converted"].includes(status);
    }).length;

    const withStoredGpt = completeAllLeads.filter(
      (lead) =>
        lead.gpt_intelligence ||
        lead.gpt_summary ||
        lead.gpt_ai_score !== null &&
          lead.gpt_ai_score !== undefined
    ).length;

    return {
      urgentCount,
      activeCount,
      completedCount,
      withStoredGpt,
      gptPercent: completeAllLeads.length
        ? Math.round((withStoredGpt / completeAllLeads.length) * 100)
        : 0,
    };
  }, [allCurrentRecords, completeAllLeads]);

  const PipelineIcon = pipelineMeta.icon;

  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.45, ease: EASE },
      };

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <motion.section
        {...motionProps}
        className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]"
      >
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-white">
                    <PipelineIcon size={14} />
                    {pipelineMeta.eyebrow}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-white">
                    <Database size={14} /> Live CRM Queue
                  </span>
                </div>

                <h1 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                  {pipelineMeta.title}
                </h1>
                <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
                  {pipelineMeta.description}
                </p>

                <div className="mt-5 grid min-w-0 max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3">
                  <HeroMetric label="Visible Queue" value={visibleCount} />
                  <HeroMetric label="Active Cases" value={metrics.activeCount} />
                  <HeroMetric label="High Priority" value={metrics.urgentCount} />
                </div>
              </div>

              <div className="grid min-w-0 w-full gap-2 sm:grid-cols-2 xl:w-[360px]">
                <WorkspaceSignal icon={BrainCircuit} label="Local Intelligence" value="Always active" tone="navy" />
                <WorkspaceSignal icon={WandSparkles} label="GPT Intelligence" value={aiReanalysisState.loading ? "Analyzing now" : "Manual & saved"} tone="orange" active={aiReanalysisState.loading} />
                <WorkspaceSignal icon={Layers3} label="Executive Context" value={`${completeAllLeads.length} records`} tone="blue" />
                <WorkspaceSignal icon={Target} label="GPT Coverage" value={`${metrics.gptPercent}%`} tone="emerald" />
              </div>
            </div>
          </div>

          <aside className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-white">Pipeline Health</p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-black text-white">{metrics.urgentCount > 0 ? "Needs action" : "On track"}</p>
                <p className="mt-1 text-xs font-bold text-white">{metrics.urgentCount} high-priority record{metrics.urgentCount === 1 ? "" : "s"} in this queue.</p>
              </div>
              <Sparkles size={28} />
            </div>
            <div className="mt-5 rounded-[1.2rem] border-2 border-white/25 bg-white/10 p-4">
              <p className="text-[9px] font-black uppercase tracking-[.12em] text-white">Pipeline Total</p>
              <p className="mt-1 text-2xl font-black text-white">{totalCount}</p>
            </div>
          </aside>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:p-5">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={FileSearch} label="Visible records" value={visibleCount} detail={`of ${totalCount} in this pipeline`} tone="navy" />
            <MetricCard icon={Activity} label="Active cases" value={metrics.activeCount} detail="currently in motion" tone="blue" />
            <MetricCard icon={CircleAlert} label="High priority" value={metrics.urgentCount} detail="need closer attention" tone="orange" />
            <MetricCard icon={Gauge} label="Completed" value={metrics.completedCount} detail="closed or converted" tone="emerald" />
          </div>

          <div className="mt-4 min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Search size={15} className="text-[#FF5A0A]" />
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#FF5A0A]">Find & Filter</p>
                </div>
                <p className="mt-1 text-sm font-black text-[#10233F]">Pipeline controls</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] text-slate-600">Showing {visibleCount}</span>
                {statusFilter !== "All" ? <span className="rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] text-orange-700">{statusFilter}</span> : null}
              </div>
            </div>
            <SearchToolbar activeTab={activeTab} search={search} setSearch={setSearch} statusOptions={statusOptions} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
          </div>
        </div>
      </motion.section>

      <div className="flex min-w-0 flex-col gap-2 rounded-[1.35rem] border-[3px] border-[#123865] bg-white px-4 py-3 text-xs font-semibold text-[#35506f] shadow-[0_8px_22px_rgba(18,56,101,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><Bot size={15} className="text-[#FF5A0A]" /><span>Local AI supports prioritization automatically. GPT remains a deliberate, saved action for deeper student intelligence.</span></div>
        <div className="shrink-0 font-black text-[#123865]">{adminProfile?.full_name || "Admin"} · {role || "staff"}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: shouldReduceMotion ? 0 : 0.38, ease: EASE }}>
          <DashboardContent
            loading={loading}
            activeTab={activeTab}
            inquiries={inquiries}
            filteredInquiries={filteredInquiries}
            appointments={appointments}
            filteredAppointments={filteredAppointments}
            allLeads={completeAllLeads}
            cardClass={cardClass}
            updateInquiryStatus={toggleInquiryStatus}
            updateInquiryPriority={updateInquiryPriority}
            updateAppointmentPriority={updateAppointmentPriority}
            deleteInquiry={deleteInquiry}
            updateAppointmentStatus={updateAppointmentStatus}
            updateAppointmentStage={updateAppointmentStage}
            deleteAppointment={deleteAppointment}
            role={role}
            adminProfile={adminProfile}
            permissions={permissions}
            reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
            aiReanalysisState={aiReanalysisState}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WorkspaceSignal({ icon: Icon, label, value, tone = "navy", active = false }) {
  const toneClass = tone === "orange" ? "border-orange-200 bg-[#FFF4E8] text-orange-700" : tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-700" : tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-white/35 bg-white/10 text-white";
  return (
    <div className={`min-w-0 rounded-[1.2rem] border-[3px] p-3.5 shadow-[0_6px_16px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-md ${toneClass} ${active ? "animate-pulse" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === "navy" ? "bg-white text-[#123865]" : "bg-white"} shadow-sm`}><Icon size={17} strokeWidth={2.1} /></div>
        <div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[0.13em] opacity-80">{label}</p><p className="mt-0.5 truncate text-xs font-black">{value}</p></div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 px-4 py-3 text-white shadow-inner"><p className="text-[8px] font-black uppercase tracking-[.12em] text-white">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = "navy" }) {
  const toneClass = tone === "blue" ? "border-blue-400 bg-blue-50 text-blue-700" : tone === "orange" ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-700" : tone === "emerald" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-[#123865] bg-[#F2F7FF] text-[#123865]";
  return (
    <div className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
      <div className="flex items-center justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/15 bg-white shadow-sm"><Icon size={17} strokeWidth={2.1} /></div><span className="text-2xl font-black tracking-tight">{value}</span></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.1em]">{label}</p><p className="mt-1 text-xs font-semibold opacity-75">{detail}</p>
    </div>
  );
}

export default PipelinePage;
