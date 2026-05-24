import { useState } from "react";
import InquiryCard from "./InquiryCard";
import AppointmentCard from "./AppointmentCard";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import StudentDetailModal from "./StudentDetailModal";

function DashboardContent({
  loading,
  activeTab,
  inquiries,
  filteredInquiries,
  appointments,
  filteredAppointments,
  cardClass,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  deleteInquiry,
  updateAppointmentStatus,
  deleteAppointment,
}) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState("inquiry");
  const [viewMode, setViewMode] = useState("list");

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

  const priorityCounts =
    activeTab === "inquiries"
      ? {
          vip: inquiries.filter((item) => item.priority === "vip").length,
          high: inquiries.filter((item) => item.priority === "high").length,
          medium: inquiries.filter((item) => item.priority === "medium").length,
          low: inquiries.filter((item) => (item.priority || "low") === "low")
            .length,
        }
      : {
          vip: appointments.filter((item) => item.priority === "vip").length,
          high: appointments.filter((item) => item.priority === "high").length,
          medium: appointments.filter((item) => item.priority === "medium")
            .length,
          low: appointments.filter((item) => (item.priority || "low") === "low")
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
            label: "VIP",
            value: priorityCounts.vip,
            icon: "👑",
            color: "text-purple-300",
          },
          {
            label: "High Priority",
            value: priorityCounts.high,
            icon: "🔥",
            color: "text-red-300",
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

  const activeItems =
    activeTab === "inquiries" ? filteredInquiries : filteredAppointments;

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

        <div className="mt-5 grid w-full max-w-2xl gap-2.5 sm:mt-6 sm:gap-3 md:grid-cols-3">
          <MiniEmptyCard icon="📊" text="Analytics Ready" />
          <MiniEmptyCard icon="⚡" text="Live CRM Feed" />
          <MiniEmptyCard icon="🔔" text="Alerts Enabled" />
        </div>
      </div>
    </AnimatedSection>
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid gap-3 sm:gap-4 2xl:grid-cols-2"
      >
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
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <AnimatedSection key={activeTab}>
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

          <div className="mb-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                CRM View Mode
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">
                {viewMode === "kanban" ? "Kanban Pipeline" : "Card List"}
              </h3>
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
                    transition={{
                      duration: 0.3,
                      delay: columnIndex * 0.04,
                    }}
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
                          >
                            {activeTab === "inquiries" ? (
                              <InquiryCard
                                inquiry={item}
                                cardClass="p-0"
                                updateInquiryStatus={toggleInquiryStatus}
                                updateInquiryPriority={updateInquiryPriority}
                                deleteInquiry={deleteInquiry}
                                openModal={openInquiryModal}
                                compact
                              />
                            ) : (
                              <AppointmentCard
                                appointment={item}
                                cardClass="p-0"
                                updateAppointmentStatus={updateAppointmentStatus}
                                updateAppointmentPriority={updateAppointmentPriority}
                                deleteAppointment={deleteAppointment}
                                openModal={openAppointmentModal}
                                compact
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
          ) : (
            <div className="grid gap-3 sm:gap-4 2xl:grid-cols-2">
              {activeItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    delay: Math.min(index * 0.025, 0.18),
                  }}
                >
                  {activeTab === "inquiries" ? (
                    <InquiryCard
                      inquiry={item}
                      cardClass={cardClass}
                      updateInquiryStatus={toggleInquiryStatus}
                      updateInquiryPriority={updateInquiryPriority}
                      deleteInquiry={deleteInquiry}
                      openModal={openInquiryModal}
                    />
                  ) : (
                    <AppointmentCard
                      appointment={item}
                      cardClass={cardClass}
                      updateAppointmentStatus={updateAppointmentStatus}
                      updateAppointmentPriority={updateAppointmentPriority}
                      deleteAppointment={deleteAppointment}
                      openModal={openAppointmentModal}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatedSection>
      </AnimatePresence>

      <StudentDetailModal
        isOpen={!!selectedStudent}
        onClose={closeModal}
        student={selectedStudent}
        type={modalType}
      />
    </>
  );
}

function PipelineStage({ stage, index, cardClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.28,
        delay: index * 0.04,
      }}
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

function MiniEmptyCard({ icon, text }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3 sm:rounded-[1.3rem] sm:p-4">
      <p className="text-xl sm:text-2xl">{icon}</p>

      <p className="mt-1.5 text-[11px] font-semibold text-gray-300 sm:mt-2 sm:text-xs">
        {text}
      </p>
    </div>
  );
}

export default DashboardContent;