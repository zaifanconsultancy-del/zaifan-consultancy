import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Clipboard,
  FileText,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  Target,
  Wand2,
  GraduationCap,
  HelpCircle,
  TrendingUp,
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

  if (!student) return null;

  const modes = [
    {
      id: "summary",
      label: "Smart Summary",
      icon: FileText,
      text: "Senior counselor profile analysis.",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      text: "Personalized WhatsApp follow-up.",
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      text: "Professional email draft.",
    },
    {
      id: "next_action",
      label: "Next Action",
      icon: Target,
      text: "Best counselor move.",
    },
    {
      id: "visa_risk",
      label: "Visa Risk",
      icon: ShieldAlert,
      text: "Visa preparation risk notes.",
    },
    {
      id: "call_script",
      label: "Call Script",
      icon: PhoneCall,
      text: "Counselor call flow.",
    },
    {
      id: "followup_plan",
      label: "7-Day Plan",
      icon: Brain,
      text: "Follow-up strategy.",
    },
    {
      id: "scholarship",
      label: "Scholarship",
      icon: GraduationCap,
      text: "Scholarship potential analysis.",
    },
    {
      id: "objection_analysis",
      label: "Objections",
      icon: HelpCircle,
      text: "Student objection detection.",
    },
    {
      id: "counselor_strategy",
      label: "Strategy",
      icon: TrendingUp,
      text: "Senior counselor strategy.",
    },
  ];

  const active = modes.find((mode) => mode.id === activeMode) || modes[0];

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

  const generate = async (modeId = activeMode) => {
    const confirmed = window.confirm(
      "This will use OpenAI API credits. Generate now?"
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

      setOutput(text);
      setLastMode(modeId);
      setLastGeneratedAt(new Date().toLocaleString());
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/15 via-white/[0.035] to-black/40 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_38%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Real GPT Copilot
              </p>
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              Smart Counselor Generator
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              Generate GPT counselor summaries, WhatsApp messages, emails, risk
              notes, call scripts, scholarship analysis, and strategy plans.
            </p>

            <div className="mt-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <p className="text-sm leading-6 text-yellow-100/75">
                Credit-safe mode active. GPT only uses OpenAI credits when you
                press Generate and confirm.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => generate(activeMode)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wand2 className="h-4 w-4" />
            {loading ? "Thinking..." : `Generate ${active.label}`}
          </button>
        </div>
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
                  ? "border-[#D4AF37]/45 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "border-white/10 bg-white/[0.035] text-white/60 hover:border-[#D4AF37]/25 hover:text-white"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Icon className="h-5 w-5" />
              <h3 className="mt-3 font-black">{mode.label}</h3>
              <p className="mt-1 text-xs opacity-60">{mode.text}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">
              GPT Output
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              {active.label}
            </h3>

            {lastGeneratedAt ? (
              <p className="mt-1 text-xs text-white/35">
                Last generated: {lastGeneratedAt} • Mode: {lastMode}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={copyOutput}
            disabled={!output}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-2.5 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Clipboard className="h-4 w-4" />
            {copied ? "Copied" : "Copy Output"}
          </button>
        </div>

        <div className="min-h-[260px] rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
          {loading ? (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
              <p className="mt-4 text-sm text-white/50">
                GPT is analyzing this student profile...
              </p>
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/75">
              {output}
            </pre>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <Brain className="h-12 w-12 text-[#D4AF37]" />
              <h3 className="mt-4 text-lg font-black text-white">
                Ready for real AI generation
              </h3>
              <p className="mt-2 max-w-md text-sm text-white/45">
                Choose a mode above. GPT will not run until you press Generate
                and confirm credit usage.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default GPTCopilotPanel;