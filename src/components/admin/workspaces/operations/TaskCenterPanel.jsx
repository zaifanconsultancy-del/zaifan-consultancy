// TaskCenterPanel V4 MAXIMUM — Zaifan Task / Operations OS
// Full replacement for: src/components/admin/TaskCenterPanel.jsx
//
// Requires Task OS Schema Upgrade V2:
// task_type, source, related_type, related_id, started_at, reminder_at,
// blocked_reason, metadata, archived_at, is_archived.
//
// Major upgrades:
// - real Supabase rows on create (no fake local IDs)
// - search + operational views + filters + pagination
// - create / edit / duplicate / archive / restore / permanent delete
// - priority, status, assignment, due dates, reminders, blocked reason
// - task context linking (document/application/visa/etc.)
// - suggested-task dedupe
// - optimistic stable mutations with rollback
// - timeline logging
// - scalable task queue instead of endless cards
// - approved Zaifan Admin OS visual language
// - student_id + student_type identity-safe reads and mutations
// - shared Student OS task data treated as authoritative when supplied
// - request-generation protection when switching students
// - per-task concurrency instead of one global task lock
// - timeout cleanup + post-timeout reconciliation for uncertain updates
// - audit/timeline and parent-sync failures reported separately from core saves
// - truthful task lifecycle timestamps for start / complete / reopen / cancel
// - no accidental duplicate IDs/archival metadata when duplicating tasks
// - stronger suggested-task intelligence and English-test recognition
// - due-today is distinct from overdue
// - task health, ownership pressure, reminder pressure and stale-work intelligence
// - unsaved edit detection + no-op save prevention
// - safer permanent-delete scoping
// - no fake AI; suggested tasks remain deterministic rules

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Copy,
  Edit3,
  History,
  ListTodo,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 18000;
const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  "pending",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
];

const PRIORITY_OPTIONS = [
  "critical",
  "urgent",
  "high",
  "medium",
  "low",
];

const TASK_TYPE_OPTIONS = [
  "general",
  "follow_up",
  "document",
  "application",
  "visa",
  "university",
  "finance",
  "support",
  "communication",
  "portal",
  "internal",
];

const RELATED_TYPE_OPTIONS = [
  "",
  "document",
  "application",
  "visa",
  "university",
  "invoice",
  "support",
  "communication",
  "portal",
];

const EMPTY_TASK_FORM = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  assigned_to: "",
  due_date: "",
  notes: "",
  task_type: "general",
  source: "manual",
  related_type: "",
  related_id: "",
  reminder_at: "",
  blocked_reason: "",
};

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const pretty = (value = "") =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const formatDateTime = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const dueMeta = (task) => {
  if (!task?.due_date) {
    return { label: "No due date", tone: "slate", overdue: false, dueToday: false };
  }

  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) {
    return { label: "Invalid due date", tone: "slate", overdue: false, dueToday: false };
  }

  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const hours = Math.ceil(diff / 3600000);

  if (["completed", "cancelled"].includes(normalize(task.status))) {
    return {
      label: formatDateTime(task.due_date),
      tone: "slate",
      overdue: false,
      dueToday: false,
    };
  }

  if (hours < 0) {
    return {
      label: `${Math.max(1, Math.ceil(Math.abs(hours) / 24))}d overdue`,
      tone: "red",
      overdue: true,
      dueToday: false,
    };
  }

  if (hours <= 24) {
    return {
      label: hours <= 1 ? "Due very soon" : `Due in ${hours}h`,
      tone: "orange",
      overdue: false,
      dueToday: true,
    };
  }

  if (hours <= 72) {
    return {
      label: `Due in ${Math.ceil(hours / 24)}d`,
      tone: "blue",
      overdue: false,
      dueToday: false,
    };
  }

  return {
    label: formatDateTime(task.due_date),
    tone: "slate",
    overdue: false,
    dueToday: false,
  };
};

