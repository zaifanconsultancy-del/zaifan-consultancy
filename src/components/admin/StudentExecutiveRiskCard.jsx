// StudentExecutiveRiskCard V3 MAXIMUM — Executive Student Intelligence
// src/components/admin/StudentExecutiveRiskCard.jsx
//
// Maximum pass:
// - preserves calculateExecutiveRisk + saveExecutiveRiskScore integration
// - preserves Supabase timeline alerts + parent Student OS refresh
// - preserves ExecutiveRecommendationPanel integration
// - distinguishes local rules-based executive scoring from GPT output
// - timeout cleanup is safe
// - student identity is normalized with student_type
// - validates student ID before persistence
// - saves core risk score first, then reports timeline/refresh sync separately
// - avoids silent audit failure
// - prevents duplicate save clicks
// - adds score bands, portfolio interpretation and score transparency
// - adds last-save status and save-state feedback
// - stronger Admin OS cream/orange/navy contrast
// - navy surfaces always use white text
// - no fake AI claims, no invented outcomes

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  calculateExecutiveRisk,
  saveExecutiveRiskScore,
} from "../../lib/executiveAI";
import { supabase } from "../../lib/supabaseClient";
import ExecutiveRecommendationPanel from "./ExecutiveRecommendationPanel";

const REQUEST_TIMEOUT_MS = 12000;

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, safeNumber(value)));
}

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

function getStudentType(student = {}) {
  return normalize(
    student?.student_type ||
      student?.__leadType ||
      student?.type ||
      "inquiry"
  );
}

function getStudentName(student = {}) {
  return (
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    "Student"
  );
}

function getRiskBand(score) {
  const value = clamp(score);

  if (value >= 80) {
    return {
      label: "Critical",
      tone: "danger",
      interpretation:
        "Immediate senior counselor review is justified by the current scoring rules.",
    };
  }

  if (value >= 60) {
    return {
      label: "High",
      tone: "warning",
      interpretation:
        "Meaningful risk exists and should be reviewed before the case progresses further.",
    };
  }

  if (value >= 30) {
    return {
      label: "Moderate",
      tone: "navy",
      interpretation:
        "Some risk is present, but the case is not currently in the highest-risk range.",
    };
  }

  return {
    label: "Low",
    tone: "good",
    interpretation:
      "No major executive-risk pressure is currently detected by the local scoring rules.",
  };
}

function getOpportunityBand(score) {
  const value = clamp(score);

  if (value >= 80) return "Very Strong";
  if (value >= 60) return "Strong";
  if (value >= 40) return "Developing";
  if (value > 0) return "Limited";
  return "Not Established";
}

