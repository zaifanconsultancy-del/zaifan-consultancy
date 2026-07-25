// GPTIntelligencePanel V4 — Maximum Stored GPT Intelligence OS
import { useEffect, useMemo, useRef, useState } from "react";
import AIActionPanel from "./AIActionPanel";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  GraduationCap,
  History,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import {
  AI_ANALYSIS_TYPES,
  getLatestStudentAIAnalysis,
  getStudentAIAnalysisHistory,
  runStudentAIAnalysis,
} from "../../utils/studentAIService";


const REQUEST_TIMEOUT_MS = 30000;
const STALE_ANALYSIS_DAYS = 14;

function withTimeout(promise, message = "Request timed out.") {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      REQUEST_TIMEOUT_MS
    );
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function getAnalysisAgeDays(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 86400000));
}

const AI_MODULES = [
  {
    id: AI_ANALYSIS_TYPES.STUDENT_ANALYSIS,
    label: "Student Analysis",
    shortLabel: "Student",
    icon: BrainCircuit,
    description: "Overall counselor analysis",
  },
  {
    id: AI_ANALYSIS_TYPES.RISK_ANALYSIS,
    label: "Risk Analysis",
    shortLabel: "Risk",
    icon: ShieldAlert,
    description: "Visa, document, application, and timeline risks",
  },
  {
    id: AI_ANALYSIS_TYPES.UNIVERSITY_RECOMMENDATION,
    label: "University Recommendations",
    shortLabel: "Universities",
    icon: GraduationCap,
    description: "Dream, target, and safe matching",
  },
  {
    id: AI_ANALYSIS_TYPES.COUNSELOR_COPILOT,
    label: "Counselor Copilot",
    shortLabel: "Copilot",
    icon: Target,
    description: "Next actions and call script",
  },
  {
    id: AI_ANALYSIS_TYPES.EMAIL_DRAFT,
    label: "Email Draft",
    shortLabel: "Email",
    icon: Mail,
    description: "Professional student email",
  },
  {
    id: AI_ANALYSIS_TYPES.WHATSAPP_DRAFT,
    label: "WhatsApp Draft",
    shortLabel: "WhatsApp",
    icon: MessageCircle,
    description: "Short student follow-up message",
  },
];

