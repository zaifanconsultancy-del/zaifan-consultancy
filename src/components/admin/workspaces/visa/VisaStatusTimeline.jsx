// VisaStatusTimeline PARTNER OS EXTREME V4 — Visa Journey Command Center
// src/components/admin/VisaStatusTimeline.jsx
//
// Reusable Visa OS timeline powered by student_visas + student_visa_events.
// Maximum pass: safer async loading, stale-request protection, normalized stages/statuses,
// real milestone derivation, refusal/reapply branch, progress intelligence, upcoming dates,
// event history controls, source transparency and responsive Zaifan Admin OS presentation.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileClock,
  History,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;

const JOURNEY = [
  {
    id: "preparation",
    label: "Preparation",
    helper: "Visa file and required documents are being prepared.",
  },
  {
    id: "appointment_booked",
    label: "Appointment",
    helper: "Visa appointment has been booked or scheduled.",
  },
  {
    id: "biometrics",
    label: "Biometrics",
    helper: "Biometrics milestone has been reached.",
  },
  {
    id: "medical",
    label: "Medical",
    helper: "Medical requirement has been completed where applicable.",
  },
  {
    id: "submitted",
    label: "Submitted",
    helper: "Visa application has been formally submitted.",
  },
  {
    id: "embassy_review",
    label: "Embassy Review",
    helper: "Application is under embassy or consular review.",
  },
  {
    id: "decision",
    label: "Decision",
    helper: "A visa decision has been recorded.",
  },
  {
    id: "passport_collection",
    label: "Passport Collection",
    helper: "Passport collection or return is being completed.",
  },
  {
    id: "completed",
    label: "Completed",
    helper: "Visa journey has reached its final operational milestone.",
  },
];

const STAGE_ALIASES = {
  preparation: "preparation",
  preparing: "preparation",
  "not started": "preparation",
  "appointment booked": "appointment_booked",
  appointment: "appointment_booked",
  booked: "appointment_booked",
  biometrics: "biometrics",
  biometric: "biometrics",
  medical: "medical",
  submitted: "submitted",
  submission: "submitted",
  "visa submitted": "submitted",
  "embassy review": "embassy_review",
  review: "embassy_review",
  "under review": "embassy_review",
  processing: "embassy_review",
  decision: "decision",
  approved: "decision",
  rejected: "decision",
  refused: "decision",
  "visa approved": "decision",
  "passport collection": "passport_collection",
  "passport returned": "passport_collection",
  completed: "completed",
  complete: "completed",
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const pretty = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeStage = (value) => {
  const normalized = normalize(value);
  return STAGE_ALIASES[normalized] || normalized.replace(/\s+/g, "_");
};

const normalizeStatus = (value) => normalize(value);

const formatDateTime = (value) => {
  if (!value) return "—";

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: /^\d{4}-\d{2}-\d{2}$/.test(raw) ? undefined : "2-digit",
    minute: /^\d{4}-\d{2}-\d{2}$/.test(raw) ? undefined : "2-digit",
  });
};

