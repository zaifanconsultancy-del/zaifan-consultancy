import { buildPortalHealthReport } from "./studentPortal";

// =====================================================
// ZAIFAN STUDENT OS — PLATFORM VERIFICATION ENGINE V3
// Full Workflow Verification + Enterprise OS Verification
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

  if (["visa_pending", "submitted", "under_review", "review", "processing"].includes(visaStatus)) {
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
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      applicationStatus
    ) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      offerStatus
    )
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
  const timeline = getDataArray(data, ["timeline", "timeline_events", "student_timeline", "events"]);

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
// CORE STUDENT JOURNEY VERIFIERS
// =====================================================

export function verifyInquiryStage(student = {}, data = {}) {
  const hasId = Boolean(getStudentId(student));
  const hasContact = Boolean(
    student.email || student.student_email || student.phone || student.mobile || student.student_phone
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
    message: hasId ? "Student inquiry/record identity exists." : "Student record is missing a stable ID.",
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
    message: hasPlan ? "University planning records detected." : "No university planning records found.",
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
    message: applicationCount > 0 ? "Application records detected." : "No application records found.",
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
    ["offer_received", "offer_accepted", "cas_pending", "cas_issued", "visa_pending", "visa_approved"].includes(
      stage
    ) ||
    applications.some((app) => {
      const status = normalize(
        app.offer_status || app.application_status || app.status || app.decision_status
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
      const status = normalize(app.cas_status || app.application_status || app.status || app.cas_stage);
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

  const visaRecords = getStudentDataArray(student, data, ["visas", "visa_records", "student_visas", "visa"]);
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
  const invoices = getStudentDataArray(student, data, ["invoices", "student_invoices", "invoice_records"]);
  const payments = getStudentDataArray(student, data, ["payments", "student_payments", "payment_records"]);
  const receipts = getStudentDataArray(student, data, ["receipts", "student_receipts", "receipt_uploads"]);

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
  const tasks = getStudentDataArray(student, data, ["tasks", "student_tasks", "counselor_tasks"]);
  const communications = getStudentDataArray(student, data, [
    "communications",
    "student_communications",
    "messages",
    "communication_logs",
  ]);
  const appointments = getStudentDataArray(student, data, ["appointments", "student_appointments"]);

  const hasCounselorWork =
    tasks.length > 0 ||
    communications.length > 0 ||
    appointments.length > 0 ||
    asNumber(student.task_count) > 0 ||
    asNumber(student.communication_count) > 0;

  const overdue = tasks.filter((task) => ["overdue", "pending", "open"].includes(normalize(task.status)));

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
    message: hasCounselorWork
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
    automations.length || asNumber(student.automation_count || student.executive_automation_count);

  const hasRecommendations =
    Boolean(student.executive_recommendations) ||
    Boolean(student.recommendations) ||
    asNumber(student.recommendation_count) > 0;

  const score = calculateScore([
    { passed: automationCount > 0 || hasRecommendations, weight: 5 },
    {
      passed:
        hasTimelineEvent(data, ["automation", "executive action"]) ||
        automationCount > 0 ||
        hasRecommendations,
      weight: 1,
    },
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
// ENTERPRISE OS VERIFIERS
// =====================================================

export function verifyAnalyticsOSStage(student = {}, data = {}) {
  const analytics =
    data.analytics ||
    data.analyticsSnapshot ||
    data.analytics_os ||
    student.analytics ||
    student.analyticsSnapshot ||
    {};

  const hasKpis =
    asNumber(analytics.totalStudents) > 0 ||
    asNumber(analytics.totalApplications) > 0 ||
    asNumber(analytics.revenue) > 0 ||
    asNumber(student.risk_score) > 0 ||
    asNumber(student.opportunity_score) > 0;

  const hasForecast =
    Boolean(analytics.forecast) ||
    Boolean(analytics.forecasts) ||
    Boolean(data.forecastSnapshot) ||
    asNumber(student.opportunity_score) > 0;

  const hasTrends =
    Boolean(analytics.trends) ||
    Boolean(analytics.trendAnalysis) ||
    Boolean(data.trends) ||
    hasTimelineEvent(data, ["trend", "analytics"]);

  const score = calculateScore([
    { passed: hasKpis, weight: 4 },
    { passed: hasForecast, weight: 2 },
    { passed: hasTrends, weight: 2 },
  ]);

  return buildStageResult({
    stage: "analytics_os",
    title: "Analytics OS",
    passed: score >= 50,
    score,
    message: score >= 50 ? "Analytics OS signals available." : "Analytics OS has weak or missing signals.",
    metadata: {
      has_kpis: hasKpis,
      has_forecast: hasForecast,
      has_trends: hasTrends,
    },
  });
}

export function verifyKnowledgeOSStage(student = {}, data = {}) {
  const knowledgeItems = getStudentDataArray(student, data, [
    "knowledge",
    "knowledge_items",
    "sops",
    "policies",
    "training_modules",
    "visa_guides",
    "university_guides",
  ]);

  const hasSop =
    knowledgeItems.some((item) => normalize(item.type || item.category).includes("sop")) ||
    bool(data.hasSOPCenter) ||
    bool(student.has_sop_support);

  const hasTraining =
    knowledgeItems.some((item) => normalize(item.type || item.category).includes("training")) ||
    bool(data.hasTrainingCenter);

  const hasPolicy =
    knowledgeItems.some((item) => normalize(item.type || item.category).includes("policy")) ||
    bool(data.hasPolicyHub);

  const inferredKnowledge =
    hasTimelineEvent(data, ["sop", "training", "policy", "knowledge"]) ||
    asNumber(student.document_count || student.documents_count) > 0;

  const score = calculateScore([
    { passed: knowledgeItems.length > 0 || inferredKnowledge, weight: 4 },
    { passed: hasSop || inferredKnowledge, weight: 2 },
    { passed: hasTraining || inferredKnowledge, weight: 1 },
    { passed: hasPolicy || inferredKnowledge, weight: 1 },
  ]);

  return buildStageResult({
    stage: "knowledge_os",
    title: "Knowledge OS",
    passed: score >= 50,
    score,
    count: knowledgeItems.length,
    message: score >= 50 ? "Knowledge OS support detected." : "Knowledge OS evidence is missing.",
    metadata: {
      knowledge_items: knowledgeItems.length,
      has_sop: hasSop,
      has_training: hasTraining,
      has_policy: hasPolicy,
      inferred_knowledge: inferredKnowledge,
    },
  });
}

export function verifyCommunicationOSStage(student = {}, data = {}) {
  const communications = getStudentDataArray(student, data, [
    "communications",
    "student_communications",
    "messages",
    "communication_logs",
    "email_logs",
    "whatsapp_logs",
    "call_logs",
    "meeting_logs",
  ]);

  const hasEmail = communications.some((item) => normalize(item.channel || item.type).includes("email"));
  const hasWhatsApp = communications.some((item) =>
    ["whatsapp", "wa"].includes(normalize(item.channel || item.type))
  );
  const hasCall = communications.some((item) => normalize(item.channel || item.type).includes("call"));
  const hasMeeting = communications.some((item) => normalize(item.channel || item.type).includes("meeting"));

  const hasAny =
    communications.length > 0 ||
    asNumber(student.communication_count || student.messages_count) > 0 ||
    hasTimelineEvent(data, ["email", "whatsapp", "call", "meeting", "message"]);

  const score = calculateScore([
    { passed: hasAny, weight: 4 },
    { passed: hasEmail || hasWhatsApp || hasCall || hasMeeting || hasAny, weight: 2 },
    { passed: hasTimelineEvent(data, ["communication", "message", "email", "call"]) || hasAny, weight: 2 },
  ]);

  return buildStageResult({
    stage: "communication_os",
    title: "Communication OS",
    passed: hasAny,
    score,
    count: communications.length,
    message: hasAny ? "Communication activity detected." : "No communication activity detected.",
    metadata: {
      communications: communications.length,
      has_email: hasEmail,
      has_whatsapp: hasWhatsApp,
      has_call: hasCall,
      has_meeting: hasMeeting,
    },
  });
}

export function verifyPartnerOSStage(student = {}, data = {}) {
  const partners = getStudentDataArray(student, data, [
    "partners",
    "agents",
    "agent_records",
    "partner_records",
    "university_partners",
  ]);

  const hasAgent =
    Boolean(student.agent_id || student.agent_name || student.referral_partner) ||
    partners.some((item) => normalize(item.type || item.partner_type).includes("agent"));

  const hasUniversityPartner =
    Boolean(student.university_partner_id || student.university_name) ||
    partners.some((item) => normalize(item.type || item.partner_type).includes("university"));

  const hasCommission =
    Boolean(student.commission_status || student.commission_amount) ||
    partners.some((item) => item.commission || item.commission_amount);

  const score = calculateScore([
    { passed: partners.length > 0 || hasAgent || hasUniversityPartner, weight: 4 },
    { passed: hasAgent || hasUniversityPartner, weight: 2 },
    { passed: hasCommission || partners.length > 0, weight: 1 },
  ]);

  return buildStageResult({
    stage: "partner_os",
    title: "Partner OS",
    passed: score >= 45,
    score,
    count: partners.length,
    message: score >= 45 ? "Partner OS signals detected." : "Partner OS evidence is weak or missing.",
    metadata: {
      partners: partners.length,
      has_agent: hasAgent,
      has_university_partner: hasUniversityPartner,
      has_commission: hasCommission,
    },
  });
}

export function verifyAICommandStage(student = {}, data = {}) {
  const hasExecutive = verifyExecutiveStage(student, data).passed;
  const hasAutomation = verifyAutomationStage(student, data).passed;
  const hasRisk = asNumber(student.risk_score || student.executive_risk_score) > 0;
  const hasOpportunity = asNumber(student.opportunity_score || student.executive_opportunity_score) > 0;
  const hasRecommendations =
    Boolean(student.executive_recommendations) ||
    Boolean(student.recommendations) ||
    asNumber(student.recommendation_count) > 0;

  const hasCrossSystemSignals =
    hasTimelineEvent(data, ["risk", "opportunity", "ai", "forecast", "intelligence"]) ||
    Boolean(data.crossSystemIntelligence) ||
    Boolean(data.aiCommandSnapshot);

  const score = calculateScore([
    { passed: hasExecutive, weight: 3 },
    { passed: hasAutomation, weight: 2 },
    { passed: hasRisk || hasOpportunity, weight: 2 },
    { passed: hasRecommendations || hasCrossSystemSignals, weight: 2 },
  ]);

  return buildStageResult({
    stage: "ai_command_os",
    title: "AI Command OS",
    passed: score >= 50,
    score,
    message: score >= 50 ? "AI Command OS signals available." : "AI Command OS intelligence is weak.",
    metadata: {
      has_executive: hasExecutive,
      has_automation: hasAutomation,
      has_risk: hasRisk,
      has_opportunity: hasOpportunity,
      has_recommendations: hasRecommendations,
      has_cross_system_signals: hasCrossSystemSignals,
    },
  });
}

export function verifyCrossSystemIntelligenceStage(student = {}, data = {}) {
  const coreStages = [
    verifyInquiryStage(student, data),
    verifyUniversityPlanningStage(student, data),
    verifyApplicationStage(student, data),
    verifyOfferStage(student, data),
    verifyCASStage(student, data),
    verifyVisaStage(student, data),
    verifyPaymentStage(student, data),
    verifyStudentPortalStage(student, data),
    verifyCounselorPortalStage(student, data),
    verifyExecutiveStage(student, data),
    verifyAutomationStage(student, data),
  ];

  const enterpriseStages = [
    verifyAnalyticsOSStage(student, data),
    verifyKnowledgeOSStage(student, data),
    verifyCommunicationOSStage(student, data),
    verifyPartnerOSStage(student, data),
    verifyAICommandStage(student, data),
  ];

  const allStages = [...coreStages, ...enterpriseStages];
  const passedCount = allStages.filter((stage) => stage.passed).length;
  const averageScore = allStages.length
    ? Math.round(allStages.reduce((sum, stage) => sum + stage.score, 0) / allStages.length)
    : 0;

  const strongCorrelation =
    passedCount >= 8 ||
    Boolean(data.crossSystemIntelligence) ||
    Boolean(data.enterpriseIntelligence) ||
    Boolean(student.cross_system_score);

  const score = Math.max(
    averageScore,
    calculateScore([
      { passed: strongCorrelation, weight: 5 },
      { passed: passedCount >= 6, weight: 2 },
      { passed: passedCount >= 10, weight: 2 },
    ])
  );

  return buildStageResult({
    stage: "cross_system_intelligence",
    title: "Cross-System Intelligence",
    passed: score >= 60,
    score,
    message:
      score >= 60
        ? "Cross-system intelligence has enough connected signals."
        : "Cross-system intelligence needs more connected signals.",
    metadata: {
      passed_stages: passedCount,
      total_stages: allStages.length,
      average_score: averageScore,
      strong_correlation: strongCorrelation,
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

    analyticsOS: verifyAnalyticsOSStage(student, mergedData),
    knowledgeOS: verifyKnowledgeOSStage(student, mergedData),
    communicationOS: verifyCommunicationOSStage(student, mergedData),
    partnerOS: verifyPartnerOSStage(student, mergedData),
    aiCommandOS: verifyAICommandStage(student, mergedData),
    crossSystemIntelligence: verifyCrossSystemIntelligenceStage(student, mergedData),
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

  const coreKeys = [
    "inquiry",
    "universityPlanning",
    "application",
    "offer",
    "cas",
    "visa",
    "payment",
    "studentPortal",
    "counselorPortal",
    "executive",
    "automation",
  ];

  const enterpriseKeys = [
    "analyticsOS",
    "knowledgeOS",
    "communicationOS",
    "partnerOS",
    "aiCommandOS",
    "crossSystemIntelligence",
  ];

  const coreScore = Math.round(
    coreKeys.reduce((sum, key) => sum + asNumber(stages[key]?.score), 0) / coreKeys.length
  );

  const enterpriseScore = Math.round(
    enterpriseKeys.reduce((sum, key) => sum + asNumber(stages[key]?.score), 0) / enterpriseKeys.length
  );

  return {
    student_id: getStudentId(student),
    student_name: getStudentName(student),
    student_type: getStudentType(student),

    score,
    coreScore,
    enterpriseScore,

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
  const journeys = rows.map((student) => verifyEntireStudentJourney(student, student.portalData || {}));

  const healthyStudents = journeys.filter((item) => item.score >= 75).length;
  const excellentStudents = journeys.filter((item) => item.score >= 90).length;
  const atRiskStudents = journeys.filter((item) => item.score < 50).length;
  const criticalStudents = journeys.filter((item) => item.score < 35).length;

  const averageScore = journeys.length
    ? Math.round(journeys.reduce((sum, item) => sum + item.score, 0) / journeys.length)
    : 0;

  const averageCoreScore = journeys.length
    ? Math.round(journeys.reduce((sum, item) => sum + item.coreScore, 0) / journeys.length)
    : 0;

  const averageEnterpriseScore = journeys.length
    ? Math.round(journeys.reduce((sum, item) => sum + item.enterpriseScore, 0) / journeys.length)
    : 0;

  return {
    totalStudents: rows.length,
    healthyStudents,
    excellentStudents,
    atRiskStudents,
    criticalStudents,
    averageScore,
    averageCoreScore,
    averageEnterpriseScore,
    platformHealth: healthFromScore(averageScore),
    healthStatus: healthFromScore(averageScore),
    journeys,
    generated_at: nowIso(),
  };
}

// =====================================================
// RECOVERY ENGINE
// =====================================================

export function generateRecoveryActions(student = {}, verification = {}) {
  const actions = [];
  const failures = asArray(verification.failures);
  const failureKeys = asArray(verification.failureKeys).length
    ? verification.failureKeys
    : failures.map((failure) => failure.key || failure);

  const hasFailure = (key) =>
    failureKeys.includes(key) || failures.some((failure) => failure.key === key || failure.stage === key);

  const push = (config) => actions.push(buildRecoveryAction({ student, ...config }));

  if (hasFailure("universityPlanning")) {
    push({
      stage: "university_planning",
      type: "university_plan_recovery",
      priority: "high",
      title: "University Planning Required",
      description: "Create Dream, Target, and Safe university plan.",
      target_table: "student_universities",
      template_key: "university_plan_recovery",
    });
  }

  if (hasFailure("application")) {
    push({
      stage: "application",
      type: "application_recovery",
      priority: "high",
      title: "Application Workflow Missing",
      description: "Create or recover student application record.",
      target_table: "student_applications",
      template_key: "application_recovery",
    });
  }

  if (hasFailure("offer")) {
    push({
      stage: "offer",
      type: "offer_sync_recovery",
      priority: "high",
      title: "Offer Workflow Review",
      description: "Verify offer status and sync application timeline.",
      target_table: "student_applications",
      template_key: "offer_sync_recovery",
    });
  }

  if (hasFailure("cas")) {
    push({
      stage: "cas",
      type: "cas_recovery",
      priority: "urgent",
      title: "CAS Recovery Required",
      description: "Review CAS blockers, university status, and pending CAS actions.",
      target_table: "student_applications",
      template_key: "cas_recovery",
    });
  }

  if (hasFailure("visa")) {
    push({
      stage: "visa",
      type: "visa_recovery",
      priority: "urgent",
      title: "Visa Workflow Recovery",
      description: "Create or repair visa tracking workflow.",
      target_table: "student_visas",
      template_key: "visa_recovery",
    });
  }

  if (hasFailure("payment")) {
    push({
      stage: "payment",
      type: "payment_recovery",
      priority: "high",
      title: "Payment Workflow Review",
      description: "Review invoices, receipts, payments, and reconciliation.",
      target_table: "student_invoices",
      template_key: "payment_recovery",
    });
  }

  if (hasFailure("studentPortal")) {
    push({
      stage: "student_portal",
      type: "portal_recovery",
      priority: "medium",
      title: "Student Portal Engagement",
      description: "Create, activate, or verify student portal account.",
      target_table: "student_portal_accounts",
      template_key: "portal_recovery",
    });
  }

  if (hasFailure("counselorPortal")) {
    push({
      stage: "counselor_portal",
      type: "counselor_recovery",
      priority: "medium",
      title: "Counselor Follow-up Required",
      description: "Create counselor task, communication log, or follow-up action.",
      target_table: "student_tasks",
      template_key: "counselor_recovery",
    });
  }

  if (hasFailure("executive")) {
    push({
      stage: "executive",
      type: "executive_ai_recovery",
      priority: "high",
      title: "Executive AI Analysis Required",
      description: "Regenerate risk, opportunity, category, and executive summary.",
      target_table: "ai_student_risk_scores",
      template_key: "executive_ai_recovery",
    });
  }

  if (hasFailure("automation")) {
    push({
      stage: "automation",
      type: "automation_recovery",
      priority: "medium",
      title: "Automation Recommendation Required",
      description: "Generate executive automation recommendation and action queue item.",
      target_table: "executive_action_queue",
      template_key: "automation_recovery",
    });
  }

  if (hasFailure("analyticsOS")) {
    push({
      stage: "analytics_os",
      type: "analytics_os_recovery",
      priority: "medium",
      title: "Analytics OS Signal Review",
      description: "Verify KPI, forecast, trend, and executive reporting signals.",
      target_table: "analytics_snapshots",
      template_key: "analytics_os_recovery",
    });
  }

  if (hasFailure("knowledgeOS")) {
    push({
      stage: "knowledge_os",
      type: "knowledge_os_recovery",
      priority: "medium",
      title: "Knowledge OS Coverage Review",
      description: "Review SOP, training, university, visa, and policy knowledge coverage.",
      target_table: "knowledge_items",
      template_key: "knowledge_os_recovery",
    });
  }

  if (hasFailure("communicationOS")) {
    push({
      stage: "communication_os",
      type: "communication_os_recovery",
      priority: "medium",
      title: "Communication OS Activity Review",
      description: "Verify email, WhatsApp, call, meeting, and communication logs.",
      target_table: "communication_logs",
      template_key: "communication_os_recovery",
    });
  }

  if (hasFailure("partnerOS")) {
    push({
      stage: "partner_os",
      type: "partner_os_recovery",
      priority: "low",
      title: "Partner OS Signal Review",
      description: "Review agent, university partner, commission, and partner performance signals.",
      target_table: "partner_records",
      template_key: "partner_os_recovery",
    });
  }

  if (hasFailure("aiCommandOS")) {
    push({
      stage: "ai_command_os",
      type: "ai_command_recovery",
      priority: "high",
      title: "AI Command OS Recovery",
      description: "Verify executive copilot, predictive insight, workflow intelligence, and AI analytics signals.",
      target_table: "ai_command_snapshots",
      template_key: "ai_command_recovery",
    });
  }

  if (hasFailure("crossSystemIntelligence")) {
    push({
      stage: "cross_system_intelligence",
      type: "cross_system_recovery",
      priority: "high",
      title: "Cross-System Intelligence Recovery",
      description: "Correlate Student, Counselor, Application, Visa, Payment, Analytics, Partner, and AI signals.",
      target_table: "cross_system_intelligence",
      template_key: "cross_system_recovery",
    });
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
      label: stage.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()),
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
    analyticsOS: 0,
    knowledgeOS: 0,
    communicationOS: 0,
    partnerOS: 0,
    aiCommandOS: 0,
    crossSystemIntelligence: 0,
  };

  asArray(students).forEach((student) => {
    const verification = verifyEntireStudentJourney(student, student.portalData || {});

    Object.entries(verification.stages).forEach(([key, stage]) => {
      if (stage?.passed && key in stages) stages[key] += 1;
    });
  });

  return stages;
}

// =====================================================
// EXECUTIVE RECOVERY + SNAPSHOTS
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

  const enterpriseKeys = [
    "analyticsOS",
    "knowledgeOS",
    "communicationOS",
    "partnerOS",
    "aiCommandOS",
    "crossSystemIntelligence",
  ];

  const enterpriseCoverage = enterpriseKeys.length
    ? Math.round(
        enterpriseKeys.reduce((sum, key) => sum + asNumber(stageBreakdown[key]), 0) /
          Math.max(rows.length * enterpriseKeys.length, 1) *
          100
      )
    : 0;

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

    enterpriseCoverage,
    coreScore: health.averageCoreScore,
    enterpriseScore: health.averageEnterpriseScore,

    generated_at: nowIso(),
  };
}

export function buildExecutiveSnapshotV2(students = []) {
  const rows = asArray(students);
  const verification = buildExecutiveVerificationSnapshot(rows);

  const journeys = verification.health.journeys || [];

  const passedStagePercent = (key) =>
    rows.length
      ? Math.round((asNumber(verification.stageBreakdown?.[key]) / rows.length) * 100)
      : 0;

  return {
    generated_at: nowIso(),

    platform: {
      totalStudents: rows.length,
      overallScore: verification.health.averageScore,
      coreScore: verification.coreScore,
      enterpriseScore: verification.enterpriseScore,
      health: verification.health.platformHealth,
      brokenStages: verification.brokenStages,
      totalFailures: verification.totalFailures,
      enterpriseCoverage: verification.enterpriseCoverage,
    },

    coreSystems: {
      inquiry: passedStagePercent("inquiry"),
      universityPlanning: passedStagePercent("universityPlanning"),
      application: passedStagePercent("application"),
      offer: passedStagePercent("offer"),
      cas: passedStagePercent("cas"),
      visa: passedStagePercent("visa"),
      payment: passedStagePercent("payment"),
      studentPortal: passedStagePercent("studentPortal"),
      counselorPortal: passedStagePercent("counselorPortal"),
      executive: passedStagePercent("executive"),
      automation: passedStagePercent("automation"),
    },

    enterpriseSystems: {
      analyticsOS: passedStagePercent("analyticsOS"),
      knowledgeOS: passedStagePercent("knowledgeOS"),
      communicationOS: passedStagePercent("communicationOS"),
      partnerOS: passedStagePercent("partnerOS"),
      aiCommandOS: passedStagePercent("aiCommandOS"),
      crossSystemIntelligence: passedStagePercent("crossSystemIntelligence"),
    },

    risk: {
      criticalStudents: verification.health.criticalStudents,
      atRiskStudents: verification.health.atRiskStudents,
      criticalRecovery: verification.criticalRecovery,
      highRecovery: verification.highRecovery,
      mediumRecovery: verification.mediumRecovery,
      topFailures: verification.failures.slice(0, 8),
    },

    recovery: {
      queue: verification.recoveryQueue.slice(0, 20),
      total: verification.recoveryQueue.length,
    },

    journeys,
  };
}

// END OF PART 1/2 — continue by pasting PART 2 immediately after this line


// =====================================================
// BROKEN WORKFLOW SCANNER + READINESS ENGINE V4
// =====================================================

function getStageOrderIndex(stage = "") {
  const order = [
    "not_started",
    "inquiry",
    "university_planning",
    "application_started",
    "application_submitted",
    "application_under_review",
    "offer_received",
    "offer_accepted",
    "cas_pending",
    "cas_issued",
    "visa_pending",
    "visa_approved",
    "payment",
    "enrolled",
  ];

  const clean = normalize(stage);
  const index = order.indexOf(clean);
  return index >= 0 ? index : 0;
}

function buildWorkflowIssue({
  student = {},
  type,
  stage,
  severity = "medium",
  title,
  description,
  expected = null,
  actual = null,
  metadata = {},
}) {
  return {
    id: [
      "workflow",
      normalize(type),
      normalize(stage),
      getStudentId(student) || "unknown",
      Math.random().toString(36).slice(2, 8),
    ].join("_"),
    student_id: getStudentId(student),
    student_type: getStudentType(student),
    student_name: getStudentName(student),
    type: normalize(type),
    stage: normalize(stage),
    severity: normalize(severity),
    title,
    description,
    expected,
    actual,
    metadata,
    detected_at: nowIso(),
  };
}

function getWorkflowSignals(student = {}, data = {}) {
  const mergedData = {
    ...(student.portalData || {}),
    ...(student.portal_data || {}),
    ...data,
  };

  const universities = getStudentDataArray(student, mergedData, [
    "universities",
    "university_planning",
    "student_universities",
    "recommended_universities",
  ]);

  const applications = getStudentDataArray(student, mergedData, [
    "applications",
    "student_applications",
    "application_records",
  ]);

  const visas = getStudentDataArray(student, mergedData, [
    "visas",
    "visa_records",
    "student_visas",
    "visa",
  ]);

  const invoices = getStudentDataArray(student, mergedData, [
    "invoices",
    "student_invoices",
    "invoice_records",
  ]);

  const payments = getStudentDataArray(student, mergedData, [
    "payments",
    "student_payments",
    "payment_records",
  ]);

  const receipts = getStudentDataArray(student, mergedData, [
    "receipts",
    "student_receipts",
    "receipt_uploads",
  ]);

  const tasks = getStudentDataArray(student, mergedData, [
    "tasks",
    "student_tasks",
    "counselor_tasks",
  ]);

  const documents = getStudentDataArray(student, mergedData, [
    "documents",
    "student_documents",
    "document_records",
  ]);

  const communications = getStudentDataArray(student, mergedData, [
    "communications",
    "student_communications",
    "messages",
    "communication_logs",
  ]);

  const timeline = getDataArray(mergedData, [
    "timeline",
    "timeline_events",
    "student_timeline",
    "events",
  ]);

  const portalAccount =
    mergedData.portalAccount ||
    mergedData.portal_account ||
    student.portal_account ||
    student.student_portal_account ||
    null;

  const stage = getJourneyStage(student);
  const statusText = normalize(
    [
      stage,
      student.application_status,
      student.offer_status,
      student.cas_status,
      student.visa_status,
      student.payment_status,
      applications
        .map((app) =>
          [
            app.status,
            app.application_status,
            app.offer_status,
            app.cas_status,
            app.visa_status,
          ].join(" ")
        )
        .join(" "),
      visas.map((visa) => [visa.status, visa.visa_status].join(" ")).join(" "),
    ].join(" ")
  );

  const hasOffer =
    [
      "offer_received",
      "offer_accepted",
      "cas_pending",
      "cas_issued",
      "visa_pending",
      "visa_approved",
      "enrolled",
    ].includes(stage) ||
    statusText.includes("offer") ||
    statusText.includes("conditional") ||
    statusText.includes("unconditional");

  const offerAccepted =
    [
      "offer_accepted",
      "cas_pending",
      "cas_issued",
      "visa_pending",
      "visa_approved",
      "enrolled",
    ].includes(stage) ||
    statusText.includes("offer_accepted") ||
    statusText.includes("accepted") ||
    statusText.includes("confirmed");

  const casIssued =
    ["cas_issued", "visa_pending", "visa_approved", "enrolled"].includes(stage) ||
    statusText.includes("cas_issued") ||
    statusText.includes("issued");

  const visaStarted =
    ["visa_pending", "visa_approved", "visa_rejected", "enrolled"].includes(stage) ||
    visas.length > 0 ||
    statusText.includes("visa");

  const visaApproved =
    ["visa_approved", "enrolled"].includes(stage) ||
    statusText.includes("visa_approved") ||
    statusText.includes("approved");

  const hasFinancialRecord =
    invoices.length > 0 ||
    payments.length > 0 ||
    receipts.length > 0 ||
    asNumber(student.invoice_count) > 0 ||
    asNumber(student.payment_count) > 0;

  const confirmedPayment =
    payments.some((payment) =>
      ["confirmed", "approved", "paid", "success"].includes(normalize(payment.status))
    ) || normalize(student.payment_status).includes("paid");

  const hasPortalAccount =
    Boolean(portalAccount) ||
    Boolean(student.portal_account_id) ||
    Boolean(student.student_portal_account_id) ||
    bool(student.has_portal_account);

  const portalActive =
    hasPortalAccount &&
    (!portalAccount || portalAccount.is_active === undefined || bool(portalAccount.is_active, true));

  const overdueTasks = tasks.filter((task) =>
    ["overdue", "pending", "open"].includes(normalize(task.status))
  );

  const documentReadiness =
    asNumber(student.document_readiness_percent, -1) >= 0
      ? asNumber(student.document_readiness_percent)
      : documents.length
        ? 70
        : 0;

  const daysSinceUpdated = asNumber(
    student.days_since_updated ||
      student.diagnostics?.days_since_updated ||
      student.days_without_update ||
      student.stale_days,
    0
  );

  return {
    mergedData,
    stage,
    stageIndex: getStageOrderIndex(stage),
    universities,
    applications,
    visas,
    invoices,
    payments,
    receipts,
    tasks,
    documents,
    communications,
    timeline,
    portalAccount,
    hasOffer,
    offerAccepted,
    casIssued,
    visaStarted,
    visaApproved,
    hasFinancialRecord,
    confirmedPayment,
    hasPortalAccount,
    portalActive,
    overdueTasks,
    documentReadiness,
    daysSinceUpdated,
  };
}

export function buildBrokenWorkflowScannerSnapshot(students = []) {
  const rows = asArray(students);

  const brokenWorkflows = [];
  const criticalFailures = [];
  const stalledStudents = [];
  const orphanRecords = [];
  const missingTransitions = [];
  const recoveryCandidates = [];

  rows.forEach((student) => {
    const signals = getWorkflowSignals(student, student.portalData || {});
    const verification = verifyEntireStudentJourney(student, signals.mergedData);
    const recoveryActions = generateRecoveryActions(student, verification);

    const pushIssue = (issue) => {
      brokenWorkflows.push(issue);
      if (issue.severity === "critical") criticalFailures.push(issue);
      if (issue.type === "missing_transition") missingTransitions.push(issue);
      if (issue.type === "orphan_record") orphanRecords.push(issue);
    };

    if (!getStudentId(student)) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "orphan_record",
          stage: "inquiry",
          severity: "critical",
          title: "Student record has no stable ID",
          description:
            "The workflow cannot safely connect this record across applications, payments, portal, or timeline.",
          expected: "student_id, inquiry_id, appointment_id, or id",
          actual: "missing",
        })
      );
    }

    if (signals.stageIndex >= getStageOrderIndex("application_started") && !signals.universities.length) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "missing_transition",
          stage: "university_planning",
          severity: "high",
          title: "Application movement without university planning",
          description:
            "Student is already moving through application stages but has no detected university planning record.",
          expected: "At least one university planning record before application movement",
          actual: "No university planning records detected",
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.stageIndex >= getStageOrderIndex("offer_received") && !signals.applications.length) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "orphan_record",
          stage: "application",
          severity: "critical",
          title: "Offer status exists without application record",
          description: "Offer/CAS/Visa movement was detected but no application record is attached.",
          expected: "student_applications record linked to student",
          actual: "No application records detected",
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.offerAccepted && !signals.casIssued && signals.stageIndex >= getStageOrderIndex("cas_pending")) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "missing_transition",
          stage: "cas",
          severity: "critical",
          title: "Offer accepted but CAS is not issued",
          description: "Student appears to be past offer acceptance, but CAS issue evidence is missing.",
          expected: "CAS pending/issued status or CAS timeline event",
          actual: "CAS issued signal missing",
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.casIssued && !signals.visaStarted) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "missing_transition",
          stage: "visa",
          severity: "critical",
          title: "CAS issued but visa workflow not started",
          description: "CAS has been issued or inferred, but no visa record/status exists.",
          expected: "Visa record, visa status, or visa timeline event",
          actual: "No visa workflow detected",
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.visaApproved && !signals.hasFinancialRecord) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "missing_transition",
          stage: "payment",
          severity: "high",
          title: "Visa approved but payment workflow is missing",
          description:
            "Student has reached visa approval/enrollment stage but no invoice, receipt, or payment records were detected.",
          expected: "Invoice, receipt, or payment record",
          actual: "No payment workflow records detected",
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.confirmedPayment && !signals.portalActive) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "missing_transition",
          stage: "student_portal",
          severity: "high",
          title: "Payment confirmed but portal is inactive or missing",
          description: "Payment was detected but student portal access is not active.",
          expected: "Active student portal account",
          actual: signals.hasPortalAccount ? "Portal account exists but is inactive" : "No portal account detected",
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.applications.length && !signals.timeline.length) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "orphan_record",
          stage: "timeline",
          severity: "medium",
          title: "Application exists without timeline activity",
          description: "Operational records exist but no timeline evidence was detected.",
          expected: "Timeline events for application/counselor/payment movement",
          actual: "No timeline events detected",
          metadata: {
            applications: signals.applications.length,
            payments: signals.payments.length,
            tasks: signals.tasks.length,
          },
        })
      );
    }

    if (signals.daysSinceUpdated >= 10 || (signals.stage === "not_started" && verification.score < 60)) {
      const issue = buildWorkflowIssue({
        student,
        type: "stalled_student",
        stage: signals.stage,
        severity: signals.daysSinceUpdated >= 20 ? "critical" : "high",
        title: "Student journey appears stalled",
        description: "Student has weak movement signals or has not been updated recently.",
        expected: "Fresh counselor action, status update, communication, or timeline event",
        actual: `${signals.daysSinceUpdated || 0} days since update`,
        metadata: {
          verification_score: verification.score,
          days_since_updated: signals.daysSinceUpdated,
        },
      });

      stalledStudents.push(issue);
      brokenWorkflows.push(issue);
      if (issue.severity === "critical") criticalFailures.push(issue);
    }

    if (signals.documentReadiness < 60 && signals.stageIndex >= getStageOrderIndex("application_started")) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "document_gap",
          stage: "documents",
          severity: "high",
          title: "Document readiness is weak for active student",
          description:
            "Student is already active in the journey but document readiness is below the safe threshold.",
          expected: "Document readiness at or above 60%",
          actual: `${signals.documentReadiness}%`,
          metadata: { stage: signals.stage },
        })
      );
    }

    if (signals.overdueTasks.length >= 5) {
      pushIssue(
        buildWorkflowIssue({
          student,
          type: "counselor_backlog",
          stage: "counselor_portal",
          severity: "high",
          title: "Counselor task backlog detected",
          description: "Student has multiple overdue/open tasks and needs counselor cleanup.",
          expected: "Fewer than 5 overdue/open tasks",
          actual: `${signals.overdueTasks.length} overdue/open tasks`,
          metadata: { overdue_tasks: signals.overdueTasks.length },
        })
      );
    }

    if (recoveryActions.length || verification.failures.length) {
      recoveryCandidates.push({
        student,
        student_id: getStudentId(student),
        student_name: getStudentName(student),
        student_type: getStudentType(student),
        currentStage: signals.stage,
        verification,
        recoveryActions,
        issueCount: brokenWorkflows.filter((issue) => issue.student_id === getStudentId(student)).length,
        highestSeverity:
          criticalFailures.some((issue) => issue.student_id === getStudentId(student))
            ? "critical"
            : recoveryActions.find((action) => ["urgent", "critical"].includes(action.priority))?.priority ||
              recoveryActions.find((action) => action.priority === "high")?.priority ||
              "medium",
      });
    }
  });

  const severityBreakdown = brokenWorkflows.reduce(
    (acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  return {
    brokenWorkflows,
    criticalFailures,
    stalledStudents,
    orphanRecords,
    missingTransitions,
    recoveryCandidates: recoveryCandidates.sort((a, b) => b.issueCount - a.issueCount),
    severityBreakdown,
    totalStudents: rows.length,
    totalBrokenWorkflows: brokenWorkflows.length,
    generated_at: nowIso(),
  };
}

export function buildStudentRecoveryRoadmap(student = {}, data = {}) {
  const signals = getWorkflowSignals(student, data);
  const verification = verifyEntireStudentJourney(student, signals.mergedData);
  const recoveryActions = generateRecoveryActions(student, verification);

  const scanner = buildBrokenWorkflowScannerSnapshot([student]);
  const studentIssues = scanner.brokenWorkflows.filter(
    (issue) => issue.student_id === getStudentId(student)
  );

  const failureReasons = [
    ...verification.failures.map((failure) => ({
      source: "verification",
      stage: failure.stage,
      severity: failure.severity,
      title: failure.title,
      description: failure.message,
    })),
    ...studentIssues.map((issue) => ({
      source: "workflow_scanner",
      stage: issue.stage,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
    })),
  ];

  const nextActions = recoveryActions.length
    ? recoveryActions
    : [
        buildRecoveryAction({
          student,
          stage: signals.stage,
          type: "manual_review",
          priority: verification.score < 60 ? "high" : "medium",
          title: "Manual Student Journey Review",
          description: "Review this student journey manually and confirm the next operational action.",
          target_table: "student_timeline",
          template_key: "manual_student_review",
        }),
      ];

  const criticalCount = failureReasons.filter((item) => item.severity === "critical").length;
  const highCount = failureReasons.filter((item) => item.severity === "high").length;

  const estimatedRecoveryTime =
    criticalCount > 0
      ? "24-48 hours"
      : highCount > 1
        ? "1-3 days"
        : failureReasons.length > 0
          ? "Same day"
          : "No recovery required";

  const owner =
    criticalCount > 0
      ? "Executive + Senior Counselor"
      : highCount > 0
        ? "Counselor Lead"
        : nextActions.some((action) => action.stage === "automation")
          ? "Automation Owner"
          : "Assigned Counselor";

  return {
    student_id: getStudentId(student),
    student_name: getStudentName(student),
    student_type: getStudentType(student),
    currentStage: signals.stage,
    currentStageLabel: signals.stage.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()),
    verificationScore: verification.score,
    verificationHealth: verification.health,
    failureReasons,
    nextActions,
    estimatedRecoveryTime,
    owner,
    generated_at: nowIso(),
  };
}


