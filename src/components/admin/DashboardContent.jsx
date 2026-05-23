import InquiryCard from "./InquiryCard";
import AppointmentCard from "./AppointmentCard";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";

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
  const EmptyState = ({ icon, title, text, gold = false }) => (
    <AnimatedSection key={`${activeTab}-${title}`}>
      <div
        className={`${cardClass} flex flex-col items-center justify-center py-12 text-center`}
      >
        <div
          className={`rounded-[1.6rem] border p-5 text-3xl ${
            gold
              ? "border-[#D4AF37]/20 bg-[#D4AF37]/10"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          {icon}
        </div>

        <h2 className="mt-5 text-2xl font-bold text-white">{title}</h2>

        <p className="mt-2 max-w-md text-sm text-gray-400">{text}</p>

        <div className="mt-6 grid w-full max-w-2xl gap-3 md:grid-cols-3">
          <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-2xl">📊</p>
            <p className="mt-2 text-xs font-semibold text-gray-300">
              Analytics Ready
            </p>
          </div>

          <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-2xl">⚡</p>
            <p className="mt-2 text-xs font-semibold text-gray-300">
              Live CRM Feed
            </p>
          </div>

          <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-2xl">🔔</p>
            <p className="mt-2 text-xs font-semibold text-gray-300">
              Alerts Enabled
            </p>
          </div>
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
        className="grid gap-4 2xl:grid-cols-2"
      >
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={`${cardClass} animate-pulse space-y-4`}>
            <div className="h-4 w-28 rounded-full bg-white/10"></div>
            <div className="h-8 w-56 rounded-2xl bg-white/10"></div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="h-20 rounded-2xl bg-white/10"></div>
              <div className="h-20 rounded-2xl bg-white/10"></div>
            </div>

            <div className="h-28 rounded-2xl bg-white/10"></div>
          </div>
        ))}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {activeTab === "inquiries" ? (
        <AnimatedSection key="inquiries">
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
            <div className="grid gap-4 2xl:grid-cols-2">
              {filteredInquiries.map((inquiry, index) => (
                <motion.div
                  key={inquiry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.04,
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
            </div>
          )}
        </AnimatedSection>
      ) : (
        <AnimatedSection key="appointments">
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
            <div className="grid gap-4 2xl:grid-cols-2">
              {filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.04,
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
            </div>
          )}
        </AnimatedSection>
      )}
    </AnimatePresence>
  );
}

export default DashboardContent;