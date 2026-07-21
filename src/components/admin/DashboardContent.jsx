import { lazy, Suspense, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Bot,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Crown,
  Grid3X3,
  LayoutList,
  LoaderCircle,
  LockKeyhole,
  Radar,
  Sparkles,
  Target,
  UserCheck,
  UserRoundSearch,
  UsersRound,
  WandSparkles,
} from "lucide-react";

import InquiryCard from "./InquiryCard";
import AppointmentCard from "./AppointmentCard";
import AnimatedSection from "./AnimatedSection";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";

const StudentDetailModal = lazy(() => import("./StudentDetailModal"));

const EASE = [0.22, 1, 0.36, 1];

function DashboardContent({
  loading = false,
  activeTab = "inquiries",
  inquiries = [],
  filteredInquiries = [],
  appointments = [],
  filteredAppointments = [],
  allLeads = [],
  cardClass = "",
  toggleInquiryStatus = () => {},
  updateInquiryStatus = toggleInquiryStatus,
  updateInquiryPriority = () => {},
  updateAppointmentPriority = () => {},
  deleteInquiry = null,
  updateAppointmentStatus = () => {},
  updateAppointmentStage = () => {},
  deleteAppointment = null,
  role = "staff",
  adminProfile = null,
  permissions = {},
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState("inquiry");
  const [viewMode, setViewMode] = useState("list");

  const safePermissions = {
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
    ...permissions,
  };

  const roleConfig = {
    staff: {
      label: "Staff",
      icon: UsersRound,
      badge: "border-sky-200 bg-sky-50 text-sky-700",
    },
    admin: {
      label: "Admin",
      icon: UserCheck,
      badge: "border-orange-200 bg-orange-50 text-orange-700",
    },
    super_admin: {
      label: "Super Admin",
      icon: Crown,
      badge: "border-violet-200 bg-violet-50 text-violet-700",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;
  const RoleIcon = currentRole.icon;

  const openInquiryModal = (student) => {
    setSelectedStudent(student);
    setModalType("inquiry");
  };

  const openAppointmentModal = (student) => {
    setSelectedStudent(student);
    setModalType("appointment");
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  const priorityColumns = [
    {
      value: "vip",
      label: "VIP",
      description: "Highest strategic value",
      icon: Crown,
      border: "border-violet-200",
      bg: "bg-violet-50/55",
      accent: "text-violet-700",
      badge: "border-violet-200 bg-violet-50 text-violet-700",
    },
    {
      value: "high",
      label: "High",
      description: "Requires quick action",
      icon: CircleAlert,
      border: "border-red-200",
      bg: "bg-red-50/50",
      accent: "text-red-700",
      badge: "border-red-200 bg-red-50 text-red-700",
    },
    {
      value: "medium",
      label: "Medium",
      description: "Active opportunity",
      icon: Target,
      border: "border-orange-200",
      bg: "bg-orange-50/55",
      accent: "text-orange-700",
      badge: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      value: "low",
      label: "Low",
      description: "Nurture & monitor",
      icon: Radar,
      border: "border-slate-200",
      bg: "bg-slate-50/80",
      accent: "text-slate-600",
      badge: "border-slate-200 bg-slate-50 text-slate-600",
    },
  ];

  const inquiryNewCount = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const inquiryContactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;

  const appointmentPendingCount = appointments.filter(
    (appointment) => (appointment.status || "pending") === "pending"
  ).length;

  const appointmentConfirmedCount = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const appointmentCompletedCount = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  const appointmentCancelledCount = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  ).length;

  const activeSourceItems =
    activeTab === "inquiries" ? inquiries : appointments;

  const activeItems =
    activeTab === "inquiries" ? filteredInquiries : filteredAppointments;

  const activeLeadType =
    activeTab === "appointments" ? "appointment" : "inquiry";

  const executiveLeads = useMemo(() => {
    if (allLeads.length > 0) return allLeads;

    return [
      ...inquiries.map((lead) => ({ ...lead, __leadType: "inquiry" })),
      ...appointments.map((lead) => ({
        ...lead,
        __leadType: "appointment",
      })),
    ];
  }, [allLeads, inquiries, appointments]);

  const enrichedActiveItems = useMemo(
    () =>
      activeItems.map((item) =>
        enrichLeadWithAi(item, activeLeadType)
      ),
    [activeItems, activeLeadType]
  );

  const activeAiStats = useMemo(() => {
    const total = enrichedActiveItems.length;

    const storedGpt = enrichedActiveItems.filter(
      (item) => item.ai_has_stored_gpt
    ).length;

    const hot = enrichedActiveItems.filter(
      (item) => item.ai_tier?.level === "hot"
    ).length;

    const highRisk = enrichedActiveItems.filter(
      (item) =>
        item.ai_risk_level?.level === "high" ||
        item.ai_risk_score >= 75
    ).length;

    const averageScore = total
      ? Math.round(
          enrichedActiveItems.reduce(
            (sum, item) => sum + (item.ai_score || 0),
            0
          ) / total
        )
      : 0;

    return {
      total,
      storedGpt,
      hot,
      highRisk,
      averageScore,
      coverage: total
        ? Math.round((storedGpt / total) * 100)
        : 0,
    };
  }, [enrichedActiveItems]);

  const assignedCount = activeSourceItems.filter(
    (item) => item.assigned_admin_id
  ).length;

  const unassignedCount = Math.max(
    activeSourceItems.length - assignedCount,
    0
  );

  const priorityCounts = {
    vip: activeSourceItems.filter(
      (item) => item.priority === "vip"
    ).length,
    high: activeSourceItems.filter(
      (item) => item.priority === "high"
    ).length,
    medium: activeSourceItems.filter(
      (item) => item.priority === "medium"
    ).length,
    low: activeSourceItems.filter(
      (item) => (item.priority || "low") === "low"
    ).length,
  };

  const pipelineStages =
    activeTab === "inquiries"
      ? [
          {
            label: "New leads",
            value: inquiryNewCount,
            icon: Sparkles,
            tone: "orange",
          },
          {
            label: "Contacted",
            value: inquiryContactedCount,
            icon: UserCheck,
            tone: "emerald",
          },
          {
            label: "Assigned",
            value: assignedCount,
            icon: UsersRound,
            tone: "blue",
          },
          {
            label: "Open pool",
            value: unassignedCount,
            icon: Radar,
            tone: "slate",
          },
        ]
      : [
          {
            label: "Pending",
            value: appointmentPendingCount,
            icon: CalendarCheck2,
            tone: "orange",
          },
          {
            label: "Confirmed",
            value: appointmentConfirmedCount,
            icon: CheckCircle2,
            tone: "emerald",
          },
          {
            label: "Completed",
            value: appointmentCompletedCount,
            icon: Target,
            tone: "blue",
          },
          {
            label: "Cancelled",
            value: appointmentCancelledCount,
            icon: CircleAlert,
            tone: "red",
          },
        ];

  const viewTitle =
    activeTab === "inquiries"
      ? "Student Inquiry Workspace"
      : "Appointment Operations Workspace";

  const totalLabel =
    activeTab === "inquiries"
      ? "Total inquiries"
      : "Total appointments";

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <AnimatedSection key={activeTab}>
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[1.55rem] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-200/70 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                        <Activity size={11} />
                        Live CRM Workspace
                      </span>

                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${currentRole.badge}`}
                      >
                        <RoleIcon size={11} />
                        {currentRole.label}
                      </span>

                      {!safePermissions.canDelete && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                          <LockKeyhole size={11} />
                          Protected actions
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      {viewTitle}
                    </h2>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                      Work through student ownership, priority, status, AI signals,
                      and next actions from one connected operational layer.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <HeaderPill
                      label="Showing"
                      value={`${activeItems.length}/${activeSourceItems.length}`}
                    />
                    <HeaderPill
                      label="Assigned"
                      value={assignedCount}
                    />
                    <HeaderPill
                      label="Open"
                      value={unassignedCount}
                    />
                    <HeaderPill
                      label="GPT"
                      value={`${activeAiStats.coverage}%`}
                      accent
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
                {pipelineStages.map((stage, index) => (
                  <PipelineStage
                    key={stage.label}
                    stage={stage}
                    index={index}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))}
              </div>
            </section>

            <PipelineAiControlStrip
              stats={activeAiStats}
              reanalysisState={aiReanalysisState}
            />

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-[1.45rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-600">
                      Workspace layout
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      {viewMode === "kanban"
                        ? "Priority Board"
                        : "Student Card View"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {totalLabel}: {activeSourceItems.length} · Assigned:{" "}
                      {assignedCount} · Open: {unassignedCount}
                    </p>
                  </div>

                  <div className="inline-grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <ViewButton
                      active={viewMode === "list"}
                      onClick={() => setViewMode("list")}
                      icon={LayoutList}
                      label="Cards"
                    />

                    <ViewButton
                      active={viewMode === "kanban"}
                      onClick={() => setViewMode("kanban")}
                      icon={Grid3X3}
                      label="Board"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 rounded-[1.45rem] border border-slate-200/80 bg-white p-3 shadow-[0_10px_32px_rgba(15,23,42,0.04)]">
                {priorityColumns.map((column) => {
                  const ColumnIcon = column.icon;

                  return (
                    <div
                      key={column.value}
                      className={`min-w-[72px] rounded-2xl border p-3 text-center ${column.badge}`}
                    >
                      <ColumnIcon
                        size={15}
                        className="mx-auto"
                      />
                      <p className="mt-2 text-lg font-black">
                        {priorityCounts[column.value] || 0}
                      </p>
                      <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.12em] opacity-65">
                        {column.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {activeTab === "inquiries" && inquiries.length === 0 ? (
              <EmptyState
                icon={UserRoundSearch}
                title="No inquiries yet"
                text="Student contact-form submissions will appear here as soon as new leads enter Zaifan."
              />
            ) : activeTab === "appointments" &&
              appointments.length === 0 ? (
              <EmptyState
                icon={CalendarCheck2}
                title="No appointments yet"
                text="Consultation bookings will appear here after students reserve appointment slots."
              />
            ) : activeItems.length === 0 ? (
              <EmptyState
                icon={Radar}
                title="No matching records"
                text="Try adjusting your search terms or pipeline filters."
              />
            ) : viewMode === "kanban" ? (
              <KanbanView
                activeTab={activeTab}
                activeItems={activeItems}
                priorityColumns={priorityColumns}
                safePermissions={safePermissions}
                toggleInquiryStatus={updateInquiryStatus}
                updateInquiryPriority={updateInquiryPriority}
                updateAppointmentPriority={updateAppointmentPriority}
                updateAppointmentStatus={updateAppointmentStatus}
                updateAppointmentStage={updateAppointmentStage}
                deleteInquiry={deleteInquiry}
                deleteAppointment={deleteAppointment}
                openInquiryModal={openInquiryModal}
                openAppointmentModal={openAppointmentModal}
                role={role}
                reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
                aiReanalysisState={aiReanalysisState}
                shouldReduceMotion={shouldReduceMotion}
              />
            ) : (
              <ListView
                activeTab={activeTab}
                activeItems={activeItems}
                cardClass={cardClass}
                safePermissions={safePermissions}
                toggleInquiryStatus={updateInquiryStatus}
                updateInquiryPriority={updateInquiryPriority}
                updateAppointmentPriority={updateAppointmentPriority}
                updateAppointmentStatus={updateAppointmentStatus}
                updateAppointmentStage={updateAppointmentStage}
                deleteInquiry={deleteInquiry}
                deleteAppointment={deleteAppointment}
                openInquiryModal={openInquiryModal}
                openAppointmentModal={openAppointmentModal}
                role={role}
                reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
                aiReanalysisState={aiReanalysisState}
                shouldReduceMotion={shouldReduceMotion}
              />
            )}
          </div>
        </AnimatedSection>
      </AnimatePresence>

      {selectedStudent && (
        <Suspense fallback={<StudentModalLoader />}>
          <StudentDetailModal
            isOpen={!!selectedStudent}
            onClose={closeModal}
            student={selectedStudent}
            type={modalType}
            adminProfile={adminProfile}
            permissions={safePermissions}
            updateInquiryPriority={updateInquiryPriority}
            updateAppointmentPriority={updateAppointmentPriority}
            updateAppointmentStatus={updateAppointmentStatus}
            updateAppointmentStage={updateAppointmentStage}
            toggleInquiryStatus={updateInquiryStatus}
            deleteInquiry={deleteInquiry}
            deleteAppointment={deleteAppointment}
            allLeads={executiveLeads}
          />
        </Suspense>
      )}
    </>
  );
}

function HeaderPill({ label, value, accent = false }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-center ${
        accent
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-65">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-black">{value}</p>
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
        active
          ? "bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)]"
          : "text-slate-500 hover:bg-white hover:text-slate-900"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function PipelineAiControlStrip({ stats, reanalysisState }) {
  const items = [
    {
      label: "Average AI score",
      value: `${stats.averageScore}/100`,
      icon: BrainCircuit,
      tone: "violet",
    },
    {
      label: "Hot leads",
      value: stats.hot,
      icon: Target,
      tone: "orange",
    },
    {
      label: "High risk",
      value: stats.highRisk,
      icon: CircleAlert,
      tone: "red",
    },
    {
      label: "GPT coverage",
      value: `${stats.coverage}%`,
      icon: Bot,
      tone: "emerald",
    },
  ];

  return (
    <section className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <WandSparkles
              size={15}
              className="text-orange-500"
            />
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-600">
              Intelligence layer
            </p>
          </div>

          <h3 className="mt-1 text-lg font-black text-slate-900">
            AI-assisted pipeline health
          </h3>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
          Local AI always on
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <AiMiniStat key={item.label} {...item} />
        ))}
      </div>

      {reanalysisState.loading ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-700">
          <LoaderCircle
            size={17}
            className="animate-spin"
          />
          GPT is analyzing and saving intelligence for the selected lead.
        </div>
      ) : null}
    </section>
  );
}

function AiMiniStat({
  label,
  value,
  icon: Icon,
  tone,
}) {
  const toneClass =
    tone === "violet"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.13em] opacity-70">
          {label}
        </p>

        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 shadow-sm">
          <Icon size={15} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PipelineStage({
  stage,
  index,
  shouldReduceMotion,
}) {
  const Icon = stage.icon;

  const toneClass =
    stage.tone === "emerald"
      ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
      : stage.tone === "blue"
      ? "border-blue-100 bg-blue-50/70 text-blue-700"
      : stage.tone === "red"
      ? "border-red-100 bg-red-50/70 text-red-700"
      : stage.tone === "orange"
      ? "border-orange-100 bg-orange-50/80 text-orange-700"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.35,
        delay: shouldReduceMotion ? 0 : index * 0.04,
        ease: EASE,
      }}
      className={`rounded-[1.2rem] border p-4 ${toneClass}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.13em] opacity-65">
            {stage.label}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {stage.value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600">
        <Icon size={24} />
      </div>

      <h2 className="mt-5 text-xl font-black text-slate-900">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div className="h-3 w-40 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-72 max-w-full rounded-xl bg-slate-100" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-slate-100" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-[1.3rem] border border-slate-200 bg-white p-5"
          >
            <div className="h-3 w-24 rounded-full bg-slate-100" />
            <div className="mt-4 h-8 w-20 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanView({
  activeTab,
  activeItems,
  priorityColumns,
  safePermissions,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  updateAppointmentStatus,
  updateAppointmentStage,
  deleteInquiry,
  deleteAppointment,
  openInquiryModal,
  openAppointmentModal,
  role,
  reanalyzeLeadWithGpt,
  aiReanalysisState,
  shouldReduceMotion,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {priorityColumns.map((column, columnIndex) => {
        const columnItems = activeItems.filter(
          (item) =>
            (item.priority || "low") === column.value
        );

        const ColumnIcon = column.icon;

        return (
          <motion.div
            key={column.value}
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: 12 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.35,
              delay: shouldReduceMotion
                ? 0
                : columnIndex * 0.04,
              ease: EASE,
            }}
            className={`min-h-[360px] rounded-[1.5rem] border ${column.border} ${column.bg} p-3`}
          >
            <div className="mb-3 rounded-[1.2rem] border border-white/80 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${column.badge}`}>
                    <ColumnIcon size={16} />
                  </div>

                  <div className="min-w-0">
                    <h3 className={`truncate text-sm font-black ${column.accent}`}>
                      {column.label}
                    </h3>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {column.description}
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                  {columnItems.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {columnItems.length === 0 ? (
                <div className="rounded-[1.1rem] border border-dashed border-slate-300 bg-white/55 p-5 text-center">
                  <p className="text-xs text-slate-400">
                    No records in this priority.
                  </p>
                </div>
              ) : (
                columnItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: shouldReduceMotion
                        ? 0
                        : 0.28,
                      delay: shouldReduceMotion
                        ? 0
                        : Math.min(index * 0.02, 0.12),
                    }}
                    className="space-y-2"
                  >
                    <GptReanalysisButton
                      lead={item}
                      leadType={
                        activeTab === "appointments"
                          ? "appointment"
                          : "inquiry"
                      }
                      reanalyzeLeadWithGpt={
                        reanalyzeLeadWithGpt
                      }
                      aiReanalysisState={
                        aiReanalysisState
                      }
                    />

                    {activeTab === "inquiries" ? (
                      <InquiryCard
                        inquiry={item}
                        cardClass="p-0"
                        updateInquiryStatus={
                          toggleInquiryStatus
                        }
                        updateInquiryPriority={
                          updateInquiryPriority
                        }
                        deleteInquiry={
                          safePermissions.canDelete
                            ? deleteInquiry
                            : null
                        }
                        openModal={openInquiryModal}
                        compact
                        role={role}
                        permissions={safePermissions}
                      />
                    ) : (
                      <AppointmentCard
                        appointment={item}
                        cardClass="p-0"
                        updateAppointmentStatus={
                          updateAppointmentStatus
                        }
                        updateAppointmentStage={
                          updateAppointmentStage
                        }
                        updateAppointmentPriority={
                          updateAppointmentPriority
                        }
                        deleteAppointment={
                          safePermissions.canDelete
                            ? deleteAppointment
                            : null
                        }
                        openModal={openAppointmentModal}
                        compact
                        role={role}
                        permissions={safePermissions}
                      />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ListView({
  activeTab,
  activeItems,
  cardClass,
  safePermissions,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  updateAppointmentStatus,
  updateAppointmentStage,
  deleteInquiry,
  deleteAppointment,
  openInquiryModal,
  openAppointmentModal,
  role,
  reanalyzeLeadWithGpt,
  aiReanalysisState,
  shouldReduceMotion,
}) {
  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      {activeItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, y: 10 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.32,
            delay: shouldReduceMotion
              ? 0
              : Math.min(index * 0.02, 0.16),
            ease: EASE,
          }}
          className="space-y-2"
        >
          <GptReanalysisButton
            lead={item}
            leadType={
              activeTab === "appointments"
                ? "appointment"
                : "inquiry"
            }
            reanalyzeLeadWithGpt={
              reanalyzeLeadWithGpt
            }
            aiReanalysisState={aiReanalysisState}
          />

          {activeTab === "inquiries" ? (
            <InquiryCard
              inquiry={item}
              cardClass={cardClass}
              updateInquiryStatus={
                toggleInquiryStatus
              }
              updateInquiryPriority={
                updateInquiryPriority
              }
              deleteInquiry={
                safePermissions.canDelete
                  ? deleteInquiry
                  : null
              }
              openModal={openInquiryModal}
              role={role}
              permissions={safePermissions}
            />
          ) : (
            <AppointmentCard
              appointment={item}
              cardClass={cardClass}
              updateAppointmentStatus={
                updateAppointmentStatus
              }
              updateAppointmentStage={
                updateAppointmentStage
              }
              updateAppointmentPriority={
                updateAppointmentPriority
              }
              deleteAppointment={
                safePermissions.canDelete
                  ? deleteAppointment
                  : null
              }
              openModal={openAppointmentModal}
              role={role}
              permissions={safePermissions}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function GptReanalysisButton({
  lead,
  leadType,
  reanalyzeLeadWithGpt,
  aiReanalysisState,
}) {
  const enriched = enrichLeadWithAi(
    lead,
    leadType
  );

  const isCurrent =
    aiReanalysisState?.leadId === lead?.id;

  const isLoading =
    aiReanalysisState?.loading && isCurrent;

  const hasStoredGpt =
    enriched.ai_has_stored_gpt;

  if (!reanalyzeLeadWithGpt) return null;

  return (
    <div className="flex flex-col gap-3 rounded-[1.2rem] border border-orange-200 bg-orange-50/75 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <BrainCircuit
            size={14}
            className="text-orange-600"
          />
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
            GPT Intelligence
          </p>
        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {hasStoredGpt
            ? `Stored analysis available${
                enriched.ai_gpt_generated_at
                  ? ` · ${new Date(
                      enriched.ai_gpt_generated_at
                    ).toLocaleDateString()}`
                  : ""
              }`
            : "Local AI is active. Run GPT only when deeper analysis is useful."}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          reanalyzeLeadWithGpt(
            lead,
            leadType
          )
        }
        disabled={
          aiReanalysisState?.loading
        }
        className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
          hasStoredGpt
            ? "border border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
            : "bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] hover:bg-orange-600"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading
          ? "Analyzing..."
          : hasStoredGpt
          ? "Reanalyze"
          : "Analyze with GPT"}
      </button>
    </div>
  );
}

function StudentModalLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white px-8 py-7 text-center shadow-2xl">
        <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-900">
          Opening student workspace
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Loading the detailed student record.
        </p>
      </div>
    </div>
  );
}

export default DashboardContent;
