import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import {
  buildRecoveryQueue,
  buildWorkflowFailureHeatmap,
} from "../../lib/platformVerificationEngine";
import {
  buildExecutiveVerificationSnapshot,
} from "../../lib/platformVerificationEngine";
import {
  buildExecutiveRecoveryActions,
  buildBrokenWorkflowScannerSnapshot,
} from "../../lib/executiveAutomationEngine";

const toLower = (value) => String(value || "").toLowerCase().trim();

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
}) {
  const [logs, setLogs] = useState(executiveExecutionLogs);
  const [queueRows, setQueueRows] = useState([
    ...automationQueue,
    ...executiveActionQueue,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAutomationData = async () => {
    setLoading(true);
    setError("");

    try {
      const [logsResult, queueResult] = await Promise.allSettled([
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

  const verificationSnapshot = useMemo(
  () =>
    buildExecutiveVerificationSnapshot(
      queueRows
    ),
  [queueRows]
);

const recoverySnapshot = useMemo(
  () =>
    buildBrokenWorkflowScannerSnapshot(
      queueRows
    ),
  [queueRows]
);

const recoveryEngine = useMemo(
  () =>
    buildExecutiveRecoveryActions(
      recoverySnapshot.issues || []
    ),
  [recoverySnapshot]
);

  const kpis = [
    {
      title: "Pending Approvals",
      value: automation.pending.length + automation.queued.length,
      note: "Waiting for human or queue decision",
      icon: "⏳",
      color: "text-orange-300",
      tone: "orange",
    },
    {
      title: "Successful Executions",
      value: automation.successful.length,
      note: `${automation.successRate}% success rate`,
      icon: "✅",
      color: "text-green-300",
      tone: "green",
    },
    {
      title: "Failed Executions",
      value: automation.failed.length + automation.failedQueue.length,
      note: `${automation.failureRate}% failure pressure`,
      icon: "🚨",
      color: "text-red-300",
      tone: "red",
    },
    {
      title: "Duplicates Blocked",
      value: automation.duplicateBlocked.length,
      note: "Duplicate protection monitor",
      icon: "🛡️",
      color: "text-blue-300",
      tone: "blue",
    },
    {
      title: "Approved Actions",
      value: automation.approved.length,
      note: `${automation.approvalRate}% approval rate`,
      icon: "🧑‍⚖️",
      color: "text-purple-300",
      tone: "purple",
    },
    {
      title: "Automation Pressure",
      value: automation.pressure,
      note: "Total queue + failure load",
      icon: "⚙️",
      color: "text-[#D4AF37]",
      tone: "gold",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Executive Automation Control
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Automation Command Center
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/55">
              Approval queue, failed automation recovery, duplicate protection,
              execution timeline, retry planning, and automation health monitoring
              for the Student OS executive layer.
            </p>

            <p className="mt-2 text-xs text-white/35">
              Operator:{" "}
              <span className="font-bold text-[#D4AF37]">
                {adminProfile?.full_name || adminProfile?.name || "Zaifan Admin"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={loadAutomationData}
            disabled={loading}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Reload Automation"}
          </button>
        </div>

        {error ? (
          <div className="relative mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {kpis.map((item, index) => (
            <MetricCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>

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

function MetricCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`rounded-[1.5rem] border p-4 ${getToneStyle(item.tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            {item.title}
          </p>

          <p className={`mt-3 text-3xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>

        <span className="text-2xl">{item.icon}</span>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/45">{item.note}</p>
    </motion.div>
  );
}

function CommandPanel({ eyebrow, title, description, children }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]/80">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-black text-white">{title}</h3>

      {description ? (
        <p className="mt-1 text-sm leading-6 text-white/45">{description}</p>
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
    ? "border-red-400/20 bg-red-500/10 text-red-300"
    : pending
    ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
    : duplicate || type === "duplicate"
    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
    : success
    ? "border-green-400/20 bg-green-500/10 text-green-300"
    : "border-white/10 bg-white/[0.04] text-white/45";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="rounded-2xl border border-white/10 bg-black/25 p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-black text-white">{getActionName(item)}</p>

          <p className="mt-1 text-xs text-white/45">
            {getStudentName(item)} • {item.student_type || "student"} •{" "}
            {formatDate(getLogTime(item))}
          </p>

          {(item.error_message || item.error || item.failure_reason) && (
            <p className="mt-2 line-clamp-2 text-xs text-red-300">
              {item.error_message || item.error || item.failure_reason}
            </p>
          )}

          {item.target_table || item.target_id ? (
            <p className="mt-2 text-[11px] text-white/35">
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
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
              {item.priority}
            </span>
          )}

          {duplicate && (
            <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
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
        <span className="font-semibold text-white">{label}</span>
        <span className="font-black text-[#D4AF37]">{clean}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${getProgressTone(tone)}`}
          style={{ width: `${clean}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-white/40">{detail}</p>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ActionChip({ label, tone = "default" }) {
  const toneClass =
    tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-300"
      : tone === "blue"
      ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
      : tone === "gold"
      ? "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
      : "border-white/10 bg-white/[0.04] text-white/45";

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
    <p className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/40">
      {text}
    </p>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400/25 bg-red-500/10";
  if (tone === "orange") return "border-orange-400/25 bg-orange-500/10";
  if (tone === "green") return "border-emerald-400/25 bg-emerald-500/10";
  if (tone === "gold") return "border-[#D4AF37]/25 bg-[#D4AF37]/10";
  if (tone === "blue") return "border-blue-400/25 bg-blue-500/10";
  if (tone === "purple") return "border-purple-400/25 bg-purple-500/10";
  return "border-white/10 bg-white/[0.03]";
}

function getProgressTone(tone = "") {
  if (tone === "red") return "bg-red-400";
  if (tone === "orange") return "bg-orange-400";
  if (tone === "green") return "bg-emerald-400";
  if (tone === "blue") return "bg-blue-400";
  return "bg-[#D4AF37]";
}

export default ExecutiveAutomationControlCenter;
