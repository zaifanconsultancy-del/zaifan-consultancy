import InquiryCard from "./InquiryCard";
import AppointmentCard from "./AppointmentCard";
import { motion } from "framer-motion";

function DashboardContent({
  loading,
  activeTab,
  inquiries,
  filteredInquiries,
  appointments,
  filteredAppointments,
  cardClass,
  toggleInquiryStatus,
  deleteInquiry,
  updateAppointmentStatus,
  deleteAppointment,
}) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 2xl:grid-cols-2"
      >
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`${cardClass} animate-pulse space-y-5`}
          >
            <div className="h-5 w-32 rounded-full bg-white/10"></div>

            <div className="h-10 w-64 rounded-2xl bg-white/10"></div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-24 rounded-2xl bg-white/10"></div>
              <div className="h-24 rounded-2xl bg-white/10"></div>
            </div>

            <div className="h-36 rounded-2xl bg-white/10"></div>
          </div>
        ))}
      </motion.div>
    );
  }

  if (activeTab === "inquiries") {
    if (inquiries.length === 0) {
      return (
        <div
          className={`${cardClass} flex flex-col items-center justify-center py-20 text-center`}
        >
          <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-6 text-4xl">
            ✦
          </div>

          <h2 className="mt-6 text-3xl font-bold text-white">
            No Inquiries Yet
          </h2>

          <p className="mt-3 max-w-md text-gray-400">
            Your contact form submissions will appear here once students
            start reaching out.
          </p>
        </div>
      );
    }

    if (filteredInquiries.length === 0) {
      return (
        <div
          className={`${cardClass} flex flex-col items-center justify-center py-20 text-center`}
        >
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-4xl">
            ⌕
          </div>

          <h2 className="mt-6 text-3xl font-bold text-white">
            No Matching Results
          </h2>

          <p className="mt-3 max-w-md text-gray-400">
            Try adjusting your search keywords or status filters.
          </p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid gap-6 2xl:grid-cols-2"
      >
        {filteredInquiries.map((inquiry, index) => (
          <motion.div
            key={inquiry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: index * 0.06,
            }}
          >
            <InquiryCard
              inquiry={inquiry}
              cardClass={cardClass}
              updateInquiryStatus={toggleInquiryStatus}
              deleteInquiry={deleteInquiry}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div
        className={`${cardClass} flex flex-col items-center justify-center py-20 text-center`}
      >
        <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-6 text-4xl">
          📅
        </div>

        <h2 className="mt-6 text-3xl font-bold text-white">
          No Appointments Yet
        </h2>

        <p className="mt-3 max-w-md text-gray-400">
          Consultation bookings will appear here after students reserve
          appointment slots.
        </p>
      </div>
    );
  }

  if (filteredAppointments.length === 0) {
    return (
      <div
        className={`${cardClass} flex flex-col items-center justify-center py-20 text-center`}
      >
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-4xl">
          ⌕
        </div>

        <h2 className="mt-6 text-3xl font-bold text-white">
          No Matching Results
        </h2>

        <p className="mt-3 max-w-md text-gray-400">
          Try changing the appointment filters or search query.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid gap-6 2xl:grid-cols-2"
    >
      {filteredAppointments.map((appointment, index) => (
        <motion.div
          key={appointment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.06,
          }}
        >
          <AppointmentCard
            appointment={appointment}
            cardClass={cardClass}
            updateAppointmentStatus={updateAppointmentStatus}
            deleteAppointment={deleteAppointment}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default DashboardContent;