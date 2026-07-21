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

  if (clean === "create_task") return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";
  if (clean === "create_reminder") return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";
  if (clean === "schedule_call") return "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]";
  if (clean === "send_email") return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";
  if (clean === "send_whatsapp") return "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]";

  return "border-[#243A60]/18 bg-white text-[#7A8392]";
}

function getStatusTone(status = "") {
  const clean = normalize(status);

  if (isSuccessStatus(clean)) {
    return "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]";
  }

  if (clean === "duplicate_blocked") {
    return "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]";
  }

  if (isFailureStatus(clean)) {
    return "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]";
  }

  if (["pending", "queued", "approval_required"].includes(clean)) {
    return "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]";
  }

  return "border-[#243A60]/18 bg-white text-[#7A8392]";
}

function getPriorityTone(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]";
  if (clean === "executive") return "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]";
  if (clean === "high") return "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]";
  if (clean === "medium") return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";
  if (clean === "low") return "border-[#243A60]/18 bg-white text-[#7A8392]";

  return "border-[#243A60]/18 bg-white text-[#7A8392]";
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
      <div className="rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
              Executive Automation Analytics V1
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#17243D]">
              Execution Logs, Approval History & Automation KPIs
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
              Reads from executive_execution_logs and turns every executed task,
              reminder, call, email draft, WhatsApp draft, duplicate block, and failure
              into a visible operations record.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="rounded-full border border-[#E9802D]/45 bg-[#FFF1E3] px-5 py-2 text-sm font-bold text-[#B84F0E] transition hover:bg-[#E9802D] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Reload Logs"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm leading-6 text-[#A8342F]">
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

      <div className="rounded-[2rem] border border-[#243A60]/18 bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8992A1]">
              Queue History
            </p>
            <h3 className="mt-2 text-xl font-black text-[#17243D]">
              Execution History Feed
            </h3>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student, action, status..."
              className="rounded-full border border-[#243A60]/18 bg-[#17243D] px-4 py-2 text-sm text-[#F7F3EB] outline-none placeholder:text-[#98A0AE] focus:border-[#E9802D]/50"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-full border border-[#243A60]/18 bg-[#17243D] px-4 py-2 text-sm text-[#F7F3EB] outline-none focus:border-[#E9802D]/50"
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
              className="rounded-full border border-[#243A60]/18 bg-[#17243D] px-4 py-2 text-sm text-[#F7F3EB] outline-none focus:border-[#E9802D]/50"
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
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {label}
      </p>
      <p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl"} font-black text-[#17243D]`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-[#C2413B]/32 bg-[#FFF0EE]";
  if (tone === "green") return "border-[#E9802D]/35 bg-[#FFF1E3]";
  if (tone === "gold") return "border-[#E9802D]/40 bg-[#FFF1E3]";
  if (tone === "blue") return "border-[#243A60]/25 bg-[#F3F5F8]";
  if (tone === "yellow") return "border-[#A36A18]/30 bg-[#FFF7E8]";
  return "border-[#243A60]/18 bg-white";
}

function DistributionPanel({ title, description, items = {} }) {
  const entries = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="rounded-[2rem] border border-[#243A60]/18 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8992A1]">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#7A8392]">{description}</p>

      <div className="mt-4 space-y-2">
        {entries.length ? (
          entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#243A60]/18 bg-white px-3 py-2 text-xs"
            >
              <span className="truncate font-bold text-[#596579]">{formatLabel(key)}</span>
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

function FailureMonitor({ logs = [] }) {
  const visibleLogs = logs.slice(0, 8);

  return (
    <div className="rounded-[2rem] border border-[#C2413B]/30 bg-[#FFF0EE] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A8342F]">
            Failure Monitor
          </p>
          <h3 className="mt-2 text-xl font-black text-[#17243D]">
            Failed + Duplicate Blocked Actions
          </h3>
        </div>

        <span className="rounded-full border border-[#C2413B]/32 bg-[#FFF0EE] px-3 py-1 text-xs font-black text-[#A8342F]">
          {logs.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <div
              key={log.id || `${log.duplicate_key}-${getCreatedAt(log)}`}
              className="rounded-2xl border border-[#C2413B]/26 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag text={formatLabel(log.status)} className={getStatusTone(log.status)} />
                <Tag text={formatLabel(log.action_type)} className={getActionTone(log.action_type)} />
              </div>

              <p className="mt-3 font-bold text-[#17243D]">
                {log.student_name || "Unknown Student"}
              </p>

              <p className="mt-1 text-sm leading-6 text-[#7A8392]">
                {log.error_message || log.title || "Execution issue recorded."}
              </p>

              <p className="mt-2 text-xs text-[#98A0AE]">
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
    <div className="rounded-[2rem] border border-[#E9802D]/35 bg-[#FFFDF8] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B84F0E]">
            Approval History
          </p>
          <h3 className="mt-2 text-xl font-black text-[#17243D]">
            Human-Protected Actions
          </h3>
        </div>

        <span className="rounded-full border border-[#E9802D]/40 bg-[#FFF1E3] px-3 py-1 text-xs font-black text-[#B84F0E]">
          {logs.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <div
              key={log.id || `${log.duplicate_key}-${getCreatedAt(log)}`}
              className="rounded-2xl border border-[#E9802D]/30 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Tag text={formatLabel(log.recommendation_priority)} className={getPriorityTone(log.recommendation_priority)} />
                <Tag text={formatLabel(log.action_type)} className={getActionTone(log.action_type)} />
                <Tag text={formatLabel(log.status)} className={getStatusTone(log.status)} />
              </div>

              <p className="mt-3 font-bold text-[#17243D]">
                {log.student_name || "Unknown Student"}
              </p>

              <p className="mt-1 text-sm text-[#7A8392]">
                Executed by: {log.executed_by_name || "Unknown"}
              </p>

              <p className="mt-2 text-xs text-[#98A0AE]">
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
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag text={formatLabel(log.status)} className={getStatusTone(log.status)} />
            <Tag text={formatLabel(log.action_type)} className={getActionTone(log.action_type)} />
            <Tag text={formatLabel(log.recommendation_priority || "medium")} className={getPriorityTone(log.recommendation_priority)} />

            {log.approval_required ? (
              <Tag text="Approval Protected" className="border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]" />
            ) : (
              <Tag text="Auto Ready" className="border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]" />
            )}
          </div>

          <p className="mt-3 text-lg font-black text-[#17243D]">
            {log.title || formatLabel(log.action_type)}
          </p>

          <p className="mt-1 text-sm leading-6 text-[#667085]">
            {log.description || metadata?.created_payload?.description || "No description saved."}
          </p>

          {log.error_message ? (
            <p className="mt-3 rounded-xl border border-[#C2413B]/30 bg-[#FFF0EE] px-3 py-2 text-xs leading-5 text-[#A8342F]">
              {log.error_message}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniStat label="Target" value={log.target_table || "None"} />
            <MiniStat label="Target ID" value={log.target_id || "None"} />
            <MiniStat label="Duplicate" value={log.duplicate_key ? "Yes" : "No"} />
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-[#243A60]/18 bg-white p-4 xl:w-72">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
            Student / Execution
          </p>

          <p className="mt-2 truncate font-bold text-[#17243D]">
            {log.student_name || "Unknown Student"}
          </p>

          <div className="mt-3 grid gap-1 text-xs leading-5 text-[#7A8392]">
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
        className || "border-[#243A60]/18 bg-white text-[#7A8392]"
      }`}
    >
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8992A1]">
      {label}: {value}
    </span>
  );
}

function EmptyState({ title = "No data yet.", text = "" }) {
  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-5">
      <p className="font-semibold text-[#344054]">{title}</p>
      {text ? <p className="mt-2 text-sm leading-6 text-[#7A8392]">{text}</p> : null}
    </div>
  );
}

export default ExecutiveAutomationAnalytics;