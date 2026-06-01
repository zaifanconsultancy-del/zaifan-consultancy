import { useMemo, useState } from "react";
import {
  calculateExecutiveRisk,
  saveExecutiveRiskScore,
} from "../../lib/executiveAI";
import { supabase } from "../../lib/supabaseClient";
import ExecutiveRecommendationPanel from "./ExecutiveRecommendationPanel";

function StudentExecutiveRiskCard({ student = {} }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const executiveScore = useMemo(() => {
    return calculateExecutiveRisk(student);
  }, [student]);

  const createTimelineEvent = async () => {
  try {
    await supabase.from("student_application_timeline").insert({
      student_id: Number(student.id),
      student_type: student.student_type || "inquiry",
      event_type: "executive_score_saved",
      title: "Executive Score Saved",
      description: executiveScore.summary,
      new_value: String(executiveScore.risk_score),
    });
  } catch {
    // Timeline failures should never break Executive AI
  }
};

  const saveScore = async () => {
    if (!student?.id || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await saveExecutiveRiskScore(student);

      if (error) {
        setMessage(error.message || "Executive score save failed.");
        return;
      }

      await createTimelineEvent();

      if (executiveScore.risk_score >= 80) {
  await supabase.from("student_application_timeline").insert({
    student_id: Number(student.id),
    student_type: student.student_type || "inquiry",
    event_type: "executive_alert",
    title: "Critical Risk Alert",
    description:
      "Student flagged as critical risk and requires immediate counselor review.",
    new_value: String(executiveScore.risk_score),
  });
}

if (executiveScore.risk_score >= 60 && executiveScore.risk_score < 80) {
  await supabase.from("student_application_timeline").insert({
    student_id: Number(student.id),
    student_type: student.student_type || "inquiry",
    event_type: "executive_alert",
    title: "High Risk Alert",
    description:
      "Student flagged as high risk and should be reviewed soon.",
    new_value: String(executiveScore.risk_score),
  });
}


setMessage("Executive score saved.");
    } catch (error) {
      setMessage(error.message || "Executive score save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Executive Student Intelligence
            </p>

            <h3 className="mt-2 text-2xl font-black text-white">
              Student Risk & Opportunity Score
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Local executive scoring based on priority, status, GPT signals,
              application movement, visa status, and student risk markers.
            </p>
          </div>

          <button
            type="button"
            onClick={saveScore}
            disabled={saving}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Executive Score"}
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
            Executive Summary
          </p>

          <p className="mt-3 text-sm leading-7 text-white/60">
            {executiveScore.summary}
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
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

      <ExecutiveRecommendationPanel score={executiveScore} />
    </div>
  );
}

function ScoreCard({ label, value, badge, tone }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-5 ${style}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
        {label}
      </p>

      <p className="mt-3 break-words text-3xl font-black text-white">
        {value}
      </p>

      <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold text-white/50">
        {badge}
      </span>
    </div>
  );
}

function ReasonList({ title, items = [], emptyText, tone }) {
  const style =
    tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="font-bold text-white">{title}</p>

      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className={`rounded-xl border px-4 py-3 text-sm ${style}`}
            >
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/40">
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
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (tone === "orange") {
    return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  }

  if (tone === "gold") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  if (tone === "green") {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  }

  return "border-blue-400/25 bg-blue-500/10 text-blue-300";
}

export default StudentExecutiveRiskCard;