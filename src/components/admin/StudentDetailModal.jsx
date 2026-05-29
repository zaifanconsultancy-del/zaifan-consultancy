import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LeadAssignmentPanel from "./LeadAssignmentPanel";
import CrmTimelinePanel from "./CrmTimelinePanel";
import FollowUpReminderPanel from "./FollowUpReminderPanel";
import AICounselorAssistant from "./AICounselorAssistant";
import { addTimelineEvent } from "../../lib/crmTimeline";
import {
  getPipelineStages,
  getPipelineStageById,
  getPipelineProgress,
} from "../../data/crmPipelineConfig";

function StudentDetailModal({
  student = null,
  type = "inquiry",
  onClose = () => {},
  cardClass = "",
  adminProfile = null,
  permissions = {},
  updateInquiryPriority = null,
  updateAppointmentPriority = null,
  updateAppointmentStatus = null,
  updateAppointmentStage = null,
  toggleInquiryStatus = null,
  deleteInquiry = null,
  deleteAppointment = null,
}) {
  const [activePanel, setActivePanel] = useState("overview");
  const [savingStage, setSavingStage] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [localStudent, setLocalStudent] = useState(student);

  useEffect(() => {
    setLocalStudent(student);
  }, [student]);

  const safePermissions = {
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    ...permissions,
  };

  const workingStudent = localStudent || student;

  const isAppointment = type === "appointment";
  const isInquiry = type === "inquiry";

  const pipelineType = isAppointment ? "appointment" : "inquiry";
  const stages = useMemo(() => getPipelineStages(pipelineType), [pipelineType]);

  const currentStageId =
    workingStudent?.pipeline_stage ||
    workingStudent?.stage ||
    workingStudent?.status_stage ||
    (isAppointment ? workingStudent?.appointment_stage : null) ||
    stages?.[0]?.id;

  const currentStage =
    getPipelineStageById(pipelineType, currentStageId) || stages?.[0];

  const pipelineProgress = getPipelineProgress(pipelineType, currentStageId);

  if (!workingStudent) return null;

  const fullName =
    workingStudent.full_name || workingStudent.name || "Unknown Student";

  const email = workingStudent.email || "No email added";

  const phone =
    workingStudent.phone || workingStudent.phone_number || "No phone added";

  const country =
    workingStudent.country ||
    workingStudent.country_interest ||
    workingStudent.preferred_country ||
    "Not selected";

  const field =
    workingStudent.field_of_interest ||
    workingStudent.course ||
    workingStudent.program ||
    workingStudent.study_field ||
    workingStudent.consultation_type ||
    "Not selected";

  const priority = workingStudent.priority || "medium";

  const status =
    workingStudent.status || (workingStudent.completed ? "completed" : "pending");

  const notes =
    workingStudent.notes ||
    workingStudent.message ||
    workingStudent.consultation_notes ||
    "No notes yet.";

  const appointmentDate =
    workingStudent.appointment_date || workingStudent.date || "Not selected";

  const appointmentTime =
    workingStudent.appointment_time || workingStudent.time || "Not selected";

  const consultationType =
    workingStudent.consultation_type || workingStudent.type || "Consultation";

  const createdAt = workingStudent.created_at
    ? new Date(workingStudent.created_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  const priorityOptions = ["vip", "high", "medium", "low"];

  const statusOptions = isAppointment
    ? ["pending", "confirmed", "completed", "cancelled"]
    : ["pending", "contacted", "completed"];

  const sidebarItems = [
  ["overview", "Overview", "Student details and controls"],
  ["pipeline", "Pipeline", "Workflow stage tracking"],
  ["assignment", "Assignment", "Owner and staff handling"],
  ["timeline", "Timeline", "CRM history and changes"],
  ["followups", "Follow-ups", "Reminder and next actions"],
  ["ai", "AI Actions", "Copilot and follow-up generation"],
];

  const getPriorityStyle = (value) => {
    const styles = {
      vip: "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]",
      high: "border-red-400/30 bg-red-500/10 text-red-300",
      medium: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    };

    return styles[value] || styles.medium;
  };

  const getStatusStyle = (value) => {
    const styles = {
      pending: "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
      contacted: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      confirmed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      completed: "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]",
      cancelled: "border-red-400/30 bg-red-500/10 text-red-300",
    };

    return styles[value] || styles.pending;
  };

  const handlePriorityChange = async (newPriority) => {
    if (!safePermissions.canUpdatePriority || newPriority === priority) return;

    const oldPriority = priority;

    setLocalStudent((prev) => ({
      ...(prev || workingStudent),
      priority: newPriority,
    }));

    setSavingPriority(true);

    try {
      if (isAppointment && updateAppointmentPriority) {
        await updateAppointmentPriority(workingStudent.id, newPriority);
      }

      if (isInquiry && updateInquiryPriority) {
        await updateInquiryPriority(workingStudent.id, newPriority);
      }

      await addTimelineEvent({
        studentId: workingStudent.id,
        studentType: type,
        actionType: "priority_changed",
        title: "Priority Updated",
        description: `${fullName}'s priority was updated.`,
        oldValue: oldPriority,
        newValue: newPriority,
        adminProfile,
      });
    } finally {
      setSavingPriority(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!safePermissions.canUpdateStatus || newStatus === status) return;

    const oldStatus = status;

    setLocalStudent((prev) => ({
      ...(prev || workingStudent),
      status: newStatus,
      completed: newStatus === "completed",
    }));

    setSavingStatus(true);

    try {
      if (isAppointment && updateAppointmentStatus) {
        await updateAppointmentStatus(workingStudent.id, newStatus);
      }

      if (isInquiry && toggleInquiryStatus) {
        await toggleInquiryStatus(workingStudent.id, newStatus);
      }

      await addTimelineEvent({
        studentId: workingStudent.id,
        studentType: type,
        actionType: "status_changed",
        title: "Status Updated",
        description: `${fullName}'s status was updated.`,
        oldValue: oldStatus,
        newValue: newStatus,
        adminProfile,
      });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStageChange = async (stageId) => {
    if (!stageId || stageId === currentStageId) return;

    const nextStage = getPipelineStageById(pipelineType, stageId);

    setLocalStudent((prev) => ({
      ...(prev || workingStudent),
      pipeline_stage: stageId,
      stage: stageId,
      appointment_stage: isAppointment ? stageId : prev?.appointment_stage,
    }));

    setSavingStage(true);

    try {
      if (updateAppointmentStage && isAppointment) {
        await updateAppointmentStage(workingStudent.id, stageId);
      }

      await addTimelineEvent({
        studentId: workingStudent.id,
        studentType: type,
        actionType: "pipeline_stage_changed",
        title: "Pipeline Stage Updated",
        description: `${fullName} moved in the CRM pipeline.`,
        oldValue: currentStage?.label || currentStageId,
        newValue: nextStage?.label || stageId,
        adminProfile,
        metadata: {
          old_stage_id: currentStageId,
          new_stage_id: stageId,
        },
      });
    } finally {
      setSavingStage(false);
    }
  };

  const handleDelete = async () => {
    if (!safePermissions.canDelete) return;

    const confirmed = window.confirm(
      `Delete ${fullName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    if (isAppointment && deleteAppointment) {
      await deleteAppointment(workingStudent.id);
      onClose();
      return;
    }

    if (isInquiry && deleteInquiry) {
      await deleteInquiry(workingStudent.id);
      onClose();
    }
  };

  const infoRows = [
    ["Full Name", fullName],
    ["Email", email],
    ["Phone", phone],
    ["Country", country],
    ["Field / Program", field],
    ["Created", createdAt],
  ];

  const appointmentRows = [
    ["Appointment Date", appointmentDate],
    ["Appointment Time", appointmentTime],
    ["Consultation Type", consultationType],
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className={`max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] text-white shadow-[0_25px_100px_rgba(0,0,0,0.65)] ${cardClass}`}
        >
          <div className="relative border-b border-white/10 bg-white/[0.035] p-5 sm:p-6">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                    {isAppointment ? "Appointment" : "Inquiry"}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getPriorityStyle(
                      priority
                    )}`}
                  >
                    {priority} priority
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <h2 className="truncate text-2xl font-bold text-white sm:text-3xl">
                  {fullName}
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-white/50">
                  {country} • {field}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {safePermissions.canDelete ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:border-red-400/50 hover:bg-red-500/15"
                  >
                    Delete
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white/70 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          <div className="grid max-h-[calc(92vh-132px)] overflow-y-auto lg:grid-cols-[280px_1fr]">
            <aside className="border-b border-white/10 bg-black/20 p-4 lg:border-b-0 lg:border-r">
              <div className="space-y-2">
                {sidebarItems.map(([id, label, description]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActivePanel(id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      activePanel === id
                        ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]"
                        : "border-white/10 bg-white/[0.025] text-white/60 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="mt-1 block text-xs opacity-60">
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                  Pipeline Progress
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                    style={{ width: `${pipelineProgress || 0}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-white/55">
                  {pipelineProgress || 0}% • {currentStage?.label || "Stage"}
                </p>
              </div>
            </aside>

            <main className="space-y-5 p-4 sm:p-6">
              {activePanel === "overview" ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {infoRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                          {label}
                        </p>

                        <p className="mt-2 break-words text-sm font-medium text-white/75">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {isAppointment ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {appointmentRows.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]/70">
                            {label}
                          </p>

                          <p className="mt-2 break-words text-sm font-medium text-white/80">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
                    <h3 className="text-lg font-semibold text-white">
                      Notes / Message
                    </h3>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">
                      {notes}
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          Priority
                        </h3>

                        {savingPriority ? (
                          <span className="text-xs text-white/35">
                            Saving...
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {priorityOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            disabled={
                              !safePermissions.canUpdatePriority ||
                              savingPriority
                            }
                            onClick={() => handlePriorityChange(item)}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              priority === item
                                ? getPriorityStyle(item)
                                : "border-white/10 bg-white/[0.03] text-white/45 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          Status
                        </h3>

                        {savingStatus ? (
                          <span className="text-xs text-white/35">
                            Saving...
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            disabled={
                              !safePermissions.canUpdateStatus || savingStatus
                            }
                            onClick={() => handleStatusChange(item)}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              status === item
                                ? getStatusStyle(item)
                                : "border-white/10 bg-white/[0.03] text-white/45 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activePanel === "ai" ? (
                <AICounselorAssistant
                  student={workingStudent}
                  studentType={type}
                  adminProfile={adminProfile}
                />
              ) : null}

              {activePanel === "pipeline" ? (
                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        CRM Pipeline
                      </h3>

                      <p className="text-sm text-white/45">
                        Track this student through the consultancy workflow.
                      </p>
                    </div>

                    {savingStage ? (
                      <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
                        Saving stage...
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {stages.map((stage, index) => {
                      const isActive = stage.id === currentStageId;
                      const currentIndex = stages.findIndex(
                        (item) => item.id === currentStageId
                      );
                      const isPassed = index < Math.max(currentIndex, 0);

                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => handleStageChange(stage.id)}
                          disabled={savingStage}
                          className={`group w-full rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-[#D4AF37]/40 bg-[#D4AF37]/10"
                              : isPassed
                              ? "border-emerald-400/20 bg-emerald-500/5"
                              : "border-white/10 bg-white/[0.03] hover:border-[#D4AF37]/25 hover:bg-white/[0.045]"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                                isActive
                                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]"
                                  : isPassed
                                  ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                                  : "border-white/10 bg-black/20 text-white/35"
                              }`}
                            >
                              {index + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white">
                                {stage.label || stage.title || stage.id}
                              </p>

                              <p className="mt-1 text-sm text-white/45">
                                {stage.description ||
                                  "Pipeline workflow stage"}
                              </p>
                            </div>

                            {isActive ? (
                              <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                                Current
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {activePanel === "assignment" ? (
                <LeadAssignmentPanel
                  student={workingStudent}
                  studentType={type}
                  adminProfile={adminProfile}
                  permissions={safePermissions}
                />
              ) : null}

              {activePanel === "timeline" ? (
                <CrmTimelinePanel
                  studentId={workingStudent.id}
                  studentType={type}
                  adminProfile={adminProfile}
                />
              ) : null}

              {activePanel === "followups" ? (
                <FollowUpReminderPanel
                  studentId={workingStudent.id}
                  studentType={type}
                  adminProfile={adminProfile}
                />
              ) : null}

              {activePanel === "ai" ? (
  <AICounselorAssistant
    student={workingStudent}
    studentType={type}
    adminProfile={adminProfile}
  />
) : null}
            </main>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StudentDetailModal;