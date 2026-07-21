import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { getExecutiveScoreSummary } from "../../lib/executivePortfolioGenerator";
import {
  buildExecutiveVerificationSnapshot,
  buildExecutiveRecoveryActions,
  buildBrokenWorkflowScannerSnapshot,
  buildWorkflowIntegrityScore,
  generateProductionReadinessReport,
} from "../../lib/platformVerificationEngine";

const toLower = (value) => String(value || "").toLowerCase().trim();

const formatLabel = (value = "") => {
  const clean = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (!clean) return "Unknown";

  return clean
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatDate = (value) => {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Invalid date";
  }
};

const percent = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
};

const getLogTime = (item = {}) =>
  item.executed_at ||
  item.created_at ||
  item.generated_at ||
  item.updated_at ||
  item.approved_at ||
  item.rejected_at;

const getStatus = (item = {}) =>
  toLower(item.status || item.execution_status || item.approval_status);

const isFailed = (item = {}) => {
  const status = getStatus(item);

  return (
    status.includes("failed") ||
    status.includes("error") ||
    Boolean(item.error_message || item.error || item.failure_reason)
  );
};

const isPending = (item = {}) => {
  const status = getStatus(item);

  return (
    status.includes("pending") ||
    status.includes("queued") ||
    status.includes("waiting") ||
    status.includes("approval")
  );
};

const isSuccess = (item = {}) => {
  const status = getStatus(item);

  return (
    status.includes("success") ||
    status.includes("executed") ||
    status.includes("completed") ||
    status.includes("approved")
  );
};

const getStudentName = (item = {}) =>
  item.student_name ||
  item.full_name ||
  item.name ||
  item.student_email ||
  item.email ||
  "Unknown student";

const getActionName = (item = {}) =>
  item.action_type ||
  item.template_key ||
  item.recommendation_type ||
  item.title ||
  item.type ||
  "Executive Automation Action";