function TaskCenterPanel({
  student = {},
  adminProfile = null,
  sharedTasks = null,
  sharedApplication = null,
  sharedDocuments = null,
  onSharedDataChange = null,
}) {
  const [tasks, setTasks] = useState(Array.isArray(sharedTasks) ? sharedTasks : []);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [editingTask, setEditingTask] = useState(null);

  const [loading, setLoading] = useState(false);
  const [busyMap, setBusyMap] = useState({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [auditWarning, setAuditWarning] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [query, setQuery] = useState("");
  const [view, setView] = useState("needs_action");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("smart");
  const [page, setPage] = useState(1);

  const mountedRef = useRef(true);
  const requestRef = useRef(0);
  const identityRef = useRef("");

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const studentType = normalize(
    student?.student_type || student?.__leadType || student?.type || "inquiry"
  );
  const hasValidStudentId =
    Number.isFinite(numericStudentId) && numericStudentId > 0;
  const studentIdentity = `${String(studentId || "")}:${studentType}`;

  const studentName =
    student?.full_name || student?.name || student?.student_name || "Student";

  const studentApplication = sharedApplication || student?.application || null;
  const studentDocuments = Array.isArray(sharedDocuments)
    ? sharedDocuments
    : Array.isArray(student?.documents)
    ? student.documents
    : [];

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!Array.isArray(sharedTasks)) return;
    setTasks(sharedTasks);
    setLastSyncedAt(new Date());
  }, [sharedTasks]);

  useEffect(() => {
    if (identityRef.current === studentIdentity) return;

    identityRef.current = studentIdentity;
    requestRef.current += 1;

    setTaskForm(EMPTY_TASK_FORM);
    setEditingTask(null);
    setError("");
    setSuccessMessage("");
    setAuditWarning("");
    setPage(1);

    if (Array.isArray(sharedTasks)) {
      setTasks(sharedTasks);
      setLoading(false);
      setLastSyncedAt(new Date());
      return;
    }

    void loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIdentity]);

  useEffect(() => {
    setPage(1);
  }, [query, view, statusFilter, priorityFilter, typeFilter, sortBy]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const withTimeout = (promise, message = "Request timed out.") => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      REQUEST_TIMEOUT_MS
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
};

  const setBusy = (key, action = true) => {
    setBusyMap((previous) => ({
      ...previous,
      [key]: action,
    }));
  };

  const clearBusy = (key) => {
    setBusyMap((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const isBusy = (key) => Boolean(busyMap[key]);

  const hasAnyBusy = Object.keys(busyMap).length > 0;

  const notifyParent = async (payload = {}) => {
    if (typeof onSharedDataChange !== "function") {
      return { ok: true, skipped: true };
    }

    try {
      await withTimeout(
        Promise.resolve(onSharedDataChange(payload)),
        "Student OS background sync timed out."
      );

      safeSet(() => setLastSyncedAt(new Date()));
      return { ok: true };
    } catch (refreshError) {
      console.warn(
        "Task saved; background Student OS sync delayed:",
        refreshError
      );

      return {
        ok: false,
        message:
          refreshError?.message ||
          "Student OS background refresh did not confirm.",
      };
    }
  };

  const createTimelineEvent = async ({
    eventType,
    title,
    description = "",
    oldValue = "",
    newValue = "",
  }) => {
    if (!hasValidStudentId || !eventType || !title) return;

    try {
      const { error: timelineError } = await withTimeout(
        supabase.from("student_application_timeline").insert({
          student_id: numericStudentId,
          student_type: studentType,
          application_id: studentApplication?.id
            ? String(studentApplication.id)
            : null,
          event_type: eventType,
          title,
          description,
          old_value: oldValue ? String(oldValue) : null,
          new_value: newValue ? String(newValue) : null,
        }),
        "Task timeline event timed out."
      );

      if (timelineError) throw timelineError;
      return { ok: true };
    } catch (timelineError) {
      console.warn("Task timeline event skipped:", timelineError);
      return {
        ok: false,
        message:
          timelineError?.message ||
          "Task timeline event did not confirm.",
      };
    }
  };

  const loadTasks = async ({ force = false } = {}) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (Array.isArray(sharedTasks) && !force) {
      safeSet(() => {
        setTasks(sharedTasks);
        setLoading(false);
        setError("");
        setLastSyncedAt(new Date());
      });
      return;
    }

    if (!hasValidStudentId) {
      safeSet(() => {
        setTasks([]);
        setLoading(false);
        setError("Invalid student id. Tasks cannot load.");
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      setError("");
    });

    try {
      const { data, error: loadError } = await withTimeout(
        supabase
          .from("student_tasks")
          .select("*")
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .order("created_at", { ascending: false })
          .limit(500),
        "Task portfolio loading timed out."
      );

      if (requestRef.current !== requestId) return;
      if (loadError) throw loadError;

      safeSet(() => {
        setTasks(Array.isArray(data) ? data : []);
        setLastSyncedAt(new Date());
      });
    } catch (loadError) {
      if (requestRef.current !== requestId) return;

      safeSet(() => {
        setError(loadError?.message || "Tasks failed to load.");
      });
    } finally {
      if (requestRef.current === requestId) {
        safeSet(() => setLoading(false));
      }
    }
  };

  const suggestedTasks = useMemo(() => {
    const requiredDocuments = [
      "Passport",
      "Transcript",
      "Degree",
      "IELTS",
      "Personal Statement",
      "CV",
      "Financial Documents",
    ];

    const documentAliases = {
      ielts: [
        "ielts",
        "pte",
        "toefl",
        "duolingo english test",
        "english test",
        "english language test",
      ],
      transcript: ["transcript", "academic transcript"],
      degree: ["degree", "degree certificate", "diploma"],
      "personal statement": [
        "personal statement",
        "statement of purpose",
        "sop",
      ],
      cv: ["cv", "resume", "curriculum vitae"],
      "financial documents": [
        "financial documents",
        "financial statement",
        "bank statement",
        "proof of funds",
      ],
      passport: ["passport", "passport copy"],
    };

    const missingDocs = requiredDocuments.filter((doc) => {
      const aliases =
        documentAliases[normalize(doc)] ||
        [String(doc).toLowerCase()];

      const existing = studentDocuments.find((item) => {
        const name = String(
          item.document_name ||
            item.name ||
            item.document_type ||
            ""
        )
          .trim()
          .toLowerCase();

        return aliases.some((alias) => name === alias);
      });

      return (
        !existing ||
        ["missing", "rejected", "expired"].includes(
          normalize(existing.status)
        )
      );
    });

    const generated = [];

    if (missingDocs.length) {
      generated.push({
        title: "Documents pending",
        description: `${missingDocs.length} document(s) still need attention.`,
        priority: "high",
        task_type: "document",
        related_type: "document",
        notes: missingDocs.join(", "),
        source: "rule_engine",
      });
    }

    if (!studentApplication) {
      generated.push({
        title: "Create application profile",
        description: "Application record has not been created yet.",
        priority: "medium",
        task_type: "application",
        related_type: "application",
        notes:
          "Create target country, university, program, intake and application status.",
        source: "rule_engine",
      });
    }

    if (
      ["offer_received", "received", "conditional_offer", "unconditional_offer"].includes(
        normalize(studentApplication?.offer_status)
      ) &&
      ["", "not_started", "none"].includes(
        normalize(studentApplication?.visa_status)
      )
    ) {
      generated.push({
        title: "Start visa process",
        description: "Offer received. Visa workflow should begin.",
        priority: "high",
        task_type: "visa",
        related_type: "visa",
        notes:
          "Prepare financial evidence, visa requirements, biometrics and medical timeline.",
        source: "rule_engine",
      });
    }

    if (["vip", "high"].includes(normalize(student?.priority))) {
      generated.push({
        title: "High priority follow-up",
        description: "This student should be contacted quickly.",
        priority: "high",
        task_type: "follow_up",
        related_type: "communication",
        notes: "Priority lead. Counselor follow-up required.",
        source: "rule_engine",
      });
    }

    // Do not keep suggesting an operational task if an equivalent active task already exists.
    return generated.filter((suggestion) => {
      const suggestionTitle = normalize(suggestion.title);

      return !tasks.some(
        (task) =>
          !task.is_archived &&
          !["completed", "cancelled"].includes(normalize(task.status)) &&
          normalize(task.title) === suggestionTitle
      );
    });
  }, [studentDocuments, studentApplication, student, tasks]);

  const taskStats = useMemo(() => {
    const now = Date.now();

    let total = 0;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let blocked = 0;
    let overdue = 0;
    let archived = 0;
    let unassigned = 0;
    let remindersDue = 0;
    let stale = 0;

    for (const task of tasks) {
      if (task.is_archived) {
        archived += 1;
        continue;
      }

      total += 1;

      const status = normalize(task.status);
      const isClosed = ["completed", "cancelled"].includes(status);

      if (status === "completed") completed += 1;
      if (status === "pending") pending += 1;
      if (status === "in_progress") inProgress += 1;
      if (status === "blocked") blocked += 1;

      if (dueMeta(task).overdue) {
        overdue += 1;
      }

      if (!String(task.assigned_to || "").trim()) {
        unassigned += 1;
      }

      if (!isClosed && task.reminder_at) {
        const reminder = new Date(task.reminder_at);

        if (
          !Number.isNaN(reminder.getTime()) &&
          reminder.getTime() <= now
        ) {
          remindersDue += 1;
        }
      }

      if (!isClosed) {
        const updated = new Date(
          task.updated_at || task.created_at || 0
        );

        if (
          !Number.isNaN(updated.getTime()) &&
          now - updated.getTime() >= 14 * 86400000
        ) {
          stale += 1;
        }
      }
    }

    const completionRate = total
      ? Math.round((completed / total) * 100)
      : 0;

    return {
      total,
      completed,
      pending,
      inProgress,
      blocked,
      overdue,
      archived,
      unassigned,
      remindersDue,
      stale,
      completionRate,
    };
  }, [tasks]);

  const buildPayload = (form) => ({
    student_id: numericStudentId,
    student_type: studentType,
    title: String(form.title || "").trim(),
    description: String(form.description || "").trim() || null,
    status: normalize(form.status || "pending"),
    priority: normalize(form.priority || "medium"),
    assigned_to: String(form.assigned_to || "").trim() || null,
    due_date: toIsoOrNull(form.due_date),
    notes: String(form.notes || "").trim() || null,
    created_by:
      form.created_by ||
      adminProfile?.full_name ||
      adminProfile?.name ||
      adminProfile?.email ||
      "CRM",
    task_type: normalize(form.task_type || "general"),
    source: form.source || "manual",
    related_type: form.related_type || null,
    related_id: form.related_id ? String(form.related_id) : null,
    reminder_at: toIsoOrNull(form.reminder_at),
    blocked_reason:
      normalize(form.status) === "blocked"
        ? String(form.blocked_reason || "").trim() || null
        : null,
    metadata: {
      student_name: studentName,
      created_from: "admin_task_center",
      ...(form.metadata || {}),
    },
  });

  const reconcileTask = async (taskId, expectedUpdatedAt = "") => {
    if (!taskId) return null;

    try {
      const { data, error: reconcileError } = await withTimeout(
        supabase
          .from("student_tasks")
          .select("*")
          .eq("id", taskId)
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType)
          .single(),
        "Task reconciliation timed out."
      );

      if (reconcileError) throw reconcileError;
      if (!data) return null;

      if (
        expectedUpdatedAt &&
        data.updated_at &&
        String(data.updated_at) !== String(expectedUpdatedAt)
      ) {
        return null;
      }

      return data;
    } catch (reconcileError) {
      console.warn("Task reconciliation failed:", reconcileError);
      return null;
    }
  };

  const createTask = async (task, source = "custom") => {
    if (!hasValidStudentId) return false;

    const payload = buildPayload({
      ...EMPTY_TASK_FORM,
      ...task,
      source: task.source || (source === "suggested" ? "rule_engine" : "manual"),
    });

    if (!payload.title) {
      setError("Task title is required.");
      return false;
    }

    const key = `create-${normalize(payload.title) || "task"}`;

    if (isBusy(key)) return false;

    setBusy(key, "creating");
    setError("");
    setSuccessMessage("");
    setAuditWarning("");

    try {
      const { data, error: createError } = await withTimeout(
        supabase
          .from("student_tasks")
          .insert(payload)
          .select("*")
          .single(),
        "Task creation timed out."
      );

      if (createError) throw createError;

      safeSet(() => {
        setTasks((previous) => [data, ...previous]);
        setTaskForm(EMPTY_TASK_FORM);
        setSuccessMessage("Task created successfully.");
      });

      const [timelineResult, syncResult] = await Promise.all([
        createTimelineEvent({
          eventType: "task_created",
          title: "Task Created",
          description: `${
            source === "suggested" ? "Suggested" : "Custom"
          } task created for ${studentName}: ${data.title}`,
          newValue: data.title,
        }),
        notifyParent({ source: "task_created", task: data }),
      ]);

      if (!timelineResult?.ok || !syncResult?.ok) {
        safeSet(() =>
          setAuditWarning(
            "Task created, but one or more Student OS audit/background sync steps did not confirm."
          )
        );
      }

      return true;
    } catch (createError) {
      safeSet(() =>
        setError(createError?.message || "Task creation failed.")
      );
      return false;
    } finally {
      safeSet(() => clearBusy(key));
    }
  };

  const updateTask = async (task, patch, successText, timeline = null) => {
    if (!task?.id) return null;

    const key = `task-${task.id}`;
    if (isBusy(key)) return null;

    const previous = { ...task };
    const optimistic = {
      ...patch,
      updated_at: new Date().toISOString(),
    };

    setBusy(key, "saving");
    setError("");
    setSuccessMessage("");
    setAuditWarning("");

    safeSet(() => {
      setTasks((rows) =>
        rows.map((row) =>
          String(row.id) === String(task.id)
            ? { ...row, ...optimistic }
            : row
        )
      );
    });

    try {
      let result;

      try {
        result = await withTimeout(
          supabase
            .from("student_tasks")
            .update(optimistic)
            .eq("id", task.id)
            .eq("student_id", numericStudentId)
            .eq("student_type", studentType)
            .select("*")
            .single(),
          "Task update timed out."
        );
      } catch (updateError) {
        if (
          String(updateError?.message || "")
            .toLowerCase()
            .includes("timed out")
        ) {
          const reconciled = await reconcileTask(
            task.id,
            optimistic.updated_at
          );

          if (reconciled) {
            result = { data: reconciled, error: null };
          } else {
            throw new Error(
              "Task update timed out and could not be verified. The previous UI state was restored. Refresh before retrying."
            );
          }
        } else {
          throw updateError;
        }
      }

      if (result?.error) throw result.error;

      const data = result?.data;

      safeSet(() => {
        setTasks((rows) =>
          rows.map((row) =>
            String(row.id) === String(task.id) ? data : row
          )
        );
        setSuccessMessage(successText);
      });

      const timelineResult = timeline
        ? await createTimelineEvent({
            ...timeline,
            oldValue: timeline.oldValue ?? "",
            newValue: timeline.newValue ?? "",
          })
        : { ok: true, skipped: true };

      const syncResult = await notifyParent({
        source: "task_updated",
        task: data,
      });

      if (!timelineResult?.ok || !syncResult?.ok) {
        safeSet(() =>
          setAuditWarning(
            "Task data saved, but one or more Student OS audit/background sync steps did not confirm."
          )
        );
      }

      return data;
    } catch (updateError) {
      safeSet(() => {
        setTasks((rows) =>
          rows.map((row) =>
            String(row.id) === String(task.id) ? previous : row
          )
        );
        setError(updateError?.message || "Task update failed.");
      });
      return null;
    } finally {
      safeSet(() => clearBusy(key));
    }
  };

  const updateTaskStatus = async (task, nextStatus) => {
    const oldStatus = normalize(task.status || "pending");
    const status = normalize(nextStatus || "pending");

    if (oldStatus === status) return;

    const now = new Date().toISOString();

    const patch = {
      status,
      started_at:
        status === "in_progress"
          ? task.started_at || now
          : status === "pending"
          ? null
          : task.started_at || null,
      completed_at:
        status === "completed"
          ? task.completed_at || now
          : null,
      blocked_reason:
        status === "blocked"
          ? task.blocked_reason || "Blocker not documented yet."
          : null,
    };

    await updateTask(
      task,
      patch,
      `Task marked ${pretty(status)}.`,
      {
        eventType:
          status === "completed"
            ? "task_completed"
            : status === "blocked"
            ? "task_blocked"
            : "task_status_changed",
        title:
          status === "completed"
            ? "Task Completed"
            : status === "blocked"
            ? "Task Blocked"
            : "Task Status Updated",
        description: `${task.title} changed from ${pretty(
          oldStatus
        )} to ${pretty(status)}.`,
        oldValue: oldStatus,
        newValue: status,
      }
    );
  };

  const saveEditedTask = async () => {
    if (!editingTask?.id) return;

    const original = tasks.find(
      (task) => String(task.id) === String(editingTask.id)
    );

    const payload = buildPayload(editingTask);
    delete payload.student_id;
    delete payload.student_type;
    delete payload.created_by;

    const comparableFields = [
      "title",
      "description",
      "status",
      "priority",
      "assigned_to",
      "due_date",
      "notes",
      "task_type",
      "source",
      "related_type",
      "related_id",
      "reminder_at",
      "blocked_reason",
    ];

    const changed = comparableFields.some((field) => {
      const before = original?.[field] ?? null;
      const after = payload?.[field] ?? null;
      return String(before ?? "") !== String(after ?? "");
    });

    if (!changed) {
      setSuccessMessage("No task changes to save.");
      return;
    }

    const saved = await updateTask(
      editingTask,
      payload,
      "Task details saved.",
      {
        eventType: "task_details_updated",
        title: "Task Details Updated",
        description: `${editingTask.title} task details were updated.`,
        newValue: payload.title,
      }
    );

    if (saved?.id) {
      setEditingTask(null);
    }
  };

  const duplicateTask = async (task) => {
    if (!task?.id) return;

    const {
      id,
      student_id,
      student_type,
      created_at,
      updated_at,
      created_by,
      completed_at,
      started_at,
      archived_at,
      is_archived,
      metadata,
      ...copyable
    } = task;

    await createTask(
      {
        ...copyable,
        title: `${task.title} Copy`,
        status: "pending",
        source: "duplicate",
        due_date: toLocalInput(task.due_date),
        reminder_at: toLocalInput(task.reminder_at),
        blocked_reason: "",
        metadata: {
          ...(metadata || {}),
          duplicated_from_task_id: String(task.id),
        },
      },
      "duplicate"
    );
  };

  const archiveTask = async (task) => {
    await updateTask(
      task,
      {
        is_archived: true,
        archived_at: new Date().toISOString(),
      },
      "Task archived.",
      {
        eventType: "task_archived",
        title: "Task Archived",
        description: `${task.title} was archived.`,
        newValue: "archived",
      }
    );
  };

  const restoreTask = async (task) => {
    await updateTask(
      task,
      {
        is_archived: false,
        archived_at: null,
      },
      "Task restored.",
      {
        eventType: "task_restored",
        title: "Task Restored",
        description: `${task.title} was restored.`,
        newValue: "active",
      }
    );
  };

  const permanentlyDeleteTask = async (task) => {
    if (!task?.id || !task.is_archived) return;

    const key = `task-${task.id}`;
    if (isBusy(key)) return;

    const confirmed = window.confirm(
      `PERMANENTLY delete "${task.title}"?\n\nUse this only for accidental/test tasks. This cannot be undone.`
    );

    if (!confirmed) return;

    setBusy(key, "deleting");
    setError("");
    setAuditWarning("");

    try {
      const { error: deleteError } = await withTimeout(
        supabase
          .from("student_tasks")
          .delete()
          .eq("id", task.id)
          .eq("student_id", numericStudentId)
          .eq("student_type", studentType),
        "Task deletion timed out."
      );

      if (deleteError) throw deleteError;

      safeSet(() => {
        setTasks((rows) => rows.filter((row) => row.id !== task.id));
        setSuccessMessage("Archived task permanently deleted.");
      });

      const [timelineResult, syncResult] = await Promise.all([
        createTimelineEvent({
          eventType: "task_deleted",
          title: "Task Permanently Deleted",
          description: `${task.title} was permanently deleted.`,
          oldValue: task.title,
        }),
        notifyParent({
          source: "task_deleted",
          taskId: task.id,
        }),
      ]);

      if (!timelineResult?.ok || !syncResult?.ok) {
        safeSet(() =>
          setAuditWarning(
            "Task was deleted, but one or more Student OS audit/background sync steps did not confirm."
          )
        );
      }
    } catch (deleteError) {
      safeSet(() =>
        setError(deleteError?.message || "Task deletion failed.")
      );
    } finally {
      safeSet(() => clearBusy(key));
    }
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const queryText = String(query || "").trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      const status = normalize(task.status || "pending");
      const priority = normalize(task.priority || "medium");
      const type = normalize(task.task_type || "general");
      const due = task.due_date ? new Date(task.due_date) : null;

      if (view === "archived" && !task.is_archived) return false;
      if (view !== "archived" && task.is_archived) return false;

      if (view === "needs_action") {
        if (["completed", "cancelled"].includes(status)) return false;
      }

      if (view === "today") {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        if (
          ["completed", "cancelled"].includes(status) ||
          !due ||
          Number.isNaN(due.getTime()) ||
          due < startOfToday ||
          due > todayEnd
        ) {
          return false;
        }
      }

      if (view === "overdue" && !dueMeta(task).overdue) return false;
      if (view === "blocked" && status !== "blocked") return false;
      if (view === "completed" && status !== "completed") return false;

      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (priorityFilter !== "all" && priority !== priorityFilter) return false;
      if (typeFilter !== "all" && type !== typeFilter) return false;

      if (!queryText) return true;

      const haystack = [
        task.title,
        task.description,
        task.notes,
        task.assigned_to,
        task.task_type,
        task.source,
        task.related_type,
        task.related_id,
        task.blocked_reason,
        task.status,
        task.priority,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(queryText);
    });

    const priorityRank = {
      critical: 5,
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }

      if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }

      if (sortBy === "priority") {
        return (
          (priorityRank[normalize(b.priority)] || 0) -
          (priorityRank[normalize(a.priority)] || 0)
        );
      }

      if (sortBy === "due") {
        const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return aDue - bDue;
      }

      // Smart operational order:
      // overdue -> blocked -> in progress -> priority -> due date -> newest
      const aMeta = dueMeta(a);
      const bMeta = dueMeta(b);

      if (aMeta.overdue !== bMeta.overdue) return aMeta.overdue ? -1 : 1;

      const aBlocked = normalize(a.status) === "blocked";
      const bBlocked = normalize(b.status) === "blocked";
      if (aBlocked !== bBlocked) return aBlocked ? -1 : 1;

      const aProgress = normalize(a.status) === "in_progress";
      const bProgress = normalize(b.status) === "in_progress";
      if (aProgress !== bProgress) return aProgress ? -1 : 1;

      const priorityDiff =
        (priorityRank[normalize(b.priority)] || 0) -
        (priorityRank[normalize(a.priority)] || 0);

      if (priorityDiff !== 0) return priorityDiff;

      const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;

      if (aDue !== bDue) return aDue - bDue;

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [
    tasks,
    query,
    view,
    statusFilter,
    priorityFilter,
    typeFilter,
    sortBy,
  ]);

  const operationalIntelligence = useMemo(() => {
    const active = tasks.filter(
      (task) =>
        !task.is_archived &&
        !["completed", "cancelled"].includes(normalize(task.status))
    );

    const nextDue = [...active]
      .filter((task) => task.due_date)
      .map((task) => ({
        task,
        time: new Date(task.due_date).getTime(),
      }))
      .filter((item) => Number.isFinite(item.time))
      .sort((a, b) => a.time - b.time)
      .find((item) => item.time >= Date.now());

    const criticalOpen = active.filter((task) =>
      ["critical", "urgent"].includes(normalize(task.priority))
    ).length;

    return {
      nextDue: nextDue?.task || null,
      criticalOpen,
      unassigned: taskStats.unassigned,
      remindersDue: taskStats.remindersDue,
      stale: taskStats.stale,
      completionRate: taskStats.completionRate,
    };
  }, [tasks, taskStats]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedTasks = filteredTasks.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="space-y-4 bg-[#fffaf4] p-3 text-[#10233f] sm:p-4 lg:p-5">
      <section className="rounded-[1.7rem] border-[3px] border-orange-500 bg-white p-4 shadow-[0_12px_32px_rgba(121,72,40,0.08)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge text="Task OS" tone="orange" />
              <Badge text={`Student #${studentId || "—"}`} tone="navy" />
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#10233f]">
              Student Operations Command
            </h2>

            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Control next actions, ownership, deadlines, blockers and completion
              without turning the student record into an endless task wall.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTaskForm(EMPTY_TASK_FORM)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0"
            >
              <Plus size={15} />
              New Task
            </button>

            <button
              type="button"
              onClick={() => loadTasks({ force: true })}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-xs font-black text-[#10233f] shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-md active:translate-y-0 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
          <Metric label="Active" value={taskStats.total} icon={ListTodo} />
          <Metric label="Pending" value={taskStats.pending} icon={CircleDashed} tone="blue" />
          <Metric label="In Progress" value={taskStats.inProgress} icon={Clock3} tone="orange" />
          <Metric label="Blocked" value={taskStats.blocked} icon={ShieldAlert} tone={taskStats.blocked ? "red" : "slate"} />
          <Metric label="Overdue" value={taskStats.overdue} icon={CalendarClock} tone={taskStats.overdue ? "red" : "slate"} />
          <Metric label="Completed" value={taskStats.completed} icon={CheckCircle2} tone="green" />
          <Metric label="Archived" value={taskStats.archived} icon={Archive} />
          <Metric label="Unassigned" value={taskStats.unassigned} icon={UserRound} tone={taskStats.unassigned ? "orange" : "slate"} />
          <Metric label="Reminder Due" value={taskStats.remindersDue} icon={BellRing} tone={taskStats.remindersDue ? "red" : "slate"} />
          <Metric label="Stale 14d+" value={taskStats.stale} icon={TimerReset} tone={taskStats.stale ? "orange" : "slate"} />
        </div>
      </section>

      {error ? (
        <Feedback tone="error" onClose={() => setError("")}>
          {error}
        </Feedback>
      ) : null}

      {successMessage ? (
        <Feedback tone="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Feedback>
      ) : null}

      {auditWarning ? (
        <Feedback tone="warning" onClose={() => setAuditWarning("")}>
          {auditWarning}
        </Feedback>
      ) : null}

      <section className="rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading
            eyebrow="Operations Intelligence"
            title="Task Pressure Check"
            description="Deterministic queue signals from deadlines, ownership, reminders, stale work and active priority."
          />

          {lastSyncedAt ? (
            <Badge
              text={`Synced ${lastSyncedAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
              tone="slate"
            />
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <PressureTile
            label="Next Due"
            value={
              operationalIntelligence.nextDue
                ? operationalIntelligence.nextDue.title
                : "No upcoming due task"
            }
            helper={
              operationalIntelligence.nextDue
                ? formatDateTime(operationalIntelligence.nextDue.due_date)
                : "Queue has no future deadline"
            }
            tone={operationalIntelligence.nextDue ? "orange" : "green"}
          />
          <PressureTile
            label="Critical / Urgent"
            value={operationalIntelligence.criticalOpen}
            helper="Active high-pressure work"
            tone={operationalIntelligence.criticalOpen ? "red" : "green"}
          />
          <PressureTile
            label="Unassigned"
            value={operationalIntelligence.unassigned}
            helper="Tasks without an owner"
            tone={operationalIntelligence.unassigned ? "orange" : "green"}
          />
          <PressureTile
            label="Reminder Due"
            value={operationalIntelligence.remindersDue}
            helper="Reminder time already reached"
            tone={operationalIntelligence.remindersDue ? "red" : "green"}
          />
          <PressureTile
            label="Stale Work"
            value={operationalIntelligence.stale}
            helper="Open tasks untouched for 14+ days"
            tone={operationalIntelligence.stale ? "orange" : "green"}
          />
          <PressureTile
            label="Completion"
            value={`${operationalIntelligence.completionRate}%`}
            helper="Completed share of active portfolio"
            tone="blue"
          />
        </div>
      </section>

      <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4">
        <SectionHeading
          eyebrow="Create Work"
          title="New Operational Task"
          description="Create a task with ownership, deadline, reminder and context."
        />

        <TaskForm
          form={taskForm}
          setForm={setTaskForm}
          disabled={hasAnyBusy}
          submitLabel={
            Object.keys(busyMap).some((key) => key.startsWith("create-"))
              ? "Creating..."
              : "Create Task"
          }
          onSubmit={() => createTask(taskForm, "custom")}
        />
      </section>

      <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <SectionHeading
            eyebrow="Rule-Based Intelligence"
            title="Suggested Tasks"
            description="Suggestions disappear automatically when an equivalent active task already exists."
          />

          <Badge
            text={`${suggestedTasks.length} suggestion${
              suggestedTasks.length === 1 ? "" : "s"
            }`}
            tone="orange"
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {suggestedTasks.length ? (
            suggestedTasks.map((task) => (
              <div
                key={task.title}
                className="rounded-2xl border-2 border-orange-300 bg-[#fffaf4] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-orange-600">
                    <Sparkles size={17} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <PriorityBadge value={task.priority} />
                      <TypeBadge value={task.task_type} />
                    </div>

                    <h3 className="mt-2 font-black text-[#10233f]">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                      {task.description}
                    </p>

                    {task.notes ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {task.notes}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      disabled={hasAnyBusy}
                      onClick={() => createTask(task, "suggested")}
                      className="mt-3 rounded-xl border-2 border-orange-500 bg-orange-50 px-4 py-2 text-xs font-black text-orange-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-100 hover:shadow-md active:translate-y-0 disabled:opacity-40"
                    >
                      Save Suggested Task
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="lg:col-span-2 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-sm font-bold text-emerald-800">
              No new operational suggestions. Existing active tasks already cover the current rules.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4">
        <SectionHeading
          eyebrow="Work Queue"
          title="Task Portfolio"
          description="Use operational views, filters and pagination instead of scrolling through hundreds of cards."
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {[
            ["needs_action", "Needs Action"],
            ["today", "Today"],
            ["overdue", "Overdue"],
            ["blocked", "Blocked"],
            ["all", "All Active"],
            ["completed", "Completed"],
            ["archived", "Archived"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={`shrink-0 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition ${
                view === value
                  ? "border-[#123865] bg-[#123865] text-white"
                  : "border-slate-300 bg-white text-[#10233f] hover:border-orange-400 hover:bg-orange-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 xl:grid-cols-[1fr_150px_150px_150px_150px]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, notes, assignee, context..."
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            firstLabel="All statuses"
            options={STATUS_OPTIONS}
          />

          <FilterSelect
            value={priorityFilter}
            onChange={setPriorityFilter}
            firstLabel="All priorities"
            options={PRIORITY_OPTIONS}
          />

          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            firstLabel="All task types"
            options={TASK_TYPE_OPTIONS}
          />

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none hover:border-orange-400 focus:border-orange-400"
          >
            <option value="smart">Smart order</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">
            {filteredTasks.length} matching task
            {filteredTasks.length === 1 ? "" : "s"} · {PAGE_SIZE} per page
          </p>

          {(query ||
            statusFilter !== "all" ||
            priorityFilter !== "all" ||
            typeFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setTypeFilter("all");
              }}
              className="text-xs font-black text-orange-700 hover:text-orange-900"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {loading && !tasks.length ? (
            <EmptyState
              icon={LoaderCircle}
              title="Loading tasks"
              text="Fetching the student's operational work queue."
              spin
            />
          ) : pagedTasks.length ? (
            pagedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={isBusy(`task-${task.id}`)}
                onStatus={(status) => updateTaskStatus(task, status)}
                onEdit={() =>
                  setEditingTask({
                    ...task,
                    due_date: toLocalInput(task.due_date),
                    reminder_at: toLocalInput(task.reminder_at),
                  })
                }
                onDuplicate={() => duplicateTask(task)}
                onArchive={() => archiveTask(task)}
                onRestore={() => restoreTask(task)}
                onDelete={() => permanentlyDeleteTask(task)}
              />
            ))
          ) : (
            <EmptyState
              icon={ListTodo}
              title="No matching tasks"
              text="The current work view and filters have no tasks."
            />
          )}
        </div>

        {filteredTasks.length > PAGE_SIZE ? (
          <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-slate-200 pt-4">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-40"
            >
              Previous
            </button>

            <p className="text-xs font-black text-slate-600">
              Page {safePage} of {totalPages}
            </p>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((previous) => Math.min(totalPages, previous + 1))
              }
              className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-xs font-black text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>

      {editingTask ? (
        <div className="fixed inset-0 z-[1350] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.8rem] border-[3px] border-orange-400 bg-[#fffaf4] p-5 shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                  Task Inspector
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  Edit Task
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50"
              >
                <X size={17} />
              </button>
            </div>

            <TaskForm
              form={editingTask}
              setForm={setEditingTask}
              disabled={isBusy(`task-${editingTask.id}`)}
              submitLabel={
                isBusy(`task-${editingTask.id}`)
                  ? "Saving..."
                  : "Save Task Changes"
              }
              onSubmit={saveEditedTask}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskForm({ form, setForm, disabled, submitLabel, onSubmit }) {
  return (
    <div className="mt-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InputField
          label="Task Title"
          value={form.title}
          placeholder="Example: Collect passport copy"
          onChange={(value) =>
            setForm((previous) => ({ ...previous, title: value }))
          }
        />

        <InputField
          label="Assigned To"
          value={form.assigned_to}
          placeholder="Counselor / staff"
          onChange={(value) =>
            setForm((previous) => ({ ...previous, assigned_to: value }))
          }
        />

        <SelectField
          label="Priority"
          value={form.priority}
          options={PRIORITY_OPTIONS}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, priority: value }))
          }
        />

        <SelectField
          label="Status"
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={(value) =>
            setForm((previous) => ({
              ...previous,
              status: value,
              blocked_reason:
                value === "blocked" ? previous.blocked_reason : "",
            }))
          }
        />

        <SelectField
          label="Task Type"
          value={form.task_type}
          options={TASK_TYPE_OPTIONS}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, task_type: value }))
          }
        />

        <InputField
          label="Due Date"
          type="datetime-local"
          value={form.due_date}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, due_date: value }))
          }
        />

        <InputField
          label="Reminder"
          type="datetime-local"
          value={form.reminder_at}
          onChange={(value) =>
            setForm((previous) => ({ ...previous, reminder_at: value }))
          }
        />

        <SelectField
          label="Related To"
          value={form.related_type || ""}
          options={RELATED_TYPE_OPTIONS}
          blankLabel="General"
          onChange={(value) =>
            setForm((previous) => ({ ...previous, related_type: value }))
          }
        />

        <InputField
          label="Related Record ID"
          value={form.related_id}
          placeholder="Optional"
          onChange={(value) =>
            setForm((previous) => ({ ...previous, related_id: value }))
          }
        />

        {normalize(form.status) === "blocked" ? (
          <InputField
            label="Blocked Reason"
            value={form.blocked_reason}
            placeholder="What is preventing progress?"
            onChange={(value) =>
              setForm((previous) => ({ ...previous, blocked_reason: value }))
            }
          />
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <TextAreaField
          label="Description"
          value={form.description}
          placeholder="What needs to be done?"
          onChange={(value) =>
            setForm((previous) => ({ ...previous, description: value }))
          }
        />

        <TextAreaField
          label="Internal Notes"
          value={form.notes}
          placeholder="Operational context, student context, handoff notes..."
          onChange={(value) =>
            setForm((previous) => ({ ...previous, notes: value }))
          }
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !String(form.title || "").trim()}
        className="mt-4 rounded-xl border-2 border-orange-700 bg-orange-500 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function TaskCard({
  task,
  busy,
  onStatus,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
}) {
  const meta = dueMeta(task);
  const status = normalize(task.status || "pending");

  return (
    <article
      className={`rounded-2xl border-2 p-4 transition ${
        meta.overdue
          ? "border-red-300 bg-red-50"
          : status === "blocked"
          ? "border-orange-400 bg-orange-50"
          : "border-slate-300 bg-[#fffaf4] hover:border-orange-400"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge value={task.priority} />
            <StatusBadge value={task.status} />
            <TypeBadge value={task.task_type} />
            <DueBadge meta={meta} />
            {task.is_archived ? <Badge text="Archived" tone="slate" /> : null}
          </div>

          <h3 className="mt-3 break-words text-base font-black text-[#10233f]">
            {task.title}
          </h3>

          {task.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
              {task.description}
            </p>
          ) : null}

          {status === "blocked" && task.blocked_reason ? (
            <div className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
              Blocked: {task.blocked_reason}
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label="Assigned"
              value={task.assigned_to || "Unassigned"}
              icon={UserRound}
            />
            <Info
              label="Due"
              value={formatDateTime(task.due_date)}
              icon={CalendarClock}
            />
            <Info
              label="Reminder"
              value={formatDateTime(task.reminder_at)}
              icon={BellRing}
            />
            <Info
              label="Created"
              value={formatDateTime(task.created_at)}
              icon={History}
            />
          </div>

          {task.related_type ? (
            <p className="mt-3 text-xs font-bold text-slate-500">
              Context: {pretty(task.related_type)}
              {task.related_id ? ` · ${task.related_id}` : ""}
            </p>
          ) : null}

          {task.notes ? (
            <div className="mt-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-xs font-medium leading-5 text-slate-600">
              {task.notes}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-[210px] flex-col gap-2">
          {!task.is_archived ? (
            <select
              value={status}
              disabled={busy}
              onChange={(event) => onStatus(event.target.value)}
              className="h-10 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none transition hover:border-orange-400 focus:border-orange-400 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {pretty(option)}
                </option>
              ))}
            </select>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {!task.is_archived ? (
              <>
                <ActionButton onClick={onEdit} disabled={busy} icon={Edit3}>
                  Edit
                </ActionButton>

                <ActionButton onClick={onDuplicate} disabled={busy} icon={Copy}>
                  Duplicate
                </ActionButton>

                <ActionButton onClick={onArchive} disabled={busy} icon={Archive}>
                  Archive
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton onClick={onRestore} disabled={busy} icon={RotateCcw}>
                  Restore
                </ActionButton>

                <ActionButton
                  onClick={onDelete}
                  disabled={busy}
                  icon={Trash2}
                  tone="red"
                >
                  Delete
                </ActionButton>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PressureTile({
  label,
  value,
  helper = "",
  tone = "slate",
}) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    slate: "border-slate-300 bg-[#fffaf4] text-slate-700",
  };

  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        styles[tone] || styles.slate
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] opacity-75">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
      {helper ? (
        <p className="mt-1 text-[10px] font-semibold leading-4 opacity-80">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone = "slate" }) {
  const styles = {
    slate: "border-slate-300 bg-white text-[#10233f]",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    red: "border-red-300 bg-red-50 text-red-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
        styles[tone] || styles.slate
      }`}
    >
      <Icon size={15} />
      <div>
        <p className="text-sm font-black">{value}</p>
        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] opacity-75">
          {label}
        </p>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-orange-600" />
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-1 break-words text-xs font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function PriorityBadge({ value }) {
  const clean = normalize(value || "medium");

  const style =
    clean === "critical"
      ? "border-red-500 bg-red-100 text-red-900"
      : clean === "urgent"
      ? "border-red-400 bg-red-50 text-red-800"
      : clean === "high"
      ? "border-orange-400 bg-orange-50 text-orange-800"
      : clean === "low"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : "border-blue-300 bg-blue-50 text-blue-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${style}`}>
      {pretty(clean)}
    </span>
  );
}

