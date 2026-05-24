import { motion } from "framer-motion";

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
  const summaryItems = [
    { label: "Inquiries", value: inquiries.length },
    { label: "Appointments", value: appointments.length },
    { label: "Pending", value: appointmentPendingCount },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mb-5 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-6 sm:rounded-[2rem] sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        <div>
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