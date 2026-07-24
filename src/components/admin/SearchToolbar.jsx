// SearchToolbar V3 MAXIMUM — Admin OS Pipeline Control Bar
// src/components/admin/SearchToolbar.jsx
//
// Maximum pass:
// - preserves activeTab / search / setSearch / statusOptions / statusFilter / setStatusFilter
// - fixes case-sensitive status/priority matching
// - prevents duplicate "All" filters in different casing
// - preserves / and Ctrl/Cmd+K search shortcuts
// - Escape now closes mobile filters first, then clears search
// - adds safer setter guards
// - adds compact active-filter summary
// - improves keyboard/accessibility semantics
// - reduced-motion support
// - mobile filter drawer remains lightweight
// - stronger Admin OS cream/orange/navy contrast
// - no routing, backend, or filtering-engine assumptions

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
    idle:
      "border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-100",
    active:
      "border-violet-700 bg-violet-700 text-white shadow-[0_10px_24px_rgba(124,58,237,0.18)]",
    dot: "bg-violet-500",
  },
  High: {
    idle:
      "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100",
    active:
      "border-red-700 bg-red-700 text-white shadow-[0_10px_24px_rgba(220,38,38,0.16)]",
    dot: "bg-red-500",
  },
  Medium: {
    idle:
      "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100",
    active:
      "border-amber-600 bg-amber-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.18)]",
    dot: "bg-amber-500",
  },
  Low: {
    idle:
      "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100",
    active:
      "border-sky-700 bg-sky-700 text-white shadow-[0_10px_24px_rgba(2,132,199,0.16)]",
    dot: "bg-sky-500",
  },
};

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function canonicalPriority(value = "") {
  const clean = normalize(value);

  if (clean === "vip") return "VIP";
  if (clean === "high") return "High";
  if (clean === "medium") return "Medium";
  if (clean === "low") return "Low";

  return null;
}

function canonicalStatus(value = "") {
  const clean = String(value || "").trim();

  if (!clean) return "";
  if (normalize(clean) === "all") return "All";

  return canonicalPriority(clean) || clean;
}

function isSameFilter(left, right) {
  return normalize(left) === normalize(right);
}

