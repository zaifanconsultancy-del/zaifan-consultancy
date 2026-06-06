import { useMemo } from "react";
import { calculatePortfolioHealth } from "../../lib/executiveAI";

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

function pct(value, total) {
  if (!total) return "0%";
  return `${Math.round((number(value) / total) * 100)}%`;
}

function getStudentName(student = {}, executive = {}) {
  return (
    student.full_name ||
    student.name ||
    student.student_name ||
    executive.student_name ||
    "Unknown Student"
  );
}

function ExecutivePortfolioSummary({ students = [] }) {
  const portfolio = useMemo(() => {
    return calculatePortfolioHealth(students);
  }, [students]);

  const health = useMemo(() => {
    const total = portfolio.total || 0;

    const applicationHealth = portfolio.applicationHealth || {};
    const visaHealth = portfolio.visaHealth || {};
    const documentHealth = portfolio.documentHealth || {};
    const universityHealth = portfolio.universityHealth || {};
    const taskHealth = portfolio.taskHealth || {};

    return {
      total,
      applicationHealth,
      visaHealth,
      documentHealth,
      universityHealth,
      taskHealth,

      applicationSubmitted:
        number(applicationHealth.submitted) +
        number(applicationHealth.offerReceived) +
        number(applicationHealth.offerAccepted) +
        number(applicationHealth.casPending) +
        number(applicationHealth.casIssued),

      visaInMotion:
        number(visaHealth.pending) +
        number(visaHealth.approved),

      weakDocuments:
        number(documentHealth.weak) +
        number(documentHealth.critical) +
        number(documentHealth.missing),

      weakTasks:
        number(taskHealth.weak) +
        number(taskHealth.critical),

      weakUniversityPlan:
        number(universityHealth.risky) +
        number(universityHealth.missing),
    };
  }, [portfolio]);

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Portfolio Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Student Success Portfolio
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Executive visibility across risk, opportunity, applications, offers,
            CAS, visa, documents, tasks, and university planning.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${portfolio.total} Students`} />
          <Badge label={`${portfolio.executivePriority || 0} Executive`} gold />
          <Badge label={`${portfolio.critical || 0} Critical`} danger />
          <Badge label={`${portfolio.conversionReady || 0} Conversion`} success />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-8">
        <MetricCard label="Total" value={portfolio.total} />
        <MetricCard label="Critical Risk" value={portfolio.critical} tone="red" />
        <MetricCard label="High Risk" value={portfolio.high} tone="orange" />
        <MetricCard label="Medium Risk" value={portfolio.medium} tone="blue" />

        <MetricCard label="High Opportunity" value={portfolio.highOpportunity} tone="green" />
        <MetricCard label="Conversion Ready" value={portfolio.conversionReady} tone="gold" />
        <MetricCard label="Success Stories" value={portfolio.successStories} tone="green" />
        <MetricCard label="Executive Priority" value={portfolio.executivePriority} tone="gold" />

        <MetricCard label="Avg Risk" value={portfolio.averageRisk} tone="red" />
        <MetricCard label="Avg Opportunity" value={portfolio.averageOpportunity} tone="gold" />
        <MetricCard label="Apps Submitted" value={health.applicationSubmitted} tone="blue" />
        <MetricCard label="Visa In Motion" value={health.visaInMotion} tone="green" />

        <MetricCard label="Weak Documents" value={health.weakDocuments} tone="orange" />
        <MetricCard label="Weak Tasks" value={health.weakTasks} tone="red" />
        <MetricCard label="Weak Uni Plan" value={health.weakUniversityPlan} tone="orange" />
        <MetricCard label="Visa Rejected" value={health.visaHealth?.rejected || 0} tone="red" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-5">
        <HealthBlock
          title="Application Health"
          total={portfolio.total}
          rows={[
            ["Not Started", health.applicationHealth.notStarted || 0, "red"],
            ["Started", health.applicationHealth.started || 0, "blue"],
            ["Submitted", health.applicationHealth.submitted || 0, "blue"],
            ["Offer Received", health.applicationHealth.offerReceived || 0, "gold"],
            ["Offer Accepted", health.applicationHealth.offerAccepted || 0, "green"],
            ["CAS Pending", health.applicationHealth.casPending || 0, "orange"],
            ["CAS Issued", health.applicationHealth.casIssued || 0, "green"],
          ]}
        />

        <HealthBlock
          title="Visa Health"
          total={portfolio.total}
          rows={[
            ["Needed", health.visaHealth.needed || 0, "gold"],
            ["Pending", health.visaHealth.pending || 0, "orange"],
            ["Approved", health.visaHealth.approved || 0, "green"],
            ["Rejected", health.visaHealth.rejected || 0, "red"],
          ]}
        />

        <HealthBlock
          title="Document Health"
          total={portfolio.total}
          rows={[
            ["Strong", health.documentHealth.strong || 0, "green"],
            ["Good", health.documentHealth.good || 0, "blue"],
            ["Weak", health.documentHealth.weak || 0, "orange"],
            ["Critical", health.documentHealth.critical || 0, "red"],
            ["Missing", health.documentHealth.missing || 0, "red"],
          ]}
        />

        <HealthBlock
          title="University Health"
          total={portfolio.total}
          rows={[
            ["Strong", health.universityHealth.strong || 0, "green"],
            ["Partial", health.universityHealth.partial || 0, "blue"],
            ["Risky", health.universityHealth.risky || 0, "orange"],
            ["Missing", health.universityHealth.missing || 0, "red"],
          ]}
        />

        <HealthBlock
          title="Task Health"
          total={portfolio.total}
          rows={[
            ["Strong", health.taskHealth.strong || 0, "green"],
            ["Good", health.taskHealth.good || 0, "blue"],
            ["Weak", health.taskHealth.weak || 0, "orange"],
            ["Critical", health.taskHealth.critical || 0, "red"],
            ["Empty", health.taskHealth.empty || 0, "default"],
          ]}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <PortfolioList
          title="Highest Risk Students"
          items={portfolio.rankedByRisk.slice(0, 5)}
          scoreKey="risk_score"
          tone="red"
          emptyText="No high-risk students."
        />

        <PortfolioList
          title="Highest Opportunity Students"
          items={portfolio.rankedByOpportunity.slice(0, 5)}
          scoreKey="opportunity_score"
          tone="gold"
          emptyText="No opportunity records."
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value || 0}</p>
    </div>
  );
}

function HealthBlock({ title, total = 0, rows = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-black text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value, tone]) => (
          <HealthRow
            key={label}
            label={label}
            value={value}
            percent={pct(value, total)}
            tone={tone}
          />
        ))}
      </div>
    </div>
  );
}

function HealthRow({ label, value, percent, tone = "default" }) {
  const style = getToneText(tone);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-white/55">{label}</p>
        <p className={`text-xs font-black ${style}`}>
          {value || 0} • {percent}
        </p>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${getToneBar(tone)}`}
          style={{ width: percent }}
        />
      </div>
    </div>
  );
}

