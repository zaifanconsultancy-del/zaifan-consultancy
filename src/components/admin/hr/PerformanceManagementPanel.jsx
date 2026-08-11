import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CircleGauge,
  Database,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import ZaifanMetricCard from "../ui/ZaifanMetricCard";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function hasPerformance(person = {}) {
  return (
    person.performanceAvailable === true &&
    person.performanceScore !== null &&
    person.performanceScore !== undefined &&
    Number.isFinite(Number(person.performanceScore))
  );
}

function tone(score) {
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

function MetricCard({
  label,
  value,
  helper = "",
  detail = "",
  tone = "blue",
  toneName = "",
  icon: Icon = null,
  badge = "",
  source = "",
  className = "",
}) {
  const resolvedTone = normalizeZaifanMetricTone(toneName || tone);
  const resolvedDetail = [helper || detail, badge, source]
    .filter((item) => typeof item === "string" && item.trim())
    .join(" · ");

  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={resolvedDetail}
      icon={Icon}
      tone={resolvedTone}
      className={className}
    />
  );
}

function normalizeZaifanMetricTone(tone) {
  const value = String(tone || "").trim().toLowerCase();

  if (["green", "emerald", "good", "success", "healthy", "connected"].includes(value)) {
    return "green";
  }

  if (["red", "rose", "danger", "risk", "critical", "failed", "error"].includes(value)) {
    return "red";
  }

  if (["amber", "yellow", "warning", "warn"].includes(value)) {
    return "amber";
  }

  if (["violet", "purple"].includes(value)) {
    return "violet";
  }

  if (["orange", "gold"].includes(value)) {
    return "orange";
  }

  if (["blue", "cyan", "teal", "info"].includes(value)) {
    return "blue";
  }

  if (["slate", "gray", "grey", "muted"].includes(value)) {
    return "slate";
  }

  return "navy";
}

