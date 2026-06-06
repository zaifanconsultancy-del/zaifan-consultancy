import { supabase } from "./supabaseClient";
import {
  calculatePortfolioHealth,
  saveExecutiveRiskScore,
} from "./executiveAI";

function normalizeStatus(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function groupByStudent(items = []) {
  const map = new Map();

  for (const item of items || []) {
    const studentId = String(item.student_id || item.lead_id || item.id || "");
    if (!studentId) continue;

    if (!map.has(studentId)) map.set(studentId, []);
    map.get(studentId).push(item);
  }

  return map;
}

function getHighestApplicationStatus(applications = []) {
  const rank = {
    enrolled: 120,
    visa_approved: 110,
    approved: 105,
    visa_pending: 100,
    visa: 95,
    cas_issued: 90,
    cas_pending: 85,
    offer_accepted: 80,
    accepted: 75,
    offer_received: 70,
    offer: 65,
    under_review: 55,
    review: 50,
    submitted: 45,
    applied: 40,
    in_progress: 30,
    started: 28,
    draft: 25,
    documents_pending: 20,
    docs_pending: 20,
    not_started: 10,
  };

  let best = "not_started";
  let bestScore = 0;

  for (const app of applications) {
    const status = normalizeStatus(app.application_status || app.status);
    const score = rank[status] || 0;

    if (score > bestScore) {
      best = status;
      bestScore = score;
    }
  }

  return best;
}

function getHighestOfferStatus(applications = []) {
  const rank = {
    offer_accepted: 100,
    accepted: 95,
    confirmed: 90,
    unconditional_offer: 85,
    conditional_offer: 82,
    offer_received: 80,
    received: 75,
    offer: 70,
    rejected: 20,
    pending: 10,
  };

  let best = "";
  let bestScore = 0;

  for (const app of applications) {
    const status = normalizeStatus(app.offer_status);
    const score = rank[status] || 0;

    if (score > bestScore) {
      best = status;
      bestScore = score;
    }
  }

  return best;
}

function getHighestVisaStatus(applications = []) {
  const rank = {
    visa_approved: 100,
    approved: 95,
    visa_pending: 80,
    under_review: 75,
    review: 70,
    submitted: 65,
    processing: 60,
    pending: 55,
    rejected: 25,
    visa_rejected: 20,
    refused: 20,
    visa_refused: 20,
  };

  let best = "";
  let bestScore = 0;

  for (const app of applications) {
    const status = normalizeStatus(app.visa_status);
    const score = rank[status] || 0;

    if (score > bestScore) {
      best = status;
      bestScore = score;
    }
  }

  return best;
}

function getJourneyStage({ applicationStatus, offerStatus, visaStatus }) {
  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review", "processing"].includes(visaStatus)) {
    return "visa_pending";
  }

  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";

  if (
    ["offer_accepted", "accepted", "confirmed"].includes(applicationStatus) ||
    ["offer_accepted", "accepted", "confirmed"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(applicationStatus) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(offerStatus)
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (["started", "draft", "in_progress", "documents_pending", "docs_pending"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getDocumentStatus(documents = []) {
  if (!documents.length) return "documents_pending";

  const completed = documents.filter((doc) => {
    const status = normalizeStatus(doc.status || doc.document_status);
    return ["completed", "approved", "uploaded", "verified", "received"].includes(status);
  }).length;

  if (completed === documents.length) return "documents_completed";
  if (completed > 0) return "documents_partial";
  return "documents_pending";
}

function getTaskStatus(tasks = []) {
  const pending = tasks.filter((task) => {
    const status = normalizeStatus(task.status);
    return !["completed", "done", "closed"].includes(status);
  }).length;

  const overdue = tasks.filter((task) => {
    if (!task.due_date) return false;

    const status = normalizeStatus(task.status);
    return (
      !["completed", "done", "closed"].includes(status) &&
      new Date(task.due_date) < new Date()
    );
  }).length;

  return {
    pending_tasks_count: pending,
    overdue_tasks_count: overdue,
  };
}

function getUniversityPlanStatus(universities = []) {
  const dream = universities.filter(
    (u) => normalizeStatus(u.category || u.university_type) === "dream"
  ).length;

  const target = universities.filter(
    (u) => normalizeStatus(u.category || u.university_type) === "target"
  ).length;

  const safe = universities.filter(
    (u) => normalizeStatus(u.category || u.university_type) === "safe"
  ).length;

  return {
    dream_universities_count: dream,
    target_universities_count: target,
    safe_universities_count: safe,

    dream_university_count: dream,
    target_university_count: target,
    safe_university_count: safe,

    university_plan_count: universities.length,
    has_university_plan: universities.length > 0,
    has_balanced_university_plan: dream > 0 && target > 0 && safe > 0,
  };
}

function mergeStudentOSData({
  student,
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
  existingRiskScores = [],
}) {
  const latestRiskScore = existingRiskScores?.[0] || null;

  const applicationStatus = getHighestApplicationStatus(applications);
  const offerStatus = getHighestOfferStatus(applications);
  const visaStatus = getHighestVisaStatus(applications);
  const journeyStage = getJourneyStage({
    applicationStatus,
    offerStatus,
    visaStatus,
  });

  const taskStatus = getTaskStatus(tasks);
  const universityStatus = getUniversityPlanStatus(universities);

  return {
    ...student,

    student_type:
      student.student_type || student.__leadType || student.type || "inquiry",

    applications,
    documents,
    tasks,
    universities,

    application_count: applications.length,
    document_count: documents.length,
    task_count: tasks.length,

    application_status: applicationStatus,
    offer_status: offerStatus,
    visa_status: visaStatus,
    journey_stage: journeyStage,
    document_status: getDocumentStatus(documents),

    ...taskStatus,
    ...universityStatus,

    previous_risk_score: latestRiskScore?.risk_score || null,
    previous_opportunity_score: latestRiskScore?.opportunity_score || null,
    previous_priority_level: latestRiskScore?.priority_level || null,
    previous_risk_level: latestRiskScore?.risk_level || null,
  };
}

async function loadTable(tableName, options = {}) {
  let query = supabase.from(tableName).select("*");

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? false });
  }

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${tableName} load timed out.`)), 12000);
  });

  try {
    const result = await Promise.race([query, timeoutPromise]);

    return {
      data: result.data || [],
      error: result.error || null,
      tableName,
    };
  } catch (error) {
    return {
      data: [],
      error,
      tableName,
    };
  }
}

export async function loadExecutiveStudents() {
  const [
    inquiriesResult,
    appointmentsResult,
    applicationsResult,
    documentsResult,
    tasksResult,
    universitiesResult,
    riskScoresResult,
  ] = await Promise.all([
    loadTable("inquiries", { orderBy: "created_at", ascending: false }),
    loadTable("appointments", { orderBy: "created_at", ascending: false }),
    loadTable("student_applications"),
    loadTable("student_documents"),
    loadTable("student_tasks"),
    loadTable("student_universities"),
    loadTable("ai_student_risk_scores", {
      orderBy: "generated_at",
      ascending: false,
    }),
  ]);

  const inquiries = (inquiriesResult.data || []).map((student) => ({
    ...student,
    __leadType: "inquiry",
    student_type: "inquiry",
  }));

  const appointments = (appointmentsResult.data || []).map((student) => ({
    ...student,
    __leadType: "appointment",
    student_type: "appointment",
  }));

  const baseStudents = [...inquiries, ...appointments];

  const applicationsByStudent = groupByStudent(applicationsResult.data || []);
  const documentsByStudent = groupByStudent(documentsResult.data || []);
  const tasksByStudent = groupByStudent(tasksResult.data || []);
  const universitiesByStudent = groupByStudent(universitiesResult.data || []);
  const riskScoresByStudent = groupByStudent(riskScoresResult.data || []);

  const students = baseStudents.map((student) => {
    const studentId = String(student.id);

    return mergeStudentOSData({
      student,
      applications: applicationsByStudent.get(studentId) || [],
      documents: documentsByStudent.get(studentId) || [],
      tasks: tasksByStudent.get(studentId) || [],
      universities: universitiesByStudent.get(studentId) || [],
      existingRiskScores: riskScoresByStudent.get(studentId) || [],
    });
  });

  const blockingErrors = [
    inquiriesResult.error,
    applicationsResult.error,
    documentsResult.error,
    tasksResult.error,
    universitiesResult.error,
    riskScoresResult.error,
  ].filter(Boolean);

  const nonBlockingErrors = [appointmentsResult.error].filter(Boolean);

  return {
    students,

    inquiriesError: inquiriesResult.error,
    appointmentsError: appointmentsResult.error,
    applicationsError: applicationsResult.error,
    documentsError: documentsResult.error,
    tasksError: tasksResult.error,
    universitiesError: universitiesResult.error,
    riskScoresError: riskScoresResult.error,

    errors: blockingErrors,
    warnings: nonBlockingErrors,
  };
}

export async function generateExecutiveScoresForStudents(students = []) {
  const portfolio = calculatePortfolioHealth(students);
  const saved = [];
  const failed = [];

  for (const student of students) {
    const normalizedStudent = {
      ...student,
      student_type:
        student?.student_type ||
        student?.__leadType ||
        student?.type ||
        "inquiry",
    };

    const saveTimeout = new Promise((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              `Saving executive score timed out for ${
                normalizedStudent.full_name || normalizedStudent.name || normalizedStudent.id
              }.`
            )
          ),
        12000
      );
    });

    try {
      const { data, error, executive } = await Promise.race([
        saveExecutiveRiskScore(normalizedStudent),
        saveTimeout,
      ]);

      if (error) {
        failed.push({
          student: normalizedStudent,
          executive,
          error,
        });
      } else {
        saved.push({
          student: normalizedStudent,
          executive,
          data,
        });
      }
    } catch (error) {
      failed.push({
        student: normalizedStudent,
        executive: null,
        error,
      });
    }
  }

  return {
    portfolio,
    saved,
    failed,
    total: students.length,
    savedCount: saved.length,
    failedCount: failed.length,
  };
}
export async function generateExecutiveScoresFromDatabase() {
  const result = await loadExecutiveStudents();

  if (result.errors?.length) {
    return {
      students: result.students,
      portfolio: null,
      saved: [],
      failed: [],
      total: result.students.length,
      savedCount: 0,
      failedCount: 0,
      error: result.errors[0],
      errors: result.errors,
      warnings: result.warnings || [],
    };
  }

  const generated = await generateExecutiveScoresForStudents(result.students);

  return {
    ...generated,
    warnings: result.warnings || [],
  };
}

export async function getExecutiveScoreSummary() {
  const { data, error } = await supabase
    .from("ai_student_risk_scores")
    .select("*")
    .order("generated_at", { ascending: false });

  const scores = data || [];

  const critical = scores.filter((item) => number(item.risk_score) >= 85).length;

  const high = scores.filter((item) => {
    const score = number(item.risk_score);
    return score >= 65 && score < 85;
  }).length;

  const medium = scores.filter((item) => {
    const score = number(item.risk_score);
    return score >= 35 && score < 65;
  }).length;

  const opportunities = scores.filter(
    (item) => number(item.opportunity_score) >= 60
  ).length;

  const executivePriority = scores.filter(
    (item) => item.priority_level === "Executive"
  ).length;

  const criticalRisk = scores.filter(
    (item) => item.executive_category === "Critical Risk"
  ).length;

  const highOpportunity = scores.filter(
    (item) => item.executive_category === "High Opportunity"
  ).length;

  const conversionReady = scores.filter(
    (item) => item.executive_category === "Conversion Ready"
  ).length;

  const successStories = scores.filter(
    (item) =>
      item.executive_category === "Success Story" ||
      normalizeStatus(item.journey_stage) === "visa_approved"
  ).length;

  const needsAttention = scores.filter(
    (item) => item.executive_category === "Needs Attention"
  ).length;

  const applicationHealth = {
    notStarted: scores.filter((item) => normalizeStatus(item.journey_stage) === "not_started").length,
    started: scores.filter((item) => normalizeStatus(item.journey_stage) === "application_started").length,
    submitted: scores.filter((item) =>
      ["application_submitted", "application_under_review"].includes(normalizeStatus(item.journey_stage))
    ).length,
    offerReceived: scores.filter((item) => normalizeStatus(item.journey_stage) === "offer_received").length,
    offerAccepted: scores.filter((item) => normalizeStatus(item.journey_stage) === "offer_accepted").length,
    casPending: scores.filter((item) => normalizeStatus(item.journey_stage) === "cas_pending").length,
    casIssued: scores.filter((item) => normalizeStatus(item.journey_stage) === "cas_issued").length,
  };

  const visaHealth = {
    pending: scores.filter((item) => normalizeStatus(item.journey_stage) === "visa_pending").length,
    approved: scores.filter((item) => normalizeStatus(item.journey_stage) === "visa_approved").length,
    rejected: scores.filter((item) => normalizeStatus(item.journey_stage) === "visa_rejected").length,
  };

  const universityHealth = {
    balanced: scores.filter((item) => item.has_balanced_university_plan === true).length,
    missing: scores.filter((item) => number(item.university_plan_count) <= 0).length,
    noSafe: scores.filter(
      (item) => number(item.university_plan_count) > 0 && number(item.safe_university_count) <= 0
    ).length,
  };

  const documentHealth = {
    ready: scores.filter((item) => number(item.document_readiness_percent) >= 80).length,
    partial: scores.filter((item) => {
      const percent = number(item.document_readiness_percent);
      return percent > 0 && percent < 80;
    }).length,
    missing: scores.filter((item) => number(item.document_readiness_percent) <= 0).length,
  };

  const taskHealth = {
    strong: scores.filter((item) => number(item.task_completion_percent) >= 75).length,
    weak: scores.filter((item) => {
      const percent = number(item.task_completion_percent);
      return percent > 0 && percent < 50;
    }).length,
    overdue: scores.filter((item) => number(item.overdue_tasks_count) > 0).length,
  };

  const averageRisk = scores.length
    ? Math.round(
        scores.reduce((sum, item) => sum + number(item.risk_score), 0) /
          scores.length
      )
    : 0;

  const averageOpportunity = scores.length
    ? Math.round(
        scores.reduce((sum, item) => sum + number(item.opportunity_score), 0) /
          scores.length
      )
    : 0;

  return {
    scores,
    error,
    total: scores.length,

    critical,
    high,
    medium,
    opportunities,
    executivePriority,

    criticalRisk,
    highOpportunity,
    conversionReady,
    successStories,
    needsAttention,

    applicationHealth,
    visaHealth,
    universityHealth,
    documentHealth,
    taskHealth,

    averageRisk,
    averageOpportunity,
  };
}