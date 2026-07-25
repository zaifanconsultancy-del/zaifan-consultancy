const DAY_MS = 24 * 60 * 60 * 1000;

const INQUIRY_DOCUMENT_WORDS = [
  "documents",
  "passport",
  "transcript",
  "certificate",
  "ielts",
  "bank statement",
];

const INQUIRY_APPLICATION_WORDS = [
  "applied",
  "application submitted",
  "submitted",
  "university applied",
];

const INQUIRY_OFFER_WORDS = [
  "offer",
  "offer letter",
  "conditional offer",
  "unconditional offer",
];

const INQUIRY_VISA_WORDS = [
  "visa",
  "cas",
  "embassy",
  "biometric",
  "medical",
  "visa process",
];

const CONTACT_EVIDENCE_WORDS = [
  "contacted",
  "called",
  "whatsapp",
  "replied",
  "reply",
  "spoke",
];

const APPOINTMENT_DONE_WORDS = [
  "done",
  "completed",
  "consultation done",
  "meeting done",
  "called",
];

const FOLLOW_UP_WORDS = [
  "follow",
  "follow up",
  "call again",
  "next week",
  "later",
];

const CONVERSION_WORDS = [
  "converted",
  "apply",
  "application",
  "admission",
  "proceed",
];

const NOT_INTERESTED_WORDS = [
  "not interested",
  "cancel",
  "cancelled",
  "canceled",
  "no longer",
  "not now",
];