function GPTIntelligencePanel({
  student = {},
  onOpenWorkspace = () => {},
  adminProfile = null,
}) {
  const [activeModule, setActiveModule] = useState(
    AI_ANALYSIS_TYPES.STUDENT_ANALYSIS
  );
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [runningType, setRunningType] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const requestSequenceRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestSequenceRef.current += 1;
    };
  }, []);

  const studentId = student?.id;

  const studentName =
    student?.full_name || student?.name || student?.student_name || "Student";

  const selectedModule =
    AI_MODULES.find((item) => item.id === activeModule) || AI_MODULES[0];

  const parsed = latestAnalysis?.parsed || null;

  const summary =
    parsed?.summary ||
    student?.gpt_summary ||
    `No ${selectedModule.label.toLowerCase()} saved yet.`;

  const risk =
    parsed?.riskLevel ||
    parsed?.risk_level ||
    student?.gpt_risk ||
    "No risk level available yet.";

  const readinessScore =
    Number(
      parsed?.readinessScore ??
        parsed?.readiness_score ??
        latestAnalysis?.score ??
        student?.gpt_score ??
        0
    ) || 0;

  const riskScore = Number(parsed?.riskScore ?? parsed?.risk_score ?? 0) || 0;

  const risks = Array.isArray(parsed?.risks) ? parsed.risks : [];

  const recommendedActions = Array.isArray(parsed?.recommendedActions)
    ? parsed.recommendedActions
    : Array.isArray(parsed?.recommended_actions)
    ? parsed.recommended_actions
    : [];

  const analyzedAt = latestAnalysis?.created_at
    ? new Date(latestAnalysis.created_at).toLocaleString()
    : "Not analyzed yet";

  const analysisAgeDays = getAnalysisAgeDays(latestAnalysis?.created_at);
  const isStale =
    analysisAgeDays !== null && analysisAgeDays >= STALE_ANALYSIS_DAYS;

  const freshnessLabel = !latestAnalysis
    ? "Not generated"
    : isStale
      ? `${analysisAgeDays} days old`
      : analysisAgeDays === 0
        ? "Generated today"
        : `${analysisAgeDays} day${analysisAgeDays === 1 ? "" : "s"} old`;

  const hasGPT = Boolean(latestAnalysis);
  const isRunning = runningType === activeModule;

  const riskStyle = useMemo(() => getRiskStyle(risk), [risk]);

  const loadAIAnalysis = async (moduleType = activeModule) => {
    if (!studentId) return;

    const requestId = ++requestSequenceRef.current;

    if (mountedRef.current) {
      setLoadingAnalysis(true);
      setError("");
    }

    try {
      const [latest, history] = await withTimeout(
        Promise.all([
          getLatestStudentAIAnalysis(studentId, moduleType),
          getStudentAIAnalysisHistory(studentId, moduleType),
        ]),
        "Stored GPT intelligence took too long to load."
      );

      if (!mountedRef.current || requestId !== requestSequenceRef.current) return;

      setLatestAnalysis(latest || null);
      setAnalysisHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestSequenceRef.current) return;

      console.error("GPT intelligence load failed:", err);
      setError(
        err?.message ||
          "Stored GPT intelligence could not load. Check student_ai_analysis permissions or connectivity."
      );
    } finally {
      if (mountedRef.current && requestId === requestSequenceRef.current) {
        setLoadingAnalysis(false);
      }
    }
  };

  useEffect(() => {
    requestSequenceRef.current += 1;
    setLatestAnalysis(null);
    setAnalysisHistory([]);
    setError("");
    setSuccessMessage("");

    if (studentId) {
      void loadAIAnalysis(activeModule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, activeModule]);

  const handleRunAnalysis = async (moduleType = activeModule) => {
    if (!studentId || runningType || loadingAnalysis) {
      if (!studentId) {
        setError("Student ID missing. Cannot run GPT analysis.");
      }
      return;
    }

    const moduleToRun =
      AI_MODULES.find((item) => item.id === moduleType) || selectedModule;

    const confirmed = window.confirm(
      `Run ${moduleToRun.label} for ${studentName}? This will make a paid OpenAI/API request and store the result.`
    );

    if (!confirmed) return;

    setRunningType(moduleType);
    setError("");
    setSuccessMessage("");

    try {
      const result = await withTimeout(
        runStudentAIAnalysis({
          student,
          analysisType: moduleType,
        }),
        `${selectedModule.label} generation timed out.`
      );

      if (!result?.saved && !result?.parsed) {
        throw new Error("GPT analysis returned no saved or parsed result.");
      }

      if (moduleType === activeModule && mountedRef.current) {
        setLatestAnalysis({
          ...(result.saved || {}),
          parsed: result.parsed || result.saved?.parsed || null,
        });
      }

      await loadAIAnalysis(moduleType);

      if (mountedRef.current) {
        setSuccessMessage(
          `${moduleToRun.label} generated and stored successfully.`
        );
        window.setTimeout(() => {
          if (mountedRef.current) setSuccessMessage("");
        }, 3200);
      }
    } catch (err) {
      console.error("GPT intelligence generation failed:", err);

      if (mountedRef.current) {
        setError(
          err?.message ||
            "GPT analysis failed. Check the AI service, Edge Function/API configuration, and student_ai_analysis permissions."
        );
      }
    } finally {
      if (mountedRef.current) {
        setRunningType("");
      }
    }
  };

  const handleModuleChange = (moduleType) => {
    if (runningType || loadingAnalysis) return;
    setActiveModule(moduleType);
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
        <div className="flex flex-col gap-4 border-b border-orange-300 bg-[#123865] p-6 lg:flex-row lg:items-start lg:justify-between" style={{ color: "#FFFFFF" }}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
              Real GPT Counselor Intelligence
            </p>

            <h2 className="mt-3 text-2xl font-black" style={{ color: "#FFFFFF" }}>
              Multi-Module AI Operating System
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6" style={{ color: "#F8FAFC" }}>
              Run separate OpenAI modules for analysis, risk, university
              recommendations, counselor copilot, email drafts, and WhatsApp
              drafts. Each module saves its own history.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div
              className="rounded-xl border border-orange-300/50 bg-white/10 px-3 py-2 text-[11px] font-bold"
              style={{ color: "#FFF7ED" }}
            >
              Paid GPT call only runs when you press Run / Re-run.
            </div>
            <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadAIAnalysis(activeModule)}
              disabled={loadingAnalysis || Boolean(runningType)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 bg-white px-4 py-2.5 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingAnalysis ? "animate-spin" : ""} />
              {loadingAnalysis ? "Loading..." : "Reload"}
            </button>

            <button
              type="button"
              onClick={() => handleRunAnalysis(activeModule)}
              disabled={Boolean(runningType) || loadingAnalysis}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={14} />
              {isRunning
                ? "Analyzing..."
                : hasGPT
                ? `Re-run ${selectedModule.shortLabel}`
                : `Run ${selectedModule.shortLabel}`}
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <GPTModeCard
          label="Generation"
          value="Real GPT"
          detail="A paid/remote model call happens only when you run a module."
          tone="orange"
        />
        <GPTModeCard
          label="Storage"
          value={hasGPT ? "Stored" : "Empty"}
          detail="Each module keeps its own saved analysis history."
          tone="navy"
        />
        <GPTModeCard
          label="Freshness"
          value={freshnessLabel}
          detail={
            isStale
              ? "Stored intelligence is old enough to consider re-running."
              : "Current stored intelligence age for the selected module."
          }
          tone="cream"
        />
      </div>

      {successMessage ? (
        <StatusBanner
          type="success"
          message={successMessage}
          onDismiss={() => setSuccessMessage("")}
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {AI_MODULES.map((module) => {
          const isActive = module.id === activeModule;
          const isModuleRunning = runningType === module.id;
          const ModuleIcon = module.icon;

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => handleModuleChange(module.id)}
              disabled={Boolean(runningType) || loadingAnalysis}
              className={`rounded-[1.5rem] border-2 p-4 text-left shadow-[0_5px_16px_rgba(15,35,63,0.035)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "border-orange-500 bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.16)]"
                  : "border-[#b8c5d3] bg-white hover:border-orange-300 hover:bg-orange-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${
                      isActive
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-orange-200 bg-orange-50 text-orange-700"
                    }`}
                  >
                    <ModuleIcon size={17} />
                  </span>
                  <h3
                    className="mt-2 text-sm font-black"
                    style={{ color: isActive ? "#FFFFFF" : "#10233F" }}
                  >
                    {module.label}
                  </h3>
                </div>

                {isModuleRunning ? (
                  <span className="rounded-full border border-white/30 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                    Running
                  </span>
                ) : null}
              </div>

              <p
                className="mt-2 text-xs font-semibold leading-5"
                style={{ color: isActive ? "#FFFFFF" : "#36506F" }}
              >
                {module.description}
              </p>
            </button>
          );
        })}
      </div>

      {error ? (
        <StatusBanner
          type="error"
          message={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {!hasGPT && !loadingAnalysis ? (
        <div className="rounded-[1.75rem] border-2 border-amber-300 bg-amber-50 p-5">
          <p className="font-bold text-amber-800">
            No {selectedModule.label.toLowerCase()} saved yet.
          </p>
          <p className="mt-2 text-sm text-[#36506f]">
            Run this module to generate real OpenAI output for {studentName}.
          </p>
        </div>
      ) : null}

      {hasGPT && isStale ? (
        <div className="flex items-start gap-3 rounded-[1.5rem] border-2 border-orange-300 bg-orange-50 p-4">
          <Clock3 size={18} className="mt-0.5 shrink-0 text-orange-700" />
          <div>
            <p className="text-sm font-black text-[#10233f]">
              Stored GPT intelligence may be stale
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#36506f]">
              This {selectedModule.label.toLowerCase()} is {freshnessLabel}.
              Re-run only when the student profile or case facts have materially changed.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Readiness Score" value={readinessScore} />
        <StatCard label="Risk Level" value={risk} />
        <StatCard label="Risk Score" value={riskScore || "—"} />
        <StatCard label="AI Runs" value={analysisHistory.length} />
      </div>

      <InsightBlock title={`${selectedModule.label} Summary`} content={summary} />

      <div className="rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6">
        <div
          className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${riskStyle}`}
        >
          Risk Level: {risk}
        </div>

        <p className="mt-4 text-sm leading-7 text-[#36506f]">
          Module type:{" "}
          <span className="font-semibold text-orange-700">{activeModule}</span>
        </p>
      </div>

      {hasGPT ? (
        <AIActionPanel
          student={student}
          parsed={parsed}
          activeModule={activeModule}
          adminProfile={adminProfile}
        />
      ) : null}

      {activeModule === AI_ANALYSIS_TYPES.RISK_ANALYSIS ? (
        <RiskAnalysisView parsed={parsed} />
      ) : null}

      {activeModule === AI_ANALYSIS_TYPES.UNIVERSITY_RECOMMENDATION ? (
        <UniversityRecommendationView parsed={parsed} />
      ) : null}

      {activeModule === AI_ANALYSIS_TYPES.COUNSELOR_COPILOT ? (
        <CounselorCopilotView parsed={parsed} />
      ) : null}

      {activeModule === AI_ANALYSIS_TYPES.EMAIL_DRAFT ? (
        <EmailDraftView parsed={parsed} />
      ) : null}

      {activeModule === AI_ANALYSIS_TYPES.WHATSAPP_DRAFT ? (
        <WhatsAppDraftView parsed={parsed} />
      ) : null}

      {activeModule === AI_ANALYSIS_TYPES.STUDENT_ANALYSIS ? (
        <>
          <ListBlock
            title="Detected Risks"
            emptyText="No detailed risks generated yet."
            items={risks}
          />

          <ListBlock
            title="Recommended Counselor Actions"
            emptyText="No recommended actions generated yet."
            items={recommendedActions}
          />
        </>
      ) : null}

      {activeModule !== AI_ANALYSIS_TYPES.STUDENT_ANALYSIS ? (
        <ListBlock
          title="Recommended Actions"
          emptyText="No recommended actions generated yet."
          items={recommendedActions}
        />
      ) : null}

      <div className="rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6">
        <h3 className="font-bold text-[#10233f]">AI Metadata</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetaCard label="Last Analysis" value={analyzedAt} />
          <MetaCard label="Stored Intelligence" value={hasGPT ? "Yes" : "No"} />
          <MetaCard label="Analysis Type" value={activeModule} />
        </div>
      </div>

      <div className="rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History size={16} className="text-orange-700" />
              <h3 className="font-black text-[#10233f]">Module History</h3>
            </div>
            <p className="mt-1 text-sm text-[#36506f]">
              Saved history for this selected GPT module. New runs create additional stored rows.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenWorkspace}
            className="rounded-full border border-orange-300 bg-orange-50 px-5 py-2 text-sm font-bold text-orange-700 transition hover:border-[#D4AF37]/45"
          >
            Open GPT Workspace
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {analysisHistory.length > 0 ? (
            analysisHistory.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 shadow-[0_4px_14px_rgba(15,35,63,0.025)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-[#10233f]">
                    {item?.parsed?.riskLevel ||
                      item?.risk_level ||
                      selectedModule.label}
                  </p>

                  <p className="text-xs text-[#4d6380]">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Unknown date"}
                  </p>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#36506f]">
                  {item?.parsed?.summary ||
                    item?.analysis ||
                    "Saved AI analysis"}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 text-sm text-[#36506f]">
              No history for this module yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


function StatusBanner({ type = "info", message, onDismiss }) {
  const style =
    type === "error"
      ? "border-red-300 bg-red-50 text-red-800"
      : type === "success"
        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
        : "border-blue-300 bg-blue-50 text-blue-800";

  const Icon =
    type === "error"
      ? AlertTriangle
      : type === "success"
        ? CheckCircle2
        : BrainCircuit;

  return (
    <div className={`flex items-start gap-3 rounded-[1.5rem] border-2 p-4 ${style}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 text-sm font-black">{message}</div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-lg font-black leading-none"
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  );
}

function GPTModeCard({ label, value, detail, tone = "cream" }) {
  const isNavy = tone === "navy";
  const isOrange = tone === "orange";
  const isStrong = isNavy || isOrange;

  const style = isNavy
    ? "border-[#123865] bg-[#123865]"
    : isOrange
    ? "border-[#FF5A0A] bg-[#FF5A0A]"
    : "border-orange-300 bg-white";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_20px_rgba(15,35,63,0.05)] ${style}`}
      style={{ color: isStrong ? "#FFFFFF" : "#10233F" }}
    >
      <p
        className="text-[9px] font-black uppercase tracking-[0.14em]"
        style={{ color: isStrong ? "#FFFFFF" : "#4D6380" }}
      >
        {label}
      </p>

      <p
        className="mt-1 break-words text-xl font-black"
        style={{ color: isStrong ? "#FFFFFF" : "#10233F" }}
      >
        {value}
      </p>

      <p
        className="mt-1 text-xs font-semibold leading-5"
        style={{ color: isStrong ? "#FFF7ED" : "#4D6380" }}
      >
        {detail}
      </p>
    </div>
  );
}

function RiskAnalysisView({ parsed }) {
  const riskCards = [
    ["Visa Risk", parsed?.visaRisk],
    ["Document Risk", parsed?.documentRisk],
    ["Application Risk", parsed?.applicationRisk],
    ["University Risk", parsed?.universityRisk],
    ["Timeline Risk", parsed?.timelineRisk],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {riskCards.map(([title, risk]) => (
        <div
          key={title}
          className="rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6"
        >
          <div
            className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${getRiskStyle(
              risk?.level
            )}`}
          >
            {title}: {risk?.level || "Not analyzed"}
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#243b5a]">
            {risk?.reason || "No reason generated yet."}
          </p>

          <ListBlock
            title={`${title} Actions`}
            emptyText="No actions generated."
            items={Array.isArray(risk?.actions) ? risk.actions : []}
            compact
          />
        </div>
      ))}
    </div>
  );
}