function ExecutiveAutomationControlCenter({
  adminProfile = null,
  executiveExecutionLogs = [],
  automationQueue = [],
  executiveActionQueue = [],
  platformScores = [],
}) {
  const [logs, setLogs] = useState(executiveExecutionLogs);
  const [queueRows, setQueueRows] = useState([
    ...automationQueue,
    ...executiveActionQueue,
  ]);
  const [scores, setScores] = useState(platformScores);
  const [scoreSummary, setScoreSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAutomationData = async () => {
    setLoading(true);
    setError("");

    try {
      const [logsResult, queueResult, scoresResult] = await Promise.allSettled([
        supabase
          .from("executive_execution_logs")
          .select("*")
          .order("executed_at", { ascending: false })
          .limit(150),

        supabase
          .from("executive_action_queue")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(150),

        getExecutiveScoreSummary(),
      ]);

      if (logsResult.status === "fulfilled") {
        if (logsResult.value.error) {
          console.warn(
            "Executive execution logs fetch warning:",
            logsResult.value.error
          );
        } else {
          setLogs(logsResult.value.data || []);
        }
      }

      if (queueResult.status === "fulfilled") {
        if (queueResult.value.error) {
          console.warn("Executive action queue fetch warning:", queueResult.value.error);
        } else {
          setQueueRows(queueResult.value.data || []);
        }
      }

      if (scoresResult.status === "fulfilled") {
        if (scoresResult.value?.error) {
          console.warn("Executive score summary fetch warning:", scoresResult.value.error);
        } else {
          setScores(scoresResult.value?.scores || []);
          setScoreSummary(scoresResult.value || null);
        }
      }
    } catch (err) {
      console.error("Automation Control Center load failed:", err);
      setError(err.message || "Automation Control Center failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (executiveExecutionLogs.length) {
      setLogs(executiveExecutionLogs);
    }
  }, [executiveExecutionLogs]);

  useEffect(() => {
    const nextQueue = [...automationQueue, ...executiveActionQueue];

    if (nextQueue.length) {
      setQueueRows(nextQueue);
    }
  }, [automationQueue, executiveActionQueue]);

  useEffect(() => {
    if (platformScores.length) {
      setScores(platformScores);
    }
  }, [platformScores]);

  useEffect(() => {
    loadAutomationData();
  }, []);

  const automation = useMemo(() => {
    const successful = logs.filter(isSuccess);
    const failed = logs.filter(isFailed);
    const pending = logs.filter(isPending);

    const duplicateBlocked = logs.filter(
      (log) => log.duplicate_detected || log.duplicate_blocked
    );

    const approved = logs.filter((log) =>
      toLower(log.approval_status || log.status).includes("approved")
    );

    const rejected = logs.filter((log) =>
      toLower(log.approval_status || log.status).includes("rejected")
    );

    const queued = queueRows.filter((row) => isPending(row));
    const failedQueue = queueRows.filter((row) => isFailed(row));

    const sortedLogs = [...logs].sort((a, b) => {
      const aTime = new Date(getLogTime(a) || 0).getTime();
      const bTime = new Date(getLogTime(b) || 0).getTime();

      return bTime - aTime;
    });

    const actionTypes = logs.reduce((acc, item) => {
      const key = getActionName(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topActionTypes = Object.entries(actionTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    const totalDecisions = approved.length + rejected.length;

    return {
      successful,
      failed,
      pending,
      duplicateBlocked,
      approved,
      rejected,
      queued,
      failedQueue,
      sortedLogs,
      topActionTypes,
      successRate: percent(successful.length, successful.length + failed.length),
      failureRate: percent(failed.length, successful.length + failed.length),
      approvalRate: percent(approved.length, totalDecisions),
      rejectionRate: percent(rejected.length, totalDecisions),
      pressure:
        failed.length +
        pending.length +
        duplicateBlocked.length +
        queued.length +
        failedQueue.length,
    };
  }, [logs, queueRows]);

  const verificationDataset = useMemo(() => {
    if (scores.length) return scores;
    if (queueRows.length) return queueRows;
    return logs;
  }, [scores, queueRows, logs]);

  const verificationSnapshot = useMemo(
    () => buildExecutiveVerificationSnapshot(verificationDataset),
    [verificationDataset]
  );

  const workflowScanner = useMemo(
    () => buildBrokenWorkflowScannerSnapshot(verificationDataset),
    [verificationDataset]
  );

  const workflowIntegrity = useMemo(
    () => buildWorkflowIntegrityScore(verificationDataset),
    [verificationDataset]
  );

  const productionReadiness = useMemo(
    () => generateProductionReadinessReport(verificationDataset),
    [verificationDataset]
  );

  const recoveryEngine = useMemo(
    () => buildExecutiveRecoveryActions(verificationDataset),
    [verificationDataset]
  );

  const launchBlockers = productionReadiness.launchBlockers || [];
  const criticalIssues = productionReadiness.criticalIssues || [];
  const brokenWorkflows = workflowScanner.brokenWorkflows || workflowScanner.issues || [];
  const readinessScore = productionReadiness.readinessScore || 0;
  const integrityScore = workflowIntegrity.overallIntegrity || 0;

  const kpis = [
    {
      title: "Pending Approvals",
      value: automation.pending.length + automation.queued.length,
      note: "Waiting for human or queue decision",
      icon: "⏳",
      color: "text-[#8A5611]",
      tone: "orange",
    },
    {
      title: "Successful Executions",
      value: automation.successful.length,
      note: `${automation.successRate}% success rate`,
      icon: "✅",
      color: "text-[#B84F0E]",
      tone: "green",
    },
    {
      title: "Failed Executions",
      value: automation.failed.length + automation.failedQueue.length,
      note: `${automation.failureRate}% failure pressure`,
      icon: "🚨",
      color: "text-[#A8342F]",
      tone: "red",
    },
    {
      title: "Duplicates Blocked",
      value: automation.duplicateBlocked.length,
      note: "Duplicate protection monitor",
      icon: "🛡️",
      color: "text-[#243A60]",
      tone: "blue",
    },
    {
      title: "Approved Actions",
      value: automation.approved.length,
      note: `${automation.approvalRate}% approval rate`,
      icon: "🧑‍⚖️",
      color: "text-[#243A60]",
      tone: "purple",
    },
    {
      title: "Workflow Integrity",
      value: `${integrityScore}%`,
      note: `${workflowScanner.totalBrokenWorkflows || brokenWorkflows.length || 0} broken workflows`,
      icon: "🧭",
      color: integrityScore >= 75 ? "text-[#B84F0E]" : "text-[#8A5611]",
      tone: integrityScore >= 75 ? "green" : "orange",
    },
    {
      title: "Production Readiness",
      value: `${readinessScore}%`,
      note: formatLabel(productionReadiness.goLiveStatus || "not_ready"),
      icon: "🚀",
      color: readinessScore >= 75 ? "text-[#B84F0E]" : "text-[#A8342F]",
      tone: readinessScore >= 75 ? "green" : "red",
    },
    {
      title: "Launch Blockers",
      value: launchBlockers.length,
      note: `${criticalIssues.length} critical issues`,
      icon: "🛑",
      color: launchBlockers.length ? "text-[#A8342F]" : "text-[#B84F0E]",
      tone: launchBlockers.length ? "red" : "green",
    },
    {
      title: "Automation Pressure",
      value: automation.pressure,
      note: "Total queue + failure load",
      icon: "⚙️",
      color: "text-[#B84F0E]",
      tone: "gold",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#FFF1E3] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
              Executive Automation Control
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.025em] text-[#17243D]">
              Automation Command Center
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#667085]">
              Approval queue, failed automation recovery, duplicate protection,
              execution timeline, retry planning, and automation health monitoring
              for the Student OS executive layer.
            </p>

            <p className="mt-2 text-xs text-[#8992A1]">
              Operator:{" "}
              <span className="font-bold text-[#B84F0E]">
                {adminProfile?.full_name || adminProfile?.name || "Zaifan Admin"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadAutomationData}
            disabled={loading}
            className="rounded-full border border-[#E9802D]/45 bg-[#FFF1E3] px-5 py-2 text-sm font-bold text-[#B84F0E] transition hover:bg-[#E9802D] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Reload Automation"}
          </button>
        </div>

        {error ? (
          <div className="relative mt-5 rounded-2xl border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm text-[#A8342F]">
            {error}
          </div>
        ) : null}

        <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-9">
          {kpis.map((item, index) => (
            <MetricCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>

      <ExecutiveLaunchCenter
        productionReadiness={productionReadiness}
        workflowIntegrity={workflowIntegrity}
        workflowScanner={workflowScanner}
        verificationSnapshot={verificationSnapshot}
        recoveryEngine={recoveryEngine}
        scoreSummary={scoreSummary}
      />

      <CommandPanel
  eyebrow="Platform Recovery"
  title="Verification Recovery Queue"
  description="Students requiring automated recovery workflows."
>
  <div className="grid gap-3 md:grid-cols-4">
    <SmallMetric label="Critical Recovery" value={verificationSnapshot.criticalRecovery} />
    <SmallMetric label="High Recovery" value={verificationSnapshot.highRecovery} />
    <SmallMetric label="Broken Stages" value={verificationSnapshot.failures.length} />
    <SmallMetric label="Recovery Queue" value={verificationSnapshot.recoveryQueue.length} />
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-5">
    <SmallMetric label="CAS Recovery" value={recoveryEngine.casQueue.length} />
    <SmallMetric label="Visa Recovery" value={recoveryEngine.visaQueue.length} />
    <SmallMetric label="Payment Recovery" value={recoveryEngine.paymentQueue.length} />
    <SmallMetric label="Portal Recovery" value={recoveryEngine.portalQueue.length} />
    <SmallMetric label="Recovery Actions" value={recoveryEngine.totalActions} />
  </div>
</CommandPanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <CommandPanel
          eyebrow="Approval Command"
          title="Approval Queue"
          description="Actions waiting for human approval, queued execution, or decision."
        >
          {automation.pending.length || automation.queued.length ? (
            <div className="space-y-3">
              {[...automation.pending, ...automation.queued]
                .slice(0, 10)
                .map((item, index) => (
                  <AutomationRow
                    key={item.id || `pending-${index}`}
                    item={item}
                    index={index}
                    type="pending"
                  />
                ))}
            </div>
          ) : (
            <EmptyState text="No pending approvals or queued actions." />
          )}
        </CommandPanel>

        <CommandPanel
          eyebrow="Recovery Center"
          title="Failed Automation Recovery"
          description="Failed executions and queue items that need retry, investigation, or cleanup."
        >
          {automation.failed.length || automation.failedQueue.length ? (
            <div className="space-y-3">
              {[...automation.failed, ...automation.failedQueue]
                .slice(0, 10)
                .map((item, index) => (
                  <AutomationRow
                    key={item.id || `failed-${index}`}
                    item={item}
                    index={index}
                    type="failed"
                  />
                ))}
            </div>
          ) : (
            <EmptyState text="No failed automations detected." />
          )}
        </CommandPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <CommandPanel
          eyebrow="Protection Monitor"
          title="Duplicate Protection"
          description="Blocked duplicate actions and spam-prevention events."
        >
          {automation.duplicateBlocked.length ? (
            <div className="space-y-3">
              {automation.duplicateBlocked.slice(0, 8).map((item, index) => (
                <AutomationRow
                  key={item.id || `duplicate-${index}`}
                  item={item}
                  index={index}
                  type="duplicate"
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No duplicate actions blocked yet." />
          )}
        </CommandPanel>

        <CommandPanel
          eyebrow="Execution Timeline"
          title="Executive Operations Feed"
          description="Latest automation execution events across tasks, reminders, email, WhatsApp, approvals, failures, and duplicate prevention."
        >
          {automation.sortedLogs.length ? (
            <div className="space-y-3">
              {automation.sortedLogs.slice(0, 14).map((item, index) => (
                <AutomationRow
                  key={item.id || `log-${index}`}
                  item={item}
                  index={index}
                  type="timeline"
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No execution logs loaded yet." />
          )}
        </CommandPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <CommandPanel
          eyebrow="Automation Analytics"
          title="Performance Breakdown"
          description="Simple performance distribution for leadership review."
        >
          <div className="space-y-4">
            <ProgressRow
              label="Success Rate"
              value={automation.successRate}
              detail={`${automation.successful.length} successful executions`}
              tone="green"
            />
            <ProgressRow
              label="Failure Rate"
              value={automation.failureRate}
              detail={`${automation.failed.length} failed executions`}
              tone="red"
            />
            <ProgressRow
              label="Approval Rate"
              value={automation.approvalRate}
              detail={`${automation.approved.length} approved actions`}
              tone="gold"
            />
            <ProgressRow
              label="Rejection Rate"
              value={automation.rejectionRate}
              detail={`${automation.rejected.length} rejected actions`}
              tone="orange"
            />
          </div>
        </CommandPanel>

        <CommandPanel
          eyebrow="Action Types"
          title="Automation Mix"
          description="Most common automation actions executed by the executive layer."
        >
          {automation.topActionTypes.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {automation.topActionTypes.map((item) => (
                <SmallMetric
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No action type distribution available yet." />
          )}
        </CommandPanel>
      </div>
    </div>
  );
}


function ExecutiveLaunchCenter({
  productionReadiness = {},
  workflowIntegrity = {},
  workflowScanner = {},
  verificationSnapshot = {},
  recoveryEngine = {},
  scoreSummary = null,
}) {
  const readinessScore = productionReadiness.readinessScore || 0;
  const integrityScore = workflowIntegrity.overallIntegrity || 0;
  const goLiveStatus = productionReadiness.goLiveStatus || "not_ready";
  const launchBlockers = productionReadiness.launchBlockers || [];
  const criticalIssues = productionReadiness.criticalIssues || [];
  const brokenWorkflows = workflowScanner.brokenWorkflows || workflowScanner.issues || [];
  const severityBreakdown = workflowScanner.severityBreakdown || {};
  const totalBroken = workflowScanner.totalBrokenWorkflows || brokenWorkflows.length || 0;
  const recoveryQueue = verificationSnapshot.recoveryQueue || [];
  const totalRecoveryActions = recoveryEngine.totalActions || recoveryEngine.totals?.total || recoveryQueue.length || 0;

  const launchTone =
    goLiveStatus === "ready" || readinessScore >= 85
      ? "green"
      : readinessScore >= 70
      ? "orange"
      : "red";

  const topIssues = [
    ...launchBlockers.map((issue) => ({ ...issue, source: "Launch Blocker" })),
    ...criticalIssues.map((issue) => ({ ...issue, source: "Critical Issue" })),
    ...brokenWorkflows.slice(0, 6).map((issue) => ({ ...issue, source: "Broken Workflow" })),
  ].slice(0, 10);

  return (
    <CommandPanel
      eyebrow="Executive Launch Center"
      title="Production readiness, go-live status, and workflow blockers"
      description="V4 verification layer for deciding whether the executive automation system is ready for production launch or needs recovery first."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <SmallMetric label="Readiness Score" value={`${readinessScore}%`} />
        <SmallMetric label="Go Live Status" value={formatLabel(goLiveStatus)} />
        <SmallMetric label="Workflow Integrity" value={`${integrityScore}%`} />
        <SmallMetric label="Launch Blockers" value={launchBlockers.length} />
        <SmallMetric label="Critical Failures" value={criticalIssues.length || severityBreakdown.critical || 0} />
        <SmallMetric label="Recovery Actions" value={totalRecoveryActions} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className={`rounded-[1.5rem] border shadow-[0_10px_24px_rgba(23,36,61,0.05)] p-5 ${getToneStyle(launchTone)}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
            Launch Decision
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.025em] text-[#17243D]">
            {formatLabel(goLiveStatus)}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#7A8392]">
            {readinessScore >= 85
              ? "System is trending launch-ready. Keep monitoring failed automations and critical queue items."
              : readinessScore >= 70
              ? "System is close, but launch should wait until high-risk blockers and broken workflows are reduced."
              : "System needs recovery before clean launch. Resolve blockers, critical failures, and broken workflows first."}
          </p>

          <div className="mt-5 space-y-4">
            <ProgressRow
              label="Production Readiness"
              value={readinessScore}
              detail={`${launchBlockers.length} launch blockers detected`}
              tone={readinessScore >= 75 ? "green" : "red"}
            />
            <ProgressRow
              label="Workflow Integrity"
              value={integrityScore}
              detail={`${totalBroken} broken workflows detected`}
              tone={integrityScore >= 75 ? "green" : "orange"}
            />
          </div>
        </div>

        <div className="rounded-[1.5rem] border shadow-[0_10px_24px_rgba(23,36,61,0.05)] border-[#C2413B]/30 bg-[#FFF0EE] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A8342F]/80">
                Launch Blocker Feed
              </p>
              <h4 className="mt-1 font-black text-[#17243D]">What must be fixed before clean go-live</h4>
            </div>
            <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-xs font-black text-[#667085]">
              {scoreSummary?.total || 0} scored records
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {topIssues.length ? (
              topIssues.map((issue, index) => (
                <LaunchIssueRow
                  key={issue.id || `${issue.title || issue.source}-${index}`}
                  issue={issue}
                />
              ))
            ) : (
              <EmptyState text="No launch blockers or critical workflow failures detected." />
            )}
          </div>
        </div>
      </div>
    </CommandPanel>
  );
}

function LaunchIssueRow({ issue = {} }) {
  const severity = issue.severity || issue.priority || "medium";
  const tone =
    severity === "critical" || severity === "urgent"
      ? "red"
      : severity === "high"
      ? "orange"
      : "blue";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${getToneStyle(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#17243D]">
            {issue.title || issue.issue || issue.source || "Workflow Issue"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#7A8392]">
            {issue.student_name ? `${issue.student_name} • ` : ""}
            {issue.description || issue.detail || issue.message || "No issue detail available."}
          </p>
        </div>
        <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#667085]">
          {formatLabel(severity)}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-[1.5rem] border shadow-[0_10px_24px_rgba(23,36,61,0.05)] p-4 ${getToneStyle(item.tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
            {item.title}
          </p>

          <p className={`mt-3 text-3xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>

        <span className="text-2xl">{item.icon}</span>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#7A8392]">{item.note}</p>
    </motion.div>
  );
}

function CommandPanel({ eyebrow, title, description, children }) {
  return (
    <div className="rounded-[1.75rem] border shadow-[0_12px_28px_rgba(23,36,61,0.05)] border-[#243A60]/18 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B84F0E]">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-black text-[#17243D]">{title}</h3>

      {description ? (
        <p className="mt-1 text-sm leading-6 text-[#7A8392]">{description}</p>
      ) : null}

      <div className="mt-5">{children}</div>
    </div>
  );
}

function AutomationRow({ item = {}, index, type = "timeline" }) {
  const failed = isFailed(item);
  const pending = isPending(item);
  const duplicate = item.duplicate_detected || item.duplicate_blocked;
  const success = isSuccess(item);

  const statusClass = failed
    ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
    : pending
    ? "border-[#A36A18]/28 bg-[#FFF7E8] text-[#8A5611]"
    : duplicate || type === "duplicate"
    ? "border-[#243A60]/24 bg-[#F3F5F8] text-[#243A60]"
    : success
    ? "border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]"
    : "border-[#243A60]/18 bg-white text-[#7A8392]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="rounded-2xl border border-[#243A60]/18 bg-white p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-black text-[#17243D]">{getActionName(item)}</p>

          <p className="mt-1 text-xs text-[#7A8392]">
            {getStudentName(item)} • {item.student_type || "student"} •{" "}
            {formatDate(getLogTime(item))}
          </p>

          {(item.error_message || item.error || item.failure_reason) && (
            <p className="mt-2 line-clamp-2 text-xs text-[#A8342F]">
              {item.error_message || item.error || item.failure_reason}
            </p>
          )}

          {item.target_table || item.target_id ? (
            <p className="mt-2 text-[11px] text-[#8992A1]">
              Target: {item.target_table || "unknown"} / {item.target_id || "no id"}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClass}`}
          >
            {item.status || item.execution_status || item.approval_status || "tracked"}
          </span>

          {item.priority && (
            <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#B84F0E]">
              {item.priority}
            </span>
          )}

          {duplicate && (
            <span className="rounded-full border border-[#243A60]/24 bg-[#F3F5F8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#243A60]">
              Duplicate Protected
            </span>
          )}
        </div>
      </div>

      {(failed || pending) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionChip label="Retry" tone="gold" />
          <ActionChip label="Investigate" tone="blue" />
          <ActionChip label="Dismiss" tone="red" />
        </div>
      )}
    </motion.div>
  );
}

function ProgressRow({ label, value, detail, tone = "gold" }) {
  const clean = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[#17243D]">{label}</span>
        <span className="font-black text-[#B84F0E]">{clean}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${getProgressTone(tone)}`}
          style={{ width: `${clean}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-[#7A8392]">{detail}</p>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-4">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-[#8992A1]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#17243D]">{value}</p>
    </div>
  );
}

function ActionChip({ label, tone = "default" }) {
  const toneClass =
    tone === "red"
      ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
      : tone === "blue"
      ? "border-[#243A60]/24 bg-[#F3F5F8] text-[#243A60]"
      : tone === "gold"
      ? "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]"
      : "border-[#243A60]/18 bg-white text-[#7A8392]";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#243A60]/18 bg-white p-5 text-sm text-[#7A8392]">
      {text}
    </p>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-[#C2413B]/32 bg-[#FFF0EE]";
  if (tone === "orange") return "border-[#A36A18]/30 bg-[#FFF7E8]";
  if (tone === "green") return "border-[#E9802D]/35 bg-[#FFF1E3]";
  if (tone === "gold") return "border-[#E9802D]/40 bg-[#FFF1E3]";
  if (tone === "blue") return "border-[#243A60]/25 bg-[#F3F5F8]";
  if (tone === "purple") return "border-[#243A60]/25 bg-[#F3F5F8]";
  return "border-[#243A60]/18 bg-white";
}

function getProgressTone(tone = "") {
  if (tone === "red") return "bg-red-400";
  if (tone === "orange") return "bg-orange-400";
  if (tone === "green") return "bg-emerald-400";
  if (tone === "blue") return "bg-blue-400";
  return "bg-[#E9802D]";
}

export default ExecutiveAutomationControlCenter;