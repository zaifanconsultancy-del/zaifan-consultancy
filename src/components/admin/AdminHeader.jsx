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
      className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-6">
        <div>
          <div className="inline-flex rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
            Admin Dashboard
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight text-white md:text-5xl">
            Zaifan CRM
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-400"
              >
                {item.label}:{" "}
                <span className="font-semibold text-[#D4AF37]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <button
            onClick={fetchAllData}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            Refresh
          </button>

          <button
            onClick={
              activeTab === "inquiries"
                ? exportInquiriesToCSV
                : exportAppointmentsToCSV
            }
            className="rounded-2xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#E7C768]"
          >
            Export CSV
          </button>

          <button
            onClick={logout}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] xl:hidden"
          >
            Logout
          </button>

          <button
            onClick={
              activeTab === "inquiries" ? clearInquiries : clearAppointments
            }
            className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-400/15"
          >
            Clear {activeTab === "inquiries" ? "Inquiries" : "Appointments"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminHeader;