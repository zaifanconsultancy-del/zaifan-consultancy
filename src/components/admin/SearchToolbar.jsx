function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions = [],
  statusFilter,
  setStatusFilter,
}) {
  const hasSearch = search.trim().length > 0;
  const hasFilter = statusFilter !== "All";
  const activeCount = (hasSearch ? 1 : 0) + (hasFilter ? 1 : 0);

  const placeholder =
    activeTab === "inquiries"
      ? "Search name, email, phone, country, field, priority..."
      : "Search name, email, phone, date, country, service, priority...";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
  };

  return (
    <div className="sticky top-[118px] z-30 mb-5 rounded-[1.3rem] border border-white/10 bg-[#050505]/85 p-2.5 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:top-24 sm:mb-8 sm:rounded-[1.7rem] sm:p-3">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 sm:left-5">
              ⌕
            </div>

            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-[1rem] border border-white/10 bg-white/[0.04] px-10 py-3 text-xs text-white outline-none transition duration-300 placeholder:text-gray-500 focus:border-[#D4AF37] focus:bg-white/[0.06] sm:rounded-[1.25rem] sm:px-12 sm:py-3.5 sm:text-sm"
            />

            {hasSearch && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-xs text-gray-400 transition hover:border-[#D4AF37]/30 hover:text-white sm:right-4"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:overflow-visible xl:pb-0">
            {statusOptions.map((status) => {
              const isActive = statusFilter === status;
              const isPriority = ["VIP", "High", "Medium", "Low"].includes(
                status
              );

              return (
                <button
                  key={status}
                  type="button"
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

        {(hasSearch || hasFilter) && (
          <div className="flex flex-col gap-2 rounded-[1rem] border border-[#D4AF37]/15 bg-[#D4AF37]/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.2rem] sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
                {activeCount} Active Filter{activeCount === 1 ? "" : "s"}
              </span>

              {hasSearch && (
                <span className="max-w-full truncate rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] text-gray-300">
                  Search: {search}
                </span>
              )}

              {hasFilter && (
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] text-gray-300">
                  Filter: {statusFilter}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-300 transition hover:border-[#D4AF37]/30 hover:text-white"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchToolbar;
