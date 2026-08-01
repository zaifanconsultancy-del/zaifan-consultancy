// CrmAutomationPanel V8 PARTNER OS EXTREME — CRM Automation Intelligence Engine
// src/components/admin/workspaces/leads-crm/CrmAutomationPanel.jsx
//
// Maximum pass:
// - preserves cardClass / inquiries / appointments API
// - preserves buildAutomationSuggestions service integration
// - preserves follow_up_reminders Supabase read source
// - adds timeout protection
// - adds safer reminder refresh lifecycle
// - reduced-motion support
// - filters and search for large suggestion sets
// - priority counts + source counts + overdue reminder count
// - better empty/error/loading states
// - safer student type / title / message fallbacks
// - explicit human-review framing: suggestions are not auto-executed
// - white text only on navy surfaces
// - stronger Zaifan Admin OS structure
// - no fake GPT claim; deterministic workflow intelligence

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { buildAutomationSuggestions } from "../../../../services/crmAutomationEngine";

const REQUEST_TIMEOUT_MS = 12000;

async function withTimeout(
  promise,
  message = "Request timed out."
) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      REQUEST_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function validDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getVisibleActionReference(item, index) {
  const rawId = String(item?.id || "").trim();

  // Keep the real ID untouched for keys/backend logic.
  // Only make the Admin UI reference human-readable.
  if (/^reminder-action-/i.test(rawId)) {
    return `Reminder #${index + 1}`;
  }

  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(rawId) || rawId.length > 28) {
    return `Action #${index + 1}`;
  }

  return rawId || `Action #${index + 1}`;
}

