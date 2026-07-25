import { supabase } from "../lib/supabaseClient";

const AI_ANALYSIS_TABLE = "student_ai_analysis";
const EDGE_FUNCTION_NAME = "student-analysis";

const REQUEST_TIMEOUT_MS = 25_000;
const AI_FUNCTION_TIMEOUT_MS = 45_000;
const SAVE_TIMEOUT_MS = 15_000;
const READ_TIMEOUT_MS = 15_000;

const PACKAGE_LIMITS = Object.freeze({
  documents: 100,
  tasks: 100,
  communications: 100,
  universities: 100,
  applications: 100,
  applicationTimeline: 50,
  crmTimeline: 50,
  analysisHistory: 100,
});

export const AI_ANALYSIS_TYPES = Object.freeze({
  STUDENT_ANALYSIS: "student_analysis",
  RISK_ANALYSIS: "risk_analysis",
  UNIVERSITY_RECOMMENDATION: "university_recommendation",
  COUNSELOR_COPILOT: "counselor_copilot",
  EMAIL_DRAFT: "email_draft",
  WHATSAPP_DRAFT: "whatsapp_draft",
});

const VALID_ANALYSIS_TYPES = new Set(Object.values(AI_ANALYSIS_TYPES));

function createServiceError(message, cause = null, code = "STUDENT_AI_ERROR") {
  const error = new Error(message);
  error.name = "StudentAIServiceError";
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function getErrorMessage(error, fallback) {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error?.message && String(error.message).trim()) {
    return String(error.message).trim();
  }
  return fallback;
}

function normalizeStudentType(value) {
  const normalized = String(value || "inquiry").trim().toLowerCase();
  return normalized || "inquiry";
}

function getNumericStudentId(studentId) {
  if (
    studentId === null ||
    studentId === undefined ||
    studentId === "" ||
    typeof studentId === "boolean"
  ) {
    return null;
  }

  const numericId = Number(studentId);
  return Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null;
}

function safeTimestamp(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function withTimeout(promiseLike, timeoutMs, message = "Request timed out.") {
  let timerId;

  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(createServiceError(message, null, "TIMEOUT"));
      }, timeoutMs);
    }),
  ]).finally(() => {
    if (timerId) clearTimeout(timerId);
  });
}

function getSettledRows(result, label, warnings) {
  if (result.status === "rejected") {
    warnings.push(
      `${label}: ${getErrorMessage(result.reason, `${label} could not be loaded.`)}`
    );
    return [];
  }

  if (result.value?.error) {
    warnings.push(
      `${label}: ${getErrorMessage(result.value.error, `${label} could not be loaded.`)}`
    );
    return [];
  }

  return Array.isArray(result.value?.data) ? result.value.data : [];
}

function buildTimeline(crmTimeline, applicationTimeline) {
  return [
    ...crmTimeline.map((item) => ({ ...item, source: "crm_timeline" })),
    ...applicationTimeline.map((item) => ({
      ...item,
      source: "student_application_timeline",
    })),
  ].sort((a, b) => safeTimestamp(b?.created_at) - safeTimestamp(a?.created_at));
}

function serializeAnalysis(value) {
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value ?? "");
  }
}

function getAnalysisScore(parsedAnalysis) {
  if (!parsedAnalysis || typeof parsedAnalysis !== "object") return null;

  const candidate =
    parsedAnalysis.readinessScore ??
    parsedAnalysis.riskScore ??
    parsedAnalysis.score ??
    null;

  if (candidate === null || candidate === undefined || candidate === "") {
    return null;
  }

  const score = Number(candidate);
  return Number.isFinite(score) ? score : null;
}

export function normalizeAnalysisType(
  analysisType = AI_ANALYSIS_TYPES.STUDENT_ANALYSIS
) {
  const normalized = String(analysisType || "").trim();

  return VALID_ANALYSIS_TYPES.has(normalized)
    ? normalized
    : AI_ANALYSIS_TYPES.STUDENT_ANALYSIS;
}

