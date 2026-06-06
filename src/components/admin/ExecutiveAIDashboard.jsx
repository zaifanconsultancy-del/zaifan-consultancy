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

function getJourneyStage(student = {}) {
  const directStage = normalize(student?.journey_stage);
  if (directStage) return directStage;

  const applicationStatus = normalize(student?.application_status);
  const offerStatus = normalize(student?.offer_status);
  const visaStatus = normalize(student?.visa_status);

  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused"].includes(visaStatus)) return "visa_rejected";
  if (["visa_pending", "pending", "submitted", "under_review"].includes(visaStatus)) {
    return "visa_pending";
  }

  if (["cas_issued"].includes(applicationStatus)) return "cas_issued";
  if (["cas_pending"].includes(applicationStatus)) return "cas_pending";

  if (
    ["offer_accepted", "accepted"].includes(applicationStatus) ||
    ["offer_accepted", "accepted"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "offer", "received"].includes(applicationStatus) ||
    ["offer_received", "offer", "received"].includes(offerStatus)
  ) {
    return "offer_received";
  }

  if (["under_review", "review"].includes(applicationStatus)) {
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

function ExecutiveAIDashboard({ students = [] }) {
  const metrics = useMemo(() => {
    const total = students.length;

    const analyzed = students.filter(
      (student) =>
        student?.gpt_analyzed_at ||
        student?.gpt_summary ||
        student?.risk_score ||
        student?.opportunity_score ||
        student?.executive_category ||
        student?.journey_stage
    ).length;

    const countBy = (fn) => students.filter(fn).length;

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
      const journeyStage = getJourneyStage(student);

      return (
        category === "conversion_ready" ||
        ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(journeyStage)
      );
    });

    const offerHolders = countBy((student) =>
      ["offer_received", "offer_accepted", "cas_pending", "cas_issued", "visa_pending", "visa_approved"].includes(
        getJourneyStage(student)
      )
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

      return category === "success_story" || applicationStatus === "enrolled";
    });

    const noApplication = countBy((student) => {
      const journeyStage = getJourneyStage(student);
      const applicationCount = asNumber(student?.application_count);

      return journeyStage === "not_started" || applicationCount === 0;
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
      ].includes(getJourneyStage(student))
    );

    const noUniversityPlan = countBy((student) => {
      const universityPlanCount = asNumber(student?.university_plan_count);
      return !isTruthy(student?.has_university_plan) && universityPlanCount === 0;
    });

    const missingSafeUniversity = countBy((student) => {
      const safeCount = asNumber(student?.safe_university_count || student?.safe_universities_count);
      const totalPlan = asNumber(student?.university_plan_count);
      return totalPlan > 0 && safeCount === 0;
    });

    const documentWeak = countBy((student) => {
      const health = getHealthValue(student, "document_health");
      const readiness = asNumber(student?.document_readiness_percent);

      return ["critical", "weak", "missing"].includes(health) || readiness < 60;
    });

    const taskProblems = countBy((student) => {
      const overdue = asNumber(student?.overdue_tasks_count);
      const pending = asNumber(student?.pending_tasks_count);
      const health = getHealthValue(student, "task_health");

      return overdue > 0 || pending > 5 || ["critical", "weak"].includes(health);
    });

    const staleStudents = countBy((student) => {
      const days = asNumber(student?.days_since_updated, -1);
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

    return {
      total,
      analyzed,
      coverage: total ? Math.round((analyzed / total) * 100) : 0,

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
    };
  }, [students]);

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
          university planning, tasks, documents, and student risk.
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
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

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
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${badgeClass}`}>
          Watch
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/45">{detail}</p>
    </div>
  );
}

export default ExecutiveAIDashboard;