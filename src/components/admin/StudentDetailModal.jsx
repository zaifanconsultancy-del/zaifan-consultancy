// StudentDetailModal V17 — High Contrast Admin OS Edition
// Full replacement built from V14.
// Major upgrades:
// - fixes the Lucide Map / native JavaScript Map constructor collision
// - preserves existing Supabase, CRM timeline, portal, permissions and lazy panel architecture
// - rebuilds Document Vault into a deep Student Master File system
// - adds 13+ major document families and hundreds of predefined document spaces
// - adds document lifecycle governance, versioning, audit discipline and operational rules
// - keeps StudentDocumentsPanel as the connected live backend operations layer
// - upgrades Student 360 overview and navigation without shrinking the mature file

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Bot,
  BrainCircuit,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  CreditCard,
  Crown,
  FileText,
  Files,
  FileCheck2,
  FileClock,
  FileWarning,
  FileArchive,
  FileBadge,
  FileCog,
  FileKey,
  FileLock2,
  FilePlus2,
  FileSearch2,
  FileSignature,
  FileStack,
  FolderArchive,
  FolderCheck,
  FolderCog,
  FolderKanban,
  FolderKey,
  FolderLock,
  FolderOpen,
  FolderPlus,
  FolderSync,
  GraduationCap,
  History,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Map as MapIcon,
  Menu,
  MessageSquareText,
  RefreshCw,
  ScanSearch,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stamp,
  Target,
  UserRound,
  UsersRound,
  WalletCards,
  WandSparkles,
  Workflow,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
