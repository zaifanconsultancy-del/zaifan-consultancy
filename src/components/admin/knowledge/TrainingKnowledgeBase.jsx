import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BookOpenCheck,
  Clock3,
  Database,
  GraduationCap,
  Search,
  ShieldCheck,
  Target,
  UsersRound,
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

function statusReady(status = "") {
  const value = lower(status);
  return (
    value.includes("live") ||
    value.includes("approved") ||
    value.includes("active") ||
    value.includes("published")
  );
}

function statusNeedsReview(status = "") {
  const value = lower(status);
  return (
    value.includes("review") ||
    value.includes("draft") ||
    value.includes("expired") ||
    value.includes("stale")
  );
}

function hasCompletion(course = {}) {
  return (
    course.completion !== null &&
    course.completion !== undefined &&
    Number.isFinite(Number(course.completion))
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function statusTone(status = "") {
  if (statusReady(status)) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (statusNeedsReview(status)) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
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
            className={`mt-2 whitespace-normal break-normal text-2xl font-black [overflow-wrap:normal] [word-break:normal] ${
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
    </article>
  );
}

function CourseRow({ course }) {
  const measurable = hasCompletion(course);
  const completion = measurable ? clampPercent(course.completion) : null;

  const lessons =
    course.lessons !== null &&
    course.lessons !== undefined &&
    Number.isFinite(Number(course.lessons))
      ? Number(course.lessons)
      : null;

  const updated =
    course.updated ||
    course.updated_at ||
    course.updatedAt ||
    course.last_updated ||
    null;

  return (
    <article className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(18rem,1.45fr)_11rem_10rem_11rem] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {course.title || "Untitled training module"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                course.status
              )}`}
            >
              {course.status || "Unknown"}
            </span>

            {course.level ? (
              <span className="rounded-full border-2 border-[#9B6CFF] bg-[#F8F5FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-violet-700">
                {course.level}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[
              course.id,
              course.track,
              course.audience,
              course.owner ? `Owner: ${course.owner}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {course.summary || course.description ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {course.summary || course.description}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Lessons
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {lessons === null ? "Not recorded" : lessons}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Completion
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {completion === null ? "Not measured" : `${completion}%`}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Last Updated
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {updated || "Not recorded"}
          </p>
        </div>
      </div>

      {completion !== null ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
            <div
              className="h-full rounded-full bg-[#F97316] transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function TrainingKnowledgeBase({
  compact = false,
  records = [],
}) {
  const [query, setQuery] = useState("");
  const [trackFilter, setTrackFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const courses = useMemo(() => safeArray(records), [records]);

  const tracks = useMemo(
    () => [
      "All",
      ...new Set(
        courses
          .map((course) => String(course.track || "").trim())
          .filter(Boolean)
      ),
    ],
    [courses]
  );

  const audiences = useMemo(
    () => [
      "All",
      ...new Set(
        courses
          .map((course) => String(course.audience || "").trim())
          .filter(Boolean)
      ),
    ],
    [courses]
  );

  const statuses = useMemo(
    () => [
      "All",
      ...new Set(
        courses
          .map((course) => String(course.status || "").trim())
          .filter(Boolean)
      ),
    ],
    [courses]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return courses.filter((course) => {
      if (
        trackFilter !== "All" &&
        String(course.track || "") !== trackFilter
      ) {
        return false;
      }

      if (
        audienceFilter !== "All" &&
        String(course.audience || "") !== audienceFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        String(course.status || "") !== statusFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        course.id,
        course.title,
        course.track,
        course.audience,
        course.level,
        course.status,
        course.owner,
        course.summary,
        course.description,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [
    courses,
    query,
    trackFilter,
    audienceFilter,
    statusFilter,
  ]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const live = courses.filter((course) =>
    statusReady(course.status)
  ).length;

  const needsReview = courses.filter((course) =>
    statusNeedsReview(course.status)
  ).length;

  const measurable = courses.filter(hasCompletion);

  const avgCompletion = measurable.length
    ? Math.round(
        measurable.reduce(
          (sum, course) => sum + Number(course.completion),
          0
        ) / measurable.length
      )
    : null;

  const audienceCount = new Set(
    courses
      .map((course) => String(course.audience || "").trim())
      .filter(Boolean)
  ).size;

  const filtersActive =
    Boolean(query.trim()) ||
    trackFilter !== "All" ||
    audienceFilter !== "All" ||
    statusFilter !== "All";

  function clearFilters() {
    setQuery("");
    setTrackFilter("All");
    setAudienceFilter("All");
    setStatusFilter("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <GraduationCap size={12} />
            Training Knowledge
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Team Learning Knowledge Base
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Controlled internal training content for counselors, operations,
            finance and leadership. Course completion, certification and audience
            coverage are shown only when real learning evidence exists.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Connected Training
          </p>

          <p className="mt-2 text-3xl font-black">
            {courses.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {live} ready · {needsReview} requiring review · {audienceCount} audience group
            {audienceCount === 1 ? "" : "s"}.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Training evidence only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Courses"
              value={courses.length}
              helper="Connected internal learning records."
              tone="navy"
              icon={GraduationCap}
              badge="Modules"
            />

            <MetricCard
              label="Ready"
              value={live}
              helper="Training whose recorded status is live, active, approved or published."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Audience Groups"
              value={audienceCount}
              helper="Distinct recorded role or team audiences."
              tone="blue"
              icon={UsersRound}
            />

            <MetricCard
              label="Completion"
              value={avgCompletion === null ? "—" : `${avgCompletion}%`}
              helper={
                avgCompletion === null
                  ? "No measurable course-completion evidence is connected."
                  : `Average across ${measurable.length} measurable course${
                      measurable.length === 1 ? "" : "s"
                    }.`
              }
              tone={avgCompletion === null ? "amber" : "violet"}
              icon={Award}
              badge={avgCompletion === null ? "Not measured" : "Measured"}
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
                placeholder="Search training, audience, owner, track..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={trackFilter}
              onChange={(event) => setTrackFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {tracks.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Tracks" : item}
                </option>
              ))}
            </select>

            <select
              value={audienceFilter}
              onChange={(event) => setAudienceFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {audiences.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Audiences" : item}
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
                  {item === "All" ? "All Statuses" : item}
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

        <div className="space-y-2.5">
          {visible.length ? (
            visible.map((course) => (
              <CourseRow
                key={course.id || course.title}
                course={course}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <GraduationCap size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No training records found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the training filters."
                  : "Connect real training records before Zaifan reports learning coverage, completion or certification."}
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
                    Training Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No fake certification counts
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Course completion and certification must come from a real
                    learning record, not hardcoded example numbers.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <BookOpenCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Content Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Course exists ≠ staff completed it
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Knowledge content and employee learning progress should remain
                    separate evidence domains.
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
                    Evidence Source
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Learning records only
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Missing lesson counts, progress or update dates remain
                    unavailable instead of being inferred.
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
