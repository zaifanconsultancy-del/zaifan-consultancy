// StudentExecutiveRiskCard V2 — Executive Student Intelligence
// Preserves executive risk calculation, Supabase persistence, timeline alerts,
// parent Student OS refresh and recommendation integration.
// Visual system aligned with the approved Zaifan Admin OS.

import { useMemo, useState } from "react";
import {
  calculateExecutiveRisk,
  saveExecutiveRiskScore,
} from "../../lib/executiveAI";
import { supabase } from "../../lib/supabaseClient";
import ExecutiveRecommendationPanel from "./ExecutiveRecommendationPanel";

const REQUEST_TIMEOUT_MS = 12000;

function withTimeout(promise, message = "Request timed out.") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

function StudentExecutiveRiskCard({ student = {}, onSharedDataChange = null }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const studentType =
    student?.student_type || student?.__leadType || student?.type || "inquiry";

  const executiveScore = useMemo(() => {
    return calculateExecutiveRisk(student);
  }, [student]);

  const createTimelineEvent = async ({
    eventType,
    title,
    description,
    newValue = "",
  }) => {
    if (!student?.id) return;

    try {
      await withTimeout(
        supabase.from("student_application_timeline").insert({
          student_id: Number(student.id),
          student_type: studentType,
          event_type: eventType,
          title,
          description,
          new_value: newValue ? String(newValue) : null,
        }),
        "Executive timeline event timed out."
      );
    } catch {
      // Timeline failures should never break Executive AI.
    }
  };

  const notifyParent = async () => {
    if (typeof onSharedDataChange !== "function") return;

    try {
      await withTimeout(
        Promise.resolve(onSharedDataChange()),
        "Student OS refresh after executive score save timed out."
      );
    } catch (refreshError) {
      console.warn("Executive score saved, but parent refresh failed:", refreshError);
    }
  };

  const saveScore = async () => {
    if (!student?.id || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await withTimeout(
        saveExecutiveRiskScore({
          ...student,
          student_type: studentType,
        }),
        "Executive score save timed out."
      );

      if (error) {
        setMessage(error.message || "Executive score save failed.");
        return;
      }

      await createTimelineEvent({
        eventType: "executive_score_saved",
        title: "Executive Score Saved",
        description: executiveScore.summary,
        newValue: executiveScore.risk_score,
      });

      if (executiveScore.risk_score >= 80) {
        await createTimelineEvent({
          eventType: "executive_alert",
          title: "Critical Risk Alert",
          description:
            "Student flagged as critical risk and requires immediate counselor review.",
          newValue: executiveScore.risk_score,
        });
      }

      if (executiveScore.risk_score >= 60 && executiveScore.risk_score < 80) {
        await createTimelineEvent({
          eventType: "executive_alert",
          title: "High Risk Alert",
          description: "Student flagged as high risk and should be reviewed soon.",
          newValue: executiveScore.risk_score,
        });
      }

      await notifyParent();
      setMessage("Executive score saved.");
    } catch (error) {
      setMessage(error.message || "Executive score save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-[#10233f]">
      <div className="overflow-hidden rounded-[1.8rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
        <div className="bg-[#102f5c] p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
                Executive Student Intelligence
              </p>

              <h3 className="mt-2 text-2xl font-black text-white">
                Student Risk & Opportunity Score
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
                Local executive scoring based on priority, status, GPT signals,
                application movement, visa status, and student risk markers.
              </p>
            </div>

            <button
              type="button"
              onClick={saveScore}
              disabled={saving}
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Executive Score"}
            </button>
          </div>
        </div>

        <div className="space-y-5 bg-[#fff8ee] p-5 sm:p-6">
          {message ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
              {message}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <ScoreCard
              label="Risk Score"
              value={executiveScore.risk_score}
              badge={executiveScore.risk_level}
              tone={getRiskTone(executiveScore.risk_score)}
            />

            <ScoreCard
              label="Opportunity Score"
              value={executiveScore.opportunity_score}
              badge="Opportunity"
              tone="gold"
            />

            <ScoreCard
              label="Priority Level"
              value={executiveScore.priority_level}
              badge="Executive"
              tone="blue"
            />
          </div>

          <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">
              Executive Summary
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-700">
              {executiveScore.summary}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ReasonList
              title="Risk Reasons"
              items={executiveScore.risk_reasons}
              emptyText="No major risk signals detected."
              tone="red"
            />

            <ReasonList
              title="Opportunity Reasons"
              items={executiveScore.opportunity_reasons}
              emptyText="No major opportunity signals detected."
              tone="gold"
            />
          </div>
        </div>
      </div>

      <ExecutiveRecommendationPanel score={executiveScore} />
    </div>
  );
}

function ScoreCard({ label, value, badge, tone }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${style}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
        {label}
      </p>

      <p className="mt-3 break-words text-3xl font-black text-[#10233f]">
        {value}
      </p>

      <span className="mt-3 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-700">
        {badge}
      </span>
    </div>
  );
}

function ReasonList({ title, items = [], emptyText, tone }) {
  const style =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-orange-200 bg-orange-50 text-orange-700";

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <p className="font-black text-[#10233f]">{title}</p>

      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${style}`}
            >
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-[#fffaf2] px-4 py-3 text-sm text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function getRiskTone(score) {
  const numericScore = Number(score || 0);

  if (numericScore >= 80) return "red";
  if (numericScore >= 60) return "orange";
  if (numericScore >= 30) return "blue";

  return "green";
}

function getToneStyle(tone = "") {
  if (tone === "red") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (tone === "orange") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (tone === "gold") {
    return "border-orange-300 bg-[#fff8ee] text-orange-700";
  }

  if (tone === "green") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  return "border-blue-300 bg-blue-50 text-blue-700";
}

export default StudentExecutiveRiskCard;