// ExecutiveScoreGeneratorPanel PARTNER OS V4 MAXIMUM — Student OS Intelligence Generator
// src/components/admin/ExecutiveScoreGeneratorPanel.jsx
//
// Maximum pass:
// - preserves generateExecutiveScoresFromDatabase()
// - preserves onGenerated(result) parent callback contract
// - keeps hard timeout protection
// - adds cancellation-safe timeout cleanup
// - prevents stale generator results overwriting newer runs
// - safer malformed result handling
// - truthful "Verified Outcomes" wording
// - zero-safe metrics
// - result health / generator health / persistence health
// - stronger warnings and failure diagnostics
// - stronger generated score preview
// - safe raw payload serializer with truncation
// - better empty / loading / success states
// - reduced-motion support
// - stronger mobile hierarchy
// - Admin OS orange/navy/cream alignment
// - navy surfaces use white text only
// - no fake Supabase writes; generator remains the real persistence engine

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Clock3,
  Crown,
  Database,
  FileWarning,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  Workflow,
  XCircle,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import { generateExecutiveScoresFromDatabase } from "../../../../lib/executivePortfolioGenerator";

const GENERATOR_TIMEOUT_MS = 30000;
const REFRESH_TIMEOUT_MS = 12000;
const RAW_PAYLOAD_PREVIEW_LIMIT = 12000;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function safeArray(value) {
  return Array.isArray(value)
    ? value.filter(Boolean)
    : [];
}

function formatLabel(value = "") {
  const clean = normalize(value);

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

function getStudentName(item = {}) {
  return (
    item?.student?.full_name ||
    item?.student?.name ||
    item?.student?.student_name ||
    item?.executive?.student_name ||
    item?.data?.student_name ||
    "Student"
  );
}

function getErrorMessage(error) {
  if (!error) {
    return "Unknown issue.";
  }

  if (typeof error === "string") {
    return error;
  }

  return (
    error.message ||
    error.details ||
    error.hint ||
    "Unknown issue."
  );
}

function safeStringify(value) {
  try {
    const serialized = JSON.stringify(
      value,
      null,
      2
    );

    if (!serialized) {
      return "No payload data.";
    }

    if (
      serialized.length >
      RAW_PAYLOAD_PREVIEW_LIMIT
    ) {
      return `${serialized.slice(
        0,
        RAW_PAYLOAD_PREVIEW_LIMIT
      )}\n\n… payload preview truncated`;
    }

    return serialized;
  } catch {
    return "Payload could not be serialized.";
  }
}

function withTimeout(
  promise,
  timeoutMs,
  message
) {
  let timerId;

  const timeout = new Promise(
    (_, reject) => {
      timerId = setTimeout(() => {
        reject(
          new Error(message)
        );
      }, timeoutMs);
    }
  );

  return Promise.race([
    promise,
    timeout,
  ]).finally(() => {
    if (timerId) {
      clearTimeout(timerId);
    }
  });
}

function buildGeneratorHealth({
  total = 0,
  savedCount = 0,
  failedCount = 0,
  warningCount = 0,
  runtimeMs = 0,
}) {
  if (!total) {
    return {
      score: 0,
      label: "No Data",
      message:
        "Generator health will activate after a Student OS scan returns records.",
    };
  }

  const successRate =
    total
      ? (savedCount / total) *
        100
      : 0;

  const warningPenalty = Math.min(
    25,
    warningCount * 4
  );

  const failurePenalty = Math.min(
    45,
    failedCount * 12
  );

  const runtimePenalty =
    runtimeMs > 25000
      ? 20
      : runtimeMs > 15000
      ? 10
      : runtimeMs > 8000
      ? 5
      : 0;

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        successRate -
          warningPenalty -
          failurePenalty -
          runtimePenalty
      )
    )
  );

  if (score >= 90) {
    return {
      score,
      label: "Excellent",
      message:
        "Generation completed cleanly with strong save reliability and low operational pressure.",
    };
  }

  if (score >= 70) {
    return {
      score,
      label: "Healthy",
      message:
        "Generation is healthy overall, but warnings, runtime, or partial failures deserve review.",
    };
  }

  if (score >= 45) {
    return {
      score,
      label: "Needs Review",
      message:
        "Generator reliability needs attention. Inspect warnings, failed saves, and Supabase schema/RLS.",
    };
  }

  return {
    score,
    label: "Critical",
    message:
      "The generator is under heavy failure pressure. Review Supabase schema, RLS, payload fields, and generator logs before the next production run.",
  };
}