const LeadAssignmentPanel = lazy(() => import("./LeadAssignmentPanel"));
const CrmTimelinePanel = lazy(() => import("./CrmTimelinePanel"));
const FollowUpReminderPanel = lazy(() => import("./FollowUpReminderPanel"));
const AICounselorAssistant = lazy(() => import("./AICounselorAssistant"));
const AIWorkspacePanel = lazy(() => import("./AIWorkspacePanel"));
import { addTimelineEvent } from "../../lib/crmTimeline";
const GPTIntelligencePanel = lazy(() => import("./GPTIntelligencePanel"));
const StudentDocumentsPanel = lazy(() => import("./StudentDocumentsPanel"));
const StudentApplicationPanel = lazy(() => import("./StudentApplicationPanel"));
const VisaTrackerPanel = lazy(() => import("./VisaTrackerPanel"));
const UniversityManagementPanel = lazy(() => import("./UniversityManagementPanel"));
const CommunicationCenterPanel = lazy(() => import("./CommunicationCenterPanel"));
const ExecutiveAIDashboard = lazy(() => import("./ExecutiveAIDashboard"));
const TaskCenterPanel = lazy(() => import("./TaskCenterPanel"));
const CounselorQueuePanel = lazy(() => import("./CounselorQueuePanel"));
const SmartActionsPanel = lazy(() => import("./SmartActionsPanel"));
const StudentAnalyticsPanel = lazy(() => import("./StudentAnalyticsPanel"));
const PaymentCenterPanel = lazy(() => import("./PaymentCenterPanel"));
import * as studentPortalApi from "../../lib/studentPortal";

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

  const shouldReduceMotion = useReducedMotion();
  const [panelSearch, setPanelSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
  const [studentInvoices, setStudentInvoices] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [studentReceipts, setStudentReceipts] = useState([]);
  const [studentPaymentRequests, setStudentPaymentRequests] = useState([]);
  const [studentSupportRequests, setStudentSupportRequests] = useState([]);
  const [supportResponseDrafts, setSupportResponseDrafts] = useState({});
  const [savingSupportResponseId, setSavingSupportResponseId] = useState(null);
  const [supportActionStatus, setSupportActionStatus] = useState({
    type: "",
    message: "",
  });
  const [portalAccount, setPortalAccount] = useState(null);
  const [portalAccountLoading, setPortalAccountLoading] = useState(false);
  const [portalAccountSaving, setPortalAccountSaving] = useState("");
  const [portalAccountStatus, setPortalAccountStatus] = useState({
    type: "",
    message: "",
  });
  const [portalAccountForm, setPortalAccountForm] = useState({
    email: "",
    temporaryPassword: "student123",
    resetPassword: "",
    forcePasswordChange: true,
  });
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);

  const workingStudent = localStudent || student;

  const studentId = workingStudent?.id;

  const studentEmail = workingStudent?.email || student?.email || "";

  const studentType =
    workingStudent?.student_type ||
    workingStudent?.__leadType ||
    workingStudent?.type ||
    type ||
    "inquiry";

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
      type,
      workingStudent?.student_type,
      workingStudent?.type,
      workingStudent?.__leadType,
      "inquiry",
      "appointment",
    ].filter(Boolean);
  }, [
    studentType,
    type,
    workingStudent?.student_type,
    workingStudent?.type,
    workingStudent?.__leadType,
  ]);

  const normalizePortalAccount = useCallback((account = null) => {
    if (!account) return null;

    const isActive =
      account.is_active ??
      account.active ??
      account.status === "active" ??
      true;

    return {
      ...account,
      email: account.email || account.student_email || studentEmail,
      is_active: Boolean(isActive),
      must_change_password: Boolean(account.must_change_password),
      last_login_at: account.last_login_at || account.last_login || null,
      password_changed_at:
        account.password_changed_at || account.password_updated_at || null,
    };
  }, [studentEmail]);

  const loadPortalAccount = useCallback(async () => {
    if (!studentId) return null;

    setPortalAccountLoading(true);

    try {
      const idVariants = getStudentIdVariants();
      const typeVariants = [...new Set(getStudentTypeVariants())];

      const attempts = idVariants.map((idValue) =>
        supabase
          .from("student_portal_accounts")
          .select("*")
          .eq("student_id", idValue)
          .in("student_type", typeVariants.length ? typeVariants : [studentType])
          .order("created_at", { ascending: false })
          .limit(1)
      );

      const results = await Promise.all(attempts);
      const firstSuccess = results.find((result) => result.data?.length > 0);
      const firstError = results.find((result) => result.error)?.error;

      if (!firstSuccess && firstError) {
        throw firstError;
      }

      const account = normalizePortalAccount(firstSuccess?.data?.[0] || null);
      setPortalAccount(account);

      setPortalAccountForm((prev) => ({
        ...prev,
        email: account?.email || studentEmail || prev.email,
      }));

      return account;
    } catch (error) {
      console.warn("Portal account failed to load:", error?.message || error);
      setPortalAccount(null);
      return null;
    } finally {
      setPortalAccountLoading(false);
    }
  }, [getStudentIdVariants, getStudentTypeVariants, normalizePortalAccount, studentEmail, studentId, studentType]);

  const callPortalApi = async (functionName, payload = {}) => {
    const handler = studentPortalApi?.[functionName];

    if (typeof handler !== "function") {
      throw new Error(`${functionName} is not exported from studentPortal.js.`);
    }

    const objectPayload = {
      studentId,
      student_id: studentId,
      studentType,
      student_type: studentType,
      email: portalAccountForm.email || studentEmail,
      password:
        payload.password ||
        portalAccountForm.resetPassword ||
        portalAccountForm.temporaryPassword,
      temporaryPassword: portalAccountForm.temporaryPassword,
      resetPassword: portalAccountForm.resetPassword,
      mustChangePassword: portalAccountForm.forcePasswordChange,
      must_change_password: portalAccountForm.forcePasswordChange,
      adminProfile,
      ...payload,
    };

    const attempts = [
      () => handler(objectPayload),
      () => handler(studentId, studentType, objectPayload),
      () => handler(studentId, studentType, objectPayload.email, objectPayload.password, objectPayload.mustChangePassword),
      () => handler(portalAccount?.id, objectPayload),
    ];

    let lastError = null;

    for (const attempt of attempts) {
      try {
        const result = await attempt();
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(`${functionName} failed.`);
  };

  const handlePortalAccountAction = async (action, options = {}) => {
    if (!studentId || portalAccountSaving) return;

    const actionLabels = {
      create: "Creating portal account",
      reset: "Resetting portal password",
      activate: "Activating portal account",
      deactivate: "Deactivating portal account",
      force_change: "Forcing password change",
    };

    const apiMap = {
      create: "createStudentPortalAccount",
      reset: "resetStudentPortalAccountPassword",
      activate: "activateStudentPortalAccount",
      deactivate: "deactivateStudentPortalAccount",
      force_change: "forceStudentPortalPasswordChange",
    };

    const emailToUse = String(portalAccountForm.email || studentEmail || "").trim();
    const passwordToUse = String(
      action === "reset"
        ? portalAccountForm.resetPassword || portalAccountForm.temporaryPassword
        : portalAccountForm.temporaryPassword
    ).trim();

    if (["create", "reset"].includes(action)) {
      if (!emailToUse) {
        setPortalAccountStatus({ type: "warning", message: "Student email is required." });
        return;
      }

      if (!passwordToUse || passwordToUse.length < 6) {
        setPortalAccountStatus({
          type: "warning",
          message: "Temporary password must be at least 6 characters.",
        });
        return;
      }
    }

    setPortalAccountSaving(action);
    setPortalAccountStatus({
      type: "info",
      message: `${actionLabels[action] || "Updating portal account"}...`,
    });

    try {
      const result = await runWithTimeout(
        callPortalApi(apiMap[action], {
          email: emailToUse,
          password: passwordToUse,
          temporaryPassword: passwordToUse,
          resetPassword: passwordToUse,
          isActive: action !== "deactivate",
          is_active: action !== "deactivate",
          mustChangePassword:
            action === "force_change" ? true : portalAccountForm.forcePasswordChange,
          must_change_password:
            action === "force_change" ? true : portalAccountForm.forcePasswordChange,
          accountId: portalAccount?.id,
          account_id: portalAccount?.id,
          ...options,
        }),
        actionLabels[action] || "Portal account action",
        20000
      );

      const accountFromResult = result?.account || result?.data || result;
      if (accountFromResult && typeof accountFromResult === "object" && !Array.isArray(accountFromResult)) {
        setPortalAccount(normalizePortalAccount(accountFromResult));
      }

      await fireSupportTimelineEvent({
        actionType: `portal_account_${action}`,
        title: "Portal Account Updated",
        description: `Portal account action completed: ${action.replace(/_/g, " ")}.`,
        request: null,
        metadata: {
          portal_account_id: portalAccount?.id || accountFromResult?.id || null,
          email: emailToUse,
        },
      });

      await loadPortalAccount();

      setPortalAccountStatus({
        type: "success",
        message:
          action === "create"
            ? "Portal account created. Share the temporary password with the student."
            : action === "reset"
              ? "Password reset completed. Student should use the new temporary password."
              : action === "activate"
                ? "Portal account activated."
                : action === "deactivate"
                  ? "Portal account deactivated. Student login is blocked."
                  : "Student will be forced to change password on next login.",
      });

      setPortalAccountForm((prev) => ({
        ...prev,
        resetPassword: "",
      }));
    } catch (error) {
      console.error("Portal account action failed:", error);
      setPortalAccountStatus({
        type: "warning",
        message: error.message || "Portal account action failed.",
      });
      await loadPortalAccount();
    } finally {
      setPortalAccountSaving("");
    }
  };

  const loadStudentOsData = useCallback(async () => {
    if (!studentId) return;

    setOsLoading(true);
    setOsError("");

    try {
      const idVariants = getStudentIdVariants();
      const typeVariants = [...new Set(getStudentTypeVariants())];

      const fetchByStudentId = async (table, options = {}) => {
        const {
          select = "*",
          orderBy = "created_at",
          ascending = false,
          limit = null,
          matchStudentType = false,
        } = options;

        const attempts = idVariants.map((idValue) => {
          let query = supabase.from(table).select(select).eq("student_id", idValue);

          if (matchStudentType && typeVariants.length > 0) {
            query = query.in("student_type", typeVariants);
          }

          if (orderBy) {
            query = query.order(orderBy, { ascending });
          }

          if (limit) {
            query = query.limit(limit);
          }

          return query;
        });

        const results = await Promise.all(attempts);
        const firstError = results.find((result) => result.error)?.error;
        const mergedData = results.flatMap((result) => result.data || []);

        if (firstError && mergedData.length === 0) {
          throw firstError;
        }

        return Array.from(
          new Map(
            mergedData.map((item) => [item.id || JSON.stringify(item), item])
          ).values()
        );
      };

      const [
  supportRequestsData,
  documentsData,
  applicationsData,
  universitiesData,
  tasksData,
  communicationsData,
  invoicesData,
  paymentsData,
  receiptsData,
  paymentRequestsData,
] = await Promise.all([
  fetchByStudentId("student_support_requests", {
  orderBy: "created_at",
  ascending: false,
}),
        fetchByStudentId("student_documents", {
          orderBy: "created_at",
          ascending: false,
        }),

        fetchByStudentId("student_applications", {
          orderBy: "created_at",
          ascending: false,
          limit: 3,
          matchStudentType: true,
        }).then(async (data) => {
          if (data.length > 0) return data;

          return fetchByStudentId("student_applications", {
            orderBy: "created_at",
            ascending: false,
            limit: 3,
            matchStudentType: false,
          });
        }),

        fetchByStudentId("student_universities", {
          orderBy: "created_at",
          ascending: false,
        }),

        fetchByStudentId("student_tasks", {
          orderBy: "created_at",
          ascending: false,
        }),

        fetchByStudentId("student_communications", {
          orderBy: "created_at",
          ascending: false,
          matchStudentType: true,
        }).then(async (data) => {
          if (data.length > 0) return data;

          return fetchByStudentId("student_communications", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: false,
          });
        }),

        fetchByStudentId("student_invoices", {
          orderBy: "created_at",
          ascending: false,
          matchStudentType: true,
        }).then(async (data) => {
          if (data.length > 0) return data;
          return fetchByStudentId("student_invoices", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: false,
          });
        }),

        fetchByStudentId("student_payments", {
          orderBy: "created_at",
          ascending: false,
          matchStudentType: true,
        }).then(async (data) => {
          if (data.length > 0) return data;
          return fetchByStudentId("student_payments", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: false,
          });
        }),

        fetchByStudentId("student_receipts", {
          orderBy: "created_at",
          ascending: false,
          matchStudentType: true,
        }).then(async (data) => {
          if (data.length > 0) return data;
          return fetchByStudentId("student_receipts", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: false,
          });
        }),

        fetchByStudentId("counselor_payment_requests", {
          orderBy: "created_at",
          ascending: false,
          matchStudentType: true,
        }).then(async (data) => {
          if (data.length > 0) return data;
          return fetchByStudentId("counselor_payment_requests", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: false,
          });
        }),
      ]);

      setStudentDocuments(documentsData || []);
      setStudentApplication(applicationsData?.[0] || null);
      setStudentUniversities(universitiesData || []);
      setStudentTasks(tasksData || []);
      setStudentCommunications(communicationsData || []);
      setStudentInvoices(invoicesData || []);
      setStudentPayments(paymentsData || []);
      setStudentReceipts(receiptsData || []);
      setStudentPaymentRequests(paymentRequestsData || []);
      setStudentSupportRequests(supportRequestsData || []);

      setPanelRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Student OS data failed to load:", error);
      setOsError(error.message || "Student OS data failed to load.");
    } finally {
      setOsLoading(false);
    }
  }, [getStudentIdVariants, getStudentTypeVariants, studentId]);

  useEffect(() => {
    setLocalStudent(student);
    setActivePanel(student?.__preferredPanel || "ai-workspace");
    setMobileNavOpen(false);

    setOsLoading(false);
    setOsError("");
    setStudentDocuments([]);
    setStudentApplication(null);
    setStudentUniversities([]);
    setStudentTasks([]);
    setStudentCommunications([]);
    setStudentInvoices([]);
    setStudentPayments([]);
    setStudentReceipts([]);
    setStudentPaymentRequests([]);
    setStudentSupportRequests([]);
    setSupportResponseDrafts({});
    setSavingSupportResponseId(null);
    setSupportActionStatus({ type: "", message: "" });
    setPortalAccount(null);
    setPortalAccountLoading(false);
    setPortalAccountSaving("");
    setPortalAccountStatus({ type: "", message: "" });
    setPortalAccountForm({
      email: student?.email || "",
      temporaryPassword: "student123",
      resetPassword: "",
      forcePasswordChange: true,
    });
    setPanelRefreshKey((prev) => prev + 1);
  }, [student]);

  useEffect(() => {
    loadStudentOsData();
  }, [loadStudentOsData]);

  useEffect(() => {
    loadPortalAccount();
  }, [loadPortalAccount]);

  const refreshCurrentPanel = async () => {
    if (osLoading) return;

    await loadStudentOsData();
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
      title: "AI Command",
      items: [
        ["ai-workspace", "GPT Workspace", "Deep counselor copilot", Bot],
        ["gpt-intelligence", "GPT Intelligence", "Stored analysis & strategy", BrainCircuit],
        ["ai", "Quick AI Actions", "Fast counselor generation", WandSparkles],
        ["executive-ai", "Executive AI", "Student intelligence dashboard", Sparkles],
      ],
    },
    {
      title: "Student 360",
      items: [
        ["overview", "Command Overview", "Identity, readiness & controls", LayoutDashboard],
        ["analytics", "Student Analytics", "Journey intelligence", Activity],
        ["portal-account", "Portal Access", "Student login & security", LockKeyhole],
        ["documents", "Student Master File", "Complete document OS & permanent case vault", FolderOpen],
        ["applications", "Applications", "University application workflow", GraduationCap],
        ["visa", "Visa Processing", "Visa readiness & workflow", MapIcon],
        ["universities", "Universities", "Shortlist & destination planning", Building2],
        ["payments", "Finance Center", "Invoices, payments & receipts", WalletCards],
        ["support-requests", "Support Desk", "Student requests & responses", LifeBuoy],
      ],
    },
    {
      title: "Operations",
      items: [
        ["communication", "Communications", "Student outreach history", MessageSquareText],
        ["operations", "Task Command", "Tasks, queue & smart actions", ListChecks],
      ],
    },
    {
      title: "CRM Core",
      items: [
        ["pipeline", "Journey Pipeline", "Workflow stage tracking", Target],
        ["assignment", "Ownership", "Counselor & staff assignment", UsersRound],
        ["timeline", "Activity Timeline", "Complete CRM history", History],
        ["followups", "Follow-ups", "Reminders & next actions", CalendarCheck2],
      ],
    },
  ];

  const sidebarItems = sidebarGroups.flatMap((group) => group.items);
  const filteredSidebarGroups = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();

    if (!query) return sidebarGroups;

    return sidebarGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(([, label, description]) =>
          `${label} ${description}`.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [panelSearch]);


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

 const patchLocalSupportRequest = (requestId, patch = {}) => {
  if (!requestId) return;

  setStudentSupportRequests((prev) =>
    prev.map((item) =>
      String(item.id) === String(requestId)
        ? {
            ...item,
            ...patch,
          }
        : item
    )
  );
};

  const runWithTimeout = async (promise, label = "Action", timeoutMs = 15000) => {
    let timer;

    const timeout = new Promise((_, reject) => {
      timer = window.setTimeout(() => {
        reject(new Error(`${label} timed out. Please refresh and check the record.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      window.clearTimeout(timer);
    }
  };

  const updateSupportRequestSafely = async (requestId, payload = {}) => {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    let result = await supabase
      .from("student_support_requests")
      .update(cleanPayload)
      .eq("id", requestId)
      .select("*")
      .single();

    if (!result.error) return result.data;

    const message = String(result.error?.message || "").toLowerCase();
    const shouldRetryMinimal =
      message.includes("updated_at") ||
      message.includes("resolved_at") ||
      message.includes("reviewed") ||
      message.includes("column");

    if (!shouldRetryMinimal) throw result.error;

    const minimalPayload = { ...cleanPayload };
    delete minimalPayload.updated_at;

    if (message.includes("resolved_at")) {
      delete minimalPayload.resolved_at;
    }

    result = await supabase
      .from("student_support_requests")
      .update(minimalPayload)
      .eq("id", requestId)
      .select("*")
      .single();

    if (result.error) throw result.error;
    return result.data;
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

  const handleSupportResponseSubmit = async (request) => {
    if (!request?.id || savingSupportResponseId === request.id) return;

    const responseText = String(
      supportResponseDrafts[request.id] ?? request.counselor_response ?? ""
    ).trim();

    if (!responseText) {
      setSupportActionStatus({
        type: "warning",
        message: "Write a counselor response before sending.",
      });
      return;
    }

    const now = new Date().toISOString();

    setSavingSupportResponseId(request.id);
    setSupportActionStatus({
      type: "info",
      message: "Sending counselor response...",
    });

    try {
      const optimisticPatch = {
        counselor_response: responseText,
        responded_at: now,
        status: "resolved",
        resolved_at: request.resolved_at || now,
        updated_at: now,
      };

      patchLocalSupportRequest(request.id, optimisticPatch);

      const savedRequest = await runWithTimeout(
        updateSupportRequestSafely(request.id, optimisticPatch),
        "Counselor response",
        18000
      );

      if (savedRequest?.id) {
        patchLocalSupportRequest(request.id, savedRequest);
      }

      setSupportResponseDrafts((prev) => ({
        ...prev,
        [request.id]: responseText,
      }));

      setSupportActionStatus({
        type: "success",
        message: "Counselor response sent. Student can now see it in Support Center.",
      });

      await fireSupportTimelineEvent({
        actionType: "support_response",
        title: "Counselor Responded",
        description: `Counselor responded to support request: ${request.category || request.request_type || "Support Request"}.`,
        request,
        metadata: {
          status: "resolved",
        },
      });

      await loadStudentOsData();
    } catch (error) {
      console.error("Support response failed:", error);
      setSupportActionStatus({
        type: "warning",
        message: error.message || "Counselor response failed.",
      });
      await loadStudentOsData();
    } finally {
      setSavingSupportResponseId(null);
    }
  };

  const handleSupportStatusChange = async (request, nextStatus) => {
    if (!request?.id || savingSupportResponseId === request.id) return;

    const currentStatus = normalize(request.status || "open");
    const cleanNextStatus = normalize(nextStatus || "open");

    if (currentStatus === cleanNextStatus) return;

    setSavingSupportResponseId(request.id);
    setSupportActionStatus({
      type: "info",
      message: `Updating support request to ${cleanNextStatus.replace(/_/g, " ")}...`,
    });

    try {
      const now = new Date().toISOString();
      const payload = {
        status: cleanNextStatus,
        updated_at: now,
      };

      if (["resolved", "closed"].includes(cleanNextStatus)) {
        payload.resolved_at = request.resolved_at || now;
      }

      patchLocalSupportRequest(request.id, payload);

      const savedRequest = await runWithTimeout(
        updateSupportRequestSafely(request.id, payload),
        "Support status update",
        15000
      );

      if (savedRequest?.id) {
        patchLocalSupportRequest(request.id, savedRequest);
      }

      setSupportActionStatus({
        type: "success",
        message: `Support request marked ${cleanNextStatus.replace(/_/g, " ")}.`,
      });

      await fireSupportTimelineEvent({
        actionType: "support_status_changed",
        title: "Support Request Updated",
        description: `Support request status changed from ${currentStatus.replace(/_/g, " ")} to ${cleanNextStatus.replace(/_/g, " ")}.`,
        oldValue: currentStatus,
        newValue: cleanNextStatus,
        request,
        metadata: {
          status: cleanNextStatus,
        },
      });

      await loadStudentOsData();
    } catch (error) {
      console.error("Support status update failed:", error);
      setSupportActionStatus({
        type: "warning",
        message: error.message || "Support status could not be updated.",
      });
      await loadStudentOsData();
    } finally {
      setSavingSupportResponseId(null);
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

  const student360Stats = {
    documents: studentDocuments.length,
    applications: studentApplication ? 1 : 0,
    universities: studentUniversities.length,
    tasks: studentTasks.length,
    communications: studentCommunications.length,
    invoices: studentInvoices.length,
    payments: studentPayments.length,
    receipts: studentReceipts.length,
    support: studentSupportRequests.length,
  };

  const completedTasks = studentTasks.filter((task) =>
    ["completed", "done"].includes(String(task.status || "").toLowerCase())
  ).length;

  const verifiedDocuments = studentDocuments.filter((document) =>
    ["verified", "approved"].includes(
      String(document.status || document.verification_status || "").toLowerCase()
    )
  ).length;

  const openSupportRequests = studentSupportRequests.filter(
    (request) =>
      !["resolved", "closed"].includes(
        String(request.status || "open").toLowerCase()
      )
  ).length;

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


  const documentMasterBlueprint = useMemo(
    () => [
      {
        id: "identity-civil",
        title: "Identity & Civil Records",
        shortTitle: "Identity",
        icon: FileKey,
        description:
          "Core identity documents required to prove who the student is and support every downstream application.",
        groups: [
          {
            id: "passport-travel-id",
            title: "Passport & Travel Identity",
            documents: [
              "Current passport bio page",
              "Previous passport(s)",
              "Passport renewal receipt",
              "Passport observation page",
              "Passport signature page",
              "National identity card / CNIC front",
              "National identity card / CNIC back",
              "NICOP / POC where applicable",
              "Child registration certificate / B-Form",
              "Recent passport-size photographs",
              "Biometric photograph specification copy",
              "Digital passport photo source file",
            ],
          },
          {
            id: "civil-status",
            title: "Civil Status & Family",
            documents: [
              "Birth certificate",
              "NADRA birth record",
              "Family registration certificate",
              "Marriage certificate",
              "Divorce certificate if applicable",
              "Spouse identity documents",
              "Parent / guardian identity documents",
              "Domicile certificate",
              "Residence certificate",
              "Name change affidavit",
              "Name spelling clarification affidavit",
              "Relationship proof",
              "Guardianship document",
              "Death certificate of parent / sponsor if relevant",
            ],
          },
        ],
      },
      {
        id: "academic-education",
        title: "Academic & Education Records",
        shortTitle: "Academic",
        icon: GraduationCap,
        description:
          "The complete academic history from school to the most recent qualification, including proof, verification and grading records.",
        groups: [
          {
            id: "school-college",
            title: "School & College",
            documents: [
              "Matric / SSC certificate",
              "Matric / SSC detailed marks certificate",
              "Intermediate / HSSC certificate",
              "Intermediate / HSSC detailed marks certificate",
              "O-Level certificates",
              "O-Level statement of results",
              "A-Level certificates",
              "A-Level statement of results",
              "IB diploma and transcript",
              "School leaving certificate",
              "College leaving certificate",
              "Migration certificate",
              "Equivalence certificate",
              "Board verification letter",
            ],
          },
          {
            id: "undergraduate-postgraduate",
            title: "University Qualifications",
            documents: [
              "Bachelor degree",
              "Bachelor provisional degree",
              "Bachelor transcript",
              "Bachelor semester-wise transcripts",
              "Master degree",
              "Master provisional degree",
              "Master transcript",
              "MPhil degree",
              "MPhil transcript",
              "PhD degree",
              "PhD transcript",
              "Diploma certificate",
              "Diploma transcript",
              "Associate degree",
              "Associate degree transcript",
              "Professional qualification certificate",
              "Professional qualification transcript",
            ],
          },
          {
            id: "academic-verification",
            title: "Academic Verification & Recognition",
            documents: [
              "HEC degree attestation",
              "HEC transcript attestation",
              "IBCC attestation",
              "Board attestation",
              "MOFA attestation",
              "University verification email / letter",
              "Degree verification receipt",
              "CIMEA comparability certificate",
              "CIMEA verification certificate",
              "Declaration of Value / DoV",
              "Statement of comparability",
              "Academic recognition decision",
              "Course syllabus / module descriptions",
              "Credit-hour breakdown",
              "Grading scale explanation",
            ],
          },
          {
            id: "academic-active",
            title: "Current Study & Gap Evidence",
            documents: [
              "Current enrollment certificate",
              "Bonafide student certificate",
              "Expected graduation letter",
              "Final semester result awaiting degree",
              "Study gap explanation",
              "Gap activity evidence",
              "Employment during study gap",
              "Internship during study gap",
              "Training certificates during study gap",
            ],
          },
        ],
      },
      {
        id: "language-tests",
        title: "Language & Standardized Tests",
        shortTitle: "Tests",
        icon: FileBadge,
        description:
          "English, Italian and other language tests plus standardized admission tests and official result evidence.",
        groups: [
          {
            id: "english-tests",
            title: "English Language",
            documents: [
              "IELTS Test Report Form",
              "IELTS online verification details",
              "TOEFL score report",
              "TOEFL score recipient confirmation",
              "PTE Academic score report",
              "Duolingo English Test certificate",
              "Cambridge English certificate",
              "Medium of Instruction letter",
              "English proficiency waiver approval",
            ],
          },
          {
            id: "italian-tests",
            title: "Italian Language",
            documents: [
              "CILS certificate",
              "CELI certificate",
              "PLIDA certificate",
              "CERT.IT certificate",
              "Italian B1 certificate",
              "Italian B2 certificate",
              "University Italian language assessment",
            ],
          },
          {
            id: "admission-tests",
            title: "Admission Tests",
            documents: [
              "SAT score report",
              "GRE score report",
              "GMAT score report",
              "TOLC result",
              "IMAT result",
              "University entrance exam result",
              "Portfolio assessment result",
              "Interview result / evaluation",
            ],
          },
        ],
      },
      {
        id: "profile-application",
        title: "Profile & Application Pack",
        shortTitle: "Application Pack",
        icon: FileSignature,
        description:
          "The complete profile package used for university applications, scholarship submissions and counselor review.",
        groups: [
          {
            id: "cv-profile",
            title: "CV & Personal Profile",
            documents: [
              "Curriculum Vitae / CV",
              "Europass CV",
              "Academic CV",
              "Professional resume",
              "LinkedIn profile export",
              "Portfolio",
              "GitHub profile evidence",
              "Project portfolio",
              "Research portfolio",
              "Publication list",
              "Awards and achievements list",
              "Extracurricular activity evidence",
            ],
          },
          {
            id: "motivation-statements",
            title: "Statements & Letters",
            documents: [
              "Statement of Purpose / SOP",
              "Motivation letter",
              "Personal statement",
              "Study plan",
              "Career plan",
              "Research proposal",
              "Letter of intent",
              "Scholarship motivation letter",
              "Visa motivation letter",
              "Gap explanation letter",
              "Financial explanation letter",
            ],
          },
          {
            id: "recommendations",
            title: "Recommendations & References",
            documents: [
              "Academic recommendation letter 1",
              "Academic recommendation letter 2",
              "Professional recommendation letter",
              "Employer reference letter",
              "Supervisor recommendation",
              "Professor contact confirmation",
              "Reference consent / contact sheet",
            ],
          },
          {
            id: "application-forms",
            title: "Forms & Declarations",
            documents: [
              "University application form",
              "Signed application declaration",
              "Privacy / GDPR consent",
              "Scholarship application form",
              "Pre-enrollment application form",
              "Department-specific questionnaire",
              "Applicant declaration",
              "Parent / guardian consent if applicable",
            ],
          },
        ],
      },
      {
        id: "experience-career",
        title: "Experience, Employment & Career Evidence",
        shortTitle: "Experience",
        icon: Workflow,
        description:
          "Employment, internship, business and professional records that strengthen admission, gap and visa credibility.",
        groups: [
          {
            id: "employment",
            title: "Employment",
            documents: [
              "Employment letter",
              "Experience certificate",
              "Job contract",
              "Appointment letter",
              "Promotion letter",
              "Salary slips",
              "Employee ID evidence",
              "Employer verification email",
              "NOC from employer",
              "Leave approval",
            ],
          },
          {
            id: "internship-training",
            title: "Internships & Training",
            documents: [
              "Internship certificate",
              "Internship offer letter",
              "Training certificate",
              "Workshop certificate",
              "Bootcamp certificate",
              "Volunteer certificate",
              "Community service evidence",
            ],
          },
          {
            id: "business-self-employment",
            title: "Business / Self Employment",
            documents: [
              "Business registration",
              "Company incorporation certificate",
              "Partnership deed",
              "NTN / tax registration",
              "Business bank statement",
              "Business ownership proof",
              "Business income evidence",
              "Freelance contracts",
              "Client invoices",
              "Freelance platform statements",
            ],
          },
        ],
      },
      {
        id: "financial-sponsor",
        title: "Financial, Sponsor & Funding Evidence",
        shortTitle: "Financial",
        icon: WalletCards,
        description:
          "Every financial document needed to establish affordability, sponsor capacity, scholarship eligibility and visa strength.",
        groups: [
          {
            id: "student-funds",
            title: "Student Funds",
            documents: [
              "Student bank statement",
              "Student bank balance certificate",
              "Student account maintenance certificate",
              "Student savings evidence",
              "Fixed deposit certificate",
              "Foreign currency account statement",
              "Investment statement",
              "Source of funds explanation",
            ],
          },
          {
            id: "sponsor-funds",
            title: "Sponsor Financials",
            documents: [
              "Sponsor bank statement",
              "Sponsor bank balance certificate",
              "Sponsor account maintenance certificate",
              "Sponsor salary slips",
              "Sponsor employment letter",
              "Sponsor pension statement",
              "Sponsor business documents",
              "Sponsor tax returns",
              "Sponsor wealth statement",
              "Sponsor property documents",
              "Sponsor rental income evidence",
              "Sponsor agricultural income evidence",
              "Sponsor remittance evidence",
            ],
          },
          {
            id: "sponsorship-relationship",
            title: "Sponsorship & Relationship",
            documents: [
              "Sponsorship affidavit",
              "Financial support letter",
              "Sponsor undertaking",
              "Relationship proof with sponsor",
              "Sponsor CNIC / passport",
              "Sponsor family registration certificate",
              "Multiple sponsor explanation",
            ],
          },
          {
            id: "scholarship-funding",
            title: "Scholarship & Funding",
            documents: [
              "Scholarship award letter",
              "DSU scholarship application",
              "DSU scholarship eligibility documents",
              "ISEE / ISEE Parificato documents",
              "Family income certificate",
              "Family composition certificate",
              "Property / no-property certificate",
              "Bank / asset declaration",
              "Regional scholarship receipt",
              "Tuition waiver confirmation",
              "External funding letter",
              "Education loan approval",
              "Loan disbursement letter",
            ],
          },
          {
            id: "payments-fees",
            title: "Fees & Payment Proof",
            documents: [
              "Application fee receipt",
              "Enrollment fee receipt",
              "Tuition fee receipt",
              "Deposit payment receipt",
              "University payment confirmation",
              "Bank transfer slip",
              "SWIFT transfer proof",
              "Refund receipt",
              "Payment plan approval",
            ],
          },
        ],
      },
      {
        id: "italy-admission",
        title: "Italy University & Pre-Enrollment",
        shortTitle: "Italy Admission",
        icon: Landmark,
        description:
          "Italy-specific university, Universitaly and academic recognition documents required from application through enrollment.",
        groups: [
          {
            id: "university-admission",
            title: "University Admission",
            documents: [
              "Application submission confirmation",
              "Conditional offer letter",
              "Unconditional offer letter",
              "Admission letter",
              "Acceptance letter",
              "Enrollment confirmation",
              "Matriculation confirmation",
              "Student ID / matricola evidence",
              "Course enrollment receipt",
              "Department approval",
              "Academic evaluation outcome",
            ],
          },
          {
            id: "universitaly",
            title: "Universitaly",
            documents: [
              "Universitaly account confirmation",
              "Universitaly pre-enrollment submission",
              "Universitaly pre-enrollment summary",
              "Universitaly validation",
              "University validation on Universitaly",
              "Embassy forwarded pre-enrollment",
              "Universitaly correction request",
              "Universitaly final validated PDF",
            ],
          },
          {
            id: "recognition-italy",
            title: "Italian Recognition",
            documents: [
              "CIMEA request receipt",
              "CIMEA comparability statement",
              "CIMEA verification statement",
              "Declaration of Value request",
              "Declaration of Value",
              "Legalized academic documents",
              "Italian translation of academic documents",
              "Apostille / legalization where required",
            ],
          },
        ],
      },
      {
        id: "visa-embassy",
        title: "Visa, Embassy & Consular File",
        shortTitle: "Visa",
        icon: Stamp,
        description:
          "The complete visa application package, appointment trail, embassy submissions and decision records.",
        groups: [
          {
            id: "visa-core",
            title: "Visa Core",
            documents: [
              "National visa application form",
              "Signed visa application form",
              "Visa checklist",
              "Visa cover letter",
              "Visa motivation letter",
              "Passport copy for visa file",
              "Recent visa photographs",
              "Visa fee receipt",
              "VAC / VFS service fee receipt",
            ],
          },
          {
            id: "appointment-submission",
            title: "Appointment & Submission",
            documents: [
              "Embassy appointment confirmation",
              "VFS appointment confirmation",
              "Appointment reschedule confirmation",
              "Token / queue receipt",
              "Submission receipt",
              "Passport submission receipt",
              "Courier receipt",
              "Biometric enrollment receipt",
            ],
          },
          {
            id: "visa-support",
            title: "Visa Supporting Evidence",
            documents: [
              "University admission letter",
              "Universitaly validation",
              "Accommodation proof",
              "Travel insurance",
              "Flight reservation",
              "Financial proof",
              "Sponsorship documents",
              "Academic documents",
              "Language certificate",
              "Police clearance certificate",
              "Medical certificate if required",
            ],
          },
          {
            id: "visa-decision",
            title: "Visa Decision & Passport Return",
            documents: [
              "Visa approval notification",
              "Visa refusal letter",
              "Visa refusal reasoning notes",
              "Appeal / review submission",
              "Passport collection notice",
              "Visa sticker scan",
              "Visa validity details",
              "Passport return courier evidence",
            ],
          },
        ],
      },
      {
        id: "legal-translation",
        title: "Legalization, Translation & Attestation",
        shortTitle: "Legal",
        icon: ShieldCheck,
        description:
          "Certified translations, attestations, affidavits and legalization chains that make documents formally acceptable.",
        groups: [
          {
            id: "translations",
            title: "Translations",
            documents: [
              "Certified Italian translation",
              "Certified English translation",
              "Translator declaration",
              "Translator stamp page",
              "Translation invoice / receipt",
              "Original + translated merged set",
            ],
          },
          {
            id: "attestation",
            title: "Attestation & Legalization",
            documents: [
              "HEC attested degree",
              "HEC attested transcript",
              "IBCC attested certificate",
              "MOFA attestation",
              "Notary attestation",
              "Apostille",
              "Embassy legalization",
              "Consular legalization",
              "Chamber of Commerce attestation",
            ],
          },
          {
            id: "affidavits",
            title: "Affidavits & Declarations",
            documents: [
              "Sponsorship affidavit",
              "Name discrepancy affidavit",
              "Gap affidavit",
              "No property affidavit",
              "No income affidavit",
              "Dependency affidavit",
              "Relationship affidavit",
              "Financial undertaking",
              "Declaration of authenticity",
            ],
          },
        ],
      },
      {
        id: "accommodation-travel",
        title: "Accommodation, Travel & Arrival",
        shortTitle: "Travel",
        icon: Building2,
        description:
          "Housing, travel and arrival records that bridge the student from visa approval to settlement in Italy.",
        groups: [
          {
            id: "housing",
            title: "Accommodation",
            documents: [
              "University accommodation confirmation",
              "Private rental contract",
              "Booking confirmation",
              "Host declaration",
              "Hospitality letter",
              "Landlord identity document",
              "Accommodation payment receipt",
              "Temporary stay booking",
            ],
          },
          {
            id: "travel",
            title: "Travel",
            documents: [
              "Flight reservation",
              "Confirmed flight ticket",
              "Boarding pass",
              "Travel itinerary",
              "Travel insurance policy",
              "Travel insurance payment receipt",
              "Airport transfer booking",
            ],
          },
          {
            id: "arrival",
            title: "Arrival & Post-Arrival",
            documents: [
              "Entry stamp scan",
              "Codice Fiscale",
              "Permesso di Soggiorno application receipt",
              "Post office kit receipt",
              "Questura appointment",
              "Residence registration",
              "Italian SIM registration",
              "Health insurance / SSN registration",
              "Bank account opening proof",
              "University in-person enrollment completion",
            ],
          },
        ],
      },
      {
        id: "health-police",
        title: "Health, Police & Compliance",
        shortTitle: "Compliance",
        icon: ShieldAlert,
        description:
          "Health and character records that may be required by visa, university or destination authorities.",
        groups: [
          {
            id: "police",
            title: "Police & Character",
            documents: [
              "Police clearance certificate",
              "Character certificate",
              "Criminal record certificate",
              "Police certificate translation",
            ],
          },
          {
            id: "medical",
            title: "Medical & Health",
            documents: [
              "Medical fitness certificate",
              "Vaccination certificate",
              "COVID vaccination certificate",
              "Health declaration",
              "Disability support documentation",
              "Prescription / treatment note if officially required",
            ],
          },
        ],
      },
      {
        id: "communications-case",
        title: "Case Communication & Evidence",
        shortTitle: "Case Evidence",
        icon: MessageSquareText,
        description:
          "Important communication records that document the history of university, embassy, sponsor and counselor actions.",
        groups: [
          {
            id: "university-communication",
            title: "University Communication",
            documents: [
              "University email confirmation",
              "Admission office email",
              "Department email",
              "Scholarship office email",
              "Fee office email",
              "Document deficiency request",
              "Deadline extension approval",
            ],
          },
          {
            id: "embassy-communication",
            title: "Embassy / VFS Communication",
            documents: [
              "Embassy email",
              "VFS email",
              "Additional document request",
              "Passport request",
              "Interview notice",
              "Decision notification",
            ],
          },
          {
            id: "internal-case",
            title: "Internal Case Records",
            documents: [
              "Counselor case note attachment",
              "Student confirmation screenshot",
              "WhatsApp evidence",
              "Email evidence",
              "Call summary attachment",
              "Internal approval note",
              "Escalation evidence",
            ],
          },
        ],
      },
      {
        id: "custom-misc",
        title: "Custom, Miscellaneous & Exceptional Files",
        shortTitle: "Custom",
        icon: FileCog,
        description:
          "A permanent home for unusual or case-specific documents that do not belong in a predefined checklist.",
        groups: [
          {
            id: "custom",
            title: "Custom Documents",
            documents: [
              "Custom document 1",
              "Custom document 2",
              "Custom document 3",
              "Case-specific evidence",
              "Exceptional circumstance letter",
              "Additional supporting document",
              "Replacement document",
              "Archived historical version",
            ],
          },
        ],
      },
    ],
    []
  );

  const documentLifecycleStages = [
    {
      id: "required",
      label: "Required",
      description: "Checklist item identified but not yet received.",
      icon: FilePlus2,
    },
    {
      id: "requested",
      label: "Requested",
      description: "Student has been asked to provide the file.",
      icon: Mail,
    },
    {
      id: "received",
      label: "Received",
      description: "File exists in the Student OS vault.",
      icon: FolderPlus,
    },
    {
      id: "review",
      label: "Under Review",
      description: "Counselor or operations team is checking quality and validity.",
      icon: FileSearch2,
    },
    {
      id: "verified",
      label: "Verified",
      description: "Document is accepted and ready for downstream use.",
      icon: FolderCheck,
    },
    {
      id: "rejected",
      label: "Rejected",
      description: "File is invalid, incomplete or not acceptable.",
      icon: FileWarning,
    },
    {
      id: "replacement",
      label: "Replacement Needed",
      description: "A newer or corrected version must be collected.",
      icon: FolderSync,
    },
    {
      id: "expired",
      label: "Expired",
      description: "Validity has ended and a fresh document is required.",
      icon: FileClock,
    },
    {
      id: "archived",
      label: "Archived",
      description: "Historical version retained for audit and case history.",
      icon: FolderArchive,
    },
  ];

  const flatMasterDocuments = useMemo(() => {
    return documentMasterBlueprint.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.documents.map((documentName) => ({
          sectionId: section.id,
          sectionTitle: section.title,
          groupId: group.id,
          groupTitle: group.title,
          documentName,
        }))
      )
    );
  }, [documentMasterBlueprint]);

  const masterDocumentCount = flatMasterDocuments.length;

  const documentNameSearch = useCallback((document) => {
    return normalize(
      [
        document?.document_type,
        document?.type,
        document?.category,
        document?.name,
        document?.title,
        document?.file_name,
        document?.filename,
        document?.notes,
      ]
        .filter(Boolean)
        .join(" ")
    );
  }, []);

  const masterCoverage = useMemo(() => {
    return documentMasterBlueprint.map((section) => {
      const sectionKeywords = [
        section.id,
        section.title,
        section.shortTitle,
        ...section.groups.flatMap((group) => [
          group.id,
          group.title,
          ...group.documents,
        ]),
      ].map(normalize);

      const matches = studentDocuments.filter((document) => {
        const searchable = documentNameSearch(document);
        return sectionKeywords.some((keyword) => keyword && searchable.includes(keyword));
      });

      const verified = matches.filter((document) =>
        ["verified", "approved", "accepted", "complete", "completed"].includes(
          normalize(
            document?.verification_status ||
              document?.status ||
              document?.document_status
          )
        )
      ).length;

      return {
        ...section,
        liveCount: matches.length,
        verifiedCount: verified,
      };
    });
  }, [documentMasterBlueprint, documentNameSearch, studentDocuments]);

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

  const documentOperationalSignals = [
    {
      label: "Master checklist capacity",
      value: `${masterDocumentCount}+`,
      helper: "Predefined document slots",
      icon: FileStack,
    },
    {
      label: "Live student files",
      value: studentDocuments.length,
      helper: "Records currently in vault",
      icon: Files,
    },
    {
      label: "Document health",
      value: `${documentHealthScore}%`,
      helper: "Verification-weighted quality",
      icon: BadgeCheck,
    },
    {
      label: "Needs attention",
      value: documentStatusSummary.attention,
      helper: "Rejected, expired or urgent",
      icon: CircleAlert,
    },
  ];


  const documentFamilies = useMemo(() => {
    const families = [
      {
        id: "identity",
        label: "Identity & Civil",
        description: "Passport, CNIC, photos, birth and civil records",
        keywords: ["passport", "cnic", "nic", "identity", "id_card", "photo", "birth", "domicile", "family", "civil"],
      },
      {
        id: "academic",
        label: "Academic Records",
        description: "Degrees, transcripts, certificates and mark sheets",
        keywords: ["academic", "degree", "transcript", "certificate", "marksheet", "mark_sheet", "ssc", "hssc", "matric", "intermediate", "bachelor", "master", "diploma"],
      },
      {
        id: "language",
        label: "Language & Tests",
        description: "IELTS, TOEFL, PTE, Duolingo and admission tests",
        keywords: ["ielts", "toefl", "pte", "duolingo", "language", "test", "gre", "gmat", "sat"],
      },
      {
        id: "application",
        label: "Application Pack",
        description: "CV, SOP, LOR, motivation letters and forms",
        keywords: ["cv", "resume", "sop", "statement", "lor", "recommendation", "motivation", "application", "form", "portfolio"],
      },
      {
        id: "financial",
        label: "Financial Evidence",
        description: "Bank, sponsor, income, scholarship and payment evidence",
        keywords: ["bank", "financial", "sponsor", "income", "salary", "fund", "scholarship", "payment", "receipt", "tax"],
      },
      {
        id: "admission",
        label: "Admission & University",
        description: "Offer letters, pre-enrolment and university records",
        keywords: ["offer", "admission", "university", "enrollment", "enrolment", "pre_enrollment", "pre-enrollment", "cimea", "dov"],
      },
      {
        id: "visa",
        label: "Visa & Embassy",
        description: "Visa forms, appointments, insurance and embassy files",
        keywords: ["visa", "embassy", "consulate", "appointment", "insurance", "flight", "travel", "accommodation", "housing"],
      },
      {
        id: "supporting",
        label: "Supporting & Other",
        description: "Legal, translated, attested and miscellaneous evidence",
        keywords: ["legal", "translation", "translated", "attestation", "attested", "affidavit", "police", "medical", "other", "misc"],
      },
    ];

    const normalizedDocuments = studentDocuments.map((document) => {
      const searchable = normalize(
        [
          document?.document_type,
          document?.type,
          document?.category,
          document?.name,
          document?.title,
          document?.file_name,
          document?.filename,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return { document, searchable };
    });

    return families.map((family) => {
      const matches = normalizedDocuments.filter(({ searchable }) =>
        family.keywords.some((keyword) => searchable.includes(normalize(keyword)))
      );

      const verified = matches.filter(({ document }) =>
        ["verified", "approved", "accepted", "complete", "completed"].includes(
          normalize(
            document?.verification_status ||
              document?.status ||
              document?.document_status
          )
        )
      ).length;

      return {
        ...family,
        total: matches.length,
        verified,
      };
    });
  }, [studentDocuments]);

  const activePanelDefinition = useMemo(() => {
    const item = sidebarItems.find(([id]) => id === activePanel);
    return item
      ? { id: item[0], label: item[1], description: item[2], icon: item[3] }
      : {
          id: "overview",
          label: "Student Workspace",
          description: "Complete Student 360 operating system",
          icon: LayoutDashboard,
        };
  }, [activePanel, sidebarItems]);

  const ActivePanelIcon = activePanelDefinition.icon || LayoutDashboard;


  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/55 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.99 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
          className={`zaifan-student-os-v18 flex h-[96dvh] max-h-[96dvh] w-full max-w-[1680px] flex-col overflow-hidden rounded-[1.4rem] border-2 border-orange-500 bg-[#fff8ee] text-[#152238] shadow-[0_34px_130px_rgba(15,23,42,0.38)] sm:rounded-[1.9rem] ${cardClass}`}
        >
          <style>{`
            /*
             * StudentDetailModal V18 — High Contrast Readability Guard
             * Scoped to this modal only. Keeps the mature V17 architecture/backend intact.
             * Prevents pale/white text inherited from child panels from disappearing on cream surfaces.
             */
            .zaifan-student-os-v18 {
              color: #10233f;
              color-scheme: light;
            }

            .zaifan-student-os-v18 .text-white,
            .zaifan-student-os-v18 .text-white\/90,
            .zaifan-student-os-v18 .text-white\/80,
            .zaifan-student-os-v18 .text-white\/70,
            .zaifan-student-os-v18 .text-white\/60,
            .zaifan-student-os-v18 .text-white\/50 {
              color: #10233f !important;
            }

            .zaifan-student-os-v18 .bg-white .text-white,
            .zaifan-student-os-v18 .bg-\[\#fffdfa\] .text-white,
            .zaifan-student-os-v18 .bg-\[\#fff8ee\] .text-white,
            .zaifan-student-os-v18 .bg-orange-50 .text-white,
            .zaifan-student-os-v18 .bg-slate-50 .text-white {
              color: #10233f !important;
            }

            .zaifan-student-os-v18 input,
            .zaifan-student-os-v18 textarea,
            .zaifan-student-os-v18 select {
              color: #10233f !important;
              background-color: #ffffff !important;
              border-color: #c8d2df !important;
              caret-color: #f05a18;
            }

            .zaifan-student-os-v18 input::placeholder,
            .zaifan-student-os-v18 textarea::placeholder {
              color: #6b7c93 !important;
              opacity: 1 !important;
            }

            .zaifan-student-os-v18 option {
              color: #10233f;
              background: #ffffff;
            }

            .zaifan-student-os-v18 button:disabled {
              opacity: .58;
            }

            /* Dark operational surfaces deliberately keep white copy. */
            .zaifan-student-os-v18 .zaifan-dark-surface,
            .zaifan-student-os-v18 .zaifan-dark-surface * {
              color: #ffffff !important;
            }

            .zaifan-student-os-v18 .zaifan-dark-surface .zaifan-orange-copy {
              color: #ff8a3d !important;
            }

            /* Scrollbars remain visible and usable in the nested OS layout. */
            .zaifan-student-os-v18 * {
              scrollbar-color: #f97316 #fff1e6;
              scrollbar-width: thin;
            }

            .zaifan-student-os-v18 *::-webkit-scrollbar {
              width: 9px;
              height: 9px;
            }

            .zaifan-student-os-v18 *::-webkit-scrollbar-track {
              background: #fff1e6;
              border-radius: 999px;
            }

            .zaifan-student-os-v18 *::-webkit-scrollbar-thumb {
              background: #f97316;
              border: 2px solid #fff1e6;
              border-radius: 999px;
            }
          `}</style>
          <div className="relative shrink-0 border-b border-slate-300 bg-[#fffdfa] px-4 py-4 sm:px-6 sm:py-5">
            <div className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-100" />

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-600 sm:text-xs sm:tracking-[0.22em]">
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
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold text-cyan-700">
                      Refreshing Panel...
                    </span>
                  ) : null}
                </div>

                <h2 className="break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                  {fullName}
                </h2>

                <div className="mt-2 max-w-2xl">
                  <p className="break-words text-sm text-slate-500">
                    {country} • {field}
                  </p>

                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                    AI Counselor Workspace Ready
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="hidden items-center gap-2 rounded-xl border border-slate-300 bg-[#fff8ee] px-3 py-2.5 text-sm font-black text-[#152238] xl:inline-flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#152238] text-orange-400">
                    <ActivePanelIcon size={14} />
                  </span>
                  <span className="max-w-[190px] truncate">{activePanelDefinition.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-black text-[#152238] transition hover:border-orange-300 hover:text-orange-700 lg:hidden"
                >
                  <Menu size={16} />
                  Modules
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel("ai-workspace")}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  Open Real GPT
                </button>

                <button
                  type="button"
                  onClick={refreshCurrentPanel}
                  disabled={osLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition duration-300 hover:border-orange-200 hover:text-orange-700 disabled:opacity-50"
                >
                  Refresh Current Panel
                </button>

                {safePermissions.canDelete ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition duration-300 hover:bg-red-100"
                  >
                    Delete
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition duration-300 hover:border-slate-300 hover:text-slate-900"
                >
                  Close
                </button>
              </div>
            </div>

            {osError ? (
              <div className="mt-4 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 text-sm text-orange-800">
                OS data warning: {osError}
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-b border-slate-300 bg-[#fff8ee] px-4 py-3 sm:px-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <Student360Metric label="Profile readiness" value={`${profileReadiness}%`} icon={BadgeCheck} tone="orange" />
              <Student360Metric label="Pipeline" value={`${pipelineProgress || 0}%`} icon={Target} tone="blue" />
              <Student360Metric label="Documents" value={`${verifiedDocuments}/${studentDocuments.length}`} icon={FolderOpen} tone="emerald" />
              <Student360Metric label="Tasks done" value={`${completedTasks}/${studentTasks.length}`} icon={ClipboardCheck} tone="violet" />
              <Student360Metric label="Universities" value={studentUniversities.length} icon={Building2} tone="blue" />
              <Student360Metric label="Open support" value={openSupportRequests} icon={LifeBuoy} tone="red" />
              <Student360Metric label="Portal" value={portalAccount?.is_active ? "Active" : portalAccount ? "Paused" : "Not set"} icon={LockKeyhole} tone={portalAccount?.is_active ? "emerald" : "slate"} />
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[292px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className={`zaifan-student-nav min-h-0 overscroll-contain overflow-y-auto border-b border-slate-300 bg-[#fff7ed] p-4 lg:block lg:border-b-0 lg:border-r lg:border-slate-300 ${mobileNavOpen ? "block" : "hidden"}`}>
              <div className="mb-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={panelSearch}
                    onChange={(event) => setPanelSearch(event.target.value)}
                    placeholder="Find student workspace..."
                    className="w-full rounded-xl border border-slate-400 bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#152238] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredSidebarGroups.map((group) => (
                  <div key={group.title}>
                    <div className="mb-2 flex items-center gap-3 px-1">
                      <div className="h-px flex-1 bg-slate-100" />
                      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-900/30">
                        {group.title}
                      </p>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                      {group.items.map(([id, label, description, Icon]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setActivePanel(id); setMobileNavOpen(false); }}
                          className={`w-full rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                            activePanel === id
                              ? "border-orange-500 bg-[#ff5a0a] text-white shadow-[0_8px_18px_rgba(255,90,10,0.20)]"
                              : "border-slate-300 bg-[#fffdfa] text-[#24324a] shadow-[0_3px_10px_rgba(15,23,42,0.04)] hover:border-orange-400 hover:bg-[#fff3df] hover:text-[#152238]"
                          }`}
                        >
                          <span className="flex items-center gap-3 text-xs font-semibold sm:text-sm">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              activePanel === id
                                ? "bg-white text-orange-600"
                                : "border border-slate-300 bg-[#fffaf2] text-slate-500"
                            }`}>
                              <Icon size={15} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{label}</span>
                              <span className="mt-0.5 hidden truncate text-[10px] font-medium opacity-60 sm:block">{description}</span>
                            </span>
                            <ChevronRight size={14} className="shrink-0 opacity-40" />
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

              <div className="mt-5 rounded-2xl border border-slate-300 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Pipeline Progress
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${pipelineProgress || 0}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {pipelineProgress || 0}% • {currentStage?.label || "Stage"}
                </p>
              </div>

              <div className="mt-4 grid gap-2 rounded-2xl border border-slate-300 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  OS Snapshot
                </p>

               <MiniOsStat label="Docs" value={studentDocuments.length} />
<MiniOsStat label="Applications" value={studentApplication ? 1 : 0} />
<MiniOsStat label="Universities" value={studentUniversities.length} />
<MiniOsStat label="Tasks" value={studentTasks.length} />
<MiniOsStat label="Messages" value={studentCommunications.length} />
<MiniOsStat label="Invoices" value={studentInvoices.length} />
<MiniOsStat label="Receipts" value={studentReceipts.length} />
<MiniOsStat
  label="Support"
  value={studentSupportRequests.length}
/>

                <p className="pt-2 text-[11px] leading-5 text-slate-400">
                  Live Student OS snapshot loaded from documents, applications,
                  universities, tasks, and communications.
                </p>
              </div>
            </aside>

            <main className="zaifan-student-main min-h-0 min-w-0 overscroll-contain overflow-x-hidden overflow-y-auto bg-[#fffdfa] p-3 pb-20 sm:p-5 sm:pb-24 xl:p-6 xl:pb-28">
              <div
                className={`zaifan-panel-surface zaifan-admin-contrast-surface ${
                  ["ai-workspace", "gpt-intelligence", "ai", "executive-ai"].includes(activePanel)
                    ? "zaifan-ai-panel-surface"
                    : ""
                }`}
              >
              <Suspense fallback={<StudentPanelLoader />}>
              {activePanel === "overview" ? (
                <div className="space-y-5">
                  <div className="rounded-[1.75rem] border border-orange-300/20 bg-orange-500/[0.05] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
                          Real GPT Counselor Desk
                        </p>
                        <h3 className="mt-2 text-xl font-black text-slate-900">
                          Use OpenAI only when you need generated counselor output.
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Local CRM intelligence handles scores and pipeline signals.
                          Real GPT is available here for summaries, WhatsApp, email,
                          call scripts, visa risk, and follow-up plans.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePanel("ai-workspace")}
                        className="rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                      >
                        Launch Real GPT Workspace
                      </button>
                    </div>
                  </div>


                  <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
                    <div className="rounded-[1.6rem] border border-slate-400 bg-[#152238] p-5 text-white">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                        Student Master Record
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        One student. One permanent operational record.
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Identity, documents, applications, universities, finance, visa,
                        support, communications, tasks, portal access and CRM history are
                        treated as one connected case instead of separate disconnected widgets.
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {[
                          ["Documents", studentDocuments.length],
                          ["Universities", studentUniversities.length],
                          ["Tasks", studentTasks.length],
                          ["Messages", studentCommunications.length],
                          ["Invoices", studentInvoices.length],
                          ["Support", studentSupportRequests.length],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl border border-white/15 bg-white/[0.07] p-3">
                            <p className="text-lg font-black">{value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-300">
                              {label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePanel("documents")}
                      className="rounded-[1.6rem] border-2 border-orange-300 bg-[#fff8ee] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.08)]"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                        <FolderKey size={18} />
                      </span>
                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                        Heart of Student OS
                      </p>
                      <h4 className="mt-1 text-xl font-black text-[#152238]">
                        Open Student Master File
                      </h4>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        Access the complete document architecture and live document operations.
                      </p>
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {infoRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-300 bg-white p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {label}
                        </p>

                        <p className="mt-2 break-words text-sm font-medium text-slate-700">
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
                          className="rounded-2xl border border-orange-300/15 bg-orange-500/[0.04] p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600/70">
                            {label}
                          </p>

                          <p className="mt-2 break-words text-sm font-medium text-slate-800">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Notes / Message
                    </h3>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                      {notes}
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-slate-300 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Priority
                        </h3>

                        {savingPriority ? (
                          <span className="text-xs text-slate-400">Saving...</span>
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
                                : "border-slate-300 bg-white text-slate-500 hover:border-orange-300/30 hover:text-orange-600"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-slate-300 bg-slate-50 p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Status
                        </h3>

                        {savingStatus ? (
                          <span className="text-xs text-slate-400">Saving...</span>
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
                                : "border-slate-300 bg-white text-slate-500 hover:border-orange-300/30 hover:text-orange-600"
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
                  studentType={studentType}
                  adminProfile={adminProfile}
                />
              ) : null}

              {activePanel === "gpt-intelligence" ? (
                <GPTIntelligencePanel
  student={workingStudent}
  adminProfile={adminProfile}
  onOpenWorkspace={() => setActivePanel("ai-workspace")}
/>
              ) : null}

              {activePanel === "ai" ? (
                <AICounselorAssistant
                  student={workingStudent}
                  studentType={studentType}
                  adminProfile={adminProfile}
                />
              ) : null}
{activePanel === "portal-account" ? (
  <div className="space-y-5">
    <div className="rounded-[1.75rem] border border-orange-300/20 bg-orange-500/[0.05] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
            Student Portal Access Control
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-900">
            Portal Account Management
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Create login access, reset temporary passwords, activate or deactivate access,
            and force password changes from the admin Student OS.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPortalAccount}
          disabled={portalAccountLoading || Boolean(portalAccountSaving)}
          className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-400/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {portalAccountLoading ? "Checking Account..." : "Refresh Account"}
        </button>
      </div>
    </div>

    {portalAccountStatus.message ? (
      <div
        className={`rounded-2xl border p-4 text-sm ${
          portalAccountStatus.type === "success"
            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-800"
            : portalAccountStatus.type === "warning"
              ? "border-red-400/20 bg-red-500/10 text-red-800"
              : "border-blue-400/20 bg-blue-500/10 text-blue-800"
        }`}
      >
        {portalAccountStatus.message}
      </div>
    ) : null}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <PortalAccountStat
        label="Account Status"
        value={portalAccount ? (portalAccount.is_active ? "Active" : "Inactive") : "Not Created"}
        tone={portalAccount?.is_active ? "success" : portalAccount ? "danger" : "muted"}
      />
      <PortalAccountStat
        label="Must Change Password"
        value={portalAccount?.must_change_password ? "Yes" : "No"}
        tone={portalAccount?.must_change_password ? "warning" : "muted"}
      />
      <PortalAccountStat
        label="Last Login"
        value={formatPortalDate(portalAccount?.last_login_at)}
      />
      <PortalAccountStat
        label="Password Changed"
        value={formatPortalDate(portalAccount?.password_changed_at)}
      />
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Login Details</h4>
            <p className="mt-1 text-sm text-slate-500">
              These values are used when creating or resetting a student's portal login.
            </p>
          </div>

          {portalAccount ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              Account Found
            </span>
          ) : (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
              No Account
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Student Email
            </span>
            <input
              value={portalAccountForm.email}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300/40"
              placeholder="student@email.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Temporary Password
            </span>
            <input
              value={portalAccountForm.temporaryPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({
                  ...prev,
                  temporaryPassword: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300/40"
              placeholder="Minimum 6 characters"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Reset Password Override
            </span>
            <input
              value={portalAccountForm.resetPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({ ...prev, resetPassword: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-orange-300/40"
              placeholder="Optional. Leave blank to reuse temporary password."
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={portalAccountForm.forcePasswordChange}
            onChange={(event) =>
              setPortalAccountForm((prev) => ({
                ...prev,
                forcePasswordChange: event.target.checked,
              }))
            }
            className="h-4 w-4 accent-[#D4AF37]"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Force password change on next login
            </span>
            <span className="text-xs text-slate-500">
              Recommended for all new and reset portal accounts.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-[1.75rem] border border-slate-300 bg-slate-50 p-5">
        <h4 className="text-lg font-bold text-slate-900">Student Mapping</h4>
        <div className="mt-4 grid gap-3">
          <PortalInfoRow label="Student" value={fullName} />
          <PortalInfoRow label="Email" value={portalAccount?.email || email} />
          <PortalInfoRow label="Record" value={`${studentType} #${studentId}`} />
          <PortalInfoRow label="Account ID" value={portalAccount?.id || "Not created yet"} />
          <PortalInfoRow label="Created" value={formatPortalDate(portalAccount?.created_at)} />
          <PortalInfoRow label="Updated" value={formatPortalDate(portalAccount?.updated_at)} />
        </div>
      </div>
    </div>

    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-slate-900">Admin Controls</h4>
          <p className="text-sm text-slate-500">
            Full portal access controls are connected to studentPortal.js backend actions.
          </p>
        </div>

        {portalAccountSaving ? (
          <span className="rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">
            Working...
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || Boolean(portalAccount)}
          onClick={() => handlePortalAccountAction("create")}
          className="rounded-2xl border border-orange-300/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "create" ? "Creating..." : "Create Account"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("reset")}
          className="rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "reset" ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || portalAccount.is_active}
          onClick={() => handlePortalAccountAction("activate")}
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "activate" ? "Activating..." : "Activate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || !portalAccount.is_active}
          onClick={() => handlePortalAccountAction("deactivate")}
          className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "deactivate" ? "Deactivating..." : "Deactivate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("force_change")}
          className="rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "force_change" ? "Updating..." : "Force Change"}
        </button>
      </div>
    </div>
  </div>
) : null}
              {activePanel === "documents" ? (
                <div className="space-y-5 pb-10">
                  <section className="overflow-hidden rounded-[1.8rem] border-2 border-orange-300 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.10)]">
                    <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
                      <div className="relative overflow-hidden bg-[#152238] p-5 text-white sm:p-6 xl:p-7">
                        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
                        <div className="absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-white/5 blur-3xl" />

                        <div className="relative">
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/50 bg-orange-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                                  <FolderKey size={13} />
                                  Student Master File
                                </span>
                                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-200">
                                  Ultimate Document OS
                                </span>
                              </div>

                              <h3 className="mt-4 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">
                                The permanent source of truth for the student’s entire case.
                              </h3>

                              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
                                Identity, academic history, language tests, applications, sponsorship,
                                DSU and scholarship evidence, CIMEA, DoV, Universitaly, admission,
                                visa, embassy, legalizations, accommodation, travel, arrival and every
                                small supporting file live here. Nothing important should sit outside
                                the student record.
                              </p>
                            </div>

                            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                              <button
                                type="button"
                                onClick={refreshCurrentPanel}
                                disabled={osLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.24)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-50"
                              >
                                <RefreshCw size={14} className={osLoading ? "animate-spin" : ""} />
                                Refresh
                              </button>
                              <button
                                type="button"
                                onClick={() => setActivePanel("timeline")}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black text-white transition hover:bg-white/15"
                              >
                                <History size={14} />
                                History
                              </button>
                            </div>
                          </div>

                          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {documentOperationalSignals.map((signal) => (
                              <div
                                key={signal.label}
                                className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                                    <signal.icon size={16} />
                                  </span>
                                  <span className="text-2xl font-black">{signal.value}</span>
                                </div>
                                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">
                                  {signal.label}
                                </p>
                                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                                  {signal.helper}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-300 bg-[#fff8ee] p-5 xl:border-l xl:border-t-0 xl:p-6">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                            <FolderLock size={19} />
                          </span>
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">
                              File Governance
                            </p>
                            <h4 className="mt-1 text-xl font-black text-[#152238]">
                              Every file has a lifecycle.
                            </h4>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-2">
                          {documentLifecycleStages.map((stage) => (
                            <div
                              key={stage.id}
                              className="flex items-start gap-3 rounded-xl border border-slate-300 bg-white p-3"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#152238] text-orange-300">
                                <stage.icon size={14} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-[#152238]">
                                  {stage.label}
                                </p>
                                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                                  {stage.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border border-slate-400 bg-[#fffaf2] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                          Master Document Architecture
                        </p>
                        <h4 className="mt-1 text-2xl font-black text-[#152238]">
                          Complete case coverage across every major document family.
                        </h4>
                        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                          This is the operational blueprint for the student file. It gives the Admin OS
                          permanent space for documents that are required now, may become required later,
                          or need to be retained for audit and historical context.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <DocumentMasterMiniStat
                          label="Families"
                          value={documentMasterBlueprint.length}
                          icon={FolderKanban}
                        />
                        <DocumentMasterMiniStat
                          label="Checklist Slots"
                          value={`${masterDocumentCount}+`}
                          icon={FileStack}
                        />
                        <DocumentMasterMiniStat
                          label="Live Files"
                          value={studentDocuments.length}
                          icon={Files}
                        />
                        <DocumentMasterMiniStat
                          label="Verified"
                          value={documentStatusSummary.verified}
                          icon={FileCheck2}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      {masterCoverage.map((section) => (
                        <DocumentMasterFamilyCard
                          key={section.id}
                          section={section}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                    <div className="rounded-[1.6rem] border border-slate-400 bg-white p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                          <FileArchive size={17} />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                            Version & Audit Discipline
                          </p>
                          <h4 className="mt-1 text-lg font-black text-[#152238]">
                            Never overwrite the story of a critical file.
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {[
                          ["Original", "Keep the original upload or received file."],
                          ["Reviewed", "Retain the version used during counselor review."],
                          ["Corrected", "Store corrected or replaced copies separately."],
                          ["Submitted", "Preserve the exact file sent to university or embassy."],
                          ["Verified", "Mark the accepted final version clearly."],
                          ["Archived", "Keep old versions for case history instead of deleting blindly."],
                        ].map(([label, description]) => (
                          <div key={label} className="rounded-xl border border-slate-300 bg-[#fffaf2] p-3">
                            <p className="text-xs font-black text-[#152238]">{label}</p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-500">{description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-slate-400 bg-white p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#152238] text-orange-300">
                          <FolderCog size={17} />
                        </span>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                            Operational Rules
                          </p>
                          <h4 className="mt-1 text-lg font-black text-[#152238]">
                            A file is useful only when the team can trust it.
                          </h4>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {[
                          "Keep required, missing, received and verified states separate.",
                          "Track expiry dates for passports, language tests, bank documents and insurance.",
                          "Keep rejected files visible until a valid replacement is received.",
                          "Preserve submitted copies exactly as sent to each institution.",
                          "Allow custom documents because real student cases always produce exceptions.",
                          "Use timeline history for major document state changes and replacements.",
                          "Never remove historical evidence merely because a newer version exists.",
                          "Keep counselor notes distinct from the actual document record.",
                        ].map((rule, index) => (
                          <div key={rule} className="flex items-start gap-3 rounded-xl border border-slate-300 bg-[#fffaf2] p-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                              {index + 1}
                            </span>
                            <p className="text-xs leading-5 text-slate-600">{rule}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.75rem] border-2 border-slate-400 bg-[#fffaf2] p-2 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:p-3">
                    <div className="mb-3 flex flex-col gap-3 px-2 pt-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                          Live Document Operations
                        </p>
                        <h4 className="mt-1 text-lg font-black text-[#152238]">
                          Upload, review, verify, replace and manage the real student files here.
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          The master architecture above defines the coverage. This connected panel remains
                          the operational source of truth for real document records and backend actions.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                          Student #{studentId}
                        </span>
                        <span className="rounded-full bg-[#152238] px-3 py-1.5 text-xs font-black text-white">
                          {studentDocuments.length} live files
                        </span>
                        <span className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-black text-white">
                          {documentStatusSummary.verified} verified
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-[1.3rem] border border-slate-400 bg-white">
                      <StudentDocumentsPanel
                        key={`documents-${studentId}-${panelRefreshKey}`}
                        student={{
                          ...workingStudent,
                          documents: studentDocuments,
                        }}
                        sharedDocuments={studentDocuments}
                        onSharedDataChange={loadStudentOsData}
                      />
                    </div>
                  </section>
                </div>
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



              {activePanel === "payments" ? (
                <PaymentCenterPanel
                  key={`payments-${studentId}-${panelRefreshKey}`}
                  student={workingStudent}
                  studentType={studentType}
                  adminProfile={adminProfile}
                  invoices={studentInvoices}
                  payments={studentPayments}
                  receipts={studentReceipts}
                  paymentRequests={studentPaymentRequests}
                  onSharedDataChange={loadStudentOsData}
                />
              ) : null}
{activePanel === "support-requests" && (
  <div className="space-y-4">
    <div className="rounded-2xl border border-slate-300 bg-white p-5">
      <h3 className="mb-2 text-lg font-bold text-slate-900">
        Student Support Requests
      </h3>

      <p className="text-sm text-slate-500">
        Requests submitted through Student Portal.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniOsStat label="Total" value={studentSupportRequests.length} />
        <MiniOsStat
          label="Open"
          value={studentSupportRequests.filter((item) => ["open", "pending", "in_progress"].includes(normalize(item.status || "open"))).length}
        />
        <MiniOsStat
          label="Responded"
          value={studentSupportRequests.filter((item) => Boolean(item.counselor_response)).length}
        />
        <MiniOsStat
          label="Resolved"
          value={studentSupportRequests.filter((item) => ["resolved", "closed"].includes(normalize(item.status))).length}
        />
      </div>
    </div>

    {supportActionStatus.message ? (
      <div
        className={`rounded-2xl border p-4 text-sm ${
          supportActionStatus.type === "success"
            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-800"
            : supportActionStatus.type === "warning"
              ? "border-red-400/20 bg-red-500/10 text-red-800"
              : "border-blue-400/20 bg-blue-500/10 text-blue-800"
        }`}
      >
        {supportActionStatus.message}
      </div>
    ) : null}

    {studentSupportRequests.length === 0 ? (
      <div className="rounded-2xl border border-slate-300 bg-white p-6 text-center text-slate-500">
        No support requests found.
      </div>
    ) : (
      <div className="space-y-3">
        {studentSupportRequests.map((request) => (
          <div
            key={request.id}
            className="rounded-2xl border border-slate-300 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {request.subject}
                </h4>

                <p className="text-xs text-slate-500">
                  {request.request_type}
                </p>

                <div className="mt-1 flex gap-2">
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-2 py-1 text-[10px] uppercase text-amber-700">
                    {request.priority || "normal"}
                  </span>
                </div>
              </div>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-700">
                {request.status || "open"}
              </span>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              {request.message}

              {request.admin_notes ? (
  <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
    <div className="text-xs font-semibold text-emerald-700">
      Admin Notes
    </div>

    <div className="mt-1 text-sm text-slate-800">
      {request.admin_notes}
    </div>
  </div>
) : null}

              {request.counselor_response ? (
                <div className="mt-3 rounded-xl border border-orange-300/20 bg-orange-500/10 p-3">
                  <div className="text-xs font-semibold text-orange-600">
                    Counselor Response Sent
                  </div>

                  <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                    {request.counselor_response}
                  </div>

                  {request.responded_at ? (
                    <div className="mt-2 text-xs text-slate-900/40">
                      Responded: {new Date(request.responded_at).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
<div className="mt-3 text-xs text-slate-900/40">
              {request.created_at
                ? new Date(request.created_at).toLocaleString()
                : "Unknown"}

              {request.resolved_at ? (
                <div className="mt-1 text-emerald-700">
                  Resolved: {new Date(request.resolved_at).toLocaleString()}
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Counselor Response
              </p>

              <textarea
                value={
                  supportResponseDrafts[request.id] ??
                  request.counselor_response ??
                  ""
                }
                onChange={(event) =>
                  setSupportResponseDrafts((prev) => ({
                    ...prev,
                    [request.id]: event.target.value,
                  }))
                }
                rows={4}
                className="mt-3 w-full resize-none rounded-xl border border-slate-300 bg-black/35 px-3 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-900/25 focus:border-orange-300/40"
                placeholder="Write the response the student will see in their portal."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingSupportResponseId === request.id}
                  onClick={() => handleSupportResponseSubmit(request)}
                  className="rounded-lg border border-orange-300/25 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingSupportResponseId === request.id
                    ? "Sending Response..."
                    : request.counselor_response
                      ? "Update Response"
                      : "Send Response"}
                </button>

                <button
                  type="button"
                  onClick={() => setActivePanel("timeline")}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-orange-300/30 hover:text-orange-600"
                >
                  Open Timeline
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">

  <button
    type="button"
    disabled={
      savingSupportResponseId === request.id ||
      ["resolved", "closed"].includes(normalize(request.status))
    }
    onClick={() => handleSupportStatusChange(request, "in_progress")}
    className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {savingSupportResponseId === request.id ? "Updating..." : "In Progress"}
  </button>

  <button
    type="button"
    disabled={
      savingSupportResponseId === request.id ||
      ["resolved", "closed"].includes(normalize(request.status))
    }
    onClick={() => handleSupportStatusChange(request, "resolved")}
    className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {savingSupportResponseId === request.id ? "Updating..." : "Resolve"}
  </button>

  <button
    type="button"
    disabled={
      savingSupportResponseId === request.id ||
      ["resolved", "closed"].includes(normalize(request.status))
    }
    onClick={() => handleSupportStatusChange(request, "closed")}
    className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {savingSupportResponseId === request.id ? "Updating..." : "Close"}
  </button>

  <button
    type="button"
    disabled={
      savingSupportResponseId === request.id ||
      !["resolved", "closed"].includes(normalize(request.status))
    }
    onClick={() => handleSupportStatusChange(request, "open")}
    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {savingSupportResponseId === request.id ? "Updating..." : "Reopen"}
  </button>

</div>
            <div className="mt-3 text-xs text-slate-900/40">
              {request.created_at
                ? new Date(request.created_at).toLocaleString()
                : "Unknown"}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
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
  key={`timeline-${studentId}-${studentType}-${panelRefreshKey}`}
  studentId={workingStudent.id}
  studentType={studentType}
  adminProfile={adminProfile}
/>
              ) : null}

              {activePanel === "followups" ? (
                <FollowUpReminderPanel
  key={`followups-${studentId}-${studentType}-${panelRefreshKey}`}
  studentId={workingStudent.id}
  studentType={studentType}
  adminProfile={adminProfile}
/>
              ) : null}
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
             * Theme bridge for legacy AI panels.
             * The AI components were originally styled for darker surfaces.
             * Within Student OS only, force readable typography on their pale cards
             * while preserving explicit orange/navy action surfaces.
             */
            .zaifan-ai-panel-surface .text-white {
              color: #152238 !important;
            }

            .zaifan-ai-panel-surface .text-slate-100,
            .zaifan-ai-panel-surface .text-slate-200,
            .zaifan-ai-panel-surface .text-slate-300 {
              color: #475569 !important;
            }

            .zaifan-ai-panel-surface .text-white\/70,
            .zaifan-ai-panel-surface .text-white\/80,
            .zaifan-ai-panel-surface .text-white\/90 {
              color: #475569 !important;
            }

            /* Restore white text on clearly dark / orange interactive surfaces. */
            .zaifan-ai-panel-surface .bg-orange-500.text-white,
            .zaifan-ai-panel-surface .bg-orange-600.text-white,
            .zaifan-ai-panel-surface .bg-\[\#152238\].text-white,
            .zaifan-ai-panel-surface .bg-slate-900.text-white,
            .zaifan-ai-panel-surface .bg-slate-950.text-white {
              color: #ffffff !important;
            }

            .zaifan-ai-panel-surface button.bg-orange-500,
            .zaifan-ai-panel-surface button.bg-orange-600 {
              color: #ffffff !important;
            }

            .zaifan-ai-panel-surface h1,
            .zaifan-ai-panel-surface h2,
            .zaifan-ai-panel-surface h3,
            .zaifan-ai-panel-surface h4 {
              text-shadow: none !important;
            }


            /* =========================================================
             * ZAIFAN ADMIN OS — HIGH CONTRAST LEGACY PANEL BRIDGE
             * Scoped only inside StudentDetailModal.
             * Goal: match approved Inquiry/Appointment card language:
             * cream canvas, white cards, navy operational blocks,
             * orange actions, readable dark text, visible borders.
             * ========================================================= */

            .zaifan-admin-contrast-surface {
              color: #152238;
              --zaifan-admin-navy: #0f2a55;
              --zaifan-admin-navy-deep: #0a1f44;
              --zaifan-admin-orange: #ff5a0a;
              --zaifan-admin-cream: #fff8ee;
              --zaifan-admin-card: #fffdf9;
              --zaifan-admin-border: #cbd5e1;
            }

            .zaifan-admin-contrast-surface,
            .zaifan-admin-contrast-surface * {
              text-shadow: none !important;
            }

            /* Default readable typography for legacy pale panels */
            .zaifan-admin-contrast-surface [class*="text-white"],
            .zaifan-admin-contrast-surface [class*="text-slate-50"],
            .zaifan-admin-contrast-surface [class*="text-slate-100"],
            .zaifan-admin-contrast-surface [class*="text-slate-200"],
            .zaifan-admin-contrast-surface [class*="text-slate-300"],
            .zaifan-admin-contrast-surface [class*="text-gray-100"],
            .zaifan-admin-contrast-surface [class*="text-gray-200"],
            .zaifan-admin-contrast-surface [class*="text-gray-300"] {
              color: #334155 !important;
            }

            .zaifan-admin-contrast-surface [class*="text-white/"],
            .zaifan-admin-contrast-surface [class*="text-slate-100/"],
            .zaifan-admin-contrast-surface [class*="text-slate-200/"],
            .zaifan-admin-contrast-surface [class*="text-slate-300/"] {
              color: #475569 !important;
              opacity: 1 !important;
            }

            .zaifan-admin-contrast-surface h1,
            .zaifan-admin-contrast-surface h2,
            .zaifan-admin-contrast-surface h3,
            .zaifan-admin-contrast-surface h4,
            .zaifan-admin-contrast-surface h5,
            .zaifan-admin-contrast-surface h6 {
              color: #152238;
            }

            /* Legacy transparent/dark washes become clean premium cards */
            .zaifan-admin-contrast-surface [class*="bg-black/"],
            .zaifan-admin-contrast-surface [class*="bg-white/5"],
            .zaifan-admin-contrast-surface [class*="bg-white/[0.0"],
            .zaifan-admin-contrast-surface [class*="bg-slate-950/"],
            .zaifan-admin-contrast-surface [class*="bg-slate-900/"],
            .zaifan-admin-contrast-surface [class*="bg-zinc-900/"] {
              background-color: #fffdf9 !important;
              background-image: none !important;
            }

            /* Common muted gray inputs/cards from older components */
            .zaifan-admin-contrast-surface :is(input, select, textarea) {
              background: #ffffff !important;
              color: #152238 !important;
              border: 1px solid #94a3b8 !important;
              box-shadow: none !important;
              opacity: 1 !important;
            }

            .zaifan-admin-contrast-surface :is(input, select, textarea)::placeholder {
              color: #94a3b8 !important;
              opacity: 1 !important;
            }

            .zaifan-admin-contrast-surface :is(input, select, textarea):focus {
              border-color: #ff5a0a !important;
              outline: none !important;
              box-shadow: 0 0 0 3px rgba(255,90,10,0.12) !important;
            }

            .zaifan-admin-contrast-surface select option {
              background: #ffffff;
              color: #152238;
            }

            /* Make generic legacy bordered cards actually visible */
            .zaifan-admin-contrast-surface [class*="border-white/"],
            .zaifan-admin-contrast-surface [class*="border-slate-700"],
            .zaifan-admin-contrast-surface [class*="border-slate-800"],
            .zaifan-admin-contrast-surface [class*="border-zinc-700"],
            .zaifan-admin-contrast-surface [class*="border-zinc-800"] {
              border-color: #cbd5e1 !important;
            }

            /* Remove accidental washed-out opacity from content containers */
            .zaifan-admin-contrast-surface [class*="opacity-40"],
            .zaifan-admin-contrast-surface [class*="opacity-50"],
            .zaifan-admin-contrast-surface [class*="opacity-60"],
            .zaifan-admin-contrast-surface [class*="opacity-70"] {
              opacity: 1 !important;
            }

            /* Keep disabled controls visibly disabled without becoming unreadable */
            .zaifan-admin-contrast-surface :is(button, input, select, textarea):disabled {
              opacity: 0.55 !important;
            }

            /* Strong dark operational surfaces retain white text */
            .zaifan-admin-contrast-surface [class*="bg-[#0f2a55]"],
            .zaifan-admin-contrast-surface [class*="bg-[#0a1f44]"],
            .zaifan-admin-contrast-surface [class*="bg-[#152238]"],
            .zaifan-admin-contrast-surface [class*="bg-slate-900"]:not([class*="/"]),
            .zaifan-admin-contrast-surface [class*="bg-slate-950"]:not([class*="/"]) {
              background-color: #0f2a55 !important;
              background-image: none !important;
              border-color: #0a1f44 !important;
              color: #ffffff !important;
            }

            .zaifan-admin-contrast-surface [class*="bg-[#0f2a55]"] *,
            .zaifan-admin-contrast-surface [class*="bg-[#0a1f44]"] *,
            .zaifan-admin-contrast-surface [class*="bg-[#152238]"] *,
            .zaifan-admin-contrast-surface [class*="bg-slate-900"]:not([class*="/"]) *,
            .zaifan-admin-contrast-surface [class*="bg-slate-950"]:not([class*="/"]) * {
              color: #ffffff !important;
            }

            /* Orange actions always stay strong and readable */
            .zaifan-admin-contrast-surface [class*="bg-orange-500"],
            .zaifan-admin-contrast-surface [class*="bg-orange-600"],
            .zaifan-admin-contrast-surface [class*="bg-[#ff5a0a]"] {
              color: #ffffff !important;
            }

            .zaifan-admin-contrast-surface [class*="bg-orange-500"] *,
            .zaifan-admin-contrast-surface [class*="bg-orange-600"] *,
            .zaifan-admin-contrast-surface [class*="bg-[#ff5a0a]"] * {
              color: #ffffff !important;
            }

            /* Preserve semantic success/warning/error contrast */
            .zaifan-admin-contrast-surface [class*="bg-emerald-"],
            .zaifan-admin-contrast-surface [class*="bg-green-"] {
              color: #065f46;
            }

            .zaifan-admin-contrast-surface [class*="bg-red-"] {
              color: #991b1b;
            }

            .zaifan-admin-contrast-surface [class*="bg-blue-"] {
              color: #1e40af;
            }

            /* Better button separation */
            .zaifan-admin-contrast-surface button {
              font-weight: 700;
            }

            .zaifan-admin-contrast-surface button[class*="border"] {
              border-color: #cbd5e1;
            }

            /* Tables */
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

function formatPortalDate(value) {
  if (!value) return "Never";

  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_error) {
    return String(value);
  }
}

function PortalAccountStat({ label, value, tone = "muted" }) {
  const styles = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    danger: "border-red-300 bg-red-50 text-red-800",
    warning: "border-orange-300 bg-orange-50 text-orange-800",
    muted: "border-slate-300 bg-white text-slate-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[tone] || styles.muted}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function PortalInfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-700">{value}</p>
    </div>
  );
}

function MiniOsStat({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-black text-orange-600">{value}</span>
    </div>
  );
}


function DocumentCommandMetric({ label, value, icon: Icon, emphasis = false }) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        emphasis
          ? "border-orange-400/55 bg-orange-500/20"
          : "border-white/15 bg-white/[0.07]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            emphasis ? "bg-orange-500 text-white" : "bg-white/10 text-orange-300"
          }`}
        >
          <Icon size={15} />
        </span>
        <span className="text-xl font-black text-white">{value}</span>
      </div>
      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300">
        {label}
      </p>
    </div>
  );
}

function DocumentCoverageCard({ family }) {
  const complete = family.total > 0 && family.verified === family.total;

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[11px] font-black text-[#152238]">
          {family.label}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${
            complete
              ? "bg-orange-500 text-white"
              : family.total > 0
                ? "bg-[#152238] text-white"
                : "border border-slate-300 bg-slate-50 text-slate-500"
          }`}
        >
          {family.total}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-500">
        {family.description}
      </p>
      {family.total > 0 ? (
        <p className="mt-2 text-[9px] font-bold text-orange-700">
          {family.verified}/{family.total} verified
        </p>
      ) : (
        <p className="mt-2 text-[9px] font-bold text-slate-400">No file tagged yet</p>
      )}
    </div>
  );
}



function DocumentMasterMiniStat({ label, value, icon: Icon }) {
  return (
    <div className="min-w-[110px] rounded-xl border border-slate-300 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#152238] text-orange-300">
          <Icon size={13} />
        </span>
        <span className="text-lg font-black text-[#152238]">{value}</span>
      </div>
      <p className="mt-2 text-[9px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function DocumentMasterFamilyCard({ section }) {
  const Icon = section.icon || FolderOpen;
  const totalBlueprintSlots = section.groups.reduce(
    (sum, group) => sum + group.documents.length,
    0
  );

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-slate-400 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-300 bg-[#fff8ee] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#152238] text-orange-300">
            <Icon size={17} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-sm font-black text-[#152238]">{section.title}</h5>
              <div className="flex gap-1.5">
                <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[9px] font-black text-slate-600">
                  {totalBlueprintSlots} slots
                </span>
                <span className="rounded-full bg-orange-500 px-2 py-1 text-[9px] font-black text-white">
                  {section.liveCount} live
                </span>
              </div>
            </div>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              {section.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {section.groups.map((group) => (
          <details
            key={group.id}
            className="group rounded-xl border border-slate-300 bg-[#fffdfa] open:bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
              <div>
                <p className="text-xs font-black text-[#152238]">{group.title}</p>
                <p className="mt-0.5 text-[9px] text-slate-500">
                  {group.documents.length} predefined document spaces
                </p>
              </div>
              <ChevronRight
                size={14}
                className="shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-90"
              />
            </summary>

            <div className="border-t border-slate-300 px-3 py-3">
              <div className="grid gap-1.5">
                {group.documents.map((documentName) => (
                  <div
                    key={documentName}
                    className="flex items-start gap-2 rounded-lg border border-slate-200 bg-[#fffaf2] px-2.5 py-2"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-700">
                      <FileText size={10} />
                    </span>
                    <span className="text-[10px] leading-4 text-slate-600">
                      {documentName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}

        <div className="grid grid-cols-2 gap-2 border-t border-slate-300 pt-3">
          <div className="rounded-xl bg-[#152238] p-3 text-white">
            <p className="text-lg font-black">{section.liveCount}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">
              Live records
            </p>
          </div>
          <div className="rounded-xl bg-orange-500 p-3 text-white">
            <p className="text-lg font-black">{section.verifiedCount}</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-orange-100">
              Verified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


function Student360Metric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-300 bg-slate-50 text-slate-600",
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${tones[tone] || tones.slate}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[8px] font-black uppercase tracking-[0.12em] opacity-65">
          {label}
        </p>
        <p className="mt-0.5 truncate text-xs font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function StudentPanelLoader() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.4rem] border border-slate-300 bg-white">
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