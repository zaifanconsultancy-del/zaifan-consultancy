import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
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
import PaymentCenterPanel from "./PaymentCenterPanel";
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
        ["portal-account", "Portal Account", "Student portal access", "🔐"],
        ["documents", "Documents", "Student file management", "📁"],
        ["applications", "Applications", "University workflow", "🎓"],
        ["visa", "Visa Processing", "Visa workflow tracking", "🌍"],
        ["universities", "Universities", "Destination planning", "🏫"],
        ["payments", "Payments", "Invoices and receipt tracking", "💳"],
        ["support-requests", "Support Requests", "Student help desk", "🎯"],
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
<MiniOsStat label="Invoices" value={studentInvoices.length} />
<MiniOsStat label="Receipts" value={studentReceipts.length} />
<MiniOsStat
  label="Support"
  value={studentSupportRequests.length}
/>

                <p className="pt-2 text-[11px] leading-5 text-white/35">
                  Live Student OS snapshot loaded from documents, applications,
                  universities, tasks, and communications.
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
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            Student Portal Access Control
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Portal Account Management
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Create login access, reset temporary passwords, activate or deactivate access,
            and force password changes from the admin Student OS.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPortalAccount}
          disabled={portalAccountLoading || Boolean(portalAccountSaving)}
          className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {portalAccountLoading ? "Checking Account..." : "Refresh Account"}
        </button>
      </div>
    </div>

    {portalAccountStatus.message ? (
      <div
        className={`rounded-2xl border p-4 text-sm ${
          portalAccountStatus.type === "success"
            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
            : portalAccountStatus.type === "warning"
              ? "border-red-400/20 bg-red-500/10 text-red-200"
              : "border-blue-400/20 bg-blue-500/10 text-blue-200"
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
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-white">Login Details</h4>
            <p className="mt-1 text-sm text-white/45">
              These values are used when creating or resetting a student's portal login.
            </p>
          </div>

          {portalAccount ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Account Found
            </span>
          ) : (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
              No Account
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Student Email
            </span>
            <input
              value={portalAccountForm.email}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({ ...prev, email: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              placeholder="student@email.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
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
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              placeholder="Minimum 6 characters"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
              Reset Password Override
            </span>
            <input
              value={portalAccountForm.resetPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({ ...prev, resetPassword: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
              placeholder="Optional. Leave blank to reuse temporary password."
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
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
            <span className="block text-sm font-semibold text-white">
              Force password change on next login
            </span>
            <span className="text-xs text-white/45">
              Recommended for all new and reset portal accounts.
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
        <h4 className="text-lg font-bold text-white">Student Mapping</h4>
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

    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-bold text-white">Admin Controls</h4>
          <p className="text-sm text-white/45">
            Full portal access controls are connected to studentPortal.js backend actions.
          </p>
        </div>

        {portalAccountSaving ? (
          <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#D4AF37]">
            Working...
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || Boolean(portalAccount)}
          onClick={() => handlePortalAccountAction("create")}
          className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-3 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "create" ? "Creating..." : "Create Account"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("reset")}
          className="rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "reset" ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || portalAccount.is_active}
          onClick={() => handlePortalAccountAction("activate")}
          className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "activate" ? "Activating..." : "Activate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || !portalAccount.is_active}
          onClick={() => handlePortalAccountAction("deactivate")}
          className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "deactivate" ? "Deactivating..." : "Deactivate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("force_change")}
          className="rounded-2xl border border-orange-400/25 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "force_change" ? "Updating..." : "Force Change"}
        </button>
      </div>
    </div>
  </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-2 text-lg font-bold text-white">
        Student Support Requests
      </h3>

      <p className="text-sm text-white/60">
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
            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
            : supportActionStatus.type === "warning"
              ? "border-red-400/20 bg-red-500/10 text-red-200"
              : "border-blue-400/20 bg-blue-500/10 text-blue-200"
        }`}
      >
        {supportActionStatus.message}
      </div>
    ) : null}

    {studentSupportRequests.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/50">
        No support requests found.
      </div>
    ) : (
      <div className="space-y-3">
        {studentSupportRequests.map((request) => (
          <div
            key={request.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">
                  {request.subject}
                </h4>

                <p className="text-xs text-white/50">
                  {request.request_type}
                </p>

                <div className="mt-1 flex gap-2">
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-500/10 px-2 py-1 text-[10px] uppercase text-yellow-300">
                    {request.priority || "normal"}
                  </span>
                </div>
              </div>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                {request.status || "open"}
              </span>
            </div>

            <div className="mt-3 text-sm text-white/70">
              {request.message}

              {request.admin_notes ? (
  <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
    <div className="text-xs font-semibold text-emerald-300">
      Admin Notes
    </div>

    <div className="mt-1 text-sm text-white/80">
      {request.admin_notes}
    </div>
  </div>
) : null}

              {request.counselor_response ? (
                <div className="mt-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3">
                  <div className="text-xs font-semibold text-[#D4AF37]">
                    Counselor Response Sent
                  </div>

                  <div className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                    {request.counselor_response}
                  </div>

                  {request.responded_at ? (
                    <div className="mt-2 text-xs text-white/40">
                      Responded: {new Date(request.responded_at).toLocaleString()}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
<div className="mt-3 text-xs text-white/40">
              {request.created_at
                ? new Date(request.created_at).toLocaleString()
                : "Unknown"}

              {request.resolved_at ? (
                <div className="mt-1 text-emerald-300">
                  Resolved: {new Date(request.resolved_at).toLocaleString()}
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
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
                className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/40"
                placeholder="Write the response the student will see in their portal."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingSupportResponseId === request.id}
                  onClick={() => handleSupportResponseSubmit(request)}
                  className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
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
    className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
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
    className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
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
    className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
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
    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {savingSupportResponseId === request.id ? "Updating..." : "Reopen"}
  </button>

</div>
            <div className="mt-3 text-xs text-white/40">
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
            </main>
          </div>
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
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    danger: "border-red-400/20 bg-red-500/10 text-red-300",
    warning: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    muted: "border-white/10 bg-white/[0.035] text-white/75",
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-white/75">{value}</p>
    </div>
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