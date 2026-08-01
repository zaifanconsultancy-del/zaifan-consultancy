// StudentDetailModal PARTNER OS EXTREME V4 — Compact Command Strip
// Responsibilities intentionally retained here:
// - source-record identity and modal lifecycle
// - Student 360 derived context / readiness
// - responsive shell + panel orchestration
// - delete confirmation
//
// Delegated domains:
// - data loading: useStudentOsData
// - portal logic: useStudentPortalAccount
// - support actions: useStudentSupportActions
// - priority/status/stage mutations: useStudentRecordActions
// - navigation: StudentWorkspaceNavigation
// - overview: StudentCaseOverviewPanel
// - portal UI: StudentPortalAccessPanel
// - case/service/operations: StudentCasePanels
// - analytics/AI: StudentIntelligencePanels


import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Building2,
  CircleAlert,
  ClipboardCheck,
  FolderOpen,
  LayoutDashboard,
  LifeBuoy,
  LoaderCircle,
  LockKeyhole,
  Menu,
  RefreshCw,
  ShieldCheck,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { addTimelineEvent } from "../../../../lib/crmTimeline";
import useStudentPortalAccount from "../../../../hooks/useStudentPortalAccount";
import useStudentSupportActions from "../../../../hooks/useStudentSupportActions";
import useStudentRecordActions from "../../../../hooks/useStudentRecordActions";
import useStudentOsData from "../../../../hooks/useStudentOsData";
import StudentWorkspaceNavigation from "./StudentWorkspaceNavigation";
import StudentCasePanels from "./StudentCasePanels";
import StudentCaseOverviewPanel from "./StudentCaseOverviewPanel";
import StudentPortalAccessPanel from "./StudentPortalAccessPanel";
import StudentIntelligencePanels from "./StudentIntelligencePanels";
import StudentNotificationComposer from "./StudentNotificationComposer";
import {
  filterStudentWorkspaceGroups,
  getStudentWorkspaceDefinition,
} from "./studentWorkspaceConfig";

import {
  getPipelineStages,
  getPipelineStageById,
  getPipelineProgress,
} from "../../../../data/crmPipelineConfig";

const PRIORITY_OPTIONS = ["vip", "high", "medium", "low"];

