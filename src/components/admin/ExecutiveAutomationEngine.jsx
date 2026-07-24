import { useMemo } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";

const MAX_TEMPLATE_ITEMS = 30;

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

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Unknown Student";
}

function getStudentId(score = {}) {
  return String(score.student_id || score.id || "");
}

function getStudentType(score = {}) {
  return score.student_type || score.__leadType || score.type || "student";
}

function getStudentKey(score = {}) {
  return `${getStudentId(score) || getStudentName(score)}-${getStudentType(score)}`;
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

  if (
    ["offer_accepted", "accepted", "confirmed"].includes(offer) ||
    ["offer_accepted", "accepted", "confirmed"].includes(app)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "received", "offer", "conditional_offer", "unconditional_offer"].includes(
      offer
    ) ||
    ["offer_received", "received", "offer", "conditional_offer", "unconditional_offer"].includes(
      app
    )
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(app)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(app)) {
    return "application_submitted";
  }

  if (["started", "draft", "in_progress"].includes(app)) {
    return "application_started";
  }

  return "not_started";
}

function getPriorityRank(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return 6;
  if (clean === "executive") return 5;
  if (clean === "high") return 4;
  if (clean === "medium") return 3;
  if (clean === "low") return 2;

  return 1;
}

function getActionRank(actionType = "") {
  const clean = normalize(actionType);

  if (clean === "create_task") return 5;
  if (clean === "schedule_call") return 4;
  if (clean === "create_reminder") return 3;
  if (clean === "send_email") return 2;
  if (clean === "send_whatsapp") return 2;

  return 1;
}

function approvalRequired(recommendation = {}, template = {}) {
  const priority = normalize(recommendation.priority);
  const actionType = normalize(template.actionType);

  return (
    priority === "critical" ||
    priority === "executive" ||
    actionType === "send_email" ||
    actionType === "send_whatsapp" ||
    template?.payload?.approval_required === true
  );
}

function buildDuplicateKey(score = {}, recommendation = {}, template = {}) {
  return [
    getStudentKey(score),
    normalize(recommendation.type || "recommendation"),
    normalize(template.actionType || recommendation.action || "action"),
    normalize(template?.payload?.title || recommendation.title || ""),
  ].join("-");
}

function buildAutomationTemplates(scores = []) {
  const safeScores = Array.isArray(scores) ? scores.filter(Boolean) : [];

  const rawItems = safeScores.flatMap((score) => {
    let recommendations = [];

    try {
      recommendations = buildExecutiveRecommendations(score) || [];
    } catch (error) {
      console.warn("Executive recommendation generation skipped:", error);
      return [];
    }

    if (!Array.isArray(recommendations)) return [];

    return recommendations
      .filter((recommendation) => normalize(recommendation?.action) !== "none")
      .map((recommendation) => {
        try {
          const template = buildExecutiveActionTemplate(score, recommendation);
          if (!template || !template.actionType) return null;

          const studentStage = getJourneyStage(score, template);
          const priorityRank = getPriorityRank(recommendation.priority);
          const actionRank = getActionRank(template.actionType);

          return {
            key: `${getStudentKey(score)}-${recommendation.type}-${template.actionType}`,
            duplicateKey: buildDuplicateKey(score, recommendation, template),
            score,
            recommendation,
            template,
            studentStage,
            priorityRank,
            actionRank,
            approvalRequired: approvalRequired(recommendation, template),
            impactScore:
              number(score.risk_score) +
              number(score.opportunity_score) +
              priorityRank * 12 +
              actionRank * 5,
          };
        } catch (error) {
          console.warn("Automation template generation skipped:", error);
          return null;
        }
      })
      .filter(Boolean);
  });

  const deduped = new Map();

  rawItems.forEach((item) => {
    const existing = deduped.get(item.duplicateKey);

    if (!existing) {
      deduped.set(item.duplicateKey, item);
      return;
    }

    const existingIsAppointment = normalize(getStudentType(existing.score)) === "appointment";
    const currentIsAppointment = normalize(getStudentType(item.score)) === "appointment";

    if (!existingIsAppointment && currentIsAppointment) {
      deduped.set(item.duplicateKey, item);
      return;
    }

    if (item.impactScore > existing.impactScore) {
      deduped.set(item.duplicateKey, item);
    }
  });

  return [...deduped.values()]
    .sort((a, b) => {
      if (b.priorityRank !== a.priorityRank) return b.priorityRank - a.priorityRank;
      if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
      return b.actionRank - a.actionRank;
    })
    .slice(0, MAX_TEMPLATE_ITEMS);
}

