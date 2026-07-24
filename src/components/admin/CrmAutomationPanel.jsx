// CrmAutomationPanel V4 MAXIMUM — CRM Automation Intelligence Engine
// src/components/admin/CrmAutomationPanel.jsx
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
import { supabase } from "../../lib/supabaseClient";
import { buildAutomationSuggestions } from "../../services/crmAutomationEngine";

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
      className="space-y-5"
    >
      <section
        className={`${cardClass} rounded-[2rem] border-[3px] border-orange-400 bg-[#fffaf4] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.07)] sm:p-4`}
      >
        <div className="grid overflow-hidden rounded-[1.6rem] border-2 border-[#234e78] xl:grid-cols-[1.18fr_0.82fr]">
          <div className="bg-[#123866] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Workflow size={12} />
                CRM Automation Engine
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={12} />
                Human Review
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Smart Next Actions
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              Scan inquiries, appointments, and follow-up reminders to surface
              the most important workflow actions for the team.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Actions"
                value={counts.total}
              />
              <DarkMetric
                label="Urgent"
                value={counts.urgent}
              />
              <DarkMetric
                label="High"
                value={counts.high}
              />
              <DarkMetric
                label="Overdue"
                value={counts.overdueReminders}
              />
            </div>
          </div>

          <div className="border-t-2 border-orange-300 bg-orange-500 p-5 text-white xl:border-l-2 xl:border-t-0 sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              Engine Inputs
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="Inquiries"
                value={safeArray(
                  inquiries
                ).length}
              />

              <OrangeMetric
                label="Appointments"
                value={safeArray(
                  appointments
                ).length}
              />

              <OrangeMetric
                label="Open Reminders"
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
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[1rem] border-2 border-white/30 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
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
                : "Refresh Engine"}
            </button>
          </div>
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
        className={`${cardClass} rounded-[1.65rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_8px_24px_rgba(15,35,63,0.04)]`}
      >
        <div className="flex items-center gap-2">
          <Filter
            size={14}
            className="text-orange-700"
          />

          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
            Action Controls
          </p>
        </div>

        <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(260px,1fr)_170px_180px_auto]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search action title, message or student type..."
              className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">
              All priorities
            </option>
            <option value="urgent">
              Urgent
            </option>
            <option value="high">
              High
            </option>
            <option value="medium">
              Medium
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">
              All record types
            </option>
            <option value="inquiry">
              Inquiries
            </option>
            <option value="appointment">
              Appointments
            </option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50"
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
        <div className="rounded-[1.3rem] border-2 border-orange-300 bg-orange-50 p-4">
          <p className="text-xs font-black text-orange-800">
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

  const style =
    getPriorityStyle(priority);

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
        duration:
          reduceMotion
            ? 0
            : 0.22,
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index * 0.025,
                0.12
              ),
      }}
      className="overflow-hidden rounded-[1.65rem] border-[3px] border-slate-300 bg-white shadow-[0_10px_26px_rgba(15,35,63,0.045)] transition hover:border-orange-400 hover:shadow-[0_12px_30px_rgba(15,35,63,0.055)]"
    >
      <div className="grid xl:grid-cols-[1fr_220px]">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge
              priority={priority}
            />

            <span className="rounded-full border-2 border-blue-300 bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-blue-800">
              {studentType}
            </span>

            <span className="rounded-full border-2 border-slate-300 bg-[#fffaf4] px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
              #{index + 1}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-black text-[#10233f]">
            {item.title ||
              "Automation suggestion"}
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {item.message ||
              "No automation explanation was supplied."}
          </p>

          <div
            className={`mt-4 rounded-xl border-2 p-3 ${style.detail}`}
          >
            <div className="flex items-start gap-2">
              <Target
                size={14}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.1em]">
                  Review Requirement
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                  This is a suggested next action. A counselor/admin should review
                  the student record before changing CRM data or contacting the student.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-slate-200 bg-[#fffaf4] p-5 xl:border-l-2 xl:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
            Action Reference
          </p>

          <p className="mt-2 text-base font-black text-orange-700">
            {visibleActionReference}
          </p>

          <div className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 p-3">
            <div className="flex items-center gap-2">
              <Bot
                size={14}
                className="text-orange-700"
              />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                Local Workflow Logic
              </p>
            </div>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Generated from the existing CRM automation engine and reminder state.
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
      "border-orange-300 bg-orange-50 text-orange-800",
  };

  return (
    <div
      className={`rounded-[1.3rem] border-[3px] p-4 ${
        styles[tone] ||
        styles.orange
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#10233f]">
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
      className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.badge}`}
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
      "border-orange-300 bg-orange-50 text-orange-800",
    detail:
      "border-orange-300 bg-orange-50 text-orange-800",
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
      className={`${cardClass} rounded-[1.7rem] border-[3px] border-slate-300 bg-white p-9 text-center`}
    >
      <RefreshCw
        size={22}
        className="mx-auto animate-spin text-orange-600"
      />

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
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
      className={`${cardClass} rounded-[1.75rem] border-[3px] border-emerald-300 bg-emerald-50 p-9 text-center shadow-[0_10px_26px_rgba(15,35,63,0.04)]`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
        <CheckCircle2 size={22} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233f]">
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
      className={`${cardClass} rounded-[1.75rem] border-[3px] border-slate-300 bg-white p-9 text-center`}
    >
      <Search
        size={22}
        className="mx-auto text-orange-600"
      />

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
        No matching automation actions
      </h3>

      <p className="mt-2 text-sm font-semibold text-slate-600">
        Suggestions exist, but none match the current search and filters.
      </p>
    </div>
  );
}

export default CrmAutomationPanel;
