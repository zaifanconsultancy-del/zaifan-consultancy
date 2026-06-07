import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const LOG_LIMIT = 250;

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
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

function formatDateTime(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
}

function isSuccessStatus(status = "") {
  return ["completed", "success", "executed"].includes(normalize(status));
}

function isFailureStatus(status = "") {
  return ["failed", "error", "duplicate_blocked"].includes(normalize(status));
}

function getCreatedAt(log = {}) {
  return log.created_at || log.executed_at || log.updated_at || log.metadata?.executed_at || null;
}

function getActionTone(actionType = "") {
  const clean = normalize(actionType);

  if (clean === "create_task") return "border-blue-400/25 bg-blue-500/10 text-blue-200";
  if (clean === "create_reminder") return "border-purple-400/25 bg-purple-500/10 text-purple-200";
  if (clean === "schedule_call") return "border-orange-400/25 bg-orange-500/10 text-orange-200";
  if (clean === "send_email") return "border-cyan-400/25 bg-cyan-500/10 text-cyan-200";
  if (clean === "send_whatsapp") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";

  return "border-white/10 bg-white/[0.04] text-white/45";
}

function getStatusTone(status = "") {
  const clean = normalize(status);

  if (isSuccessStatus(clean)) {
    return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  }

  if (clean === "duplicate_blocked") {
    return "border-yellow-400/25 bg-yellow-500/10 text-yellow-200";
  }

  if (isFailureStatus(clean)) {
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (["pending", "queued", "approval_required"].includes(clean)) {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  return "border-white/10 bg-white/[0.04] text-white/45";
}

function getPriorityTone(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return "border-red-400/25 bg-red-500/10 text-red-300";
  if (clean === "executive") return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  if (clean === "high") return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  if (clean === "medium") return "border-blue-400/25 bg-blue-500/10 text-blue-300";
  if (clean === "low") return "border-white/10 bg-white/[0.04] text-white/45";

  return "border-white/10 bg-white/[0.04] text-white/45";
}

function buildAnalytics(logs = []) {
  const todayKey = new Date().toISOString().slice(0, 10);

  const analytics = {
    total: logs.length,
    successful: 0,
    failed: 0,
    duplicateBlocked: 0,
    approvalRequired: 0,
    today: 0,

    tasks: 0,
    reminders: 0,
    calls: 0,
    emailDrafts: 0,
    whatsappDrafts: 0,

    critical: 0,
    executive: 0,
    high: 0,
    medium: 0,
    low: 0,

    byStatus: {},
    byAction: {},
    byPriority: {},
    byExecutor: {},
    byStudentType: {},
  };

  logs.forEach((log) => {
    const status = normalize(log.status);
    const actionType = normalize(log.action_type);
    const priority = normalize(log.recommendation_priority || "medium");
    const executor = log.executed_by_name || "Unknown";
    const studentType = normalize(log.student_type || "student");
    const createdAt = getCreatedAt(log);

    analytics.byStatus[status || "unknown"] = (analytics.byStatus[status || "unknown"] || 0) + 1;
    analytics.byAction[actionType || "unknown"] = (analytics.byAction[actionType || "unknown"] || 0) + 1;
    analytics.byPriority[priority || "medium"] = (analytics.byPriority[priority || "medium"] || 0) + 1;
    analytics.byExecutor[executor] = (analytics.byExecutor[executor] || 0) + 1;
    analytics.byStudentType[studentType] = (analytics.byStudentType[studentType] || 0) + 1;

    if (isSuccessStatus(status)) analytics.successful += 1;
    if (status === "duplicate_blocked") analytics.duplicateBlocked += 1;
    if (isFailureStatus(status) && status !== "duplicate_blocked") analytics.failed += 1;
    if (log.approval_required) analytics.approvalRequired += 1;
    if (createdAt && String(createdAt).slice(0, 10) === todayKey) analytics.today += 1;

    if (actionType === "create_task") analytics.tasks += 1;
    if (actionType === "create_reminder") analytics.reminders += 1;
    if (actionType === "schedule_call") analytics.calls += 1;
    if (actionType === "send_email") analytics.emailDrafts += 1;
    if (actionType === "send_whatsapp") analytics.whatsappDrafts += 1;

    if (analytics[priority] !== undefined) analytics[priority] += 1;
  });

  analytics.successRate = analytics.total
    ? Math.round((analytics.successful / analytics.total) * 100)
    : 0;

  analytics.failureRate = analytics.total
    ? Math.round((analytics.failed / analytics.total) * 100)
    : 0;

  analytics.duplicateRate = analytics.total
    ? Math.round((analytics.duplicateBlocked / analytics.total) * 100)
    : 0;

  return analytics;
}

function ExecutiveAutomationAnalytics({ adminProfile = null }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: logsError } = await supabase
        .from("executive_execution_logs")
        .select("*")
        .order("id", { ascending: false })
        .limit(LOG_LIMIT);

      if (logsError) {
        setError(logsError.message || "Executive execution logs failed to load.");
        setLogs([]);
        return;
      }

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Executive automation analytics crashed while loading.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const analytics = useMemo(() => buildAnalytics(logs), [logs]);

  const filteredLogs = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return logs.filter((log) => {
      const status = normalize(log.status);
      const actionType = normalize(log.action_type);

      if (statusFilter === "success" && !isSuccessStatus(status)) return false;
      if (statusFilter === "failed" && !(isFailureStatus(status) && status !== "duplicate_blocked")) return false;
      if (statusFilter === "duplicate" && status !== "duplicate_blocked") return false;
      if (statusFilter === "approval" && !log.approval_required) return false;

      if (actionFilter !== "all" && actionType !== actionFilter) return false;

      if (!search) return true;

      const haystack = [
        log.student_name,
        log.student_id,
        log.student_type,
        log.action_type,
        log.recommendation_type,
        log.recommendation_priority,
        log.title,
        log.description,
        log.status,
        log.executed_by_name,
        log.error_message,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [logs, statusFilter, actionFilter, searchTerm]);

  const failureLogs = useMemo(
    () =>
      logs.filter((log) => {
        const status = normalize(log.status);
        return isFailureStatus(status);
      }),
    [logs]
  );

  const approvalLogs = useMemo(
    () => logs.filter((log) => log.approval_required),
    [logs]
  );

  const recentLogs = filteredLogs.slice(0, 80);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Executive Automation Analytics V1
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Execution Logs, Approval History & Automation KPIs
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Reads from executive_execution_logs and turns every executed task,
              reminder, call, email draft, WhatsApp draft, duplicate block, and failure
              into a visible operations record.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Reload Logs"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
            {error}
            <div className="mt-2 text-xs text-red-100/70">
              Check that the executive_execution_logs table exists and has readable RLS
              policy for the logged-in admin.
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-8">
          <MetricCard label="Total Logs" value={analytics.total} />
          <MetricCard label="Success Rate" value={`${analytics.successRate}%`} tone="green" />
          <MetricCard label="Failure Rate" value={`${analytics.failureRate}%`} tone="red" />
          <MetricCard label="Duplicate Blocked" value={analytics.duplicateBlocked} tone="yellow" />
          <MetricCard label="Approval Required" value={analytics.approvalRequired} tone="gold" />
          <MetricCard label="Today" value={analytics.today} tone="blue" />
          <MetricCard label="Successful" value={analytics.successful} tone="green" />
          <MetricCard label="Failed" value={analytics.failed} tone="red" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Tasks Created" value={analytics.tasks} compact />
          <MetricCard label="Reminders Created" value={analytics.reminders} compact />
          <MetricCard label="Calls Scheduled" value={analytics.calls} compact />
          <MetricCard label="Email Drafts" value={analytics.emailDrafts} compact />
          <MetricCard label="WhatsApp Drafts" value={analytics.whatsappDrafts} compact />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DistributionPanel
          title="Status Distribution"
          description="Completed, failed, duplicate blocked, and other execution states."
          items={analytics.byStatus}
        />

        <DistributionPanel
          title="Action Distribution"
          description="Which automation actions are actually being executed."
          items={analytics.byAction}
        />

        <DistributionPanel
          title="Priority Distribution"
          description="Critical, executive, high, medium, and low automation execution load."
          items={analytics.byPriority}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FailureMonitor logs={failureLogs} />
        <ApprovalHistory logs={approvalLogs} />
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
              Queue History
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              Execution History Feed
            </h3>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student, action, status..."
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/40"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="duplicate">Duplicate Blocked</option>
              <option value="approval">Approval Required</option>
            </select>

            <select
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/40"
            >
              <option value="all">All Actions</option>
              <option value="create_task">Tasks</option>
              <option value="create_reminder">Reminders</option>
              <option value="schedule_call">Calls</option>
              <option value="send_email">Emails</option>
              <option value="send_whatsapp">WhatsApp</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {recentLogs.length ? (
            recentLogs.map((log) => <ExecutionLogCard key={log.id || log.duplicate_key || `${log.student_id}-${getCreatedAt(log)}`} log={log} />)
          ) : (
            <EmptyState
              title="No execution logs found."
              text="Once Executive Action Queue executes tasks, reminders, email drafts, WhatsApp drafts, or duplicate blocks, they will appear here."
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionPanel
          title="Executor Distribution"
          description="Which admin/counselor executed automation actions."
          items={analytics.byExecutor}
        />

        <DistributionPanel
          title="Student Type Distribution"
          description="Inquiry, appointment, student, or other Student OS source type."
          items={analytics.byStudentType}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default", compact = false }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl"} font-black text-white`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400/25 bg-red-500/10";
  if (tone === "green") return "border-emerald-400/25 bg-emerald-500/10";
  if (tone === "gold") return "border-[#D4AF37]/25 bg-[#D4AF37]/10";
  if (tone === "blue") return "border-blue-400/25 bg-blue-500/10";
  if (tone === "yellow") return "border-yellow-400/25 bg-yellow-500/10";
  return "border-white/10 bg-white/[0.03]";
}

function DistributionPanel({ title, description, items = {} }) {
  const entries = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>

      <div className="mt-4 space-y-2">
        {entries.length ? (
          entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
            >
              <span className="truncate font-bold text-white/60">{formatLabel(key)}</span>
              <span className="font-black text-white">{value}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/35">
            No data yet.
          </p>
        )}
      </div>
    </div>
  );
}

function FailureMonitor({ logs = [] }) {
  const visibleLogs = logs.slice(0, 8);

  return (
    <div className="rounded-[2rem] border border-red-400/20 bg-red-500/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
            Failure Monitor
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Failed + Duplicate Blocked Actions
          </h3>
        </div>

        <span className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
          {logs.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <div
              key={log.id || `${log.duplicate_key}-${getCreatedAt(log)}`}
              className="rounded-2xl border border-red-400/15 bg-black/20 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag text={formatLabel(log.status)} className={getStatusTone(log.status)} />
                <Tag text={formatLabel(log.action_type)} className={getActionTone(log.action_type)} />
              </div>

              <p className="mt-3 font-bold text-white">
                {log.student_name || "Unknown Student"}
              </p>

              <p className="mt-1 text-sm leading-6 text-white/45">
                {log.error_message || log.title || "Execution issue recorded."}
              </p>

              <p className="mt-2 text-xs text-white/30">
                {formatDateTime(getCreatedAt(log))}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title="No failures detected."
            text="Great. Failed executions and duplicate blocks will show here when they happen."
          />
        )}
      </div>
    </div>
  );
}

function ApprovalHistory({ logs = [] }) {
  const visibleLogs = logs.slice(0, 8);

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
            Approval History
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            Human-Protected Actions
          </h3>
        </div>

        <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black text-[#D4AF37]">
          {logs.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <div
              key={log.id || `${log.duplicate_key}-${getCreatedAt(log)}`}
              className="rounded-2xl border border-[#D4AF37]/15 bg-black/20 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag text={formatLabel(log.recommendation_priority)} className={getPriorityTone(log.recommendation_priority)} />
                <Tag text={formatLabel(log.action_type)} className={getActionTone(log.action_type)} />
                <Tag text={formatLabel(log.status)} className={getStatusTone(log.status)} />
              </div>

              <p className="mt-3 font-bold text-white">
                {log.student_name || "Unknown Student"}
              </p>

              <p className="mt-1 text-sm text-white/45">
                Executed by: {log.executed_by_name || "Unknown"}
              </p>

              <p className="mt-2 text-xs text-white/30">
                {formatDateTime(getCreatedAt(log))}
              </p>
            </div>
          ))
        ) : (
          <EmptyState
            title="No approval-protected logs yet."
            text="Email, WhatsApp, critical, and executive actions will appear here after execution."
          />
        )}
      </div>
    </div>
  );
}

function ExecutionLogCard({ log = {} }) {
  const metadata = log.metadata || {};

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag text={formatLabel(log.status)} className={getStatusTone(log.status)} />
            <Tag text={formatLabel(log.action_type)} className={getActionTone(log.action_type)} />
            <Tag text={formatLabel(log.recommendation_priority || "medium")} className={getPriorityTone(log.recommendation_priority)} />

            {log.approval_required ? (
              <Tag text="Approval Protected" className="border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]" />
            ) : (
              <Tag text="Auto Ready" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300" />
            )}
          </div>

          <p className="mt-3 text-lg font-black text-white">
            {log.title || formatLabel(log.action_type)}
          </p>

          <p className="mt-1 text-sm leading-6 text-white/50">
            {log.description || metadata?.created_payload?.description || "No description saved."}
          </p>

          {log.error_message ? (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs leading-5 text-red-200">
              {log.error_message}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniStat label="Target" value={log.target_table || "None"} />
            <MiniStat label="Target ID" value={log.target_id || "None"} />
            <MiniStat label="Duplicate" value={log.duplicate_key ? "Yes" : "No"} />
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/10 bg-black/25 p-4 xl:w-72">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            Student / Execution
          </p>

          <p className="mt-2 truncate font-bold text-white">
            {log.student_name || "Unknown Student"}
          </p>

          <div className="mt-3 grid gap-1 text-xs leading-5 text-white/45">
            <p>Student ID: {log.student_id || "Unknown"}</p>
            <p>Type: {formatLabel(log.student_type || "student")}</p>
            <p>By: {log.executed_by_name || "Unknown"}</p>
            <p>At: {formatDateTime(getCreatedAt(log))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ text, className = "" }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
        className || "border-white/10 bg-black/20 text-white/45"
      }`}
    >
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
      {label}: {value}
    </span>
  );
}

function EmptyState({ title = "No data yet.", text = "" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="font-semibold text-white/70">{title}</p>
      {text ? <p className="mt-2 text-sm leading-6 text-white/40">{text}</p> : null}
    </div>
  );
}

export default ExecutiveAutomationAnalytics;