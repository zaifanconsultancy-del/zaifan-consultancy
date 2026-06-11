import { buildPortalHealthReport } from "./studentPortal";

// =====================================================
// ZAIFAN STUDENT OS — PLATFORM VERIFICATION ENGINE V2
// Phase 2: Full Workflow Verification + Recovery Engine
// =====================================================

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function getStudentId(student = {}) {
  return (
    student.student_id ||
    student.studentId ||
    student.inquiry_id ||
    student.inquiryId ||
    student.appointment_id ||
    student.appointmentId ||
    student.id ||
    null
  );
}

function getStudentName(student = {}) {
  return (
    student.student_name ||
    student.full_name ||
    student.name ||
    student.student_email ||
    student.email ||
    "Unknown Student"
  );
}

function getStudentType(student = {}) {
  return normalize(
    student.student_type ||
      student.studentType ||
      student.source_type ||
      student.record_type ||
      "inquiry"
  );
}

function getDataArray(data = {}, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function getStudentDataArray(student = {}, data = {}, keys = []) {
  const fromData = getDataArray(data, keys);
  if (fromData.length) return fromData;

  const portalData = student.portalData || student.portal_data || {};
  const fromPortal = getDataArray(portalData, keys);
  if (fromPortal.length) return fromPortal;

  return getDataArray(student, keys);
}

function getJourneyStage(student = {}) {
  const direct =
    normalize(student.journey_stage) ||
    normalize(student.stage) ||
    normalize(student.diagnostics?.journey_stage);

  if (direct) return direct;

  const applicationStatus = normalize(student.application_status);
  const offerStatus = normalize(student.offer_status);
  const casStatus = normalize(student.cas_status);
  const visaStatus = normalize(student.visa_status);
  const paymentStatus = normalize(student.payment_status);

  if (["enrolled", "completed"].includes(applicationStatus)) return "enrolled";

  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }

  if (
    ["visa_pending", "submitted", "under_review", "review", "processing"].includes(visaStatus)
  ) {
    return "visa_pending";
  }

  if (["cas_issued", "issued"].includes(casStatus) || applicationStatus === "cas_issued") {
    return "cas_issued";
  }

  if (["cas_pending", "pending"].includes(casStatus) || applicationStatus === "cas_pending") {
    return "cas_pending";
  }

  if (
    ["offer_accepted", "accepted", "confirmed"].includes(applicationStatus) ||
    ["offer_accepted", "accepted", "confirmed"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    [
      "offer_received",
      "offer",
      "received",
      "conditional_offer",
      "unconditional_offer",
    ].includes(applicationStatus) ||
    [
      "offer_received",
      "offer",
      "received",
      "conditional_offer",
      "unconditional_offer",
    ].includes(offerStatus)
  ) {
    return "offer_received";
  }

  if (["applied", "submitted"].includes(applicationStatus)) return "application_submitted";
  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["started", "in_progress", "draft"].includes(applicationStatus)) {
    return "application_started";
  }

  if (["paid", "partial", "outstanding"].includes(paymentStatus)) return "payment";

  return "not_started";
}

function calculateScore(checks = []) {
  const rows = asArray(checks);
  if (!rows.length) return 0;

  const earned = rows.reduce((sum, check) => {
    if (typeof check === "boolean") return sum + (check ? 1 : 0);
    return sum + (check.passed ? asNumber(check.weight, 1) : 0);
  }, 0);

  const possible = rows.reduce((sum, check) => {
    if (typeof check === "boolean") return sum + 1;
    return sum + asNumber(check.weight, 1);
  }, 0);

  return possible ? Math.round((earned / possible) * 100) : 0;
}

function healthFromScore(score = 0) {
  const value = asNumber(score);

  if (value >= 90) return "Excellent";
  if (value >= 75) return "Good";
  if (value >= 50) return "Needs Review";
  return "Critical";
}

function severityFromScore(score = 0) {
  const value = asNumber(score);

  if (value < 35) return "critical";
  if (value < 60) return "high";
  if (value < 80) return "medium";
  return "low";
}