function StudentExecutiveRiskCard({
  student = {},
  onSharedDataChange = null,
}) {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });
  const [lastSavedAt, setLastSavedAt] = useState("");

  const studentType = getStudentType(student);
  const studentName = getStudentName(student);

  const numericStudentId = Number(student?.id);
  const hasValidStudentId =
    Number.isFinite(numericStudentId) && numericStudentId > 0;

  const executiveScore = useMemo(() => {
    const raw = calculateExecutiveRisk(student) || {};

    return {
      ...raw,
      risk_score: clamp(raw.risk_score),
      opportunity_score: clamp(raw.opportunity_score),
      risk_level:
        raw.risk_level ||
        getRiskBand(raw.risk_score).label,
      priority_level:
        raw.priority_level ||
        student?.priority ||
        "Not Set",
      summary:
        raw.summary ||
        "No executive summary is available yet.",
      risk_reasons: Array.isArray(raw.risk_reasons)
        ? raw.risk_reasons.filter(Boolean)
        : [],
      opportunity_reasons: Array.isArray(raw.opportunity_reasons)
        ? raw.opportunity_reasons.filter(Boolean)
        : [],
    };
  }, [student]);

  const riskBand = useMemo(
    () => getRiskBand(executiveScore.risk_score),
    [executiveScore.risk_score]
  );

  const opportunityBand = useMemo(
    () => getOpportunityBand(executiveScore.opportunity_score),
    [executiveScore.opportunity_score]
  );

  const createTimelineEvent = async ({
    eventType,
    title,
    description,
    newValue = "",
  }) => {
    if (!hasValidStudentId) {
      return {
        ok: false,
        skipped: true,
        message: "Invalid Student OS ID.",
      };
    }

    try {
      const { error } = await withTimeout(
        supabase.from("student_application_timeline").insert({
          student_id: numericStudentId,
          student_type: studentType,
          event_type: eventType,
          title,
          description,
          new_value:
            newValue !== ""
              ? String(newValue)
              : null,
        }),
        "Executive timeline event timed out."
      );

      if (error) throw error;

      return { ok: true };
    } catch (error) {
      console.warn(
        "Executive timeline event failed:",
        error
      );

      return {
        ok: false,
        message:
          error?.message ||
          "Timeline event failed.",
      };
    }
  };

  const notifyParent = async () => {
    if (
      typeof onSharedDataChange !== "function"
    ) {
      return {
        ok: true,
        skipped: true,
      };
    }

    try {
      await withTimeout(
        Promise.resolve(
          onSharedDataChange({
            studentId: numericStudentId,
            studentType,
            executiveScore,
          })
        ),
        "Student OS refresh after executive score save timed out."
      );

      return { ok: true };
    } catch (error) {
      console.warn(
        "Executive score saved, but parent refresh failed:",
        error
      );

      return {
        ok: false,
        message:
          error?.message ||
          "Parent Student OS refresh failed.",
      };
    }
  };

  const saveScore = async () => {
    if (saving) return;

    if (!hasValidStudentId) {
      setFeedback({
        type: "warning",
        message:
          "This student does not have a valid numeric Student OS ID, so the executive score cannot be persisted yet.",
      });
      return;
    }

    setSaving(true);
    setFeedback({
      type: "",
      message: "",
    });

    try {
      const saveResult = await withTimeout(
        saveExecutiveRiskScore({
          ...student,
          id: numericStudentId,
          student_type: studentType,
        }),
        "Executive score save timed out."
      );

      if (saveResult?.error) {
        throw saveResult.error;
      }

      const timelineJobs = [
        createTimelineEvent({
          eventType: "executive_score_saved",
          title: "Executive Score Saved",
          description: executiveScore.summary,
          newValue:
            executiveScore.risk_score,
        }),
      ];

      if (executiveScore.risk_score >= 80) {
        timelineJobs.push(
          createTimelineEvent({
            eventType: "executive_alert",
            title: "Critical Risk Alert",
            description:
              "Student entered the critical-risk range and requires immediate counselor review.",
            newValue:
              executiveScore.risk_score,
          })
        );
      } else if (
        executiveScore.risk_score >= 60
      ) {
        timelineJobs.push(
          createTimelineEvent({
            eventType: "executive_alert",
            title: "High Risk Alert",
            description:
              "Student entered the high-risk range and should be reviewed soon.",
            newValue:
              executiveScore.risk_score,
          })
        );
      }

      const [timelineResults, refreshResult] =
        await Promise.all([
          Promise.all(timelineJobs),
          notifyParent(),
        ]);

      const failedTimelineWrites =
        timelineResults.filter(
          (result) => !result?.ok
        ).length;

      const refreshFailed =
        refreshResult &&
        refreshResult.ok === false;

      const now =
        new Date().toLocaleString();

      setLastSavedAt(now);

      if (
        failedTimelineWrites ||
        refreshFailed
      ) {
        const warnings = [];

        if (failedTimelineWrites) {
          warnings.push(
            `${failedTimelineWrites} timeline write${
              failedTimelineWrites === 1
                ? ""
                : "s"
            } did not confirm`
          );
        }

        if (refreshFailed) {
          warnings.push(
            "parent Student OS refresh did not confirm"
          );
        }

        setFeedback({
          type: "warning",
          message: `Executive score saved, but ${warnings.join(
            " and "
          )}. Core score persistence succeeded.`,
        });
      } else {
        setFeedback({
          type: "success",
          message:
            "Executive score saved and Student OS synchronization completed.",
        });
      }
    } catch (error) {
      console.error(
        "Executive score save failed:",
        error
      );

      setFeedback({
        type: "error",
        message:
          error?.message ||
          "Executive score save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5 text-[#10233f]">
      <div className="overflow-hidden rounded-[1.9rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
        <div className="grid xl:grid-cols-[1.25fr_0.75fr]">
          <div
            className="bg-[#123865] p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Brain
                size={13}
                style={{ color: "#FDBA74" }}
              />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Executive Student Intelligence
              </p>
            </div>

            <h3
              className="mt-3 text-2xl font-black"
              style={{ color: "#FFFFFF" }}
            >
              Student Risk & Opportunity Score
            </h3>

            <p
              className="mt-2 max-w-3xl text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Local executive scoring based on CRM fields, application
              movement, visa status, priority, and available risk/opportunity
              signals. GPT-derived fields can contribute only when they already
              exist on the student record.
            </p>
          </div>

          <div
            className="bg-orange-500 p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Current Risk
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {executiveScore.risk_score}
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
              {riskBand.label} Risk
            </p>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              Opportunity {executiveScore.opportunity_score}/100 ·{" "}
              {opportunityBand}
            </p>
          </div>
        </div>

        <div className="space-y-5 bg-[#fff8ee] p-5 sm:p-6">
          {!hasValidStudentId ? (
            <Feedback tone="warning">
              This record has no valid numeric Student OS ID. Live scoring is
              still visible, but persistence is disabled.
            </Feedback>
          ) : null}

          {feedback.message ? (
            <Feedback
              tone={feedback.type}
              onClose={() =>
                setFeedback({
                  type: "",
                  message: "",
                })
              }
            >
              {feedback.message}
            </Feedback>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ScoreCard
              label="Risk Score"
              value={executiveScore.risk_score}
              badge={riskBand.label}
              tone={riskBand.tone}
              icon={ShieldAlert}
            />

            <ScoreCard
              label="Opportunity"
              value={executiveScore.opportunity_score}
              badge={opportunityBand}
              tone="orange"
              icon={TrendingUp}
            />

            <ScoreCard
              label="Priority"
              value={executiveScore.priority_level}
              badge="Current CRM Priority"
              tone="navy"
              icon={Target}
            />

            <ScoreCard
              label="Student Type"
              value={studentType}
              badge="Persistence Scope"
              tone="blue"
              icon={Database}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.45rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
                  <Sparkles size={18} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                    Executive Summary
                  </p>

                  <h4 className="mt-1 text-lg font-black text-[#10233f]">
                    {studentName}
                  </h4>
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
                {executiveScore.summary}
              </p>
            </div>

            <div
              className={`rounded-[1.45rem] border-[3px] p-5 ${getBandStyle(
                riskBand.tone
              )}`}
            >
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] opacity-80">
                    Risk Interpretation
                  </p>

                  <h4 className="mt-1 text-lg font-black text-[#10233f]">
                    {riskBand.label} risk range
                  </h4>
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                {riskBand.interpretation}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReasonList
              title="Risk Reasons"
              items={
                executiveScore.risk_reasons
              }
              emptyText="No major risk signals detected."
              tone="red"
              icon={AlertTriangle}
            />

            <ReasonList
              title="Opportunity Reasons"
              items={
                executiveScore.opportunity_reasons
              }
              emptyText="No major opportunity signals detected."
              tone="orange"
              icon={Zap}
            />
          </div>

          <div className="rounded-[1.45rem] border-[3px] border-slate-300 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                  Persistence
                </p>

                <h4 className="mt-1 text-lg font-black text-[#10233f]">
                  Save Current Executive Snapshot
                </h4>

                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Saves the current executive score using the existing
                  executive-risk persistence service, then records timeline
                  alerts and refreshes the parent Student OS when available.
                </p>

                {lastSavedAt ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Clock3 size={13} />
                    Last saved: {lastSavedAt}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={saveScore}
                disabled={
                  saving || !hasValidStudentId
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Database size={16} />
                {saving
                  ? "Saving Executive Score..."
                  : "Save Executive Score"}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[1.3rem] border-2 border-slate-300 bg-white p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />

            <p className="text-xs font-semibold leading-5 text-slate-600">
              This card does not call GPT by itself. The live score comes from
              <span className="font-black text-[#10233f]">
                {" "}calculateExecutiveRisk()
              </span>
              . Any GPT-related signal is only used if it already exists in the
              student data supplied to that scoring engine.
            </p>
          </div>
        </div>
      </div>

      <ExecutiveRecommendationPanel
        score={executiveScore}
      />
    </section>
  );
}

function ScoreCard({
  label,
  value,
  badge,
  tone = "orange",
  icon: Icon,
}) {
  const dark = tone === "navy";

  const style = getToneStyle(tone);

  return (
    <div
      className={`rounded-[1.3rem] border-[3px] p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              color: dark
                ? "#FDBA74"
                : "#64748B",
            }}
          >
            {label}
          </p>

          <p
            className="mt-2 break-words text-3xl font-black"
            style={{
              color: dark
                ? "#FFFFFF"
                : "#10233F",
            }}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <Icon
            size={18}
            style={{
              color: dark
                ? "#FDBA74"
                : "#C2410C",
            }}
          />
        ) : null}
      </div>

      <span
        className={`mt-3 inline-flex rounded-full border-2 px-3 py-1 text-[10px] font-black ${
          dark
            ? "border-white/25 bg-white/10 text-white"
            : "border-white bg-white text-slate-700"
        }`}
      >
        {badge}
      </span>
    </div>
  );
}

function ReasonList({
  title,
  items = [],
  emptyText,
  tone = "orange",
  icon: Icon,
}) {
  const style =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-800"
      : "border-orange-300 bg-orange-50 text-orange-800";

  return (
    <div className="rounded-[1.45rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="flex items-center gap-2">
        {Icon ? (
          <Icon className="h-4 w-4 text-orange-700" />
        ) : null}

        <p className="font-black text-[#10233f]">
          {title}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${title}-${index}-${String(
                item
              ).slice(0, 30)}`}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold leading-6 ${style}`}
            >
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-[#fffaf2] px-4 py-3 text-sm font-semibold text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function Feedback({
  tone = "success",
  onClose = null,
  children,
}) {
  const style =
    tone === "error"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-2xl border-2 p-4 text-sm font-semibold ${style}`}
    >
      <div className="flex items-start gap-2">
        {tone === "error" ||
        tone === "warning" ? (
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0"
          />
        ) : (
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0"
          />
        )}

        <span>{children}</span>
      </div>

      {typeof onClose === "function" ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/50 transition hover:bg-white"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "danger") {
    return "border-red-300 bg-red-50";
  }

  if (tone === "warning") {
    return "border-amber-300 bg-amber-50";
  }

  if (tone === "good") {
    return "border-emerald-300 bg-emerald-50";
  }

  if (tone === "navy") {
    return "border-[#123865] bg-[#123865]";
  }

  if (tone === "blue") {
    return "border-blue-300 bg-blue-50";
  }

  return "border-orange-300 bg-orange-50";
}

function getBandStyle(tone = "") {
  if (tone === "danger") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (tone === "warning") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }

  if (tone === "good") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (tone === "navy") {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }

  return "border-orange-300 bg-orange-50 text-orange-800";
}

export default StudentExecutiveRiskCard;
