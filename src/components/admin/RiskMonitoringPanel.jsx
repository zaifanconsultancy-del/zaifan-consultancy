// RiskMonitoringPanel V2 — Executive Risk Command Center
// Preserves the full risk-signal engine, severity sorting, rescue/document/task/planning
// command boards, journey-stage detection, risk/opportunity scoring, and recommendations.
// Visual system rebuilt for the approved Zaifan Admin OS: cream, white, navy and orange.

import { useMemo } from "react";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function getStudentName(student = {}) {
  return (
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    student?.studentName ||
    "Unknown Student"
  );
}

function getRiskScore(student = {}) {
  return number(student?.risk_score || student?.previous_risk_score || 0);
}

function getOpportunityScore(student = {}) {
  return number(student?.opportunity_score || 0);
}

function isBlankStatus(value) {
  const clean = normalize(value);

  return (
    !clean ||
    clean === "none" ||
    clean === "null" ||
    clean === "undefined" ||
    clean === "not_started" ||
    clean === "no_application"
  );
}

function getJourneyStage(student = {}) {
  const directStage = normalize(student?.journey_stage || student?.diagnostics?.journey_stage);
  if (directStage) return directStage;

  const applicationStatus = normalize(student?.application_status);
  const offerStatus = normalize(student?.offer_status);
  const visaStatus = normalize(student?.visa_status);

  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visaStatus)) {
    return "visa_pending";
  }

  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";

  if (
    ["offer_accepted", "accepted"].includes(applicationStatus) ||
    ["offer_accepted", "accepted"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "offer", "received"].includes(applicationStatus) ||
    ["offer_received", "offer", "received"].includes(offerStatus)
  ) {
    return "offer_received";
  }

  if (["under_review", "review"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (["started", "in_progress", "draft"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getDiagnostic(student = {}, key, fallback = "") {
  return student?.[key] ?? student?.diagnostics?.[key] ?? fallback;
}

function isVisaRejected(student = {}) {
  return getJourneyStage(student) === "visa_rejected";
}

function getRiskSignals(student = {}) {
  const riskScore = getRiskScore(student);
  const opportunityScore = getOpportunityScore(student);
  const category = normalize(student?.executive_category);
  const riskLevel = normalize(student?.risk_level || student?.previous_risk_level);
  const priorityLevel = normalize(student?.priority_level);

  const journeyStage = getJourneyStage(student);

  const overdueTasks = number(getDiagnostic(student, "overdue_tasks_count"));
  const pendingTasks = number(getDiagnostic(student, "pending_tasks_count"));
  const documentReadiness = number(getDiagnostic(student, "document_readiness_percent"));
  const taskCompletion = number(getDiagnostic(student, "task_completion_percent"));
  const universityPlanCount = number(getDiagnostic(student, "university_plan_count"));
  const safeUniversityCount = number(
    getDiagnostic(student, "safe_university_count", student?.safe_universities_count || 0)
  );
  const daysSinceUpdated = number(getDiagnostic(student, "days_since_updated"), -1);

  const hasUniversityPlan =
    isTruthy(student?.has_university_plan) || universityPlanCount > 0;

  const applicationStatus = normalize(student?.application_status);

  const signals = [];

  if (isVisaRejected(student)) {
    signals.push({
      type: "visa_rejected",
      severity: 100,
      label: "Visa Rejected",
      reason: "Visa rejection detected. Counselor recovery review is required.",
      action: "Review refusal reason and prepare recovery plan.",
    });
  }

  if (category === "critical_risk" || riskLevel === "critical" || riskScore >= 85) {
    signals.push({
      type: "critical_risk",
      severity: 95,
      label: "Critical Risk",
      reason: "Executive AI marked this student as a critical risk case.",
      action: "Escalate to senior counselor today.",
    });
  }

  if (riskLevel === "high" || riskScore >= 65) {
    signals.push({
      type: "high_risk",
      severity: 85,
      label: "High Risk",
      reason: "Risk score is high enough to require counselor attention.",
      action: "Create follow-up task and check blockers.",
    });
  }

  if (overdueTasks >= 3) {
    signals.push({
      type: "task_emergency",
      severity: 90,
      label: "Task Emergency",
      reason: `${overdueTasks} overdue tasks detected. Execution recovery is required.`,
      action: "Clear overdue tasks or reassign ownership.",
    });
  } else if (overdueTasks > 0) {
    signals.push({
      type: "overdue_tasks",
      severity: 75,
      label: "Overdue Tasks",
      reason: `${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""} detected.`,
      action: "Complete or reschedule overdue tasks.",
    });
  }

  if (pendingTasks >= 8) {
    signals.push({
      type: "task_overload",
      severity: 70,
      label: "Task Overload",
      reason: `${pendingTasks} pending tasks are open for this student.`,
      action: "Prioritize tasks and remove duplicates.",
    });
  }

  if (documentReadiness > 0 && documentReadiness < 50) {
    signals.push({
      type: "document_risk",
      severity: 72,
      label: "Document Risk",
      reason: "Document readiness is low. Student may not be application-ready.",
      action: "Request missing documents from student.",
    });
  }

  if (documentReadiness === 0) {
    signals.push({
      type: "missing_documents",
      severity: 62,
      label: "No Documents",
      reason: "No document readiness signal is available.",
      action: "Check document checklist and upload status.",
    });
  }

  if (taskCompletion > 0 && taskCompletion < 50) {
    signals.push({
      type: "weak_tasks",
      severity: 60,
      label: "Weak Task Health",
      reason: "Task completion is weak. Counselor follow-up may be falling behind.",
      action: "Review pending work and next action.",
    });
  }

  if (!hasUniversityPlan) {
    signals.push({
      type: "no_university_plan",
      severity: 68,
      label: "Planning Risk",
      reason: "No university plan detected. Student journey lacks Dream, Target, and Safe options.",
      action: "Add Dream, Target, and Safe universities.",
    });
  }

  if (hasUniversityPlan && safeUniversityCount === 0) {
    signals.push({
      type: "no_safe_university",
      severity: 64,
      label: "No Safe Option",
      reason: "University plan exists but has no safe university option.",
      action: "Add at least one realistic safe university.",
    });
  }

  if (daysSinceUpdated >= 21) {
    signals.push({
      type: "inactive_student",
      severity: 70,
      label: "Inactive Student",
      reason: `Student has no recent activity for ${daysSinceUpdated} days.`,
      action: "Reactivate with call or WhatsApp follow-up.",
    });
  } else if (daysSinceUpdated >= 10) {
    signals.push({
      type: "low_activity",
      severity: 55,
      label: "Low Activity",
      reason: `Student has low recent activity for ${daysSinceUpdated} days.`,
      action: "Send check-in message.",
    });
  }

  if (journeyStage === "cas_pending") {
    signals.push({
      type: "cas_pending",
      severity: 66,
      label: "CAS Pending",
      reason: "CAS is pending. Delay here can block visa progress.",
      action: "Check CAS requirements and university response.",
    });
  }

  if (journeyStage === "visa_pending") {
    signals.push({
      type: "visa_pending",
      severity: 58,
      label: "Visa Pending",
      reason: "Visa case is in progress and should be monitored closely.",
      action: "Track decision timeline and document readiness.",
    });
  }

  if (journeyStage === "offer_accepted" && !["visa_pending", "visa_approved"].includes(journeyStage)) {
    signals.push({
      type: "visa_not_started",
      severity: 58,
      label: "Visa Not Started",
      reason: "Offer has been accepted but visa has not started.",
      action: "Start visa checklist and student preparation.",
    });
  }

  if (isBlankStatus(applicationStatus) || journeyStage === "not_started") {
    signals.push({
      type: "no_application",
      severity: 52,
      label: "No Application",
      reason: "No active application status detected.",
      action: "Start application or update application status.",
    });
  }

  if (priorityLevel === "executive" && opportunityScore >= 80 && riskScore >= 45) {
    signals.push({
      type: "hot_but_risky",
      severity: 78,
      label: "Hot But Risky",
      reason: "Student has high opportunity but still carries meaningful risk.",
      action: "Fast-track with counselor supervision.",
    });
  }

  return signals.sort((a, b) => b.severity - a.severity);
}

function getRiskReason(student = {}) {
  const signals = getRiskSignals(student);
  if (signals.length) return signals[0].reason;

  if (student?.summary) return student.summary;
  if (student?.gpt_summary) return student.gpt_summary;
  if (student?.gpt_risk) return student.gpt_risk;

  return "Student needs counselor review.";
}

function getRiskBadge(student = {}) {
  const signals = getRiskSignals(student);
  if (signals.length) return signals[0].label;

  return student?.executive_category || student?.risk_level || "Needs Attention";
}

function getRecommendedAction(student = {}) {
  const signals = getRiskSignals(student);
  if (signals.length) return signals[0].action;

  return "Review student profile and decide next action.";
}

function getRiskSeverity(student = {}) {
  const signals = getRiskSignals(student);
  if (signals.length) return signals[0].severity;

  return getRiskScore(student);
}

function RiskMonitoringPanel({ students = [] }) {
  const riskyStudents = students
    .map((student) => ({
      student,
      signals: getRiskSignals(student),
      severity: getRiskSeverity(student),
      riskScore: getRiskScore(student),
    }))
    .filter(({ student, signals, riskScore }) => {
      const category = normalize(student?.executive_category);
      const riskLevel = normalize(student?.risk_level || student?.previous_risk_level);

      return (
        signals.length > 0 ||
        category === "critical_risk" ||
        category === "needs_attention" ||
        riskLevel === "critical" ||
        riskLevel === "high" ||
        riskScore >= 55
      );
    })
    .sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return b.riskScore - a.riskScore;
    })
    .slice(0, 8);

  const criticalCount = riskyStudents.filter((item) => item.severity >= 90).length;
  const executionCount = riskyStudents.filter((item) =>
    item.signals.some((signal) =>
      ["task_emergency", "overdue_tasks", "task_overload", "weak_tasks"].includes(signal.type)
    )
  ).length;
  const planningCount = riskyStudents.filter((item) =>
    item.signals.some((signal) =>
      ["no_university_plan", "no_safe_university"].includes(signal.type)
    )
  ).length;

  const riskCommand = useMemo(() => {
    const rescue = riskyStudents.filter(({ student }) =>
      getRiskScore(student) >= 70 && getOpportunityScore(student) >= 60
    );
    const documentCases = riskyStudents.filter(({ signals }) =>
      signals.some((signal) => ["document_risk", "missing_documents"].includes(signal.type))
    );
    const taskCases = riskyStudents.filter(({ signals }) =>
      signals.some((signal) => ["task_emergency", "overdue_tasks", "task_overload", "weak_tasks"].includes(signal.type))
    );
    const planningCases = riskyStudents.filter(({ signals }) =>
      signals.some((signal) => ["no_university_plan", "no_safe_university"].includes(signal.type))
    );

    return { rescue, documentCases, taskCases, planningCases };
  }, [riskyStudents]);


  return (
    <div className="rounded-[1.85rem] border-2 border-orange-300 bg-[#fff8ee] p-6 shadow-[0_14px_36px_rgba(15,35,63,0.07)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-orange-700">
            Executive Risk
          </p>

          <h3 className="mt-1 font-black text-[#10233f]">Student Risk Monitoring</h3>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Students needing counselor attention across applications, CAS, visa,
            overdue tasks, documents, inactivity, and university planning.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SummaryBadge label="Risk" value={riskyStudents.length} />
          <SummaryBadge label="Critical" value={criticalCount} tone="critical" />
          <SummaryBadge label="Execution" value={executionCount} />
          <SummaryBadge label="Planning" value={planningCount} />
        </div>
      </div>



      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RiskCommandCard label="Rescue Cases" value={riskCommand.rescue.length} detail="High risk + high opportunity; do not lose." tone="gold" />
        <RiskCommandCard label="Document Pressure" value={riskCommand.documentCases.length} detail="Missing or weak readiness signals." tone="orange" />
        <RiskCommandCard label="Task Pressure" value={riskCommand.taskCases.length} detail="Overdue, overloaded, or weak tasks." tone="red" />
        <RiskCommandCard label="Planning Gaps" value={riskCommand.planningCases.length} detail="No university plan or no safe option." tone="blue" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-4">
        <RiskMiniBoard title="Rescue Board" items={riskCommand.rescue.slice(0, 4)} tone="gold" />
        <RiskMiniBoard title="Document Board" items={riskCommand.documentCases.slice(0, 4)} tone="orange" />
        <RiskMiniBoard title="Task Board" items={riskCommand.taskCases.slice(0, 4)} tone="red" />
        <RiskMiniBoard title="Planning Board" items={riskCommand.planningCases.slice(0, 4)} tone="blue" />
      </div>

      <div className="mt-5 space-y-3">
        {riskyStudents.length ? (
          riskyStudents.map(({ student, signals, severity, riskScore }) => {
            const name = getStudentName(student);
            const documentReadiness = number(getDiagnostic(student, "document_readiness_percent"));
            const taskCompletion = number(getDiagnostic(student, "task_completion_percent"));
            const overdueTasks = number(getDiagnostic(student, "overdue_tasks_count"));
            const pendingTasks = number(getDiagnostic(student, "pending_tasks_count"));
            const universityPlanCount = number(getDiagnostic(student, "university_plan_count"));
            const journeyStage = getJourneyStage(student);

            const topSignals = signals.slice(0, 3);

            return (
              <div
                key={student.id || name}
                className="rounded-2xl border border-red-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-[#10233f]">{name}</p>

                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                        {formatStage(journeyStage)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-red-700">
                      {getRiskBadge(student)}
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {getRiskReason(student)}
                    </p>

                    <p className="mt-2 rounded-xl border border-slate-300 bg-[#fffaf2] px-3 py-2 text-xs leading-5 text-slate-600">
                      Next action:{" "}
                      <span className="font-black text-[#10233f]/80">
                        {getRecommendedAction(student)}
                      </span>
                    </p>

                    {topSignals.length > 1 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topSignals.map((signal) => (
                          <span
                            key={`${student.id || name}-${signal.type}`}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-red-700"
                          >
                            {signal.label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      <span>Docs {documentReadiness}%</span>
                      <span>Tasks {taskCompletion}%</span>
                      <span>Pending {pendingTasks}</span>
                      <span>Overdue {overdueTasks}</span>
                      <span>Universities {universityPlanCount}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                    <span className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                      Risk {riskScore}
                    </span>

                    <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                      Severity {severity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-800">
              No major student risks detected.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Executive AI does not currently see urgent risk across applications,
              CAS, visa, documents, tasks, activity, or university planning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


function RiskCommandCard({ label, value, detail, tone = "red" }) {
  const style =
    tone === "gold"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : tone === "orange"
      ? "border-orange-300 bg-[#fff7ed] text-orange-700"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-red-300 bg-red-50 text-red-700";

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#10233f]">{value || 0}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function RiskMiniBoard({ title, items = [], tone = "red" }) {
  const scoreClass =
    tone === "gold"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : tone === "orange"
      ? "border-orange-300 bg-[#fff7ed] text-orange-700"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-red-300 bg-red-50 text-red-700";

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <h3 className="font-black text-[#10233f]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.map(({ student, severity, riskScore }, index) => {
          const name = getStudentName(student);
          return (
            <div key={`${title}-${student?.id || name}-${index}`} className="rounded-xl border border-slate-300 bg-[#fffaf2] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#10233f]">{name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatStage(getJourneyStage(student))} • Opp {getOpportunityScore(student)}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}>{Math.max(severity, riskScore)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{getRiskReason(student)}</p>
            </div>
          );
        }) : <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-500">No records.</p>}
      </div>
    </div>
  );
}

function SummaryBadge({ label, value, tone = "default" }) {
  const className =
    tone === "critical"
      ? "border-red-300 bg-red-50 text-red-700"
      : "border-orange-300 bg-white text-orange-700";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${className}`}>
      {value} {label}
    </span>
  );
}

function formatStage(stage = "") {
  const clean = normalize(stage);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default RiskMonitoringPanel;