export function buildExecutiveRecoveryActions(students = []) {
  const rows = asArray(students);
  const scanner = buildBrokenWorkflowScannerSnapshot(rows);
  const recoveryQueue = buildExecutiveRecoveryQueue(rows);

  const immediateActions = [];
  const counselorActions = [];
  const automationActions = [];
  const executiveActions = [];

  recoveryQueue.forEach((item) => {
    asArray(item.actions).forEach((action) => {
      const enriched = {
        ...action,
        urgency: item.urgency,
        verification_score: item.verification?.score,
        failure_count: item.verification?.failures?.length || 0,
      };

      if (["critical", "urgent"].includes(action.priority) || item.urgency >= 90) {
        immediateActions.push(enriched);
      }

      if (
        [
          "university_planning",
          "application",
          "offer",
          "cas",
          "visa",
          "payment",
          "student_portal",
          "counselor_portal",
        ].includes(action.stage)
      ) {
        counselorActions.push(enriched);
      }

      if (["automation", "ai_command_os", "cross_system_intelligence", "analytics_os"].includes(action.stage)) {
        automationActions.push(enriched);
      }

      if (
        ["executive", "payment", "visa", "cas", "cross_system_intelligence"].includes(action.stage) ||
        item.urgency >= 70
      ) {
        executiveActions.push(enriched);
      }
    });
  });

  scanner.criticalFailures.forEach((issue) => {
    executiveActions.push(
      buildRecoveryAction({
        student: {
          student_id: issue.student_id,
          student_type: issue.student_type,
          student_name: issue.student_name,
        },
        stage: issue.stage,
        type: "executive_workflow_intervention",
        priority: "critical",
        title: issue.title,
        description: issue.description,
        target_table: "executive_action_queue",
        template_key: "executive_workflow_intervention",
        metadata: issue,
      })
    );
  });

  const sortByPriority = (items = []) =>
    items.sort((a, b) => {
      const weight = { critical: 5, urgent: 4, high: 3, medium: 2, low: 1 };
      return (weight[b.priority] || 0) - (weight[a.priority] || 0);
    });

  return {
    immediateActions: sortByPriority(immediateActions),
    counselorActions: sortByPriority(counselorActions),
    automationActions: sortByPriority(automationActions),
    executiveActions: sortByPriority(executiveActions),
    totals: {
      immediate: immediateActions.length,
      counselor: counselorActions.length,
      automation: automationActions.length,
      executive: executiveActions.length,
    },
    generated_at: nowIso(),
  };
}


