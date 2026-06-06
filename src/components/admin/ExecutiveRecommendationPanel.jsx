import { useMemo, useState } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";
import { executeExecutiveActionTemplate } from "../../lib/executiveActionExecutor";

const EXECUTION_TIMEOUT_MS = 20000;

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
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStudentName(score = {}) {
  return score?.student_name || score?.full_name || score?.name || "Student";
}

function getJourneyStage(score = {}, template = {}) {
  const direct =
    normalize(score?.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage) ||
    normalize(template?.payload?.journey_stage);

  if (direct) return direct;

  const applicationStatus = normalize(score?.application_status);
  const offerStatus = normalize(score?.offer_status);
  const visaStatus = normalize(score?.visa_status);

  if (applicationStatus === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review", "processing"].includes(visaStatus)) {
    return "visa_pending";
  }
  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";
  if (
    ["offer_accepted", "accepted", "confirmed"].includes(applicationStatus) ||
    ["offer_accepted", "accepted", "confirmed"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }
  if (
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(applicationStatus) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(offerStatus)
  ) {
    return "offer_received";
  }
  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }
  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }
  if (["started", "draft", "in_progress", "documents_pending", "docs_pending"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getActionLabel(action = "") {
  const clean = normalize(action);

  const labels = {
    create_task: "Create Task",
    create_reminder: "Create Reminder",
    send_email: "Email Draft",
    send_whatsapp: "WhatsApp Draft",
    schedule_call: "Schedule Call",
    none: "Monitor",
  };

  return labels[clean] || formatLabel(action || "Review");
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
      soft: "border-red-400/20 bg-red-500/10 text-red-300",
      dot: "bg-red-300",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#D4AF37]/30 bg-[#D4AF37]/10",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
      soft: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
      dot: "bg-[#D4AF37]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-orange-400/25 bg-orange-500/10",
      badge: "border-orange-400/25 bg-orange-500/10 text-orange-200",
      soft: "border-orange-400/20 bg-orange-500/10 text-orange-300",
      dot: "bg-orange-300",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-blue-400/25 bg-blue-500/10",
      badge: "border-blue-400/25 bg-blue-500/10 text-blue-200",
      soft: "border-blue-400/20 bg-blue-500/10 text-blue-300",
      dot: "bg-blue-300",
    };
  }

  return {
    wrapper: "border-white/10 bg-white/[0.03]",
    badge: "border-white/10 bg-black/20 text-white/45",
    soft: "border-white/10 bg-black/20 text-white/45",
    dot: "bg-white/40",
  };
}

function approvalRequired(recommendation = {}, template = {}) {
  const priority = normalize(recommendation.priority);

  return (
    priority === "critical" ||
    priority === "executive" ||
    template?.payload?.approval_required === true
  );
}

function buildRecommendationRows(score = {}) {
  const recommendations = buildExecutiveRecommendations(score) || [];

  return recommendations.map((recommendation, index) => {
    const template =
      normalize(recommendation.action) === "none"
        ? null
        : buildExecutiveActionTemplate(score, recommendation);

    const studentStage = getJourneyStage(score, template || {});
    const priorityRank = getPriorityRank(recommendation.priority);
    const impactScore =
      number(score.risk_score) +
      number(score.opportunity_score) +
      priorityRank * 10;

    return {
      recommendation,
      template,
      studentStage,
      priorityRank,
      impactScore,
      requiresApproval: approvalRequired(recommendation, template || {}),
      key: `${recommendation.type || recommendation.title || "recommendation"}-${recommendation.action || "review"}-${index}`,
    };
  });
}

