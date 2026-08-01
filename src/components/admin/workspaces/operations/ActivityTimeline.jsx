// ActivityTimeline PARTNER OS EXTREME V6 — CRM Activity Command Center
// src/components/admin/ActivityTimeline.jsx
//
// Maximum pass:
// - scales beyond a tiny 8-row feed with local search/filter/sort/pagination
// - preserves inquiry + appointment live data from parent
// - stronger operational hierarchy and readable Admin OS contrast
// - shows ownership, status, priority, age, and urgency clearly
// - avoids fake Supabase writes: this component is read-only and intentionally
//   consumes live parent CRM data instead of duplicating backend queries
// - resilient date parsing, empty states, mobile layout, reduced-motion support
// - no destructive actions inside analytics feed

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Filter,
  Flame,
  Inbox,
  Search,
  SlidersHorizontal,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

const PAGE_SIZE_OPTIONS = [8, 12, 20, 40];

const normalize = (value = "") =>
  String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

const safeDateMs = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value) => {
  const ms = safeDateMs(value);
  if (!ms) return "Date unavailable";

  try {
    return new Date(ms).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Date unavailable";
  }
};

const getAgeLabel = (value) => {
  const ms = safeDateMs(value);
  if (!ms) return "Age unknown";

  const diff = Math.max(0, Date.now() - ms);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getPriority = (item = {}) => normalize(item.priority || "low");

const getOwner = (item = {}) =>
  item.assigned_admin_name ||
  item.assigned_to_name ||
  item.counselor_name ||
  "";

const getInquiryDetail = (item = {}) =>
  item.country ||
  item.field_of_interest ||
  item.program ||
  item.study_field ||
  "New inquiry received";

const getAppointmentDetail = (item = {}) => {
  if (item.appointment_date && item.appointment_time) {
    return `${item.appointment_date} · ${item.appointment_time}`;
  }

  return (
    item.consultation_type ||
    item.country_interest ||
    item.country ||
    "New appointment booked"
  );
};

function ActivityTimeline({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  const activities = useMemo(() => {
    const inquiryActivities = (Array.isArray(inquiries) ? inquiries : []).map(
      (inquiry) => ({
        id: `inquiry-${inquiry.id}`,
        rawId: inquiry.id,
        type: "inquiry",
        typeLabel: "Inquiry",
        status: normalize(inquiry.status || "new"),
        priority: getPriority(inquiry),
        name: inquiry.full_name || inquiry.name || "Unknown Student",
        detail: getInquiryDetail(inquiry),
        owner: getOwner(inquiry),
        date: inquiry.created_at || inquiry.updated_at || null,
      })
    );

    const appointmentActivities = (
      Array.isArray(appointments) ? appointments : []
    ).map((appointment) => ({
      id: `appointment-${appointment.id}`,
      rawId: appointment.id,
      type: "appointment",
      typeLabel: "Appointment",
      status: normalize(appointment.status || "pending"),
      priority: getPriority(appointment),
      name: appointment.full_name || appointment.name || "Unknown Student",
      detail: getAppointmentDetail(appointment),
      owner: getOwner(appointment),
      date: appointment.created_at || appointment.updated_at || null,
    }));

    return [...inquiryActivities, ...appointmentActivities];
  }, [inquiries, appointments]);

  const stats = useMemo(() => {
    let assigned = 0;
    let hot = 0;
    let last24h = 0;
    let inquiryCount = 0;
    let appointmentCount = 0;

    const now = Date.now();

    for (const item of activities) {
      if (item.owner) assigned += 1;

      if (["vip", "high"].includes(item.priority)) {
        hot += 1;
      }

      const itemTimestamp = safeDateMs(item.date);
      if (itemTimestamp > 0 && now - itemTimestamp <= 86400000) {
        last24h += 1;
      }

      if (item.type === "inquiry") {
        inquiryCount += 1;
      } else if (item.type === "appointment") {
        appointmentCount += 1;
      }
    }

    return {
      total: activities.length,
      assigned,
      openPool: Math.max(activities.length - assigned, 0),
      hot,
      last24h,
      inquiries: inquiryCount,
      appointments: appointmentCount,
    };
  }, [activities]);

  const statusOptions = useMemo(
    () =>
      [...new Set(activities.map((item) => item.status).filter(Boolean))].sort(),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    const filtered = activities.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }
      if (ownershipFilter === "assigned" && !item.owner) return false;
      if (ownershipFilter === "open" && item.owner) return false;

      if (!cleanQuery) return true;

      return [
        item.name,
        item.detail,
        item.owner,
        item.typeLabel,
        item.status,
        item.priority,
        item.rawId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(cleanQuery);
    });

    const priorityRank = { vip: 4, high: 3, medium: 2, low: 1 };

    return [...filtered].sort((a, b) => {
      if (sortMode === "oldest") {
        return safeDateMs(a.date) - safeDateMs(b.date);
      }

      if (sortMode === "priority") {
        const priorityDiff =
          (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
      }

      if (sortMode === "unassigned") {
        const ownerDiff = Number(Boolean(a.owner)) - Number(Boolean(b.owner));
        if (ownerDiff !== 0) return ownerDiff;
      }

      return safeDateMs(b.date) - safeDateMs(a.date);
    });
  }, [
    activities,
    query,
    typeFilter,
    statusFilter,
    priorityFilter,
    ownershipFilter,
    sortMode,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedActivities = filteredActivities.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const rangeStart =
    filteredActivities.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filteredActivities.length);

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setOwnershipFilter("all");
    setSortMode("newest");
    setPage(1);
  };

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section
      className={`${cardClass} min-w-0 space-y-5 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_22px_60px_rgba(18,56,101,0.14)] sm:p-4`}
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.10)] xl:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
        <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">
              <Activity size={12} />
              CRM Activity Feed
            </span>
          </div>

          <h2 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
            Recent CRM Activity
          </h2>

          <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
            Live inquiry and appointment activity from the parent Admin CRM data.
            This feed is intentionally read-only so analytics never duplicates or
            mutates Supabase records.
          </p>

          <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <HeroStat label="Total" value={stats.total} />
            <HeroStat label="Last 24h" value={stats.last24h} />
            <HeroStat label="Assigned" value={stats.assigned} />
            <HeroStat label="Open Pool" value={stats.openPool} />
          </div>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:p-7 xl:border-l-[3px] xl:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
            Attention Snapshot
          </p>

          <p className="mt-3 text-4xl font-black text-white">{stats.hot}</p>
          <p className="mt-1 text-sm font-black text-white">
            VIP / high-priority records
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <OrangeStat label="Inquiries" value={stats.inquiries} />
            <OrangeStat label="Appointments" value={stats.appointments} />
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <section className="min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#FF5A0A]" />
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
              Activity Controls
            </p>
          </div>

          <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <div className="relative min-w-0 md:col-span-2 xl:col-span-3 2xl:col-span-2">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search student, owner, status, country, program..."
                className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <select
              value={typeFilter}
              onChange={updateFilter(setTypeFilter)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All types</option>
              <option value="inquiry">Inquiries</option>
              <option value="appointment">Appointments</option>
            </select>

            <select
              value={statusFilter}
              onChange={updateFilter(setStatusFilter)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {pretty(status)}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={updateFilter(setPriorityFilter)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All priority</option>
              <option value="vip">VIP</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={ownershipFilter}
              onChange={updateFilter(setOwnershipFilter)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All ownership</option>
              <option value="assigned">Assigned</option>
              <option value="open">Open pool</option>
            </select>

            <select
              value={sortMode}
              onChange={updateFilter(setSortMode)}
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Priority first</option>
              <option value="unassigned">Open pool first</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 min-w-0 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8]"
            >
              <Filter size={14} />
              Reset
            </button>
          </div>

          <div className="mt-3 flex min-w-0 flex-col gap-3 text-xs font-bold text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <span className="min-w-0 break-words">
              Showing {rangeStart}–{rangeEnd} of {filteredActivities.length} matching
              records · {stats.total} total CRM records
            </span>

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 w-fit shrink-0 rounded-lg border-2 border-[#C9D7E6] bg-white px-2 text-[11px] font-black text-[#10233F] outline-none focus:border-[#FF5A0A]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </section>

        {activities.length === 0 ? (
          <EmptyState
            title="No CRM activity yet"
            text="New inquiries and appointments will appear here as live parent CRM data arrives."
          />
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="No matching CRM activity"
            text="The CRM has records, but none match the current search and filters."
          />
        ) : (
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            {pagedActivities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        )}

        {filteredActivities.length > pageSize ? (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPrevious={() =>
              setPage((previous) => Math.max(1, previous - 1))
            }
            onNext={() =>
              setPage((previous) => Math.min(totalPages, previous + 1))
            }
          />
        ) : null}
      </div>
    </section>
  );
}

function ActivityCard({ activity, index, shouldReduceMotion }) {
  const TypeIcon =
    activity.type === "appointment" ? CalendarCheck2 : Inbox;

  const isHot = ["vip", "high"].includes(activity.priority);
  const isAssigned = Boolean(activity.owner);

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.28,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.025, 0.18),
      }}
      className="group relative min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 pl-5 shadow-[0_8px_22px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-[0_12px_30px_rgba(18,56,101,0.09)]"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${
          activity.priority === "vip" || activity.priority === "high"
            ? "bg-[#FB7185]"
            : activity.priority === "medium"
              ? "bg-[#FF5A0A]"
              : "bg-[#60A5FA]"
        }`}
      />

      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 ${
            activity.type === "appointment"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
          }`}
        >
          <TypeIcon size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              label={activity.typeLabel}
              tone={activity.type === "appointment" ? "green" : "blue"}
            />
            <Badge label={pretty(activity.status)} tone={getStatusTone(activity.status)} />
            <Badge label={pretty(activity.priority)} tone={getPriorityTone(activity.priority)} />
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="break-words text-base font-black leading-5 text-[#10233F]">
                {activity.name}
              </h3>
              <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                {activity.detail}
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <p className="text-[10px] font-black text-slate-500">
                {getAgeLabel(activity.date)}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                {formatDate(activity.date)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-[10px] font-black ${
                isAssigned
                  ? "border-blue-300 bg-blue-50 text-blue-800"
                  : "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]"
              }`}
            >
              {isAssigned ? <UserRoundCheck size={12} /> : <UsersRound size={12} />}
              {activity.owner || "Open lead pool"}
            </span>

            {isHot ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-800">
                {activity.priority === "vip" ? (
                  <Crown size={12} />
                ) : (
                  <Flame size={12} />
                )}
                Needs fast follow-up
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Badge({ label, tone = "slate" }) {
  const styles = {
    orange: "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    red: "border-red-300 bg-red-50 text-red-800",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    violet: "border-violet-300 bg-violet-50 text-violet-800",
    slate: "border-[#C9D7E6] bg-[#FFF8EF] text-slate-700",
  };

  return (
    <span
      className={`max-w-full rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
        styles[tone] || styles.slate
      }`}
    >
      {label}
    </span>
  );
}

function getPriorityTone(priority) {
  if (priority === "vip") return "red";
  if (priority === "high") return "red";
  if (priority === "medium") return "orange";
  return "slate";
}

function getStatusTone(status) {
  if (["contacted", "confirmed", "completed"].includes(status)) return "green";
  if (["cancelled", "rejected"].includes(status)) return "red";
  if (["pending", "new"].includes(status)) return "blue";
  if (["in_progress", "processing"].includes(status)) return "blue";
  return "slate";
}

function HeroStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function OrangeStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-8 text-center shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
      <Clock3 size={30} className="mx-auto text-[#FF5A0A]" />
      <h3 className="mt-3 text-lg font-black text-[#10233F]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function Pagination({ page, totalPages, onPrevious, onNext }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-3 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
      <button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={14} />
        Previous
      </button>

      <p className="text-xs font-black text-[#10233F]">
        Page {page} of {totalPages}
      </p>

      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function pretty(value = "") {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default ActivityTimeline;
