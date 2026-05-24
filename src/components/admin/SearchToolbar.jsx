function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="sticky top-[118px] z-30 mb-5 rounded-[1.3rem] border border-white/10 bg-[#050505]/85 p-2.5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:top-24 sm:mb-8 sm:rounded-[1.7rem] sm:p-3">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              activeTab === "inquiries"
                ? "Search name, email, phone, country, priority..."
                : "Search appointments..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-xs text-white outline-none transition duration-300 placeholder:text-gray-500 focus:border-[#D4AF37] sm:rounded-[1.25rem] sm:px-5 sm:py-3.5 sm:pr-12 sm:text-sm"
          />

          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 sm:right-5">
            ⌕
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
          {statusOptions.map((status) => {
            const isActive = statusFilter === status;
            const isPriority =
              status === "VIP" ||
              status === "High" ||
              status === "Medium" ||
              status === "Low";

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap rounded-[0.9rem] px-3.5 py-2.5 text-[11px] font-semibold transition duration-300 sm:rounded-[1.1rem] sm:px-4 sm:py-3 sm:text-xs ${
                  isActive
                    ? isPriority
                      ? "bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.16)]"
                      : "bg-[#D4AF37] text-black shadow-[0_0_24px_rgba(212,175,55,0.22)]"
                    : isPriority
                    ? "border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37] hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/10"
                    : "border border-white/10 bg-white/[0.035] text-gray-400 hover:border-[#D4AF37]/25 hover:text-white"
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SearchToolbar;