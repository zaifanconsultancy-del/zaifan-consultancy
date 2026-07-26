import React, { useMemo, useState } from "react";

const FOCUS_FILTERS = [
  { key: "summary", label: "Summary" },
  { key: "risk", label: "Risk" },
  { key: "conversion", label: "Conversion" },
  { key: "stalled", label: "Stalled" },
  { key: "performance", label: "Performance" },
];

const INPUT_BUTTON =
  "rounded-xl border-2 px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function formatMetric(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return safeString(value);
}

function pressureMeta(score = 0, label = "") {
  const value = clampPercent(score);
  const normalizedLabel = lower(label);

  if (value >= 78 || normalizedLabel.includes("critical") || normalizedLabel.includes("overload")) {
    return {
      label: label || "Critical pressure",
      short: "Critical",
      badge: "border-rose-300 bg-rose-50 text-rose-700",
      card: "border-rose-300 bg-rose-50/70",
      bar: "bg-rose-500",
      helper: "Immediate workload recovery and prioritisation required.",
    };
  }

  if (value >= 48 || normalizedLabel.includes("high") || normalizedLabel.includes("moderate")) {
    return {
      label: label || "Elevated workload",
      short: "Elevated",
      badge: "border-amber-300 bg-amber-50 text-amber-700",
      card: "border-amber-300 bg-amber-50/70",
      bar: "bg-orange-500",
      helper: "Protect conversion work and clear overdue or stalled activity.",
    };
  }

  return {
    label: label || "Healthy workload",
    short: "Healthy",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-700",
    card: "border-emerald-300 bg-emerald-50/55",
    bar: "bg-emerald-500",
    helper: "Capacity looks manageable; keep the pipeline moving consistently.",
  };
}

function gradeMeta(grade = "") {
  const value = lower(grade);

  if (value.includes("excellent")) {
    return {
      badge: "border-emerald-300 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
    };
  }

  if (value.includes("strong")) {
    return {
      badge: "border-[#173f69] bg-[#173f69] text-white",
      bar: "bg-[#173f69]",
    };
  }

  if (value.includes("developing")) {
    return {
      badge: "border-amber-300 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
    };
  }

  if (value.includes("attention")) {
    return {
      badge: "border-rose-300 bg-rose-50 text-rose-700",
      bar: "bg-rose-500",
    };
  }

  return {
    badge: "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]",
    bar: "bg-[#173f69]",
  };
}

function riskScore(student = {}) {
  return safeNumber(
    student.riskScore ??
      student.risk_score ??
      student.score ??
      student.priorityScore ??
      student.priority_score
  );
}

function opportunityScore(student = {}) {
  return safeNumber(
    student.opportunityScore ??
      student.opportunity_score ??
      student.conversionScore ??
      student.conversion_score
  );
}

function stalledDays(student = {}) {
  return safeNumber(
    student.stalledDays ??
      student.stalled_days ??
      student.daysStalled ??
      student.days_stalled
  );
}

function studentName(student = {}) {
  return (
    student.name ||
    student.student_name ||
    student.full_name ||
    student.lead_name ||
    student.email ||
    "Student"
  );
}

function studentStage(student = {}) {
  return (
    student.stage ||
    student.pipeline_stage ||
    student.status ||
    student.application_status ||
    student.email ||
    "No stage"
  );
}

function studentKey(student = {}, index = 0) {
  return (
    student.id ||
    student.student_id ||
    student.inquiry_id ||
    student.appointment_id ||
    student.email ||
    `${studentName(student)}-${index}`
  );
}

function actionKey(action, index) {
  if (typeof action === "string") return `${action}-${index}`;
  return action?.id || action?.key || action?.title || `action-${index}`;
}

function actionText(action) {
  if (typeof action === "string") return action;
  return (
    action?.text ||
    action?.title ||
    action?.message ||
    action?.action ||
    "Review this recommendation."
  );
}

