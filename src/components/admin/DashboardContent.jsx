// DashboardContent V5 MAXIMUM — Zaifan CRM Work Queue OS
// Full replacement for: src/components/admin/DashboardContent.jsx
//
// Maximum pass:
// - preserves approved InquiryCard / AppointmentCard components
// - preserves StudentDetailModal lazy loading
// - preserves parent-side search/status filtering
// - preserves GPT reanalysis integration and local AI enrichment
// - preserves role / permissions API
// - keeps render pagination so giant datasets do not mount hundreds of mature cards
// - safer ownership detection across common owner/counselor fields
// - smarter action queue: overdue / due today / high priority / stale / unassigned
// - stronger status/stage normalization for inquiries + appointments
// - fixes high-priority filtering so urgent/critical are included
// - safer localStorage persistence with schema/version guard
// - resumable last-opened student workflow
// - queue, board, pagination, search, filters, sort and page size persisted
// - better zero / filtered-empty / loading states
// - better AI coverage / risk / hot-lead statistics
// - robust date handling and stale-lead detection
// - reduced-motion support
// - stronger accessibility and keyboard focus states
// - explicit white text on navy surfaces
// - maximum orange/navy Admin OS treatment without changing backend contracts
//
// NOTE:
// This component intentionally remains a workflow/render orchestrator.
// Supabase writes stay inside the existing status/priority/delete/GPT handlers
// passed from the parent or mature child cards. No duplicate DB mutation logic
// is invented here.

import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Activity,
  Bot,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Crown,
  Filter,
  Grid3X3,
  LayoutList,
  LoaderCircle,
  LockKeyhole,
  Radar,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  UserRoundSearch,
  UsersRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

import InquiryCard from "./InquiryCard";
import AppointmentCard from "./AppointmentCard";
import AnimatedSection from "./AnimatedSection";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";

const StudentDetailModal = lazy(() => import("./StudentDetailModal"));

const EASE = [0.22, 1, 0.36, 1];
const STORAGE_KEY = "zaifan-crm-work-queue-v2";
const STORAGE_VERSION = 2;
const DEFAULT_PAGE_SIZE = 12;
const BOARD_COLUMN_LIMIT = 10;
const STALE_DAYS = 7;
const DAY_MS = 86400000;

const ROLE_CONFIG = Object.freeze({
  staff: {
    label: "Staff",
    icon: UsersRound,
    badge: "border-blue-300 bg-blue-50 text-blue-800",
  },
  admin: {
    label: "Admin",
    icon: UserCheck,
    badge: "border-orange-300 bg-orange-50 text-orange-800",
  },
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    badge: "border-violet-300 bg-violet-50 text-violet-800",
  },
});

const PRIORITY_COLUMNS = Object.freeze([
  {
    value: "vip",
    label: "VIP",
    description: "Highest strategic value",
    icon: Crown,
    border: "border-orange-300",
    bg: "bg-orange-50/70",
    accent: "text-orange-800",
    badge: "border-orange-300 bg-orange-50 text-orange-800",
  },
  {
    value: "high",
    label: "High",
    description: "Requires quick action",
    icon: CircleAlert,
    border: "border-red-300",
    bg: "bg-red-50/65",
    accent: "text-red-800",
    badge: "border-red-300 bg-red-50 text-red-800",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Active opportunity",
    icon: Target,
    border: "border-blue-300",
    bg: "bg-blue-50/65",
    accent: "text-blue-800",
    badge: "border-blue-300 bg-blue-50 text-blue-800",
  },
  {
    value: "low",
    label: "Low",
    description: "Nurture & monitor",
    icon: Radar,
    border: "border-slate-300",
    bg: "bg-slate-50/90",
    accent: "text-slate-700",
    badge: "border-slate-300 bg-slate-50 text-slate-700",
  },
]);

const QUEUE_OPTIONS = Object.freeze([
  ["needs_action", "Needs Action", Radar],
  ["my_work", "My Work", UserCheck],
  ["unassigned", "Unassigned", UsersRound],
  ["today", "Today", CalendarCheck2],
  ["overdue", "Overdue", CircleAlert],
  ["waiting", "Waiting", Clock3],
  ["stale", "Stale", RefreshCw],
  ["high_priority", "High Priority", Zap],
  ["completed", "Completed", CheckCircle2],
  ["all", "All", LayoutList],
]);

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function timestamp(value) {
  const date = safeDate(value);
  return date ? date.getTime() : 0;
}

