// StudentWorkspaceNavigation PARTNER OS EXTREME — Student 360 Command Rail
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
    <aside className="zaifan-student-nav h-full max-h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] border-b-[3px] border-[#FF5A0A] bg-[#123865] p-3 text-white lg:border-b-0 lg:border-r-[3px] lg:border-[#FF5A0A] sm:p-3.5">
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          <input
            type="search"
            value={panelSearch}
            onChange={(event) => setPanelSearch(event.target.value)}
            placeholder="Search student case modules..."
            className="min-h-11 w-full min-w-0 rounded-xl border-2 border-white/20 bg-white/10 py-3 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:font-medium placeholder:text-white/45 transition focus:border-[#FF5A0A] focus:bg-white/15 focus:ring-4 focus:ring-orange-300/20"
          />
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.id || group.title}>
            <div className="mb-2 px-1">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-200">
                {group.title}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold leading-4 text-white/50">
                {group.description}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-1.5 lg:grid-cols-1">
              {group.items.map(([id, label, description, Icon]) => {
                const isActive = activePanel === id;

                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      setActivePanel(id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full min-w-0 rounded-[1rem] border-2 px-3 py-2.5 text-left shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/20 sm:px-3.5 ${
                      isActive
                        ? "border-white/35 bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,90,10,0.24)]"
                        : "border-white/15 bg-white/8 text-white shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:border-white/35 hover:bg-white/12"
                    }`}
                  >
                    <span className="flex items-center gap-3 text-xs font-semibold sm:text-sm">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "border-2 border-white/30 bg-white/15 text-white"
                            : "border-2 border-white/15 bg-white/10 text-orange-100"
                        }`}
                      >
                        <Icon size={15} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{label}</span>
                        <span className="mt-0.5 hidden truncate text-[10px] font-medium text-white/55 sm:block">
                          {description}
                        </span>
                      </span>

                      <ChevronRight size={14} className="shrink-0 text-white/45" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mb-3 mt-4 rounded-[1.2rem] border-[3px] border-[#FF5A0A] bg-white/10 p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.10)]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">
          Current Journey
        </p>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-white/15 bg-white/10">
          <div
            className="h-full rounded-full bg-[#FF5A0A] transition-all duration-500"
            style={{ width: `${pipelineProgress || 0}%` }}
          />
        </div>

        <p className="mt-2 text-right text-[11px] font-black text-white">
          {pipelineProgress || 0}% complete
        </p>
      </div>
    </aside>
  );
}

export default StudentWorkspaceNavigation;