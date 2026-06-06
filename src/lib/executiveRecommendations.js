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

function hasAny(text = "", words = []) {
  const clean = normalize(text);
  return words.some((word) => clean.includes(normalize(word)));
}

function addOnce(list, item) {
  if (!list.some((existing) => existing.type === item.type)) {
    list.push(item);
  }
}

function isBlankStatus(value) {
  const clean = normalize(value);
  return (
    !clean ||
    clean === "none" ||
    clean === "null" ||
    clean === "undefined" ||
    clean === "not_started" ||
    clean === "no_application"
  );
}

function isActiveApplication(status = "") {
  return [
    "started",
    "draft",
    "in_progress",
    "applied",
    "submitted",
    "under_review",
    "review",
    "processing",
  ].includes(normalize(status));
}

function isOfferReceived(status = "") {
  return [
    "offer",
    "offer_received",
    "received",
    "conditional_offer",
    "unconditional_offer",
  ].includes(normalize(status));
}

function isOfferAccepted(status = "") {
  return ["accepted", "offer_accepted", "confirmed"].includes(normalize(status));
}

function isVisaApproved(status = "") {
  return ["approved", "visa_approved"].includes(normalize(status));
}

function isVisaRejected(status = "") {
  return ["rejected", "visa_rejected", "refused", "visa_refused"].includes(
    normalize(status)
  );
}

function isVisaActive(status = "") {
  return [
    "pending",
    "visa_pending",
    "submitted",
    "under_review",
    "review",
    "processing",
    "in_progress",
  ].includes(normalize(status));
}

