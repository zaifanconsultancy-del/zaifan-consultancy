import { supabase } from "./supabaseClient";
import { createFollowUpReminder } from "./followUpReminders";
import { addTimelineEvent } from "./crmTimeline";

function toNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

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
  return getPayload(template).student_id || template.student_id || null;
}

function getStudentType(template = {}) {
  return getPayload(template).student_type || template.student_type || "inquiry";
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

function buildDuplicateKey(template = {}) {
  const payload = getPayload(template);

  return (
    template.duplicateKey ||
    payload.duplicate_protection_key ||
    [
      getStudentId(template),
      getStudentType(template),
      payload.recommendation_type || "recommendation",
      normalizeActionType(template.actionType),
      payload.title || template.title || "",
    ].join("::")
  );
}

function buildTimelineMetadata(template = {}, extra = {}) {
  const payload = getPayload(template);

  return {
    source: "executive_action_executor_v2",
    generated_by: payload.generated_by || "executive_ai",
    generated_at: payload.generated_at || null,
    automation_version: payload.automation_version || "v2",
    automation_source: payload.automation_source || "student_os_executive_ai",

    action_type: normalizeActionType(template.actionType),
    duplicate_protection_key: buildDuplicateKey(template),

    recommendation_type: payload.recommendation_type || null,
    recommendation_priority: payload.recommendation_priority || null,
    approval_required: payload.approval_required === true,
    approval_reason: payload.approval_reason || null,

    executive_category: payload.executive_category || template.executive_category || null,
    priority_level: payload.priority_level || null,
    risk_level: payload.risk_level || null,
    risk_score: payload.risk_score ?? template.risk_score ?? null,
    opportunity_score: payload.opportunity_score ?? template.opportunity_score ?? null,

    journey_stage: payload.journey_stage || template.journey_stage || null,
    application_status: payload.application_status || template.application_status || null,
    offer_status: payload.offer_status || template.offer_status || null,
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
  try {
    await addTimelineEvent({
      studentId: getStudentId(template),
      studentType: getStudentType(template),
      actionType,
      title,
      description,
      adminProfile,
      metadata: {
        ...buildTimelineMetadata(template, metadata),
        execution_status: executionStatus,
      },
    });
  } catch (error) {
    console.warn("Executive timeline event failed:", error);
  }
}

async function writeExecutionLog({
  template,
  adminProfile,
  status = "completed",
  targetTable = "",
  targetId = null,
  error = null,
  metadata = {},
}) {
  const payload = getPayload(template);
  const actionType = normalizeActionType(template.actionType);

  const logPayload = {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    student_name: payload.student_name || "",
    action_type: actionType,
    recommendation_type: payload.recommendation_type || "",
    recommendation_priority: payload.recommendation_priority || payload.priority || "medium",
    title: getTemplateTitle(template),
    description: getTemplateDescription(template),
    status,
    target_table: targetTable || "",
    target_id: targetId ? String(targetId) : null,
    duplicate_key: buildDuplicateKey(template),
    approval_required: payload.approval_required === true,
    approval_reason: payload.approval_reason || "",
    executed_by: getAdminId(adminProfile),
    executed_by_name: getAdminName(adminProfile),
    error_message: error?.message || error || "",
    metadata: buildTimelineMetadata(template, metadata),
  };

  try {
    const { data, error: logError } = await supabase
      .from("executive_execution_logs")
      .insert(logPayload)
      .select()
      .single();

    if (logError) {
      console.warn("Executive execution log insert failed:", logError);
      return { data: null, error: logError };
    }

    return { data, error: null };
  } catch (err) {
    console.warn("Executive execution log crashed:", err);
    return { data: null, error: err };
  }
}

async function checkDuplicateExecution(template = {}) {
  const duplicateKey = buildDuplicateKey(template);

  if (!duplicateKey) {
    return { duplicate: false, data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from("executive_execution_logs")
      .select("*")
      .eq("duplicate_key", duplicateKey)
      .in("status", ["completed", "success", "executed"])
      .limit(1);

    if (error) {
      console.warn("Executive duplicate check failed:", error);
      return { duplicate: false, data: null, error };
    }

    return {
      duplicate: Array.isArray(data) && data.length > 0,
      data: Array.isArray(data) ? data[0] : null,
      error: null,
    };
  } catch (err) {
    console.warn("Executive duplicate check crashed:", err);
    return { duplicate: false, data: null, error: err };
  }
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
}) {
  return {
    data,
    error,
    actionType: actionType || normalizeActionType(template.actionType),
    targetTable,
    template,
    duplicate,
    skipped,
    duplicateKey: buildDuplicateKey(template),
    executedAt: new Date().toISOString(),
  };
}

export async function executeExecutiveActionTemplate({
  template,
  adminProfile = null,
  skipDuplicateCheck = false,
}) {
  const validationError = validateTemplate(template);

  if (validationError) {
    await writeExecutionLog({
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

      await writeExecutionLog({
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

  const unsupportedError = new Error(`Unsupported executive action: ${template.actionType}`);

  await writeExecutionLog({
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

async function executeTaskTemplate({ template, adminProfile, isCallTask = false }) {
  const payload = getPayload(template);
  const actionType = isCallTask ? "schedule_call" : "create_task";

  const taskPayload = {
    student_id: toNumberOrNull(getStudentId(template)),
    student_type: getStudentType(template),
    title: getTemplateTitle(template, isCallTask ? "Executive Call Task" : "Executive Task"),
    description: getTemplateDescription(template),
    priority: payload.priority || (isCallTask ? "high" : "medium"),
    status: payload.status || "pending",
    due_date: payload.due_date || null,
    created_by: getAdminId(adminProfile),
  };

  const { data, error } = await supabase
    .from("student_tasks")
    .insert(taskPayload)
    .select()
    .single();

  if (!error) {
    await writeTimelineEvent({
      template,
      adminProfile,
      actionType: isCallTask ? "executive_call_task_created" : "executive_task_created",
      title: isCallTask
        ? "Executive AI created a call task"
        : "Executive AI created a task",
      description: taskPayload.description || taskPayload.title,
      metadata: {
        target_table: "student_tasks",
        target_id: data?.id || null,
      },
    });

    await writeExecutionLog({
      template,
      adminProfile,
      status: "completed",
      targetTable: "student_tasks",
      targetId: data?.id || null,
      metadata: {
        created_payload: taskPayload,
      },
    });
  }

  if (error) {
    console.error("Executive task execution failed:", error);

    await writeTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_action_failed",
      title: "Executive AI task execution failed",
      description: error.message || "Task execution failed.",
      executionStatus: "failed",
    });

    await writeExecutionLog({
      template,
      adminProfile,
      status: "failed",
      targetTable: "student_tasks",
      error,
      metadata: {
        attempted_payload: taskPayload,
      },
    });
  }

  return buildExecutionResult({
    data: data || taskPayload,
    error,
    template,
    actionType,
    targetTable: "student_tasks",
  });
}

async function executeReminderTemplate({ template, adminProfile }) {
  const payload = getPayload(template);

  const { data, error } = await createFollowUpReminder({
    studentId: getStudentId(template),
    studentType: getStudentType(template),
    title: getTemplateTitle(template, "Executive Follow-Up"),
    notes: payload.notes || payload.summary || getTemplateDescription(template),
    dueDate: payload.due_date || payload.dueDate || null,
    dueTime: payload.due_time || payload.dueTime || null,
    adminProfile,
  });

  if (!error) {
    await writeTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_reminder_created",
      title: "Executive AI created a reminder",
      description:
        payload.notes ||
        payload.summary ||
        payload.title ||
        "Executive reminder created",
      metadata: {
        target_table: "follow_up_reminders",
        target_id: data?.id || null,
      },
    });

    await writeExecutionLog({
      template,
      adminProfile,
      status: "completed",
      targetTable: "follow_up_reminders",
      targetId: data?.id || null,
      metadata: {
        created_payload: data || payload,
      },
    });
  }

  if (error) {
    console.error("Executive reminder execution failed:", error);

    await writeTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_action_failed",
      title: "Executive AI reminder execution failed",
      description: error.message || "Reminder execution failed.",
      executionStatus: "failed",
    });

    await writeExecutionLog({
      template,
      adminProfile,
      status: "failed",
      targetTable: "follow_up_reminders",
      error,
      metadata: {
        attempted_payload: payload,
      },
    });
  }

  return buildExecutionResult({
    data,
    error,
    template,
    actionType: "create_reminder",
    targetTable: "follow_up_reminders",
  });
}

async function executeCommunicationTemplate({
  template,
  adminProfile,
  channel = "whatsapp",
}) {
  const payload = getPayload(template);
  const actionType = normalizeActionType(template.actionType);

  const communicationPayload = {
    student_id: String(getStudentId(template) || ""),
    student_type: getStudentType(template),
    channel: payload.channel || channel,
    subject: payload.subject || "",
    message: payload.message || payload.body || "",
    status: payload.status || "draft",
  };

  const { data, error } = await supabase
    .from("student_communications")
    .insert(communicationPayload)
    .select()
    .single();

  if (!error) {
    await writeTimelineEvent({
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
      description: communicationPayload.message,
      metadata: {
        target_table: "student_communications",
        target_id: data?.id || null,
      },
    });

    await writeExecutionLog({
      template,
      adminProfile,
      status: "completed",
      targetTable: "student_communications",
      targetId: data?.id || null,
      metadata: {
        created_payload: communicationPayload,
      },
    });
  }

  if (error) {
    console.error("Executive communication execution failed:", error);

    await writeTimelineEvent({
      template,
      adminProfile,
      actionType: "executive_action_failed",
      title: "Executive AI communication execution failed",
      description: error.message || "Communication execution failed.",
      executionStatus: "failed",
    });

    await writeExecutionLog({
      template,
      adminProfile,
      status: "failed",
      targetTable: "student_communications",
      error,
      metadata: {
        attempted_payload: communicationPayload,
      },
    });
  }

  return buildExecutionResult({
    data: data || communicationPayload,
    error,
    template,
    actionType,
    targetTable: "student_communications",
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
    .order("created_at", { ascending: false })
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
    if (log.approval_required) analytics.approvalRequired += 1;

    if (actionType === "create_task") analytics.tasks += 1;
    if (actionType === "create_reminder") analytics.reminders += 1;
    if (actionType === "schedule_call") analytics.calls += 1;
    if (actionType === "send_email") analytics.emails += 1;
    if (actionType === "send_whatsapp") analytics.whatsapp += 1;
  });

  analytics.successRate = analytics.total
    ? Math.round((analytics.completed / analytics.total) * 100)
    : 0;

  return analytics;
}