import { supabase } from "../lib/supabaseClient";

const AI_ANALYSIS_TABLE = "student_ai_analysis";
const EDGE_FUNCTION_NAME = "student-analysis";
const REQUEST_TIMEOUT_MS = 25000;

export const AI_ANALYSIS_TYPES = {
  STUDENT_ANALYSIS: "student_analysis",
  RISK_ANALYSIS: "risk_analysis",
  UNIVERSITY_RECOMMENDATION: "university_recommendation",
  COUNSELOR_COPILOT: "counselor_copilot",
  EMAIL_DRAFT: "email_draft",
  WHATSAPP_DRAFT: "whatsapp_draft",
};

const VALID_ANALYSIS_TYPES = Object.values(AI_ANALYSIS_TYPES);

function getNumericStudentId(studentId) {
  const numericId = Number(studentId);

  if (!Number.isFinite(numericId)) {
    return null;
  }

  return numericId;
}

async function withTimeout(promise, message = "Request timed out.") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

export function normalizeAnalysisType(analysisType = AI_ANALYSIS_TYPES.STUDENT_ANALYSIS) {
  return VALID_ANALYSIS_TYPES.includes(analysisType)
    ? analysisType
    : AI_ANALYSIS_TYPES.STUDENT_ANALYSIS;
}

export async function buildStudentAIDataPackage(student = {}) {
  if (!student?.id) {
    throw new Error("Student ID is required to build AI data package.");
  }

  const numericStudentId = getNumericStudentId(student.id);

  if (!numericStudentId) {
    throw new Error("Invalid student ID for AI data package.");
  }

  const studentType = student?.student_type || student?.type || "inquiry";

  const [
    documentsResult,
    tasksResult,
    communicationsResult,
    universitiesResult,
    applicationsResult,
    applicationTimelineResult,
    crmTimelineResult,
  ] = await Promise.allSettled([
    withTimeout(
      supabase
        .from("student_documents")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false }),
      "Documents loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_tasks")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false }),
      "Tasks loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_communications")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false }),
      "Communications loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_universities")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false }),
      "Universities loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_applications")
        .select("*")
        .eq("student_id", numericStudentId)
        .eq("student_type", studentType)
        .order("created_at", { ascending: false }),
      "Applications loading timed out."
    ),
    withTimeout(
      supabase
        .from("student_application_timeline")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(50),
      "Application timeline loading timed out."
    ),
    withTimeout(
      supabase
        .from("crm_timeline")
        .select("*")
        .eq("student_id", numericStudentId)
        .order("created_at", { ascending: false })
        .limit(50),
      "CRM timeline loading timed out."
    ),
  ]);

  const readResult = (result) => {
    if (result.status !== "fulfilled") return [];
    if (result.value?.error) return [];
    return result.value?.data || [];
  };

  const documents = readResult(documentsResult);
  const tasks = readResult(tasksResult);
  const communications = readResult(communicationsResult);
  const universities = readResult(universitiesResult);
  const applications = readResult(applicationsResult);
  const applicationTimeline = readResult(applicationTimelineResult);
  const crmTimeline = readResult(crmTimelineResult);

  const timeline = [
    ...crmTimeline.map((item) => ({
      ...item,
      source: "crm_timeline",
    })),
    ...applicationTimeline.map((item) => ({
      ...item,
      source: "student_application_timeline",
    })),
  ].sort((a, b) => {
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const packageWarnings = [
    documentsResult.status === "rejected" ? documentsResult.reason?.message : "",
    tasksResult.status === "rejected" ? tasksResult.reason?.message : "",
    communicationsResult.status === "rejected"
      ? communicationsResult.reason?.message
      : "",
    universitiesResult.status === "rejected"
      ? universitiesResult.reason?.message
      : "",
    applicationsResult.status === "rejected"
      ? applicationsResult.reason?.message
      : "",
    applicationTimelineResult.status === "rejected"
      ? applicationTimelineResult.reason?.message
      : "",
    crmTimelineResult.status === "rejected"
      ? crmTimelineResult.reason?.message
      : "",
  ].filter(Boolean);

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
    },
  };
}

export async function runStudentAIAnalysis({
  student,
  analysisType = AI_ANALYSIS_TYPES.STUDENT_ANALYSIS,
}) {
  if (!student?.id) {
    throw new Error("Student ID is required for AI analysis.");
  }

  const normalizedType = normalizeAnalysisType(analysisType);
  const studentPackage = await buildStudentAIDataPackage(student);

  const { data: aiData, error: functionError } = await supabase.functions.invoke(
    EDGE_FUNCTION_NAME,
    {
      body: {
        ...studentPackage,
        analysisType: normalizedType,
      },
    }
  );

  if (functionError) {
    throw new Error(functionError.message || "AI function failed.");
  }

  if (!aiData?.success) {
    throw new Error(aiData?.error || "AI analysis failed.");
  }

  const parsedAnalysis = parseAIAnalysis(aiData.analysis);

  const { data: savedAnalysis, error: saveError } = await supabase
    .from(AI_ANALYSIS_TABLE)
    .insert({
      student_id: studentPackage.studentId,
      analysis_type: normalizedType,
      analysis:
        typeof aiData.analysis === "string"
          ? aiData.analysis
          : JSON.stringify(aiData.analysis),
      risk_level: parsedAnalysis?.riskLevel || null,
      score:
        parsedAnalysis?.readinessScore ??
        parsedAnalysis?.riskScore ??
        null,
    })
    .select()
    .single();

  if (saveError) {
    throw new Error(saveError.message || "Failed to save AI analysis.");
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
  if (!studentId) return null;

  const numericStudentId = getNumericStudentId(studentId);

  if (!numericStudentId) return null;

  const normalizedType = normalizeAnalysisType(analysisType);

  const { data, error } = await supabase
    .from(AI_ANALYSIS_TABLE)
    .select("*")
    .eq("student_id", numericStudentId)
    .eq("analysis_type", normalizedType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load latest AI analysis.");
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
  if (!studentId) return [];

  const numericStudentId = getNumericStudentId(studentId);

  if (!numericStudentId) return [];

  const normalizedType = normalizeAnalysisType(analysisType);

  const { data, error } = await supabase
    .from(AI_ANALYSIS_TABLE)
    .select("*")
    .eq("student_id", numericStudentId)
    .eq("analysis_type", normalizedType)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load AI history.");
  }

  return (data || []).map((item) => ({
    ...item,
    parsed: parseAIAnalysis(item.analysis),
  }));
}

export async function getLatestStudentAIModules(studentId) {
  if (!studentId) return {};

  const numericStudentId = getNumericStudentId(studentId);

  if (!numericStudentId) return {};

  const { data, error } = await supabase
    .from(AI_ANALYSIS_TABLE)
    .select("*")
    .eq("student_id", numericStudentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load AI modules.");
  }

  const latestByType = {};

  (data || []).forEach((item) => {
    if (!item?.analysis_type) return;

    if (!latestByType[item.analysis_type]) {
      latestByType[item.analysis_type] = {
        ...item,
        parsed: parseAIAnalysis(item.analysis),
      };
    }
  });

  return latestByType;
}

export function parseAIAnalysis(value) {
  if (!value) return null;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    const cleaned = String(value)
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      return {
        summary: String(value),
        riskLevel: "Unknown",
        readinessScore: null,
        risks: [],
        recommendedActions: [],
      };
    }
  }
}