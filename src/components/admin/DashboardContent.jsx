import { useMemo, useState } from "react";
import InquiryCard from "./InquiryCard";
import AppointmentCard from "./AppointmentCard";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import StudentDetailModal from "./StudentDetailModal";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";

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
      icon: "🧑‍💼",
      badge: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    },
    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    },
    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-purple-400/20 bg-purple-500/10 text-purple-300",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;

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
      label: "VIP Leads",
      icon: "👑",
      color: "text-purple-300",
      border: "border-purple-400/25",
      bg: "bg-purple-500/5",
    },
    {
      value: "high",
      label: "High Priority",
      icon: "🔥",
      color: "text-red-300",
      border: "border-red-400/25",
      bg: "bg-red-500/5",
    },
    {
      value: "medium",
      label: "Medium Priority",
      icon: "⭐",
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/25",
      bg: "bg-[#D4AF37]/5",
    },
    {
      value: "low",
      label: "Low Priority",
      icon: "🌙",
      color: "text-gray-300",
      border: "border-white/10",
      bg: "bg-white/[0.025]",
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

  const activeSourceItems = activeTab === "inquiries" ? inquiries : appointments;
  const activeItems =
    activeTab === "inquiries" ? filteredInquiries : filteredAppointments;
  const activeLeadType = activeTab === "appointments" ? "appointment" : "inquiry";
  const executiveLeads = useMemo(() => {
  if (allLeads.length > 0) return allLeads;

  return [
    ...inquiries.map((lead) => ({ ...lead, __leadType: "inquiry" })),
    ...appointments.map((lead) => ({ ...lead, __leadType: "appointment" })),
  ];
}, [allLeads, inquiries, appointments]);

  const enrichedActiveItems = useMemo(
    () => activeItems.map((item) => enrichLeadWithAi(item, activeLeadType)),
    [activeItems, activeLeadType]
  );

  const activeAiStats = useMemo(() => {
    const total = enrichedActiveItems.length;
    const storedGpt = enrichedActiveItems.filter((item) => item.ai_has_stored_gpt).length;
    const hot = enrichedActiveItems.filter((item) => item.ai_tier?.level === "hot").length;
    const highRisk = enrichedActiveItems.filter(
      (item) => item.ai_risk_level?.level === "high" || item.ai_risk_score >= 75
    ).length;
    const averageScore = total
      ? Math.round(
          enrichedActiveItems.reduce((sum, item) => sum + (item.ai_score || 0), 0) / total
        )
      : 0;

    return {
      total,
      storedGpt,
      hot,
      highRisk,
      averageScore,
      coverage: total ? Math.round((storedGpt / total) * 100) : 0,
    };
  }, [enrichedActiveItems]);

  const assignedCount = activeSourceItems.filter(
    (item) => item.assigned_admin_id
  ).length;

  const unassignedCount = Math.max(activeSourceItems.length - assignedCount, 0);

  const priorityCounts = {
    vip: activeSourceItems.filter((item) => item.priority === "vip").length,
    high: activeSourceItems.filter((item) => item.priority === "high").length,
    medium: activeSourceItems.filter((item) => item.priority === "medium").length,
    low: activeSourceItems.filter((item) => (item.priority || "low") === "low")
      .length,
  };

  const pipelineStages =
    activeTab === "inquiries"
      ? [
          {
            label: "New Leads",
            value: inquiryNewCount,
            icon: "✨",
            color: "text-[#D4AF37]",
          },
          {
            label: "Contacted",
            value: inquiryContactedCount,
            icon: "📞",
            color: "text-green-400",
          },
          {
            label: "Assigned",
            value: assignedCount,
            icon: "📌",
            color: "text-cyan-300",
          },
          {
            label: "Open Pool",
            value: unassignedCount,
            icon: "🧭",
            color: "text-orange-300",
          },
        ]
      : [
          {
            label: "Pending",
            value: appointmentPendingCount,
            icon: "⏳",
            color: "text-orange-300",
          },
          {
            label: "Confirmed",
            value: appointmentConfirmedCount,
            icon: "✅",
            color: "text-green-400",
          },
          {
            label: "Completed",
            value: appointmentCompletedCount,
            icon: "🎯",
            color: "text-blue-400",
          },
          {
            label: "Cancelled",
            value: appointmentCancelledCount,
            icon: "❌",
            color: "text-red-400",
          },
        ];

  const viewTitle =
    activeTab === "inquiries" ? "Inquiry Pipeline" : "Appointment Pipeline";
  const totalLabel =
    activeTab === "inquiries" ? "Total inquiries" : "Total appointments";

  const EmptyState = ({ icon, title, text, gold = false }) => (
    <AnimatedSection key={`${activeTab}-${title}`}>
      <div
        className={`${cardClass} flex flex-col items-center justify-center px-4 py-8 text-center sm:px-6 sm:py-12`}
      >
        <div
          className={`rounded-[1.2rem] border p-4 text-2xl sm:rounded-[1.6rem] sm:p-5 sm:text-3xl ${
            gold
              ? "border-[#D4AF37]/20 bg-[#D4AF37]/10"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          {icon}
        </div>

        <h2 className="mt-4 text-xl font-bold text-white sm:mt-5 sm:text-2xl">
          {title}
        </h2>

        <p className="mt-2 max-w-md text-xs leading-relaxed text-gray-400 sm:text-sm">
          {text}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${currentRole.badge}`}
          >
            <span>{currentRole.icon}</span>
            {currentRole.label}
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-gray-400">
            Enterprise CRM Active
          </div>
        </div>
      </div>
    </AnimatedSection>
  );

  if (loading) {
    return <LoadingSkeleton cardClass={cardClass} />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <AnimatedSection key={activeTab}>
          <div className="mb-4 flex flex-col gap-4 rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                CRM Access Layer
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                {viewTitle}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                Manage lead ownership, priorities, statuses, protected CRM actions, and manual GPT intelligence upgrades from one operational workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${currentRole.badge}`}
              >
                <span>{currentRole.icon}</span>
                {currentRole.label}
              </div>

              <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                {adminProfile?.full_name || "Admin User"}
              </div>

              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                {activeItems.length}/{activeSourceItems.length} Showing
              </div>

              <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                GPT Coverage {activeAiStats.coverage}%
              </div>

              {!safePermissions.canDelete && (
                <div className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                  Delete Locked
                </div>
              )}
            </div>
          </div>

          <PipelineAiControlStrip
            stats={activeAiStats}
            reanalysisState={aiReanalysisState}
          />

          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {pipelineStages.map((stage, index) => (
              <PipelineStage
                key={stage.label}
                stage={stage}
                index={index}
                cardClass={cardClass}
              />
            ))}
          </div>

          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                    CRM View Mode
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-white">
                    {viewMode === "kanban"
                      ? "Kanban Priority Pipeline"
                      : "Enterprise Card View"}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {totalLabel}: {activeSourceItems.length} · Assigned: {assignedCount} · Open: {unassignedCount}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-black/25 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition duration-300 ${
                      viewMode === "list"
                        ? "bg-[#D4AF37] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    List
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition duration-300 ${
                      viewMode === "kanban"
                        ? "bg-[#D4AF37] text-black"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Kanban
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
              {priorityColumns.map((column) => (
                <div
                  key={column.value}
                  className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center"
                >
                  <p className="text-lg">{column.icon}</p>
                  <p className={`mt-1 text-lg font-black ${column.color}`}>
                    {priorityCounts[column.value] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {activeTab === "inquiries" && inquiries.length === 0 ? (
            <EmptyState
              icon="✦"
              title="No Inquiries Yet"
              text="Your contact form submissions will appear here once students start reaching out."
              gold
            />
          ) : activeTab === "appointments" && appointments.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No Appointments Yet"
              text="Consultation bookings will appear here after students reserve appointment slots."
              gold
            />
          ) : activeItems.length === 0 ? (
            <EmptyState
              icon="⌕"
              title="No Matching Results"
              text="Try adjusting your search keywords or status filters."
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
            />
          )}
        </AnimatedSection>
      </AnimatePresence>

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
    </>
  );
}

function PipelineAiControlStrip({ stats, reanalysisState }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <AiMiniStat label="Average AI Score" value={stats.averageScore} suffix="/100" icon="🧠" />
      <AiMiniStat label="Hot Leads" value={stats.hot} suffix="" icon="🔥" />
      <AiMiniStat label="High Risk" value={stats.highRisk} suffix="" icon="🚨" />
      <AiMiniStat label="GPT Coverage" value={stats.coverage} suffix="%" icon="🤖" />

      {reanalysisState.loading ? (
        <div className="sm:col-span-2 xl:col-span-4 rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-sm text-[#D4AF37]">
          GPT is analyzing and saving intelligence for this lead...
        </div>
      ) : null}
    </div>
  );
}

function AiMiniStat({ label, value, suffix, icon }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          {label}
        </p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-black text-[#D4AF37]">
        {value}
        <span className="text-base text-white/30">{suffix}</span>
      </p>
    </div>
  );
}

function LoadingSkeleton({ cardClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-4"
    >
      <div className={`${cardClass} animate-pulse p-5`}>
        <div className="h-3.5 w-40 rounded-full bg-white/10"></div>
        <div className="mt-4 h-9 w-72 max-w-full rounded-2xl bg-white/10"></div>
        <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-white/10"></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={`${cardClass} animate-pulse p-5`}>
            <div className="h-3.5 w-24 rounded-full bg-white/10"></div>
            <div className="mt-4 h-8 w-20 rounded-2xl bg-white/10"></div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:gap-4 2xl:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`${cardClass} animate-pulse space-y-3 p-4 sm:space-y-4 sm:p-5`}
          >
            <div className="h-3.5 w-24 rounded-full bg-white/10 sm:h-4 sm:w-28"></div>
            <div className="h-7 w-44 rounded-2xl bg-white/10 sm:h-8 sm:w-56"></div>
            <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-2">
              <div className="h-16 rounded-2xl bg-white/10 sm:h-20"></div>
              <div className="h-16 rounded-2xl bg-white/10 sm:h-20"></div>
            </div>
            <div className="h-24 rounded-2xl bg-white/10 sm:h-28"></div>
          </div>
        ))}
      </div>
    </motion.div>
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
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {priorityColumns.map((column, columnIndex) => {
        const columnItems = activeItems.filter(
          (item) => (item.priority || "low") === column.value
        );

        return (
          <motion.div
            key={column.value}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: columnIndex * 0.04 }}
            className={`min-h-[360px] rounded-[1.7rem] border ${column.border} ${column.bg} p-3 backdrop-blur-xl`}
          >
            <div className="mb-3 flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-black/25 p-4">
              <div>
                <p className="text-xl">{column.icon}</p>

                <h3 className={`mt-2 text-sm font-bold ${column.color}`}>
                  {column.label}
                </h3>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-white">
                {columnItems.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnItems.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 p-5 text-center">
                  <p className="text-xs text-gray-500">
                    No leads in this column.
                  </p>
                </div>
              ) : (
                columnItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: Math.min(index * 0.02, 0.12),
                    }}
                    className="space-y-2"
                  >
                    <GptReanalysisButton
                      lead={item}
                      leadType={activeTab === "appointments" ? "appointment" : "inquiry"}
                      reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
                      aiReanalysisState={aiReanalysisState}
                    />

                    {activeTab === "inquiries" ? (
                      <InquiryCard
                        inquiry={item}
                        cardClass="p-0"
                        updateInquiryStatus={toggleInquiryStatus}
                        updateInquiryPriority={updateInquiryPriority}
                        deleteInquiry={safePermissions.canDelete ? deleteInquiry : null}
                        openModal={openInquiryModal}
                        compact
                        role={role}
                        permissions={safePermissions}
                      />
                    ) : (
                      <AppointmentCard
                        appointment={item}
                        cardClass="p-0"
                        updateAppointmentStatus={updateAppointmentStatus}
                        updateAppointmentStage={updateAppointmentStage}
                        updateAppointmentPriority={updateAppointmentPriority}
                        deleteAppointment={
                          safePermissions.canDelete ? deleteAppointment : null
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
}) {
  return (
    <div className="grid gap-3 sm:gap-4 2xl:grid-cols-2">
      {activeItems.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.18) }}
          className="space-y-2"
        >
          <GptReanalysisButton
            lead={item}
            leadType={activeTab === "appointments" ? "appointment" : "inquiry"}
            reanalyzeLeadWithGpt={reanalyzeLeadWithGpt}
            aiReanalysisState={aiReanalysisState}
          />

          {activeTab === "inquiries" ? (
            <InquiryCard
              inquiry={item}
              cardClass={cardClass}
              updateInquiryStatus={toggleInquiryStatus}
              updateInquiryPriority={updateInquiryPriority}
              deleteInquiry={safePermissions.canDelete ? deleteInquiry : null}
              openModal={openInquiryModal}
              role={role}
              permissions={safePermissions}
            />
          ) : (
            <AppointmentCard
              appointment={item}
              cardClass={cardClass}
              updateAppointmentStatus={updateAppointmentStatus}
              updateAppointmentStage={updateAppointmentStage}
              updateAppointmentPriority={updateAppointmentPriority}
              deleteAppointment={safePermissions.canDelete ? deleteAppointment : null}
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
  const enriched = enrichLeadWithAi(lead, leadType);
  const isCurrent = aiReanalysisState?.leadId === lead?.id;
  const isLoading = aiReanalysisState?.loading && isCurrent;
  const hasStoredGpt = enriched.ai_has_stored_gpt;

  if (!reanalyzeLeadWithGpt) return null;

  return (
    <div className="flex flex-col gap-2 rounded-[1.25rem] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.055] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
          Real GPT Intelligence
        </p>
        <p className="mt-1 truncate text-xs text-white/45">
          {hasStoredGpt
            ? `Stored GPT analysis available${enriched.ai_gpt_generated_at ? ` · ${new Date(enriched.ai_gpt_generated_at).toLocaleDateString()}` : ""}`
            : "Not analyzed by GPT yet. Local AI fallback is active."}
        </p>
      </div>

      <button
        type="button"
        onClick={() => reanalyzeLeadWithGpt(lead, leadType)}
        disabled={aiReanalysisState?.loading}
        className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
          hasStoredGpt
            ? "border border-[#D4AF37]/25 bg-black/25 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            : "bg-[#D4AF37] text-black hover:bg-[#E7C768]"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading
          ? "Analyzing..."
          : hasStoredGpt
          ? "Reanalyze GPT"
          : "Analyze with GPT"}
      </button>
    </div>
  );
}

function PipelineStage({ stage, index, cardClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
      className={`${cardClass} flex items-center justify-between p-4 sm:p-5`}
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
          {stage.label}
        </p>

        <h2 className={`mt-2 text-3xl font-black ${stage.color}`}>
          {stage.value}
        </h2>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-2xl">
        {stage.icon}
      </div>
    </motion.div>
  );
}

export default DashboardContent;
