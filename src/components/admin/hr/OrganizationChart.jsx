import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Database,
  Network,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasPerformance(department = {}) {
  return (
    department.performanceAvailable === true &&
    department.avgPerformance !== null &&
    department.avgPerformance !== undefined &&
    Number.isFinite(Number(department.avgPerformance))
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function toneClass(tone = "blue") {
  const tones = {
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#60A5FA] bg-[#F2F7FF]",
    navy: "border-[#123865] bg-[#123865]",
  };

  return tones[tone] || tones.blue;
}

function OrgMetric({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${toneClass(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function DepartmentCard({ department, compact = false }) {
  const performanceAvailable = hasPerformance(department);
  const performance = performanceAvailable
    ? clampPercent(department.avgPerformance)
    : null;

  const activeShare =
    safeNumber(department.headcount) > 0
      ? Math.round(
          (safeNumber(department.active) /
            safeNumber(department.headcount)) *
            100
        )
      : null;

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-4"
            : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem_12rem] xl:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
              <Building2 size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words text-lg font-black text-[#10233F]">
                {department.name}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-600">
                {safeNumber(department.headcount)} people ·{" "}
                {safeNumber(department.active)} active
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-blue-700">
              {activeShare === null
                ? "Active share unavailable"
                : `${activeShare}% active`}
            </span>

            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
              Department summary
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniMetric label="Tasks" value={department.tasks} />
          <MiniMetric label="Apps" value={department.applications} />
          <MiniMetric
            label="Index"
            value={
              performanceAvailable ? `${performance}%` : "—"
            }
          />
        </div>

        <div
          className={`rounded-[1.25rem] border-[3px] p-3 ${
            performanceAvailable
              ? performance >= 80
                ? "border-[#34D399] bg-[#F0FFF8]"
                : performance >= 60
                  ? "border-[#F59E0B] bg-[#FFF8E8]"
                  : "border-[#FB7185] bg-[#FFF4F4]"
              : "border-[#60A5FA] bg-[#F2F7FF]"
          }`}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Operating Index
          </p>

          <p className="mt-2 text-xl font-black text-[#10233F]">
            {performanceAvailable ? `${performance}%` : "Not measured"}
          </p>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
            {performanceAvailable
              ? `${department.measurablePerformanceCount || 0} measurable team member${
                  (department.measurablePerformanceCount || 0) === 1 ? "" : "s"
                }`
              : "No measurable workload evidence in this department."}
          </p>
        </div>
      </div>

      {!compact ? (
      <div className="mt-4 border-t-2 border-[#E1E8F0] pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Department evidence bar
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              This bar visualises the department operating index only. It is not
              a formal department appraisal or management-quality score.
            </p>
          </div>

          <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
            {safeNumber(department.headcount)} headcount
          </span>
        </div>

        <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-[#D1DCE7] bg-[#FFF8EF]">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              performanceAvailable ? "bg-[#F97316]" : "bg-slate-300"
            }`}
            style={{
              width: `${performanceAvailable ? Math.max(4, performance) : 0}%`,
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
      <p className="text-base font-black text-[#10233F]">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

export default function OrganizationChart({
  hr = {},
  compact = false,
}) {
  const departments = safeArray(hr.departments);
  const people = safeArray(hr.people);

  const visible = compact
    ? departments.slice(0, 4)
    : departments;

  const measurableDepartments = departments.filter(
    hasPerformance
  );

  const totalHeadcount = departments.reduce(
    (sum, department) =>
      sum + safeNumber(department.headcount),
    0
  );

  const totalActive = departments.reduce(
    (sum, department) =>
      sum + safeNumber(department.active),
    0
  );

  const largestDepartment = useMemo(() => {
    if (!departments.length) return null;

    return [...departments].sort(
      (a, b) =>
        safeNumber(b.headcount) -
        safeNumber(a.headcount)
    )[0];
  }, [departments]);

  const avgDepartmentIndex = measurableDepartments.length
    ? Math.round(
        measurableDepartments.reduce(
          (sum, department) =>
            sum + Number(department.avgPerformance),
          0
        ) / measurableDepartments.length
      )
    : null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Network size={12} />
            Organization Structure
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Department Structure
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Founder-level department view for unique headcount, active people,
            workload and operational evidence. This is a department summary,
            not a fabricated reporting hierarchy.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Current Organization
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {departments.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Departments built from {people.length || totalHeadcount} unique HR
            identities.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Summary view · not org hierarchy
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <OrgMetric
              label="Departments"
              value={departments.length}
              helper="Operating units inferred from current people records."
              tone="navy"
              icon={Building2}
              badge="Real structure"
            />

            <OrgMetric
              label="Headcount"
              value={totalHeadcount}
              helper={`${totalActive} currently active.`}
              tone="blue"
              icon={UsersRound}
            />

            <OrgMetric
              label="Largest Department"
              value={
                largestDepartment
                  ? largestDepartment.name
                  : "Unavailable"
              }
              helper={
                largestDepartment
                  ? `${safeNumber(
                      largestDepartment.headcount
                    )} people`
                  : "No department data available."
              }
              tone="violet"
              icon={Network}
            />

            <OrgMetric
              label="Avg Operating Index"
              value={
                avgDepartmentIndex === null
                  ? "Unavailable"
                  : `${avgDepartmentIndex}%`
              }
              helper={
                avgDepartmentIndex === null
                  ? "No departments have measurable workload evidence."
                  : `Average across ${measurableDepartments.length} measurable department${
                      measurableDepartments.length === 1
                        ? ""
                        : "s"
                    }.`
              }
              tone={
                avgDepartmentIndex === null
                  ? "blue"
                  : avgDepartmentIndex >= 75
                    ? "green"
                    : "amber"
              }
              icon={ShieldCheck}
              badge="Operational only"
            />
          </div>
        ) : null}

        <div className="space-y-3">
          {visible.length ? (
            visible.map((department) => (
              <DepartmentCard
                key={department.name}
                department={department}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <Network size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No department structure found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Departments will appear when HR OS receives real employee,
                counselor or staff identity records.
              </p>
            </div>
          )}
        </div>

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
                    Structure Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Deduplicated people first
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Headcount comes from the identity-safe HR parent so one human
                    with Admin + Counselor access is not counted twice.
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
                    Hierarchy Evidence
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Department summary only
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A true manager-report tree should only be shown after
                    reliable manager IDs/reporting relationships are connected.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Performance Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Operating evidence, not department rating
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Department index is derived from measurable workload evidence
                    and must not be interpreted as team quality or manager
                    performance by itself.
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
