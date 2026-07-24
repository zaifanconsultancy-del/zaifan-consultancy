// ExecutiveAlertsPanel V3 COMMAND MAXIMUM — Syntax-Fixed Full Replacement
// src/components/admin/ExecutiveAlertsPanel.jsx
//
// Preserves:
// - external scores support
// - fetchExecutiveRiskScores() fallback
// - Executive AI categories / risk / opportunity scoring
// - journey stage normalization
// - critical / attention / conversion / visa / verified-outcome queues
//
// Upgrades:
// - command-pressure summary
// - stronger loading / refresh / error states
// - reduced-motion support
// - Lucide icons instead of emoji-heavy UI
// - stronger Admin OS orange/navy hierarchy
// - white text only on navy surfaces
// - safer date handling
// - verified outcomes wording instead of fake success-story language

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Crown,
  FileWarning,
  Flame,
  GraduationCap,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  UserRoundCheck,
  Workflow,
} from "lucide-react";
import { fetchExecutiveRiskScores } from "../../lib/executiveAI";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeDateLabel(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getJourneyStage(item = {}) {
  const direct = normalize(
    item.journey_stage ||
      item?.diagnostics?.journey_stage
  );

  if (direct) return direct;

  const app = normalize(
    item.application_status
  );

  const visa = normalize(
    item.visa_status
  );

  const offer = normalize(
    item.offer_status
  );

  if (app === "enrolled") {
    return "enrolled";
  }

  if (
    [
      "visa_approved",
      "approved",
    ].includes(visa)
  ) {
    return "visa_approved";
  }

  if (
    [
      "visa_rejected",
      "rejected",
      "refused",
      "visa_refused",
    ].includes(visa)
  ) {
    return "visa_rejected";
  }

  if (
    [
      "visa_pending",
      "pending",
      "submitted",
      "under_review",
      "review",
    ].includes(visa)
  ) {
    return "visa_pending";
  }

  if (app === "cas_issued") {
    return "cas_issued";
  }

  if (app === "cas_pending") {
    return "cas_pending";
  }

  if (
    [
      "offer_accepted",
      "accepted",
    ].includes(offer) ||
    [
      "offer_accepted",
      "accepted",
    ].includes(app)
  ) {
    return "offer_accepted";
  }

  if (
    [
      "offer_received",
      "received",
      "offer",
    ].includes(offer) ||
    [
      "offer_received",
      "offer",
    ].includes(app)
  ) {
    return "offer_received";
  }

  if (
    [
      "under_review",
      "review",
    ].includes(app)
  ) {
    return "application_under_review";
  }

  if (
    [
      "applied",
      "submitted",
    ].includes(app)
  ) {
    return "application_submitted";
  }

  return "not_started";
}

function buildAlertCommandHealth(
  scores = [],
  groups = {},
  insights = {}
) {
  const total = scores.length;

  const critical =
    groups.criticalRisks?.length ||
    0;

  const attention =
    groups.needsAttention?.length ||
    0;

  const visaWatch =
    groups.visaWatch?.length ||
    0;

  const stale =
    insights.stale?.length ||
    0;

  const pressure = Math.min(
    100,
    critical * 14 +
      attention * 7 +
      visaWatch * 6 +
      stale * 5 +
      number(insights.docsWeak) * 3 +
      number(insights.taskOverload) * 4
  );

  const opportunity = total
    ? Math.round(
        scores.reduce(
          (sum, item) =>
            sum +
            number(
              item.opportunity_score
            ),
          0
        ) / total
      )
    : 0;

  const averageRisk = total
    ? Math.round(
        scores.reduce(
          (sum, item) =>
            sum +
            number(item.risk_score),
          0
        ) / total
      )
    : 0;

  return {
    total,
    pressure,
    opportunity,
    averageRisk,
    status:
      critical > 0 ||
      pressure >= 75
        ? "Escalate"
        : pressure >= 45
        ? "Attention"
        : pressure >= 20
        ? "Watch"
        : "Stable",
  };
}

function ExecutiveAlertsPanel({
  scores: externalScores = null,
}) {
  const [
    localScores,
    setLocalScores,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    showDetailedQueues,
    setShowDetailedQueues,
  ] = useState(true);

  const reduceMotion =
    useReducedMotion();

  const usingExternalScores =
    Array.isArray(
      externalScores
    );

  const scores =
    usingExternalScores
      ? externalScores
      : localScores;

  const loadScores = async () => {
    if (usingExternalScores) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: fetchError,
      } =
        await fetchExecutiveRiskScores();

      if (fetchError) {
        throw fetchError;
      }

      setLocalScores(
        safeArray(data)
      );
    } catch (err) {
      console.error(
        "Executive alerts failed:",
        err
      );

      setError(
        err?.message ||
          "Executive alerts failed to load."
      );

      setLocalScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadScores();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingExternalScores]);

  const alertGroups =
    useMemo(() => {
      const criticalRisks =
        scores
          .filter((item) => {
            const category =
              normalize(
                item.executive_category
              );

            const riskLevel =
              normalize(
                item.risk_level
              );

            const journeyStage =
              getJourneyStage(
                item
              );

            return (
              category ===
                "critical_risk" ||
              riskLevel ===
                "critical" ||
              journeyStage ===
                "visa_rejected" ||
              number(
                item.risk_score
              ) >= 85
            );
          })
          .sort(
            (a, b) =>
              number(
                b.risk_score
              ) -
              number(
                a.risk_score
              )
          )
          .slice(0, 6);

      const needsAttention =
        scores
          .filter((item) => {
            const category =
              normalize(
                item.executive_category
              );

            const riskLevel =
              normalize(
                item.risk_level
              );

            const riskScore =
              number(
                item.risk_score
              );

            const journeyStage =
              getJourneyStage(
                item
              );

            return (
              category ===
                "needs_attention" ||
              category ===
                "high_risk" ||
              riskLevel ===
                "high" ||
              journeyStage ===
                "cas_pending" ||
              (riskScore >= 60 &&
                riskScore < 85)
            );
          })
          .sort(
            (a, b) =>
              number(
                b.risk_score
              ) -
              number(
                a.risk_score
              )
          )
          .slice(0, 6);

      const conversionReady =
        scores
          .filter((item) => {
            const category =
              normalize(
                item.executive_category
              );

            const journeyStage =
              getJourneyStage(
                item
              );

            return (
              category ===
                "conversion_ready" ||
              category ===
                "high_opportunity" ||
              [
                "offer_accepted",
                "cas_issued",
                "visa_pending",
              ].includes(
                journeyStage
              ) ||
              number(
                item.opportunity_score
              ) >= 80
            );
          })
          .sort(
            (a, b) =>
              number(
                b.opportunity_score
              ) -
              number(
                a.opportunity_score
              )
          )
          .slice(0, 6);

      const visaWatch =
        scores
          .filter((item) =>
            [
              "cas_pending",
              "cas_issued",
              "visa_pending",
              "visa_rejected",
            ].includes(
              getJourneyStage(
                item
              )
            )
          )
          .sort((a, b) => {
            const order = {
              visa_rejected: 4,
              visa_pending: 3,
              cas_issued: 2,
              cas_pending: 1,
            };

            const stageB =
              getJourneyStage(
                b
              );

            const stageA =
              getJourneyStage(
                a
              );

            return (
              (order[stageB] ||
                0) -
                (order[stageA] ||
                  0) ||
              number(
                b.risk_score
              ) -
                number(
                  a.risk_score
                )
            );
          })
          .slice(0, 6);

      const verifiedOutcomes =
        scores
          .filter((item) => {
            const category =
              normalize(
                item.executive_category
              );

            const journeyStage =
              getJourneyStage(
                item
              );

            return (
              category ===
                "success_story" ||
              journeyStage ===
                "visa_approved"
            );
          })
          .sort(
            (a, b) =>
              number(
                b.opportunity_score
              ) -
              number(
                a.opportunity_score
              )
          )
          .slice(0, 6);

      return {
        criticalRisks,
        needsAttention,
        conversionReady,
        visaWatch,
        verifiedOutcomes,
      };
    }, [scores]);

  const totalAlerts =
    alertGroups
      .criticalRisks.length +
    alertGroups
      .needsAttention.length +
    alertGroups
      .conversionReady.length +
    alertGroups.visaWatch
      .length +
    alertGroups
      .verifiedOutcomes.length;

  const commandInsights =
    useMemo(() => {
      const sortedByRisk = [
        ...scores,
      ]
        .sort(
          (a, b) =>
            number(
              b.risk_score
            ) -
            number(
              a.risk_score
            )
        )
        .slice(0, 5);

      const offerAndVisaPressure =
        scores.filter((item) =>
          [
            "offer_accepted",
            "cas_pending",
            "cas_issued",
            "visa_pending",
            "visa_rejected",
          ].includes(
            getJourneyStage(
              item
            )
          )
        );

      const stale = scores
        .filter(
          (item) =>
            number(
              item.days_since_updated,
              -1
            ) >= 10
        )
        .sort(
          (a, b) =>
            number(
              b.days_since_updated
            ) -
            number(
              a.days_since_updated
            )
        )
        .slice(0, 5);

      const docsWeak =
        scores.filter(
          (item) =>
            number(
              item.document_readiness_percent
            ) < 60
        ).length;

      const taskOverload =
        scores.filter(
          (item) =>
            number(
              item.overdue_tasks_count
            ) > 0 ||
            number(
              item.pending_tasks_count
            ) > 5
        ).length;

      return {
        sortedByRisk,
        offerAndVisaPressure,
        stale,
        docsWeak,
        taskOverload,
      };
    }, [scores]);

  const commandHealth =
    useMemo(
      () =>
        buildAlertCommandHealth(
          scores,
          alertGroups,
          commandInsights
        ),
      [
        scores,
        alertGroups,
        commandInsights,
      ]
    );

  return (
    <motion.section
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
            : 0.25,
      }}
      className="space-y-5"
    >
      <div className="rounded-[2rem] border-[3px] border-orange-400 bg-[#fff8ee] p-3 shadow-[0_18px_55px_rgba(23,36,61,0.08)] sm:p-4">
        <div className="grid overflow-hidden rounded-[1.65rem] border-2 border-[#234e78] xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip
                icon={BellRing}
                label="Executive Alerts"
              />

              <HeaderChip
                icon={Workflow}
                label="Student OS Queue"
              />

              <HeaderChip
                icon={ShieldAlert}
                label={`${alertGroups.criticalRisks.length} Critical`}
              />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Decision & Escalation Center
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              A concentrated operating queue for critical risk, counselor intervention,
              conversion windows, CAS/visa pressure, stale students, documents, and tasks.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NavyAlertMetric
                label="Tracked"
                value={
                  scores.length
                }
              />

              <NavyAlertMetric
                label="Alerts"
                value={
                  totalAlerts
                }
              />

              <NavyAlertMetric
                label="Critical"
                value={
                  alertGroups
                    .criticalRisks
                    .length
                }
              />

              <NavyAlertMetric
                label="Visa / CAS"
                value={
                  alertGroups
                    .visaWatch
                    .length
                }
              />
            </div>
          </div>

          <div className="border-t-2 border-orange-300 bg-orange-500 p-5 text-white xl:border-l-2 xl:border-t-0 sm:p-7">
            <div className="flex items-center gap-2">
              <Flame size={18} />

              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white">
                Command Pressure
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {
                commandHealth.pressure
              }
            </p>

            <p className="mt-1 text-sm font-black uppercase text-white">
              {
                commandHealth.status
              }
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeAlertMetric
                label="Avg Risk"
                value={`${commandHealth.averageRisk}/100`}
              />

              <OrangeAlertMetric
                label="Opportunity"
                value={`${commandHealth.opportunity}/100`}
              />

              <OrangeAlertMetric
                label="Conversion"
                value={
                  alertGroups
                    .conversionReady
                    .length
                }
              />

              <OrangeAlertMetric
                label="Stale Watch"
                value={
                  commandInsights
                    .stale.length
                }
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-[1.3rem] border-2 border-orange-200 bg-[#fffdf8] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge
              label={`${totalAlerts} Alerts`}
              danger
            />

            <Badge
              label={`${alertGroups.criticalRisks.length} Critical`}
              danger
            />

            <Badge
              label={`${alertGroups.visaWatch.length} Visa/CAS`}
              blue
            />

            <Badge
              label={`${alertGroups.conversionReady.length} Conversion`}
              success
            />
          </div>

          {!usingExternalScores ? (
            <button
              type="button"
              onClick={
                loadScores
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              {loading
                ? "Refreshing..."
                : "Refresh Alerts"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700">
              <CheckCircle2
                size={15}
              />
              Live Command Scores
            </span>
          )}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[1.25rem] border-[3px] border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-700"
        >
          <AlertTriangle
            className="mt-0.5 shrink-0"
            size={18}
          />

          <div>
            <p className="font-black">
              Executive alerts could not load
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <CommandAlertCard
          icon={ShieldAlert}
          label="Immediate Escalations"
          value={
            alertGroups
              .criticalRisks
              .length
          }
          detail="Critical, visa rejected, or highest-risk cases."
          tone="red"
        />

        <CommandAlertCard
          icon={UserRoundCheck}
          label="Counselor Workload"
          value={
            alertGroups
              .needsAttention
              .length
          }
          detail="Cases requiring active staff review."
          tone="orange"
        />

        <CommandAlertCard
          icon={Rocket}
          label="Conversion Window"
          value={
            alertGroups
              .conversionReady
              .length
          }
          detail="Students close to a strong next-stage win."
          tone="green"
        />

        <CommandAlertCard
          icon={FileWarning}
          label="Weak Documents"
          value={
            commandInsights.docsWeak
          }
          detail="Readiness below the operating standard."
          tone="blue"
        />

        <CommandAlertCard
          icon={Clock3}
          label="Task Pressure"
          value={
            commandInsights.taskOverload
          }
          detail="Overdue or overloaded task queues."
          tone="red"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ExecutiveMiniQueue
          title="Top Escalation Queue"
          subtitle="Highest risk first"
          items={
            commandInsights.sortedByRisk
          }
          scoreKey="risk_score"
          tone="red"
          icon={Flame}
        />

        <ExecutiveMiniQueue
          title="Offer / CAS / Visa Pressure"
          subtitle="Late-stage operating pressure"
          items={commandInsights.offerAndVisaPressure.slice(
            0,
            5
          )}
          scoreKey="risk_score"
          tone="blue"
          icon={GraduationCap}
        />

        <ExecutiveMiniQueue
          title="Stale Student Watch"
          subtitle="Low movement / delayed cases"
          items={
            commandInsights.stale
          }
          scoreKey="days_since_updated"
          tone="orange"
          icon={Clock3}
        />
      </div>

      <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#234e78] bg-[#fff8ee] shadow-[0_10px_28px_rgba(23,36,61,0.06)]">
        <button
          type="button"
          onClick={() =>
            setShowDetailedQueues(
              (current) =>
                !current
            )
          }
          aria-expanded={
            showDetailedQueues
          }
          className="flex w-full items-center justify-between gap-4 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-left text-white transition hover:bg-[#0f3158]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300/60 bg-white/10 text-white">
              <Target size={18} />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                Detailed Decision Queues
              </p>

              <h3 className="mt-0.5 text-xl font-black text-white">
                Student-level alert intelligence
              </h3>

              <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
                Read-only explanation of why students are surfaced. Open the student record for operational changes.
              </p>
            </div>
          </div>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
            {showDetailedQueues ? (
              <ChevronUp
                size={18}
              />
            ) : (
              <ChevronDown
                size={18}
              />
            )}
          </span>
        </button>

        {showDetailedQueues ? (
          <div className="grid gap-4 p-4 xl:grid-cols-2 sm:p-5">
            <AlertList
              title="Critical Risks"
              eyebrow="Immediate Action"
              icon={ShieldAlert}
              items={
                alertGroups
                  .criticalRisks
              }
              emptyText="No critical risks detected."
              scoreKey="risk_score"
              tone="red"
            />

            <AlertList
              title="Needs Attention"
              eyebrow="Counselor Priority"
              icon={AlertTriangle}
              items={
                alertGroups
                  .needsAttention
              }
              emptyText="No students currently need attention."
              scoreKey="risk_score"
              tone="orange"
            />

            <AlertList
              title="Conversion Ready"
              eyebrow="Executive Opportunity"
              icon={Trophy}
              items={
                alertGroups
                  .conversionReady
              }
              emptyText="No conversion-ready students detected."
              scoreKey="opportunity_score"
              tone="green"
            />

            <AlertList
              title="CAS / Visa Watch"
              eyebrow="Visa Operations"
              icon={GraduationCap}
              items={
                alertGroups.visaWatch
              }
              emptyText="No CAS or visa watch items."
              scoreKey="risk_score"
              tone="blue"
            />

            <AlertList
              title="Verified Outcomes"
              eyebrow="Wins / Outcomes"
              icon={Crown}
              items={
                alertGroups
                  .verifiedOutcomes
              }
              emptyText="No verified successful outcomes detected yet."
              scoreKey="opportunity_score"
              tone="green"
            />
          </div>
        ) : null}
      </section>
    </motion.section>
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

function NavyAlertMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeAlertMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function AlertList({
  title,
  eyebrow,
  icon: Icon = Sparkles,
  items = [],
  emptyText,
  scoreKey,
  tone = "orange",
}) {
  const toneClass =
    getToneClass(tone);

  return (
    <div
      className={`overflow-hidden rounded-[1.6rem] border-[3px] bg-white shadow-[0_10px_26px_rgba(23,36,61,0.05)] ${getOuterBorder(
        tone
      )}`}
    >
      <div
        className={`flex items-center justify-between gap-3 border-b-2 px-4 py-4 ${getListHeader(
          tone
        )}`}
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>

          <h3 className="mt-1 text-lg font-black text-[#17243D]">
            {title}
          </h3>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 ${toneClass}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="p-4">
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <AlertCard
              key={`${item.student_id}-${item.student_type}-${item.generated_at}-${item.executive_category}`}
              item={item}
              scoreKey={scoreKey}
              tone={
                tone
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
          {emptyText}
        </div>
      )}
      </div>
    </div>
  );
}

function AlertCard({
  item,
  scoreKey,
  tone,
}) {
  const journeyStage =
    getJourneyStage(item);

  const generatedLabel =
    safeDateLabel(
      item.generated_at
    );

  const toneClass =
    getToneClass(tone);

  return (
    <div
      className={`rounded-[1.25rem] border-[3px] bg-[#fffdf8] p-4 ${getOuterBorder(
        tone
      )}`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_110px]">
        <div className="min-w-0">
          <p className="break-words text-base font-black leading-5 text-[#17243D]">
            {item.student_name ||
              item.full_name ||
              item.name ||
              "Unknown Student"}
          </p>

          <p className="mt-1 text-xs font-semibold capitalize leading-5 text-slate-500">
            {item.student_type ||
              "student"}{" "}
            •{" "}
            {formatLabel(
              item.executive_category ||
                item.priority_level ||
                "Standard"
            )}{" "}
            •{" "}
            {formatLabel(
              journeyStage
            )}
          </p>

          <p className="mt-3 line-clamp-4 text-sm font-medium leading-6 text-slate-600">
            {item.summary ||
              "No executive summary available."}
          </p>
        </div>

        <div
          className={`rounded-xl border-2 p-3 text-center ${toneClass}`}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.1em]">
            Score
          </p>

          <p className="mt-1 text-2xl font-black">
            {number(
              item[scoreKey]
            )}
          </p>

          <p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] opacity-70">
            {scoreKey ===
            "opportunity_score"
              ? "Opportunity"
              : "Risk"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <InfoBadge
          label="Risk"
          value={`${formatLabel(
            item.risk_level ||
              "Low"
          )} Risk`}
        />

        <InfoBadge
          label="Opportunity"
          value={
            item.opportunity_score ||
            0
          }
        />

        <InfoBadge
          label="Priority"
          value={formatLabel(
            item.priority_level ||
              "Standard"
          )}
        />

        <InfoBadge
          label="Stage"
          value={formatLabel(
            journeyStage
          )}
        />

        {item.document_readiness_percent !==
        undefined ? (
          <InfoBadge
            label="Documents"
            value={`${item.document_readiness_percent || 0}%`}
          />
        ) : null}

        {item.task_completion_percent !==
        undefined ? (
          <InfoBadge
            label="Tasks"
            value={`${item.task_completion_percent || 0}%`}
          />
        ) : null}

        {generatedLabel ? (
          <InfoBadge
            label="Scored"
            value={
              generatedLabel
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function InfoBadge({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.09em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-xs font-black text-[#243A60]">
        {value}
      </p>
    </div>
  );
}

function Badge({
  label,
  danger = false,
  blue = false,
  success = false,
}) {
  const style = danger
    ? "border-red-400 bg-red-50 text-red-800"
    : blue
    ? "border-blue-400 bg-blue-50 text-blue-800"
    : success
    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
    : "border-orange-400 bg-orange-50 text-orange-800";

  return (
    <span
      className={`rounded-full border-2 px-4 py-2 text-xs font-black ${style}`}
    >
      {label}
    </span>
  );
}

function CommandAlertCard({
  label,
  value,
  detail,
  tone = "orange",
  icon: Icon = Sparkles,
}) {
  const style =
    getToneClass(tone);

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.45rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(23,36,61,0.055)] ${style}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-current opacity-70" />

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 break-words text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-[#17243D]">
          {label}
        </p>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-3 text-3xl font-black leading-none tracking-[-0.025em] text-[#17243D]">
        {value || 0}
      </p>

      <p className="mt-2 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
        Read-only command signal
      </p>
    </div>
  );
}

function ExecutiveMiniQueue({
  title,
  subtitle,
  items = [],
  scoreKey,
  tone = "orange",
  icon: Icon = Sparkles,
}) {
  const toneClass =
    getToneClass(tone);

  return (
    <div className="overflow-hidden rounded-[1.55rem] border-[3px] border-[#234e78] bg-[#fffdf8] shadow-[0_10px_26px_rgba(23,36,61,0.055)]">
      <div className="flex items-start justify-between gap-3 border-b-2 border-orange-300 bg-[#123865] px-4 py-4 text-white">
        <div>
          <h3 className="font-black text-white">
            {title}
          </h3>

          <p className="mt-1 text-xs font-semibold text-white/75">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${toneClass}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <div className="space-y-2.5 p-4">
        {items.length ? (
          items.map(
            (
              item,
              index
            ) => (
              <div
                key={`${title}-${item.student_id || item.id || index}`}
                className={`rounded-xl border-2 bg-white p-3.5 ${getOuterBorder(tone)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-black leading-5 text-[#17243D]">
                      {item.student_name ||
                        item.full_name ||
                        item.name ||
                        "Unknown Student"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatLabel(
                        getJourneyStage(
                          item
                        )
                      )}{" "}
                      •{" "}
                      {item.executive_category ||
                        "Standard"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-xs font-black ${toneClass}`}
                  >
                    {number(
                      item[
                        scoreKey
                      ]
                    )}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-slate-600">
                  {item.summary ||
                    "No alert summary available."}
                </p>
              </div>
            )
          )
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No records.
          </p>
        )}
      </div>
    </div>
  );
}

function getToneClass(
  tone = ""
) {
  if (tone === "red") {
    return "border-red-400 bg-red-50 text-red-800";
  }

  if (
    tone === "orange"
  ) {
    return "border-orange-400 bg-orange-50 text-orange-800";
  }

  if (tone === "green") {
    return "border-emerald-400 bg-emerald-50 text-emerald-800";
  }

  if (tone === "blue") {
    return "border-blue-400 bg-blue-50 text-blue-800";
  }

  return "border-[#234e78] bg-[#edf4fb] text-[#123865]";
}

function getOuterBorder(
  tone = ""
) {
  if (tone === "red") {
    return "border-red-400";
  }

  if (
    tone === "orange"
  ) {
    return "border-orange-400";
  }

  if (tone === "green") {
    return "border-emerald-400";
  }

  if (tone === "blue") {
    return "border-blue-400";
  }

  return "border-[#234e78]";
}

function getListHeader(
  tone = ""
) {
  if (tone === "red") {
    return "border-red-300 bg-red-50 text-red-900";
  }

  if (
    tone === "orange"
  ) {
    return "border-orange-300 bg-orange-50 text-orange-900";
  }

  if (tone === "green") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }

  if (tone === "blue") {
    return "border-blue-300 bg-blue-50 text-blue-900";
  }

  return "border-slate-300 bg-[#edf4fb] text-[#123865]";
}


function formatLabel(
  value = ""
) {
  const clean =
    normalize(value);

  if (!clean) {
    return "Unknown";
  }

  return clean
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export default ExecutiveAlertsPanel;
