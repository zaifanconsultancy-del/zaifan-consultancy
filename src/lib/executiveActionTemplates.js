function getTomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function getDateAfterDays(days = 1) {
  return new Date(Date.now() + Number(days || 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Student";
}

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

function getJourneyStage(score = {}) {
  const direct = normalize(score.journey_stage || score?.diagnostics?.journey_stage);
  if (direct) return direct;

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const visaStatus = normalize(score.visa_status);

  if (applicationStatus === "enrolled") return "enrolled";
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
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      applicationStatus
    ) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      offerStatus
    )
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (["started", "draft", "in_progress"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getScoreValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
}

function mapTaskPriority(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return "critical";
  if (clean === "executive") return "high";
  if (clean === "high") return "high";
  if (clean === "medium") return "medium";
  if (clean === "low") return "low";

  return "medium";
}


const V4_RECOVERY_ACTION_TYPES = new Set([
  "recover_cas_workflow",
  "verify_cas_blocker",
  "create_cas_follow_up_task",
  "write_cas_timeline_event",
  "create_visa_tracking",
  "create_visa_checklist_tasks",
  "notify_counselor_visa_recovery",
  "reconcile_payment_records",
  "audit_receipts",
  "write_payment_timeline_event",
  "create_or_activate_portal_account",
  "activate_portal_account",
  "send_portal_access_message",
  "write_portal_timeline_event",
  "regenerate_timeline",
  "create_document_recovery_tasks",
  "draft_document_request",
  "recover_overdue_tasks",
  "create_executive_escalation",
  "assign_senior_counselor",
  "manual_recovery_review",
]);

function isV4RecoveryAction(action = "") {
  return V4_RECOVERY_ACTION_TYPES.has(normalize(action));
}

function getRecoveryStage(recommendation = {}) {
  return normalize(
    recommendation.stage ||
      recommendation.payload?.stage ||
      recommendation.payload?.target_stage ||
      recommendation.type ||
      "workflow_recovery"
  );
}

function getRecoveryTargetTable(action = "", stage = "", recommendation = {}) {
  const explicit = recommendation.target_table || recommendation.payload?.target_table;
  if (explicit) return explicit;

  const cleanAction = normalize(action);
  const cleanStage = normalize(stage);

  if (cleanAction.includes("cas") || cleanStage === "cas") return "student_applications";
  if (cleanAction.includes("visa") || cleanStage === "visa") return "student_visas";
  if (cleanAction.includes("payment") || cleanAction.includes("reconcile")) return "student_invoices";
  if (cleanAction.includes("receipt")) return "student_receipts";
  if (cleanAction.includes("portal")) return "student_portal_accounts";
  if (cleanAction.includes("timeline")) return "crm_timeline";
  if (cleanAction.includes("document") || cleanAction.includes("task")) return "student_tasks";
  if (cleanAction.includes("communication") || cleanAction.includes("message") || cleanAction.includes("notify")) {
    return "student_communications";
  }
  if (cleanAction.includes("executive") || cleanAction.includes("escalation")) return "executive_recovery_queue";

  return "executive_recovery_queue";
}

function getRecoveryTargetStatus(action = "", recommendation = {}) {
  const explicit = recommendation.target_status || recommendation.payload?.target_status;
  if (explicit) return explicit;

  const cleanAction = normalize(action);

  if (cleanAction.includes("timeline")) return "logged";
  if (cleanAction.includes("draft") || cleanAction.includes("message") || cleanAction.includes("notify")) return "draft";
  if (cleanAction.includes("activate")) return "active";
  if (cleanAction.includes("reconcile")) return "reconciliation_required";
  if (cleanAction.includes("audit")) return "audit_required";
  if (cleanAction.includes("escalation")) return "critical";
  if (cleanAction.includes("task")) return "pending";

  return "recovery_required";
}

function buildRecoveryTitle(score = {}, recommendation = {}) {
  const studentName = getStudentName(score);
  const action = normalize(recommendation.action || recommendation.recovery_action || recommendation.action_type);
  const stage = getRecoveryStage(recommendation).replace(/_/g, " ");

  if (recommendation.title || recommendation.payload?.title) {
    return recommendation.title || recommendation.payload?.title;
  }

  if (action.includes("cas")) return `CAS Recovery: ${studentName}`;
  if (action.includes("visa")) return `Visa Recovery: ${studentName}`;
  if (action.includes("payment") || action.includes("reconcile")) return `Payment Recovery: ${studentName}`;
  if (action.includes("portal")) return `Portal Recovery: ${studentName}`;
  if (action.includes("timeline")) return `Timeline Recovery: ${studentName}`;
  if (action.includes("document")) return `Document Recovery: ${studentName}`;
  if (action.includes("executive") || action.includes("escalation")) return `Executive Escalation: ${studentName}`;

  return `Workflow Recovery (${stage}): ${studentName}`;
}

function buildRecoveryDescription(score = {}, recommendation = {}) {
  const action = normalize(recommendation.action || recommendation.recovery_action || recommendation.action_type);
  const fallback = getRecommendationText(
    recommendation,
    recommendation.recommendation || recommendation.description || "Recover this broken workflow and log the result."
  );

  if (fallback) return fallback;

  if (action.includes("cas")) return "Verify CAS blocker, update application CAS status, create counselor follow-up, and log recovery timeline.";
  if (action.includes("visa")) return "Create or recover visa tracking, generate visa checklist tasks, and notify counselor.";
  if (action.includes("payment") || action.includes("reconcile")) return "Reconcile invoice, payment, and receipt records and log payment recovery.";
  if (action.includes("portal")) return "Create, activate, or recover student portal access and log the portal recovery.";
  if (action.includes("timeline")) return "Regenerate missing timeline evidence from student operational records.";
  if (action.includes("document")) return "Create document recovery tasks and draft a student document request.";
  if (action.includes("executive") || action.includes("escalation")) return "Create executive escalation with urgent recovery ownership and SLA.";

  return "Review this broken workflow and complete the required recovery action.";
}

function buildV4RecoveryTemplate(score = {}, recommendation = {}) {
  const actionType = normalize(
    recommendation.action ||
      recommendation.recovery_action ||
      recommendation.action_type ||
      recommendation.type ||
      "manual_recovery_review"
  );

  const stage = getRecoveryStage(recommendation);
  const title = buildRecoveryTitle(score, recommendation);
  const description = buildRecoveryDescription(score, recommendation);
  const base = {
    ...basePayload(score, {
      ...recommendation,
      action: actionType,
      priority: recommendation.priority || recommendation.severity || "high",
    }),
    ...(recommendation.payload || {}),
  };

  const targetTable = getRecoveryTargetTable(actionType, stage, recommendation);
  const targetStatus = getRecoveryTargetStatus(actionType, recommendation);
  const requiresApproval =
    base.approval_required === true ||
    ["critical", "executive", "urgent", "high"].includes(normalize(recommendation.priority || recommendation.severity));

  return {
    actionType,
    title,
    description,
    duplicateKey: buildDuplicateKey(score, { ...recommendation, type: recommendation.type || stage }, actionType),
    requiresApproval,
    payload: enrichPayload(base, {
      title,
      description,
      stage,
      recovery_stage: stage,
      recovery_action: actionType,
      action_type: actionType,
      issue_type: recommendation.issue_type || recommendation.type || recommendation.payload?.issue_type || "workflow_recovery",
      severity: recommendation.severity || recommendation.priority || "high",
      priority: recommendation.priority || recommendation.severity || "high",
      target_table: targetTable,
      target_status: targetStatus,
      automation_template:
        recommendation.automation_template ||
        recommendation.payload?.automation_template ||
        `${actionType}_template`,
      approval_required: requiresApproval,
      approval_reason:
        recommendation.approval_reason ||
        recommendation.payload?.approval_reason ||
        (requiresApproval ? "Workflow recovery action requires human approval before execution." : ""),
      status: "pending",
      source_issue_id: recommendation.issue_id || recommendation.id || recommendation.payload?.issue_id || null,
      source: recommendation.source || recommendation.payload?.source || "platform_verification_v4",
    }),
  };
}

function approvalRequired(recommendation = {}) {
  const priority = normalize(recommendation.priority || recommendation.severity);
  const action = normalize(recommendation.action || recommendation.recovery_action || recommendation.action_type);

  return (
    priority === "critical" ||
    priority === "executive" ||
    priority === "urgent" ||
    priority === "high" && isV4RecoveryAction(action) ||
    action === "send_email" ||
    action === "send_whatsapp" ||
    recommendation?.payload?.approval_required === true
  );
}

function getApprovalReason(recommendation = {}) {
  const priority = normalize(recommendation.priority || recommendation.severity);
  const action = normalize(recommendation.action || recommendation.recovery_action || recommendation.action_type);

  if (priority === "critical") return "Critical student risk requires human approval.";
  if (priority === "executive") return "Executive-priority action requires counselor approval.";
  if (priority === "urgent") return "Urgent recovery action requires human approval.";
  if (priority === "high" && isV4RecoveryAction(action)) return "High-priority workflow recovery requires approval.";
  if (action === "send_email") return "Email draft must be reviewed before sending.";
  if (action === "send_whatsapp") return "WhatsApp draft must be reviewed before sending.";

  return "";
}

function getDefaultDueDate(recommendation = {}) {
  const type = normalize(recommendation.type);
  const priority = normalize(recommendation.priority);

  if (priority === "critical") return getTomorrowDate();

  if (
    [
      "critical_case_review",
      "visa_rejection_review",
      "cas_issued_start_visa",
      "offer_accepted_next_steps",
      "fast_track_student",
      "application_ready",
      "visa_delay",
    ].includes(type)
  ) {
    return getTomorrowDate();
  }

  if (
    [
      "cas_pending_follow_up",
      "visa_monitoring",
      "offer_follow_up",
      "conversion_opportunity",
      "application_stalled",
    ].includes(type)
  ) {
    return getDateAfterDays(2);
  }

  return getDateAfterDays(3);
}

function buildDuplicateKey(score = {}, recommendation = {}, actionType = "") {
  return [
    score.student_id || score.id || getStudentName(score),
    score.student_type || score.__leadType || score.type || "student",
    normalize(recommendation.type || "recommendation"),
    normalize(actionType || recommendation.action || "action"),
  ].join("::");
}

function basePayload(score = {}, recommendation = {}) {
  const actionType = normalize(recommendation.action);
  const approval = approvalRequired(recommendation);
  const approvalReason = getApprovalReason(recommendation);

  return {
    student_id: String(score.student_id || score.id || ""),
    student_type: score.student_type || score.__leadType || score.type || "inquiry",
    student_name: getStudentName(score),

    risk_score: number(score.risk_score),
    opportunity_score: number(score.opportunity_score),
    risk_level: score.risk_level || "Low",
    priority_level: score.priority_level || "Standard",
    executive_category: score.executive_category || "Standard",
    summary: score.summary || "",

    journey_stage: getJourneyStage(score),
    application_status: score.application_status || "",
    offer_status: score.offer_status || "",
    visa_status: score.visa_status || "",

    document_readiness_percent: number(getScoreValue(score, "document_readiness_percent")),
    task_completion_percent: number(getScoreValue(score, "task_completion_percent")),
    pending_tasks_count: number(getScoreValue(score, "pending_tasks_count")),
    overdue_tasks_count: number(getScoreValue(score, "overdue_tasks_count")),
    university_plan_count: number(getScoreValue(score, "university_plan_count")),
    safe_university_count: number(getScoreValue(score, "safe_university_count")),
    target_university_count: number(getScoreValue(score, "target_university_count")),
    dream_university_count: number(getScoreValue(score, "dream_university_count")),
    days_since_updated: getScoreValue(score, "days_since_updated", null),

    recommendation_type: recommendation.type || "",
    recommendation_priority: recommendation.priority || "medium",

    generated_by: "executive_ai",
    generated_at: new Date().toISOString(),

    approval_required: approval,
    approval_reason: approvalReason,
    duplicate_protection_key: buildDuplicateKey(score, recommendation, actionType),
    automation_version: "v2",
    automation_source: "student_os_executive_ai",
  };
}

function getRecommendationText(recommendation = {}, fallback = "") {
  return recommendation.description || recommendation.payload?.description || fallback;
}

function buildStudentMessage(score = {}, recommendation = {}, channel = "whatsapp") {
  const studentName = getStudentName(score);
  const type = normalize(recommendation.type);
  const journeyStage = getJourneyStage(score);

  if (type === "success_story" || journeyStage === "visa_approved") {
    return `Congratulations ${studentName}! Your visa success is a major milestone. Zaifan Consultancy is proud to be part of your journey.`;
  }

  if (type === "fast_track_student") {
    return channel === "email"
      ? `Hi ${studentName},

Your profile is showing strong progress and looks ready for the next milestone. Our team would like to fast-track your next step and guide you clearly.

Best regards,
Zaifan Consultancy Team`
      : `Hi ${studentName}, your profile is showing strong progress. Let's fast-track your next study abroad milestone.`;
  }

  if (type === "application_ready") {
    return `Hi ${studentName}, your profile looks ready for application submission. Let's review your documents and university shortlist so we can move forward.`;
  }

  if (type === "conversion_opportunity") {
    return channel === "email"
      ? `Hi ${studentName},

We reviewed your profile and your case is ready to move forward. Let's complete the next step in your study abroad journey.

Best regards,
Zaifan Consultancy Team`
      : `Hi ${studentName}, your profile looks ready for the next step. Let's move your study abroad process forward.`;
  }

  if (type === "offer_follow_up" || journeyStage === "offer_received") {
    return `Hi ${studentName}, congratulations on reaching the offer stage. Let's discuss the next steps for offer acceptance, CAS, and visa preparation.`;
  }

  if (type === "offer_accepted_next_steps" || journeyStage === "offer_accepted") {
    return `Hi ${studentName}, your offer acceptance is an important step. Let's now prepare CAS, documents, and visa requirements.`;
  }

  if (type === "cas_pending_follow_up" || journeyStage === "cas_pending") {
    return `Hi ${studentName}, we are following up on your CAS progress. Please confirm any pending university, payment, or document requirements.`;
  }

  if (type === "cas_issued_start_visa" || journeyStage === "cas_issued") {
    return `Hi ${studentName}, your CAS stage is ready. Let's start your visa checklist and appointment preparation.`;
  }

  if (type === "visa_monitoring" || journeyStage === "visa_pending") {
    return `Hi ${studentName}, we are monitoring your visa progress. Please keep your documents and updates ready so we can support the next step.`;
  }

  if (type === "inactive_student") {
    return `Hi ${studentName}, this is Zaifan Consultancy. Just checking in on your study abroad process. Please let us know when you are available for the next step.`;
  }

  if (type === "document_readiness_gap") {
    return `Hi ${studentName}, we need to complete your pending documents to move your study abroad process forward. Please share the missing documents when available.`;
  }

  return channel === "email"
    ? `Hi ${studentName},

I hope you are doing well. I wanted to follow up regarding your study abroad process and the next steps.

Our team has reviewed your profile and would like to guide you on the next best action.

Best regards,
Zaifan Consultancy Team`
    : `Hi ${studentName}, this is Zaifan Consultancy. Just following up on your study abroad process. Please let us know when you are available for the next step.`;
}

function buildEmailSubject(score = {}, recommendation = {}) {
  const type = normalize(recommendation.type);
  const journeyStage = getJourneyStage(score);

  if (type === "success_story" || journeyStage === "visa_approved") {
    return "Congratulations on your visa success";
  }

  if (type === "fast_track_student") {
    return "Fast-track your next study abroad milestone";
  }

  if (type === "application_ready") {
    return "Your application is ready for next steps";
  }

  if (type === "conversion_opportunity") {
    return "Next steps for your study abroad journey";
  }

  if (type === "offer_follow_up" || journeyStage === "offer_received") {
    return "Offer received — next steps";
  }

  if (type === "offer_accepted_next_steps" || journeyStage === "offer_accepted") {
    return "Offer accepted — CAS and visa preparation";
  }

  if (type === "cas_pending_follow_up" || journeyStage === "cas_pending") {
    return "CAS follow-up and next steps";
  }

  if (type === "cas_issued_start_visa" || journeyStage === "cas_issued") {
    return "CAS issued — visa preparation";
  }

  if (type === "visa_monitoring" || journeyStage === "visa_pending") {
    return "Visa progress follow-up";
  }

  if (type === "document_readiness_gap") {
    return "Pending documents required";
  }

  return "Zaifan Consultancy Follow-Up";
}

function enrichPayload(base = {}, extra = {}) {
  return {
    ...base,
    ...extra,
    execution_status: "queued",
    queue_status: base.approval_required ? "approval_required" : "ready",
    created_from: "executive_action_template_v2",
  };
}

export function buildExecutiveActionTemplate(score = {}, recommendation = {}) {
  const studentName = getStudentName(score);
  const action = normalize(recommendation.action);
  const title =
    recommendation.title ||
    recommendation.payload?.title ||
    `Executive Action: ${studentName}`;

  const description =
    getRecommendationText(
      recommendation,
      score.summary || "Executive AI identified a student action."
    );

  const base = {
    ...basePayload(score, recommendation),
    ...(recommendation.payload || {}),
  };

  if (action === "create_task") {
    return {
      actionType: "create_task",
      title,
      description,
      duplicateKey: buildDuplicateKey(score, recommendation, "create_task"),
      requiresApproval: base.approval_required,
      payload: enrichPayload(base, {
        title,
        description,
        priority: mapTaskPriority(recommendation.priority),
        status: "pending",
        due_date: recommendation.payload?.due_date || getDefaultDueDate(recommendation),
      }),
    };
  }

  if (action === "schedule_call") {
    const callTitle = recommendation.title || `Schedule Call: ${studentName}`;

    return {
      actionType: "schedule_call",
      title: callTitle,
      description,
      duplicateKey: buildDuplicateKey(score, recommendation, "schedule_call"),
      requiresApproval: base.approval_required,
      payload: enrichPayload(base, {
        title: callTitle,
        description:
          description || "High opportunity student. Schedule a counselor conversion call.",
        priority: "high",
        status: "pending",
        due_date: recommendation.payload?.due_date || getDefaultDueDate(recommendation),
      }),
    };
  }

  if (action === "create_reminder") {
    const reminderTitle = recommendation.title || `Executive Follow-Up: ${studentName}`;

    return {
      actionType: "create_reminder",
      title: reminderTitle,
      description,
      duplicateKey: buildDuplicateKey(score, recommendation, "create_reminder"),
      requiresApproval: base.approval_required,
      payload: enrichPayload(base, {
        title: reminderTitle,
        notes:
          recommendation.payload?.notes ||
          description ||
          score.summary ||
          "Executive AI recommends follow-up for this student.",
        due_date: recommendation.payload?.due_date || getDefaultDueDate(recommendation),
        due_time: recommendation.payload?.due_time || null,
        status: "pending",
      }),
    };
  }

  if (action === "send_email") {
    return {
      actionType: "send_email",
      title: `Email Draft: ${studentName}`,
      description: "Prepare an email draft for this student.",
      duplicateKey: buildDuplicateKey(score, recommendation, "send_email"),
      requiresApproval: true,
      payload: enrichPayload(base, {
        channel: "email",
        subject: recommendation.payload?.subject || buildEmailSubject(score, recommendation),
        message:
          recommendation.payload?.message ||
          buildStudentMessage(score, recommendation, "email"),
        status: "draft",
        approval_required: true,
        approval_reason: base.approval_reason || "Email draft requires human review.",
      }),
    };
  }

  if (action === "send_whatsapp") {
    return {
      actionType: "send_whatsapp",
      title: `WhatsApp Draft: ${studentName}`,
      description: "Prepare a WhatsApp draft for this student.",
      duplicateKey: buildDuplicateKey(score, recommendation, "send_whatsapp"),
      requiresApproval: true,
      payload: enrichPayload(base, {
        channel: "whatsapp",
        message:
          recommendation.payload?.message ||
          buildStudentMessage(score, recommendation, "whatsapp"),
        status: "draft",
        approval_required: true,
        approval_reason: base.approval_reason || "WhatsApp draft requires human review.",
      }),
    };
  }

  if (isV4RecoveryAction(action)) {
    return buildV4RecoveryTemplate(score, recommendation);
  }

  return {
    actionType: "monitor",
    title: `Monitor ${studentName}`,
    description: "No direct CRM action required.",
    duplicateKey: buildDuplicateKey(score, recommendation, "monitor"),
    requiresApproval: false,
    payload: enrichPayload(base, {
      status: "monitor",
    }),
  };
}

export function buildExecutiveActionTemplates(scores = [], recommendationsByScore = {}) {
  return (scores || []).flatMap((score) => {
    const directKey = `${score.student_id}-${score.student_type}`;
    const fallbackKey = `${score.id}-${score.__leadType || score.type || "inquiry"}`;
    const recommendations =
      recommendationsByScore[directKey] ||
      recommendationsByScore[fallbackKey] ||
      [];

    return recommendations.map((recommendation) => ({
      score,
      recommendation,
      template: buildExecutiveActionTemplate(score, recommendation),
    }));
  });
}

export function buildExecutiveActionTemplateSummary(scores = [], recommendationsByScore = {}) {
  const templates = buildExecutiveActionTemplates(scores, recommendationsByScore);

  return {
    total_templates: templates.length,
    approval_required: templates.filter((item) => item.template.requiresApproval).length,
    ready: templates.filter((item) => !item.template.requiresApproval).length,
    tasks: templates.filter((item) => normalize(item.template.actionType) === "create_task").length,
    reminders: templates.filter((item) => normalize(item.template.actionType) === "create_reminder").length,
    calls: templates.filter((item) => normalize(item.template.actionType) === "schedule_call").length,
    emails: templates.filter((item) => normalize(item.template.actionType) === "send_email").length,
    whatsapp: templates.filter((item) => normalize(item.template.actionType) === "send_whatsapp").length,
    templates,
  };
}