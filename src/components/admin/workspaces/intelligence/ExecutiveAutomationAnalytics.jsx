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

// ExecutiveAutomationAnalytics V5 PARTNER OS EXTREME — Execution Intelligence

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

  const automationStatus =
    analytics.failureRate > 20
      ? "Needs Attention"
      : analytics.failureRate > 0
        ? "Operational"
        : "Clean Run";

  const actionMixTotal =
    analytics.tasks +
    analytics.reminders +
    analytics.calls +
    analytics.emailDrafts +
    analytics.whatsappDrafts;

  return (
    <div className="min-w-0 space-y-5">
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CommandChip icon={BarChart3}>Executive Automation</CommandChip>
              <CommandChip icon={ShieldCheck}>Audit Trail</CommandChip>
              <CommandChip icon={Activity}>Live Execution Data</CommandChip>
            </div>

            <h2 className="mt-4 max-w-5xl break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              Automation Control & Execution Intelligence
            </h2>

            <p className="mt-3 max-w-5xl break-words text-sm font-semibold leading-6 text-slate-100">
              Review executed tasks, reminders, calls, communication drafts,
              approval-protected actions, duplicate prevention, failures,
              executors and Student OS source activity from one command surface.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Logs" value={analytics.total} />
              <DarkMetric label="Success" value={`${analytics.successRate}%`} />
              <DarkMetric label="Failures" value={analytics.failed} />
              <DarkMetric label="Today" value={analytics.today} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="flex items-center gap-2">
              <Activity size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Automation Operating Position
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {analytics.successRate}%
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {automationStatus}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric label="Approval" value={analytics.approvalRequired} />
              <OrangeMetric label="Duplicates" value={analytics.duplicateBlocked} />
              <OrangeMetric label="Actions" value={Object.keys(analytics.byAction).length} />
              <OrangeMetric label="Executors" value={Object.keys(analytics.byExecutor).length} />
            </div>

            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={loading}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh Logs"}
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex min-w-0 items-start gap-3 rounded-[1.3rem] border-[3px] border-red-400 bg-red-50 p-4 text-red-900 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black">{error}</p>
            <p className="mt-1 text-xs font-semibold leading-5">
              Check that executive_execution_logs exists and that the logged-in
              admin has a readable RLS policy.
            </p>
          </div>
        </div>
      ) : null}

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Automation Operations Board
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Execution health and command pressure
            </h3>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
              Grouped operational intelligence replaces the old loose metric wall.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
              Limit {LOG_LIMIT}
            </span>
            <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
              {lastLoadedAt
                ? `Updated ${lastLoadedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Not loaded"}
            </span>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <BoardMetric
            label="Execution Success"
            value={`${analytics.successRate}%`}
            detail={`${analytics.successful} successful executions`}
            tone="green"
            icon={CheckCircle2}
          />
          <BoardMetric
            label="Failure Pressure"
            value={`${analytics.failureRate}%`}
            detail={`${analytics.failed} failed executions`}
            tone="red"
            icon={XCircle}
          />
          <BoardMetric
            label="Duplicate Protection"
            value={analytics.duplicateBlocked}
            detail={`${analytics.duplicateRate}% duplicate rate`}
            tone="orange"
            icon={CopyCheck}
          />
          <BoardMetric
            label="Approval Control"
            value={analytics.approvalRequired}
            detail="Human-protected execution events"
            tone="navy"
            icon={UserCheck}
          />
          <BoardMetric
            label="Task Operations"
            value={analytics.tasks}
            detail={`${analytics.reminders} reminders created`}
            tone="navy"
            icon={Target}
          />
          <BoardMetric
            label="Calls Scheduled"
            value={analytics.calls}
            detail="Operational call actions"
            tone="orange"
            icon={PhoneCall}
          />
          <BoardMetric
            label="Communication Drafts"
            value={analytics.emailDrafts + analytics.whatsappDrafts}
            detail={`${analytics.emailDrafts} email · ${analytics.whatsappDrafts} WhatsApp`}
            tone="green"
            icon={Mail}
          />
          <BoardMetric
            label="Action Mix"
            value={actionMixTotal}
            detail={`${Object.keys(analytics.byAction).length} action types`}
            tone="navy"
            icon={Sparkles}
          />
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Intelligence Distribution
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Status, action and priority breakdown
            </h3>
          </div>

          {adminProfile?.full_name || adminProfile?.name ? (
            <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
              Viewer: {adminProfile.full_name || adminProfile.name}
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-5 bg-[#FFF8EF] p-4 sm:p-5 xl:grid-cols-3">
          <DistributionPanel
            title="Status Distribution"
            description="Completed, failed, duplicate blocked and other execution states."
            items={analytics.byStatus}
          />
          <DistributionPanel
            title="Action Distribution"
            description="Which automation actions are actually being executed."
            items={analytics.byAction}
          />
          <DistributionPanel
            title="Priority Distribution"
            description="Critical, executive, high, medium and low execution load."
            items={analytics.byPriority}
          />
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
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
        <div className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_32px_rgba(18,56,101,0.07)]">
          <div className="flex min-w-0 flex-col gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                Queue History
              </p>
              <h3 className="mt-1 text-xl font-black text-white">
                Execution History Feed
              </h3>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
              <label className="relative min-w-0">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <span className="sr-only">Search execution history</span>
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search student, action, status..."
                  className="min-h-10 w-full min-w-0 rounded-xl border-2 border-white/25 bg-white pl-10 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-orange-300 sm:w-[260px]"
                />
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="min-h-10 rounded-xl border-2 border-white/25 bg-white px-4 text-sm font-black text-[#10233F] outline-none focus:border-orange-300"
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
                className="min-h-10 rounded-xl border-2 border-white/25 bg-white px-4 text-sm font-black text-[#10233F] outline-none focus:border-orange-300"
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

          <div className="space-y-3 bg-[#FFF8EF] p-4 sm:p-5">
            {loading && logs.length === 0 ? (
              <EmptyState
                title="Loading execution intelligence..."
                text="Reading the latest Executive Automation audit records."
              />
            ) : recentLogs.length ? (
              recentLogs.map((log) => (
                <ExecutionLogCard
                  key={
                    log.id ||
                    log.duplicate_key ||
                    `${log.student_id}-${getCreatedAt(log)}`
                  }
                  log={log}
                />
              ))
            ) : (
              <EmptyState
                title="No execution logs found."
                text="Executed tasks, reminders, drafts and duplicate blocks will appear here."
              />
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Secondary analytics"
        count={
          Object.keys(analytics.byExecutor).length +
          Object.keys(analytics.byStudentType).length
        }
        open={showSecondaryDistributions}
        onToggle={() =>
          setShowSecondaryDistributions((value) => !value)
        }
        tone="navy"
      >
        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <DistributionPanel
            title="Executor Distribution"
            description="Which admin or counselor executed automation actions."
            items={analytics.byExecutor}
          />
          <DistributionPanel
            title="Student Type Distribution"
            description="Inquiry, appointment, student or other source type."
            items={analytics.byStudentType}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}


function CollapsibleSection({
  title,
  count = 0,
  open,
  onToggle,
  tone = "navy",
  children,
}) {
  const accent =
    tone === "red"
      ? "border-red-400"
      : tone === "orange"
        ? "border-[#FF5A0A]"
        : "border-[#123865]";

  return (
    <section className={`min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] bg-white shadow-[0_12px_32px_rgba(18,56,101,0.07)] ${accent}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-left text-white transition hover:bg-[#0F3158]"
      >
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
            Workspace Section
          </p>
          <p className="mt-1 break-words text-lg font-black text-white">
            {title}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-xs font-black text-white">
            {count}
          </span>
          <ChevronDown
            size={18}
            className={`transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open ? (
        <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function CommandMetric({ label, value }) {
  return <DarkMetric label={label} value={value} />;
}

function CommandChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
      <Icon size={11} className="shrink-0 text-orange-200" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function OrangeMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function BoardMetric({
  label,
  value,
  detail,
  tone = "navy",
  icon: Icon,
}) {
  return (
    <article className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${getToneStyle(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#10233F]">
            {value ?? 0}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white/80 text-[#123865]">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
  compact = false,
}) {
  return (
    <div className={`min-w-0 rounded-[1.2rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${getToneStyle(tone)}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
        {label}
      </p>
      <p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl"} font-black leading-none text-[#10233F]`}>
        {value ?? 0}
      </p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "gold" || tone === "orange") return "border-[#FF5A0A] bg-[#FFF4E8]";
  if (tone === "blue" || tone === "navy") return "border-[#123865] bg-[#F2F7FF]";
  if (tone === "yellow") return "border-amber-400 bg-amber-50";
  return "border-[#C9D7E6] bg-white";
}

function DistributionPanel({ title, description, items = {} }) {
  const entries = Object.entries(items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const max = Math.max(1, ...entries.map(([, value]) => Number(value) || 0));

  return (
    <div className="overflow-hidden rounded-[1.75rem] border-2 border-[#123865] bg-[#FFF8EF] shadow-[0_12px_32px_rgba(23,58,103,0.07)]">
      <div className="border-b-2 border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FDBA74]">
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
              className="rounded-[1rem] border-2 border-slate-200 bg-white px-3.5 py-3 transition hover:border-[#FDBA74]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 break-words text-xs font-black text-[#243A60]">
                  {formatLabel(key)}
                </span>
                <span className="shrink-0 rounded-lg bg-[#123865] px-2.5 py-1 text-xs font-black text-white">
                  {value}
                </span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${index === 0 ? "bg-[#FF5A0A]" : "bg-[#315B88]"}`}
                  style={{ width: `${Math.max(5, ((Number(value) || 0) / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-[#F8FAFC] px-3 py-5 text-center text-xs font-bold text-slate-500">
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
    <div className="rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#FFF7EC] p-5 shadow-[0_14px_34px_rgba(233,128,45,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C2410C]">
            Approval History
          </p>
          <h3 className="mt-2 text-xl font-black text-[#17243D]">
            Human-Protected Actions
          </h3>
        </div>

        <span className="rounded-full border border-[#E9802D]/40 bg-[#FFF4E8] px-3 py-1 text-xs font-black text-[#C2410C]">
          {logs.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <div
              key={log.id || `${log.duplicate_key}-${getCreatedAt(log)}`}
              className="rounded-[1.25rem] border-2 border-[#FDBA74] bg-white p-4 shadow-[0_7px_18px_rgba(233,128,45,0.05)]"
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
              <Tag text="Approval Protected" className="border-[#E9802D]/40 bg-[#FFF4E8] text-[#C2410C]" />
            ) : (
              <Tag text="Auto Ready" className="border-[#E9802D]/32 bg-[#FFF4E8] text-[#C2410C]" />
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

        <div className="shrink-0 rounded-[1.2rem] border-2 border-[#123865]/25 bg-white p-4 xl:w-72">
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
      <span className="text-[#C2410C]">{label}</span>: {value}
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