function ExecutiveScoreGeneratorPanel({
  onGenerated = () => {},
}) {
  const reduceMotion =
    useReducedMotion();

  const [
    running,
    setRunning,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    refreshWarning,
    setRefreshWarning,
  ] = useState("");

  const [
    lastRunAt,
    setLastRunAt,
  ] = useState(null);

  const [
    expanded,
    setExpanded,
  ] = useState({
    saved: false,
    failed: true,
    warnings: true,
    payload: false,
  });

  const runTokenRef =
    useRef(0);

  const runGenerator =
    async () => {
      if (running) {
        return;
      }

      const runToken =
        runTokenRef.current + 1;

      runTokenRef.current =
        runToken;

      setRunning(true);
      setError("");
      setRefreshWarning("");
      setResult(null);

      const startedAt =
        Date.now();

      try {
        const output =
          await withTimeout(
            Promise.resolve(
              generateExecutiveScoresFromDatabase()
            ),
            GENERATOR_TIMEOUT_MS,
            `Executive score generation timed out after ${Math.round(
              GENERATOR_TIMEOUT_MS /
                1000
            )} seconds. The dashboard was unlocked so the Admin OS does not stay stuck.`
          );

        if (
          runTokenRef.current !==
          runToken
        ) {
          return;
        }

        const finishedAt =
          Date.now();

        const finalOutput = {
          ...(output &&
          typeof output ===
            "object"
            ? output
            : {}),
          runtimeMs:
            finishedAt -
            startedAt,
          generatedAt:
            new Date().toISOString(),
        };

        setResult(finalOutput);

        if (finalOutput.error) {
          setError(
            getErrorMessage(
              finalOutput.error
            )
          );
          return;
        }

        setLastRunAt(
          new Date()
        );

        try {
          await withTimeout(
            Promise.resolve(
              onGenerated(
                finalOutput
              )
            ),
            REFRESH_TIMEOUT_MS,
            "Executive dashboard refresh timed out after generation."
          );
        } catch (refreshError) {
          console.error(
            "Executive scores generated, but parent reload failed:",
            refreshError
          );

          setRefreshWarning(
            getErrorMessage(
              refreshError
            )
          );
        }
      } catch (err) {
        console.error(
          "Executive score generation crashed/timed out:",
          err
        );

        if (
          runTokenRef.current ===
          runToken
        ) {
          setError(
            getErrorMessage(
              err
            )
          );
        }
      } finally {
        if (
          runTokenRef.current ===
          runToken
        ) {
          setRunning(false);
        }
      }
    };

  const portfolio =
    result?.portfolio &&
    typeof result.portfolio ===
      "object"
      ? result.portfolio
      : {};

  const failed =
    safeArray(
      result?.failed
    );

  const saved =
    safeArray(
      result?.saved
    );

  const warnings =
    safeArray(
      result?.warnings
    );

  const failedCount =
    number(
      result?.failedCount,
      failed.length
    );

  const savedCount =
    number(
      result?.savedCount,
      saved.length
    );

  const total =
    number(
      result?.total,
      savedCount +
        failedCount
    );

  const warningCount =
    warnings.length;

  const successRate =
    total
      ? Math.round(
          (savedCount / total) *
            100
        )
      : 0;

  const runtimeMs =
    number(
      result?.runtimeMs
    );

  const runtimeSeconds =
    runtimeMs
      ? Math.round(
          (runtimeMs /
            1000) *
            10
        ) / 10
      : 0;

  const verifiedOutcomes =
    number(
      portfolio.verifiedOutcomes,
      number(
        portfolio.successStories
      )
    );

  const journeyStats =
    useMemo(() => {
      const allStudents = [
        ...saved.map(
          (item) =>
            item.executive ||
            item.data ||
            item.student ||
            {}
        ),
        ...failed.map(
          (item) =>
            item.executive ||
            item.student ||
            {}
        ),
      ];

      const countStage = (
        stages
      ) =>
        allStudents.filter(
          (item) =>
            stages.includes(
              normalize(
                item.journey_stage
              )
            )
        ).length;

      return {
        notStarted:
          countStage([
            "not_started",
          ]),
        applicationStarted:
          countStage([
            "application_started",
          ]),
        applicationSubmitted:
          countStage([
            "application_submitted",
            "application_under_review",
          ]),
        offerReceived:
          countStage([
            "offer_received",
          ]),
        offerAccepted:
          countStage([
            "offer_accepted",
          ]),
        casPending:
          countStage([
            "cas_pending",
          ]),
        casIssued:
          countStage([
            "cas_issued",
          ]),
        visaPending:
          countStage([
            "visa_pending",
          ]),
        visaApproved:
          countStage([
            "visa_approved",
          ]),
        visaRejected:
          countStage([
            "visa_rejected",
          ]),
      };
    }, [saved, failed]);

  const generatorHealth =
    useMemo(
      () =>
        buildGeneratorHealth({
          total,
          savedCount,
          failedCount,
          warningCount,
          runtimeMs,
        }),
      [
        total,
        savedCount,
        failedCount,
        warningCount,
        runtimeMs,
      ]
    );

  const persistenceHealth =
    total
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (savedCount /
                total) *
                100
            )
          )
        )
      : 0;

  const journeyCoverage =
    total
      ? Math.min(
          100,
          Math.round(
            ((
              journeyStats.applicationStarted +
              journeyStats.applicationSubmitted +
              journeyStats.offerReceived +
              journeyStats.offerAccepted +
              journeyStats.casPending +
              journeyStats.casIssued +
              journeyStats.visaPending +
              journeyStats.visaApproved +
              journeyStats.visaRejected
            ) /
              total) *
              100
          )
        )
      : 0;

  const toggleExpanded = (
    key
  ) => {
    setExpanded(
      (prev) => ({
        ...prev,
        [key]:
          !prev[key],
      })
    );
  };

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 10,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.26,
      }}
      className="overflow-hidden rounded-[2rem] border-[3px] border-[#FFB38A] bg-[#FFFDF8] shadow-[0_18px_50px_rgba(23,36,61,0.08)]"
    >
      <div className="grid xl:grid-cols-[1.34fr_0.66fr]">
        <div className="bg-[#123865] p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <HeaderChip
              icon={Bot}
              label="Executive Score Generator"
            />

            <HeaderChip
              icon={Database}
              label="Student OS Intelligence"
            />

            <HeaderChip
              icon={ShieldCheck}
              label="Human Review"
            />
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
            Generate Student OS Intelligence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
            Scan inquiries, appointments, applications, documents, tasks,
            universities, visa signals, and previous risk records, then persist
            executive intelligence through the existing portfolio generator.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkMetric
              label="Timeout"
              value={`${Math.round(
                GENERATOR_TIMEOUT_MS /
                  1000
              )}s`}
            />

            <DarkMetric
              label="Save Target"
              value="AI Scores"
            />

            <DarkMetric
              label="Mode"
              value="Review"
            />

            <DarkMetric
              label="Last Run"
              value={
                lastRunAt
                  ? lastRunAt.toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute:
                          "2-digit",
                      }
                    )
                  : "Not yet"
              }
            />
          </div>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-7">
          <div className="flex items-center gap-2">
            <CircleGauge
              size={18}
            />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Generator Health
            </p>
          </div>

          <p className="mt-3 text-5xl font-black text-white">
            {
              generatorHealth.score
            }
          </p>

          <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
            {
              generatorHealth.label
            }
          </p>

          <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
            <motion.div
              initial={
                reduceMotion
                  ? false
                  : {
                      width: 0,
                    }
              }
              animate={{
                width: `${generatorHealth.score}%`,
              }}
              transition={{
                duration:
                  reduceMotion
                    ? 0
                    : 0.65,
              }}
              className="h-full rounded-full bg-white"
            />
          </div>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            {
              generatorHealth.message
            }
          </p>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <section className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#FFB38A] bg-[#FFF4EA] text-[#B84F0E]">
                <Sparkles
                  size={20}
                />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#B84F0E]">
                  Generator Command
                </p>

                <h3 className="mt-1 text-lg font-black text-[#10233F]">
                  Run a fresh Executive Student OS scan
                </h3>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  The generator writes through the existing
                  `generateExecutiveScoresFromDatabase()` pipeline. This UI does
                  not invent a second persistence path.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void runGenerator()
              }
              disabled={running}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-600 bg-[#FF5A0A] px-5 text-sm font-black text-white shadow-[0_9px_20px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Rocket size={16} />
              )}

              {running
                ? "Generating..."
                : "Generate Executive Scores"}
            </button>
          </div>
        </section>

        {running ? (
          <StatusBox
            tone="gold"
            icon={TimerReset}
            title="Executive AI is scanning Student OS data..."
            description="Risk, opportunity, application, offer, CAS, visa, document, task, university, and portfolio intelligence are being recalculated. The timeout guard unlocks the Admin OS if the backend hangs."
          />
        ) : null}

        {error ? (
          <StatusBox
            tone="red"
            icon={XCircle}
            title="Generation issue"
            description={
              error
            }
          />
        ) : null}

        {refreshWarning ? (
          <StatusBox
            tone="orange"
            icon={RefreshCw}
            title="Scores generated, dashboard refresh needs attention"
            description={
              refreshWarning
            }
          />
        ) : null}

        {result ? (
          <div className="min-w-0 space-y-5">
            <SectionHeader
              eyebrow="Generator Results"
              title="Run Health & Persistence"
              description="Separate generator execution health from Student OS score content."
              icon={CircleGauge}
            />

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <ResultCard
                label="Students Scanned"
                value={total}
                icon={Workflow}
              />

              <ResultCard
                label="Scores Saved"
                value={savedCount}
                tone={
                  failedCount === 0 &&
                  total > 0
                    ? "gold"
                    : "default"
                }
                icon={Database}
              />

              <ResultCard
                label="Failed"
                value={failedCount}
                tone={
                  failedCount > 0
                    ? "red"
                    : "default"
                }
                icon={XCircle}
              />

              <ResultCard
                label="Warnings"
                value={warningCount}
                tone={
                  warningCount > 0
                    ? "orange"
                    : "default"
                }
                icon={AlertTriangle}
              />

              <ResultCard
                label="Persistence"
                value={`${persistenceHealth}%`}
                tone={
                  persistenceHealth >=
                  95
                    ? "gold"
                    : persistenceHealth <
                      80
                    ? "orange"
                    : "default"
                }
                icon={ShieldCheck}
              />

              <ResultCard
                label="Runtime"
                value={`${runtimeSeconds}s`}
                tone={
                  runtimeSeconds >
                  20
                    ? "orange"
                    : "default"
                }
                icon={Clock3}
              />
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <ResultCard
                label="Critical Risk"
                value={number(
                  portfolio.critical,
                  number(
                    portfolio.criticalRisk
                  )
                )}
                tone="red"
                icon={AlertTriangle}
              />

              <ResultCard
                label="High Risk"
                value={number(
                  portfolio.high
                )}
                tone="orange"
                icon={FileWarning}
              />

              <ResultCard
                label="Executive Priority"
                value={number(
                  portfolio.executivePriority
                )}
                tone="gold"
                icon={Crown}
              />

              <ResultCard
                label="High Opportunity"
                value={number(
                  portfolio.highOpportunity
                )}
                tone="gold"
                icon={Target}
              />

              <ResultCard
                label="Application Ready"
                value={number(
                  portfolio.applicationReady
                )}
                tone="gold"
                icon={CheckCircle2}
              />

              <ResultCard
                label="Conversion Ready"
                value={number(
                  portfolio.conversionReady
                )}
                tone="gold"
                icon={Rocket}
              />
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <ResultCard
                label="Verified Outcomes"
                value={
                  verifiedOutcomes
                }
                tone="gold"
                icon={Trophy}
              />

              <ResultCard
                label="Avg Risk"
                value={number(
                  portfolio.averageRisk
                )}
                tone={
                  number(
                    portfolio.averageRisk
                  ) >= 50
                    ? "orange"
                    : "default"
                }
                icon={AlertTriangle}
              />

              <ResultCard
                label="Avg Opportunity"
                value={number(
                  portfolio.averageOpportunity
                )}
                tone="gold"
                icon={Target}
              />

              <ResultCard
                label="Visa Pending"
                value={number(
                  portfolio
                    .visaHealth
                    ?.pending,
                  journeyStats.visaPending
                )}
                tone="orange"
                icon={Clock3}
              />

              <ResultCard
                label="Visa Approved"
                value={number(
                  portfolio
                    .visaHealth
                    ?.approved,
                  journeyStats.visaApproved
                )}
                tone="gold"
                icon={ShieldCheck}
              />
            </div>

            <section className="rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">
                    Journey Distribution
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[#10233F]">
                    Generated Student Stage Coverage
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Quick breakdown of journey stages discovered during this scan.
                  </p>
                </div>

                <span className="rounded-full border-2 border-[#FFB38A] bg-[#FFF4EA] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#9B3E08]">
                  {journeyCoverage}% in motion
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                <MiniJourney
                  label="Not Started"
                  value={
                    journeyStats.notStarted
                  }
                  tone="red"
                />

                <MiniJourney
                  label="Started"
                  value={
                    journeyStats.applicationStarted
                  }
                />

                <MiniJourney
                  label="Submitted"
                  value={
                    journeyStats.applicationSubmitted
                  }
                  tone="gold"
                />

                <MiniJourney
                  label="Offer Received"
                  value={
                    journeyStats.offerReceived
                  }
                  tone="gold"
                />

                <MiniJourney
                  label="Offer Accepted"
                  value={
                    journeyStats.offerAccepted
                  }
                  tone="gold"
                />

                <MiniJourney
                  label="CAS Pending"
                  value={
                    journeyStats.casPending
                  }
                  tone="orange"
                />

                <MiniJourney
                  label="CAS Issued"
                  value={
                    journeyStats.casIssued
                  }
                  tone="gold"
                />

                <MiniJourney
                  label="Visa Pending"
                  value={
                    journeyStats.visaPending
                  }
                  tone="orange"
                />

                <MiniJourney
                  label="Visa Approved"
                  value={
                    journeyStats.visaApproved
                  }
                  tone="gold"
                />

                <MiniJourney
                  label="Visa Rejected"
                  value={
                    journeyStats.visaRejected
                  }
                  tone="red"
                />
              </div>
            </section>

            {warningCount > 0 ? (
              <DetailSection
                title="Generated with warnings"
                description="Non-blocking dependencies may have failed while the generator still completed with available data."
                open={
                  expanded.warnings
                }
                onToggle={() =>
                  toggleExpanded(
                    "warnings"
                  )
                }
                tone="orange"
                icon={AlertTriangle}
              >
                <div className="space-y-2">
                  {warnings.map(
                    (
                      warning,
                      index
                    ) => (
                      <IssueCard
                        key={`warning-${index}`}
                        title={
                          warning.tableName ||
                          `Warning ${
                            index + 1
                          }`
                        }
                        description={getErrorMessage(
                          warning.error ||
                            warning
                        )}
                        tone="orange"
                      />
                    )
                  )}
                </div>
              </DetailSection>
            ) : null}

            {failedCount > 0 ? (
              <DetailSection
                title="Some scores failed to save"
                description="Common causes include a missing Supabase column, RLS denial, invalid payload field, or unique-conflict mismatch."
                open={
                  expanded.failed
                }
                onToggle={() =>
                  toggleExpanded(
                    "failed"
                  )
                }
                tone="red"
                icon={XCircle}
              >
                <div className="space-y-2">
                  {failed.map(
                    (
                      item,
                      index
                    ) => (
                      <IssueCard
                        key={`failed-${index}`}
                        title={getStudentName(
                          item
                        )}
                        description={getErrorMessage(
                          item.error
                        )}
                        tone="red"
                      />
                    )
                  )}
                </div>
              </DetailSection>
            ) : total === 0 ? (
              <StatusBox
                tone="orange"
                icon={Workflow}
                title="No students found"
                description="Executive AI ran, but no inquiry or appointment students were loaded."
              />
            ) : (
              <StatusBox
                tone="gold"
                icon={CheckCircle2}
                title="Executive Student OS intelligence generated successfully"
                description={`${savedCount} score${
                  savedCount === 1
                    ? ""
                    : "s"
                } saved into the executive intelligence database.`}
              />
            )}

            {savedCount > 0 ? (
              <DetailSection
                title="Saved score preview"
                description="Preview of the latest successfully generated executive records."
                open={
                  expanded.saved
                }
                onToggle={() =>
                  toggleExpanded(
                    "saved"
                  )
                }
                tone="gold"
                icon={Database}
              >
                <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                  {saved
                    .slice(0, 10)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <SavedScoreCard
                          key={`saved-${index}`}
                          item={
                            item
                          }
                        />
                      )
                    )}
                </div>
              </DetailSection>
            ) : null}

            <DetailSection
              title="Raw generation payload"
              description="Developer-only output for debugging the generator response. Large payloads are truncated for UI safety."
              open={
                expanded.payload
              }
              onToggle={() =>
                toggleExpanded(
                  "payload"
                )
              }
              icon={Database}
            >
              <pre className="max-h-96 overflow-auto rounded-2xl border-2 border-[#123865] bg-[#123865] p-4 text-xs leading-5 text-white">
                {safeStringify(
                  result
                )}
              </pre>
            </DetailSection>
          </div>
        ) : (
          <EmptyGeneratorState />
        )}
      </div>
    </motion.section>
  );
}

