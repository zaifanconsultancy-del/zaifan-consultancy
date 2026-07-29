import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../../lib/supabaseClient";
import { getExecutiveScoreSummary } from "../../../../lib/executivePortfolioGenerator";
import {
  buildExecutiveVerificationSnapshot,
  buildExecutiveRecoveryActions,
  buildBrokenWorkflowScannerSnapshot,
  buildWorkflowIntegrityScore,
  generateProductionReadinessReport,
} from "../../../../lib/platformVerificationEngine";

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

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  const [collapsedPanels, setCollapsedPanels] = useState({});
  const [expandedRows, setExpandedRows] = useState({});

  const togglePanel = (key) =>
    setCollapsedPanels((current) => ({ ...current, [key]: !current[key] }));

  const toggleRow = (key) =>
    setExpandedRows((current) => ({ ...current, [key]: !current[key] }));

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
      <div className="relative overflow-hidden rounded-[2rem] border-[3px] border-[#E9802D]/45 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#FFF1E3] blur-3xl" />

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

        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
  panelKey="verification-recovery"
  tone="navy"
  eyebrow="Platform Recovery"
  title="Verification Recovery Queue"
  description="Students requiring automated recovery workflows."
  collapsed={collapsedPanels["verification-recovery"]}
  onToggle={() => togglePanel("verification-recovery")}
>
  <div className="grid gap-3 md:grid-cols-4">
    <SmallMetric label="Critical Recovery" value={verificationSnapshot?.criticalRecovery || 0} />
    <SmallMetric label="High Recovery" value={verificationSnapshot?.highRecovery || 0} />
    <SmallMetric label="Broken Stages" value={verificationSnapshot?.failures?.length || 0} />
    <SmallMetric label="Recovery Queue" value={verificationSnapshot?.recoveryQueue?.length || 0} />
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-5">
    <SmallMetric label="CAS Recovery" value={recoveryEngine?.casQueue?.length || 0} />
    <SmallMetric label="Visa Recovery" value={recoveryEngine?.visaQueue?.length || 0} />
    <SmallMetric label="Payment Recovery" value={recoveryEngine?.paymentQueue?.length || 0} />
    <SmallMetric label="Portal Recovery" value={recoveryEngine?.portalQueue?.length || 0} />
    <SmallMetric label="Recovery Actions" value={recoveryEngine?.totalActions || 0} />
  </div>
</CommandPanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <CommandPanel
          panelKey="approval-queue"
          tone="orange"
          eyebrow="Approval Command"
          title="Approval Queue"
          description="Actions waiting for human approval, queued execution, or decision."
          collapsed={collapsedPanels["approval-queue"]}
          onToggle={() => togglePanel("approval-queue")}
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
                   rowKey={String(item.id || `pending-${index}`)} expanded={Boolean(expandedRows[String(item.id || `pending-${index}`)])} onToggle={() => toggleRow(String(item.id || `pending-${index}`))} />
                ))}
            </div>
          ) : (
            <EmptyState text="No pending approvals or queued actions." />
          )}
        </CommandPanel>

        <CommandPanel
          panelKey="failed-recovery"
          tone="red"
          eyebrow="Recovery Center"
          title="Failed Automation Recovery"
          description="Failed executions and queue items that need retry, investigation, or cleanup."
          collapsed={collapsedPanels["failed-recovery"]}
          onToggle={() => togglePanel("failed-recovery")}
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
                   rowKey={String(item.id || `failed-${index}`)} expanded={Boolean(expandedRows[String(item.id || `failed-${index}`)])} onToggle={() => toggleRow(String(item.id || `failed-${index}`))} />
                ))}
            </div>
          ) : (
            <EmptyState text="No failed automations detected." />
          )}
        </CommandPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <CommandPanel
          panelKey="duplicate-protection"
          tone="blue"
          eyebrow="Protection Monitor"
          title="Duplicate Protection"
          description="Blocked duplicate actions and spam-prevention events."
          collapsed={collapsedPanels["duplicate-protection"]}
          onToggle={() => togglePanel("duplicate-protection")}
        >
          {automation.duplicateBlocked.length ? (
            <div className="space-y-3">
              {automation.duplicateBlocked.slice(0, 8).map((item, index) => (
                <AutomationRow
                  key={item.id || `duplicate-${index}`}
                  item={item}
                  index={index}
                  type="duplicate"
                 rowKey={String(item.id || `duplicate-${index}`)} expanded={Boolean(expandedRows[String(item.id || `duplicate-${index}`)])} onToggle={() => toggleRow(String(item.id || `duplicate-${index}`))} />
              ))}
            </div>
          ) : (
            <EmptyState text="No duplicate actions blocked yet." />
          )}
        </CommandPanel>

        <CommandPanel
          panelKey="operations-feed"
          tone="navy"
          eyebrow="Execution Timeline"
          title="Executive Operations Feed"
          description="Latest automation execution events across tasks, reminders, email, WhatsApp, approvals, failures, and duplicate prevention."
          collapsed={collapsedPanels["operations-feed"]}
          onToggle={() => togglePanel("operations-feed")}
        >
          {automation.sortedLogs.length ? (
            <div className="space-y-3">
              {automation.sortedLogs.slice(0, 14).map((item, index) => (
                <AutomationRow
                  key={item.id || `log-${index}`}
                  item={item}
                  index={index}
                  type="timeline"
                 rowKey={String(item.id || `log-${index}`)} expanded={Boolean(expandedRows[String(item.id || `log-${index}`)])} onToggle={() => toggleRow(String(item.id || `log-${index}`))} />
              ))}
            </div>
          ) : (
            <EmptyState text="No execution logs loaded yet." />
          )}
        </CommandPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <CommandPanel
          panelKey="performance"
          tone="orange"
          eyebrow="Automation Analytics"
          title="Performance Breakdown"
          description="Leadership health view of execution quality, failures, approvals, and rejection pressure."
          collapsed={collapsedPanels["performance"]}
          onToggle={() => togglePanel("performance")}
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
          panelKey="automation-mix"
          tone="green"
          eyebrow="Action Types"
          title="Automation Mix"
          description="Most common automation actions executed by the executive layer."
          collapsed={collapsedPanels["automation-mix"]}
          onToggle={() => togglePanel("automation-mix")}
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
      tone="navy"
      eyebrow="Executive Launch Center"
      title="Production readiness, go-live status, and workflow blockers"
      description="V4 verification layer for deciding whether the executive automation system is ready for production launch or needs recovery first."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
  const toneMap = {
    red: "border-[#FF8F96] bg-[#FFF4F4]",
    orange: "border-[#FFAA63] bg-[#FFF8F1]",
    green: "border-[#57DDA8] bg-[#EEFCF5]",
    gold: "border-[#F5BD3D] bg-[#FFFAE9]",
    blue: "border-[#AFC7E4] bg-[#F1F6FC]",
    purple: "border-[#B9A7FF] bg-[#F6F3FF]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.035 }}
      className={`min-w-0 rounded-[1.65rem] border-[2px] p-5 shadow-[0_12px_28px_rgba(23,36,61,0.055)] ${toneMap[item.tone] || toneMap.blue}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-[#536783]">
          {item.title}
        </p>
        <span className="shrink-0 text-xl" aria-hidden="true">{item.icon}</span>
      </div>
      <p className={`mt-4 break-words text-[2rem] font-black leading-none tracking-[-0.04em] ${item.color}`}>
        {item.value}
      </p>
      <p className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-[#60708A]">{item.note}</p>
    </motion.div>
  );
}

function CommandPanel({
  panelKey,
  eyebrow,
  title,
  description,
  children,
  tone = "default",
  collapsed = false,
  onToggle,
}) {
  const tones = {
    navy: "border-[#173F6B] bg-[#FFFDF8]",
    orange: "border-[#FF8A35] bg-[#FFFDF8]",
    red: "border-[#FF8F96] bg-[#FFFDF8]",
    blue: "border-[#7EA9D8] bg-[#FFFDF8]",
    green: "border-[#57DDA8] bg-[#FFFDF8]",
    default: "border-[#C8D5E4] bg-[#FFFDF8]",
  };

  return (
    <section className={`overflow-hidden rounded-[2rem] border-[2px] shadow-[0_16px_38px_rgba(23,36,61,0.07)] ${tones[tone] || tones.default}`}>
      <div className={`flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
        tone === "navy" ? "bg-[#173F6B]" : "bg-[#FFF9F2]"
      }`}>
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${tone === "navy" ? "text-[#FFB06E]" : "text-[#C84A10]"}`}>
            {eyebrow}
          </p>
          <h3 className={`mt-1 text-xl font-black ${tone === "navy" ? "text-white" : "text-[#10233F]"}`}>{title}</h3>
          {description ? (
            <p className={`mt-1 max-w-3xl text-sm font-semibold leading-5 ${tone === "navy" ? "text-white/80" : "text-[#65748B]"}`}>
              {description}
            </p>
          ) : null}
        </div>

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-controls={panelKey}
            className={`shrink-0 rounded-xl border-2 px-4 py-2 text-xs font-black transition ${
              tone === "navy"
                ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                : "border-[#FF9A52] bg-white text-[#B83C0A] hover:bg-[#FFF1E5]"
            }`}
          >
            {collapsed ? "Show section" : "Hide section"}
          </button>
        ) : null}
      </div>

      {!collapsed ? <div id={panelKey} className="border-t border-[#D8E1EB] p-5">{children}</div> : null}
    </section>
  );
}