function buildStageResult({
  stage,
  passed,
  score,
  title,
  message,
  severity = null,
  count = null,
  metadata = {},
}) {
  return {
    stage,
    title,
    passed: Boolean(passed),
    score: Math.max(0, Math.min(100, asNumber(score))),
    health: healthFromScore(score),
    severity: severity || severityFromScore(score),
    message,
    count,
    metadata,
    verified_at: nowIso(),
  };
}

function hasTimelineEvent(data = {}, keywords = []) {
  const timeline = getDataArray(data, [
    "timeline",
    "timeline_events",
    "student_timeline",
    "events",
  ]);

  if (!timeline.length) return false;

  return timeline.some((event) => {
    const body = normalize(
      [
        event.type,
        event.event_type,
        event.title,
        event.description,
        event.message,
        event.category,
      ].join(" ")
    );

    return keywords.some((keyword) => body.includes(normalize(keyword)));
  });
}

function buildRecoveryAction({
  student,
  stage,
  type,
  priority = "medium",
  title,
  description,
  target_table = null,
  template_key = null,
  metadata = {},
}) {
  return {
    id: [
      "recovery",
      normalize(stage),
      normalize(type),
      getStudentId(student) || "unknown",
      Math.random().toString(36).slice(2, 8),
    ].join("_"),
    student_id: getStudentId(student),
    student_type: getStudentType(student),
    student_name: getStudentName(student),
    stage: normalize(stage),
    type: normalize(type),
    priority: normalize(priority),
    title,
    description,
    target_table,
    template_key,
    status: "pending",
    approval_status: priority === "critical" || priority === "urgent" ? "required" : "optional",
    created_at: nowIso(),
    metadata,
  };
}

// =====================================================
// STAGE VERIFIERS
// =====================================================

export function verifyInquiryStage(student = {}, data = {}) {
  const hasId = Boolean(getStudentId(student));
  const hasContact = Boolean(
    student.email ||
      student.student_email ||
      student.phone ||
      student.mobile ||
      student.student_phone
  );
  const hasName = Boolean(getStudentName(student) && getStudentName(student) !== "Unknown Student");

  const score = calculateScore([
    { passed: hasId, weight: 3 },
    { passed: hasName, weight: 1 },
    { passed: hasContact, weight: 2 },
  ]);

  return buildStageResult({
    stage: "inquiry",
    title: "Inquiry Record",
    passed: hasId,
    score,
    message: hasId
      ? "Student inquiry/record identity exists."
      : "Student record is missing a stable ID.",
    metadata: {
      student_id: getStudentId(student),
      has_contact: hasContact,
      has_name: hasName,
    },
  });
}

export function verifyUniversityPlanningStage(student = {}, data = {}) {
  const universities = getStudentDataArray(student, data, [
    "universities",
    "university_planning",
    "student_universities",
    "recommended_universities",
  ]);

  const dream = universities.filter((item) =>
    ["dream", "reach"].includes(normalize(item.category || item.type || item.fit_type))
  );

  const target = universities.filter((item) =>
    ["target", "match"].includes(normalize(item.category || item.type || item.fit_type))
  );

  const safe = universities.filter((item) =>
    ["safe", "safety"].includes(normalize(item.category || item.type || item.fit_type))
  );

  const hasPlan =
    universities.length > 0 ||
    bool(student.has_university_plan) ||
    asNumber(student.university_plan_count || student.diagnostics?.university_plan_count) > 0;

  const score = calculateScore([
    { passed: hasPlan, weight: 4 },
    { passed: universities.length >= 3, weight: 2 },
    { passed: safe.length > 0 || asNumber(student.safe_university_count) > 0, weight: 2 },
    { passed: dream.length > 0 || target.length > 0 || universities.length > 0, weight: 1 },
  ]);

  return buildStageResult({
    stage: "university_planning",
    title: "University Planning",
    passed: hasPlan,
    score,
    count: universities.length,
    message: hasPlan
      ? "University planning records detected."
      : "No university planning records found.",
    metadata: {
      universities_count: universities.length,
      dream_count: dream.length,
      target_count: target.length,
      safe_count: safe.length,
    },
  });
}

