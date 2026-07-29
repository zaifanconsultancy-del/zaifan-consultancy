// FollowUpReminderPanel V5 MAXIMUM — Student Reminder Operations
// src/components/admin/FollowUpReminderPanel.jsx
//
// Maximum pass:
// - preserves studentId / studentType / adminProfile props
// - preserves createFollowUpReminder / fetchFollowUpReminders / updateFollowUpReminderStatus / deleteFollowUpReminder
// - preserves addTimelineEvent audit trail integration
// - adds protected load/action timeouts so UI cannot hang forever
// - prevents stale reminder requests from overwriting newer student data
// - safer mounted/unmounted state handling
// - optimistic updates with authoritative reload
// - adds Reopen support for Done / Cancelled reminders
// - replaces blocking delete confirm with in-panel confirmation
// - adds due-today / overdue / upcoming / done / cancelled metrics
// - adds search + queue filters
// - stronger validation and form readiness
// - safer date comparison
// - clear success / error / timeout feedback
// - stronger mobile layout
// - approved cream/orange/navy Admin OS
// - navy surfaces use explicit white text only

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addTimelineEvent } from "../../../../lib/crmTimeline";
import {
  createFollowUpReminder,
  deleteFollowUpReminder,
  fetchFollowUpReminders,
  updateFollowUpReminderStatus,
} from "../../../../lib/followUpReminders";

const LOAD_TIMEOUT_MS = 12000;
const ACTION_TIMEOUT_MS = 12000;

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function dateKey(value) {
  if (!value) return "";

  const raw = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function getErrorMessage(error, fallback = "Operation failed.") {
  if (!error) return fallback;

  if (typeof error === "string") {
    return error;
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    fallback
  );
}

function withTimeout(promise, timeoutMs, message) {
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeout,
  ]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}

