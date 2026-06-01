export function buildExecutiveRecommendations(score = {}) {
  const riskScore = Number(score.risk_score || 0);
  const opportunityScore = Number(score.opportunity_score || 0);

  const recommendations = [];

  if (riskScore >= 20) {
    recommendations.push({
      type: "critical_risk",
      priority: "critical",
      title: "Create Urgent Counselor Task",
      description:
        "Student has critical executive risk and requires immediate counselor review.",
      action: "create_task",
    });
  }

  if (riskScore >= 10) {
    recommendations.push({
      type: "follow_up",
      priority: "high",
      title: "Create High Priority Follow-Up",
      description:
        "Student should be contacted quickly to prevent delays or drop-off.",
      action: "create_reminder",
    });
  }

  if (riskScore >= 5) {
    recommendations.push({
      type: "document_review",
      priority: "medium",
      title: "Review Student Documents",
      description:
        "Student risk indicators suggest missing or problematic documentation.",
      action: "create_task",
    });
  }

  if (opportunityScore >= 30) {
    recommendations.push({
      type: "conversion",
      priority: "executive",
      title: "Schedule Conversion Call",
      description:
        "High opportunity student with strong conversion potential.",
      action: "schedule_call",
    });
  }

  if (opportunityScore >= 20) {
    recommendations.push({
      type: "email",
      priority: "high",
      title: "Send Personalized Follow-Up Email",
      description:
        "Student is likely to progress with targeted counselor communication.",
      action: "send_email",
    });
  }

  if (opportunityScore >= 10) {
    recommendations.push({
      type: "whatsapp",
      priority: "medium",
      title: "Send WhatsApp Follow-Up",
      description:
        "Light engagement can help move this student forward.",
      action: "send_whatsapp",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "monitor",
      priority: "low",
      title: "Continue Monitoring",
      description:
        "No significant executive risk or opportunity signals detected.",
      action: "none",
    });
  }

  return recommendations;
}

export function getTopExecutiveRecommendation(score = {}) {
  const recommendations = buildExecutiveRecommendations(score);

  return recommendations[0] || null;
}

export function getExecutivePriority(score = {}) {
  const riskScore = Number(score.risk_score || 0);
  const opportunityScore = Number(score.opportunity_score || 0);

  if (riskScore >= 20) {
    return "Critical";
  }

  if (opportunityScore >= 30) {
    return "Executive";
  }

  if (riskScore >= 10 || opportunityScore >= 20) {
    return "High";
  }

  if (riskScore >= 5 || opportunityScore >= 10) {
    return "Medium";
  }

  return "Low";
}