function CrmAutomationPanel({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchReminders = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: fetchError,
      } = await withTimeout(
        supabase
          .from("follow_up_reminders")
          .select("*")
          .neq("status", "completed")
          .order("due_date", {
            ascending: true,
          })
          .limit(250),
        "Automation reminder loading timed out."
      );

      if (fetchError) {
        throw fetchError;
      }

      setReminders(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "CRM automation reminders failed:",
        err
      );

      setError(
        err?.message ||
          "Automation reminders could not load. Check Supabase, RLS, and follow_up_reminders."
      );

      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReminders();
  }, []);

  const suggestions = useMemo(() => {
    const result = buildAutomationSuggestions({
      inquiries: safeArray(inquiries),
      appointments: safeArray(appointments),
      reminders: safeArray(reminders),
    });

    return safeArray(result);
  }, [
    inquiries,
    appointments,
    reminders,
  ]);

  const filteredSuggestions = useMemo(() => {
    const searchText = query
      .trim()
      .toLowerCase();

    return suggestions.filter((item) => {
      const priority = normalize(
        item.priority
      );

      const studentType = normalize(
        item.studentType ||
          item.student_type ||
          item.leadType ||
          item.type
      );

      if (
        priorityFilter !== "all" &&
        priority !== priorityFilter
      ) {
        return false;
      }

      if (
        typeFilter !== "all" &&
        studentType !== typeFilter
      ) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const searchable = [
        item.id,
        item.title,
        item.message,
        item.priority,
        item.studentType,
        item.student_type,
        item.leadType,
        item.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(
        searchText
      );
    });
  }, [
    suggestions,
    query,
    priorityFilter,
    typeFilter,
  ]);

  const counts = useMemo(() => {
    const urgent = suggestions.filter(
      (item) =>
        normalize(item.priority) ===
        "urgent"
    ).length;

    const high = suggestions.filter(
      (item) =>
        normalize(item.priority) ===
        "high"
    ).length;

    const medium = suggestions.filter(
      (item) =>
        normalize(item.priority) ===
        "medium"
    ).length;

    const inquiriesCount = suggestions.filter(
      (item) =>
        normalize(
          item.studentType ||
            item.student_type ||
            item.leadType ||
            item.type
        ) === "inquiry"
    ).length;

    const appointmentsCount = suggestions.filter(
      (item) =>
        normalize(
          item.studentType ||
            item.student_type ||
            item.leadType ||
            item.type
        ) === "appointment"
    ).length;

    const overdueReminders = reminders.filter(
      (reminder) => {
        const status = normalize(
          reminder.status
        );

        if (
          [
            "completed",
            "done",
            "cancelled",
            "canceled",
          ].includes(status)
        ) {
          return false;
        }

        const dueDate = validDate(
          reminder.due_date
        );

        return (
          dueDate &&
          dueDate.getTime() <
            Date.now()
        );
      }
    ).length;

    return {
      total: suggestions.length,
      urgent,
      high,
      medium,
      inquiries: inquiriesCount,
      appointments:
        appointmentsCount,
      overdueReminders,
      reminders:
        reminders.length,
    };
  }, [
    suggestions,
    reminders,
  ]);

  const resetFilters = () => {
    setQuery("");
    setPriorityFilter("all");
    setTypeFilter("all");
  };

  return (
    <motion.section
      key="crm-automation"
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 14,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.28,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="min-w-0 space-y-5"
    >
      <section
        className={`${cardClass} min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#FF5A0A] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.08)]`}
      >
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    <Workflow size={12} />
                    CRM Automation Engine
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    <ShieldCheck size={12} />
                    Human Review Required
                  </span>
                </div>

                <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Smart Next Actions
                </h2>

                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white sm:text-[15px]">
                  Turn live inquiry, appointment, and reminder signals into a clear,
                  review-ready operating queue for the Zaifan team.
                </p>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-[280px]">
                <DarkMetric label="Actions" value={counts.total} />
                <DarkMetric label="Urgent" value={counts.urgent} />
                <DarkMetric label="High" value={counts.high} />
                <DarkMetric label="Overdue" value={counts.overdueReminders} />
              </div>
            </div>
          </div>

          <div
            style={{ backgroundColor: "#FF5A0A" }}
            className="border-t-[3px] border-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
                  Engine Health
                </p>
                <h3 className="mt-3 text-3xl font-black leading-none text-white">
                  {counts.total ? "Needs review" : "Queue clear"}
                </h3>
                <p className="mt-2 text-xs font-bold leading-5 text-white">
                  {counts.total
                    ? `${counts.total} suggested actions are ready for human review.`
                    : "No strong workflow action is currently required."}
                </p>
              </div>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-white">
                <Sparkles size={22} />
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="Inquiries"
                value={safeArray(inquiries).length}
              />
              <OrangeMetric
                label="Appointments"
                value={safeArray(appointments).length}
              />
              <OrangeMetric
                label="Open reminders"
                value={counts.reminders}
              />
              <OrangeMetric
                label="Medium"
                value={counts.medium}
              />
            </div>

            <button
              type="button"
              onClick={fetchReminders}
              disabled={loading}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] border-2 border-white/40 bg-white px-4 text-xs font-black text-[#C73A08] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF8EF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Refreshing Engine..." : "Refresh Engine"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-4 sm:grid-cols-2 xl:grid-cols-4">
          <AutomationStat label="Urgent actions" value={counts.urgent} tone="red" />
          <AutomationStat label="High priority" value={counts.high} tone="amber" />
          <AutomationStat label="Medium priority" value={counts.medium} tone="blue" />
          <AutomationStat label="Open reminders" value={counts.reminders} tone="orange" />
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-[1.35rem] border-[3px] border-red-300 bg-red-50 p-4 text-red-900"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="text-sm font-black">
                Automation engine could not load reminders
              </p>

              <p className="mt-1 text-xs font-semibold leading-5">
                {error}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <section
        className={`${cardClass} min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFFDF8] shadow-[0_10px_26px_rgba(15,35,63,0.06)]`}
      >
        <div className="flex flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-4 py-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
              <Filter size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                Action Command Bar
              </p>
              <p className="mt-1 text-sm font-black text-white">
                Find, segment, and review the current automation queue
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
              {filteredSuggestions.length} visible
            </span>
            <span className="rounded-lg border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
              {query || priorityFilter !== "all" || typeFilter !== "all"
                ? "Filters active"
                : "Full queue"}
            </span>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 p-4 sm:p-5 xl:grid-cols-[minmax(320px,1fr)_190px_200px_auto]">
          <div className="relative min-w-0">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#234E78]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search action title, message, student type, or reference..."
              className="min-h-12 w-full min-w-0 rounded-xl border-2 border-[#B8C9DA] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="min-h-12 min-w-0 rounded-xl border-2 border-[#B8C9DA] bg-white px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="min-h-12 min-w-0 rounded-xl border-2 border-[#B8C9DA] bg-white px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All record types</option>
            <option value="inquiry">Inquiries</option>
            <option value="appointment">Appointments</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!query && priorityFilter === "all" && typeFilter === "all"}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0E2E55] disabled:cursor-not-allowed disabled:border-[#C9D7E6] disabled:bg-[#F7FAFC] disabled:text-slate-400"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </section>

      {loading && !suggestions.length ? (
        <LoadingState
          cardClass={
            cardClass
          }
        />
      ) : filteredSuggestions.length ? (
        <div className="grid gap-4">
          {filteredSuggestions
            .slice(0, 30)
            .map((item, index) => (
              <AutomationRow
                key={
                  item.id ||
                  `${item.title}-${index}`
                }
                item={item}
                index={index}
                reduceMotion={
                  reduceMotion
                }
              />
            ))}
        </div>
      ) : suggestions.length ? (
        <FilteredEmptyState
          cardClass={
            cardClass
          }
        />
      ) : (
        <StableState
          cardClass={
            cardClass
          }
        />
      )}

      {filteredSuggestions.length >
      30 ? (
        <div className="rounded-[1.3rem] border-2 border-[#60A5FA] bg-[#F2F7FF] p-4">
          <p className="text-xs font-black text-blue-700">
            Showing the first 30 matching actions of{" "}
            {filteredSuggestions.length}. Use filters to narrow the queue.
          </p>
        </div>
      ) : null}
    </motion.section>
  );
}

