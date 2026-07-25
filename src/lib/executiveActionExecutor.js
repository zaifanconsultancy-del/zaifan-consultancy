import { supabase } from "./supabaseClient";
import { createFollowUpReminder } from "./followUpReminders";
import { addTimelineEvent } from "./crmTimeline";

const QUERY_TIMEOUT_MS = 6500;
const LOG_TIMEOUT_MS = 3500;
const TIMELINE_TIMEOUT_MS = 2500;

function safeString(value = "") {
  return String(value || "").trim();
}

function normalizeActionType(value = "") {
  return safeString(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function getPayload(template = {}) {
  return template?.payload || {};
}

function getStudentId(template = {}) {
  const payload = getPayload(template);
  return payload.student_id || template.student_id || null;
}

function getStudentType(template = {}) {
  const payload = getPayload(template);
  return payload.student_type || template.student_type || "inquiry";
}

function getTemplateTitle(template = {}, fallback = "Executive Action") {
  const payload = getPayload(template);
  return payload.title || template.title || fallback;
}

function getTemplateDescription(template = {}) {
  const payload = getPayload(template);

  return (
    payload.description ||
    payload.notes ||
    payload.summary ||
    template.description ||
    template.summary ||
    ""
  );
}

function getAdminId(adminProfile = null) {
  return adminProfile?.id || adminProfile?.admin_id || null;
}

function getAdminName(adminProfile = null) {
  return (
    adminProfile?.full_name ||
    adminProfile?.name ||
    adminProfile?.email ||
    "Executive User"
  );
}

function getPriority(template = {}) {
  const payload = getPayload(template);
  return (
    payload.priority ||
    payload.recommendation_priority ||
    payload.priority_level ||
    template.priority ||
    "medium"
  );
}

function buildDuplicateKey(template = {}) {
  const payload = getPayload(template);

  return (
    template.duplicateKey ||
    template.template_key ||
    payload.template_key ||
    payload.duplicate_protection_key ||
    [
      getStudentId(template),
      getStudentType(template),
      payload.recommendation_type || "recommendation",
      normalizeActionType(template.actionType),
      payload.title || template.title || "",
    ]
      .filter(Boolean)
      .join("::")
  );
}

async function withTimeout(promise, label, timeoutMs = QUERY_TIMEOUT_MS) {
  let timer;

  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve({
        data: null,
        error: new Error(`${label} timed out after ${timeoutMs}ms.`),
        timedOut: true,
      });
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    return { data: null, error, timedOut: false };
  } finally {
    clearTimeout(timer);
  }
}

function buildTimelineMetadata(template = {}, extra = {}) {
  const payload = getPayload(template);

  return {
    source: "executive_action_executor_v3",
    generated_by: payload.generated_by || "executive_ai",
    generated_at: payload.generated_at || null,
    automation_version: payload.automation_version || "v3",
    automation_source: payload.automation_source || "student_os_executive_ai",

    action_type: normalizeActionType(template.actionType),
    template_key: buildDuplicateKey(template),
    duplicate_protection_key: buildDuplicateKey(template),

    recommendation_type: payload.recommendation_type || null,
    priority: getPriority(template),
    approval_required: payload.approval_required === true,
    approval_status: payload.approval_required === true ? "required" : "not_required",
    approval_reason: payload.approval_reason || null,

    executive_category: payload.executive_category || template.executive_category || null,
    priority_level: payload.priority_level || null,
    risk_level: payload.risk_level || null,
    risk_score: payload.risk_score ?? template.risk_score ?? null,
    opportunity_score: payload.opportunity_score ?? template.opportunity_score ?? null,

    journey_stage: payload.journey_stage || template.journey_stage || null,
    application_status: payload.application_status || template.application_status || null,
    offer_status: payload.offer_status || template.offer_status || null,
    cas_status: payload.cas_status || template.cas_status || null,
    visa_status: payload.visa_status || template.visa_status || null,

    document_readiness_percent: payload.document_readiness_percent ?? null,
    task_completion_percent: payload.task_completion_percent ?? null,
    pending_tasks_count: payload.pending_tasks_count ?? null,
    overdue_tasks_count: payload.overdue_tasks_count ?? null,
    university_plan_count: payload.university_plan_count ?? null,
    safe_university_count: payload.safe_university_count ?? null,
    target_university_count: payload.target_university_count ?? null,
    dream_university_count: payload.dream_university_count ?? null,
    days_since_updated: payload.days_since_updated ?? null,

    ...extra,
  };
}

async function writeTimelineEvent({
  template,
  adminProfile,
  actionType,
  title,
  description,
  executionStatus = "completed",
  metadata = {},
}) {
  const studentId = getStudentId(template);

  if (!studentId) {
    return { data: null, error: new Error("Timeline skipped: missing student id.") };
  }

  const result = await withTimeout(
    addTimelineEvent({
      studentId,
      studentType: getStudentType(template),
      actionType,
      title,
      description,
      adminProfile,
      metadata: {
        ...buildTimelineMetadata(template, metadata),
        execution_status: executionStatus,
      },
    }),
    "Executive timeline event",
    TIMELINE_TIMEOUT_MS
  );

  if (result?.error) {
    console.warn("Executive timeline event failed/skipped:", result.error);
  }

  return result;
}

function fireTimelineEvent(args) {
  writeTimelineEvent(args).catch((error) => {
    console.warn("Executive timeline fire-and-forget failed:", error);
  });
}

function buildExecutionLogPayload({
  template,
  adminProfile,
  status = "completed",
  targetTable = "",
  targetId = null,
  error = null,
  metadata = {},
}) {
  const payload = getPayload(template);
  const actionType = normalizeActionType(template?.actionType);

  return {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    student_name: payload.student_name || template?.student_name || "",
    action_type: actionType,

    template_key: buildDuplicateKey(template),
    recommendation_type: payload.recommendation_type || "",
    priority: getPriority(template),

    status,
    approval_status: payload.approval_required === true ? "required" : "not_required",
    duplicate_detected: status === "duplicate_blocked",

    target_table: targetTable || null,
    target_id: targetId ? String(targetId) : null,

    executed_by: getAdminId(adminProfile),
    executed_at: new Date().toISOString(),

    error_message: error?.message || error || null,

    metadata: buildTimelineMetadata(template, {
      ...metadata,
      title: getTemplateTitle(template),
      description: getTemplateDescription(template),
      executed_by_name: getAdminName(adminProfile),
      original_template: template,
    }),
  };
}

async function writeExecutionLog(args) {
  const logPayload = buildExecutionLogPayload(args);

  try {
    const result = await withTimeout(
      supabase.from("executive_execution_logs").insert(logPayload),
      "Executive execution log insert",
      LOG_TIMEOUT_MS
    );

    if (result?.error) {
      console.warn("Executive execution log insert failed/skipped:", result.error);
      return { data: null, error: result.error };
    }

    return { data: logPayload, error: null };
  } catch (error) {
    console.warn("Executive execution log crashed:", error);
    return { data: null, error };
  }
}

function fireExecutionLog(args) {
  writeExecutionLog(args).catch((error) => {
    console.warn("Executive execution log fire-and-forget failed:", error);
  });
}

async function checkDuplicateExecution(template = {}) {
  const duplicateKey = buildDuplicateKey(template);

  if (!duplicateKey) {
    return { duplicate: false, data: null, error: null };
  }

  const result = await withTimeout(
    supabase
      .from("executive_execution_logs")
      .select("*")
      .eq("template_key", duplicateKey)
      .in("status", ["completed", "success", "executed"])
      .limit(1),
    "Executive duplicate check",
    QUERY_TIMEOUT_MS
  );

  if (result?.error) {
    console.warn("Executive duplicate check failed/skipped:", result.error);
    return { duplicate: false, data: null, error: result.error };
  }

  const rows = Array.isArray(result?.data) ? result.data : [];

  return {
    duplicate: rows.length > 0,
    data: rows[0] || null,
    error: null,
  };
}

function validateTemplate(template = {}) {
  if (!template?.actionType) {
    return new Error("Missing executive action type.");
  }

  if (!template?.payload) {
    return new Error("Missing executive action payload.");
  }

  if (!getStudentId(template)) {
    return new Error("Missing student id for executive action.");
  }

  return null;
}

function buildExecutionResult({
  data = null,
  error = null,
  template = {},
  actionType = "",
  targetTable = "",
  duplicate = false,
  skipped = false,
  timedOut = false,
}) {
  return {
    data,
    error,
    actionType: actionType || normalizeActionType(template?.actionType),
    targetTable,
    template,
    duplicate,
    skipped,
    timedOut,
    duplicateKey: buildDuplicateKey(template),
    executedAt: new Date().toISOString(),
  };
}

function buildTaskPayload({ template, adminProfile, isCallTask = false }) {
  const payload = getPayload(template);

  return {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    title: getTemplateTitle(template, isCallTask ? "Executive Call Task" : "Executive Task"),
    description: getTemplateDescription(template),
    priority: payload.priority || payload.recommendation_priority || (isCallTask ? "high" : "medium"),
    status: payload.status || "pending",
    due_date: payload.due_date || payload.dueDate || null,
    created_by: getAdminId(adminProfile),
  };
}

async function insertStudentTask(taskPayload) {
  let result = await withTimeout(
    supabase.from("student_tasks").insert(taskPayload).select().single(),
    "Student task insert",
    QUERY_TIMEOUT_MS
  );

  if (!result?.error) return result;

  const fallbackPayload = { ...taskPayload };
  delete fallbackPayload.created_by;

  result = await withTimeout(
    supabase.from("student_tasks").insert(fallbackPayload).select().single(),
    "Student task insert fallback",
    QUERY_TIMEOUT_MS
  );

  return result;
}

async function executeTaskTemplate({ template, adminProfile, isCallTask = false }) {
  const actionType = isCallTask ? "schedule_call" : "create_task";
  const taskPayload = buildTaskPayload({ template, adminProfile, isCallTask });

  const { data, error, timedOut } = await insertStudentTask(taskPayload);

  if (error) {
    fireTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_action_failed",
      title: "Executive AI task execution failed",
      description: error.message || "Task execution failed.",
      executionStatus: "failed",
      metadata: {
        target_table: "student_tasks",
        attempted_payload: taskPayload,
      },
    });

    fireExecutionLog({
      template,
      adminProfile,
      status: "failed",
      targetTable: "student_tasks",
      error,
      metadata: {
        attempted_payload: taskPayload,
        timed_out: timedOut === true,
      },
    });

    return buildExecutionResult({
      data: taskPayload,
      error,
      template,
      actionType,
      targetTable: "student_tasks",
      timedOut: timedOut === true,
    });
  }

  fireExecutionLog({
    template,
    adminProfile,
    status: "completed",
    targetTable: "student_tasks",
    targetId: data?.id || null,
    metadata: {
      created_payload: taskPayload,
      returned_data: data || null,
    },
  });

  fireTimelineEvent({
    template,
    adminProfile,
    actionType: isCallTask ? "executive_call_task_created" : "executive_task_created",
    title: isCallTask ? "Executive AI created a call task" : "Executive AI created a task",
    description: taskPayload.description || taskPayload.title,
    metadata: {
      target_table: "student_tasks",
      target_id: data?.id || null,
    },
  });

  return buildExecutionResult({
    data: data || taskPayload,
    error: null,
    template,
    actionType,
    targetTable: "student_tasks",
  });
}

async function executeReminderTemplate({ template, adminProfile }) {
  const payload = getPayload(template);

  const reminderPayload = {
    studentId: getStudentId(template),
    studentType: getStudentType(template),
    title: getTemplateTitle(template, "Executive Follow-Up"),
    notes: payload.notes || payload.summary || getTemplateDescription(template),
    dueDate: payload.due_date || payload.dueDate || null,
    dueTime: payload.due_time || payload.dueTime || null,
    adminProfile,
  };

  const { data, error, timedOut } = await withTimeout(
    createFollowUpReminder(reminderPayload),
    "Executive reminder insert",
    QUERY_TIMEOUT_MS
  );

  if (error) {
    fireTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_action_failed",
      title: "Executive AI reminder execution failed",
      description: error.message || "Reminder execution failed.",
      executionStatus: "failed",
      metadata: {
        target_table: "follow_up_reminders",
        attempted_payload: reminderPayload,
      },
    });

    fireExecutionLog({
      template,
      adminProfile,
      status: "failed",
      targetTable: "follow_up_reminders",
      error,
      metadata: {
        attempted_payload: reminderPayload,
        timed_out: timedOut === true,
      },
    });

    return buildExecutionResult({
      data: reminderPayload,
      error,
      template,
      actionType: "create_reminder",
      targetTable: "follow_up_reminders",
      timedOut: timedOut === true,
    });
  }

  fireTimelineEvent({
    template,
    adminProfile,
    actionType: "executive_reminder_created",
    title: "Executive AI created a reminder",
    description: reminderPayload.notes || reminderPayload.title,
    metadata: {
      target_table: "follow_up_reminders",
      target_id: data?.id || null,
    },
  });

  fireExecutionLog({
    template,
    adminProfile,
    status: "completed",
    targetTable: "follow_up_reminders",
    targetId: data?.id || null,
    metadata: {
      created_payload: reminderPayload,
      returned_data: data || null,
    },
  });

  return buildExecutionResult({
    data: data || reminderPayload,
    error: null,
    template,
    actionType: "create_reminder",
    targetTable: "follow_up_reminders",
  });
}

function buildCommunicationPayload({ template, channel = "whatsapp" }) {
  const payload = getPayload(template);

  return {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    channel: payload.channel || channel,
    subject: payload.subject || "",
    message: payload.message || payload.body || payload.notes || payload.summary || "",
    status: payload.status || "draft",
  };
}

async function insertCommunication(communicationPayload) {
  return await withTimeout(
    supabase.from("student_communications").insert(communicationPayload).select().single(),
    "Student communication insert",
    QUERY_TIMEOUT_MS
  );
}

async function executeCommunicationTemplate({
  template,
  adminProfile,
  channel = "whatsapp",
}) {
  const actionType = normalizeActionType(template.actionType);
  const communicationPayload = buildCommunicationPayload({ template, channel });

  const { data, error, timedOut } = await insertCommunication(communicationPayload);

  if (error) {
    fireTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_action_failed",
      title: "Executive AI communication execution failed",
      description: error.message || "Communication execution failed.",
      executionStatus: "failed",
      metadata: {
        target_table: "student_communications",
        attempted_payload: communicationPayload,
      },
    });

    fireExecutionLog({
      template,
      adminProfile,
      status: "failed",
      targetTable: "student_communications",
      error,
      metadata: {
        attempted_payload: communicationPayload,
        timed_out: timedOut === true,
      },
    });

    return buildExecutionResult({
      data: communicationPayload,
      error,
      template,
      actionType,
      targetTable: "student_communications",
      timedOut: timedOut === true,
    });
  }

  fireTimelineEvent({
    template,
    adminProfile,
    actionType:
      actionType === "send_email"
        ? "executive_email_draft_saved"
        : "executive_whatsapp_draft_saved",
    title:
      actionType === "send_email"
        ? "Executive AI saved email draft"
        : "Executive AI saved WhatsApp draft",
    description: communicationPayload.message || communicationPayload.subject,
    metadata: {
      target_table: "student_communications",
      target_id: data?.id || null,
    },
  });

  fireExecutionLog({
    template,
    adminProfile,
    status: "completed",
    targetTable: "student_communications",
    targetId: data?.id || null,
    metadata: {
      created_payload: communicationPayload,
      returned_data: data || null,
    },
  });

  return buildExecutionResult({
    data: data || communicationPayload,
    error: null,
    template,
    actionType,
    targetTable: "student_communications",
  });
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

function isV4RecoveryAction(actionType = "") {
  return V4_RECOVERY_ACTION_TYPES.has(normalizeActionType(actionType));
}

function isTimelineRecoveryAction(actionType = "") {
  const clean = normalizeActionType(actionType);
  return clean.includes("timeline") || clean === "regenerate_timeline";
}

function isCommunicationRecoveryAction(actionType = "") {
  const clean = normalizeActionType(actionType);
  return (
    clean.includes("notify") ||
    clean.includes("message") ||
    clean.includes("draft_document_request") ||
    clean === "send_portal_access_message"
  );
}

function isTaskRecoveryAction(actionType = "") {
  const clean = normalizeActionType(actionType);
  return (
    clean.includes("task") ||
    clean.includes("checklist") ||
    clean.includes("follow_up") ||
    clean.includes("escalation") ||
    clean.includes("assign") ||
    clean.includes("recovery") ||
    clean.includes("review") ||
    clean.includes("audit") ||
    clean.includes("reconcile") ||
    clean.includes("tracking")
  );
}

function getRecoveryPriority(template = {}) {
  const payload = getPayload(template);
  const raw = normalizeActionType(
    payload.priority ||
      payload.severity ||
      payload.recommendation_priority ||
      template.priority ||
      "high"
  );

  if (["critical", "urgent"].includes(raw)) return "critical";
  if (["executive", "high"].includes(raw)) return "high";
  if (raw === "low") return "low";
  return "medium";
}

function getRecoveryDueDate(template = {}) {
  const payload = getPayload(template);
  if (payload.due_date || payload.dueDate) return payload.due_date || payload.dueDate;

  const priority = getRecoveryPriority(template);
  const actionType = normalizeActionType(template.actionType);

  const hours = priority === "critical" ? 24 : priority === "high" ? 48 : 72;
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);

  if (actionType.includes("cas") || actionType.includes("visa") || actionType.includes("escalation")) {
    date.setTime(Date.now() + 24 * 60 * 60 * 1000);
  }

  return date.toISOString().slice(0, 10);
}

function buildV4RecoveryTaskPayload({ template, adminProfile }) {
  const payload = getPayload(template);
  const actionType = normalizeActionType(template.actionType);
  const stage = normalizeActionType(payload.stage || payload.recovery_stage || payload.target_stage || "workflow_recovery");
  const title = getTemplateTitle(template, `Recovery Action: ${stage.replace(/_/g, " ")}`);
  const description =
    getTemplateDescription(template) ||
    payload.recommendation ||
    `Complete V4 recovery action ${actionType.replace(/_/g, " ")} for ${stage.replace(/_/g, " ")}.`;

  return {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    title,
    description,
    priority: getRecoveryPriority(template),
    status: payload.status || "pending",
    due_date: getRecoveryDueDate(template),
    created_by: getAdminId(adminProfile),
  };
}

