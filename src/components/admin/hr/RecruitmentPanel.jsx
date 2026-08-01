import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CircleGauge,
  Database,
  Search,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function hasScore(candidate = {}) {
  return (
    candidate.scoreAvailable === true &&
    candidate.score !== null &&
    candidate.score !== undefined &&
    Number.isFinite(Number(candidate.score))
  );
}

function stageTone(stage = "") {
  const value = lower(stage);

  if (value.includes("hired")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value.includes("reject")) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (value.includes("interview")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value.includes("screen")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
}

function scoreTone(score) {
  if (!Number.isFinite(Number(score))) {
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
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#60A5FA] bg-[#F2F7FF]",
    navy: "border-[#123865] bg-[#123865]",
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
          className={`mt-3 inline-flex rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
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

function CandidateRow({ candidate }) {
  const scoreAvailable = hasScore(candidate);

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_13rem_10rem_10rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
              <UserRoundPlus size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words font-black text-[#10233F]">
                {candidate.name}
              </p>

              <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                Source: {candidate.source || "Unknown"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Role
          </p>
          <p className="mt-1 break-words text-sm font-black text-[#10233F]">
            {candidate.role || "Open Role"}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Stage
          </p>
          <span
            className={`mt-1 inline-flex w-fit rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${stageTone(
              candidate.stage
            )}`}
          >
            {candidate.stage || "Unknown"}
          </span>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Match Evidence
          </p>
          <span
            className={`mt-1 inline-flex w-fit rounded-lg border-2 px-2.5 py-1 text-[9px] font-black ${scoreTone(
              scoreAvailable ? candidate.score : null
            )}`}
          >
            {scoreAvailable ? `${candidate.score}%` : "Unavailable"}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function RecruitmentPanel({ hr = {} }) {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  const candidates = safeArray(hr.candidates);

  const stages = useMemo(
    () => [
      "all",
      ...new Set(
        candidates
          .map((candidate) => String(candidate.stage || "").trim())
          .filter(Boolean)
      ),
    ],
    [candidates]
  );

  const roles = useMemo(
    () => [
      "all",
      ...new Set(
        candidates
          .map((candidate) => String(candidate.role || "").trim())
          .filter(Boolean)
      ),
    ],
    [candidates]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return candidates.filter((candidate) => {
      if (
        stageFilter !== "all" &&
        String(candidate.stage || "") !== stageFilter
      ) {
        return false;
      }

      if (
        roleFilter !== "all" &&
        String(candidate.role || "") !== roleFilter
      ) {
        return false;
      }

      if (
        scoreFilter === "scored" &&
        !hasScore(candidate)
      ) {
        return false;
      }

      if (
        scoreFilter === "unscored" &&
        hasScore(candidate)
      ) {
        return false;
      }

      if (!search) return true;

      return [
        candidate.name,
        candidate.role,
        candidate.stage,
        candidate.source,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [candidates, query, stageFilter, roleFilter, scoreFilter]);

  const open = candidates.filter((candidate) => {
    const stage = lower(candidate.stage);
    return !stage.includes("hired") && !stage.includes("reject");
  }).length;

  const interviews = candidates.filter((candidate) =>
    lower(candidate.stage).includes("interview")
  ).length;

  const hired = candidates.filter((candidate) =>
    lower(candidate.stage).includes("hired")
  ).length;

  const rejected = candidates.filter((candidate) =>
    lower(candidate.stage).includes("reject")
  ).length;

  const scoredCandidates = candidates.filter(hasScore);

  const averageScore = scoredCandidates.length
    ? Math.round(
        scoredCandidates.reduce(
          (sum, candidate) => sum + Number(candidate.score),
          0
        ) / scoredCandidates.length
      )
    : null;

  const filtersActive =
    Boolean(query.trim()) ||
    stageFilter !== "all" ||
    roleFilter !== "all" ||
    scoreFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStageFilter("all");
    setRoleFilter("all");
    setScoreFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <BriefcaseBusiness size={12} />
            Recruitment
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Hiring Pipeline
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Candidate pipeline, role demand, interview stages, source evidence
            and optional match scoring. Zaifan does not fabricate candidate
            quality scores when no real score exists.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Open Hiring Pipeline
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {open}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Candidates not yet hired or rejected.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Read-only until recruitment writes are wired
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Open"
            value={open}
            helper="Active candidates still moving through the pipeline."
            tone="blue"
            icon={UsersRound}
          />

          <MetricCard
            label="Interviews"
            value={interviews}
            helper="Candidates currently in an interview stage."
            tone="violet"
            icon={UserRoundPlus}
          />

          <MetricCard
            label="Hired"
            value={hired}
            helper="Candidates already marked as hired."
            tone="green"
            icon={BadgeCheck}
          />

          <MetricCard
            label="Rejected"
            value={rejected}
            helper="Candidates already marked as rejected."
            tone={rejected > 0 ? "red" : "blue"}
            icon={rejected > 0 ? AlertTriangle : ShieldCheck}
          />

          <MetricCard
            label="Avg Match Evidence"
            value={averageScore === null ? "Unavailable" : `${averageScore}%`}
            helper={
              averageScore === null
                ? "No real candidate match scores are connected."
                : `Average across ${scoredCandidates.length} scored candidate${
                    scoredCandidates.length === 1 ? "" : "s"
                  }.`
            }
            tone={
              averageScore === null
                ? "blue"
                : averageScore >= 75
                  ? "green"
                  : "amber"
            }
            icon={CircleGauge}
            badge="Optional evidence"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidate, role, stage, source..."
              className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === "all" ? "All Roles" : role}
              </option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage === "all" ? "All Stages" : stage}
              </option>
            ))}
          </select>

          <select
            value={scoreFilter}
            onChange={(event) => setScoreFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            <option value="all">All Score States</option>
            <option value="scored">Scored Only</option>
            <option value="unscored">Unscored Only</option>
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

        <div className="space-y-3">
          {filtered.length ? (
            filtered.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
                <UserRoundPlus size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No candidates found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the recruitment filters."
                  : "Real recruitment records will appear when a candidate source is connected to HR OS."}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Hiring Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  No fake candidate scoring
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Missing match/rating evidence stays unavailable instead of
                  defaulting every candidate to a synthetic score.
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
                  Pipeline Source
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  {candidates.length} connected record
                  {candidates.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Candidate rows are read from the HR snapshot only.
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
                  Action Boundary
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  No fake hire/reject actions
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Hiring-stage mutations should only be enabled once the real
                  recruitment table, permissions and audit trail are confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
