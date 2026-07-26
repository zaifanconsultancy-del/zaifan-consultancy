// StudentDetailModal V25 SHELL MAXIMUM — Unified Student OS Command Workspace
// Full replacement built from V14.
// Major upgrades:
// - fixes the Lucide Map / native JavaScript Map constructor collision
// - preserves existing Supabase, CRM timeline, portal, permissions and lazy panel architecture
// - removes the oversized blue/document-governance presentation from Student Master File
// - makes the live StudentDocumentsPanel the primary document workspace
// - removes the heavy scoped !important readability guard in favor of explicit Tailwind styling
// - keeps StudentDocumentsPanel as the connected live backend operations layer
// - upgrades Student 360 overview and navigation without shrinking the mature file
// - student identity is now student_id + student_type, not the object reference
// - prevents stale Student OS / portal requests from overwriting a newly opened student
// - strict typed-table loading: no silent cross-type fallback when a typed query returns zero rows
// - partial Student OS source failures are isolated instead of collapsing the entire modal
// - child save refreshes remain soft/no-blink; hard remount remains manual/identity-only
// - inquiry pipeline stages are never shown as saved unless a persistence handler exists
// - portal account loading is type-safe and no longer searches both inquiry + appointment by default
// - removes the insecure default temporary password and adds secure local password generation
// - portal password fields use password inputs and stronger validation
// - mobile/desktop state remains persistent while live Student OS data refreshes

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const StudentSupportDeskPanel = lazy(() => import("./StudentSupportDeskPanel"));
import * as studentPortalApi from "../../lib/studentPortal";

import {
  getPipelineStages,
  getPipelineStageById,
  getPipelineProgress,
} from "../../data/crmPipelineConfig";

