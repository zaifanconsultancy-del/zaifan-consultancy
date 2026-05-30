import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import {
  Bot,
  Clipboard,
  Copy,
  Crown,
  FileText,
  Mail,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  Flame,
  PhoneCall,
  Zap,
  Brain,
} from "lucide-react";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";

function AICounselorAssistant({
  student = null,
  studentType = "inquiry",
  adminProfile = null,
}) {
  const [activeDraft, setActiveDraft] = useState("summary");
  const [copied, setCopied] = useState("");
  const [creatingReminder, setCreatingReminder] = useState(false);

  const aiData = useMemo(
    () => buildCounselorCopilot({ student, studentType, adminProfile }),
    [student, studentType, adminProfile]
  );

  if (!student) return null;

  const tabs = [
    { id: "summary", label: "Summary", icon: FileText, content: aiData.summary },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, content: aiData.whatsapp },
    { id: "email", label: "Email", icon: Mail, content: aiData.email },
    { id: "action", label: "Next Action", icon: Target, content: aiData.nextAction },
    { id: "reminder", label: "Reminder", icon: Clock, content: aiData.reminder },
  ];

  const activeTab = tabs.find((tab) => tab.id === activeDraft) || tabs[0];

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(label);
      setTimeout(() => setCopied(""), 1400);
    } catch {
      alert("Copy failed. Please select and copy manually.");
    }
  };

  const createReminderFromAI = async () => {
    if (!student?.id) {
      alert("Student ID missing. Reminder cannot be created.");
      return;
    }

    try {
      setCreatingReminder(true);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + aiData.reminderDays);

      const { error } = await supabase.from("follow_up_reminders").insert({
        student_id: student.id,
        student_type: studentType,
        status: "pending",
        due_date: dueDate.toISOString(),
        notes: aiData.reminder,
      });

      if (error) throw error;

      alert("AI reminder created successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to create reminder.");
    } finally {
      setCreatingReminder(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="space-y-5"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/15 via-white/[0.035] to-black/40 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_38%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Bot className="h-3.5 w-3.5 text-[#D4AF37]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                AI Counselor Copilot V2
              </p>
            </div>

            <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              Student Intelligence & Follow-Up Generator
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              Lead temperature, conversion probability, urgency, best channel,
              risk profile, and ready-to-send follow-ups.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-black/30 p-5 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
              AI Score
            </p>
            <h2 className="mt-2 text-4xl font-black text-[#D4AF37]">
              {aiData.enriched.ai_score}
            </h2>
            <p className="mt-1 text-xs text-white/40">
              {aiData.enriched.ai_tier.label}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <InsightCard
          icon={Flame}
          label="Temperature"
          value={aiData.temperature.label}
          text={aiData.temperature.text}
          tone={aiData.temperature.tone}
        />
        <InsightCard
          icon={TrendingUp}
          label="Conversion"
          value={aiData.conversionProbability}
          text="Estimated probability based on CRM signals."
          tone="green"
        />
        <InsightCard
          icon={PhoneCall}
          label="Best Channel"
          value={aiData.bestChannel}
          text="Recommended counselor contact method."
          tone="blue"
        />
        <InsightCard
          icon={Zap}
          label="Urgency"
          value={aiData.urgency.label}
          text={aiData.urgency.message}
          tone={aiData.urgencyTone}
        />
        <InsightCard
          icon={Brain}
          label="AI Confidence"
          value={`${aiData.confidence}%`}
          text="Confidence based on available profile data."
          tone="gold"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InsightCard
          icon={ShieldAlert}
          label="Risk Level"
          value={aiData.risk.level}
          text={aiData.risk.reason}
          tone={aiData.risk.tone}
        />
        <InsightCard
          icon={Crown}
          label="Opportunity Score"
          value={`${aiData.opportunity.score}/100`}
          text={aiData.opportunity.reason}
          tone="gold"
        />
        <InsightCard
          icon={Target}
          label="Best Next Move"
          value={aiData.bestMove.title}
          text={aiData.bestMove.text}
          tone="green"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDraft === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDraft(tab.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_12px_40px_rgba(212,175,55,0.08)]"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-[#D4AF37]/25 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-bold">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-white/35">
              AI Output
            </p>
            <h4 className="mt-1 text-lg font-black text-white">{activeTab.label}</h4>
          </div>

          <div className="flex flex-wrap gap-2">
            <ActionButton icon={FileText} label={copied === "Summary" ? "Copied" : "Copy Summary"} onClick={() => copyText("Summary", aiData.summary)} />
            <ActionButton green icon={MessageCircle} label={copied === "WhatsApp" ? "Copied" : "Copy WhatsApp"} onClick={() => copyText("WhatsApp", aiData.whatsapp)} />
            <ActionButton blue icon={Mail} label={copied === "Email" ? "Copied" : "Copy Email"} onClick={() => copyText("Email", aiData.email)} />
            <ActionButton gold icon={Clock} label={creatingReminder ? "Creating..." : "Create Reminder"} onClick={createReminderFromAI} disabled={creatingReminder} />
            <ActionButton gold icon={copied === activeTab.label ? Clipboard : Copy} label={copied === activeTab.label ? "Copied" : "Copy Active"} onClick={() => copyText(activeTab.label, activeTab.content)} />
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4">
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/70">
            {activeTab.content}
          </pre>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[#D4AF37]/15 bg-[#D4AF37]/10 p-4 text-sm leading-relaxed text-[#f3df9b]/80">
        Template AI is active. GPT can later replace the logic without changing the UI.
      </div>
    </motion.section>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled, green, blue, gold }) {
  const tone = green
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
    : blue
    ? "border-blue-400/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15"
    : gold
    ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/15"
    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${tone}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function InsightCard({ icon: Icon, label, value, text, tone = "gold" }) {
  const toneClass = {
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    red: "border-red-400/20 bg-red-500/10 text-red-300",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    gray: "border-white/10 bg-white/[0.04] text-gray-300",
  }[tone];

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-current/20 bg-black/20 p-3">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            {label}
          </p>
          <h4 className="mt-2 text-lg font-black">{value}</h4>
          <p className="mt-1 text-xs leading-relaxed text-white/50">{text}</p>
        </div>
      </div>
    </div>
  );
}

function buildCounselorCopilot({ student, studentType, adminProfile }) {
  const normalized = normalizeStudent(student, studentType, adminProfile);
  const enriched = enrichLeadWithAi(student, studentType);
  const stageAdvice = getStageAdvice(normalized.status, normalized.isAppointment);
  const risk = getRiskProfile(normalized);
  const opportunity = getOpportunityProfile(normalized);
  const bestMove = getBestMove(normalized, stageAdvice, risk);
  const temperature = getTemperature(enriched.ai_tier.level);
  const bestChannel = getBestChannel(normalized, risk, enriched);
  const confidence = getConfidence(normalized);
  const urgencyTone =
    enriched.ai_urgency.level === "immediate" || enriched.ai_urgency.level === "high"
      ? "red"
      : enriched.ai_urgency.level === "medium"
      ? "orange"
      : "green";

  const whatsapp = buildWhatsAppDraft(normalized, stageAdvice);
  const email = buildEmailDraft(normalized, stageAdvice);
  const nextAction = buildNextAction(normalized, stageAdvice, risk, opportunity, enriched, bestChannel);
  const reminder = buildReminder(normalized, stageAdvice, enriched);
  const summary = buildSummary(normalized, risk, opportunity, bestMove, enriched, bestChannel, confidence);

  return {
    summary,
    whatsapp,
    email,
    nextAction,
    reminder,
    risk,
    opportunity,
    bestMove,
    enriched,
    temperature,
    conversionProbability: enriched.ai_conversion_probability,
    urgency: enriched.ai_urgency,
    urgencyTone,
    bestChannel,
    confidence,
    reminderDays: getReminderDays(normalized.priority, enriched.ai_urgency.level),
  };
}

function normalizeStudent(student, studentType, adminProfile) {
  const fullName = student?.full_name || student?.name || student?.student_name || "Student";
  const firstName = String(fullName).split(" ")[0] || "there";
  const country = student?.country || student?.country_interest || student?.preferred_country || "Not selected";
  const field = student?.field_of_interest || student?.course || student?.program || student?.study_field || student?.consultation_type || "Not selected";
  const status = String(student?.status || student?.appointment_stage || student?.pipeline_stage || "pending").replaceAll("_", " ").toLowerCase();
  const priority = String(student?.priority || "medium").toLowerCase();
  const adminName = adminProfile?.full_name || adminProfile?.name || "Zaifan Consultancy Team";
  const createdAt = student?.created_at ? new Date(student.created_at) : null;
  const ageDays = createdAt && !Number.isNaN(createdAt.getTime()) ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000)) : 0;

  return {
    raw: student,
    studentType,
    isAppointment: studentType === "appointment",
    fullName,
    firstName,
    country,
    field,
    status,
    priority,
    adminName,
    ageDays,
    hasPhone: Boolean(student?.phone || student?.phone_number || student?.whatsapp),
    hasEmail: Boolean(student?.email),
    hasNotes: Boolean(student?.notes || student?.message || student?.consultation_notes),
  };
}

