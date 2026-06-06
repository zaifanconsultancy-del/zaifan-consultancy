import { supabase } from "./supabaseClient";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value = "") {
  return String(value || "").toLowerCase().trim();
}

function normalizeStatus(value = "") {
  return normalizeText(value)
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getStudentName(student = {}) {
  return (
    student.full_name ||
    student.name ||
    student.student_name ||
    student.studentName ||
    "Unknown Student"
  );
}

function getStudentType(student = {}) {
  return student.student_type || student.__leadType || student.type || "inquiry";
}

function getDaysSince(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getDocumentReadiness(student = {}) {
  const documents = Array.isArray(student.documents) ? student.documents : [];

  if (!documents.length) {
    return {
      percent: 0,
      completed: 0,
      total: 0,
      status: "documents_pending",
      health: "missing",
    };
  }

  const completed = documents.filter((doc) => {
    const status = normalizeStatus(doc.status || doc.document_status);
    return ["completed", "approved", "uploaded", "verified", "received"].includes(status);
  }).length;

  const percent = Math.round((completed / documents.length) * 100);

  return {
    percent,
    completed,
    total: documents.length,
    status:
      percent >= 90
        ? "documents_completed"
        : percent > 0
        ? "documents_partial"
        : "documents_pending",
    health:
      percent >= 90
        ? "strong"
        : percent >= 60
        ? "good"
        : percent >= 30
        ? "weak"
        : "critical",
  };
}

function getTaskHealth(student = {}) {
  const tasks = Array.isArray(student.tasks) ? student.tasks : [];
  const pendingTasks = number(student.pending_tasks_count);
  const overdueTasks = number(student.overdue_tasks_count);

  if (!tasks.length) {
    return {
      total: number(student.task_count),
      pending: pendingTasks,
      overdue: overdueTasks,
      completed: 0,
      completionPercent: 0,
      health: overdueTasks > 0 ? "critical" : pendingTasks > 0 ? "weak" : "empty",
    };
  }

  const completed = tasks.filter((task) => {
    const status = normalizeStatus(task.status);
    return ["completed", "done", "closed"].includes(status);
  }).length;

  const completionPercent = Math.round((completed / tasks.length) * 100);

  return {
    total: tasks.length,
    pending: pendingTasks,
    overdue: overdueTasks,
    completed,
    completionPercent,
    health:
      overdueTasks > 0
        ? "critical"
        : pendingTasks > 5
        ? "weak"
        : completionPercent >= 75
        ? "strong"
        : completionPercent >= 40
        ? "good"
        : "weak",
  };
}

function getUniversityHealth(student = {}) {
  const dream = number(student.dream_university_count ?? student.dream_universities_count);
  const target = number(student.target_university_count ?? student.target_universities_count);
  const safe = number(student.safe_university_count ?? student.safe_universities_count);
  const total = number(student.university_plan_count || dream + target + safe);

  const hasPlan = student.has_university_plan === true || total > 0;
  const balanced = dream > 0 && target > 0 && safe > 0;

  return {
    dream,
    target,
    safe,
    total,
    hasPlan,
    balanced,
    health: !hasPlan ? "missing" : balanced ? "strong" : safe === 0 ? "risky" : "partial",
  };
}

function getApplicationHealth({ applicationStatus, offerStatus, applicationCount }) {
  const startedStatuses = [
    "started",
    "in_progress",
    "draft",
    "documents_pending",
    "docs_pending",
    "applied",
    "submitted",
    "under_review",
    "review",
    "processing",
    "offer_received",
    "offer",
    "conditional_offer",
    "unconditional_offer",
    "offer_accepted",
    "accepted",
    "confirmed",
    "cas_pending",
    "cas_issued",
    "enrolled",
  ];

  const submittedStatuses = ["applied", "submitted", "under_review", "review", "processing"];
  const offerReceivedStatuses = [
    "offer_received",
    "offer",
    "received",
    "conditional_offer",
    "unconditional_offer",
  ];
  const offerAcceptedStatuses = ["offer_accepted", "accepted", "confirmed"];

  const started = startedStatuses.includes(applicationStatus) || applicationCount > 0;
  const submitted = submittedStatuses.includes(applicationStatus);
  const offerReceived =
    offerReceivedStatuses.includes(applicationStatus) ||
    offerReceivedStatuses.includes(offerStatus);
  const offerAccepted =
    offerAcceptedStatuses.includes(applicationStatus) ||
    offerAcceptedStatuses.includes(offerStatus);

  const casPending = applicationStatus === "cas_pending";
  const casIssued = applicationStatus === "cas_issued";
  const enrolled = applicationStatus === "enrolled";

  return {
    hasApplication: applicationCount > 0 || started,
    started,
    submitted,
    offerReceived,
    offerAccepted,
    casPending,
    casIssued,
    enrolled,
    health: enrolled
      ? "success"
      : !started
      ? "not_started"
      : offerAccepted || casIssued
      ? "conversion_ready"
      : offerReceived
      ? "strong"
      : submitted
      ? "active"
      : "started",
  };
}

function getVisaHealth({ visaStatus, applicationHealth }) {
  const pending = [
    "pending",
    "visa_pending",
    "submitted",
    "under_review",
    "review",
    "processing",
  ].includes(visaStatus);

  const approved = ["visa_approved", "approved"].includes(visaStatus);
  const rejected = ["rejected", "visa_rejected", "refused", "visa_refused"].includes(visaStatus);

  const needed =
    applicationHealth.offerAccepted ||
    applicationHealth.casPending ||
    applicationHealth.casIssued ||
    pending ||
    approved ||
    rejected;

  return {
    needed,
    pending,
    approved,
    rejected,
    health: approved
      ? "approved"
      : rejected
      ? "rejected"
      : pending
      ? "pending"
      : needed
      ? "not_started"
      : "not_required_yet",
  };
}

function getJourneyStage({
  applicationStatus,
  offerStatus,
  visaStatus,
  applicationHealth,
  visaHealth,
}) {
  if (applicationHealth.enrolled || applicationStatus === "enrolled") return "enrolled";

  if (visaHealth.approved) return "visa_approved";
  if (visaHealth.rejected) return "visa_rejected";
  if (visaHealth.pending) return "visa_pending";

  if (applicationHealth.casIssued) return "cas_issued";
  if (applicationHealth.casPending) return "cas_pending";

  if (applicationHealth.offerAccepted) return "offer_accepted";
  if (applicationHealth.offerReceived) return "offer_received";

  if (offerStatus === "rejected") return "offer_rejected";

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (applicationHealth.submitted) return "application_submitted";
  if (applicationHealth.started) return "application_started";

  return "not_started";
}

function getExecutiveCategory({
  finalRiskScore,
  finalOpportunityScore,
  applicationStatus,
  offerStatus,
  visaStatus,
  journeyStage,
  documentReadiness,
  taskHealth,
  universityHealth,
}) {
  if (journeyStage === "visa_rejected") return "Critical Risk";
  if (visaStatus === "rejected" || visaStatus === "visa_rejected") return "Critical Risk";
  if (offerStatus === "rejected") return "Needs Attention";
  if (finalRiskScore >= 85) return "Critical Risk";

  if (journeyStage === "visa_approved" || journeyStage === "enrolled") return "Success Story";
  if (applicationStatus === "enrolled") return "Success Story";

  if (
    journeyStage === "offer_accepted" ||
    journeyStage === "cas_pending" ||
    journeyStage === "cas_issued" ||
    journeyStage === "visa_pending"
  ) {
    return "Conversion Ready";
  }

  if (
    ["not_started", "application_started"].includes(journeyStage) &&
    documentReadiness?.percent >= 80 &&
    taskHealth?.completionPercent >= 60 &&
    universityHealth?.total >= 3 &&
    finalRiskScore < 65
  ) {
    return "Application Ready";
  }

  if (finalOpportunityScore >= 80) return "High Opportunity";
  if (finalRiskScore >= 65) return "High Risk";
  if (finalRiskScore >= 35) return "Needs Attention";

  return "Standard";
}

function getAutomationSignals({
  journeyStage,
  documentReadiness,
  taskHealth,
  universityHealth,
  finalRiskScore,
  finalOpportunityScore,
  daysSinceUpdated,
}) {
  const automationActions = [];

  if (finalRiskScore >= 85 || journeyStage === "visa_rejected") {
    automationActions.push("critical_case_review");
  }

  if (journeyStage === "not_started") {
    automationActions.push("application_not_started");
  }

  if (documentReadiness.percent < 60) {
    automationActions.push("document_readiness_gap");
  }

  if (taskHealth.overdue > 0 || taskHealth.pending > 5) {
    automationActions.push("task_recovery");
  }

  if (!universityHealth.hasPlan) {
    automationActions.push("missing_university_plan");
  } else if (universityHealth.safe === 0) {
    automationActions.push("missing_safe_university");
  }

  if (["offer_received", "offer_accepted", "cas_pending", "cas_issued"].includes(journeyStage)) {
    automationActions.push("conversion_follow_up");
  }

  if (["cas_issued", "visa_pending", "visa_rejected"].includes(journeyStage)) {
    automationActions.push("visa_workflow");
  }

  if (finalOpportunityScore >= 80 && finalRiskScore < 50) {
    automationActions.push("fast_track");
  }

  if (daysSinceUpdated !== null && daysSinceUpdated >= 10) {
    automationActions.push("stale_student_follow_up");
  }

  return {
    automation_candidate: automationActions.length > 0,
    automation_actions: automationActions,
    automation_action_count: automationActions.length,
    automation_pressure:
      automationActions.length >= 5
        ? "heavy"
        : automationActions.length >= 3
        ? "medium"
        : automationActions.length > 0
        ? "light"
        : "none",
    approval_likely:
      finalRiskScore >= 65 ||
      finalOpportunityScore >= 80 ||
      ["offer_accepted", "cas_pending", "cas_issued", "visa_pending", "visa_rejected"].includes(
        journeyStage
      ),
  };
}

export function calculateExecutiveRisk(student = {}) {
  let riskScore = 0;
  let opportunityScore = 0;

  const riskReasons = [];
  const opportunityReasons = [];

  const applicationStatus = normalizeStatus(student.application_status);
  const offerStatus = normalizeStatus(student.offer_status);
  const visaStatus = normalizeStatus(student.visa_status);

  const applicationCount = number(student.application_count);

  const documentReadiness = getDocumentReadiness(student);
  const taskHealth = getTaskHealth(student);
  const universityHealth = getUniversityHealth(student);
  const applicationHealth = getApplicationHealth({
    applicationStatus,
    offerStatus,
    applicationCount,
  });
  const visaHealth = getVisaHealth({ visaStatus, applicationHealth });

  const journeyStage = getJourneyStage({
    applicationStatus,
    offerStatus,
    visaStatus,
    applicationHealth,
    visaHealth,
  });

  const daysSinceCreated = getDaysSince(student.created_at);
  const daysSinceUpdated = getDaysSince(
    student.updated_at ||
      student.last_updated_at ||
      student.gpt_analyzed_at ||
      student.created_at
  );

  if (!applicationHealth.started) {
    riskScore += 15;
    riskReasons.push("No application started");
  }

  if (applicationHealth.started && !applicationHealth.submitted && daysSinceCreated >= 14) {
    riskScore += 8;
    riskReasons.push("Application started but not submitted");
  }

  if (applicationHealth.submitted) {
    opportunityScore += 25;
    opportunityReasons.push("Application submitted");
  }

  if (journeyStage === "application_under_review") {
    opportunityScore += 35;
    opportunityReasons.push("Application under review");
  }

  if (applicationHealth.offerReceived) {
    opportunityScore += 55;
    opportunityReasons.push("Offer received");
  }

  if (applicationHealth.offerAccepted) {
    opportunityScore += 75;
    opportunityReasons.push("Offer accepted");
  }

  if (applicationHealth.casPending) {
    riskScore += 8;
    opportunityScore += 55;
    riskReasons.push("CAS pending");
    opportunityReasons.push("Student is close to visa stage");
  }

  if (applicationHealth.casIssued) {
    opportunityScore += 70;
    opportunityReasons.push("CAS issued");
  }

  if (applicationHealth.enrolled || journeyStage === "enrolled") {
    opportunityScore += 100;
    opportunityReasons.push("Student enrolled");
  }

  if (offerStatus === "rejected") {
    riskScore += 35;
    riskReasons.push("Offer rejected");
  }

  if (visaHealth.approved) {
    opportunityScore += 95;
    opportunityReasons.push("Visa approved");
  }

  if (visaHealth.pending) {
    riskScore += 8;
    opportunityScore += 35;
    riskReasons.push("Visa pending");
    opportunityReasons.push("Visa case in progress");
  }

  if (visaHealth.rejected) {
    riskScore += 55;
    riskReasons.push("Visa rejected");
  }

  if (applicationHealth.offerAccepted && !visaHealth.approved && !visaHealth.pending) {
    riskScore += 10;
    opportunityScore += 20;
    riskReasons.push("Visa not started after accepted offer");
    opportunityReasons.push("Conversion-ready visa case");
  }

  if (documentReadiness.total === 0) {
    riskScore += 10;
    riskReasons.push("No documents uploaded");
  } else if (documentReadiness.percent < 40) {
    riskScore += 14;
    riskReasons.push(`Low document readiness (${documentReadiness.percent}%)`);
  } else if (documentReadiness.percent < 80) {
    riskScore += 8;
    riskReasons.push(`Partial document readiness (${documentReadiness.percent}%)`);
  } else {
    opportunityScore += 15;
    opportunityReasons.push(`Strong document readiness (${documentReadiness.percent}%)`);
  }

  if (!universityHealth.hasPlan) {
    riskScore += 10;
    riskReasons.push("No university plan");
  } else if (!universityHealth.balanced) {
    riskScore += 6;
    riskReasons.push("University plan is not balanced");
  } else {
    opportunityScore += 18;
    opportunityReasons.push("Balanced university strategy");
  }

  if (universityHealth.hasPlan && universityHealth.safe === 0) {
    riskScore += 8;
    riskReasons.push("No safe university option");
  }

  if (universityHealth.total >= 3) {
    opportunityScore += 8;
    opportunityReasons.push(`${universityHealth.total} universities planned`);
  }

  if (taskHealth.overdue > 0) {
    riskScore += Math.min(30, taskHealth.overdue * 8);
    riskReasons.push(`${taskHealth.overdue} overdue task(s)`);
  }

  if (taskHealth.pending > 5) {
    riskScore += 12;
    riskReasons.push(`${taskHealth.pending} pending task(s)`);
  } else if (taskHealth.pending > 2) {
    riskScore += 6;
    riskReasons.push(`${taskHealth.pending} pending task(s)`);
  }

  if (taskHealth.total > 0 && taskHealth.completionPercent >= 75) {
    opportunityScore += 10;
    opportunityReasons.push(`Strong task completion (${taskHealth.completionPercent}%)`);
  }

  if (
    ["not_started", "application_started"].includes(journeyStage) &&
    documentReadiness.percent >= 80 &&
    taskHealth.completionPercent >= 60 &&
    universityHealth.total >= 3
  ) {
    opportunityScore += 20;
    opportunityReasons.push("Application-ready profile");
  }

  if (daysSinceUpdated !== null && daysSinceUpdated >= 21) {
    riskScore += 16;
    riskReasons.push(`No recent activity for ${daysSinceUpdated} days`);
  } else if (daysSinceUpdated !== null && daysSinceUpdated >= 10) {
    riskScore += 8;
    riskReasons.push(`Low recent activity (${daysSinceUpdated} days)`);
  }

  if (daysSinceCreated !== null && daysSinceCreated <= 7 && opportunityScore > riskScore) {
    opportunityScore += 6;
    opportunityReasons.push("Fresh active student profile");
  }

  const finalRiskScore = clampScore(riskScore);
  const finalOpportunityScore = clampScore(opportunityScore);

  let riskLevel = "Low";
  if (finalRiskScore >= 85) riskLevel = "Critical";
  else if (finalRiskScore >= 65) riskLevel = "High";
  else if (finalRiskScore >= 35) riskLevel = "Medium";

  let priorityLevel = "Standard";
  if (finalRiskScore >= 85 || finalOpportunityScore >= 85) {
    priorityLevel = "Executive";
  } else if (finalRiskScore >= 65 || finalOpportunityScore >= 65) {
    priorityLevel = "High";
  } else if (finalRiskScore >= 35 || finalOpportunityScore >= 45) {
    priorityLevel = "Medium";
  }

  const executiveCategory = getExecutiveCategory({
    finalRiskScore,
    finalOpportunityScore,
    applicationStatus,
    offerStatus,
    visaStatus,
    journeyStage,
    documentReadiness,
    taskHealth,
    universityHealth,
  });

  const automation = getAutomationSignals({
    journeyStage,
    documentReadiness,
    taskHealth,
    universityHealth,
    finalRiskScore,
    finalOpportunityScore,
    daysSinceUpdated,
  });

  return {
    student_id: String(student.id),
    student_type: getStudentType(student),
    student_name: getStudentName(student),

    risk_score: finalRiskScore,
    risk_level: riskLevel,
    opportunity_score: finalOpportunityScore,
    priority_level: priorityLevel,
    executive_category: executiveCategory,

    journey_stage: journeyStage,

    application_status: applicationStatus || "not_started",
    offer_status: offerStatus || "",
    visa_status: visaStatus || "",
    document_status: documentReadiness.status,

    summary:
      riskReasons.length || opportunityReasons.length
        ? [...riskReasons, ...opportunityReasons].join(", ")
        : "Student currently has no major executive risk or opportunity signal.",

    risk_reasons: riskReasons,
    opportunity_reasons: opportunityReasons,

    diagnostics: {
      journey_stage: journeyStage,

      application_health: applicationHealth.health,
      application_started: applicationHealth.started,
      application_submitted: applicationHealth.submitted,
      offer_received: applicationHealth.offerReceived,
      offer_accepted: applicationHealth.offerAccepted,
      cas_pending: applicationHealth.casPending,
      cas_issued: applicationHealth.casIssued,

      visa_health: visaHealth.health,
      visa_needed: visaHealth.needed,
      visa_pending: visaHealth.pending,
      visa_approved: visaHealth.approved,
      visa_rejected: visaHealth.rejected,

      document_health: documentReadiness.health,
      document_readiness_percent: documentReadiness.percent,
      document_completed_count: documentReadiness.completed,
      document_total_count: documentReadiness.total,

      task_health: taskHealth.health,
      task_completion_percent: taskHealth.completionPercent,
      pending_tasks_count: taskHealth.pending,
      overdue_tasks_count: taskHealth.overdue,

      university_health: universityHealth.health,
      university_plan_count: universityHealth.total,
      has_balanced_university_plan: universityHealth.balanced,
      safe_university_count: universityHealth.safe,
      target_university_count: universityHealth.target,
      dream_university_count: universityHealth.dream,

      days_since_updated: daysSinceUpdated,

      ...automation,
    },

    automation_candidate: automation.automation_candidate,
    automation_actions: automation.automation_actions,
    automation_action_count: automation.automation_action_count,
    automation_pressure: automation.automation_pressure,
    approval_likely: automation.approval_likely,

    generated_at: new Date().toISOString(),
  };
}

export function calculatePortfolioHealth(students = []) {
  const scored = students.map((student) => ({
    student,
    executive: calculateExecutiveRisk(student),
  }));

  const total = scored.length;
  const countBy = (fn) => scored.filter(fn).length;

  const critical = countBy((item) => item.executive.risk_level === "Critical");
  const high = countBy((item) => item.executive.risk_level === "High");
  const medium = countBy((item) => item.executive.risk_level === "Medium");

  const executivePriority = countBy((item) => item.executive.priority_level === "Executive");
  const conversionReady = countBy((item) => item.executive.executive_category === "Conversion Ready");
  const successStories = countBy((item) => item.executive.executive_category === "Success Story");
  const highOpportunity = countBy((item) => item.executive.executive_category === "High Opportunity");
  const applicationReady = countBy((item) => item.executive.executive_category === "Application Ready");

  const automationCandidates = countBy((item) => item.executive.automation_candidate);
  const approvalLikely = countBy((item) => item.executive.approval_likely);
  const heavyAutomation = countBy((item) => item.executive.automation_pressure === "heavy");
  const mediumAutomation = countBy((item) => item.executive.automation_pressure === "medium");

  const applicationHealth = {
    notStarted: countBy((item) => item.executive.diagnostics.application_health === "not_started"),
    started: countBy((item) => item.executive.diagnostics.application_started),
    submitted: countBy((item) => item.executive.diagnostics.application_submitted),
    offerReceived: countBy((item) => item.executive.diagnostics.offer_received),
    offerAccepted: countBy((item) => item.executive.diagnostics.offer_accepted),
    casPending: countBy((item) => item.executive.diagnostics.cas_pending),
    casIssued: countBy((item) => item.executive.diagnostics.cas_issued),
  };

  const visaHealth = {
    needed: countBy((item) => item.executive.diagnostics.visa_needed),
    pending: countBy((item) => item.executive.diagnostics.visa_pending),
    approved: countBy((item) => item.executive.diagnostics.visa_approved),
    rejected: countBy((item) => item.executive.diagnostics.visa_rejected),
  };

  const documentHealth = {
    strong: countBy((item) => item.executive.diagnostics.document_health === "strong"),
    good: countBy((item) => item.executive.diagnostics.document_health === "good"),
    weak: countBy((item) => item.executive.diagnostics.document_health === "weak"),
    critical: countBy((item) => item.executive.diagnostics.document_health === "critical"),
    missing: countBy((item) => item.executive.diagnostics.document_health === "missing"),
  };

  const universityHealth = {
    strong: countBy((item) => item.executive.diagnostics.university_health === "strong"),
    partial: countBy((item) => item.executive.diagnostics.university_health === "partial"),
    risky: countBy((item) => item.executive.diagnostics.university_health === "risky"),
    missing: countBy((item) => item.executive.diagnostics.university_health === "missing"),
  };

  const taskHealth = {
    strong: countBy((item) => item.executive.diagnostics.task_health === "strong"),
    good: countBy((item) => item.executive.diagnostics.task_health === "good"),
    weak: countBy((item) => item.executive.diagnostics.task_health === "weak"),
    critical: countBy((item) => item.executive.diagnostics.task_health === "critical"),
    empty: countBy((item) => item.executive.diagnostics.task_health === "empty"),
  };

  const averageRisk = total
    ? Math.round(scored.reduce((sum, item) => sum + item.executive.risk_score, 0) / total)
    : 0;

  const averageOpportunity = total
    ? Math.round(scored.reduce((sum, item) => sum + item.executive.opportunity_score, 0) / total)
    : 0;

  return {
    total,
    critical,
    high,
    medium,
    executivePriority,
    conversionReady,
    successStories,
    highOpportunity,
    applicationReady,
    averageRisk,
    averageOpportunity,

    automationCandidates,
    approvalLikely,
    heavyAutomation,
    mediumAutomation,

    applicationHealth,
    visaHealth,
    documentHealth,
    universityHealth,
    taskHealth,

    rankedByRisk: [...scored].sort((a, b) => b.executive.risk_score - a.executive.risk_score),
    rankedByOpportunity: [...scored].sort(
      (a, b) => b.executive.opportunity_score - a.executive.opportunity_score
    ),
    rankedByAutomationPressure: [...scored].sort(
      (a, b) => b.executive.automation_action_count - a.executive.automation_action_count
    ),
    rankedByApplicationHealth: [...scored].sort(
      (a, b) =>
        b.executive.diagnostics.document_readiness_percent +
        b.executive.diagnostics.task_completion_percent +
        b.executive.diagnostics.university_plan_count -
        (a.executive.diagnostics.document_readiness_percent +
          a.executive.diagnostics.task_completion_percent +
          a.executive.diagnostics.university_plan_count)
    ),
    rankedByVisaHealth: [...scored].sort((a, b) => {
      const rank = {
        visa_rejected: 5,
        visa_pending: 4,
        cas_issued: 3,
        cas_pending: 2,
        offer_accepted: 1,
      };

      return (rank[b.executive.journey_stage] || 0) - (rank[a.executive.journey_stage] || 0);
    }),
  };
}

function buildExecutiveRiskPayload(executive = {}, includeRichDiagnostics = true) {
  const payload = {
    student_id: executive.student_id,
    student_type: executive.student_type,
    student_name: executive.student_name,

    risk_score: executive.risk_score,
    risk_level: executive.risk_level,
    opportunity_score: executive.opportunity_score,
    priority_level: executive.priority_level,
    executive_category: executive.executive_category,

    application_status: executive.application_status,
    offer_status: executive.offer_status,
    visa_status: executive.visa_status,
    document_status: executive.document_status,

    summary: executive.summary,
    generated_at: executive.generated_at,

    document_readiness_percent: executive.diagnostics?.document_readiness_percent || 0,
    task_completion_percent: executive.diagnostics?.task_completion_percent || 0,
    pending_tasks_count: executive.diagnostics?.pending_tasks_count || 0,
    overdue_tasks_count: executive.diagnostics?.overdue_tasks_count || 0,
    university_plan_count: executive.diagnostics?.university_plan_count || 0,
    has_balanced_university_plan:
      executive.diagnostics?.has_balanced_university_plan || false,
    days_since_updated: executive.diagnostics?.days_since_updated ?? null,
  };

  if (!includeRichDiagnostics) return payload;

  return {
    ...payload,

    journey_stage: executive.diagnostics?.journey_stage || executive.journey_stage || "not_started",
    application_health: executive.diagnostics?.application_health || "",
    visa_health: executive.diagnostics?.visa_health || "",
    document_health: executive.diagnostics?.document_health || "",
    task_health: executive.diagnostics?.task_health || "",
    university_health: executive.diagnostics?.university_health || "",

    safe_university_count: executive.diagnostics?.safe_university_count || 0,
    target_university_count: executive.diagnostics?.target_university_count || 0,
    dream_university_count: executive.diagnostics?.dream_university_count || 0,

    automation_candidate: executive.automation_candidate || false,
    automation_action_count: executive.automation_action_count || 0,
    automation_pressure: executive.automation_pressure || "none",
    approval_likely: executive.approval_likely || false,
  };
}

async function upsertExecutiveRiskPayload(payload) {
  return await supabase
    .from("ai_student_risk_scores")
    .upsert(payload, {
      onConflict: "student_id,student_type",
    })
    .select()
    .single();
}

export async function saveExecutiveRiskScore(student = {}) {
  if (!student?.id) {
    return { data: null, error: new Error("Missing student id") };
  }

  const executive = calculateExecutiveRisk(student);

  let payload = buildExecutiveRiskPayload(executive, true);
  let { data, error } = await upsertExecutiveRiskPayload(payload);

  if (error) {
    console.warn(
      "Executive rich diagnostics save failed. Retrying with safe base payload:",
      error
    );

    payload = buildExecutiveRiskPayload(executive, false);
    const retry = await upsertExecutiveRiskPayload(payload);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("Executive risk score save failed:", error);
  }

  return { data, error, executive };
}

export async function generateExecutivePortfolio(students = []) {
  const portfolio = calculatePortfolioHealth(students);

  for (const student of students) {
    await saveExecutiveRiskScore(student);
  }

  return portfolio;
}

export async function fetchExecutiveRiskScores() {
  const { data, error } = await supabase
    .from("ai_student_risk_scores")
    .select("*")
    .order("risk_score", { ascending: false });

  if (error) {
    console.error("Executive risk scores fetch failed:", error);
  }

  return { data: data || [], error };
}

export function buildExecutiveAutomationPortfolio(students = []) {
  const portfolio = calculatePortfolioHealth(students);

  return {
    total: portfolio.total,
    automationCandidates: portfolio.automationCandidates,
    approvalLikely: portfolio.approvalLikely,
    heavyAutomation: portfolio.heavyAutomation,
    mediumAutomation: portfolio.mediumAutomation,
    automationCoverage: portfolio.total
      ? Math.round((portfolio.automationCandidates / portfolio.total) * 100)
      : 0,
    rankedByAutomationPressure: portfolio.rankedByAutomationPressure,
  };
}