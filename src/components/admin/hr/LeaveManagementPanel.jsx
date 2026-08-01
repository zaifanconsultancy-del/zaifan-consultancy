import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("approved")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("reject") ||
    value.includes("declined") ||
    value.includes("denied")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    value.includes("pending") ||
    value.includes("requested") ||
    value.includes("review")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function formatDate(value) {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function calculateDays(start, end) {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    return null;
  }

  const diff =
    Math.floor(
      (endDate.setHours(0, 0, 0, 0) -
        startDate.setHours(0, 0, 0, 0)) /
        86400000
    ) + 1;

  return diff > 0 ? diff : null;
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
}) {
  const tones = {
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#60A5FA] bg-[#F2F7FF]",
  };

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 break-words text-2xl font-black text-[#10233F]">
            {value}
          </p>
        </div>

        {Icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function LeaveCard({ leave, compact }) {
  const days = calculateDays(leave.start, leave.end);

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_15rem_10rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
              <CalendarDays size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words font-black text-[#10233F]">
                {leave.employee}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-600">
                {leave.type}
              </p>
            </div>
          </div>

          {!compact ? (
            <div className="mt-3 rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Reason
              </p>

              <p className="mt-1 break-words text-xs font-semibold leading-5 text-[#10233F]">
                {leave.reason || "No reason provided"}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Start
            </p>
            <p className="mt-1 text-xs font-black text-[#10233F]">
              {formatDate(leave.start)}
            </p>
          </div>

          <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              End
            </p>
            <p className="mt-1 text-xs font-black text-[#10233F]">
              {formatDate(leave.end)}
            </p>
          </div>

          {!compact ? (
            <div className="col-span-2 rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Duration
              </p>
              <p className="mt-1 text-xs font-black text-[#10233F]">
                {days === null
                  ? "Unavailable"
                  : `${days} day${days === 1 ? "" : "s"}`}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-2 xl:items-end">
          <span
            className={`inline-flex rounded-lg border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.07em] ${statusTone(
              leave.status
            )}`}
          >
            {leave.status || "Unknown"}
          </span>

          {leave.employeeId ? (
            <span className="inline-flex rounded-full border-2 border-[#34D399] bg-[#F0FFF8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-emerald-700">
              Identity linked
            </span>
          ) : (
            <span className="inline-flex rounded-full border-2 border-[#F59E0B] bg-[#FFF8E8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-amber-800">
              Legacy person reference
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function LeaveManagementPanel({
  hr = {},
  compact = false,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");

  const leaves = safeArray(hr.leaves);

  const types = useMemo(
    () => [
      "all",
      ...new Set(
        leaves
          .map((leave) => String(leave.type || "").trim())
          .filter(Boolean)
      ),
    ],
    [leaves]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return leaves.filter((leave) => {
      if (
        statusFilter !== "all" &&
        !lower(leave.status).includes(statusFilter)
      ) {
        return false;
      }

      if (
        typeFilter !== "all" &&
        String(leave.type || "") !== typeFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        leave.employee,
        leave.type,
        leave.status,
        leave.reason,
        leave.start,
        leave.end,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [leaves, statusFilter, typeFilter, query]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const pending = leaves.filter((leave) => {
    const status = lower(leave.status);
    return (
      status.includes("pending") ||
      status.includes("requested") ||
      status.includes("review")
    );
  }).length;

  const approved = leaves.filter((leave) =>
    lower(leave.status).includes("approved")
  ).length;

  const declined = leaves.filter((leave) => {
    const status = lower(leave.status);
    return (
      status.includes("reject") ||
      status.includes("declined") ||
      status.includes("denied")
    );
  }).length;

  const identityLinked = leaves.filter((leave) => leave.employeeId).length;

  const filtersActive =
    Boolean(query.trim()) ||
    statusFilter !== "all" ||
    typeFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <CalendarDays size={12} />
            Leave Management
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Time Off Control
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Evidence-based leave visibility for requests, approvals,
            availability and identity linkage. This panel does not invent
            approval actions when no HR write integration exists.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Open Leave Queue
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {pending}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Pending, requested or review-state leave records.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Read-only until actions are wired
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Leave"
              value={leaves.length}
              helper="All currently connected leave records."
              tone="blue"
              icon={CalendarDays}
            />

            <MetricCard
              label="Pending"
              value={pending}
              helper="Requests still awaiting a final status."
              tone={pending > 0 ? "amber" : "green"}
              icon={Clock3}
            />

            <MetricCard
              label="Approved"
              value={approved}
              helper="Leave records already approved."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Declined"
              value={declined}
              helper={`${identityLinked}/${leaves.length} leave records have a direct employee identity.`}
              tone={declined > 0 ? "red" : "blue"}
              icon={declined > 0 ? AlertTriangle : UserRoundCheck}
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search employee, leave type, status, reason..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending / Requested</option>
              <option value="approved">Approved</option>
              <option value="reject">Rejected / Declined</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Leave Types" : type}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 transition hover:border-[#F97316] hover:text-[#B84F0E] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {visible.length ? (
            visible.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
                <CalendarDays size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No leave records found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the leave filters."
                  : "Real leave records will appear when a leave/time-off source is connected to HR OS."}
              </p>
            </div>
          )}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Action Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No fake approval controls
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Approve/reject buttons should only appear after the real
                    Supabase leave table, permissions and write handlers are
                    confirmed.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <UsersRound
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Identity Coverage
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {identityLinked}/{leaves.length} directly linked
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Direct employee IDs are preferred. Legacy display-name
                    references remain visible instead of being silently treated
                    as fully linked identities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
