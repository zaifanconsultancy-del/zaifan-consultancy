// SearchToolbar V4 — contextual Leads pipeline toolbar
// src/components/admin/core/SearchToolbar.jsx
//
// Batch 19 ownership cleanup:
// - only owns local Inquiry/Appointment search + status/priority filtering
// - "/" focuses local search
// - Ctrl/Cmd + K is intentionally NOT captured here; it belongs to the global
//   Admin Command Palette
// - removes the second large "header" visual from pipeline pages
// - keeps the existing public prop API and filtering semantics
// - mobile and desktop use the same compact filter model

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const PRIORITY_FILTERS = ["VIP", "High", "Medium", "Low"];

const PRIORITY_STYLES = {
  VIP: {
    idle: "border-[#FF5A0A] bg-[#FFF4EA] text-[#B84F0E]",
    active: "border-orange-600 bg-[#FF5A0A] text-white",
  },
  High: {
    idle: "border-red-200 bg-red-50 text-red-700",
    active: "border-red-700 bg-red-700 text-white",
  },
  Medium: {
    idle: "border-amber-200 bg-amber-50 text-amber-800",
    active: "border-amber-600 bg-amber-500 text-white",
  },
  Low: {
    idle: "border-sky-200 bg-sky-50 text-sky-700",
    active: "border-sky-700 bg-sky-700 text-white",
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

function SearchToolbar({
  activeTab,
  search,
  setSearch,
  statusOptions = [],
  statusFilter,
  setStatusFilter,
}) {
  const searchInputRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const safeSearch = String(search || "");
  const safeStatusFilter =
    canonicalStatus(statusFilter || "All") || "All";

  const hasSearch = safeSearch.trim().length > 0;
  const hasFilter = normalize(safeStatusFilter) !== "all";
  const activeCount = Number(hasSearch) + Number(hasFilter);

  const isAppointments = normalize(activeTab) === "appointments";
  const contextLabel = isAppointments ? "Appointments" : "Inquiries";

  const placeholder = isAppointments
    ? "Search appointments by student, email, phone, date or service…"
    : "Search inquiries by student, email, phone, country or field…";

  const normalizedStatusOptions = useMemo(() => {
    const seen = new Set();
    const result = [];

    ["All", ...(Array.isArray(statusOptions) ? statusOptions : [])].forEach(
      (item) => {
        const canonical = canonicalStatus(item);
        if (!canonical) return;

        const key = normalize(canonical);
        if (seen.has(key)) return;

        seen.add(key);
        result.push(canonical);
      }
    );

    return result;
  }, [statusOptions]);

  const groupedFilters = useMemo(() => {
    const workflow = [];
    const priority = [];

    normalizedStatusOptions.forEach((status) => {
      const priorityName = canonicalPriority(status);

      if (priorityName) priority.push(priorityName);
      else workflow.push(status);
    });

    return { workflow, priority };
  }, [normalizedStatusOptions]);

  const safeSetSearch = (value) => {
    if (typeof setSearch === "function") setSearch(value);
  };

  const safeSetStatusFilter = (value) => {
    if (typeof setStatusFilter === "function") {
      setStatusFilter(value);
    }
  };

  const resetFilters = () => {
    safeSetSearch("");
    safeSetStatusFilter("All");
  };

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const tag = target?.tagName?.toLowerCase();

      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      if (
        event.key === "/" &&
        !isTyping &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape" && hasSearch) {
        safeSetSearch("");
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [hasSearch, setSearch]);

  useEffect(() => {
    setFiltersOpen(false);
  }, [activeTab]);

  const renderFilter = (status) => {
    const canonical = canonicalStatus(status) || status;
    const isActive =
      normalize(safeStatusFilter) === normalize(canonical);
    const priorityName = canonicalPriority(canonical);
    const priorityStyle = PRIORITY_STYLES[priorityName];

    return (
      <button
        key={canonical}
        type="button"
        onClick={() => safeSetStatusFilter(canonical)}
        aria-pressed={isActive}
        className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border-2 px-2.5 py-1.5 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
          isActive
            ? priorityStyle?.active ||
              "border-orange-600 bg-[#FF5A0A] text-white"
            : priorityStyle?.idle ||
              "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-[#FFF4EA] hover:text-[#B84F0E]"
        }`}
      >
        {isActive ? <Check size={11} /> : null}
        {canonical}
      </button>
    );
  };

  return (
    <section className="overflow-hidden rounded-[1.25rem] border-2 border-[#123865] bg-[#FFFDF8]">
      <div className="flex flex-col gap-3 p-3 sm:p-3.5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-2 lg:w-[180px]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-orange-200 bg-orange-50 text-[#B84F0E]">
            <SlidersHorizontal size={15} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-black text-[#10233F]">
              {contextLabel}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Local pipeline tools
            </p>
          </div>
        </div>

        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B84F0E]"
          />

          <input
            ref={searchInputRef}
            type="search"
            value={safeSearch}
            onChange={(event) => safeSetSearch(event.target.value)}
            placeholder={placeholder}
            aria-label={`Search ${contextLabel.toLowerCase()}`}
            className="h-11 w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-[#FF5A0A]/15"
          />

          {hasSearch ? (
            <button
              type="button"
              onClick={() => safeSetSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-[#FFF4EA] hover:text-[#B84F0E]"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 px-3 text-xs font-black transition ${
              filtersOpen || hasFilter
                ? "border-orange-500 bg-orange-50 text-[#B84F0E]"
                : "border-[#123865] bg-white text-[#123865] hover:border-orange-300"
            }`}
          >
            <Filter size={14} />
            Filters
            {hasFilter ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF5A0A] px-1 text-[9px] text-white">
                1
              </span>
            ) : null}
            <ChevronDown
              size={13}
              className={`transition ${filtersOpen ? "rotate-180" : ""}`}
            />
          </button>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-orange-300 hover:bg-[#FFF4EA] hover:text-[#B84F0E]"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          ) : null}
        </div>
      </div>

      {filtersOpen ? (
        <div className="border-t-2 border-[#123865]/15 bg-[#FFF8EF] px-3 py-3 sm:px-3.5">
          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                Workflow
              </p>
              <div className="flex flex-wrap gap-1.5">
                {groupedFilters.workflow.map(renderFilter)}
              </div>
            </div>

            {groupedFilters.priority.length ? (
              <div>
                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Priority
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {groupedFilters.priority.map(renderFilter)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-orange-300 bg-orange-50 px-3 py-2">
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
            Active:
          </span>

          {hasSearch ? (
            <button
              type="button"
              onClick={() => safeSetSearch("")}
              className="inline-flex max-w-[260px] items-center gap-1.5 rounded-full border border-orange-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600"
            >
              <Search size={10} />
              <span className="truncate">{safeSearch}</span>
              <X size={10} />
            </button>
          ) : null}

          {hasFilter ? (
            <button
              type="button"
              onClick={() => safeSetStatusFilter("All")}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600"
            >
              <Filter size={10} />
              {safeStatusFilter}
              <X size={10} />
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default SearchToolbar;
