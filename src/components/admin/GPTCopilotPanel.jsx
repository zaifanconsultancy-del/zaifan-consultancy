// GPTCopilotPanel V2 — High Contrast Admin OS Edition
// Preserves all GPT generation logic, OpenAI credit confirmation, CRM context,
// mode selection, session history, saved outputs, and copy actions.
// Visual system rebuilt to match the approved Zaifan Admin OS design language:
// cream canvas, white cards, navy text, orange accents, and deliberate dark surfaces only.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  Zap,
} from "lucide-react";
import { generateGptCopilotText } from "../../services/gptCopilotService";

function GPTCopilotPanel({
  student = null,
  studentType = "inquiry",
  adminProfile = null,
  aiLead = null,
  crmContext = {},
}) {
  const [activeMode, setActiveMode] = useState("summary");
  const [output, setOutput] = useState("");
  const [lastMode, setLastMode] = useState("");
  const [lastGeneratedAt, setLastGeneratedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedOutputs, setSavedOutputs] = useState([]);
  const [generationHistory, setGenerationHistory] = useState([]);

  if (!student) return null;

  const modes = [
    {
      id: "summary",
      label: "Smart Summary",
      icon: FileText,
      text: "Senior counselor profile analysis.",
      category: "Analysis",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      text: "Personalized WhatsApp follow-up.",
      category: "Communication",
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      text: "Professional email draft.",
      category: "Communication",
    },
    {
      id: "next_action",
      label: "Next Action",
      icon: Target,
      text: "Best counselor move.",
      category: "Strategy",
    },
    {
      id: "visa_risk",
      label: "Visa Risk",
      icon: ShieldAlert,
      text: "Visa preparation risk notes.",
      category: "Risk",
    },
    {
      id: "call_script",
      label: "Call Script",
      icon: PhoneCall,
      text: "Counselor call flow.",
      category: "Communication",
    },
    {
      id: "followup_plan",
      label: "7-Day Plan",
      icon: Brain,
      text: "Follow-up strategy.",
      category: "Strategy",
    },
    {
      id: "scholarship",
      label: "Scholarship",
      icon: GraduationCap,
      text: "Scholarship potential analysis.",
      category: "Analysis",
    },
    {
      id: "objection_analysis",
      label: "Objections",
      icon: HelpCircle,
      text: "Student objection detection.",
      category: "Risk",
    },
    {
      id: "counselor_strategy",
      label: "Strategy",
      icon: TrendingUp,
      text: "Senior counselor strategy.",
      category: "Strategy",
    },
  ];

  const active = modes.find((mode) => mode.id === activeMode) || modes[0];

  const name = student.full_name || student.name || "Unnamed Student";
  const email = student.email || "No email";
  const phone = student.phone || student.phone_number || student.whatsapp || "No phone";
  const country =
    student.country || student.country_interest || student.preferred_country || "Not selected";
  const program =
    student.field_of_interest ||
    student.course ||
    student.program ||
    student.study_field ||
    student.consultation_type ||
    "Not selected";
  const status =
    student.status || student.appointment_stage || student.pipeline_stage || "Not selected";
  const priority = student.priority || "Not selected";

  const enrichedContext = useMemo(() => {
    return {
      ...crmContext,
      leadScore: crmContext?.leadScore ?? aiLead?.ai_score ?? null,
      leadHealth: crmContext?.leadHealth ?? aiLead?.ai_tier?.label ?? null,
      overdueStatus:
        crmContext?.overdueStatus ?? aiLead?.ai_urgency?.label ?? null,
      extraContext: {
        ...(crmContext?.extraContext || {}),
        ai_score: aiLead?.ai_score,
        ai_tier: aiLead?.ai_tier?.label,
        ai_urgency: aiLead?.ai_urgency?.label,
        ai_conversion_probability: aiLead?.ai_conversion_probability,
        ai_recommended_action: aiLead?.ai_recommended_action,
      },
    };
  }, [crmContext, aiLead]);

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
    ["Lead Score", enrichedContext.leadScore ? `${enrichedContext.leadScore}/100` : "Not available"],
    ["Lead Health", enrichedContext.leadHealth || "Not available"],
    ["Urgency", enrichedContext.overdueStatus || "Not available"],
    ["Conversion", aiLead?.ai_conversion_probability || "Not available"],
    ["Recommended Action", aiLead?.ai_recommended_action || "Not available"],
  ];

  const usageCards = [
    {
      label: "GPT Modes",
      value: modes.length,
      icon: Brain,
      tone: "gold",
    },
    {
      label: "Last Mode",
      value: lastMode || "None",
      icon: Sparkles,
      tone: "blue",
    },
    {
      label: "Student Type",
      value: studentType,
      icon: Target,
      tone: "green",
    },
    {
      label: "Credit Mode",
      value: "Manual",
      icon: ShieldAlert,
      tone: "orange",
    },
  ];

  const generate = async (modeId = activeMode) => {
    const selectedMode = modes.find((mode) => mode.id === modeId) || active;

    const confirmed = window.confirm(
      `This will use OpenAI API credits. Generate ${selectedMode.label} now?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setCopied(false);
      setActiveMode(modeId);

      const text = await generateGptCopilotText({
        mode: modeId,
        student,
        studentType,
        adminName:
          adminProfile?.full_name ||
          adminProfile?.name ||
          "Zaifan Consultancy Team",
        ...enrichedContext,
      });

      const generatedAt = new Date().toLocaleString();

      setOutput(text);
      setLastMode(modeId);
      setLastGeneratedAt(generatedAt);
      setGenerationHistory((prev) => [
        {
          id: `${modeId}-${Date.now()}`,
          mode: modeId,
          label: selectedMode.label,
          category: selectedMode.category,
          generatedAt,
          preview: text.slice(0, 180),
        },
        ...prev,
      ]);
    } catch (error) {
      console.error(error);
      alert(error.message || "GPT generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyOutput = async () => {
    if (!output) return;

    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const saveOutput = () => {
    if (!output) return;

    const savedAt = new Date().toLocaleString();

    setSavedOutputs((prev) => [
      {
        id: `saved-${Date.now()}`,
        mode: lastMode || activeMode,
        label:
          modes.find((mode) => mode.id === (lastMode || activeMode))?.label ||
          active.label,
        savedAt,
        output,
      },
      ...prev,
    ]);
  };

  const copySavedOutput = async (savedOutput) => {
    await navigator.clipboard.writeText(savedOutput.output);
    alert("Saved output copied.");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 text-[#10233f]"
    >
      <div className="relative overflow-hidden rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_38%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/45 bg-orange-500/15 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-orange-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-300">
                Real GPT Copilot
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              Smart Counselor Generator
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-200">
              Generate GPT counselor summaries, WhatsApp messages, emails, risk notes, call scripts, scholarship analysis, objection handling, and senior counselor strategy.
            </p>

            <div className="mt-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-orange-400/35 bg-white/10 p-4 backdrop-blur-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
              <p className="text-sm leading-6 text-slate-100">
                Credit-safe mode active. GPT only uses OpenAI credits when you press Generate and confirm. No automatic background GPT calls are made here.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => generate(activeMode)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.24)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {loading ? "Thinking..." : `Generate ${active.label}`}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {usageCards.map((card) => (
          <UsageCard key={card.label} card={card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ContextPanel
          title="Student Context Sent to GPT"
          eyebrow="Profile Context"
          rows={contextRows}
        />
        <ContextPanel
          title="Prompt Preview"
          eyebrow="Generation Context"
          rows={promptPreviewRows}
          highlighted
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
              disabled={loading}
              className={`rounded-[1.5rem] border p-4 text-left transition ${
                isActive
                  ? "border-[#F97316]/45 bg-[#F97316]/10 text-orange-300"
                  : "border-white/10 bg-white/[0.035] text-slate-600 hover:border-[#F97316]/25 hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-5 w-5" />
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${isActive ? "bg-white/15 text-white" : "border border-slate-300 bg-[#fffaf2] text-slate-500"}`}>
                  {mode.category}
                </span>
              </div>
              <h3 className="mt-3 font-black">{mode.label}</h3>
              <p className="mt-1 text-xs opacity-60">{mode.text}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.8rem] border border-slate-300 bg-white p-5 shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-orange-700">
              GPT Output
            </p>
            <h3 className="mt-1 text-xl font-black text-[#10233f]">
              {active.label}
            </h3>

            {lastGeneratedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                Last generated: {lastGeneratedAt} • Mode: {lastMode}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveOutput}
              disabled={!output}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              Save Output
            </button>

            <button
              type="button"
              onClick={copyOutput}
              disabled={!output}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-5 py-2.5 text-xs font-bold text-orange-300 transition hover:bg-[#F97316]/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Clipboard className="h-4 w-4" />
              {copied ? "Copied" : "Copy Output"}
            </button>
          </div>
        </div>

        <div className="min-h-[260px] rounded-[1.5rem] border border-slate-300 bg-[#fffaf2] p-5">
          {loading ? (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
              <p className="mt-4 text-sm text-slate-600">
                GPT is analyzing this student profile...
              </p>
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-700">
              {output}
            </pre>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <Brain className="h-12 w-12 text-orange-600" />
              <h3 className="mt-4 text-lg font-black text-[#10233f]">
                Ready for real AI generation
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Choose a mode above. GPT will not run until you press Generate and confirm credit usage.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <HistoryPanel history={generationHistory} />
        <SavedOutputsPanel savedOutputs={savedOutputs} onCopy={copySavedOutput} />
      </div>
    </motion.section>
  );
}

function UsageCard({ card }) {
  const Icon = card.icon;

  const toneClass =
    card.tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : card.tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : card.tone === "orange"
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-[#F97316]/20 bg-[#F97316]/10 text-orange-300";

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
          {card.label}
        </p>
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 truncate text-2xl font-black text-[#10233f]">
        {card.value}
      </p>
    </div>
  );
}

function ContextPanel({ title, eyebrow, rows = [], highlighted = false }) {
  return (
    <div
      className={`rounded-[2rem] border p-5 ${
        highlighted
          ? "border-orange-300 bg-[#fff8ee]"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`rounded-2xl border p-3 ${
            highlighted
              ? "border-orange-200 bg-orange-50"
              : "border-slate-300 bg-[#fffaf2]"
          }`}
        >
          {highlighted ? (
            <Zap className="h-5 w-5 text-orange-700" />
          ) : (
            <FileText className="h-5 w-5 text-[#10233f]" />
          )}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            {eyebrow}
          </p>
          <h3 className="text-lg font-black text-[#10233f]">{title}</h3>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border border-slate-300 bg-white px-3 py-2"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              {label}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-[#10233f]">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ history = [] }) {
  return (
    <div className="rounded-[1.8rem] border border-slate-300 bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Session Memory
          </p>
          <h3 className="text-lg font-black text-[#10233f]">Generation History</h3>
        </div>
        <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1 text-xs font-black text-slate-600">
          {history.length}
        </span>
      </div>

      {history.length ? (
        <div className="space-y-3">
          {history.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#10233f]">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.generatedAt} • {item.category}
                  </p>
                </div>
                <span className="rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-300">
                  GPT
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
                {item.preview}
              </p>
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
    <div className="rounded-[1.8rem] border border-slate-300 bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Counselor Drafts
          </p>
          <h3 className="text-lg font-black text-[#10233f]">Saved Outputs</h3>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {savedOutputs.length}
        </span>
      </div>

      {savedOutputs.length ? (
        <div className="space-y-3">
          {savedOutputs.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#10233f]">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-500">Saved: {item.savedAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-3 py-1 text-[10px] font-bold text-orange-300 transition hover:bg-[#F97316]/15"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
              <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">
                {item.output}
              </p>
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
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#fffaf2] p-5 text-center">
      <CheckCircle2 className="h-10 w-10 text-orange-300" />
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

export default GPTCopilotPanel;
