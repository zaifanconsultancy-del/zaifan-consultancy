import { ChevronRight, Search } from "lucide-react";

function StudentWorkspaceNavigation({
  groups = [],
  activePanel,
  setActivePanel,
  panelSearch,
  setPanelSearch,
  setMobileNavOpen,
  pipelineProgress = 0,
}) {
  return (
    <aside className="zaifan-student-nav h-full max-h-full min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] border-b-[3px] border-[#D7E1EB] bg-[#FFF9F2] p-3.5 lg:border-b-0 lg:border-r-[3px] lg:border-[#D7E1EB]">
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={panelSearch}
            onChange={(event) => setPanelSearch(event.target.value)}
            placeholder="Search student case modules..."
            className="w-full rounded-xl border-2 border-[#B9C9D9] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#152238] outline-none placeholder:font-medium placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.id || group.title}>
            <div className="mb-2 px-1">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-600">
                {group.title}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-slate-400">
                {group.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {group.items.map(([id, label, description, Icon]) => {
                const isActive = activePanel === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActivePanel(id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full min-w-0 rounded-[1rem] border-2 px-3 py-2.5 text-left transition sm:px-4 ${
                      isActive
                        ? "border-[#D94F08] bg-[#E96512] text-white shadow-[0_8px_18px_rgba(249,115,22,0.20)]"
                        : "border-[#C9D7E6] bg-white text-[#24324a] shadow-[0_3px_10px_rgba(15,23,42,0.04)] hover:border-[#F97316] hover:bg-[#FFF4E8]"
                    }`}
                  >
                    <span className="flex items-center gap-3 text-xs font-semibold sm:text-sm">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "border border-white/30 bg-white/15 text-white"
                            : "border border-[#D1DCE7] bg-[#FFF8EE] text-[#315B88]"
                        }`}
                      >
                        <Icon size={15} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{label}</span>
                        <span className="mt-0.5 hidden truncate text-[10px] font-medium opacity-60 sm:block">
                          {description}
                        </span>
                      </span>

                      <ChevronRight size={14} className="shrink-0 opacity-40" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mb-3 mt-4 rounded-[1.1rem] border-2 border-[#F97316] bg-[#FFFDF8] p-3.5 shadow-[0_5px_14px_rgba(15,35,63,0.04)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Current Journey
        </p>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${pipelineProgress || 0}%` }}
          />
        </div>

        <p className="mt-2 text-right text-[11px] font-black text-orange-700">
          {pipelineProgress || 0}% complete
        </p>
      </div>
    </aside>
  );
}

export default StudentWorkspaceNavigation;