function normalize(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeSearchText(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function daysSince(value, nowMs = Date.now()) {
  if (!value) return 999;

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 999;

  return Math.max(0, Math.floor((nowMs - time) / DAY_MS));
}

function includesAny(text, words = []) {
  const safeText = normalizeSearchText(text);

  return words.some((word) =>
    safeText.includes(normalizeSearchText(word))
  );
}

function buildLeadText(lead = {}) {
  return [
    lead.full_name,
    lead.name,
    lead.email,
    lead.phone,
    lead.phone_number,
    lead.whatsapp,
    lead.country,
    lead.country_interest,
    lead.preferred_country,
    lead.field_of_interest,
    lead.study_level,
    lead.consultation_type,
    lead.counseling_mode,
    lead.message,
    lead.notes,
    lead.consultation_notes,
    lead.status,
    lead.priority,
    lead.appointment_stage,
  ]
    .filter(Boolean)
    .join(" ");
}

function getStudentName(lead = {}) {
  return lead.full_name || lead.name || lead.student_name || "Unnamed Student";
}

function isHighPriority(priority = "") {
  const normalized = normalize(priority);
  return normalized === "vip" || normalized === "high";
}

export function buildInquiryStageSuggestions(inquiries = []) {
  const rows = Array.isArray(inquiries) ? inquiries : [];
  const nowMs = Date.now();
  const suggestions = [];

  for (const inquiry of rows) {
    const status = normalize(inquiry.status || "new");
    const priority = normalize(inquiry.priority || "low");
    const leadAgeDays = daysSince(inquiry.created_at, nowMs);
    const text = buildLeadText(inquiry);
    const studentName = getStudentName(inquiry);

    // Important: recovery must be checked BEFORE the generic "new >= 1 day"
    // suggestion. In the previous engine this branch was unreachable.
    if (
      status === "new" &&
      leadAgeDays >= 5 &&
      !includesAny(text, CONTACT_EVIDENCE_WORDS)
    ) {
      suggestions.push({
        id: `inquiry-${inquiry.id}-recovery`,
        leadId: inquiry.id,
        leadType: "inquiry",
        studentName,
        currentStage: status,
        suggestedStage: "contacted",
        title: "Recover aging new lead",
        reason:
          "This new inquiry is aging. Send a recovery message and update the stage after contact.",
        confidence: "Medium",
        urgency: "High",
        actionLabel: "Recover Lead",
        score: 78,
      });
      continue;
    }

    if (status === "new" && leadAgeDays >= 1) {
      suggestions.push({
        id: `inquiry-${inquiry.id}-new-contacted`,
        leadId: inquiry.id,
        leadType: "inquiry",
        studentName,
        currentStage: status,
        suggestedStage: "contacted",
        title: "Move new lead to contacted",
        reason:
          "This inquiry is no longer brand new. If staff already reached out, move it to Contacted to keep pipeline clean.",
        confidence: leadAgeDays >= 3 ? "High" : "Medium",
        urgency: isHighPriority(priority) ? "High" : "Medium",
        actionLabel: "Mark Contacted",
        score: leadAgeDays >= 3 ? 85 : 68,
      });
      continue;
    }

    if (
      status === "contacted" &&
      includesAny(text, INQUIRY_DOCUMENT_WORDS)
    ) {
      suggestions.push({
        id: `inquiry-${inquiry.id}-contacted-docs`,
        leadId: inquiry.id,
        leadType: "inquiry",
        studentName,
        currentStage: status,
        suggestedStage: "documents_pending",
        title: "Move contacted lead to documents pending",
        reason:
          "The lead text mentions documents or application files, so the next CRM stage should likely be Documents Pending.",
        confidence: "High",
        urgency: isHighPriority(priority) ? "High" : "Medium",
        actionLabel: "Move To Docs Pending",
        score: 82,
      });
      continue;
    }

    if (
      ["documents_pending", "contacted"].includes(status) &&
      includesAny(text, INQUIRY_APPLICATION_WORDS)
    ) {
      suggestions.push({
        id: `inquiry-${inquiry.id}-applied`,
        leadId: inquiry.id,
        leadType: "inquiry",
        studentName,
        currentStage: status,
        suggestedStage: "applied",
        title: "Move lead to application submitted",
        reason:
          "Application-related wording was detected, so this lead may already be past document collection.",
        confidence: "High",
        urgency: "High",
        actionLabel: "Mark Applied",
        score: 88,
      });
      continue;
    }

    if (
      ["applied", "documents_pending"].includes(status) &&
      includesAny(text, INQUIRY_OFFER_WORDS)
    ) {
      suggestions.push({
        id: `inquiry-${inquiry.id}-offer`,
        leadId: inquiry.id,
        leadType: "inquiry",
        studentName,
        currentStage: status,
        suggestedStage: "offer_letter",
        title: "Move lead to offer letter",
        reason:
          "Offer letter wording was detected, so this lead may be ready for offer-stage tracking.",
        confidence: "High",
        urgency: "High",
        actionLabel: "Mark Offer Letter",
        score: 92,
      });
      continue;
    }

    if (
      ["offer_letter", "applied"].includes(status) &&
      includesAny(text, INQUIRY_VISA_WORDS)
    ) {
      suggestions.push({
        id: `inquiry-${inquiry.id}-visa`,
        leadId: inquiry.id,
        leadType: "inquiry",
        studentName,
        currentStage: status,
        suggestedStage: "visa_process",
        title: "Move lead to visa process",
        reason:
          "Visa-related wording was detected, so this lead should likely move into Visa Process.",
        confidence: "High",
        urgency: "High",
        actionLabel: "Mark Visa Process",
        score: 95,
      });
    }
  }

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions;
}

export function buildAppointmentStageSuggestions(appointments = []) {
  const rows = Array.isArray(appointments) ? appointments : [];
  const nowMs = Date.now();
  const suggestions = [];

  for (const appointment of rows) {
    const status = normalize(appointment.status || "pending");
    const stage = normalize(appointment.appointment_stage || "new_booking");
    const priority = normalize(appointment.priority || "low");
    const leadAgeDays = daysSince(appointment.created_at, nowMs);
    const text = buildLeadText(appointment);
    const studentName = getStudentName(appointment);

    if (stage === "new_booking" && status === "confirmed") {
      suggestions.push({
        id: `appointment-${appointment.id}-confirmed-stage`,
        leadId: appointment.id,
        leadType: "appointment",
        studentName,
        currentStage: stage,
        suggestedStage: "confirmed",
        title: "Sync appointment stage to confirmed",
        reason:
          "Appointment status is confirmed but pipeline stage is still New Booking.",
        confidence: "High",
        urgency: "Medium",
        actionLabel: "Move To Confirmed",
        score: 90,
      });
      continue;
    }

    if (stage === "new_booking" && status === "pending" && leadAgeDays >= 1) {
      suggestions.push({
        id: `appointment-${appointment.id}-confirm-reminder`,
        leadId: appointment.id,
        leadType: "appointment",
        studentName,
        currentStage: stage,
        suggestedStage: "confirmed",
        title: "Confirm pending appointment",
        reason:
          "This appointment is still pending. Confirm the slot or contact the student before it becomes stale.",
        confidence: leadAgeDays >= 2 ? "High" : "Medium",
        urgency: isHighPriority(priority) ? "High" : "Medium",
        actionLabel: "Confirm Appointment",
        score: leadAgeDays >= 2 ? 86 : 72,
      });
      continue;
    }

    if (
      ["confirmed", "new_booking"].includes(stage) &&
      includesAny(text, APPOINTMENT_DONE_WORDS)
    ) {
      suggestions.push({
        id: `appointment-${appointment.id}-consultation-done`,
        leadId: appointment.id,
        leadType: "appointment",
        studentName,
        currentStage: stage,
        suggestedStage: "consultation_done",
        title: "Move appointment to consultation done",
        reason:
          "The appointment text suggests the consultation has already happened.",
        confidence: "High",
        urgency: "Medium",
        actionLabel: "Mark Consultation Done",
        score: 84,
      });
      continue;
    }

    if (
      stage === "consultation_done" &&
      includesAny(text, FOLLOW_UP_WORDS)
    ) {
      suggestions.push({
        id: `appointment-${appointment.id}-follow-up-needed`,
        leadId: appointment.id,
        leadType: "appointment",
        studentName,
        currentStage: stage,
        suggestedStage: "follow_up_needed",
        title: "Move to follow-up needed",
        reason: "Post-consultation follow-up wording was detected.",
        confidence: "High",
        urgency: "High",
        actionLabel: "Mark Follow-Up Needed",
        score: 88,
      });
      continue;
    }

    if (
      ["consultation_done", "follow_up_needed"].includes(stage) &&
      includesAny(text, CONVERSION_WORDS)
    ) {
      suggestions.push({
        id: `appointment-${appointment.id}-converted`,
        leadId: appointment.id,
        leadType: "appointment",
        studentName,
        currentStage: stage,
        suggestedStage: "converted_to_lead",
        title: "Move appointment to converted lead",
        reason: "Student appears ready to proceed after consultation.",
        confidence: "High",
        urgency: "High",
        actionLabel: "Mark Converted",
        score: 93,
      });
      continue;
    }

    if (
      ["new_booking", "confirmed", "follow_up_needed"].includes(stage) &&
      includesAny(text, NOT_INTERESTED_WORDS)
    ) {
      suggestions.push({
        id: `appointment-${appointment.id}-not-interested`,
        leadId: appointment.id,
        leadType: "appointment",
        studentName,
        currentStage: stage,
        suggestedStage: "not_interested",
        title: "Move appointment to not interested",
        reason:
          "The appointment text suggests the student may no longer be interested.",
        confidence: "Medium",
        urgency: "Low",
        actionLabel: "Mark Not Interested",
        score: 65,
      });
    }
  }

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions;
}

export function buildAutoStageSuggestions({
  inquiries = [],
  appointments = [],
} = {}) {
  const inquirySuggestions = buildInquiryStageSuggestions(inquiries);
  const appointmentSuggestions = buildAppointmentStageSuggestions(appointments);

  const allSuggestions = [
    ...inquirySuggestions,
    ...appointmentSuggestions,
  ].sort((a, b) => b.score - a.score);

  const highConfidence = [];
  const highUrgency = [];

  for (const item of allSuggestions) {
    if (item.confidence === "High") highConfidence.push(item);
    if (item.urgency === "High") highUrgency.push(item);
  }

  return {
    inquirySuggestions,
    appointmentSuggestions,
    allSuggestions,
    highConfidence,
    highUrgency,
    total: allSuggestions.length,
  };
}

export function getStageSuggestionSummary({
  inquiries = [],
  appointments = [],
} = {}) {
  const suggestions = buildAutoStageSuggestions({
    inquiries,
    appointments,
  });

  if (suggestions.total === 0) {
    return {
      title: "Pipeline is stable",
      message:
        "No strong automatic stage movement suggestions detected right now.",
      level: "stable",
    };
  }

  if (suggestions.highUrgency.length > 0) {
    return {
      title: "Pipeline action needed",
      message: `${suggestions.highUrgency.length} high-urgency stage movement suggestion(s) need review.`,
      level: "urgent",
    };
  }

  return {
    title: "Pipeline optimization available",
    message: `${suggestions.total} stage movement suggestion(s) found for cleaner CRM flow.`,
    level: "active",
  };
}
