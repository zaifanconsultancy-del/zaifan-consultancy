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

function nowIso() {
  return new Date().toISOString();
}

function getValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
}

function getStudentId(score = {}) {
  return score.student_id || score.id || score.inquiry_id || score.appointment_id || null;
}

function getStudentType(score = {}) {
  return score.student_type || score.record_type || score.__leadType || score.type || "inquiry";
}

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || score.student_email || "Unknown Student";
}

function getJourneyStage(score = {}) {
  const direct =
    normalize(score.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage) ||
    normalize(score.stage);

  if (direct && direct !== "unknown") return direct;

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const casStatus = normalize(score.cas_status);
  const visaStatus = normalize(score.visa_status);
  const paymentStatus = normalize(score.payment_status);

  if (["enrolled", "completed"].includes(applicationStatus)) return "enrolled";
  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) return "visa_rejected";
  if (["visa_pending", "visa_submitted", "submitted", "under_review", "review", "processing"].includes(visaStatus)) {
    return "visa_pending";
  }

  if (["cas_issued", "issued"].includes(casStatus) || applicationStatus === "cas_issued") return "cas_issued";
  if (["cas_pending", "pending"].includes(casStatus) || applicationStatus === "cas_pending") return "cas_pending";

  if (
    ["offer_accepted", "accepted", "confirmed"].includes(applicationStatus) ||
    ["offer_accepted", "accepted", "confirmed"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(applicationStatus) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(offerStatus)
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) return "application_under_review";
  if (["applied", "submitted"].includes(applicationStatus)) return "application_submitted";
  if (["started", "draft", "in_progress"].includes(applicationStatus)) return "application_started";
  if (["paid", "partial", "outstanding"].includes(paymentStatus)) return "payment";

  return "not_started";
}

function getSeverityWeight(severity = "") {
  const key = normalize(severity);

  if (key === "critical") return 5;
  if (key === "executive") return 4;
  if (key === "high") return 3;
  if (key === "medium") return 2;
  if (key === "low") return 1;

  return 0;
}

function buildRecommendationPayload(score = {}, intervention = {}) {
  return {
    student_id: String(getStudentId(score) || ""),
    student_type: getStudentType(score),
    student_name: getStudentName(score),

    title: intervention.title || "Executive Intervention",
    description: intervention.recommendation || intervention.description || "",

    journey_stage: getJourneyStage(score),
    application_status: score.application_status || "",
    offer_status: score.offer_status || "",
    cas_status: score.cas_status || "",
    visa_status: score.visa_status || "",
    payment_status: score.payment_status || "",

    risk_score: number(score.risk_score),
    opportunity_score: number(score.opportunity_score),
    risk_level: score.risk_level || "",
    priority_level: score.priority_level || "",
    executive_category: score.executive_category || "",

    document_readiness_percent: number(getValue(score, "document_readiness_percent")),
    task_completion_percent: number(getValue(score, "task_completion_percent")),
    pending_tasks_count: number(getValue(score, "pending_tasks_count")),
    overdue_tasks_count: number(getValue(score, "overdue_tasks_count")),
    university_plan_count: number(getValue(score, "university_plan_count")),
    safe_university_count: number(getValue(score, "safe_university_count", score.safe_universities_count)),
    target_university_count: number(getValue(score, "target_university_count")),
    dream_university_count: number(getValue(score, "dream_university_count")),
    days_since_updated: getValue(score, "days_since_updated", null),

    intervention_type: intervention.intervention_type,
    intervention_severity: intervention.severity,
    recovery_stage: intervention.recovery_stage || null,
    approval_required:
      intervention.requires_approval === true ||
      ["critical", "executive"].includes(normalize(intervention.priority)) ||
      ["critical", "executive"].includes(normalize(intervention.severity)),

    automation_version: "v4",
    automation_source: "executive_intervention_engine",
    generated_by: "executive_intervention_engine",
    generated_at: nowIso(),

    ...(intervention.payload || {}),
  };
}

