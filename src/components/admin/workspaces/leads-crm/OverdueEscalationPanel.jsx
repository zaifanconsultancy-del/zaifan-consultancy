// OverdueEscalationPanel PARTNER OS EXTREME — Compact Escalation Command
// Full replacement for: src/components/admin/OverdueEscalationPanel.jsx
//
// Uses:
// - follow_up_reminders
// - student_tasks
//
// Major upgrades:
// - combines overdue reminders + overdue operational tasks
// - corrects old `item.note` bug to real `notes` field
// - severity ranking (Critical / High / Medium)
// - source filters and search
// - due date/time visibility
// - status update actions
// - mark follow-up/task completed
// - mark task in progress / blocked
// - resilient loading/error/refresh states
// - pagination to avoid endless vertical expansion
// - real-time refresh for follow_up_reminders + student_tasks
// - reminder due_time is respected when calculating overdue state
// - task Blocked action is now actually exposed in the UI
// - reduced-motion support
// - stronger navy/orange Admin OS hierarchy
//
// No database migration required.

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  TimerReset,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 15000;
const PAGE_SIZE = 12;

const normalize = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "Any time";
  return String(value).slice(0, 5);
};

function withTimeout(promise, message = "Request timed out.") {
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
}

function getDueMoment(dateValue, timeValue = "", endOfDay = true) {
  if (!dateValue) return null;

  const due = new Date(dateValue);
  if (Number.isNaN(due.getTime())) return null;

  const cleanTime = String(timeValue || "").trim();

  if (cleanTime) {
    const [hours, minutes, seconds] = cleanTime
      .split(":")
      .map((part) => Number(part));

    due.setHours(
      Number.isFinite(hours) ? hours : 0,
      Number.isFinite(minutes) ? minutes : 0,
      Number.isFinite(seconds) ? seconds : 0,
      0
    );
  } else if (endOfDay) {
    due.setHours(23, 59, 59, 999);
  }

  return due;
}

