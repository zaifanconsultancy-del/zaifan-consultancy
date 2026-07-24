// GPTCopilotPanel V4 MAXIMUM — Paid GPT Counselor Copilot
// src/components/admin/GPTCopilotPanel.jsx

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  GraduationCap,
  HelpCircle,
  Mail,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateGptCopilotText } from "../../services/gptCopilotService";

const GENERATION_TIMEOUT_MS = 45000;
const MAX_HISTORY = 12;
const MAX_SAVED_OUTPUTS = 12;

const MODES = [
  { id: "summary", label: "Smart Summary", icon: FileText, text: "Senior counselor profile analysis.", category: "Analysis" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, text: "Personalized WhatsApp follow-up.", category: "Communication" },
  { id: "email", label: "Email", icon: Mail, text: "Professional email draft.", category: "Communication" },
  { id: "next_action", label: "Next Action", icon: Target, text: "Best counselor move.", category: "Strategy" },
  { id: "visa_risk", label: "Visa Risk", icon: ShieldAlert, text: "Visa preparation risk notes.", category: "Risk" },
  { id: "call_script", label: "Call Script", icon: PhoneCall, text: "Counselor call flow.", category: "Communication" },
  { id: "followup_plan", label: "7-Day Plan", icon: Brain, text: "Follow-up strategy.", category: "Strategy" },
  { id: "scholarship", label: "Scholarship", icon: GraduationCap, text: "Scholarship potential analysis.", category: "Analysis" },
  { id: "objection_analysis", label: "Objections", icon: HelpCircle, text: "Student objection detection.", category: "Risk" },
  { id: "counselor_strategy", label: "Strategy", icon: TrendingUp, text: "Senior counselor strategy.", category: "Strategy" },
];

function safeString(value, fallback = "") {
  return value === null || value === undefined ? fallback : String(value);
}

function valueOrFallback(value, fallback = "Not available") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function formatPercentLike(value) {
  if (value === null || value === undefined || value === "") return "Not available";
  if (typeof value === "number") return value <= 1 ? `${Math.round(value * 100)}%` : `${Math.round(value)}%`;

  const raw = String(value).trim();
  if (!raw) return "Not available";
  if (raw.includes("%")) return raw;

  const parsed = Number(raw);
  return Number.isFinite(parsed)
    ? parsed <= 1
      ? `${Math.round(parsed * 100)}%`
      : `${Math.round(parsed)}%`
    : raw;
}