export function verifyApplicationStage(student = {}, data = {}) {
  const applications = getStudentDataArray(student, data, [
    "applications",
    "student_applications",
    "application_records",
  ]);

  const applicationCount =
    applications.length || asNumber(student.application_count || student.applications_count);

  const submitted = applications.filter((app) =>
    ["submitted", "applied", "under_review", "review", "processing"].includes(
      normalize(app.status || app.application_status)
    )
  );

  const linkedUniversity = applications.some(
    (app) => app.university_id || app.university_name || app.university
  );

  const score = calculateScore([
    { passed: applicationCount > 0, weight: 5 },
    { passed: submitted.length > 0 || applicationCount > 0, weight: 2 },
    { passed: linkedUniversity || applicationCount > 0, weight: 1 },
  ]);

  return buildStageResult({
    stage: "application",
    title: "Application Workflow",
    passed: applicationCount > 0,
    score,
    count: applicationCount,
    message:
      applicationCount > 0
        ? "Application records detected."
        : "No application records found.",
    metadata: {
      applications_count: applicationCount,
      submitted_count: submitted.length,
      has_university_link: linkedUniversity,
    },
  });
}

export function verifyOfferStage(student = {}, data = {}) {
  const applications = getStudentDataArray(student, data, [
    "applications",
    "student_applications",
    "application_records",
  ]);

  const stage = getJourneyStage(student);

  const offerFound =
    ["offer_received", "offer_accepted", "cas_pending", "cas_issued", "visa_pending", "visa_approved"].includes(stage) ||
    applications.some((app) => {
      const status = normalize(
        app.offer_status ||
          app.application_status ||
          app.status ||
          app.decision_status
      );

      return (
        status.includes("offer") ||
        status.includes("accepted") ||
        status.includes("conditional") ||
        status.includes("unconditional")
      );
    });

  const offerAccepted =
    stage === "offer_accepted" ||
    applications.some((app) =>
      ["accepted", "offer_accepted", "confirmed"].includes(
        normalize(app.offer_status || app.application_status || app.status)
      )
    );

  const score = calculateScore([
    { passed: offerFound, weight: 5 },
    { passed: offerAccepted || offerFound, weight: 2 },
    { passed: hasTimelineEvent(data, ["offer"]) || offerFound, weight: 1 },
  ]);

  return buildStageResult({
    stage: "offer",
    title: "Offer Workflow",
    passed: offerFound,
    score,
    message: offerFound ? "Offer workflow detected." : "No offer record/status detected.",
    metadata: {
      offer_found: offerFound,
      offer_accepted: offerAccepted,
    },
  });
}

export function verifyCASStage(student = {}, data = {}) {
  const applications = getStudentDataArray(student, data, [
    "applications",
    "student_applications",
    "application_records",
  ]);

  const stage = getJourneyStage(student);

  const casFound =
    ["cas_pending", "cas_issued", "visa_pending", "visa_approved"].includes(stage) ||
    applications.some((app) => {
      const status = normalize(
        app.cas_status ||
          app.application_status ||
          app.status ||
          app.cas_stage
      );

      return status.includes("cas");
    });

  const casIssued =
    stage === "cas_issued" ||
    applications.some((app) =>
      normalize(app.cas_status || app.status || app.application_status).includes("issued")
    );

  const score = calculateScore([
    { passed: casFound, weight: 5 },
    { passed: casIssued || casFound, weight: 2 },
    { passed: hasTimelineEvent(data, ["cas"]) || casFound, weight: 1 },
  ]);

  return buildStageResult({
    stage: "cas",
    title: "CAS Workflow",
    passed: casFound,
    score,
    message: casFound ? "CAS workflow detected." : "No CAS workflow detected.",
    metadata: {
      cas_found: casFound,
      cas_issued: casIssued,
    },
  });
}

