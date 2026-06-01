import { supabase } from "./supabaseClient";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function normalizeText(value = "") {
  return String(value || "").toLowerCase();
}

function getStudentName(student = {}) {
  return (
    student.full_name ||
    student.name ||
    student.student_name ||
    "Unknown Student"
  );
}

function getStudentType(student = {}) {
  return student.student_type || student.__leadType || student.type || "inquiry";
}

export function calculateExecutiveRisk(student = {}) {
  let riskScore = 0;
  let opportunityScore = 0;
  const riskReasons = [];
  const opportunityReasons = [];

  const priority = normalizeText(student.priority);
  const status = normalizeText(student.status);
  const applicationStatus = normalizeText(student.application_status);
  const visaStatus = normalizeText(student.visa_status);
  const documentStatus = normalizeText(student.document_status);
  const gptRisk = normalizeText(student.gpt_risk || student.gpt_risk_level);
  const gptSummary = normalizeText(student.gpt_summary);

  if (priority === "vip") {
    opportunityScore += 30;
    opportunityReasons.push("VIP lead");
  }

  if (priority === "high") {
    riskScore += 10;
    opportunityScore += 20;
    riskReasons.push("High priority student needs fast follow-up");
    opportunityReasons.push("High priority opportunity");
  }

  if (status.includes("pending")) {
    riskScore += 8;
    riskReasons.push("Lead is still pending");
  }

  if (status.includes("contacted")) {
    opportunityScore += 8;
    opportunityReasons.push("Student has already been contacted");
  }

  if (applicationStatus.includes("pending")) {
    riskScore += 12;
    riskReasons.push("Application is pending");
  }

  if (applicationStatus.includes("submitted")) {
    opportunityScore += 18;
    opportunityReasons.push("Application submitted");
  }

  if (applicationStatus.includes("offer")) {
    opportunityScore += 25;
    opportunityReasons.push("Offer stage opportunity");
  }

  if (visaStatus.includes("rejected")) {
    riskScore += 35;
    riskReasons.push("Visa rejection risk");
  }

  if (visaStatus.includes("pending")) {
    riskScore += 15;
    riskReasons.push("Visa pending");
  }

  if (visaStatus.includes("approved")) {
    opportunityScore += 30;
    opportunityReasons.push("Visa approved");
  }

  if (documentStatus.includes("rejected")) {
    riskScore += 25;
    riskReasons.push("Rejected document");
  }

  if (documentStatus.includes("missing")) {
    riskScore += 18;
    riskReasons.push("Missing document");
  }

  if (gptRisk.includes("critical")) {
    riskScore += 35;
    riskReasons.push("GPT marked critical risk");
  } else if (gptRisk.includes("high")) {
    riskScore += 25;
    riskReasons.push("GPT marked high risk");
  } else if (gptRisk.includes("medium")) {
    riskScore += 12;
    riskReasons.push("GPT marked medium risk");
  }

  if (gptSummary.includes("missing ielts")) {
    riskScore += 20;
    riskReasons.push("Missing IELTS detected");
  }

  if (gptSummary.includes("rejected transcript")) {
    riskScore += 25;
    riskReasons.push("Rejected transcript detected");
  }

  const leadScore = Number(student.gpt_ai_score || student.gpt_score || student.lead_score || 0);

  if (leadScore >= 80) {
    opportunityScore += 25;
    opportunityReasons.push("Strong lead score");
  } else if (leadScore >= 60) {
    opportunityScore += 15;
    opportunityReasons.push("Moderate lead score");
  }

  const finalRiskScore = clampScore(riskScore);
  const finalOpportunityScore = clampScore(opportunityScore);

  let riskLevel = "Low";
  if (finalRiskScore >= 80) riskLevel = "Critical";
  else if (finalRiskScore >= 60) riskLevel = "High";
  else if (finalRiskScore >= 30) riskLevel = "Medium";

  let priorityLevel = "Standard";
  if (finalRiskScore >= 80 || finalOpportunityScore >= 80) {
    priorityLevel = "Executive";
  } else if (finalRiskScore >= 60 || finalOpportunityScore >= 60) {
    priorityLevel = "High";
  } else if (finalRiskScore >= 30 || finalOpportunityScore >= 40) {
    priorityLevel = "Medium";
  }

  return {
    student_id: String(student.id),
    student_type: getStudentType(student),
    student_name: getStudentName(student),
    risk_score: finalRiskScore,
    risk_level: riskLevel,
    opportunity_score: finalOpportunityScore,
    priority_level: priorityLevel,
    summary:
      riskReasons.length || opportunityReasons.length
        ? [...riskReasons, ...opportunityReasons].join(", ")
        : "No executive risk or opportunity signals detected.",
    risk_reasons: riskReasons,
    opportunity_reasons: opportunityReasons,
    generated_at: new Date().toISOString(),
  };
}

export function calculatePortfolioHealth(students = []) {
  const scored = students.map((student) => ({
    student,
    executive: calculateExecutiveRisk(student),
  }));

  const total = scored.length;

  const critical = scored.filter(
    (item) => item.executive.risk_level === "Critical"
  ).length;

  const high = scored.filter((item) => item.executive.risk_level === "High")
    .length;

  const medium = scored.filter((item) => item.executive.risk_level === "Medium")
    .length;

  const executivePriority = scored.filter(
    (item) => item.executive.priority_level === "Executive"
  ).length;

  const averageRisk = total
    ? Math.round(
        scored.reduce((sum, item) => sum + item.executive.risk_score, 0) /
          total
      )
    : 0;

  const averageOpportunity = total
    ? Math.round(
        scored.reduce(
          (sum, item) => sum + item.executive.opportunity_score,
          0
        ) / total
      )
    : 0;

  return {
    total,
    critical,
    high,
    medium,
    executivePriority,
    averageRisk,
    averageOpportunity,
    rankedByRisk: [...scored].sort(
      (a, b) => b.executive.risk_score - a.executive.risk_score
    ),
    rankedByOpportunity: [...scored].sort(
      (a, b) =>
        b.executive.opportunity_score - a.executive.opportunity_score
    ),
  };
}

export async function saveExecutiveRiskScore(student = {}) {
  if (!student?.id) {
    return { data: null, error: new Error("Missing student id") };
  }

  const executive = calculateExecutiveRisk(student);

  const payload = {
  student_id: executive.student_id,
  student_type: executive.student_type,
  risk_score: executive.risk_score,
  risk_level: executive.risk_level,
  opportunity_score: executive.opportunity_score,
  priority_level: executive.priority_level,
  summary: executive.summary,
  generated_at: executive.generated_at,
};
  const { data, error } = await supabase
    .from("ai_student_risk_scores")
    .upsert(payload, {
      onConflict: "student_id,student_type",
    })
    .select()
    .single();

  if (error) {
    console.error("Executive risk score save failed:", error);
  }

  return { data, error, executive };
}

export async function generateExecutivePortfolio(students = []) {
  const portfolio = calculatePortfolioHealth(students);

  for (const item of portfolio.rankedByRisk) {
    await saveExecutiveRiskScore(item.student);
  }

  return portfolio;
}

export async function fetchExecutiveRiskScores() {
  const { data, error } = await supabase
    .from("ai_student_risk_scores")
    .select("*")
    .order("risk_score", { ascending: false });

  if (error) {
    console.error("Executive risk scores fetch failed:", error);
  }

  return { data: data || [], error };
}