function buildV4RecoveryCommunicationPayload({ template, channel = "whatsapp" }) {
  const payload = getPayload(template);
  const actionType = normalizeActionType(template.actionType);
  const title = getTemplateTitle(template, "Workflow Recovery Message");
  const description = getTemplateDescription(template);

  return {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    channel: payload.channel || channel,
    subject: payload.subject || title,
    message:
      payload.message ||
      payload.body ||
      description ||
      `Workflow recovery action required: ${actionType.replace(/_/g, " ")}.`,
    status: payload.status || "draft",
  };
}

async function updatePortalAccountForRecovery({ template }) {
  const payload = getPayload(template);
  const studentId = getStudentId(template);
  const studentType = getStudentType(template);
  const accountId = payload.account_id || payload.portal_account_id || payload.target_id || null;

  let query = supabase.from("student_portal_accounts").update({ is_active: true });

  if (accountId) {
    query = query.eq("id", accountId);
  } else {
    query = query.eq("student_id", studentId).eq("student_type", studentType);
  }

  return withTimeout(
    query.select("id, email, student_id, student_type, is_active").maybeSingle(),
    "Portal account recovery update",
    QUERY_TIMEOUT_MS
  );
}

async function executeV4RecoveryTemplate({ template, adminProfile }) {
  const actionType = normalizeActionType(template.actionType);
  const payload = getPayload(template);
  const targetTable = payload.target_table || "student_tasks";

  if (actionType === "activate_portal_account" || actionType === "create_or_activate_portal_account") {
    const { data, error, timedOut } = await updatePortalAccountForRecovery({ template });

    if (!error && data) {
      fireExecutionLog({
        template,
        adminProfile,
        status: "completed",
        targetTable: "student_portal_accounts",
        targetId: data?.id || null,
        metadata: { recovered_portal_account: data },
      });

      fireTimelineEvent({
        template,
        adminProfile,
        actionType: "executive_portal_recovery_completed",
        title: "Executive AI recovered portal access",
        description: "Student portal account was activated by V4 recovery execution.",
        metadata: {
          target_table: "student_portal_accounts",
          target_id: data?.id || null,
        },
      });

      return buildExecutionResult({
        data,
        error: null,
        template,
        actionType,
        targetTable: "student_portal_accounts",
      });
    }

    // If no account exists or schema/RLS blocks update, fall through to task creation.
    if (error || timedOut) {
      console.warn("Portal account recovery update skipped; creating recovery task instead:", error?.message || error);
    }
  }

  if (isTimelineRecoveryAction(actionType)) {
    const result = await writeTimelineEvent({
      template,
      adminProfile,
      actionType: `executive_${actionType}`,
      title: getTemplateTitle(template, "Executive AI logged workflow recovery"),
      description:
        getTemplateDescription(template) ||
        "Executive AI logged a V4 workflow recovery action.",
      metadata: {
        target_table: targetTable,
        target_status: payload.target_status || "logged",
        v4_recovery_action: true,
      },
    });

    fireExecutionLog({
      template,
      adminProfile,
      status: result?.error ? "failed" : "completed",
      targetTable: "crm_timeline",
      error: result?.error || null,
      metadata: {
        v4_recovery_action: true,
        timeline_result: result?.data || null,
      },
    });

    return buildExecutionResult({
      data: result?.data || payload,
      error: result?.error || null,
      template,
      actionType,
      targetTable: "crm_timeline",
      timedOut: result?.timedOut === true,
    });
  }

  if (isCommunicationRecoveryAction(actionType)) {
    const communicationPayload = buildV4RecoveryCommunicationPayload({ template });
    const { data, error, timedOut } = await insertCommunication(communicationPayload);

    fireExecutionLog({
      template,
      adminProfile,
      status: error ? "failed" : "completed",
      targetTable: "student_communications",
      targetId: data?.id || null,
      error,
      metadata: {
        v4_recovery_action: true,
        created_payload: communicationPayload,
        returned_data: data || null,
        timed_out: timedOut === true,
      },
    });

    fireTimelineEvent({
      template,
      adminProfile,
      actionType: error ? "executive_action_failed" : "executive_recovery_communication_created",
      title: error ? "Executive AI recovery communication failed" : "Executive AI created recovery communication",
      description: error?.message || communicationPayload.message || communicationPayload.subject,
      executionStatus: error ? "failed" : "completed",
      metadata: {
        target_table: "student_communications",
        target_id: data?.id || null,
      },
    });

    return buildExecutionResult({
      data: data || communicationPayload,
      error,
      template,
      actionType,
      targetTable: "student_communications",
      timedOut: timedOut === true,
    });
  }

  if (isTaskRecoveryAction(actionType)) {
    const taskPayload = buildV4RecoveryTaskPayload({ template, adminProfile });
    const { data, error, timedOut } = await insertStudentTask(taskPayload);

    fireExecutionLog({
      template,
      adminProfile,
      status: error ? "failed" : "completed",
      targetTable: "student_tasks",
      targetId: data?.id || null,
      error,
      metadata: {
        v4_recovery_action: true,
        intended_target_table: targetTable,
        intended_target_status: payload.target_status || null,
        created_payload: taskPayload,
        returned_data: data || null,
        timed_out: timedOut === true,
      },
    });

    fireTimelineEvent({
      template,
      adminProfile,
      actionType: error ? "executive_action_failed" : "executive_v4_recovery_task_created",
      title: error ? "Executive AI recovery task failed" : "Executive AI created V4 recovery task",
      description: error?.message || taskPayload.description || taskPayload.title,
      executionStatus: error ? "failed" : "completed",
      metadata: {
        target_table: "student_tasks",
        target_id: data?.id || null,
        intended_target_table: targetTable,
        v4_recovery_action: true,
      },
    });

    return buildExecutionResult({
      data: data || taskPayload,
      error,
      template,
      actionType,
      targetTable: "student_tasks",
      timedOut: timedOut === true,
    });
  }

  const manualTaskPayload = buildV4RecoveryTaskPayload({ template, adminProfile });
  const { data, error, timedOut } = await insertStudentTask(manualTaskPayload);

  fireExecutionLog({
    template,
    adminProfile,
    status: error ? "failed" : "completed",
    targetTable: "student_tasks",
    targetId: data?.id || null,
    error,
    metadata: {
      v4_recovery_action: true,
      manual_fallback: true,
      intended_target_table: targetTable,
      created_payload: manualTaskPayload,
      timed_out: timedOut === true,
    },
  });

  return buildExecutionResult({
    data: data || manualTaskPayload,
    error,
    template,
    actionType,
    targetTable: "student_tasks",
    timedOut: timedOut === true,
  });
}

