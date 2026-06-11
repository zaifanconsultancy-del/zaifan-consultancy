function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function text(value = "", fallback = "") {
  const safe = value === null || value === undefined ? fallback : value;
  return String(safe || fallback || "").trim();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function getStudentId(row = {}) {
  return (
    row.student_id ||
    row.studentId ||
    row.inquiry_id ||
    row.inquiryId ||
    row.appointment_id ||
    row.appointmentId ||
    row.id ||
    null
  );
}

function getStudentName(row = {}) {
  return (
    row.student_name ||
    row.studentName ||
    row.name ||
    row.full_name ||
    row.fullName ||
    row?.student?.name ||
    "Unknown Student"
  );
}

function getStudentType(row = {}) {
  return normalize(
    row.student_type ||
      row.studentType ||
      row.source_type ||
      row.sourceType ||
      row.record_type ||
      row.recordType ||
      "inquiry"
  );
}

function getJourneyStage(row = {}) {
  return normalize(
    row.journey_stage ||
      row.journeyStage ||
      row.stage ||
      row.status ||
      row?.diagnostics?.journey_stage ||
      row?.verification?.journey_stage ||
      ""
  );
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

function sortBySeverity(items = []) {
  return [...asArray(items)].sort((a, b) => {
    const severityDelta =
      getSeverityWeight(b.severity) - getSeverityWeight(a.severity);

    if (severityDelta !== 0) return severityDelta;

    return number(b.priority_score) - number(a.priority_score);
  });
}

function createWorkflowIssue({
  student,
  stage,
  issue_type,
  severity = "medium",
  title,
  description,
  recommendation,
  recovery_type,
  recovery_action,
  blocking = false,
  source = "executive_automation_engine",
  metadata = {},
}) {
  const studentId = getStudentId(student);

  return {
    id: [
      "wf",
      stage,
      issue_type,
      studentId || "unknown",
      Date.now(),
      Math.random().toString(36).slice(2, 7),
    ].join("_"),
    student_id: studentId,
    student_type: getStudentType(student),
    student_name: getStudentName(student),
    stage: normalize(stage),
    issue_type: normalize(issue_type),
    severity: normalize(severity),
    title: text(title, "Workflow Issue"),
    description: text(description, "Workflow issue detected."),
    recommendation: text(recommendation, "Review and recover this workflow."),
    recovery_type: normalize(recovery_type || issue_type),
    recovery_action: normalize(recovery_action || recovery_type || issue_type),
    blocking: bool(blocking),
    source,
    priority_score:
      getSeverityWeight(severity) * 20 + (blocking ? 15 : 0),
    created_at: nowIso(),
    metadata,
  };
}

function createRecoveryAction({
  issue,
  action_type,
  title,
  description,
  target_table = null,
  target_status = null,
  automation_template = null,
  requires_approval = true,
  payload = {},
}) {
  return {
    id: [
      "recovery",
      issue?.stage || "workflow",
      action_type || issue?.recovery_action || "action",
      issue?.student_id || "unknown",
      Math.random().toString(36).slice(2, 8),
    ].join("_"),
    student_id: issue?.student_id || null,
    student_type: issue?.student_type || "inquiry",
    student_name: issue?.student_name || "Unknown Student",
    stage: issue?.stage || "unknown",
    issue_type: issue?.issue_type || "unknown",
    severity: issue?.severity || "medium",
    action_type: normalize(action_type || issue?.recovery_action),
    title: text(title, issue?.title || "Recovery Action"),
    description: text(description, issue?.recommendation || ""),
    target_table,
    target_status,
    automation_template,
    requires_approval: bool(requires_approval, true),
    status: "pending",
    approval_status: requires_approval ? "pending" : "auto_approved",
    priority_score: number(issue?.priority_score),
    created_at: nowIso(),
    payload: {
      issue_id: issue?.id || null,
      ...payload,
    },
  };
}

export function buildExecutiveInterventions(score = {}) {
  const interventions = [];

  const risk = number(score.risk_score);
  const opportunity = number(score.opportunity_score);

  const journey =
    normalize(score.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage);

  const overdue =
    number(score.overdue_tasks_count) ||
    number(score?.diagnostics?.overdue_tasks_count);

  const documentReadiness =
    number(score.document_readiness_percent) ||
    number(score?.diagnostics?.document_readiness_percent);

  const daysInactive =
    number(score.days_since_updated) ||
    number(score?.diagnostics?.days_since_updated);

  if (journey === "visa_rejected" || risk >= 90) {
    interventions.push({
      intervention_type: "critical_intervention",
      severity: "critical",
      title: "Immediate Executive Review",
      recommendation:
        "Escalate to senior counselor and create recovery plan within 24 hours.",
    });
  }

  if (journey === "cas_pending" && daysInactive >= 7) {
    interventions.push({
      intervention_type: "cas_delay_risk",
      severity: "high",
      title: "CAS Delay Risk",
      recommendation: "Contact university and verify CAS blockers.",
    });
  }

  if (journey === "offer_accepted" && daysInactive >= 5) {
    interventions.push({
      intervention_type: "visa_delay_risk",
      severity: "high",
      title: "Visa Workflow Delay",
      recommendation: "Trigger visa preparation workflow.",
    });
  }

  if (documentReadiness < 60) {
    interventions.push({
      intervention_type: "document_intervention",
      severity: "medium",
      title: "Document Gap",
      recommendation: "Create missing document recovery plan.",
    });
  }

  if (overdue >= 3) {
    interventions.push({
      intervention_type: "task_intervention",
      severity: "high",
      title: "Execution Breakdown",
      recommendation: "Recover overdue tasks immediately.",
    });
  }

  if (opportunity >= 85 && risk < 50) {
    interventions.push({
      intervention_type: "fast_track_intervention",
      severity: "executive",
      title: "Fast Track Candidate",
      recommendation: "Move student to executive acceleration workflow.",
    });
  }

  return interventions;
}

export function buildInterventionSummary(scores = []) {
  const rows = asArray(scores);

  const all = rows.flatMap((score) =>
    buildExecutiveInterventions(score)
  );

  return {
    totalInterventions: all.length,
    critical: all.filter((i) => i.severity === "critical").length,
    executive: all.filter((i) => i.severity === "executive").length,
    high: all.filter((i) => i.severity === "high").length,
    medium: all.filter((i) => i.severity === "medium").length,
    interventions: all,
  };
}

export function scanBrokenWorkflow(student = {}) {
  const issues = [];

  const stage = getJourneyStage(student);
  const risk = number(student.risk_score || student?.ai_score?.risk_score);
  const daysInactive = number(
    student.days_since_updated ||
      student.daysInactive ||
      student?.diagnostics?.days_since_updated
  );

  const applications = asArray(
    student.applications ||
      student.application_records ||
      student?.verification?.applications
  );

  const universities = asArray(
    student.universities ||
      student.university_planning ||
      student?.verification?.universities
  );

  const documents = asArray(
    student.documents ||
      student.student_documents ||
      student?.verification?.documents
  );

  const tasks = asArray(
    student.tasks ||
      student.student_tasks ||
      student?.verification?.tasks
  );

  const invoices = asArray(
    student.invoices ||
      student.student_invoices ||
      student?.verification?.invoices
  );

  const payments = asArray(
    student.payments ||
      student.student_payments ||
      student?.verification?.payments
  );

  const portalAccount =
    student.portal_account ||
    student.student_portal_account ||
    student?.verification?.portal_account ||
    null;

  const timeline = asArray(
    student.timeline ||
      student.timeline_events ||
      student?.verification?.timeline
  );

  const hasApplications = applications.length > 0;
  const hasUniversities = universities.length > 0;
  const hasDocuments = documents.length > 0;
  const hasTasks = tasks.length > 0;
  const hasTimeline = timeline.length > 0;

  if (!hasUniversities && ["inquiry", "planning", "university_planning"].includes(stage)) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "university_planning",
        issue_type: "missing_university_plan",
        severity: "high",
        title: "Missing University Planning",
        description:
          "Student is in planning stage but no university planning records were found.",
        recommendation:
          "Create Dream, Target, and Safe university recommendations.",
        recovery_type: "create_university_planning_recovery",
        recovery_action: "generate_university_plan",
        blocking: true,
        metadata: { universities_count: universities.length },
      })
    );
  }

  if (!hasApplications && ["application", "applied", "offer_pending"].includes(stage)) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "application",
        issue_type: "missing_application_record",
        severity: "critical",
        title: "Application Stage Has No Application",
        description:
          "Student appears to be in application workflow but no application record exists.",
        recommendation:
          "Create or recover the missing application record and link it to the student.",
        recovery_type: "application_record_recovery",
        recovery_action: "recover_application_record",
        blocking: true,
        metadata: { applications_count: applications.length },
      })
    );
  }

  if (
    ["offer_received", "offer_accepted", "cas_pending"].includes(stage) &&
    !applications.some((app) =>
      ["offer_received", "offer_accepted", "cas_pending", "cas_issued"].includes(
        normalize(app.status || app.application_status)
      )
    )
  ) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "offer",
        issue_type: "offer_status_sync_failure",
        severity: "high",
        title: "Offer Status Sync Failure",
        description:
          "Student journey indicates offer progress but linked application status does not match.",
        recommendation:
          "Sync application status and regenerate offer-stage timeline event.",
        recovery_type: "offer_sync_recovery",
        recovery_action: "sync_offer_status",
        blocking: true,
      })
    );
  }

  if (
    ["cas_pending", "cas_issued", "visa_preparation"].includes(stage) &&
    !applications.some((app) =>
      ["cas_pending", "cas_issued"].includes(
        normalize(app.cas_status || app.status || app.application_status)
      )
    )
  ) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "cas",
        issue_type: "cas_record_missing_or_unsynced",
        severity: "critical",
        title: "CAS Record Missing or Unsynced",
        description:
          "CAS stage is active but no matching CAS status was found in application data.",
        recommendation:
          "Recover CAS tracking, verify university blocker, and update application CAS status.",
        recovery_type: "cas_recovery",
        recovery_action: "recover_cas_workflow",
        blocking: true,
      })
    );
  }

  if (
    ["visa_preparation", "visa_submitted", "visa_approved", "visa_rejected"].includes(stage) &&
    !student.visa_record &&
    !student.visa &&
    !student?.verification?.visa_record
  ) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "visa",
        issue_type: "missing_visa_record",
        severity: stage === "visa_rejected" ? "critical" : "high",
        title: "Missing Visa Record",
        description:
          "Student is in visa workflow but no visa tracking record exists.",
        recommendation:
          "Create visa tracking record, assign visa task checklist, and log recovery timeline.",
        recovery_type: "visa_recovery",
        recovery_action: "create_visa_tracking",
        blocking: true,
      })
    );
  }

  if (
    invoices.length > 0 &&
    invoices.some((invoice) => number(invoice.outstanding_amount) > 0) &&
    payments.some((payment) =>
      ["confirmed", "paid", "approved"].includes(normalize(payment.status))
    )
  ) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "payment",
        issue_type: "payment_reconciliation_failure",
        severity: "high",
        title: "Payment Reconciliation Failure",
        description:
          "Confirmed payment exists but invoice outstanding amount still appears open.",
        recommendation:
          "Run payment reconciliation and refresh invoice paid/outstanding totals.",
        recovery_type: "payment_recovery",
        recovery_action: "reconcile_payment_records",
        blocking: false,
        metadata: {
          invoices_count: invoices.length,
          payments_count: payments.length,
        },
      })
    );
  }

  if (
    ["application", "offer_received", "cas_pending", "visa_preparation"].includes(stage) &&
    !portalAccount
  ) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "student_portal",
        issue_type: "missing_portal_account",
        severity: "high",
        title: "Missing Student Portal Account",
        description:
          "Student is active in journey but no student portal account was found.",
        recommendation:
          "Create or activate student portal account and trigger welcome credentials workflow.",
        recovery_type: "portal_recovery",
        recovery_action: "create_or_activate_portal_account",
        blocking: false,
      })
    );
  }

  if (portalAccount && bool(portalAccount.is_active, true) === false) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "student_portal",
        issue_type: "inactive_portal_account",
        severity: "medium",
        title: "Inactive Portal Account",
        description:
          "Student has a portal account but it is inactive.",
        recommendation:
          "Reactivate portal account or confirm intentional deactivation.",
        recovery_type: "portal_recovery",
        recovery_action: "activate_portal_account",
        blocking: false,
      })
    );
  }

  if (!hasTimeline && (hasApplications || hasDocuments || hasTasks)) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "timeline",
        issue_type: "timeline_missing",
        severity: "medium",
        title: "Timeline Missing",
        description:
          "Student has operational records but no timeline events were found.",
        recommendation:
          "Regenerate timeline history from applications, documents, tasks, and payments.",
        recovery_type: "timeline_recovery",
        recovery_action: "regenerate_timeline",
        blocking: false,
      })
    );
  }

  if (documents.length > 0) {
    const missingOrRejected = documents.filter((doc) =>
      ["missing", "rejected", "expired", "required"].includes(
        normalize(doc.status || doc.document_status)
      )
    );

    if (missingOrRejected.length >= 2) {
      issues.push(
        createWorkflowIssue({
          student,
          stage: "documents",
          issue_type: "document_readiness_failure",
          severity: "high",
          title: "Document Readiness Failure",
          description:
            "Multiple documents are missing, rejected, required, or expired.",
          recommendation:
            "Create document recovery tasks and notify assigned counselor.",
          recovery_type: "document_recovery",
          recovery_action: "create_document_recovery_tasks",
          blocking: true,
          metadata: {
            failed_documents_count: missingOrRejected.length,
          },
        })
      );
    }
  }

  if (tasks.length > 0) {
    const overdueTasks = tasks.filter((task) =>
      ["overdue", "pending", "open"].includes(normalize(task.status)) &&
      (normalize(task.priority) === "high" ||
        normalize(task.priority) === "critical" ||
        number(task.days_overdue) > 0)
    );

    if (overdueTasks.length >= 3) {
      issues.push(
        createWorkflowIssue({
          student,
          stage: "tasks",
          issue_type: "task_execution_breakdown",
          severity: "high",
          title: "Task Execution Breakdown",
          description:
            "Multiple high-priority or overdue tasks are blocking student progress.",
          recommendation:
            "Generate executive recovery queue and reassign overdue tasks.",
          recovery_type: "task_recovery",
          recovery_action: "recover_overdue_tasks",
          blocking: true,
          metadata: {
            overdue_tasks_count: overdueTasks.length,
          },
        })
      );
    }
  }

  if (risk >= 90 || stage === "visa_rejected") {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "executive",
        issue_type: "critical_risk_escalation",
        severity: "critical",
        title: "Critical Executive Risk",
        description:
          "Student has reached critical risk level or visa rejection stage.",
        recommendation:
          "Escalate to executive owner and create 24-hour recovery plan.",
        recovery_type: "executive_recovery",
        recovery_action: "create_executive_escalation",
        blocking: true,
        metadata: {
          risk_score: risk,
          journey_stage: stage,
          days_inactive: daysInactive,
        },
      })
    );
  }

  if (daysInactive >= 14) {
    issues.push(
      createWorkflowIssue({
        student,
        stage: "engagement",
        issue_type: "student_inactive",
        severity: daysInactive >= 30 ? "critical" : "high",
        title: "Student Inactive",
        description:
          "Student record has not been updated for an extended period.",
        recommendation:
          "Create counselor follow-up, call task, and student communication log.",
        recovery_type: "engagement_recovery",
        recovery_action: "create_follow_up_workflow",
        blocking: false,
        metadata: {
          days_inactive: daysInactive,
        },
      })
    );
  }

  return sortBySeverity(issues);
}

