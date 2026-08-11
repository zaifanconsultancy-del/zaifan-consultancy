// gptCopilotService CASE BRAIN V2.2 — MODE-AWARE REQUEST TIMEOUT
// - standard modes remain 45s; Student 360 Case Brief gets 120s
// gptCopilotService CASE BRAIN V2.1 — REAL EDGE ERROR DIAGNOSTICS
// Surfaces the actual Supabase Edge Function/OpenAI error instead of generic non-2xx text.
// gptCopilotService STUDENT CASE BRAIN V2
// Preserves legacy callers while forwarding the complete Student 360 case context.

import { supabase } from "../lib/supabaseClient";

const GPT_REQUEST_TIMEOUT_MS = 45_000;
const CASE_BRIEF_REQUEST_TIMEOUT_MS = 120_000;

const GPT_MODES = Object.freeze({
  summary: { label: "Smart Summary", category: "analysis" },
  whatsapp: { label: "WhatsApp Generator", category: "communication" },
  email: { label: "Email Generator", category: "communication" },
  next_action: { label: "Next Action", category: "strategy" },
  visa_risk: { label: "Visa Risk", category: "risk" },
  call_script: { label: "Call Script", category: "communication" },
  followup_plan: { label: "Follow-Up Plan", category: "strategy" },
  scholarship: { label: "Scholarship Analysis", category: "analysis" },
  objection_analysis: { label: "Objection Analysis", category: "risk" },
  counselor_strategy: { label: "Counselor Strategy", category: "strategy" },
  case_brief: { label: "Student 360 Case Brief", category: "operations" },
  gap_audit: { label: "Student 360 Gap Audit", category: "operations" },
  sop_draft: { label: "SOP Draft", category: "documents" },
  cv_draft: { label: "CV Draft", category: "documents" },
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


async function getEdgeFunctionErrorMessage(
  error,
  fallback = "Unable to contact GPT Copilot service."
) {
  if (!error) return fallback;

  const response = error?.context;

  if (response && typeof response === "object") {
    try {
      const status = Number(response.status) || null;

      try {
        const jsonResponse =
          typeof response.clone === "function" ? response.clone() : response;

        if (typeof jsonResponse.json === "function") {
          const payload = await jsonResponse.json();

          if (payload && typeof payload === "object") {
            const detail = sanitizeText(
              payload.error ||
                payload.message ||
                payload.details ||
                payload.hint ||
                ""
            );

            const code = sanitizeText(
              payload.code ||
                payload.error_code ||
                payload.type ||
                ""
            );

            if (detail) {
              return [
                status ? `Edge Function HTTP ${status}` : "",
                code ? `[${code}]` : "",
                detail,
              ]
                .filter(Boolean)
                .join(" ");
            }
          }
        }
      } catch {
        // Try plain text below.
      }

      try {
        const textResponse =
          typeof response.clone === "function" ? response.clone() : response;

        if (typeof textResponse.text === "function") {
          const rawText = sanitizeText(await textResponse.text());

          if (rawText) {
            return status
              ? `Edge Function HTTP ${status}: ${rawText}`
              : rawText;
          }
        }
      } catch {
        // Fall through.
      }

      if (status) {
        const normalMessage = sanitizeText(error?.message);

        return normalMessage
          ? `Edge Function HTTP ${status}: ${normalMessage}`
          : `Edge Function HTTP ${status}`;
      }
    } catch {
      // Fall through.
    }
  }

  return sanitizeText(
    error?.message ||
      error?.details ||
      error?.hint ||
      fallback,
    fallback
  );
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
  caseContext = {},
  ...restContext
} = {}) {
  const normalizedMode = sanitizeText(mode, "summary");
  const selectedMode = GPT_MODES[normalizedMode] || GPT_MODES.summary;
  const effectiveMode = GPT_MODES[normalizedMode] ? normalizedMode : "summary";

  const safeStudent = sanitizeObject(student);
  const safeStudentType = sanitizeText(studentType, "inquiry");
  const safeAdminName = sanitizeText(adminName, "Zaifan Consultancy Team");
  const safeCaseContext = sanitizeObject(caseContext);
  const safeRestContext = sanitizeObject(restContext);

  const chooseArray = (key, fallback) => {
    const fromCase = safeCaseContext[key];
    if (Array.isArray(fromCase)) return fromCase;

    const fromRest = safeRestContext[key];
    if (Array.isArray(fromRest)) return fromRest;

    return sanitizeArray(fallback);
  };

  // Preserve every canonical Student 360 field. Legacy top-level arguments still
  // win only where no Case Brain value exists, so old callers remain compatible.
  const crmContext = {
    ...safeRestContext,
    ...safeCaseContext,

    timeline: chooseArray("timeline", timeline),
    followUps: chooseArray("followUps", followUps),
    appointments: chooseArray("appointments", appointments),
    reminders: chooseArray("reminders", reminders),
    activityLogs: chooseArray("activityLogs", activityLogs),
    documents: chooseArray("documents", documents),

    leadScore: safeCaseContext.leadScore ?? safeRestContext.leadScore ?? leadScore,
    leadHealth: safeCaseContext.leadHealth ?? safeRestContext.leadHealth ?? leadHealth,
    lastActivity: safeCaseContext.lastActivity ?? safeRestContext.lastActivity ?? lastActivity,
    overdueStatus:
      safeCaseContext.overdueStatus ?? safeRestContext.overdueStatus ?? overdueStatus,

    generatedAt: new Date().toISOString(),
    generatedBy: safeAdminName,
    modeCategory: selectedMode.category,

    extraContext: {
      ...sanitizeObject(safeRestContext.extraContext),
      ...sanitizeObject(safeCaseContext.extraContext),
      ...sanitizeObject(extraContext),
    },
  };

  const payload = {
    mode: effectiveMode,
    modeLabel: selectedMode.label,
    student: safeStudent,
    studentType: safeStudentType,
    adminName: safeAdminName,
    crmContext,
  };

  const requestTimeoutMs =
    effectiveMode === "case_brief"
      ? CASE_BRIEF_REQUEST_TIMEOUT_MS
      : GPT_REQUEST_TIMEOUT_MS;

  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke("zaifan-gpt-copilot", {
        body: payload,
      }),
      `${selectedMode.label} request timed out after ${Math.round(
        requestTimeoutMs / 1000
      )} seconds.`,
      requestTimeoutMs
    );

    if (error) {
      console.error("[GPT Copilot Error]", error);

      const detailedMessage = await getEdgeFunctionErrorMessage(
        error,
        "Unable to contact GPT Copilot service."
      );

      throw new Error(detailedMessage);
    }

    if (!data || data.success !== true) {
      throw new Error(data?.error || "GPT Copilot returned an invalid response.");
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