function buildIntervention({
  score = {},
  intervention_type,
  severity = "medium",
  title,
  recommendation,
  action_type = "create_task",
  priority = "medium",
  recovery_stage = null,
  requires_approval = null,
  payload = {},
}) {
  const intervention = {
    intervention_type: normalize(intervention_type),
    severity: normalize(severity),
    title,
    recommendation,
    description: recommendation,
    action_type: normalize(action_type),
    action: normalize(action_type),
    type: normalize(intervention_type),
    priority: normalize(priority),
    recovery_stage: recovery_stage ? normalize(recovery_stage) : null,
    requires_approval:
      requires_approval === null
        ? ["critical", "executive"].includes(normalize(priority)) ||
          ["critical", "executive"].includes(normalize(severity))
        : Boolean(requires_approval),
    payload,
  };

  return {
    ...intervention,
    payload: buildRecommendationPayload(score, intervention),
  };
}

function mapInterventionToRecommendation(score = {}, intervention = {}) {
  return {
    type: intervention.type || intervention.intervention_type,
    action: intervention.action || intervention.action_type || "create_task",
    priority: intervention.priority || intervention.severity || "medium",
    title: intervention.title,
    description: intervention.recommendation || intervention.description || "",
    payload: buildRecommendationPayload(score, intervention),
  };
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
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "critical_intervention",
        severity: "critical",
        title: "Immediate Executive Review",
        recommendation: "Escalate to senior counselor and create recovery plan within 24 hours.",
        action_type: "create_executive_escalation",
        priority: "critical",
        recovery_stage: "executive",
      })
    );
  }

  if (risk >= 75 && opportunity >= 60) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "high_value_rescue",
        severity: "critical",
        title: "High-Value Rescue Case",
        recommendation: "Prioritize this student because risk is high but conversion value remains strong.",
        action_type: "create_executive_escalation",
        priority: "critical",
        recovery_stage: "executive",
      })
    );
  }

  if (journey === "cas_pending" && daysInactive >= 7) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "cas_delay_risk",
        severity: "high",
        title: "CAS Delay Risk",
        recommendation: "Contact university and verify CAS blockers, deposit condition, and missing documents.",
        action_type: "recover_cas_workflow",
        priority: "high",
        recovery_stage: "cas",
      })
    );
  }

  if (["offer_accepted", "cas_issued"].includes(journey) && daysInactive >= 5) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "visa_delay_risk",
        severity: "high",
        title: "Visa Workflow Delay",
        recommendation: "Trigger visa preparation workflow and create counselor follow-up.",
        action_type: "create_visa_tracking",
        priority: "high",
        recovery_stage: "visa",
      })
    );
  }

  if (["visa_pending", "visa_submitted"].includes(journey) && daysInactive >= 7) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "visa_follow_up",
        severity: "high",
        title: "Visa Follow-up Required",
        recommendation: "Review visa status, expected decision date, and missing follow-up actions.",
        action_type: "create_visa_tracking",
        priority: "high",
        recovery_stage: "visa",
      })
    );
  }

  if (documentReadiness < 60) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "document_intervention",
        severity: "medium",
        title: "Document Gap",
        recommendation: "Create missing document recovery plan and request updated documents from student.",
        action_type: "create_document_recovery_tasks",
        priority: "medium",
        recovery_stage: "documents",
      })
    );
  }

  if (documentReadiness < 35) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "critical_document_gap",
        severity: "high",
        title: "Critical Document Gap",
        recommendation: "Documents are blocking progress. Assign counselor document recovery immediately.",
        action_type: "create_document_recovery_tasks",
        priority: "high",
        recovery_stage: "documents",
      })
    );
  }

  if (overdue >= 3) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "task_intervention",
        severity: "high",
        title: "Execution Breakdown",
        recommendation: "Recover overdue tasks immediately and reassign ownership where required.",
        action_type: "recover_overdue_tasks",
        priority: "high",
        recovery_stage: "tasks",
      })
    );
  }

  if (pending >= 8) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "task_overload",
        severity: "medium",
        title: "Task Queue Overload",
        recommendation: "Review pending task volume and close, merge, or reprioritize stale work.",
        action_type: "recover_overdue_tasks",
        priority: "medium",
        recovery_stage: "tasks",
      })
    );
  }

  if (universityPlanCount === 0 && ["not_started", "inquiry", "planning", "unknown"].includes(journey)) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "university_planning_required",
        severity: "medium",
        title: "University Planning Required",
        recommendation: "Create Dream, Target, and Safe university plan before application movement.",
        action_type: "create_task",
        priority: "medium",
        recovery_stage: "university_planning",
      })
    );
  }

  if (universityPlanCount > 0 && safeUniversityCount === 0) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "safe_university_missing",
        severity: "medium",
        title: "Safe University Missing",
        recommendation: "Add at least one safe university option to reduce admission risk.",
        action_type: "create_task",
        priority: "medium",
        recovery_stage: "university_planning",
      })
    );
  }

  if (daysInactive >= 14) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "inactive_student",
        severity: daysInactive >= 30 ? "high" : "medium",
        title: "Student Inactive",
        recommendation: "Create follow-up call, WhatsApp/email reminder, and counselor activity log.",
        action_type: "create_reminder",
        priority: daysInactive >= 30 ? "high" : "medium",
        recovery_stage: "engagement",
      })
    );
  }

  if (opportunity >= 85 && risk < 50) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "fast_track_intervention",
        severity: "executive",
        title: "Fast Track Candidate",
        recommendation: "Move student to executive acceleration workflow.",
        action_type: "schedule_call",
        priority: "executive",
        recovery_stage: "conversion",
      })
    );
  }

  if (opportunity >= 75 && ["offer_received", "offer_accepted", "cas_pending"].includes(journey)) {
    interventions.push(
      buildIntervention({
        score,
        intervention_type: "conversion_push",
        severity: "executive",
        title: "Conversion Push",
        recommendation: "Use a senior counselor touchpoint to push offer/CAS student toward next stage.",
        action_type: "schedule_call",
        priority: "executive",
        recovery_stage: "conversion",
      })
    );
  }

  return interventions;
}