function ExecutiveRecommendationPanel({
  score = {},
  adminProfile = null,
  onActionExecuted = () => {},
}) {
  const [executingKey, setExecutingKey] = useState("");
  const [executedKeys, setExecutedKeys] = useState({});
  const [executionMessage, setExecutionMessage] = useState("");
  const [executionError, setExecutionError] = useState("");
  const [previewKey, setPreviewKey] = useState("");

  const rows = useMemo(() => buildRecommendationRows(score), [score]);
  const studentName = getStudentName(score);

  const summary = useMemo(() => {
    const executable = rows.filter((item) => item.template).length;
    const approval = rows.filter((item) => item.requiresApproval).length;

    return {
      total: rows.length,
      critical: rows.filter((item) => normalize(item.recommendation.priority) === "critical").length,
      executive: rows.filter((item) => normalize(item.recommendation.priority) === "executive").length,
      high: rows.filter((item) => normalize(item.recommendation.priority) === "high").length,
      executable,
      approval,
      executed: Object.keys(executedKeys).length,
    };
  }, [rows, executedKeys]);

  const diagnostics = score?.diagnostics || {};
  const journeyStage = getJourneyStage(score);
  const riskScore = number(score?.risk_score);
  const opportunityScore = number(score?.opportunity_score);

  const executeRecommendation = async (item) => {
    if (!item?.template || executingKey || executedKeys[item.key]) return;

    const confirmed = window.confirm(
      `Execute this executive recommendation?\n\n${item.template.title}`
    );

    if (!confirmed) return;

    setExecutingKey(item.key);
    setExecutionMessage("");
    setExecutionError("");

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Executive recommendation execution timed out.")),
        EXECUTION_TIMEOUT_MS
      );
    });

    try {
      const { error } = await Promise.race([
        executeExecutiveActionTemplate({
          template: item.template,
          adminProfile,
        }),
        timeoutPromise,
      ]);

      if (error) {
        setExecutionError(error.message || "Executive recommendation failed.");
        return;
      }

      setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
      setExecutionMessage(`Executed: ${item.template.title}`);

      try {
        await onActionExecuted(item);
      } catch (refreshError) {
        console.warn("Recommendation executed, but refresh failed:", refreshError);
      }
    } catch (error) {
      setExecutionError(error.message || "Executive recommendation crashed.");
    } finally {
      setExecutingKey("");
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
            Executive Recommendations
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            Recommended Actions for {studentName}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Action guidance generated from Student OS risk, opportunity,
            application, offer, CAS, visa, document, task, and university signals.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SummaryPill label="Total" value={summary.total} />
          <SummaryPill label="Critical" value={summary.critical} tone="critical" />
          <SummaryPill label="Executive" value={summary.executive} tone="executive" />
          <SummaryPill label="High" value={summary.high} tone="high" />
          <SummaryPill label="Executable" value={summary.executable} tone="ready" />
          <SummaryPill label="Done" value={summary.executed} tone="done" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ContextPill label="Priority" value={score?.priority_level || "Standard"} />
        <ContextPill label="Category" value={score?.executive_category || "Standard"} />
        <ContextPill label="Journey" value={formatLabel(journeyStage)} />
        <ContextPill label="Risk" value={riskScore} />
        <ContextPill label="Opportunity" value={opportunityScore} />
        <ContextPill label="Student Type" value={score?.student_type || score?.__leadType || "student"} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          label="Document Health"
          value={formatLabel(
            diagnostics.document_health || score.document_health || "unknown"
          )}
          helper={`${number(score.document_readiness_percent)}% readiness`}
          tone={number(score.document_readiness_percent) >= 75 ? "good" : "warning"}
        />
        <SignalCard
          label="Task Health"
          value={formatLabel(diagnostics.task_health || score.task_health || "unknown")}
          helper={`${number(score.overdue_tasks_count)} overdue • ${number(score.pending_tasks_count)} pending`}
          tone={number(score.overdue_tasks_count) > 0 ? "risk" : "good"}
        />
        <SignalCard
          label="University Plan"
          value={
            score.has_balanced_university_plan
              ? "Balanced"
              : number(score.university_plan_count) > 0
              ? "Partial"
              : "Missing"
          }
          helper={`${number(score.university_plan_count)} total • ${number(score.safe_university_count || score.safe_universities_count)} safe`}
          tone={score.has_balanced_university_plan ? "good" : "warning"}
        />
        <SignalCard
          label="Application Flow"
          value={formatLabel(journeyStage)}
          helper={`App: ${formatLabel(score.application_status || "not_started")}`}
          tone={journeyStage.includes("visa") || journeyStage.includes("offer") ? "good" : "neutral"}
        />
      </div>

      {executionMessage ? (
        <StatusBox tone="green" title="Action executed" description={executionMessage} />
      ) : null}

      {executionError ? (
        <StatusBox tone="red" title="Execution issue" description={executionError} />
      ) : null}

      <div className="mt-5 space-y-3">
        {rows.length ? (
          rows.map((item) => (
            <RecommendationCard
              key={item.key}
              item={item}
              previewOpen={previewKey === item.key}
              setPreviewOpen={(open) => setPreviewKey(open ? item.key : "")}
              executing={executingKey === item.key}
              executed={executedKeys[item.key]}
              disabled={Boolean(executingKey)}
              onExecute={() => executeRecommendation(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
            <p className="font-bold text-emerald-200">
              No urgent executive recommendations.
            </p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              This student does not currently show a strong action signal. Keep
              monitoring risk, opportunity, documents, tasks, university plan,
              and journey stage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({
  item,
  previewOpen = false,
  setPreviewOpen = () => {},
  executing = false,
  executed = false,
  disabled = false,
  onExecute = () => {},
}) {
  const { recommendation, template, studentStage, requiresApproval, impactScore } = item;
  const style = getPriorityStyle(recommendation.priority);
  const actionLabel = getActionLabel(recommendation.action || template?.actionType);
  const priorityLabel = recommendation.priority || "standard";

  return (
    <div className={`rounded-2xl border p-4 ${style.wrapper}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />

            <p className="font-bold text-white">{recommendation.title}</p>

            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style.badge}`}>
              {priorityLabel}
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {formatLabel(studentStage)}
            </span>

            {requiresApproval ? (
              <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
                Approval Required
              </span>
            ) : template ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                Ready
              </span>
            ) : (
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                Monitor
              </span>
            )}

            {executed ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                Executed
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {recommendation.description}
          </p>

          {recommendation.type ? (
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">
              Signal: {formatLabel(recommendation.type)}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniStat label="Action" value={actionLabel} />
            <MiniStat label="Impact" value={impactScore} />
            <MiniStat label="Priority Rank" value={item.priorityRank} />
            <MiniStat label="Execution" value={template ? formatLabel(template.actionType) : "Review"} />
          </div>

          {template ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
              >
                {previewOpen ? "Hide Payload" : "Preview Payload"}
              </button>

              <button
                type="button"
                onClick={onExecute}
                disabled={disabled || executed}
                className="rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {executed ? "Executed" : executing ? "Executing..." : actionLabel}
              </button>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            Action
          </p>
          <p className="mt-1 text-xs font-black text-white/80">
            {actionLabel}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/30">
            {requiresApproval ? "Human approval" : template ? "Prepared" : "Monitor"}
          </p>
        </div>
      </div>

      {previewOpen && template ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <PayloadCard title="Template Summary" template={template} />
          <PayloadPreview title="Ready Payload" payload={template.payload || {}} />
        </div>
      ) : null}
    </div>
  );
}

function PayloadCard({ title, template = {} }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>
      <p className="mt-2 font-bold text-white">{template.title || "Untitled"}</p>
      <p className="mt-2 text-sm leading-6 text-white/50">
        {template.description || "No description."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <MiniStat label="Action" value={formatLabel(template.actionType || "review")} />
        <MiniStat label="Approval" value={template.payload?.approval_required ? "Required" : "No"} />
      </div>
    </div>
  );
}

function PayloadPreview({ title, payload = {} }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/55">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}

function SummaryPill({ label, value, tone = "default" }) {
  const className =
    tone === "critical"
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : tone === "executive"
      ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
      : tone === "high"
      ? "border-orange-400/25 bg-orange-500/10 text-orange-200"
      : tone === "ready"
      ? "border-blue-400/25 bg-blue-500/10 text-blue-200"
      : tone === "done"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : "border-white/10 bg-black/20 text-white/55";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${className}`}>
      {value} {label}
    </span>
  );
}

function ContextPill({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-bold text-white/45">
      {label}: <span className="text-white/70">{value}</span>
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
      {label}: <span className="text-white/70">{value}</span>
    </span>
  );
}

function SignalCard({ label, value, helper, tone = "neutral" }) {
  const className =
    tone === "risk"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : tone === "warning"
      ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
      : tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
      : "border-white/10 bg-white/[0.03] text-white/70";

  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-lg font-black">{value}</p>
      {helper ? <p className="mt-1 text-xs leading-5 text-white/45">{helper}</p> : null}
    </div>
  );
}

function StatusBox({ tone = "gold", title, description }) {
  const className =
    tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : tone === "green"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className={`mt-5 rounded-2xl border p-4 ${className}`}>
      <p className="font-bold">{title}</p>
      {description ? <p className="mt-2 text-sm text-white/50">{description}</p> : null}
    </div>
  );
}

export default ExecutiveRecommendationPanel;
