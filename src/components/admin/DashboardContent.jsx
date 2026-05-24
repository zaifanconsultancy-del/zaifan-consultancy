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
  deleteInquiry,
  updateAppointmentStatus,
  deleteAppointment,
}) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState("inquiry");

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

  const inquiryNewCount = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const inquiryContactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;

  const priorityCounts = {
    vip: inquiries.filter((inquiry) => inquiry.priority === "vip").length,
    high: inquiries.filter((inquiry) => inquiry.priority === "high").length,
    medium: inquiries.filter((inquiry) => inquiry.priority === "medium").length,
    low: inquiries.filter((inquiry) => (inquiry.priority || "low") === "low")
      .length,
  };

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
        {activeTab === "inquiries" ? (
          <AnimatedSection key="inquiries">
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

            {inquiries.length === 0 ? (
              <EmptyState
                icon="✦"
                title="No Inquiries Yet"
                text="Your contact form submissions will appear here once students start reaching out."
                gold
              />
            ) : filteredInquiries.length === 0 ? (
              <EmptyState
                icon="⌕"
                title="No Matching Results"
                text="Try adjusting your search keywords or status filters."
              />
            ) : (
              <div className="grid gap-3 sm:gap-4 2xl:grid-cols-2">
                {filteredInquiries.map((inquiry, index) => (
                  <motion.div
                    key={inquiry.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(index * 0.025, 0.18),
                    }}
                  >
                    <InquiryCard
                      inquiry={inquiry}
                      cardClass={cardClass}
                      updateInquiryStatus={toggleInquiryStatus}
                      updateInquiryPriority={updateInquiryPriority}
                      deleteInquiry={deleteInquiry}
                      openModal={openInquiryModal}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatedSection>
        ) : (
          <AnimatedSection key="appointments">
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

            {appointments.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No Appointments Yet"
                text="Consultation bookings will appear here after students reserve appointment slots."
                gold
              />
            ) : filteredAppointments.length === 0 ? (
              <EmptyState
                icon="⌕"
                title="No Matching Results"
                text="Try changing the appointment filters or search query."
              />
            ) : (
              <div className="grid gap-3 sm:gap-4 2xl:grid-cols-2">
                {filteredAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      delay: Math.min(index * 0.025, 0.18),
                    }}
                  >
                    <AppointmentCard
                      appointment={appointment}
                      cardClass={cardClass}
                      updateAppointmentStatus={updateAppointmentStatus}
                      deleteAppointment={deleteAppointment}
                      openModal={openAppointmentModal}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatedSection>
        )}
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