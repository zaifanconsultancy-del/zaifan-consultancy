const STRONG_INQUIRY_STATUSES = new Set([
  "applied",
  "offer_letter",
  "visa_process",
  "approved",
]);

const COMPLETED_APPOINTMENT_STATUSES = new Set([
  "completed",
  "complete",
  "done",
]);

function normalize(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function calculateLeadScore(lead = {}, type = "inquiry") {
  let score = 0;

  const priority = normalize(lead.priority);
  const leadType = normalize(type || "inquiry");
  const status = normalize(lead.status);

  if (priority === "vip") score += 35;
  else if (priority === "high") score += 25;
  else if (priority === "medium") score += 12;

  if (lead.assigned_admin_id) score += 10;

  if (hasValue(lead.phone || lead.phone_number || lead.whatsapp)) {
    score += 8;
  }

  if (hasValue(lead.email)) {
    score += 8;
  }

  if (leadType === "inquiry") {
    if (hasValue(lead.country || lead.country_interest)) score += 8;
    if (hasValue(lead.study_level)) score += 6;
    if (hasValue(lead.field_of_interest)) score += 6;

    if (STRONG_INQUIRY_STATUSES.has(status)) {
      score += 25;
    }
  }

  if (leadType === "appointment") {
    if (hasValue(lead.appointment_date)) score += 10;
    if (hasValue(lead.appointment_time)) score += 8;
    if (hasValue(lead.consultation_type)) score += 6;

    if (status === "confirmed") {
      score += 18;
    } else if (COMPLETED_APPOINTMENT_STATUSES.has(status)) {
      score += 25;
    }
  }

  return Math.max(0, Math.min(Math.round(score), 100));
}

export function getLeadScoreLabel(score = 0) {
  const safeScore = Number(score) || 0;

  if (safeScore >= 80) return "Hot";
  if (safeScore >= 60) return "Warm";
  if (safeScore >= 35) return "Active";
  return "Cold";
}

export function getLeadScoreTone(score = 0) {
  const safeScore = Number(score) || 0;

  if (safeScore >= 80) return "text-red-300";
  if (safeScore >= 60) return "text-orange-300";
  if (safeScore >= 35) return "text-[#D4AF37]";
  return "text-blue-300";
}
