// AutoStageMovementPanel V5 MAXIMUM — Framed Pipeline Movement Command
// src/components/admin/AutoStageMovementPanel.jsx
//
// Maximum pass:
// - preserves current public API
// - preserves buildAutoStageSuggestions + getStageSuggestionSummary engines
// - human-approved only: no automatic stage changes
// - async-safe apply flow with duplicate-click protection
// - no-op protection if suggested stage already matches current stage
// - stronger appointment fallback mapping
// - inline success/error/warning feedback instead of silent failures
// - reduced-motion support
// - search, lead-type, confidence and urgency filters
// - applied-state tracking
// - safer empty and filtered-empty states
// - richer queue summary and movement pressure
// - explicit white text on navy surfaces
// - responsive high-contrast Zaifan Admin OS layout

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Filter,
  GitBranch,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import {
  buildAutoStageSuggestions,
  getStageSuggestionSummary,
} from "../../services/autoStageEngine";

const APPOINTMENT_STAGE_TO_STATUS = {
  new_booking: "pending",
  confirmed: "confirmed",
  consultation_done: "completed",
  follow_up_needed: "pending",
  converted_to_lead: "completed",
  not_interested: "completed",
  cancelled: "cancelled",
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function prettyStage(value = "") {
  return String(value || "Unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getErrorMessage(
  error,
  fallback = "Stage movement failed."
) {
  if (!error) return fallback;
  if (typeof error === "string") return error;

  return (
    error?.message ||
    error?.error_description ||
    error?.details ||
    fallback
  );
}

function AutoStageMovementPanel({
  cardClass = "",
  inquiries = [],
  appointments = [],
  updateInquiryStatus = () => {},
  updateAppointmentStage = null,
  updateAppointmentStatus = () => {},
}) {
  const shouldReduceMotion = useReducedMotion();

  const [applyingId, setApplyingId] = useState("");
  const [appliedIds, setAppliedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState("");
  const [leadTypeFilter, setLeadTypeFilter] =
    useState("all");
  const [confidenceFilter, setConfidenceFilter] =
    useState("all");
  const [urgencyFilter, setUrgencyFilter] =
    useState("all");

  const suggestions = useMemo(() => {
    const result = buildAutoStageSuggestions({
      inquiries: safeArray(inquiries),
      appointments: safeArray(appointments),
    });

    return {
      ...result,
      allSuggestions: safeArray(
        result?.allSuggestions
      ),
      highConfidence: safeArray(
        result?.highConfidence
      ),
      highUrgency: safeArray(
        result?.highUrgency
      ),
      total: Number(result?.total || 0),
    };
  }, [inquiries, appointments]);

  const summary = useMemo(
    () =>
      getStageSuggestionSummary({
        inquiries: safeArray(inquiries),
        appointments: safeArray(appointments),
      }) || {
        level: "stable",
        title: "Pipeline stable",
        message:
          "No major stage movement signal was detected.",
      },
    [inquiries, appointments]
  );

  const filteredSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return suggestions.allSuggestions.filter(
      (suggestion) => {
        if (
          leadTypeFilter !== "all" &&
          normalize(
            suggestion.leadType
          ) !== leadTypeFilter
        ) {
          return false;
        }

        if (
          confidenceFilter !== "all" &&
          normalize(
            suggestion.confidence
          ) !== confidenceFilter
        ) {
          return false;
        }

        if (
          urgencyFilter !== "all" &&
          normalize(
            suggestion.urgency
          ) !== urgencyFilter
        ) {
          return false;
        }

        if (!query) return true;

        return [
          suggestion.title,
          suggestion.studentName,
          suggestion.currentStage,
          suggestion.suggestedStage,
          suggestion.reason,
          suggestion.leadType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      }
    );
  }, [
    suggestions,
    search,
    leadTypeFilter,
    confidenceFilter,
    urgencyFilter,
  ]);

  const metrics = useMemo(() => {
    let inquirySuggestions = 0;
    let appointmentSuggestions = 0;
    let highConfidence = 0;
    let highUrgency = 0;
    let scoreTotal = 0;

    for (const item of suggestions.allSuggestions) {
      const leadType = normalize(item.leadType);
      const confidence = normalize(item.confidence);
      const urgency = normalize(item.urgency);

      if (leadType === "inquiry") {
        inquirySuggestions += 1;
      } else if (leadType === "appointment") {
        appointmentSuggestions += 1;
      }

      if (confidence === "high") highConfidence += 1;
      if (urgency === "high") highUrgency += 1;

      scoreTotal += Number(item.score || 0);
    }

    const total = suggestions.allSuggestions.length;

    return {
      total,
      inquirySuggestions,
      appointmentSuggestions,
      highConfidence,
      highUrgency,
      averageScore: total > 0 ? Math.round(scoreTotal / total) : 0,
      applied: appliedIds.length,
    };
  }, [suggestions.allSuggestions, appliedIds.length]);

  const resetFilters = () => {
    setSearch("");
    setLeadTypeFilter("all");
    setConfidenceFilter("all");
    setUrgencyFilter("all");
  };

  const applySuggestion = async (
    suggestion
  ) => {
    if (!suggestion || applyingId) return;

    if (
      !suggestion.leadId ||
      !suggestion.suggestedStage
    ) {
      setFeedback({
        type: "error",
        title: "Suggestion is incomplete",
        detail:
          "The movement engine did not return a valid lead ID and target stage.",
      });
      return;
    }

    const currentStage =
      normalize(suggestion.currentStage);
    const suggestedStage =
      normalize(suggestion.suggestedStage);

    if (
      currentStage &&
      currentStage === suggestedStage
    ) {
      setAppliedIds((current) =>
        current.includes(suggestion.id)
          ? current
          : [...current, suggestion.id]
      );

      setFeedback({
        type: "warning",
        title: "No movement required",
        detail:
          "This record already appears to be at the suggested stage.",
      });
      return;
    }

    setApplyingId(suggestion.id);
    setFeedback(null);

    try {
      if (
        normalize(suggestion.leadType) ===
        "inquiry"
      ) {
        await Promise.resolve(
          updateInquiryStatus(
            suggestion.leadId,
            suggestion.suggestedStage
          )
        );
      } else if (
        normalize(suggestion.leadType) ===
        "appointment"
      ) {
        if (
          typeof updateAppointmentStage ===
          "function"
        ) {
          await Promise.resolve(
            updateAppointmentStage(
              suggestion.leadId,
              suggestion.suggestedStage
            )
          );
        } else {
          const fallbackStatus =
            APPOINTMENT_STAGE_TO_STATUS[
              suggestion.suggestedStage
            ];

          if (!fallbackStatus) {
            throw new Error(
              `No appointment status fallback exists for "${suggestion.suggestedStage}".`
            );
          }

          await Promise.resolve(
            updateAppointmentStatus(
              suggestion.leadId,
              fallbackStatus
            )
          );
        }
      } else {
        throw new Error(
          `Unsupported lead type: ${
            suggestion.leadType || "unknown"
          }`
        );
      }

      setAppliedIds((current) => [
        ...new Set([
          ...current,
          suggestion.id,
        ]),
      ]);

      setFeedback({
        type: "success",
        title: "Pipeline movement applied",
        detail: `${
          suggestion.studentName ||
          "Student"
        } was moved toward ${prettyStage(
          suggestion.suggestedStage
        )}.`,
      });
    } catch (error) {
      console.error(
        "Auto stage movement failed:",
        error
      );

      setFeedback({
        type: "error",
        title: "Stage movement failed",
        detail: getErrorMessage(
          error,
          "The CRM update could not be completed. Verify the parent update function and Supabase permissions."
        ),
      });
    } finally {
      setApplyingId("");
    }
  };

  const topSuggestions =
    filteredSuggestions.slice(0, 20);

  return (
    <section className="space-y-5">
      <motion.section
        initial={
          shouldReduceMotion
            ? false
            : { opacity: 0, y: 12 }
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
        className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_40px_rgba(15,35,63,0.08)] sm:p-4"
      >
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.22fr)_minmax(20rem,0.78fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Bot size={12} />
                Pipeline Intelligence
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={12} />
                Human Approved
              </span>
            </div>

            <h2 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Auto Stage Movement
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
              Detect inquiry and appointment
              records that appear ready to move
              forward, then let staff approve the
              CRM change one case at a time.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkStat
                label="Suggestions"
                value={metrics.total}
              />
              <DarkStat
                label="High Confidence"
                value={metrics.highConfidence}
              />
              <DarkStat
                label="High Urgency"
                value={metrics.highUrgency}
              />
              <DarkStat
                label="Applied"
                value={metrics.applied}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
              Movement Pressure
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <OrangeStat
                label="Inquiries"
                value={metrics.inquirySuggestions}
                icon={UserCheck}
              />
              <OrangeStat
                label="Appointments"
                value={metrics.appointmentSuggestions}
                icon={GitBranch}
              />
            </div>

            <div className="mt-3 rounded-[1.15rem] border-2 border-white/25 bg-white/10 p-3 text-white">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Average Suggestion Score
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {metrics.averageScore}
              </p>
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              Suggestions never move students
              automatically. A staff member must
              approve every change.
            </p>
          </div>
        </div>
      </motion.section>

      {feedback ? (
        <Feedback
          feedback={feedback}
          onClose={() =>
            setFeedback(null)
          }
        />
      ) : null}

      <section
        className={`${cardClass} min-w-0 rounded-[1.7rem] border-[3px] border-[#F97316] bg-[#FFF7EC] p-5 shadow-[0_8px_24px_rgba(15,35,63,0.055)]`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
                summary.level === "urgent"
                  ? "border-[#FB7185] bg-[#FFF4F4] text-red-700"
                  : summary.level === "active"
                  ? "border-[#F97316] bg-[#FFF4E8] text-orange-700"
                  : "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
              }`}
            >
              {summary.level === "urgent" ? (
                <Zap size={18} />
              ) : summary.level === "active" ? (
                <Sparkles size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
                Automation Summary
              </p>

              <h3 className="mt-1 text-xl font-black text-[#10233f]">
                {summary.title}
              </h3>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                {summary.message}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit rounded-full border-2 border-slate-300 bg-[#fffaf4] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
            Review before applying
          </span>
        </div>
      </section>

      <section
        className={`${cardClass} min-w-0 rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_8px_24px_rgba(15,35,63,0.05)]`}
      >
        <div className="flex items-center gap-2">
          <Filter
            size={14}
            className="text-orange-700"
          />
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
            Queue Controls
          </p>
        </div>

        <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-2 2xl:grid-cols-[minmax(18rem,1fr)_155px_165px_155px_auto]">
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
              placeholder="Search student, stage or reason..."
              className="h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-9 pr-3 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <select
            value={leadTypeFilter}
            onChange={(event) =>
              setLeadTypeFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
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
            value={confidenceFilter}
            onChange={(event) =>
              setConfidenceFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">
              All confidence
            </option>
            <option value="high">
              High confidence
            </option>
            <option value="medium">
              Medium confidence
            </option>
            <option value="low">
              Low confidence
            </option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(event) =>
              setUrgencyFilter(
                event.target.value
              )
            }
            className="h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">
              All urgency
            </option>
            <option value="high">
              High urgency
            </option>
            <option value="medium">
              Medium urgency
            </option>
            <option value="low">
              Low urgency
            </option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-xs font-black text-[#10233f] transition hover:border-orange-400 hover:bg-orange-50"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </section>

      {topSuggestions.length === 0 ? (
        suggestions.allSuggestions.length ? (
          <FilteredEmptyState />
        ) : (
          <StableState
            cardClass={cardClass}
          />
        )
      ) : (
        <div className="grid gap-4">
          {topSuggestions.map(
            (suggestion, index) => {
              const applied =
                appliedIds.includes(
                  suggestion.id
                );

              return (
                <motion.article
                  key={suggestion.id}
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 12,
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
                        : 0.24,
                    delay:
                      shouldReduceMotion
                        ? 0
                        : Math.min(
                            index * 0.025,
                            0.12
                          ),
                  }}
                  className={`${cardClass} overflow-hidden rounded-[1.7rem] border-[3px] ${
                    applied
                      ? "border-emerald-300"
                      : "border-orange-300"
                  } bg-white shadow-[0_8px_24px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5`}
                >
                  <div className="grid xl:grid-cols-[1fr_230px]">
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone="orange"
                          text={`#${
                            index + 1
                          } Suggestion`}
                        />

                        <Badge
                          tone="blue"
                          text={
                            suggestion.leadType ||
                            "record"
                          }
                        />

                        <Badge
                          tone={
                            normalize(
                              suggestion.confidence
                            ) === "high"
                              ? "green"
                              : "orange"
                          }
                          text={`${suggestion.confidence || "Unknown"} Confidence`}
                        />

                        <Badge
                          tone={
                            normalize(
                              suggestion.urgency
                            ) === "high"
                              ? "red"
                              : normalize(
                                  suggestion.urgency
                                ) === "medium"
                              ? "orange"
                              : "slate"
                          }
                          text={`${suggestion.urgency || "Unknown"} Urgency`}
                        />

                        {applied ? (
                          <Badge
                            tone="green"
                            text="Applied"
                          />
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-xl font-black text-[#10233f]">
                        {suggestion.title ||
                          "Pipeline movement suggestion"}
                      </h3>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {suggestion.studentName ||
                          "Unnamed Student"}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <StageBox
                          label="Current"
                          value={
                            suggestion.currentStage
                          }
                          tone="slate"
                        />

                        <ArrowRight className="mx-auto h-5 w-5 text-orange-600" />

                        <StageBox
                          label="Suggested"
                          value={
                            suggestion.suggestedStage
                          }
                          tone="orange"
                        />
                      </div>

                      <div className="mt-4 rounded-[1.15rem] border-2 border-slate-300 bg-[#fffaf4] p-4">
                        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
                          Why Zaifan suggests this
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                          {suggestion.reason ||
                            "No reason was supplied by the stage engine."}
                        </p>
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-200 bg-[#fffaf4] p-5 xl:border-l-2 xl:border-t-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                        Suggestion Score
                      </p>

                      <p className="mt-2 text-4xl font-black text-orange-700">
                        {Number(
                          suggestion.score ||
                            0
                        )}
                      </p>

                      <div className="mt-4 rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] p-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                          Human Approval
                        </p>
                        <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">
                          Applying this will
                          call the existing CRM
                          update function.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          applySuggestion(
                            suggestion
                          )
                        }
                        disabled={
                          Boolean(applyingId) ||
                          applied
                        }
                        className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition ${
                          applied
                            ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                            : "border-orange-600 bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.16)] hover:-translate-y-0.5 hover:bg-orange-600"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {applyingId ===
                        suggestion.id ? (
                          <>
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                            Applying...
                          </>
                        ) : applied ? (
                          <>
                            <Check
                              size={14}
                            />
                            Applied
                          </>
                        ) : (
                          <>
                            <RefreshCw
                              size={14}
                            />
                            {suggestion.actionLabel ||
                              "Apply Stage"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            }
          )}
        </div>
      )}

      {filteredSuggestions.length > 20 ? (
        <div className="rounded-[1.3rem] border-2 border-[#F97316] bg-[#FFF4E8] p-4">
          <p className="text-xs font-black text-orange-800">
            Showing the first 20 matching
            suggestions of{" "}
            {filteredSuggestions.length}. Use
            the filters to narrow the queue.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function StageBox({
  label,
  value,
  tone = "slate",
}) {
  const styles =
    tone === "orange"
      ? "border-[#F97316] bg-[#FFF4E8]"
      : "border-[#C9D7E6] bg-white";

  return (
    <div
      className={`rounded-[1.15rem] border-2 p-4 ${styles}`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label} Stage
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#10233f]">
        {prettyStage(value)}
      </p>
    </div>
  );
}

function Badge({
  tone = "slate",
  text,
}) {
  const styles = {
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
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
      className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
        styles[tone] ||
        styles.slate
      }`}
    >
      {text}
    </span>
  );
}

