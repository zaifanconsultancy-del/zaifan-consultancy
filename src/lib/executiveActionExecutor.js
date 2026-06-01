import { supabase } from "./supabaseClient";
import { createFollowUpReminder } from "./followUpReminders";
import { addTimelineEvent } from "./crmTimeline";

export async function executeExecutiveActionTemplate({
  template,
  adminProfile = null,
}) {
  if (!template?.actionType || !template?.payload) {
    return {
      data: null,
      error: new Error("Missing executive action template."),
    };
  }

  if (template.actionType === "create_task") {
    return await executeTaskTemplate({ template, adminProfile });
  }

  if (template.actionType === "schedule_call") {
    return await executeTaskTemplate({ template, adminProfile });
  }

  if (template.actionType === "create_reminder") {
    return await executeReminderTemplate({ template, adminProfile });
  }

  if (template.actionType === "send_email") {
    return await executeCommunicationTemplate({ template, adminProfile });
  }

  if (template.actionType === "send_whatsapp") {
    return await executeCommunicationTemplate({ template, adminProfile });
  }

  return {
    data: null,
    error: new Error(`Unsupported executive action: ${template.actionType}`),
  };
}

async function executeTaskTemplate({ template, adminProfile }) {
  const payload = {
    student_id: Number(template.payload.student_id),
    student_type: template.payload.student_type,
    title: template.payload.title,
    description: template.payload.description || "",
    priority: template.payload.priority || "medium",
    status: template.payload.status || "pending",
    due_date: template.payload.due_date || null,
    created_by: adminProfile?.id || null,
  };

  const { data, error } = await supabase
    .from("student_tasks")
    .insert(payload)
    .select()
    .single();

  if (!error) {
    await addTimelineEvent({
      studentId: template.payload.student_id,
      studentType: template.payload.student_type,
      actionType: "executive_task_created",
      title: "Executive AI created a task",
      description: payload.description || payload.title,
      adminProfile,
      metadata: {
        source: "executive_action_executor",
        action_type: template.actionType,
      },
    });
  }

  return { data, error };
}

async function executeReminderTemplate({ template, adminProfile }) {
  const { data, error } = await createFollowUpReminder({
    studentId: template.payload.student_id,
    studentType: template.payload.student_type,
    title: template.payload.title,
    notes: template.payload.notes || "",
    dueDate: template.payload.due_date,
    dueTime: template.payload.due_time || null,
    adminProfile,
  });

  if (!error) {
    await addTimelineEvent({
      studentId: template.payload.student_id,
      studentType: template.payload.student_type,
      actionType: "executive_reminder_created",
      title: "Executive AI created a reminder",
      description: template.payload.notes || template.payload.title,
      adminProfile,
      metadata: {
        source: "executive_action_executor",
        action_type: template.actionType,
      },
    });
  }

  return { data, error };
}

async function executeCommunicationTemplate({ template, adminProfile }) {
  const payload = {
    student_id: String(template.payload.student_id),
    student_type: template.payload.student_type,
    channel: template.payload.channel,
    subject: template.payload.subject || "",
    message: template.payload.message || "",
    status: template.payload.status || "draft",
  };

  const { data, error } = await supabase
    .from("student_communications")
    .insert(payload)
    .select()
    .single();

  if (!error) {
    await addTimelineEvent({
      studentId: template.payload.student_id,
      studentType: template.payload.student_type,
      actionType:
        template.actionType === "send_email"
          ? "executive_email_draft_saved"
          : "executive_whatsapp_draft_saved",
      title:
        template.actionType === "send_email"
          ? "Executive AI saved email draft"
          : "Executive AI saved WhatsApp draft",
      description: payload.message,
      adminProfile,
      metadata: {
        source: "executive_action_executor",
        action_type: template.actionType,
      },
    });
  }

  return { data, error };
}