export function buildWorkflowIntegrityScore(students = []) {
  const rows = asArray(students);
  const scanner = buildBrokenWorkflowScannerSnapshot(rows);
  const stageBreakdown = buildStageBreakdown(rows);
  const total = Math.max(rows.length, 1);

  const percent = (key) => Math.round((asNumber(stageBreakdown[key]) / total) * 100);

  const issuePenalty = (stages = []) => {
    const count = scanner.brokenWorkflows.filter((issue) => stages.includes(issue.stage)).length;
    return Math.min(35, count * 5);
  };

  const inquiryIntegrity = Math.max(0, percent("inquiry") - issuePenalty(["inquiry"]));

  const applicationIntegrity = Math.max(
    0,
    Math.round((percent("universityPlanning") + percent("application") + percent("offer")) / 3) -
      issuePenalty(["university_planning", "application", "offer"])
  );

  const visaIntegrity = Math.max(
    0,
    Math.round((percent("cas") + percent("visa")) / 2) - issuePenalty(["cas", "visa"])
  );

  const paymentIntegrity = Math.max(0, percent("payment") - issuePenalty(["payment"]));

  const portalIntegrity = Math.max(
    0,
    Math.round((percent("studentPortal") + percent("counselorPortal")) / 2) -
      issuePenalty(["student_portal", "counselor_portal"])
  );

  const enterpriseIntegrity = Math.max(
    0,
    Math.round(
      (
        percent("executive") +
        percent("automation") +
        percent("analyticsOS") +
        percent("knowledgeOS") +
        percent("communicationOS") +
        percent("partnerOS") +
        percent("aiCommandOS") +
        percent("crossSystemIntelligence")
      ) / 8
    ) -
      issuePenalty([
        "executive",
        "automation",
        "analytics_os",
        "knowledge_os",
        "communication_os",
        "partner_os",
        "ai_command_os",
        "cross_system_intelligence",
      ])
  );

  const overallIntegrity = Math.max(
    0,
    Math.round(
      inquiryIntegrity * 0.12 +
        applicationIntegrity * 0.22 +
        visaIntegrity * 0.18 +
        paymentIntegrity * 0.14 +
        portalIntegrity * 0.16 +
        enterpriseIntegrity * 0.18
    ) -
      scanner.severityBreakdown.critical * 3 -
      scanner.severityBreakdown.high * 1
  );

  return {
    inquiryIntegrity,
    applicationIntegrity,
    visaIntegrity,
    paymentIntegrity,
    portalIntegrity,
    enterpriseIntegrity,
    overallIntegrity,
    health: healthFromScore(overallIntegrity),
    penalties: {
      criticalIssues: scanner.severityBreakdown.critical,
      highIssues: scanner.severityBreakdown.high,
      mediumIssues: scanner.severityBreakdown.medium,
      lowIssues: scanner.severityBreakdown.low,
    },
    brokenWorkflowCount: scanner.totalBrokenWorkflows,
    generated_at: nowIso(),
  };
}

