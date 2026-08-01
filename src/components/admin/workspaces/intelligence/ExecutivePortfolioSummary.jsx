// ExecutivePortfolioSummary V5 PARTNER OS EXTREME — Portfolio Command Intelligence
// src/components/admin/ExecutivePortfolioSummary.jsx
//
// Maximum pass:
// - preserves calculatePortfolioHealth(students)
// - preserves the public students prop
// - safer malformed/undefined student handling
// - truthful "Verified Outcomes" wording instead of fake Success Stories
// - portfolio health readiness score
// - stronger risk/opportunity/stalled boards
// - zero-safe KPI rendering
// - safer nested health access
// - better application / visa / document / university / task health interpretation
// - clearer weak-ops pressure
// - stronger Admin OS hierarchy, borders, density, and mobile behavior
// - navy surfaces use white text only
// - removes mismatched blue/green styling from non-semantic surfaces
// - keeps red only for real risk/failure states
// - read-only executive intelligence; no fake Supabase writes

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  Crown,
  FileWarning,
  GraduationCap,
  Landmark,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  UsersRound,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { calculatePortfolioHealth } from "../../../../lib/executiveAI";

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

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pctNumber(value, total) {
  const safeTotal = number(total);

  if (!safeTotal) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round((number(value) / safeTotal) * 100)
    )
  );
}

function pct(value, total) {
  return `${pctNumber(value, total)}%`;
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

function getExecutiveRow(item = {}) {
  return {
    student: item.student || item,
    executive: item.executive || item,
  };
}

function calculateCommandReadiness({
  total = 0,
  critical = 0,
  high = 0,
  conversionReady = 0,
  highOpportunity = 0,
  applicationSubmitted = 0,
  visaInMotion = 0,
  weakDocuments = 0,
  weakTasks = 0,
  weakUniversityPlan = 0,
}) {
  if (!total) {
    return {
      score: 0,
      label: "No Data",
      message:
        "Portfolio readiness will activate when Student OS executive records are available.",
    };
  }

  const positive =
    pctNumber(conversionReady, total) * 0.25 +
    pctNumber(highOpportunity, total) * 0.2 +
    pctNumber(applicationSubmitted, total) * 0.2 +
    pctNumber(visaInMotion, total) * 0.15;

  const negative =
    pctNumber(critical, total) * 0.12 +
    pctNumber(high, total) * 0.08 +
    pctNumber(
      weakDocuments + weakTasks + weakUniversityPlan,
      total * 3
    ) *
      0.2;

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(45 + positive - negative)
    )
  );

  if (score >= 80) {
    return {
      score,
      label: "Strong",
      message:
        "Portfolio movement is strong with good conversion, application, and visa momentum.",
    };
  }

  if (score >= 60) {
    return {
      score,
      label: "Healthy",
      message:
        "Portfolio health is generally good, but some operational weaknesses still need attention.",
    };
  }

  if (score >= 40) {
    return {
      score,
      label: "Needs Attention",
      message:
        "Portfolio pressure is building across risk, documents, tasks, or university planning.",
    };
  }

  return {
    score,
    label: "Critical",
    message:
      "Executive intervention is needed across risk, stalled movement, and weak operational foundations.",
  };
}

function ExecutivePortfolioSummary({ students = [] }) {
  const reduceMotion = useReducedMotion();
  const [showHealthMatrix, setShowHealthMatrix] = useState(true);
  const [showPriorityBoards, setShowPriorityBoards] = useState(true);

  const safeStudents = useMemo(
    () => safeArray(students),
    [students]
  );

  const portfolio = useMemo(() => {
    try {
      const result = calculatePortfolioHealth(safeStudents);

      return result && typeof result === "object"
        ? result
        : {};
    } catch (error) {
      console.error(
        "Executive portfolio calculation failed:",
        error
      );

      return {};
    }
  }, [safeStudents]);

  const health = useMemo(() => {
    const total = number(portfolio.total, safeStudents.length);

    const applicationHealth =
      portfolio.applicationHealth || {};

    const visaHealth =
      portfolio.visaHealth || {};

    const documentHealth =
      portfolio.documentHealth || {};

    const universityHealth =
      portfolio.universityHealth || {};

    const taskHealth =
      portfolio.taskHealth || {};

    const applicationSubmitted =
      number(applicationHealth.submitted) +
      number(applicationHealth.offerReceived) +
      number(applicationHealth.offerAccepted) +
      number(applicationHealth.casPending) +
      number(applicationHealth.casIssued);

    const visaInMotion =
      number(visaHealth.pending) +
      number(visaHealth.approved);

    const weakDocuments =
      number(documentHealth.weak) +
      number(documentHealth.critical) +
      number(documentHealth.missing);

    const weakTasks =
      number(taskHealth.weak) +
      number(taskHealth.critical);

    const weakUniversityPlan =
      number(universityHealth.risky) +
      number(universityHealth.missing);

    const weakOpsLoad =
      weakDocuments +
      weakTasks +
      weakUniversityPlan;

    const verifiedOutcomes =
      number(
        portfolio.verifiedOutcomes,
        number(portfolio.successStories)
      );

    const commandReadiness =
      calculateCommandReadiness({
        total,
        critical: number(portfolio.critical),
        high: number(portfolio.high),
        conversionReady: number(
          portfolio.conversionReady
        ),
        highOpportunity: number(
          portfolio.highOpportunity
        ),
        applicationSubmitted,
        visaInMotion,
        weakDocuments,
        weakTasks,
        weakUniversityPlan,
      });

    return {
      total,
      applicationHealth,
      visaHealth,
      documentHealth,
      universityHealth,
      taskHealth,
      applicationSubmitted,
      visaInMotion,
      weakDocuments,
      weakTasks,
      weakUniversityPlan,
      weakOpsLoad,
      verifiedOutcomes,
      commandReadiness,
    };
  }, [portfolio, safeStudents.length]);

  const executiveBoard = useMemo(() => {
    const rows = safeStudents.map(getExecutiveRow);

    const riskPipeline = [...rows]
      .sort(
        (a, b) =>
          number(b.executive.risk_score) -
          number(a.executive.risk_score)
      )
      .slice(0, 8);

    const opportunityPipeline = [...rows]
      .sort(
        (a, b) =>
          number(b.executive.opportunity_score) -
          number(a.executive.opportunity_score)
      )
      .slice(0, 8);

    const stalledRows = [];
    let expectedOffers = 0;
    let expectedVisaMovement = 0;
    let urgentRecovery = 0;

    for (const row of rows) {
      const { executive } = row;

      const stage = normalize(
        executive.journey_stage
      );

      const riskScore = number(
        executive.risk_score
      );

      const opportunityScore = number(
        executive.opportunity_score
      );

      const daysSinceUpdated = number(
        executive.days_since_updated,
        -1
      );

      if (
        daysSinceUpdated >= 10 ||
        stage === "not_started"
      ) {
        stalledRows.push(row);
      }

      if (
        opportunityScore >= 65 &&
        [
          "application_submitted",
          "application_under_review",
        ].includes(stage)
      ) {
        expectedOffers += 1;
      }

      if (
        [
          "offer_accepted",
          "cas_pending",
          "cas_issued",
        ].includes(stage)
      ) {
        expectedVisaMovement += 1;
      }

      if (
        riskScore >= 70 &&
        opportunityScore >= 60
      ) {
        urgentRecovery += 1;
      }
    }

    const stalledPipeline = stalledRows
      .sort(
        (a, b) =>
          number(b.executive.days_since_updated) -
          number(a.executive.days_since_updated)
      )
      .slice(0, 8);

    return {
      riskPipeline,
      opportunityPipeline,
      stalledPipeline,
      expectedOffers,
      expectedVisaMovement,
      urgentRecovery,
    };
  }, [safeStudents]);

  const commandMetrics = [
    {
      label: "Total Students",
      value: health.total,
      icon: UsersRound,
      tone: "default",
    },
    {
      label: "Critical Risk",
      value: number(portfolio.critical),
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "High Risk",
      value: number(portfolio.high),
      icon: FileWarning,
      tone: "orange",
    },
    {
      label: "High Opportunity",
      value: number(portfolio.highOpportunity),
      icon: TrendingUp,
      tone: "green",
    },
    {
      label: "Conversion Ready",
      value: number(portfolio.conversionReady),
      icon: Rocket,
      tone: "green",
    },
    {
      label: "Verified Outcomes",
      value: health.verifiedOutcomes,
      icon: Trophy,
      tone: "green",
    },
    {
      label: "Executive Priority",
      value: number(portfolio.executivePriority),
      icon: Crown,
      tone: "blue",
    },
    {
      label: "Weak Ops Load",
      value: health.weakOpsLoad,
      icon: Workflow,
      tone: "orange",
    },
  ];

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.26,
      }}
      className="min-w-0 space-y-5"
    >
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={BriefcaseBusiness}>
                Executive Portfolio
              </HeaderChip>

              <HeaderChip icon={ShieldCheck}>
                Student OS Health
              </HeaderChip>

              <HeaderChip icon={Activity}>
                Live Portfolio View
              </HeaderChip>
            </div>

            <h2 className="mt-4 max-w-4xl text-2xl font-black tracking-[-0.025em] text-white sm:text-[2rem]">
              Student Portfolio Command View
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Executive visibility across risk, opportunity, applications,
              offers, CAS, visa, documents, tasks, and university planning.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Students"
                value={health.total}
              />

              <DarkMetric
                label="Executive"
                value={number(
                  portfolio.executivePriority
                )}
              />

              <DarkMetric
                label="Critical"
                value={number(
                  portfolio.critical
                )}
              />

              <DarkMetric
                label="Conversion"
                value={number(
                  portfolio.conversionReady
                )}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Portfolio Readiness
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {
                health
                  .commandReadiness
                  .score
              }
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {
                health
                  .commandReadiness
                  .label
              }
            </p>

            <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : { width: 0 }
                }
                animate={{
                  width: `${health.commandReadiness.score}%`,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.65,
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {
                health
                  .commandReadiness
                  .message
              }
            </p>

            <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Command Rule
              </p>
              <p className="mt-1 text-xs font-black leading-5 text-white">
                Stabilize critical and high-risk students first, then remove
                weak document, task and university-planning pressure before
                pushing conversion-ready cases forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {health.total === 0 ? (
        <EmptyPortfolioState />
      ) : (
        <>
          <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
            <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                  Portfolio Operations Board
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  Executive risk, opportunity and operating load
                </h3>
                <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
                  Grouped portfolio intelligence replaces the loose eight-card metric wall.
                </p>
              </div>

              <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
                {health.total} students
              </span>
            </div>

            <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
              {commandMetrics.map((item) => (
                <MetricCard key={item.label} {...item} />
              ))}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
            <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
                  <TrendingUp size={17} />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                    Executive Forecast
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    Portfolio Movement Board
                  </h3>
                  <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
                    Near-term opportunity, visa movement, operational pressure and recovery demand.
                  </p>
                </div>
              </div>

              <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
                {health.commandReadiness.score}% ready
              </span>
            </div>

            <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-6">
            <BoardCard
              label="Expected Offers"
              value={
                executiveBoard
                  .expectedOffers
              }
              detail="Strong submitted or review-stage cases."
              tone="blue"
              icon={GraduationCap}
            />

            <BoardCard
              label="Expected Visa Movement"
              value={
                executiveBoard
                  .expectedVisaMovement
              }
              detail="Offer/CAS students approaching visa movement."
              tone="blue"
              icon={Rocket}
            />

            <BoardCard
              label="Urgent Recovery"
              value={
                executiveBoard
                  .urgentRecovery
              }
              detail="High-risk but still valuable cases."
              tone="red"
              icon={AlertTriangle}
            />

            <BoardCard
              label="Application Yield"
              value={pct(
                health.applicationSubmitted,
                health.total
              )}
              detail="Submitted or further along."
              tone="green"
              icon={ClipboardCheck}
            />

            <BoardCard
              label="Visa Yield"
              value={pct(
                health.visaInMotion,
                health.total
              )}
              detail="Pending or approved."
              tone="green"
              icon={ShieldCheck}
            />

            <BoardCard
              label="Weak Ops Load"
              value={
                health.weakOpsLoad
              }
              detail="Document, task, and planning pressure."
              tone="orange"
              icon={Workflow}
            />
            </div>
          </section>

          <div className="grid min-w-0 gap-4 xl:grid-cols-3">
            <BoardList
              title="Risk Board"
              subtitle="Highest portfolio risk"
              items={
                executiveBoard
                  .riskPipeline
              }
              scoreKey="risk_score"
              tone="red"
              icon={AlertTriangle}
            />

            <BoardList
              title="Opportunity Board"
              subtitle="Best conversion potential"
              items={
                executiveBoard
                  .opportunityPipeline
              }
              scoreKey="opportunity_score"
              tone="green"
              icon={TrendingUp}
            />

            <BoardList
              title="Stalled Board"
              subtitle="Low movement / overdue attention"
              items={
                executiveBoard
                  .stalledPipeline
              }
              scoreKey="days_since_updated"
              tone="orange"
              icon={Clock3}
            />
          </div>

          <ExecutiveDisclosure
            eyebrow="Portfolio Health"
            title="Student Journey & Operations Health"
            description="Application, visa, document, university, and task health from the executive portfolio model."
            open={showHealthMatrix}
            onToggle={() => setShowHealthMatrix((current) => !current)}
            icon={Workflow}
          >
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <HealthBlock
              icon={ClipboardCheck}
              title="Application Health"
              total={health.total}
              rows={[
                [
                  "Not Started",
                  number(
                    health
                      .applicationHealth
                      .notStarted
                  ),
                  "red",
                ],
                [
                  "Started",
                  number(
                    health
                      .applicationHealth
                      .started
                  ),
                  "blue",
                ],
                [
                  "Submitted",
                  number(
                    health
                      .applicationHealth
                      .submitted
                  ),
                  "gold",
                ],
                [
                  "Offer Received",
                  number(
                    health
                      .applicationHealth
                      .offerReceived
                  ),
                  "gold",
                ],
                [
                  "Offer Accepted",
                  number(
                    health
                      .applicationHealth
                      .offerAccepted
                  ),
                  "gold",
                ],
                [
                  "CAS Pending",
                  number(
                    health
                      .applicationHealth
                      .casPending
                  ),
                  "orange",
                ],
                [
                  "CAS Issued",
                  number(
                    health
                      .applicationHealth
                      .casIssued
                  ),
                  "gold",
                ],
              ]}
            />

            <HealthBlock
              icon={ShieldCheck}
              title="Visa Health"
              total={health.total}
              rows={[
                [
                  "Needed",
                  number(
                    health.visaHealth
                      .needed
                  ),
                  "gold",
                ],
                [
                  "Pending",
                  number(
                    health.visaHealth
                      .pending
                  ),
                  "orange",
                ],
                [
                  "Approved",
                  number(
                    health.visaHealth
                      .approved
                  ),
                  "gold",
                ],
                [
                  "Rejected",
                  number(
                    health.visaHealth
                      .rejected
                  ),
                  "red",
                ],
              ]}
            />

            <HealthBlock
              icon={FileWarning}
              title="Document Health"
              total={health.total}
              rows={[
                [
                  "Strong",
                  number(
                    health
                      .documentHealth
                      .strong
                  ),
                  "gold",
                ],
                [
                  "Good",
                  number(
                    health
                      .documentHealth
                      .good
                  ),
                  "blue",
                ],
                [
                  "Weak",
                  number(
                    health
                      .documentHealth
                      .weak
                  ),
                  "orange",
                ],
                [
                  "Critical",
                  number(
                    health
                      .documentHealth
                      .critical
                  ),
                  "red",
                ],
                [
                  "Missing",
                  number(
                    health
                      .documentHealth
                      .missing
                  ),
                  "red",
                ],
              ]}
            />

            <HealthBlock
              icon={Landmark}
              title="University Health"
              total={health.total}
              rows={[
                [
                  "Strong",
                  number(
                    health
                      .universityHealth
                      .strong
                  ),
                  "gold",
                ],
                [
                  "Partial",
                  number(
                    health
                      .universityHealth
                      .partial
                  ),
                  "blue",
                ],
                [
                  "Risky",
                  number(
                    health
                      .universityHealth
                      .risky
                  ),
                  "orange",
                ],
                [
                  "Missing",
                  number(
                    health
                      .universityHealth
                      .missing
                  ),
                  "red",
                ],
              ]}
            />

            <HealthBlock
              icon={Target}
              title="Task Health"
              total={health.total}
              rows={[
                [
                  "Strong",
                  number(
                    health.taskHealth
                      .strong
                  ),
                  "gold",
                ],
                [
                  "Good",
                  number(
                    health.taskHealth
                      .good
                  ),
                  "blue",
                ],
                [
                  "Weak",
                  number(
                    health.taskHealth
                      .weak
                  ),
                  "orange",
                ],
                [
                  "Critical",
                  number(
                    health.taskHealth
                      .critical
                  ),
                  "red",
                ],
                [
                  "Empty",
                  number(
                    health.taskHealth
                      .empty
                  ),
                  "default",
                ],
              ]}
            />
          </div>
          </ExecutiveDisclosure>

          <ExecutiveDisclosure
            eyebrow="Executive Student Boards"
            title="Highest Priority Student Cases"
            description="The most important risk and opportunity cases from the calculated executive portfolio."
            open={showPriorityBoards}
            onToggle={() => setShowPriorityBoards((current) => !current)}
            icon={Crown}
          >

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">

            <PortfolioList
              title="Highest Risk Students"
              items={safeArray(
                portfolio.rankedByRisk
              ).slice(0, 5)}
              scoreKey="risk_score"
              tone="red"
              emptyText="No high-risk students."
              icon={AlertTriangle}
            />

            <PortfolioList
              title="Highest Opportunity Students"
              items={safeArray(
                portfolio.rankedByOpportunity
              ).slice(0, 5)}
              scoreKey="opportunity_score"
              tone="gold"
              emptyText="No opportunity records."
              icon={Trophy}
            />
          </div>
          </ExecutiveDisclosure>

          <MethodologyNote />
        </>
      )}
    </motion.section>
  );
}

function HeaderChip({
  icon: Icon,
  children,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-[#FFB38A]">
      <Icon size={11} />
      {children}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function ExecutiveDisclosure({
  eyebrow,
  title,
  description,
  open,
  onToggle,
  icon: Icon = Sparkles,
  children,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_10px_28px_rgba(15,35,63,0.07)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full min-w-0 items-center justify-between gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-4 py-3.5 text-left text-white transition hover:bg-[#0F3158] sm:px-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FFB38A]/60 bg-white/10 text-white">
            <Icon size={18} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#FFB38A]">
              {eyebrow}
            </p>
            <h3 className="mt-0.5 text-lg font-black text-white sm:text-xl">{title}</h3>
            {description ? (
              <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/80">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open ? <div className="min-w-0 p-4 sm:p-5">{children}</div> : null}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-[#FFF4E8] text-[#FF5A0A]">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#D94B00]">
          {eyebrow}
        </p>

        <h3 className="mt-0.5 text-xl font-black text-[#10233F]">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
  icon: Icon = Activity,
}) {
  const style = getToneStyle(tone);

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${style}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-current opacity-80" />

      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-[9px] font-black uppercase leading-4 tracking-[0.11em] text-[#10233F]">
          {label}
        </p>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-3 break-words text-2xl font-black leading-none tracking-[-0.025em] text-[#10233F] sm:text-3xl">
        {value ?? 0}
      </p>

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
        Read-only portfolio signal
      </p>
    </div>
  );
}

function BoardCard({
  label,
  value,
  detail,
  tone = "default",
  icon: Icon = Sparkles,
}) {
  const style = getToneStyle(tone);

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${style}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-current opacity-80" />

      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-[9px] font-black uppercase leading-4 tracking-[0.11em] text-[#10233F]">
          {label}
        </p>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-3 break-words text-2xl font-black leading-none tracking-[-0.025em] text-[#10233F] sm:text-3xl">
        {value ?? 0}
      </p>

      <p className="mt-2 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function BoardList({
  title,
  subtitle,
  items = [],
  scoreKey,
  tone = "green",
  icon: Icon = Sparkles,
}) {
  const style = getToneStyle(tone);

  return (
    <div className={`min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] bg-[#FFF8EF] shadow-[0_8px_24px_rgba(15,35,63,0.055)] ${getOuterBorder(tone)}`}>
      <div className="flex min-w-0 items-start justify-between gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-4 py-3.5 text-white">
        <div>
          <h3 className="font-black text-white">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-white/75">{subtitle}</p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${style}`}>
          <Icon size={17} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        {items.length ? (
          items.map((item, index) => {
            const student = item.student || {};
            const executive = item.executive || {};
            const name = getStudentName(student, executive);

            return (
              <div
                key={`${title}-${name}-${index}`}
                className={`min-w-0 rounded-[1.1rem] border-2 bg-white p-3.5 ${getOuterBorder(tone)}`}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_95px]">
                  <div className="min-w-0">
                    <p className="break-words font-black leading-5 text-[#10233F]">
                      {name}
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {formatLabel(executive.journey_stage || "not_started")} •{" "}
                      {formatLabel(executive.executive_category || "Standard")}
                    </p>

                    <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-600">
                      {executive.summary || "No portfolio summary."}
                    </p>
                  </div>

                  <div className={`rounded-xl border-2 p-3 text-center ${style}`}>
                    <p className="text-[8px] font-black uppercase tracking-[0.09em]">
                      {scoreKey === "opportunity_score" ? "Opportunity" : scoreKey === "days_since_updated" ? "Days Stale" : "Risk"}
                    </p>
                    <p className="mt-1 text-2xl font-black">{number(executive[scoreKey])}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No records.
          </p>
        )}
      </div>
    </div>
  );
}

function HealthBlock({
  title,
  total = 0,
  rows = [],
  icon: Icon = Workflow,
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_8px_24px_rgba(15,35,63,0.055)]">
      <div className="flex min-w-0 items-center gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-4 py-3.5 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
          <Icon size={16} />
        </div>
        <h3 className="font-black text-white">{title}</h3>
      </div>

      <div className="space-y-3 p-4">
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

function HealthRow({
  label,
  value,
  percent,
  tone = "default",
}) {
  const textStyle = getToneText(tone);

  return (
    <div className={`rounded-xl border-2 p-3 ${getToneStyle(tone)}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-[#10233F]">{label}</p>

        <p className={`shrink-0 text-xs font-black ${textStyle}`}>
          {value ?? 0} • {percent}
        </p>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-white/70">
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
  tone = "green",
  emptyText = "No records.",
  icon: Icon = Sparkles,
}) {
  const style = getToneStyle(tone);

  return (
    <div className={`min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] bg-[#FFF8EF] shadow-[0_8px_24px_rgba(15,35,63,0.055)] ${getOuterBorder(tone)}`}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-[#FFB38A] bg-[#123865] px-4 py-4 text-white">
        <h3 className="font-black text-white">{title}</h3>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${style}`}>
          <Icon size={17} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        {items.length ? (
          items.map((item, index) => {
            const student = item.student || {};
            const executive = item.executive || {};
            const name = getStudentName(student, executive);

            return (
              <div
                key={`${name}-${index}`}
                className={`min-w-0 rounded-[1.1rem] border-2 bg-white p-3.5 ${getOuterBorder(tone)}`}
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_100px]">
                  <div className="min-w-0">
                    <p className="break-words font-black leading-5 text-[#10233F]">
                      {name}
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {formatLabel(executive.executive_category || "Standard")} •{" "}
                      {formatLabel(executive.priority_level || "Standard")} •{" "}
                      {formatLabel(executive.journey_stage || "not_started")}
                    </p>

                    <p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-slate-600">
                      {executive.summary || "No executive summary."}
                    </p>
                  </div>

                  <div className={`rounded-xl border-2 p-3 text-center ${style}`}>
                    <p className="text-[8px] font-black uppercase tracking-[0.08em]">
                      {scoreKey === "opportunity_score" ? "Opportunity" : "Risk"}
                    </p>
                    <p className="mt-1 text-2xl font-black">{number(executive[scoreKey])}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MiniFact
                    label="Docs"
                    value={`${number(executive.diagnostics?.document_readiness_percent)}%`}
                  />
                  <MiniFact
                    label="Tasks"
                    value={`${number(executive.diagnostics?.task_completion_percent)}%`}
                  />
                  <MiniFact
                    label="Universities"
                    value={number(executive.diagnostics?.university_plan_count)}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function MiniFact({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#243A60]">
        {value}
      </p>
    </div>
  );
}

function EmptyPortfolioState() {
  return (
    <div className="min-w-0 rounded-[1.6rem] border-[3px] border-dashed border-[#FFB38A] bg-[#FFF8EF] p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#FFB38A] bg-[#FFF4E8] text-[#D94B00]">
        <UsersRound size={26} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        No portfolio records yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Student portfolio intelligence will appear when Executive AI records are available.
      </p>
    </div>
  );
}

function MethodologyNote() {
  return (
    <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#FFB38A] bg-[#FFF4E8] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FFB38A] bg-white text-[#D94B00]">
          <CheckCircle2 size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233F]">
            Portfolio methodology
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            Forecast cards are operational indicators based on the current executive
            score model. They are not guaranteed admissions, offers, visa outcomes,
            or business forecasts. “Verified Outcomes” only reflects records the
            underlying portfolio engine already classifies as completed/approved.
          </p>
        </div>
      </div>
    </div>
  );
}

function getToneStyle(
  tone = ""
) {
  if (tone === "red") {
    return "border-red-400 bg-red-50 text-red-800";
  }

  if (tone === "orange") {
    return "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800";
  }

  if (tone === "green") {
    return "border-emerald-400 bg-emerald-50 text-emerald-800";
  }

  if (tone === "blue") {
    return "border-blue-400 bg-blue-50 text-blue-800";
  }

  if (tone === "gold") {
    return "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800";
  }

  return "border-[#123865] bg-[#edf4fb] text-[#123865]";
}

function getToneText(
  tone = ""
) {
  if (tone === "red") return "text-red-700";
  if (tone === "orange") return "text-[#D94B00]";
  if (tone === "green") return "text-emerald-700";
  if (tone === "blue") return "text-blue-700";
  if (tone === "gold") return "text-[#D94B00]";
  return "text-[#123865]";
}

function getToneBar(
  tone = ""
) {
  if (tone === "red") return "bg-red-500";
  if (tone === "orange") return "bg-[#FF5A0A]";
  if (tone === "green") return "bg-emerald-500";
  if (tone === "blue") return "bg-blue-500";
  if (tone === "gold") return "bg-[#FF5A0A]";
  return "bg-[#123865]";
}

function getOuterBorder(
  tone = ""
) {
  if (tone === "red") return "border-red-400";
  if (tone === "orange") return "border-[#FF5A0A]";
  if (tone === "green") return "border-emerald-400";
  if (tone === "blue") return "border-blue-400";
  if (tone === "gold") return "border-[#FF5A0A]";
  return "border-[#123865]";
}


function formatLabel(
  value = ""
) {
  const clean =
    normalize(value);

  if (!clean) {
    return "Unknown";
  }

  return clean
    .split("_")
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export default ExecutivePortfolioSummary;