const toTimestamp = (value) => {
  if (!value) return null;

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const daysUntil = (value) => {
  if (!value) return null;

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return Math.ceil((date.getTime() - Date.now()) / 86400000);
};

const isTruthy = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  normalize(value) === "true" ||
  normalize(value) === "yes";

function withTimeout(
  promise,
  message = "Request timed out.",
  timeoutMs = REQUEST_TIMEOUT_MS
) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function dedupeEvents(rows = []) {
  const map = new Map();

  rows.forEach((event, index) => {
    const key =
      event?.id !== undefined && event?.id !== null
        ? String(event.id)
        : `${event?.event_type || "event"}-${event?.created_at || index}`;

    if (!map.has(key)) {
      map.set(key, event);
    }
  });

  return [...map.values()];
}

function VisaStatusTimeline({
  visa = null,
  visaId = null,
  events: sharedEvents = null,
  compact = false,
}) {
  const [visaCase, setVisaCase] = useState(visa || null);
  const [events, setEvents] = useState(
    Array.isArray(sharedEvents) ? dedupeEvents(sharedEvents) : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventsExpanded, setEventsExpanded] = useState(!compact);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const requestRef = useRef(0);
  const mountedRef = useRef(true);

  const resolvedVisaId = visaId || visa?.id || null;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (visa) {
      setVisaCase(visa);
    }
  }, [visa]);

  useEffect(() => {
    if (Array.isArray(sharedEvents)) {
      setEvents(dedupeEvents(sharedEvents));
    }
  }, [sharedEvents]);

  const load = async () => {
    if (!resolvedVisaId) return;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    setLoading(true);
    setError("");

    try {
      const shouldFetchVisa =
        !visaCase ||
        String(visaCase.id) !== String(resolvedVisaId);

      const shouldFetchEvents = !Array.isArray(sharedEvents);

      const [visaResult, eventResult] = await Promise.all([
        shouldFetchVisa
          ? withTimeout(
              supabase
                .from("student_visas")
                .select("*")
                .eq("id", resolvedVisaId)
                .single(),
              "Visa case loading timed out."
            )
          : Promise.resolve({ data: visaCase, error: null }),

        shouldFetchEvents
          ? withTimeout(
              supabase
                .from("student_visa_events")
                .select("*")
                .eq("visa_id", resolvedVisaId)
                .order("created_at", { ascending: true })
                .limit(500),
              "Visa event history loading timed out."
            )
          : Promise.resolve({
              data: dedupeEvents(sharedEvents || []),
              error: null,
            }),
      ]);

      if (!mountedRef.current || requestRef.current !== requestId) {
        return;
      }

      if (visaResult?.error) throw visaResult.error;
      if (eventResult?.error) throw eventResult.error;

      setVisaCase(visaResult?.data || null);
      setEvents(dedupeEvents(eventResult?.data || []));
      setLastSyncedAt(new Date());
    } catch (loadError) {
      if (!mountedRef.current || requestRef.current !== requestId) {
        return;
      }

      console.error("Visa timeline load failed:", loadError);

      setError(
        loadError?.message || "Visa journey could not be loaded."
      );
    } finally {
      if (mountedRef.current && requestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (resolvedVisaId) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedVisaId]);

  const currentStage = normalizeStage(
    visaCase?.visa_stage || "preparation"
  );

  const visaStatus = normalizeStatus(
    visaCase?.visa_status || "not_started"
  );

  const isRejected = [
    "rejected",
    "refused",
    "visa rejected",
    "visa refused",
  ].includes(visaStatus);

  const isApproved = [
    "visa approved",
    "approved",
    "granted",
  ].includes(visaStatus);

  const isCompleted = [
    "completed",
    "complete",
    "closed",
  ].includes(visaStatus);

  const stageIndex = useMemo(() => {
    const index = JOURNEY.findIndex(
      (item) => item.id === currentStage
    );

    if (index >= 0) return index;

    if (isCompleted) return JOURNEY.length - 1;
    if (isApproved || isRejected) {
      return JOURNEY.findIndex((item) => item.id === "decision");
    }

    return 0;
  }, [currentStage, isApproved, isRejected, isCompleted]);

  const sortedEvents = useMemo(() => {
    return dedupeEvents(events)
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = toTimestamp(a?.created_at) || 0;
        const bTime = toTimestamp(b?.created_at) || 0;
        return aTime - bTime;
      });
  }, [events]);

  const eventByNormalizedType = useMemo(() => {
    const map = new Map();

    sortedEvents.forEach((event) => {
      const key = normalizeStage(event?.event_type);
      if (!map.has(key)) {
        map.set(key, event);
      }
    });

    return map;
  }, [sortedEvents]);

  const milestoneDate = (stageId) => {
    const directMap = {
      preparation:
        visaCase?.created_at || visaCase?.visa_started_at,
      appointment_booked:
        visaCase?.appointment_date ||
        visaCase?.visa_appointment_date,
      biometrics: visaCase?.biometrics_date,
      medical: visaCase?.medical_date,
      submitted:
        visaCase?.submitted_at ||
        visaCase?.submission_date,
      embassy_review:
        visaCase?.embassy_review_at ||
        visaCase?.review_started_at,
      decision:
        visaCase?.decision_at ||
        visaCase?.decision_date,
      passport_collection:
        visaCase?.passport_collection_date ||
        visaCase?.passport_return_date,
      completed:
        visaCase?.completed_at ||
        visaCase?.closed_at,
    };

    if (directMap[stageId]) {
      return directMap[stageId];
    }

    const candidates = [
      stageId,
      `visa_stage_${stageId}`,
      `stage_${stageId}`,
      `quick_${stageId}`,
      `visa_${stageId}`,
    ].map(normalizeStage);

    const matching = sortedEvents.find((event) => {
      const eventType = normalizeStage(event?.event_type);
      const newValue = normalizeStage(event?.new_value);

      return (
        candidates.includes(eventType) ||
        newValue === stageId
      );
    });

    return matching?.created_at || null;
  };

  const milestones = useMemo(() => {
    return JOURNEY.map((stage, index) => {
      const date = milestoneDate(stage.id);

      let state = "upcoming";

      if (isRejected) {
        if (index < stageIndex) {
          state = "completed";
        } else if (index === stageIndex) {
          state = "rejected";
        }
      } else if (
        isCompleted ||
        (isApproved &&
          index <=
            JOURNEY.findIndex((item) => item.id === "decision"))
      ) {
        state =
          index <= stageIndex ||
          (isApproved &&
            index <=
              JOURNEY.findIndex((item) => item.id === "decision"))
            ? "completed"
            : "upcoming";
      } else if (index < stageIndex) {
        state = "completed";
      } else if (index === stageIndex) {
        state = "current";
      }

      if (
        date &&
        state === "upcoming" &&
        index <= stageIndex
      ) {
        state = "completed";
      }

      return {
        ...stage,
        index,
        date,
        state,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visaCase,
    sortedEvents,
    stageIndex,
    isRejected,
    isApproved,
    isCompleted,
  ]);

  const completedMilestones = milestones.filter(
    (item) => item.state === "completed"
  ).length;

  const progressPercent = Math.round(
    (completedMilestones / JOURNEY.length) * 100
  );

  const appointmentDays = daysUntil(
    visaCase?.appointment_date ||
      visaCase?.visa_appointment_date
  );

  const nextActionDays = daysUntil(visaCase?.next_action_due);

  const recentEvents = useMemo(() => {
    return [...sortedEvents]
      .reverse()
      .slice(0, compact ? 4 : eventsExpanded ? 12 : 5);
  }, [sortedEvents, compact, eventsExpanded]);

  const refusalReason =
    visaCase?.refusal_reason ||
    visaCase?.rejection_reason ||
    visaCase?.decision_notes ||
    "";

  const reapplyPlanned = isTruthy(visaCase?.reapply_planned);
  const appealPlanned = isTruthy(visaCase?.appeal_planned);

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2 shadow-[0_22px_60px_rgba(18,56,101,0.14)] ${
        compact ? "" : "sm:p-3"
      }`}
    >
      <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
          <div className={`min-w-0 bg-[#123865] text-white ${compact ? "p-4" : "p-5 sm:p-6 lg:p-7"}`}>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Stamp size={12} className="text-orange-200" />
                Visa Journey
              </span>

              <StatusBadge value={visaCase?.visa_status || "not_started"} />
            </div>

            <h3 className={`mt-4 break-words font-black leading-tight tracking-[-0.035em] text-white ${
              compact ? "text-2xl" : "text-3xl sm:text-4xl"
            }`}>
              Visa Status Timeline
            </h3>

            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Event-driven Visa OS history from preparation through decision,
              passport return and completion.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <HeroMetric label="Stage" value={`${Math.min(stageIndex + 1, JOURNEY.length)}/${JOURNEY.length}`} />
              <HeroMetric label="Progress" value={`${progressPercent}%`} />
              <HeroMetric label="Events" value={sortedEvents.length} />
              <HeroMetric label="Status" value={pretty(visaCase?.visa_status || "not_started")} />
            </div>
          </div>

          <div className={`min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] text-white lg:border-l-[3px] lg:border-t-0 ${
            compact ? "p-4" : "p-5 sm:p-6 lg:p-7"
          }`}>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Journey Command Actions
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">
              Refresh the live visa record and event history before reviewing
              milestones, timing pressure or refusal branches.
            </p>

            <div className="mt-4 grid min-w-0 gap-2">
              {lastSyncedAt ? (
                <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-4 text-xs font-black text-white">
                  <CheckCircle2 size={14} />
                  Synced{" "}
                  {lastSyncedAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}

              {resolvedVisaId ? (
                <button
                  type="button"
                  onClick={load}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={loading ? "animate-spin" : ""}
                  />
                  {loading ? "Refreshing..." : "Refresh Journey"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className={`min-w-0 bg-[#FFF8EF] ${compact ? "p-3" : "p-4 sm:p-5"}`}>
        {error ? (
          <div className="mb-4 rounded-[1.35rem] border-[3px] border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
            {error}
          </div>
        ) : null}

        {loading && !visaCase ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-[1.5rem] border-[3px] border-dashed border-[#FF5A0A] bg-white shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
            <div className="text-center">
              <LoaderCircle
                size={28}
                className="mx-auto animate-spin text-orange-500"
              />
              <p className="mt-3 text-sm font-black text-[#10233F]">
                Loading visa journey
              </p>
            </div>
          </div>
        ) : !resolvedVisaId && !visaCase ? (
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-7 text-center shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
            <History size={28} className="mx-auto text-orange-400" />
            <p className="mt-3 text-sm font-black text-[#10233F]">
              No visa case selected
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Open a student visa case to see its live journey and events.
            </p>
          </div>
        ) : (
          <>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={ShieldCheck}
                label="Current Stage"
                value={JOURNEY[stageIndex]?.label || pretty(currentStage)}
                helper={
                  isRejected
                    ? "Decision branch requires review"
                    : "Current operational visa milestone"
                }
                tone={isRejected ? "red" : "orange"}
              />

              <SummaryCard
                icon={BadgeCheck}
                label="Journey Progress"
                value={`${progressPercent}%`}
                helper={`${completedMilestones}/${JOURNEY.length} milestones completed`}
                tone="green"
              />

              <SummaryCard
                icon={CalendarClock}
                label="Appointment"
                value={
                  visaCase?.appointment_date ||
                  visaCase?.visa_appointment_date
                    ? formatDateTime(
                        visaCase?.appointment_date ||
                          visaCase?.visa_appointment_date
                      )
                    : "Not booked"
                }
                helper={datePressureText(
                  appointmentDays,
                  "appointment"
                )}
                tone={
                  appointmentDays !== null &&
                  appointmentDays >= 0 &&
                  appointmentDays <= 14
                    ? "orange"
                    : "slate"
                }
              />

              <SummaryCard
                icon={FileClock}
                label="Next Action"
                value={
                  visaCase?.next_action
                    ? pretty(visaCase.next_action)
                    : "Not defined"
                }
                helper={
                  visaCase?.next_action_due
                    ? `Due ${formatDateTime(visaCase.next_action_due)} · ${datePressureText(
                        nextActionDays,
                        "action"
                      )}`
                    : "No due date recorded"
                }
                tone={
                  nextActionDays !== null && nextActionDays < 0
                    ? "red"
                    : nextActionDays !== null &&
                      nextActionDays <= 7
                    ? "orange"
                    : "slate"
                }
              />
            </div>

            <div className="mt-5 min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
              <div className="flex min-w-0 flex-col gap-2 border-b-[3px] border-[#FF5A0A] bg-[#123865] p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-200">
                    Operational Journey
                  </p>
                  <h4 className="mt-1 text-lg font-black text-white">
                    Visa Milestones
                  </h4>
                </div>

                <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[10px] font-black text-white">
                  Stage {Math.min(stageIndex + 1, JOURNEY.length)} of{" "}
                  {JOURNEY.length}
                </span>
              </div>

              <div className={compact ? "p-3" : "p-4"}>
                <div className="space-y-2">
                  {milestones.map((stage) => (
                    <MilestoneRow
                      key={stage.id}
                      stage={stage}
                      compact={compact}
                    />
                  ))}
                </div>
              </div>
            </div>

            {isRejected ? (
              <div className="mt-4 rounded-[1.5rem] border-[3px] border-red-400 bg-red-50 p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-red-400 bg-white">
                    <AlertTriangle size={18} className="text-red-700" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-700">
                      Decision Exception
                    </p>

                    <h4 className="mt-1 text-base font-black text-red-900">
                      Visa Refusal Branch
                    </h4>

                    <p className="mt-2 text-sm font-semibold leading-6 text-red-800">
                      {refusalReason || "Refusal reason not recorded."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <BranchBadge
                        active={reapplyPlanned}
                        icon={RotateCcw}
                        label={
                          reapplyPlanned
                            ? "Reapply planned"
                            : "Reapply not marked"
                        }
                      />

                      <BranchBadge
                        active={appealPlanned}
                        icon={ShieldCheck}
                        label={
                          appealPlanned
                            ? "Appeal planned"
                            : "Appeal not marked"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
              <button
                type="button"
                onClick={() => setEventsExpanded((value) => !value)}
                className="flex w-full min-w-0 items-center justify-between gap-3 p-4 text-left transition hover:bg-[#FFF4E8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8]">
                    <History size={17} className="text-orange-700" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                      Audit Trail
                    </p>
                    <h4 className="mt-0.5 text-sm font-black text-[#10233F]">
                      Visa Event History
                    </h4>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {sortedEvents.length} recorded event
                      {sortedEvents.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={18}
                  className={`text-[#10233F] transition-transform duration-300 ${
                    eventsExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {eventsExpanded || compact ? (
                <div className="border-t-[3px] border-[#DCE5EE] bg-[#FFF8EF] p-3 sm:p-4">
                  {recentEvents.length ? (
                    <div className="space-y-2">
                      {recentEvents.map((event, index) => (
                        <EventRow
                          key={
                            event.id ||
                            `${event.event_type}-${event.created_at}-${index}`
                          }
                          event={event}
                        />
                      ))}

                      {!compact &&
                      sortedEvents.length > recentEvents.length ? (
                        <button
                          type="button"
                          onClick={() => setEventsExpanded(true)}
                          className="w-full rounded-xl border-2 border-dashed border-[#FF5A0A] bg-[#FFF4E8] px-3 py-2 text-xs font-black text-orange-800"
                        >
                          {sortedEvents.length - recentEvents.length} older
                          event
                          {sortedEvents.length - recentEvents.length === 1
                            ? ""
                            : "s"}{" "}
                          available
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-[1.25rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-5 text-center">
                      <Clock3
                        size={24}
                        className="mx-auto text-slate-400"
                      />
                      <p className="mt-2 text-sm font-black text-[#10233F]">
                        No visa events recorded yet
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Milestone dates above can still come directly from the
                        visa case record.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}


function MilestoneRow({ stage, compact }) {
  const styles = {
    completed: {
      container: "border-emerald-300 bg-emerald-50",
      icon: "border-emerald-600 bg-emerald-600 text-white",
      badge: "border-emerald-300 bg-white text-emerald-800",
      badgeText: "Completed",
    },
    current: {
      container: "border-orange-400 bg-[#FFF4E8]",
      icon: "border-orange-500 bg-[#FFF4E8]0 text-white",
      badge: "border-[#FF5A0A] bg-white text-orange-800",
      badgeText: "Current",
    },
    rejected: {
      container: "border-red-400 bg-red-50",
      icon: "border-red-600 bg-red-600 text-white",
      badge: "border-red-300 bg-white text-red-800",
      badgeText: "Refused",
    },
    upcoming: {
      container: "border-slate-300 bg-white",
      icon: "border-slate-300 bg-slate-50 text-slate-500",
      badge: "border-slate-300 bg-slate-50 text-slate-600",
      badgeText: "Upcoming",
    },
  };

  const style = styles[stage.state] || styles.upcoming;

  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border-[3px] shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${
        compact ? "p-3" : "p-3.5"
      } ${style.container}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${style.icon}`}
        >
          {stage.state === "completed" ? (
            <CheckCircle2 size={17} />
          ) : stage.state === "current" ? (
            <Clock3 size={17} />
          ) : stage.state === "rejected" ? (
            <AlertTriangle size={17} />
          ) : (
            <span className="text-xs font-black">{stage.index + 1}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{stage.label}</p>

            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${style.badge}`}
            >
              {style.badgeText}
            </span>
          </div>

          {!compact ? (
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {stage.helper}
            </p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <CalendarClock size={11} />
              {stage.date
                ? formatDateTime(stage.date)
                : "No milestone timestamp"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-slate-300 bg-white",
    orange: "border-[#FF5A0A] bg-[#FFF4E8]",
    red: "border-red-300 bg-red-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  const iconTones = {
    slate: "border-slate-300 bg-slate-50 text-slate-700",
    orange: "border-[#FF5A0A] bg-white text-orange-700",
    red: "border-red-300 bg-white text-red-700",
    green: "border-emerald-300 bg-white text-emerald-700",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${
        tones[tone] || tones.slate
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${
          iconTones[tone] || iconTones.slate
        }`}
      >
        <Icon size={16} />
      </div>

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-[#10233F]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function EventRow({ event }) {
  const eventType = normalize(event?.event_type);
  const isWarning =
    eventType.includes("reject") ||
    eventType.includes("refus") ||
    eventType.includes("risk");

  return (
    <div
      className={`min-w-0 rounded-[1.15rem] border-[3px] px-3 py-3 shadow-[0_5px_14px_rgba(18,56,101,0.04)] ${
        isWarning
          ? "border-red-200 bg-red-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p
            className={`text-xs font-black ${
              isWarning ? "text-red-900" : "text-[#10233F]"
            }`}
          >
            {event.event_label ||
              event.title ||
              pretty(event.event_type || "Visa event")}
          </p>

          {event.description ? (
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {event.description}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 text-[10px] font-semibold text-slate-500">
          {formatDateTime(event.created_at)}
        </span>
      </div>

      {event.old_value || event.new_value ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black">
          <span className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-slate-600">
            {pretty(event.old_value || "—")}
          </span>

          <span className="text-orange-600">→</span>

          <span className="rounded-lg border border-[#FF5A0A] bg-[#FFF4E8] px-2 py-1 text-orange-800">
            {pretty(event.new_value || "—")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function BranchBadge({ active, icon: Icon, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[10px] font-black ${
        active
          ? "border-red-400 bg-white text-red-800"
          : "border-slate-300 bg-white/70 text-slate-500"
      }`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function StatusBadge({ value }) {
  const normalized = normalizeStatus(value);

  const rejected = [
    "rejected",
    "refused",
    "visa rejected",
    "visa refused",
  ].includes(normalized);

  const approved = [
    "visa approved",
    "approved",
    "granted",
  ].includes(normalized);

  const completed = ["completed", "complete", "closed"].includes(normalized);

  return (
    <span
      className={`rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase ${
        rejected
          ? "border-red-300 bg-red-50 text-red-800"
          : approved || completed
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
      }`}
    >
      {pretty(value)}
    </span>
  );
}

function datePressureText(days, subject) {
  if (days === null) {
    return `No ${subject} deadline`;
  }

  if (days < 0) {
    return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  return `${days} days remaining`;
}

export default VisaStatusTimeline;