export function scanBrokenWorkflows(students = []) {
  const rows = asArray(students);

  const issues = rows.flatMap((student) => scanBrokenWorkflow(student));

  const byStage = issues.reduce((acc, issue) => {
    const stage = issue.stage || "unknown";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const bySeverity = issues.reduce((acc, issue) => {
    const severity = issue.severity || "medium";
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  return {
    scannedStudents: rows.length,
    totalIssues: issues.length,
    critical: bySeverity.critical || 0,
    executive: bySeverity.executive || 0,
    high: bySeverity.high || 0,
    medium: bySeverity.medium || 0,
    low: bySeverity.low || 0,
    brokenStages: Object.keys(byStage).length,
    byStage,
    bySeverity,
    issues: sortBySeverity(issues),
    generated_at: nowIso(),
  };
}

export function buildAutomaticRecoveryWorkflow(issue = {}) {
  const stage = normalize(issue.stage);
  const type = normalize(issue.issue_type);

  if (stage === "cas" || type.includes("cas")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "verify_cas_blocker",
        title: "Verify CAS Blocker",
        description:
          "Check CAS status, university blocker, deposit condition, and required documents.",
        target_table: "student_applications",
        target_status: "cas_review_required",
        automation_template: "cas_blocker_review",
      }),
      createRecoveryAction({
        issue,
        action_type: "create_cas_follow_up_task",
        title: "Create CAS Follow-up Task",
        description:
          "Assign counselor task to contact university and recover CAS workflow.",
        target_table: "student_tasks",
        target_status: "pending",
        automation_template: "cas_follow_up_task",
      }),
      createRecoveryAction({
        issue,
        action_type: "write_cas_timeline_event",
        title: "Write CAS Recovery Timeline",
        description:
          "Log CAS recovery action in student timeline for audit visibility.",
        target_table: "student_timeline",
        target_status: "logged",
        automation_template: "cas_recovery_timeline",
        requires_approval: false,
      }),
    ];
  }

  if (stage === "visa" || type.includes("visa")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "create_visa_tracking",
        title: "Create Visa Tracking",
        description:
          "Create missing visa tracking record and attach student journey metadata.",
        target_table: "student_visas",
        target_status: "preparation",
        automation_template: "visa_tracking_recovery",
      }),
      createRecoveryAction({
        issue,
        action_type: "create_visa_checklist_tasks",
        title: "Create Visa Checklist Tasks",
        description:
          "Generate visa document, appointment, biometrics, and submission tasks.",
        target_table: "student_tasks",
        target_status: "pending",
        automation_template: "visa_checklist_tasks",
      }),
      createRecoveryAction({
        issue,
        action_type: "notify_counselor_visa_recovery",
        title: "Notify Counselor",
        description:
          "Notify assigned counselor that visa recovery workflow requires action.",
        target_table: "student_communications",
        target_status: "draft",
        automation_template: "visa_recovery_notice",
      }),
    ];
  }

  if (stage === "payment" || type.includes("payment")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "reconcile_payment_records",
        title: "Reconcile Payments",
        description:
          "Recalculate paid amount, outstanding amount, invoice status, and confirmed payments.",
        target_table: "student_invoices",
        target_status: "reconciliation_required",
        automation_template: "payment_reconciliation",
      }),
      createRecoveryAction({
        issue,
        action_type: "audit_receipts",
        title: "Audit Receipts",
        description:
          "Verify approved receipt uploads against payment records.",
        target_table: "student_receipts",
        target_status: "audit_required",
        automation_template: "receipt_payment_audit",
      }),
      createRecoveryAction({
        issue,
        action_type: "write_payment_timeline_event",
        title: "Write Payment Timeline",
        description:
          "Log payment recovery activity to student timeline.",
        target_table: "student_timeline",
        target_status: "logged",
        automation_template: "payment_recovery_timeline",
        requires_approval: false,
      }),
    ];
  }

  if (stage === "student_portal" || type.includes("portal")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "create_or_activate_portal_account",
        title: "Create or Activate Portal Account",
        description:
          "Recover missing or inactive student portal account.",
        target_table: "student_portal_accounts",
        target_status: "active",
        automation_template: "portal_account_recovery",
      }),
      createRecoveryAction({
        issue,
        action_type: "send_portal_access_message",
        title: "Send Portal Access Message",
        description:
          "Draft portal access message for student with login instructions.",
        target_table: "student_communications",
        target_status: "draft",
        automation_template: "portal_access_message",
      }),
      createRecoveryAction({
        issue,
        action_type: "write_portal_timeline_event",
        title: "Write Portal Recovery Timeline",
        description:
          "Log portal account recovery action to timeline.",
        target_table: "student_timeline",
        target_status: "logged",
        automation_template: "portal_recovery_timeline",
        requires_approval: false,
      }),
    ];
  }

  if (stage === "timeline" || type.includes("timeline")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "regenerate_timeline",
        title: "Regenerate Timeline",
        description:
          "Rebuild missing timeline from applications, documents, tasks, payments, and portal activity.",
        target_table: "student_timeline",
        target_status: "regenerated",
        automation_template: "timeline_regeneration",
      }),
    ];
  }

  if (stage === "documents" || type.includes("document")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "create_document_recovery_tasks",
        title: "Create Document Recovery Tasks",
        description:
          "Generate missing/rejected/expired document recovery tasks.",
        target_table: "student_tasks",
        target_status: "pending",
        automation_template: "document_recovery_tasks",
      }),
      createRecoveryAction({
        issue,
        action_type: "draft_document_request",
        title: "Draft Document Request",
        description:
          "Draft student message requesting missing or corrected documents.",
        target_table: "student_communications",
        target_status: "draft",
        automation_template: "document_request_message",
      }),
    ];
  }

  if (stage === "tasks" || type.includes("task")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "recover_overdue_tasks",
        title: "Recover Overdue Tasks",
        description:
          "Reassign overdue tasks, raise priority, and create executive follow-up.",
        target_table: "student_tasks",
        target_status: "recovery_required",
        automation_template: "overdue_task_recovery",
      }),
    ];
  }

  if (stage === "executive" || type.includes("critical")) {
    return [
      createRecoveryAction({
        issue,
        action_type: "create_executive_escalation",
        title: "Create Executive Escalation",
        description:
          "Create critical executive escalation with 24-hour recovery SLA.",
        target_table: "executive_recovery_queue",
        target_status: "critical",
        automation_template: "executive_critical_escalation",
      }),
      createRecoveryAction({
        issue,
        action_type: "assign_senior_counselor",
        title: "Assign Senior Counselor",
        description:
          "Assign or notify senior counselor for executive intervention.",
        target_table: "student_tasks",
        target_status: "urgent",
        automation_template: "senior_counselor_assignment",
      }),
    ];
  }

  return [
    createRecoveryAction({
      issue,
      action_type: issue.recovery_action || "manual_review",
      title: "Manual Recovery Review",
      description:
        issue.recommendation ||
        "Review this workflow issue and create the required recovery action.",
      target_table: "executive_recovery_queue",
      target_status: "manual_review",
      automation_template: "manual_recovery_review",
    }),
  ];
}

