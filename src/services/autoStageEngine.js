function normalize(value) {
  return String(value || "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
}

function daysSince(value) {
  if (!value) return 999;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 999;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function includesAny(text, words = []) {
  const safeText = normalize(text);
  return words.some((word) => safeText.includes(normalize(word)));
}

function buildLeadText(lead = {}) {
  return [
    lead.full_name,
    lead.email,
    lead.phone,
    lead.country,
    lead.country_interest,
    lead.field_of_interest,
    lead.study_level,
    lead.consultation_type,
    lead.message,
    lead.notes,
    lead.status,
    lead.priority,
    lead.appointment_stage,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildInquiryStageSuggestions(inquiries = []) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];

  return safeInquiries
    .map((inquiry) => {
      const status = normalize(inquiry.status || "new");
      const priority = normalize(inquiry.priority || "low");
      const leadAgeDays = daysSince(inquiry.created_at);
      const text = buildLeadText(inquiry);

      if (status === "new" && leadAgeDays >= 1) {
        return {
          id: `inquiry-${inquiry.id}-new-contacted`,
          leadId: inquiry.id,
          leadType: "inquiry",
          studentName: inquiry.full_name || "Unnamed Student",
          currentStage: status,
          suggestedStage: "contacted",
          title: "Move new lead to contacted",
          reason:
            "This inquiry is no longer brand new. If staff already reached out, move it to Contacted to keep pipeline clean.",
          confidence: leadAgeDays >= 3 ? "High" : "Medium",
          urgency: priority === "vip" || priority === "high" ? "High" : "Medium",
          actionLabel: "Mark Contacted",
          score: leadAgeDays >= 3 ? 85 : 68,
        };
      }

      if (
        status === "contacted" &&
        includesAny(text, ["documents", "passport", "transcript", "certificate", "ielts", "bank statement"])
      ) {
        return {
          id: `inquiry-${inquiry.id}-contacted-docs`,
          leadId: inquiry.id,
          leadType: "inquiry",
          studentName: inquiry.full_name || "Unnamed Student",
          currentStage: status,
          suggestedStage: "documents_pending",
          title: "Move contacted lead to documents pending",
          reason:
            "The lead text mentions documents or application files, so the next CRM stage should likely be Documents Pending.",
          confidence: "High",
          urgency: priority === "vip" || priority === "high" ? "High" : "Medium",
          actionLabel: "Move To Docs Pending",
          score: 82,
        };
      }

      if (
        ["documents_pending", "contacted"].includes(status) &&
        includesAny(text, ["applied", "application submitted", "submitted", "university applied"])
      ) {
        return {
          id: `inquiry-${inquiry.id}-applied`,
          leadId: inquiry.id,
          leadType: "inquiry",
          studentName: inquiry.full_name || "Unnamed Student",
          currentStage: status,
          suggestedStage: "applied",
          title: "Move lead to application submitted",
          reason:
            "Application-related wording was detected, so this lead may already be past document collection.",
          confidence: "High",
          urgency: "High",
          actionLabel: "Mark Applied",
          score: 88,
        };
      }

      if (
        ["applied", "documents_pending"].includes(status) &&
        includesAny(text, ["offer", "offer letter", "conditional offer", "unconditional offer"])
      ) {
        return {
          id: `inquiry-${inquiry.id}-offer`,
          leadId: inquiry.id,
          leadType: "inquiry",
          studentName: inquiry.full_name || "Unnamed Student",
          currentStage: status,
          suggestedStage: "offer_letter",
          title: "Move lead to offer letter",
          reason:
            "Offer letter wording was detected, so this lead may be ready for offer-stage tracking.",
          confidence: "High",
          urgency: "High",
          actionLabel: "Mark Offer Letter",
          score: 92,
        };
      }

      if (
        ["offer_letter", "applied"].includes(status) &&
        includesAny(text, ["visa", "cas", "embassy", "biometric", "medical", "visa process"])
      ) {
        return {
          id: `inquiry-${inquiry.id}-visa`,
          leadId: inquiry.id,
          leadType: "inquiry",
          studentName: inquiry.full_name || "Unnamed Student",
          currentStage: status,
          suggestedStage: "visa_process",
          title: "Move lead to visa process",
          reason:
            "Visa-related wording was detected, so this lead should likely move into Visa Process.",
          confidence: "High",
          urgency: "High",
          actionLabel: "Mark Visa Process",
          score: 95,
        };
      }

      if (
        status === "new" &&
        leadAgeDays >= 5 &&
        !includesAny(text, ["contacted", "called", "whatsapp", "reply"])
      ) {
        return {
          id: `inquiry-${inquiry.id}-recovery`,
          leadId: inquiry.id,
          leadType: "inquiry",
          studentName: inquiry.full_name || "Unnamed Student",
          currentStage: status,
          suggestedStage: "contacted",
          title: "Recover aging new lead",
          reason:
            "This new inquiry is aging. Send a recovery message and update the stage after contact.",
          confidence: "Medium",
          urgency: "High",
          actionLabel: "Recover Lead",
          score: 78,
        };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

export function buildAppointmentStageSuggestions(appointments = []) {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  return safeAppointments
    .map((appointment) => {
      const status = normalize(appointment.status || "pending");
      const stage = normalize(appointment.appointment_stage || "new_booking");
      const priority = normalize(appointment.priority || "low");
      const leadAgeDays = daysSince(appointment.created_at);
      const text = buildLeadText(appointment);

      if (stage === "new_booking" && status === "confirmed") {
        return {
          id: `appointment-${appointment.id}-confirmed-stage`,
          leadId: appointment.id,
          leadType: "appointment",
          studentName: appointment.full_name || "Unnamed Student",
          currentStage: stage,
          suggestedStage: "confirmed",
          title: "Sync appointment stage to confirmed",
          reason:
            "Appointment status is confirmed but pipeline stage is still New Booking.",
          confidence: "High",
          urgency: "Medium",
          actionLabel: "Move To Confirmed",
          score: 90,
        };
      }

      if (stage === "new_booking" && status === "pending" && leadAgeDays >= 1) {
        return {
          id: `appointment-${appointment.id}-confirm-reminder`,
          leadId: appointment.id,
          leadType: "appointment",
          studentName: appointment.full_name || "Unnamed Student",
          currentStage: stage,
          suggestedStage: "confirmed",
          title: "Confirm pending appointment",
          reason:
            "This appointment is still pending. Confirm the slot or contact the student before it becomes stale.",
          confidence: leadAgeDays >= 2 ? "High" : "Medium",
          urgency: priority === "vip" || priority === "high" ? "High" : "Medium",
          actionLabel: "Confirm Appointment",
          score: leadAgeDays >= 2 ? 86 : 72,
        };
      }

      if (
        ["confirmed", "new_booking"].includes(stage) &&
        includesAny(text, ["done", "completed", "consultation done", "meeting done", "called"])
      ) {
        return {
          id: `appointment-${appointment.id}-consultation-done`,
          leadId: appointment.id,
          leadType: "appointment",
          studentName: appointment.full_name || "Unnamed Student",
          currentStage: stage,
          suggestedStage: "consultation_done",
          title: "Move appointment to consultation done",
          reason:
            "The appointment text suggests the consultation has already happened.",
          confidence: "High",
          urgency: "Medium",
          actionLabel: "Mark Consultation Done",
          score: 84,
        };
      }

      if (
        stage === "consultation_done" &&
        includesAny(text, ["follow", "follow up", "call again", "next week", "later"])
      ) {
        return {
          id: `appointment-${appointment.id}-follow-up-needed`,
          leadId: appointment.id,
          leadType: "appointment",
          studentName: appointment.full_name || "Unnamed Student",
          currentStage: stage,
          suggestedStage: "follow_up_needed",
          title: "Move to follow-up needed",
          reason:
            "Post-consultation follow-up wording was detected.",
          confidence: "High",
          urgency: "High",
          actionLabel: "Mark Follow-Up Needed",
          score: 88,
        };
      }

      if (
        ["consultation_done", "follow_up_needed"].includes(stage) &&
        includesAny(text, ["converted", "apply", "application", "admission", "proceed"])
      ) {
        return {
          id: `appointment-${appointment.id}-converted`,
          leadId: appointment.id,
          leadType: "appointment",
          studentName: appointment.full_name || "Unnamed Student",
          currentStage: stage,
          suggestedStage: "converted_to_lead",
          title: "Move appointment to converted lead",
          reason:
            "Student appears ready to proceed after consultation.",
          confidence: "High",
          urgency: "High",
          actionLabel: "Mark Converted",
          score: 93,
        };
      }

      if (
        ["new_booking", "confirmed", "follow_up_needed"].includes(stage) &&
        includesAny(text, ["not interested", "cancel", "cancelled", "no longer", "not now"])
      ) {
        return {
          id: `appointment-${appointment.id}-not-interested`,
          leadId: appointment.id,
          leadType: "appointment",
          studentName: appointment.full_name || "Unnamed Student",
          currentStage: stage,
          suggestedStage: "not_interested",
          title: "Move appointment to not interested",
          reason:
            "The appointment text suggests the student may no longer be interested.",
          confidence: "Medium",
          urgency: "Low",
          actionLabel: "Mark Not Interested",
          score: 65,
        };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

export function buildAutoStageSuggestions({ inquiries = [], appointments = [] } = {}) {
  const inquirySuggestions = buildInquiryStageSuggestions(inquiries);
  const appointmentSuggestions = buildAppointmentStageSuggestions(appointments);

  const allSuggestions = [...inquirySuggestions, ...appointmentSuggestions].sort(
    (a, b) => b.score - a.score
  );

  return {
    inquirySuggestions,
    appointmentSuggestions,
    allSuggestions,
    highConfidence: allSuggestions.filter(
      (item) => item.confidence === "High"
    ),
    highUrgency: allSuggestions.filter((item) => item.urgency === "High"),
    total: allSuggestions.length,
  };
}

export function getStageSuggestionSummary({ inquiries = [], appointments = [] } = {}) {
  const suggestions = buildAutoStageSuggestions({ inquiries, appointments });

  if (suggestions.total === 0) {
    return {
      title: "Pipeline is stable",
      message: "No strong automatic stage movement suggestions detected right now.",
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
