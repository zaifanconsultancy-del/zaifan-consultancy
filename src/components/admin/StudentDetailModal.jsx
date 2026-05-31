import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import LeadAssignmentPanel from "./LeadAssignmentPanel";
import CrmTimelinePanel from "./CrmTimelinePanel";
import FollowUpReminderPanel from "./FollowUpReminderPanel";
import AICounselorAssistant from "./AICounselorAssistant";
import AIWorkspacePanel from "./AIWorkspacePanel";
import { addTimelineEvent } from "../../lib/crmTimeline";
import GPTIntelligencePanel from "./GPTIntelligencePanel";
import StudentDocumentsPanel from "./StudentDocumentsPanel";
import StudentApplicationPanel from "./StudentApplicationPanel";
import VisaTrackerPanel from "./VisaTrackerPanel";
import UniversityManagementPanel from "./UniversityManagementPanel";
import CommunicationCenterPanel from "./CommunicationCenterPanel";
import ExecutiveAIDashboard from "./ExecutiveAIDashboard";
import TaskCenterPanel from "./TaskCenterPanel";
import CounselorQueuePanel from "./CounselorQueuePanel";
import SmartActionsPanel from "./SmartActionsPanel";
import StudentAnalyticsPanel from "./StudentAnalyticsPanel";

import {
  getPipelineStages,
  getPipelineStageById,
  getPipelineProgress,
} from "../../data/crmPipelineConfig";

