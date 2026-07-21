// OpportunityFeedPanel V2 — Executive Opportunity Command Center
// Preserves opportunity signals, strength ranking, conversion/success/planning counts,
// hot/clean/risky/visa-ready command boards, journey-stage logic and recommendations.
// Visual system rebuilt for the approved Zaifan Admin OS: cream, white, navy and orange.

import { useMemo } from "react";

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

function getStudentName(student = {}) {
  return (
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    student?.studentName ||
    "Unknown Student"
  );
}

function getOpportunityScore(student = {}) {
  return number(student?.opportunity_score || student?.previous_opportunity_score || 0);
}

function getRiskScore(student = {}) {
  return number(student?.risk_score || student?.previous_risk_score || 0);
}

function getDiagnostic(student = {}, key, fallback = "") {
  return student?.[key] ?? student?.diagnostics?.[key] ?? fallback;
}

function getJourneyStage(student = {}) {
  const directStage = normalize(student?.journey_stage || student?.diagnostics?.journey_stage);
  if (directStage) return directStage;

  const applicationStatus = normalize(student?.application_status);
  const offerStatus = normalize(student?.offer_status);
  const visaStatus = normalize(student?.visa_status);

  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visaStatus)) {
    return "visa_pending";
  }

  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";

  if (
    ["offer_accepted", "accepted"].includes(applicationStatus) ||
    ["offer_accepted", "accepted"].includes(offerStatus)
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

function getOpportunitySignals(student = {}) {
  const opportunityScore = getOpportunityScore(student);
  const riskScore = getRiskScore(student);
  const category = normalize(student?.executive_category);
  const priorityLevel = normalize(student?.priority_level);
  const journeyStage = getJourneyStage(student);

  const documentReadiness = number(getDiagnostic(student, "document_readiness_percent"));
  const taskCompletion = number(getDiagnostic(student, "task_completion_percent"));
  const universityPlanCount = number(getDiagnostic(student, "university_plan_count"));
  const safeUniversityCount = number(
    getDiagnostic(student, "safe_university_count", student?.safe_universities_count || 0)
  );
  const overdueTasks = number(getDiagnostic(student, "overdue_tasks_count"));
  const pendingTasks = number(getDiagnostic(student, "pending_tasks_count"));

  const signals = [];

  if (journeyStage === "visa_approved") {
    signals.push({
      type: "success_story",
      strength: 100,
      label: "Success Story",
      reason: "Visa approved student ready for final success tracking.",
      action: "Move to success tracking and testimonial/review follow-up.",
    });
  }

  if (journeyStage === "visa_pending") {
    signals.push({
      type: "visa_pending",
      strength: 88,
      label: "Visa In Progress",
      reason: "Visa case is active and close to final outcome.",
      action: "Monitor visa decision and keep documents ready.",
    });
  }

  if (journeyStage === "cas_issued") {
    signals.push({
      type: "cas_issued",
      strength: 86,
      label: "CAS Issued",
      reason: "CAS issued. Student is ready to move into visa execution.",
      action: "Start or confirm visa checklist immediately.",
    });
  }

  if (journeyStage === "cas_pending") {
    signals.push({
      type: "cas_pending",
      strength: 82,
      label: "CAS Pending",
      reason: "CAS pending student is close to visa stage.",
      action: "Follow up on CAS requirements and university timeline.",
    });
  }

  if (journeyStage === "offer_accepted") {
    signals.push({
      type: "offer_accepted",
      strength: 90,
      label: "Offer Accepted",
      reason: "Offer accepted student has strong conversion potential.",
      action: "Fast-track CAS and visa preparation.",
    });
  }

  if (journeyStage === "offer_received") {
    signals.push({
      type: "offer_received",
      strength: 78,
      label: "Offer Opportunity",
      reason: "Offer-stage student with strong conversion potential.",
      action: "Push offer acceptance and next payment/CAS steps.",
    });
  }

  if (category === "conversion_ready") {
    signals.push({
      type: "conversion_ready",
      strength: 84,
      label: "Conversion Ready",
      reason: "Executive AI marked this student as ready for conversion.",
      action: "Assign senior counselor follow-up.",
    });
  }

  if (category === "high_opportunity" || opportunityScore >= 80) {
    signals.push({
      type: "high_opportunity",
      strength: 80,
      label: "High Opportunity",
      reason: "High opportunity student requires executive follow-up.",
      action: "Prioritize counselor contact today.",
    });
  }

  if (documentReadiness >= 80 && taskCompletion >= 70 && riskScore < 65) {
    signals.push({
      type: "ready_profile",
      strength: 74,
      label: "Ready Profile",
      reason: "Strong readiness across documents and tasks.",
      action: "Move student toward application or offer conversion.",
    });
  }

  if (universityPlanCount >= 5 && safeUniversityCount > 0 && riskScore < 65) {
    signals.push({
      type: "strong_plan",
      strength: 70,
      label: "Strong Plan",
      reason: "Student has a balanced university strategy and can be moved forward.",
      action: "Review final shortlist and submit applications.",
    });
  } else if (universityPlanCount >= 3 && riskScore < 65) {
    signals.push({
      type: "good_plan",
      strength: 62,
      label: "Good Plan",
      reason: "Student has a meaningful university plan and can be moved forward.",
      action: "Strengthen plan with safe options if needed.",
    });
  }

  if (
    priorityLevel === "executive" &&
    opportunityScore >= 70 &&
    overdueTasks === 0 &&
    pendingTasks <= 5
  ) {
    signals.push({
      type: "clean_executive_case",
      strength: 76,
      label: "Clean Executive Case",
      reason: "Executive priority student has good opportunity with manageable task load.",
      action: "Fast-track next milestone.",
    });
  }

  return signals.sort((a, b) => b.strength - a.strength);
}

function getOpportunityReason(student = {}) {
  const signals = getOpportunitySignals(student);
  if (signals.length) return signals[0].reason;

  if (student?.summary) return student.summary;
  if (student?.gpt_summary) return student.gpt_summary;

  return "Student has positive journey signals worth executive attention.";
}

function getOpportunityBadge(student = {}) {
  const signals = getOpportunitySignals(student);
  if (signals.length) return signals[0].label;

  return student?.executive_category || "High Opportunity";
}

function getRecommendedAction(student = {}) {
  const signals = getOpportunitySignals(student);
  if (signals.length) return signals[0].action;

  return "Review profile and push the next journey milestone.";
}

function getOpportunityStrength(student = {}) {
  const signals = getOpportunitySignals(student);
  if (signals.length) return signals[0].strength;

  return getOpportunityScore(student);
}

function formatStage(stage = "") {
  const clean = normalize(stage);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function OpportunityFeedPanel({ students = [] }) {
  const opportunities = students
    .map((student) => ({
      student,
      signals: getOpportunitySignals(student),
      strength: getOpportunityStrength(student),
      opportunityScore: getOpportunityScore(student),
    }))
    .filter(({ student, signals, opportunityScore }) => {
      const category = normalize(student?.executive_category);
      const riskScore = getRiskScore(student);
      const documentReadiness = number(getDiagnostic(student, "document_readiness_percent"));
      const taskCompletion = number(getDiagnostic(student, "task_completion_percent"));
      const universityPlanCount = number(getDiagnostic(student, "university_plan_count"));

      return (
        signals.length > 0 ||
        category === "high_opportunity" ||
        category === "conversion_ready" ||
        category === "success_story" ||
        opportunityScore >= 50 ||
        (documentReadiness >= 70 && taskCompletion >= 60 && riskScore < 65) ||
        (universityPlanCount >= 3 && riskScore < 65)
      );
    })
    .sort((a, b) => {
      if (b.strength !== a.strength) return b.strength - a.strength;
      return b.opportunityScore - a.opportunityScore;
    })
    .slice(0, 8);

  const successCount = opportunities.filter((item) =>
    item.signals.some((signal) => signal.type === "success_story")
  ).length;

  const conversionCount = opportunities.filter((item) =>
    item.signals.some((signal) =>
      ["offer_accepted", "cas_pending", "cas_issued", "visa_pending", "conversion_ready"].includes(
        signal.type
      )
    )
  ).length;

  const planningCount = opportunities.filter((item) =>
    item.signals.some((signal) => ["strong_plan", "good_plan"].includes(signal.type))
  ).length;

  const opportunityCommand = useMemo(() => {
    const hot = opportunities.filter(({ opportunityScore, strength }) => opportunityScore >= 80 || strength >= 85);
    const visaReady = opportunities.filter(({ student }) =>
      ["offer_accepted", "cas_pending", "cas_issued"].includes(getJourneyStage(student))
    );
    const cleanWins = opportunities.filter(({ student }) =>
      getOpportunityScore(student) >= 70 && getRiskScore(student) < 60
    );
    const riskyWins = opportunities.filter(({ student }) =>
      getOpportunityScore(student) >= 70 && getRiskScore(student) >= 60
    );

    return { hot, visaReady, cleanWins, riskyWins };
  }, [opportunities]);

  return (
    <div className="rounded-[1.85rem] border-2 border-orange-300 bg-[#fff8ee] p-6 shadow-[0_14px_36px_rgba(15,35,63,0.07)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">
            Executive Opportunity
          </p>

          <h3 className="mt-1 font-black text-[#10233f]">Student Opportunity Feed</h3>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            High-value students across readiness, offers, CAS, visa progress,
            conversion potential, and success outcomes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SummaryBadge label="Opportunities" value={opportunities.length} />
          <SummaryBadge label="Conversion" value={conversionCount} tone="gold" />
          <SummaryBadge label="Success" value={successCount} />
          <SummaryBadge label="Planning" value={planningCount} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpportunityCommandCard label="Hot Opportunities" value={opportunityCommand.hot.length} detail="Highest strength or opportunity scores." tone="gold" />
        <OpportunityCommandCard label="Clean Wins" value={opportunityCommand.cleanWins.length} detail="High opportunity with manageable risk." tone="green" />
        <OpportunityCommandCard label="Risky Wins" value={opportunityCommand.riskyWins.length} detail="Valuable cases that need supervision." tone="orange" />
        <OpportunityCommandCard label="Visa Ready" value={opportunityCommand.visaReady.length} detail="Offer/CAS stage, ready for visa push." tone="blue" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <OpportunityMiniBoard title="Clean Win Board" items={opportunityCommand.cleanWins.slice(0, 4)} tone="green" />
        <OpportunityMiniBoard title="Risky Win Board" items={opportunityCommand.riskyWins.slice(0, 4)} tone="orange" />
        <OpportunityMiniBoard title="Visa Push Board" items={opportunityCommand.visaReady.slice(0, 4)} tone="blue" />
      </div>

      <div className="mt-5 space-y-3">
        {opportunities.length ? (
          opportunities.map(({ student, signals, strength, opportunityScore }) => {
            const name = getStudentName(student);
            const documentReadiness = number(getDiagnostic(student, "document_readiness_percent"));
            const taskCompletion = number(getDiagnostic(student, "task_completion_percent"));
            const universityPlanCount = number(getDiagnostic(student, "university_plan_count"));
            const riskScore = getRiskScore(student);
            const journeyStage = getJourneyStage(student);
            const topSignals = signals.slice(0, 3);

            return (
              <div
                key={student.id || name}
                className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-[#10233f]">{name}</p>

                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                        {formatStage(journeyStage)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-black text-emerald-700">
                      {getOpportunityBadge(student)}
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {getOpportunityReason(student)}
                    </p>

                    <p className="mt-2 rounded-xl border border-slate-300 bg-[#fffaf2] px-3 py-2 text-xs leading-5 text-slate-600">
                      Next action:{" "}
                      <span className="font-black text-[#10233f]">
                        {getRecommendedAction(student)}
                      </span>
                    </p>

                    {topSignals.length > 1 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {topSignals.map((signal) => (
                          <span
                            key={`${student.id || name}-${signal.type}`}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700"
                          >
                            {signal.label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                      <span>Docs {documentReadiness}%</span>
                      <span>Tasks {taskCompletion}%</span>
                      <span>Universities {universityPlanCount}</span>
                      <span>Risk {riskScore}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:items-end">
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      Opp {opportunityScore}
                    </span>

                    <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                      Strength {strength}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <p className="font-black text-[#10233f]">No major opportunities detected.</p>
            <p className="mt-2 text-sm text-slate-600">
              Executive AI does not currently see strong conversion, CAS, visa,
              readiness, or success signals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityCommandCard({ label, value, detail, tone = "green" }) {
  const style =
    tone === "gold"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : tone === "orange"
      ? "border-orange-300 bg-[#fff7ed] text-orange-700"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#10233f]">{value || 0}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function OpportunityMiniBoard({ title, items = [], tone = "green" }) {
  const scoreClass =
    tone === "orange"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <h3 className="font-black text-[#10233f]">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.map(({ student, strength, opportunityScore }, index) => {
          const name = getStudentName(student);
          return (
            <div key={`${title}-${student?.id || name}-${index}`} className="rounded-xl border border-slate-300 bg-[#fffaf2] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#10233f]">{name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatStage(getJourneyStage(student))} • Risk {getRiskScore(student)}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}>{Math.max(strength, opportunityScore)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{getOpportunityReason(student)}</p>
            </div>
          );
        }) : <p className="rounded-xl border border-dashed border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-500">No records.</p>}
      </div>
    </div>
  );
}

function SummaryBadge({ label, value, tone = "default" }) {
  const className =
    tone === "gold"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-black ${className}`}>
      {value} {label}
    </span>
  );
}

export default OpportunityFeedPanel;