export function generateAutomaticRecoveryWorkflows(issues = []) {
  const rows = asArray(issues);

  const workflows = rows.map((issue) => ({
    issue,
    actions: buildAutomaticRecoveryWorkflow(issue),
  }));

  const actions = workflows.flatMap((workflow) => workflow.actions);

  return {
    totalIssues: rows.length,
    totalWorkflows: workflows.length,
    totalActions: actions.length,
    approvalRequired: actions.filter((action) => action.requires_approval).length,
    autoApproved: actions.filter((action) => !action.requires_approval).length,
    workflows,
    actions: sortBySeverity(actions),
    generated_at: nowIso(),
  };
}

export function buildCASRecoveryQueue(issues = []) {
  return sortBySeverity(
    asArray(issues).filter(
      (issue) =>
        normalize(issue.stage) === "cas" ||
        normalize(issue.issue_type).includes("cas")
    )
  ).map((issue) => ({
    ...issue,
    queue_type: "cas_recovery_queue",
    queue_title: "CAS Recovery Queue",
    sla_hours: issue.severity === "critical" ? 12 : 24,
  }));
}

export function buildVisaRecoveryQueue(issues = []) {
  return sortBySeverity(
    asArray(issues).filter(
      (issue) =>
        normalize(issue.stage) === "visa" ||
        normalize(issue.issue_type).includes("visa")
    )
  ).map((issue) => ({
    ...issue,
    queue_type: "visa_recovery_queue",
    queue_title: "Visa Recovery Queue",
    sla_hours: issue.severity === "critical" ? 12 : 24,
  }));
}

