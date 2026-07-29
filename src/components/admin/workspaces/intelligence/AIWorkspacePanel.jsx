// AIWorkspacePanel V4 MAXIMUM — Counselor Intelligence Command Workspace
// Maximum production pass: local CRM intelligence + intentional GPT generation,
// counselor qualification, explainable signals, safe copy actions, responsive Admin OS UI.
// Preserves all existing AI lead scoring, GPT context, copy actions, CRM intelligence,
// and child component integrations while rebuilding the visual system to match the
// approved Zaifan InquiryCard / AppointmentCard design language.

import { motion } from "framer-motion";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  RefreshCcw,
  Clock3,
  Zap,
} from "lucide-react";
const AICounselorAssistant = lazy(() => import("../team/AICounselorAssistant"));
import { enrichLeadWithAi } from "../../../../services/aiLeadEngine";
const GPTCopilotPanel = lazy(() => import("./GPTCopilotPanel"));

function AIWorkspacePanel({ student, studentType = "inquiry", adminProfile }) {
  const [copyStatus, setCopyStatus] = useState("");
  const [copyTone, setCopyTone] = useState("success");
  const copyTimerRef = useRef(null);

  if (!student) return null;

  const aiLead = enrichLeadWithAi(student, studentType);

  const name = student.full_name || student.name || "Student";
  const firstName = String(name).trim().split(" ")[0] || "there";
  const phone = student.phone || student.phone_number || student.whatsapp;
  const email = student.email;

  const country =
    student.country || student.country_interest || student.preferred_country;

  const program =
    student.field_of_interest ||
    student.course ||
    student.program ||
    student.study_field ||
    student.consultation_type;

  const status =
    student.status || student.appointment_stage || student.pipeline_stage;

  const priority = student.priority || "not_set";
  const studyLevel = student.study_level || student.level;
  const budget = student.budget || student.budget_range;
  const englishScore =
    student.ielts_score ||
    student.english_score ||
    student.pte_score ||
    student.duolingo_score;
  const academicScore =
    student.academic_score || student.marks || student.cgpa || student.percentage;
  const intake = student.intake || student.preferred_intake;

  const hasContact = Boolean(phone || email);
  const hasCountry = Boolean(country);
  const hasProgram = Boolean(program);
  const hasNotes = Boolean(
    student.notes || student.message || student.consultation_notes
  );

  const missingItems = [
    !hasContact ? "Contact details" : null,
    !hasCountry ? "Preferred country" : null,
    !hasProgram ? "Program / field" : null,
    !studyLevel ? "Study level" : null,
    !hasNotes ? "Student notes / message" : null,
    !budget ? "Budget" : null,
    !englishScore ? "IELTS / English score" : null,
    !academicScore ? "Academic score" : null,
    !intake ? "Preferred intake" : null,
  ].filter(Boolean);

  const riskSignals = [
    ["documents_pending", "documents pending"].includes(
      String(status || "").toLowerCase().replace(/_/g, " ")
    )
      ? "Documents are pending"
      : null,
    !phone ? "No phone number available" : null,
    !email ? "No email available" : null,
    !hasNotes ? "No meaningful notes yet" : null,
    aiLead.ai_score < 45 ? "Low AI score" : null,
    missingItems.length >= 5 ? "Profile is underqualified for strong counseling" : null,
  ].filter(Boolean);

  const opportunitySignals = [
    hasCountry ? `Clear country interest: ${country}` : null,
    hasProgram ? `Clear program interest: ${program}` : null,
    phone ? "Direct phone/WhatsApp contact available" : null,
    email ? "Email contact available" : null,
    aiLead.ai_score >= 70 ? "Strong AI lead score" : null,
    priority === "vip" || priority === "high" ? "Priority lead" : null,
    ["documents_pending", "documents pending"].includes(
      String(status || "").toLowerCase().replace(/_/g, " ")
    )
      ? "Ready for document collection push"
      : null,
  ].filter(Boolean);

  const qualificationChecks = [
    { label: "Contact available", passed: hasContact },
    { label: "Country selected", passed: hasCountry },
    { label: "Program selected", passed: hasProgram },
    { label: "Study level available", passed: Boolean(studyLevel) },
    { label: "Budget available", passed: Boolean(budget) },
    { label: "English score available", passed: Boolean(englishScore) },
    { label: "Academic score available", passed: Boolean(academicScore) },
    { label: "Intake available", passed: Boolean(intake) },
    { label: "Notes/message available", passed: hasNotes },
  ];

  const completedChecks = qualificationChecks.filter((item) => item.passed).length;
  const qualificationPercent = Math.round(
    (completedChecks / qualificationChecks.length) * 100
  );

  const profileGapCount = missingItems.length;
  const riskCount = riskSignals.length;
  const opportunityCount = opportunitySignals.length;

  const opportunityStars = getOpportunityStars(aiLead.ai_score);

  const bestChannel = phone
    ? "WhatsApp / Call"
    : email
    ? "Email"
    : "Manual Review";

  const quickSummary = `${name} • ${studentType}
AI Score: ${aiLead.ai_score}/100
Temperature: ${aiLead.ai_tier.label}
Conversion: ${aiLead.ai_conversion_probability}
Urgency: ${aiLead.ai_urgency.label}
Country: ${country || "Not provided"}
Program: ${program || "Not provided"}
Status: ${status || "Not provided"}
Priority: ${priority || "Not provided"}
Recommended Action: ${aiLead.ai_recommended_action}`;

  const quickWhatsApp = `Hi ${firstName},

This is ${adminProfile?.full_name || "Zaifan Consultancy"} from Zaifan Consultancy.

I’m following up regarding your study abroad case${country ? ` for ${country}` : ""}${
    program ? ` in ${program}` : ""
  }.

To guide you properly, please share your pending documents or basic academic details.

When are you available for a quick discussion?`;

  const quickEmail = `Subject: Follow-Up From Zaifan Consultancy

Dear ${name},

I hope you are doing well.

I am following up regarding your study abroad case with Zaifan Consultancy.

To guide you properly, please share your pending documents, academic details, preferred intake, IELTS/English score if available, and budget range.

Best regards,
${adminProfile?.full_name || "Zaifan Consultancy Team"}`;

  const crmContext = {
    leadScore: aiLead.ai_score,
    leadHealth: aiLead.ai_tier.label,
    overdueStatus: aiLead.ai_urgency.label,
    extraContext: {
      ai_score: aiLead.ai_score,
      ai_tier: aiLead.ai_tier.label,
      ai_urgency: aiLead.ai_urgency.label,
      ai_conversion_probability: aiLead.ai_conversion_probability,
      ai_recommended_action: aiLead.ai_recommended_action,
      missing_items: missingItems,
      risk_signals: riskSignals,
      opportunity_signals: opportunitySignals,
      qualification_percent: qualificationPercent,
      best_channel: bestChannel,
      opportunity_stars: opportunityStars,
    },
  };

  const copyText = async (text, label = "Content") => {
    const value = String(text || "").trim();

    if (!value) {
      setCopyTone("error");
      setCopyStatus(`${label} is empty.`);
      return;
    }

    try {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!copied) throw new Error("Clipboard access is unavailable.");
      }

      setCopyTone("success");
      setCopyStatus(`${label} copied.`);
      copyTimerRef.current = window.setTimeout(() => setCopyStatus(""), 2200);
    } catch (error) {
      console.error("Copy failed:", error);
      setCopyTone("error");
      setCopyStatus(error?.message || "Copy failed.");
      copyTimerRef.current = window.setTimeout(() => setCopyStatus(""), 3200);
    }
  };

  return (
    <section className="space-y-5 text-[#10233f]">
      <div className="relative overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#123865] p-6 shadow-[0_16px_40px_rgba(15,35,63,0.14)]" style={{ color: "#ffffff" }}>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-orange-400/45 bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                AI Workspace V3
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                Real GPT + CRM Intelligence
              </span>
            </div>

            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Counselor Operating Desk
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white">
              This workspace combines local CRM intelligence with real GPT generation. Local AI handles scores and signals instantly. GPT is used only when the counselor manually generates a real output.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <HeroScoreCard
              label="AI Score"
              value={aiLead.ai_score}
              suffix="/100"
              detail={aiLead.ai_tier.label}
              icon={Brain}
            />
            <HeroScoreCard
              label="Qualification"
              value={qualificationPercent}
              suffix="%"
              detail={`${completedChecks}/${qualificationChecks.length} checks`}
              icon={ClipboardCheck}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <WorkspaceModeCard
          label="Local AI"
          value="Always On"
          detail="Scores, urgency, qualification and rule-based signals."
          tone="navy"
        />
        <WorkspaceModeCard
          label="GPT"
          value="Manual"
          detail="Runs only when a counselor intentionally generates an output."
          tone="orange"
        />
        <WorkspaceModeCard
          label="CRM Context"
          value="Connected"
          detail="Student profile and local AI signals are passed into the workspace."
          tone="cream"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalSignal
          icon={CheckCircle2}
          label="Qualification"
          value={`${qualificationPercent}%`}
          detail={`${completedChecks}/${qualificationChecks.length} core checks complete`}
          tone={qualificationPercent >= 70 ? "green" : "orange"}
        />
        <OperationalSignal
          icon={TrendingUp}
          label="Opportunities"
          value={opportunityCount}
          detail="Positive CRM signals available"
          tone="blue"
        />
        <OperationalSignal
          icon={ShieldAlert}
          label="Risk Signals"
          value={riskCount}
          detail={riskCount ? "Review before counselor action" : "No major risk detected"}
          tone={riskCount ? "red" : "green"}
        />
        <OperationalSignal
          icon={AlertCircle}
          label="Profile Gaps"
          value={profileGapCount}
          detail={profileGapCount ? "Missing data reduces counseling quality" : "Core profile data is present"}
          tone={profileGapCount >= 5 ? "red" : profileGapCount ? "orange" : "green"}
        />
      </div>

      <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-white shadow-[0_12px_30px_rgba(15,35,63,0.06)]">
        <div className="bg-orange-500 px-5 py-4 text-white sm:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
            Real GPT Generation
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            Counselor GPT Copilot
          </h3>
          <p className="mt-1 text-sm leading-6 text-white">
            Use GPT only when a counselor intentionally needs generated reasoning, messaging, summaries, scripts, or case guidance.
          </p>
        </div>

        <div className="bg-[#fff8ee] p-4 sm:p-5">
          <Suspense fallback={null}>
<GPTCopilotPanel
            student={student}
            studentType={studentType}
            adminProfile={adminProfile}
            aiLead={aiLead}
            crmContext={crmContext}
          />
</Suspense>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Brain} label="Temperature" value={aiLead.ai_tier.label} />
        <Metric icon={Zap} label="Urgency" value={aiLead.ai_urgency.label} />
        <Metric
          icon={Target}
          label="Conversion"
          value={aiLead.ai_conversion_probability}
        />
        <Metric icon={PhoneCall} label="Best Channel" value={bestChannel} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <StudentIntelligenceSnapshot
          name={name}
          studentType={studentType}
          country={country}
          program={program}
          status={status}
          priority={priority}
          aiLead={aiLead}
          qualificationPercent={qualificationPercent}
          opportunityStars={opportunityStars}
          bestChannel={bestChannel}
        />

        <CounselorChecklist
          qualificationChecks={qualificationChecks}
          completedChecks={completedChecks}
          qualificationPercent={qualificationPercent}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          icon={TrendingUp}
          title="Main Opportunities"
          items={opportunitySignals}
          emptyText="No strong opportunity signals yet."
        />

        <InsightCard
          icon={ShieldAlert}
          title="Risk Signals"
          items={riskSignals}
          emptyText="No major risk signals detected."
          danger
        />

        <InsightCard
          icon={AlertTriangle}
          title="Missing Data"
          items={missingItems}
          emptyText="Profile has enough basic data."
          warning
        />
      </div>

      <div className="rounded-[1.6rem] border-2 border-orange-300 bg-[#fff8ee] p-5 shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#102f5c] p-3">
            <UserCheck className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-700">
              Recommended Counselor Move
            </p>
            <h3 className="mt-2 text-xl font-black text-[#10233f]">
              {aiLead.ai_recommended_action}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#36506f]">
              This recommendation is generated by the local AI lead engine and does not use GPT credits.
            </p>
          </div>
        </div>
      </div>

      {copyStatus ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl border-2 px-4 py-3 text-sm font-black ${
            copyTone === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {copyStatus}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <QuickAction
          icon={FileText}
          title="Copy Summary"
          text="Copy AI summary for internal notes."
          onClick={() => copyText(quickSummary, "AI summary")}
        />
        <QuickAction
          icon={MessageCircle}
          title="Copy WhatsApp"
          text="Copy credit-free WhatsApp follow-up."
          onClick={() => copyText(quickWhatsApp, "WhatsApp draft")}
        />
        <QuickAction
          icon={Mail}
          title="Copy Email"
          text="Copy credit-free email draft."
          onClick={() => copyText(quickEmail, "Email draft")}
        />
      </div>

      <div className="rounded-[1.8rem] border-2 border-[#b8c5d3] bg-white p-5 shadow-[0_10px_26px_rgba(15,35,63,0.05)]">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
            <Sparkles className="h-5 w-5 text-orange-700" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-700">
              Local Rule-Based Copilot
            </p>
            <h3 className="text-xl font-black text-[#10233f]">
              AI Counselor Assistant
            </h3>
          </div>
        </div>

        <Suspense fallback={null}>
<AICounselorAssistant
          student={student}
          studentType={studentType}
          adminProfile={adminProfile}
        />
</Suspense>
      </div>
    </section>
  );
}