function UniversityRecommendationView({ parsed }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <UniversityList
        title="Dream Universities"
        items={parsed?.dreamUniversities}
      />
      <UniversityList
        title="Target Universities"
        items={parsed?.targetUniversities}
      />
      <UniversityList title="Safe Universities" items={parsed?.safeUniversities} />

      <div className="lg:col-span-3">
        <ListBlock
          title="Profile Gaps"
          emptyText="No profile gaps generated yet."
          items={parsed?.profileGaps || []}
        />
      </div>

      <div className="lg:col-span-3">
        <ListBlock
          title="Recommended Countries"
          emptyText="No countries generated yet."
          items={parsed?.recommendedCountries || []}
        />
      </div>
    </div>
  );
}

function CounselorCopilotView({ parsed }) {
  return (
    <div className="space-y-5">
      <ListBlock
        title="Priority Actions"
        emptyText="No priority actions generated yet."
        items={parsed?.priorityActions || []}
      />

      <InsightBlock
        title="Next Call Script"
        content={parsed?.nextCallScript || "No call script generated yet."}
      />

      <ListBlock
        title="Internal Notes"
        emptyText="No internal notes generated yet."
        items={parsed?.internalNotes || []}
      />

      <ListBlock
        title="Follow-up Plan"
        emptyText="No follow-up plan generated yet."
        items={parsed?.followUpPlan || []}
      />
    </div>
  );
}

