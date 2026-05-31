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
  "payment",
  "deposit",
  "bank statement",
  "sop",
  "cas",
  "loa",
  "offer",
];

const LOW_INTENT_WORDS = [
  "just asking",
  "maybe",
  "not sure",
  "later",
  "thinking",
  "confused",
  "general info",
  "just info",
  "checking",
  "time pass",
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
  "cyber security",
  "nursing",
  "healthcare",
  "finance",
];

const STRONG_PIPELINE_STATUSES = [
  "converted",
  "approved",
  "applied",
  "offer_letter",
  "visa_process",
  "enrolled",
  "paid",
  "payment_done",
];

const NEGATIVE_PIPELINE_STATUSES = [
  "lost",
  "cancelled",
  "not_interested",
  "rejected",
  "inactive",
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
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

function safeNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function hasContactInfo(lead = {}) {
  return Boolean(
    lead.email ||
      lead.phone ||
      lead.whatsapp ||
      lead.contact_number ||
      lead.phone_number
  );
}

function hasPhoneInfo(lead = {}) {
  return Boolean(lead.phone || lead.phone_number || lead.whatsapp || lead.contact_number);
}

function hasEmailInfo(lead = {}) {
  return Boolean(lead.email);
}

function buildLeadSearchText(lead = {}) {
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
    lead.city,
    lead.field_of_interest,
    lead.study_level,
    lead.level,
    lead.consultation_type,
    lead.counseling_mode,
    lead.course,
    lead.program,
    lead.study_field,
    lead.message,
    lead.notes,
    lead.consultation_notes,
    lead.status,
    lead.priority,
    lead.appointment_stage,
    lead.pipeline_stage,
    lead.stage,
    lead.budget,
    lead.budget_range,
    lead.ielts_score,
    lead.english_score,
    lead.academic_score,
    lead.intake,
    lead.preferred_intake,
  ]
    .filter(Boolean)
    .join(" ");
}

function getLeadName(lead = {}) {
  return lead.full_name || lead.name || lead.student_name || "Unnamed Student";
}

function getLeadCountry(lead = {}) {
  return lead.country || lead.country_interest || lead.preferred_country || "";
}

function getLeadProgram(lead = {}) {
  return (
    lead.field_of_interest ||
    lead.course ||
    lead.program ||
    lead.study_field ||
    lead.consultation_type ||
    ""
  );
}

function getLeadStatus(lead = {}) {
  return lead.status || lead.appointment_stage || lead.pipeline_stage || lead.stage || "new";
}

function getLeadPriority(lead = {}) {
  return lead.priority || "low";
}

function getStoredGptIntelligence(lead = {}) {
  const source =
    lead.gpt_intelligence ||
    lead.ai_intelligence ||
    lead.gpt_analysis ||
    lead.ai_analysis ||
    lead.ai_profile ||
    null;

  const direct = {
    score: lead.gpt_ai_score ?? lead.ai_gpt_score ?? lead.ai_score_gpt ?? lead.ai_score,
    intent: lead.gpt_intent_level ?? lead.ai_intent_level ?? lead.intent_level,
    riskLevel: lead.gpt_risk_level ?? lead.ai_risk_level ?? lead.risk_level,
    conversionProbability:
      lead.gpt_conversion_probability ??
      lead.ai_conversion_probability_gpt ??
      lead.conversion_probability,
    priority: lead.gpt_priority ?? lead.ai_priority,
    summary: lead.gpt_summary ?? lead.ai_summary,
    nextAction: lead.gpt_next_action ?? lead.ai_next_action,
    counselorStrategy: lead.gpt_counselor_strategy ?? lead.ai_counselor_strategy,
    generatedAt: lead.gpt_analyzed_at ?? lead.ai_analyzed_at,
    confidence: lead.gpt_confidence ?? lead.ai_confidence,
  };

  const objectSource = source && typeof source === "object" ? source : {};

  const merged = {
    score:
      safeNumber(objectSource.score, null) ??
      safeNumber(objectSource.ai_score, null) ??
      safeNumber(direct.score, null),
    intent: objectSource.intent || objectSource.intent_level || direct.intent || null,
    riskLevel:
      objectSource.risk_level || objectSource.riskLevel || direct.riskLevel || null,
    conversionProbability:
      objectSource.conversion_probability ||
      objectSource.conversionProbability ||
      direct.conversionProbability ||
      null,
    priority: objectSource.priority || direct.priority || null,
    summary: objectSource.summary || direct.summary || null,
    nextAction:
      objectSource.next_action || objectSource.nextAction || direct.nextAction || null,
    counselorStrategy:
      objectSource.counselor_strategy ||
      objectSource.counselorStrategy ||
      direct.counselorStrategy ||
      null,
    generatedAt:
      objectSource.generated_at || objectSource.generatedAt || direct.generatedAt || null,
    confidence: objectSource.confidence || direct.confidence || null,
  };

  const hasStoredGpt = Boolean(
    merged.score !== null ||
      merged.intent ||
      merged.riskLevel ||
      merged.conversionProbability ||
      merged.summary ||
      merged.nextAction ||
      merged.counselorStrategy
  );

  return {
    ...merged,
    score: merged.score === null ? null : clamp(merged.score),
    hasStoredGpt,
  };
}