function StudentDetailModal({
  student = null,
  type = "inquiry",
  allLeads = [],
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
  const [activePanel, setActivePanel] = useState(
    student?.__preferredPanel || "ai-workspace"
  );

  const [savingStage, setSavingStage] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [localStudent, setLocalStudent] = useState(student);

  const [osLoading, setOsLoading] = useState(false);
  const [osError, setOsError] = useState("");
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [studentApplication, setStudentApplication] = useState(null);
  const [studentUniversities, setStudentUniversities] = useState([]);
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentCommunications, setStudentCommunications] = useState([]);
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);

  useEffect(() => {
    setLocalStudent(student);
    setActivePanel(student?.__preferredPanel || "ai-workspace");

    setOsLoading(false);
    setOsError("");
    setStudentDocuments([]);
    setStudentApplication(null);
    setStudentUniversities([]);
    setStudentTasks([]);
    setStudentCommunications([]);
    setPanelRefreshKey((prev) => prev + 1);
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

  const studentId = workingStudent?.id;
  const studentType =
    workingStudent?.student_type || workingStudent?.type || type || "inquiry";

  const refreshCurrentPanel = () => {
  setOsLoading(true);
  setOsError("");

  setPanelRefreshKey((prev) => prev + 1);

  window.setTimeout(() => {
    setOsLoading(false);
  }, 700);
};



  const loadStudentOsData = () => {
    refreshCurrentPanel();
  };

  const executiveStudents =
    allLeads.length > 0
      ? allLeads
      : workingStudent
      ? [{ ...workingStudent, __leadType: type }]
      : [];

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

  const sidebarGroups = [
    {
      title: "AI Center",
      items: [
        ["ai-workspace", "Real GPT Workspace", "OpenAI counselor copilot", "🤖"],
        ["gpt-intelligence", "GPT Intelligence", "Stored counselor analysis", "🧠"],
        ["ai", "Quick GPT Actions", "Counselor generation tools", "✨"],
      ],
    },
    {
      title: "Student Hub",
      items: [
        ["overview", "Overview", "Student details and controls", "📋"],
        ["analytics", "Analytics", "Student journey intelligence", "📈"],
        ["documents", "Documents", "Student file management", "📁"],
        ["applications", "Applications", "University workflow", "🎓"],
        ["visa", "Visa Processing", "Visa workflow tracking", "🌍"],
        ["universities", "Universities", "Destination planning", "🏫"],
      ],
    },
    {
      title: "Operating System",
      items: [
        ["communication", "Communication", "Student outreach hub", "💬"],
        ["executive-ai", "Executive AI", "AI command dashboard", "📊"],
        ["operations", "Operations", "Task and action center", "⚡"],
      ],
    },
    {
      title: "CRM Core",
      items: [
        ["pipeline", "Pipeline", "Workflow stage tracking", "🧭"],
        ["assignment", "Assignment", "Owner and staff handling", "👥"],
        ["timeline", "Timeline", "CRM history and changes", "🕒"],
        ["followups", "Follow-ups", "Reminder and next actions", "🔔"],
      ],
    },
  ];

  const sidebarItems = sidebarGroups.flatMap((group) => group.items);

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
    } catch (error) {
      setLocalStudent((prev) => ({
        ...(prev || workingStudent),
        priority: oldPriority,
      }));
      alert(error.message || "Priority update failed.");
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
    } catch (error) {
      setLocalStudent((prev) => ({
        ...(prev || workingStudent),
        status: oldStatus,
        completed: oldStatus === "completed",
      }));
      alert(error.message || "Status update failed.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStageChange = async (stageId) => {
    if (!stageId || stageId === currentStageId) return;

    const nextStage = getPipelineStageById(pipelineType, stageId);
    const oldStageId = currentStageId;

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
    } catch (error) {
      setLocalStudent((prev) => ({
        ...(prev || workingStudent),
        pipeline_stage: oldStageId,
        stage: oldStageId,
        appointment_stage: isAppointment ? oldStageId : prev?.appointment_stage,
      }));
      alert(error.message || "Pipeline stage update failed.");
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
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 px-3 py-4 backdrop-blur-xl sm:px-4 sm:py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className={`max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080808] text-white shadow-[0_25px_100px_rgba(0,0,0,0.65)] sm:rounded-[2rem] ${cardClass}`}
        >
          <div className="relative border-b border-white/10 bg-white/[0.035] p-4 sm:p-6">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60" />

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37] sm:text-xs sm:tracking-[0.22em]">
                    {isAppointment ? "Appointment" : "Inquiry"}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold capitalize sm:text-xs ${getPriorityStyle(
                      priority
                    )}`}
                  >
                    {priority} priority
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold capitalize sm:text-xs ${getStatusStyle(
                      status
                    )}`}
                  >
                    {status}
                  </span>

                  {osLoading ? (
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold text-cyan-300">
                      Refreshing Panel...
                    </span>
                  ) : null}
                </div>

                <h2 className="break-words text-2xl font-bold text-white sm:text-3xl">
                  {fullName}
                </h2>

                <div className="mt-2 max-w-2xl">
                  <p className="break-words text-sm text-white/50">
                    {country} • {field}
                  </p>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                    AI Counselor Workspace Ready
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActivePanel("ai-workspace")}
                  className="rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768]"
                >
                  Open Real GPT
                </button>

                <button
                  type="button"
                  onClick={refreshCurrentPanel}
                  disabled={osLoading}
                  className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/45 disabled:opacity-50"
                >
                  Refresh Current Panel
                </button>

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

            {osError ? (
              <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-200">
                OS data warning: {osError}
              </div>
            ) : null}
          </div>

          <div className="grid max-h-[calc(94vh-132px)] overflow-y-auto lg:grid-cols-[300px_1fr]">
            <aside className="border-b border-white/10 bg-black/20 p-4 lg:border-b-0 lg:border-r lg:border-white/10">
              <div className="space-y-4">
                {sidebarGroups.map((group) => (
                  <div key={group.title}>
                    <div className="mb-2 flex items-center gap-3 px-1">
                      <div className="h-px flex-1 bg-white/10" />
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/30">
                        {group.title}
                      </p>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                      {group.items.map(([id, label, description, icon]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActivePanel(id)}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                            activePanel === id
                              ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]"
                              : "border-white/10 bg-white/[0.025] text-white/60 hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
                            <span>{icon}</span>
                            <span>{label}</span>
                          </span>
                          <span className="mt-1 hidden text-xs opacity-60 sm:block">
                            {description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
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

              <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
                  OS Snapshot
                </p>

                <MiniOsStat label="Docs" value={studentDocuments.length} />
                <MiniOsStat label="Applications" value={studentApplication ? 1 : 0} />
                <MiniOsStat label="Universities" value={studentUniversities.length} />
                <MiniOsStat label="Tasks" value={studentTasks.length} />
                <MiniOsStat label="Messages" value={studentCommunications.length} />

                <p className="pt-2 text-[11px] leading-5 text-white/35">
                  Snapshot sync is paused during stabilization. Each panel now
                  loads independently to prevent freezes.
                </p>
              </div>
            </aside>

            <main className="space-y-5 p-4 sm:p-6">
              {activePanel === "overview" ? (
                <div className="space-y-5">
                  <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                          Real GPT Counselor Desk
                        </p>
                        <h3 className="mt-2 text-xl font-black text-white">
                          Use OpenAI only when you need generated counselor output.
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/55">
                          Local CRM intelligence handles scores and pipeline signals.
                          Real GPT is available here for summaries, WhatsApp, email,
                          call scripts, visa risk, and follow-up plans.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePanel("ai-workspace")}
                        className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768]"
                      >
                        Launch Real GPT Workspace
                      </button>
                    </div>
                  </div>

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
                          <span className="text-xs text-white/35">Saving...</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {priorityOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            disabled={
                              !safePermissions.canUpdatePriority || savingPriority
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
                          <span className="text-xs text-white/35">Saving...</span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            disabled={!safePermissions.canUpdateStatus || savingStatus}
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

              {activePanel === "analytics" ? (
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
) : null}

              {activePanel === "ai-workspace" ? (
                <AIWorkspacePanel
                  student={workingStudent}
                  studentType={type}
                  adminProfile={adminProfile}
                />
              ) : null}

              {activePanel === "gpt-intelligence" ? (
                <GPTIntelligencePanel
                  student={workingStudent}
                  onOpenWorkspace={() => setActivePanel("ai-workspace")}
                />
              ) : null}

              {activePanel === "ai" ? (
                <AICounselorAssistant
                  student={workingStudent}
                  studentType={type}
                  adminProfile={adminProfile}
                />
              ) : null}

              {activePanel === "documents" ? (
                <StudentDocumentsPanel
                  key={`documents-${studentId}-${panelRefreshKey}`}
                  student={{
                    ...workingStudent,
                    documents: studentDocuments,
                  }}
                  sharedDocuments={studentDocuments}
                  onSharedDataChange={loadStudentOsData}
                />
              ) : null}

              {activePanel === "applications" ? (
                <StudentApplicationPanel
                  key={`applications-${studentId}-${panelRefreshKey}`}
                  student={{
                    ...workingStudent,
                    application: studentApplication,
                  }}
                  sharedApplication={studentApplication}
                  onSharedDataChange={loadStudentOsData}
                />
              ) : null}

              {activePanel === "visa" ? (
                <VisaTrackerPanel
                  key={`visa-${studentId}-${panelRefreshKey}`}
                  student={{
                    ...workingStudent,
                    application: studentApplication,
                    documents: studentDocuments,
                  }}
                  sharedApplication={studentApplication}
                  sharedDocuments={studentDocuments}
                  onSharedDataChange={loadStudentOsData}
                />
              ) : null}

              {activePanel === "universities" ? (
                <UniversityManagementPanel
                  key={`universities-${studentId}-${panelRefreshKey}`}
                  student={{
                    ...workingStudent,
                    universities: studentUniversities,
                  }}
                  sharedUniversities={studentUniversities}
                  onSharedDataChange={loadStudentOsData}
                />
              ) : null}

              {activePanel === "communication" ? (
                <CommunicationCenterPanel
                  key={`communication-${studentId}-${panelRefreshKey}`}
                  student={{
                    ...workingStudent,
                    communications: studentCommunications,
                  }}
                  sharedCommunications={studentCommunications}
                  onSharedDataChange={loadStudentOsData}
                />
              ) : null}

              {activePanel === "executive-ai" ? (
                <ExecutiveAIDashboard students={executiveStudents} />
              ) : null}

              {activePanel === "operations" ? (
                <div className="space-y-5">
                  <TaskCenterPanel
                    key={`tasks-${studentId}-${panelRefreshKey}`}
                    student={{
                      ...workingStudent,
                      documents: studentDocuments,
                      application: studentApplication,
                      tasks: studentTasks,
                    }}
                    sharedDocuments={studentDocuments}
                    sharedApplication={studentApplication}
                    sharedTasks={studentTasks}
                    onSharedDataChange={loadStudentOsData}
                  />

                  <CounselorQueuePanel
                    student={{
                      ...workingStudent,
                      documents: studentDocuments,
                      application: studentApplication,
                      tasks: studentTasks,
                    }}
                  />

                  <SmartActionsPanel
                    student={{
                      ...workingStudent,
                      documents: studentDocuments,
                      application: studentApplication,
                      tasks: studentTasks,
                    }}
                  />
                </div>
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
                                {stage.description || "Pipeline workflow stage"}
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
            </main>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MiniOsStat({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-xs text-white/45">{label}</span>
      <span className="text-xs font-black text-[#D4AF37]">{value}</span>
    </div>
  );
}

export default StudentDetailModal;