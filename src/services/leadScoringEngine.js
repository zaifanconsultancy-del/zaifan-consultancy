export function calculateLeadScore(lead = {}, type = "inquiry") {
  let score = 0;

  if (lead.priority === "vip") score += 35;
  if (lead.priority === "high") score += 25;
  if (lead.priority === "medium") score += 12;

  if (lead.assigned_admin_id) score += 10;

  if (lead.phone) score += 8;
  if (lead.email) score += 8;

  if (type === "inquiry") {
    if (lead.country) score += 8;
    if (lead.study_level) score += 6;
    if (lead.field_of_interest) score += 6;

    if (
      ["applied", "offer_letter", "visa_process", "approved"].includes(
        lead.status || ""
      )
    ) {
      score += 25;
    }
  }

  if (type === "appointment") {
    if (lead.appointment_date) score += 10;
    if (lead.appointment_time) score += 8;
    if (lead.consultation_type) score += 6;

    if (lead.status === "confirmed") score += 18;
    if (lead.status === "completed") score += 25;
  }

  return Math.min(score, 100);
}

export function getLeadScoreLabel(score = 0) {
  if (score >= 80) return "Hot";
  if (score >= 60) return "Warm";
  if (score >= 35) return "Active";
  return "Cold";
}

export function getLeadScoreTone(score = 0) {
  if (score >= 80) return "text-red-300";
  if (score >= 60) return "text-orange-300";
  if (score >= 35) return "text-[#D4AF37]";
  return "text-blue-300";
}