function FollowUpReminderPanel({
  studentId,
  studentType,
  adminProfile = null,
}) {
  const [reminders, setReminders] = useState([]);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [statusSavingId, setStatusSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const today = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const safeSet = useCallback((callback) => {
    if (mountedRef.current) {
      callback();
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadReminders = useCallback(async () => {
    const requestId =
      requestRef.current + 1;

    requestRef.current = requestId;

    if (!studentId || !studentType) {
      safeSet(() => {
        setReminders([]);
        setLoading(false);
        setErrorMessage(
          "Missing student ID or student type."
        );
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      setErrorMessage("");
    });

    try {
      const response = await withTimeout(
        Promise.resolve(
          fetchFollowUpReminders(
            studentId,
            studentType
          )
        ),
        LOAD_TIMEOUT_MS,
        "Follow-up reminders took too long to load."
      );

      if (
        requestRef.current !==
        requestId
      ) {
        return;
      }

      if (response?.error) {
        throw response.error;
      }

      const nextReminders =
        Array.isArray(response?.data)
          ? response.data.filter(Boolean)
          : [];

      safeSet(() => {
        setReminders(nextReminders);
        setLastLoadedAt(new Date());
      });
    } catch (error) {
      if (
        requestRef.current !==
        requestId
      ) {
        return;
      }

      console.error(
        "Reminder load crashed:",
        error
      );

      safeSet(() => {
        setReminders([]);
        setErrorMessage(
          getErrorMessage(
            error,
            "Reminders failed to load."
          )
        );
      });
    } finally {
      if (
        requestRef.current !==
        requestId
      ) {
        return;
      }

      safeSet(() => {
        setLoading(false);
      });
    }
  }, [
    safeSet,
    studentId,
    studentType,
  ]);

  useEffect(() => {
    setReminders([]);
    setQuery("");
    setFilter("all");
    setDeleteConfirmId("");
    setErrorMessage("");
    setSuccessMessage("");

    void loadReminders();
  }, [
    studentId,
    studentType,
    loadReminders,
  ]);

  const stats = useMemo(() => {
    const result = {
      total: reminders.length,
      pending: 0,
      today: 0,
      overdue: 0,
      upcoming: 0,
      done: 0,
      cancelled: 0,
    };

    reminders.forEach((reminder) => {
      const status = normalize(
        reminder.status || "pending"
      );

      const due = dateKey(
        reminder.due_date
      );

      if (
        ["done", "completed", "closed"].includes(
          status
        )
      ) {
        result.done += 1;
        return;
      }

      if (
        ["cancelled", "canceled"].includes(
          status
        )
      ) {
        result.cancelled += 1;
        return;
      }

      result.pending += 1;

      if (!due) {
        return;
      }

      if (due < today) {
        result.overdue += 1;
      } else if (due === today) {
        result.today += 1;
      } else {
        result.upcoming += 1;
      }
    });

    return result;
  }, [reminders, today]);

  const filteredReminders = useMemo(() => {
    const cleanQuery = normalize(query);

    return reminders.filter((reminder) => {
      const status = normalize(
        reminder.status || "pending"
      );

      const due = dateKey(
        reminder.due_date
      );

      const pending = ![
        "done",
        "completed",
        "closed",
        "cancelled",
        "canceled",
      ].includes(status);

      let matchesFilter = true;

      if (filter === "pending") {
        matchesFilter = pending;
      } else if (filter === "today") {
        matchesFilter =
          pending && due === today;
      } else if (filter === "overdue") {
        matchesFilter =
          pending &&
          Boolean(due) &&
          due < today;
      } else if (filter === "done") {
        matchesFilter = [
          "done",
          "completed",
          "closed",
        ].includes(status);
      } else if (filter === "cancelled") {
        matchesFilter = [
          "cancelled",
          "canceled",
        ].includes(status);
      }

      if (!matchesFilter) {
        return false;
      }

      if (!cleanQuery) {
        return true;
      }

      const haystack = [
        reminder.title,
        reminder.notes,
        reminder.created_by_name,
        reminder.due_date,
        reminder.due_time,
        reminder.status,
      ]
        .map(normalize)
        .join(" ");

      return haystack.includes(
        cleanQuery
      );
    });
  }, [
    reminders,
    filter,
    query,
    today,
  ]);

  const canCreate =
    Boolean(
      studentId &&
        studentType &&
        title.trim() &&
        dueDate &&
        !saving
    );

  const addReminder = async () => {
    if (!canCreate) {
      return;
    }

    const cleanTitle =
      title.trim();

    const cleanNotes =
      notes.trim();

    safeSet(() => {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
    });

    try {
      const response = await withTimeout(
        Promise.resolve(
          createFollowUpReminder({
            studentId,
            studentType,
            title: cleanTitle,
            notes: cleanNotes,
            dueDate,
            dueTime,
            adminProfile,
          })
        ),
        ACTION_TIMEOUT_MS,
        "Reminder creation timed out. The panel has been unlocked."
      );

      if (response?.error) {
        throw response.error;
      }

      try {
        await withTimeout(
          Promise.resolve(
            addTimelineEvent({
              studentId,
              studentType,
              actionType:
                "followup_created",
              title:
                "Follow-up Reminder Created",
              description: `${cleanTitle} — Due ${dueDate}${
                dueTime
                  ? ` at ${dueTime}`
                  : ""
              }`,
              adminProfile,
            })
          ),
          ACTION_TIMEOUT_MS,
          "Reminder was created, but timeline logging timed out."
        );
      } catch (timelineError) {
        console.warn(
          "Reminder created but timeline logging failed:",
          timelineError
        );
      }

      safeSet(() => {
        setTitle("");
        setNotes("");
        setDueDate("");
        setDueTime("");
        setSuccessMessage(
          "Reminder created successfully."
        );

        if (response?.data) {
          setReminders((prev) => [
            response.data,
            ...prev,
          ]);
        }
      });

      await loadReminders();
    } catch (error) {
      console.error(
        "Reminder save crashed:",
        error
      );

      safeSet(() => {
        setErrorMessage(
          getErrorMessage(
            error,
            "Reminder save failed."
          )
        );
      });
    } finally {
      safeSet(() => {
        setSaving(false);
      });
    }
  };

  const updateStatus = async (
    id,
    status
  ) => {
    if (
      !id ||
      statusSavingId ||
      deletingId
    ) {
      return;
    }

    const reminder =
      reminders.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    const oldStatus =
      reminder?.status || "";

    safeSet(() => {
      setStatusSavingId(id);
      setErrorMessage("");
      setSuccessMessage("");
      setDeleteConfirmId("");
    });

    try {
      const response = await withTimeout(
        Promise.resolve(
          updateFollowUpReminderStatus(
            id,
            status
          )
        ),
        ACTION_TIMEOUT_MS,
        "Reminder status update timed out. The panel has been unlocked."
      );

      if (response?.error) {
        throw response.error;
      }

      safeSet(() => {
        setReminders((prev) =>
          prev.map((item) =>
            String(item.id) ===
            String(id)
              ? {
                  ...item,
                  status,
                  completed_at:
                    status === "done"
                      ? new Date().toISOString()
                      : null,
                }
              : item
          )
        );

        setSuccessMessage(
          status === "pending"
            ? "Reminder reopened."
            : "Reminder status updated."
        );
      });

      try {
        await withTimeout(
          Promise.resolve(
            addTimelineEvent({
              studentId,
              studentType,
              actionType:
                "followup_status_changed",
              title:
                "Follow-up Status Updated",
              description:
                reminder?.title ||
                "Follow-up reminder updated.",
              oldValue: oldStatus,
              newValue: status,
              adminProfile,
            })
          ),
          ACTION_TIMEOUT_MS,
          "Reminder status changed, but timeline logging timed out."
        );
      } catch (timelineError) {
        console.warn(
          "Reminder status updated but timeline logging failed:",
          timelineError
        );
      }

      await loadReminders();
    } catch (error) {
      console.error(
        "Reminder status update crashed:",
        error
      );

      safeSet(() => {
        setErrorMessage(
          getErrorMessage(
            error,
            "Reminder status update failed."
          )
        );
      });
    } finally {
      safeSet(() => {
        setStatusSavingId("");
      });
    }
  };

  const removeReminder = async (
    id
  ) => {
    if (
      !id ||
      deletingId ||
      statusSavingId
    ) {
      return;
    }

    if (
      String(deleteConfirmId) !==
      String(id)
    ) {
      setDeleteConfirmId(id);
      setErrorMessage("");
      setSuccessMessage("");
      return;
    }

    const reminder =
      reminders.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    safeSet(() => {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");
    });

    try {
      const response = await withTimeout(
        Promise.resolve(
          deleteFollowUpReminder(id)
        ),
        ACTION_TIMEOUT_MS,
        "Reminder deletion timed out. The panel has been unlocked."
      );

      if (response?.error) {
        throw response.error;
      }

      safeSet(() => {
        setReminders((prev) =>
          prev.filter(
            (item) =>
              String(item.id) !==
              String(id)
          )
        );
        setDeleteConfirmId("");
        setSuccessMessage(
          "Reminder deleted."
        );
      });

      try {
        await withTimeout(
          Promise.resolve(
            addTimelineEvent({
              studentId,
              studentType,
              actionType:
                "followup_deleted",
              title:
                "Follow-up Reminder Deleted",
              description:
                reminder?.title ||
                "Follow-up reminder deleted.",
              adminProfile,
            })
          ),
          ACTION_TIMEOUT_MS,
          "Reminder was deleted, but timeline logging timed out."
        );
      } catch (timelineError) {
        console.warn(
          "Reminder deleted but timeline logging failed:",
          timelineError
        );
      }

      await loadReminders();
    } catch (error) {
      console.error(
        "Reminder delete crashed:",
        error
      );

      safeSet(() => {
        setErrorMessage(
          getErrorMessage(
            error,
            "Reminder delete failed."
          )
        );
      });
    } finally {
      safeSet(() => {
        setDeletingId("");
      });
    }
  };

  const getDueBadge = (
    reminder
  ) => {
    const status = normalize(
      reminder.status || "pending"
    );

    if (
      [
        "done",
        "completed",
        "closed",
        "cancelled",
        "canceled",
      ].includes(status)
    ) {
      return null;
    }

    const due = dateKey(
      reminder.due_date
    );

    if (!due) {
      return "No Date";
    }

    if (due < today) {
      return "Overdue";
    }

    if (due === today) {
      return "Due Today";
    }

    return "Upcoming";
  };

  const getDueBadgeStyle = (
    badge
  ) => {
    if (badge === "Overdue") {
      return "border-red-300 bg-red-50 text-red-700";
    }

    if (badge === "Due Today") {
      return "border-orange-400 bg-orange-50 text-orange-800";
    }

    if (badge === "Upcoming") {
      return "border-slate-300 bg-slate-100 text-[#10233f]";
    }

    return "border-slate-300 bg-white text-slate-600";
  };

  const getStatusStyle = (
    status
  ) => {
    const normalized =
      normalize(status);

    if (
      [
        "done",
        "completed",
        "closed",
      ].includes(normalized)
    ) {
      return "border-orange-300 bg-orange-50 text-orange-800";
    }

    if (
      [
        "cancelled",
        "canceled",
      ].includes(normalized)
    ) {
      return "border-amber-300 bg-amber-50 text-amber-900";
    }

    return "border-slate-300 bg-slate-100 text-[#10233f]";
  };

  const filters = [
    [
      "all",
      "All",
      stats.total,
    ],
    [
      "pending",
      "Pending",
      stats.pending,
    ],
    [
      "today",
      "Today",
      stats.today,
    ],
    [
      "overdue",
      "Overdue",
      stats.overdue,
    ],
    [
      "done",
      "Done",
      stats.done,
    ],
    [
      "cancelled",
      "Cancelled",
      stats.cancelled,
    ],
  ];

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-[#FFFDF8] shadow-[0_16px_42px_rgba(15,35,63,0.07)]">
        <div className="grid xl:grid-cols-[1.3fr_0.7fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip
                icon={CalendarClock}
                label="Follow-Up Operations"
              />

              <HeaderChip
                icon={ShieldCheck}
                label="Student Timeline"
              />
            </div>

            <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              Student Reminder Workspace
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              Create, track, complete, reopen, cancel, and safely delete follow-up
              reminders while keeping the student CRM timeline updated.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Total"
                value={stats.total}
              />

              <DarkMetric
                label="Pending"
                value={stats.pending}
              />

              <DarkMetric
                label="Today"
                value={stats.today}
              />

              <DarkMetric
                label="Overdue"
                value={stats.overdue}
              />
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6">
            <div className="flex items-center gap-2">
              <Clock3 size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Queue Status
              </p>
            </div>

            <p className="mt-3 text-4xl font-black text-white">
              {stats.pending}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              Open Follow-Ups
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="Done"
                value={stats.done}
              />

              <OrangeMetric
                label="Cancelled"
                value={
                  stats.cancelled
                }
              />
            </div>

            <div className="mt-3 rounded-xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Last Refresh
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {lastLoadedAt
                  ? lastLoadedAt.toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "Not loaded"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-5 shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
            <Plus size={20} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
              Create Reminder
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Schedule the next counselor follow-up
            </h3>

            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              The reminder is saved through the existing follow-up helper and logged
              into the CRM timeline.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
              Reminder Title
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Call student about missing passport"
              className="rounded-xl border-2 border-slate-300 bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
                Due Date
              </span>

              <input
                type="date"
                value={dueDate}
                min={today}
                onChange={(event) =>
                  setDueDate(
                    event.target.value
                  )
                }
                className="rounded-xl border-2 border-slate-300 bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
                Due Time
              </span>

              <input
                type="time"
                value={dueTime}
                onChange={(event) =>
                  setDueTime(
                    event.target.value
                  )
                }
                className="rounded-xl border-2 border-slate-300 bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>
          </div>
        </div>

        <label className="mt-3 grid gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
            Reminder Notes
          </span>

          <textarea
            value={notes}
            onChange={(event) =>
              setNotes(
                event.target.value
              )
            }
            placeholder="Add context, documents needed, call objective, or next-step notes."
            className="min-h-[110px] w-full resize-y rounded-[1.25rem] border-2 border-slate-300 bg-[#FFFDF8] p-4 text-sm font-semibold leading-6 text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.08em]">
            <ReadinessChip
              ready={Boolean(
                studentId &&
                  studentType
              )}
              label="Student"
            />

            <ReadinessChip
              ready={Boolean(
                title.trim()
              )}
              label="Title"
            />

            <ReadinessChip
              ready={Boolean(
                dueDate
              )}
              label="Due Date"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              void addReminder()
            }
            disabled={!canCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-5 text-sm font-black text-white shadow-[0_8px_20px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving ? (
              <RefreshCw
                size={15}
                className="animate-spin"
              />
            ) : (
              <Plus size={15} />
            )}

            {saving
              ? "Saving Reminder..."
              : "Add Reminder"}
          </button>
        </div>
      </section>

      {errorMessage ? (
        <FeedbackBanner
          tone="error"
          message={
            errorMessage
          }
          onClose={() =>
            setErrorMessage("")
          }
        />
      ) : null}

      {successMessage ? (
        <FeedbackBanner
          tone="success"
          message={
            successMessage
          }
          onClose={() =>
            setSuccessMessage("")
          }
        />
      ) : null}

      <section className="rounded-[1.6rem] border-[3px] border-slate-300 bg-[#FFFDF8] p-5 shadow-[0_12px_32px_rgba(15,35,63,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
              Student Queue
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Follow-up Reminders
            </h3>

            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {filteredReminders.length} visible reminder
              {filteredReminders.length === 1
                ? ""
                : "s"}{" "}
              for this student.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadReminders()
            }
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-[#10233f] transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search title, notes, creator, date..."
              className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {filters.map(
              ([
                key,
                label,
                count,
              ]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setFilter(
                      key
                    )
                  }
                  className={`rounded-xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                    filter === key
                      ? "border-orange-600 bg-orange-500 text-white"
                      : key ===
                          "overdue" &&
                        count > 0
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-slate-300 bg-white text-[#10233f] hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  {label} {count}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-5">
          {loading &&
          reminders.length ===
            0 ? (
            <LoadingState />
          ) : filteredReminders.length ===
            0 ? (
            <EmptyState
              filter={filter}
            />
          ) : (
            <div className="space-y-3">
              {filteredReminders.map(
                (reminder) => {
                  const dueBadge =
                    getDueBadge(
                      reminder
                    );

                  const isStatusSaving =
                    String(
                      statusSavingId
                    ) ===
                    String(
                      reminder.id
                    );

                  const isDeleting =
                    String(
                      deletingId
                    ) ===
                    String(
                      reminder.id
                    );

                  const deleteConfirmOpen =
                    String(
                      deleteConfirmId
                    ) ===
                    String(
                      reminder.id
                    );

                  const status =
                    normalize(
                      reminder.status ||
                        "pending"
                    );

                  const isDone =
                    [
                      "done",
                      "completed",
                      "closed",
                    ].includes(
                      status
                    );

                  const isCancelled =
                    [
                      "cancelled",
                      "canceled",
                    ].includes(
                      status
                    );

                  return (
                    <article
                      key={
                        reminder.id
                      }
                      className={`rounded-[1.4rem] border-[3px] bg-white p-4 transition sm:p-5 ${
                        dueBadge ===
                        "Overdue"
                          ? "border-red-300"
                          : dueBadge ===
                            "Due Today"
                          ? "border-orange-400"
                          : "border-slate-300 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words font-black text-[#10233f]">
                              {reminder.title ||
                                "Untitled reminder"}
                            </p>

                            {dueBadge ? (
                              <span
                                className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getDueBadgeStyle(
                                  dueBadge
                                )}`}
                              >
                                {
                                  dueBadge
                                }
                              </span>
                            ) : null}

                            <span
                              className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getStatusStyle(
                                status
                              )}`}
                            >
                              {status ||
                                "pending"}
                            </span>
                          </div>

                          {reminder.notes ? (
                            <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600">
                              {
                                reminder.notes
                              }
                            </p>
                          ) : null}

                          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            <Meta
                              label="Due"
                              value={`${dateKey(
                                reminder.due_date
                              ) ||
                                "No date"}${
                                reminder.due_time
                                  ? ` · ${reminder.due_time}`
                                  : ""
                              }`}
                            />

                            <Meta
                              label="Created By"
                              value={
                                reminder.created_by_name ||
                                "Admin"
                              }
                            />

                            <Meta
                              label="Created"
                              value={
                                reminder.created_at
                                  ? new Date(
                                      reminder.created_at
                                    ).toLocaleDateString(
                                      "en-GB"
                                    )
                                  : "Unknown"
                              }
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 xl:max-w-[320px] xl:justify-end">
                          {!isDone &&
                          !isCancelled ? (
                            <>
                              <ActionButton
                                icon={
                                  CheckCircle2
                                }
                                label={
                                  isStatusSaving
                                    ? "Saving..."
                                    : "Mark Done"
                                }
                                disabled={Boolean(
                                  statusSavingId ||
                                    deletingId
                                )}
                                tone="orange"
                                onClick={() =>
                                  void updateStatus(
                                    reminder.id,
                                    "done"
                                  )
                                }
                              />

                              <ActionButton
                                icon={
                                  XCircle
                                }
                                label={
                                  isStatusSaving
                                    ? "Saving..."
                                    : "Cancel"
                                }
                                disabled={Boolean(
                                  statusSavingId ||
                                    deletingId
                                )}
                                onClick={() =>
                                  void updateStatus(
                                    reminder.id,
                                    "cancelled"
                                  )
                                }
                              />
                            </>
                          ) : (
                            <ActionButton
                              icon={
                                RotateCcw
                              }
                              label={
                                isStatusSaving
                                  ? "Saving..."
                                  : "Reopen"
                              }
                              disabled={Boolean(
                                statusSavingId ||
                                  deletingId
                              )}
                              onClick={() =>
                                void updateStatus(
                                  reminder.id,
                                  "pending"
                                )
                              }
                            />
                          )}

                          <ActionButton
                            icon={
                              Trash2
                            }
                            label={
                              isDeleting
                                ? "Deleting..."
                                : deleteConfirmOpen
                                ? "Confirm Delete"
                                : "Delete"
                            }
                            disabled={Boolean(
                              statusSavingId ||
                                deletingId
                            )}
                            tone="red"
                            onClick={() =>
                              void removeReminder(
                                reminder.id
                              )
                            }
                          />

                          {deleteConfirmOpen &&
                          !isDeleting ? (
                            <ActionButton
                              icon={X}
                              label="Keep"
                              disabled={false}
                              onClick={() =>
                                setDeleteConfirmId(
                                  ""
                                )
                              }
                            />
                          ) : null}
                        </div>
                      </div>

                      {deleteConfirmOpen &&
                      !isDeleting ? (
                        <div className="mt-4 rounded-xl border-[3px] border-red-300 bg-red-50 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              size={16}
                              className="mt-0.5 shrink-0 text-red-700"
                            />

                            <p className="text-xs font-semibold leading-5 text-red-800">
                              Permanent deletion is armed. Click
                              <strong>
                                {" "}
                                Confirm Delete
                              </strong>{" "}
                              again to remove this reminder and write the deletion
                              event to the student timeline.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function HeaderChip({
  icon: Icon,
  label,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value ?? 0}
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
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function ReadinessChip({
  ready,
  label,
}) {
  return (
    <span
      className={`rounded-full border-2 px-3 py-1.5 ${
        ready
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-red-300 bg-red-50 text-red-700"
      }`}
    >
      {label}:{" "}
      {ready ? "Ready" : "Missing"}
    </span>
  );
}

function FeedbackBanner({
  tone,
  message,
  onClose,
}) {
  const success =
    tone === "success";

  return (
    <div
      role={
        success
          ? "status"
          : "alert"
      }
      className={`flex items-start gap-3 rounded-[1.25rem] border-[3px] p-4 ${
        success
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-red-300 bg-red-50 text-red-900"
      }`}
    >
      {success ? (
        <CheckCircle2
          size={17}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <AlertTriangle
          size={17}
          className="mt-0.5 shrink-0"
        />
      )}

      <p className="min-w-0 flex-1 text-sm font-bold">
        {message}
      </p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function Meta({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-[#FFFDF8] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  tone = "default",
  onClick,
}) {
  const style =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
      : tone === "orange"
      ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
      : "border-slate-300 bg-white text-[#10233f] hover:border-orange-300 hover:bg-orange-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${style}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border-[3px] border-slate-300 bg-white p-5">
      <div className="flex items-center gap-3">
        <RefreshCw
          size={17}
          className="animate-spin text-orange-600"
        />

        <p className="text-sm font-black text-[#10233f]">
          Loading reminders...
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  filter,
}) {
  return (
    <div className="rounded-xl border-[3px] border-dashed border-orange-300 bg-white p-7 text-center">
      <CheckCircle2
        size={26}
        className="mx-auto text-orange-600"
      />

      <p className="mt-3 font-black text-[#10233f]">
        No reminders in this view
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-600">
        {filter === "all"
          ? "Create the first follow-up reminder for this student."
          : `No ${filter} reminders match the current queue.`}
      </p>
    </div>
  );
}

export default FollowUpReminderPanel;
