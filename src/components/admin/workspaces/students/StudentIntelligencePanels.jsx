import { lazy } from "react";

const StudentAnalyticsPanel = lazy(() => import("./StudentAnalyticsPanel"));
const AIWorkspacePanel = lazy(() => import("../intelligence/AIWorkspacePanel"));
const GPTIntelligencePanel = lazy(() => import("../intelligence/GPTIntelligencePanel"));
const AICounselorAssistant = lazy(() => import("../team/AICounselorAssistant"));
const ExecutiveAIDashboard = lazy(() => import("../intelligence/ExecutiveAIDashboard"));

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
  studentDocuments,
  studentUniversities,
  studentTasks,
  studentCommunications,

  executiveStudents = [],
}) {
  if (!OWNED_PANELS.has(activePanel)) {
    return null;
  }

  if (activePanel === "analytics") {
    return (
      <StudentAnalyticsPanel
        student={{
          ...workingStudent,
          application: studentApplication || workingStudent?.application,
          documents: studentDocuments,
          universities: studentUniversities,
          tasks: studentTasks,
          communications: studentCommunications,
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
      />
    );
  }

  if (activePanel === "gpt-intelligence") {
    return (
      <GPTIntelligencePanel
        student={workingStudent}
        adminProfile={adminProfile}
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
      />
    );
  }

  if (activePanel === "executive-ai") {
    return <ExecutiveAIDashboard students={executiveStudents} />;
  }

  return null;
}

export default StudentIntelligencePanels;