function HeroScoreCard({ icon: Icon, label, value, suffix, detail }) {
  return (
    <div className="rounded-[1.4rem] border border-white/20 bg-white/10 p-5 backdrop-blur-sm" style={{ color: "#ffffff" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white">
          {label}
        </p>
        <Icon className="h-5 w-5 text-orange-300" />
      </div>
      <h3 className="mt-3 text-4xl font-black text-white">
        {value}
        <span className="text-base text-white">{suffix}</span>
      </h3>
      <p className="mt-1 text-xs text-white">{detail}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#b8c5d3] bg-white p-5 text-[#10233f] shadow-[0_8px_20px_rgba(15,35,63,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#4d6380]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><Icon size={18} /></span>
      </div>
      <h3 className="mt-3 text-2xl font-black">{value}</h3>
    </div>
  );
}

function StudentIntelligenceSnapshot({
  name,
  studentType,
  country,
  program,
  status,
  priority,
  aiLead,
  qualificationPercent,
  opportunityStars,
  bestChannel,
}) {
  const rows = [
    ["Student", name],
    ["Type", studentType],
    ["Country", country || "Not selected"],
    ["Program", program || "Not selected"],
    ["Status", status || "Not selected"],
    ["Priority", priority || "Not selected"],
    ["AI Score", `${aiLead.ai_score}/100`],
    ["Lead Temperature", aiLead.ai_tier.label],
    ["Urgency", aiLead.ai_urgency.label],
    ["Conversion", aiLead.ai_conversion_probability],
    ["Qualification", `${qualificationPercent}%`],
    ["Best Channel", bestChannel],
  ];

  return (
    <div className="rounded-[1.8rem] border-2 border-[#b8c5d3] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-700">
            Student Intelligence Snapshot
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#10233f]">
            Counselor Decision View
          </h3>
        </div>

        <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 px-4 py-3 text-orange-700">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < opportunityStars ? "fill-[#F97316]" : "opacity-25"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em]">
            Opportunity Rating
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border-2 border-[#b8c5d3] bg-[#fff8ee] px-4 py-3"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#4d6380]">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-[#10233f]">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CounselorChecklist({
  qualificationChecks = [],
  completedChecks = 0,
  qualificationPercent = 0,
}) {
  return (
    <div className="rounded-[1.8rem] border-2 border-[#b8c5d3] bg-white p-5 shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-700">
            Counselor Checklist
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#10233f]">
            Qualification Readiness
          </h3>
        </div>

        <span className="rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-3 py-1 text-xs font-black text-orange-600">
          {completedChecks}/{qualificationChecks.length}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#4d6380]">
          <span>Profile readiness</span>
          <span>{qualificationPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${qualificationPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {qualificationChecks.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              item.passed
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            {item.passed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            )}
            <span className="text-sm font-semibold text-[#10233f]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  items = [],
  emptyText = "Nothing detected.",
  danger = false,
  warning = false,
}) {
  const iconClass = danger
    ? "text-red-700"
    : warning
    ? "text-amber-700"
    : "text-emerald-700";

  const boxClass = danger
    ? "border-red-200 bg-red-50"
    : warning
    ? "border-amber-200 bg-amber-50"
    : "border-emerald-200 bg-emerald-50";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${boxClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h3 className="font-black text-[#10233f]">{title}</h3>
      </div>

      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
              <span className="text-[#243b5a]">{item}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#4d6380]">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, text, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="rounded-[1.5rem] border-2 border-[#b8c5d3] bg-white p-5 text-left shadow-[0_8px_20px_rgba(15,35,63,0.04)] transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-[#fff8ee]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
          <Icon className="h-5 w-5 text-orange-700" />
        </div>
        <div>
          <h3 className="font-black text-[#10233f]">{title}</h3>
          <p className="mt-1 text-sm text-[#36506f]">{text}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
            <Copy size={13} />
            Copy
          </div>
        </div>
      </div>
    </motion.button>
  );
}


function OperationalSignal({ icon: Icon, label, value, detail, tone = "blue" }) {
  const tones = {
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    red: "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-[1.35rem] border-2 p-4 ${tones[tone] || tones.blue}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white/70">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5">{detail}</p>
    </div>
  );
}


function WorkspaceModeCard({ label, value, detail, tone = "cream" }) {
  const isDark = tone === "navy" || tone === "orange";

  const style =
    tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : tone === "orange"
        ? "border-orange-500 bg-orange-500"
        : "border-orange-300 bg-white";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${style}`}
      style={{ color: isDark ? "#ffffff" : "#10233f" }}
    >
      <p
        className="text-[9px] font-black uppercase tracking-[0.14em]"
        style={{ color: isDark ? "#ffffff" : "#4d6380" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-xl font-black"
        style={{ color: isDark ? "#ffffff" : "#10233f" }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-xs font-semibold leading-5"
        style={{ color: isDark ? "#ffffff" : "#4d6380" }}
      >
        {detail}
      </p>
    </div>
  );
}

function getOpportunityStars(score = 0) {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

export default AIWorkspacePanel;
