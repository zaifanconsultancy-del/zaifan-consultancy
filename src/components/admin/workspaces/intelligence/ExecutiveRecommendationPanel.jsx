import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, ShieldCheck, Target, Workflow } from "lucide-react";
import { buildExecutiveRecommendations } from "../../../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../../../lib/executiveActionTemplates";
import { executeExecutiveActionTemplate } from "../../../../lib/executiveActionExecutor";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";

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

function getScoreValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
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
      wrapper: "border-[#C2413B]/30 bg-[#FFF0EE]",
      badge: "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]",
      soft: "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]",
      dot: "bg-red-300",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#E9802D]/45 bg-[#FFF3E7]",
      badge: "border-[#E9802D]/40 bg-[#FFF3E7] text-[#B84F0E]",
      soft: "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]",
      dot: "bg-[#E9802D]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-[#A36A18]/30 bg-[#FFF7E8]",
      badge: "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]",
      soft: "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]",
      dot: "bg-orange-300",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-[#243A60]/25 bg-[#F3F5F8]",
      badge: "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]",
      soft: "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]",
      dot: "bg-blue-300",
    };
  }

  return {
    wrapper: "border-[#243A60]/20 bg-white",
    badge: "border-[#243A60]/20 bg-white text-[#7A8392]",
    soft: "border-[#243A60]/20 bg-white text-[#7A8392]",
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
  const [confirmKey, setConfirmKey] = useState("");
  const [lastExecuted, setLastExecuted] = useState(null);
  const executionTokenRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const rows = useMemo(() => buildRecommendationRows(score), [score]);
  const studentName = getStudentName(score);

  const summary = useMemo(() => {
    let critical = 0;
    let executive = 0;
    let high = 0;
    let executable = 0;
    let approval = 0;

    for (const item of rows) {
      const priority = normalize(
        item.recommendation.priority
      );

      if (priority === "critical") critical += 1;
      else if (priority === "executive") executive += 1;
      else if (priority === "high") high += 1;

      if (item.template) executable += 1;
      if (item.requiresApproval) approval += 1;
    }

    return {
      total: rows.length,
      critical,
      executive,
      high,
      executable,
      approval,
      executed: Object.keys(executedKeys).length,
    };
  }, [rows, executedKeys]);

  const diagnostics = score?.diagnostics || {};
  const journeyStage = getJourneyStage(score);
  const riskScore = number(score?.risk_score);
  const opportunityScore = number(score?.opportunity_score);

  const documentReadiness = number(
    getScoreValue(score, "document_readiness_percent")
  );
  const pendingTasks = number(
    getScoreValue(score, "pending_tasks_count")
  );
  const overdueTasks = number(
    getScoreValue(score, "overdue_tasks_count")
  );
  const universityPlanCount = number(
    getScoreValue(score, "university_plan_count")
  );
  const safeUniversityCount = number(
    getScoreValue(score, "safe_university_count")
  );

  const executeRecommendation = async (item) => {
    if (!item?.template || executingKey || executedKeys[item.key]) return;

    // Critical/executive actions use an in-panel confirmation state instead of
    // a blocking browser confirm. Lower-risk prepared actions can execute directly.
    if (item.requiresApproval && confirmKey !== item.key) {
      setConfirmKey(item.key);
      setPreviewKey(item.key);
      setExecutionMessage("");
      setExecutionError("");
      return;
    }

    const executionToken = executionTokenRef.current + 1;
    executionTokenRef.current = executionToken;

    setExecutingKey(item.key);
    setConfirmKey("");
    setExecutionMessage("");
    setExecutionMessage("");
    setExecutionError("");

    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(
        () =>
          reject(
            new Error(
              "Executive recommendation execution timed out."
            )
          ),
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

      if (executionTokenRef.current !== executionToken) return;

      setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
      setLastExecuted({
        key: item.key,
        title: item.template.title,
        action: getActionLabel(item.recommendation.action || item.template.actionType),
        at: new Date().toISOString(),
      });
      setExecutionMessage(`Executed: ${item.template.title}`);

      try {
        await onActionExecuted(item);
      } catch (refreshError) {
        console.warn("Recommendation executed, but refresh failed:", refreshError);
      }
    } catch (error) {
      setExecutionError(error.message || "Executive recommendation crashed.");
    } finally {
      window.clearTimeout(timeoutId);
      setExecutingKey("");
    }
  };

  const actionableRows = rows.filter((item) => item.template && !executedKeys[item.key]);
  const approvalRows = actionableRows.filter((item) => item.requiresApproval);
  const highestImpact = rows.reduce((max, item) => Math.max(max, number(item.impactScore)), 0);
  const executionProgress = summary.executable
    ? Math.round((summary.executed / summary.executable) * 100)
    : 0;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
      className="overflow-hidden rounded-[2rem] border-[3px] border-[#FFB38A] bg-[#FFFDF8] shadow-[0_18px_50px_rgba(23,36,61,0.08)]"
    >
      <div className="grid xl:grid-cols-[1.35fr_0.65fr]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
              <Crown size={11} /> Executive Recommendations
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
              <Workflow size={11} /> Action Engine
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white">
            Recommended Actions for {studentName}
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
            Student OS guidance generated from risk, opportunity, application,
            offer, CAS, visa, document, task, and university signals.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <CommandMetric label="Actions" value={summary.total} />
            <CommandMetric label="Ready" value={actionableRows.length} />
            <CommandMetric label="Approval" value={approvalRows.length} />
            <CommandMetric label="Highest Impact" value={highestImpact} />
          </div>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <div className="flex items-center gap-2">
            <Target size={17} />
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Execution Progress
            </p>
          </div>
          <p className="mt-3 text-5xl font-black text-white">{executionProgress}%</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            {summary.executed} of {summary.executable} executable actions completed
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${executionProgress}%` }}
            />
          </div>
          {lastExecuted ? (
            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              Last action: {lastExecuted.action} · {lastExecuted.title}
            </p>
          ) : (
            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              No recommendation has been executed in this session yet.
            </p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
      <div className="rounded-[1.1rem] border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#61738D]">
          Current recommendation context
        </p>
        <p className="mt-1 text-xs font-bold leading-5 text-[#10233F]">
          {score?.priority_level || "Standard"} priority · {formatLabel(
            score?.executive_category || "standard"
          )} · {formatLabel(journeyStage)} · Risk {riskScore}/100 · Opportunity {opportunityScore}/100
        </p>
      </div>

      <div className="mt-4 grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          label="Document Health"
          value={formatLabel(
            diagnostics.document_health || score.document_health || "unknown"
          )}
          helper={`${documentReadiness}% readiness`}
          tone={documentReadiness >= 75 ? "good" : "warning"}
        />
        <SignalCard
          label="Task Health"
          value={formatLabel(diagnostics.task_health || score.task_health || "unknown")}
          helper={`${overdueTasks} overdue • ${pendingTasks} pending`}
          tone={overdueTasks > 0 ? "risk" : "good"}
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
          helper={`${universityPlanCount} total • ${safeUniversityCount} safe`}
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
              confirmationOpen={confirmKey === item.key}
              onCancelConfirmation={() => setConfirmKey("")}
              onExecute={() => executeRecommendation(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-[#E9802D]/30 bg-[#FFF3E7] p-5">
            <p className="font-bold text-[#B84F0E]">
              No urgent executive recommendations.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#7A8392]">
              This student does not currently show a strong action signal. Keep
              monitoring risk, opportunity, documents, tasks, university plan,
              and journey stage.
            </p>
          </div>
        )}
      </div>
      </div>
    </motion.section>
  );
}

function CommandMetric({ label, value }) {
  return <ZaifanMetricCard level="baby" surface="navy" label={label} value={value} tone="navy" />;
}

function RecommendationCard({
  item,
  previewOpen = false,
  setPreviewOpen = () => {},
  executing = false,
  executed = false,
  disabled = false,
  confirmationOpen = false,
  onCancelConfirmation = () => {},
  onExecute = () => {},
}) {
  const {
    recommendation,
    template,
    studentStage,
    requiresApproval,
    impactScore,
  } = item;

  const style = getPriorityStyle(recommendation.priority);
  const actionLabel = getActionLabel(
    recommendation.action || template?.actionType || "review"
  );
  const priorityLabel = formatLabel(recommendation.priority || "standard");
  const executionState = executed
    ? "Executed"
    : requiresApproval
    ? "Approval required"
    : template
    ? "Prepared"
    : "Monitor";

  return (
    <article
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(23,36,61,0.045)] sm:p-5 ${style.wrapper}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#7A8392]">
            {priorityLabel} · {formatLabel(studentStage)} · {executionState}
          </p>

          <h4 className="mt-1 text-base font-black leading-6 text-[#17243D]">
            {recommendation.title}
          </h4>

          <p className="mt-1.5 text-sm font-semibold leading-6 text-[#667085]">
            {recommendation.description}
          </p>

          {recommendation.type ? (
            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#98A0AE]">
              Signal: {formatLabel(recommendation.type)}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#61738D]">
            <span>Impact {impactScore}</span>
            <span>Priority {item.priorityRank}</span>
            <span>{actionLabel}</span>
          </div>

          {template ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#52677F] transition hover:border-[#FFB38A] hover:bg-[#FFF8EF]"
              >
                {previewOpen ? "Hide details" : "Preview details"}
              </button>

              <button
                type="button"
                onClick={onExecute}
                disabled={disabled || executed}
                className="rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 py-2 text-xs font-black text-white shadow-[0_6px_14px_rgba(255,90,10,0.14)] transition hover:-translate-y-0.5 hover:bg-[#E94F00] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {executed
                  ? "Executed"
                  : executing
                  ? "Executing..."
                  : requiresApproval
                  ? "Review & approve"
                  : actionLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {confirmationOpen && template ? (
        <div className="mt-4 rounded-xl border-[3px] border-[#FFB38A] bg-[#FFF4EA] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[#B84F0E]"
              size={19}
            />
            <div className="min-w-0 flex-1">
              <p className="font-black text-[#17243D]">
                Human approval required
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#667085]">
                Review the prepared payload before creating the real CRM action.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onExecute}
                  disabled={disabled || executed}
                  className="rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                >
                  {executing ? "Executing..." : `Approve & ${actionLabel}`}
                </button>
                <button
                  type="button"
                  onClick={onCancelConfirmation}
                  disabled={executing}
                  className="rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2 text-xs font-black text-[#344054] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen && template ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <PayloadCard title="Template Summary" template={template} />
          <PayloadPreview title="Ready Payload" payload={template.payload || {}} />
        </div>
      ) : null}
    </article>
  );
}

function PayloadCard({ title, template = {} }) {
  return (
    <div className="rounded-xl border border-[#243A60]/20 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {title}
      </p>
      <p className="mt-2 font-bold text-[#17243D]">{template.title || "Untitled"}</p>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
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
    <div className="rounded-xl border border-[#243A60]/20 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {title}
      </p>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[#667085]">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}





function MiniStat({ label, value }) {
  return <ZaifanMetricCard level="baby" label={label} value={value} tone="slate" />;
}

function SignalCard({ label, value, helper, tone = "neutral" }) {
  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={helper}
      tone={toZaifanMetricTone(tone)}
      className="h-full"
    />
  );
}

function StatusBox({ tone = "gold", title, description }) {
  const className =
    tone === "red"
      ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
      : tone === "green"
      ? "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]"
      : "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]";

  return (
    <div className={`mt-5 rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${className}`}>
      <p className="font-bold">{title}</p>
      {description ? <p className="mt-2 text-sm text-[#667085]">{description}</p> : null}
    </div>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (
    value.includes("blue") ||
    value.includes("cyan") ||
    value.includes("teal") ||
    value.includes("info")
  ) return "blue";
  if (
    value.includes("slate") ||
    value.includes("gray") ||
    value.includes("grey") ||
    value.includes("muted") ||
    value.includes("neutral") ||
    value.includes("default")
  ) return "slate";

  return "navy";
}

export default ExecutiveRecommendationPanel;