export function verifyVisaStage(student = {}, data = {}) {
  const applications = getStudentDataArray(student, data, [
    "applications",
    "student_applications",
    "application_records",
  ]);

  const visaRecords = getStudentDataArray(student, data, [
    "visas",
    "visa_records",
    "student_visas",
    "visa",
  ]);

  const stage = getJourneyStage(student);

  const visaFound =
    ["visa_pending", "visa_approved", "visa_rejected"].includes(stage) ||
    visaRecords.length > 0 ||
    Boolean(student.visa_record || student.visa_status) ||
    applications.some((app) => {
      const status = normalize(app.visa_status || app.status || app.application_status);
      return status.includes("visa") || status.includes("approved") || status.includes("refused");
    });

  const approved =
    stage === "visa_approved" ||
    normalize(student.visa_status).includes("approved") ||
    applications.some((app) => normalize(app.visa_status).includes("approved"));

  const rejected =
    stage === "visa_rejected" ||
    normalize(student.visa_status).includes("rejected") ||
    normalize(student.visa_status).includes("refused") ||
    applications.some((app) => {
      const status = normalize(app.visa_status);
      return status.includes("rejected") || status.includes("refused");
    });

  const score = calculateScore([
    { passed: visaFound, weight: 5 },
    { passed: approved || rejected || visaFound, weight: 2 },
    { passed: hasTimelineEvent(data, ["visa"]) || visaFound, weight: 1 },
  ]);

  return buildStageResult({
    stage: "visa",
    title: "Visa Workflow",
    passed: visaFound,
    score,
    severity: rejected ? "critical" : null,
    message: visaFound ? "Visa workflow detected." : "No visa workflow detected.",
    metadata: {
      visa_found: visaFound,
      visa_approved: approved,
      visa_rejected: rejected,
      visa_records_count: visaRecords.length,
    },
  });
}

export function verifyPaymentStage(student = {}, data = {}) {
  const invoices = getStudentDataArray(student, data, [
    "invoices",
    "student_invoices",
    "invoice_records",
  ]);

  const payments = getStudentDataArray(student, data, [
    "payments",
    "student_payments",
    "payment_records",
  ]);

  const receipts = getStudentDataArray(student, data, [
    "receipts",
    "student_receipts",
    "receipt_uploads",
  ]);

  const hasFinancialRecord =
    invoices.length > 0 ||
    payments.length > 0 ||
    receipts.length > 0 ||
    asNumber(student.invoice_count) > 0 ||
    asNumber(student.payment_count) > 0;

  const confirmedPayment = payments.some((payment) =>
    ["confirmed", "approved", "paid", "success"].includes(normalize(payment.status))
  );

  const openInvoice = invoices.some((invoice) => asNumber(invoice.outstanding_amount) > 0);
  const reconciled = !openInvoice || confirmedPayment || invoices.length === 0;

  const score = calculateScore([
    { passed: hasFinancialRecord, weight: 4 },
    { passed: reconciled, weight: 3 },
    { passed: hasTimelineEvent(data, ["payment", "invoice", "receipt"]) || hasFinancialRecord, weight: 1 },
  ]);

  return buildStageResult({
    stage: "payment",
    title: "Payment Workflow",
    passed: hasFinancialRecord,
    score,
    message: hasFinancialRecord
      ? "Payment/invoice/receipt records detected."
      : "No payment workflow records found.",
    metadata: {
      invoices: invoices.length,
      payments: payments.length,
      receipts: receipts.length,
      confirmed_payment: confirmedPayment,
      open_invoice: openInvoice,
      reconciled,
    },
  });
}

export function verifyStudentPortalStage(student = {}, data = {}) {
  const portalAccount =
    data.portalAccount ||
    data.portal_account ||
    student.portal_account ||
    student.student_portal_account ||
    null;

  let report = { score: 0 };

  try {
    report = buildPortalHealthReport(student, data);
  } catch (error) {
    report = {
      score: portalAccount ? 70 : 0,
      error: error.message,
    };
  }

  const hasPortalAccount =
    Boolean(portalAccount) ||
    Boolean(student.portal_account_id) ||
    Boolean(student.student_portal_account_id) ||
    bool(student.has_portal_account);

  const active =
    !portalAccount ||
    portalAccount.is_active === undefined ||
    bool(portalAccount.is_active, true);

  const score = Math.max(
    asNumber(report.score),
    calculateScore([
      { passed: hasPortalAccount, weight: 5 },
      { passed: active, weight: 2 },
      { passed: hasTimelineEvent(data, ["portal"]) || hasPortalAccount, weight: 1 },
    ])
  );

  return buildStageResult({
    stage: "student_portal",
    title: "Student Portal",
    passed: score >= 50 || hasPortalAccount,
    score,
    message:
      score >= 50 || hasPortalAccount
        ? "Student portal layer is available."
        : "Student portal health is weak or missing.",
    metadata: {
      has_portal_account: hasPortalAccount,
      active,
      report,
    },
  });
}

