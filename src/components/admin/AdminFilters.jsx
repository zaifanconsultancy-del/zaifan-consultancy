function AdminFilters({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  appointmentStatuses,
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`rounded-full px-6 py-3 text-sm font-medium transition ${
            activeTab === "inquiries"
              ? "bg-[#D4AF37] text-black"
              : "border border-white/10 text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
          }`}
        >
          Inquiries
        </button>

        <button
          onClick={() => setActiveTab("appointments")}
          className={`rounded-full px-6 py-3 text-sm font-medium transition ${
            activeTab === "appointments"
              ? "bg-[#D4AF37] text-black"
              : "border border-white/10 text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
          }`}
        >
          Appointments
        </button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-white outline-none focus:border-[#D4AF37]"
        >
          {appointmentStatuses.map((status) => (
            <option
              key={status}
              value={status}
              className="bg-[#111]"
            >
              {status}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default AdminFilters;