function runWithTimeout(promise, label = "Request", timeoutMs = 10000) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Please try again.`));
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    if (timeoutId) window.clearTimeout(timeoutId);
  });
}

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
  updateInquiryStage = null,
  toggleInquiryStatus = null,
  deleteInquiry = null,
  deleteAppointment = null,
}) {
  const [activePanel, setActivePanel] = useState(
    student?.__preferredPanel || "overview"
  );

  const shouldReduceMotion = useReducedMotion();
  const [panelSearch, setPanelSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [localStudent, setLocalStudent] = useState(student);

  const studentIdentityRef = useRef("");
  // Hard remount key: ONLY change this when switching to another student
  // or when an explicit hard panel reset is requested. Normal background
  // Student OS synchronization must never touch it.
  const [panelMountKey, setPanelMountKey] = useState(0);

  const workingStudent = localStudent || student;

  const studentId = workingStudent?.id;

  const studentEmail = workingStudent?.email || student?.email || "";

  const studentType = normalize(
    workingStudent?.student_type ||
      workingStudent?.__leadType ||
      workingStudent?.type ||
      type ||
      "inquiry"
  );

  const personId = String(
    workingStudent?.person_id || student?.person_id || ""
  ).trim();

  const masterIdentityLabel = personId
    ? `Person ${personId.length > 14 ? `${personId.slice(0, 6)}…${personId.slice(-5)}` : personId}`
    : "Legacy source identity";

  // Keep source identity for record-specific status/stage actions.
  // person_id is used separately to unify Student 360 data and portal access.
  const studentIdentity = `${String(studentId || "")}:${studentType}`;

  const safePermissions = useMemo(
    () => ({
      canDelete: false,
      canClearAll: false,
      canExport: false,
      canManageAdmins: false,
      canUpdateStatus: true,
      canUpdatePriority: true,
      canConfirmAppointments: true,
      ...permissions,
    }),
    [permissions]
  );

  const getStudentIdVariants = useCallback(() => {
    if (!studentId) return [];

    const variants = [studentId, String(studentId)];
    const numericStudentId = Number(studentId);

    if (Number.isFinite(numericStudentId)) {
      variants.push(numericStudentId);
    }

    return [
      ...new Set(
        variants.filter(
          (value) => value !== null && value !== undefined && value !== ""
        )
      ),
    ];
  }, [studentId]);

  const getStudentTypeVariants = useCallback(() => {
    return [
      studentType,
      normalize(type),
      normalize(workingStudent?.student_type),
      normalize(workingStudent?.type),
      normalize(workingStudent?.__leadType),
    ].filter(Boolean);
  }, [
    studentType,
    type,
    workingStudent?.student_type,
    workingStudent?.type,
    workingStudent?.__leadType,
  ]);

  const {
    osLoading,
    osError,
    osSourceHealth,
    studentDocuments,
    studentApplication,
    studentUniversities,
    studentTasks,
    studentCommunications,
    studentInvoices,
    studentPayments,
    studentReceipts,
    studentPaymentRequests,
    studentSupportRequests,
    setStudentSupportRequests,
    loadStudentOsData,
  } = useStudentOsData({
    studentIdentity,
    studentId,
    studentType,
    personId,
    workingStudent,
    getStudentIdVariants,
    getStudentTypeVariants,
  });


  useEffect(() => {
    if (!studentIdentity) return;

    if (studentIdentityRef.current === studentIdentity) return;

    studentIdentityRef.current = studentIdentity;

    setLocalStudent(student);
    setActivePanel(student?.__preferredPanel || "overview");
    setMobileNavOpen(false);


    setPanelMountKey((prev) => prev + 1);
  }, [studentIdentity]);

  useEffect(() => {
    loadStudentOsData();
  }, [loadStudentOsData]);

  const refreshCurrentPanel = async () => {
    if (osLoading) return;

    // Explicit/manual refresh: reload authoritative parent data first, then
    // remount the active panel once. Child save callbacks use loadStudentOsData
    // directly and therefore remain soft/no-blink.
    await loadStudentOsData();
    setPanelMountKey((prev) => prev + 1);
  };


  const executiveStudents =
    allLeads.length > 0
      ? allLeads
      : workingStudent
      ? [{ ...workingStudent, __leadType: type }]
      : [];

  const isAppointment = studentType === "appointment";
  const isInquiry = studentType === "inquiry";
  const pipelineType = isAppointment ? "appointment" : "inquiry";

  const stages = useMemo(() => getPipelineStages(pipelineType), [pipelineType]);

  const currentStageId =
    workingStudent?.pipeline_stage ||
    workingStudent?.stage ||
    workingStudent?.status_stage ||
    (isAppointment ? workingStudent?.appointment_stage : null) ||
    stages?.[0]?.id;

  const currentStage = useMemo(
    () => getPipelineStageById(pipelineType, currentStageId) || stages?.[0],
    [currentStageId, pipelineType, stages]
  );

  const pipelineProgress = useMemo(
    () => getPipelineProgress(pipelineType, currentStageId),
    [currentStageId, pipelineType]
  );

  const fullName =
    workingStudent?.full_name || workingStudent?.name || "Unknown Student";

  const priority = workingStudent?.priority || "medium";

  const status =
    workingStudent?.status ||
    (workingStudent?.completed ? "completed" : "pending");

  const {
    savingStage,
    savingPriority,
    savingStatus,
    handlePriorityChange,
    handleStatusChange,
    handleStageChange,
  } = useStudentRecordActions({
    workingStudent,
    setLocalStudent,
    studentType,
    pipelineType,
    currentStageId,
    currentStage,
    priority,
    status,
    isAppointment,
    isInquiry,
    fullName,
    adminProfile,
    permissions: safePermissions,
    updateInquiryPriority,
    updateAppointmentPriority,
    updateAppointmentStatus,
    updateAppointmentStage,
    updateInquiryStage,
    toggleInquiryStatus,
  });

  useEffect(() => {
    if (!student) return;

    const incomingType = normalize(
      student?.student_type ||
        student?.__leadType ||
        student?.type ||
        type ||
        "inquiry"
    );

    const incomingIdentity = `${String(student?.id || "")}:${incomingType}`;

    if (incomingIdentity !== studentIdentityRef.current) return;
    if (savingStage || savingPriority || savingStatus) return;

    setLocalStudent((prev) => ({
      ...(prev || {}),
      ...student,
    }));
  }, [
    student,
    type,
    savingStage,
    savingPriority,
    savingStatus,
  ]);

  if (!workingStudent) return null;

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

  const priorityOptions = PRIORITY_OPTIONS;

  const statusOptions = useMemo(
    () =>
      isAppointment
        ? ["pending", "confirmed", "completed", "cancelled"]
        : ["pending", "contacted", "completed"],
    [isAppointment]
  );

  const filteredSidebarGroups = useMemo(
    () => filterStudentWorkspaceGroups(panelSearch),
    [panelSearch]
  );



  const getPriorityStyle = (value) => {
    const styles = {
      vip: "border-orange-300/40 bg-orange-500/15 text-orange-600",
      high: "border-red-400/30 bg-red-500/10 text-red-700",
      medium: "border-blue-400/30 bg-blue-500/10 text-blue-700",
      low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700",
    };

    return styles[value] || styles.medium;
  };

  const getStatusStyle = (value) => {
    const styles = {
      pending: "border-yellow-400/30 bg-yellow-500/10 text-amber-700",
      contacted: "border-blue-400/30 bg-blue-500/10 text-blue-700",
      confirmed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700",
      completed: "border-orange-300/35 bg-orange-500/10 text-orange-600",
      cancelled: "border-red-400/30 bg-red-500/10 text-red-700",
    };

    return styles[value] || styles.pending;
  };

  const fireSupportTimelineEvent = async ({
    actionType,
    title,
    description,
    oldValue = null,
    newValue = null,
    request,
    metadata = {},
  }) => {
    try {
      await runWithTimeout(
        addTimelineEvent({
          studentId,
          studentType,
          actionType,
          title,
          description,
          oldValue,
          newValue,
          adminProfile,
          metadata: {
            support_request_id: request?.id || null,
            category: request?.category || request?.request_type || null,
            ...metadata,
          },
        }),
        "Support timeline event",
        7000
      );
    } catch (timelineError) {
      console.warn("Support timeline event skipped:", timelineError?.message || timelineError);
    }
  };

  const {
    portalAccount,
    portalAccountLoading,
    portalAccountSaving,
    portalAccountStatus,
    portalAccountForm,
    setPortalAccountForm,
    generateSecurePortalPassword,
    loadPortalAccount,
    handlePortalAccountAction,
  } = useStudentPortalAccount({
    studentIdentity,
    studentId,
    studentType,
    personId,
    studentEmail,
    student,
    workingStudent,
    adminProfile,
    runWithTimeout,
    fireTimelineEvent: fireSupportTimelineEvent,
  });

  const {
    supportResponseDrafts,
    savingSupportResponseId,
    supportActionStatus,
    openSupportRequests,
    handleSupportResponseChange,
    handleSupportResponseSubmit,
    handleSupportStatusChange,
  } = useStudentSupportActions({
    studentIdentity,
    studentId,
    studentType,
    adminProfile,
    studentSupportRequests,
    setStudentSupportRequests,
    loadStudentOsData,
    runWithTimeout,
    fireTimelineEvent: fireSupportTimelineEvent,
  });


  const handleDelete = async () => {
    if (!safePermissions.canDelete) return;

    const confirmed = window.confirm(
      `Delete ${fullName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      if (isAppointment && typeof deleteAppointment === "function") {
        await deleteAppointment(workingStudent.id);
        onClose();
        return;
      }

      if (isInquiry && typeof deleteInquiry === "function") {
        await deleteInquiry(workingStudent.id);
        onClose();
        return;
      }

      throw new Error(
        `${isAppointment ? "Appointment" : "Inquiry"} delete action is not connected.`
      );
    } catch (error) {
      console.error("Student delete failed:", error);
      alert(error.message || "Student delete failed.");
    }
  };

  const completedTasks = useMemo(
    () =>
      studentTasks.filter((task) =>
        ["completed", "done"].includes(String(task.status || "").toLowerCase())
      ).length,
    [studentTasks]
  );

  const verifiedDocuments = useMemo(
    () =>
      studentDocuments.filter((document) =>
        ["verified", "approved"].includes(
          String(
            document.status || document.verification_status || ""
          ).toLowerCase()
        )
      ).length,
    [studentDocuments]
  );

  const readinessSignals = [
    Boolean(email && email !== "No email added"),
    Boolean(phone && phone !== "No phone added"),
    Boolean(country && country !== "Not selected"),
    Boolean(field && field !== "Not selected"),
    studentDocuments.length > 0,
    Boolean(studentApplication),
    studentUniversities.length > 0,
  ];

  const profileReadiness = Math.round(
    (readinessSignals.filter(Boolean).length / readinessSignals.length) * 100
  );

  const documentStatusSummary = useMemo(() => {
    const summary = {
      verified: 0,
      pending: 0,
      rejected: 0,
      expired: 0,
      attention: 0,
    };

    studentDocuments.forEach((document) => {
      const statusValue = normalize(
        document?.verification_status ||
          document?.status ||
          document?.document_status ||
          "pending"
      );

      if (["verified", "approved", "accepted", "complete", "completed"].includes(statusValue)) {
        summary.verified += 1;
      } else if (["rejected", "declined", "invalid"].includes(statusValue)) {
        summary.rejected += 1;
      } else if (["expired", "outdated"].includes(statusValue)) {
        summary.expired += 1;
      } else {
        summary.pending += 1;
      }

      if (
        ["rejected", "declined", "invalid", "expired", "outdated", "missing", "required"].includes(
          statusValue
        )
      ) {
        summary.attention += 1;
      }
    });

    return summary;
  }, [studentDocuments]);


  const documentHealthScore = useMemo(() => {
    if (!studentDocuments.length) return 0;

    const positive =
      documentStatusSummary.verified * 1 +
      documentStatusSummary.pending * 0.45;

    return Math.max(
      0,
      Math.min(
        100,
        Math.round((positive / Math.max(studentDocuments.length, 1)) * 100)
      )
    );
  }, [documentStatusSummary, studentDocuments.length]);

  const osHealthSummary = useMemo(() => {
    const entries = Object.entries(osSourceHealth);
    const ready = entries.filter(([, health]) => health === "ready").length;
    const failed = entries.filter(([, health]) => health !== "ready").length;

    return {
      total: entries.length,
      ready,
      failed,
      allReady: entries.length > 0 && failed === 0,
    };
  }, [osSourceHealth]);

  const activePanelDefinition = useMemo(
    () => getStudentWorkspaceDefinition(activePanel),
    [activePanel]
  );


  const ActivePanelIcon = activePanelDefinition.icon || LayoutDashboard;


  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/65 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.99 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          className={`zaifan-student-os-v24 flex h-[97dvh] max-h-[97dvh] w-full max-w-[1680px] min-w-0 flex-col overflow-hidden overscroll-contain touch-pan-y rounded-[1.45rem] border-[4px] border-[#123865] bg-[#FFF8EF] text-[#10233F] shadow-[0_40px_150px_rgba(15,23,42,0.48)] sm:rounded-[1.9rem] ${cardClass}`}
        >
          <div className="relative shrink-0 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-3 py-2.5 text-white sm:px-4">
            <div className="absolute inset-x-8 top-0 h-[3px] rounded-b-full bg-[#FF5A0A]" />

            <div className="flex min-w-0 flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-white/25 bg-white/[0.08] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.14em] text-white sm:text-[8px]">
                    {isAppointment ? "Appointment" : "Inquiry"}
                  </span>

                  <span className={`rounded-full border px-2 py-0.5 text-[7px] font-black capitalize sm:text-[8px] ${getPriorityStyle(priority)}`}>
                    {priority}
                  </span>

                  <span className={`rounded-full border px-2 py-0.5 text-[7px] font-black capitalize sm:text-[8px] ${getStatusStyle(status)}`}>
                    {status}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] sm:text-[8px] ${
                      osLoading
                        ? "border-blue-200/50 bg-blue-400/10 text-blue-100"
                        : osHealthSummary.failed > 0
                          ? "border-red-200/50 bg-red-400/10 text-red-100"
                          : "border-emerald-200/50 bg-emerald-400/10 text-emerald-100"
                    }`}
                  >
                    {osLoading ? (
                      <LoaderCircle size={9} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={9} />
                    )}
                    {osLoading
                      ? "Syncing"
                      : osHealthSummary.total
                        ? `OS ${osHealthSummary.ready}/${osHealthSummary.total}`
                        : "OS ready"}
                  </span>
                </div>

                <div className="mt-1.5 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                  <h2 className="min-w-0 break-words text-xl font-black leading-none tracking-[-0.035em] text-white sm:text-2xl">
                    {fullName}
                  </h2>

                  <span className="hidden h-4 w-px bg-white/20 sm:block" />

                  <p className="min-w-0 truncate text-[11px] font-semibold text-slate-200 sm:text-xs">
                    {country}
                    <span className="px-1.5 text-orange-200">•</span>
                    {field}
                  </p>

                  <span className="hidden h-4 w-px bg-white/20 lg:block" />

                  <div className="inline-flex min-w-0 w-fit items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1">
                    <ActivePanelIcon size={11} className="shrink-0 text-orange-200" />
                    <span className="max-w-[190px] truncate text-[8px] font-black uppercase tracking-[0.09em] text-white/65">
                      Workspace
                    </span>
                    <span className="max-w-[190px] truncate text-[10px] font-black text-white">
                      {activePanelDefinition.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:justify-end">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/[0.07] px-2.5 text-[10px] font-black text-white transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 lg:hidden"
                >
                  <Menu size={14} />
                  Modules
                </button>

                <div className="[&>div>button]:h-9 [&>div>button]:min-h-0 [&>div>button]:rounded-lg [&>div>button]:border [&>div>button]:border-white/25 [&>div>button]:bg-transparent [&>div>button]:px-3 [&>div>button]:text-[10px] [&>div>button]:shadow-none [&>div>button]:hover:bg-white/10">
                  <StudentNotificationComposer
                    student={workingStudent}
                    context={activePanel}
                    buttonLabel="Notify Student"
                    compact
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setActivePanel("ai-workspace")}
                  aria-current={activePanel === "ai-workspace" ? "page" : undefined}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-black shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200/30 ${
                    activePanel === "ai-workspace"
                      ? "border-white bg-white text-[#123865]"
                      : "border-[#FF5A0A] bg-[#FF5A0A] text-white hover:bg-orange-600"
                  }`}
                >
                  <Bot size={14} />
                  <span className="hidden sm:inline">
                    {activePanel === "ai-workspace" ? "GPT Open" : "GPT Workspace"}
                  </span>
                  <span className="sm:hidden">GPT</span>
                </button>

                <span className="mx-0.5 hidden h-6 w-px bg-white/15 xl:block" />

                <button
                  type="button"
                  onClick={refreshCurrentPanel}
                  disabled={osLoading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Refresh current student workspace"
                  title="Refresh current workspace"
                >
                  <RefreshCw size={14} className={osLoading ? "animate-spin" : ""} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                  aria-label="Close student workspace"
                  title="Close"
                >
                  <X size={15} />
                </button>

                {safePermissions.canDelete ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200/55 bg-red-400/10 text-red-100 transition hover:-translate-y-0.5 hover:bg-red-400/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200/20"
                    aria-label="Delete student record"
                    title="Delete student record"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            {osError ? (
              <div className="mt-2 flex min-w-0 items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold leading-4 text-amber-900">
                <CircleAlert size={13} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <span className="font-black">Partial sync issue.</span>{" "}
                  {osError}
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-b-2 border-[#123865] bg-[#FFF8EF] px-3 py-1.5 sm:px-4">
            <div className="overflow-hidden rounded-xl border-2 border-[#C9D7E6] bg-white shadow-[0_4px_12px_rgba(18,56,101,0.04)]">
              <div className="grid min-w-0 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
                <Student360Metric label="Profile readiness" value={`${profileReadiness}%`} icon={BadgeCheck} tone="orange" />
                <Student360Metric label="Pipeline" value={`${pipelineProgress || 0}%`} icon={Target} tone="blue" />
                <Student360Metric label="Documents" value={`${verifiedDocuments}/${studentDocuments.length}`} icon={FolderOpen} tone="emerald" />
                <Student360Metric label="Tasks done" value={`${completedTasks}/${studentTasks.length}`} icon={ClipboardCheck} tone="blue" />
                <Student360Metric label="Universities" value={studentUniversities.length} icon={Building2} tone="blue" />
                <Student360Metric label="Open support" value={openSupportRequests} icon={LifeBuoy} tone="red" />
                <Student360Metric label="Portal" value={portalAccount?.is_active ? "Active" : portalAccount ? "Paused" : "Not set"} icon={LockKeyhole} tone={portalAccount?.is_active ? "emerald" : "slate"} />
              </div>
            </div>
          </div>

          <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden bg-[#FFF8EF] lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
            <div
              className={`min-h-0 min-w-0 border-r-[3px] border-[#123865] bg-[#123865] ${mobileNavOpen ? "block" : "hidden"} lg:block`}
            >
              <StudentWorkspaceNavigation
                groups={filteredSidebarGroups}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                panelSearch={panelSearch}
                setPanelSearch={setPanelSearch}
                setMobileNavOpen={setMobileNavOpen}
                pipelineProgress={pipelineProgress}
              />
            </div>

            <main className="zaifan-student-main min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y bg-[#FFF8EF] p-2 pb-16 [-webkit-overflow-scrolling:touch] sm:p-3 sm:pb-20 xl:p-4 xl:pb-24">
              <div
                className={`zaifan-panel-surface zaifan-admin-contrast-surface min-w-0 rounded-[1.35rem] border-2 border-[#C9D7E6] bg-[#FFFDF8] p-1.5 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:p-2 ${
                  ["ai-workspace", "gpt-intelligence", "ai", "executive-ai"].includes(activePanel)
                    ? "zaifan-ai-panel-surface"
                    : ""
                }`}
              >
              <Suspense fallback={<StudentPanelLoader />}>
              {activePanel === "overview" ? (
              <StudentCaseOverviewPanel
                workingStudent={workingStudent}
                studentType={studentType}
                studentApplication={studentApplication}
                studentDocuments={studentDocuments}
                studentUniversities={studentUniversities}
                studentTasks={studentTasks}
                studentCommunications={studentCommunications}
                studentInvoices={studentInvoices}
                studentPayments={studentPayments}
                studentReceipts={studentReceipts}
                portalAccount={portalAccount}
                documentStatusSummary={documentStatusSummary}
                documentHealthScore={documentHealthScore}
                verifiedDocuments={verifiedDocuments}
                completedTasks={completedTasks}
                openSupportRequests={openSupportRequests}
                pipelineProgress={pipelineProgress}
                currentStage={currentStage}
                currentStageId={currentStageId}
                stages={stages}
                priority={priority}
                status={status}
                priorityOptions={priorityOptions}
                statusOptions={statusOptions}
                savingPriority={savingPriority}
                savingStatus={savingStatus}
                savingStage={savingStage}
                safePermissions={safePermissions}
                isAppointment={isAppointment}
                fullName={fullName}
                email={email}
                notes={notes}
                profileReadiness={profileReadiness}
                getPriorityStyle={getPriorityStyle}
                getStatusStyle={getStatusStyle}
                handlePriorityChange={handlePriorityChange}
                handleStatusChange={handleStatusChange}
                handleStageChange={handleStageChange}
                setActivePanel={setActivePanel}
              />
              ) : null}

              <StudentIntelligencePanels
                activePanel={activePanel}
                workingStudent={workingStudent}
                studentType={studentType}
                adminProfile={adminProfile}
                allLeads={allLeads}
                setActivePanel={setActivePanel}
                studentApplication={studentApplication}
                studentDocuments={studentDocuments}
                studentUniversities={studentUniversities}
                studentTasks={studentTasks}
                studentCommunications={studentCommunications}
                executiveStudents={executiveStudents}
              />

              {activePanel === "portal-account" ? (
              <StudentPortalAccessPanel
                fullName={fullName}
                studentId={studentId}
                studentType={studentType}
                masterIdentityLabel={masterIdentityLabel}
                portalAccount={portalAccount}
                portalAccountForm={portalAccountForm}
                setPortalAccountForm={setPortalAccountForm}
                portalAccountLoading={portalAccountLoading}
                portalAccountSaving={portalAccountSaving}
                portalAccountStatus={portalAccountStatus}
                handlePortalAccountAction={handlePortalAccountAction}
                generateSecurePortalPassword={generateSecurePortalPassword}
                loadPortalAccount={loadPortalAccount}
              />
              ) : null}

              <StudentCasePanels
                activePanel={activePanel}
                studentId={studentId}
                studentType={studentType}
                sourceType={type}
                panelMountKey={panelMountKey}
                workingStudent={workingStudent}
                adminProfile={adminProfile}
                permissions={safePermissions}
                studentDocuments={studentDocuments}
                studentApplication={studentApplication}
                studentUniversities={studentUniversities}
                studentInvoices={studentInvoices}
                studentPayments={studentPayments}
                studentReceipts={studentReceipts}
                studentPaymentRequests={studentPaymentRequests}
                studentSupportRequests={studentSupportRequests}
                studentCommunications={studentCommunications}
                studentTasks={studentTasks}
                loadStudentOsData={loadStudentOsData}
                setActivePanel={setActivePanel}
                stages={stages}
                currentStageId={currentStageId}
                savingStage={savingStage}
                isAppointment={isAppointment}
                updateAppointmentStage={updateAppointmentStage}
                updateInquiryStage={updateInquiryStage}
                handleStageChange={handleStageChange}
              />

              

              </Suspense>
              </div>
            </main>
          </div>
          <style>{`
            .zaifan-student-nav {
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 90, 10, 0.34) transparent;
            }
            .zaifan-student-nav::-webkit-scrollbar {
              width: 6px;
            }
            .zaifan-student-nav::-webkit-scrollbar-thumb,
            .zaifan-student-main::-webkit-scrollbar-thumb {
              background: rgba(255, 90, 10, 0.38);
              border-radius: 999px;
            }
            .zaifan-student-main {
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 90, 10, 0.38) transparent;
            }
            .zaifan-student-main::-webkit-scrollbar {
              width: 8px;
            }

            .zaifan-panel-surface {
              min-height: 100%;
              width: 100%;
            }

            .zaifan-ai-panel-surface {
              --zaifan-navy: #123865;
              --zaifan-navy-soft: #315b88;
              --zaifan-orange: #ff5a0a;
              --zaifan-cream: #fff8ef;
              color: var(--zaifan-navy);
            }

            /*
             * ZAIFAN ADMIN OS — SAFE CONTRAST BRIDGE
             *
             * IMPORTANT:
             * Do NOT globally reinterpret Tailwind text utilities here.
             * Component-level text-white / text-slate-* classes must remain the
             * source of truth so navy/orange surfaces keep their intended contrast.
             *
             * The old bridge forced text-white -> dark slate and forced all
             * headings dark, which broke AIWorkspacePanel, AICounselorAssistant,
             * GPTCopilotPanel and other dark operational surfaces.
             */

            .zaifan-ai-panel-surface {
              --zaifan-navy: #123865;
              --zaifan-navy-soft: #315b88;
              --zaifan-orange: #ff5a0a;
              --zaifan-cream: #fff8ef;
            }

            .zaifan-admin-contrast-surface {
              --zaifan-admin-navy: #123865;
              --zaifan-admin-navy-deep: #10233f;
              --zaifan-admin-orange: #ff5a0a;
              --zaifan-admin-cream: #fff8ef;
              --zaifan-admin-card: #fffdf8;
              --zaifan-admin-border: #cbd5e1;
            }

            /*
             * Keep typography crisp without changing its intended foreground
             * color. Explicit component utilities now control contrast.
             */
            .zaifan-ai-panel-surface *,
            .zaifan-admin-contrast-surface * {
              text-shadow: none;
            }

            /*
             * Form controls stay readable on the warm Student OS canvas.
             * These selectors are intentionally limited to actual form controls;
             * they do not recolor surrounding cards, headings, icons or badges.
             */
            .zaifan-admin-contrast-surface :is(input, select, textarea) {
              background: #ffffff;
              color: #10233f;
              border-color: #94a3b8;
              opacity: 1;
            }

            .zaifan-admin-contrast-surface :is(input, select, textarea)::placeholder {
              color: #94a3b8;
              opacity: 1;
            }

            .zaifan-admin-contrast-surface :is(input, select, textarea):focus {
              border-color: #ff5a0a;
              outline: none;
              box-shadow: 0 0 0 3px rgba(255, 90, 10, 0.12);
            }

            .zaifan-admin-contrast-surface select option {
              background: #ffffff;
              color: #10233f;
            }

            /*
             * Disabled state only. Do not globally override opacity utility
             * classes because many components use them deliberately for hierarchy.
             */
            .zaifan-admin-contrast-surface :is(button, input, select, textarea):disabled {
              opacity: 0.55;
            }

            /*
             * Tables remain readable while preserving explicit component colors.
             */
            .zaifan-admin-contrast-surface table {
              color: #10233f;
            }

            .zaifan-admin-contrast-surface th {
              background: #fff4e8;
              color: #0f2a55;
            }

            .zaifan-admin-contrast-surface td {
              background: #ffffff;
              color: #334155;
              border-color: #e2e8f0;
            }

            /* Scrollbars visible but refined */
            .zaifan-admin-contrast-surface * {
              scrollbar-color: rgba(255,90,10,0.45) transparent;
            }

            .zaifan-admin-contrast-surface *::-webkit-scrollbar-thumb {
              background: rgba(255,90,10,0.38);
              border-radius: 999px;
            }

            @media (max-width: 1023px) {
              .zaifan-student-nav {
                max-height: 34dvh;
              }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function Student360Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    orange: "text-orange-700",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
    slate: "text-slate-700",
  };

  return (
    <div
      className={`flex min-w-0 items-center gap-2 border-b border-r border-[#E1E8F0] px-2.5 py-2 transition hover:bg-[#FFF8EF] md:[&:nth-child(4n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(4n)]:border-r xl:[&:last-child]:border-r-0 ${tones[tone] || tones.slate}`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current/20 bg-[#FFF8EF]">
        <Icon size={11} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[6px] font-black uppercase leading-3 tracking-[0.08em] text-slate-500">
          {label}
        </p>
        <p className="truncate text-[10px] font-black leading-3 text-[#10233F]">
          {value}
        </p>
      </div>
    </div>
  );
}

function StudentPanelLoader() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.6rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-inner">
      <div className="text-center">
        <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#FF5A0A]" />
        <p className="mt-4 text-sm font-black text-slate-900">Opening student module</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Loading only this part of the student operating system.
        </p>
      </div>
    </div>
  );
}


export default StudentDetailModal;