function HeaderChip({
  icon: Icon,
  label,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-base font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
}) {
  return (
    <div className="flex items-start gap-3 border-l-[5px] border-[#FF5A0A] pl-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FFB38A] bg-[#FFF4EA] text-[#B84F0E]">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">
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

function StatusBox({
  tone = "gold",
  icon: Icon = Sparkles,
  title,
  description,
}) {
  const style =
    getToneStyle(tone);

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${style}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          size={18}
          className="mt-0.5 shrink-0"
        />

        <div>
          <p className="font-black text-[#10233F]">
            {title}
          </p>

          {description ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {
                description
              }
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  tone = "default",
  icon: Icon = ActivityFallback,
}) {
  const style =
    getToneStyle(tone);

  return (
    <div
      className={`rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(23,36,61,0.04)] ${style}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
          {label}
        </p>

        <Icon
          size={15}
          className="text-[#B84F0E]"
        />
      </div>

      <p className="mt-3 break-words text-3xl font-black text-[#10233F]">
        {value ?? 0}
      </p>
    </div>
  );
}

function ActivityFallback(
  props
) {
  return (
    <Workflow
      {...props}
    />
  );
}

function MiniJourney({
  label,
  value,
  tone = "default",
}) {
  const style =
    getToneStyle(tone);

  return (
    <div
      className={`rounded-xl border-[3px] p-4 shadow-[0_7px_18px_rgba(23,36,61,0.04)] ${style}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.09em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#10233F]">
        {value ?? 0}
      </p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  open,
  onToggle,
  tone = "default",
  icon: Icon = Database,
  children,
}) {
  const style =
    getToneStyle(tone);

  return (
    <section
      className={`rounded-[1.55rem] border-[3px] p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)] ${style}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FFB38A] bg-white text-[#B84F0E]">
            <Icon size={17} />
          </div>

          <div>
            <p className="font-black text-[#10233F]">
              {title}
            </p>

            {description ? (
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {
                  description
                }
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] px-4 py-2 text-xs font-black text-[#10233F] transition hover:border-[#FFB38A] hover:bg-[#FFF4EA]"
          aria-expanded={open}
        >
          {open ? (
            <ChevronUp
              size={14}
            />
          ) : (
            <ChevronDown
              size={14}
            />
          )}

          {open
            ? "Hide"
            : "Show"}
        </button>
      </div>

      {open ? (
        <div className="mt-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function IssueCard({
  title,
  description,
  tone = "red",
}) {
  const style =
    getToneStyle(tone);

  return (
    <div
      className={`rounded-xl border-[3px] p-4 shadow-[0_7px_18px_rgba(23,36,61,0.04)] ${style}`}
    >
      <p className="font-black text-[#10233F]">
        {title}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function SavedScoreCard({
  item = {},
}) {
  const executive =
    item.executive ||
    item.data ||
    {};

  const student =
    item.student || {};

  const name =
    getStudentName(item);

  const risk =
    number(
      executive.risk_score ||
        student.risk_score
    );

  const opportunity =
    number(
      executive.opportunity_score ||
        student.opportunity_score
    );

  const journeyStage =
    executive.journey_stage ||
    student.journey_stage ||
    "not_started";

  return (
    <div className="rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-black text-[#10233F]">
            {name}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {student.student_type ||
              executive.student_type ||
              "student"}{" "}
            •{" "}
            {formatLabel(
              journeyStage
            )}
          </p>
        </div>

        <span className="rounded-full border-2 border-[#FFB38A] bg-[#FFF4EA] px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#9B3E08]">
          {executive.executive_category ||
            student.executive_category ||
            "Generated"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SmallMetric
          label="Risk"
          value={risk}
          tone={
            risk >= 75
              ? "red"
              : risk >= 50
              ? "orange"
              : "default"
          }
        />

        <SmallMetric
          label="Opportunity"
          value={
            opportunity
          }
          tone={
            opportunity >= 70
              ? "gold"
              : "default"
          }
        />
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  tone = "default",
}) {
  const style =
    getToneStyle(tone);

  return (
    <div
      className={`rounded-xl border-2 px-3 py-2 ${style}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-black text-[#10233F]">
        {value ?? 0}
      </p>
    </div>
  );
}

function EmptyGeneratorState() {
  return (
    <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#FFB38A] bg-white p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#FFB38A] bg-[#FFF4EA] text-[#B84F0E]">
        <Bot size={26} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        No generator run in this session
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Run Executive Score Generator to rebuild Student OS risk, opportunity,
        journey, and portfolio intelligence from the connected database.
      </p>
    </div>
  );
}

function getToneStyle(
  tone = ""
) {
  if (tone === "red") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (
    tone === "orange"
  ) {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }

  if (
    tone === "gold"
  ) {
    return "border-[#FFB38A] bg-[#FFF4EA] text-[#9B3E08]";
  }

  return "border-[#C9D7E6] bg-white text-slate-700";
}

export default ExecutiveScoreGeneratorPanel;