function buildSummary(data, risk, opportunity, bestMove, enriched, bestChannel, confidence) {
  return `Student Summary

Name: ${data.fullName}
Type: ${data.isAppointment ? "Appointment" : "Inquiry"}
Country / Program: ${data.country} / ${data.field}
Status: ${capitalizeWords(data.status)}
Priority: ${capitalizeWords(data.priority)}
Lead Age: ${data.ageDays} day(s)

AI Assessment:
AI Score: ${enriched.ai_score}/100
Temperature: ${enriched.ai_tier.label}
Conversion Probability: ${enriched.ai_conversion_probability}
Urgency: ${enriched.ai_urgency.label}
Best Contact Channel: ${bestChannel}
AI Confidence: ${confidence}%

Risk Level: ${risk.level}
Opportunity Score: ${opportunity.score}/100

Recommended Best Move:
${bestMove.title}
${bestMove.text}

AI Recommended Action:
${enriched.ai_recommended_action}`;
}

function getRiskProfile(data) {
  let score = 0;
  const reasons = [];

  if (!data.hasPhone) {
    score += 25;
    reasons.push("phone number missing");
  }
  if (!data.hasEmail) {
    score += 15;
    reasons.push("email missing");
  }
  if (data.ageDays >= 7 && ["new", "pending"].some((status) => data.status.includes(status))) {
    score += 30;
    reasons.push("lead is old and still pending");
  }
  if (data.status.includes("documents") || data.status.includes("visa")) {
    score += 15;
    reasons.push("important document/visa stage needs close monitoring");
  }
  if (data.priority === "vip" || data.priority === "high") {
    score -= 10;
  }

  if (score >= 50) return { level: "High", tone: "red", reason: capitalizeWords(reasons[0] || "Needs urgent follow-up") };
  if (score >= 25) return { level: "Medium", tone: "orange", reason: capitalizeWords(reasons[0] || "Needs monitoring") };
  return { level: "Low", tone: "green", reason: "Profile looks stable with no major immediate risk." };
}

