import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Clock3,
  Database,
  Search,
  ShieldCheck,
  Workflow,
  X,
} from "lucide-react";

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

function readyStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("approved") ||
    value.includes("live") ||
    value.includes("active") ||
    value.includes("published")
  );
}

function reviewStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("review") ||
    value.includes("draft") ||
    value.includes("expired") ||
    value.includes("stale")
  );
}

function priorityTone(priority = "") {
  const value = lower(priority);

  if (value.includes("critical")) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (value.includes("high")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function statusTone(status = "") {
  if (readyStatus(status)) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (reviewStatus(status)) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#C9D7E6] bg-[#FFF8EE] text-slate-600";
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
    navy: "border-[#173F6B] bg-[#173F6B]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
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
                : "border-[#173F6B]/15 bg-white text-[#173F6B]"
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
    </article>
  );
}

function SopRow({ sop }) {
  const completion =
    sop.completion !== null &&
    sop.completion !== undefined &&
    Number.isFinite(Number(sop.completion))
      ? Math.max(0, Math.min(100, Number(sop.completion)))
      : null;

  const nextReview =
    sop.nextReview ||
    sop.next_review ||
    sop.review_due_at ||
    sop.reviewDueAt ||
    null;

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(18rem,1.4fr)_11rem_10rem_12rem] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {sop.title || "Untitled SOP"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                sop.status
              )}`}
            >
              {sop.status || "Unknown"}
            </span>

            {sop.priority ? (
              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${priorityTone(
                  sop.priority
                )}`}
              >
                {sop.priority}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[sop.code || sop.id, sop.department, sop.owner]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {sop.summary || sop.description ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {sop.summary || sop.description}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EE] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Journey Stage
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {sop.stage || "Not mapped"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EE] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Readiness
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {completion === null ? "Not measured" : `${Math.round(completion)}%`}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EE] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Next Review
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {nextReview || "Not scheduled"}
          </p>
        </div>
      </div>

      {completion !== null ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
            <div
              className="h-full rounded-full bg-[#173F6B] transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function SOPCenter({
  compact = false,
  records = [],
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const sops = useMemo(() => safeArray(records), [records]);

  const stages = useMemo(
    () => [
      "All",
      ...new Set(
        sops
          .map((sop) => String(sop.stage || "").trim())
          .filter(Boolean)
      ),
    ],
    [sops]
  );

  const statuses = useMemo(
    () => [
      "All",
      ...new Set(
        sops
          .map((sop) => String(sop.status || "").trim())
          .filter(Boolean)
      ),
    ],
    [sops]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return sops.filter((sop) => {
      if (stage !== "All" && String(sop.stage || "") !== stage) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        String(sop.status || "") !== statusFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        sop.code,
        sop.id,
        sop.title,
        sop.department,
        sop.owner,
        sop.stage,
        sop.status,
        sop.priority,
        sop.summary,
        sop.description,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [sops, query, stage, statusFilter]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const ready = sops.filter((sop) =>
    readyStatus(sop.status)
  ).length;

  const review = sops.filter((sop) =>
    reviewStatus(sop.status)
  ).length;

  const measurable = sops.filter(
    (sop) =>
      sop.completion !== null &&
      sop.completion !== undefined &&
      Number.isFinite(Number(sop.completion))
  );

  const avgCompletion = measurable.length
    ? Math.round(
        measurable.reduce(
          (sum, sop) => sum + safeNumber(sop.completion),
          0
        ) / measurable.length
      )
    : null;

  const mappedStages = new Set(
    sops
      .map((sop) => String(sop.stage || "").trim())
      .filter(Boolean)
  );

  const filtersActive =
    Boolean(query.trim()) ||
    stage !== "All" ||
    statusFilter !== "All";

  function clearFilters() {
    setQuery("");
    setStage("All");
    setStatusFilter("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#173F6B] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <ClipboardList size={12} />
            SOP Control
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Standard Operating Procedures
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Controlled procedures mapped to real Zaifan workflows. Missing SOPs,
            review schedules and readiness evidence stay missing instead of being
            replaced by template percentages.
          </p>
        </div>

        <div className="bg-[#E96512] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Procedure Coverage
          </p>

          <p className="mt-2 text-3xl font-black">
            {sops.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {ready} ready · {review} requiring review · {mappedStages.size} mapped stage
            {mappedStages.size === 1 ? "" : "s"}.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Records only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="SOP Records"
              value={sops.length}
              helper="Connected procedure records in the current knowledge snapshot."
              tone="navy"
              icon={ClipboardList}
              badge="Procedures"
            />

            <MetricCard
              label="Ready"
              value={ready}
              helper="Approved, live, active or published procedures."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Needs Review"
              value={review}
              helper="Draft, review, expired or stale procedure records."
              tone={review > 0 ? "amber" : "green"}
              icon={AlertTriangle}
            />

            <MetricCard
              label="Readiness"
              value={avgCompletion === null ? "—" : `${avgCompletion}%`}
              helper={
                avgCompletion === null
                  ? "No measurable SOP readiness evidence is connected."
                  : `Average across ${measurable.length} measurable SOP${
                      measurable.length === 1 ? "" : "s"
                    }.`
              }
              tone={avgCompletion === null ? "blue" : "violet"}
              icon={Workflow}
              badge={avgCompletion === null ? "Not measured" : "Measured"}
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
                placeholder="Search SOP, owner, department, stage..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={stage}
              onChange={(event) => setStage(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {stages.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Stages" : item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Statuses" : item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EE] px-3 text-xs font-black text-slate-700 transition hover:border-[#F97316] hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {visible.length ? (
            visible.map((sop) => (
              <SopRow
                key={sop.code || sop.id || sop.title}
                sop={sop}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <ClipboardList size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No SOP records found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the SOP filters."
                  : "Connect real SOP records before Zaifan relies on procedure coverage or readiness."}
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
                    Procedure Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Controlled records only
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    SOP counts and readiness should come from real procedure
                    records, not hardcoded examples.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Clock3
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Review Discipline
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Dates must be real
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Missing review dates remain unscheduled instead of being
                    replaced with invented deadlines.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Workflow Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Coverage ≠ execution
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Having an SOP does not prove staff followed it. Execution
                    evidence belongs in workflow and audit systems.
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
