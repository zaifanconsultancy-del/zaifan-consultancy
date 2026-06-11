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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
}

function getJourneyStage(score = {}) {
  return (
    normalize(score.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage) ||
    normalize(score.stage) ||
    normalize(score.application_status) ||
    "unknown"
  );
}

export function buildExecutiveInterventions(score = {}) {
  const interventions = [];

  const risk = number(score.risk_score);
  const opportunity = number(score.opportunity_score);
  const journey = getJourneyStage(score);

  const overdue = number(getValue(score, "overdue_tasks_count"));
  const pending = number(getValue(score, "pending_tasks_count"));
  const documentReadiness = number(getValue(score, "document_readiness_percent", 100));
  const daysInactive = number(getValue(score, "days_since_updated"));
  const universityPlanCount = number(getValue(score, "university_plan_count"));
  const safeUniversityCount = number(
    getValue(score, "safe_university_count", score.safe_universities_count)
  );

  if (journey === "visa_rejected" || risk >= 90) {
    interventions.push({
      intervention_type: "critical_intervention",
      severity: "critical",
      title: "Immediate Executive Review",
      recommendation:
        "Escalate to senior counselor and create recovery plan within 24 hours.",
      action_type: "create_task",
      priority: "critical",
    });
  }

  if (risk >= 75 && opportunity >= 60) {
    interventions.push({
      intervention_type: "high_value_rescue",
      severity: "critical",
      title: "High-Value Rescue Case",
      recommendation:
        "Prioritize this student because risk is high but conversion value remains strong.",
      action_type: "create_task",
      priority: "critical",
    });
  }

  if (journey === "cas_pending" && daysInactive >= 7) {
    interventions.push({
      intervention_type: "cas_delay_risk",
      severity: "high",
      title: "CAS Delay Risk",
      recommendation:
        "Contact university and verify CAS blockers, deposit condition, and missing documents.",
      action_type: "create_task",
      priority: "high",
    });
  }

  if (["offer_accepted", "cas_issued"].includes(journey) && daysInactive >= 5) {
    interventions.push({
      intervention_type: "visa_delay_risk",
      severity: "high",
      title: "Visa Workflow Delay",
      recommendation:
        "Trigger visa preparation workflow and create counselor follow-up.",
      action_type: "create_task",
      priority: "high",
    });
  }

  if (["visa_pending", "visa_submitted"].includes(journey) && daysInactive >= 7) {
    interventions.push({
      intervention_type: "visa_follow_up",
      severity: "high",
      title: "Visa Follow-up Required",
      recommendation:
        "Review visa status, expected decision date, and missing follow-up actions.",
      action_type: "create_task",
      priority: "high",
    });
  }

  if (documentReadiness < 60) {
    interventions.push({
      intervention_type: "document_intervention",
      severity: "medium",
      title: "Document Gap",
      recommendation:
        "Create missing document recovery plan and request updated documents from student.",
      action_type: "create_task",
      priority: "medium",
    });
  }

  if (documentReadiness < 35) {
    interventions.push({
      intervention_type: "critical_document_gap",
      severity: "high",
      title: "Critical Document Gap",
      recommendation:
        "Documents are blocking progress. Assign counselor document recovery immediately.",
      action_type: "create_task",
      priority: "high",
    });
  }

  if (overdue >= 3) {
    interventions.push({
      intervention_type: "task_intervention",
      severity: "high",
      title: "Execution Breakdown",
      recommendation:
        "Recover overdue tasks immediately and reassign ownership where required.",
      action_type: "create_task",
      priority: "high",
    });
  }

  if (pending >= 8) {
    interventions.push({
      intervention_type: "task_overload",
      severity: "medium",
      title: "Task Queue Overload",
      recommendation:
        "Review pending task volume and close, merge, or reprioritize stale work.",
      action_type: "create_task",
      priority: "medium",
    });
  }

  if (universityPlanCount === 0 && ["not_started", "inquiry", "planning", "unknown"].includes(journey)) {
    interventions.push({
      intervention_type: "university_planning_required",
      severity: "medium",
      title: "University Planning Required",
      recommendation:
        "Create Dream, Target, and Safe university plan before application movement.",
      action_type: "create_task",
      priority: "medium",
    });
  }

  if (universityPlanCount > 0 && safeUniversityCount === 0) {
    interventions.push({
      intervention_type: "safe_university_missing",
      severity: "medium",
      title: "Safe University Missing",
      recommendation:
        "Add at least one safe university option to reduce admission risk.",
      action_type: "create_task",
      priority: "medium",
    });
  }

  if (daysInactive >= 14) {
    interventions.push({
      intervention_type: "inactive_student",
      severity: daysInactive >= 30 ? "high" : "medium",
      title: "Student Inactive",
      recommendation:
        "Create follow-up call, WhatsApp/email reminder, and counselor activity log.",
      action_type: "create_reminder",
      priority: daysInactive >= 30 ? "high" : "medium",
    });
  }

  if (opportunity >= 85 && risk < 50) {
    interventions.push({
      intervention_type: "fast_track_intervention",
      severity: "executive",
      title: "Fast Track Candidate",
      recommendation:
        "Move student to executive acceleration workflow.",
      action_type: "schedule_call",
      priority: "executive",
    });
  }

  if (opportunity >= 75 && ["offer_received", "offer_accepted", "cas_pending"].includes(journey)) {
    interventions.push({
      intervention_type: "conversion_push",
      severity: "executive",
      title: "Conversion Push",
      recommendation:
        "Use a senior counselor touchpoint to push offer/CAS student toward next stage.",
      action_type: "schedule_call",
      priority: "executive",
    });
  }

  return interventions;
}

