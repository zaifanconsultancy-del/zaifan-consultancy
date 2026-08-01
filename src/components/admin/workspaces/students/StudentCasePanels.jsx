// StudentCasePanels PARTNER OS EXTREME V2 — Clean Panel Ownership
import { lazy } from "react";

const LeadAssignmentPanel = lazy(() => import("../leads-crm/LeadAssignmentPanel"));
const CrmTimelinePanel = lazy(() => import("../leads-crm/CrmTimelinePanel"));
const FollowUpReminderPanel = lazy(() => import("../leads-crm/FollowUpReminderPanel"));

const StudentDocumentsPanel = lazy(() => import("./StudentDocumentsPanel"));
const StudentApplicationPanel = lazy(() => import("./StudentApplicationPanel"));
const VisaTrackerPanel = lazy(() => import("../visa/VisaTrackerPanel"));
const UniversityManagementPanel = lazy(() => import("./UniversityManagementPanel"));
const CommunicationCenterPanel = lazy(() => import("../communications/CommunicationCenterPanel"));
const TaskCenterPanel = lazy(() => import("../operations/TaskCenterPanel"));
const CounselorQueuePanel = lazy(() => import("../team/CounselorQueuePanel"));
const SmartActionsPanel = lazy(() => import("../leads-crm/SmartActionsPanel"));
const PaymentCenterPanel = lazy(() => import("../finance/PaymentCenterPanel"));
const StudentSupportDeskPanel = lazy(() => import("./StudentSupportDeskPanel"));

const OWNED_PANELS = new Set([
  "documents",
  "applications",
  "visa",
  "universities",
  "payments",
  "support-requests",
  "communication",
  "operations",
  "pipeline",
  "assignment",
  "timeline",
  "followups",
]);

