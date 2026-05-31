import { motion } from "framer-motion";
import {
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
  Zap,
} from "lucide-react";
import AICounselorAssistant from "./AICounselorAssistant";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";
import GPTCopilotPanel from "./GPTCopilotPanel";

function AIWorkspacePanel({ student, studentType = "inquiry", adminProfile }) {
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
    status === "documents_pending" ? "Documents are pending" : null,
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
    status === "documents_pending" ? "Ready for document collection push" : null,
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

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
    alert("Copied.");
  };

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/15 via-white/[0.035] to-black/40 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_38%)]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-60 w-60 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                AI Workspace V3
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                Real GPT + CRM Intelligence
              </span>
            </div>

            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Counselor Operating Desk
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
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

      <GPTCopilotPanel
        student={student}
        studentType={studentType}
        adminProfile={adminProfile}
        aiLead={aiLead}
        crmContext={crmContext}
      />

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

      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-black/25 p-3">
            <UserCheck className="h-5 w-5 text-[#D4AF37]" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
              Recommended Counselor Move
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              {aiLead.ai_recommended_action}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              This recommendation is generated by the local AI lead engine and does not use GPT credits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <QuickAction
          icon={FileText}
          title="Copy Summary"
          text="Copy AI summary for internal notes."
          onClick={() => copyText(quickSummary)}
        />
        <QuickAction
          icon={MessageCircle}
          title="Copy WhatsApp"
          text="Copy credit-free WhatsApp follow-up."
          onClick={() => copyText(quickWhatsApp)}
        />
        <QuickAction
          icon={Mail}
          title="Copy Email"
          text="Copy credit-free email draft."
          onClick={() => copyText(quickEmail)}
        />
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              Rule-Based Copilot
            </p>
            <h3 className="text-xl font-black text-white">
              AI Counselor Assistant
            </h3>
          </div>
        </div>

        <AICounselorAssistant
          student={student}
          studentType={studentType}
          adminProfile={adminProfile}
        />
      </div>
    </section>
  );
}

function HeroScoreCard({ icon: Icon, label, value, suffix, detail }) {
  return (
    <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-black/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.22em] text-white/40">
          {label}
        </p>
        <Icon className="h-5 w-5 text-[#D4AF37]" />
      </div>
      <h3 className="mt-3 text-4xl font-black text-[#D4AF37]">
        {value}
        <span className="text-base text-white/35">{suffix}</span>
      </h3>
      <p className="mt-1 text-xs text-white/45">{detail}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 text-[#D4AF37]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">{label}</p>
        <Icon size={22} />
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
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
            Student Intelligence Snapshot
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Counselor Decision View
          </h3>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-[#D4AF37]">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < opportunityStars ? "fill-[#D4AF37]" : "opacity-25"
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
            className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white/70">
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
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
            Counselor Checklist
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Qualification Readiness
          </h3>
        </div>

        <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black text-[#D4AF37]">
          {completedChecks}/{qualificationChecks.length}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-white/45">
          <span>Profile readiness</span>
          <span>{qualificationPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
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
                ? "border-emerald-400/20 bg-emerald-500/10"
                : "border-red-400/20 bg-red-500/10"
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${
                item.passed ? "text-emerald-300" : "text-red-300 opacity-50"
              }`}
            />
            <span className="text-sm text-white/65">{item.label}</span>
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
    ? "text-red-300"
    : warning
    ? "text-yellow-300"
    : "text-emerald-300";

  const boxClass = danger
    ? "border-red-400/20 bg-red-500/10"
    : warning
    ? "border-yellow-400/20 bg-yellow-500/10"
    : "border-emerald-400/20 bg-emerald-500/10";

  return (
    <div className={`rounded-[1.5rem] border p-5 ${boxClass}`}>
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${iconClass}`} />
        <h3 className="font-black text-white">{title}</h3>
      </div>

      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
              <span className="text-white/65">{item}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/45">{emptyText}</p>
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
      className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left transition hover:border-[#D4AF37]/30 hover:bg-white/[0.055]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3">
          <Icon className="h-5 w-5 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="font-black text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/50">{text}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#D4AF37]">
            <Copy size={13} />
            Copy
          </div>
        </div>
      </div>
    </motion.button>
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