export function buildInterventionSummary(scores = []) {
  const rows = asArray(scores);
  const interventions = rows.flatMap((score) =>
    buildExecutiveInterventions(score).map((intervention) => ({
      ...intervention,
      student_id: getStudentId(score),
      student_name: getStudentName(score),
      student_type: getStudentType(score),
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
  return buildInterventionSummary(scores).interventions
    .map((item) => ({
      ...item,
      urgency:
        getSeverityWeight(item.severity) * 20 +
        number(item.risk_score) * 0.5 +
        number(item.opportunity_score) * 0.25,
    }))
    .sort((a, b) => b.urgency - a.urgency);
}

export function buildInterventionRecommendationsByScore(scores = []) {
  return asArray(scores).reduce((acc, score) => {
    const studentId = getStudentId(score);
    const studentType = getStudentType(score);
    const key = `${studentId}-${studentType}`;
    const fallbackKey = `${score.id}-${score.__leadType || score.type || "inquiry"}`;

    const recommendations = buildExecutiveInterventions(score).map((intervention) =>
      mapInterventionToRecommendation(score, intervention)
    );

    if (key) acc[key] = recommendations;
    if (fallbackKey && fallbackKey !== key) acc[fallbackKey] = recommendations;

    return acc;
  }, {});
}

export function buildInterventionActionTemplates(scores = [], buildTemplateFn = null) {
  if (typeof buildTemplateFn !== "function") {
    return buildInterventionSummary(scores).interventions.map((intervention) => ({
      score: null,
      intervention,
      recommendation: {
        type: intervention.type || intervention.intervention_type,
        action: intervention.action || intervention.action_type,
        priority: intervention.priority,
        title: intervention.title,
        description: intervention.recommendation || intervention.description,
        payload: intervention.payload,
      },
      template: null,
    }));
  }

  return asArray(scores).flatMap((score) =>
    buildExecutiveInterventions(score).map((intervention) => {
      const recommendation = mapInterventionToRecommendation(score, intervention);

      return {
        score,
        intervention,
        recommendation,
        template: buildTemplateFn(score, recommendation),
      };
    })
  );
}

export function buildInterventionDashboardSnapshot(scores = []) {
  const summary = buildInterventionSummary(scores);
  const queue = buildPriorityInterventionQueue(scores);
  const recommendationsByScore = buildInterventionRecommendationsByScore(scores);

  return {
    ...summary,
    queue,
    recommendationsByScore,
    topPriority: queue.slice(0, 10),
    health:
      summary.critical > 0
        ? "critical"
        : summary.high > 0
          ? "needs_attention"
          : summary.totalInterventions > 0
            ? "monitor"
            : "healthy",
    generated_at: nowIso(),
  };
}

export default {
  buildExecutiveInterventions,
  buildInterventionSummary,
  buildPriorityInterventionQueue,
  buildInterventionRecommendationsByScore,
  buildInterventionActionTemplates,
  buildInterventionDashboardSnapshot,
};