function getOpportunityProfile(data) {
  let score = 45;
  const reasons = [];

  if (data.priority === "vip") {
    score += 30;
    reasons.push("VIP lead");
  } else if (data.priority === "high") {
    score += 20;
    reasons.push("high priority lead");
  }

  if (data.hasPhone) score += 10;
  if (data.hasEmail) score += 8;

  if (
    data.status.includes("contacted") ||
    data.status.includes("confirmed") ||
    data.status.includes("applied") ||
    data.status.includes("offer") ||
    data.status.includes("visa")
  ) {
    score += 15;
    reasons.push("lead has moved beyond initial stage");
  }

  score = Math.max(0, Math.min(score, 100));

  return {
    score,
    reason: reasons[0] ? capitalizeWords(reasons[0]) : "Standard lead with growth potential.",
  };
}

function getBestMove(data, stageAdvice, risk) {
  if (risk.level === "High") return { title: "Urgent Follow-Up", text: "Call or WhatsApp immediately and update the CRM after response." };
  if (data.priority === "vip" || data.priority === "high") return { title: "Priority Contact", text: "Send WhatsApp follow-up and call within 24 hours." };
  return { title: "Continue Pipeline", text: stageAdvice.action };
}

function getTemperature(level) {
  if (level === "hot") return { label: "Hot", tone: "red", text: "High-intent lead. Handle quickly." };
  if (level === "warm") return { label: "Warm", tone: "gold", text: "Good potential. Needs nurturing." };
  if (level === "nurture") return { label: "Nurture", tone: "blue", text: "Needs guidance and follow-up." };
  return { label: "Cold", tone: "gray", text: "Low intent or insufficient signals." };
}

function getBestChannel(data, risk, enriched) {
  if (data.hasPhone && (risk.level === "High" || enriched.ai_urgency.level === "immediate")) return "Call + WhatsApp";
  if (data.hasPhone) return "WhatsApp";
  if (data.hasEmail) return "Email";
  return "Manual Review";
}

function getConfidence(data) {
  let score = 35;
  if (data.hasPhone) score += 20;
  if (data.hasEmail) score += 15;
  if (data.country !== "Not selected") score += 10;
  if (data.field !== "Not selected") score += 10;
  if (data.hasNotes) score += 10;
  return Math.max(0, Math.min(100, score));
}

function buildWhatsAppDraft(data, stageAdvice) {
  const contextLine = data.isAppointment
    ? "regarding your consultation appointment"
    : `regarding your ${data.country} study application`;

  return `Hi ${data.firstName},

This is ${data.adminName} from Zaifan Consultancy.

I am following up ${contextLine}. Your current status is: ${capitalizeWords(data.status)}.

${stageAdvice.short}

Please reply here when you are available, or send the pending details/documents so we can guide you further.

Regards,
${data.adminName}`;
}

