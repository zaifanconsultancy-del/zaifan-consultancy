import React, { useEffect, useMemo, useState } from "react";
import { buildCounselorUniversityQueue } from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "dream", label: "Dream" },
  { key: "target", label: "Target" },
  { key: "safe", label: "Safe" },
  { key: "ready", label: "Ready" },
  { key: "incomplete", label: "Incomplete" },
];

const SORTS = [
  { key: "readiness", label: "Readiness" },
  { key: "student", label: "Student" },
  { key: "university", label: "University" },
  { key: "country", label: "Country" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_universities_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_universities_sort";
const VIEW_STORAGE_KEY = "zaifan_counselor_universities_view";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function readSessionValue(key, fallback = "") {
  if (typeof window === "undefined") return fallback;

  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Workspace preferences are optional.
  }
}

function categoryKey(category = "") {
  const value = lower(category);

  if (value.includes("dream")) return "dream";
  if (value.includes("safe")) return "safe";
  if (value.includes("target")) return "target";

  return "other";
}

function categoryTone(category = "") {
  const key = categoryKey(category);

  if (key === "dream") {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  if (key === "safe") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (key === "target") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function readinessTone(score = 0) {
  const value = safeNumber(score);

  if (value >= 80) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (value >= 60) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (value >= 40) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-rose-300 bg-rose-50 text-rose-700";
}

function statusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("applied") ||
    value.includes("submitted") ||
    value.includes("offer") ||
    value.includes("accepted")
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("shortlist")
  ) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  if (
    value.includes("reject") ||
    value.includes("decline") ||
    value.includes("blocked")
  ) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function shortlistPressure(item = {}) {
  let score = 0;

  const readiness = safeNumber(item.readinessScore);
  const category = categoryKey(item.category);
  const status = lower(item.status);
  const nextAction = lower(item.nextAction);

  score += Math.max(0, 100 - readiness);

  if (category === "dream") score += 12;
  if (category === "target") score += 6;
  if (status.includes("blocked") || status.includes("reject")) score += 20;
  if (nextAction.includes("document")) score += 8;
  if (nextAction.includes("application")) score += 6;
  if (nextAction.includes("deadline")) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function universitySearchText(item = {}) {
  return lower(
    [
      item.studentName,
      item.universityName,
      item.country,
      item.courseName,
      item.category,
      item.status,
      item.nextAction,
      item.intake,
      item.city,
    ].join(" ")
  );
}

function universityKey(item = {}, index = 0) {
  return (
    item.id ||
    item.university_id ||
    `${item.studentName || "student"}-${item.universityName || "university"}-${
      item.courseName || index
    }`
  );
}

function strategyLabel(queue = []) {
  const dream = queue.filter(
    (item) => categoryKey(item.category) === "dream"
  ).length;

  const target = queue.filter(
    (item) => categoryKey(item.category) === "target"
  ).length;

  const safe = queue.filter(
    (item) => categoryKey(item.category) === "safe"
  ).length;

  if (!queue.length) return "No shortlist yet";
  if (target > 0 && safe > 0 && dream > 0) return "Balanced shortlist";
  if (safe === 0) return "Needs safe option";
  if (target === 0) return "Needs target option";
  if (dream === 0) return "Conservative shortlist";

  return "Developing shortlist";
}

function UniversityStat({
  label,
  value,
  helper,
  tone = "navy",
  active = false,
  onClick,
}) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  const className = `rounded-2xl border-2 p-4 text-left shadow-sm transition ${
    tones[tone] || tones.navy
  } ${
    onClick
      ? "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
      : ""
  } ${active ? "ring-2 ring-orange-200" : ""}`;

  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p>
      ) : null}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function ReadinessBar({ value }) {
  const score = Math.max(0, Math.min(100, safeNumber(value)));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#607487]">Shortlist readiness</span>
        <span className="font-black text-[#102b4c]">{score}%</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 80
              ? "bg-emerald-500"
              : score >= 60
                ? "bg-orange-500"
                : score >= 40
                  ? "bg-amber-500"
                  : "bg-rose-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function PressureBar({ item }) {
  const score = shortlistPressure(item);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#607487]">Planning pressure</span>
        <span className="font-black text-[#102b4c]">{score}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 75
              ? "bg-rose-500"
              : score >= 50
                ? "bg-orange-500"
                : "bg-[#173f69]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function StrategySummary({ stats, queue, onFilter }) {
  const label = strategyLabel(queue);

  const balanceTone =
    label === "Balanced shortlist"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : "border-amber-300 bg-amber-50 text-amber-700";

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
      <div className="rounded-[1.5rem] border-2 border-[#173f69] bg-[#f7fbff] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
              Portfolio Strategy
            </p>

            <h3 className="mt-2 text-lg font-black text-[#102b4c]">
              {label}
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              A strong shortlist normally balances ambitious options with realistic
              target choices and at least one safer route. This panel is an operational
              planning signal, not an admission guarantee.
            </p>
          </div>

          <span
            className={`self-start rounded-xl border-2 px-3 py-2 text-xs font-black ${balanceTone}`}
          >
            Avg readiness {stats.avgReadiness}%
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Dream", stats.dream, "dream"],
            ["Target", stats.target, "target"],
            ["Safe", stats.safe, "safe"],
          ].map(([labelText, value, filterKey]) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => onFilter(filterKey)}
              className="rounded-2xl border-2 border-[#d6e0e7] bg-white p-3 text-left transition hover:border-orange-300 hover:bg-orange-50"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
                {labelText}
              </p>
              <p className="mt-1 text-xl font-black text-[#102b4c]">{value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border-2 border-orange-300 bg-orange-50 p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
          Counselor Focus
        </p>

        <p className="mt-2 text-sm font-black leading-6 text-[#102b4c]">
          {stats.incomplete > 0
            ? `${stats.incomplete} shortlist record${
                stats.incomplete === 1 ? "" : "s"
              } still need planning before application readiness.`
            : stats.total
              ? "The current shortlist is fully above the readiness threshold."
              : "Shortlist planning will appear once assigned university records exist."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {stats.incomplete > 0 ? (
            <button
              type="button"
              onClick={() => onFilter("incomplete")}
              className="rounded-xl border-2 border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50"
            >
              Review incomplete
            </button>
          ) : null}

          {stats.ready > 0 ? (
            <button
              type="button"
              onClick={() => onFilter("ready")}
              className="rounded-xl border-2 border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
            >
              View ready
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UniversityCard({ item, compact = false }) {
  const ready = safeNumber(item.readinessScore) >= 75;
  const pressure = shortlistPressure(item);
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={`rounded-[1.6rem] border-2 p-4 shadow-[0_10px_30px_rgba(16,43,76,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300 sm:p-5 ${
        pressure >= 75
          ? "border-rose-300 bg-rose-50/60"
          : ready
            ? "border-emerald-300 bg-emerald-50/35"
            : "border-[#c9d5de] bg-[#fffdf8]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-black text-[#102b4c]">
              {item.universityName || "University"}
            </h3>

            {ready ? (
              <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-emerald-700">
                Ready
              </span>
            ) : null}

            {pressure >= 75 ? (
              <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-rose-700">
                High Planning Pressure
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#607487]">
            {item.studentName || "Assigned Student"}
          </p>
        </div>

        <span
          className={`self-start rounded-full border px-3 py-1 text-xs font-black ${categoryTone(
            item.category
          )}`}
        >
          {item.category || "Uncategorised"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-[#173f69] bg-[#173f69] px-3 py-1 text-xs font-black text-white">
          {item.country || "Country not set"}
        </span>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${readinessTone(
            item.readinessScore
          )}`}
        >
          {ready ? "Application Ready" : "Needs Planning"}
        </span>

        {item.status ? (
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(
              item.status
            )}`}
          >
            {item.status}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-3.5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#718292]">
          Course / Programme
        </p>

        <p className="mt-2 text-sm font-black leading-6 text-[#102b4c]">
          {item.courseName || "Programme not selected"}
        </p>
      </div>

      <div className="mt-3 rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-3.5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
          Counselor Next Action
        </p>

        <p className="mt-2 text-sm font-bold leading-6 text-[#102b4c]">
          {item.nextAction ||
            "Review university fit, readiness and application strategy."}
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        <ReadinessBar value={item.readinessScore} />

        {!compact ? <PressureBar item={item} /> : null}
      </div>

      {!compact ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3d6c5] pt-4">
          <p className="text-xs font-medium text-[#718292]">
            Planning pressure {pressure}
          </p>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2 text-xs font-black text-white transition hover:bg-[#102f52]"
          >
            {expanded ? "Hide Details" : "More Details"}
          </button>
        </div>
      ) : null}

      {expanded && !compact ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Category
            </p>
            <p className="mt-1 text-xs font-black text-[#102b4c]">
              {item.category || "Not set"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Status
            </p>
            <p className="mt-1 text-xs font-black text-[#102b4c]">
              {item.status || "Planning"}
            </p>
          </div>

          {item.city ? (
            <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
                City
              </p>
              <p className="mt-1 text-xs font-black text-[#102b4c]">
                {item.city}
              </p>
            </div>
          ) : null}

          {item.intake ? (
            <div className="rounded-2xl border border-[#d6e0e7] bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
                Intake
              </p>
              <p className="mt-1 text-xs font-black text-[#102b4c]">
                {item.intake}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function CounselorUniversitiesWorkspace({ snapshot }) {
  const queue = useMemo(
    () => buildCounselorUniversityQueue(snapshot || {}),
    [snapshot]
  );

  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });

  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "readiness");
    return VALID_SORTS.has(saved) ? saved : "readiness";
  });

  const [view, setView] = useState(() =>
    readSessionValue(VIEW_STORAGE_KEY, "detailed") === "compact"
      ? "compact"
      : "detailed"
  );

  const [query, setQuery] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  useEffect(() => {
    writeSessionValue(VIEW_STORAGE_KEY, view);
  }, [view]);

  const stats = useMemo(() => {
    const dream = queue.filter(
      (item) => categoryKey(item.category) === "dream"
    ).length;

    const target = queue.filter(
      (item) => categoryKey(item.category) === "target"
    ).length;

    const safe = queue.filter(
      (item) => categoryKey(item.category) === "safe"
    ).length;

    const ready = queue.filter(
      (item) => safeNumber(item.readinessScore) >= 75
    ).length;

    const incomplete = queue.filter(
      (item) => safeNumber(item.readinessScore) < 75
    ).length;

    const avgReadiness = queue.length
      ? Math.round(
          queue.reduce(
            (sum, item) => sum + safeNumber(item.readinessScore),
            0
          ) / queue.length
        )
      : 0;

    const students = new Set(
      queue.map((item) => lower(item.studentName)).filter(Boolean)
    ).size;

    const countries = new Set(
      queue.map((item) => lower(item.country)).filter(Boolean)
    ).size;

    const highPressure = queue.filter(
      (item) => shortlistPressure(item) >= 75
    ).length;

    return {
      total: queue.length,
      dream,
      target,
      safe,
      ready,
      incomplete,
      avgReadiness,
      students,
      countries,
      highPressure,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "dream") {
      next = next.filter(
        (item) => categoryKey(item.category) === "dream"
      );
    }

    if (filter === "target") {
      next = next.filter(
        (item) => categoryKey(item.category) === "target"
      );
    }

    if (filter === "safe") {
      next = next.filter(
        (item) => categoryKey(item.category) === "safe"
      );
    }

    if (filter === "ready") {
      next = next.filter(
        (item) => safeNumber(item.readinessScore) >= 75
      );
    }

    if (filter === "incomplete") {
      next = next.filter(
        (item) => safeNumber(item.readinessScore) < 75
      );
    }

    if (search) {
      next = next.filter((item) =>
        universitySearchText(item).includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "student") {
        return safeString(a.studentName).localeCompare(
          safeString(b.studentName)
        );
      }

      if (sort === "university") {
        return safeString(a.universityName).localeCompare(
          safeString(b.universityName)
        );
      }

      if (sort === "country") {
        return safeString(a.country).localeCompare(
          safeString(b.country)
        );
      }

      if (sort === "category") {
        return safeString(a.category).localeCompare(
          safeString(b.category)
        );
      }

      if (sort === "status") {
        return safeString(a.status).localeCompare(
          safeString(b.status)
        );
      }

      const readinessDifference =
        safeNumber(b.readinessScore) -
        safeNumber(a.readinessScore);

      if (readinessDifference !== 0) {
        return readinessDifference;
      }

      return shortlistPressure(a) - shortlistPressure(b);
    });
  }, [queue, filter, query, sort]);

  const reset = () => {
    setFilter("all");
    setSort("readiness");
    setView("detailed");
    setQuery("");
  };

  const hasActiveControls =
    Boolean(query.trim()) ||
    filter !== "all" ||
    sort !== "readiness" ||
    view !== "detailed";

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            University OS
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            University Planning Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Balance dream, target and safe university choices while tracking readiness,
            planning pressure and the next counselor action for every assigned student.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} visible
          </span>

          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {stats.students} students
          </span>

          <span
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${
              stats.highPressure > 0
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-emerald-300 bg-emerald-50 text-emerald-700"
            }`}
          >
            {stats.highPressure} high pressure
          </span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <UniversityStat
          label="Total"
          value={stats.total}
          helper={`${stats.countries} countries`}
          tone="orange"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <UniversityStat
          label="Dream"
          value={stats.dream}
          helper="ambitious"
          tone="violet"
          active={filter === "dream"}
          onClick={() => setFilter("dream")}
        />

        <UniversityStat
          label="Target"
          value={stats.target}
          helper="best-fit"
          active={filter === "target"}
          onClick={() => setFilter("target")}
        />

        <UniversityStat
          label="Safe"
          value={stats.safe}
          helper="backup route"
          tone="emerald"
          active={filter === "safe"}
          onClick={() => setFilter("safe")}
        />

        <UniversityStat
          label="Ready"
          value={stats.ready}
          helper="application ready"
          tone="emerald"
          active={filter === "ready"}
          onClick={() => setFilter("ready")}
        />

        <UniversityStat
          label="Incomplete"
          value={stats.incomplete}
          helper={`${stats.avgReadiness}% avg`}
          tone="amber"
          active={filter === "incomplete"}
          onClick={() => setFilter("incomplete")}
        />
      </div>

      <div className="mb-5">
        <StrategySummary
          stats={stats}
          queue={queue}
          onFilter={setFilter}
        />
      </div>

      <div className="mb-5 rounded-[1.4rem] border-2 border-[#d8b892] bg-[#fff8ef] p-3.5">
        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_180px_210px_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student, university, country, course, category, status or action..."
            className={INPUT_CLASS}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Filter university planning queue"
          >
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Sort university planning queue"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                Sort: {item.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] p-1">
            {[
              ["detailed", "Detailed"],
              ["compact", "Compact"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                  view === value
                    ? "bg-orange-500 text-white"
                    : "text-[#173f69] hover:bg-orange-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={!hasActiveControls}
            className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] disabled:cursor-default disabled:opacity-45"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
          University planning · {filtered.length} visible records
        </p>

        <p className="text-xs font-semibold text-[#607487]">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Readiness"} · View:{" "}
          {view === "compact" ? "Compact" : "Detailed"}
        </p>
      </div>

      <div
        className={`grid gap-4 ${
          view === "compact"
            ? "xl:grid-cols-2 2xl:grid-cols-3"
            : "xl:grid-cols-2"
        }`}
      >
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center xl:col-span-2 2xl:col-span-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50 text-lg font-black text-orange-700">
              U
            </div>

            <p className="mt-3 text-sm font-black text-[#102b4c]">
              No university planning records found.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              Assigned shortlist records will appear here once they are linked to the
              counselor-scoped student snapshot. Clear the current controls if records
              already exist.
            </p>

            {hasActiveControls ? (
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400"
              >
                Clear Search & Filters
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((item, index) => (
            <UniversityCard
              key={universityKey(item, index)}
              item={item}
              compact={view === "compact"}
            />
          ))
        )}
      </div>
    </section>
  );
}