export function buildPaymentRecoveryQueue(issues = []) {
  return sortBySeverity(
    asArray(issues).filter(
      (issue) =>
        normalize(issue.stage) === "payment" ||
        normalize(issue.issue_type).includes("payment")
    )
  ).map((issue) => ({
    ...issue,
    queue_type: "payment_recovery_queue",
    queue_title: "Payment Recovery Queue",
    sla_hours: issue.severity === "critical" ? 24 : 48,
  }));
}

export function buildPortalRecoveryQueue(issues = []) {
  return sortBySeverity(
    asArray(issues).filter(
      (issue) =>
        normalize(issue.stage) === "student_portal" ||
        normalize(issue.issue_type).includes("portal")
    )
  ).map((issue) => ({
    ...issue,
    queue_type: "portal_recovery_queue",
    queue_title: "Portal Recovery Queue",
    sla_hours: issue.severity === "critical" ? 12 : 24,
  }));
}

export function buildExecutiveRecoveryActions(issues = []) {
  const rows = sortBySeverity(asArray(issues));

  const workflows = generateAutomaticRecoveryWorkflows(rows);

  return {
    totalIssues: rows.length,
    totalActions: workflows.actions.length,
    criticalIssues: rows.filter((issue) => issue.severity === "critical").length,
    highIssues: rows.filter((issue) => issue.severity === "high").length,
    casQueue: buildCASRecoveryQueue(rows),
    visaQueue: buildVisaRecoveryQueue(rows),
    paymentQueue: buildPaymentRecoveryQueue(rows),
    portalQueue: buildPortalRecoveryQueue(rows),
    workflows: workflows.workflows,
    actions: workflows.actions,
    generated_at: nowIso(),
  };
}

