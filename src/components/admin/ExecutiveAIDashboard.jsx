import { useMemo } from "react";
import RiskMonitoringPanel from "./RiskMonitoringPanel";
import OpportunityFeedPanel from "./OpportunityFeedPanel";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function percent(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((asNumber(value) / total) * 100)));
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

function getStudentName(student = {}, fallback = "Unknown Student") {
  return student?.student_name || student?.full_name || student?.name || fallback;
}

function getJourneyStage(student = {}) {
  const directStage =
    normalize(student?.journey_stage) || normalize(student?.diagnostics?.journey_stage);

  if (directStage) return directStage;

  const applicationStatus = normalize(student?.application_status);
  const offerStatus = normalize(student?.offer_status);
  const visaStatus = normalize(student?.visa_status);

  if (applicationStatus === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }

  if (
    ["visa_pending", "pending", "submitted", "under_review", "review", "processing"].includes(
      visaStatus
    )
  ) {
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
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      applicationStatus
    ) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      offerStatus
    )
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (["started", "in_progress", "draft"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getHealthValue(student = {}, key, fallback = "") {
  return normalize(student?.[key] || student?.diagnostics?.[key] || fallback);
}

function getScoreValue(student = {}, key, fallback = 0) {
  return student?.[key] ?? student?.diagnostics?.[key] ?? fallback;
}

function buildMetrics(students = []) {
  const total = students.length;
  const countBy = (fn) => students.filter(fn).length;

  const analyzed = countBy(
    (student) =>
      student?.gpt_analyzed_at ||
      student?.gpt_summary ||
      student?.risk_score ||
      student?.opportunity_score ||
      student?.executive_category ||
      student?.journey_stage
  );

  const criticalRisk = countBy((student) => {
    const category = normalize(student?.executive_category);
    const riskLevel = normalize(student?.risk_level);
    const riskScore = asNumber(student?.risk_score);
    return category === "critical_risk" || riskLevel === "critical" || riskScore >= 85;
  });

  const highRisk = countBy((student) => {
    const riskLevel = normalize(student?.risk_level);
    const riskScore = asNumber(student?.risk_score);
    return riskLevel === "high" || (riskScore >= 65 && riskScore < 85);
  });

  const mediumRisk = countBy((student) => {
    const riskLevel = normalize(student?.risk_level);
    const riskScore = asNumber(student?.risk_score);
    return riskLevel === "medium" || (riskScore >= 35 && riskScore < 65);
  });

  const executivePriority = countBy((student) => {
    const priority = normalize(student?.priority_level);
    const riskScore = asNumber(student?.risk_score);
    const opportunityScore = asNumber(student?.opportunity_score);
    return priority === "executive" || riskScore >= 85 || opportunityScore >= 85;
  });

  const highOpportunity = countBy((student) => {
    const category = normalize(student?.executive_category);
    const opportunityScore = asNumber(student?.opportunity_score);
    return category === "high_opportunity" || opportunityScore >= 80;
  });

  const conversionReady = countBy((student) => {
    const category = normalize(student?.executive_category);
    const stage = getJourneyStage(student);
    return (
      category === "conversion_ready" ||
      ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage)
    );
  });

  const offerHolders = countBy((student) =>
    [
      "offer_received",
      "offer_accepted",
      "cas_pending",
      "cas_issued",
      "visa_pending",
      "visa_approved",
    ].includes(getJourneyStage(student))
  );

  const casPending = countBy((student) => getJourneyStage(student) === "cas_pending");
  const casIssued = countBy((student) => getJourneyStage(student) === "cas_issued");

  const visaStage = countBy((student) =>
    ["visa_pending", "visa_approved", "visa_rejected"].includes(getJourneyStage(student))
  );

  const visaPending = countBy((student) => getJourneyStage(student) === "visa_pending");
  const visaApproved = countBy((student) => getJourneyStage(student) === "visa_approved");
  const visaRejected = countBy((student) => getJourneyStage(student) === "visa_rejected");

  const enrolledStudents = countBy((student) => {
    const category = normalize(student?.executive_category);
    const applicationStatus = normalize(student?.application_status);
    const stage = getJourneyStage(student);
    return category === "success_story" || applicationStatus === "enrolled" || stage === "enrolled";
  });

  const noApplication = countBy((student) => {
    const stage = getJourneyStage(student);
    const applicationCount = asNumber(student?.application_count);
    return stage === "not_started" || applicationCount === 0;
  });

  const applicationStarted = countBy((student) =>
    [
      "application_started",
      "application_submitted",
      "application_under_review",
      "offer_received",
      "offer_accepted",
      "cas_pending",
      "cas_issued",
      "visa_pending",
      "visa_approved",
      "enrolled",
    ].includes(getJourneyStage(student))
  );

  const applicationSubmitted = countBy((student) =>
    [
      "application_submitted",
      "application_under_review",
      "offer_received",
      "offer_accepted",
      "cas_pending",
      "cas_issued",
      "visa_pending",
      "visa_approved",
      "enrolled",
    ].includes(getJourneyStage(student))
  );

  const noUniversityPlan = countBy((student) => {
    const universityPlanCount = asNumber(getScoreValue(student, "university_plan_count"));
    return !isTruthy(student?.has_university_plan) && universityPlanCount === 0;
  });

  const missingSafeUniversity = countBy((student) => {
    const safeCount = asNumber(
      getScoreValue(student, "safe_university_count", student?.safe_universities_count)
    );
    const totalPlan = asNumber(getScoreValue(student, "university_plan_count"));
    return totalPlan > 0 && safeCount === 0;
  });

  const documentWeak = countBy((student) => {
    const health = getHealthValue(student, "document_health");
    const readiness = asNumber(getScoreValue(student, "document_readiness_percent"));
    return ["critical", "weak", "missing"].includes(health) || readiness < 60;
  });

  const taskProblems = countBy((student) => {
    const overdue = asNumber(getScoreValue(student, "overdue_tasks_count"));
    const pending = asNumber(getScoreValue(student, "pending_tasks_count"));
    const health = getHealthValue(student, "task_health");
    return overdue > 0 || pending > 5 || ["critical", "weak"].includes(health);
  });

  const staleStudents = countBy((student) => {
    const days = asNumber(getScoreValue(student, "days_since_updated"), -1);
    return days >= 10;
  });

  const averageRisk = total
    ? Math.round(students.reduce((sum, student) => sum + asNumber(student?.risk_score), 0) / total)
    : 0;

  const averageOpportunity = total
    ? Math.round(
        students.reduce((sum, student) => sum + asNumber(student?.opportunity_score), 0) / total
      )
    : 0;

  const journey = {
    notStarted: noApplication,
    started: applicationStarted,
    submitted: applicationSubmitted,
    offerHolders,
    conversionReady,
    casPending,
    casIssued,
    visaPending,
    visaApproved,
    visaRejected,
    enrolled: enrolledStudents,
  };

  const journeyPercent = {
    started: percent(applicationStarted, total),
    submitted: percent(applicationSubmitted, total),
    offers: percent(offerHolders, total),
    cas: percent(casPending + casIssued, total),
    visa: percent(visaStage, total),
    success: percent(visaApproved + enrolledStudents, total),
  };

  return {
    total,
    analyzed,
    coverage: percent(analyzed, total),

    criticalRisk,
    highRisk,
    mediumRisk,
    executivePriority,
    highOpportunity,
    conversionReady,

    offerHolders,
    casPending,
    casIssued,
    visaStage,
    visaPending,
    visaApproved,
    visaRejected,
    enrolledStudents,

    noApplication,
    applicationStarted,
    applicationSubmitted,
    noUniversityPlan,
    missingSafeUniversity,
    documentWeak,
    taskProblems,
    staleStudents,

    averageRisk,
    averageOpportunity,
    journey,
    journeyPercent,
  };
}

function buildExecutiveIntelligence(students = []) {
  const rankedRisk = [...students]
    .sort((a, b) => asNumber(b?.risk_score) - asNumber(a?.risk_score))
    .slice(0, 6);

  const rankedOpportunity = [...students]
    .sort((a, b) => asNumber(b?.opportunity_score) - asNumber(a?.opportunity_score))
    .slice(0, 6);

  const stalled = students
    .filter((student) => {
      const days = asNumber(getScoreValue(student, "days_since_updated"), -1);
      const stage = getJourneyStage(student);
      return days >= 10 || ["not_started", "application_started", "cas_pending"].includes(stage);
    })
    .sort(
      (a, b) =>
        asNumber(getScoreValue(b, "days_since_updated"), -1) -
        asNumber(getScoreValue(a, "days_since_updated"), -1)
    )
    .slice(0, 6);

  const readyForVisa = students.filter((student) =>
    ["offer_accepted", "cas_pending", "cas_issued"].includes(getJourneyStage(student))
  ).length;

  const likelyWins = students.filter(
    (student) => asNumber(student?.opportunity_score) >= 70 && asNumber(student?.risk_score) < 65
  ).length;

  const rescueCases = students.filter(
    (student) => asNumber(student?.risk_score) >= 70 && asNumber(student?.opportunity_score) >= 60
  ).length;

  const lostOrRejected = students.filter((student) =>
    ["visa_rejected", "offer_rejected"].includes(getJourneyStage(student))
  ).length;

  const leadershipPriority =
    rescueCases > 0
      ? "Rescue high-value risky students first."
      : readyForVisa > 0
      ? "Move CAS/offer students into visa workflow."
      : likelyWins > 0
      ? "Fast-track likely wins."
      : stalled.length > 0
      ? "Revive stalled students."
      : "Portfolio looks stable.";

  return {
    rankedRisk,
    rankedOpportunity,
    stalled,
    readyForVisa,
    likelyWins,
    rescueCases,
    lostOrRejected,
    leadershipPriority,
  };
}

function buildAutomationPressure(students = []) {
  const summary = {
    totalStudents: students.length,
    automationCandidates: 0,
    approvalLikely: 0,
    conversionActions: 0,
    rescueActions: 0,
    documentActions: 0,
    taskActions: 0,
    visaActions: 0,
    universityActions: 0,
    stalledActions: 0,
    communicationActions: 0,
    estimatedWorkload: "Light",
    pressureScore: 0,
  };

  students.forEach((student) => {
    const risk = asNumber(student?.risk_score);
    const opportunity = asNumber(student?.opportunity_score);
    const stage = getJourneyStage(student);
    const docs = asNumber(getScoreValue(student, "document_readiness_percent"));
    const overdue = asNumber(getScoreValue(student, "overdue_tasks_count"));
    const pending = asNumber(getScoreValue(student, "pending_tasks_count"));
    const days = asNumber(getScoreValue(student, "days_since_updated"), -1);
    const universityPlanCount = asNumber(getScoreValue(student, "university_plan_count"));
    const safeCount = asNumber(getScoreValue(student, "safe_university_count"));

    const isCandidate =
      risk >= 35 ||
      opportunity >= 55 ||
      docs < 60 ||
      overdue > 0 ||
      pending > 5 ||
      days >= 10 ||
      universityPlanCount === 0 ||
      (universityPlanCount > 0 && safeCount === 0) ||
      [
        "offer_received",
        "offer_accepted",
        "cas_pending",
        "cas_issued",
        "visa_pending",
        "visa_rejected",
      ].includes(stage);

    if (!isCandidate) return;

    summary.automationCandidates += 1;

    if (risk >= 65 || opportunity >= 80) summary.approvalLikely += 1;
    if (["offer_received", "offer_accepted", "cas_pending", "cas_issued"].includes(stage)) {
      summary.conversionActions += 1;
    }
    if (risk >= 70) summary.rescueActions += 1;
    if (docs < 60) summary.documentActions += 1;
    if (overdue > 0 || pending > 5) summary.taskActions += 1;
    if (["cas_issued", "visa_pending", "visa_rejected"].includes(stage)) summary.visaActions += 1;
    if (universityPlanCount === 0 || (universityPlanCount > 0 && safeCount === 0)) {
      summary.universityActions += 1;
    }
    if (days >= 10) summary.stalledActions += 1;
    if (days >= 10 || opportunity >= 70 || ["offer_received", "visa_approved"].includes(stage)) {
      summary.communicationActions += 1;
    }
  });

  summary.pressureScore = Math.min(
    100,
    summary.automationCandidates * 5 +
      summary.approvalLikely * 6 +
      summary.rescueActions * 7 +
      summary.visaActions * 5
  );

  if (summary.automationCandidates >= 20 || summary.pressureScore >= 75) {
    summary.estimatedWorkload = "Heavy";
  } else if (summary.automationCandidates >= 10 || summary.pressureScore >= 40) {
    summary.estimatedWorkload = "Medium";
  }

  return summary;
}

function ExecutiveAIDashboard({ students = [] }) {
  const metrics = useMemo(() => buildMetrics(students), [students]);
  const executiveIntelligence = useMemo(() => buildExecutiveIntelligence(students), [students]);
  const automationPressure = useMemo(() => buildAutomationPressure(students), [students]);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          Executive Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          Student OS Command Dashboard
        </h2>

        <p className="mt-2 max-w-4xl text-white/60">
          Executive-level intelligence across applications, offers, CAS, visa,
          university planning, tasks, documents, student risk, and automation pressure.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <CommandPill
            label="Portfolio Risk"
            value={`${metrics.averageRisk}/100`}
            tone={metrics.averageRisk >= 65 ? "risk" : metrics.averageRisk >= 35 ? "warning" : "good"}
          />
          <CommandPill
            label="Opportunity Index"
            value={`${metrics.averageOpportunity}/100`}
            tone={metrics.averageOpportunity >= 65 ? "good" : "neutral"}
          />
          <CommandPill
            label="AI Coverage"
            value={`${metrics.coverage}%`}
            tone={metrics.coverage >= 80 ? "good" : metrics.coverage >= 50 ? "warning" : "risk"}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
            Leadership Priority
          </p>
          <p className="mt-2 text-lg font-black text-white">
            {executiveIntelligence.leadershipPriority}
          </p>
        </div>
      </div>

      <SectionTitle
        eyebrow="Command Metrics"
        title="Executive Overview"
        description="Fast view of the most important Student OS signals."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard label="Students Loaded" value={metrics.total} />
        <MetricCard label="AI Coverage" value={`${metrics.coverage}%`} />
        <MetricCard label="Executive Priority" value={metrics.executivePriority} tone="gold" />
        <MetricCard label="Critical Risk" value={metrics.criticalRisk} tone="risk" />
        <MetricCard label="High Risk" value={metrics.highRisk} tone="warning" />
        <MetricCard label="Medium Risk" value={metrics.mediumRisk} />
        <MetricCard label="High Opportunity" value={metrics.highOpportunity} tone="good" />
        <MetricCard label="Conversion Ready" value={metrics.conversionReady} tone="good" />
      </div>

      <SectionTitle
        eyebrow="Student Journey"
        title="Application → Offer → CAS → Visa"
        description="This is the real operating system path, not CRM lead scoring."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="No Application" value={metrics.journey.notStarted} tone="warning" />
        <MetricCard label="Application Started" value={metrics.journey.started} />
        <MetricCard label="Application Submitted" value={metrics.journey.submitted} />
        <MetricCard label="Offer Holders" value={metrics.journey.offerHolders} tone="good" />
        <MetricCard label="Conversion Ready" value={metrics.journey.conversionReady} tone="gold" />
        <MetricCard label="CAS Pending" value={metrics.journey.casPending} tone="warning" />
        <MetricCard label="CAS Issued" value={metrics.journey.casIssued} tone="good" />
        <MetricCard label="Visa Pending" value={metrics.journey.visaPending} tone="warning" />
        <MetricCard label="Visa Approved" value={metrics.journey.visaApproved} tone="good" />
        <MetricCard label="Visa Rejected" value={metrics.journey.visaRejected} tone="risk" />
      </div>

      <JourneyProgressPanel metrics={metrics} />

      <SectionTitle
        eyebrow="Foundation Health"
        title="Operational Gaps"
        description="These numbers show what counselors need to fix first."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          label="No University Plan"
          value={metrics.noUniversityPlan}
          detail="Students without dream, target, or safe planning."
          tone="warning"
        />
        <HealthCard
          label="Missing Safe University"
          value={metrics.missingSafeUniversity}
          detail="Students with plans but no safe option."
          tone="risk"
        />
        <HealthCard
          label="Weak Documents"
          value={metrics.documentWeak}
          detail="Low readiness or missing document signals."
          tone="warning"
        />
        <HealthCard
          label="Task Problems"
          value={metrics.taskProblems}
          detail="Overdue or overloaded student task queues."
          tone="risk"
        />
      </div>

      <SectionTitle
        eyebrow="Executive Automation Pressure"
        title="Automation Engine Readiness"
        description="Shows how much counselor work can be prepared by Executive AI."
      />

      <AutomationPressurePanel automationPressure={automationPressure} />

      <SectionTitle
        eyebrow="Executive Business Intelligence"
        title="Portfolio Forecast & Leadership View"
        description="This layer helps the consultancy see expected wins, risky revenue, stalled students, and next-stage movement."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <ForecastCard
          label="Likely Wins"
          value={executiveIntelligence.likelyWins}
          detail="High opportunity with controlled risk."
          tone="good"
        />
        <ForecastCard
          label="Rescue Cases"
          value={executiveIntelligence.rescueCases}
          detail="High value but needs intervention."
          tone="warning"
        />
        <ForecastCard
          label="Visa Ready Soon"
          value={executiveIntelligence.readyForVisa}
          detail="Offer/CAS students close to visa."
          tone="gold"
        />
        <ForecastCard
          label="Stalled Watch"
          value={executiveIntelligence.stalled.length}
          detail="Needs fresh movement or follow-up."
          tone="risk"
        />
        <ForecastCard
          label="Rejected / Lost"
          value={executiveIntelligence.lostOrRejected}
          detail="Cases needing recovery or closure."
          tone="risk"
        />
        <ForecastCard
          label="Opportunity Power"
          value={`${metrics.averageOpportunity}/100`}
          detail="Portfolio-wide opportunity average."
          tone="good"
        />
      </div>

      <ExecutiveRadar metrics={metrics} />

      <div className="grid gap-5 xl:grid-cols-3">
        <ExecutiveStudentList
          title="Highest Risk Students"
          items={executiveIntelligence.rankedRisk}
          scoreKey="risk_score"
          tone="risk"
        />
        <ExecutiveStudentList
          title="Highest Opportunity Students"
          items={executiveIntelligence.rankedOpportunity}
          scoreKey="opportunity_score"
          tone="gold"
        />
        <ExecutiveStudentList
          title="Stalled / Low Movement"
          items={executiveIntelligence.stalled}
          scoreKey="days_since_updated"
          tone="warning"
        />
      </div>

      <ExecutiveOperationsExpansion
        metrics={metrics}
        executiveIntelligence={executiveIntelligence}
        automationPressure={automationPressure}
      />

      <RiskMonitoringPanel students={students} />
      <OpportunityFeedPanel students={students} />
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]/80">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
      {description ? <p className="mt-1 text-sm text-white/45">{description}</p> : null}
    </div>
  );
}