function getDataCompleteness(lead = {}) {
  const checks = [
    { key: "contact", label: "Contact details", passed: hasContactInfo(lead) },
    { key: "phone", label: "Phone / WhatsApp", passed: hasPhoneInfo(lead) },
    { key: "email", label: "Email", passed: hasEmailInfo(lead) },
    { key: "country", label: "Preferred country", passed: Boolean(getLeadCountry(lead)) },
    { key: "program", label: "Program / field", passed: Boolean(getLeadProgram(lead)) },
    { key: "study_level", label: "Study level", passed: Boolean(lead.study_level || lead.level) },
    { key: "budget", label: "Budget", passed: Boolean(lead.budget || lead.budget_range) },
    {
      key: "english_score",
      label: "IELTS / English score",
      passed: Boolean(lead.ielts_score || lead.english_score || lead.pte_score || lead.duolingo_score),
    },
    {
      key: "academic_score",
      label: "Academic score",
      passed: Boolean(lead.academic_score || lead.marks || lead.cgpa || lead.percentage),
    },
    { key: "intake", label: "Preferred intake", passed: Boolean(lead.intake || lead.preferred_intake) },
    {
      key: "notes",
      label: "Student notes / message",
      passed: Boolean(lead.notes || lead.message || lead.consultation_notes),
    },
  ];

  const passed = checks.filter((check) => check.passed);
  const missing = checks.filter((check) => !check.passed);
  const score = checks.length ? clamp((passed.length / checks.length) * 100) : 0;

  return {
    score,
    total: checks.length,
    passedCount: passed.length,
    missingCount: missing.length,
    checks,
    missingLabels: missing.map((item) => item.label),
    passedLabels: passed.map((item) => item.label),
  };
}

function getEngagementScore(lead = {}, type = "inquiry") {
  const ageDays = daysSince(lead.created_at);
  const updatedAgeDays = daysSince(lead.updated_at || lead.last_activity_at || lead.last_contacted_at);
  const status = normalize(getLeadStatus(lead));
  const text = buildLeadSearchText(lead);

  let score = 45;
  const reasons = [];

  if (type === "appointment") {
    score += 14;
    reasons.push("Appointment indicates stronger engagement than a raw inquiry.");
  }

  if (ageDays === 0) {
    score += 14;
    reasons.push("Lead was created today.");
  } else if (ageDays <= 2) {
    score += 9;
    reasons.push("Lead is still fresh.");
  } else if (ageDays <= 7) {
    score += 2;
    reasons.push("Lead is still within a workable follow-up window.");
  } else {
    score -= 12;
    reasons.push("Lead is aging and needs recovery action.");
  }

  if (updatedAgeDays <= 1) {
    score += 10;
    reasons.push("Recent CRM activity detected.");
  } else if (updatedAgeDays >= 7) {
    score -= 8;
    reasons.push("No recent CRM activity detected.");
  }

  if (includesAny(text, HIGH_INTENT_WORDS)) {
    score += 12;
    reasons.push("High-intent wording appears in the lead details.");
  }

  if (includesAny(text, LOW_INTENT_WORDS)) {
    score -= 12;
    reasons.push("Exploratory or low-intent wording appears in the lead details.");
  }

  if (status === "contacted" || status === "interested") {
    score += 8;
    reasons.push("Lead has moved beyond first stage.");
  }

  return {
    score: clamp(score),
    reasons,
  };
}