export function generateProductionReadinessReport(students = []) {
  const rows = asArray(students);
  const health = generatePlatformHealthReport(rows);
  const verificationSnapshot = buildExecutiveVerificationSnapshot(rows);
  const hardening = buildProductionHardeningSnapshot(rows);
  const scanner = buildBrokenWorkflowScannerSnapshot(rows);
  const integrity = buildWorkflowIntegrityScore(rows);
  const executiveRecovery = buildExecutiveRecoveryActions(rows);

  const launchBlockers = [];

  if (!rows.length) {
    launchBlockers.push({
      severity: "critical",
      title: "No real student records loaded",
      description: "Production readiness cannot be confirmed without real student data.",
    });
  }

  if (scanner.criticalFailures.length > 0) {
    launchBlockers.push({
      severity: "critical",
      title: "Critical workflow failures exist",
      description: `${scanner.criticalFailures.length} critical workflow failures must be reviewed before go-live.`,
    });
  }

  if (integrity.overallIntegrity < 70) {
    launchBlockers.push({
      severity: "high",
      title: "Workflow integrity below launch threshold",
      description: `Overall workflow integrity is ${integrity.overallIntegrity}%. Target is 70%+ for controlled launch.`,
    });
  }

  if (hardening.schemaRisk > 0) {
    launchBlockers.push({
      severity: "high",
      title: "Schema or system signal risk detected",
      description: `${hardening.schemaRisk} verification areas indicate possible schema, data, or signal gaps.`,
    });
  }

  if (hardening.portalRisk > 0) {
    launchBlockers.push({
      severity: "medium",
      title: "Student portal readiness risk",
      description: `${hardening.portalRisk} student portal verification issues detected.`,
    });
  }

  if (hardening.paymentRisk > 0) {
    launchBlockers.push({
      severity: "medium",
      title: "Payment workflow readiness risk",
      description: `${hardening.paymentRisk} payment workflow verification issues detected.`,
    });
  }

  const criticalBlockers = launchBlockers.filter((item) => item.severity === "critical").length;
  const highBlockers = launchBlockers.filter((item) => item.severity === "high").length;

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        health.averageScore * 0.35 +
          integrity.overallIntegrity * 0.35 +
          hardening.score * 0.2 +
          Math.max(0, 100 - scanner.totalBrokenWorkflows * 4) * 0.1
      ) -
        criticalBlockers * 10 -
        highBlockers * 5
    )
  );

  const recommendedActions = [
    ...executiveRecovery.immediateActions.slice(0, 10),
    ...executiveRecovery.executiveActions.slice(0, 10),
    ...executiveRecovery.counselorActions.slice(0, 10),
  ].slice(0, 25);

  const goLiveStatus =
    criticalBlockers > 0
      ? "blocked"
      : readinessScore >= 90 && integrity.overallIntegrity >= 85
        ? "ready"
        : readinessScore >= 75
          ? "controlled_launch_ready"
          : readinessScore >= 60
            ? "needs_hardening"
            : "not_ready";

  return {
    readinessScore,
    readinessHealth: healthFromScore(readinessScore),
    goLiveStatus,
    totalStudents: rows.length,
    criticalIssues: scanner.criticalFailures,
    launchBlockers,
    recommendedActions,
    platformHealth: health,
    workflowIntegrity: integrity,
    brokenWorkflowScanner: scanner,
    verificationSnapshot,
    productionHardening: hardening,
    executiveRecovery,
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
    [
      "application",
      "payment",
      "studentPortal",
      "automation",
      "analyticsOS",
      "knowledgeOS",
      "communicationOS",
      "partnerOS",
      "aiCommandOS",
      "crossSystemIntelligence",
    ].includes(item.stage)
  ).length;

  const timelineRisk = rows.filter((student) => {
    const data = student.portalData || {};
    const timeline = getDataArray(data, ["timeline", "timeline_events", "student_timeline"]);
    const hasOps =
      getStudentDataArray(student, data, ["applications", "documents", "tasks", "payments"]).length > 0;

    return hasOps && timeline.length === 0;
  }).length;

  const automationRisk = snapshot.failures.find((item) => item.stage === "automation")?.count || 0;
  const portalRisk = snapshot.failures.find((item) => item.stage === "studentPortal")?.count || 0;
  const paymentRisk = snapshot.failures.find((item) => item.stage === "payment")?.count || 0;
  const enterpriseRisk =
    snapshot.failures.filter((item) =>
      [
        "analyticsOS",
        "knowledgeOS",
        "communicationOS",
        "partnerOS",
        "aiCommandOS",
        "crossSystemIntelligence",
      ].includes(item.stage)
    ).length || 0;

  const score = Math.max(
    0,
    Math.min(
      100,
      snapshot.health.averageScore -
        schemaRisk * 3 -
        timelineRisk * 2 -
        automationRisk * 2 -
        portalRisk * 2 -
        paymentRisk * 2 -
        enterpriseRisk * 2
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
    enterpriseRisk,
    verificationCoverage: snapshot.health.averageScore,
    coreVerificationCoverage: snapshot.health.averageCoreScore,
    enterpriseVerificationCoverage: snapshot.health.averageEnterpriseScore,
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

  verifyAnalyticsOSStage,
  verifyKnowledgeOSStage,
  verifyCommunicationOSStage,
  verifyPartnerOSStage,
  verifyAICommandStage,
  verifyCrossSystemIntelligenceStage,

  verifyEntireStudentJourney,
  generatePlatformHealthReport,
  generateRecoveryActions,
  buildVerificationFailureSummary,
  buildWorkflowFailureHeatmap,
  buildRecoveryQueue,
  buildStageBreakdown,
  buildExecutiveRecoveryQueue,
  buildExecutiveVerificationSnapshot,
  buildExecutiveSnapshotV2,
  buildBrokenWorkflowScannerSnapshot,
  buildExecutiveRecoveryActions,
  buildStudentRecoveryRoadmap,
  buildWorkflowIntegrityScore,
  generateProductionReadinessReport,
  buildProductionHardeningSnapshot,
};

// END OF PART 3/3 — FULL platformVerificationEngine.js REPLACEMENT COMPLETE