function getErrorMessage(error, fallback = "GPT generation failed.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || error.details || error.hint || fallback;
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function GPTCopilotPanel({
  student = null,
  studentType = "inquiry",
  adminProfile = null,
  aiLead = null,
  crmContext = {},
}) {
  const reduceMotion = useReducedMotion();

  const [activeMode, setActiveMode] = useState("summary");
  const [output, setOutput] = useState("");
  const [lastMode, setLastMode] = useState("");
  const [lastGeneratedAt, setLastGeneratedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState([]);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [generationError, setGenerationError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingMode, setPendingMode] = useState("");
  const [showContext, setShowContext] = useState(true);

  const mountedRef = useRef(true);
  const generationTokenRef = useRef(0);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const studentIdentity = useMemo(
    () =>
      student
        ? `${studentType}:${student.id || student.student_id || student.email || student.phone || "unknown"}`
        : "",
    [student, studentType]
  );

  useEffect(() => {
    generationTokenRef.current += 1;
    setPendingMode("");
    setGenerationError("");
    setStatusMessage("");
    setOutput("");
    setLastMode("");
    setLastGeneratedAt("");
    setCopied(false);
    setSavedOutputs([]);
    setGenerationHistory([]);
  }, [studentIdentity]);

  if (!student) return null;

  const active = MODES.find((mode) => mode.id === activeMode) || MODES[0];

  const name = student.full_name || student.name || "Unnamed Student";
  const email = student.email || "No email";
  const phone = student.phone || student.phone_number || student.whatsapp || "No phone";
  const country = student.country || student.country_interest || student.preferred_country || "Not selected";
  const program =
    student.field_of_interest ||
    student.course ||
    student.program ||
    student.study_field ||
    student.consultation_type ||
    "Not selected";
  const status = student.status || student.appointment_stage || student.pipeline_stage || "Not selected";
  const priority = student.priority || "Not selected";

  const enrichedContext = useMemo(
    () => ({
      ...crmContext,
      leadScore: crmContext?.leadScore ?? aiLead?.ai_score ?? null,
      leadHealth: crmContext?.leadHealth ?? aiLead?.ai_tier?.label ?? null,
      overdueStatus: crmContext?.overdueStatus ?? aiLead?.ai_urgency?.label ?? null,
      extraContext: {
        ...(crmContext?.extraContext || {}),
        ai_score: aiLead?.ai_score,
        ai_tier: aiLead?.ai_tier?.label,
        ai_urgency: aiLead?.ai_urgency?.label,
        ai_conversion_probability: aiLead?.ai_conversion_probability,
        ai_recommended_action: aiLead?.ai_recommended_action,
      },
    }),
    [crmContext, aiLead]
  );

  const contextRows = [
    ["Student", name],
    ["Type", studentType],
    ["Country", country],
    ["Program", program],
    ["Status", status],
    ["Priority", priority],
    ["Email", email],
    ["Phone", phone],
  ];

  const promptPreviewRows = [
    ["Selected GPT Mode", active.label],
    ["Mode Category", active.category],
    [
      "Lead Score",
      enrichedContext.leadScore === null || enrichedContext.leadScore === undefined
        ? "Not available"
        : `${enrichedContext.leadScore}/100`,
    ],
    ["Lead Health", valueOrFallback(enrichedContext.leadHealth)],
    ["Urgency", valueOrFallback(enrichedContext.overdueStatus)],
    ["Conversion", formatPercentLike(aiLead?.ai_conversion_probability)],
    ["Recommended Action", valueOrFallback(aiLead?.ai_recommended_action)],
  ];

  const selectedPendingMode = MODES.find((mode) => mode.id === pendingMode) || null;

  const requestGeneration = (modeId = activeMode) => {
    if (loading) return;
    const selectedMode = MODES.find((mode) => mode.id === modeId) || active;

    setActiveMode(selectedMode.id);
    setPendingMode(selectedMode.id);
    setGenerationError("");
    setStatusMessage("");
  };

  const cancelGenerationApproval = () => {
    if (!loading) setPendingMode("");
  };

  const generate = async (modeId = pendingMode || activeMode) => {
    if (loading) return;

    const selectedMode = MODES.find((mode) => mode.id === modeId) || active;
    const generationToken = generationTokenRef.current + 1;
    generationTokenRef.current = generationToken;

    try {
      setLoading(true);
      setCopied(false);
      setGenerationError("");
      setStatusMessage("");
      setPendingMode("");
      setActiveMode(selectedMode.id);

      const text = await withTimeout(
        Promise.resolve(
          generateGptCopilotText({
            mode: selectedMode.id,
            student,
            studentType,
            adminName:
              adminProfile?.full_name ||
              adminProfile?.name ||
              "Zaifan Consultancy Team",
            ...enrichedContext,
          })
        ),
        GENERATION_TIMEOUT_MS,
        `GPT generation timed out after ${Math.round(
          GENERATION_TIMEOUT_MS / 1000
        )} seconds. The workspace has been unlocked.`
      );

      if (!mountedRef.current || generationTokenRef.current !== generationToken) return;

      const cleanText = safeString(text).trim();
      if (!cleanText) throw new Error("GPT returned an empty response. No output was saved.");

      const generatedAt = new Date().toLocaleString();

      setOutput(cleanText);
      setLastMode(selectedMode.id);
      setLastGeneratedAt(generatedAt);
      setStatusMessage(`${selectedMode.label} generated successfully.`);
      setGenerationHistory((prev) =>
        [
          {
            id: `${selectedMode.id}-${Date.now()}`,
            mode: selectedMode.id,
            label: selectedMode.label,
            category: selectedMode.category,
            generatedAt,
            preview: cleanText.slice(0, 220),
          },
          ...prev,
        ].slice(0, MAX_HISTORY)
      );
    } catch (error) {
      console.error("GPT Copilot generation failed:", error);
      if (mountedRef.current && generationTokenRef.current === generationToken) {
        setGenerationError(getErrorMessage(error));
      }
    } finally {
      if (mountedRef.current && generationTokenRef.current === generationToken) {
        setLoading(false);
      }
    }
  };

  const copyOutput = async () => {
    if (!output) return;

    if (!(await copyText(output))) {
      setGenerationError("Output could not be copied. Select the text manually and copy it.");
      return;
    }

    setCopied(true);
    setStatusMessage("Output copied to clipboard.");
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setCopied(false);
    }, 1400);
  };

  const saveOutput = () => {
    if (!output) return;

    const modeId = lastMode || activeMode;
    const mode = MODES.find((item) => item.id === modeId) || active;
    const savedAt = new Date().toLocaleString();

    setSavedOutputs((prev) =>
      [
        {
          id: `saved-${Date.now()}`,
          mode: modeId,
          label: mode.label,
          savedAt,
          output,
        },
        ...prev,
      ].slice(0, MAX_SAVED_OUTPUTS)
    );

    setStatusMessage("Output saved to this GPT Copilot session.");
  };

  const copySavedOutput = async (savedOutput) => {
    if (!(await copyText(savedOutput?.output))) {
      setGenerationError("Saved output could not be copied.");
      return;
    }
    setStatusMessage("Saved output copied.");
  };

  const clearOutput = () => {
    if (loading) return;
    setOutput("");
    setLastMode("");
    setLastGeneratedAt("");
    setCopied(false);
    setStatusMessage("Current GPT output cleared.");
  };

  const usageCards = [
    { label: "GPT Modes", value: MODES.length, icon: Brain, tone: "orange" },
    { label: "Current Mode", value: active.label, icon: Sparkles, tone: "navy" },
    { label: "Generations", value: generationHistory.length, icon: Target, tone: "orange" },
    { label: "Saved Drafts", value: savedOutputs.length, icon: Save, tone: "default" },
  ];

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-5 text-[#10233f]"
    >
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-[#fffdf8] shadow-[0_18px_48px_rgba(15,35,63,0.08)]">
        <div className="grid xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 sm:p-6" style={{ color: "#FFFFFF" }}>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Sparkles} label="Real GPT Copilot" />
              <HeaderChip icon={ShieldCheck} label="Manual Credit Approval" />
            </div>

            <h2 className="mt-4 text-2xl font-black sm:text-3xl" style={{ color: "#FFFFFF" }}>
              Smart Counselor Generator
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6" style={{ color: "#F8FAFC" }}>
              Generate counselor summaries, WhatsApp messages, emails, call scripts,
              risk notes, scholarship analysis, objection handling, and strategy
              using the currently opened student CRM context.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Modes" value={MODES.length} />
              <DarkMetric label="History" value={generationHistory.length} />
              <DarkMetric label="Saved" value={savedOutputs.length} />
              <DarkMetric label="Timeout" value={`${Math.round(GENERATION_TIMEOUT_MS / 1000)}s`} />
            </div>
          </div>

          <div className="bg-orange-500 p-5 sm:p-6" style={{ color: "#FFFFFF" }}>
            <div className="flex items-center gap-2">
              <Wand2 size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Active Generation Mode
              </p>
            </div>

            <p className="mt-3 text-2xl font-black" style={{ color: "#FFFFFF" }}>{active.label}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em]" style={{ color: "#FFFFFF" }}>
              {active.category}
            </p>

            <p className="mt-4 text-xs font-semibold leading-5" style={{ color: "#FFF7ED" }}>
              GPT credits are used only after you explicitly approve a generation.
              This panel makes no background paid calls.
            </p>

            <button
              type="button"
              onClick={() => requestGeneration(activeMode)}
              disabled={loading}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-white text-sm font-black transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60" style={{ color: "#C2410C" }}
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {loading ? "Generating..." : `Generate ${active.label}`}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalCard
          label="Local Intelligence"
          value={valueOrFallback(enrichedContext.leadHealth, "Connected")}
          helper="Rule-based CRM context remains available without paid GPT."
          tone="navy"
        />
        <OperationalCard
          label="Lead Score"
          value={
            enrichedContext.leadScore === null || enrichedContext.leadScore === undefined
              ? "—"
              : `${enrichedContext.leadScore}/100`
          }
          helper="Current CRM intelligence signal."
          tone="orange"
        />
        <OperationalCard
          label="Paid Calls"
          value="Manual Only"
          helper="Every GPT generation requires explicit counselor approval."
          tone="cream"
        />
        <OperationalCard
          label="Session Safety"
          value="Protected"
          helper="45s timeout and stale-response protection are active."
          tone="cream"
        />
      </div>

      {selectedPendingMode ? (
        <section className="rounded-[1.5rem] border-[3px] border-orange-300 bg-orange-50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} className="mt-0.5 shrink-0 text-orange-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                  Paid GPT Approval
                </p>
                <h3 className="mt-1 text-lg font-black text-[#10233f]">
                  Generate {selectedPendingMode.label}?
                </h3>
                <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                  This calls the configured GPT service and may use paid API credits.
                  CRM context for <strong>{name}</strong> will be included according
                  to your existing service implementation.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void generate(selectedPendingMode.id)}
                disabled={loading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-orange-700 bg-orange-500 px-4 text-xs font-black hover:bg-orange-600 disabled:opacity-50" style={{ color: "#FFFFFF" }}
              >
                <CheckCircle2 size={14} />
                Approve & Generate
              </button>

              <button
                type="button"
                onClick={cancelGenerationApproval}
                disabled={loading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-[#10233f] disabled:opacity-50"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {generationError ? (
        <FeedbackBanner tone="error" message={generationError} onClose={() => setGenerationError("")} />
      ) : null}

      {statusMessage ? (
        <FeedbackBanner tone="success" message={statusMessage} onClose={() => setStatusMessage("")} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {usageCards.map((card) => <UsageCard key={card.label} card={card} />)}
      </div>

      <section className="rounded-[1.6rem] border-[3px] border-slate-300 bg-[#fffdf8] p-4 shadow-[0_10px_28px_rgba(15,35,63,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
              Generation Mode
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Choose what GPT should help with
            </h3>
          </div>

          <span className="rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-orange-800">
            {active.category}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  if (loading) return;
                  setActiveMode(mode.id);
                  setPendingMode("");
                  setGenerationError("");
                }}
                disabled={loading}
                className={`rounded-[1.3rem] border-[3px] p-4 text-left transition hover:-translate-y-0.5 disabled:opacity-60 ${
                  isActive
                    ? "border-orange-400 bg-orange-50"
                    : "border-slate-300 bg-white hover:border-orange-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${
                    isActive
                      ? "border-orange-300 bg-white text-orange-700"
                      : "border-slate-300 bg-slate-50 text-[#10233f]"
                  }`}>
                    <Icon size={17} />
                  </div>

                  <span className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] ${
                    isActive
                      ? "border-orange-300 bg-white text-orange-800"
                      : "border-slate-300 bg-slate-50 text-slate-600"
                  }`}>
                    {mode.category}
                  </span>
                </div>

                <h4 className="mt-3 font-black" style={{ color: "#10233F" }}>{mode.label}</h4>
                <p className="mt-1 text-xs font-semibold leading-5" style={{ color: "#64748B" }}>{mode.text}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_10px_28px_rgba(15,35,63,0.05)] sm:p-5">
        <button
          type="button"
          onClick={() => setShowContext((current) => !current)}
          className="flex w-full items-center justify-between gap-4 text-left"
          aria-expanded={showContext}
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
              GPT Input Visibility
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Student & Prompt Context
            </h3>
          </div>

          <span className="rounded-xl border-2 border-slate-300 bg-[#fffdf8] px-3 py-2 text-xs font-black text-[#10233f]">
            {showContext ? "Hide Context" : "Show Context"}
          </span>
        </button>

        {showContext ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <ContextPanel title="Student Context Sent to GPT" eyebrow="Profile Context" rows={contextRows} />
            <ContextPanel title="Prompt Preview" eyebrow="Generation Context" rows={promptPreviewRows} highlighted />
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-orange-300 bg-white p-5 shadow-[0_12px_32px_rgba(15,35,63,0.055)]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
              GPT Output
            </p>
            <h3 className="mt-1 text-xl font-black text-[#10233f]">
              {lastMode ? MODES.find((mode) => mode.id === lastMode)?.label || active.label : active.label}
            </h3>
            {lastGeneratedAt ? (
              <p className="mt-1 text-xs font-semibold text-slate-500">Generated {lastGeneratedAt}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveOutput}
              disabled={!output || loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 text-xs font-black text-orange-800 hover:border-orange-500 hover:bg-orange-100 disabled:opacity-40"
            >
              <Save size={14} />
              Save Session Draft
            </button>

            <button
              type="button"
              onClick={() => void copyOutput()}
              disabled={!output || loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-[#10233f] hover:border-orange-300 hover:bg-orange-50 disabled:opacity-40"
            >
              <Clipboard size={14} />
              {copied ? "Copied" : "Copy Output"}
            </button>

            <button
              type="button"
              onClick={clearOutput}
              disabled={!output || loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
            >
              <X size={14} />
              Clear
            </button>
          </div>
        </div>

        <div className="min-h-[280px] rounded-[1.4rem] border-[3px] border-slate-300 bg-[#fffdf8] p-5">
          {loading ? (
            <div className="flex min-h-[235px] flex-col items-center justify-center text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-600" />
              <p className="mt-4 font-black text-[#10233f]">GPT is generating {active.label}...</p>
              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                The request will time out safely after {Math.round(GENERATION_TIMEOUT_MS / 1000)} seconds.
              </p>
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm font-medium leading-7 text-slate-700">
              {output}
            </pre>
          ) : (
            <div className="flex min-h-[235px] flex-col items-center justify-center text-center">
              <Brain className="h-12 w-12 text-orange-600" />
              <h3 className="mt-4 text-lg font-black text-[#10233f]">
                Ready for counselor-assisted GPT generation
              </h3>
              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                Choose a mode, review CRM context, then explicitly approve paid GPT generation.
              </p>
            </div>
          )}
        </div>

        {output && !loading ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.07em] text-slate-500">
            <span>{output.length.toLocaleString()} characters</span>
            <button
              type="button"
              onClick={() => requestGeneration(lastMode || activeMode)}
              className="inline-flex items-center gap-1.5 text-orange-700"
            >
              <RefreshCw size={12} />
              Regenerate with approval
            </button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <HistoryPanel history={generationHistory} />
        <SavedOutputsPanel savedOutputs={savedOutputs} onCopy={copySavedOutput} />
      </div>

      <div className="rounded-[1.3rem] border-[3px] border-slate-300 bg-white p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-orange-700" />
          <div>
            <p className="font-black text-[#10233f]">GPT operating policy</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              GPT output is counselor assistance, not an automatic CRM decision.
              Review visa, scholarship, admissions, and compliance-sensitive claims
              before sending them to a student. Saved drafts here are session-local
              only and are not persisted to Supabase.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/30 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em]"
      style={{ color: "#FFFFFF" }}
    >
      <Icon size={11} style={{ color: "#FDBA74" }} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div
      className="rounded-xl border-2 border-white/35 bg-white/10 p-3"
      style={{ color: "#FFFFFF" }}
    >
      <p
        className="text-[8px] font-black uppercase tracking-[0.08em]"
        style={{ color: "#F8FAFC" }}
      >
        {label}
      </p>

      <p
        className="mt-1 break-words text-lg font-black"
        style={{ color: "#FFFFFF" }}
      >
        {value}
      </p>
    </div>
  );
}

function FeedbackBanner({ tone, message, onClose }) {
  const error = tone === "error";

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[1.3rem] border-[3px] p-4 ${
        error
          ? "border-red-300 bg-red-50 text-red-900"
          : "border-orange-300 bg-orange-50 text-orange-900"
      }`}
    >
      {error ? <AlertTriangle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
      <p className="min-w-0 flex-1 text-sm font-bold leading-6">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss message"><X size={15} /></button>
    </div>
  );
}