export async function buildStudentAIDataPackage(student = {}) {
  const numericStudentId = getNumericStudentId(student?.id);

  if (!numericStudentId) {
    throw createServiceError(
      "A valid student ID is required to build the AI data package.",
      null,
      "INVALID_STUDENT_ID"
    );
  }

  const studentType = normalizeStudentType(
    student?.student_type || student?.type || "inquiry"
  );

  const results = await Promise.allSettled([
    withTimeout(
      supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.documents),
      REQUEST_TIMEOUT_MS,
      "Documents loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_tasks")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.tasks),
      REQUEST_TIMEOUT_MS,
      "Tasks loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_communications")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.communications),
      REQUEST_TIMEOUT_MS,
      "Communications loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_universities")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.universities),
      REQUEST_TIMEOUT_MS,
      "Universities loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_applications")
        .select("*")
        .eq("student_id", numericStudentId)
        .eq("student_type", studentType)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.applications),
      REQUEST_TIMEOUT_MS,
      "Applications loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_application_timeline")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.applicationTimeline),
      REQUEST_TIMEOUT_MS,
      "Application timeline loading timed out."
    ),
    withTimeout(
      supabase
        .from("crm_timeline")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.crmTimeline),
      REQUEST_TIMEOUT_MS,
      "CRM timeline loading timed out."
    ),
  ]);

  const packageWarnings = [];

  const documents = getSettledRows(results[0], "Documents", packageWarnings);
  const tasks = getSettledRows(results[1], "Tasks", packageWarnings);
  const communications = getSettledRows(
    results[2],
    "Communications",
    packageWarnings
  );
  const universities = getSettledRows(
    results[3],
    "Universities",
    packageWarnings
  );
  const applications = getSettledRows(
    results[4],
    "Applications",
    packageWarnings
  );
  const applicationTimeline = getSettledRows(
    results[5],
    "Application timeline",
    packageWarnings
  );
  const crmTimeline = getSettledRows(
    results[6],
    "CRM timeline",
    packageWarnings
  );

  const timeline = buildTimeline(crmTimeline, applicationTimeline);

  return {
    studentId: numericStudentId,
    studentType,
    studentName:
      student.full_name ||
      student.name ||
      student.student_name ||
      "Unknown Student",
    country:
      student.country ||
      student.preferred_country ||
      student.destination_country ||
      "Not specified",
    status: student.status || student.stage || "Not specified",
    student,
    documents,
    tasks,
    communications,
    universities,
    applications,
    timeline,
    packageWarnings,
    dataSummary: {
      documents: documents.length,
      tasks: tasks.length,
      communications: communications.length,
      universities: universities.length,
      applications: applications.length,
      timeline: timeline.length,
      warnings: packageWarnings.length,
    },
  };
}

export async function runStudentAIAnalysis({
  student,
  analysisType = AI_ANALYSIS_TYPES.STUDENT_ANALYSIS,
} = {}) {
  if (!getNumericStudentId(student?.id)) {
    throw createServiceError(
      "A valid student ID is required for AI analysis.",
      null,
      "INVALID_STUDENT_ID"
    );
  }

  const normalizedType = normalizeAnalysisType(analysisType);
  const studentPackage = await buildStudentAIDataPackage(student);

  let functionResponse;

  try {
    functionResponse = await withTimeout(
      supabase.functions.invoke(EDGE_FUNCTION_NAME, {
        body: {
          ...studentPackage,
          analysisType: normalizedType,
        },
      }),
      AI_FUNCTION_TIMEOUT_MS,
      "AI analysis timed out. Please try again."
    );
  } catch (error) {
    throw createServiceError(
      getErrorMessage(error, "AI analysis service could not be reached."),
      error,
      error?.code || "AI_FUNCTION_FAILED"
    );
  }

  const { data: aiData, error: functionError } = functionResponse || {};

  if (functionError) {
    throw createServiceError(
      getErrorMessage(functionError, "AI function failed."),
      functionError,
      "AI_FUNCTION_FAILED"
    );
  }

  if (!aiData?.success) {
    throw createServiceError(
      getErrorMessage(aiData?.error, "AI analysis failed."),
      null,
      "AI_ANALYSIS_FAILED"
    );
  }

  if (aiData.analysis === undefined || aiData.analysis === null) {
    throw createServiceError(
      "AI analysis returned no analysis content.",
      null,
      "EMPTY_AI_RESPONSE"
    );
  }

  const parsedAnalysis = parseAIAnalysis(aiData.analysis);

  let saveResponse;

  try {
    saveResponse = await withTimeout(
      supabase
        .from(AI_ANALYSIS_TABLE)
        .insert({
          student_id: studentPackage.studentId,
          analysis_type: normalizedType,
          analysis: serializeAnalysis(aiData.analysis),
          risk_level:
            parsedAnalysis?.riskLevel ??
            parsedAnalysis?.risk_level ??
            null,
          score: getAnalysisScore(parsedAnalysis),
        })
        .select()
        .single(),
      SAVE_TIMEOUT_MS,
      "Saving AI analysis timed out."
    );
  } catch (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to save AI analysis."),
      error,
      error?.code || "AI_ANALYSIS_SAVE_FAILED"
    );
  }

  const { data: savedAnalysis, error: saveError } = saveResponse || {};

  if (saveError) {
    throw createServiceError(
      getErrorMessage(saveError, "Failed to save AI analysis."),
      saveError,
      "AI_ANALYSIS_SAVE_FAILED"
    );
  }

  return {
    raw: aiData.analysis,
    parsed: parsedAnalysis,
    saved: savedAnalysis,
    studentPackage,
    analysisType: normalizedType,
  };
}