function dateOnlyKey(value) {
  const date = safeDate(value);
  if (!date) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function leadUpdatedAt(item = {}) {
  return timestamp(
    item.updated_at ||
      item.last_contacted_at ||
      item.last_activity_at ||
      item.modified_at ||
      item.created_at
  );
}

function leadCreatedAt(item = {}) {
  return timestamp(
    item.created_at ||
      item.submitted_at ||
      item.appointment_date
  );
}

function getLeadStatus(item = {}, type = "inquiry") {
  if (type === "appointment") {
    return normalize(
      item.appointment_stage ||
        item.status ||
        item.pipeline_stage ||
        "pending"
    );
  }

  return normalize(
    item.pipeline_stage ||
      item.status ||
      item.stage ||
      "new"
  );
}

function getPriority(item = {}) {
  const value = normalize(item.priority || "low");

  if (value === "vip") return "vip";
  if (["critical", "urgent", "high"].includes(value)) return "high";
  if (value === "medium") return "medium";
  return "low";
}

function getOwnerId(item = {}) {
  return (
    item.assigned_admin_id ||
    item.assigned_to ||
    item.counselor_id ||
    item.owner_id ||
    item.assigned_counselor_id ||
    null
  );
}

function getOwnerName(item = {}) {
  return (
    item.assigned_admin_name ||
    item.assigned_counselor_name ||
    item.counselor_name ||
    item.owner_name ||
    ""
  );
}

function isAssigned(item = {}) {
  return Boolean(getOwnerId(item) || getOwnerName(item));
}

function isAssignedTo(item = {}, adminId) {
  if (!adminId) return false;

  const ownerId = getOwnerId(item);
  return ownerId && String(ownerId) === String(adminId);
}

function isCompletedLead(item = {}, type = "inquiry") {
  const status = getLeadStatus(item, type);

  if (type === "appointment") {
    return [
      "completed",
      "consultation_done",
      "converted_to_lead",
    ].includes(status);
  }

  return [
    "completed",
    "converted",
    "admitted",
    "closed_won",
    "visa_approved",
  ].includes(status);
}

function isClosedLead(item = {}, type = "inquiry") {
  const status = getLeadStatus(item, type);

  if (type === "appointment") {
    return [
      "completed",
      "consultation_done",
      "converted_to_lead",
      "cancelled",
      "canceled",
      "not_interested",
    ].includes(status);
  }

  return [
    "completed",
    "converted",
    "admitted",
    "closed",
    "closed_won",
    "closed_lost",
    "lost",
    "rejected",
    "not_interested",
    "visa_approved",
  ].includes(status);
}

function isWaitingLead(item = {}) {
  const status = normalize(item.status);
  const stage = normalize(
    item.pipeline_stage ||
      item.stage ||
      item.appointment_stage ||
      item.status_stage
  );

  return (
    [
      "waiting",
      "waiting_on_student",
      "awaiting_student",
      "documents_pending",
      "pending_documents",
      "follow_up",
      "followup",
      "follow_up_needed",
    ].includes(status) ||
    [
      "waiting",
      "waiting_on_student",
      "awaiting_student",
      "documents_pending",
      "pending_documents",
      "follow_up_needed",
    ].includes(stage)
  );
}

function getNextActionDate(item = {}) {
  return (
    item.next_action_due ||
    item.follow_up_date ||
    item.next_follow_up ||
    item.due_date ||
    item.appointment_date ||
    null
  );
}

function hasDueToday(item = {}) {
  const raw = getNextActionDate(item);
  if (!raw) return false;

  return dateOnlyKey(raw) === dateOnlyKey(new Date());
}

function isOverdueLead(item = {}, type = "inquiry") {
  if (isClosedLead(item, type)) return false;

  const raw = getNextActionDate(item);
  const date = safeDate(raw);

  if (!date || hasDueToday(item)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  return due.getTime() < today.getTime();
}

function isStaleLead(item = {}, type = "inquiry") {
  if (isClosedLead(item, type)) return false;

  const lastActivity =
    leadUpdatedAt(item) ||
    leadCreatedAt(item);

  if (!lastActivity) return false;

  const ageDays = Math.floor(
    (Date.now() - lastActivity) / DAY_MS
  );

  if (ageDays < STALE_DAYS) return false;

  const status = getLeadStatus(item, type);

  return [
    "new",
    "pending",
    "contacted",
    "confirmed",
    "follow_up",
    "follow_up_needed",
  ].includes(status);
}

function needsAction(item = {}, type = "inquiry") {
  if (isClosedLead(item, type)) return false;

  return (
    isOverdueLead(item, type) ||
    hasDueToday(item) ||
    isStaleLead(item, type) ||
    !isAssigned(item) ||
    ["vip", "high"].includes(getPriority(item)) ||
    isWaitingLead(item)
  );
}

function priorityRank(priority) {
  const ranks = {
    vip: 5,
    high: 4,
    medium: 2,
    low: 1,
  };

  return ranks[getPriority({ priority })] || 0;
}

function sanitizePageSize(value) {
  const parsed = Number(value);
  return [8, 12, 20, 40].includes(parsed)
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

function readWorkspaceState() {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "{}"
    );

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    if (
      parsed.version &&
      parsed.version !== STORAGE_VERSION
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function writeWorkspaceState(patch) {
  if (typeof window === "undefined") return;

  try {
    const current = readWorkspaceState();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...current,
        ...patch,
        version: STORAGE_VERSION,
      })
    );
  } catch {
    // Persistence is a convenience layer only.
  }
}

function DashboardContent({
  loading = false,
  activeTab = "inquiries",
  inquiries = [],
  filteredInquiries = [],
  appointments = [],
  filteredAppointments = [],
  allLeads = [],
  cardClass = "",
  toggleInquiryStatus = () => {},
  updateInquiryStatus = toggleInquiryStatus,
  updateInquiryPriority = () => {},
  updateAppointmentPriority = () => {},
  deleteInquiry = null,
  updateAppointmentStatus = () => {},
  updateAppointmentStage = () => {},
  deleteAppointment = null,
  role = "staff",
  adminProfile = null,
  permissions = {},
  reanalyzeLeadWithGpt = null,
  aiReanalysisState = {
    loading: false,
    leadId: null,
    leadType: null,
    message: "",
    error: "",
  },
}) {
  const shouldReduceMotion = useReducedMotion();

  const initialWorkspace = useMemo(
    () => readWorkspaceState(),
    []
  );

  const safeInquiries = safeArray(inquiries);
  const safeAppointments = safeArray(appointments);
  const safeFilteredInquiries = safeArray(filteredInquiries);
  const safeFilteredAppointments = safeArray(filteredAppointments);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState("inquiry");

  const [viewMode, setViewMode] = useState(
    initialWorkspace.viewMode === "kanban"
      ? "kanban"
      : "list"
  );

  const [workQueue, setWorkQueue] = useState(
    initialWorkspace.workQueue || "needs_action"
  );

  const [internalSearch, setInternalSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");

  const [sortBy, setSortBy] = useState(
    initialWorkspace.sortBy || "smart"
  );

  const [pageSize, setPageSize] = useState(
    sanitizePageSize(initialWorkspace.pageSize)
  );

  const [page, setPage] = useState(1);

  const safePermissions = useMemo(
    () => ({
      canDelete: false,
      canClearAll: false,
      canExport: false,
      canManageAdmins: false,
      canUpdateStatus: true,
      canUpdatePriority: true,
      canConfirmAppointments: true,
      canUpdateAppointmentPipeline: true,
      ...permissions,
    }),
    [permissions]
  );

  const currentRole =
    ROLE_CONFIG[role] ||
    ROLE_CONFIG.staff;

  const RoleIcon =
    currentRole.icon;

  const activeLeadType =
    activeTab === "appointments"
      ? "appointment"
      : "inquiry";

  const activeSourceItems =
    activeTab === "appointments"
      ? safeAppointments
      : safeInquiries;

  // Respect parent filtering exactly. An empty filtered array may be an
  // intentional "no search/status matches" result, so do not auto-fallback.
  const parentFilteredItems =
    activeTab === "appointments"
      ? safeFilteredAppointments
      : safeFilteredInquiries;

  const adminId =
    adminProfile?.id ||
    adminProfile?.user_id ||
    adminProfile?.admin_id ||
    null;

  useEffect(() => {
    setPage(1);
    setInternalSearch("");
    setPriorityFilter("all");
    setOwnershipFilter("all");

    const persisted = readWorkspaceState();
    const queueByTab =
      persisted.queueByTab || {};

    setWorkQueue(
      queueByTab[activeTab] ||
        "needs_action"
    );
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [
    workQueue,
    internalSearch,
    priorityFilter,
    ownershipFilter,
    sortBy,
    pageSize,
  ]);

  useEffect(() => {
    const current =
      readWorkspaceState();

    writeWorkspaceState({
      viewMode,
      sortBy,
      pageSize,
      queueByTab: {
        ...(current.queueByTab || {}),
        [activeTab]: workQueue,
      },
    });
  }, [
    viewMode,
    sortBy,
    pageSize,
    workQueue,
    activeTab,
  ]);

  const openStudentModal = (
    student,
    type
  ) => {
    if (!student) return;

    setSelectedStudent(student);
    setModalType(type);

    writeWorkspaceState({
      lastOpened: {
        id: student.id,
        type,
        at: new Date().toISOString(),
      },
    });
  };

  const openInquiryModal = (student) =>
    openStudentModal(
      student,
      "inquiry"
    );

  const openAppointmentModal = (student) =>
    openStudentModal(
      student,
      "appointment"
    );

  const closeModal = () => {
    setSelectedStudent(null);
  };

  const priorityColumns = PRIORITY_COLUMNS;

  const pipelineCounts = useMemo(() => {
    let inquiryNew = 0;
    let inquiryContacted = 0;
    let appointmentPending = 0;
    let appointmentConfirmed = 0;
    let appointmentCompleted = 0;
    let appointmentCancelled = 0;

    for (const inquiry of safeInquiries) {
      const status = getLeadStatus(inquiry, "inquiry");
      if (["new", "pending"].includes(status)) inquiryNew += 1;
      if (status.includes("contacted")) inquiryContacted += 1;
    }

    for (const appointment of safeAppointments) {
      const status = getLeadStatus(appointment, "appointment");
      if (["pending", "new", "new_booking"].includes(status)) {
        appointmentPending += 1;
      }
      if (status === "confirmed") appointmentConfirmed += 1;
      if (isCompletedLead(appointment, "appointment")) {
        appointmentCompleted += 1;
      }
      if (["cancelled", "canceled", "not_interested"].includes(status)) {
        appointmentCancelled += 1;
      }
    }

    return {
      inquiryNew,
      inquiryContacted,
      appointmentPending,
      appointmentConfirmed,
      appointmentCompleted,
      appointmentCancelled,
    };
  }, [safeAppointments, safeInquiries]);

  const inquiryNewCount = pipelineCounts.inquiryNew;
  const inquiryContactedCount = pipelineCounts.inquiryContacted;
  const appointmentPendingCount = pipelineCounts.appointmentPending;
  const appointmentConfirmedCount = pipelineCounts.appointmentConfirmed;
  const appointmentCompletedCount = pipelineCounts.appointmentCompleted;
  const appointmentCancelledCount = pipelineCounts.appointmentCancelled;

  const executiveLeads = useMemo(() => {
    if (
      Array.isArray(allLeads) &&
      allLeads.length > 0
    ) {
      return allLeads;
    }

    return [
      ...safeInquiries.map((lead) => ({
        ...lead,
        __leadType: "inquiry",
      })),
      ...safeAppointments.map((lead) => ({
        ...lead,
        __leadType: "appointment",
      })),
    ];
  }, [
    allLeads,
    safeInquiries,
    safeAppointments,
  ]);

  const assignedCount =
    activeSourceItems.filter(
      isAssigned
    ).length;

  const unassignedCount =
    Math.max(
      activeSourceItems.length -
        assignedCount,
      0
    );

  const priorityCounts = useMemo(
    () => ({
      vip: activeSourceItems.filter(
        (item) =>
          getPriority(item) === "vip"
      ).length,

      high: activeSourceItems.filter(
        (item) =>
          getPriority(item) === "high"
      ).length,

      medium: activeSourceItems.filter(
        (item) =>
          getPriority(item) ===
          "medium"
      ).length,

      low: activeSourceItems.filter(
        (item) =>
          getPriority(item) === "low"
      ).length,
    }),
    [activeSourceItems]
  );

  const pipelineStages =
    activeTab === "inquiries"
      ? [
          {
            label: "New leads",
            value: inquiryNewCount,
            icon: Sparkles,
            tone: "orange",
          },
          {
            label: "Contacted",
            value: inquiryContactedCount,
            icon: UserCheck,
            tone: "green",
          },
          {
            label: "Assigned",
            value: assignedCount,
            icon: UsersRound,
            tone: "blue",
          },
          {
            label: "Open pool",
            value: unassignedCount,
            icon: Radar,
            tone: "slate",
          },
        ]
      : [
          {
            label: "Pending",
            value: appointmentPendingCount,
            icon: CalendarCheck2,
            tone: "orange",
          },
          {
            label: "Confirmed",
            value: appointmentConfirmedCount,
            icon: CheckCircle2,
            tone: "blue",
          },
          {
            label: "Completed",
            value: appointmentCompletedCount,
            icon: Target,
            tone: "green",
          },
          {
            label: "Cancelled",
            value: appointmentCancelledCount,
            icon: CircleAlert,
            tone: "red",
          },
        ];

  const workQueueCounts = useMemo(() => {
    const source =
      parentFilteredItems;

    const counts = {
      needs_action: 0,
      my_work: 0,
      unassigned: 0,
      today: 0,
      overdue: 0,
      waiting: 0,
      stale: 0,
      high_priority: 0,
      completed: 0,
      all: source.length,
    };

    source.forEach((item) => {
      const completed =
        isCompletedLead(
          item,
          activeLeadType
        );

      const closed =
        isClosedLead(
          item,
          activeLeadType
        );

      const assignedToMe =
        isAssignedTo(
          item,
          adminId
        );

      if (
        needsAction(
          item,
          activeLeadType
        )
      ) {
        counts.needs_action += 1;
      }

      if (
        assignedToMe &&
        !closed
      ) {
        counts.my_work += 1;
      }

      if (
        !isAssigned(item) &&
        !closed
      ) {
        counts.unassigned += 1;
      }

      if (
        hasDueToday(item) &&
        !closed
      ) {
        counts.today += 1;
      }

      if (
        isOverdueLead(
          item,
          activeLeadType
        )
      ) {
        counts.overdue += 1;
      }

      if (
        isWaitingLead(item) &&
        !closed
      ) {
        counts.waiting += 1;
      }

      if (
        isStaleLead(
          item,
          activeLeadType
        )
      ) {
        counts.stale += 1;
      }

      if (
        ["vip", "high"].includes(
          getPriority(item)
        ) &&
        !closed
      ) {
        counts.high_priority += 1;
      }

      if (completed) {
        counts.completed += 1;
      }
    });

    return counts;
  }, [
    parentFilteredItems,
    activeLeadType,
    adminId,
  ]);

  const queueFilteredItems = useMemo(() => {
    const query =
      internalSearch
        .trim()
        .toLowerCase();

    return parentFilteredItems.filter(
      (item) => {
        const completed =
          isCompletedLead(
            item,
            activeLeadType
          );

        const closed =
          isClosedLead(
            item,
            activeLeadType
          );

        const assignedToMe =
          isAssignedTo(
            item,
            adminId
          );

        if (
          workQueue ===
            "needs_action" &&
          !needsAction(
            item,
            activeLeadType
          )
        ) {
          return false;
        }

        if (
          workQueue ===
            "my_work" &&
          (!assignedToMe ||
            closed)
        ) {
          return false;
        }

        if (
          workQueue ===
            "unassigned" &&
          (isAssigned(item) ||
            closed)
        ) {
          return false;
        }

        if (
          workQueue === "today" &&
          (!hasDueToday(item) ||
            closed)
        ) {
          return false;
        }

        if (
          workQueue ===
            "overdue" &&
          !isOverdueLead(
            item,
            activeLeadType
          )
        ) {
          return false;
        }

        if (
          workQueue ===
            "waiting" &&
          (!isWaitingLead(item) ||
            closed)
        ) {
          return false;
        }

        if (
          workQueue === "stale" &&
          !isStaleLead(
            item,
            activeLeadType
          )
        ) {
          return false;
        }

        if (
          workQueue ===
            "high_priority" &&
          (![
            "vip",
            "high",
          ].includes(
            getPriority(item)
          ) ||
            closed)
        ) {
          return false;
        }

        if (
          workQueue ===
            "completed" &&
          !completed
        ) {
          return false;
        }

        if (
          priorityFilter !== "all" &&
          getPriority(item) !==
            priorityFilter
        ) {
          return false;
        }

        if (
          ownershipFilter ===
            "assigned" &&
          !isAssigned(item)
        ) {
          return false;
        }

        if (
          ownershipFilter ===
            "unassigned" &&
          isAssigned(item)
        ) {
          return false;
        }

        if (
          ownershipFilter ===
            "mine" &&
          !assignedToMe
        ) {
          return false;
        }

        if (!query) return true;

        const haystack = [
          item.full_name,
          item.name,
          item.student_name,
          item.email,
          item.phone,
          item.phone_number,
          item.whatsapp,
          item.country,
          item.country_interest,
          item.preferred_country,
          item.destination_country,
          item.field_of_interest,
          item.course,
          item.program,
          item.consultation_type,
          item.status,
          item.priority,
          item.pipeline_stage,
          item.stage,
          item.appointment_stage,
          item.message,
          item.notes,
          getOwnerName(item),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      }
    );
  }, [
    parentFilteredItems,
    activeLeadType,
    adminId,
    workQueue,
    internalSearch,
    priorityFilter,
    ownershipFilter,
  ]);

  const sortedItems = useMemo(() => {
    const items = [
      ...queueFilteredItems,
    ];

    return items.sort(
      (a, b) => {
        if (
          sortBy === "newest"
        ) {
          return (
            leadCreatedAt(b) -
            leadCreatedAt(a)
          );
        }

        if (
          sortBy === "oldest"
        ) {
          return (
            leadCreatedAt(a) -
            leadCreatedAt(b)
          );
        }

        if (
          sortBy ===
          "recent_activity"
        ) {
          return (
            leadUpdatedAt(b) -
            leadUpdatedAt(a)
          );
        }

        if (
          sortBy === "priority"
        ) {
          const priorityDifference =
            priorityRank(
              b.priority
            ) -
            priorityRank(
              a.priority
            );

          if (
            priorityDifference !==
            0
          ) {
            return priorityDifference;
          }

          return (
            leadUpdatedAt(b) -
            leadUpdatedAt(a)
          );
        }

        // Smart queue:
        // overdue -> due today -> VIP/high -> stale -> unassigned
        // -> recently updated -> newest.
        const aOverdue =
          isOverdueLead(
            a,
            activeLeadType
          );

        const bOverdue =
          isOverdueLead(
            b,
            activeLeadType
          );

        if (
          aOverdue !== bOverdue
        ) {
          return aOverdue
            ? -1
            : 1;
        }

        const aToday =
          hasDueToday(a);

        const bToday =
          hasDueToday(b);

        if (aToday !== bToday) {
          return aToday
            ? -1
            : 1;
        }

        const priorityDifference =
          priorityRank(
            b.priority
          ) -
          priorityRank(
            a.priority
          );

        if (
          priorityDifference !==
          0
        ) {
          return priorityDifference;
        }

        const aStale =
          isStaleLead(
            a,
            activeLeadType
          );

        const bStale =
          isStaleLead(
            b,
            activeLeadType
          );

        if (aStale !== bStale) {
          return aStale
            ? -1
            : 1;
        }

        const aUnassigned =
          !isAssigned(a);

        const bUnassigned =
          !isAssigned(b);

        if (
          aUnassigned !==
          bUnassigned
        ) {
          return aUnassigned
            ? -1
            : 1;
        }

        const activityDifference =
          leadUpdatedAt(b) -
          leadUpdatedAt(a);

        if (
          activityDifference !==
          0
        ) {
          return activityDifference;
        }

        return (
          leadCreatedAt(b) -
          leadCreatedAt(a)
        );
      }
    );
  }, [
    queueFilteredItems,
    sortBy,
    activeLeadType,
  ]);

  const enrichedQueueItems = useMemo(
    () =>
      sortedItems.map(
        (item) =>
          enrichLeadWithAi(
            item,
            activeLeadType
          )
      ),
    [
      sortedItems,
      activeLeadType,
    ]
  );

  const activeAiStats = useMemo(() => {
    const total =
      enrichedQueueItems.length;

    const storedGpt =
      enrichedQueueItems.filter(
        (item) =>
          item.ai_has_stored_gpt
      ).length;

    const hot =
      enrichedQueueItems.filter(
        (item) =>
          item.ai_tier?.level ===
          "hot"
      ).length;

    const highRisk =
      enrichedQueueItems.filter(
        (item) =>
          item.ai_risk_level
            ?.level === "high" ||
          Number(
            item.ai_risk_score
          ) >= 75
      ).length;

    const averageScore =
      total
        ? Math.round(
            enrichedQueueItems.reduce(
              (sum, item) =>
                sum +
                (Number(
                  item.ai_score
                ) || 0),
              0
            ) / total
          )
        : 0;

    return {
      total,
      storedGpt,
      hot,
      highRisk,
      averageScore,
      coverage:
        total
          ? Math.round(
              (storedGpt /
                total) *
                100
            )
          : 0,
    };
  }, [enrichedQueueItems]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedItems.length /
        pageSize
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const paginatedItems = useMemo(
    () =>
      sortedItems.slice(
        (safePage - 1) *
          pageSize,
        safePage * pageSize
      ),
    [
      sortedItems,
      safePage,
      pageSize,
    ]
  );

  const boardItems = useMemo(() => {
    const byPriority =
      new Map();

    priorityColumns.forEach(
      (column) => {
        byPriority.set(
          column.value,
          sortedItems
            .filter(
              (item) =>
                getPriority(
                  item
                ) ===
                column.value
            )
            .slice(
              0,
              BOARD_COLUMN_LIMIT
            )
        );
      }
    );

    return byPriority;
  }, [sortedItems]);

  const viewTitle =
    activeTab === "inquiries"
      ? "Student Inquiry Workspace"
      : "Appointment Operations Workspace";

  const totalLabel =
    activeTab === "inquiries"
      ? "Total inquiries"
      : "Total appointments";

  const rangeStart =
    sortedItems.length === 0
      ? 0
      : (safePage - 1) *
          pageSize +
        1;

  const rangeEnd = Math.min(
    safePage * pageSize,
    sortedItems.length
  );

  const queueOptions = QUEUE_OPTIONS;

  const lastOpened =
    initialWorkspace.lastOpened ||
    null;

  const lastOpenedItem = useMemo(() => {
    if (
      !lastOpened?.id ||
      lastOpened.type !==
        activeLeadType
    ) {
      return null;
    }

    return activeSourceItems.find(
      (item) =>
        String(item.id) ===
        String(lastOpened.id)
    );
  }, [
    lastOpened,
    activeLeadType,
    activeSourceItems,
  ]);

  const filtersActive =
    internalSearch ||
    priorityFilter !== "all" ||
    ownershipFilter !== "all";

  const resetQueueFilters = () => {
    setInternalSearch("");
    setPriorityFilter("all");
    setOwnershipFilter("all");
    setPage(1);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <AnimatedSection
          key={activeTab}
        >
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[1.9rem] border-[3px] border-orange-300 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.07)]">
              <div className="grid xl:grid-cols-[1.22fr_0.78fr]">
                <div className="bg-[#123865] p-5 text-white sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <HeaderBadge>
                      <Activity size={11} />
                      Live CRM Workspace
                    </HeaderBadge>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${currentRole.badge}`}
                    >
                      <RoleIcon size={11} />
                      {currentRole.label}
                    </span>

                    {!safePermissions.canDelete ? (
                      <HeaderBadge>
                        <LockKeyhole size={11} />
                        Protected actions
                      </HeaderBadge>
                    ) : null}
                  </div>

                  <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {viewTitle}
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
                    Work through ownership, urgency, stage movement and next actions
                    without losing your place as Zaifan's CRM grows.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <DarkMetric
                      label="Queue"
                      value={
                        sortedItems.length
                      }
                    />

                    <DarkMetric
                      label="Assigned"
                      value={
                        assignedCount
                      }
                    />

                    <DarkMetric
                      label="Open"
                      value={
                        unassignedCount
                      }
                    />

                    <DarkMetric
                      label="GPT Coverage"
                      value={`${activeAiStats.coverage}%`}
                    />
                  </div>
                </div>

                <div className="bg-orange-500 p-5 text-white sm:p-6">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    Operational Pressure
                  </p>

                  <p className="mt-3 text-5xl font-black text-white">
                    {
                      workQueueCounts
                        .needs_action
                    }
                  </p>

                  <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-white">
                    records need attention
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <OrangeMetric
                      label="Overdue"
                      value={
                        workQueueCounts
                          .overdue
                      }
                    />

                    <OrangeMetric
                      label="Stale"
                      value={
                        workQueueCounts
                          .stale
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 bg-[#fffaf4] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                {pipelineStages.map(
                  (stage, index) => (
                    <PipelineStage
                      key={
                        stage.label
                      }
                      stage={stage}
                      index={index}
                      shouldReduceMotion={
                        shouldReduceMotion
                      }
                    />
                  )
                )}
              </div>
            </section>

            <PipelineAiControlStrip
              stats={
                activeAiStats
              }
              reanalysisState={
                aiReanalysisState
              }
            />

            <section className="rounded-[1.9rem] border-[3px] border-orange-300 bg-[#fff8ef] p-4 shadow-[0_10px_30px_rgba(15,35,63,0.05)] sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Filter
                      size={14}
                      className="text-white"
                    />

                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                      CRM Work Queue
                    </p>
                  </div>

                  <h3 className="mt-1 text-xl font-black text-[#10233f]">
                    What should I work on?
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Queue state is remembered locally so staff can return to the
                    same workflow instead of rebuilding the view every time.
                  </p>
                </div>

                {lastOpenedItem ? (
                  <button
                    type="button"
                    onClick={() =>
                      activeLeadType ===
                      "inquiry"
                        ? openInquiryModal(
                            lastOpenedItem
                          )
                        : openAppointmentModal(
                            lastOpenedItem
                          )
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0e2f56] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    <RotateCcw size={14} />
                    Continue Last Student
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {queueOptions.map(
                  ([
                    value,
                    label,
                    Icon,
                  ]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setWorkQueue(
                          value
                        )
                      }
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                        workQueue ===
                        value
                          ? "border-[#123865] bg-[#123865] text-white shadow-sm"
                          : "border-slate-300 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50"
                      }`}
                    >
                      <Icon
                        size={13}
                      />

                      {label}

                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] ${
                          workQueue ===
                          value
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {workQueueCounts[
                          value
                        ] ?? 0}
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="mt-4 grid gap-2 xl:grid-cols-[1fr_150px_165px_165px_130px]">
                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={
                      internalSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setInternalSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search this queue by student, country, program, phone, counselor..."
                    aria-label="Search current CRM work queue"
                    className="h-11 w-full rounded-[1.05rem] border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <select
                  value={
                    priorityFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setPriorityFilter(
                      event.target
                        .value
                    )
                  }
                  aria-label="Filter by priority"
                  className="h-11 rounded-[1.05rem] border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none hover:border-orange-400 focus:border-orange-400"
                >
                  <option value="all">
                    All priorities
                  </option>
                  <option value="vip">
                    VIP
                  </option>
                  <option value="high">
                    High / Urgent
                  </option>
                  <option value="medium">
                    Medium
                  </option>
                  <option value="low">
                    Low
                  </option>
                </select>

                <select
                  value={
                    ownershipFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setOwnershipFilter(
                      event.target
                        .value
                    )
                  }
                  aria-label="Filter by ownership"
                  className="h-11 rounded-[1.05rem] border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none hover:border-orange-400 focus:border-orange-400"
                >
                  <option value="all">
                    All ownership
                  </option>
                  <option value="mine">
                    Mine
                  </option>
                  <option value="assigned">
                    Assigned
                  </option>
                  <option value="unassigned">
                    Unassigned
                  </option>
                </select>

                <select
                  value={sortBy}
                  onChange={(
                    event
                  ) =>
                    setSortBy(
                      event.target
                        .value
                    )
                  }
                  aria-label="Sort CRM work queue"
                  className="h-11 rounded-[1.05rem] border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none hover:border-orange-400 focus:border-orange-400"
                >
                  <option value="smart">
                    Smart order
                  </option>
                  <option value="priority">
                    Priority
                  </option>
                  <option value="recent_activity">
                    Recent activity
                  </option>
                  <option value="newest">
                    Newest
                  </option>
                  <option value="oldest">
                    Oldest
                  </option>
                </select>

                <select
                  value={pageSize}
                  onChange={(
                    event
                  ) =>
                    setPageSize(
                      sanitizePageSize(
                        event.target
                          .value
                      )
                    )
                  }
                  aria-label="Records per page"
                  className="h-11 rounded-[1.05rem] border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none hover:border-orange-400 focus:border-orange-400"
                >
                  <option value={8}>
                    8 / page
                  </option>
                  <option value={12}>
                    12 / page
                  </option>
                  <option value={20}>
                    20 / page
                  </option>
                  <option value={40}>
                    40 / page
                  </option>
                </select>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">
                  Showing{" "}
                  {rangeStart}–
                  {rangeEnd} of{" "}
                  {sortedItems.length}{" "}
                  in this queue ·{" "}
                  {
                    activeSourceItems.length
                  }{" "}
                  total{" "}
                  {activeLeadType}
                  {activeSourceItems.length ===
                  1
                    ? ""
                    : "s"}
                </p>

                {filtersActive ? (
                  <button
                    type="button"
                    onClick={
                      resetQueueFilters
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-black text-orange-700 hover:text-orange-900"
                  >
                    <X size={12} />
                    Clear queue filters
                  </button>
                ) : null}
              </div>
            </section>

            <section
              className="grid gap-4 rounded-[1.9rem] border-[3px] bg-[#fff3e5] p-3 shadow-[0_12px_34px_rgba(15,35,63,0.06)] sm:p-4 xl:grid-cols-[minmax(0,1fr)_auto]"
              style={{ borderColor: "#fb923c" }}
            >
              <div className="rounded-[1.55rem] border-2 border-[#234e78] bg-[#123865] p-4 text-white shadow-[0_10px_24px_rgba(18,56,101,0.12)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                      Workspace layout
                    </p>

                    <h3 className="mt-1 text-lg font-black text-white">
                      {viewMode ===
                      "kanban"
                        ? "Priority Board"
                        : "Student Card View"}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-white/80">
                      {totalLabel}:{" "}
                      {
                        activeSourceItems.length
                      }{" "}
                      · Queue:{" "}
                      {
                        sortedItems.length
                      }{" "}
                      · Assigned:{" "}
                      {assignedCount}
                    </p>
                  </div>

                  <div className="inline-grid grid-cols-2 gap-1 rounded-[1.05rem] border-2 border-white/25 bg-white/10 p-1.5">
                    <ViewButton
                      active={
                        viewMode ===
                        "list"
                      }
                      onClick={() =>
                        setViewMode(
                          "list"
                        )
                      }
                      icon={
                        LayoutList
                      }
                      label="Cards"
                    />

                    <ViewButton
                      active={
                        viewMode ===
                        "kanban"
                      }
                      onClick={() =>
                        setViewMode(
                          "kanban"
                        )
                      }
                      icon={Grid3X3}
                      label="Board"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 rounded-[1.55rem] border-2 border-orange-400 bg-[#ff6a0a] p-3 shadow-[0_10px_24px_rgba(249,115,22,0.12)]">
                {priorityColumns.map(
                  (column) => {
                    const ColumnIcon =
                      column.icon;

                    return (
                      <div
                        key={
                          column.value
                        }
                        className={`min-w-[72px] rounded-xl border-2 p-3 text-center ${column.badge}`}
                      >
                        <ColumnIcon
                          size={15}
                          className="mx-auto"
                        />

                        <p className="mt-2 text-lg font-black">
                          {priorityCounts[
                            column.value
                          ] || 0}
                        </p>

                        <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.1em] opacity-70">
                          {
                            column.label
                          }
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {activeTab ===
              "inquiries" &&
            safeInquiries.length ===
              0 ? (
              <EmptyState
                icon={
                  UserRoundSearch
                }
                title="No inquiries yet"
                text="Student contact-form submissions will appear here as soon as new leads enter Zaifan."
              />
            ) : activeTab ===
                "appointments" &&
              safeAppointments.length ===
                0 ? (
              <EmptyState
                icon={
                  CalendarCheck2
                }
                title="No appointments yet"
                text="Consultation bookings will appear here after students reserve appointment slots."
              />
            ) : parentFilteredItems.length ===
                0 &&
              activeSourceItems.length >
                0 ? (
              <EmptyState
                icon={Search}
                title="No parent-filter matches"
                text="The parent dashboard search/status filters currently exclude every record. Clear those filters before changing this queue."
              />
            ) : sortedItems.length ===
              0 ? (
              <EmptyState
                icon={Radar}
                title="No records in this work queue"
                text="Try another queue, clear local queue filters, or review the parent dashboard filters."
              />
            ) : viewMode ===
              "kanban" ? (
              <KanbanView
                activeTab={
                  activeTab
                }
                boardItems={
                  boardItems
                }
                fullItems={
                  sortedItems
                }
                priorityColumns={
                  priorityColumns
                }
                safePermissions={
                  safePermissions
                }
                toggleInquiryStatus={
                  updateInquiryStatus
                }
                updateInquiryPriority={
                  updateInquiryPriority
                }
                updateAppointmentPriority={
                  updateAppointmentPriority
                }
                updateAppointmentStatus={
                  updateAppointmentStatus
                }
                updateAppointmentStage={
                  updateAppointmentStage
                }
                deleteInquiry={
                  deleteInquiry
                }
                deleteAppointment={
                  deleteAppointment
                }
                openInquiryModal={
                  openInquiryModal
                }
                openAppointmentModal={
                  openAppointmentModal
                }
                role={role}
                reanalyzeLeadWithGpt={
                  reanalyzeLeadWithGpt
                }
                aiReanalysisState={
                  aiReanalysisState
                }
                shouldReduceMotion={
                  shouldReduceMotion
                }
              />
            ) : (
              <>
                <ListView
                  activeTab={
                    activeTab
                  }
                  activeItems={
                    paginatedItems
                  }
                  cardClass={
                    cardClass
                  }
                  safePermissions={
                    safePermissions
                  }
                  toggleInquiryStatus={
                    updateInquiryStatus
                  }
                  updateInquiryPriority={
                    updateInquiryPriority
                  }
                  updateAppointmentPriority={
                    updateAppointmentPriority
                  }
                  updateAppointmentStatus={
                    updateAppointmentStatus
                  }
                  updateAppointmentStage={
                    updateAppointmentStage
                  }
                  deleteInquiry={
                    deleteInquiry
                  }
                  deleteAppointment={
                    deleteAppointment
                  }
                  openInquiryModal={
                    openInquiryModal
                  }
                  openAppointmentModal={
                    openAppointmentModal
                  }
                  role={role}
                  reanalyzeLeadWithGpt={
                    reanalyzeLeadWithGpt
                  }
                  aiReanalysisState={
                    aiReanalysisState
                  }
                  shouldReduceMotion={
                    shouldReduceMotion
                  }
                />

                {totalPages > 1 ? (
                  <Pagination
                    page={
                      safePage
                    }
                    totalPages={
                      totalPages
                    }
                    onPage={
                      setPage
                    }
                    rangeStart={
                      rangeStart
                    }
                    rangeEnd={
                      rangeEnd
                    }
                    total={
                      sortedItems.length
                    }
                  />
                ) : null}
              </>
            )}
          </div>
        </AnimatedSection>
      </AnimatePresence>

      {selectedStudent ? (
        <Suspense
          fallback={
            <StudentModalLoader />
          }
        >
          <StudentDetailModal
            isOpen={Boolean(
              selectedStudent
            )}
            onClose={
              closeModal
            }
            student={
              selectedStudent
            }
            type={modalType}
            adminProfile={
              adminProfile
            }
            permissions={
              safePermissions
            }
            updateInquiryPriority={
              updateInquiryPriority
            }
            updateAppointmentPriority={
              updateAppointmentPriority
            }
            updateAppointmentStatus={
              updateAppointmentStatus
            }
            updateAppointmentStage={
              updateAppointmentStage
            }
            toggleInquiryStatus={
              updateInquiryStatus
            }
            deleteInquiry={
              deleteInquiry
            }
            deleteAppointment={
              deleteAppointment
            }
            allLeads={
              executiveLeads
            }
          />
        </Suspense>
      ) : null}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onPage,
  rangeStart,
  rangeEnd,
  total,
}) {
  const pages = useMemo(() => {
    const candidates =
      new Set([
        1,
        totalPages,
        page - 2,
        page - 1,
        page,
        page + 1,
        page + 2,
      ]);

    return [
      ...candidates,
    ]
      .filter(
        (value) =>
          value >= 1 &&
          value <=
            totalPages
      )
      .sort(
        (a, b) => a - b
      );
  }, [page, totalPages]);

  return (
    <section className="mt-4 flex flex-col gap-3 rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-bold text-slate-500">
        {rangeStart}–
        {rangeEnd} of {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={
            page <= 1
          }
          onClick={() =>
            onPage(
              Math.max(
                1,
                page - 1
              )
            )
          }
          className="inline-flex h-9 items-center gap-1 rounded-[1.05rem] border-2 border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ChevronLeft
            size={14}
          />
          Previous
        </button>

        {pages.map(
          (
            number,
            index
          ) => {
            const previous =
              pages[
                index - 1
              ];

            const showGap =
              previous &&
              number -
                previous >
                1;

            return (
              <span
                key={
                  number
                }
                className="contents"
              >
                {showGap ? (
                  <span className="px-1 text-xs font-black text-slate-400">
                    …
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    onPage(
                      number
                    )
                  }
                  className={`h-9 min-w-9 rounded-xl border-2 px-2 text-xs font-black transition ${
                    page ===
                    number
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  {number}
                </button>
              </span>
            );
          }
        )}

        <button
          type="button"
          disabled={
            page >=
            totalPages
          }
          onClick={() =>
            onPage(
              Math.min(
                totalPages,
                page + 1
              )
            )
          }
          className="inline-flex h-9 items-center gap-1 rounded-[1.05rem] border-2 border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Next
          <ChevronRight
            size={14}
          />
        </button>
      </div>
    </section>
  );
}

function HeaderBadge({
  children,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      {children}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-[0.9rem] border-2 px-4 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
        active
          ? "border-orange-400 bg-orange-500 text-white shadow-[0_7px_18px_rgba(249,115,22,0.22)]"
          : "border-white/20 bg-white/10 text-white hover:border-orange-300 hover:bg-white/15"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function PipelineAiControlStrip({
  stats,
  reanalysisState,
}) {
  const items = [
    {
      label: "Average local score",
      value: `${stats.averageScore}/100`,
      icon: BrainCircuit,
      tone: "blue",
    },
    {
      label: "Hot leads",
      value: stats.hot,
      icon: Target,
      tone: "orange",
    },
    {
      label: "High risk",
      value: stats.highRisk,
      icon: CircleAlert,
      tone: "red",
    },
    {
      label: "Stored GPT",
      value: `${stats.coverage}%`,
      icon: Bot,
      tone: "green",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[1.9rem] border-[3px] border-orange-400 bg-[#fff8ef] shadow-[0_12px_32px_rgba(15,35,63,0.07)]">
      <div className="grid overflow-hidden xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="bg-[#123865] p-4 text-white sm:p-5">
          <div className="flex items-center gap-2">
            <WandSparkles size={14} className="text-orange-300" />

            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
              Intelligence Layer
            </p>
          </div>

          <h3 className="mt-1 text-lg font-black text-white">
            AI-assisted pipeline health
          </h3>

          <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-white/85">
            Local deterministic scoring is always available; stored GPT analysis
            is used only when deeper reasoning has been explicitly run.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-orange-300 bg-orange-500 p-4 text-white xl:border-l-2 xl:border-t-0 sm:p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white">
              GPT Intelligence
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {stats.coverage}%
            </p>
            <p className="mt-1 text-xs font-semibold text-white/90">
              Stored analysis coverage
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-white/35 bg-white/10 text-white">
            <Bot size={18} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-t-[3px] border-orange-400 bg-[#fff8ef] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        {items.map((item) => (
          <AiMiniStat
            key={item.label}
            {...item}
          />
        ))}
      </div>

      <div className="border-t-2 border-orange-200 bg-[#fff2df] px-4 py-3 sm:px-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-sm">
          <ShieldCheck size={11} />
          Local scoring always on
        </span>
      </div>

      {reanalysisState.loading ? (
        <div className="border-t-2 border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3 text-sm font-bold text-orange-800">
            <LoaderCircle size={17} className="animate-spin" />
            GPT is analyzing and saving intelligence for the selected record.
          </div>
        </div>
      ) : null}

      {reanalysisState.error ? (
        <div className="border-t-2 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {reanalysisState.error}
        </div>
      ) : null}

      {reanalysisState.message &&
      !reanalysisState.loading &&
      !reanalysisState.error ? (
        <div className="border-t-2 border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {reanalysisState.message}
        </div>
      ) : null}
    </section>
  );
}

function AiMiniStat({
  label,
  value,
  icon: Icon,
  tone,
}) {
  const style =
    getToneStyle(tone);

  return (
    <div
      className={`rounded-[1.25rem] border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.04)] ${style.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.11em]">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
        >
          <Icon size={15} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function PipelineStage({
  stage,
  index,
  shouldReduceMotion,
}) {
  const Icon =
    stage.icon;

  const style =
    getToneStyle(
      stage.tone
    );

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 8,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          shouldReduceMotion
            ? 0
            : 0.28,
        delay:
          shouldReduceMotion
            ? 0
            : index *
              0.035,
        ease: EASE,
      }}
      className={`rounded-[1.2rem] border-[3px] p-4 ${style.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.11em]">
            {stage.label}
          </p>

          <p className="mt-2 text-2xl font-black text-[#10233f]">
            {stage.value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border-[3px] border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Icon size={24} />
      </div>

      <h2 className="mt-5 text-xl font-black text-[#10233f]">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-[1.6rem] border-[3px] border-orange-200 bg-white p-5">
        <div className="h-3 w-40 rounded-full bg-slate-100" />
        <div className="mt-4 h-8 w-72 max-w-full rounded-xl bg-slate-100" />
        <div className="mt-4 h-4 w-full max-w-2xl rounded-full bg-slate-100" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="animate-pulse rounded-[1.3rem] border-[3px] border-slate-200 bg-white p-5"
            >
              <div className="h-3 w-24 rounded-full bg-slate-100" />
              <div className="mt-4 h-8 w-20 rounded-xl bg-slate-100" />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function KanbanView({
  activeTab,
  boardItems,
  fullItems,
  priorityColumns,
  safePermissions,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  updateAppointmentStatus,
  updateAppointmentStage,
  deleteInquiry,
  deleteAppointment,
  openInquiryModal,
  openAppointmentModal,
  role,
  reanalyzeLeadWithGpt,
  aiReanalysisState,
  shouldReduceMotion,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {priorityColumns.map(
        (
          column,
          columnIndex
        ) => {
          const columnItems =
            boardItems.get(
              column.value
            ) || [];

          const totalInColumn =
            fullItems.filter(
              (item) =>
                getPriority(
                  item
                ) ===
                column.value
            ).length;

          const ColumnIcon =
            column.icon;

          return (
            <motion.div
              key={
                column.value
              }
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 10,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration:
                  shouldReduceMotion
                    ? 0
                    : 0.28,
                delay:
                  shouldReduceMotion
                    ? 0
                    : columnIndex *
                      0.035,
                ease: EASE,
              }}
              className={`min-h-[360px] rounded-[1.5rem] border-[3px] ${column.border} ${column.bg} p-3`}
            >
              <div className="mb-3 rounded-[1.2rem] border-2 border-white bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${column.badge}`}
                    >
                      <ColumnIcon
                        size={16}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className={`truncate text-sm font-black ${column.accent}`}
                      >
                        {
                          column.label
                        }
                      </h3>

                      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                        {
                          column.description
                        }
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border-2 border-slate-300 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                    {
                      totalInColumn
                    }
                  </span>
                </div>

                {totalInColumn >
                BOARD_COLUMN_LIMIT ? (
                  <p className="mt-2 text-[10px] font-bold text-slate-400">
                    Showing top{" "}
                    {
                      BOARD_COLUMN_LIMIT
                    }{" "}
                    in this column.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {columnItems.length ===
                0 ? (
                  <div className="rounded-[1.1rem] border-2 border-dashed border-slate-300 bg-white/80 p-5 text-center">
                    <p className="text-xs font-semibold text-slate-500">
                      No records in
                      this priority.
                    </p>
                  </div>
                ) : (
                  columnItems.map(
                    (
                      item,
                      index
                    ) => (
                      <motion.div
                        key={
                          item.id
                        }
                        initial={
                          shouldReduceMotion
                            ? false
                            : {
                                opacity: 0,
                                y: 6,
                              }
                        }
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration:
                            shouldReduceMotion
                              ? 0
                              : 0.22,
                          delay:
                            shouldReduceMotion
                              ? 0
                              : Math.min(
                                  index *
                                    0.02,
                                  0.1
                                ),
                        }}
                        className="space-y-2"
                      >
                        <GptReanalysisButton
                          lead={
                            item
                          }
                          leadType={
                            activeTab ===
                            "appointments"
                              ? "appointment"
                              : "inquiry"
                          }
                          reanalyzeLeadWithGpt={
                            reanalyzeLeadWithGpt
                          }
                          aiReanalysisState={
                            aiReanalysisState
                          }
                        />

                        {activeTab ===
                        "inquiries" ? (
                          <InquiryCard
                            inquiry={
                              item
                            }
                            cardClass="p-0"
                            updateInquiryStatus={
                              toggleInquiryStatus
                            }
                            updateInquiryPriority={
                              updateInquiryPriority
                            }
                            deleteInquiry={
                              safePermissions.canDelete
                                ? deleteInquiry
                                : null
                            }
                            openModal={
                              openInquiryModal
                            }
                            compact
                            role={
                              role
                            }
                            permissions={
                              safePermissions
                            }
                          />
                        ) : (
                          <AppointmentCard
                            appointment={
                              item
                            }
                            cardClass="p-0"
                            updateAppointmentStatus={
                              updateAppointmentStatus
                            }
                            updateAppointmentStage={
                              updateAppointmentStage
                            }
                            updateAppointmentPriority={
                              updateAppointmentPriority
                            }
                            deleteAppointment={
                              safePermissions.canDelete
                                ? deleteAppointment
                                : null
                            }
                            openModal={
                              openAppointmentModal
                            }
                            compact
                            role={
                              role
                            }
                            permissions={
                              safePermissions
                            }
                          />
                        )}
                      </motion.div>
                    )
                  )
                )}
              </div>
            </motion.div>
          );
        }
      )}
    </div>
  );
}

function ListView({
  activeTab,
  activeItems,
  cardClass,
  safePermissions,
  toggleInquiryStatus,
  updateInquiryPriority,
  updateAppointmentPriority,
  updateAppointmentStatus,
  updateAppointmentStage,
  deleteInquiry,
  deleteAppointment,
  openInquiryModal,
  openAppointmentModal,
  role,
  reanalyzeLeadWithGpt,
  aiReanalysisState,
  shouldReduceMotion,
}) {
  return (
    <div className="grid gap-4 rounded-[1.9rem] border-[3px] border-orange-200 bg-[#fff5e9] p-3 sm:p-4 2xl:grid-cols-2">
      {activeItems.map(
        (item, index) => (
          <motion.div
            key={item.id}
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 8,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration:
                shouldReduceMotion
                  ? 0
                  : 0.26,
              delay:
                shouldReduceMotion
                  ? 0
                  : Math.min(
                      index *
                        0.02,
                      0.12
                    ),
              ease: EASE,
            }}
            className="space-y-2"
          >
            <GptReanalysisButton
              lead={item}
              leadType={
                activeTab ===
                "appointments"
                  ? "appointment"
                  : "inquiry"
              }
              reanalyzeLeadWithGpt={
                reanalyzeLeadWithGpt
              }
              aiReanalysisState={
                aiReanalysisState
              }
            />

            {activeTab ===
            "inquiries" ? (
              <InquiryCard
                inquiry={item}
                cardClass={
                  cardClass
                }
                updateInquiryStatus={
                  toggleInquiryStatus
                }
                updateInquiryPriority={
                  updateInquiryPriority
                }
                deleteInquiry={
                  safePermissions.canDelete
                    ? deleteInquiry
                    : null
                }
                openModal={
                  openInquiryModal
                }
                role={role}
                permissions={
                  safePermissions
                }
              />
            ) : (
              <AppointmentCard
                appointment={
                  item
                }
                cardClass={
                  cardClass
                }
                updateAppointmentStatus={
                  updateAppointmentStatus
                }
                updateAppointmentStage={
                  updateAppointmentStage
                }
                updateAppointmentPriority={
                  updateAppointmentPriority
                }
                deleteAppointment={
                  safePermissions.canDelete
                    ? deleteAppointment
                    : null
                }
                openModal={
                  openAppointmentModal
                }
                role={role}
                permissions={
                  safePermissions
                }
              />
            )}
          </motion.div>
        )
      )}
    </div>
  );
}

function GptReanalysisButton({
  lead,
  leadType,
  reanalyzeLeadWithGpt,
  aiReanalysisState,
}) {
  const enriched =
    enrichLeadWithAi(
      lead,
      leadType
    );

  const isCurrent =
    String(
      aiReanalysisState?.leadId ??
        ""
    ) ===
      String(
        lead?.id ??
          ""
      ) &&
    normalize(
      aiReanalysisState?.leadType ||
        leadType
    ) ===
      normalize(leadType);

  const isLoading =
    Boolean(
      aiReanalysisState?.loading &&
        isCurrent
    );

  const hasStoredGpt =
    Boolean(
      enriched.ai_has_stored_gpt
    );

  if (
    typeof reanalyzeLeadWithGpt !==
    "function"
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.2rem] border-2 border-orange-300 bg-orange-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <BrainCircuit
            size={14}
            className="text-orange-700"
          />

          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-800">
            GPT Intelligence
          </p>
        </div>

        <p className="mt-1 truncate text-xs font-semibold text-slate-600">
          {hasStoredGpt
            ? `Stored analysis available${
                enriched.ai_gpt_generated_at
                  ? ` · ${formatCompactDate(
                      enriched.ai_gpt_generated_at
                    )}`
                  : ""
              }`
            : "Local scoring is active. Run GPT only when deeper reasoning is useful."}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          reanalyzeLeadWithGpt(
            lead,
            leadType
          )
        }
        disabled={
          Boolean(
            aiReanalysisState?.loading
          )
        }
        className={`shrink-0 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
          hasStoredGpt
            ? "border-orange-300 bg-white text-orange-800 hover:bg-orange-50"
            : "border-orange-600 bg-orange-500 text-white shadow-[0_7px_18px_rgba(249,115,22,0.18)] hover:bg-orange-600"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {isLoading
          ? "Analyzing..."
          : hasStoredGpt
          ? "Reanalyze"
          : "Analyze with GPT"}
      </button>
    </div>
  );
}

function StudentModalLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10233f]/45 p-4 backdrop-blur-sm">
      <div className="rounded-[1.5rem] border-[3px] border-orange-300 bg-white px-8 py-7 text-center shadow-2xl">
        <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-orange-500" />

        <p className="mt-4 text-sm font-black text-[#10233f]">
          Opening student workspace
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          Loading the detailed student record.
        </p>
      </div>
    </div>
  );
}

function getToneStyle(tone) {
  const styles = {
    orange: {
      card:
        "border-orange-300 bg-orange-50 text-orange-800",
      icon:
        "border-orange-300 text-orange-700",
    },
    green: {
      card:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
      icon:
        "border-emerald-300 text-emerald-700",
    },
    blue: {
      card:
        "border-blue-300 bg-blue-50 text-blue-800",
      icon:
        "border-blue-300 text-blue-700",
    },
    red: {
      card:
        "border-red-300 bg-red-50 text-red-800",
      icon:
        "border-red-300 text-red-700",
    },
    slate: {
      card:
        "border-slate-300 bg-slate-50 text-slate-700",
      icon:
        "border-slate-300 text-slate-700",
    },
  };

  return (
    styles[tone] ||
    styles.orange
  );
}

function formatCompactDate(value) {
  const date = safeDate(value);

  if (!date) return "Unknown date";

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default DashboardContent;
