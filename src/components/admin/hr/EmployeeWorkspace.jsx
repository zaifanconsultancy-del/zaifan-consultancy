import React, { useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Mail,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react";

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("active")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value.includes("leave")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("inactive") ||
    value.includes("left") ||
    value.includes("terminated") ||
    value.includes("disabled")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function performanceTone(score) {
  if (score === null || score === undefined || !Number.isFinite(Number(score))) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  const value = Number(score);

  if (value >= 80) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value >= 60) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
}

function roleLabel(person = {}) {
  const roles = Array.isArray(person.roles)
    ? person.roles.filter(Boolean)
    : [];

  if (roles.length > 1) {
    return roles.join(" + ");
  }

  return person.role || roles[0] || "Team Member";
}

function EvidencePill({ children, tone = "blue" }) {
  const tones = {
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    green: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    amber: "border-[#F59E0B] bg-[#FFF8E8] text-amber-800",
    slate: "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
        tones[tone] || tones.blue
      }`}
    >
      {children}
    </span>
  );
}

function EmployeeCard({ person, compact }) {
  const performanceAvailable =
    Boolean(person.performanceAvailable) &&
    Number.isFinite(Number(person.performanceScore));

  const performanceScore = performanceAvailable
    ? clampPercent(person.performanceScore)
    : null;

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-4"
            : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_17rem_12rem] xl:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-[#F2F7FF] text-[#123865]">
              <UsersRound size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words text-lg font-black text-[#10233F]">
                {person.name}
              </p>

              <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                {roleLabel(person)} · {person.department}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                person.status
              )}`}
            >
              {person.status || "Unknown"}
            </span>

            <EvidencePill tone="slate">
              {person.sourceCount || 1} source
              {(person.sourceCount || 1) === 1 ? "" : "s"}
            </EvidencePill>

            {person.userId ? (
              <EvidencePill tone="green">Identity linked</EvidencePill>
            ) : (
              <EvidencePill tone="amber">Legacy identity</EvidencePill>
            )}
          </div>

          <div
            className={
              compact
                ? "mt-3 grid gap-2 text-xs"
                : "mt-3 grid gap-2 text-xs sm:grid-cols-2"
            }
          >
            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-slate-500" />
                <span className="font-black text-slate-500">Email</span>
              </div>
              <p className="mt-1 break-all font-semibold text-[#10233F]">
                {person.email || "Not available"}
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
              <div className="flex items-center gap-2">
                <UserRoundCheck size={13} className="text-slate-500" />
                <span className="font-black text-slate-500">Manager</span>
              </div>
              <p className="mt-1 break-words font-semibold text-[#10233F]">
                {person.manager || "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        <div
          className={
            compact
              ? "grid grid-cols-4 gap-2"
              : "grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2"
          }
        >
          <MiniMetric label="Tasks" value={person.tasks} />
          <MiniMetric label="Open" value={person.openTasks} />
          <MiniMetric label="Support" value={person.support} />
          <MiniMetric label="Apps" value={person.applications} />
        </div>

        <div className="min-w-0">
          <div
            className={`rounded-[1.25rem] border-[3px] p-3 ${performanceTone(
              performanceScore
            )} ${compact ? "flex items-center justify-between gap-3" : ""}`}
          >
            <p className="text-[8px] font-black uppercase tracking-[0.1em]">
              Operating Index
            </p>

            <div className={compact ? "text-right" : ""}>
              <p className={`${compact ? "mt-0 text-lg" : "mt-2 text-xl"} font-black text-[#10233F]`}>
                {performanceAvailable ? `${performanceScore}%` : "Not measured"}
              </p>

              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
                {person.performanceBasis || "Awaiting workload evidence"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 border-t-2 border-[#E1E8F0] pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Operational performance evidence
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This index reflects connected workload evidence only. It is not
                a formal HR appraisal, salary rating, or disciplinary score.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <EvidencePill tone={person.overdueTasks > 0 ? "amber" : "green"}>
                {person.overdueTasks || 0} overdue
              </EvidencePill>

              <EvidencePill tone="blue">
                {person.taskCompletionRate === null ||
                person.taskCompletionRate === undefined
                  ? "Task rate unavailable"
                  : `${person.taskCompletionRate}% task completion`}
              </EvidencePill>
            </div>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-[#E1E8F0] bg-[#FFF8EF]">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                performanceAvailable ? "bg-[#F97316]" : "bg-slate-300"
              }`}
              style={{
                width: `${performanceAvailable ? Math.max(4, performanceScore) : 0}%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3 text-center">
      <p className="text-base font-black text-[#10233F]">{safeNumber(value)}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default function EmployeeWorkspace({ hr = {}, compact = false }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const people = Array.isArray(hr.people) ? hr.people : [];

  const departments = useMemo(
    () => [
      "all",
      ...new Set(
        people
          .map((person) => person.department)
          .filter(Boolean)
      ),
    ],
    [people]
  );

  const statuses = useMemo(
    () => [
      "all",
      ...new Set(
        people
          .map((person) => lower(person.status))
          .filter(Boolean)
      ),
    ],
    [people]
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return people.filter((person) => {
      if (
        department !== "all" &&
        person.department !== department
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        lower(person.status) !== statusFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        person.name,
        person.email,
        roleLabel(person),
        person.department,
        person.status,
        person.manager,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [people, query, department, statusFilter]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const activeCount = people.filter((person) => person.active).length;
  const identityLinked = people.filter((person) => person.userId).length;
  const measurableCount = people.filter(
    (person) => person.performanceAvailable
  ).length;

  const filtersActive =
    Boolean(query.trim()) ||
    department !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setDepartment("all");
    setStatusFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <UsersRound size={12} />
            Employee Workspace
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Team Directory
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            One deduplicated human directory across Admin, Counselor and staff
            identities, with workload evidence kept separate from formal HR
            appraisal.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Visible Team
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {filtered.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {people.length} unique people in the current HR identity snapshot.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            UUID-first identity
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Identity Coverage
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {identityLinked}/{people.length} linked
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    People with a direct user/auth identity rather than a legacy
                    display-name fallback.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Active Team
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {activeCount}/{people.length}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Active status is derived from the merged HR identity
                    snapshot.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <BriefcaseBusiness
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Measurable Workload
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {measurableCount}/{people.length}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Team members with enough connected operational evidence to
                    show an index.
                  </p>
                </div>
              </div>
            </div>
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
                placeholder="Search employee, role, email, department, manager..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Departments" : item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "all"
                    ? "All Statuses"
                    : item.replaceAll("_", " ")}
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
            visible.map((person) => (
              <EmployeeCard
                key={person.id}
                person={person}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
                <UsersRound size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No employees found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the directory filters."
                  : "People will appear when Admin, Counselor or staff identity sources are connected to the HR snapshot."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}