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

import SearchToolbar from "../SearchToolbar";
import DashboardContent from "../DashboardContent";

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

  const visibleRecords = isAppointments
    ? filteredAppointments
    : filteredInquiries;

  const allCurrentRecords = isAppointments ? appointments : inquiries;

  const visibleCount = visibleRecords.length;
  const totalCount = allCurrentRecords.length;

  const completeAllLeads =
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
        ];

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
        className="relative overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-6 xl:p-7"
      >
        <div className="pointer-events-none absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-orange-100/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-120px] left-[22%] h-56 w-56 rounded-full bg-amber-50 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start 2xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                  <Sparkles size={12} />
                  {pipelineMeta.eyebrow}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  <Database size={12} />
                  Single source of truth
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                  <ShieldCheck size={12} />
                  Role-aware actions
                </span>
              </div>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_12px_28px_rgba(249,115,22,0.2)]">
                  <PipelineIcon size={24} strokeWidth={2.1} />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl xl:text-[2.2rem]">
                    {pipelineMeta.title}
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                    {pipelineMeta.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:w-[420px]">
              <WorkspaceSignal
                icon={BrainCircuit}
                label="Local intelligence"
                value="Always active"
                tone="violet"
              />

              <WorkspaceSignal
                icon={WandSparkles}
                label="GPT intelligence"
                value={
                  aiReanalysisState.loading
                    ? "Analyzing now"
                    : "Manual & saved"
                }
                tone="orange"
                active={aiReanalysisState.loading}
              />

              <WorkspaceSignal
                icon={Layers3}
                label="Executive context"
                value={`${completeAllLeads.length} records`}
                tone="blue"
              />

              <WorkspaceSignal
                icon={Target}
                label="GPT coverage"
                value={`${metrics.gptPercent}%`}
                tone="emerald"
              />
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={FileSearch}
              label="Visible records"
              value={visibleCount}
              detail={`of ${totalCount} in this pipeline`}
              tone="slate"
            />

            <MetricCard
              icon={Activity}
              label="Active cases"
              value={metrics.activeCount}
              detail="currently in motion"
              tone="blue"
            />

            <MetricCard
              icon={CircleAlert}
              label="High priority"
              value={metrics.urgentCount}
              detail="need closer attention"
              tone="orange"
            />

            <MetricCard
              icon={Gauge}
              label="Completed"
              value={metrics.completedCount}
              detail="closed or converted"
              tone="emerald"
            />
          </div>
        </div>
      </motion.section>

      <motion.section
        {...motionProps}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 0.45, delay: 0.04, ease: EASE }
        }
        className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:p-5"
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Search size={16} className="text-orange-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                Find & filter
              </p>
            </div>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Pipeline controls
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Search students quickly and narrow the workspace by the statuses
              that matter right now.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-500">
              Showing {visibleCount}
            </span>

            {statusFilter !== "All" && (
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-orange-700">
                Filter: {statusFilter}
              </span>
            )}

            {search ? (
              <span className="max-w-[220px] truncate rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">
                Search: {search}
              </span>
            ) : null}
          </div>
        </div>

        <SearchToolbar
          activeTab={activeTab}
          search={search}
          setSearch={setSearch}
          statusOptions={statusOptions}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </motion.section>

      <div className="flex flex-col gap-2 rounded-[1.3rem] border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-orange-500" />
          <span>
            Local AI supports prioritization automatically. GPT remains a
            deliberate, saved action for deeper student intelligence.
          </span>
        </div>

        <div className="shrink-0 font-bold text-slate-400">
          {adminProfile?.full_name || "Admin"} · {role || "staff"}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.38,
            ease: EASE,
          }}
        >
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

function WorkspaceSignal({
  icon: Icon,
  label,
  value,
  tone = "slate",
  active = false,
}) {
  const toneClass =
    tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : tone === "violet"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div
      className={`rounded-2xl border p-3.5 ${toneClass} ${
        active ? "animate-pulse" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/75 shadow-sm">
          <Icon size={17} strokeWidth={2.1} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.13em] opacity-70">
            {label}
          </p>
          <p className="mt-0.5 truncate text-xs font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "slate" }) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-blue-50/70 text-blue-700"
      : tone === "orange"
      ? "border-orange-100 bg-orange-50/80 text-orange-700"
      : tone === "emerald"
      ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div
      className={`rounded-[1.25rem] border p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-sm ${toneClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon size={17} strokeWidth={2.1} />
        </div>

        <span className="text-2xl font-black tracking-tight text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] opacity-75">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium opacity-65">{detail}</p>
    </div>
  );
}

export default PipelinePage;
