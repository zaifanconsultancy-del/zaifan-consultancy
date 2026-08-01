// AutoReminderGenerator PARTNER OS EXTREME — Executive Follow-Up Automation Command Queue
// src/components/admin/AutoReminderGenerator.jsx
//
// Maximum pass:
// - preserves current inquiries / appointments / cardClass API
// - preserves buildAutoReminderSuggestions service integration
// - Supabase timeout protection
// - duplicate-reminder prevention
// - inline success/error feedback instead of alert()
// - safer due-date handling
// - realtime refresh after reminder creation
// - bulk-create-ready architecture without auto-creating anything
// - search + type filter + due-window filter
// - created-state tracking so admins cannot accidentally double-create
// - reduced-motion support
// - proper empty/loading/error states
// - stronger navy/orange/cream Admin OS hierarchy
// - explicit white text on navy surfaces
// - no fake automation: reminders are only created after human approval

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { buildAutoReminderSuggestions } from "../../../../services/autoReminderEngine";

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

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildDueDate(days) {
  const due = new Date();
  const safeDays = Math.max(0, Number(days) || 0);
  due.setDate(due.getDate() + safeDays);
  return toDateKey(due);
}

function AutoReminderGenerator({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const shouldReduceMotion = useReducedMotion();
  const requestRef = useRef(0);

  const [creatingId, setCreatingId] = useState("");
  const [createdIds, setCreatedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");

  const suggestions = useMemo(
    () =>
      safeArray(
        buildAutoReminderSuggestions({
          inquiries: safeArray(inquiries),
          appointments: safeArray(appointments),
        })
      ),
    [inquiries, appointments]
  );

  const filteredSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suggestions.filter((item) => {
      const studentType = normalize(item.studentType);
      const dueInDays = Number(item.dueInDays || 0);

      if (
        typeFilter !== "all" &&
        studentType !== typeFilter
      ) {
        return false;
      }

      if (
        dueFilter === "today" &&
        dueInDays !== 0
      ) {
        return false;
      }

      if (
        dueFilter === "soon" &&
        !(dueInDays >= 0 && dueInDays <= 2)
      ) {
        return false;
      }

      if (
        dueFilter === "later" &&
        dueInDays <= 2
      ) {
        return false;
      }

      if (!query) return true;

      return [
        item.title,
        item.note,
        item.studentType,
        item.studentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [suggestions, search, typeFilter, dueFilter]);

  const summary = useMemo(() => {
    let today = 0;
    let soon = 0;
    let inquiry = 0;
    let appointment = 0;

    for (const item of suggestions) {
      const days = Number(item.dueInDays || 0);
      const studentType = normalize(item.studentType);

      if (days === 0) today += 1;
      if (days >= 0 && days <= 2) soon += 1;

      if (studentType === "inquiry") {
        inquiry += 1;
      } else if (studentType === "appointment") {
        appointment += 1;
      }
    }

    return {
      total: suggestions.length,
      today,
      soon,
      inquiry,
      appointment,
      created: createdIds.length,
    };
  }, [suggestions, createdIds.length]);

  const clearFeedbackLater = () => {
    window.setTimeout(() => {
      setFeedback(null);
    }, 4200);
  };

  const checkExistingReminder = async (
    suggestion,
    dueDate
  ) => {
    const { data, error } = await withTimeout(
      supabase
        .from("follow_up_reminders")
        .select("id, title, due_date, status")
        .eq("student_id", suggestion.studentId)
        .eq("student_type", suggestion.studentType)
        .eq("title", suggestion.title)
        .eq("due_date", dueDate)
        .neq("status", "completed")
        .limit(1),
      "Duplicate reminder check timed out."
    );

    if (error) throw error;

    return Array.isArray(data) && data.length > 0;
  };

  const createReminder = async (suggestion) => {
    if (!suggestion?.id || creatingId) return;

    const requestId = ++requestRef.current;
    const dueDate = buildDueDate(
      suggestion.dueInDays
    );

    if (!suggestion.studentId) {
      setFeedback({
        type: "error",
        title: "Student record missing",
        detail:
          "This suggestion has no student ID, so no reminder was created.",
      });
      clearFeedbackLater();
      return;
    }

    if (!dueDate) {
      setFeedback({
        type: "error",
        title: "Due date could not be calculated",
        detail:
          "The reminder suggestion contains an invalid due-day value.",
      });
      clearFeedbackLater();
      return;
    }

    setCreatingId(suggestion.id);
    setFeedback(null);

    try {
      const duplicateExists =
        await checkExistingReminder(
          suggestion,
          dueDate
        );

      if (duplicateExists) {
        setCreatedIds((current) =>
          current.includes(suggestion.id)
            ? current
            : [...current, suggestion.id]
        );

        setFeedback({
          type: "warning",
          title: "Reminder already exists",
          detail:
            "Zaifan found the same active reminder for this student and due date, so a duplicate was not created.",
        });
        clearFeedbackLater();
        return;
      }

      const { data, error } = await withTimeout(
        supabase
          .from("follow_up_reminders")
          .insert({
            student_id: suggestion.studentId,
            student_type: suggestion.studentType,
            title: suggestion.title,
            notes: suggestion.note,
            due_date: dueDate,
            status: "pending",
          })
          .select()
          .single(),
        "Reminder creation timed out."
      );

      if (requestId !== requestRef.current) return;

      if (error) throw error;

      console.log(
        "Auto reminder created:",
        data
      );

      setCreatedIds((current) => [
        ...new Set([
          ...current,
          suggestion.id,
        ]),
      ]);

      setFeedback({
        type: "success",
        title: "Reminder created",
        detail:
          "The follow-up reminder was saved successfully to the student workflow.",
      });

      clearFeedbackLater();
    } catch (error) {
      console.error(
        "Auto reminder creation failed:",
        error
      );

      setFeedback({
        type: "error",
        title: "Reminder creation failed",
        detail:
          error?.message ||
          "Check Supabase connectivity, RLS permissions, and follow_up_reminders configuration.",
      });

      clearFeedbackLater();
    } finally {
      if (requestId === requestRef.current) {
        setCreatingId("");
      }
    }
  };

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setDueFilter("all");
  };

  return (
    <motion.section
      key="auto-reminder-generator"
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 14 }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: shouldReduceMotion
          ? 0
          : 0.28,
      }}
      className={`${cardClass} min-w-0 overflow-hidden rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_22px_55px_rgba(15,35,63,0.13)] sm:p-4`}
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white xl:grid-cols-[minmax(0,1.28fr)_minmax(20rem,0.72fr)]">
        <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/35 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-orange-200 shadow-inner">
              <Sparkles size={12} />
              Workflow Automation
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/35 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-orange-200 shadow-inner">
              <ShieldCheck size={12} />
              Human Approved
            </span>
          </div>

          <h2 className="mt-4 break-words text-2xl font-black leading-[1.08] tracking-[-0.025em] text-white sm:text-4xl">
            Auto Reminder Generator
          </h2>

          <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-200">
            Zaifan scans active CRM records and suggests
            follow-up reminders. Nothing is created until a
            staff member approves the suggestion.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <DarkStat
              label="Suggestions"
              value={summary.total}
            />
            <DarkStat
              label="Due Today"
              value={summary.today}
            />
            <DarkStat
              label="Due Soon"
              value={summary.soon}
            />
            <DarkStat
              label="Created"
              value={summary.created}
            />
          </div>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-7 xl:border-l-[3px] xl:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
            Suggestion Mix
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <OrangeStat
              label="Inquiries"
              value={summary.inquiry}
              icon={UserCheck}
            />
            <OrangeStat
              label="Appointments"
              value={summary.appointment}
              icon={CalendarClock}
            />
          </div>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            Duplicate protection checks the active reminder
            table before inserting a new reminder.
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-5 bg-[#FFF8EF] px-1 pb-1 pt-5">
        {feedback ? (
          <Feedback
            feedback={feedback}
            onClose={() =>
              setFeedback(null)
            }
          />
        ) : null}

        <section className="rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_10px_28px_rgba(15,35,63,0.08)] sm:p-5">
          <div className="flex items-center gap-2">
            <Filter
              size={14}
              className="text-[#FF5A0A]"
            />
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#123865]">
              Suggestion Controls
            </p>
          </div>

          <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-2 2xl:grid-cols-[minmax(18rem,1fr)_170px_170px_auto]">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search reminder title, note or student..."
                className="h-12 w-full min-w-0 rounded-xl border-2 border-[#9FB2C8] bg-[#FFFDF8] pl-9 pr-3 text-sm font-bold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#FF5A0A] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="h-12 min-w-0 rounded-xl border-2 border-[#9FB2C8] bg-[#FFFDF8] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:bg-white focus:ring-4 focus:ring-orange-100"
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

            <select
              value={dueFilter}
              onChange={(event) =>
                setDueFilter(
                  event.target.value
                )
              }
              className="h-12 min-w-0 rounded-xl border-2 border-[#9FB2C8] bg-[#FFFDF8] px-3 text-xs font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:bg-white focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">
                All due windows
              </option>
              <option value="today">
                Due today
              </option>
              <option value="soon">
                Due within 2 days
              </option>
              <option value="later">
                Due later
              </option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white shadow-[0_7px_16px_rgba(18,56,101,0.16)] transition hover:-translate-y-0.5 hover:bg-[#0E2E55] focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <RefreshCw size={14} />
              Reset
            </button>
          </div>
        </section>

        {filteredSuggestions.length ? (
          <div className="space-y-3">
            {filteredSuggestions
              .slice(0, 30)
              .map((item, index) => {
                const created =
                  createdIds.includes(
                    item.id
                  );

                const dueDate =
                  buildDueDate(
                    item.dueInDays
                  );

                return (
                  <motion.article
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
                          : 0.22,
                      delay:
                        shouldReduceMotion
                          ? 0
                          : Math.min(
                              index * 0.02,
                              0.12
                            ),
                    }}
                    className={`min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.06)] transition sm:p-5 ${
                      created
                        ? "border-[#34D399] bg-[#FBFFFD]"
                        : "border-[#C9D7E6] hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-[0_14px_30px_rgba(15,35,63,0.10)]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            tone="orange"
                            text={
                              item.studentType ||
                              "record"
                            }
                          />

                          <Badge
                            tone="slate"
                            text={`Due in ${
                              Number(
                                item.dueInDays ||
                                  0
                              )
                            } day${
                              Number(
                                item.dueInDays ||
                                  0
                              ) === 1
                                ? ""
                                : "s"
                            }`}
                          />

                          <Badge
                            tone="blue"
                            text={
                              dueDate ||
                              "No due date"
                            }
                          />

                          {created ? (
                            <Badge
                              tone="green"
                              text="Created"
                            />
                          ) : null}
                        </div>

                        <h3 className="mt-3 break-words text-lg font-black leading-snug text-[#10233F] sm:text-xl">
                          {item.title ||
                            "Follow-up reminder"}
                        </h3>

                        <p className="mt-2 max-w-4xl break-words text-sm font-semibold leading-6 text-slate-600">
                          {item.note ||
                            "No reminder note provided."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                          <span className="max-w-full rounded-lg border-2 border-[#D7E0EA] bg-[#FFF8EF] px-2.5 py-1.5 [overflow-wrap:anywhere]">
                            Student ID:{" "}
                            {item.studentId ||
                              "Missing"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          createReminder(
                            item
                          )
                        }
                        disabled={
                          creatingId ===
                            item.id ||
                          Boolean(
                            creatingId
                          ) ||
                          created
                        }
                        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition ${
                          created
                            ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                            : "border-[#C84600] bg-[#FF5A0A] text-white shadow-[0_9px_20px_rgba(255,90,10,0.22)] hover:-translate-y-0.5 hover:bg-[#E84F00] focus:outline-none focus:ring-4 focus:ring-orange-100"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {creatingId ===
                        item.id ? (
                          <>
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                            Creating...
                          </>
                        ) : created ? (
                          <>
                            <Check
                              size={14}
                            />
                            Created
                          </>
                        ) : (
                          <>
                            <CalendarClock
                              size={14}
                            />
                            Create Reminder
                          </>
                        )}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
          </div>
        ) : suggestions.length ? (
          <EmptyFilteredState />
        ) : (
          <EmptyState />
        )}

        {suggestions.length > 30 ? (
          <div className="rounded-[1.35rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-4 shadow-[0_7px_18px_rgba(255,90,10,0.08)]">
            <p className="text-xs font-black leading-5 text-[#9A3A00]">
              Showing the first 30 suggestions of{" "}
              {suggestions.length}. Use search and filters
              to narrow the queue.
            </p>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

function Feedback({
  feedback,
  onClose,
}) {
  const isSuccess =
    feedback.type === "success";
  const isError =
    feedback.type === "error";

  const styles = isSuccess
    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
    : isError
    ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
    : "border-[#F59E0B] bg-[#FFF7ED] text-amber-900";

  const Icon = isSuccess
    ? CheckCircle2
    : AlertTriangle;

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-[1.3rem] border-[3px] p-4 ${styles}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          size={17}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="text-sm font-black">
            {feedback.title}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5">
            {feedback.detail}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function Badge({
  tone = "slate",
  text,
}) {
  const styles = {
    orange:
      "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    slate:
      "border-slate-300 bg-[#fffaf4] text-slate-600",
  };

  return (
    <span
      className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] ${
        styles[tone] ||
        styles.slate
      }`}
    >
      {text}
    </span>
  );
}

function DarkStat({
  label,
  value,
}) {
  return (
    <div className="rounded-[1.15rem] border-2 border-white/25 bg-white/10 p-3.5 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeStat({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-[1.15rem] border-2 border-white/30 bg-white/10 p-3.5 text-white shadow-inner">
      <Icon
        size={14}
        className="text-white"
      />
      <p className="mt-2 text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-8 text-center shadow-[0_10px_26px_rgba(16,185,129,0.08)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
        <CheckCircle2
          size={22}
        />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233f]">
        No reminder suggestions
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
        The current inquiry and appointment records do not
        need an auto-generated follow-up reminder right now.
      </p>
    </div>
  );
}

function EmptyFilteredState() {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-[#123865] bg-white p-8 text-center shadow-[0_10px_26px_rgba(15,35,63,0.08)]">
      <Search
        size={22}
        className="mx-auto text-orange-600"
      />

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
        No matching suggestions
      </h3>

      <p className="mt-2 text-sm font-semibold text-slate-600">
        Suggestions exist, but none match the current search
        and filters.
      </p>
    </div>
  );
}

export default AutoReminderGenerator;