export function verifyCounselorPortalStage(student = {}, data = {}) {
  const tasks = getStudentDataArray(student, data, [
    "tasks",
    "student_tasks",
    "counselor_tasks",
  ]);

  const communications = getStudentDataArray(student, data, [
    "communications",
    "student_communications",
    "messages",
    "communication_logs",
  ]);

  const appointments = getStudentDataArray(student, data, [
    "appointments",
    "student_appointments",
  ]);

  const hasCounselorWork =
    tasks.length > 0 ||
    communications.length > 0 ||
    appointments.length > 0 ||
    asNumber(student.task_count) > 0 ||
    asNumber(student.communication_count) > 0;

  const overdue = tasks.filter((task) =>
    ["overdue", "pending", "open"].includes(normalize(task.status))
  );

  const score = calculateScore([
    { passed: hasCounselorWork, weight: 5 },
    { passed: communications.length > 0 || appointments.length > 0 || hasCounselorWork, weight: 2 },
    { passed: overdue.length < 5, weight: 1 },
  ]);

  return buildStageResult({
    stage: "counselor_portal",
    title: "Counselor Portal",
    passed: hasCounselorWork,
    score,
    message:
      hasCounselorWork
        ? "Counselor portal activity detected."
        : "No counselor task, communication, or appointment activity found.",
    metadata: {
      tasks: tasks.length,
      communications: communications.length,
      appointments: appointments.length,
      overdue_tasks: overdue.length,
    },
  });
}

export function verifyExecutiveStage(student = {}, data = {}) {
  const riskScore = asNumber(student.risk_score || student.executive_risk_score);
  const opportunityScore = asNumber(student.opportunity_score || student.executive_opportunity_score);
  const hasCategory = Boolean(student.executive_category || student.priority_level || student.risk_level);
  const hasSummary = Boolean(student.gpt_summary || student.summary || student.executive_summary);

  const score = calculateScore([
    { passed: riskScore > 0 || opportunityScore > 0, weight: 5 },
    { passed: hasCategory, weight: 2 },
    { passed: hasSummary, weight: 1 },
  ]);

  return buildStageResult({
    stage: "executive",
    title: "Executive AI",
    passed: riskScore > 0 || opportunityScore > 0 || hasCategory,
    score,
    message:
      riskScore > 0 || opportunityScore > 0 || hasCategory
        ? "Executive AI scoring detected."
        : "Executive AI scoring is missing.",
    metadata: {
      riskScore,
      opportunityScore,
      hasCategory,
      hasSummary,
    },
  });
}

export function verifyAutomationStage(student = {}, data = {}) {
  const automations = getStudentDataArray(student, data, [
    "automations",
    "automation_logs",
    "executive_actions",
    "executive_action_queue",
  ]);

  const automationCount =
    automations.length ||
    asNumber(student.automation_count || student.executive_automation_count);

  const hasRecommendations =
    Boolean(student.executive_recommendations) ||
    Boolean(student.recommendations) ||
    asNumber(student.recommendation_count) > 0;

  const score = calculateScore([
    { passed: automationCount > 0 || hasRecommendations, weight: 5 },
    { passed: hasTimelineEvent(data, ["automation", "executive action"]) || automationCount > 0 || hasRecommendations, weight: 1 },
  ]);

  return buildStageResult({
    stage: "automation",
    title: "Automation",
    passed: automationCount > 0 || hasRecommendations,
    score,
    message:
      automationCount > 0 || hasRecommendations
        ? "Automation or executive recommendations detected."
        : "No automation records or recommendations found.",
    metadata: {
      automationCount,
      hasRecommendations,
    },
  });
}

// =====================================================
// MASTER JOURNEY VERIFIER
// =====================================================