function AutomationRow({
  item,
  index,
  reduceMotion,
}) {
  const priority = normalize(
    item.priority || "medium"
  );

  const studentType =
    normalize(
      item.studentType ||
        item.student_type ||
        item.leadType ||
        item.type
    ) || "record";

  const visibleActionReference =
    getVisibleActionReference(item, index);

  return (
    <motion.article
      initial={
        reduceMotion
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
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion
          ? 0
          : Math.min(index * 0.025, 0.12),
      }}
      className="group relative min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#123865] bg-[#FFFDF8] shadow-[0_10px_26px_rgba(15,35,63,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,35,63,0.10)]"
    >
      <div
        className={`absolute inset-y-0 left-0 w-2 ${
          priority === "urgent"
            ? "bg-red-500"
            : priority === "high"
              ? "bg-[#FF5A0A]"
              : "bg-[#4F9CF9]"
        }`}
      />

      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 p-5 pl-7 sm:p-6 sm:pl-8">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={priority} />

            <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-blue-700">
              {studentType}
            </span>

            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-600">
              Queue #{index + 1}
            </span>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#B84F0E]">
                Recommended next move
              </p>

              <h3 className="mt-2 text-xl font-black leading-tight text-[#10233F] sm:text-2xl">
                {item.title || "Automation suggestion"}
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {item.message || "No automation explanation was supplied."}
              </p>
            </div>

            <div className="rounded-[1.15rem] border-2 border-[#C9D7E6] bg-[#F7FAFC] p-4">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-[#123865]" />
                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#123865]">
                  Review gate
                </p>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                Verify the student record before changing CRM data or contacting the student.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
            Action Reference
          </p>

          <p className="mt-2 break-words text-xl font-black text-white">
            {visibleActionReference}
          </p>

          <div className="mt-5 rounded-[1rem] border-2 border-white/20 bg-white/10 p-4">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-orange-300" />
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Local workflow logic
              </p>
            </div>

            <p className="mt-2 text-xs font-semibold leading-5 text-white/85">
              Generated from live CRM records and the current follow-up reminder state.
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[1rem] border-2 border-white/20 bg-white/10 p-3">
            <ShieldCheck size={15} className="shrink-0 text-orange-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-white">
              Human approval only
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function AutomationStat({
  label,
  value,
  tone = "orange",
}) {
  const styles = {
    red:
      "border-red-300 bg-red-50 text-red-800",
    amber:
      "border-amber-300 bg-amber-50 text-amber-900",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    orange:
      "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.04)] ${
        styles[tone] ||
        styles.orange
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function PriorityBadge({
  priority,
}) {
  const style =
    getPriorityStyle(priority);

  return (
    <span
      className={`rounded-lg border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.badge}`}
    >
      {priority}
    </span>
  );
}

function getPriorityStyle(priority = "") {
  if (priority === "urgent") {
    return {
      badge:
        "border-red-300 bg-red-50 text-red-800",
      detail:
        "border-red-300 bg-red-50 text-red-800",
    };
  }

  if (priority === "high") {
    return {
      badge:
        "border-amber-300 bg-amber-50 text-amber-900",
      detail:
        "border-amber-300 bg-amber-50 text-amber-900",
    };
  }

  return {
    badge:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    detail:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
  };
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

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function LoadingState({
  cardClass = "",
}) {
  return (
    <div
      className={`${cardClass} rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-9 text-center`}
    >
      <RefreshCw
        size={22}
        className="mx-auto animate-spin text-[#F97316]"
      />

      <h3 className="mt-4 text-lg font-black text-[#10233F]">
        Refreshing automation engine
      </h3>

      <p className="mt-2 text-sm font-semibold text-slate-600">
        Loading active follow-up reminders and recalculating suggested actions.
      </p>
    </div>
  );
}

function StableState({
  cardClass = "",
}) {
  return (
    <div
      className={`${cardClass} rounded-[1.75rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-9 text-center shadow-[0_10px_26px_rgba(15,35,63,0.04)]`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#34D399] bg-white text-emerald-700">
        <CheckCircle2 size={22} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        No automation actions right now
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Current inquiry, appointment, and reminder data does not produce a strong
        next-action suggestion.
      </p>
    </div>
  );
}

function FilteredEmptyState({
  cardClass = "",
}) {
  return (
    <div
      className={`${cardClass} rounded-[1.75rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-9 text-center`}
    >
      <Search
        size={22}
        className="mx-auto text-[#F97316]"
      />

      <h3 className="mt-4 text-lg font-black text-[#10233F]">
        No matching automation actions
      </h3>

      <p className="mt-2 text-sm font-semibold text-slate-600">
        Suggestions exist, but none match the current search and filters.
      </p>
    </div>
  );
}

export default CrmAutomationPanel;
