import { supabase } from "./supabaseClient";

export function calculateStudentRisk(student = {}) {
  let riskScore = 0;
  const reasons = [];

  if (
    String(student?.document_status || "")
      .toLowerCase()
      .includes("rejected")
  ) {
    riskScore += 25;
    reasons.push("Rejected Document");
  }

  if (!student?.ielts_score && !student?.ielts_band) {
    riskScore += 20;
    reasons.push("Missing IELTS");
  }

  if (
    String(student?.task_status || "")
      .toLowerCase()
      .includes("blocked")
  ) {
    riskScore += 15;
    reasons.push("Blocked Task");
  }

  if (
    String(student?.visa_status || "")
      .toLowerCase()
      .includes("rejected")
  ) {
    riskScore += 30;
    reasons.push("Visa Rejection");
  }

  if (
    String(student?.application_status || "")
      .toLowerCase()
      .includes("pending")
  ) {
    riskScore += 10;
    reasons.push("Pending Application");
  }

  let riskLevel = "Low";

  if (riskScore >= 80) {
    riskLevel = "Critical";
  } else if (riskScore >= 60) {
    riskLevel = "High";
  } else if (riskScore >= 30) {
    riskLevel = "Medium";
  }

  return {
    riskScore,
    riskLevel,
    reasons,
  };
}

export async function saveStudentRiskScore(student = {}) {
  if (!student?.id) return;

  const result = calculateStudentRisk(student);

  const payload = {
    student_id: String(student.id),
    student_type:
      student.student_type ||
      student.type ||
      "inquiry",

    student_name:
      student.full_name ||
      student.name ||
      "Student",

    risk_score: result.riskScore,
    risk_level: result.riskLevel,

    summary: result.reasons.join(", "),

    generated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("ai_student_risk_scores")
    .upsert(payload)
    .select();

  if (error) {
    console.error("Risk score save failed:", error);
  }

  return { data, error };
}

export async function generatePortfolioRisk(students = []) {
  const results = [];

  for (const student of students) {
    const result = calculateStudentRisk(student);

    results.push({
      student,
      ...result,
    });

    await saveStudentRiskScore(student);
  }

  return results.sort(
    (a, b) => b.riskScore - a.riskScore
  );
}