function MiniStat({
  label,
  value,
  helper,
  tone = "navy",
  emphasis = false,
}) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-sm ${
        tones[tone] || tones.navy
      } ${emphasis ? "ring-2 ring-orange-100" : ""}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black text-[#102b4c]">
        {formatMetric(value)}
      </p>
      {helper ? (
        <p className="mt-1 text-xs font-medium leading-5 text-[#607487]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function ProgressBar({ label, value, helper, tone = "navy" }) {
  const score = clampPercent(value);

  const barTone = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
          {label}
        </p>
        <p className="text-sm font-black text-[#102b4c]">{score}%</p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            barTone[tone] || barTone.navy
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {helper ? (
        <p className="mt-2 text-xs font-medium leading-5 text-[#607487]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function StudentMiniList({
  title,
  students = [],
  empty,
  metric = "risk",
  expanded = false,
  onToggle,
}) {
  const source = safeArray(students);
  const visible = expanded ? source : source.slice(0, 5);

  const getMetric = (student) => {
    if (metric === "opportunity") {
      return {
        label: "Opportunity",
        value: opportunityScore(student),
        tone: "border-emerald-300 bg-emerald-50 text-emerald-700",
      };
    }

    if (metric === "stalled") {
      return {
        label: "Days",
        value: stalledDays(student),
        tone: "border-amber-300 bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "Risk",
      value: riskScore(student),
      tone: "border-rose-300 bg-rose-50 text-rose-700",
    };
  };

  return (
    <div className="rounded-[1.5rem] border-2 border-[#173f69] bg-[#f7fbff] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
          {title}
        </p>

        <span className="rounded-lg border border-[#c9d5de] bg-white px-2.5 py-1 text-[10px] font-black text-[#173f69]">
          {source.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-[#c9d5de] bg-white p-4">
          <p className="text-sm font-semibold text-[#607487]">
            {empty || "No students in this queue."}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((student, index) => {
            const metricData = getMetric(student);

            return (
              <div
                key={studentKey(student, index)}
                className="rounded-2xl border-2 border-[#d6e0e7] bg-white p-3 transition hover:border-orange-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-[#102b4c]">
                      {studentName(student)}
                    </p>
                    <p className="mt-0.5 break-words text-xs font-medium text-[#718292]">
                      {studentStage(student)}
                    </p>
                  </div>

                  <span
                    title={metricData.label}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-black ${metricData.tone}`}
                  >
                    {metricData.value || "—"}
                  </span>
                </div>

                {student.nextBestAction || student.next_best_action ? (
                  <div className="mt-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-700">
                      Next action
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#102b4c]">
                      {student.nextBestAction || student.next_best_action}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {source.length > 5 && typeof onToggle === "function" ? (
        <button
          type="button"
          onClick={onToggle}
          className={`mt-3 w-full border-[#173f69] bg-[#173f69] text-white hover:bg-[#102f52] ${INPUT_BUTTON}`}
        >
          {expanded ? "Show Top 5" : `Show All ${source.length}`}
        </button>
      ) : null}
    </div>
  );
}

function RecommendedActions({ actions = [], title = "Recommended Actions" }) {
  const source = safeArray(actions);
  const visibleActions = source.length
    ? source
    : ["Keep moving assigned students forward."];

  return (
    <div className="rounded-[1.5rem] border-2 border-orange-300 bg-orange-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
        {title}
      </p>

      <div className="mt-3 space-y-2">
        {visibleActions.map((action, index) => (
          <div
            key={actionKey(action, index)}
            className="flex gap-3 rounded-2xl border-2 border-orange-200 bg-white px-4 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-[10px] font-black text-white">
              {index + 1}
            </span>
            <p className="text-sm font-semibold leading-6 text-[#102b4c]">
              {actionText(action)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkloadComposition({ derived }) {
  const metrics = [
    ["Students", derived.students, "navy"],
    ["Tasks", derived.tasks, "orange"],
    ["Support", derived.support, "rose"],
    ["Applications", derived.applications, "emerald"],
    ["Documents", derived.documents, "amber"],
    ["Appointments", derived.appointments, "violet"],
  ];

  const maximum = Math.max(1, ...metrics.map(([, value]) => value));

  const bars = {
    navy: "bg-[#173f69]",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
  };

  return (
    <div className="rounded-[1.5rem] border-2 border-[#d8b892] bg-[#fff8ef] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7d684f]">
            Workload Composition
          </p>
          <p className="mt-1 text-sm font-black text-[#102b4c]">
            {derived.rawTotal} raw records in current snapshot
          </p>
        </div>

        <span className="rounded-xl border-2 border-orange-300 bg-white px-3 py-2 text-xs font-black text-orange-700">
          Live scope
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {metrics.map(([label, value, tone]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#dfd0bd] bg-white p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-[#607487]">{label}</p>
              <p className="text-sm font-black text-[#102b4c]">{value}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5edf3]">
              <div
                className={`h-full rounded-full ${bars[tone]}`}
                style={{ width: `${Math.round((value / maximum) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusTabs({ focus, onChange, counts }) {
  return (
    <div
      className="flex flex-wrap gap-2 rounded-[1.4rem] border-2 border-[#d8b892] bg-[#fff8ef] p-2"
      role="tablist"
      aria-label="Counselor workload focus"
    >
      {FOCUS_FILTERS.map((item) => {
        const count = counts?.[item.key];

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={focus === item.key}
            onClick={() => onChange(item.key)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black transition ${
              focus === item.key
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-transparent bg-white text-[#173f69] hover:border-orange-200 hover:bg-orange-50"
            }`}
          >
            {item.label}
            {Number.isFinite(count) ? (
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                  focus === item.key
                    ? "bg-white/20 text-white"
                    : "bg-[#edf3f7] text-[#607487]"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function CounselorWorkloadPanel({
  workload,
  performance,
  executiveBrief,
  snapshot,
  compact = false,
}) {
  const [focus, setFocus] = useState("summary");
  const [riskExpanded, setRiskExpanded] = useState(false);
  const [conversionExpanded, setConversionExpanded] = useState(false);
  const [stalledExpanded, setStalledExpanded] = useState(false);

  const score = clampPercent(workload?.pressureScore);
  const pressure = pressureMeta(score, workload?.pressureLabel);
  const grade = gradeMeta(performance?.performanceGrade);

  const derived = useMemo(() => {
    const students = safeArray(snapshot?.students);
    const tasks = safeArray(snapshot?.tasks);
    const support = safeArray(snapshot?.support);
    const applications = safeArray(snapshot?.applications);
    const documents = safeArray(snapshot?.documents);
    const appointments = safeArray(snapshot?.appointments);

    return {
      students: students.length,
      tasks: tasks.length,
      support: support.length,
      applications: applications.length,
      documents: documents.length,
      appointments: appointments.length,
      rawTotal:
        students.length +
        tasks.length +
        support.length +
        applications.length +
        documents.length +
        appointments.length,
    };
  }, [snapshot]);

  const intelligence = useMemo(() => {
    const atRisk = safeNumber(workload?.atRiskStudents);
    const stalled = safeNumber(workload?.stalledStudents);
    const conversionReady = safeNumber(workload?.conversionReady);
    const supportQueue = safeNumber(
      workload?.supportQueue,
      derived.support
    );
    const assigned = safeNumber(
      workload?.assignedStudents,
      derived.students
    );

    const riskRatio = assigned
      ? Math.round((atRisk / assigned) * 100)
      : 0;

    const stalledRatio = assigned
      ? Math.round((stalled / assigned) * 100)
      : 0;

    const conversionRatio = assigned
      ? Math.round((conversionReady / assigned) * 100)
      : 0;

    let primaryConcern = "Pipeline consistency";
    if (atRisk > 0 && riskRatio >= stalledRatio) primaryConcern = "Risk recovery";
    if (stalled > atRisk && stalled > 0) primaryConcern = "Stalled student recovery";
    if (supportQueue >= Math.max(3, Math.ceil(assigned * 0.35))) {
      primaryConcern = "Support queue pressure";
    }

    let capacitySignal = "Balanced";
    if (score >= 78) capacitySignal = "Overloaded";
    else if (score >= 48) capacitySignal = "Watch";
    else if (score <= 25) capacitySignal = "Available";

    return {
      assigned,
      atRisk,
      stalled,
      conversionReady,
      supportQueue,
      riskRatio,
      stalledRatio,
      conversionRatio,
      primaryConcern,
      capacitySignal,
    };
  }, [workload, derived]);

  const tabCounts = useMemo(
    () => ({
      risk: safeArray(workload?.topRiskStudents).length,
      conversion: safeArray(workload?.topConversionStudents).length,
      stalled: safeArray(workload?.stalledStudentsList).length,
    }),
    [workload]
  );

  const executiveActions = safeArray(executiveBrief?.recommendedActions);

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Workload Engine
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Counselor Pressure Monitor
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Operational load, risk concentration, support pressure, stalled cases,
            conversion movement and counselor performance in one execution view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${pressure.badge}`}
          >
            {pressure.label}
          </span>

          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {intelligence.assigned} students
          </span>

          <span
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${grade.badge}`}
          >
            Grade {performance?.performanceGrade || "—"}
          </span>
        </div>
      </div>

      <div
        className={`rounded-[1.6rem] border-2 p-4 sm:p-5 ${pressure.card}`}
      >
        <div className="grid gap-5 xl:grid-cols-[0.7fr_1fr] xl:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between xl:block">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
                Pressure Score
              </p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-5xl font-black tracking-tight text-[#102b4c] sm:text-6xl">
                  {score}
                </p>
                <p className="pb-2 text-sm font-black text-[#607487]">/ 100</p>
              </div>
            </div>

            <div className="xl:mt-3">
              <p className="text-sm font-black text-[#102b4c]">
                {pressure.short} operating load
              </p>
              <p className="mt-1 max-w-md text-xs font-medium leading-5 text-[#607487]">
                {pressure.helper}
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
                  Recommended Focus
                </p>
                <p className="mt-1 text-lg font-black text-[#102b4c]">
                  {workload?.recommendedFocus || "Pipeline nurturing"}
                </p>
              </div>

              <span className="self-start rounded-xl border-2 border-orange-300 bg-white px-3 py-2 text-xs font-black text-orange-700">
                {intelligence.capacitySignal}
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${pressure.bar}`}
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white bg-white/70 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#8292a0]">
                  Primary concern
                </p>
                <p className="mt-1 text-xs font-black text-[#102b4c]">
                  {intelligence.primaryConcern}
                </p>
              </div>

              <div className="rounded-xl border border-white bg-white/70 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#8292a0]">
                  Risk concentration
                </p>
                <p className="mt-1 text-xs font-black text-[#102b4c]">
                  {intelligence.riskRatio}%
                </p>
              </div>

              <div className="rounded-xl border border-white bg-white/70 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#8292a0]">
                  Conversion ready
                </p>
                <p className="mt-1 text-xs font-black text-[#102b4c]">
                  {intelligence.conversionRatio}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {compact ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat
            label="At Risk"
            value={intelligence.atRisk}
            helper={`${intelligence.riskRatio}% of assigned`}
            tone="rose"
          />
          <MiniStat
            label="Stalled"
            value={intelligence.stalled}
            helper={`${intelligence.stalledRatio}% of assigned`}
            tone="amber"
          />
          <MiniStat
            label="Conversion"
            value={`${safeNumber(performance?.conversionRate)}%`}
            helper="offer+ movement"
            tone="emerald"
          />
          <MiniStat
            label="Support"
            value={intelligence.supportQueue}
            helper="open pressure"
            tone="violet"
          />
        </div>
      ) : (
        <>
          <div className="mt-5">
            <FocusTabs
              focus={focus}
              onChange={setFocus}
              counts={tabCounts}
            />
          </div>

          {focus === "summary" ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
                <MiniStat
                  label="Grade"
                  value={performance?.performanceGrade || "—"}
                  helper="performance engine"
                  emphasis
                />
                <MiniStat
                  label="Activation"
                  value={`${safeNumber(performance?.activationRate)}%`}
                  helper="active students"
                  tone="orange"
                />
                <MiniStat
                  label="Conversion"
                  value={`${safeNumber(performance?.conversionRate)}%`}
                  helper="offer+ movement"
                  tone="emerald"
                />
                <MiniStat
                  label="Visa Progress"
                  value={`${safeNumber(performance?.visaProgressRate)}%`}
                  helper="visa-stage movement"
                  tone="violet"
                />
                <MiniStat
                  label="Students"
                  value={intelligence.assigned}
                  helper="assigned scope"
                />
                <MiniStat
                  label="At Risk"
                  value={intelligence.atRisk}
                  helper={`${intelligence.riskRatio}% of scope`}
                  tone="rose"
                />
                <MiniStat
                  label="Stalled"
                  value={intelligence.stalled}
                  helper={`${intelligence.stalledRatio}% of scope`}
                  tone="amber"
                />
                <MiniStat
                  label="Support"
                  value={intelligence.supportQueue}
                  helper="open pressure"
                  tone="violet"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1.5rem] border-2 border-[#173f69] bg-[#f7fbff] p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
                    Executive Summary
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#102b4c]">
                    {workload?.executiveSummary ||
                      "No executive workload summary is available yet."}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <ProgressBar
                      label="Risk Ratio"
                      value={intelligence.riskRatio}
                      helper="Assigned students requiring recovery."
                      tone="rose"
                    />
                    <ProgressBar
                      label="Stalled Ratio"
                      value={intelligence.stalledRatio}
                      helper="Assigned students without enough movement."
                      tone="amber"
                    />
                    <ProgressBar
                      label="Conversion Ready"
                      value={intelligence.conversionRatio}
                      helper="Assigned students ready for movement."
                      tone="emerald"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border-2 border-orange-300 bg-orange-50 p-4 sm:p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                    Executive Brief
                  </p>

                  <p className="mt-3 text-base font-black leading-7 text-[#102b4c]">
                    {executiveBrief?.headline ||
                      "Counselor executive brief is waiting for assigned student data."}
                  </p>

                  <div className="mt-4 rounded-2xl border-2 border-orange-200 bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                      Focus
                    </p>
                    <p className="mt-1 text-sm font-black text-[#102b4c]">
                      {executiveBrief?.focus ||
                        workload?.recommendedFocus ||
                        "Pipeline nurturing"}
                    </p>
                  </div>

                  {executiveActions.length ? (
                    <div className="mt-3 space-y-2">
                      {executiveActions.slice(0, 3).map((action, index) => (
                        <div
                          key={actionKey(action, index)}
                          className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#607487]"
                        >
                          {actionText(action)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <WorkloadComposition derived={derived} />
            </div>
          ) : null}

          {focus === "risk" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.55fr_1fr]">
              <StudentMiniList
                title="Top Risk Students"
                students={workload?.topRiskStudents}
                empty="No high-risk students currently detected."
                metric="risk"
                expanded={riskExpanded}
                onToggle={() => setRiskExpanded((value) => !value)}
              />

              <div className="grid content-start gap-3">
                <MiniStat
                  label="Risk Count"
                  value={intelligence.atRisk}
                  helper={`${intelligence.riskRatio}% of assigned students`}
                  tone="rose"
                />
                <ProgressBar
                  label="Risk Concentration"
                  value={intelligence.riskRatio}
                  helper="Lower is healthier when the assigned scope is stable."
                  tone="rose"
                />
              </div>

              <RecommendedActions
                actions={executiveBrief?.recommendedActions}
                title="Risk Recovery Actions"
              />
            </div>
          ) : null}

          {focus === "conversion" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.55fr_1fr]">
              <StudentMiniList
                title="Top Conversion Students"
                students={workload?.topConversionStudents}
                empty="No conversion-ready students currently detected."
                metric="opportunity"
                expanded={conversionExpanded}
                onToggle={() => setConversionExpanded((value) => !value)}
              />

              <div className="grid content-start gap-3">
                <MiniStat
                  label="Conversion Ready"
                  value={intelligence.conversionReady}
                  helper={`${intelligence.conversionRatio}% of assigned students`}
                  tone="emerald"
                />
                <MiniStat
                  label="Offers"
                  value={performance?.offersReceived || 0}
                  helper="offers received"
                  tone="orange"
                />
              </div>

              <div className="grid content-start gap-3">
                <ProgressBar
                  label="Conversion Rate"
                  value={performance?.conversionRate || 0}
                  helper="Students advanced to offer-stage or beyond."
                  tone="emerald"
                />
                <ProgressBar
                  label="Activation"
                  value={performance?.activationRate || 0}
                  helper="Students beyond not-started stage."
                  tone="orange"
                />
              </div>
            </div>
          ) : null}

          {focus === "stalled" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.55fr_1fr]">
              <StudentMiniList
                title="Stalled Students"
                students={workload?.stalledStudentsList}
                empty="No stalled students currently detected."
                metric="stalled"
                expanded={stalledExpanded}
                onToggle={() => setStalledExpanded((value) => !value)}
              />

              <div className="grid content-start gap-3">
                <MiniStat
                  label="Stalled"
                  value={intelligence.stalled}
                  helper={`${intelligence.stalledRatio}% of assigned students`}
                  tone="amber"
                />
                <ProgressBar
                  label="Stalled Ratio"
                  value={intelligence.stalledRatio}
                  helper="Recovery pressure across assigned students."
                  tone="amber"
                />
              </div>

              <RecommendedActions
                title="Stalled Recovery Actions"
                actions={[
                  "Contact stalled students and log the conversation.",
                  "Create recovery tasks for students with no recent movement.",
                  "Push each stalled student toward the next measurable milestone.",
                ]}
              />
            </div>
          ) : null}

          {focus === "performance" ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  className={`rounded-2xl border-2 p-4 ${grade.badge}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80">
                    Performance Grade
                  </p>
                  <p className="mt-2 text-2xl font-black">
                    {performance?.performanceGrade || "—"}
                  </p>
                  <p className="mt-1 text-xs font-semibold opacity-80">
                    Current counselor execution grade
                  </p>
                </div>

                <ProgressBar
                  label="Activation"
                  value={performance?.activationRate || 0}
                  helper="Students beyond not-started stage."
                  tone="orange"
                />
                <ProgressBar
                  label="Conversion"
                  value={performance?.conversionRate || 0}
                  helper="Students at offer-stage or beyond."
                  tone="emerald"
                />
                <ProgressBar
                  label="Visa Progress"
                  value={performance?.visaProgressRate || 0}
                  helper="Students at visa-stage or beyond."
                  tone="violet"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MiniStat
                  label="Avg Velocity"
                  value={performance?.avgVelocity || 0}
                  helper="journey movement"
                  tone="orange"
                />
                <MiniStat
                  label="Offers"
                  value={performance?.offersReceived || 0}
                  helper="offers received"
                  tone="emerald"
                />
                <MiniStat
                  label="Accepted"
                  value={performance?.offersAccepted || 0}
                  helper="offers accepted"
                  tone="violet"
                />
                <MiniStat
                  label="CAS"
                  value={performance?.casIssued || 0}
                  helper="CAS issued"
                  tone="amber"
                />
              </div>

              <div className="rounded-[1.5rem] border-2 border-[#173f69] bg-[#f7fbff] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
                      Performance Interpretation
                    </p>
                    <p className="mt-2 text-sm font-black text-[#102b4c]">
                      Keep the grade connected to real student movement, not activity volume alone.
                    </p>
                  </div>

                  <span
                    className={`self-start rounded-xl border-2 px-3 py-2 text-xs font-black ${grade.badge}`}
                  >
                    {performance?.performanceGrade || "No grade"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
