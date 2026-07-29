import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CopyCheck,
  FileClock,
  Mail,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

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
  if (clean === "send_whatsapp") return "border-[#D85F0B]/50 bg-[#FFF1E3] text-[#B84F0E]";

  return "border-[#243A60]/18 bg-white text-[#7A8392]";
}

function getStatusTone(status = "") {
  const clean = normalize(status);

  if (isSuccessStatus(clean)) {
    return "border-[#D85F0B]/50 bg-[#FFF1E3] text-[#B84F0E]";
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
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFailures, setShowFailures] = useState(true);
  const [showApprovals, setShowApprovals] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showSecondaryDistributions, setShowSecondaryDistributions] = useState(false);

  const loadLogs = useCallback(async () => {
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
      setLastLoadedAt(new Date());
    } catch (err) {
      setError(err.message || "Executive automation analytics crashed while loading.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

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
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-[#D85F0B]/65 bg-[#FFFDF8] shadow-[0_20px_55px_rgba(23,36,61,0.08)]">
        <div className="grid xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#173A67] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                <BarChart3 size={14} /> Executive Automation
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={14} /> Audit Trail
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Automation Control & Execution Intelligence
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              Live operational visibility across executed tasks, reminders, calls,
              communication drafts, approval-protected actions, duplicate prevention,
              failures, executors, and Student OS sources.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <CommandMetric label="Logs" value={analytics.total} />
              <CommandMetric label="Success" value={`${analytics.successRate}%`} />
              <CommandMetric label="Failures" value={analytics.failed} />
              <CommandMetric label="Today" value={analytics.today} />
            </div>
          </div>

          <div className="bg-[#D85F0B] p-5 text-white sm:p-6">
            <div className="flex items-center gap-2">
              <Activity size={18} />
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white">
                Automation Health
              </p>
            </div>
            <p className="mt-3 text-5xl font-black text-white">{analytics.successRate}%</p>
            <p className="mt-1 text-sm font-black uppercase text-white">
              {analytics.failureRate > 20 ? "Needs Attention" : analytics.failureRate > 0 ? "Operational" : "Clean Run"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric label="Approval" value={analytics.approvalRequired} />
              <OrangeMetric label="Duplicates" value={analytics.duplicateBlocked} />
              <OrangeMetric label="Actions" value={Object.keys(analytics.byAction).length} />
              <OrangeMetric label="Executors" value={Object.keys(analytics.byExecutor).length} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t-[3px] border-[#D85F0B]/50 bg-[#FFFDF8] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#667085]">
            <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1.5">
              Limit: {LOG_LIMIT} records
            </span>
            <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1.5">
              {lastLoadedAt ? `Updated ${lastLoadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not loaded yet"}
            </span>
            {adminProfile?.full_name || adminProfile?.name ? (
              <span className="rounded-full border border-[#D85F0B]/50 bg-[#FFF1E3] px-3 py-1.5 text-[#B84F0E]">
                Viewer: {adminProfile.full_name || adminProfile.name}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#D85F0B] bg-[#D85F0B] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#B94B08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Logs"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm leading-6 text-[#A8342F]">
            {error}
            <div className="mt-2 text-xs font-semibold text-[#A8342F]">
              Check that executive_execution_logs exists and that the logged-in admin
              has a readable RLS policy.
            </div>
          </div>
        ) : null}

        <div className="mx-4 mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 sm:mx-6">
          <MetricCard label="Total Logs" value={analytics.total} />
          <MetricCard label="Success Rate" value={`${analytics.successRate}%`} tone="green" />
          <MetricCard label="Failure Rate" value={`${analytics.failureRate}%`} tone="red" />
          <MetricCard label="Duplicate Blocked" value={analytics.duplicateBlocked} tone="yellow" />
          <MetricCard label="Approval Required" value={analytics.approvalRequired} tone="gold" />
          <MetricCard label="Today" value={analytics.today} tone="blue" />
          <MetricCard label="Successful" value={analytics.successful} tone="green" />
          <MetricCard label="Failed" value={analytics.failed} tone="red" />
        </div>

        <div className="mx-4 mb-6 mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5 sm:mx-6">
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
        <CollapsibleSection
          title="Failure & duplicate monitor"
          count={failureLogs.length}
          open={showFailures}
          onToggle={() => setShowFailures((value) => !value)}
          tone="red"
        >
          <FailureMonitor logs={failureLogs} />
        </CollapsibleSection>

        <CollapsibleSection
          title="Human approval history"
          count={approvalLogs.length}
          open={showApprovals}
          onToggle={() => setShowApprovals((value) => !value)}
          tone="orange"
        >
          <ApprovalHistory logs={approvalLogs} />
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title="Execution history feed"
        count={filteredLogs.length}
        open={showHistory}
        onToggle={() => setShowHistory((value) => !value)}
        tone="navy"
      >
        <div className="rounded-[2rem] border-[3px] border-[#173A67] bg-[#FFFDF8] p-5 shadow-[0_16px_40px_rgba(23,58,103,0.08)]">
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
            <label className="relative">
              <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white" />
              <span className="sr-only">Search execution history</span>
              <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search student, action, status..."
              className="w-full rounded-full border border-[#243A60]/18 bg-[#17243D] py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/70 focus:border-[#E9802D]/70 sm:w-[260px]"
            />
            </label>

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
          {loading && logs.length === 0 ? (
            <EmptyState
              title="Loading execution intelligence..."
              text="Reading the latest Executive Automation audit records."
            />
          ) : recentLogs.length ? (
            recentLogs.map((log) => <ExecutionLogCard key={log.id || log.duplicate_key || `${log.student_id}-${getCreatedAt(log)}`} log={log} />)
          ) : (
            <EmptyState
              title="No execution logs found."
              text="Once Executive Action Queue executes tasks, reminders, email drafts, WhatsApp drafts, or duplicate blocks, they will appear here."
            />
          )}
        </div>
      </div>

      </CollapsibleSection>
      <CollapsibleSection
        title="Secondary analytics"
        count={Object.keys(analytics.byExecutor).length + Object.keys(analytics.byStudentType).length}
        open={showSecondaryDistributions}
        onToggle={() => setShowSecondaryDistributions((value) => !value)}
        tone="navy"
      >
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
      </CollapsibleSection>
    </div>
  );
}

function CollapsibleSection({ title, count = 0, open, onToggle, tone = "navy", children }) {
  const toneClass =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "orange"
      ? "border-[#E56A12] bg-[#FFF0E2] text-[#A94308]"
      : "border-[#173A67]/30 bg-[#EEF4FA] text-[#173A67]";

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className={`mb-3 flex w-full items-center justify-between gap-4 rounded-[1.15rem] border-2 px-4 py-3 text-left transition hover:-translate-y-0.5 ${toneClass}`}
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
            Workspace Section
          </p>
          <p className="mt-0.5 font-black">{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg border border-current/20 bg-white/70 px-2.5 py-1 text-xs font-black">
            {count}
          </span>
          <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open ? children : null}
    </section>
  );
}

function CommandMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value ?? 0}</p>
    </div>
  );
}

function OrangeMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value ?? 0}</p>
    </div>
  );
}

function MetricCard({ label, value, tone = "default", compact = false }) {
  const style = getToneStyle(tone);

  return (
    <div className={`group relative overflow-hidden rounded-[1.35rem] border-2 p-4 shadow-[0_10px_26px_rgba(23,36,61,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(23,36,61,0.10)] ${style}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-current opacity-60" />
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#596579]">
        {label}
      </p>
      <p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl"} font-black leading-none text-[#10233F]`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400 bg-red-50 text-red-700";
  if (tone === "green") return "border-emerald-400 bg-emerald-50 text-emerald-700";
  if (tone === "gold") return "border-[#E56A12] bg-[#FFF0E2] text-[#B84A08]";
  if (tone === "blue") return "border-blue-400 bg-blue-50 text-blue-700";
  if (tone === "yellow") return "border-amber-400 bg-amber-50 text-amber-700";
  return "border-[#173A67] bg-[#F4F8FC] text-[#173A67]";
}

function DistributionPanel({ title, description, items = {} }) {
  const entries = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const max = Math.max(1, ...entries.map(([, value]) => Number(value) || 0));

  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-[#173A67] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,58,103,0.07)]">
      <div className="border-b-2 border-[#E56A12] bg-[#173A67] px-5 py-4 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
          Intelligence Breakdown
        </p>
        <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">{description}</p>
      </div>

      <div className="space-y-2.5 p-4">
        {entries.length ? (
          entries.map(([key, value], index) => (
            <div
              key={key}
              className="rounded-[1rem] border-2 border-slate-200 bg-white px-3.5 py-3 transition hover:border-orange-300"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 break-words text-xs font-black text-[#243A60]">
                  {formatLabel(key)}
                </span>
                <span className="shrink-0 rounded-lg bg-[#173A67] px-2.5 py-1 text-xs font-black text-white">
                  {value}
                </span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${index === 0 ? "bg-[#D85F0B]" : "bg-[#315B88]"}`}
                  style={{ width: `${Math.max(5, ((Number(value) || 0) / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-[#F8FAFC] px-3 py-5 text-center text-xs font-bold text-slate-500">
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
    <div className="rounded-[1.8rem] border-[3px] border-red-400 bg-[#FFF7F5] p-5 shadow-[0_14px_34px_rgba(194,65,59,0.08)]">
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
              className="rounded-[1.25rem] border-2 border-red-300 bg-white p-4 shadow-[0_7px_18px_rgba(194,65,59,0.05)]"
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
    <div className="rounded-[1.8rem] border-[3px] border-[#E56A12] bg-[#FFF7EC] p-5 shadow-[0_14px_34px_rgba(233,128,45,0.08)]">
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
              className="rounded-[1.25rem] border-2 border-orange-300 bg-white p-4 shadow-[0_7px_18px_rgba(233,128,45,0.05)]"
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
  const status = normalize(log.status);
  const cardTone = status === "duplicate_blocked"
    ? "border-amber-400 bg-amber-50/35"
    : isFailureStatus(status)
    ? "border-red-400 bg-red-50/30"
    : isSuccessStatus(status)
    ? "border-emerald-400 bg-emerald-50/25"
    : "border-blue-300 bg-blue-50/25";

  return (
    <div className={`rounded-[1.5rem] border-[3px] p-4 shadow-[0_10px_26px_rgba(23,36,61,0.055)] transition hover:-translate-y-0.5 ${cardTone}`}>
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

        <div className="shrink-0 rounded-[1.2rem] border-2 border-[#173A67]/25 bg-white p-4 xl:w-72">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
            Student / Execution
          </p>

          <p className="mt-2 break-words font-black text-[#17243D]">
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
    <span className="max-w-full break-all rounded-lg border-2 border-[#243A60]/15 bg-[#F8FAFC] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#596579]">
      <span className="text-orange-700">{label}</span>: {value}
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