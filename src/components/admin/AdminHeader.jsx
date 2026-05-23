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
  return (
    <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
          Admin Dashboard
        </p>

        <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">
          Zaifan CRM
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-gray-400">
          <p>
            Inquiries:{" "}
            <span className="text-[#D4AF37]">{inquiries.length}</span>
          </p>

          <p>
            Appointments:{" "}
            <span className="text-[#D4AF37]">
              {appointments.length}
            </span>
          </p>

          <p>
            Pending Bookings:{" "}
            <span className="text-[#D4AF37]">
              {appointmentPendingCount}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={fetchAllData}
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >
          Refresh
        </button>

        <button
          onClick={
            activeTab === "inquiries"
              ? exportInquiriesToCSV
              : exportAppointmentsToCSV
          }
          className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E7C768]"
        >
          Export CSV
        </button>

        <button
          onClick={logout}
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
        >
          Logout
        </button>

        <button
          onClick={
            activeTab === "inquiries"
              ? clearInquiries
              : clearAppointments
          }
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-400"
        >
          Clear {activeTab === "inquiries"
            ? "Inquiries"
            : "Appointments"}
        </button>
      </div>
    </div>
  );
}

export default AdminHeader;