function UsageCard({ card }) {
  const Icon = card.icon;
  const isNavy = card.tone === "navy";
  const isOrange = card.tone === "orange";

  const toneClass = isNavy
    ? "border-[#123865] bg-[#123865]"
    : isOrange
    ? "border-orange-300 bg-orange-50"
    : "border-slate-300 bg-white";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass}`}
      style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-[9px] font-black uppercase tracking-[0.1em]"
          style={{ color: isNavy ? "#F8FAFC" : "#475569" }}
        >
          {card.label}
        </p>

        <Icon
          className="h-5 w-5"
          style={{ color: isNavy ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-3 truncate text-xl font-black"
        style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
      >
        {card.value}
      </p>
    </div>
  );
}

function OperationalCard({ label, value, helper, tone = "cream" }) {
  const isNavy = tone === "navy";
  const isOrange = tone === "orange";

  const surface = isNavy
    ? "border-[#123865] bg-[#123865]"
    : isOrange
    ? "border-orange-300 bg-orange-50"
    : "border-slate-300 bg-white";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_20px_rgba(15,35,63,0.04)] ${surface}`}
      style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
    >
      <p
        className="text-[9px] font-black uppercase tracking-[0.1em]"
        style={{ color: isNavy ? "#F8FAFC" : isOrange ? "#C2410C" : "#64748B" }}
      >
        {label}
      </p>

      <p
        className="mt-2 text-xl font-black"
        style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
      >
        {value}
      </p>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: isNavy ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function ContextPanel({ title, eyebrow, rows = [], highlighted = false }) {
  return (
    <div className={`rounded-[1.4rem] border-[3px] p-4 ${
      highlighted ? "border-orange-300 bg-orange-50" : "border-slate-300 bg-[#fffdf8]"
    }`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-orange-700">
          {highlighted ? <Zap size={17} /> : <FileText size={17} />}
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">{eyebrow}</p>
          <h3 className="text-base font-black text-[#10233f]">{title}</h3>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-xl border-2 border-slate-300 bg-white px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
            <p className="mt-1 truncate text-xs font-black text-[#10233f]" title={safeString(value)}>
              {valueOrFallback(value, "-")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ history = [] }) {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">Session Memory</p>
          <h3 className="text-lg font-black text-[#10233f]">Generation History</h3>
        </div>
        <span className="rounded-full border-2 border-slate-300 bg-[#fffdf8] px-3 py-1 text-xs font-black text-slate-600">{history.length}</span>
      </div>

      {history.length ? (
        <div className="space-y-3">
          {history.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-xl border-2 border-slate-300 bg-[#fffdf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#10233f]">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{item.generatedAt} • {item.category}</p>
                </div>
                <span className="rounded-full border-2 border-orange-300 bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-orange-800">GPT</span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{item.preview}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel text="No GPT generations yet in this session." />
      )}
    </div>
  );
}

function SavedOutputsPanel({ savedOutputs = [], onCopy = () => {} }) {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">Counselor Drafts</p>
          <h3 className="text-lg font-black text-[#10233f]">Saved Session Outputs</h3>
        </div>
        <span className="rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1 text-xs font-black text-orange-800">{savedOutputs.length}</span>
      </div>

      {savedOutputs.length ? (
        <div className="space-y-3">
          {savedOutputs.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-xl border-2 border-slate-300 bg-[#fffdf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#10233f]">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Saved: {item.savedAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onCopy(item)}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3 py-1.5 text-[10px] font-black text-[#10233f] transition hover:border-orange-300 hover:bg-orange-50"
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
              <p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-slate-600">{item.output}</p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel text="Save useful GPT outputs here during this session." />
      )}
    </div>
  );
}

function EmptyPanel({ text }) {
  return (
    <div className="flex min-h-[170px] flex-col items-center justify-center rounded-xl border-[3px] border-dashed border-slate-300 bg-[#fffdf8] p-5 text-center">
      <CheckCircle2 className="h-9 w-9 text-orange-600" />
      <p className="mt-3 text-sm font-semibold text-slate-500">{text}</p>
    </div>
  );
}

export default GPTCopilotPanel;