function PerformanceRow({ person, rank, compact }) {
  const available = hasPerformance(person);
  const score = available ? clampPercent(person.performanceScore) : null;

  const taskCompletionRate =
    person.taskCompletionRate === null ||
    person.taskCompletionRate === undefined ||
    !Number.isFinite(Number(person.taskCompletionRate))
      ? null
      : clampPercent(person.taskCompletionRate);

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-4"
            : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_19rem_12rem] xl:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-sm font-black text-[#B84F0E]">
              {rank}
            </span>

            <div className="min-w-0">
              <p className="break-words font-black text-[#10233F]">
                {person.name}
              </p>

              <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                {person.role} · {person.department}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${tone(
                score
              )}`}
            >
              {available ? `${score}% operating index` : "Index not measured"}
            </span>

            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
              {person.performanceBasis || "No workload evidence"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MiniMetric label="Done" value={person.completedTasks} />
          <MiniMetric label="Open" value={person.openTasks} />
          <MiniMetric label="Overdue" value={person.overdueTasks} danger={safeNumber(person.overdueTasks) > 0} />
          <MiniMetric label="Apps" value={person.applications} />
        </div>

        <div
          className={`rounded-[1.25rem] border-[3px] border-[#E1E8F0] bg-[#FFF8EF] p-3 ${
            compact ? "flex items-center justify-between gap-3" : ""
          }`}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Task Completion
          </p>

          <div className={compact ? "text-right" : ""}>
            <p className={`${compact ? "mt-0 text-lg" : "mt-2 text-xl"} font-black text-[#10233F]`}>
              {taskCompletionRate === null
                ? "N/A"
                : `${taskCompletionRate}%`}
            </p>

            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
              {taskCompletionRate === null
                ? "Not measured · Awaiting linked task evidence."
                : `${safeNumber(person.completedTasks)} completed of ${safeNumber(
                    person.tasks
                  )} linked tasks.`}
            </p>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 border-t-2 border-[#E1E8F0] pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Operating evidence
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This is a workload-delivery signal from connected operational
                records. It must not be used as a formal appraisal, compensation
                score, promotion decision, or disciplinary rating.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-blue-700">
                {safeNumber(person.support)} support
              </span>

              <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-blue-700">
                {safeNumber(person.applications)} applications
              </span>
            </div>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-[#E1E8F0] bg-[#FFF8EF]">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                available ? "bg-[#F97316]" : "bg-slate-300"
              }`}
              style={{
                width: `${available ? Math.max(4, score) : 0}%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function MiniMetric({ label, value }) {
  return <ZaifanMetricCard level="baby" label={label} value={value} tone="slate" />;
}

export default function PerformanceManagementPanel({
  hr = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [evidenceFilter, setEvidenceFilter] = useState("all");

  const people = safeArray(hr.people);

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

  const rows = useMemo(() => {
    const search = lower(query);

    return [...people]
      .filter((person) => {
        if (
          departmentFilter !== "all" &&
          person.department !== departmentFilter
        ) {
          return false;
        }

        if (
          evidenceFilter === "measurable" &&
          !hasPerformance(person)
        ) {
          return false;
        }

        if (
          evidenceFilter === "unavailable" &&
          hasPerformance(person)
        ) {
          return false;
        }

        if (!search) return true;

        return [
          person.name,
          person.role,
          person.department,
          person.email,
          person.performanceBasis,
        ]
          .map(lower)
          .join(" ")
          .includes(search);
      })
      .sort((a, b) => {
        const aAvailable = hasPerformance(a);
        const bAvailable = hasPerformance(b);

        if (aAvailable && !bAvailable) return -1;
        if (!aAvailable && bAvailable) return 1;

        if (!aAvailable && !bAvailable) {
          return String(a.name || "").localeCompare(String(b.name || ""));
        }

        return (
          Number(b.performanceScore) -
          Number(a.performanceScore)
        );
      });
  }, [people, query, departmentFilter, evidenceFilter]);

  const visible = compact ? rows.slice(0, 5) : rows;

  const measurable = people.filter(hasPerformance);
  const hasPeople = people.length > 0;
  const hasMeasurableEvidence = measurable.length > 0;

  const averageIndex = measurable.length
    ? Math.round(
        measurable.reduce(
          (sum, person) => sum + Number(person.performanceScore),
          0
        ) / measurable.length
      )
    : null;

  const strongCount = measurable.filter(
    (person) => Number(person.performanceScore) >= 80
  ).length;

  const riskCount = measurable.filter(
    (person) =>
      Number(person.performanceScore) < 60 ||
      safeNumber(person.overdueTasks) > 0
  ).length;

  const totalOverdue = people.reduce(
    (sum, person) => sum + safeNumber(person.overdueTasks),
    0
  );

  const filtersActive =
    Boolean(query.trim()) ||
    departmentFilter !== "all" ||
    evidenceFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setDepartmentFilter("all");
    setEvidenceFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <CircleGauge size={12} />
            Performance Management
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Operational Performance Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Workload-delivery evidence from tasks, applications and support
            activity. Zaifan keeps this separate from formal HR appraisal,
            compensation or disciplinary decisions.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Measurable Team
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {measurable.length}/{people.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Team members with enough connected operational evidence for an
            index.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Not an appraisal score
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Average Index"
              value={hasMeasurableEvidence ? `${averageIndex}%` : "N/A"}
              helper={
                hasMeasurableEvidence
                  ? `Average across ${measurable.length} measurable team member${
                      measurable.length === 1 ? "" : "s"
                    }.`
                  : "Not assessed · No measurable operational evidence yet."
              }
              toneName={
                hasMeasurableEvidence
                  ? averageIndex >= 75
                    ? "green"
                    : "amber"
                  : "slate"
              }
              icon={CircleGauge}
              className="h-full"
            />

            <MetricCard
              label="Strong Evidence"
              value={hasMeasurableEvidence ? strongCount : "N/A"}
              helper={
                hasMeasurableEvidence
                  ? "Measurable team members with an index of 80% or above."
                  : "Not assessed · No measurable team evidence yet."
              }
              toneName={hasMeasurableEvidence ? "green" : "slate"}
              icon={TrendingUp}
              className="h-full"
            />

            <MetricCard
              label="Needs Attention"
              value={hasMeasurableEvidence ? riskCount : "N/A"}
              helper={
                hasMeasurableEvidence
                  ? "Low operating index and/or overdue-task pressure."
                  : "Not assessed · No measurable team evidence yet."
              }
              toneName={
                hasMeasurableEvidence
                  ? riskCount > 0
                    ? "red"
                    : "green"
                  : "slate"
              }
              icon={
                hasMeasurableEvidence && riskCount > 0
                  ? AlertTriangle
                  : BadgeCheck
              }
              className="h-full"
            />

            <MetricCard
              label="Overdue Tasks"
              value={hasPeople ? totalOverdue : "N/A"}
              helper={
                hasPeople
                  ? "Total overdue task evidence across the current team."
                  : "Not assessed · No team records are available."
              }
              toneName={
                hasPeople
                  ? totalOverdue > 0
                    ? "amber"
                    : "green"
                  : "slate"
              }
              icon={BriefcaseBusiness}
              className="h-full"
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
                placeholder="Search employee, role, department, evidence..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department === "all"
                    ? "All Departments"
                    : department}
                </option>
              ))}
            </select>

            <select
              value={evidenceFilter}
              onChange={(event) =>
                setEvidenceFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Evidence</option>
              <option value="measurable">Measurable Only</option>
              <option value="unavailable">Unavailable Only</option>
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
            visible.map((person, index) => (
              <PerformanceRow
                key={person.id}
                person={person}
                rank={index + 1}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
                <UsersRound size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No performance evidence found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the performance filters."
                  : "Operational performance becomes measurable when employee identities are linked to real task, application or support activity."}
              </p>
            </div>
          )}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Scoring Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Operational signal only
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Do not use this index by itself for salary, promotion,
                    discipline or termination decisions.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Evidence Model
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Tasks + support + applications
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Missing activity domains remain missing instead of being
                    filled with fake performance values.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <TrendingDown
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Ranking Caveat
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Evidence ranking, not employee worth
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Higher workload visibility can change the index. Use it to
                    investigate operations, not to label people.
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
