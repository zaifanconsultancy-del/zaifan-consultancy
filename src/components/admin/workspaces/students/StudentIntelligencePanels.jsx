// StudentIntelligencePanels STUDENT CASE BRAIN V2
// Every student-level AI surface receives the same canonical Student 360 context.

import { lazy, useMemo } from "react";
import { buildStudentCaseBrain } from "../../../../services/studentCaseBrain";

const StudentAnalyticsPanel = lazy(() => import("./StudentAnalyticsPanel"));
const AIWorkspacePanel = lazy(() => import("../intelligence/AIWorkspacePanel"));
const GPTIntelligencePanel = lazy(() => import("../intelligence/GPTIntelligencePanel"));
const AICounselorAssistant = lazy(() => import("../team/AICounselorAssistant"));
const StudentExecutiveRiskCard = lazy(() => import("./StudentExecutiveRiskCard"));

const OWNED_PANELS = new Set([
  "analytics",
  "ai-workspace",
  "gpt-intelligence",
  "ai",
  "executive-ai",
]);

function StudentIntelligencePanels({
  activePanel,
  workingStudent,
  studentType,
  adminProfile,
  allLeads = [],
  setActivePanel,

  studentApplication,
  studentApplications = [],
  studentDocuments = [],
  studentDocumentRequirements = [],
  studentUniversities = [],
  studentUniversityRequirements = [],
  studentUniversityEvents = [],
  studentApplicationRequirements = [],
  studentApplicationEvents = [],
  studentApplicationTimeline = [],
  studentTasks = [],
  studentCommunications = [],
  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  studentPaymentRequests = [],
  studentSupportRequests = [],
  studentSupportMessages = [],
  studentVisaCases = [],
  studentVisaRequirements = [],
  studentVisaEvents = [],
  studentFollowUps = [],
  studentCrmTimeline = [],
  portalAccount = null,
  personId = null,
  osSourceHealth = {},
  onSharedDataChange = null,
}) {
  const studentCaseBrain = useMemo(
    () =>
      buildStudentCaseBrain({
        student: workingStudent || {},
        studentType,
        personId,
        application: studentApplication,
        applications: studentApplications,
        documents: studentDocuments,
        documentRequirements: studentDocumentRequirements,
        universities: studentUniversities,
        universityRequirements: studentUniversityRequirements,
        universityEvents: studentUniversityEvents,
        applicationRequirements: studentApplicationRequirements,
        applicationEvents: studentApplicationEvents,
        applicationTimeline: studentApplicationTimeline,
        tasks: studentTasks,
        communications: studentCommunications,
        invoices: studentInvoices,
        payments: studentPayments,
        receipts: studentReceipts,
        paymentRequests: studentPaymentRequests,
        supportRequests: studentSupportRequests,
        supportMessages: studentSupportMessages,
        visaCases: studentVisaCases,
        visaRequirements: studentVisaRequirements,
        visaEvents: studentVisaEvents,
        followUps: studentFollowUps,
        crmTimeline: studentCrmTimeline,
        portalAccount,
        sourceHealth: osSourceHealth,
      }),
    [
      workingStudent,
      studentType,
      personId,
      studentApplication,
      studentApplications,
      studentDocuments,
      studentDocumentRequirements,
      studentUniversities,
      studentUniversityRequirements,
      studentUniversityEvents,
      studentApplicationRequirements,
      studentApplicationEvents,
      studentApplicationTimeline,
      studentTasks,
      studentCommunications,
      studentInvoices,
      studentPayments,
      studentReceipts,
      studentPaymentRequests,
      studentSupportRequests,
      studentSupportMessages,
      studentVisaCases,
      studentVisaRequirements,
      studentVisaEvents,
      studentFollowUps,
      studentCrmTimeline,
      portalAccount,
      osSourceHealth,
    ]
  );

  const executiveStudent = useMemo(() => {
    const activeUniversities = (studentUniversities || []).filter((row) => {
      const archived =
        row?.is_archived === true ||
        row?.is_archived === "true" ||
        normalizeValue(row?.status) === "archived";
      return !archived;
    });

    const universityTiers = activeUniversities.reduce(
      (accumulator, row) => {
        const tier = getUniversityTier(row);
        if (tier) accumulator[tier] += 1;
        return accumulator;
      },
      { dream: 0, target: 0, safe: 0 }
    );

    const application =
      studentApplication ||
      (studentApplications || [])[0] ||
      {};

    const visaCase = getLatestRecord(studentVisaCases);

    const taskSummary =
      studentCaseBrain?.summaries?.tasks || {
        total: studentTasks.length,
        open: 0,
        overdue: 0,
      };

    const applicationStatus =
      application?.application_status ||
      application?.workflow_stage ||
      application?.stage ||
      application?.status ||
      workingStudent?.application_status ||
      "";

    const offerStatus =
      application?.offer_status ||
      application?.admission_status ||
      workingStudent?.offer_status ||
      "";

    const visaStatus =
      visaCase?.visa_status ||
      visaCase?.status ||
      studentCaseBrain?.summaries?.visa?.visaStatus ||
      workingStudent?.visa_status ||
      "";

    return {
      ...(workingStudent || {}),
      student_name:
        workingStudent?.student_name ||
        workingStudent?.full_name ||
        workingStudent?.name ||
        "Student",
      student_type: studentType,
      application_status: applicationStatus,
      offer_status: offerStatus,
      visa_status: visaStatus,
      application_count:
        (studentApplications || []).length ||
        (studentApplication ? 1 : 0),
      documents: studentDocuments || [],
      tasks: studentTasks || [],
      task_count: Number(taskSummary.total || 0),
      pending_tasks_count: Number(taskSummary.open || 0),
      overdue_tasks_count: Number(taskSummary.overdue || 0),
      has_university_plan: activeUniversities.length > 0,
      university_plan_count: activeUniversities.length,
      dream_university_count: universityTiers.dream,
      target_university_count: universityTiers.target,
      safe_university_count: universityTiers.safe,
      student360_case_brain_version: studentCaseBrain?.version || "",
    };
  }, [
    workingStudent,
    studentType,
    studentApplication,
    studentApplications,
    studentDocuments,
    studentTasks,
    studentUniversities,
    studentVisaCases,
    studentCaseBrain,
  ]);

  if (!OWNED_PANELS.has(activePanel)) {
    return null;
  }

  if (activePanel === "analytics") {
    return (
      <StudentAnalyticsPanel
        student={{
          ...workingStudent,
          application: studentApplication || workingStudent?.application,
          applications: studentApplications,
          documents: studentDocuments,
          documentRequirements: studentDocumentRequirements,
          universities: studentUniversities,
          universityRequirements: studentUniversityRequirements,
          tasks: studentTasks,
          communications: studentCommunications,
          invoices: studentInvoices,
          payments: studentPayments,
          receipts: studentReceipts,
          paymentRequests: studentPaymentRequests,
          supportRequests: studentSupportRequests,
          visaCases: studentVisaCases,
        }}
        allLeads={allLeads}
      />
    );
  }

  if (activePanel === "ai-workspace") {
    return (
      <AIWorkspacePanel
        student={workingStudent}
        studentType={studentType}
        adminProfile={adminProfile}
        caseContext={studentCaseBrain}
      />
    );
  }

  if (activePanel === "gpt-intelligence") {
    return (
      <GPTIntelligencePanel
        student={workingStudent}
        adminProfile={adminProfile}
        caseContext={studentCaseBrain}
        onOpenWorkspace={() => setActivePanel("ai-workspace")}
      />
    );
  }

  if (activePanel === "ai") {
    return (
      <AICounselorAssistant
        student={workingStudent}
        studentType={studentType}
        adminProfile={adminProfile}
        caseContext={studentCaseBrain}
      />
    );
  }

  if (activePanel === "executive-ai") {
    return (
      <StudentExecutiveRiskCard
        student={executiveStudent}
        adminProfile={adminProfile}
        onSharedDataChange={onSharedDataChange}
      />
    );
  }

  return null;
}


function normalizeValue(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getUniversityTier(row = {}) {
  const candidates = [
    row?.plan_type,
    row?.shortlist_type,
    row?.recommendation_type,
    row?.strategy_tier,
    row?.tier,
    row?.category,
    row?.fit_bucket,
    row?.classification,
    row?.university_type,
  ]
    .map(normalizeValue)
    .filter(Boolean);

  for (const value of candidates) {
    if (value.includes("dream")) return "dream";
    if (value.includes("target")) return "target";
    if (value.includes("safe")) return "safe";
  }

  return "";
}

function getLatestRecord(rows = []) {
  if (!Array.isArray(rows) || !rows.length) return null;

  return [...rows].sort((a, b) => {
    const bTime = new Date(
      b?.updated_at ||
        b?.created_at ||
        b?.submitted_at ||
        b?.date ||
        0
    ).getTime();
    const aTime = new Date(
      a?.updated_at ||
        a?.created_at ||
        a?.submitted_at ||
        a?.date ||
        0
    ).getTime();

    return (Number.isFinite(bTime) ? bTime : 0) -
      (Number.isFinite(aTime) ? aTime : 0);
  })[0] || null;
}

export default StudentIntelligencePanels;