function getJourneyStage(score = {}) {
  const directStage = normalize(score.journey_stage || score?.diagnostics?.journey_stage);
  if (directStage) return directStage;

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const visaStatus = normalize(score.visa_status);

  if (isVisaApproved(visaStatus)) return "visa_approved";
  if (isVisaRejected(visaStatus)) return "visa_rejected";
  if (isVisaActive(visaStatus)) return "visa_pending";

  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";

  if (isOfferAccepted(applicationStatus) || isOfferAccepted(offerStatus)) {
    return "offer_accepted";
  }

  if (isOfferReceived(applicationStatus) || isOfferReceived(offerStatus)) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (isActiveApplication(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getScoreValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
}

function buildPayload(score = {}, overrides = {}) {
  return {
    student_id: score.student_id || score.id,
    student_type: score.student_type || score.__leadType || score.type || "inquiry",
    student_name: score.student_name || score.full_name || score.name || "Student",

    executive_category: score.executive_category || "",
    priority_level: score.priority_level || "",
    risk_score: number(score.risk_score),
    opportunity_score: number(score.opportunity_score),

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

    ...overrides,
  };
}

function makeRecommendation(score, config) {
  const studentName = score.student_name || score.full_name || score.name || "this student";
  const description =
    typeof config.description === "function"
      ? config.description(studentName)
      : config.description;

  return {
    type: config.type,
    priority: config.priority || "medium",
    action: config.action || "create_task",
    title: config.title,
    description,
    payload: buildPayload(score, {
      title: config.title,
      description,
      notes:
        typeof config.notes === "function"
          ? config.notes(studentName)
          : config.notes || description,
      due_date: config.due_date || null,
      due_time: config.due_time || null,
      priority: config.taskPriority || config.priority || "medium",
      channel: config.channel || null,
      subject:
        typeof config.subject === "function"
          ? config.subject(studentName)
          : config.subject || "",
      message:
        typeof config.message === "function"
          ? config.message(studentName)
          : config.message || "",
    }),
  };
}

export function buildExecutiveRecommendations(score = {}) {
  const recommendations = [];

  const riskScore = number(score.risk_score);
  const opportunityScore = number(score.opportunity_score);

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const visaStatus = normalize(score.visa_status);
  const executiveCategory = normalize(score.executive_category);
  const summary = normalize(score.summary);

  const journeyStage = getJourneyStage(score);

  const documentReadiness = number(getScoreValue(score, "document_readiness_percent"));
  const taskCompletion = number(getScoreValue(score, "task_completion_percent"));
  const pendingTasks = number(getScoreValue(score, "pending_tasks_count"));
  const overdueTasks = number(getScoreValue(score, "overdue_tasks_count"));
  const universityPlanCount = number(getScoreValue(score, "university_plan_count"));
  const daysSinceUpdated = number(getScoreValue(score, "days_since_updated"), -1);

  const dreamCount = number(getScoreValue(score, "dream_university_count"));
  const targetCount = number(getScoreValue(score, "target_university_count"));
  const safeCount = number(getScoreValue(score, "safe_university_count"));

  const noApplication =
    journeyStage === "not_started" ||
    isBlankStatus(applicationStatus) ||
    hasAny(summary, ["no_application", "application_not_started"]);

  const applicationStartedButNotSubmitted =
    journeyStage === "application_started" && daysSinceUpdated >= 7;

  const applicationStalled =
    ["application_submitted", "application_under_review"].includes(journeyStage) &&
    daysSinceUpdated >= 14 &&
    !isOfferReceived(offerStatus) &&
    !isOfferAccepted(offerStatus);

  const offerFollowUp =
    journeyStage === "offer_received" ||
    isOfferReceived(offerStatus) ||
    isOfferReceived(applicationStatus);

  const offerAccepted =
    journeyStage === "offer_accepted" ||
    isOfferAccepted(offerStatus) ||
    isOfferAccepted(applicationStatus);

  const casPending = journeyStage === "cas_pending";
  const casIssued = journeyStage === "cas_issued";

  const visaDelay =
    offerAccepted &&
    !isVisaActive(visaStatus) &&
    !isVisaApproved(visaStatus) &&
    daysSinceUpdated >= 5;

  const visaRejected =
    journeyStage === "visa_rejected" ||
    isVisaRejected(visaStatus) ||
    hasAny(summary, ["visa_rejected", "visa_refused"]);

  const visaMonitoring =
    journeyStage === "visa_pending" ||
    isVisaActive(visaStatus) ||
    hasAny(summary, ["visa_under_review", "visa_submitted"]);

  const successStory =
    journeyStage === "visa_approved" ||
    isVisaApproved(visaStatus) ||
    executiveCategory === "success_story" ||
    hasAny(summary, ["visa_approved", "success_story"]);

  const inactiveStudent = daysSinceUpdated >= 14 && riskScore >= 45;

  const documentWeakness =
    documentReadiness < 60 ||
    hasAny(summary, ["no_documents", "documents_pending", "documents_incomplete"]);

  const taskWeakness = overdueTasks > 0 || pendingTasks >= 4 || taskCompletion < 50;

  const missingUniversityPlan =
    universityPlanCount <= 0 ||
    hasAny(summary, ["no_university_plan", "no_university"]);

  const missingDreamUniversities = universityPlanCount > 0 && dreamCount === 0;
  const missingTargetUniversities = universityPlanCount > 0 && targetCount === 0;
  const missingSafeUniversities = universityPlanCount > 0 && safeCount === 0;

  const applicationReady =
    ["application_started", "not_started"].includes(journeyStage) &&
    documentReadiness >= 80 &&
    taskCompletion >= 60 &&
    universityPlanCount >= 3 &&
    riskScore < 65;

  const conversionOpportunity =
    opportunityScore >= 55 &&
    riskScore < 65 &&
    (documentReadiness >= 60 || taskCompletion >= 60 || offerFollowUp || offerAccepted);

  const fastTrack =
    opportunityScore >= 80 &&
    riskScore < 45 &&
    documentReadiness >= 75 &&
    taskCompletion >= 70;

  if (visaRejected || riskScore >= 85) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "critical_case_review",
        priority: "critical",
        action: "create_task",
        title: visaRejected ? "Visa rejection review" : "Critical executive review",
        description: (studentName) =>
          `${studentName} has a serious risk signal. Review the case, identify the blocker, and create a recovery plan.`,
        taskPriority: "critical",
      })
    );
  }

  if (noApplication) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "application_not_started",
        priority: "high",
        action: "create_task",
        title: "Application not started",
        description: (studentName) =>
          `${studentName} has no active application. Assign a counselor task to begin the application journey.`,
        taskPriority: "high",
      })
    );
  }

  if (applicationReady) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "application_ready",
        priority: "executive",
        action: "create_task",
        title: "Application ready",
        description: (studentName) =>
          `${studentName} appears ready for application submission. Review shortlist, documents, and submit the next application.`,
        taskPriority: "high",
      })
    );
  }

  if (applicationStartedButNotSubmitted) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "application_started_not_submitted",
        priority: "medium",
        action: "create_reminder",
        title: "Application started but not submitted",
        description: (studentName) =>
          `${studentName} has started an application but has not submitted it yet. Follow up and remove the blocker.`,
        taskPriority: "medium",
      })
    );
  }

  if (applicationStalled) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "application_stalled",
        priority: "high",
        action: "create_reminder",
        title: "Application stalled",
        description: (studentName) =>
          `${studentName} has an active application with no recent progress. Follow up with the university or counselor.`,
        taskPriority: "high",
      })
    );
  }

  if (offerFollowUp) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "offer_follow_up",
        priority: "executive",
        action: "schedule_call",
        title: "Offer follow-up",
        description: (studentName) =>
          `${studentName} has an offer-stage signal. Contact the student and push toward offer acceptance.`,
        taskPriority: "high",
      })
    );
  }

  if (offerAccepted) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "offer_accepted_next_steps",
        priority: "executive",
        action: "create_task",
        title: "Offer accepted next steps",
        description: (studentName) =>
          `${studentName} accepted an offer. Start CAS, deposit, and visa preparation workflow.`,
        taskPriority: "high",
      })
    );
  }

  if (casPending) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "cas_pending_follow_up",
        priority: "executive",
        action: "create_reminder",
        title: "CAS pending follow-up",
        description: (studentName) =>
          `${studentName} is waiting on CAS. Follow up on CAS requirements, payment, documents, and university timeline.`,
        taskPriority: "high",
      })
    );
  }

  if (casIssued) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "cas_issued_start_visa",
        priority: "executive",
        action: "create_task",
        title: "CAS issued — start visa",
        description: (studentName) =>
          `${studentName} has CAS issued. Start visa checklist, financial documents, and appointment preparation.`,
        taskPriority: "high",
      })
    );
  }

  if (visaDelay) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "visa_delay",
        priority: "high",
        action: "create_task",
        title: "Visa delay detected",
        description: (studentName) =>
          `${studentName} accepted an offer but visa progress is not moving. Start visa preparation immediately.`,
        taskPriority: "high",
      })
    );
  }

  if (visaMonitoring) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "visa_monitoring",
        priority: "high",
        action: "create_reminder",
        title: "Monitor visa progress",
        description: (studentName) =>
          `${studentName} is in visa stage. Create a follow-up reminder for visa updates.`,
        taskPriority: "high",
      })
    );
  }

  if (taskWeakness) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "overdue_task_recovery",
        priority: overdueTasks >= 3 ? "critical" : "high",
        action: "create_task",
        title: "Overdue task recovery",
        description: (studentName) =>
          `${studentName} has weak task health. Clear overdue tasks and rebuild counselor execution rhythm.`,
        taskPriority: overdueTasks >= 3 ? "critical" : "high",
      })
    );
  }

  if (documentWeakness) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "document_readiness_gap",
        priority: "high",
        action: "create_reminder",
        title: "Document readiness gap",
        description: (studentName) =>
          `${studentName} has low document readiness. Follow up for missing or incomplete documents.`,
        taskPriority: "high",
      })
    );
  }

  if (inactiveStudent) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "inactive_student",
        priority: "medium",
        action: "send_whatsapp",
        title: "Inactive student follow-up",
        description: (studentName) =>
          `${studentName} has not shown enough recent activity. Send a check-in message and revive the journey.`,
        channel: "whatsapp",
        message: (studentName) =>
          `Hi ${studentName}, just checking in from Zaifan Consultancy. We wanted to follow up on your study abroad journey and help you move to the next step.`,
      })
    );
  }

  if (missingUniversityPlan) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "missing_university_plan",
        priority: "high",
        action: "create_task",
        title: "Missing university plan",
        description: (studentName) =>
          `${studentName} has no complete university plan. Build Dream, Target, and Safe options.`,
        taskPriority: "high",
      })
    );
  }

  if (missingDreamUniversities) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "missing_dream_universities",
        priority: "medium",
        action: "create_task",
        title: "Missing Dream universities",
        description: (studentName) =>
          `${studentName} has no Dream universities. Add ambitious options to strengthen the plan.`,
        taskPriority: "medium",
      })
    );
  }

  if (missingTargetUniversities) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "missing_target_universities",
        priority: "medium",
        action: "create_task",
        title: "Missing Target universities",
        description: (studentName) =>
          `${studentName} has no Target universities. Add realistic best-fit options.`,
        taskPriority: "medium",
      })
    );
  }

  if (missingSafeUniversities) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "missing_safe_universities",
        priority: "high",
        action: "create_task",
        title: "Missing Safe universities",
        description: (studentName) =>
          `${studentName} has no Safe universities. Add backup options to reduce admission risk.`,
        taskPriority: "high",
      })
    );
  }

  if (fastTrack) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "fast_track_student",
        priority: "executive",
        action: "schedule_call",
        title: "Fast-track student",
        description: (studentName) =>
          `${studentName} has strong opportunity, good readiness, and low risk. Fast-track the next milestone.`,
        taskPriority: "high",
      })
    );
  }

  if (conversionOpportunity) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "conversion_opportunity",
        priority: "executive",
        action: "send_email",
        title: "Conversion opportunity",
        description: (studentName) =>
          `${studentName} has strong conversion potential. Send a focused follow-up and move the student forward.`,
        channel: "email",
        subject: "Next steps for your study abroad journey",
        message: (studentName) =>
          `Hi ${studentName}, we reviewed your profile and your case is ready to move forward. Let's complete the next step in your application journey.`,
      })
    );
  }

  if (successStory) {
    addOnce(
      recommendations,
      makeRecommendation(score, {
        type: "success_story",
        priority: "executive",
        action: "send_whatsapp",
        title: "Success story follow-up",
        description: (studentName) =>
          `${studentName} has a success-stage signal. Send congratulations and prepare final success tracking.`,
        channel: "whatsapp",
        message: (studentName) =>
          `Congratulations ${studentName}! Your visa success is a major milestone. Zaifan Consultancy is proud to be part of your journey.`,
      })
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      makeRecommendation(score, {
        type: "healthy_monitoring",
        priority: "low",
        action: "none",
        title: "Monitor student",
        description: (studentName) =>
          `${studentName} has no urgent executive action right now. Continue normal monitoring.`,
      })
    );
  }

  return recommendations
    .sort((a, b) => {
      const order = { critical: 5, executive: 4, high: 3, medium: 2, low: 1 };
      return (order[normalize(b.priority)] || 0) - (order[normalize(a.priority)] || 0);
    })
    .slice(0, 6);
}