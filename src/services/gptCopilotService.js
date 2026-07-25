import { supabase } from "../lib/supabaseClient";

const GPT_REQUEST_TIMEOUT_MS = 45000;

const GPT_MODES = Object.freeze({
  summary: {
    label: "Smart Summary",
    category: "analysis",
  },

  whatsapp: {
    label: "WhatsApp Generator",
    category: "communication",
  },

  email: {
    label: "Email Generator",
    category: "communication",
  },

  next_action: {
    label: "Next Action",
    category: "strategy",
  },

  visa_risk: {
    label: "Visa Risk",
    category: "risk",
  },

  call_script: {
    label: "Call Script",
    category: "communication",
  },

  followup_plan: {
    label: "Follow-Up Plan",
    category: "strategy",
  },

  scholarship: {
    label: "Scholarship Analysis",
    category: "analysis",
  },

  objection_analysis: {
    label: "Objection Analysis",
    category: "risk",
  },

  counselor_strategy: {
    label: "Counselor Strategy",
    category: "strategy",
  },
});

function sanitizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function sanitizeText(value = "", fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

async function withTimeout(
  promise,
  message = "GPT Copilot request timed out.",
  timeoutMs = GPT_REQUEST_TIMEOUT_MS
) {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

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
  documents = [],

  leadScore = null,
  leadHealth = null,
  lastActivity = null,
  overdueStatus = null,

  extraContext = {},
} = {}) {
  const normalizedMode = sanitizeText(mode, "summary");
  const selectedMode = GPT_MODES[normalizedMode] || GPT_MODES.summary;
  const effectiveMode = GPT_MODES[normalizedMode] ? normalizedMode : "summary";

  const safeStudent = sanitizeObject(student);
  const safeStudentType = sanitizeText(studentType, "inquiry");
  const safeAdminName = sanitizeText(
    adminName,
    "Zaifan Consultancy Team"
  );

  const crmContext = {
    timeline: sanitizeArray(timeline),
    followUps: sanitizeArray(followUps),
    appointments: sanitizeArray(appointments),
    reminders: sanitizeArray(reminders),
    activityLogs: sanitizeArray(activityLogs),
    documents: sanitizeArray(documents),

    leadScore,
    leadHealth,
    lastActivity,
    overdueStatus,

    generatedAt: new Date().toISOString(),
    generatedBy: safeAdminName,
    modeCategory: selectedMode.category,

    extraContext: sanitizeObject(extraContext),
  };

  const payload = {
    mode: effectiveMode,
    modeLabel: selectedMode.label,
    student: safeStudent,
    studentType: safeStudentType,
    adminName: safeAdminName,
    crmContext,
  };

  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("zaifan-gpt-copilot", {
        body: payload,
      }),
      `${selectedMode.label} request timed out.`
    );

    if (error) {
      console.error("[GPT Copilot Error]", error);
      throw new Error(
        error.message || "Unable to contact GPT Copilot service."
      );
    }

    if (!data || data.success !== true) {
      throw new Error(
        data?.error || "GPT Copilot returned an invalid response."
      );
    }

    const text = sanitizeText(data.text);

    if (!text) {
      throw new Error("GPT Copilot returned an empty response.");
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("GPT Copilot request failed.");
  }
}

export { GPT_MODES };
