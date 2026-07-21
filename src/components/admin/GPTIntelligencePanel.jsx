import { useEffect, useMemo, useState } from "react";
import AIActionPanel from "./AIActionPanel";
import { motion } from "framer-motion";
import {
  AI_ANALYSIS_TYPES,
  getLatestStudentAIAnalysis,
  getStudentAIAnalysisHistory,
  runStudentAIAnalysis,
} from "../../utils/studentAIService";

const AI_MODULES = [
  {
    id: AI_ANALYSIS_TYPES.STUDENT_ANALYSIS,
    label: "Student Analysis",
    shortLabel: "Student",
    icon: "🧠",
    description: "Overall counselor analysis",
  },
  {
    id: AI_ANALYSIS_TYPES.RISK_ANALYSIS,
    label: "Risk Analysis",
    shortLabel: "Risk",
    icon: "⚠️",
    description: "Visa, document, application, and timeline risks",
  },
  {
    id: AI_ANALYSIS_TYPES.UNIVERSITY_RECOMMENDATION,
    label: "University Recommendations",
    shortLabel: "Universities",
    icon: "🏫",
    description: "Dream, target, and safe matching",
  },
  {
    id: AI_ANALYSIS_TYPES.COUNSELOR_COPILOT,
    label: "Counselor Copilot",
    shortLabel: "Copilot",
    icon: "🎯",
    description: "Next actions and call script",
  },
  {
    id: AI_ANALYSIS_TYPES.EMAIL_DRAFT,
    label: "Email Draft",
    shortLabel: "Email",
    icon: "✉️",
    description: "Professional student email",
  },
  {
    id: AI_ANALYSIS_TYPES.WHATSAPP_DRAFT,
    label: "WhatsApp Draft",
    shortLabel: "WhatsApp",
    icon: "💬",
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

  const hasGPT = Boolean(latestAnalysis);
  const isRunning = runningType === activeModule;

  const riskStyle = useMemo(() => getRiskStyle(risk), [risk]);

  const loadAIAnalysis = async (moduleType = activeModule) => {
    if (!studentId) return;

    setLoadingAnalysis(true);
    setError("");

    try {
      const [latest, history] = await Promise.all([
        getLatestStudentAIAnalysis(studentId, moduleType),
        getStudentAIAnalysisHistory(studentId, moduleType),
      ]);

      setLatestAnalysis(latest);
      setAnalysisHistory(history || []);
    } catch (err) {
      setError(err.message || "Failed to load AI analysis.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    setLatestAnalysis(null);
    setAnalysisHistory([]);
    setError("");

    if (studentId) {
      loadAIAnalysis(activeModule);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, activeModule]);

  const handleRunAnalysis = async (moduleType = activeModule) => {
    if (!studentId) {
      setError("Student ID missing. Cannot run AI analysis.");
      return;
    }

    setRunningType(moduleType);
    setError("");

    try {
      const result = await runStudentAIAnalysis({
        student,
        analysisType: moduleType,
      });

      if (moduleType === activeModule) {
        setLatestAnalysis({
          ...result.saved,
          parsed: result.parsed,
        });
      }

      await loadAIAnalysis(moduleType);
    } catch (err) {
      setError(err.message || "AI analysis failed.");
    } finally {
      setRunningType("");
    }
  };

  const handleModuleChange = (moduleType) => {
    if (runningType || loadingAnalysis) return;
    setActiveModule(moduleType);
  };

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
        <div className="flex flex-col gap-4 border-b border-orange-200 bg-[#102f5c] p-6 text-white lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
              Real GPT Counselor Intelligence
            </p>

            <h2 className="mt-3 text-2xl font-black text-white">
              Multi-Module AI Operating System
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Run separate OpenAI modules for analysis, risk, university
              recommendations, counselor copilot, email drafts, and WhatsApp
              drafts. Each module saves its own history.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadAIAnalysis(activeModule)}
              disabled={loadingAnalysis || Boolean(runningType)}
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-black text-[#10233f] transition hover:border-orange-300 hover:bg-white/15 hover:text-[#10233f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingAnalysis ? "Loading..." : "Reload"}
            </button>

            <button
              type="button"
              onClick={() => handleRunAnalysis(activeModule)}
              disabled={Boolean(runningType) || loadingAnalysis}
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-black text-[#10233f] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRunning
                ? "Analyzing..."
                : hasGPT
                ? `Re-run ${selectedModule.shortLabel}`
                : `Run ${selectedModule.shortLabel}`}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {AI_MODULES.map((module) => {
          const isActive = module.id === activeModule;
          const isModuleRunning = runningType === module.id;

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => handleModuleChange(module.id)}
              disabled={Boolean(runningType) || loadingAnalysis}
              className={`rounded-[1.5rem] border-2 p-4 text-left shadow-[0_5px_16px_rgba(15,35,63,0.035)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "border-orange-500 bg-orange-500 text-[#10233f] shadow-[0_8px_18px_rgba(249,115,22,0.16)]"
                  : "border-slate-300 bg-white hover:border-orange-300 hover:bg-orange-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg">{module.icon}</p>
                  <h3
                    className={`mt-2 text-sm font-black ${
                      isActive ? "text-[#10233f]" : "text-[#10233f]"
                    }`}
                  >
                    {module.label}
                  </h3>
                </div>

                {isModuleRunning ? (
                  <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700">
                    Running
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                {module.description}
              </p>
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-[1.5rem] border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!hasGPT && !loadingAnalysis ? (
        <div className="rounded-[1.75rem] border border-amber-300 bg-amber-50 p-5">
          <p className="font-bold text-amber-800">
            No {selectedModule.label.toLowerCase()} saved yet.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Run this module to generate real OpenAI output for {studentName}.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Readiness Score" value={readinessScore} />
        <StatCard label="Risk Level" value={risk} />
        <StatCard label="Risk Score" value={riskScore || "—"} />
        <StatCard label="AI Runs" value={analysisHistory.length} />
      </div>

      <InsightBlock title={`${selectedModule.label} Summary`} content={summary} />

      <div className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6">
        <div
          className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${riskStyle}`}
        >
          Risk Level: {risk}
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
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

      <div className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6">
        <h3 className="font-bold text-[#10233f]">AI Metadata</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetaCard label="Last Analysis" value={analyzedAt} />
          <MetaCard label="Stored Intelligence" value={hasGPT ? "Yes" : "No"} />
          <MetaCard label="Analysis Type" value={activeModule} />
        </div>
      </div>

      <div className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-[#10233f]">Module History</h3>
            <p className="mt-1 text-sm text-slate-600">
              Every run creates a new saved row for this module.
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
                className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 shadow-[0_4px_14px_rgba(15,35,63,0.025)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-[#10233f]">
                    {item?.parsed?.riskLevel ||
                      item?.risk_level ||
                      selectedModule.label}
                  </p>

                  <p className="text-xs text-slate-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Unknown date"}
                  </p>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {item?.parsed?.summary ||
                    item?.analysis ||
                    "Saved AI analysis"}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-600">
              No history for this module yet.
            </p>
          )}
        </div>
      </div>
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
          className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6"
        >
          <div
            className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${getRiskStyle(
              risk?.level
            )}`}
          >
            {title}: {risk?.level || "Not analyzed"}
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
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
    <div className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6">
      <h3 className="font-bold text-[#10233f]">{title}</h3>

      <div className="mt-4 space-y-3">
        {safeItems.length ? (
          safeItems.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 shadow-[0_4px_14px_rgba(15,35,63,0.025)]"
            >
              <p className="font-bold text-[#10233f]">
                {item?.university || item?.name || `Option ${index + 1}`}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                {item?.country || "Country not specified"}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
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
                  <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
                    {item.requiredNextStep}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-500">
            No recommendations generated yet.
          </p>
        )}
      </div>
    </div>
  );
}

function InsightBlock({ title, content }) {
  return (
    <div className="rounded-[1.75rem] border-2 border-slate-300 bg-white p-6">
      <h3 className="font-bold text-[#10233f]">{title}</h3>

      <p className="mt-3 whitespace-pre-wrap text-slate-700 leading-7">
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
          : "rounded-[1.75rem] border-2 border-slate-300 bg-white p-6"
      }
    >
      <h3 className="font-bold text-[#10233f]">{title}</h3>

      <div className="mt-4 space-y-3">
        {safeItems.length > 0 ? (
          safeItems.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 text-sm leading-6 text-slate-700"
            >
              {formatListItem(item)}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 text-sm text-slate-500">
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
    <div className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4 shadow-[0_4px_14px_rgba(15,35,63,0.025)]">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.03)]"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
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

  return "text-slate-700 border-slate-300 bg-slate-50";
}

export default GPTIntelligencePanel;