export function buildBrokenWorkflowScannerSnapshot(students = []) {
  const scan = scanBrokenWorkflows(students);
  const recovery = buildExecutiveRecoveryActions(scan.issues);

  return {
    health_status:
      scan.critical > 0
        ? "critical"
        : scan.high > 0
          ? "needs_recovery"
          : scan.totalIssues > 0
            ? "monitor"
            : "healthy",
    scannedStudents: scan.scannedStudents,
    totalIssues: scan.totalIssues,
    critical: scan.critical,
    high: scan.high,
    medium: scan.medium,
    brokenStages: scan.brokenStages,
    byStage: scan.byStage,
    bySeverity: scan.bySeverity,
    recoveryActions: recovery.totalActions,
    casRecoveryCount: recovery.casQueue.length,
    visaRecoveryCount: recovery.visaQueue.length,
    paymentRecoveryCount: recovery.paymentQueue.length,
    portalRecoveryCount: recovery.portalQueue.length,
    issues: scan.issues,
    recovery,
    generated_at: nowIso(),
  };
}

export function buildExecutiveAutomationSnapshot({
  students = [],
  scores = [],
  verificationSnapshot = null,
} = {}) {
  const interventionSummary = buildInterventionSummary(scores);
  const brokenWorkflowSnapshot = buildBrokenWorkflowScannerSnapshot(students);

  const verificationHealth =
    verificationSnapshot?.healthStatus ||
    verificationSnapshot?.platformHealth ||
    verificationSnapshot?.status ||
    null;

  return {
    module: "executive_automation_engine",
    status:
      brokenWorkflowSnapshot.health_status === "critical"
        ? "critical"
        : brokenWorkflowSnapshot.health_status === "needs_recovery"
          ? "recovery_required"
          : "operational",
    verificationHealth,
    interventions: interventionSummary,
    brokenWorkflows: brokenWorkflowSnapshot,
    recovery: brokenWorkflowSnapshot.recovery,
    generated_at: nowIso(),
  };
}

export function generateRecoveryActions(input = {}) {
  const students = asArray(input.students || input.records || input);
  const scan = scanBrokenWorkflows(students);
  return buildExecutiveRecoveryActions(scan.issues);
}

export function generateBrokenWorkflowReport(students = []) {
  const snapshot = buildBrokenWorkflowScannerSnapshot(students);

  return {
    title: "Broken Workflow Scanner Report",
    summary: {
      scannedStudents: snapshot.scannedStudents,
      totalIssues: snapshot.totalIssues,
      critical: snapshot.critical,
      high: snapshot.high,
      medium: snapshot.medium,
      brokenStages: snapshot.brokenStages,
      healthStatus: snapshot.health_status,
    },
    heatmap: snapshot.byStage,
    queues: {
      cas: snapshot.recovery.casQueue,
      visa: snapshot.recovery.visaQueue,
      payment: snapshot.recovery.paymentQueue,
      portal: snapshot.recovery.portalQueue,
    },
    actions: snapshot.recovery.actions,
    issues: snapshot.issues,
    generated_at: nowIso(),
  };
}