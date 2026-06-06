function getTomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function getDateAfterDays(days = 1) {
  return new Date(Date.now() + Number(days || 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Student";
}

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getJourneyStage(score = {}) {
  const direct = normalize(score.journey_stage || score?.diagnostics?.journey_stage);
  if (direct) return direct;

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const visaStatus = normalize(score.visa_status);

  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visaStatus)) {
    return "visa_pending";
  }

  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";

  if (
    ["offer_accepted", "accepted"].includes(applicationStatus) ||
    ["offer_accepted", "accepted"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      applicationStatus
    ) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      offerStatus
    )
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (["started", "draft", "in_progress"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getScoreValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
}

function mapTaskPriority(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return "critical";
  if (clean === "executive") return "high";
  if (clean === "high") return "high";
  if (clean === "medium") return "medium";
  if (clean === "low") return "low";

  return "medium";
}

function approvalRequired(recommendation = {}) {
  const priority = normalize(recommendation.priority);
  return priority === "critical" || priority === "executive";
}

function getDefaultDueDate(recommendation = {}) {
  const type = normalize(recommendation.type);
  const priority = normalize(recommendation.priority);

  if (priority === "critical") return getTomorrowDate();

  if (
    [
      "critical_case_review",
      "visa_rejection_review",
      "cas_issued_start_visa",
      "offer_accepted_next_steps",
      "fast_track_student",
      "application_ready",
    ].includes(type)
  ) {
    return getTomorrowDate();
  }

  if (
    [
      "cas_pending_follow_up",
      "visa_monitoring",
      "offer_follow_up",
      "conversion_opportunity",
    ].includes(type)
  ) {
    return getDateAfterDays(2);
  }

  return getDateAfterDays(3);
}

function basePayload(score = {}, recommendation = {}) {
  return {
    student_id: String(score.student_id || score.id || ""),
    student_type: score.student_type || score.__leadType || score.type || "inquiry",
    student_name: getStudentName(score),

    risk_score: number(score.risk_score),
    opportunity_score: number(score.opportunity_score),
    risk_level: score.risk_level || "Low",
    priority_level: score.priority_level || "Standard",
    executive_category: score.executive_category || "Standard",
    summary: score.summary || "",

    journey_stage: getJourneyStage(score),
    application_status: score.application_status || "",
    offer_status: score.offer_status || "",
    visa_status: score.visa_status || "",

    document_readiness_percent: number(getScoreValue(score, "document_readiness_percent")),
    task_completion_percent: number(getScoreValue(score, "task_completion_percent")),
    pending_tasks_count: number(getScoreValue(score, "pending_tasks_count")),
    overdue_tasks_count: number(getScoreValue(score, "overdue_tasks_count")),
    university_plan_count: number(getScoreValue(score, "university_plan_count")),
    safe_university_count: number(getScoreValue(score, "safe_university_count")),
    target_university_count: number(getScoreValue(score, "target_university_count")),
    dream_university_count: number(getScoreValue(score, "dream_university_count")),
    days_since_updated: getScoreValue(score, "days_since_updated", null),

    recommendation_type: recommendation.type || "",
    recommendation_priority: recommendation.priority || "medium",

    generated_by: "executive_ai",
    generated_at: new Date().toISOString(),
    approval_required: approvalRequired(recommendation),
  };
}

function getRecommendationText(recommendation = {}, fallback = "") {
  return recommendation.description || recommendation.payload?.description || fallback;
}

function buildStudentMessage(score = {}, recommendation = {}, channel = "whatsapp") {
  const studentName = getStudentName(score);
  const type = normalize(recommendation.type);
  const journeyStage = getJourneyStage(score);

  if (type === "success_story" || journeyStage === "visa_approved") {
    return `Congratulations ${studentName}! Your visa success is a major milestone. Zaifan Consultancy is proud to be part of your journey.`;
  }

  if (type === "fast_track_student") {
    return channel === "email"
      ? `Hi ${studentName},

Your profile is showing strong progress and looks ready for the next milestone. Our team would like to fast-track your next step and guide you clearly.

Best regards,
Zaifan Consultancy Team`
      : `Hi ${studentName}, your profile is showing strong progress. Let's fast-track your next study abroad milestone.`;
  }

  if (type === "application_ready") {
    return `Hi ${studentName}, your profile looks ready for application submission. Let's review your documents and university shortlist so we can move forward.`;
  }

  if (type === "conversion_opportunity") {
    return channel === "email"
      ? `Hi ${studentName},

We reviewed your profile and your case is ready to move forward. Let's complete the next step in your study abroad journey.

Best regards,
Zaifan Consultancy Team`
      : `Hi ${studentName}, your profile looks ready for the next step. Let's move your study abroad process forward.`;
  }

  if (type === "offer_follow_up" || journeyStage === "offer_received") {
    return `Hi ${studentName}, congratulations on reaching the offer stage. Let's discuss the next steps for offer acceptance, CAS, and visa preparation.`;
  }

  if (type === "offer_accepted_next_steps" || journeyStage === "offer_accepted") {
    return `Hi ${studentName}, your offer acceptance is an important step. Let's now prepare CAS, documents, and visa requirements.`;
  }

  if (type === "cas_pending_follow_up" || journeyStage === "cas_pending") {
    return `Hi ${studentName}, we are following up on your CAS progress. Please confirm any pending university, payment, or document requirements.`;
  }

  if (type === "cas_issued_start_visa" || journeyStage === "cas_issued") {
    return `Hi ${studentName}, your CAS stage is ready. Let's start your visa checklist and appointment preparation.`;
  }

  if (type === "visa_monitoring" || journeyStage === "visa_pending") {
    return `Hi ${studentName}, we are monitoring your visa progress. Please keep your documents and updates ready so we can support the next step.`;
  }

  if (type === "inactive_student") {
    return `Hi ${studentName}, this is Zaifan Consultancy. Just checking in on your study abroad process. Please let us know when you are available for the next step.`;
  }

  if (type === "document_readiness_gap") {
    return `Hi ${studentName}, we need to complete your pending documents to move your study abroad process forward. Please share the missing documents when available.`;
  }

  return channel === "email"
    ? `Hi ${studentName},

I hope you are doing well. I wanted to follow up regarding your study abroad process and the next steps.

Our team has reviewed your profile and would like to guide you on the next best action.

Best regards,
Zaifan Consultancy Team`
    : `Hi ${studentName}, this is Zaifan Consultancy. Just following up on your study abroad process. Please let us know when you are available for the next step.`;
}

function buildEmailSubject(score = {}, recommendation = {}) {
  const type = normalize(recommendation.type);
  const journeyStage = getJourneyStage(score);

  if (type === "success_story" || journeyStage === "visa_approved") {
    return "Congratulations on your visa success";
  }

  if (type === "fast_track_student") {
    return "Fast-track your next study abroad milestone";
  }

  if (type === "application_ready") {
    return "Your application is ready for next steps";
  }

  if (type === "conversion_opportunity") {
    return "Next steps for your study abroad journey";
  }

  if (type === "offer_follow_up" || journeyStage === "offer_received") {
    return "Offer received — next steps";
  }

  if (type === "offer_accepted_next_steps" || journeyStage === "offer_accepted") {
    return "Offer accepted — CAS and visa preparation";
  }

  if (type === "cas_pending_follow_up" || journeyStage === "cas_pending") {
    return "CAS follow-up and next steps";
  }

  if (type === "cas_issued_start_visa" || journeyStage === "cas_issued") {
    return "CAS issued — visa preparation";
  }

  if (type === "visa_monitoring" || journeyStage === "visa_pending") {
    return "Visa progress follow-up";
  }

  if (type === "document_readiness_gap") {
    return "Pending documents required";
  }

  return "Zaifan Consultancy Follow-Up";
}

export function buildExecutiveActionTemplate(score = {}, recommendation = {}) {
  const studentName = getStudentName(score);
  const base = {
    ...basePayload(score, recommendation),
    ...(recommendation.payload || {}),
  };

  const action = normalize(recommendation.action);
  const title = recommendation.title || recommendation.payload?.title || `Executive Action: ${studentName}`;
  const description =
    getRecommendationText(recommendation, score.summary || "Executive AI identified a student action.");

  if (action === "create_task") {
    return {
      actionType: "create_task",
      title,
      description,
      payload: {
        ...base,
        title,
        description,
        priority: mapTaskPriority(recommendation.priority),
        status: "pending",
        due_date:
          recommendation.payload?.due_date ||
          getDefaultDueDate(recommendation),
      },
    };
  }

  if (action === "schedule_call") {
    return {
      actionType: "schedule_call",
      title: recommendation.title || `Schedule Call: ${studentName}`,
      description,
      payload: {
        ...base,
        title: recommendation.title || `Schedule Conversion Call: ${studentName}`,
        description:
          description || "High opportunity student. Schedule a counselor conversion call.",
        priority: "high",
        status: "pending",
        due_date:
          recommendation.payload?.due_date ||
          getDefaultDueDate(recommendation),
      },
    };
  }

  if (action === "create_reminder") {
    return {
      actionType: "create_reminder",
      title: recommendation.title || `Executive Follow-Up: ${studentName}`,
      description,
      payload: {
        ...base,
        title: recommendation.title || `Executive Follow-Up: ${studentName}`,
        notes:
          recommendation.payload?.notes ||
          description ||
          score.summary ||
          "Executive AI recommends follow-up for this student.",
        due_date:
          recommendation.payload?.due_date ||
          getDefaultDueDate(recommendation),
        due_time: recommendation.payload?.due_time || null,
        status: "pending",
      },
    };
  }

  if (action === "send_email") {
    return {
      actionType: "send_email",
      title: `Email Draft: ${studentName}`,
      description: "Prepare an email draft for this student.",
      payload: {
        ...base,
        channel: "email",
        subject:
          recommendation.payload?.subject ||
          buildEmailSubject(score, recommendation),
        message:
          recommendation.payload?.message ||
          buildStudentMessage(score, recommendation, "email"),
        status: "draft",
      },
    };
  }

  if (action === "send_whatsapp") {
    return {
      actionType: "send_whatsapp",
      title: `WhatsApp Draft: ${studentName}`,
      description: "Prepare a WhatsApp draft for this student.",
      payload: {
        ...base,
        channel: "whatsapp",
        message:
          recommendation.payload?.message ||
          buildStudentMessage(score, recommendation, "whatsapp"),
        status: "draft",
      },
    };
  }

  return {
    actionType: "monitor",
    title: `Monitor ${studentName}`,
    description: "No direct CRM action required.",
    payload: {
      ...base,
      status: "monitor",
    },
  };
}

export function buildExecutiveActionTemplates(scores = [], recommendationsByScore = {}) {
  return (scores || []).flatMap((score) => {
    const key = `${score.student_id}-${score.student_type}`;
    const recommendations = recommendationsByScore[key] || [];

    return recommendations.map((recommendation) => ({
      score,
      recommendation,
      template: buildExecutiveActionTemplate(score, recommendation),
    }));
  });
}