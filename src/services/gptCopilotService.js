import { supabase } from "../lib/supabaseClient";

export async function generateGptCopilotText({
  mode = "summary",
  student = {},
  studentType = "inquiry",
  adminName = "Zaifan Consultancy Team",
  timeline = [],
  followUps = [],
  appointments = [],
  reminders = [],
  activityLogs = [],
  leadScore = null,
  leadHealth = null,
  lastActivity = null,
  overdueStatus = null,
  documents = [],
  extraContext = {},
}) {
  const crmContext = {
    timeline,
    followUps,
    appointments,
    reminders,
    activityLogs,
    leadScore,
    leadHealth,
    lastActivity,
    overdueStatus,
    documents,
    extraContext,
  };

  const { data, error } = await supabase.functions.invoke(
    "zaifan-gpt-copilot",
    {
      body: {
        mode,
        student,
        studentType,
        adminName,
        crmContext,
      },
    }
  );

  if (error) throw error;

  if (!data?.success) {
    throw new Error(data?.error || "AI generation failed.");
  }

  return data.text;
}