import React, { useMemo, useState } from "react";

const FOCUS_FILTERS = [
  { key: "summary", label: "Summary" },
  { key: "risk", label: "Risk" },
  { key: "conversion", label: "Conversion" },
  { key: "stalled", label: "Stalled" },
  { key: "performance", label: "Performance" },
];

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

function pressureTone(score = 0) {
  const value = safeNumber(score);

  if (value >= 78) return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (value >= 48) return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
}

function gradeTone(grade = "") {
  const value = safeString(grade).toLowerCase();

  if (value.includes("excellent")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("strong")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("developing")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (value.includes("attention")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function MiniStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.03]",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function ProgressBar({ label, value, helper }) {
  const score = Math.max(0, Math.min(100, safeNumber(value)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
        <p className="text-sm font-black text-white">{score}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${score}%` }} />
      </div>
      {helper ? <p className="mt-2 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function StudentMiniList({ title, students = [], empty }) {
  const visible = safeArray(students).slice(0, 5);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{title}</p>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{empty || "No students in this queue."}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((student) => (
            <div key={student.id || student.email || student.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{student.name || student.student_name || "Student"}</p>
                  <p className="text-xs text-slate-500">{student.stage || student.email || "No stage"}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-bold text-slate-300">
                  {student.riskScore ?? student.opportunityScore ?? student.stalledDays ?? "—"}
                </span>
              </div>
              {student.nextBestAction ? <p className="mt-2 text-xs text-slate-400">{student.nextBestAction}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendedActions({ actions = [] }) {
  const visibleActions = safeArray(actions).length ? actions : ["Keep moving assigned students forward."];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recommended Actions</p>
      <div className="mt-3 space-y-2">
        {visibleActions.map((action) => (
          <div key={action} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-semibold text-slate-300">
            {action}
          </div>
        ))}
      </div>
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
  const score = safeNumber(workload?.pressureScore);

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
      rawTotal: students.length + tasks.length + support.length + applications.length + documents.length + appointments.length,
    };
  }, [snapshot]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/20">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Workload Engine</p>
          <h2 className="mt-2 text-2xl font-black">Counselor Pressure Monitor</h2>
          <p className="mt-1 text-sm text-slate-400">
            Operational load, risk concentration, support pressure, conversion movement, and recommended focus.
          </p>
        </div>

        <span className={`rounded-2xl border px-4 py-2 text-sm font-bold ${pressureTone(score)}`}>
          {workload?.pressureLabel || "Healthy workload"}
        </span>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Pressure Score</p>
            <p className="text-5xl font-black">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-white">{workload?.pressureLabel || "Healthy workload"}</p>
            <p className="mt-1 text-sm text-slate-400">Focus: {workload?.recommendedFocus || "Pipeline nurturing"}</p>
          </div>
        </div>
        <div className="mt-5 h-3 rounded-full bg-white/10">
          <div className="h-3 rounded-full bg-white" style={{ width: `${Math.min(100, score)}%` }} />
        </div>
      </div>

      {!compact ? (
        <>
          <div className="mt-5 flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-slate-950/40 p-2">
            {FOCUS_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFocus(item.key)}
                className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                  focus === item.key ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {focus === "summary" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Grade" value={performance?.performanceGrade || "-"} helper="performance engine" />
              <MiniStat label="Activation" value={`${performance?.activationRate || 0}%`} helper="active students" tone="cyan" />
              <MiniStat label="Conversion" value={`${performance?.conversionRate || 0}%`} helper="offer+ movement" tone="emerald" />
              <MiniStat label="Visa Progress" value={`${performance?.visaProgressRate || 0}%`} helper="visa-stage movement" tone="violet" />
              <MiniStat label="Students" value={workload?.assignedStudents ?? derived.students} helper="assigned scope" />
              <MiniStat label="At Risk" value={workload?.atRiskStudents || 0} helper="risk recovery" tone="rose" />
              <MiniStat label="Stalled" value={workload?.stalledStudents || 0} helper="needs contact" tone="amber" />
              <MiniStat label="Support" value={workload?.supportQueue || derived.support} helper="open pressure" tone="violet" />

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Executive Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {workload?.executiveSummary || "No executive workload summary available yet."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Executive Brief</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {executiveBrief?.headline || "Counselor executive brief is waiting for assigned student data."}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Focus: {executiveBrief?.focus || workload?.recommendedFocus || "Pipeline nurturing"}
                </p>
              </div>
            </div>
          ) : null}

          {focus === "risk" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <StudentMiniList
                title="Top Risk Students"
                students={workload?.topRiskStudents}
                empty="No high-risk students currently detected."
              />
              <MiniStat label="Risk Count" value={workload?.atRiskStudents || 0} helper="risk queue size" tone="rose" />
              <RecommendedActions actions={executiveBrief?.recommendedActions} />
            </div>
          ) : null}

          {focus === "conversion" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <StudentMiniList
                title="Top Conversion Students"
                students={workload?.topConversionStudents}
                empty="No conversion-ready students currently detected."
              />
              <MiniStat label="Conversion Ready" value={workload?.conversionReady || 0} helper="ready to move" tone="emerald" />
              <ProgressBar label="Conversion Rate" value={performance?.conversionRate || 0} helper="Students advanced to offer-stage or beyond." />
            </div>
          ) : null}

          {focus === "stalled" ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <StudentMiniList
                title="Stalled Students"
                students={workload?.stalledStudentsList}
                empty="No stalled students currently detected."
              />
              <MiniStat label="Stalled" value={workload?.stalledStudents || 0} helper="stalled count" tone="amber" />
              <RecommendedActions
                actions={[
                  "Contact stalled students and log the conversation.",
                  "Create recovery tasks for students with no recent movement.",
                  "Push each stalled student toward the next milestone.",
                ]}
              />
            </div>
          ) : null}

          {focus === "performance" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className={`rounded-2xl border p-4 ${gradeTone(performance?.performanceGrade)}`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Grade</p>
                <p className="mt-2 text-2xl font-black">{performance?.performanceGrade || "-"}</p>
              </div>
              <ProgressBar label="Activation" value={performance?.activationRate || 0} helper="Students beyond not-started stage." />
              <ProgressBar label="Conversion" value={performance?.conversionRate || 0} helper="Students at offer-stage or beyond." />
              <ProgressBar label="Visa Progress" value={performance?.visaProgressRate || 0} helper="Students at visa-stage or beyond." />
              <MiniStat label="Avg Velocity" value={performance?.avgVelocity || 0} helper="journey movement" tone="cyan" />
              <MiniStat label="Offers" value={performance?.offersReceived || 0} helper="offers received" tone="emerald" />
              <MiniStat label="Accepted" value={performance?.offersAccepted || 0} helper="offers accepted" tone="violet" />
              <MiniStat label="CAS" value={performance?.casIssued || 0} helper="CAS issued" tone="amber" />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}