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



  const executiveBoard = useMemo(() => {
    const rows = Array.isArray(students) ? students : [];
    const riskPipeline = rows
      .map((item) => ({ student: item.student || item, executive: item.executive || item }))
      .sort((a, b) => number(b.executive.risk_score) - number(a.executive.risk_score))
      .slice(0, 8);

    const opportunityPipeline = rows
      .map((item) => ({ student: item.student || item, executive: item.executive || item }))
      .sort((a, b) => number(b.executive.opportunity_score) - number(a.executive.opportunity_score))
      .slice(0, 8);

    const stalledPipeline = rows
      .map((item) => ({ student: item.student || item, executive: item.executive || item }))
      .filter(({ executive }) => number(executive.days_since_updated, -1) >= 10 || normalize(executive.journey_stage) === "not_started")
      .sort((a, b) => number(b.executive.days_since_updated) - number(a.executive.days_since_updated))
      .slice(0, 8);

    const expectedOffers = rows.filter((item) => {
      const executive = item.executive || item;
      return number(executive.opportunity_score) >= 65 && ["application_submitted", "application_under_review"].includes(normalize(executive.journey_stage));
    }).length;

    const expectedVisaMovement = rows.filter((item) => {
      const executive = item.executive || item;
      return ["offer_accepted", "cas_pending", "cas_issued"].includes(normalize(executive.journey_stage));
    }).length;

    const urgentRecovery = rows.filter((item) => {
      const executive = item.executive || item;
      return number(executive.risk_score) >= 70 && number(executive.opportunity_score) >= 60;
    }).length;

    return { riskPipeline, opportunityPipeline, stalledPipeline, expectedOffers, expectedVisaMovement, urgentRecovery };
  }, [students]);


  return (
    <div className="rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
            Executive Portfolio Intelligence
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#17243D]">
            Student Success Portfolio
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
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



      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <BoardCard label="Expected Offers" value={executiveBoard.expectedOffers} detail="Strong submitted/review cases." tone="blue" />
        <BoardCard label="Expected Visa Movement" value={executiveBoard.expectedVisaMovement} detail="Offer/CAS students moving next." tone="green" />
        <BoardCard label="Urgent Recovery" value={executiveBoard.urgentRecovery} detail="High-risk but valuable cases." tone="red" />
        <BoardCard label="Application Yield" value={pct(health.applicationSubmitted, health.total)} detail="Submitted or beyond." tone="gold" />
        <BoardCard label="Visa Yield" value={pct(health.visaInMotion, health.total)} detail="Pending or approved." tone="green" />
        <BoardCard label="Weak Ops Load" value={health.weakDocuments + health.weakTasks + health.weakUniversityPlan} detail="Docs/tasks/planning pressure." tone="orange" />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <BoardList title="Risk Board" items={executiveBoard.riskPipeline} scoreKey="risk_score" tone="red" />
        <BoardList title="Opportunity Board" items={executiveBoard.opportunityPipeline} scoreKey="opportunity_score" tone="gold" />
        <BoardList title="Stalled Board" items={executiveBoard.stalledPipeline} scoreKey="days_since_updated" tone="orange" />
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


function BoardCard({ label, value, detail, tone = "default" }) {
  const style = getToneStyle(tone);
  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.025em] text-[#17243D]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#7A8392]">{detail}</p>
    </div>
  );
}

function BoardList({ title, items = [], scoreKey, tone = "gold" }) {
  const style = getToneStyle(tone);
  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-5">
      <h3 className="font-black text-[#17243D]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item, index) => {
          const student = item.student || {};
          const executive = item.executive || {};
          const name = getStudentName(student, executive);
          return (
            <div key={`${title}-${name}-${index}`} className="rounded-xl border border-[#243A60]/18 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#17243D]">{name}</p>
                  <p className="mt-1 text-xs text-[#7A8392]">{formatLabel(executive.journey_stage || "not_started")} • {executive.executive_category || "Standard"}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${style}`}>{executive[scoreKey] || 0}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#7A8392]">{executive.summary || "No portfolio summary."}</p>
            </div>
          );
        }) : <p className="rounded-xl border border-[#243A60]/18 bg-white p-4 text-sm text-[#7A8392]">No records.</p>}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black tracking-[-0.025em] text-[#17243D]">{value || 0}</p>
    </div>
  );
}

function HealthBlock({ title, total = 0, rows = [] }) {
  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-5">
      <h3 className="font-black text-[#17243D]">{title}</h3>

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
    <div className="rounded-xl border border-[#243A60]/18 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-[#667085]">{label}</p>
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
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-5">
      <h3 className="font-black text-[#17243D]">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => {
            const student = item.student || {};
            const executive = item.executive || {};
            const name = getStudentName(student, executive);

            return (
              <div
                key={`${name}-${index}`}
                className="rounded-xl border border-[#243A60]/18 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#17243D]">{name}</p>

                    <p className="mt-1 text-xs text-[#7A8392]">
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

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#7A8392]">
                  {executive.summary || "No executive summary."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#8992A1]">
                  <span>Docs {executive.diagnostics?.document_readiness_percent || 0}%</span>
                  <span>Tasks {executive.diagnostics?.task_completion_percent || 0}%</span>
                  <span>Universities {executive.diagnostics?.university_plan_count || 0}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-[#243A60]/18 bg-white p-4 text-sm text-[#7A8392]">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]"
    : gold
    ? "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]"
    : "border-[#243A60]/18 bg-white text-[#7A8392]";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]";
  if (tone === "orange") return "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]";
  if (tone === "gold") return "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]";
  if (tone === "green") return "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]";
  if (tone === "blue") return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";

  return "border-[#243A60]/18 bg-white text-[#596579]";
}

function getToneText(tone = "") {
  if (tone === "red") return "text-[#A8342F]";
  if (tone === "orange") return "text-[#8A5611]";
  if (tone === "gold") return "text-[#B84F0E]";
  if (tone === "green") return "text-[#B84F0E]";
  if (tone === "blue") return "text-[#243A60]";

  return "text-[#667085]";
}

function getToneBar(tone = "") {
  if (tone === "red") return "bg-red-400";
  if (tone === "orange") return "bg-orange-400";
  if (tone === "gold") return "bg-[#E9802D]";
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