const PRIORITY_OPTIONS = ["vip", "high", "medium", "low"];

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
  const [osSourceHealth, setOsSourceHealth] = useState({});
  const osRequestRef = useRef(0);
  const portalRequestRef = useRef(0);
  const studentIdentityRef = useRef("");
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
    temporaryPassword: "",
    resetPassword: "",
    forcePasswordChange: true,
  });
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

  const generateSecurePortalPassword = useCallback(() => {
    const alphabet =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const values = new Uint32Array(16);

    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      for (let index = 0; index < values.length; index += 1) {
        values[index] = Math.floor(Math.random() * 0xffffffff);
      }
    }

    const password = Array.from(values)
      .map((value) => alphabet[value % alphabet.length])
      .join("");

    setPortalAccountForm((prev) => ({
      ...prev,
      temporaryPassword: password,
      resetPassword: "",
      forcePasswordChange: true,
    }));

    setPortalAccountStatus({
      type: "info",
      message:
        "A strong temporary password was generated locally. It has not been saved or sent anywhere yet.",
    });
  }, []);

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

    const requestId = portalRequestRef.current + 1;
    portalRequestRef.current = requestId;
    setPortalAccountLoading(true);

    try {
      const result = await studentPortalApi.fetchStudentPortalAccountForStudent({
        ...workingStudent,
        id: studentId,
        student_type: studentType,
        person_id: personId || workingStudent?.person_id || null,
      });

      if (portalRequestRef.current !== requestId) return null;

      if (result?.error) throw result.error;

      const account = normalizePortalAccount(result?.account || null);

      setPortalAccount(account);
      setPortalAccountForm((prev) => ({
        ...prev,
        email: account?.email || studentEmail || prev.email,
      }));

      return account;
    } catch (error) {
      if (portalRequestRef.current !== requestId) return null;

      console.warn("Portal account failed to load:", error?.message || error);
      setPortalAccount(null);
      setPortalAccountStatus((prev) =>
        prev.message
          ? prev
          : {
              type: "warning",
              message:
                error?.message ||
                "Portal account could not be loaded for this permanent student identity.",
            }
      );
      return null;
    } finally {
      if (portalRequestRef.current === requestId) {
        setPortalAccountLoading(false);
      }
    }
  }, [
    normalizePortalAccount,
    personId,
    studentEmail,
    studentId,
    studentType,
    workingStudent,
  ]);

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
      personId,
      person_id: personId || workingStudent?.person_id || null,
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

      if (!passwordToUse || passwordToUse.length < 10) {
        setPortalAccountStatus({
          type: "warning",
          message: "Temporary password must be at least 10 characters.",
        });
        return;
      }

      if (
        !/[A-Z]/.test(passwordToUse) ||
        !/[a-z]/.test(passwordToUse) ||
        !/[0-9]/.test(passwordToUse)
      ) {
        setPortalAccountStatus({
          type: "warning",
          message:
            "Temporary password must include uppercase, lowercase, and a number.",
        });
        return;
      }
    }

    if (
      action === "deactivate" &&
      !window.confirm(
        `Deactivate ${fullName}'s student portal account? The student will be unable to log in until it is activated again.`
      )
    ) {
      return;
    }

    if (
      action === "reset" &&
      !window.confirm(
        `Reset ${fullName}'s portal password now? Their previous password will stop working.`
      )
    ) {
      return;
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
          person_id: personId || null,
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

    const requestId = osRequestRef.current + 1;
    osRequestRef.current = requestId;

    setOsLoading(true);
    setOsError("");

    const idVariants = getStudentIdVariants();
    const typeVariants = [...new Set(getStudentTypeVariants())];

    let identitySources = [];

    try {
      identitySources = await studentPortalApi.getStudentIdentitySources({
        ...workingStudent,
        id: studentId,
        student_type: studentType,
        person_id: personId || workingStudent?.person_id || null,
      });
    } catch (identityError) {
      console.warn(
        "Permanent identity sources could not be resolved; using current source only.",
        identityError?.message || identityError
      );
    }

    const sourceReferences =
      Array.isArray(identitySources) && identitySources.length
        ? identitySources.map((source) => ({
            id: source.student_id ?? source.id,
            type: normalize(source.student_type || "inquiry"),
          }))
        : idVariants.flatMap((idValue) =>
            (typeVariants.length ? typeVariants : [studentType]).map(
              (typeValue) => ({
                id: idValue,
                type: normalize(typeValue),
              })
            )
          );

    const uniqueSourceReferences = Array.from(
      new Map(
        sourceReferences
          .filter((item) => item.id !== null && item.id !== undefined && item.id !== "")
          .map((item) => [
            `${item.type}:${String(item.id)}`,
            item,
          ])
      ).values()
    );

    const isMissingStudentTypeColumn = (error) => {
      const message = String(error?.message || "").toLowerCase();
      return (
        message.includes("student_type") &&
        (message.includes("column") ||
          message.includes("does not exist") ||
          message.includes("schema cache"))
      );
    };

    const fetchByStudentId = async (table, options = {}) => {
      const {
        select = "*",
        orderBy = "created_at",
        ascending = false,
        limit = null,
        matchStudentType = false,
        allowLegacyWithoutStudentType = false,
      } = options;

      const runQueries = async (typed) => {
        const attempts = uniqueSourceReferences.map(({ id: idValue, type: sourceType }) => {
          let query = supabase.from(table).select(select).eq("student_id", idValue);

          if (typed && sourceType) {
            query = query.eq("student_type", sourceType);
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
        const rows = results.flatMap((result) => result.data || []);
        const errors = results
          .map((result) => result.error)
          .filter(Boolean);

        return { rows, errors };
      };

      let result = await runQueries(matchStudentType);

      if (
        matchStudentType &&
        allowLegacyWithoutStudentType &&
        result.errors.length &&
        result.rows.length === 0 &&
        result.errors.every(isMissingStudentTypeColumn)
      ) {
        result = await runQueries(false);
      }

      if (result.errors.length && result.rows.length === 0) {
        throw result.errors[0];
      }

      return Array.from(
        new Map(
          result.rows.map((item) => [item.id || JSON.stringify(item), item])
        ).values()
      );
    };

    const sources = [
      {
        key: "support",
        run: () =>
          fetchByStudentId("student_support_requests", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "documents",
        run: () =>
          fetchByStudentId("student_documents", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "applications",
        run: () =>
          fetchByStudentId("student_applications", {
            orderBy: "created_at",
            ascending: false,
            limit: 10,
            matchStudentType: true,
            allowLegacyWithoutStudentType: false,
          }),
      },
      {
        key: "universities",
        run: () =>
          fetchByStudentId("student_universities", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "tasks",
        run: () =>
          fetchByStudentId("student_tasks", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "communications",
        run: () =>
          fetchByStudentId("student_communications", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "invoices",
        run: () =>
          fetchByStudentId("student_invoices", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "payments",
        run: () =>
          fetchByStudentId("student_payments", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "receipts",
        run: () =>
          fetchByStudentId("student_receipts", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
      {
        key: "paymentRequests",
        run: () =>
          fetchByStudentId("counselor_payment_requests", {
            orderBy: "created_at",
            ascending: false,
            matchStudentType: true,
            allowLegacyWithoutStudentType: true,
          }),
      },
    ];

    try {
      const settled = await Promise.allSettled(
        sources.map((source) => source.run())
      );

      if (osRequestRef.current !== requestId) return;

      const values = {};
      const health = {};
      const failures = [];

      settled.forEach((result, index) => {
        const key = sources[index].key;

        if (result.status === "fulfilled") {
          values[key] = result.value || [];
          health[key] = "ready";
        } else {
          values[key] = null;
          health[key] = "error";
          failures.push({
            key,
            message:
              result.reason?.message ||
              `${key} source failed.`,
          });
        }
      });

      setOsSourceHealth(health);

      if (values.documents !== null) {
        setStudentDocuments(values.documents);
      }

      if (values.applications !== null) {
        setStudentApplication(values.applications?.[0] || null);
      }

      if (values.universities !== null) {
        setStudentUniversities(values.universities);
      }

      if (values.tasks !== null) {
        setStudentTasks(values.tasks);
      }

      if (values.communications !== null) {
        setStudentCommunications(values.communications);
      }

      if (values.invoices !== null) {
        setStudentInvoices(values.invoices);
      }

      if (values.payments !== null) {
        setStudentPayments(values.payments);
      }

      if (values.receipts !== null) {
        setStudentReceipts(values.receipts);
      }

      if (values.paymentRequests !== null) {
        setStudentPaymentRequests(values.paymentRequests);
      }

      if (values.support !== null) {
        setStudentSupportRequests(values.support);
      }

      if (failures.length) {
        setOsError(
          `Some Student OS sources could not refresh: ${failures
            .map((item) => item.key)
            .join(", ")}. Existing data was preserved for failed sources.`
        );
      }
    } catch (error) {
      if (osRequestRef.current !== requestId) return;

      console.error("Student OS data failed to load:", error);
      setOsError(error.message || "Student OS data failed to load.");
    } finally {
      if (osRequestRef.current === requestId) {
        setOsLoading(false);
      }
    }
  }, [
    getStudentIdVariants,
    getStudentTypeVariants,
    personId,
    studentId,
    studentType,
    workingStudent,
  ]);

  useEffect(() => {
    if (!studentIdentity) return;

    if (studentIdentityRef.current === studentIdentity) return;

    studentIdentityRef.current = studentIdentity;
    osRequestRef.current += 1;
    portalRequestRef.current += 1;

    setLocalStudent(student);
    setActivePanel(student?.__preferredPanel || "ai-workspace");
    setMobileNavOpen(false);

    setOsLoading(false);
    setOsError("");
    setOsSourceHealth({});
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
      temporaryPassword: "",
      resetPassword: "",
      forcePasswordChange: true,
    });

    setPanelMountKey((prev) => prev + 1);
  }, [studentIdentity]);

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

  useEffect(() => {
    loadStudentOsData();
  }, [loadStudentOsData]);

  useEffect(() => {
    loadPortalAccount();
  }, [loadPortalAccount]);

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

  const priorityOptions = PRIORITY_OPTIONS;

  const statusOptions = useMemo(
    () =>
      isAppointment
        ? ["pending", "confirmed", "completed", "cancelled"]
        : ["pending", "contacted", "completed"],
    [isAppointment]
  );

  const sidebarGroups = useMemo(() => [
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
  ], []);

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
        studentType,
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
        studentType,
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
    if (!stageId || stageId === currentStageId || savingStage) return;

    const persistenceHandler = isAppointment
      ? updateAppointmentStage
      : updateInquiryStage;

    if (typeof persistenceHandler !== "function") {
      alert(
        `${isAppointment ? "Appointment" : "Inquiry"} pipeline-stage persistence is not connected yet. No local-only stage change was applied.`
      );
      return;
    }

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
      await persistenceHandler(workingStudent.id, stageId);

      await addTimelineEvent({
        studentId: workingStudent.id,
        studentType,
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

  const openSupportRequests = useMemo(
    () =>
      studentSupportRequests.filter(
        (request) =>
          !["resolved", "closed"].includes(
            String(request.status || "open").toLowerCase()
          )
      ).length,
    [studentSupportRequests]
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
          className={`zaifan-student-os-v24 flex h-[96dvh] max-h-[96dvh] w-full max-w-[1680px] flex-col overflow-hidden overscroll-contain touch-pan-y rounded-[1.45rem] border-[3px] border-[#F97316] bg-[#FFF8EE] text-[#152238] shadow-[0_36px_140px_rgba(15,23,42,0.42)] sm:rounded-[2rem] ${cardClass}`}
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
                <div className="hidden min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#F5F9FF] px-3 text-sm font-black text-[#173F6B] 2xl:inline-flex">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#173F6B] text-white">
                    <ActivePanelIcon size={14} />
                  </span>
                  <span className="max-w-[170px] truncate">{activePanelDefinition.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3.5 text-sm font-black text-[#173F6B] transition hover:border-orange-300 hover:bg-[#FFF4E8] lg:hidden"
                >
                  <Menu size={16} />
                  Modules
                </button>

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
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#173F6B] transition duration-300 hover:border-[#F97316] hover:bg-[#FFF4E8] hover:text-orange-700 disabled:opacity-50"
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
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#173F6B] transition duration-300 hover:border-[#173F6B] hover:bg-[#F2F7FF]"
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

          <div className="shrink-0 border-b-[3px] border-[#D7E1EB] bg-[#FFF8EE] px-4 py-2.5 sm:px-6">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
              <Student360Metric label="Profile readiness" value={`${profileReadiness}%`} icon={BadgeCheck} tone="orange" />
              <Student360Metric label="Pipeline" value={`${pipelineProgress || 0}%`} icon={Target} tone="blue" />
              <Student360Metric label="Documents" value={`${verifiedDocuments}/${studentDocuments.length}`} icon={FolderOpen} tone="emerald" />
              <Student360Metric label="Tasks done" value={`${completedTasks}/${studentTasks.length}`} icon={ClipboardCheck} tone="violet" />
              <Student360Metric label="Universities" value={studentUniversities.length} icon={Building2} tone="blue" />
              <Student360Metric label="Open support" value={openSupportRequests} icon={LifeBuoy} tone="red" />
              <Student360Metric label="Portal" value={portalAccount?.is_active ? "Active" : portalAccount ? "Paused" : "Not set"} icon={LockKeyhole} tone={portalAccount?.is_active ? "emerald" : "slate"} />
            </div>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[292px_minmax(0,1fr)]">
            <aside className={`zaifan-student-nav min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] border-b-[3px] border-[#D7E1EB] bg-[#FFF9F2] p-3.5 lg:block lg:border-b-0 lg:border-r-[3px] lg:border-[#D7E1EB] ${mobileNavOpen ? "block" : "hidden"}`}>
              <div className="mb-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={panelSearch}
                    onChange={(event) => setPanelSearch(event.target.value)}
                    placeholder="Search Student OS modules..."
                    className="w-full rounded-xl border-2 border-[#B9C9D9] bg-white py-3 pl-10 pr-3 text-sm font-semibold text-[#152238] outline-none placeholder:font-medium placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredSidebarGroups.map((group) => (
                  <div key={group.title}>
                    <div className="mb-2 flex items-center gap-3 px-1">
                      <div className="h-px flex-1 bg-[#D7E1EB]" />
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                        {group.title}
                      </p>
                      <div className="h-px flex-1 bg-[#D7E1EB]" />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                      {group.items.map(([id, label, description, Icon]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setActivePanel(id); setMobileNavOpen(false); }}
                          className={`w-full min-w-0 rounded-[1rem] border-2 px-3 py-2.5 text-left transition sm:px-4 ${
                            activePanel === id
                              ? "border-[#D94F08] bg-[#E96512] text-white shadow-[0_8px_18px_rgba(249,115,22,0.20)]"
                              : "border-[#C9D7E6] bg-white text-[#24324a] shadow-[0_3px_10px_rgba(15,23,42,0.04)] hover:border-[#F97316] hover:bg-[#FFF4E8] hover:text-[#152238]"
                          }`}
                        >
                          <span className="flex items-center gap-3 text-xs font-semibold sm:text-sm">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              activePanel === id
                                ? "border border-white/30 bg-white/15 text-white"
                                : "border border-[#D1DCE7] bg-[#FFF8EE] text-[#315B88]"
                            }`}>
                              <Icon size={15} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{label}</span>
                              <span className="mt-0.5 hidden truncate text-[10px] font-medium opacity-60 sm:block">{description}</span>
                            </span>
                            <ChevronRight size={14} className="shrink-0 opacity-40" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[1.1rem] border-2 border-[#F97316] bg-[#FFFDF8] p-3.5 shadow-[0_5px_14px_rgba(15,35,63,0.04)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Current Journey
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

            <main className="zaifan-student-main min-h-0 min-w-0 overscroll-contain overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] bg-[#fffdfa] p-3 pb-20 sm:p-5 sm:pb-24 xl:p-6 xl:pb-28">
              <div
                className={`zaifan-panel-surface zaifan-admin-contrast-surface ${
                  ["ai-workspace", "gpt-intelligence", "ai", "executive-ai"].includes(activePanel)
                    ? "zaifan-ai-panel-surface"
                    : ""
                }`}
              >
              <Suspense fallback={<StudentPanelLoader />}>
              {activePanel === "overview" ? (() => {
                const cleanTaskStatus = (value = "") =>
                  String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

                const nowMs = Date.now();

                const activeTasks = studentTasks.filter(
                  (task) =>
                    !["completed", "done", "cancelled", "archived"].includes(
                      cleanTaskStatus(task?.status)
                    ) && !task?.is_archived
                );

                const overdueTasks = activeTasks.filter((task) => {
                  if (!task?.due_date) return false;
                  const dueMs = new Date(task.due_date).getTime();
                  return Number.isFinite(dueMs) && dueMs < nowMs;
                });

                const blockedTasks = activeTasks.filter(
                  (task) => cleanTaskStatus(task?.status) === "blocked"
                );

                const urgentTasks = activeTasks.filter((task) =>
                  ["critical", "urgent", "high"].includes(
                    cleanTaskStatus(task?.priority)
                  )
                );

                const openInvoices = studentInvoices.filter(
                  (invoice) =>
                    !["paid", "cancelled", "void"].includes(
                      cleanTaskStatus(invoice?.status)
                    )
                );

                const totalOutstanding = openInvoices.reduce((sum, invoice) => {
                  const explicitOutstanding = Number(invoice?.outstanding_amount);
                  if (Number.isFinite(explicitOutstanding)) {
                    return sum + Math.max(0, explicitOutstanding);
                  }

                  const total = Number(
                    invoice?.total_amount ?? invoice?.amount ?? 0
                  );
                  const paid = Number(invoice?.paid_amount ?? 0);

                  return (
                    sum +
                    Math.max(
                      0,
                      (Number.isFinite(total) ? total : 0) -
                        (Number.isFinite(paid) ? paid : 0)
                    )
                  );
                }, 0);

                const applicationStatus =
                  studentApplication?.application_status ||
                  studentApplication?.status ||
                  "Not started";

                const offerStatus =
                  studentApplication?.offer_status || "No offer yet";

                const visaStatus =
                  studentApplication?.visa_status || "Not started";

                const selectedUniversity =
                  studentApplication?.university ||
                  studentApplication?.university_name ||
                  studentApplication?.source_university_name ||
                  studentUniversities?.[0]?.university ||
                  studentUniversities?.[0]?.name ||
                  "Not selected";

                const intake =
                  studentApplication?.intake ||
                  studentUniversities?.[0]?.intake ||
                  "Not assigned";

                const ownerName =
                  workingStudent?.assigned_admin_name ||
                  workingStudent?.assigned_to_name ||
                  workingStudent?.counselor_name ||
                  "Open ownership panel";

                const portalLabel = portalAccount
                  ? portalAccount.is_active
                    ? "Active"
                    : "Paused"
                  : "Not created";

                const portalNeedsAction =
                  !portalAccount ||
                  !portalAccount.is_active ||
                  portalAccount.must_change_password;

                const attentionSignals = [
                  documentStatusSummary.rejected > 0
                    ? {
                        id: "rejected-documents",
                        title: `${documentStatusSummary.rejected} rejected document${
                          documentStatusSummary.rejected === 1 ? "" : "s"
                        }`,
                        text: "Open the Student Master File and replace or verify the affected records.",
                        panel: "documents",
                        tone: "danger",
                      }
                    : null,
                  documentStatusSummary.expired > 0
                    ? {
                        id: "expired-documents",
                        title: `${documentStatusSummary.expired} expired document${
                          documentStatusSummary.expired === 1 ? "" : "s"
                        }`,
                        text: "Fresh evidence is required before this case should move forward.",
                        panel: "documents",
                        tone: "warning",
                      }
                    : null,
                  overdueTasks.length > 0
                    ? {
                        id: "overdue-tasks",
                        title: `${overdueTasks.length} overdue task${
                          overdueTasks.length === 1 ? "" : "s"
                        }`,
                        text: "Clear overdue operational work before deadlines create downstream risk.",
                        panel: "operations",
                        tone: "danger",
                      }
                    : null,
                  blockedTasks.length > 0
                    ? {
                        id: "blocked-tasks",
                        title: `${blockedTasks.length} blocked task${
                          blockedTasks.length === 1 ? "" : "s"
                        }`,
                        text: "Resolve the blocker or reassign the task so the case can continue.",
                        panel: "operations",
                        tone: "danger",
                      }
                    : null,
                  openSupportRequests > 0
                    ? {
                        id: "support",
                        title: `${openSupportRequests} open support request${
                          openSupportRequests === 1 ? "" : "s"
                        }`,
                        text: "The student is waiting for Zaifan support or counselor action.",
                        panel: "support-requests",
                        tone: "warning",
                      }
                    : null,
                  !studentApplication
                    ? {
                        id: "application",
                        title: "No application case connected",
                        text: "Create or connect an application when the shortlist is ready.",
                        panel: "applications",
                        tone: "warning",
                      }
                    : null,
                  studentUniversities.length === 0
                    ? {
                        id: "universities",
                        title: "University shortlist is empty",
                        text: "Add realistic dream, target and safe options before application planning.",
                        panel: "universities",
                        tone: "warning",
                      }
                    : null,
                  portalNeedsAction
                    ? {
                        id: "portal",
                        title: !portalAccount
                          ? "Student portal not created"
                          : !portalAccount.is_active
                            ? "Student portal is paused"
                            : "Student must change portal password",
                        text: "Review Student Portal access and security state.",
                        panel: "portal-account",
                        tone: "info",
                      }
                    : null,
                  totalOutstanding > 0
                    ? {
                        id: "finance",
                        title: "Outstanding finance balance",
                        text: `${studentInvoices.length} invoice${
                          studentInvoices.length === 1 ? "" : "s"
                        } on file with an unpaid balance requiring review.`,
                        panel: "payments",
                        tone: "warning",
                      }
                    : null,
                ].filter(Boolean);

                const criticalAttention = attentionSignals.filter(
                  (item) => item.tone === "danger"
                ).length;

                const attentionLabel =
                  criticalAttention > 0
                    ? `${criticalAttention} critical`
                    : attentionSignals.length > 0
                      ? `${attentionSignals.length} to review`
                      : "Case clear";

                const formatMoney = (amount) => {
                  const value = Number(amount || 0);
                  if (!Number.isFinite(value)) return "PKR 0";
                  return `PKR ${value.toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })}`;
                };

                const commandCards = [
                  {
                    label: "Documents",
                    value: `${verifiedDocuments}/${studentDocuments.length}`,
                    helper:
                      documentStatusSummary.attention > 0
                        ? `${documentStatusSummary.attention} need attention`
                        : "Vault health clear",
                    icon: FolderOpen,
                    panel: "documents",
                    accent: "navy",
                  },
                  {
                    label: "Application",
                    value: String(applicationStatus).replace(/_/g, " "),
                    helper: String(offerStatus).replace(/_/g, " "),
                    icon: GraduationCap,
                    panel: "applications",
                    accent: "orange",
                  },
                  {
                    label: "Universities",
                    value: studentUniversities.length,
                    helper: selectedUniversity,
                    icon: Building2,
                    panel: "universities",
                    accent: "cream",
                  },
                  {
                    label: "Tasks",
                    value: `${completedTasks}/${studentTasks.length}`,
                    helper:
                      overdueTasks.length > 0
                        ? `${overdueTasks.length} overdue`
                        : `${activeTasks.length} active`,
                    icon: ClipboardCheck,
                    panel: "operations",
                    accent: "cream",
                  },
                  {
                    label: "Support",
                    value: openSupportRequests,
                    helper:
                      openSupportRequests > 0 ? "Needs response" : "Queue clear",
                    icon: LifeBuoy,
                    panel: "support-requests",
                    accent: "cream",
                  },
                  {
                    label: "Finance",
                    value:
                      totalOutstanding > 0
                        ? formatMoney(totalOutstanding)
                        : "Clear",
                    helper: `${studentPayments.length} payment${
                      studentPayments.length === 1 ? "" : "s"
                    } recorded`,
                    icon: WalletCards,
                    panel: "payments",
                    accent: totalOutstanding > 0 ? "orange" : "navy",
                  },
                ];

                const actionCards = [
                  {
                    label: "Master File",
                    text: "Documents, evidence and permanent case vault",
                    icon: FolderKey,
                    panel: "documents",
                  },
                  {
                    label: "Applications",
                    text: "University application workflow and offer tracking",
                    icon: GraduationCap,
                    panel: "applications",
                  },
                  {
                    label: "Visa",
                    text: "Visa readiness, requirements and risk workflow",
                    icon: MapIcon,
                    panel: "visa",
                  },
                  {
                    label: "Task Command",
                    text: "Deadlines, ownership, blockers and next actions",
                    icon: ListChecks,
                    panel: "operations",
                  },
                  {
                    label: "Support Desk",
                    text: "Student requests, counselor response and resolution",
                    icon: LifeBuoy,
                    panel: "support-requests",
                  },
                  {
                    label: "Timeline",
                    text: "Permanent Student Journey and CRM audit history",
                    icon: History,
                    panel: "timeline",
                  },
                ];

                return (
                  <div className="space-y-5">
                    <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.08)]">
                      <div className="grid xl:grid-cols-[1.25fr_0.75fr]">
                        <div className="bg-[#123865] p-5 text-white sm:p-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                              Student Command Center
                            </span>

                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                              {isAppointment ? "Appointment Case" : "Inquiry Case"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                            {fullName}
                          </h3>

                          <p className="mt-2 max-w-3xl text-sm leading-6 text-white">
                            One operational view for identity, readiness, applications,
                            documents, finance, portal access, tasks, support and next actions.
                          </p>

                          <div className="mt-5 grid gap-2 sm:grid-cols-4">
                            <CommandHeroStat
                              label="Profile Ready"
                              value={`${profileReadiness}%`}
                            />
                            <CommandHeroStat
                              label="Pipeline"
                              value={`${pipelineProgress || 0}%`}
                            />
                            <CommandHeroStat
                              label="Stage"
                              value={currentStage?.label || "Stage"}
                            />
                            <CommandHeroStat
                              label="Owner"
                              value={ownerName}
                            />
                          </div>
                        </div>

                        <div className="bg-orange-500 p-5 text-white sm:p-6">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                            Needs Attention Now
                          </p>

                          <p className="mt-3 text-4xl font-black text-white">
                            {attentionSignals.length}
                          </p>

                          <p className="mt-1 text-sm font-black text-white">
                            {attentionLabel}
                          </p>

                          <p className="mt-3 text-sm leading-6 text-white">
                            {attentionSignals.length
                              ? "Open the flagged modules below and clear blockers before moving the case forward."
                              : "No immediate operational blockers were detected from the currently loaded Student OS data."}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setActivePanel(
                                attentionSignals[0]?.panel || "analytics"
                              )
                            }
                            className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white px-4 py-2.5 text-xs font-black text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
                          >
                            {attentionSignals.length
                              ? "Open Highest Priority"
                              : "Open Student Analytics"}
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                      {commandCards.map((card) => {
                        const Icon = card.icon;

                        const className =
                          card.accent === "navy"
                            ? "border-[#123865] bg-[#123865] text-white"
                            : card.accent === "orange"
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-orange-300 bg-white text-[#10233f]";

                        return (
                          <button
                            key={card.label}
                            type="button"
                            onClick={() => setActivePanel(card.panel)}
                            className={`group rounded-[1.35rem] border-[3px] p-4 text-left shadow-[0_5px_16px_rgba(15,35,63,0.04)] transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,35,63,0.10)] ${className}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  card.accent === "navy" ||
                                  card.accent === "orange"
                                    ? "border border-white/20 bg-white/10 text-white"
                                    : "border-2 border-orange-200 bg-orange-50 text-orange-700"
                                }`}
                              >
                                <Icon size={15} />
                              </span>

                              <ChevronRight
                                size={14}
                                className="opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                              />
                            </div>

                            <p
                              className={`mt-3 text-[8px] font-black uppercase tracking-[0.13em] ${
                                card.accent === "navy" ||
                                card.accent === "orange"
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {card.label}
                            </p>

                            <p
                              className={`mt-1 break-words text-lg font-black capitalize ${
                                card.accent === "navy" ||
                                card.accent === "orange"
                                  ? "text-white"
                                  : "text-[#10233f]"
                              }`}
                            >
                              {card.value}
                            </p>

                            <p
                              className={`mt-1 line-clamp-2 text-[10px] font-semibold leading-4 ${
                                card.accent === "navy" ||
                                card.accent === "orange"
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {card.helper}
                            </p>
                          </button>
                        );
                      })}
                    </section>

                    {attentionSignals.length ? (
                      <section className="rounded-[1.7rem] border-[3px] border-red-300 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-red-700">
                              Intervention Queue
                            </p>
                            <h3 className="mt-1 text-xl font-black text-[#10233f]">
                              What needs attention before this case moves?
                            </h3>
                          </div>

                          <span className="rounded-full border-2 border-red-300 bg-red-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-red-800">
                            {attentionSignals.length} signal
                            {attentionSignals.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                          {attentionSignals.slice(0, 6).map((signal) => {
                            const danger = signal.tone === "danger";

                            return (
                              <button
                                key={signal.id}
                                type="button"
                                onClick={() => setActivePanel(signal.panel)}
                                className={`group rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                                  danger
                                    ? "border-red-300 bg-red-50"
                                    : signal.tone === "info"
                                      ? "border-blue-300 bg-blue-50"
                                      : "border-orange-300 bg-orange-50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
                                      danger
                                        ? "border-red-300 text-red-700"
                                        : signal.tone === "info"
                                          ? "border-blue-300 text-blue-700"
                                          : "border-orange-300 text-orange-700"
                                    }`}
                                  >
                                    <CircleAlert size={15} />
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block font-black text-[#10233f]">
                                      {signal.title}
                                    </span>
                                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-600">
                                      {signal.text}
                                    </span>
                                  </span>

                                  <ChevronRight
                                    size={15}
                                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-600"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ) : (
                      <section className="rounded-[1.7rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
                            <CheckCircle2 size={18} />
                          </span>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">
                              Operational Health
                            </p>
                            <h3 className="mt-1 text-lg font-black text-[#10233f]">
                              No immediate blockers detected
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Continue normal counselor review and use Student Analytics
                              for deeper journey intelligence.
                            </p>
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[1.7rem] border-[3px] border-[#123865] bg-white p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                              Case Identity
                            </p>
                            <h3 className="mt-1 text-xl font-black text-[#10233f]">
                              Student Master Record
                            </h3>
                          </div>

                          <span className="rounded-full border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                            {studentType}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {infoRows.map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl border-2 border-slate-200 bg-[#fffaf4] p-3"
                            >
                              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                                {label}
                              </p>
                              <p className="mt-1 break-words text-sm font-black text-[#10233f]">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {isAppointment ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {appointmentRows.map(([label, value]) => (
                              <div
                                key={label}
                                className="rounded-xl border-2 border-orange-300 bg-orange-50 p-3"
                              >
                                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
                                  {label}
                                </p>
                                <p className="mt-1 break-words text-xs font-black text-[#10233f]">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-[1.7rem] border-[3px] border-orange-500 bg-orange-500 p-5 text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                          Academic Route
                        </p>

                        <h3 className="mt-2 text-xl font-black text-white">
                          {selectedUniversity}
                        </h3>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <CommandOrangeStat
                            label="Application"
                            value={String(applicationStatus).replace(/_/g, " ")}
                          />
                          <CommandOrangeStat
                            label="Offer"
                            value={String(offerStatus).replace(/_/g, " ")}
                          />
                          <CommandOrangeStat
                            label="Visa"
                            value={String(visaStatus).replace(/_/g, " ")}
                          />
                          <CommandOrangeStat label="Intake" value={intake} />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setActivePanel("applications")}
                            className="rounded-xl border-2 border-white/40 bg-white px-3 py-2 text-xs font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                          >
                            Open Application
                          </button>

                          <button
                            type="button"
                            onClick={() => setActivePanel("universities")}
                            className="rounded-xl border-2 border-white/40 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                          >
                            Open Universities
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-[1.65rem] border-[3px] border-orange-300 bg-white p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                          Document Readiness
                        </p>
                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-3xl font-black text-[#10233f]">
                              {documentHealthScore}%
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {verifiedDocuments} verified ·{" "}
                              {documentStatusSummary.pending} pending
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActivePanel("documents")}
                            className="rounded-xl border-2 border-orange-300 bg-orange-50 px-3 py-2 text-xs font-black text-orange-800 transition hover:bg-orange-100"
                          >
                            Master File
                          </button>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all duration-500"
                            style={{ width: `${documentHealthScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-[1.65rem] border-[3px] border-[#123865] bg-[#123865] p-5 text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
                          Portal & Communication
                        </p>
                        <p className="mt-3 text-2xl font-black text-white">
                          {portalLabel}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-white">
                          {studentCommunications.length} communication
                          {studentCommunications.length === 1 ? "" : "s"} logged
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setActivePanel("portal-account")}
                            className="rounded-xl border-2 border-white/30 bg-white px-3 py-2 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-orange-50"
                          >
                            Portal Access
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePanel("communication")}
                            className="rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                          >
                            Communications
                          </button>
                        </div>
                      </div>

                      <div className="rounded-[1.65rem] border-[3px] border-orange-300 bg-white p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                          Finance Health
                        </p>
                        <p className="mt-3 text-2xl font-black text-[#10233f]">
                          {totalOutstanding > 0
                            ? formatMoney(totalOutstanding)
                            : "No outstanding balance"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {studentInvoices.length} invoices ·{" "}
                          {studentReceipts.length} receipts ·{" "}
                          {studentPayments.length} payments
                        </p>

                        <button
                          type="button"
                          onClick={() => setActivePanel("payments")}
                          className="mt-4 rounded-xl border-2 border-orange-400 bg-orange-500 px-3 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                        >
                          Open Finance Center
                        </button>
                      </div>
                    </section>

                    <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-[#fff8ee] p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                            Counselor Control
                          </p>
                          <h3 className="mt-1 text-xl font-black text-[#10233f]">
                            Pipeline, Priority & CRM Status
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Keep the student's operational state current without
                            leaving the Command Overview.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActivePanel("assignment")}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <UsersRound size={14} />
                          Ownership
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <div className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                              Journey Stage
                            </p>
                            {savingStage ? (
                              <span className="text-[10px] font-bold text-orange-700">
                                Saving...
                              </span>
                            ) : null}
                          </div>

                          <select
                            value={currentStageId || ""}
                            onChange={(event) =>
                              handleStageChange(event.target.value)
                            }
                            disabled={savingStage}
                            className="mt-3 w-full rounded-xl border-2 border-slate-300 bg-[#fffaf4] px-3 py-2.5 text-sm font-black text-[#10233f] outline-none transition focus:border-orange-400 disabled:opacity-50"
                          >
                            {stages.map((stage) => (
                              <option key={stage.id} value={stage.id}>
                                {stage.label}
                              </option>
                            ))}
                          </select>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-orange-500 transition-all duration-500"
                              style={{ width: `${pipelineProgress || 0}%` }}
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                              Priority
                            </p>
                            {savingPriority ? (
                              <span className="text-[10px] font-bold text-orange-700">
                                Saving...
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {priorityOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                disabled={
                                  !safePermissions.canUpdatePriority ||
                                  savingPriority
                                }
                                onClick={() => handlePriorityChange(item)}
                                className={`rounded-xl border-2 px-3 py-2 text-xs font-black capitalize transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                                  priority === item
                                    ? getPriorityStyle(item)
                                    : "border-slate-300 bg-[#fffaf4] text-[#10233f] hover:border-orange-400 hover:bg-orange-50"
                                }`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border-2 border-slate-300 bg-white p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                              CRM Status
                            </p>
                            {savingStatus ? (
                              <span className="text-[10px] font-bold text-orange-700">
                                Saving...
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {statusOptions.map((item) => (
                              <button
                                key={item}
                                type="button"
                                disabled={
                                  !safePermissions.canUpdateStatus || savingStatus
                                }
                                onClick={() => handleStatusChange(item)}
                                className={`rounded-xl border-2 px-3 py-2 text-xs font-black capitalize transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                                  status === item
                                    ? getStatusStyle(item)
                                    : "border-slate-300 bg-[#fffaf4] text-[#10233f] hover:border-orange-400 hover:bg-orange-50"
                                }`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
                      <div className="rounded-[1.7rem] border-[3px] border-[#123865] bg-[#123865] p-5 text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
                          Counselor Context
                        </p>
                        <h3 className="mt-2 text-xl font-black text-white">
                          Notes / Student Message
                        </h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white">
                          {notes}
                        </p>
                      </div>

                      <div className="rounded-[1.7rem] border-[3px] border-orange-500 bg-orange-500 p-5 text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                          Real GPT Counselor Desk
                        </p>
                        <h3 className="mt-2 text-xl font-black text-white">
                          Generate only when human-ready output is useful.
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white">
                          Open the connected GPT workspace for summaries, email,
                          WhatsApp, call scripts, visa reasoning and follow-up plans.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActivePanel("ai-workspace")}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white px-4 py-2.5 text-xs font-black text-orange-700 transition hover:-translate-y-0.5 hover:bg-orange-50"
                        >
                          <Bot size={14} />
                          Launch Real GPT
                        </button>
                      </div>
                    </section>

                    <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-5">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                          Quick Navigation
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#10233f]">
                          Move directly to the operating module
                        </h3>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {actionCards.map((action) => {
                          const Icon = action.icon;

                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => setActivePanel(action.panel)}
                              className="group rounded-2xl border-2 border-slate-300 bg-[#fffaf4] p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-orange-700">
                                  <Icon size={16} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block font-black text-[#10233f]">
                                    {action.label}
                                  </span>
                                  <span className="mt-1 block text-xs font-medium leading-5 text-slate-600">
                                    {action.text}
                                  </span>
                                </span>

                                <ChevronRight
                                  size={15}
                                  className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-orange-600"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                );
              })() : null}

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
    <div className="overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_10px_28px_rgba(15,35,63,0.055)]">
      <div className="flex flex-col gap-4 bg-[#173F6B] p-5 text-white lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
            Student Portal Access Control
          </p>

          <h3 className="mt-1 break-words text-xl font-black text-white">
            Portal Account Management
          </h3>

          <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
            Create login access, reset temporary passwords, activate or deactivate access,
            and force password changes from the admin Student OS.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPortalAccount}
          disabled={portalAccountLoading || Boolean(portalAccountSaving)}
          className="shrink-0 rounded-xl border-2 border-white/25 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:border-orange-300/60 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {portalAccountLoading ? "Checking Account..." : "Refresh Account"}
        </button>
      </div>
    </div>

    {portalAccountStatus.message ? (
      <div
        className={`rounded-[1.3rem] border-2 p-4 text-sm font-semibold ${
          portalAccountStatus.type === "success"
            ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
            : portalAccountStatus.type === "warning"
              ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
              : "border-[#60A5FA] bg-[#F2F7FF] text-blue-800"
        }`}
      >
        {portalAccountStatus.message}
      </div>
    ) : null}

    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
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
      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-slate-900">Login Details</h4>
            <p className="mt-1 text-sm text-slate-500">
              These values are used when creating or resetting a student's portal login.
            </p>
          </div>

          {portalAccount ? (
            <span className="rounded-full border-2 border-[#34D399] bg-[#F0FFF8] px-3 py-1 text-[10px] font-black uppercase text-emerald-700">
              Account Found
            </span>
          ) : (
            <span className="rounded-full border-2 border-[#F59E0B] bg-[#FFF7ED] px-3 py-1 text-[10px] font-black uppercase text-amber-800">
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
              className="mt-2 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              placeholder="student@email.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Temporary Password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={portalAccountForm.temporaryPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({
                  ...prev,
                  temporaryPassword: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              placeholder="Minimum 10 characters"
            />

            <button
              type="button"
              onClick={generateSecurePortalPassword}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] px-3 py-2 text-xs font-black text-orange-700 transition hover:bg-[#FFE8D5]"
            >
              <Sparkles size={13} />
              Generate Strong Password
            </button>
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Reset Password Override
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={portalAccountForm.resetPassword}
              onChange={(event) =>
                setPortalAccountForm((prev) => ({ ...prev, resetPassword: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border-2 border-[#B9C9D9] bg-white px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
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

    <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
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
          className="rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] px-4 py-3 text-sm font-black text-orange-700 transition hover:bg-[#FFE8D5] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "create" ? "Creating..." : "Create Account"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount}
          onClick={() => handlePortalAccountAction("reset")}
          className="rounded-xl border-2 border-[#60A5FA] bg-[#F2F7FF] px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "reset" ? "Resetting..." : "Reset Password"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || portalAccount.is_active}
          onClick={() => handlePortalAccountAction("activate")}
          className="rounded-xl border-2 border-[#34D399] bg-[#F0FFF8] px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {portalAccountSaving === "activate" ? "Activating..." : "Activate"}
        </button>

        <button
          type="button"
          disabled={Boolean(portalAccountSaving) || !portalAccount || !portalAccount.is_active}
          onClick={() => handlePortalAccountAction("deactivate")}
          className="rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
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
              ) : null}
              {activePanel === "applications" ? (
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
              ) : null}

              {activePanel === "visa" ? (
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
              ) : null}

              {activePanel === "universities" ? (
                <UniversityManagementPanel
                  key={`universities-${studentId}-${studentType}-${panelMountKey}`}
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
              ) : null}
{activePanel === "support-requests" ? (
  <StudentSupportDeskPanel
    key={`support-${studentId}-${studentType}-${panelMountKey}`}
    student={workingStudent}
    studentType={studentType}
    adminProfile={adminProfile}
    requests={studentSupportRequests}
    onRefresh={loadStudentOsData}
    onOpenTimeline={() => setActivePanel("timeline")}
  />
) : null}
{activePanel === "communication" ? (
                <CommunicationCenterPanel
                  key={`communication-${studentId}-${studentType}-${panelMountKey}`}
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
                    key={`tasks-${studentId}-${studentType}-${panelMountKey}`}
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

                  {(isAppointment
                    ? typeof updateAppointmentStage !== "function"
                    : typeof updateInquiryStage !== "function") ? (
                    <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                      Pipeline stages are visible, but stage persistence is not
                      connected for this record type. Buttons are disabled to
                      prevent fake local-only progress.
                    </div>
                  ) : null}

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
                          disabled={
                            savingStage ||
                            (isAppointment
                              ? typeof updateAppointmentStage !== "function"
                              : typeof updateInquiryStage !== "function")
                          }
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
  key={`timeline-${studentId}-${studentType}-${panelMountKey}`}
  studentId={workingStudent.id}
  studentType={studentType}
  adminProfile={adminProfile}
/>
              ) : null}

              {activePanel === "followups" ? (
                <FollowUpReminderPanel
  key={`followups-${studentId}-${studentType}-${panelMountKey}`}
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

function PortalAccountStat({
  label,
  value,
  tone = "muted",
}) {
  const tones = {
    success: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    danger: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    warning: "border-[#F59E0B] bg-[#FFF7ED] text-amber-800",
    muted: "border-[#C9D7E6] bg-white text-[#10233F]",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.035)] ${tones[tone] || tones.muted}`}
    >
      <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.1em] opacity-65">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black leading-5 text-[#10233F]">
        {value || "—"}
      </p>
    </div>
  );
}

function PortalInfoRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#D1DCE7] bg-white px-3 py-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-black leading-5 text-[#10233F] sm:break-words">
        {value || "—"}
      </p>
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
    orange: "border-[#F97316] bg-[#FFF4E8] text-orange-700",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    emerald: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    violet: "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700",
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


function CommandHeroStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}

function CommandOrangeStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black capitalize text-white">
        {value}
      </p>
    </div>
  );
}

export default StudentDetailModal;