function getIntentScore(lead = {}, type = "inquiry") {
  const text = buildLeadSearchText(lead);
  const country = normalize(getLeadCountry(lead));
  const program = normalize(getLeadProgram(lead));
  const priority = normalize(getLeadPriority(lead));
  const status = normalize(getLeadStatus(lead));

  let score = 35;
  const reasons = [];

  if (type === "appointment") {
    score += 15;
    reasons.push("Appointment booking shows active intent.");
  }

  if (priority === "vip") {
    score += 20;
    reasons.push("VIP priority increases counselor intent confidence.");
  } else if (priority === "high") {
    score += 14;
    reasons.push("High priority increases counselor intent confidence.");
  }

  if (HIGH_VALUE_COUNTRIES.includes(country)) {
    score += 10;
    reasons.push("Target country is a high-value destination.");
  }

  if (program) {
    score += 8;
    reasons.push("Student has a defined program or field interest.");
  }

  if (includesAny(program, VIP_FIELDS)) {
    score += 8;
    reasons.push("Program field usually has strong counseling value.");
  }

  if (includesAny(text, HIGH_INTENT_WORDS)) {
    score += 18;
    reasons.push("Lead contains high-intent admission/visa wording.");
  }

  if (includesAny(text, LOW_INTENT_WORDS)) {
    score -= 15;
    reasons.push("Lead wording appears exploratory or uncertain.");
  }

  if (STRONG_PIPELINE_STATUSES.includes(status)) {
    score += 20;
    reasons.push("Lead is already deep inside the pipeline.");
  }

  if (NEGATIVE_PIPELINE_STATUSES.includes(status)) {
    score -= 25;
    reasons.push("Lead is marked negative or inactive.");
  }

  return {
    score: clamp(score),
    reasons,
  };
}

function getVisaReadinessScore(lead = {}) {
  let score = 20;
  const reasons = [];

  if (getLeadCountry(lead)) {
    score += 12;
    reasons.push("Preferred country is available.");
  }

  if (getLeadProgram(lead)) {
    score += 10;
    reasons.push("Program or field interest is available.");
  }

  if (lead.study_level || lead.level) {
    score += 8;
    reasons.push("Study level is available.");
  }

  if (lead.academic_score || lead.marks || lead.cgpa || lead.percentage) {
    score += 12;
    reasons.push("Academic score is available.");
  }

  if (lead.ielts_score || lead.english_score || lead.pte_score || lead.duolingo_score) {
    score += 12;
    reasons.push("English test score is available.");
  }

  if (lead.budget || lead.budget_range) {
    score += 12;
    reasons.push("Budget details are available.");
  }

  if (lead.documents_submitted || lead.document_status === "submitted") {
    score += 16;
    reasons.push("Documents appear submitted.");
  }

  if (normalize(getLeadStatus(lead)) === "documents_pending") {
    score -= 14;
    reasons.push("Documents are pending.");
  }

  return {
    score: clamp(score),
    reasons,
  };
}

function getRiskScore(lead = {}, type = "inquiry") {
  const completeness = getDataCompleteness(lead);
  const ageDays = daysSince(lead.created_at);
  const status = normalize(getLeadStatus(lead));
  const priority = normalize(getLeadPriority(lead));
  const text = buildLeadSearchText(lead);

  let score = 20;
  const reasons = [];

  if (!hasContactInfo(lead)) {
    score += 25;
    reasons.push("Missing contact details create a major follow-up risk.");
  }

  if (!hasPhoneInfo(lead)) {
    score += 10;
    reasons.push("No phone or WhatsApp available.");
  }

  if (completeness.score < 45) {
    score += 20;
    reasons.push("Profile has low qualification completeness.");
  } else if (completeness.score < 65) {
    score += 10;
    reasons.push("Profile still has important missing qualification details.");
  }

  if (status === "documents_pending") {
    score += 14;
    reasons.push("Documents pending can block conversion.");
  }

  if (NEGATIVE_PIPELINE_STATUSES.includes(status)) {
    score += 30;
    reasons.push("Lead is already in a negative or inactive stage.");
  }

  if (ageDays >= 14) {
    score += 18;
    reasons.push("Lead is very old and may be cold.");
  } else if (ageDays >= 7) {
    score += 10;
    reasons.push("Lead is aging and needs action.");
  }

  if (includesAny(text, LOW_INTENT_WORDS)) {
    score += 10;
    reasons.push("Lead language appears uncertain or low intent.");
  }

  if (priority === "vip" || priority === "high") {
    score -= 6;
    reasons.push("Priority marking reduces drop-off risk if followed quickly.");
  }

  if (type === "appointment") {
    score -= 8;
    reasons.push("Appointment booking reduces uncertainty risk.");
  }

  return {
    score: clamp(score),
    reasons,
  };
}

