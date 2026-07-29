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
    <div className="space-y-5">
      <motion.section
        {...motionProps}
        className="overflow-hidden rounded-[2rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_18px_50px_rgba(23,36,61,.10)]"
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
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

                <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {pipelineMeta.title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
                  {pipelineMeta.description}
                </p>

                <div className="mt-5 grid max-w-3xl gap-2 sm:grid-cols-3">
                  <HeroMetric label="Visible Queue" value={visibleCount} />
                  <HeroMetric label="Active Cases" value={metrics.activeCount} />
                  <HeroMetric label="High Priority" value={metrics.urgentCount} />
                </div>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-[360px]">
                <WorkspaceSignal icon={BrainCircuit} label="Local Intelligence" value="Always active" tone="navy" />
                <WorkspaceSignal icon={WandSparkles} label="GPT Intelligence" value={aiReanalysisState.loading ? "Analyzing now" : "Manual & saved"} tone="orange" active={aiReanalysisState.loading} />
                <WorkspaceSignal icon={Layers3} label="Executive Context" value={`${completeAllLeads.length} records`} tone="blue" />
                <WorkspaceSignal icon={Target} label="GPT Coverage" value={`${metrics.gptPercent}%`} tone="emerald" />
              </div>
            </div>
          </div>

          <aside className="border-t-[3px] border-orange-300 bg-[#FF5A0A] p-5 text-white lg:border-l-[3px] lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-white">Pipeline Health</p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl font-black text-white">{metrics.urgentCount > 0 ? "Needs action" : "On track"}</p>
                <p className="mt-1 text-xs font-bold text-white">{metrics.urgentCount} high-priority record{metrics.urgentCount === 1 ? "" : "s"} in this queue.</p>
              </div>
              <Sparkles size={28} />
            </div>
            <div className="mt-5 rounded-2xl border border-white/35 bg-white/10 p-4">
              <p className="text-[9px] font-black uppercase tracking-[.12em] text-white">Pipeline Total</p>
              <p className="mt-1 text-2xl font-black text-white">{totalCount}</p>
            </div>
          </aside>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={FileSearch} label="Visible records" value={visibleCount} detail={`of ${totalCount} in this pipeline`} tone="navy" />
            <MetricCard icon={Activity} label="Active cases" value={metrics.activeCount} detail="currently in motion" tone="blue" />
            <MetricCard icon={CircleAlert} label="High priority" value={metrics.urgentCount} detail="need closer attention" tone="orange" />
            <MetricCard icon={Gauge} label="Completed" value={metrics.completedCount} detail="closed or converted" tone="emerald" />
          </div>

          <div className="mt-4 rounded-[1.5rem] border-2 border-[#123865] bg-white p-3 sm:p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Search size={15} className="text-[#FF5A0A]" />
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#FF5A0A]">Find & Filter</p>
                </div>
                <p className="mt-1 text-sm font-black text-[#10233F]">Pipeline controls</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] text-slate-600">Showing {visibleCount}</span>
                {statusFilter !== "All" ? <span className="rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-[.1em] text-orange-700">{statusFilter}</span> : null}
              </div>
            </div>
            <SearchToolbar activeTab={activeTab} search={search} setSearch={setSearch} statusOptions={statusOptions} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
          </div>
        </div>
      </motion.section>

      <div className="flex flex-col gap-2 rounded-[1.3rem] border-2 border-[#123865] bg-[#edf3f9] px-4 py-3 text-xs font-semibold text-[#35506f] sm:flex-row sm:items-center sm:justify-between">
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
  const toneClass = tone === "orange" ? "border-orange-200 bg-orange-50 text-orange-700" : tone === "blue" ? "border-blue-200 bg-blue-50 text-blue-700" : tone === "emerald" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-white/35 bg-white/10 text-white";
  return (
    <div className={`rounded-[1.2rem] border-2 p-3.5 shadow-[0_5px_14px_rgba(15,35,63,0.08)] ${toneClass} ${active ? "animate-pulse" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === "navy" ? "bg-white text-[#123865]" : "bg-white"} shadow-sm`}><Icon size={17} strokeWidth={2.1} /></div>
        <div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[0.13em] opacity-80">{label}</p><p className="mt-0.5 truncate text-xs font-black">{value}</p></div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3"><p className="text-[8px] font-black uppercase tracking-[.12em] text-white">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>;
}

function MetricCard({ icon: Icon, label, value, detail, tone = "navy" }) {
  const toneClass = tone === "blue" ? "border-blue-400 bg-blue-50 text-blue-700" : tone === "orange" ? "border-orange-400 bg-orange-50 text-orange-700" : tone === "emerald" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-[#123865] bg-[#edf3f9] text-[#123865]";
  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 transition hover:-translate-y-.5 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/15 bg-white shadow-sm"><Icon size={17} strokeWidth={2.1} /></div><span className="text-2xl font-black tracking-tight">{value}</span></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.1em]">{label}</p><p className="mt-1 text-xs font-semibold opacity-75">{detail}</p>
    </div>
  );
}

export default PipelinePage;
