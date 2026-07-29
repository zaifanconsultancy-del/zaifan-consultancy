import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Globe2,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function stageTone(stage = "") {
  const value = lower(stage);

  if (value.includes("visa")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value.includes("cas")) {
    return "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700";
  }

  if (value.includes("offer")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (value.includes("application")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value.includes("planning")) {
    return "border-[#F97316] bg-[#FFF4E8] text-orange-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function sourceState(student = {}) {
  const unassigned = student.agent === "Direct / Unassigned";

  if (unassigned) {
    return {
      label: "Unassigned source",
      className:
        "border-[#F59E0B] bg-[#FFF8E8] text-amber-800",
    };
  }

  if (student.agentIdentityConfirmed) {
    return {
      label: "Confirmed agent",
      className:
        "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    };
  }

  return {
    label: "Observed source",
    className:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
  };
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
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

function StudentRow({ student, compact }) {
  const source = sourceState(student);
  const unassigned = student.agent === "Direct / Unassigned";

  if (compact) {
    return (
      <article className="rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-3 shadow-[0_5px_16px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] xl:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
              <UserRound size={15} />
            </div>

            <div className="min-w-0">
              <p className="truncate font-black text-[#10233F]">
                {student.name}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                {student.email || student.phone || "No contact recorded"}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:justify-end">
            <span
              className={`max-w-full truncate rounded-full border-2 px-2 py-1 text-[7px] font-black uppercase tracking-[0.06em] ${source.className}`}
            >
              {source.label}
            </span>

            <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2 py-1 text-[7px] font-black uppercase tracking-[0.06em] text-blue-700">
              {student.country || "Unknown"}
            </span>

            <span
              className={`inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] ${stageTone(
                student.stage
              )}`}
            >
              {student.stage || "Lead"}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.35fr)_minmax(12rem,0.8fr)_minmax(12rem,0.8fr)_9rem] xl:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
            <UserRound size={16} />
          </div>

          <div className="min-w-0">
            <p className="[overflow-wrap:anywhere] text-base font-black text-[#10233F]">
              {student.name}
            </p>

            <p className="mt-1 truncate text-[11px] font-semibold text-slate-600">
              {student.email || "No email recorded"}
            </p>

            <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
              {student.phone || "No phone recorded"}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={`max-w-full truncate rounded-full border-2 px-2 py-1 text-[7px] font-black uppercase tracking-[0.06em] ${source.className}`}
              >
                {source.label}
              </span>

              <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2 py-1 text-[7px] font-black uppercase tracking-[0.06em] text-blue-700">
                {student.country || "Country unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Student Status
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {student.status || "Unknown"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Agent Attribution
          </p>
          <p
            className={`mt-1 truncate text-xs font-black ${
              unassigned
                ? "text-amber-700"
                : student.agentIdentityConfirmed
                  ? "text-emerald-700"
                  : "text-blue-700"
            }`}
          >
            {unassigned ? "Needs assignment" : student.agent}
          </p>
        </div>

        <div className="flex xl:justify-end">
          <span
            className={`inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] ${stageTone(
              student.stage
            )}`}
          >
            {student.stage || "Lead"}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border-2 border-[#E1E8F0] bg-[#F7FAFC] p-3">
        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
          Attribution interpretation
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          {unassigned
            ? "This student has no confirmed agent source. Resolve attribution before agent performance or commission decisions."
            : student.agentIdentityConfirmed
              ? "The student is linked to a confirmed agent identity in Agent Operations."
              : "An agent/referrer name is present, but no confirmed agent account/profile currently backs that source identity."}
        </p>
      </div>
    </article>
  );
}

export default function AgentStudentsWorkspace({
  agentOS = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const students = safeArray(agentOS.students);

  const countries = useMemo(
    () => [
      "all",
      ...new Set(
        students
          .map((student) => String(student.country || "").trim())
          .filter(Boolean)
      ),
    ],
    [students]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return students.filter((student) => {
      const unassigned =
        student.agent === "Direct / Unassigned";
      const confirmed = Boolean(
        student.agentIdentityConfirmed
      );

      if (
        stageFilter !== "all" &&
        !lower(student.stage).includes(stageFilter)
      ) {
        return false;
      }

      if (
        sourceFilter === "confirmed" &&
        (!confirmed || unassigned)
      ) {
        return false;
      }

      if (
        sourceFilter === "observed" &&
        (confirmed || unassigned)
      ) {
        return false;
      }

      if (
        sourceFilter === "unassigned" &&
        !unassigned
      ) {
        return false;
      }

      if (
        countryFilter !== "all" &&
        String(student.country || "") !== countryFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        student.name,
        student.email,
        student.phone,
        student.agent,
        student.country,
        student.stage,
        student.status,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [
    students,
    query,
    stageFilter,
    sourceFilter,
    countryFilter,
  ]);

  const visible = compact
    ? filtered.slice(0, 5)
    : filtered;

  const confirmed = students.filter(
    (student) =>
      student.agent !== "Direct / Unassigned" &&
      student.agentIdentityConfirmed
  ).length;

  const observed = students.filter(
    (student) =>
      student.agent !== "Direct / Unassigned" &&
      !student.agentIdentityConfirmed
  ).length;

  const unassigned = students.filter(
    (student) =>
      student.agent === "Direct / Unassigned"
  ).length;

  const applicationPlus = students.filter((student) =>
    ["application", "offer", "cas", "visa"].some(
      (stage) =>
        lower(student.stage).includes(stage)
    )
  ).length;

  const filtersActive =
    Boolean(query.trim()) ||
    stageFilter !== "all" ||
    sourceFilter !== "all" ||
    countryFilter !== "all";

  function clearFilters() {
    setQuery("");
    setStageFilter("all");
    setSourceFilter("all");
    setCountryFilter("all");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <UsersRound size={12} />
            Agent Students
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Agent Student Operations Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Student attribution, journey stage and source reconciliation for
            individual agents. Partner OS owns the commercial relationship;
            Agent Operations owns the student-level attribution workflow.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Confirmed Attribution
          </p>

          <p className="mt-2 text-3xl font-black">
            {confirmed}/{students.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {observed} observed source name{observed === 1 ? "" : "s"} ·{" "}
            {unassigned} unassigned student{unassigned === 1 ? "" : "s"}.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Identity-aware attribution
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Student Records"
              value={students.length}
              helper="All student records currently visible to Agent Operations."
              tone="navy"
              icon={UsersRound}
              badge="Students"
            />

            <MetricCard
              label="Confirmed Agent"
              value={confirmed}
              helper="Students linked to a confirmed agent account/profile."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Observed Source"
              value={observed}
              helper="Students with a named agent/referrer that is not yet a confirmed identity."
              tone={observed > 0 ? "blue" : "green"}
              icon={Globe2}
            />

            <MetricCard
              label="Needs Attribution"
              value={unassigned}
              helper={`${applicationPlus} student${
                applicationPlus === 1 ? "" : "s"
              } are already at application or later stages.`}
              tone={unassigned > 0 ? "amber" : "green"}
              icon={unassigned > 0 ? AlertTriangle : ShieldCheck}
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student, agent, country, stage..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Stages</option>
              <option value="lead">Lead</option>
              <option value="planning">Planning</option>
              <option value="application">Application</option>
              <option value="offer">Offer</option>
              <option value="cas">CAS</option>
              <option value="visa">Visa</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Attribution</option>
              <option value="confirmed">Confirmed Agent</option>
              <option value="observed">Observed Source</option>
              <option value="unassigned">Unassigned</option>
            </select>

            <select
              value={countryFilter}
              onChange={(event) =>
                setCountryFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country === "all"
                    ? "All Countries"
                    : country}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 transition hover:border-[#F97316] hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="grid gap-2.5">
          {visible.length ? (
            visible.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <UsersRound size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                {students.length
                  ? "No students match these filters."
                  : "No agent student records yet."}
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {students.length
                  ? "Clear or change the student filters."
                  : "Agent-submitted or agent-attributed students will appear here when real student/lead records are connected."}
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
                    Attribution Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Named source ≠ confirmed agent
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Agent Operations keeps confirmed identities, observed source
                    names and unassigned students visibly separate.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Globe2
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Journey Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Stage comes from student evidence
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Lead, application, offer, CAS and visa labels remain derived
                    from the connected student journey state.
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
                    Commission Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Attribution first, claim second
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Individual agent commission decisions should wait until both
                    agent identity and student attribution are confirmed.
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