export function calculateAiLeadScore(lead = {}, type = "inquiry") {
  const text = buildLeadSearchText(lead);
  const country = normalize(getLeadCountry(lead));
  const field = normalize(getLeadProgram(lead));
  const status = normalize(getLeadStatus(lead));
  const priority = normalize(getLeadPriority(lead));
  const appointmentStage = normalize(lead.appointment_stage);
  const ageDays = daysSince(lead.created_at);
  const completeness = getDataCompleteness(lead);
  const intent = getIntentScore(lead, type);
  const engagement = getEngagementScore(lead, type);
  const risk = getRiskScore(lead, type);
  const visaReadiness = getVisaReadinessScore(lead);

  let score = 28;
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

  if (STRONG_PIPELINE_STATUSES.includes(status)) {
    score += 22;
    reasons.push("Lead already reached a strong conversion stage.");
  } else if (status === "contacted" || status === "interested") {
    score += 10;
    reasons.push("Lead has already moved beyond new stage.");
  } else if (NEGATIVE_PIPELINE_STATUSES.includes(status)) {
    score -= 25;
    reasons.push("Lead is marked lost, cancelled, inactive, or not interested.");
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

  score += Math.round((intent.score - 50) * 0.22);
  score += Math.round((engagement.score - 50) * 0.18);
  score += Math.round((completeness.score - 50) * 0.14);
  score += Math.round((visaReadiness.score - 50) * 0.1);
  score -= Math.round((risk.score - 35) * 0.16);

  const storedGpt = getStoredGptIntelligence(lead);

  if (storedGpt.hasStoredGpt && storedGpt.score !== null) {
    const localScore = clamp(score);
    score = Math.round(localScore * 0.55 + storedGpt.score * 0.45);
    reasons.push("Stored GPT intelligence adjusted the local lead score.");
  }

  score = clamp(score);

  return {
    score,
    reasons,
    ageDays,
    componentScores: {
      intent: intent.score,
      engagement: engagement.score,
      dataCompleteness: completeness.score,
      visaReadiness: visaReadiness.score,
      risk: risk.score,
      localOnlyScore: clamp(score),
      storedGptScore: storedGpt.score,
    },
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

export function getAiConversionRange(score = 0) {
  if (score >= 90) return "75–90%";
  if (score >= 75) return "60–75%";
  if (score >= 55) return "40–60%";
  if (score >= 35) return "20–40%";
  return "0–20%";
}

export function getAiUrgencyLevel(lead = {}, type = "inquiry") {
  const status = normalize(getLeadStatus(lead));
  const priority = normalize(getLeadPriority(lead));
  const ageDays = daysSince(lead.created_at);
  const text = buildLeadSearchText(lead);
  const storedGpt = getStoredGptIntelligence(lead);

  if (storedGpt.hasStoredGpt && normalize(storedGpt.riskLevel) === "high") {
    return {
      label: "Immediate",
      level: "immediate",
      message: "Stored GPT analysis flags this lead as high risk.",
      source: "stored_gpt",
    };
  }

  if (
    priority === "vip" ||
    includesAny(text, ["urgent", "asap", "deadline", "visa", "intake"])
  ) {
    return {
      label: "Immediate",
      level: "immediate",
      message: "Contact this lead as soon as possible.",
      source: "local_engine",
    };
  }

  if (type === "appointment" && status === "pending") {
    return {
      label: "High",
      level: "high",
      message: "Confirm this appointment quickly.",
      source: "local_engine",
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
      source: "local_engine",
    };
  }

  if (ageDays >= 7) {
    return {
      label: "High",
      level: "high",
      message: "Lead is getting old and needs recovery follow-up.",
      source: "local_engine",
    };
  }

  return {
    label: "Normal",
    level: "normal",
    message: "No urgent action detected.",
    source: "local_engine",
  };
}

export function getAiRecommendedAction(lead = {}, type = "inquiry") {
  const storedGpt = getStoredGptIntelligence(lead);

  if (storedGpt.hasStoredGpt && storedGpt.nextAction) {
    return storedGpt.nextAction;
  }

  const status = normalize(getLeadStatus(lead));
  const priority = normalize(getLeadPriority(lead));
  const appointmentStage = normalize(lead.appointment_stage);
  const text = buildLeadSearchText(lead);
  const ageDays = daysSince(lead.created_at);
  const completeness = getDataCompleteness(lead);

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

  if (completeness.score < 45) {
    return "Collect missing qualification data before making a strong recommendation.";
  }

  if (ageDays >= 7) {
    return "Send recovery follow-up before the lead becomes inactive.";
  }

  return "Keep nurturing this lead with helpful next-step guidance.";
}

export function getAiRiskLevel(riskScore = 0) {
  if (riskScore >= 75) return { label: "High Risk", level: "high" };
  if (riskScore >= 50) return { label: "Medium Risk", level: "medium" };
  if (riskScore >= 30) return { label: "Low Risk", level: "low" };
  return { label: "Very Low Risk", level: "very_low" };
}

export function getAiIntentLevel(intentScore = 0) {
  if (intentScore >= 78) return { label: "High Intent", level: "high" };
  if (intentScore >= 55) return { label: "Medium Intent", level: "medium" };
  if (intentScore >= 35) return { label: "Low Intent", level: "low" };
  return { label: "Very Low Intent", level: "very_low" };
}

export function buildAiSignals(lead = {}, type = "inquiry") {
  const intent = getIntentScore(lead, type);
  const engagement = getEngagementScore(lead, type);
  const completeness = getDataCompleteness(lead);
  const visaReadiness = getVisaReadinessScore(lead);
  const risk = getRiskScore(lead, type);
  const storedGpt = getStoredGptIntelligence(lead);

  const riskSignals = [
    ...risk.reasons,
    ...(!hasPhoneInfo(lead) ? ["No direct phone/WhatsApp contact available."] : []),
    ...(completeness.missingCount >= 5 ? ["Lead profile has many missing qualification fields."] : []),
  ];

  const opportunitySignals = [
    ...(getLeadCountry(lead) ? [`Clear country interest: ${getLeadCountry(lead)}.`] : []),
    ...(getLeadProgram(lead) ? [`Clear program interest: ${getLeadProgram(lead)}.`] : []),
    ...(hasPhoneInfo(lead) ? ["Direct phone/WhatsApp contact available."] : []),
    ...(hasEmailInfo(lead) ? ["Email contact available."] : []),
    ...(intent.score >= 70 ? ["Intent score suggests strong counseling opportunity."] : []),
    ...(storedGpt.hasStoredGpt ? ["Stored GPT intelligence is available for this lead."] : []),
  ];

  return {
    intent,
    engagement,
    completeness,
    visaReadiness,
    risk,
    storedGpt,
    riskSignals,
    opportunitySignals,
  };
}

export function enrichLeadWithAi(lead = {}, type = "inquiry") {
  const scoreData = calculateAiLeadScore(lead, type);
  const tier = getAiLeadTier(scoreData.score);
  const urgency = getAiUrgencyLevel(lead, type);
  const conversionProbability = getAiConversionProbability(scoreData.score);
  const conversionRange = getAiConversionRange(scoreData.score);
  const recommendedAction = getAiRecommendedAction(lead, type);
  const signals = buildAiSignals(lead, type);
  const riskLevel = getAiRiskLevel(signals.risk.score);
  const intentLevel = getAiIntentLevel(signals.intent.score);
  const storedGpt = signals.storedGpt;

  return {
    ...lead,
    ai_score: scoreData.score,
    ai_reasons: scoreData.reasons,
    ai_age_days: scoreData.ageDays,
    ai_tier: tier,
    ai_urgency: urgency,
    ai_conversion_probability: storedGpt.conversionProbability || conversionProbability,
    ai_conversion_range: conversionRange,
    ai_recommended_action: recommendedAction,
    ai_component_scores: scoreData.componentScores,
    ai_intent_score: signals.intent.score,
    ai_intent_level: storedGpt.intent
      ? { label: titleCase(storedGpt.intent), level: normalize(storedGpt.intent) }
      : intentLevel,
    ai_engagement_score: signals.engagement.score,
    ai_data_completeness_score: signals.completeness.score,
    ai_data_completeness: signals.completeness,
    ai_visa_readiness_score: signals.visaReadiness.score,
    ai_visa_readiness_reasons: signals.visaReadiness.reasons,
    ai_risk_score: signals.risk.score,
    ai_risk_level: storedGpt.riskLevel
      ? { label: titleCase(storedGpt.riskLevel), level: normalize(storedGpt.riskLevel) }
      : riskLevel,
    ai_risk_reasons: signals.risk.reasons,
    ai_risk_signals: signals.riskSignals,
    ai_opportunity_signals: signals.opportunitySignals,
    ai_missing_items: signals.completeness.missingLabels,
    ai_has_stored_gpt: storedGpt.hasStoredGpt,
    ai_gpt_summary: storedGpt.summary,
    ai_gpt_strategy: storedGpt.counselorStrategy,
    ai_gpt_generated_at: storedGpt.generatedAt,
    ai_engine_version: storedGpt.hasStoredGpt ? "hybrid_v4" : "local_v4",
  };
}

export function rankLeadsByAiPriority(leads = [], type = "inquiry") {
  return [...leads]
    .map((lead) => enrichLeadWithAi(lead, type))
    .sort((a, b) => {
      if (b.ai_score !== a.ai_score) return b.ai_score - a.ai_score;
      if (b.ai_intent_score !== a.ai_intent_score) return b.ai_intent_score - a.ai_intent_score;
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
  const nurtureLeads = allLeads.filter((lead) => lead.ai_tier.level === "nurture");
  const coldLeads = allLeads.filter((lead) => lead.ai_tier.level === "cold");
  const immediateLeads = allLeads.filter(
    (lead) => lead.ai_urgency.level === "immediate"
  );
  const highUrgencyLeads = allLeads.filter(
    (lead) => lead.ai_urgency.level === "high"
  );
  const highRiskLeads = allLeads.filter(
    (lead) => lead.ai_risk_level?.level === "high" || lead.ai_risk_score >= 75
  );
  const strongIntentLeads = allLeads.filter(
    (lead) => lead.ai_intent_level?.level === "high" || lead.ai_intent_score >= 78
  );
  const weakDataLeads = allLeads.filter(
    (lead) => lead.ai_data_completeness_score < 50
  );
  const storedGptLeads = allLeads.filter((lead) => lead.ai_has_stored_gpt);

  const averageScore = average(allLeads.map((lead) => lead.ai_score));
  const averageIntent = average(allLeads.map((lead) => lead.ai_intent_score));
  const averageRisk = average(allLeads.map((lead) => lead.ai_risk_score));
  const averageCompleteness = average(
    allLeads.map((lead) => lead.ai_data_completeness_score)
  );
  const averageVisaReadiness = average(
    allLeads.map((lead) => lead.ai_visa_readiness_score)
  );

  return {
    enrichedInquiries,
    enrichedAppointments,
    allLeads,
    topLeads: allLeads.slice(0, 10),
    hotLeads,
    warmLeads,
    nurtureLeads,
    coldLeads,
    immediateLeads,
    highUrgencyLeads,
    highRiskLeads,
    strongIntentLeads,
    weakDataLeads,
    storedGptLeads,
    averageScore,
    averageIntent,
    averageRisk,
    averageCompleteness,
    averageVisaReadiness,
    totalAnalyzed: allLeads.length,
    hybridCoveragePercent: allLeads.length
      ? clamp((storedGptLeads.length / allLeads.length) * 100)
      : 0,
  };
}

function average(values = []) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));

  if (!valid.length) return 0;

  return Math.round(
    valid.reduce((sum, value) => sum + Number(value), 0) / valid.length
  );
}

export const aiLeadEngineMeta = {
  version: "hybrid_v4",
  scoringMode: "local_fallback_plus_stored_gpt",
  supportsStoredGpt: true,
  recommendedGptUse:
    "Run GPT on lead creation/update or manual reanalysis, then store results for dashboard/card reuse.",
};
