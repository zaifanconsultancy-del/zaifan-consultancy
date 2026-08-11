import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Database,
  GraduationCap,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import ZaifanMetricCard from "../ui/ZaifanMetricCard";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasProgress(item = {}) {
  return (
    item.progressAvailable === true &&
    item.progress !== null &&
    item.progress !== undefined &&
    Number.isFinite(Number(item.progress))
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function progressTone(progress) {
  if (progress === null || progress === undefined || !Number.isFinite(Number(progress))) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  const value = Number(progress);

  if (value >= 100) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value >= 50) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
}

function statusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("complete") ||
    value.includes("passed") ||
    value.includes("finished")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("overdue") ||
    value.includes("failed") ||
    value.includes("expired")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    value.includes("progress") ||
    value.includes("assigned") ||
    value.includes("due")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
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

function TrainingRow({ item }) {
  const progressAvailable = hasProgress(item);
  const progress = progressAvailable ? clampPercent(item.progress) : null;

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_16rem_11rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
              <GraduationCap size={17} />
            </div>

            <div className="min-w-0">
              <p className="break-words font-black text-[#10233F]">
                {item.title}
              </p>

              <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                {item.employee} · {item.category}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                item.status
              )}`}
            >
              {item.status || "Unknown"}
            </span>

            {item.employeeId ? (
              <span className="rounded-full border-2 border-[#34D399] bg-[#F0FFF8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-emerald-700">
                Identity linked
              </span>
            ) : (
              <span className="rounded-full border-2 border-[#F59E0B] bg-[#FFF8E8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-amber-800">
                Legacy person reference
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Learning Progress
            </p>

            <span
              className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black ${progressTone(
                progress
              )}`}
            >
              {progressAvailable ? `${progress}%` : "Unavailable"}
            </span>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-[#E1E8F0] bg-[#FFF8EF]">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                progressAvailable ? "bg-[#F97316]" : "bg-slate-300"
              }`}
              style={{
                width: `${progressAvailable ? Math.max(4, progress) : 0}%`,
              }}
            />
          </div>

          <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-600">
            {progressAvailable
              ? "Progress comes from the connected learning record."
              : "No measurable learning progress has been provided."}
          </p>
        </div>

        <div className="rounded-[1.25rem] border-[3px] border-[#E1E8F0] bg-[#FFF8EF] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Category
          </p>

          <p className="mt-2 break-words text-sm font-black text-[#10233F]">
            {item.category || "General"}
          </p>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
            Learning area / module classification.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function TrainingCenter({ hr = {} }) {
  const [query, setQuery] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const rows = safeArray(hr.training);

  const categories = useMemo(
    () => [
      "all",
      ...new Set(
        rows
          .map((item) => String(item.category || "").trim())
          .filter(Boolean)
      ),
    ],
    [rows]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return rows.filter((item) => {
      const measurable = hasProgress(item);
      const progress = measurable ? Number(item.progress) : null;

      if (
        progressFilter === "complete" &&
        (!measurable || progress < 100)
      ) {
        return false;
      }

      if (
        progressFilter === "due" &&
        (!measurable || progress >= 100)
      ) {
        return false;
      }

      if (
        progressFilter === "unavailable" &&
        measurable
      ) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        String(item.category || "") !== categoryFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        item.title,
        item.employee,
        item.category,
        item.status,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [rows, query, progressFilter, categoryFilter]);

  const measurableRows = rows.filter(hasProgress);
  const hasTrainingRows = rows.length > 0;
  const hasMeasurableProgress = measurableRows.length > 0;

  const completed = measurableRows.filter(
    (item) => Number(item.progress) >= 100
  ).length;

  const due = measurableRows.filter(
    (item) => Number(item.progress) < 100
  ).length;

  const unavailable = rows.length - measurableRows.length;

  const average = measurableRows.length
    ? Math.round(
        measurableRows.reduce(
          (sum, item) => sum + Number(item.progress),
          0
        ) / measurableRows.length
      )
    : null;

  const identityLinked = rows.filter((item) => item.employeeId).length;

  const filtersActive =
    Boolean(query.trim()) ||
    progressFilter !== "all" ||
    categoryFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setProgressFilter("all");
    setCategoryFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <GraduationCap size={12} />
            Training Center
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Team Learning & Enablement
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Onboarding, compliance learning and skill development evidence with
            measurable progress kept separate from missing learning data.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Measurable Learning
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {measurableRows.length}/{rows.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Training records with real progress evidence.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Missing progress ≠ 0%
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Average Progress"
            value={hasMeasurableProgress ? `${average}%` : "N/A"}
            helper={
              hasMeasurableProgress
                ? `Average across ${measurableRows.length} measurable learning record${
                    measurableRows.length === 1 ? "" : "s"
                  }.`
                : "Not assessed · No training records currently have measurable progress."
            }
            tone={
              hasMeasurableProgress
                ? average >= 80
                  ? "green"
                  : average >= 50
                    ? "amber"
                    : "red"
                : "slate"
            }
            icon={BookOpenCheck}
            className="h-full"
          />

          <MetricCard
            label="Complete"
            value={hasMeasurableProgress ? completed : "N/A"}
            helper={
              hasMeasurableProgress
                ? "Training records at 100% measured completion."
                : "Not assessed · No measurable progress evidence yet."
            }
            tone={hasMeasurableProgress ? "green" : "slate"}
            icon={BadgeCheck}
            className="h-full"
          />

          <MetricCard
            label="Due"
            value={hasMeasurableProgress ? due : "N/A"}
            helper={
              hasMeasurableProgress
                ? "Measurable training records below 100% completion."
                : "Not assessed · No measurable progress evidence yet."
            }
            tone={
              hasMeasurableProgress
                ? due > 0
                  ? "amber"
                  : "green"
                : "slate"
            }
            icon={AlertTriangle}
            className="h-full"
          />

          <MetricCard
            label="Progress Unavailable"
            value={hasTrainingRows ? unavailable : "N/A"}
            helper={
              hasTrainingRows
                ? `${identityLinked}/${rows.length} records have a direct employee identity link.`
                : "Not assessed · No training records exist yet."
            }
            tone={
              hasTrainingRows
                ? unavailable > 0
                  ? "blue"
                  : "green"
                : "slate"
            }
            icon={Database}
            className="h-full"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search training, employee, category, status..."
              className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>

          <select
            value={progressFilter}
            onChange={(event) => setProgressFilter(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
          >
            <option value="all">All Progress States</option>
            <option value="due">Due / Incomplete</option>
            <option value="complete">Complete</option>
            <option value="unavailable">Progress Unavailable</option>
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
            filtered.map((item) => (
              <TrainingRow key={item.id} item={item} />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
                <GraduationCap size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No training records found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the training filters."
                  : "Real training records will appear when a learning source is connected to HR OS."}
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
                  Learning Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Missing progress stays unavailable
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Zaifan no longer treats a training record without progress as
                  a failed 0% module.
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
                  Learning Source
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  {rows.length} connected record{rows.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Training records are read from the HR snapshot only.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <UsersRound
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Identity Coverage
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  {identityLinked}/{rows.length} directly linked
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Direct employee identity links are preferred over legacy
                  display-name assignment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