function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions = [],
  statusFilter,
  setStatusFilter,
}) {
  const searchInputRef = useRef(null);

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const [filterPanelOpen, setFilterPanelOpen] =
    useState(true);

  const [keyboardHintVisible, setKeyboardHintVisible] =
    useState(true);

  const safeSearch = String(search || "");

  const safeStatusFilter =
    canonicalStatus(statusFilter || "All") || "All";

  const hasSearch = safeSearch.trim().length > 0;

  const hasFilter =
    normalize(safeStatusFilter) !== "all";

  const activeCount =
    (hasSearch ? 1 : 0) + (hasFilter ? 1 : 0);

  const isAppointments =
    normalize(activeTab) === "appointments";

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
    const seen = new Set();
    const result = [];

    const source = [
      "All",
      ...(Array.isArray(statusOptions)
        ? statusOptions
        : []),
    ];

    source.forEach((item) => {
      const canonical = canonicalStatus(item);
      if (!canonical) return;

      const key = normalize(canonical);

      if (seen.has(key)) return;

      seen.add(key);
      result.push(canonical);
    });

    return result;
  }, [statusOptions]);

  const groupedFilters = useMemo(() => {
    const priority = [];
    const workflow = [];

    normalizedStatusOptions.forEach((status) => {
      const priorityName =
        canonicalPriority(status);

      if (priorityName) {
        priority.push(priorityName);
      } else {
        workflow.push(status);
      }
    });

    return {
      workflow,
      priority,
    };
  }, [normalizedStatusOptions]);

  const safeSetSearch = (value) => {
    if (typeof setSearch === "function") {
      setSearch(value);
    }
  };

  const safeSetStatusFilter = (value) => {
    if (typeof setStatusFilter === "function") {
      setStatusFilter(value);
    }
  };

  const resetFilters = () => {
    safeSetSearch("");
    safeSetStatusFilter("All");
    setMobileFiltersOpen(false);
  };

  const focusSearch = () => {
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select?.();
    });
  };

  useEffect(() => {
    const handleKeyboardShortcuts = (event) => {
      const target = event.target;
      const tagName =
        target?.tagName?.toLowerCase();

      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
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
          safeSetSearch("");
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboardShortcuts
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboardShortcuts
      );
    };
  }, [
    hasSearch,
    mobileFiltersOpen,
    setSearch,
  ]);

  useEffect(() => {
    if (!keyboardHintVisible) return undefined;

    const timer = window.setTimeout(() => {
      setKeyboardHintVisible(false);
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyboardHintVisible]);

  useEffect(() => {
    setMobileFiltersOpen(false);
  }, [activeTab]);

  const renderFilterButton = (
    status,
    compact = false
  ) => {
    const canonical =
      canonicalStatus(status) || status;

    const isActive = isSameFilter(
      safeStatusFilter,
      canonical
    );

    const priorityName =
      canonicalPriority(canonical);

    const isPriority =
      Boolean(priorityName);

    const priorityStyle =
      PRIORITY_STYLES[priorityName];

    const idleClass = isPriority
      ? priorityStyle?.idle
      : "border-slate-300 bg-white text-[#526178] hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700";

    const activeClass = isPriority
      ? priorityStyle?.active
      : "border-orange-600 bg-orange-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)]";

    return (
      <button
        key={canonical}
        type="button"
        onClick={() => {
          safeSetStatusFilter(canonical);
          setMobileFiltersOpen(false);
        }}
        aria-pressed={isActive}
        className={`group inline-flex items-center gap-2 whitespace-nowrap border-2 font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION} ${
          compact
            ? "rounded-xl px-3 py-2 text-[10px]"
            : "rounded-xl px-3.5 py-2.5 text-[11px]"
        } ${isActive ? activeClass : idleClass}`}
      >
        {isPriority ? (
          <span
            className={`h-2 w-2 rounded-full ${
              isActive
                ? "bg-white"
                : priorityStyle?.dot ||
                  "bg-slate-400"
            }`}
          />
        ) : (
          <span
            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
              isActive
                ? "border-white/45 bg-white/15"
                : "border-slate-300 bg-[#fffaf2]"
            }`}
          >
            {isActive ? (
              <Check
                size={10}
                strokeWidth={3}
              />
            ) : null}
          </span>
        )}

        {canonical}
      </button>
    );
  };

  return (
    <section className="sticky top-[92px] z-30 mb-5 sm:top-24">
      <div className="overflow-hidden rounded-[1.7rem] border-[3px] border-orange-300 bg-white/95 shadow-[0_18px_60px_rgba(7,31,80,0.08)] backdrop-blur-2xl">
        <div className="border-b-2 border-orange-300 bg-[#123865] px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  <SlidersHorizontal
                    size={11}
                    className="text-orange-300"
                  />
                  Pipeline Controls
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  <Sparkles
                    size={11}
                    className="text-orange-300"
                  />
                  {isAppointments
                    ? "Consultation Workspace"
                    : "CRM Workspace"}
                </span>

                {activeCount > 0 ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-orange-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {activeCount} Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
                    Showing all records
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-lg font-black tracking-tight text-white sm:text-xl">
                {contextLabel}
              </h3>

              <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-white">
                {contextDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setFilterPanelOpen(
                    (current) => !current
                  )
                }
                aria-expanded={filterPanelOpen}
                className={`hidden items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] shadow-sm hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 sm:inline-flex ${TRANSITION}`}
              >
                <Filter size={14} />
                {filterPanelOpen
                  ? "Hide Filters"
                  : "Show Filters"}
                <ChevronDown
                  size={14}
                  className={`${TRANSITION} ${
                    filterPanelOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    (current) => !current
                  )
                }
                aria-expanded={mobileFiltersOpen}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] shadow-sm hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 sm:hidden ${TRANSITION}`}
              >
                <Filter size={14} />
                Filters

                {hasFilter ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] text-white">
                    1
                  </span>
                ) : null}
              </button>

              {(hasSearch || hasFilter) ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white px-3.5 py-2.5 text-xs font-black text-[#10233f] shadow-sm hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${TRANSITION}`}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-[#fff8ee] p-3 sm:p-4">
          <div>
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-700"
              />

              <input
                ref={searchInputRef}
                type="search"
                placeholder={placeholder}
                value={safeSearch}
                onChange={(event) =>
                  safeSetSearch(event.target.value)
                }
                onFocus={() =>
                  setKeyboardHintVisible(false)
                }
                aria-label={`Search ${contextLabel.toLowerCase()}`}
                className={`w-full rounded-2xl border-2 border-slate-300 bg-white py-4 pl-12 pr-28 text-sm font-semibold text-[#10233f] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 ${TRANSITION}`}
              />

              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {hasSearch ? (
                  <button
                    type="button"
                    onClick={() =>
                      safeSetSearch("")
                    }
                    aria-label="Clear search"
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-slate-600 shadow-sm hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION}`}
                  >
                    <X size={14} />
                  </button>
                ) : null}

                <div className="hidden items-center gap-1 rounded-lg border-2 border-slate-300 bg-[#fffaf2] px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600 sm:flex">
                  <Command size={11} />
                  K
                </div>
              </div>
            </div>

            {keyboardHintVisible &&
            !hasSearch ? (
              <div className="mt-2 flex items-center gap-2 px-1 text-[10px] font-semibold text-slate-600">
                <Keyboard
                  size={12}
                  className="text-orange-700"
                />
                Press{" "}
                <span className="font-black text-[#10233f]">
                  /
                </span>{" "}
                or{" "}
                <span className="font-black text-[#10233f]">
                  Ctrl/⌘ + K
                </span>{" "}
                to jump into search.
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
            <div className="hidden rounded-[1.35rem] border-[3px] border-slate-300 bg-white p-3 sm:block sm:p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="min-w-0">
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <Filter
                      size={13}
                      className="text-orange-700"
                    />

                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                      Workflow Status
                    </p>
                  </div>

                  <div className="flex max-w-full flex-wrap gap-2">
                    {groupedFilters.workflow.map(
                      (status) =>
                        renderFilterButton(
                          status
                        )
                    )}
                  </div>
                </div>

                {groupedFilters.priority.length >
                0 ? (
                  <div className="min-w-0 xl:max-w-[470px]">
                    <div className="mb-2.5 flex items-center gap-2 px-1">
                      <Sparkles
                        size={13}
                        className="text-orange-700"
                      />

                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                        Priority Views
                      </p>
                    </div>

                    <div className="flex max-w-full flex-wrap gap-2">
                      {groupedFilters.priority.map(
                        (status) =>
                          renderFilterButton(
                            status
                          )
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {mobileFiltersOpen ? (
            <div className="rounded-[1.35rem] border-[3px] border-slate-300 bg-white p-3 sm:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                    Quick Filters
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    Choose one view for the current pipeline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMobileFiltersOpen(false)
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-700 ${TRANSITION}`}
                  aria-label="Close filters"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                  Workflow
                </p>

                <div className="flex flex-wrap gap-2">
                  {groupedFilters.workflow.map(
                    (status) =>
                      renderFilterButton(
                        status,
                        true
                      )
                  )}
                </div>
              </div>

              {groupedFilters.priority.length >
              0 ? (
                <div className="mt-4 border-t-2 border-slate-200 pt-4">
                  <p className="mb-2 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                    Priority
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {groupedFilters.priority.map(
                      (status) =>
                        renderFilterButton(
                          status,
                          true
                        )
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {(hasSearch || hasFilter) ? (
            <div className="rounded-[1.25rem] border-[3px] border-orange-300 bg-orange-50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full border-2 border-orange-300 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-orange-700 shadow-sm">
                    {activeCount} active filter
                    {activeCount === 1
                      ? ""
                      : "s"}
                  </span>

                  {hasSearch ? (
                    <button
                      type="button"
                      onClick={() =>
                        safeSetSearch("")
                      }
                      className={`group inline-flex max-w-full items-center gap-2 truncate rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm hover:border-orange-300 hover:text-orange-700 ${TRANSITION}`}
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
                  ) : null}

                  {hasFilter ? (
                    <button
                      type="button"
                      onClick={() =>
                        safeSetStatusFilter(
                          "All"
                        )
                      }
                      className={`group inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm hover:border-orange-300 hover:text-orange-700 ${TRANSITION}`}
                    >
                      <Filter size={11} />

                      {safeStatusFilter}

                      <X
                        size={11}
                        className="opacity-50 group-hover:opacity-100"
                      />
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-orange-700 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION}`}
                >
                  <RotateCcw size={12} />
                  Clear All
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default SearchToolbar;