function Feedback({
  feedback,
  onClose,
}) {
  const success =
    feedback.type === "success";
  const error =
    feedback.type === "error";

  const style = success
    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
    : error
    ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
    : "border-[#F59E0B] bg-[#FFF7ED] text-amber-900";

  const Icon = success
    ? CheckCircle2
    : AlertTriangle;

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-[1.3rem] border-[3px] p-4 ${style}`}
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
        className="rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function DarkStat({
  label,
  value,
}) {
  return (
    <div className="rounded-[1.05rem] border-2 border-white/20 bg-white/10 p-3 text-white">
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
    <div className="rounded-[1.05rem] border-2 border-white/25 bg-white/10 p-3 text-white">
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

function StableState({
  cardClass,
}) {
  return (
    <div
      className={`${cardClass} rounded-[1.7rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-8 text-center shadow-[0_8px_24px_rgba(15,35,63,0.04)]`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
        <CheckCircle2 size={22} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233f]">
        Pipeline looks clean
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        No strong auto-stage movement
        suggestion was detected. The current CRM
        stages appear stable.
      </p>
    </div>
  );
}

function FilteredEmptyState() {
  return (
    <div className="rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-white p-8 text-center">
      <Search
        size={22}
        className="mx-auto text-orange-600"
      />

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
        No matching movement suggestions
      </h3>

      <p className="mt-2 text-sm font-semibold text-slate-600">
        Suggestions exist, but none match the
        active filters.
      </p>
    </div>
  );
}

export default AutoStageMovementPanel;