function StatusBadge({ value }) {
  const clean = normalize(value || "pending");

  const style =
    clean === "completed"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : clean === "blocked"
      ? "border-red-300 bg-red-50 text-red-800"
      : clean === "in_progress"
      ? "border-orange-300 bg-orange-50 text-orange-800"
      : clean === "cancelled"
      ? "border-slate-400 bg-slate-100 text-slate-700"
      : "border-blue-300 bg-blue-50 text-blue-800";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${style}`}>
      {pretty(clean)}
    </span>
  );
}

function TypeBadge({ value }) {
  return (
    <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[9px] font-black uppercase text-slate-700">
      {pretty(value || "general")}
    </span>
  );
}

function DueBadge({ meta }) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    slate: "border-slate-300 bg-white text-slate-700",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
        styles[meta?.tone] || styles.slate
      }`}
    >
      {meta?.label || "No due date"}
    </span>
  );
}

function Badge({ text, tone = "slate" }) {
  const style =
    tone === "orange"
      ? "border-orange-300 bg-orange-50 text-orange-800"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865] text-white"
      : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style}`}>
      {text}
    </span>
  );
}

function Feedback({ tone, onClose, children }) {
  const style =
    tone === "error"
      ? "border-red-400 bg-red-50 text-red-900"
      : tone === "warning"
      ? "border-amber-400 bg-amber-50 text-amber-900"
      : "border-emerald-400 bg-emerald-50 text-emerald-900";

  return (
    <div className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${style}`}>
      {tone === "error" || tone === "warning" ? (
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">{children}</div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/50 transition hover:bg-white"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black text-[#10233f]">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <label>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#10233f]">
        {label}
      </span>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-semibold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options = [], blankLabel = null }) {
  return (
    <label>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#10233f]">
        {label}
      </span>

      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-bold text-[#10233f] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >
        {blankLabel !== null ? (
          <option value="">{blankLabel}</option>
        ) : null}

        {options
          .filter((option) => option !== "")
          .map((option) => (
            <option key={option} value={option}>
              {pretty(option)}
            </option>
          ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "" }) {
  return (
    <label>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#10233f]">
        {label}
      </span>

      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function FilterSelect({ value, onChange, firstLabel, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none transition hover:border-orange-400 focus:border-orange-400"
    >
      <option value="all">{firstLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {pretty(option)}
        </option>
      ))}
    </select>
  );
}

function ActionButton({
  children,
  icon: Icon,
  onClick,
  disabled,
  tone = "slate",
}) {
  const style =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-800 hover:border-red-500 hover:bg-red-100"
      : "border-slate-300 bg-white text-[#10233f] hover:border-orange-400 hover:bg-orange-50";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 ${style}`}
    >
      <Icon size={13} />
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, title, text, spin = false }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-[#fffaf4] p-7 text-center">
      <Icon
        size={30}
        className={`mx-auto text-orange-400 ${spin ? "animate-spin" : ""}`}
      />
      <h3 className="mt-3 text-base font-black text-[#10233f]">{title}</h3>
      <p className="mt-1 text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}

export default TaskCenterPanel;