function CommandPill({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "risk"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : tone === "warning"
      ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-100"
      : tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : "border-white/10 bg-white/[0.04] text-white/80";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const valueClass =
    tone === "risk"
      ? "text-red-300"
      : tone === "warning"
      ? "text-yellow-200"
      : tone === "good"
      ? "text-emerald-300"
      : tone === "gold"
      ? "text-[#D4AF37]"
      : "text-[#D4AF37]";

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className={`mt-3 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function HealthCard({ label, value, detail, tone = "default" }) {
  const badgeClass =
    tone === "risk"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : tone === "warning"
      ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-100"
      : "border-white/10 bg-white/[0.04] text-white/70";

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${badgeClass}`}
        >
          Watch
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/45">{detail}</p>
    </div>
  );
}

function ForecastCard({ label, value, detail, tone = "default" }) {
  const style =
    tone === "risk"
      ? "border-red-400/25 bg-red-500/10 text-red-200"
      : tone === "warning"
      ? "border-orange-400/25 bg-orange-500/10 text-orange-200"
      : tone === "good"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : tone === "gold"
      ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
      : "border-white/10 bg-white/[0.035] text-white/70";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{detail}</p>
    </div>
  );
}

function JourneyProgressPanel({ metrics }) {
  const rows = [
    ["Application Started", metrics.journeyPercent.started],
    ["Application Submitted", metrics.journeyPercent.submitted],
    ["Offer Holders", metrics.journeyPercent.offers],
    ["CAS Movement", metrics.journeyPercent.cas],
    ["Visa Movement", metrics.journeyPercent.visa],
    ["Success Movement", metrics.journeyPercent.success],
  ];

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]/80">
        Journey Conversion Map
      </p>
      <h3 className="mt-1 text-xl font-black text-white">
        Student OS Movement Funnel
      </h3>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <ProgressBar key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function AutomationPressurePanel({ automationPressure }) {
  return (
    <div className="rounded-[1.75rem] border border-purple-400/20 bg-purple-500/[0.04] p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-purple-300">
            Automation Pressure
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            {automationPressure.estimatedWorkload} Workload
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            Executive AI sees {automationPressure.automationCandidates} student(s) that can
            generate prepared counselor actions. {automationPressure.approvalLikely} likely need
            approval before execution.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
            Pressure Score
          </p>
          <p className="mt-2 text-3xl font-black text-purple-200">
            {automationPressure.pressureScore}/100
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SmallInfo label="Conversion Actions" value={automationPressure.conversionActions} />
        <SmallInfo label="Rescue Actions" value={automationPressure.rescueActions} />
        <SmallInfo label="Document Actions" value={automationPressure.documentActions} />
        <SmallInfo label="Task Actions" value={automationPressure.taskActions} />
        <SmallInfo label="Visa Actions" value={automationPressure.visaActions} />
        <SmallInfo label="University Actions" value={automationPressure.universityActions} />
        <SmallInfo label="Stalled Actions" value={automationPressure.stalledActions} />
        <SmallInfo label="Communication Actions" value={automationPressure.communicationActions} />
      </div>
    </div>
  );
}

