import { motion } from "framer-motion";
import {
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
  Activity,
  Clock,
  Users,
  Gauge,
  GraduationCap,
  FileCheck2,
  Plane,
  School,
} from "lucide-react";

function LeadHealthPanel({
  inquiries = [],
  appointments = [],
  reminders = [],
  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],
}) {
  const now = new Date();
  const allLeads = [...inquiries, ...appointments];

  const studentInsights = buildStudentInsights({
    leads: allLeads,
    applications: studentApplications,
    documents: studentDocuments,
    tasks: studentTasks,
    universities: studentUniversities,
    riskScores: studentRiskScores,
    reminders,
    now,
  });

  const healthy = studentInsights.filter((item) => item.health === "healthy");
  const attention = studentInsights.filter((item) => item.health === "attention");
  const risk = studentInsights.filter((item) => item.health === "risk");

  
  const noApplication = studentInsights.filter((item) => !item.application);
  const offerStage = studentInsights.filter((item) => item.isOfferStage);
  const visaStage = studentInsights.filter((item) => item.isVisaStage);
  const noUniversityPlan = studentInsights.filter((item) => !item.hasUniversityPlan);
  const overdueTasks = studentInsights.filter((item) => item.overdueTaskCount > 0);

  const healthScore =
    studentInsights.length === 0
      ? 0
      : Math.round(
          studentInsights.reduce((sum, item) => sum + item.score, 0) /
            studentInsights.length
        );

  const safeHealthScore = Math.max(0, Math.min(100, healthScore));
  const teamHealth = getTeamHealth(safeHealthScore);
const applicationFunnel = {
  
  notStarted: studentApplications.filter(
    (a) => a.application_status === "not_started"
  ).length,

  documentsPending: studentApplications.filter(
    (a) => a.application_status === "documents_pending"
  ).length,

  applied: studentApplications.filter(
    (a) => a.application_status === "applied"
  ).length,

  underReview: studentApplications.filter(
    (a) => a.application_status === "under_review"
  ).length,

  offerReceived: studentApplications.filter(
    (a) =>
      a.application_status === "offer_received" ||
      a.offer_status === "offer_received"
  ).length,

  offerAccepted: studentApplications.filter(
    (a) =>
      a.application_status === "offer_accepted" ||
      a.offer_status === "offer_accepted"
  ).length,

  visaStage: studentApplications.filter(
    (a) => a.visa_status && a.visa_status !== "not_started"
  ).length,

  visaApproved: studentApplications.filter(
    (a) => a.visa_status === "visa_approved"
  ).length,

  enrolled: studentApplications.filter(
    (a) => a.application_status === "enrolled"
  ).length,
};
const riskHeatmap = {
  critical: studentInsights.filter((s) => s.score < 25).length,
  high: studentInsights.filter((s) => s.score >= 25 && s.score < 50).length,
  medium: studentInsights.filter((s) => s.score >= 50 && s.score < 75).length,
  healthy: studentInsights.filter((s) => s.score >= 75).length,
};
  const cards = [
    {
      label: "Healthy",
      value: healthy.length,
      icon: ShieldCheck,
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
      description: "Strong journey progress.",
    },
    {
      label: "Attention",
      value: attention.length,
      icon: HeartPulse,
      color: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
      description: "Needs counselor monitoring.",
    },
    {
      label: "At Risk",
      value: risk.length,
      icon: AlertTriangle,
      color: "border-red-400/20 bg-red-500/10 text-red-300",
      description: "Journey blockers detected.",
    },
    {
       label: "No App Record",
  value: noApplication.length,
      icon: FileCheck2,
      color: "border-orange-400/20 bg-orange-500/10 text-orange-300",
      description: "Application not started.",
    },
    {
      label: "Offer Stage",
      value: offerStage.length,
      icon: GraduationCap,
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
      description: "Offer received or accepted.",
    },
    {
      label: "Visa Stage",
      value: visaStage.length,
      icon: Plane,
      color: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
      description: "Visa journey active.",
    },
    {
      label: "No University Plan",
      value: noUniversityPlan.length,
      icon: School,
      color: "border-purple-400/20 bg-purple-500/10 text-purple-300",
      description: "No shortlist detected.",
    },
    {
      label: "Team Health",
      value: `${safeHealthScore}%`,
      icon: Gauge,
      color: teamHealth.color,
      description: teamHealth.text,
    },
  ];

  const watchlist = [...risk, ...attention]
    .sort((a, b) => b.riskWeight - a.riskWeight)
    .slice(0, 10);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/12 via-white/[0.035] to-black/40 p-6 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.14),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Student Success Intelligence V3
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              OS Health Monitor
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Reads CRM leads plus Student OS data: applications, university planning,
              visa progress, documents, tasks, reminders, and journey risk.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
              OS Health
            </p>
            <h3 className="mt-2 text-4xl font-black text-white">
              {safeHealthScore}%
            </h3>
            <p className={`mt-1 text-xs ${teamHealth.textColor}`}>
              {teamHealth.label}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className={`rounded-[1.75rem] border p-5 ${card.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{card.label}</p>
                  <h3 className="mt-3 text-4xl font-black">{card.value}</h3>
                </div>
                <Icon size={28} />
              </div>
              <p className="mt-4 text-xs opacity-70">{card.description}</p>
            </div>
          );
        })}
      </div>
<div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
  <h3 className="text-xl font-black text-white">
    Application Funnel
  </h3>

  <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
    <MiniFunnel
      label="Not Started"
      value={applicationFunnel.notStarted}
    />

    <MiniFunnel
      label="Docs Pending"
      value={applicationFunnel.documentsPending}
    />

    <MiniFunnel
      label="Applied"
      value={applicationFunnel.applied}
    />

    <MiniFunnel
      label="Review"
      value={applicationFunnel.underReview}
    />

    <MiniFunnel
      label="Offer"
      value={applicationFunnel.offerReceived}
    />

    <MiniFunnel
      label="Accepted"
      value={applicationFunnel.offerAccepted}
    />

    <MiniFunnel
      label="Visa"
      value={applicationFunnel.visaStage}
    />

    <MiniFunnel
      label="Approved"
      value={applicationFunnel.visaApproved}
    />

    <MiniFunnel
      label="Enrolled"
      value={applicationFunnel.enrolled}
    />
  </div>
</div>
<div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
  <h3 className="text-xl font-black text-white">
    Student Risk Heatmap
  </h3>

  <div className="mt-5 grid gap-4 md:grid-cols-4">
    <RiskCard
      label="Critical"
      value={riskHeatmap.critical}
      color="border-red-400/20 bg-red-500/10 text-red-300"
    />

    <RiskCard
      label="High"
      value={riskHeatmap.high}
      color="border-orange-400/20 bg-orange-500/10 text-orange-300"
    />

    <RiskCard
      label="Medium"
      value={riskHeatmap.medium}
      color="border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
    />

    <RiskCard
      label="Healthy"
      value={riskHeatmap.healthy}
      color="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
    />
  </div>
</div>
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoBox icon={Users} title="Student OS Coverage">
          <p>Total CRM leads: {allLeads.length}</p>
          <p>Applications: {studentApplications.length}</p>
          <p>Universities: {studentUniversities.length}</p>
        </InfoBox>

        <InfoBox icon={Clock} title="Execution Risk">
          <p>Overdue task students: {overdueTasks.length}</p>
          <p>No application students: {noApplication.length}</p>
          <p>No university plan: {noUniversityPlan.length}</p>
        </InfoBox>

        <InfoBox icon={Activity} title="System Reading">
          <p>
            {risk.length > 0
              ? "Student journey blockers need immediate counselor review."
              : attention.length > healthy.length
              ? "Student OS is active, but many students still need monitoring."
              : "Student OS health is currently strong."}
          </p>
        </InfoBox>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-lg font-bold text-white">Student Journey Watchlist</h3>

        {watchlist.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">
            No major student journey risks detected right now.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {watchlist.map((student) => (
              <div
                key={`${student.displayType}-${student.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-semibold text-white">{student.displayName}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {student.displayType} • {student.journeyStage} • {student.score}/100
                  </p>
                  <p className="mt-2 text-xs text-white/55">{student.reason}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {student.isUnassigned && <Badge blue text="Unassigned" />}
                  {!student.application && <Badge orange text="No Application" />}
                  {!student.hasUniversityPlan && <Badge purple text="No University" />}
                  {student.overdueTaskCount > 0 && <Badge red text="Overdue Tasks" />}
                  {student.isVisaStage && <Badge cyan text="Visa Stage" />}
                  {student.isOfferStage && <Badge green text="Offer Stage" />}
                  <Badge
                    red={student.health === "risk"}
                    yellow={student.health === "attention"}
                    green={student.health === "healthy"}
                    text={student.health === "risk" ? "At Risk" : student.health === "attention" ? "Attention" : "Healthy"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function buildStudentInsights({
  leads = [],
  applications = [],
  documents = [],
  tasks = [],
  universities = [],
  riskScores = [],
  reminders = [],
  now,
}) {
  return leads.map((lead) => {
    const leadId = String(lead.id || "");
    const studentType = lead.__leadType || getLeadType(lead).toLowerCase();

    const application = applications.find(
      (item) =>
        String(item.student_id) === leadId &&
        String(item.student_type || "").toLowerCase() === studentType
    );

    const studentDocs = documents.filter(
      (item) => String(item.student_id) === leadId
    );

    const studentTasks = tasks.filter(
      (item) => String(item.student_id) === leadId
    );

    const studentUniversities = universities.filter(
      (item) => String(item.student_id) === leadId
    );

    const riskScore = riskScores.find(
      (item) => String(item.student_id) === leadId
    );

    const overdueTaskCount = studentTasks.filter((task) => {
      const status = String(task.status || "").toLowerCase();
      const dueDate = task.due_date ? new Date(task.due_date) : null;

      return (
        status !== "completed" &&
        status !== "done" &&
        dueDate &&
        !Number.isNaN(dueDate.getTime()) &&
        dueDate < now
      );
    }).length;

    const completedTaskCount = studentTasks.filter((task) => {
      const status = String(task.status || "").toLowerCase();
      return status === "completed" || status === "done";
    }).length;

    const dreamUniversities = studentUniversities.filter(
  (u) => String(u.category || "").toLowerCase() === "dream"
).length;

const targetUniversities = studentUniversities.filter(
  (u) => String(u.category || "").toLowerCase() === "target"
).length;

const safeUniversities = studentUniversities.filter(
  (u) => String(u.category || "").toLowerCase() === "safe"
).length;

const totalUniversityPlans =
  dreamUniversities +
  targetUniversities +
  safeUniversities;

const hasUniversityPlan =
  totalUniversityPlans > 0 ||
  Boolean(application?.source_university_id) ||
  Boolean(application?.source_university_name) ||
  Boolean(application?.university);

    const applicationScore = getApplicationScore(application?.application_status);
    const offerScore = getOfferScore(application?.offer_status);
    const visaScore = getVisaScore(application?.visa_status);
    const documentScore = getDocumentScore(studentDocs);
    const taskScore = getTaskScore({ total: studentTasks.length, completed: completedTaskCount, overdue: overdueTaskCount });
    let universityScore = 15;

if (totalUniversityPlans >= 1) universityScore = 40;
if (totalUniversityPlans >= 3) universityScore = 70;
if (totalUniversityPlans >= 5) universityScore = 100;

    let score = Math.round(
      applicationScore * 0.3 +
        offerScore * 0.15 +
        visaScore * 0.2 +
        documentScore * 0.15 +
        taskScore * 0.1 +
        universityScore * 0.1
    );

    if (!lead.assigned_admin_id) score -= 5;
    if (overdueTaskCount > 0) score -= Math.min(20, overdueTaskCount * 5);
    if (riskScore?.risk_score) score = Math.round((score + (100 - Number(riskScore.risk_score))) / 2);

    score = Math.max(0, Math.min(100, score));

    const journeyStage = getJourneyStage(application);
    const riskSignals = [];

    if (!application) riskSignals.push("No application record found.");
    if (!hasUniversityPlan) riskSignals.push("No university planning detected.");
    if (overdueTaskCount > 0) riskSignals.push(`${overdueTaskCount} overdue task(s).`);
    if (!lead.assigned_admin_id) riskSignals.push("No assigned counselor.");
    if (String(application?.visa_status || "").includes("rejected")) riskSignals.push("Visa rejected.");
    if (String(application?.application_status || "").includes("rejected")) riskSignals.push("Application rejected.");
    if (String(application?.offer_status || "").includes("rejected")) riskSignals.push("Offer rejected.");

    let health = "healthy";
    let reason = "Student journey is progressing well.";

    if (score < 45 || riskSignals.length >= 3) {
      health = "risk";
      reason = riskSignals[0] || "Major student journey blockers detected.";
    } else if (score < 70 || riskSignals.length > 0) {
      health = "attention";
      reason = riskSignals[0] || "Student needs counselor monitoring.";
    }

    return {
      ...lead,
      application,
      score,
      health,
      reason,
      riskSignals,
      riskWeight: riskSignals.length * 10 + (100 - score),
      journeyStage,
      overdueTaskCount,
      completedTaskCount,
      hasUniversityPlan,
      dreamUniversities,
targetUniversities,
safeUniversities,
totalUniversityPlans,
      isOfferStage: ["offer_received", "offer_accepted"].includes(
        application?.offer_status
      ) || ["offer_received", "offer_accepted"].includes(application?.application_status),
      isVisaStage:
        application?.visa_status &&
        application.visa_status !== "not_started",
      isUnassigned: !lead.assigned_admin_id,
      displayName: getLeadName(lead),
      displayType: getLeadType(lead),
    };
  });
}

function getApplicationScore(status = "") {
  const scores = {
    not_started: 10,
    documents_pending: 25,
    documents_received: 40,
    applied: 60,
    under_review: 70,
    offer_received: 85,
    offer_accepted: 95,
    enrolled: 100,
    rejected: 5,
  };

  return scores[String(status || "not_started").toLowerCase()] ?? 20;
}

function getOfferScore(status = "") {
  const scores = {
    pending: 30,
    under_review: 55,
    offer_received: 85,
    offer_accepted: 100,
    rejected: 5,
  };

  return scores[String(status || "pending").toLowerCase()] ?? 30;
}

function getVisaScore(status = "") {
  const scores = {
    not_started: 25,
    visa_processing: 55,
    biometrics: 70,
    medical: 75,
    under_review: 80,
    visa_approved: 100,
    rejected: 5,
  };

  return scores[String(status || "not_started").toLowerCase()] ?? 25;
}

function getDocumentScore(documents = []) {
  if (!documents.length) return 20;

  const verified = documents.filter((doc) =>
    ["verified", "approved", "received"].includes(
      String(doc.status || doc.document_status || "").toLowerCase()
    )
  ).length;

  return Math.min(100, Math.round((verified / Math.max(documents.length, 1)) * 100));
}

function getTaskScore({ total, completed, overdue }) {
  if (!total) return 50;

  const base = Math.round((completed / total) * 100);
  return Math.max(0, base - overdue * 10);
}

function getJourneyStage(application) {
  if (!application) return "Lead";

  const appStatus = String(application.application_status || "").toLowerCase();
  const offerStatus = String(application.offer_status || "").toLowerCase();
  const visaStatus = String(application.visa_status || "").toLowerCase();

  if (appStatus === "enrolled") return "Enrolled";
  if (visaStatus === "visa_approved") return "Visa Approved";
  if (visaStatus && visaStatus !== "not_started") return "Visa Stage";
  if (offerStatus === "offer_accepted") return "Offer Accepted";
  if (offerStatus === "offer_received" || appStatus === "offer_received") return "Offer Holder";
  if (appStatus && appStatus !== "not_started") return "Applicant";

  return "Lead";
}

function InfoBox({ icon: Icon, title, children }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <Icon className="text-[#D4AF37]" size={20} />
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-sm text-white/60">{children}</div>
    </div>
  );
}

function Badge({ text, red, yellow, blue, purple, green, orange, cyan }) {
  const cls = red
    ? "border-red-400/20 bg-red-500/10 text-red-300"
    : yellow
    ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
    : blue
    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
    : purple
    ? "border-purple-400/20 bg-purple-500/10 text-purple-300"
    : green
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
    : orange
    ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
    : cyan
    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
    : "border-white/10 bg-white/[0.04] text-white/50";

  return <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

function getLeadName(lead) {
  return lead.full_name || lead.name || lead.student_name || lead.client_name || "Unnamed Student";
}

function getLeadType(lead) {
  return lead.appointment_date || lead.appointment_time ? "Appointment" : "Inquiry";
}

function getTeamHealth(score) {
  if (score >= 80) {
    return {
      label: "Excellent",
      text: "Strong Student OS discipline.",
      textColor: "text-emerald-300",
      color: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      text: "Stable but can improve.",
      textColor: "text-[#D4AF37]",
      color: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      text: "Student journey pressure detected.",
      textColor: "text-orange-300",
      color: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    };
  }

  return {
    label: "Critical",
    text: "Immediate cleanup needed.",
    textColor: "text-red-300",
    color: "border-red-400/20 bg-red-500/10 text-red-300",
  };
}
function RiskCard({ label, value, color }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-xs uppercase tracking-[0.15em]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}
function MiniFunnel({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-[0.15em] text-white/35">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#D4AF37]">
        {value}
      </p>
    </div>
  );
}
export default LeadHealthPanel;