import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

function AdminHeader({
  inquiries,
  appointments,
  appointmentPendingCount,
  fetchAllData,
  activeTab,
  exportInquiriesToCSV,
  exportAppointmentsToCSV,
  logout,
  clearInquiries,
  clearAppointments,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const newInquiries = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const notificationCount =
    newInquiries + appointmentPendingCount + confirmedAppointments;

  const summaryItems = [
    { label: "Inquiries", value: inquiries.length },
    { label: "Appointments", value: appointments.length },
    { label: "Pending", value: appointmentPendingCount },
  ];

  const notifications = [
    {
      icon: "📨",
      title: "New Inquiries",
      text: `${newInquiries} students need follow-up`,
      show: newInquiries > 0,
      color: "text-[#D4AF37]",
    },
    {
      icon: "⏳",
      title: "Pending Appointments",
      text: `${appointmentPendingCount} bookings need confirmation`,
      show: appointmentPendingCount > 0,
      color: "text-orange-300",
    },
    {
      icon: "✅",
      title: "Confirmed Consultations",
      text: `${confirmedAppointments} consultations are ready`,
      show: confirmedAppointments > 0,
      color: "text-green-400",
    },
  ];

  const visibleNotifications = notifications.filter((item) => item.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative z-20 mb-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-6 sm:rounded-[2rem] sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37] sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.25em]">
              Admin Dashboard
            </div>

            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:mt-4 md:text-5xl">
              Zaifan CRM
            </h1>

            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-gray-400 sm:py-2 sm:text-xs"
                >
                  {item.label}:{" "}
                  <span className="font-semibold text-[#D4AF37]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg text-white transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 sm:h-12 sm:w-12"
            >
              🔔

              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1.5 text-[10px] font-black text-black">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-14 z-50 w-[280px] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#080808]/95 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:w-[340px]"
                >
                  <div className="border-b border-white/10 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
                      Notifications
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-white">
                      CRM Alerts
                    </h3>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto p-2">
                    {visibleNotifications.length === 0 ? (
                      <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4 text-center">
                        <p className="text-sm text-gray-400">
                          No active alerts right now.
                        </p>
                      </div>
                    ) : (
                      visibleNotifications.map((item) => (
                        <div
                          key={item.title}
                          className="flex gap-3 rounded-[1rem] p-3 transition hover:bg-white/[0.04]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                            {item.icon}
                          </div>

                          <div>
                            <p className={`text-sm font-bold ${item.color}`}>
                              {item.title}
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-gray-400">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <button
            onClick={fetchAllData}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            Refresh
          </button>

          <button
            onClick={
              activeTab === "inquiries"
                ? exportInquiriesToCSV
                : exportAppointmentsToCSV
            }
            className="rounded-xl bg-[#D4AF37] px-3 py-2.5 text-xs font-bold text-black transition hover:bg-[#E7C768] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            Export CSV
          </button>

          <button
            onClick={logout}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm xl:hidden"
          >
            Logout
          </button>

          <button
            onClick={
              activeTab === "inquiries" ? clearInquiries : clearAppointments
            }
            className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-xs font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-400/15 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          >
            Clear {activeTab === "inquiries" ? "Inquiries" : "Appointments"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminHeader;