// OpportunityFeedPanel V3 MAXIMUM — Executive Opportunity Command Center
// src/components/admin/OpportunityFeedPanel.jsx
//
// Maximum pass:
// - preserves opportunity / risk / diagnostics / journey-stage contracts
// - preserves conversion, planning, CAS, visa, readiness and command-board logic
// - removes fake "success story / testimonial" language: visa approval is treated as a real outcome only
// - memoizes expensive signal analysis instead of recalculating repeatedly
// - adds search, opportunity-type filter and risk filter
// - adds portfolio opportunity / risk / readiness intelligence
// - adds strongest-stage and action-priority summaries
// - separates clean wins from supervised/risky wins more clearly
// - safer malformed values and duplicate-resistant row keys
// - reduced-motion support
// - stronger Admin OS cream/orange/navy contrast
// - no backend writes, no invented outcomes, no fake testimonials

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CircleGauge,
  Crown,
  FileCheck2,
  GraduationCap,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

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

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, number(value)));
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
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
  return clamp(
    student?.opportunity_score ||
      student?.previous_opportunity_score ||
      0
  );
}

function getRiskScore(student = {}) {
  return clamp(
    student?.risk_score ||
      student?.previous_risk_score ||
      0
  );
}

function getDiagnostic(student = {}, key, fallback = "") {
  return student?.[key] ?? student?.diagnostics?.[key] ?? fallback;
}

function getJourneyStage(student = {}) {
  const directStage = normalize(
    student?.journey_stage ||
      student?.diagnostics?.journey_stage
  );

  if (directStage) return directStage;

  const applicationStatus = normalize(student?.application_status);
  const offerStatus = normalize(student?.offer_status);
  const visaStatus = normalize(student?.visa_status);

  if (["visa_approved", "approved"].includes(visaStatus)) {
    return "visa_approved";
  }

  if (
    ["visa_rejected", "rejected", "refused", "visa_refused"].includes(
      visaStatus
    )
  ) {
    return "visa_rejected";
  }

  if (
    ["visa_pending", "pending", "submitted", "under_review", "review"].includes(
      visaStatus
    )
  ) {
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
    [
      "offer_received",
      "offer",
      "received",
      "conditional_offer",
      "unconditional_offer",
    ].includes(applicationStatus) ||
    [
      "offer_received",
      "offer",
      "received",
      "conditional_offer",
      "unconditional_offer",
    ].includes(offerStatus)
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

  const documentReadiness = clamp(
    getDiagnostic(student, "document_readiness_percent")
  );

  const taskCompletion = clamp(
    getDiagnostic(student, "task_completion_percent")
  );

  const universityPlanCount = Math.max(
    0,
    number(getDiagnostic(student, "university_plan_count"))
  );

  const safeUniversityCount = Math.max(
    0,
    number(
      getDiagnostic(
        student,
        "safe_university_count",
        student?.safe_universities_count || 0
      )
    )
  );

  const overdueTasks = Math.max(
    0,
    number(getDiagnostic(student, "overdue_tasks_count"))
  );

  const pendingTasks = Math.max(
    0,
    number(getDiagnostic(student, "pending_tasks_count"))
  );

  const signals = [];

  if (journeyStage === "visa_approved") {
    signals.push({
      type: "visa_approved",
      strength: 100,
      label: "Visa Approved",
      reason:
        "Visa approval is a confirmed student outcome and the journey is ready for final enrollment and departure tracking.",
      action:
        "Complete pre-departure, enrollment, accommodation, and final student handover steps.",
    });
  }

  if (journeyStage === "visa_rejected") {
    signals.push({
      type: "visa_recovery",
      strength: 68,
      label: "Visa Recovery Case",
      reason:
        "The student still has opportunity value, but visa refusal requires supervised recovery before further progression.",
      action:
        "Review refusal reasons, evidence gaps, and whether a safe reapplication route exists.",
    });
  }

  if (journeyStage === "visa_pending") {
    signals.push({
      type: "visa_pending",
      strength: 88,
      label: "Visa In Progress",
      reason:
        "Visa case is active and close to a final outcome.",
      action:
        "Monitor the visa decision and keep supporting evidence ready.",
    });
  }

  if (journeyStage === "cas_issued") {
    signals.push({
      type: "cas_issued",
      strength: 86,
      label: "CAS Issued",
      reason:
        "CAS is issued and the student can move into visa execution.",
      action:
        "Start or confirm the visa checklist immediately.",
    });
  }

  if (journeyStage === "cas_pending") {
    signals.push({
      type: "cas_pending",
      strength: 82,
      label: "CAS Pending",
      reason:
        "The student is close to visa stage but still depends on CAS completion.",
      action:
        "Follow up on CAS requirements, deposit status, and university timeline.",
    });
  }

  if (journeyStage === "offer_accepted") {
    signals.push({
      type: "offer_accepted",
      strength: 90,
      label: "Offer Accepted",
      reason:
        "Accepted offer creates a strong conversion route toward CAS and visa.",
      action:
        "Fast-track deposit, CAS requirements, and visa preparation.",
    });
  }

  if (journeyStage === "offer_received") {
    signals.push({
      type: "offer_received",
      strength: 78,
      label: "Offer Opportunity",
      reason:
        "Offer-stage student has strong conversion potential.",
      action:
        "Push offer decision, acceptance requirements, and next payment/CAS steps.",
    });
  }

  if (category === "conversion_ready") {
    signals.push({
      type: "conversion_ready",
      strength: 84,
      label: "Conversion Ready",
      reason:
        "Executive scoring marks this student as ready for active conversion work.",
      action:
        "Assign focused senior-counselor follow-up and close the next milestone.",
    });
  }

  if (category === "high_opportunity" || opportunityScore >= 80) {
    signals.push({
      type: "high_opportunity",
      strength: 80,
      label: "High Opportunity",
      reason:
        "High opportunity score makes this student worth faster counselor attention.",
      action:
        "Prioritize counselor contact and remove the next conversion blocker today.",
    });
  }

  if (
    documentReadiness >= 80 &&
    taskCompletion >= 70 &&
    riskScore < 65
  ) {
    signals.push({
      type: "ready_profile",
      strength: 74,
      label: "Ready Profile",
      reason:
        "Documents and task completion indicate strong operational readiness.",
      action:
        "Move the student toward application, offer, CAS, or visa progression.",
    });
  }

  if (
    universityPlanCount >= 5 &&
    safeUniversityCount > 0 &&
    riskScore < 65
  ) {
    signals.push({
      type: "strong_plan",
      strength: 70,
      label: "Strong Plan",
      reason:
        "Student has a balanced university strategy with at least one safer option.",
      action:
        "Review the final shortlist and move suitable applications forward.",
    });
  } else if (universityPlanCount >= 3 && riskScore < 65) {
    signals.push({
      type: "good_plan",
      strength: 62,
      label: "Good Plan",
      reason:
        "Student has a meaningful university plan that can be strengthened and progressed.",
      action:
        "Strengthen the shortlist with safer options if needed.",
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
      reason:
        "Executive-priority student combines good opportunity with a manageable task load.",
      action:
        "Fast-track the next journey milestone.",
    });
  }

  return signals.sort((a, b) => b.strength - a.strength);
}

function getOpportunityReason(student = {}, signals = null) {
  const list = signals || getOpportunitySignals(student);

  if (list.length) return list[0].reason;
  if (student?.summary) return student.summary;
  if (student?.gpt_summary) return student.gpt_summary;

  return "Student has positive journey signals worth executive attention.";
}

function getOpportunityBadge(student = {}, signals = null) {
  const list = signals || getOpportunitySignals(student);

  if (list.length) return list[0].label;

  return student?.executive_category || "High Opportunity";
}

function getRecommendedAction(student = {}, signals = null) {
  const list = signals || getOpportunitySignals(student);

  if (list.length) return list[0].action;

  return "Review the profile and push the next journey milestone.";
}

function getOpportunityStrength(student = {}, signals = null) {
  const list = signals || getOpportunitySignals(student);

  if (list.length) return list[0].strength;

  return getOpportunityScore(student);
}

function formatStage(stage = "") {
  const clean = normalize(stage);

  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}

function getRiskBand(score) {
  const value = getRiskScore({ risk_score: score });

  if (value >= 75) return "high";
  if (value >= 50) return "medium";
  return "low";
}

function OpportunityFeedPanel({ students = [] }) {
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [signalFilter, setSignalFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const analyzedStudents = useMemo(
    () =>
      safeArray(students).map((student, index) => {
        const signals = getOpportunitySignals(student);
        const strength = getOpportunityStrength(student, signals);
        const opportunityScore = getOpportunityScore(student);
        const riskScore = getRiskScore(student);
        const journeyStage = getJourneyStage(student);

        return {
          student,
          signals,
          strength,
          opportunityScore,
          riskScore,
          riskBand: getRiskBand(riskScore),
          journeyStage,
          name: getStudentName(student),
          key:
            student?.id ||
            student?.student_id ||
            student?.email ||
            `${getStudentName(student)}-${index}`,
        };
      }),
    [students]
  );

  const opportunities = useMemo(
    () =>
      analyzedStudents
        .filter(
          ({
            student,
            signals,
            opportunityScore,
            riskScore,
          }) => {
            const category = normalize(student?.executive_category);

            const documentReadiness = clamp(
              getDiagnostic(
                student,
                "document_readiness_percent"
              )
            );

            const taskCompletion = clamp(
              getDiagnostic(
                student,
                "task_completion_percent"
              )
            );

            const universityPlanCount = number(
              getDiagnostic(
                student,
                "university_plan_count"
              )
            );

            return (
              signals.length > 0 ||
              category === "high_opportunity" ||
              category === "conversion_ready" ||
              opportunityScore >= 50 ||
              (documentReadiness >= 70 &&
                taskCompletion >= 60 &&
                riskScore < 65) ||
              (universityPlanCount >= 3 && riskScore < 65)
            );
          }
        )
        .sort((a, b) => {
          if (b.strength !== a.strength) {
            return b.strength - a.strength;
          }

          return b.opportunityScore - a.opportunityScore;
        }),
    [analyzedStudents]
  );

  const command = useMemo(() => {
    const hot = opportunities.filter(
      ({ opportunityScore, strength }) =>
        opportunityScore >= 80 || strength >= 85
    );

    const visaReady = opportunities.filter(({ journeyStage }) =>
      ["offer_accepted", "cas_pending", "cas_issued"].includes(
        journeyStage
      )
    );

    const cleanWins = opportunities.filter(
      ({ opportunityScore, riskScore }) =>
        opportunityScore >= 70 && riskScore < 60
    );

    const riskyWins = opportunities.filter(
      ({ opportunityScore, riskScore }) =>
        opportunityScore >= 70 && riskScore >= 60
    );

    const approvedOutcomes = opportunities.filter(
      ({ journeyStage }) => journeyStage === "visa_approved"
    );

    const visaRecovery = opportunities.filter(
      ({ journeyStage }) => journeyStage === "visa_rejected"
    );

    return {
      hot,
      visaReady,
      cleanWins,
      riskyWins,
      approvedOutcomes,
      visaRecovery,
    };
  }, [opportunities]);

  const metrics = useMemo(() => {
    let conversionCount = 0;
    let planningCount = 0;
    let opportunityTotal = 0;
    let riskTotal = 0;

    const conversionTypes = new Set([
      "offer_accepted",
      "cas_pending",
      "cas_issued",
      "visa_pending",
      "conversion_ready",
    ]);

    const planningTypes = new Set([
      "strong_plan",
      "good_plan",
    ]);

    for (const item of opportunities) {
      let hasConversionSignal = false;
      let hasPlanningSignal = false;

      for (const signal of item.signals) {
        if (!hasConversionSignal && conversionTypes.has(signal.type)) {
          hasConversionSignal = true;
        }

        if (!hasPlanningSignal && planningTypes.has(signal.type)) {
          hasPlanningSignal = true;
        }

        if (hasConversionSignal && hasPlanningSignal) {
          break;
        }
      }

      if (hasConversionSignal) conversionCount += 1;
      if (hasPlanningSignal) planningCount += 1;

      opportunityTotal += item.opportunityScore;
      riskTotal += item.riskScore;
    }

    const total = opportunities.length;

    return {
      conversionCount,
      planningCount,
      averageOpportunity: total
        ? Math.round(opportunityTotal / total)
        : 0,
      averageRisk: total
        ? Math.round(riskTotal / total)
        : 0,
      approvedOutcomes: command.approvedOutcomes.length,
    };
  }, [opportunities, command.approvedOutcomes.length]);

  const filteredOpportunities = useMemo(() => {
    const cleanQuery = normalize(query);

    return opportunities.filter((item) => {
      if (
        riskFilter !== "all" &&
        item.riskBand !== riskFilter
      ) {
        return false;
      }

      if (
        signalFilter !== "all" &&
        !item.signals.some(
          (signal) => signal.type === signalFilter
        )
      ) {
        return false;
      }

      if (!cleanQuery) return true;

      return [
        item.name,
        item.journeyStage,
        item.student?.executive_category,
        ...item.signals.map((signal) => signal.label),
        ...item.signals.map((signal) => signal.reason),
      ]
        .map(normalize)
        .some((value) => value.includes(cleanQuery));
    });
  }, [opportunities, query, signalFilter, riskFilter]);

  const visibleOpportunities = filteredOpportunities.slice(0, 12);

  const availableSignalFilters = useMemo(() => {
    const map = new Map();

    opportunities.forEach((item) => {
      item.signals.forEach((signal) => {
        if (!map.has(signal.type)) {
          map.set(signal.type, signal.label);
        }
      });
    });

    return [...map.entries()];
  }, [opportunities]);

  const clearFilters = () => {
    setQuery("");
    setSignalFilter("all");
    setRiskFilter("all");
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="rounded-[1.9rem] border-[3px] border-orange-400 bg-[#fff8ee] p-3 shadow-[0_14px_36px_rgba(15,35,63,0.07)] sm:p-4"
    >
      <div className="grid overflow-hidden rounded-[1.55rem] border-2 border-[#234e78] xl:grid-cols-[1.25fr_0.75fr]">
        <div
          className="bg-[#123865] p-5 sm:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
            <Sparkles
              size={13}
              style={{ color: "#FDBA74" }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ color: "#FFFFFF" }}
            >
              Executive Opportunity
            </p>
          </div>

          <h3
            className="mt-3 text-2xl font-black sm:text-3xl"
            style={{ color: "#FFFFFF" }}
          >
            Student Opportunity Feed
          </h3>

          <p
            className="mt-2 max-w-3xl text-sm font-semibold leading-6"
            style={{ color: "#F8FAFC" }}
          >
            High-value students across readiness, offers, CAS, visa
            progression, university planning, and confirmed visa outcomes.
          </p>
        </div>

        <div
          className="border-t-2 border-orange-300 bg-orange-500 p-5 xl:border-l-2 xl:border-t-0 sm:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <Trophy size={18} />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Opportunity Portfolio
            </p>
          </div>

          <p className="mt-3 text-4xl font-black text-white">
            {opportunities.length}
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Qualified Opportunities
          </p>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            Avg opportunity {metrics.averageOpportunity}/100 · Avg risk{" "}
            {metrics.averageRisk}/100.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[1.55rem] border-2 border-orange-200 bg-[#fff8ee] p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 rounded-[1.2rem] border-2 border-[#c8d8e8] bg-[#edf4fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#234e78]">
              How to use this panel
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Opportunity cards are read-only intelligence. Search and filters are the interactive controls; no student outcome is changed here.
            </p>
          </div>
          <span className="shrink-0 rounded-full border-2 border-[#234e78] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
            Read-only cards
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OpportunityCommandCard
            label="Hot Opportunities"
            value={command.hot.length}
            detail="Highest strength or opportunity scores."
            tone="orange"
            icon={Crown}
          />

          <OpportunityCommandCard
            label="Clean Wins"
            value={command.cleanWins.length}
            detail="High opportunity with manageable risk."
            tone="green"
            icon={CheckCircle2}
          />

          <OpportunityCommandCard
            label="Risky Wins"
            value={command.riskyWins.length}
            detail="Valuable cases requiring supervision."
            tone="red"
            icon={AlertTriangle}
          />

          <OpportunityCommandCard
            label="Visa Ready"
            value={command.visaReady.length}
            detail="Accepted offer / CAS stage ready for visa push."
            tone="blue"
            icon={Plane}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PortfolioMetric
            label="Conversion Pipeline"
            value={metrics.conversionCount}
            helper="Offer / CAS / visa / conversion-ready cases."
            icon={TrendingUp}
            tone="orange"
          />

          <PortfolioMetric
            label="Planning Opportunities"
            value={metrics.planningCount}
            helper="Students with useful university-plan signals."
            icon={GraduationCap}
            tone="navy"
          />

          <PortfolioMetric
            label="Visa Approved"
            value={metrics.approvedOutcomes}
            helper="Confirmed visa outcomes — not fake success stories."
            icon={ShieldCheck}
            tone="good"
          />

          <PortfolioMetric
            label="Visa Recovery"
            value={command.visaRecovery.length}
            helper="Refused cases still worth supervised review."
            icon={AlertTriangle}
            tone={
              command.visaRecovery.length ? "warning" : "good"
            }
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <OpportunityMiniBoard
            title="Clean Win Board"
            items={command.cleanWins.slice(0, 4)}
            tone="green"
          />

          <OpportunityMiniBoard
            title="Risky Win Board"
            items={command.riskyWins.slice(0, 4)}
            tone="orange"
          />

          <OpportunityMiniBoard
            title="Visa Push Board"
            items={command.visaReady.slice(0, 4)}
            tone="blue"
          />
        </div>

        <section className="mt-5 rounded-[1.5rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search student, stage, signal..."
                className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={signalFilter}
              onChange={(event) =>
                setSignalFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
            >
              <option value="all">All Signals</option>
              {availableSignalFilters.map(
                ([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
            >
              <option value="all">All Risk</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              <X size={13} />
              Clear
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            Showing {visibleOpportunities.length} of{" "}
            {filteredOpportunities.length} matching opportunities.
          </p>
        </section>

        <div className="mt-5 space-y-3">
          {visibleOpportunities.length ? (
            visibleOpportunities.map(
              (
                {
                  student,
                  signals,
                  strength,
                  opportunityScore,
                  riskScore,
                  journeyStage,
                  name,
                  key,
                },
                index
              ) => {
                const documentReadiness = clamp(
                  getDiagnostic(
                    student,
                    "document_readiness_percent"
                  )
                );

                const taskCompletion = clamp(
                  getDiagnostic(
                    student,
                    "task_completion_percent"
                  )
                );

                const universityPlanCount = Math.max(
                  0,
                  number(
                    getDiagnostic(
                      student,
                      "university_plan_count"
                    )
                  )
                );

                const topSignals = signals.slice(0, 3);

                return (
                  <motion.article
                    key={key}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.22,
                      delay: reduceMotion
                        ? 0
                        : index * 0.025,
                    }}
                    className="cursor-default rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-words text-base font-black leading-5 text-[#10233f]">
                            {name}
                          </p>

                          <span className="rounded-full border-2 border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                            {formatStage(journeyStage)}
                          </span>

                          <RiskBadge score={riskScore} />
                        </div>

                        <p className="mt-2 text-sm font-black text-orange-700">
                          {getOpportunityBadge(
                            student,
                            signals
                          )}
                        </p>

                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                          {getOpportunityReason(
                            student,
                            signals
                          )}
                        </p>

                        <div className="mt-3 rounded-xl border-2 border-orange-200 bg-orange-50 px-3 py-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-orange-700">
                            Next Action
                          </p>

                          <p className="mt-1 text-xs font-black leading-5 text-[#10233f]">
                            {getRecommendedAction(
                              student,
                              signals
                            )}
                          </p>
                        </div>

                        {topSignals.length > 1 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {topSignals.map((signal) => (
                              <span
                                key={`${key}-${signal.type}`}
                                className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700"
                              >
                                {signal.label}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <MiniMetric
                            label="Documents"
                            value={`${documentReadiness}%`}
                          />
                          <MiniMetric
                            label="Tasks"
                            value={`${taskCompletion}%`}
                          />
                          <MiniMetric
                            label="Universities"
                            value={universityPlanCount}
                          />
                          <MiniMetric
                            label="Risk"
                            value={`${riskScore}/100`}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 rounded-[1.35rem] border-[3px] border-[#234e78] bg-[#edf4fb] p-3 xl:w-[300px]">
                        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#234e78]">
                          Opportunity scoring
                        </p>
                        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
                          Opportunity is the student score. Signal strength is the strongest matching rule and can legitimately repeat across students.
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <ScoreCard
                            label="Opportunity Score"
                            value={opportunityScore}
                            tone="orange"
                          />

                          <ScoreCard
                            label="Signal Strength"
                            value={strength}
                            tone="navy"
                          />
                        </div>

                        <div className="mt-2 rounded-xl border-2 border-emerald-300 bg-white px-3 py-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-emerald-700">
                            Strongest signal
                          </p>
                          <p className="mt-1 break-words text-xs font-black text-[#10233f]">
                            {signals[0]?.label || "No active opportunity rule"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              }
            )
          ) : (
            <div className="rounded-[1.4rem] border-[3px] border-dashed border-slate-300 bg-white p-8 text-center">
              <Target className="mx-auto h-9 w-9 text-orange-600" />

              <p className="mt-3 font-black text-[#10233f]">
                No matching opportunities detected
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Adjust the filters or wait for stronger conversion, CAS, visa,
                readiness, or planning signals.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function OpportunityCommandCard({
  label,
  value,
  detail,
  tone = "green",
  icon: Icon,
}) {
  const dark = tone === "navy";

  const style =
    tone === "orange"
      ? "border-orange-300 bg-orange-50"
      : tone === "red"
      ? "border-red-300 bg-red-50"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-emerald-300 bg-emerald-50";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${style}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value || 0}
          </p>
        </div>

        {Icon ? (
          <Icon
            size={18}
            style={{ color: dark ? "#FDBA74" : "#C2410C" }}
          />
        ) : null}
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {detail}
      </p>
    </div>
  );
}

function PortfolioMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-300 bg-orange-50";

  return (
    <div
      className={`rounded-[1.3rem] border-[3px] p-4 ${style}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-2xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{ color: dark ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function OpportunityMiniBoard({
  title,
  items = [],
  tone = "green",
}) {
  const scoreClass =
    tone === "orange"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <div className="rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <h3 className="font-black text-[#10233f]">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map(
            (
              {
                student,
                strength,
                opportunityScore,
                riskScore,
                journeyStage,
                name,
                key,
              },
              index
            ) => (
              <div
                key={`${title}-${key}-${index}`}
                className="rounded-xl border-2 border-slate-300 bg-[#fffaf2] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#10233f]">
                      {name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatStage(journeyStage)} · Risk{" "}
                      {riskScore}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}
                  >
                    {Math.max(
                      strength,
                      opportunityScore
                    )}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                  {getOpportunityReason(
                    student,
                    getOpportunitySignals(student)
                  )}
                </p>
              </div>
            )
          )
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-500">
            No records.
          </p>
        )}
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-[#fffaf2] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  tone = "orange",
}) {
  const dark = tone === "navy";

  return (
    <div
      className={`rounded-xl border-2 p-3 text-center ${
        dark
          ? "border-[#123865] bg-[#123865]"
          : "border-orange-400 bg-[#fff3e5]"
      }`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <p
        className="text-[8px] font-black uppercase tracking-[0.08em]"
        style={{ color: dark ? "#FDBA74" : "#64748B" }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-xl font-black"
        style={{ color: dark ? "#FFFFFF" : "#10233F" }}
      >
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ score }) {
  const value = clamp(score);

  const style =
    value >= 75
      ? "border-red-300 bg-red-50 text-red-700"
      : value >= 50
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${style}`}
    >
      Risk {value}
    </span>
  );
}

export default OpportunityFeedPanel;
