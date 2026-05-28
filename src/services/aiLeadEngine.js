const HIGH_VALUE_COUNTRIES = [
  "uk",
  "united kingdom",
  "usa",
  "united states",
  "america",
  "canada",
  "australia",
  "germany",
  "ireland",
  "new zealand",
  "italy",
  "france",
  "sweden",
  "finland",
  "denmark",
  "netherlands",
];

const HIGH_INTENT_WORDS = [
  "urgent",
  "asap",
  "apply",
  "admission",
  "visa",
  "scholarship",
  "ielts",
  "documents",
  "offer letter",
  "intake",
  "deadline",
  "ready",
  "interested",
  "consultation",
  "appointment",
  "fee",
  "budget",
  "university",
  "study abroad",
];

const LOW_INTENT_WORDS = [
  "just asking",
  "maybe",
  "not sure",
  "later",
  "thinking",
  "confused",
  "general info",
];

const VIP_FIELDS = [
  "medicine",
  "medical",
  "mbbs",
  "engineering",
  "computer science",
  "business",
  "data science",
  "artificial intelligence",
  "law",
  "masters",
  "phd",
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function includesAny(text, words = []) {
  const normalizedText = normalize(text);
  return words.some((word) => normalizedText.includes(normalize(word)));
}

function daysSince(value) {
  if (!value) return 999;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 999;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function hasContactInfo(lead = {}) {
  return Boolean(lead.email || lead.phone || lead.whatsapp || lead.contact_number);
}

function buildLeadSearchText(lead = {}) {
  return [
    lead.full_name,
    lead.email,
    lead.phone,
    lead.whatsapp,
    lead.country,
    lead.country_interest,
    lead.city,
    lead.field_of_interest,
    lead.study_level,
    lead.consultation_type,
    lead.counseling_mode,
    lead.message,
    lead.notes,
    lead.status,
    lead.priority,
    lead.appointment_stage,
  ]
    .filter(Boolean)
    .join(" ");
}

export function calculateAiLeadScore(lead = {}, type = "inquiry") {
  const text = buildLeadSearchText(lead);
  const country = normalize(lead.country || lead.country_interest);
  const field = normalize(lead.field_of_interest || lead.consultation_type);
  const status = normalize(lead.status);
  const priority = normalize(lead.priority);
  const appointmentStage = normalize(lead.appointment_stage);
  const ageDays = daysSince(lead.created_at);

  let score = 35;
  const reasons = [];

  if (type === "appointment") {
    score += 12;
    reasons.push("Appointment lead shows higher buying intent.");
  }

  if (priority === "vip") {
    score += 25;
    reasons.push("Marked as VIP priority.");
  } else if (priority === "high") {
    score += 18;
    reasons.push("Marked as high priority.");
  } else if (priority === "medium") {
    score += 8;
    reasons.push("Marked as medium priority.");
  }

  if (HIGH_VALUE_COUNTRIES.includes(country)) {
    score += 14;
    reasons.push("Target country is a high-value study destination.");
  }

  if (includesAny(field, VIP_FIELDS)) {
    score += 10;
    reasons.push("Chosen field usually has strong counseling value.");
  }

  if (includesAny(text, HIGH_INTENT_WORDS)) {
    score += 16;
    reasons.push("Message contains high-intent admission or visa signals.");
  }

  if (includesAny(text, LOW_INTENT_WORDS)) {
    score -= 9;
    reasons.push("Lead language looks exploratory or low-intent.");
  }

  if (hasContactInfo(lead)) {
    score += 8;
    reasons.push("Lead has contact details available.");
  } else {
    score -= 12;
    reasons.push("Missing contact details reduce conversion confidence.");
  }

  if (lead.preferred_date || lead.appointment_date) {
    score += 8;
    reasons.push("Lead has selected a date, showing stronger intent.");
  }

  if (lead.time_slot || lead.appointment_time) {
    score += 6;
    reasons.push("Lead selected a time slot, showing readiness.");
  }

  if (status === "converted" || status === "approved") {
    score += 25;
    reasons.push("Lead already reached a strong conversion stage.");
  } else if (
    status === "applied" ||
    status === "offer_letter" ||
    status === "visa_process"
  ) {
    score += 20;
    reasons.push("Lead is already deep inside the student pipeline.");
  } else if (status === "contacted" || status === "interested") {
    score += 10;
    reasons.push("Lead has already moved beyond new stage.");
  } else if (status === "lost" || status === "cancelled") {
    score -= 25;
    reasons.push("Lead is marked lost or cancelled.");
  }

  if (appointmentStage === "confirmed") {
    score += 14;
    reasons.push("Appointment is confirmed.");
  } else if (appointmentStage === "consultation_done") {
    score += 18;
    reasons.push("Consultation has already been completed.");
  } else if (appointmentStage === "follow_up_needed") {
    score += 12;
    reasons.push("Follow-up is needed after appointment activity.");
  } else if (appointmentStage === "not_interested") {
    score -= 20;
    reasons.push("Appointment pipeline says not interested.");
  }

  if (ageDays === 0) {
    score += 10;
    reasons.push("Fresh lead created today.");
  } else if (ageDays <= 2) {
    score += 6;
    reasons.push("Lead is still fresh.");
  } else if (ageDays >= 7) {
    score -= 8;
    reasons.push("Lead is aging and needs action.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    reasons,
    ageDays,
  };
}

export function getAiLeadTier(score = 0) {
  if (score >= 85) {
    return {
      label: "Hot Lead",
      level: "hot",
      badge: "🔥 Hot",
      color: "text-red-300",
      border: "border-red-400/25",
      bg: "bg-red-400/10",
    };
  }

  if (score >= 68) {
    return {
      label: "Warm Lead",
      level: "warm",
      badge: "⚡ Warm",
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/25",
      bg: "bg-[#D4AF37]/10",
    };
  }

  if (score >= 45) {
    return {
      label: "Nurture Lead",
      level: "nurture",
      badge: "🌱 Nurture",
      color: "text-blue-300",
      border: "border-blue-400/25",
      bg: "bg-blue-400/10",
    };
  }

  return {
    label: "Cold Lead",
    level: "cold",
    badge: "❄️ Cold",
    color: "text-gray-300",
    border: "border-white/10",
    bg: "bg-white/[0.04]",
  };
}

export function getAiConversionProbability(score = 0) {
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  if (score >= 35) return "Low";
  return "Very Low";
}

export function getAiUrgencyLevel(lead = {}, type = "inquiry") {
  const status = normalize(lead.status);
  const priority = normalize(lead.priority);
  const ageDays = daysSince(lead.created_at);
  const text = buildLeadSearchText(lead);

  if (
    priority === "vip" ||
    includesAny(text, ["urgent", "asap", "deadline", "visa", "intake"])
  ) {
    return {
      label: "Immediate",
      level: "immediate",
      message: "Contact this lead as soon as possible.",
    };
  }

  if (type === "appointment" && status === "pending") {
    return {
      label: "High",
      level: "high",
      message: "Confirm this appointment quickly.",
    };
  }

  if (status === "new" || !status) {
    return {
      label: ageDays >= 2 ? "High" : "Medium",
      level: ageDays >= 2 ? "high" : "medium",
      message:
        ageDays >= 2
          ? "New lead is aging without enough action."
          : "New lead should be contacted soon.",
    };
  }

  if (ageDays >= 7) {
    return {
      label: "High",
      level: "high",
      message: "Lead is getting old and needs recovery follow-up.",
    };
  }

  return {
    label: "Normal",
    level: "normal",
    message: "No urgent action detected.",
  };
}

export function getAiRecommendedAction(lead = {}, type = "inquiry") {
  const status = normalize(lead.status);
  const priority = normalize(lead.priority);
  const appointmentStage = normalize(lead.appointment_stage);
  const text = buildLeadSearchText(lead);
  const ageDays = daysSince(lead.created_at);

  if (priority === "vip") {
    return "Call personally and move this lead to senior counselor handling.";
  }

  if (includesAny(text, ["visa", "deadline", "intake", "urgent", "asap"])) {
    return "Contact immediately and confirm deadline, intake, and document status.";
  }

  if (type === "appointment") {
    if (status === "pending") {
      return "Confirm appointment time and send consultation reminder.";
    }

    if (appointmentStage === "consultation_done") {
      return "Send post-consultation follow-up and collect missing documents.";
    }

    if (appointmentStage === "follow_up_needed") {
      return "Create follow-up reminder and push toward application decision.";
    }
  }

  if (status === "new" || !status) {
    return "Send first response, qualify budget, country, intake, and study level.";
  }

  if (status === "contacted") {
    return "Follow up with university options and next-step checklist.";
  }

  if (status === "documents_pending") {
    return "Request missing documents and set a reminder deadline.";
  }

  if (status === "applied" || status === "offer_letter") {
    return "Track application progress and prepare visa/payment guidance.";
  }

  if (ageDays >= 7) {
    return "Send recovery follow-up before the lead becomes inactive.";
  }

  return "Keep nurturing this lead with helpful next-step guidance.";
}

export function enrichLeadWithAi(lead = {}, type = "inquiry") {
  const scoreData = calculateAiLeadScore(lead, type);
  const tier = getAiLeadTier(scoreData.score);
  const urgency = getAiUrgencyLevel(lead, type);
  const conversionProbability = getAiConversionProbability(scoreData.score);
  const recommendedAction = getAiRecommendedAction(lead, type);

  return {
    ...lead,
    ai_score: scoreData.score,
    ai_reasons: scoreData.reasons,
    ai_age_days: scoreData.ageDays,
    ai_tier: tier,
    ai_urgency: urgency,
    ai_conversion_probability: conversionProbability,
    ai_recommended_action: recommendedAction,
  };
}

export function rankLeadsByAiPriority(leads = [], type = "inquiry") {
  return [...leads]
    .map((lead) => enrichLeadWithAi(lead, type))
    .sort((a, b) => {
      if (b.ai_score !== a.ai_score) return b.ai_score - a.ai_score;
      return daysSince(a.created_at) - daysSince(b.created_at);
    });
}

export function buildAiLeadInsights({ inquiries = [], appointments = [] } = {}) {
  const enrichedInquiries = rankLeadsByAiPriority(inquiries, "inquiry");
  const enrichedAppointments = rankLeadsByAiPriority(appointments, "appointment");
  const allLeads = [
    ...enrichedInquiries.map((lead) => ({ ...lead, lead_type: "inquiry" })),
    ...enrichedAppointments.map((lead) => ({ ...lead, lead_type: "appointment" })),
  ].sort((a, b) => b.ai_score - a.ai_score);

  const hotLeads = allLeads.filter((lead) => lead.ai_tier.level === "hot");
  const warmLeads = allLeads.filter((lead) => lead.ai_tier.level === "warm");
  const immediateLeads = allLeads.filter(
    (lead) => lead.ai_urgency.level === "immediate"
  );
  const highUrgencyLeads = allLeads.filter(
    (lead) => lead.ai_urgency.level === "high"
  );

  const averageScore = allLeads.length
    ? Math.round(
        allLeads.reduce((sum, lead) => sum + lead.ai_score, 0) / allLeads.length
      )
    : 0;

  return {
    enrichedInquiries,
    enrichedAppointments,
    allLeads,
    topLeads: allLeads.slice(0, 10),
    hotLeads,
    warmLeads,
    immediateLeads,
    highUrgencyLeads,
    averageScore,
    totalAnalyzed: allLeads.length,
  };
}