export function verifyEntireStudentJourney(student = {}, data = {}) {
  const mergedData = {
    ...(student.portalData || {}),
    ...(student.portal_data || {}),
    ...data,
  };

  const stages = {
    inquiry: verifyInquiryStage(student, mergedData),
    universityPlanning: verifyUniversityPlanningStage(student, mergedData),
    application: verifyApplicationStage(student, mergedData),
    offer: verifyOfferStage(student, mergedData),
    cas: verifyCASStage(student, mergedData),
    visa: verifyVisaStage(student, mergedData),
    payment: verifyPaymentStage(student, mergedData),
    studentPortal: verifyStudentPortalStage(student, mergedData),
    counselorPortal: verifyCounselorPortalStage(student, mergedData),
    executive: verifyExecutiveStage(student, mergedData),
    automation: verifyAutomationStage(student, mergedData),
  };

  const stageList = Object.values(stages);
  const passed = stageList.filter((stage) => stage.passed).length;
  const total = stageList.length;

  const score = total
    ? Math.round(stageList.reduce((sum, stage) => sum + stage.score, 0) / total)
    : 0;

  const failures = Object.entries(stages)
    .filter(([, stage]) => !stage.passed)
    .map(([key, stage]) => ({
      key,
      stage: stage.stage,
      title: stage.title,
      score: stage.score,
      severity: stage.severity,
      message: stage.message,
      metadata: stage.metadata,
    }));

  const failureKeys = failures.map((failure) => failure.key);

  const criticalFailures = failures.filter((failure) => failure.severity === "critical");
  const highFailures = failures.filter((failure) => failure.severity === "high");

  return {
    student_id: getStudentId(student),
    student_name: getStudentName(student),
    student_type: getStudentType(student),

    score,
    health: healthFromScore(score),
    healthStatus: healthFromScore(score),

    passed,
    total,

    failures,
    failureKeys,
    failedStages: failureKeys,

    criticalFailures: criticalFailures.length,
    highFailures: highFailures.length,

    stages,
    verified_at: nowIso(),
  };
}

// =====================================================
// PORTFOLIO HEALTH REPORT
// =====================================================

export function generatePlatformHealthReport(students = []) {
  const rows = asArray(students);
  const journeys = rows.map((student) =>
    verifyEntireStudentJourney(student, student.portalData || {})
  );

  const healthyStudents = journeys.filter((item) => item.score >= 75).length;
  const excellentStudents = journeys.filter((item) => item.score >= 90).length;
  const atRiskStudents = journeys.filter((item) => item.score < 50).length;
  const criticalStudents = journeys.filter((item) => item.score < 35).length;

  const averageScore = journeys.length
    ? Math.round(journeys.reduce((sum, item) => sum + item.score, 0) / journeys.length)
    : 0;

  return {
    totalStudents: rows.length,
    healthyStudents,
    excellentStudents,
    atRiskStudents,
    criticalStudents,
    averageScore,
    platformHealth: healthFromScore(averageScore),
    healthStatus: healthFromScore(averageScore),
    journeys,
    generated_at: nowIso(),
  };
}

// =====================================================
// AUTOMATED RECOVERY ENGINE
// =====================================================