function AutomationRow({
  item = {},
  index,
  type = "timeline",
  rowKey,
  expanded = false,
  onToggle,
}) {
  const failed = isFailed(item);
  const pending = isPending(item);
  const duplicate = item.duplicate_detected || item.duplicate_blocked;
  const success = isSuccess(item);
  const errorText = item.error_message || item.error || item.failure_reason;
  const status = item.status || item.execution_status || item.approval_status || "tracked";

  const accent = failed
    ? "border-l-[#D64545]"
    : pending
    ? "border-l-[#F59E0B]"
    : duplicate || type === "duplicate"
    ? "border-l-[#315D8A]"
    : success
    ? "border-l-[#12A66A]"
    : "border-l-[#FF6B18]";

  const statusClass = failed
    ? "border-[#FF9EA3] bg-[#FFF1F1] text-[#A51D28]"
    : pending
    ? "border-[#F4C45B] bg-[#FFF8DF] text-[#87560A]"
    : duplicate || type === "duplicate"
    ? "border-[#AFC7E4] bg-[#EFF5FB] text-[#173F6B]"
    : success
    ? "border-[#65D9AB] bg-[#ECFBF4] text-[#087A52]"
    : "border-[#FFAA63] bg-[#FFF4E9] text-[#B83C0A]";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.2) }}
      className={`overflow-hidden rounded-[1.35rem] border-2 border-[#CBD8E6] border-l-[6px] bg-white shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${accent}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-words text-[15px] font-black leading-5 text-[#10233F]">
                {getActionName(item)}
              </p>
              <span className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${statusClass}`}>
                {formatLabel(status)}
              </span>
              {item.priority ? (
                <span className="rounded-full border-2 border-[#FFAA63] bg-[#FFF5EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#B83C0A]">
                  {formatLabel(item.priority)}
                </span>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <RowMeta label="Student" value={getStudentName(item)} />
              <RowMeta label="Record Type" value={formatLabel(item.student_type || "student")} />
              <RowMeta label="Event Time" value={formatDate(getLogTime(item))} />
            </div>
          </div>

          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded-xl border-2 border-[#B8C9DC] bg-[#F5F8FC] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#173F6B] hover:border-[#FF9A52] hover:bg-[#FFF4E9]"
            >
              {expanded ? "Less detail" : "View detail"}
            </button>
          ) : null}
        </div>

        {errorText ? (
          <div className="mt-3 rounded-xl border-2 border-[#FFB0B4] bg-[#FFF4F4] px-3 py-2.5 text-xs font-semibold leading-5 text-[#9C2530]">
            <span className="font-black">Failure:</span> {String(errorText)}
          </div>
        ) : null}

        {expanded ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-xl border-2 border-[#D2DDE9] bg-[#F8FAFC] p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#61738D]">Target Reference</p>
              <p className="mt-1 break-all text-xs font-bold text-[#173F6B]">
                {item.target_table || "No target table"}{item.target_id ? ` / ${item.target_id}` : ""}
              </p>
            </div>

            {(failed || pending) ? (
              <div className="rounded-xl border-2 border-[#FFB06E] bg-[#FFF7EE] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B83C0A]">Operator Guidance</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#596A80]">
                  {failed
                    ? "Investigate the source workflow and recorded failure before retrying. This dashboard does not pretend to perform a retry it cannot verify."
                    : "This item is waiting for a decision or execution source. Review the originating workflow before changing its state."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-[#AFC7E4] bg-[#F2F7FC] p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#173F6B]">Event Classification</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#596A80]">
                  Read-only execution intelligence. Open the source workflow for any operational change.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function RowMeta({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-[#D7E0EA] bg-[#FAFBFD] px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-[#71819A]">{label}</p>
      <p className="mt-1 break-words text-xs font-bold leading-4 text-[#243A60]">{value || "—"}</p>
    </div>
  );
}

function ProgressRow({ label, value, detail, tone = "gold" }) {
  const clean = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="rounded-2xl border-2 border-[#D1DCE8] bg-white p-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-black text-[#10233F]">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#68778D]">{detail}</p>
        </div>
        <span className="shrink-0 text-2xl font-black text-[#173F6B]">{clean}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full border border-[#D7E0EA] bg-[#EDF2F7]">
        <div className={`h-full rounded-full ${getProgressTone(tone)}`} style={{ width: `${clean}%` }} />
      </div>
    </div>
  );
}

function SmallMetric({ label, value, tone = "blue" }) {
  const tones = {
    orange: "border-[#FFAA63] bg-[#FFF7EE]",
    red: "border-[#FF9EA3] bg-[#FFF3F3]",
    green: "border-[#5ADDA9] bg-[#EEFCF5]",
    blue: "border-[#B8CBE0] bg-[#F3F7FB]",
    navy: "border-[#315D8A] bg-[#EDF4FA]",
  };

  return (
    <div className={`min-w-0 rounded-[1.25rem] border-2 p-4 ${tones[tone] || tones.blue}`}>
      <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-[#526984]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black leading-none tracking-[-0.02em] text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.4rem] border-2 border-dashed border-[#B8C9DC] bg-[#F7FAFD] p-6 text-center">
      <p className="text-sm font-bold text-[#61738D]">{text}</p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-[#FF9EA3] bg-[#FFF3F3]";
  if (tone === "orange") return "border-[#FFAA63] bg-[#FFF7EE]";
  if (tone === "green") return "border-[#5ADDA9] bg-[#EEFCF5]";
  if (tone === "gold") return "border-[#F3C34F] bg-[#FFF9E7]";
  if (tone === "blue") return "border-[#AFC7E4] bg-[#F1F6FC]";
  if (tone === "purple") return "border-[#B9A7FF] bg-[#F6F3FF]";
  return "border-[#C8D5E4] bg-white";
}

function getProgressTone(tone = "") {
  if (tone === "red") return "bg-[#D64545]";
  if (tone === "orange") return "bg-[#FF6B18]";
  if (tone === "blue") return "bg-[#315D8A]";
  if (tone === "green") return "bg-[#12A66A]";
  return "bg-[#F0A51A]";
}


export default ExecutiveAutomationControlCenter;