function buildEmailDraft(data, stageAdvice) {
  const contextLine = data.isAppointment
    ? "regarding your consultation appointment"
    : `regarding your ${data.country} study application`;

  return `Subject: Follow-Up Regarding Your Zaifan Consultancy Case

Dear ${data.fullName},

I hope you are doing well.

This is ${data.adminName} from Zaifan Consultancy. I am following up ${contextLine}.

Your current status is: ${capitalizeWords(data.status)}.
Interested country/program: ${data.country} / ${data.field}.

${stageAdvice.long}

Please share your availability or send the pending information so we can move your case to the next stage.

Best regards,
${data.adminName}
Zaifan Consultancy`;
}

function buildNextAction(data, stageAdvice, risk, opportunity, enriched, bestChannel) {
  return `${stageAdvice.action}

Priority level: ${capitalizeWords(data.priority)}
Risk level: ${risk.level}
Opportunity score: ${opportunity.score}/100
AI Score: ${enriched.ai_score}/100
Conversion Probability: ${enriched.ai_conversion_probability}
Urgency: ${enriched.ai_urgency.label}
Best Channel: ${bestChannel}

Recommended counselor action:
${enriched.ai_recommended_action}`;
}

function buildReminder(data, stageAdvice, enriched) {
  return `Create follow-up reminder:

Student: ${data.fullName}
Type: ${data.isAppointment ? "Appointment" : "Inquiry"}
Current status: ${capitalizeWords(data.status)}
AI urgency: ${enriched.ai_urgency.label}
Recommended due time: ${getReminderTiming(data.priority, data.status, enriched.ai_urgency.level)}
Reminder note: ${stageAdvice.reminder}`;
}

function getStageAdvice(status, isAppointment) {
  if (isAppointment) {
    if (status.includes("confirmed")) {
      return {
        short: "Your appointment is confirmed. Please make sure you are available at the scheduled time.",
        long: "Your appointment has been confirmed. Please make sure you are available at the scheduled time and prepare any questions or documents you would like to discuss.",
        action: "Prepare consultation notes and confirm the student attends the appointment.",
        reminder: "Remind student before appointment and update status after consultation.",
      };
    }

    if (status.includes("completed")) {
      return {
        short: "Your consultation has been completed. The next step is to proceed with your application plan.",
        long: "Your consultation has been completed. The next step is to confirm your study plan, required documents, and application timeline.",
        action: "Send post-consultation summary and request documents/application confirmation.",
        reminder: "Follow up on post-consultation decision and required documents.",
      };
    }

    return {
      short: "Your appointment is still pending. Please confirm your availability so we can finalize your consultation.",
      long: "Your appointment is still pending. Please confirm your availability so we can finalize your consultation slot and guide you properly.",
      action: "Confirm appointment availability and update appointment status.",
      reminder: "Follow up to confirm appointment date and time.",
    };
  }

  if (status.includes("documents")) {
    return {
      short: "We are currently waiting for your required documents to continue the process.",
      long: "We are currently waiting for your required documents. Once received, we can review your profile and move your application forward.",
      action: "Request missing documents and update documents checklist.",
      reminder: "Follow up for pending documents.",
    };
  }

  if (status.includes("visa")) {
    return {
      short: "Your case is in visa process. Please make sure all visa documents are complete and updated.",
      long: "Your case is currently in the visa process. Please make sure all visa documents, financial documents, and supporting details are complete and updated.",
      action: "Review visa file readiness and identify risk/missing documents.",
      reminder: "Follow up on visa documents and submission timeline.",
    };
  }

  if (status.includes("contacted")) {
    return {
      short: "We have already contacted you. The next step is to confirm your interest and required documents.",
      long: "We have already contacted you. The next step is to confirm your study interest, preferred country, and required documents.",
      action: "Confirm interest and move student toward document collection.",
      reminder: "Follow up to confirm interest and collect documents.",
    };
  }

  return {
    short: "Your inquiry is currently new/pending. We would like to guide you with the next steps.",
    long: "Your inquiry is currently new/pending. We would like to understand your study goals and guide you with country, program, and application options.",
    action: "Contact student and qualify study goals, country, and budget.",
    reminder: "Follow up to make first contact and qualify the lead.",
  };
}

function getReminderTiming(priority, status, urgency) {
  if (urgency === "immediate") return "Today";
  if (priority === "vip" || priority === "high") return "Within 24 hours";
  if (status.includes("documents") || status.includes("visa")) return "In 2 days";
  return "In 3 days";
}

function getReminderDays(priority, urgency) {
  if (urgency === "immediate" || priority === "vip" || priority === "high") return 1;
  return 3;
}

function capitalizeWords(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default AICounselorAssistant;