export async function getLatestStudentAIAnalysis(
  studentId,
  analysisType = AI_ANALYSIS_TYPES.STUDENT_ANALYSIS
) {
  const numericStudentId = getNumericStudentId(studentId);
  if (!numericStudentId) return null;

  const normalizedType = normalizeAnalysisType(analysisType);

  let response;

  try {
    response = await withTimeout(
      supabase
        .from(AI_ANALYSIS_TABLE)
        .select("*")
        .eq("student_id", numericStudentId)
        .eq("analysis_type", normalizedType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      READ_TIMEOUT_MS,
      "Loading the latest AI analysis timed out."
    );
  } catch (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to load latest AI analysis."),
      error,
      error?.code || "AI_ANALYSIS_READ_FAILED"
    );
  }

  const { data, error } = response || {};

  if (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to load latest AI analysis."),
      error,
      "AI_ANALYSIS_READ_FAILED"
    );
  }

  if (!data) return null;

  return {
    ...data,
    parsed: parseAIAnalysis(data.analysis),
  };
}

export async function getStudentAIAnalysisHistory(
  studentId,
  analysisType = AI_ANALYSIS_TYPES.STUDENT_ANALYSIS
) {
  const numericStudentId = getNumericStudentId(studentId);
  if (!numericStudentId) return [];

  const normalizedType = normalizeAnalysisType(analysisType);

  let response;

  try {
    response = await withTimeout(
      supabase
        .from(AI_ANALYSIS_TABLE)
        .select("*")
        .eq("student_id", numericStudentId)
        .eq("analysis_type", normalizedType)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.analysisHistory),
      READ_TIMEOUT_MS,
      "Loading AI analysis history timed out."
    );
  } catch (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to load AI history."),
      error,
      error?.code || "AI_HISTORY_READ_FAILED"
    );
  }

  const { data, error } = response || {};

  if (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to load AI history."),
      error,
      "AI_HISTORY_READ_FAILED"
    );
  }

  return (Array.isArray(data) ? data : []).map((item) => ({
    ...item,
    parsed: parseAIAnalysis(item.analysis),
  }));
}

export async function getLatestStudentAIModules(studentId) {
  const numericStudentId = getNumericStudentId(studentId);
  if (!numericStudentId) return {};

  let response;

  try {
    response = await withTimeout(
      supabase
        .from(AI_ANALYSIS_TABLE)
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(PACKAGE_LIMITS.analysisHistory),
      READ_TIMEOUT_MS,
      "Loading AI modules timed out."
    );
  } catch (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to load AI modules."),
      error,
      error?.code || "AI_MODULES_READ_FAILED"
    );
  }

  const { data, error } = response || {};

  if (error) {
    throw createServiceError(
      getErrorMessage(error, "Failed to load AI modules."),
      error,
      "AI_MODULES_READ_FAILED"
    );
  }

  const latestByType = {};

  for (const item of Array.isArray(data) ? data : []) {
    const type = item?.analysis_type;
    if (!type || latestByType[type]) continue;

    latestByType[type] = {
      ...item,
      parsed: parseAIAnalysis(item.analysis),
    };
  }

  return latestByType;
}

export function parseAIAnalysis(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const candidates = [
    raw,
    raw
      .replace(/^\s*```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim(),
  ];

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(raw.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      return JSON.parse(candidate);
    } catch {
      // Continue through safe parsing candidates.
    }
  }

  return {
    summary: raw,
    riskLevel: "Unknown",
    readinessScore: null,
    risks: [],
    recommendedActions: [],
  };
}