function PortfolioList({
  title,
  items = [],
  scoreKey,
  tone = "gold",
  emptyText = "No records.",
}) {
  const style = getToneStyle(tone);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-black text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => {
            const student = item.student || {};
            const executive = item.executive || {};
            const name = getStudentName(student, executive);

            return (
              <div
                key={`${name}-${index}`}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{name}</p>

                    <p className="mt-1 text-xs text-white/40">
                      {executive.executive_category || "Standard"} •{" "}
                      {executive.priority_level || "Standard"} •{" "}
                      {formatLabel(executive.journey_stage || "not_started")}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${style}`}
                  >
                    {executive[scoreKey] || 0}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/45">
                  {executive.summary || "No executive summary."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                  <span>Docs {executive.diagnostics?.document_readiness_percent || 0}%</span>
                  <span>Tasks {executive.diagnostics?.task_completion_percent || 0}%</span>
                  <span>Universities {executive.diagnostics?.university_plan_count || 0}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-red-400/25 bg-red-500/10 text-red-300"
    : gold
    ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
    : success
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
    : "border-white/10 bg-black/20 text-white/45";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400/25 bg-red-500/10 text-red-300";
  if (tone === "orange") return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  if (tone === "gold") return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  if (tone === "green") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
  if (tone === "blue") return "border-blue-400/25 bg-blue-500/10 text-blue-300";

  return "border-white/10 bg-white/[0.03] text-white/60";
}

function getToneText(tone = "") {
  if (tone === "red") return "text-red-300";
  if (tone === "orange") return "text-orange-300";
  if (tone === "gold") return "text-[#D4AF37]";
  if (tone === "green") return "text-emerald-300";
  if (tone === "blue") return "text-blue-300";

  return "text-white/50";
}

function getToneBar(tone = "") {
  if (tone === "red") return "bg-red-400";
  if (tone === "orange") return "bg-orange-400";
  if (tone === "gold") return "bg-[#D4AF37]";
  if (tone === "green") return "bg-emerald-400";
  if (tone === "blue") return "bg-blue-400";

  return "bg-white/40";
}

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default ExecutivePortfolioSummary;