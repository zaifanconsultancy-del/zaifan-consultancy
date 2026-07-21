import { useMemo, useState } from "react";
import { generateExecutiveScoresFromDatabase } from "../../lib/executivePortfolioGenerator";

const GENERATOR_TIMEOUT_MS = 30000;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
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
  if (!error) return "Unknown issue.";
  if (typeof error === "string") return error;
  return error.message || error.details || error.hint || JSON.stringify(error);
}

function ExecutiveScoreGeneratorPanel({ onGenerated = () => {} }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [lastRunAt, setLastRunAt] = useState(null);
  const [expanded, setExpanded] = useState({
    saved: false,
    failed: true,
    warnings: true,
    payload: false,
  });

  const runGenerator = async () => {
    if (running) return;

    setRunning(true);
    setError("");
    setResult(null);

    const startedAt = Date.now();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Executive score generation timed out after ${Math.round(
              GENERATOR_TIMEOUT_MS / 1000
            )} seconds. The scan was stopped so the dashboard does not stay stuck.`
          )
        );
      }, GENERATOR_TIMEOUT_MS);
    });

    try {
      const output = await Promise.race([
        generateExecutiveScoresFromDatabase(),
        timeoutPromise,
      ]);

      const finishedAt = Date.now();
      const runtimeMs = finishedAt - startedAt;
      const finalOutput = {
        ...(output || {}),
        runtimeMs,
        generatedAt: new Date().toISOString(),
      };

      if (finalOutput?.error) {
        setError(
          finalOutput.error.message ||
            finalOutput.error.details ||
            "Executive score generation failed."
        );
        setResult(finalOutput);
        return;
      }

      setResult(finalOutput);
      setLastRunAt(new Date());

      try {
        await Promise.race([
          Promise.resolve(onGenerated(finalOutput)),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Executive dashboard refresh timed out.")),
              12000
            )
          ),
        ]);
      } catch (refreshError) {
        console.error("Executive scores generated, but reload failed:", refreshError);
      }
    } catch (err) {
      console.error("Executive score generation crashed/timed out:", err);

      setError(
        err.message ||
          "Executive score generation crashed or timed out. Check console for the exact Supabase table/column issue."
      );
    } finally {
      setRunning(false);
    }
  };

  const portfolio = result?.portfolio || {};
  const failed = Array.isArray(result?.failed) ? result.failed : [];
  const saved = Array.isArray(result?.saved) ? result.saved : [];
  const warnings = Array.isArray(result?.warnings) ? result.warnings : [];

  const failedCount = number(result?.failedCount, failed.length);
  const savedCount = number(result?.savedCount, saved.length);
  const total = number(result?.total, savedCount + failedCount);
  const warningCount = warnings.length;
  const successRate = total ? Math.round((savedCount / total) * 100) : 0;
  const runtimeSeconds = result?.runtimeMs
    ? Math.round((result.runtimeMs / 1000) * 10) / 10
    : 0;

  const journeyStats = useMemo(() => {
    const allStudents = [
      ...saved.map((item) => item.executive || item.data || item.student || {}),
      ...failed.map((item) => item.executive || item.student || {}),
    ];

    return {
      notStarted: allStudents.filter((item) => normalize(item.journey_stage) === "not_started").length,
      applicationStarted: allStudents.filter((item) => normalize(item.journey_stage) === "application_started").length,
      applicationSubmitted: allStudents.filter((item) =>
        ["application_submitted", "application_under_review"].includes(normalize(item.journey_stage))
      ).length,
      offerReceived: allStudents.filter((item) => normalize(item.journey_stage) === "offer_received").length,
      offerAccepted: allStudents.filter((item) => normalize(item.journey_stage) === "offer_accepted").length,
      casPending: allStudents.filter((item) => normalize(item.journey_stage) === "cas_pending").length,
      casIssued: allStudents.filter((item) => normalize(item.journey_stage) === "cas_issued").length,
      visaPending: allStudents.filter((item) => normalize(item.journey_stage) === "visa_pending").length,
      visaApproved: allStudents.filter((item) => normalize(item.journey_stage) === "visa_approved").length,
      visaRejected: allStudents.filter((item) => normalize(item.journey_stage) === "visa_rejected").length,
    };
  }, [saved, failed]);

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_18px_50px_rgba(23,36,61,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
            Executive Score Generator
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#17243D]">
            Generate Student OS Intelligence
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
            Scan inquiries, appointments, applications, documents, tasks,
            universities, visa signals, and previous risk records, then save
            executive AI scores into the Student OS intelligence database.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <InfoPill label="Timeout Guard" value={`${Math.round(GENERATOR_TIMEOUT_MS / 1000)}s`} />
            <InfoPill label="Save Target" value="ai_student_risk_scores" />
            <InfoPill label="Mode" value="Human Review" />
            {lastRunAt ? <InfoPill label="Last Run" value={lastRunAt.toLocaleString()} /> : null}
          </div>
        </div>

        <button
          type="button"
          onClick={runGenerator}
          disabled={running}
          className="rounded-full border border-[#E9802D] bg-[#E9802D] px-6 py-3 text-sm font-black text-white shadow-[0_10px_22px_rgba(233,128,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#D96C1F] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Generating..." : "Generate Executive Scores"}
        </button>
      </div>

      {running ? (
        <StatusBox
          tone="gold"
          title="Executive AI is scanning Student OS data..."
          description="This may update risk, opportunity, application, offer, CAS, visa, document, task, university, and portfolio intelligence. The timeout guard will unlock the dashboard if Supabase hangs."
        />
      ) : null}

      {error ? (
        <StatusBox tone="red" title="Generation issue" description={error} />
      ) : null}

      {result ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-6">
            <ResultCard label="Students Scanned" value={total} />
            <ResultCard label="Scores Saved" value={savedCount} success={failedCount === 0 && total > 0} />
            <ResultCard label="Failed" value={failedCount} danger={failedCount > 0} />
            <ResultCard label="Warnings" value={warningCount} warning={warningCount > 0} />
            <ResultCard label="Success Rate" value={`${successRate}%`} success={successRate >= 95 && total > 0} />
            <ResultCard label="Runtime" value={`${runtimeSeconds}s`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <ResultCard label="Critical Risk" value={portfolio.critical || portfolio.criticalRisk || 0} danger />
            <ResultCard label="High Risk" value={portfolio.high || 0} warning />
            <ResultCard label="Executive Priority" value={portfolio.executivePriority || 0} />
            <ResultCard label="High Opportunity" value={portfolio.highOpportunity || 0} success />
            <ResultCard label="Application Ready" value={portfolio.applicationReady || 0} success />
            <ResultCard label="Conversion Ready" value={portfolio.conversionReady || 0} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ResultCard label="Success Stories" value={portfolio.successStories || 0} success />
            <ResultCard label="Avg Risk" value={portfolio.averageRisk || 0} warning={number(portfolio.averageRisk) >= 50} />
            <ResultCard label="Avg Opportunity" value={portfolio.averageOpportunity || 0} />
            <ResultCard label="Visa Pending" value={portfolio.visaHealth?.pending || journeyStats.visaPending || 0} warning />
            <ResultCard label="Visa Approved" value={portfolio.visaHealth?.approved || journeyStats.visaApproved || 0} success />
          </div>

          <div className="rounded-[1.75rem] border border-[#243A60]/20 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B84F0E]">
              Journey Distribution
            </p>
            <p className="mt-2 text-sm leading-6 text-[#7A8392]">
              Quick breakdown of generated student stages from the current scan.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              <MiniJourney label="Not Started" value={journeyStats.notStarted} />
              <MiniJourney label="Started" value={journeyStats.applicationStarted} />
              <MiniJourney label="Submitted" value={journeyStats.applicationSubmitted} />
              <MiniJourney label="Offer Received" value={journeyStats.offerReceived} success />
              <MiniJourney label="Offer Accepted" value={journeyStats.offerAccepted} success />
              <MiniJourney label="CAS Pending" value={journeyStats.casPending} warning />
              <MiniJourney label="CAS Issued" value={journeyStats.casIssued} success />
              <MiniJourney label="Visa Pending" value={journeyStats.visaPending} warning />
              <MiniJourney label="Visa Approved" value={journeyStats.visaApproved} success />
              <MiniJourney label="Visa Rejected" value={journeyStats.visaRejected} danger />
            </div>
          </div>

          {warningCount > 0 ? (
            <DetailSection
              title="Generated with warnings"
              description="Some non-blocking tables may not have loaded, but Executive AI still generated available scores."
              open={expanded.warnings}
              onToggle={() => toggleExpanded("warnings")}
              tone="orange"
            >
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <IssueCard
                    key={`warning-${index}`}
                    title={warning.tableName || `Warning ${index + 1}`}
                    description={getErrorMessage(warning.error || warning)}
                    tone="orange"
                  />
                ))}
              </div>
            </DetailSection>
          ) : null}

          {failedCount > 0 ? (
            <DetailSection
              title="Some scores failed to save"
              description="Usually this means the Supabase table is missing a column, the unique conflict rule is not ready, or the saved payload has a field not present in the table."
              open={expanded.failed}
              onToggle={() => toggleExpanded("failed")}
              tone="red"
            >
              <div className="space-y-2">
                {failed.map((item, index) => (
                  <IssueCard
                    key={`failed-${index}`}
                    title={getStudentName(item)}
                    description={getErrorMessage(item.error)}
                    tone="red"
                  />
                ))}
              </div>
            </DetailSection>
          ) : total === 0 ? (
            <StatusBox
              tone="orange"
              title="No students found"
              description="Executive AI ran, but no inquiry or appointment students were loaded."
            />
          ) : (
            <StatusBox
              tone="green"
              title="Executive Student OS intelligence generated successfully"
              description={`${savedCount} score${savedCount === 1 ? "" : "s"} saved into the executive intelligence database.`}
            />
          )}

          {savedCount > 0 ? (
            <DetailSection
              title="Saved score preview"
              description="Preview of the latest successfully generated executive records."
              open={expanded.saved}
              onToggle={() => toggleExpanded("saved")}
              tone="green"
            >
              <div className="grid gap-3 lg:grid-cols-2">
                {saved.slice(0, 10).map((item, index) => (
                  <SavedScoreCard key={`saved-${index}`} item={item} />
                ))}
              </div>
            </DetailSection>
          ) : null}

          <DetailSection
            title="Raw generation payload"
            description="Developer-only view for debugging generator output."
            open={expanded.payload}
            onToggle={() => toggleExpanded("payload")}
          >
            <pre className="max-h-96 overflow-auto rounded-2xl border border-[#243A60]/20 bg-[#17243D] p-4 text-xs leading-5 text-[#F7F3EB]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </DetailSection>
        </div>
      ) : null}
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <span className="rounded-full border border-[#243A60]/20 bg-white px-3 py-1 text-[11px] font-bold text-[#7A8392]">
      {label}: <span className="text-[#344054]">{value}</span>
    </span>
  );
}

function StatusBox({ tone = "gold", title, description }) {
  const style =
    tone === "red"
      ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
      : tone === "orange"
      ? "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]"
      : tone === "green"
      ? "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]"
      : "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]";

  return (
    <div className={`mt-5 rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${style}`}>
      <p className="font-bold">{title}</p>
      {description ? <p className="mt-2 text-sm text-[#667085]">{description}</p> : null}
    </div>
  );
}

function ResultCard({
  label,
  value,
  danger = false,
  warning = false,
  success = false,
}) {
  const style = danger
    ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
    : warning
    ? "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]"
    : "border-[#243A60]/20 bg-white text-[#B84F0E]";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${style}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {label}
      </p>

      <p className="mt-3 break-words text-3xl font-black text-[#17243D]">{value}</p>
    </div>
  );
}

function MiniJourney({ label, value, danger = false, warning = false, success = false }) {
  const style = danger
    ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
    : warning
    ? "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]"
    : "border-[#243A60]/20 bg-white text-[#596579]";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8992A1]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#17243D]">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  description,
  open,
  onToggle,
  tone = "default",
  children,
}) {
  const style =
    tone === "red"
      ? "border-[#C2413B]/30 bg-[#FFF0EE]"
      : tone === "orange"
      ? "border-[#A36A18]/30 bg-[#FFF7E8]"
      : tone === "green"
      ? "border-[#E9802D]/35 bg-[#FFF3E7]"
      : "border-[#243A60]/20 bg-white";

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)] ${style}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black text-[#17243D]">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-[#7A8392]">{description}</p> : null}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-[#243A60]/20 bg-white px-4 py-2 text-xs font-bold text-[#596579] transition hover:border-[#E9802D]/45 hover:text-[#B84F0E]"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function IssueCard({ title, description, tone = "red" }) {
  const style =
    tone === "orange"
      ? "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]"
      : "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.04)] ${style}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[#667085]">
        {description}
      </p>
    </div>
  );
}

function SavedScoreCard({ item = {} }) {
  const executive = item.executive || item.data || {};
  const student = item.student || {};
  const name = getStudentName(item);
  const risk = number(executive.risk_score || student.risk_score);
  const opportunity = number(executive.opportunity_score || student.opportunity_score);

  return (
    <div className="rounded-2xl border border-[#243A60]/20 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-bold text-[#17243D]">{name}</p>
          <p className="mt-1 text-xs text-[#8992A1]">
            {student.student_type || executive.student_type || "student"} • {formatLabel(executive.journey_stage || student.journey_stage || "not_started")}
          </p>
        </div>

        <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#B84F0E]">
          {executive.executive_category || student.executive_category || "Generated"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SmallMetric label="Risk" value={risk} danger={risk >= 75} />
        <SmallMetric label="Opportunity" value={opportunity} success={opportunity >= 70} />
      </div>
    </div>
  );
}

function SmallMetric({ label, value, danger = false, success = false }) {
  const style = danger
    ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]"
    : "border-[#243A60]/20 bg-white text-[#596579]";

  return (
    <div className={`rounded-xl border px-3 py-2 ${style}`}>
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8992A1]">{label}</p>
      <p className="mt-1 font-black text-[#17243D]">{value}</p>
    </div>
  );
}

export default ExecutiveScoreGeneratorPanel;