function getDaysLate(dateValue, timeValue = "", endOfDay = true) {
  const due = getDueMoment(dateValue, timeValue, endOfDay);
  if (!due) return 0;

  const now = new Date();
  if (due >= now) return 0;

  return Math.max(
    1,
    Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function getSeverity(daysLate, item) {
  const priority = normalize(item?.priority || "medium");

  if (
    daysLate >= 7 ||
    priority === "critical" ||
    priority === "urgent"
  ) {
    return "critical";
  }

  if (
    daysLate >= 3 ||
    priority === "high" ||
    normalize(item?.status) === "blocked"
  ) {
    return "high";
  }

  return "medium";
}

function OverdueEscalationPanel({ cardClass = "" }) {
  const reduceMotion = useReducedMotion();
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void fetchEscalations();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, sourceFilter, severityFilter]);

  useEffect(() => {
    let refreshTimer;

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void fetchEscalations({ silent: true });
      }, 350);
    };

    const channel = supabase
      .channel("overdue-escalation-command-center")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follow_up_reminders" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_tasks" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchEscalations = async ({ silent = false } = {}) => {
    safeSet(() => {
      if (!silent) setLoading(true);
      setError("");
    });

    try {
      const [reminderResult, taskResult] = await Promise.all([
        withTimeout(
          supabase
            .from("follow_up_reminders")
            .select("*")
            .neq("status", "completed")
            .order("due_date", { ascending: true })
            .limit(500),
          "Follow-up reminders loading timed out."
        ),
        withTimeout(
          supabase
            .from("student_tasks")
            .select("*")
            .eq("is_archived", false)
            .in("status", ["pending", "in_progress", "blocked"])
            .not("due_date", "is", null)
            .order("due_date", { ascending: true })
            .limit(500),
          "Student tasks loading timed out."
        ),
      ]);

      if (reminderResult.error) throw reminderResult.error;
      if (taskResult.error) throw taskResult.error;

      safeSet(() => {
        setReminders(reminderResult.data || []);
        setTasks(taskResult.data || []);
      });
    } catch (loadError) {
      console.error("Escalation fetch failed:", loadError);

      safeSet(() => {
        setError(
          loadError?.message ||
            "Overdue escalation data could not be loaded."
        );
      });
    } finally {
      if (!silent) {
        safeSet(() => setLoading(false));
      }
    }
  };

  const overdueItems = useMemo(() => {
    const reminderRows = reminders
      .map((item) => {
        const daysLate = getDaysLate(item.due_date, item.due_time, false);

        return {
          ...item,
          source: "follow_up",
          sourceLabel: "Follow-up Reminder",
          daysLate,
          escalation: getSeverity(daysLate, item),
          dueDisplay: `${formatDate(item.due_date)} · ${formatTime(
            item.due_time
          )}`,
          detail:
            item.notes ||
            "This student follow-up is overdue and needs action.",
        };
      })
      .filter((item) => item.daysLate > 0);

    const taskRows = tasks
      .map((item) => {
        const daysLate = getDaysLate(item.due_date);

        return {
          ...item,
          source: "task",
          sourceLabel: "Student Task",
          daysLate,
          escalation: getSeverity(daysLate, item),
          dueDisplay: formatDate(item.due_date),
          detail:
            item.description ||
            item.notes ||
            item.blocked_reason ||
            "This operational task is overdue.",
        };
      })
      .filter((item) => item.daysLate > 0);

    return [...reminderRows, ...taskRows].sort((a, b) => {
      const severityRank = {
        critical: 3,
        high: 2,
        medium: 1,
      };

      const severityDifference =
        severityRank[b.escalation] - severityRank[a.escalation];

      if (severityDifference !== 0) return severityDifference;

      return b.daysLate - a.daysLate;
    });
  }, [reminders, tasks]);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return overdueItems.filter((item) => {
      if (sourceFilter !== "all" && item.source !== sourceFilter) {
        return false;
      }

      if (
        severityFilter !== "all" &&
        item.escalation !== severityFilter
      ) {
        return false;
      }

      if (!cleanQuery) return true;

      const haystack = [
        item.title,
        item.detail,
        item.notes,
        item.description,
        item.student_id,
        item.student_type,
        item.assigned_to,
        item.created_by_name,
        item.priority,
        item.status,
        item.sourceLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(cleanQuery);
    });
  }, [overdueItems, query, sourceFilter, severityFilter]);

  const stats = useMemo(() => {
    const critical = overdueItems.filter(
      (item) => item.escalation === "critical"
    ).length;

    const high = overdueItems.filter(
      (item) => item.escalation === "high"
    ).length;

    const medium = overdueItems.filter(
      (item) => item.escalation === "medium"
    ).length;

    const followUps = overdueItems.filter(
      (item) => item.source === "follow_up"
    ).length;

    const overdueTasks = overdueItems.filter(
      (item) => item.source === "task"
    ).length;

    return {
      total: overdueItems.length,
      critical,
      high,
      medium,
      followUps,
      overdueTasks,
    };
  }, [overdueItems]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / PAGE_SIZE)
  );

  const safePage = Math.min(page, totalPages);

  const pagedItems = filteredItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const markReminderCompleted = async (item) => {
    if (!item?.id || busyKey) return;

    const key = `reminder-${item.id}`;
    setBusyKey(key);
    setError("");
    setSuccessMessage("");

    try {
      const now = new Date().toISOString();

      const { error: updateError } = await withTimeout(
        supabase
          .from("follow_up_reminders")
          .update({
            status: "completed",
            completed_at: now,
          })
          .eq("id", item.id),
        "Reminder completion timed out."
      );

      if (updateError) throw updateError;

      safeSet(() => {
        setReminders((rows) =>
          rows.filter((row) => row.id !== item.id)
        );
        setSuccessMessage("Follow-up reminder completed.");
      });
    } catch (actionError) {
      safeSet(() =>
        setError(
          actionError?.message ||
            "Follow-up reminder could not be completed."
        )
      );
    } finally {
      safeSet(() => setBusyKey(""));
    }
  };

  const updateTaskStatus = async (item, nextStatus) => {
    if (!item?.id || busyKey) return;

    const key = `task-${item.id}`;
    const previous = tasks;

    setBusyKey(key);
    setError("");
    setSuccessMessage("");

    safeSet(() => {
      setTasks((rows) =>
        rows.map((row) =>
          row.id === item.id
            ? {
                ...row,
                status: nextStatus,
                completed_at:
                  nextStatus === "completed"
                    ? new Date().toISOString()
                    : row.completed_at,
              }
            : row
        )
      );
    });

    try {
      const payload = {
        status: nextStatus,
      };

      if (nextStatus === "completed") {
        payload.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await withTimeout(
        supabase
          .from("student_tasks")
          .update(payload)
          .eq("id", item.id),
        "Task escalation update timed out."
      );

      if (updateError) throw updateError;

      if (nextStatus === "completed") {
        safeSet(() =>
          setTasks((rows) =>
            rows.filter((row) => row.id !== item.id)
          )
        );
      }

      safeSet(() =>
        setSuccessMessage(
          nextStatus === "completed"
            ? "Overdue task completed."
            : `Task marked ${nextStatus.replaceAll("_", " ")}.`
        )
      );
    } catch (actionError) {
      safeSet(() => {
        setTasks(previous);
        setError(
          actionError?.message ||
            "Task escalation status could not be updated."
        );
      });
    } finally {
      safeSet(() => setBusyKey(""));
    }
  };

  return (
    <motion.section
      key="overdue-escalation"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      className={`${cardClass} min-w-0 space-y-4 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_20px_55px_rgba(18,56,101,0.12)] sm:p-3`}
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-white lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <div className="min-w-0 bg-[#123865] p-4 text-white sm:p-5 lg:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
            Escalation Command Center
          </p>

          <h2 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
            Overdue & Intervention Queue
          </h2>

          <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
            Combine overdue follow-up reminders and Student OS tasks into one
            ranked intervention queue so critical cases are not lost.
          </p>

          <button
            type="button"
            onClick={fetchEscalations}
            disabled={loading}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-white/25 bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Checking..." : "Refresh Escalations"}
          </button>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 text-white sm:p-5 lg:border-l-[3px] lg:border-t-0 lg:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-100">
            Immediate Attention
          </p>

          <p className="mt-3 text-5xl font-black text-white">
            {stats.critical}
          </p>

          <p className="mt-2 text-sm font-bold text-orange-50">
            critical escalation{stats.critical === 1 ? "" : "s"}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <DarkStat label="High" value={stats.high} />
            <DarkStat label="Total Overdue" value={stats.total} />
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <EscalationStat
          label="Overdue"
          value={stats.total}
          tone="red"
        />
        <EscalationStat
          label="Critical"
          value={stats.critical}
          tone="critical"
        />
        <EscalationStat
          label="Follow-ups"
          value={stats.followUps}
          tone="blue"
        />
        <EscalationStat
          label="Tasks"
          value={stats.overdueTasks}
          tone="navy"
        />
      </div>

      <section className="rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-3">
        <button
          type="button"
          onClick={() =>
            setWorkspaceExpanded((current) => !current)
          }
          aria-expanded={workspaceExpanded}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Escalation Workspace
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {workspaceExpanded
                ? "Hide filters, overdue records and escalation actions."
                : "Open filters, overdue records and escalation actions."}
            </p>
          </div>

          <ShieldAlert
            size={17}
            className={`shrink-0 text-[#123865] transition ${
              workspaceExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </section>

      {workspaceExpanded ? (
        <div className="min-w-0 space-y-4 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_26px_rgba(18,56,101,0.05)] sm:p-5">
        {error ? (
          <Feedback
            tone="error"
            message={error}
            onClose={() => setError("")}
          />
        ) : null}

        {successMessage ? (
          <Feedback
            tone="success"
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        ) : null}

        <section className="min-w-0 rounded-[1.45rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-orange-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
              Intervention Filters
            </p>
          </div>

          <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
            <div className="relative min-w-0">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student id, title, owner, notes..."
                className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-9 pr-3 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value)
              }
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233F] outline-none transition hover:border-[#FF5A0A] focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All sources</option>
              <option value="follow_up">Follow-ups</option>
              <option value="task">Student tasks</option>
            </select>

            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(event.target.value)
              }
              className="h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233F] outline-none transition hover:border-[#FF5A0A] focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>

          <p className="mt-3 text-xs font-bold text-slate-500">
            {filteredItems.length} matching escalation
            {filteredItems.length === 1 ? "" : "s"} · page {safePage} of{" "}
            {totalPages}
          </p>
        </section>

        <div className="mt-5 space-y-3">
          {loading && !overdueItems.length ? (
            <EmptyState
              title="Checking overdue work"
              text="Loading follow-ups and Student OS tasks."
              loading
            />
          ) : pagedItems.length ? (
            pagedItems.map((item, index) => (
              <EscalationCard
                key={`${item.source}-${item.id}`}
                item={item}
                index={index}
                busy={
                  busyKey === `reminder-${item.id}` ||
                  busyKey === `task-${item.id}`
                }
                onCompleteReminder={() =>
                  markReminderCompleted(item)
                }
                onTaskStatus={(status) =>
                  updateTaskStatus(item, status)
                }
                reduceMotion={reduceMotion}
              />
            ))
          ) : (
            <EmptyState
              title="No overdue escalations"
              text="The current queue and filters are under control."
            />
          )}
        </div>

        {filteredItems.length > PAGE_SIZE ? (
          <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-orange-200 pt-4">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() =>
                setPage((previous) => Math.max(1, previous - 1))
              }
              className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <p className="text-xs font-black text-slate-600">
              Page {safePage} / {totalPages}
            </p>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((previous) =>
                  Math.min(totalPages, previous + 1)
                )
              }
              className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
      ) : null}
    </motion.section>
  );
}

function EscalationCard({
  item,
  index,
  busy,
  onCompleteReminder,
  onTaskStatus,
  reduceMotion = false,
}) {
  const severityStyles = {
    critical: {
      card: "border-red-500 bg-red-50",
      badge: "border-red-500 bg-red-100 text-red-900",
      icon: "text-red-700",
    },
    high: {
      card: "border-orange-500 bg-orange-50",
      badge: "border-orange-500 bg-orange-100 text-orange-900",
      icon: "text-orange-700",
    },
    medium: {
      card: "border-[#F59E0B] bg-[#FFF7ED]",
      badge: "border-amber-300 bg-amber-100 text-amber-900",
      icon: "text-amber-700",
    },
  };

  const style =
    severityStyles[item.escalation] || severityStyles.medium;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.15),
      }}
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] sm:p-5 ${style.card}`}
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${style.badge}`}
            >
              {item.escalation}
            </span>

            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-700">
              {item.daysLate} day{item.daysLate === 1 ? "" : "s"} late
            </span>

            <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-blue-800">
              {item.sourceLabel}
            </span>

            {item.priority ? (
              <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-700">
                {item.priority}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-start gap-3">
            <ShieldAlert
              size={18}
              className={`mt-0.5 shrink-0 ${style.icon}`}
            />

            <div>
              <h3 className="text-lg font-black text-[#10233f]">
                {item.title || "Overdue action"}
              </h3>

              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                {item.detail}
              </p>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
            <InfoTile
              label="Student"
              value={`#${item.student_id || "Unknown"}`}
            />
            <InfoTile
              label="Student Type"
              value={item.student_type || "Unknown"}
            />
            <InfoTile
              label="Due"
              value={item.dueDisplay}
            />
            <InfoTile
              label={
                item.source === "task" ? "Assigned To" : "Created By"
              }
              value={
                item.source === "task"
                  ? item.assigned_to || "Unassigned"
                  : item.created_by_name || "Unknown"
              }
            />
          </div>

          {item.source === "task" &&
          normalize(item.status) === "blocked" &&
          item.blocked_reason ? (
            <div className="mt-3 rounded-xl border-2 border-red-300 bg-white p-3 text-xs font-bold text-red-800">
              Blocked: {item.blocked_reason}
            </div>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-3">
          {item.source === "follow_up" ? (
            <button
              type="button"
              onClick={onCompleteReminder}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 size={14} />
              {busy ? "Saving..." : "Mark Completed"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onTaskStatus("in_progress")}
                disabled={busy || normalize(item.status) === "in_progress"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Clock3 size={14} />
                In Progress
              </button>

              <button
                type="button"
                onClick={() => onTaskStatus("blocked")}
                disabled={busy || normalize(item.status) === "blocked"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] px-4 py-2.5 text-xs font-black text-red-800 transition hover:-translate-y-0.5 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShieldAlert size={14} />
                Blocked
              </button>

              <button
                type="button"
                onClick={() => onTaskStatus("completed")}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-100 disabled:opacity-40"
              >
                <CheckCircle2 size={14} />
                Complete
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EscalationStat({ label, value, tone }) {
  const styles = {
    red: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    critical: "border-red-500 bg-red-100 text-red-900",
    orange: "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    navy: "border-[#123865] bg-[#123865] text-white",
  };

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-5 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${
        styles[tone] || styles.red
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-75">
        {label}
      </p>

      <h3 className="mt-3 text-3xl font-black">{value}</h3>
    </div>
  );
}

function DarkStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-orange-100">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function Feedback({ tone, message, onClose }) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-4 flex min-w-0 items-start gap-3 rounded-2xl border-[3px] p-4 text-sm font-bold shadow-[0_7px_18px_rgba(18,56,101,0.04)] ${
        isError
          ? "border-red-400 bg-red-50 text-red-900"
          : "border-emerald-400 bg-emerald-50 text-emerald-900"
      }`}
    >
      {isError ? (
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">{message}</div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg px-2 py-1 font-black transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-current/15"
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
}

function EmptyState({ title, text, loading = false }) {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
        {loading ? (
          <RefreshCw size={25} className="animate-spin" />
        ) : (
          <TimerReset size={25} />
        )}
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233f]">
        {title}
      </h3>

      <p className="mt-2 text-sm font-medium text-slate-600">
        {text}
      </p>
    </div>
  );
}

export default OverdueEscalationPanel;
