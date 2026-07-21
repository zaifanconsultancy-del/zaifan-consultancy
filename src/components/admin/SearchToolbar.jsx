import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Command,
  Filter,
  Keyboard,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const PRIORITY_FILTERS = ["VIP", "High", "Medium", "Low"];

const PRIORITY_STYLES = {
  VIP: {
    idle: "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-300 hover:bg-violet-100",
    active:
      "border-violet-600 bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.18)]",
    dot: "bg-violet-500",
  },
  High: {
    idle: "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
    active:
      "border-red-600 bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.16)]",
    dot: "bg-red-500",
  },
  Medium: {
    idle: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100",
    active:
      "border-amber-500 bg-amber-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]",
    dot: "bg-amber-500",
  },
  Low: {
    idle: "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100",
    active:
      "border-sky-600 bg-sky-600 text-white shadow-[0_10px_24px_rgba(2,132,199,0.16)]",
    dot: "bg-sky-500",
  },
};

function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions = [],
  statusFilter,
  setStatusFilter,
}) {
  const searchInputRef = useRef(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [keyboardHintVisible, setKeyboardHintVisible] = useState(true);

  const safeSearch = String(search || "");
  const safeStatusFilter = statusFilter || "All";

  const hasSearch = safeSearch.trim().length > 0;
  const hasFilter = safeStatusFilter !== "All";
  const activeCount = (hasSearch ? 1 : 0) + (hasFilter ? 1 : 0);

  const isAppointments = activeTab === "appointments";

  const placeholder = isAppointments
    ? "Search appointments by student, email, phone, date, service or priority..."
    : "Search students by name, email, phone, country, field or priority...";

  const contextLabel = isAppointments
    ? "Appointment Pipeline"
    : "Inquiry Pipeline";

  const contextDescription = isAppointments
    ? "Find consultations quickly, narrow appointment status, and keep the booking pipeline actionable."
    : "Find student leads quickly, narrow the pipeline, and keep the CRM workspace focused.";

  const normalizedStatusOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        (Array.isArray(statusOptions) ? statusOptions : [])
          .filter(Boolean)
          .map((item) => String(item))
      )
    );

    if (!unique.includes("All")) {
      return ["All", ...unique];
    }

    return unique;
  }, [statusOptions]);

  const groupedFilters = useMemo(() => {
    const priority = normalizedStatusOptions.filter((status) =>
      PRIORITY_FILTERS.includes(status)
    );

    const workflow = normalizedStatusOptions.filter(
      (status) => !PRIORITY_FILTERS.includes(status)
    );

    return {
      workflow,
      priority,
    };
  }, [normalizedStatusOptions]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setMobileFiltersOpen(false);
  };

  const focusSearch = () => {
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select?.();
    });
  };

  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        target?.isContentEditable;

      if (
        event.key === "/" &&
        !isTyping &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        focusSearch();
        setKeyboardHintVisible(false);
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        focusSearch();
        setKeyboardHintVisible(false);
        return;
      }

      if (event.key === "Escape") {
        if (mobileFiltersOpen) {
          setMobileFiltersOpen(false);
          return;
        }

        if (hasSearch) {
          setSearch("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [hasSearch, mobileFiltersOpen, setSearch]);

  useEffect(() => {
    if (!keyboardHintVisible) return;

    const timer = window.setTimeout(() => {
      setKeyboardHintVisible(false);
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyboardHintVisible]);

  const renderFilterButton = (status, compact = false) => {
    const isActive = safeStatusFilter === status;
    const isPriority = PRIORITY_FILTERS.includes(status);
    const priorityStyle = PRIORITY_STYLES[status];

    const idleClass = isPriority
      ? priorityStyle?.idle
      : "border-orange-100 bg-white text-[#526178] hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#fff1ea] hover:text-[#ff4b12]";

    const activeClass = isPriority
      ? priorityStyle?.active
      : "border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_10px_24px_rgba(255,75,18,0.18)]";

    return (
      <button
        key={status}
        type="button"
        onClick={() => {
          setStatusFilter(status);
          setMobileFiltersOpen(false);
        }}
        aria-pressed={isActive}
        className={`group inline-flex items-center gap-2 whitespace-nowrap border font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION} ${
          compact
            ? "rounded-xl px-3 py-2 text-[10px]"
            : "rounded-xl px-3.5 py-2.5 text-[11px]"
        } ${isActive ? activeClass : idleClass}`}
      >
        {isPriority ? (
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-white" : priorityStyle?.dot || "bg-slate-400"
            }`}
          />
        ) : (
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              isActive
                ? "border-white/40 bg-white/15"
                : "border-orange-100 bg-[#fffaf5]"
            }`}
          >
            {isActive ? <Check size={10} strokeWidth={3} /> : null}
          </span>
        )}

        {status}
      </button>
    );
  };

  return (
    <section className="sticky top-[92px] z-30 mb-5 sm:top-24">
      <div className="overflow-hidden rounded-[1.7rem] border border-orange-100 bg-white/95 shadow-[0_18px_60px_rgba(7,31,80,0.08)] backdrop-blur-2xl">
        <div className="relative overflow-hidden border-b border-orange-100 bg-gradient-to-r from-[#fff1ea] via-[#fffaf5] to-white px-4 py-4 sm:px-5">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-orange-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm">
                  <SlidersHorizontal size={11} />
                  Pipeline Controls
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                  <Sparkles size={11} />
                  {isAppointments ? "Consultation Workspace" : "CRM Workspace"}
                </span>

                {activeCount > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {activeCount} Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-[#fffaf5] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#71809a]">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    Showing all records
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-4">
                <div>
                  <h3 className="text-lg font-black tracking-tight text-[#071f50] sm:text-xl">
                    {contextLabel}
                  </h3>

                  <p className="mt-1 max-w-3xl text-xs font-medium leading-5 text-[#526178]">
                    {contextDescription}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterPanelOpen((current) => !current)}
                className={`hidden items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-3.5 py-2.5 text-xs font-black text-[#071f50] shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#fff1ea] hover:text-[#ff4b12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 sm:inline-flex ${TRANSITION}`}
              >
                <Filter size={14} />
                {filterPanelOpen ? "Hide Filters" : "Show Filters"}
                <ChevronDown
                  size={14}
                  className={`${TRANSITION} ${
                    filterPanelOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen((current) => !current)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-3.5 py-2.5 text-xs font-black text-[#071f50] shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#fff1ea] hover:text-[#ff4b12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 sm:hidden ${TRANSITION}`}
              >
                <Filter size={14} />
                Filters
                {hasFilter ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff4b12] px-1 text-[9px] text-white">
                    1
                  </span>
                ) : null}
              </button>

              {(hasSearch || hasFilter) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border border-orange-100 bg-white px-3.5 py-2.5 text-xs font-black text-[#526178] shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#fff1ea] hover:text-[#ff4b12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION}`}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-3 sm:p-4">
          <div className="relative">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#ff4b12]"
              />

              <input
                ref={searchInputRef}
                type="search"
                placeholder={placeholder}
                value={safeSearch}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={() => setKeyboardHintVisible(false)}
                aria-label={`Search ${contextLabel.toLowerCase()}`}
                className={`w-full rounded-2xl border border-orange-100 bg-[#fffaf5] py-4 pl-12 pr-28 text-sm font-semibold text-[#071f50] outline-none placeholder:font-medium placeholder:text-[#93a0b3] focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100 ${TRANSITION}`}
              />

              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {hasSearch ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#71809a] shadow-sm hover:border-orange-200 hover:bg-[#fff1ea] hover:text-[#ff4b12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION}`}
                  >
                    <X size={14} />
                  </button>
                ) : null}

                <div className="hidden items-center gap-1 rounded-lg border border-orange-100 bg-white px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#71809a] sm:flex">
                  <Command size={11} />
                  K
                </div>
              </div>
            </div>

            {keyboardHintVisible && !hasSearch ? (
              <div className="mt-2 flex items-center gap-2 px-1 text-[10px] font-semibold text-[#71809a]">
                <Keyboard size={12} className="text-[#ff4b12]" />
                Press <span className="font-black text-[#071f50]">/</span> or{" "}
                <span className="font-black text-[#071f50]">Ctrl/⌘ + K</span> to
                jump into search.
              </div>
            ) : null}
          </div>

          <div
            className={`${TRANSITION} ${
              filterPanelOpen
                ? "max-h-[460px] opacity-100"
                : "pointer-events-none hidden max-h-0 opacity-0 sm:block"
            }`}
          >
            <div className="hidden rounded-[1.35rem] border border-orange-100 bg-[#fffaf5] p-3 sm:block sm:p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="min-w-0">
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <Filter size={13} className="text-[#ff4b12]" />
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#71809a]">
                      Workflow Status
                    </p>
                  </div>

                  <div className="flex max-w-full flex-wrap gap-2">
                    {groupedFilters.workflow.map((status) =>
                      renderFilterButton(status)
                    )}
                  </div>
                </div>

                {groupedFilters.priority.length > 0 ? (
                  <div className="min-w-0 xl:max-w-[470px]">
                    <div className="mb-2.5 flex items-center gap-2 px-1">
                      <Sparkles size={13} className="text-[#ff4b12]" />
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#71809a]">
                        Priority Views
                      </p>
                    </div>

                    <div className="flex max-w-full flex-wrap gap-2">
                      {groupedFilters.priority.map((status) =>
                        renderFilterButton(status)
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {mobileFiltersOpen ? (
            <div className="rounded-[1.35rem] border border-orange-100 bg-[#fffaf5] p-3 sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                    Quick Filters
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#526178]">
                    Choose one view for the current pipeline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border border-orange-100 bg-white text-[#71809a] hover:border-orange-200 hover:text-[#ff4b12] ${TRANSITION}`}
                  aria-label="Close filters"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#71809a]">
                  Workflow
                </p>

                <div className="flex flex-wrap gap-2">
                  {groupedFilters.workflow.map((status) =>
                    renderFilterButton(status, true)
                  )}
                </div>
              </div>

              {groupedFilters.priority.length > 0 ? (
                <div className="mt-4 border-t border-orange-100 pt-4">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#71809a]">
                    Priority
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {groupedFilters.priority.map((status) =>
                      renderFilterButton(status, true)
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {(hasSearch || hasFilter) && (
            <div className="relative overflow-hidden rounded-[1.25rem] border border-orange-200 bg-gradient-to-r from-[#fff1ea] via-[#fffaf5] to-white p-3 sm:p-4">
              <div className="pointer-events-none absolute -right-10 -top-14 h-28 w-28 rounded-full bg-orange-200/25 blur-2xl" />

              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#ff4b12] shadow-sm">
                    {activeCount} active filter{activeCount === 1 ? "" : "s"}
                  </span>

                  {hasSearch && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className={`group inline-flex max-w-full items-center gap-2 truncate rounded-full border border-orange-100 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#526178] shadow-sm hover:border-orange-200 hover:text-[#ff4b12] ${TRANSITION}`}
                    >
                      <Search size={11} />
                      <span className="max-w-[260px] truncate">
                        “{safeSearch}”
                      </span>
                      <X
                        size={11}
                        className="opacity-50 group-hover:opacity-100"
                      />
                    </button>
                  )}

                  {hasFilter && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter("All")}
                      className={`group inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#526178] shadow-sm hover:border-orange-200 hover:text-[#ff4b12] ${TRANSITION}`}
                    >
                      <Filter size={11} />
                      {safeStatusFilter}
                      <X
                        size={11}
                        className="opacity-50 group-hover:opacity-100"
                      />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION}`}
                >
                  <RotateCcw size={12} />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SearchToolbar;