export async function executeExecutiveActionTemplate({
  template,
  adminProfile = null,
  skipDuplicateCheck = false,
}) {
  const validationError = validateTemplate(template);

  if (validationError) {
    fireExecutionLog({
      template,
      adminProfile,
      status: "failed",
      error: validationError,
    });

    return buildExecutionResult({
      data: null,
      error: validationError,
      template,
      actionType: normalizeActionType(template?.actionType),
    });
  }

  const actionType = normalizeActionType(template.actionType);

  if (!skipDuplicateCheck) {
    const duplicateCheck = await checkDuplicateExecution(template);

    if (duplicateCheck.duplicate) {
      const duplicateError = new Error(
        "Duplicate protection blocked this action because it was already executed."
      );

      fireExecutionLog({
        template,
        adminProfile,
        status: "duplicate_blocked",
        error: duplicateError,
        metadata: {
          existing_log_id: duplicateCheck.data?.id || null,
        },
      });

      return buildExecutionResult({
        data: duplicateCheck.data,
        error: duplicateError,
        template,
        actionType,
        duplicate: true,
        skipped: true,
      });
    }
  }

  if (actionType === "create_task") {
    return await executeTaskTemplate({ template, adminProfile });
  }

  if (actionType === "schedule_call") {
    return await executeTaskTemplate({ template, adminProfile, isCallTask: true });
  }

  if (actionType === "create_reminder") {
    return await executeReminderTemplate({ template, adminProfile });
  }

  if (actionType === "send_email") {
    return await executeCommunicationTemplate({
      template,
      adminProfile,
      channel: "email",
    });
  }

  if (actionType === "send_whatsapp") {
    return await executeCommunicationTemplate({
      template,
      adminProfile,
      channel: "whatsapp",
    });
  }

  if (isV4RecoveryAction(actionType)) {
    return await executeV4RecoveryTemplate({ template, adminProfile });
  }

  const unsupportedError = new Error(`Unsupported executive action: ${template.actionType}`);

  fireExecutionLog({
    template,
    adminProfile,
    status: "failed",
    error: unsupportedError,
  });

  return buildExecutionResult({
    data: null,
    error: unsupportedError,
    template,
    actionType,
  });
}

export async function fetchExecutiveExecutionLogs({
  studentId = null,
  studentType = null,
  limit = 50,
} = {}) {
  let query = supabase
    .from("executive_execution_logs")
    .select("*")
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (studentId) query = query.eq("student_id", String(studentId));
  if (studentType) query = query.eq("student_type", studentType);

  const { data, error } = await query;

  if (error) {
    console.error("Executive execution logs fetch failed:", error);
  }

  return { data: data || [], error };
}