function buildAutomationAnalytics(scores = [], automationTemplates = []) {
  const safeScores = Array.isArray(scores) ? scores.filter(Boolean) : [];
  const safeTemplates = Array.isArray(automationTemplates)
    ? automationTemplates.filter(Boolean)
    : [];

  const analytics = {
    totalStudents: safeScores.length,
    totalTemplates: safeTemplates.length,

    critical: 0,
    executive: 0,
    high: 0,
    medium: 0,
    low: 0,

    approvalRequired: 0,
    readyForReview: 0,

    communicationDrafts: 0,
    taskActions: 0,
    reminderActions: 0,
    callActions: 0,
    emailDrafts: 0,
    whatsappDrafts: 0,

    highImpact: 0,
    conversionReady: 0,
    visaStage: 0,
    documentActions: 0,
    universityActions: 0,

    byStage: {},
    byAction: {},
    byPriority: {},
    byStudentType: {},
  };

  safeTemplates.forEach((item) => {
    const priority = normalize(item.recommendation.priority || "medium");
    const actionType = normalize(item.template.actionType);
    const stage = normalize(item.studentStage);
    const studentType = normalize(getStudentType(item.score));
    const recommendationType = normalize(item.recommendation.type);

    if (analytics[priority] !== undefined) analytics[priority] += 1;

    analytics.byStage[stage] = (analytics.byStage[stage] || 0) + 1;
    analytics.byAction[actionType] = (analytics.byAction[actionType] || 0) + 1;
    analytics.byPriority[priority] = (analytics.byPriority[priority] || 0) + 1;
    analytics.byStudentType[studentType] = (analytics.byStudentType[studentType] || 0) + 1;

    if (item.approvalRequired) analytics.approvalRequired += 1;
    else analytics.readyForReview += 1;

    if (["send_email", "send_whatsapp"].includes(actionType)) analytics.communicationDrafts += 1;
    if (actionType === "send_email") analytics.emailDrafts += 1;
    if (actionType === "send_whatsapp") analytics.whatsappDrafts += 1;
    if (actionType === "create_task") analytics.taskActions += 1;
    if (actionType === "create_reminder") analytics.reminderActions += 1;
    if (actionType === "schedule_call") analytics.callActions += 1;

    if (item.impactScore >= 120) analytics.highImpact += 1;

    if (["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage)) {
      analytics.conversionReady += 1;
    }

    if (["visa_pending", "visa_approved", "visa_rejected", "cas_issued"].includes(stage)) {
      analytics.visaStage += 1;
    }

    if (recommendationType.includes("document")) analytics.documentActions += 1;
    if (recommendationType.includes("university")) analytics.universityActions += 1;
  });

  const studentsWithActions = new Set(
    safeTemplates.map((item) => getStudentKey(item.score))
  ).size;

  analytics.studentsWithActions = studentsWithActions;
  analytics.coverage = analytics.totalStudents
    ? Math.min(100, Math.round((studentsWithActions / analytics.totalStudents) * 100))
    : 0;

  analytics.healthScore = analytics.totalTemplates
    ? Math.round((analytics.readyForReview / analytics.totalTemplates) * 100)
    : 100;

  analytics.approvalRate = analytics.totalTemplates
    ? Math.round((analytics.approvalRequired / analytics.totalTemplates) * 100)
    : 0;

  return analytics;
}

function ExecutiveAutomationEngine({ scores = [] }) {
  const automationTemplates = useMemo(() => buildAutomationTemplates(scores), [scores]);

  const analytics = useMemo(
    () => buildAutomationAnalytics(scores, automationTemplates),
    [scores, automationTemplates]
  );

  const topTemplates = automationTemplates.slice(0, 15);

  return (
    <div className="rounded-[2rem] border-[3px] border-[#E9802D]/45 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
            Executive Automation Engine V2
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#17243D]">
            Student OS Automation Templates
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            Executive AI converts student journey intelligence into prepared actions with
            duplicate protection, approval intelligence, action analytics, and automation
            health scoring.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${analytics.totalTemplates} Templates`} />
          <Badge label={`${analytics.critical} Critical`} danger />
          <Badge label={`${analytics.executive} Executive`} gold />
          <Badge label={`${analytics.approvalRequired} Approval`} gold />
          <Badge label={`${analytics.readyForReview} Review Ready`} success />
          <Badge label={`Health ${analytics.healthScore}%`} success={analytics.healthScore >= 70} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#243A60]/20 bg-white px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B84F0E]">
          Engine Scope
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#596579]">
          This component generates, prioritizes, deduplicates, and explains proposed automation
          templates. It does not send emails, send WhatsApp messages, create tasks, or mutate
          Supabase records by itself.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Students Scanned" value={analytics.totalStudents} />
        <MetricCard label="Templates Generated" value={analytics.totalTemplates} />
        <MetricCard label="Automation Coverage" value={`${analytics.coverage}%`} />
        <MetricCard label="Approval Rate" value={`${analytics.approvalRate}%`} />
        <MetricCard label="High Impact" value={analytics.highImpact} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Tasks" value={analytics.taskActions} compact />
        <MetricCard label="Reminders" value={analytics.reminderActions} compact />
        <MetricCard label="Calls" value={analytics.callActions} compact />
        <MetricCard label="Email Drafts" value={analytics.emailDrafts} compact />
        <MetricCard label="WhatsApp" value={analytics.whatsappDrafts} compact />
        <MetricCard label="Comms Total" value={analytics.communicationDrafts} compact />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <DistributionPanel
          title="Journey Stage Distribution"
          description="Where Executive AI is generating the most workflow pressure."
          items={analytics.byStage}
        />

        <DistributionPanel
          title="Action Type Distribution"
          description="Tasks, reminders, calls, emails, and WhatsApp drafts prepared."
          items={analytics.byAction}
        />

        <DistributionPanel
          title="Priority Distribution"
          description="Critical, executive, high, medium, and low automation load."
          items={analytics.byPriority}
        />
      </div>

      <AutomationHealthPanel analytics={analytics} />

      <div className="mt-6 space-y-3">
        {topTemplates.length ? (
          topTemplates.map((item, index) => (
            <AutomationTemplateCard
              key={`${item.key}-${index}`}
              item={item}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-[#E9802D]/28 bg-[#FFF1E3] p-5">
            <p className="font-semibold text-[#B84F0E]">
              No automation templates generated yet.
            </p>
            <p className="mt-2 text-sm text-[#7A8392]">
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
  const actionType = normalize(template.actionType);

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${priorityStyle.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#17243D]">{template.title}</p>

            <Tag text={recommendation.priority || "medium"} className={priorityStyle.badge} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={formatLabel(studentStage)} />
            <Tag text={`Impact ${item.impactScore}`} />

            {approvalRequired ? (
              <Tag
                text="Approval Required"
                className="border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]"
              />
            ) : (
              <Tag
                text="Review Ready"
                className="border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]"
              />
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
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
            <PayloadSummary payload={payload} actionType={actionType} />
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-[#243A60]/18 bg-white p-4 xl:w-64">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8992A1]">
            Student
          </p>

          <p className="mt-2 truncate font-bold text-[#17243D]">
            {getStudentName(score)}
          </p>

          <div className="mt-4 grid gap-2 text-xs text-[#7A8392]">
            <p>Type: {formatLabel(getStudentType(score))}</p>
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

function AutomationHealthPanel({ analytics }) {
  const readinessTone =
    analytics.healthScore >= 70
      ? "border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]"
      : analytics.healthScore >= 40
      ? "border-[#A36A18]/28 bg-[#FFF7E8] text-[#8A5611]"
      : "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]";

  return (
    <div className={`mt-6 rounded-2xl border p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)] ${readinessTone}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">
            Automation Health
          </p>

          <h3 className="mt-2 text-xl font-black text-[#17243D]">
            {analytics.healthScore}% Review Ready Without Extra Approval
          </h3>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            This score shows how much of the generated template queue can be reviewed without an
            additional approval gate. It does not mean an action has already executed. Executive
            and communication-heavy actions remain protected behind human approval.
          </p>
        </div>

        <div className="grid gap-2 text-xs text-[#667085] xl:w-72">
          <p>Approval Required: {analytics.approvalRequired}</p>
          <p>Ready To Execute: {analytics.readyToExecute}</p>
          <p>Conversion Ready Actions: {analytics.conversionReady}</p>
          <p>Visa Stage Actions: {analytics.visaStage}</p>
          <p>Document Actions: {analytics.documentActions}</p>
          <p>University Actions: {analytics.universityActions}</p>
        </div>
      </div>
    </div>
  );
}