function StudentCasePanels({
  activePanel,

  studentId,
  studentType,
  sourceType,
  panelMountKey,

  workingStudent,
  adminProfile,
  permissions,

  studentDocuments,
  studentApplication,
  studentUniversities,
  studentInvoices,
  studentPayments,
  studentReceipts,
  studentPaymentRequests,
  studentSupportRequests,
  studentCommunications,
  studentTasks,

  loadStudentOsData,
  setActivePanel,

  stages,
  currentStageId,
  savingStage,
  isAppointment,
  updateAppointmentStage,
  updateInquiryStage,
  handleStageChange,
}) {
  if (!OWNED_PANELS.has(activePanel)) {
    return null;
  }

  if (activePanel === "documents") {
    return (
      <div className="min-w-0 pb-10">
        <StudentDocumentsPanel
          key={`documents-${studentId}-${studentType}-${panelMountKey}`}
          student={{
            ...workingStudent,
            documents: studentDocuments,
          }}
          sharedDocuments={studentDocuments}
          onSharedDataChange={loadStudentOsData}
        />
      </div>
    );
  }

  if (activePanel === "applications") {
    return (
      <StudentApplicationPanel
        key={`applications-${studentId}-${studentType}-${panelMountKey}`}
        student={{
          ...workingStudent,
          application: studentApplication,
        }}
        sharedApplication={studentApplication}
        studentType={studentType}
        onSharedDataChange={loadStudentOsData}
      />
    );
  }

  if (activePanel === "visa") {
    return (
      <VisaTrackerPanel
        key={`visa-${studentId}-${studentType}-${panelMountKey}`}
        student={{
          ...workingStudent,
          application: studentApplication,
          documents: studentDocuments,
        }}
        sharedApplication={studentApplication}
        sharedDocuments={studentDocuments}
        onSharedDataChange={loadStudentOsData}
      />
    );
  }

  if (activePanel === "universities") {
    return (
      <UniversityManagementPanel
        key={`universities-${studentId}-${studentType}-${panelMountKey}`}
        student={{
          ...workingStudent,
          universities: studentUniversities,
        }}
        sharedUniversities={studentUniversities}
        onSharedDataChange={loadStudentOsData}
      />
    );
  }

  if (activePanel === "payments") {
    return (
      <PaymentCenterPanel
        key={`payments-${studentId}-${studentType}-${panelMountKey}`}
        student={workingStudent}
        studentType={studentType}
        adminProfile={adminProfile}
        invoices={studentInvoices}
        payments={studentPayments}
        receipts={studentReceipts}
        paymentRequests={studentPaymentRequests}
        onSharedDataChange={loadStudentOsData}
      />
    );
  }

  if (activePanel === "support-requests") {
    return (
      <StudentSupportDeskPanel
        key={`support-${studentId}-${studentType}-${panelMountKey}`}
        student={workingStudent}
        studentType={studentType}
        adminProfile={adminProfile}
        requests={studentSupportRequests}
        onRefresh={loadStudentOsData}
        onOpenTimeline={() => setActivePanel("timeline")}
      />
    );
  }

  if (activePanel === "communication") {
    return (
      <CommunicationCenterPanel
        key={`communication-${studentId}-${studentType}-${panelMountKey}`}
        student={{
          ...workingStudent,
          communications: studentCommunications,
        }}
        sharedCommunications={studentCommunications}
        onSharedDataChange={loadStudentOsData}
      />
    );
  }

  if (activePanel === "operations") {
    const operationalStudent = {
      ...workingStudent,
      documents: studentDocuments,
      application: studentApplication,
      tasks: studentTasks,
    };

    return (
      <div className="min-w-0 space-y-5">
        <TaskCenterPanel
          key={`tasks-${studentId}-${studentType}-${panelMountKey}`}
          student={operationalStudent}
          sharedDocuments={studentDocuments}
          sharedApplication={studentApplication}
          sharedTasks={studentTasks}
          onSharedDataChange={loadStudentOsData}
        />

        <CounselorQueuePanel student={operationalStudent} />
        <SmartActionsPanel student={operationalStudent} />
      </div>
    );
  }

  if (activePanel === "pipeline") {
    const persistenceMissing = isAppointment
      ? typeof updateAppointmentStage !== "function"
      : typeof updateInquiryStage !== "function";

    const currentIndex = stages.findIndex(
      (item) => item.id === currentStageId
    );

    return (
      <div className="min-w-0 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-4 rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white shadow-[0_18px_50px_rgba(18,56,101,0.11)] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
              CRM Pipeline
            </h3>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-100">
              Track this student through the consultancy workflow.
            </p>
          </div>

          {savingStage ? (
            <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-xs font-black text-white">
              Saving stage...
            </span>
          ) : null}
        </div>

        {persistenceMissing ? (
          <div className="mb-4 rounded-[1.35rem] border-[3px] border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900 shadow-[0_8px_22px_rgba(18,56,101,0.04)]">
            Pipeline stages are visible, but stage persistence is not connected
            for this record type. Buttons are disabled to prevent fake local-only
            progress.
          </div>
        ) : null}

        <div className="min-w-0 space-y-3 rounded-[1.8rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_18px_50px_rgba(18,56,101,0.08)] sm:p-5">
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStageId;
            const isPassed = index < Math.max(currentIndex, 0);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageChange(stage.id)}
                disabled={savingStage || persistenceMissing}
                className={`group min-w-0 w-full rounded-[1.35rem] border-[3px] p-4 text-left shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive
                    ? "border-[#FF5A0A] bg-[#FFF4E8]"
                    : isPassed
                    ? "border-[#34D399] bg-[#F0FFF8]"
                    : "border-[#C9D7E6] bg-[#FFF8EF] hover:border-[#FF5A0A] hover:bg-white"
                }`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                      isActive
                        ? "border-[#FF5A0A] bg-[#FF5A0A] text-white"
                        : isPassed
                        ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                        : "border-[#C9D7E6] bg-white text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="break-words font-black text-[#10233F]">
                      {stage.label || stage.title || stage.id}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-600">
                      {stage.description || "Pipeline workflow stage"}
                    </p>
                  </div>

                  {isActive ? (
                    <span className="rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700">
                      Current
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (activePanel === "assignment") {
    return (
      <LeadAssignmentPanel
        student={workingStudent}
        studentType={sourceType}
        adminProfile={adminProfile}
        permissions={permissions}
      />
    );
  }

  if (activePanel === "timeline") {
    return (
      <CrmTimelinePanel
        key={`timeline-${studentId}-${studentType}-${panelMountKey}`}
        studentId={workingStudent.id}
        studentType={studentType}
        adminProfile={adminProfile}
      />
    );
  }

  if (activePanel === "followups") {
    return (
      <FollowUpReminderPanel
        key={`followups-${studentId}-${studentType}-${panelMountKey}`}
        studentId={workingStudent.id}
        studentType={studentType}
        adminProfile={adminProfile}
      />
    );
  }

  return null;
}

export default StudentCasePanels;