export function buildExecutionAnalytics(logs = []) {
  const rows = Array.isArray(logs) ? logs : [];

  const analytics = {
    total: rows.length,
    completed: 0,
    failed: 0,
    duplicateBlocked: 0,
    approvalRequired: 0,
    tasks: 0,
    reminders: 0,
    calls: 0,
    emails: 0,
    whatsapp: 0,
    v4Recovery: 0,
    byAction: {},
    byStatus: {},
  };

  rows.forEach((log) => {
    const status = normalizeActionType(log.status);
    const actionType = normalizeActionType(log.action_type);

    analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;
    analytics.byAction[actionType] = (analytics.byAction[actionType] || 0) + 1;

    if (["completed", "success", "executed"].includes(status)) analytics.completed += 1;
    if (status === "failed") analytics.failed += 1;
    if (status === "duplicate_blocked") analytics.duplicateBlocked += 1;
    if (log.approval_status === "required") analytics.approvalRequired += 1;

    if (actionType === "create_task") analytics.tasks += 1;
    if (actionType === "create_reminder") analytics.reminders += 1;
    if (actionType === "schedule_call") analytics.calls += 1;
    if (actionType === "send_email") analytics.emails += 1;
    if (actionType === "send_whatsapp") analytics.whatsapp += 1;
    if (isV4RecoveryAction(actionType)) analytics.v4Recovery = (analytics.v4Recovery || 0) + 1;
  });

  analytics.v4Recovery = analytics.v4Recovery || 0;

  analytics.successRate = analytics.total
    ? Math.round((analytics.completed / analytics.total) * 100)
    : 0;

  return analytics;
}

export async function executeBulkExecutiveActions({
  templates = [],
  adminProfile = null,
  skipDuplicateCheck = false,
}) {
  const safeTemplates = Array.isArray(templates) ? templates.filter(Boolean) : [];
  const results = [];

  for (const template of safeTemplates) {
    try {
      const result = await executeExecutiveActionTemplate({
        template,
        adminProfile,
        skipDuplicateCheck,
      });

      results.push(result);
    } catch (error) {
      fireExecutionLog({
        template,
        adminProfile,
        status: "failed",
        error,
        metadata: {
          bulk_execution_error: true,
        },
      });

      results.push(
        buildExecutionResult({
          template,
          error,
          actionType: normalizeActionType(template?.actionType),
        })
      );
    }
  }

  const successful = results.filter((result) => !result.error && !result.duplicate).length;
  const failed = results.filter((result) => result.error && !result.duplicate).length;
  const duplicateBlocked = results.filter((result) => result.duplicate).length;
  const timedOut = results.filter((result) => result.timedOut).length;

  return {
    total: safeTemplates.length,
    successful,
    failed,
    duplicateBlocked,
    timedOut,
    successRate: safeTemplates.length
      ? Math.round((successful / safeTemplates.length) * 100)
      : 0,
    results,
    executedAt: new Date().toISOString(),
  };
}

export async function executeCriticalExecutiveActions({
  templates = [],
  adminProfile = null,
}) {
  const criticalTemplates = (templates || []).filter((template) => {
    const payload = template?.payload || {};
    const riskScore = Number(payload.risk_score || template?.risk_score || 0);
    const riskLevel = normalizeActionType(payload.risk_level || template?.risk_level || "");
    const priority = normalizeActionType(
      payload.priority ||
        payload.priority_level ||
        payload.recommendation_priority ||
        template?.priority ||
        ""
    );

    return (
      riskScore >= 80 ||
      riskLevel === "critical" ||
      priority === "critical" ||
      priority === "urgent"
    );
  });

  return executeBulkExecutiveActions({
    templates: criticalTemplates,
    adminProfile,
  });
}

export async function executeExecutivePriorityActions({
  templates = [],
  adminProfile = null,
}) {
  const executiveTemplates = (templates || []).filter((template) => {
    const payload = template?.payload || {};
    const riskScore = Number(payload.risk_score || template?.risk_score || 0);
    const opportunityScore = Number(payload.opportunity_score || template?.opportunity_score || 0);
    const executiveCategory = normalizeActionType(
      payload.executive_category || template?.executive_category || ""
    );
    const priorityLevel = normalizeActionType(
      payload.priority_level || payload.priority || template?.priority_level || ""
    );

    return (
      executiveCategory === "executive_priority" ||
      priorityLevel === "executive" ||
      riskScore >= 85 ||
      opportunityScore >= 85
    );
  });

  return executeBulkExecutiveActions({
    templates: executiveTemplates,
    adminProfile,
  });
}

