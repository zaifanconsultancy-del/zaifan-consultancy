function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="sticky top-24 z-30 mb-8 rounded-[1.7rem] border border-white/10 bg-[#050505]/80 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              activeTab === "inquiries"
                ? "Search inquiries..."
                : "Search appointments..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-5 py-3.5 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-gray-500 focus:border-[#D4AF37]"
          />

          <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500">
            ⌕
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap rounded-[1.1rem] px-4 py-3 text-xs font-semibold transition duration-300 ${
                statusFilter === status
                  ? "bg-[#D4AF37] text-black shadow-[0_0_24px_rgba(212,175,55,0.22)]"
                  : "border border-white/10 bg-white/[0.035] text-gray-400 hover:border-[#D4AF37]/25 hover:text-white"
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