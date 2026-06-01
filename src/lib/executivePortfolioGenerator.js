import { supabase } from "./supabaseClient";
import {
  calculatePortfolioHealth,
  saveExecutiveRiskScore,
} from "./executiveAI";

export async function loadExecutiveStudents() {
  const [inquiriesResult, appointmentsResult] = await Promise.all([
    supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false }),
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

  return {
    students: [...inquiries, ...appointments],
    inquiriesError: inquiriesResult.error,
    appointmentsError: appointmentsResult.error,
  };
}

export async function generateExecutiveScoresForStudents(students = []) {
  const portfolio = calculatePortfolioHealth(students);
  const saved = [];
  const failed = [];

  for (const item of portfolio.rankedByRisk) {
    const normalizedStudent = {
      ...item.student,
      student_type:
        item.student?.student_type ||
        item.student?.__leadType ||
        item.student?.type ||
        "inquiry",
    };

    const { data, error, executive } = await saveExecutiveRiskScore(
      normalizedStudent
    );

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
  const { students, inquiriesError, appointmentsError } =
    await loadExecutiveStudents();

  if (inquiriesError || appointmentsError) {
    return {
      students,
      portfolio: null,
      saved: [],
      failed: [],
      total: students.length,
      savedCount: 0,
      failedCount: 0,
      error:
        inquiriesError ||
        appointmentsError ||
        new Error("Failed to load executive students."),
    };
  }

  return await generateExecutiveScoresForStudents(students);
}

export async function getExecutiveScoreSummary() {
  const { data, error } = await supabase
    .from("ai_student_risk_scores")
    .select("*")
    .order("risk_score", { ascending: false });

  const scores = data || [];

  const critical = scores.filter(
    (item) => Number(item.risk_score || 0) >= 80
  ).length;

  const high = scores.filter((item) => {
    const score = Number(item.risk_score || 0);
    return score >= 60 && score < 80;
  }).length;

  const opportunities = scores.filter(
    (item) => Number(item.opportunity_score || 0) >= 60
  ).length;

  const averageRisk = scores.length
    ? Math.round(
        scores.reduce((sum, item) => sum + Number(item.risk_score || 0), 0) /
          scores.length
      )
    : 0;

  const averageOpportunity = scores.length
    ? Math.round(
        scores.reduce(
          (sum, item) => sum + Number(item.opportunity_score || 0),
          0
        ) / scores.length
      )
    : 0;

  return {
    scores,
    error,
    total: scores.length,
    critical,
    high,
    opportunities,
    averageRisk,
    averageOpportunity,
  };
}