export function buildInterventionSummary(scores = []) {
  const rows = asArray(scores);
  const interventions = rows.flatMap((score) =>
    buildExecutiveInterventions(score).map((intervention) => ({
      ...intervention,
      student_id: score.student_id || score.id || score.inquiry_id || score.appointment_id || null,
      student_name:
        score.student_name || score.full_name || score.name || score.student_email || "Unknown Student",
      student_type: score.student_type || score.record_type || "inquiry",
      risk_score: number(score.risk_score),
      opportunity_score: number(score.opportunity_score),
      journey_stage: getJourneyStage(score),
    }))
  );

  return {
    totalInterventions: interventions.length,
    critical: interventions.filter((item) => item.severity === "critical").length,
    executive: interventions.filter((item) => item.severity === "executive").length,
    high: interventions.filter((item) => item.severity === "high").length,
    medium: interventions.filter((item) => item.severity === "medium").length,
    low: interventions.filter((item) => item.severity === "low").length,
    interventions,
  };
}

export function buildPriorityInterventionQueue(scores = []) {
  const weight = {
    critical: 5,
    executive: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return buildInterventionSummary(scores).interventions
    .map((item) => ({
      ...item,
      urgency:
        (weight[item.severity] || 0) * 20 +
        number(item.risk_score) * 0.5 +
        number(item.opportunity_score) * 0.25,
    }))
    .sort((a, b) => b.urgency - a.urgency);
}

export function buildInterventionDashboardSnapshot(scores = []) {
  const summary = buildInterventionSummary(scores);
  const queue = buildPriorityInterventionQueue(scores);

  return {
    ...summary,
    queue,
    topPriority: queue.slice(0, 10),
    health:
      summary.critical > 0
        ? "critical"
        : summary.high > 0
          ? "needs_attention"
          : summary.totalInterventions > 0
            ? "monitor"
            : "healthy",
    generated_at: new Date().toISOString(),
  };
}

export default {
  buildExecutiveInterventions,
  buildInterventionSummary,
  buildPriorityInterventionQueue,
  buildInterventionDashboardSnapshot,
};