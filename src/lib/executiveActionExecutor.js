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

function buildTimelineMetadata(template = {}) {
  const payload = getPayload(template);

  return {
    source: "executive_action_executor",
    generated_by: payload.generated_by || "executive_ai",
    generated_at: payload.generated_at || null,

    action_type: normalizeActionType(template.actionType),
    recommendation_type: payload.recommendation_type || null,
    recommendation_priority: payload.recommendation_priority || null,
    approval_required: payload.approval_required === true,

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
  };
}

async function writeTimelineEvent({
  template,
  adminProfile,
  actionType,
  title,
  description,
  executionStatus = "completed",
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
        ...buildTimelineMetadata(template),
        execution_status: executionStatus,
      },
    });
  } catch (error) {
    console.warn("Executive timeline event failed:", error);
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
}) {
  return {
    data,
    error,
    actionType: actionType || normalizeActionType(template.actionType),
    targetTable,
    template,
    executedAt: new Date().toISOString(),
  };
}

export async function executeExecutiveActionTemplate({
  template,
  adminProfile = null,
}) {
  const validationError = validateTemplate(template);

  if (validationError) {
    return buildExecutionResult({
      data: null,
      error: validationError,
      template,
      actionType: normalizeActionType(template?.actionType),
    });
  }

  const actionType = normalizeActionType(template.actionType);

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

  return buildExecutionResult({
    data: null,
    error: new Error(`Unsupported executive action: ${template.actionType}`),
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
  }

  return buildExecutionResult({
    data: data || communicationPayload,
    error,
    template,
    actionType,
    targetTable: "student_communications",
  });
}