import { useMemo } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";

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

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Unknown Student";
}

function getJourneyStage(score = {}, template = {}) {
  const direct =
    normalize(score.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage) ||
    normalize(template?.payload?.journey_stage);

  if (direct) return direct;

  const app = normalize(score.application_status);
  const visa = normalize(score.visa_status);
  const offer = normalize(score.offer_status);

  if (app === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visa)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visa)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visa)) {
    return "visa_pending";
  }
  if (app === "cas_issued") return "cas_issued";
  if (app === "cas_pending") return "cas_pending";
  if (["offer_accepted", "accepted"].includes(offer) || ["offer_accepted", "accepted"].includes(app)) {
    return "offer_accepted";
  }
  if (["offer_received", "received", "offer"].includes(offer) || ["offer_received", "offer"].includes(app)) {
    return "offer_received";
  }
  if (["under_review", "review"].includes(app)) return "application_under_review";
  if (["applied", "submitted"].includes(app)) return "application_submitted";

  return "not_started";
}

function ExecutiveAutomationEngine({ scores = [] }) {
  const automationTemplates = useMemo(() => {
    return (scores || [])
      .flatMap((score) => {
        const recommendations = buildExecutiveRecommendations(score);

        return recommendations
          .filter((recommendation) => normalize(recommendation.action) !== "none")
          .map((recommendation) => {
            const template = buildExecutiveActionTemplate(score, recommendation);

            return {
              score,
              recommendation,
              template,
              studentStage: getJourneyStage(score, template),
              priorityRank: getPriorityRank(recommendation.priority),
              approvalRequired: template?.payload?.approval_required === true,
              impactScore:
                number(score.risk_score) +
                number(score.opportunity_score) +
                getPriorityRank(recommendation.priority) * 10,
            };
          });
      })
      .sort((a, b) => {
        if (b.priorityRank !== a.priorityRank) return b.priorityRank - a.priorityRank;
        return b.impactScore - a.impactScore;
      })
      .slice(0, 15);
  }, [scores]);

  const critical = automationTemplates.filter(
    (item) => normalize(item.recommendation.priority) === "critical"
  ).length;

  const executive = automationTemplates.filter(
    (item) => normalize(item.recommendation.priority) === "executive"
  ).length;

  const approvalRequired = automationTemplates.filter((item) => item.approvalRequired).length;
  const readyToExecute = automationTemplates.filter((item) => !item.approvalRequired).length;
  const communicationDrafts = automationTemplates.filter((item) =>
    ["send_email", "send_whatsapp"].includes(normalize(item.template.actionType))
  ).length;

  return (
    <div className="rounded-[2rem] border border-purple-400/20 bg-purple-500/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-300">
            Executive Automation Engine
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Student OS Automation Templates
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Executive AI converts student journey intelligence into prepared
            CRM actions. Human approval is tracked before execution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${automationTemplates.length} Templates`} />
          <Badge label={`${critical} Critical`} danger />
          <Badge label={`${executive} Executive`} gold />
          <Badge label={`${approvalRequired} Approval`} gold />
          <Badge label={`${readyToExecute} Ready`} success />
          <Badge label={`${communicationDrafts} Drafts`} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {automationTemplates.length ? (
          automationTemplates.map((item, index) => (
            <AutomationTemplateCard
              key={`${item.score.student_id || item.score.id}-${item.recommendation.type}-${index}`}
              item={item}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
            <p className="font-semibold text-emerald-200">
              No automation templates generated yet.
            </p>
            <p className="mt-2 text-sm text-white/45">
              Executive AI does not currently see action templates that need task,
              reminder, call, email, or WhatsApp preparation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AutomationTemplateCard({ item }) {
  const { score, recommendation, template, studentStage, approvalRequired } = item;
  const priorityStyle = getPriorityStyle(recommendation.priority);
  const payload = template.payload || {};

  return (
    <div className={`rounded-2xl border p-4 ${priorityStyle.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{template.title}</p>

            <Tag text={recommendation.priority} className={priorityStyle.badge} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={formatLabel(studentStage)} />

            {approvalRequired ? (
              <Tag
                text="Approval Required"
                className="border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
              />
            ) : (
              <Tag
                text="Ready"
                className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
              />
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {template.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniStat label="Risk" value={score.risk_score || 0} />
            <MiniStat label="Opportunity" value={score.opportunity_score || 0} />
            <MiniStat label="Category" value={score.executive_category || "Standard"} />
            <MiniStat label="Generated By" value={payload.generated_by || "executive_ai"} />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <PayloadPreview title="Prepared Payload" payload={payload} />
            <PayloadSummary payload={payload} />
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 p-4 xl:w-64">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
            Student
          </p>

          <p className="mt-2 truncate font-bold text-white">
            {getStudentName(score)}
          </p>

          <div className="mt-4 grid gap-2 text-xs text-white/45">
            <p>Risk: {score.risk_score || 0}</p>
            <p>Opportunity: {score.opportunity_score || 0}</p>
            <p>Priority: {score.priority_level || "Standard"}</p>
            <p>Stage: {formatLabel(studentStage)}</p>
            <p>Action: {formatLabel(template.actionType)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PayloadSummary({ payload = {} }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        Execution Summary
      </p>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-white/50">
        <p>Student: {payload.student_name || "Unknown"}</p>
        <p>Journey: {formatLabel(payload.journey_stage || "not_started")}</p>
        <p>Recommendation: {formatLabel(payload.recommendation_type || "unknown")}</p>
        <p>Priority: {payload.recommendation_priority || "medium"}</p>
        <p>Approval: {payload.approval_required ? "Required" : "Not Required"}</p>
      </div>
    </div>
  );
}

function PayloadPreview({ title, payload }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>

      <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/55">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

function Tag({ text, className = "" }) {
  return (
    <span
      className={`rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45 ${className}`}
    >
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
      {label}: {value}
    </span>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-red-400/25 bg-red-500/10 text-red-300"
    : gold
    ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
    : success
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
    : "border-purple-400/25 bg-purple-500/10 text-purple-300";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function getPriorityRank(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return 5;
  if (clean === "executive") return 4;
  if (clean === "high") return 3;
  if (clean === "medium") return 2;
  if (clean === "low") return 1;

  return 0;
}

function getPriorityStyle(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") {
    return {
      wrapper: "border-red-400/25 bg-red-500/10",
      badge: "border-red-400/25 bg-red-500/10 text-red-200",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#D4AF37]/30 bg-[#D4AF37]/10",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-orange-400/25 bg-orange-500/10",
      badge: "border-orange-400/25 bg-orange-500/10 text-orange-200",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-blue-400/25 bg-blue-500/10",
      badge: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    };
  }

  return {
    wrapper: "border-white/10 bg-white/[0.03]",
    badge: "border-white/10 bg-black/20 text-white/45",
  };
}

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default ExecutiveAutomationEngine;