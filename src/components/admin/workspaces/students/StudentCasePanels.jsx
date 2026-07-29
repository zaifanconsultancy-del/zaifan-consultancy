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
      <div className="pb-10">
        <section className="overflow-hidden rounded-[1.6rem] border-2 border-orange-400 bg-white shadow-[0_14px_40px_rgba(121,72,40,0.08)]">
          <StudentDocumentsPanel
            key={`documents-${studentId}-${studentType}-${panelMountKey}`}
            student={{
              ...workingStudent,
              documents: studentDocuments,
            }}
            sharedDocuments={studentDocuments}
            onSharedDataChange={loadStudentOsData}
          />
        </section>
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
      <div className="space-y-5">
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
      <div className="rounded-[1.75rem] border border-slate-300 bg-slate-50 p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              CRM Pipeline
            </h3>
            <p className="text-sm text-slate-500">
              Track this student through the consultancy workflow.
            </p>
          </div>

          {savingStage ? (
            <span className="rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">
              Saving stage...
            </span>
          ) : null}
        </div>

        {persistenceMissing ? (
          <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Pipeline stages are visible, but stage persistence is not connected
            for this record type. Buttons are disabled to prevent fake local-only
            progress.
          </div>
        ) : null}

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStageId;
            const isPassed = index < Math.max(currentIndex, 0);

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageChange(stage.id)}
                disabled={savingStage || persistenceMissing}
                className={`group w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActive
                    ? "border-orange-300/40 bg-orange-500/10"
                    : isPassed
                    ? "border-emerald-400/20 bg-emerald-500/5"
                    : "border-slate-300 bg-white hover:border-orange-300/25 hover:bg-white/[0.045]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                      isActive
                        ? "border-orange-300/40 bg-orange-500/15 text-orange-600"
                        : isPassed
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-700"
                        : "border-slate-300 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {stage.label || stage.title || stage.id}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {stage.description || "Pipeline workflow stage"}
                    </p>
                  </div>

                  {isActive ? (
                    <span className="rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">
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
