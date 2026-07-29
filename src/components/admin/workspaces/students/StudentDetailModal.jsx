// StudentDetailModal — Student 360 orchestration shell
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
          className={`zaifan-student-os-v24 flex h-[96dvh] max-h-[96dvh] w-full max-w-[1680px] flex-col overflow-hidden overscroll-contain touch-pan-y rounded-[1.45rem] border-[3px] border-[#F97316] bg-[#FFF8EF] text-[#152238] shadow-[0_36px_140px_rgba(15,23,42,0.42)] sm:rounded-[2rem] ${cardClass}`}
        >
          <div className="relative shrink-0 border-b-[3px] border-[#D7E1EB] bg-[#FFFDF8] px-4 py-3 sm:px-6 sm:py-4">
            <div className="absolute inset-x-8 top-0 h-[4px] rounded-b-full bg-[#F97316]" />

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border-2 border-[#F97316] bg-[#FFF4E8] px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-700 sm:text-[10px]">
                    {isAppointment ? "Appointment" : "Inquiry"}
                  </span>

                  <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black capitalize sm:text-[10px] ${getPriorityStyle(priority)}`}>
                    {priority} priority
                  </span>

                  <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black capitalize sm:text-[10px] ${getStatusStyle(status)}`}>
                    {status}
                  </span>

                  <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] sm:text-[10px] ${
                    osLoading
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : osHealthSummary.failed > 0
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}>
                    {osLoading ? <LoaderCircle size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
                    {osLoading
                      ? "Syncing Student OS"
                      : osHealthSummary.total
                        ? `Student OS ${osHealthSummary.ready}/${osHealthSummary.total}`
                        : "Student OS connected"}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-1 lg:flex-row lg:items-end lg:gap-4">
                  <h2 className="min-w-0 break-words text-2xl font-black leading-tight text-[#10233F] sm:text-[2rem]">
                    {fullName}
                  </h2>
                  <p className="pb-0.5 text-sm font-semibold text-slate-500">
                    {country} <span className="px-1 text-orange-400">•</span> {field}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#F5F9FF] px-3 text-sm font-black text-[#123865] 2xl:inline-flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#123865] text-white">
                    <ActivePanelIcon size={14} />
                  </span>
                  <span className="max-w-[170px] truncate">{activePanelDefinition.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3.5 text-sm font-black text-[#123865] transition hover:border-orange-300 hover:bg-[#FFF4E8] lg:hidden"
                >
                  <Menu size={16} />
                  Modules
                </button>

                <StudentNotificationComposer
                  student={workingStudent}
                  context={activePanel}
                  buttonLabel="Notify Student"
                />

                <button
                  type="button"
                  onClick={() => setActivePanel("ai-workspace")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-[#D94F08] bg-[#E96512] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#D94F08]"
                >
                  <Bot size={16} />
                  GPT Workspace
                </button>

                <button
                  type="button"
                  onClick={refreshCurrentPanel}
                  disabled={osLoading}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#123865] transition duration-300 hover:border-[#F97316] hover:bg-[#FFF4E8] hover:text-orange-700 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={osLoading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                {safePermissions.canDelete ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] px-4 text-sm font-black text-red-700 transition duration-300 hover:bg-red-100"
                  >
                    Delete
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#123865] transition duration-300 hover:border-[#123865] hover:bg-[#F2F7FF]"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {osError ? (
              <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900">
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="min-w-0">
                  <span className="font-black">Partial sync issue.</span>{" "}
                  {osError}
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-b-[3px] border-[#D7E1EB] bg-[#FFF8EF] px-4 py-2.5 sm:px-6">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
              <Student360Metric label="Profile readiness" value={`${profileReadiness}%`} icon={BadgeCheck} tone="orange" />
              <Student360Metric label="Pipeline" value={`${pipelineProgress || 0}%`} icon={Target} tone="blue" />
              <Student360Metric label="Documents" value={`${verifiedDocuments}/${studentDocuments.length}`} icon={FolderOpen} tone="emerald" />
              <Student360Metric label="Tasks done" value={`${completedTasks}/${studentTasks.length}`} icon={ClipboardCheck} tone="blue" />
              <Student360Metric label="Universities" value={studentUniversities.length} icon={Building2} tone="blue" />
              <Student360Metric label="Open support" value={openSupportRequests} icon={LifeBuoy} tone="red" />
              <Student360Metric label="Portal" value={portalAccount?.is_active ? "Active" : portalAccount ? "Paused" : "Not set"} icon={LockKeyhole} tone={portalAccount?.is_active ? "emerald" : "slate"} />
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[292px_minmax(0,1fr)]">
            <div
              className={`min-h-0 ${mobileNavOpen ? "block" : "hidden"} lg:block`}
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

            <main className="zaifan-student-main min-h-0 min-w-0 overscroll-contain overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] bg-[#fffdfa] p-3 pb-20 sm:p-5 sm:pb-24 xl:p-6 xl:pb-28">
              <div
                className={`zaifan-panel-surface zaifan-admin-contrast-surface ${
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
              scrollbar-color: rgba(249, 115, 22, 0.24) transparent;
            }
            .zaifan-student-nav::-webkit-scrollbar {
              width: 6px;
            }
            .zaifan-student-nav::-webkit-scrollbar-thumb,
            .zaifan-student-main::-webkit-scrollbar-thumb {
              background: rgba(249, 115, 22, 0.3);
              border-radius: 999px;
            }
            .zaifan-student-main {
              scrollbar-width: thin;
              scrollbar-color: rgba(249, 115, 22, 0.3) transparent;
            }
            .zaifan-student-main::-webkit-scrollbar {
              width: 8px;
            }

            .zaifan-panel-surface {
              min-height: 100%;
              width: 100%;
            }

            .zaifan-ai-panel-surface {
              --zaifan-navy: #152238;
              --zaifan-navy-soft: #24324a;
              --zaifan-orange: #f97316;
              --zaifan-cream: #fff8ee;
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
              --zaifan-navy: #152238;
              --zaifan-navy-soft: #24324a;
              --zaifan-orange: #f97316;
              --zaifan-cream: #fff8ee;
            }

            .zaifan-admin-contrast-surface {
              --zaifan-admin-navy: #0f2a55;
              --zaifan-admin-navy-deep: #0a1f44;
              --zaifan-admin-orange: #ff5a0a;
              --zaifan-admin-cream: #fff8ee;
              --zaifan-admin-card: #fffdf9;
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
              color: #152238;
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
              color: #152238;
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
              color: #152238;
            }

            .zaifan-admin-contrast-surface th {
              background: #fff3e4;
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
                max-height: 42dvh;
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
    orange: "border-[#F97316] bg-[#FFF4E8] text-orange-700",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    emerald: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    red: "border-[#FB7185] bg-[#FFF4F4] text-red-700",
    slate: "border-[#C9D7E6] bg-white text-slate-700",
  };

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border-2 px-3 py-2.5 shadow-[0_4px_12px_rgba(15,35,63,0.035)] ${tones[tone] || tones.slate}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white shadow-sm">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.1em] opacity-70">
          {label}
        </p>

        <p className="mt-0.5 break-words text-xs font-black leading-4 text-[#10233F]">
          {value}
        </p>
      </div>
    </div>
  );
}

function StudentPanelLoader() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8]">
      <div className="text-center">
        <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-900">Opening student module</p>
        <p className="mt-1 text-xs text-slate-400">
          Loading only this part of the student operating system.
        </p>
      </div>
    </div>
  );
}


export default StudentDetailModal;