function ExecutiveRadar({ metrics }) {
  const rows = [
    ["Applications", metrics.applicationSubmitted, metrics.total],
    ["Offers", metrics.offerHolders, metrics.total],
    ["CAS", metrics.casPending + metrics.casIssued, metrics.total],
    ["Visa", metrics.visaStage, metrics.total],
    ["Documents Weak", metrics.documentWeak, metrics.total],
    ["Task Problems", metrics.taskProblems, metrics.total],
  ];

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]/80">
            Executive Health Radar
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            Operating System Coverage
          </h3>
        </div>
        <p className="text-sm text-white/40">
          Positive bars show progress; weak bars reveal operational pressure.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value, total]) => (
          <ProgressBar key={label} label={`${label} ${value}/${total}`} value={percent(value, total)} />
        ))}
      </div>
    </div>
  );
}

function ExecutiveStudentList({ title, items = [], scoreKey, tone = "gold" }) {
  const scoreClass =
    tone === "risk"
      ? "border-red-400/25 bg-red-500/10 text-red-300"
      : tone === "warning"
      ? "border-orange-400/25 bg-orange-500/10 text-orange-300"
      : "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
      <h3 className="font-black text-white">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((student, index) => {
            const name = getStudentName(student, `Student ${index + 1}`);
            return (
              <div
                key={`${title}-${student?.id || student?.student_id || index}`}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{name}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {formatLabel(getJourneyStage(student))} •{" "}
                      {student?.executive_category || "Standard"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}
                  >
                    {asNumber(getScoreValue(student, scoreKey, student?.[scoreKey]))}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">
                  {student?.summary || student?.gpt_summary || "No executive summary available."}
                </p>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">
            No records yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between text-xs font-bold text-white/50">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}


function ExecutiveOperationsExpansion({ metrics, executiveIntelligence, automationPressure }) {
  const operatingScore = Math.round(
    (metrics.coverage +
      metrics.journeyPercent.started +
      metrics.journeyPercent.submitted +
      metrics.journeyPercent.offers +
      metrics.journeyPercent.cas +
      metrics.journeyPercent.visa +
      Math.max(0, 100 - automationPressure.pressureScore)) /
      7
  );

  const commandRows = [
    ["Executive Priority", metrics.executivePriority, "Students needing owner/counselor attention."],
    ["Critical Risk", metrics.criticalRisk, "Cases that should not wait."],
    ["Visa/CAS Watch", metrics.casPending + metrics.casIssued + metrics.visaPending + metrics.visaRejected, "Students in late-stage movement."],
    ["Stalled Watch", executiveIntelligence.stalled.length, "Students with low movement or stale activity."],
    ["Automation Candidates", automationPressure.automationCandidates, "Actions Executive AI can prepare."],
    ["Approval Likely", automationPressure.approvalLikely, "Actions that should stay human-approved."],
  ];

  return (
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]/80">
            Admin Operations Extension
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            Command Readiness Snapshot
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            This connects Executive AI intelligence to daily admin operations. Use it
            with the new Operations Center tab for one-screen CEO/Counselor visibility.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
            Operating Score
          </p>
          <p className="mt-2 text-3xl font-black text-[#D4AF37]">
            {operatingScore}/100
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {commandRows.map(([label, value, detail]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
            <p className="mt-2 text-xs leading-5 text-white/40">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


function buildExecutiveDashboardAutomationSummary(students = []) {
  return buildAutomationPressure(Array.isArray(students) ? students : []);
}

function buildExecutiveLeadershipSnapshot(students = []) {
  const rows = Array.isArray(students) ? students : [];
  const automation = buildExecutiveDashboardAutomationSummary(rows);

  return {
    ...automation,
    leadershipMessage:
      automation.automationCandidates === 0
        ? "Portfolio is stable. No urgent automation pressure detected."
        : `${automation.automationCandidates} student action(s) are ready for counselor review. ${automation.approvalLikely} may need human approval first.`,
  };
}

export default ExecutiveAIDashboard;