function DistributionPanel({ title, description, items = {} }) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-2xl border-2 border-[#243A60]/18 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#7A8392]">
        {description}
      </p>

      <div className="mt-4 space-y-2">
        {entries.length ? (
          entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-[#243A60]/18 bg-white px-3 py-2 text-xs"
            >
              <span className="font-bold text-[#667085]">{formatLabel(key)}</span>
              <span className="font-black text-[#17243D]">{value}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-[#243A60]/18 bg-white px-3 py-2 text-xs text-[#8992A1]">
            No data yet.
          </p>
        )}
      </div>
    </div>
  );
}

function PayloadSummary({ payload = {}, actionType = "" }) {
  return (
    <div className="rounded-xl border border-[#243A60]/18 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        Execution Summary
      </p>

      <div className="mt-3 grid gap-2 text-xs leading-5 text-[#667085]">
        <p>Student: {payload.student_name || "Unknown"}</p>
        <p>Journey: {formatLabel(payload.journey_stage || "not_started")}</p>
        <p>Recommendation: {formatLabel(payload.recommendation_type || "unknown")}</p>
        <p>Priority: {payload.recommendation_priority || payload.priority || "medium"}</p>
        <p>Action: {formatLabel(actionType)}</p>
        <p>Approval: {payload.approval_required ? "Required" : "Not Required"}</p>
      </div>
    </div>
  );
}

function PayloadPreview({ title, payload }) {
  return (
    <div className="rounded-xl border border-[#243A60]/18 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {title}
      </p>

      <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[#667085]">
        {safeStringify(payload)}
      </pre>
    </div>
  );
}

function safeStringify(value) {
  try {
    const serialized = JSON.stringify(value, null, 2);
    if (!serialized) return "No payload data.";
    return serialized.length > 6000
      ? `${serialized.slice(0, 6000)}\n… payload preview truncated`
      : serialized;
  } catch {
    return "Payload could not be serialized.";
  }
}

function MetricCard({ label, value, compact = false }) {
  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {label}
      </p>

      <p className={`${compact ? "text-2xl" : "text-3xl"} mt-2 font-black text-[#17243D]`}>
        {value}
      </p>
    </div>
  );
}

function Tag({ text, className = "" }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
        className || "border-[#243A60]/18 bg-white text-[#7A8392]"
      }`}
    >
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8392]">
      {label}: {value}
    </span>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]"
    : gold
    ? "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]"
    : "border-[#243A60]/20 bg-white text-[#243A60]";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function getPriorityStyle(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") {
    return {
      wrapper: "border-[#C2413B]/32 bg-[#FFF0EE]",
      badge: "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#E9802D]/45 bg-[#FFF1E3]",
      badge: "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-[#A36A18]/30 bg-[#FFF7E8]",
      badge: "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-[#243A60]/25 bg-[#F3F5F8]",
      badge: "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]",
    };
  }

  return {
    wrapper: "border-[#243A60]/18 bg-white",
    badge: "border-[#243A60]/18 bg-white text-[#7A8392]",
  };
}

export function buildAutomationEngineV2Summary(scores = []) {
  const rows = Array.isArray(scores) ? scores : [];
  const templates = buildAutomationTemplates(rows);
  return buildAutomationAnalytics(rows, templates);
}

export function buildAutomationDuplicateKey(score = {}, recommendation = {}, template = {}) {
  return buildDuplicateKey(score, recommendation, template);
}

export default ExecutiveAutomationEngine;