export function generateRecoveryActions(student = {}, verification = {}) {
  const actions = [];
  const failures = asArray(verification.failures);
  const failureKeys = asArray(verification.failureKeys).length
    ? verification.failureKeys
    : failures.map((failure) => failure.key || failure);

  const hasFailure = (key) =>
    failureKeys.includes(key) ||
    failures.some((failure) => failure.key === key || failure.stage === key);

  if (hasFailure("universityPlanning")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "university_planning",
        type: "university_plan_recovery",
        priority: "high",
        title: "University Planning Required",
        description: "Create Dream, Target, and Safe university plan.",
        target_table: "student_universities",
        template_key: "university_plan_recovery",
      })
    );
  }

  if (hasFailure("application")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "application",
        type: "application_recovery",
        priority: "high",
        title: "Application Workflow Missing",
        description: "Create or recover student application record.",
        target_table: "student_applications",
        template_key: "application_recovery",
      })
    );
  }

  if (hasFailure("offer")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "offer",
        type: "offer_sync_recovery",
        priority: "high",
        title: "Offer Workflow Review",
        description: "Verify offer status and sync application timeline.",
        target_table: "student_applications",
        template_key: "offer_sync_recovery",
      })
    );
  }

  if (hasFailure("cas")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "cas",
        type: "cas_recovery",
        priority: "urgent",
        title: "CAS Recovery Required",
        description: "Review CAS blockers, university status, and pending CAS actions.",
        target_table: "student_applications",
        template_key: "cas_recovery",
      })
    );
  }

  if (hasFailure("visa")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "visa",
        type: "visa_recovery",
        priority: "urgent",
        title: "Visa Workflow Recovery",
        description: "Create or repair visa tracking workflow.",
        target_table: "student_visas",
        template_key: "visa_recovery",
      })
    );
  }

  if (hasFailure("payment")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "payment",
        type: "payment_recovery",
        priority: "high",
        title: "Payment Workflow Review",
        description: "Review invoices, receipts, payments, and reconciliation.",
        target_table: "student_invoices",
        template_key: "payment_recovery",
      })
    );
  }

  if (hasFailure("studentPortal")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "student_portal",
        type: "portal_recovery",
        priority: "medium",
        title: "Student Portal Engagement",
        description: "Create, activate, or verify student portal account.",
        target_table: "student_portal_accounts",
        template_key: "portal_recovery",
      })
    );
  }

  if (hasFailure("counselorPortal")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "counselor_portal",
        type: "counselor_recovery",
        priority: "medium",
        title: "Counselor Follow-up Required",
        description: "Create counselor task, communication log, or follow-up action.",
        target_table: "student_tasks",
        template_key: "counselor_recovery",
      })
    );
  }

  if (hasFailure("executive")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "executive",
        type: "executive_ai_recovery",
        priority: "high",
        title: "Executive AI Analysis Required",
        description: "Regenerate risk, opportunity, category, and executive summary.",
        target_table: "ai_student_risk_scores",
        template_key: "executive_ai_recovery",
      })
    );
  }

  if (hasFailure("automation")) {
    actions.push(
      buildRecoveryAction({
        student,
        stage: "automation",
        type: "automation_recovery",
        priority: "medium",
        title: "Automation Recommendation Required",
        description: "Generate executive automation recommendation and action queue item.",
        target_table: "executive_action_queue",
        template_key: "automation_recovery",
      })
    );
  }

  return actions;
}

export function buildVerificationFailureSummary(students = []) {
  const summary = {};

  asArray(students).forEach((student) => {
    const verification = verifyEntireStudentJourney(student, student.portalData || {});

    verification.failures.forEach((failure) => {
      const key = failure.key || failure.stage || "unknown";
      summary[key] = (summary[key] || 0) + 1;
    });
  });

  return summary;
}