function EmailDraftView({ parsed }) {
  return (
    <div className="space-y-5">
      <MetaCard label="Subject" value={parsed?.subject || "No subject yet."} />

      <InsightBlock
        title="Email Body"
        content={parsed?.emailBody || "No email draft generated yet."}
      />

      <MetaCard label="Tone" value={parsed?.tone || "Not specified"} />
    </div>
  );
}

function WhatsAppDraftView({ parsed }) {
  return (
    <div className="space-y-5">
      <InsightBlock
        title="WhatsApp Message"
        content={
          parsed?.whatsappMessage || "No WhatsApp message generated yet."
        }
      />

      <MetaCard label="Tone" value={parsed?.tone || "Not specified"} />
    </div>
  );
}

function UniversityList({ title, items = [] }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6">
      <h3 className="font-bold text-[#10233f]">{title}</h3>

      <div className="mt-4 space-y-3">
        {safeItems.length ? (
          safeItems.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 shadow-[0_4px_14px_rgba(15,35,63,0.025)]"
            >
              <p className="font-bold text-[#10233f]">
                {item?.university || item?.name || `Option ${index + 1}`}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                {item?.country || "Country not specified"}
              </p>

              <p className="mt-3 text-sm leading-6 text-[#36506f]">
                {item?.reason || item?.description || "No reason generated."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold ${getRiskStyle(
                    item?.riskLevel
                  )}`}
                >
                  {item?.riskLevel || "Risk unknown"}
                </span>

                {item?.requiredNextStep ? (
                  <span className="rounded-full border border-[#b8c5d3] bg-[#f7f9fc] px-3 py-1 text-[11px] text-[#36506f]">
                    {item.requiredNextStep}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 text-sm text-[#4d6380]">
            No recommendations generated yet.
          </p>
        )}
      </div>
    </div>
  );
}

function InsightBlock({ title, content }) {
  return (
    <div className="rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6">
      <h3 className="font-bold text-[#10233f]">{title}</h3>

      <p className="mt-3 whitespace-pre-wrap text-[#243b5a] leading-7">
        {content}
      </p>
    </div>
  );
}

function ListBlock({ title, items = [], emptyText = "", compact = false }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div
      className={
        compact
          ? "mt-5"
          : "rounded-[1.75rem] border-[3px] border-[#b8c5d3] bg-white p-6"
      }
    >
      <h3 className="font-bold text-[#10233f]">{title}</h3>

      <div className="mt-4 space-y-3">
        {safeItems.length > 0 ? (
          safeItems.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 text-sm leading-6 text-[#243b5a]"
            >
              {formatListItem(item)}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 text-sm text-[#4d6380]">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function formatListItem(item) {
  if (typeof item === "string") return item;

  if (item?.title && item?.description) {
    return `${item.title}: ${item.description}`;
  }

  if (item?.title) return item.title;
  if (item?.description) return item.description;
  if (item?.action) return item.action;
  if (item?.reason) return item.reason;
  if (item?.country) return item.country;
  if (item?.university) return item.university;

  try {
    return JSON.stringify(item);
  } catch {
    return "AI generated item";
  }
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#b8c5d3] bg-[#fff8ee] p-4 shadow-[0_4px_14px_rgba(15,35,63,0.025)]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#4d6380]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-[#243b5a]">
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border-2 border-[#b8c5d3] bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.03)]"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[#4d6380]">
        {label}
      </p>

      <p className="mt-3 break-words text-2xl font-black text-[#10233f]">
        {value}
      </p>
    </motion.div>
  );
}

function getRiskStyle(value = "") {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("critical")) {
    return "text-red-700 border-red-400/40 bg-red-500/15";
  }

  if (normalized.includes("high")) {
    return "text-red-700 border-red-400/30 bg-red-500/10";
  }

  if (normalized.includes("medium")) {
    return "text-amber-800 border-amber-300 bg-amber-50";
  }

  if (normalized.includes("low")) {
    return "text-emerald-700 border-emerald-300 bg-emerald-50";
  }

  return "text-[#243b5a] border-[#b8c5d3] bg-[#f7f9fc]";
}

export default GPTIntelligencePanel;