export async function executeConversionExecutiveActions({
  templates = [],
  adminProfile = null,
}) {
  const conversionTemplates = (templates || []).filter((template) => {
    const payload = template?.payload || {};
    const opportunityScore = Number(payload.opportunity_score || template?.opportunity_score || 0);
    const category = normalizeActionType(payload.executive_category || template?.executive_category || "");
    const stage = normalizeActionType(payload.journey_stage || template?.journey_stage || "");

    return (
      opportunityScore >= 80 ||
      category === "conversion_ready" ||
      ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage)
    );
  });

  return executeBulkExecutiveActions({
    templates: conversionTemplates,
    adminProfile,
  });
}

export async function retryFailedExecutiveActions({
  failedLogs = [],
  templates = [],
  adminProfile = null,
}) {
  const logs = Array.isArray(failedLogs) ? failedLogs : [];
  const fallbackTemplates = Array.isArray(templates) ? templates : [];

  const retryTemplates = logs
    .map((log) => log?.metadata?.original_template || log?.metadata?.template || null)
    .filter(Boolean);

  const finalTemplates = retryTemplates.length ? retryTemplates : fallbackTemplates;

  return executeBulkExecutiveActions({
    templates: finalTemplates,
    adminProfile,
    skipDuplicateCheck: true,
  });
}

export function buildQueueHealthAnalytics({
  queue = [],
  logs = [],
} = {}) {
  const queueRows = Array.isArray(queue) ? queue : [];
  const logRows = Array.isArray(logs) ? logs : [];

  const pending = queueRows.filter((item) => {
    const status = normalizeActionType(item.status || item.approval_status || item.queue_status || "");
    return status.includes("pending") || status.includes("queued") || status === "approval_required";
  });

  const approvalRequired = queueRows.filter((item) => {
    const payload = item?.payload || {};
    return (
      item.requiresApproval === true ||
      payload.approval_required === true ||
      normalizeActionType(item.approval_status) === "required" ||
      normalizeActionType(payload.queue_status) === "approval_required"
    );
  });

  const failed = logRows.filter((log) => {
    const status = normalizeActionType(log.status || "");
    return status.includes("failed") || status.includes("error");
  });

  const completed = logRows.filter((log) => {
    const status = normalizeActionType(log.status || "");
    return ["completed", "success", "executed"].includes(status);
  });

  const duplicateBlocked = logRows.filter(
    (log) =>
      log.duplicate_detected === true ||
      normalizeActionType(log.status) === "duplicate_blocked"
  );

  const oldestPending =
    pending.length > 0
      ? pending.reduce((oldest, item) => {
          const currentDate = new Date(item.created_at || item.createdAt || item.generated_at || Date.now());
          const oldestDate = new Date(oldest.created_at || oldest.createdAt || oldest.generated_at || Date.now());
          return currentDate < oldestDate ? item : oldest;
        })
      : null;

  const now = Date.now();
  const oldestPendingAgeHours = oldestPending
    ? Math.max(
        0,
        Math.round(
          (now -
            new Date(
              oldestPending.created_at ||
                oldestPending.createdAt ||
                oldestPending.generated_at ||
                Date.now()
            ).getTime()) /
            (1000 * 60 * 60)
        )
      )
    : 0;

  const totalFinished = completed.length + failed.length;

  const byAction = {};
  const byStatus = {};

  logRows.forEach((log) => {
    const action = normalizeActionType(log.action_type || "unknown");
    const status = normalizeActionType(log.status || "unknown");

    byAction[action] = (byAction[action] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  return {
    queueCount: queueRows.length,
    pendingCount: pending.length,
    approvalRequiredCount: approvalRequired.length,
    failedCount: failed.length,
    completedCount: completed.length,
    duplicateBlockedCount: duplicateBlocked.length,
    queuePressure: pending.length + approvalRequired.length + failed.length + duplicateBlocked.length,
    successRate: totalFinished ? Math.round((completed.length / totalFinished) * 100) : 0,
    failureRate: totalFinished ? Math.round((failed.length / totalFinished) * 100) : 0,
    oldestPending,
    oldestPendingAgeHours,
    byAction,
    byStatus,
  };
}

export function buildBulkExecutionSummary(results = {}) {
  const rows = Array.isArray(results?.results) ? results.results : [];

  return {
    total: results.total || rows.length || 0,
    successful: results.successful || rows.filter((result) => !result.error && !result.duplicate).length,
    failed: results.failed || rows.filter((result) => result.error && !result.duplicate).length,
    duplicateBlocked:
      results.duplicateBlocked || rows.filter((result) => result.duplicate).length,
    timedOut: results.timedOut || rows.filter((result) => result.timedOut).length,
    successRate:
      results.successRate ||
      (rows.length
        ? Math.round(
            (rows.filter((result) => !result.error && !result.duplicate).length /
              rows.length) *
              100
          )
        : 0),
    executedAt: results.executedAt || new Date().toISOString(),
  };
}