export function buildWorkflowFailureHeatmap(students = []) {
  const failures = buildVerificationFailureSummary(students);

  return Object.entries(failures)
    .map(([stage, count]) => ({
      stage,
      count,
      label: stage
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (char) => char.toUpperCase()),
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildRecoveryQueue(students = []) {
  return asArray(students)
    .map((student) => {
      const verification = verifyEntireStudentJourney(student, student.portalData || {});
      const actions = generateRecoveryActions(student, verification);

      return {
        student,
        student_id: getStudentId(student),
        student_name: getStudentName(student),
        student_type: getStudentType(student),
        verification,
        actions,
        actionCount: actions.length,
        highestPriority:
          actions.find((action) => ["urgent", "critical"].includes(action.priority))?.priority ||
          actions.find((action) => action.priority === "high")?.priority ||
          actions[0]?.priority ||
          "none",
      };
    })
    .filter((item) => item.actions.length)
    .sort((a, b) => b.actions.length - a.actions.length);
}

export function buildStageBreakdown(students = []) {
  const stages = {
    inquiry: 0,
    universityPlanning: 0,
    application: 0,
    offer: 0,
    cas: 0,
    visa: 0,
    payment: 0,
    studentPortal: 0,
    counselorPortal: 0,
    executive: 0,
    automation: 0,
  };

  asArray(students).forEach((student) => {
    const verification = verifyEntireStudentJourney(student, student.portalData || {});

    Object.entries(verification.stages).forEach(([key, stage]) => {
      if (stage?.passed) stages[key] += 1;
    });
  });

  return stages;
}

// =====================================================
// EXECUTIVE RECOVERY PRIORITIZATION ENGINE
// =====================================================

export function buildExecutiveRecoveryQueue(students = []) {
  return buildRecoveryQueue(students)
    .map((item) => {
      const risk = asNumber(item.student?.risk_score);
      const opportunity = asNumber(item.student?.opportunity_score);
      const criticalFailures = asNumber(item.verification?.criticalFailures);
      const highFailures = asNumber(item.verification?.highFailures);

      const urgency =
        risk * 0.45 +
        opportunity * 0.2 +
        item.actions.length * 12 +
        criticalFailures * 20 +
        highFailures * 10;

      return {
        ...item,
        urgency: Math.round(urgency),
      };
    })
    .sort((a, b) => b.urgency - a.urgency);
}

export function buildExecutiveVerificationSnapshot(students = []) {
  const rows = asArray(students);
  const health = generatePlatformHealthReport(rows);
  const failures = buildWorkflowFailureHeatmap(rows);
  const recoveryQueue = buildExecutiveRecoveryQueue(rows);
  const stageBreakdown = buildStageBreakdown(rows);

  return {
    health,
    failures,
    recoveryQueue,
    stageBreakdown,

    totalStudents: rows.length,
    totalFailures: failures.reduce((sum, item) => sum + item.count, 0),
    brokenStages: failures.length,

    criticalRecovery: recoveryQueue.filter((item) => item.urgency >= 90).length,
    highRecovery: recoveryQueue.filter((item) => item.urgency >= 70 && item.urgency < 90).length,
    mediumRecovery: recoveryQueue.filter((item) => item.urgency >= 40 && item.urgency < 70).length,

    generated_at: nowIso(),
  };
}

// =====================================================
// PRODUCTION HARDENING SNAPSHOT
// =====================================================

export function buildProductionHardeningSnapshot(students = []) {
  const rows = asArray(students);
  const snapshot = buildExecutiveVerificationSnapshot(rows);

  const schemaRisk = snapshot.failures.filter((item) =>
    ["application", "payment", "studentPortal", "automation"].includes(item.stage)
  ).length;

  const timelineRisk = rows.filter((student) => {
    const data = student.portalData || {};
    const timeline = getDataArray(data, ["timeline", "timeline_events", "student_timeline"]);
    const hasOps =
      getStudentDataArray(student, data, ["applications", "documents", "tasks", "payments"]).length >
      0;

    return hasOps && timeline.length === 0;
  }).length;

  const automationRisk = snapshot.failures.find((item) => item.stage === "automation")?.count || 0;
  const portalRisk = snapshot.failures.find((item) => item.stage === "studentPortal")?.count || 0;
  const paymentRisk = snapshot.failures.find((item) => item.stage === "payment")?.count || 0;

  const score = Math.max(
    0,
    Math.min(
      100,
      snapshot.health.averageScore -
        schemaRisk * 3 -
        timelineRisk * 2 -
        automationRisk * 2 -
        portalRisk * 2 -
        paymentRisk * 2
    )
  );

  return {
    score,
    health: healthFromScore(score),
    schemaRisk,
    timelineRisk,
    automationRisk,
    portalRisk,
    paymentRisk,
    verificationCoverage: snapshot.health.averageScore,
    recoveryReadiness: snapshot.recoveryQueue.length,
    generated_at: nowIso(),
  };
}

export default {
  verifyInquiryStage,
  verifyUniversityPlanningStage,
  verifyApplicationStage,
  verifyOfferStage,
  verifyCASStage,
  verifyVisaStage,
  verifyPaymentStage,
  verifyStudentPortalStage,
  verifyCounselorPortalStage,
  verifyExecutiveStage,
  verifyAutomationStage,
  verifyEntireStudentJourney,
  generatePlatformHealthReport,
  generateRecoveryActions,
  buildVerificationFailureSummary,
  buildWorkflowFailureHeatmap,
  buildRecoveryQueue,
  buildStageBreakdown,
  buildExecutiveRecoveryQueue,
  buildExecutiveVerificationSnapshot,
  buildProductionHardeningSnapshot,
};