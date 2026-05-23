function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="mb-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* SEARCH */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              activeTab === "inquiries"
                ? "Search by name, email, phone, country, city, field..."
                : "Search by name, email, phone, country, type, date, time..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-6 py-4 text-white outline-none transition duration-300 placeholder:text-gray-500 focus:border-[#D4AF37]"
          />

          <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500">
            ⌕
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition duration-300 ${
                statusFilter === status
                  ? "bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.25)]"
                  : "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#D4AF37]/20 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchToolbar;