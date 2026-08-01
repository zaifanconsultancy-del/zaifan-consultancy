// LeadHealthPanel PARTNER OS EXTREME — Compact Student Health Command
// Preserves Student OS health scoring, application funnel, risk heatmap, watchlist,
// task/document/university/application analysis and team health logic.
// Full mature component retained; visual system aligned with Zaifan Admin OS.

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
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
  const reduceMotion = useReducedMotion();
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);

  const allLeads = useMemo(
    () => [...inquiries, ...appointments],
    [inquiries, appointments]
  );

  const studentInsights = useMemo(
    () =>
      buildStudentInsights({
        leads: allLeads,
        applications: studentApplications,
        documents: studentDocuments,
        tasks: studentTasks,
        universities: studentUniversities,
        riskScores: studentRiskScores,
        reminders,
        now: new Date(),
      }),
    [
      allLeads,
      studentApplications,
      studentDocuments,
      studentTasks,
      studentUniversities,
      studentRiskScores,
      reminders,
    ]
  );

  const healthMetrics = useMemo(() => {
    let healthy = 0;
    let attention = 0;
    let risk = 0;
    let noApplication = 0;
    let offerStage = 0;
    let visaStage = 0;
    let noUniversityPlan = 0;
    let overdueTasks = 0;
    let assignedStudents = 0;
    let studentsWithBlockers = 0;
    let urgentStudents = 0;
    let scoreTotal = 0;

    const riskHeatmap = {
      critical: 0,
      high: 0,
      medium: 0,
      healthy: 0,
    };

    for (const item of studentInsights) {
      if (item.health === "healthy") healthy += 1;
      else if (item.health === "attention") attention += 1;
      else if (item.health === "risk") risk += 1;

      if (!item.application) noApplication += 1;
      if (item.isOfferStage) offerStage += 1;
      if (item.isVisaStage) visaStage += 1;
      if (!item.hasUniversityPlan) noUniversityPlan += 1;
      if (item.overdueTaskCount > 0) overdueTasks += 1;
      if (!item.isUnassigned) assignedStudents += 1;
      if (item.riskSignals?.length > 0) studentsWithBlockers += 1;
      if (item.score < 45 || item.overdueTaskCount >= 2) urgentStudents += 1;

      scoreTotal += item.score;

      if (item.score < 25) riskHeatmap.critical += 1;
      else if (item.score < 50) riskHeatmap.high += 1;
      else if (item.score < 75) riskHeatmap.medium += 1;
      else riskHeatmap.healthy += 1;
    }

    return {
      healthy,
      attention,
      risk,
      noApplication,
      offerStage,
      visaStage,
      noUniversityPlan,
      overdueTasks,
      assignedStudents,
      studentsWithBlockers,
      urgentStudents,
      healthScore: studentInsights.length
        ? Math.round(scoreTotal / studentInsights.length)
        : 0,
      riskHeatmap,
    };
  }, [studentInsights]);

  const healthyStudents = studentInsights.filter(
    (item) => item.health === "healthy"
  );
  const attentionStudents = studentInsights.filter(
    (item) => item.health === "attention"
  );
  const riskStudents = studentInsights.filter(
    (item) => item.health === "risk"
  );

  const noApplication = { length: healthMetrics.noApplication };
  const offerStage = { length: healthMetrics.offerStage };
  const visaStage = { length: healthMetrics.visaStage };
  const noUniversityPlan = { length: healthMetrics.noUniversityPlan };
  const overdueTasks = { length: healthMetrics.overdueTasks };

  const safeHealthScore = Math.max(
    0,
    Math.min(100, healthMetrics.healthScore)
  );
  const teamHealth = getTeamHealth(safeHealthScore);

  const assignedStudents = healthMetrics.assignedStudents;
  const assignmentCoverage = studentInsights.length
    ? Math.round((assignedStudents / studentInsights.length) * 100)
    : 0;
  const studentsWithBlockers = healthMetrics.studentsWithBlockers;
  const urgentStudents = healthMetrics.urgentStudents;

  const applicationFunnel = useMemo(() => {
    const result = {
      notStarted: 0,
      documentsPending: 0,
      applied: 0,
      underReview: 0,
      offerReceived: 0,
      offerAccepted: 0,
      visaStage: 0,
      visaApproved: 0,
      enrolled: 0,
    };

    for (const application of studentApplications) {
      const applicationStatus = application.application_status;
      const offerStatus = application.offer_status;
      const visaStatus = application.visa_status;

      if (applicationStatus === "not_started") result.notStarted += 1;
      if (applicationStatus === "documents_pending") {
        result.documentsPending += 1;
      }
      if (applicationStatus === "applied") result.applied += 1;
      if (applicationStatus === "under_review") result.underReview += 1;

      if (
        applicationStatus === "offer_received" ||
        offerStatus === "offer_received"
      ) {
        result.offerReceived += 1;
      }

      if (
        applicationStatus === "offer_accepted" ||
        offerStatus === "offer_accepted"
      ) {
        result.offerAccepted += 1;
      }

      if (visaStatus && visaStatus !== "not_started") {
        result.visaStage += 1;
      }

      if (visaStatus === "visa_approved") {
        result.visaApproved += 1;
      }

      if (applicationStatus === "enrolled") {
        result.enrolled += 1;
      }
    }

    return result;
  }, [studentApplications]);

  const riskHeatmap = healthMetrics.riskHeatmap;
  const cards = [
    {
      label: "Healthy",
      value: healthyStudents.length,
      icon: ShieldCheck,
      color: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
      description: "Strong journey progress.",
    },
    {
      label: "Attention",
      value: attentionStudents.length,
      icon: HeartPulse,
      color: "border-[#F59E0B] bg-[#FFF7ED] text-amber-800",
      description: "Needs counselor monitoring.",
    },
    {
      label: "At Risk",
      value: riskStudents.length,
      icon: AlertTriangle,
      color: "border-[#FB7185] bg-[#FFF4F4] text-red-700",
      description: "Journey blockers detected.",
    },
    {
       label: "No App Record",
  value: noApplication.length,
      icon: FileCheck2,
      color: "border-[#F97316] bg-[#FFF4E8] text-orange-700",
      description: "Application not started.",
    },
    {
      label: "Offer Stage",
      value: offerStage.length,
      icon: GraduationCap,
      color: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
      description: "Offer received or accepted.",
    },
    {
      label: "Visa Stage",
      value: visaStage.length,
      icon: Plane,
      color: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
      description: "Visa journey active.",
    },
    {
      label: "No University Plan",
      value: noUniversityPlan.length,
      icon: School,
      color: "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700",
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

  const watchlist = [...riskStudents, ...attentionStudents]
    .sort((a, b) => b.riskWeight - a.riskWeight)
    .slice(0, 10);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="min-w-0 space-y-4 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-5 text-[#10233F] shadow-[0_20px_55px_rgba(18,56,101,0.12)] sm:p-5"
    >
      <div className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_46px_rgba(18,56,101,0.10)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <div className="min-w-0 bg-[#123865] p-4 text-white sm:p-5 lg:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">
              Student Success Intelligence V3
            </p>

            <h2 className="mt-2 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              OS Health Monitor
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Reads CRM leads plus Student OS data: applications, university planning,
              visa progress, documents, tasks, reminders, and journey risk.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 text-white sm:p-5 lg:border-l-[3px] lg:border-t-0 lg:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              OS Health
            </p>

            <div className="mt-3 flex items-end gap-3">
              <h3 className="text-5xl font-black leading-none text-white">
                {safeHealthScore}%
              </h3>

              <span className="mb-1 rounded-full border-2 border-white/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                {teamHealth.label}
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-white/30 bg-white/10">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${safeHealthScore}%` }}
              />
            </div>

            <p className="mt-4 break-words text-xs font-semibold leading-5 text-white">
              {teamHealth.text}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <HealthSignal
          label="Assignment Coverage"
          value={`${assignmentCoverage}%`}
          detail={`${assignedStudents}/${studentInsights.length} students have an accountable owner.`}
          tone={assignmentCoverage >= 85 ? "good" : assignmentCoverage >= 60 ? "warning" : "risk"}
        />
        <HealthSignal
          label="Students With Blockers"
          value={studentsWithBlockers}
          detail="Cases with at least one journey risk signal."
          tone={studentsWithBlockers ? "warning" : "good"}
        />
        <HealthSignal
          label="Urgent Intervention"
          value={urgentStudents}
          detail="Low-health or repeatedly overdue student cases."
          tone={urgentStudents ? "risk" : "good"}
        />
        <HealthSignal
          label="Portfolio Coverage"
          value={studentInsights.length}
          detail={`${inquiries.length} inquiries + ${appointments.length} appointments analyzed.`}
          tone="navy"
        />
      </div>

      <section className="rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-3">
        <button
          type="button"
          onClick={() =>
            setWorkspaceExpanded((current) => !current)
          }
          aria-expanded={workspaceExpanded}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Student Health Workspace
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {workspaceExpanded
                ? "Hide portfolio health, funnel, risk heatmap and intervention watchlist."
                : "Open portfolio health, funnel, risk heatmap and intervention watchlist."}
            </p>
          </div>

          <Activity
            size={17}
            className={`shrink-0 text-[#123865] transition ${
              workspaceExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </section>

      {workspaceExpanded ? (
        <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] ${card.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] opacity-80">{card.label}</p>
                  <h3 className="mt-2 text-3xl font-black">{card.value}</h3>
                </div>
                <Icon size={28} />
              </div>
              <p className="mt-4 break-words text-xs font-semibold leading-5 opacity-80">{card.description}</p>
            </div>
          );
        })}
      </div>
<div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white p-5 shadow-[0_10px_26px_rgba(18,56,101,0.06)]">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
        Student Journey
      </p>
      <h3 className="mt-1 text-xl font-black text-[#10233f]">
        Application Funnel
      </h3>
    </div>
    <div className="rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] p-2 text-orange-700">
      <GraduationCap size={18} />
    </div>
  </div>

  <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
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
<div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_10px_26px_rgba(18,56,101,0.05)]">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-700">
        Risk Distribution
      </p>
      <h3 className="mt-1 text-xl font-black text-[#10233f]">
        Student Risk Heatmap
      </h3>
    </div>
    <div className="rounded-xl border-2 border-[#FB7185] bg-[#FFF4F4] p-2 text-red-700">
      <AlertTriangle size={18} />
    </div>
  </div>

  <div className="mt-5 grid min-w-0 grid-cols-2 gap-4">
    <RiskCard
      label="Critical"
      value={riskHeatmap.critical}
      color="border-[#FB7185] bg-[#FFF4F4] text-red-700"
    />

    <RiskCard
      label="High"
      value={riskHeatmap.high}
      color="border-[#F97316] bg-[#FFF4E8] text-orange-700"
    />

    <RiskCard
      label="Medium"
      value={riskHeatmap.medium}
      color="border-[#F59E0B] bg-[#FFF7ED] text-amber-800"
    />

    <RiskCard
      label="Healthy"
      value={riskHeatmap.healthy}
      color="border-[#34D399] bg-[#F0FFF8] text-emerald-700"
    />
  </div>
</div>
      <div className="grid min-w-0 gap-4">
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
            {riskStudents.length > 0
              ? "Student journey blockers need immediate counselor review."
              : attentionStudents.length > healthyStudents.length
              ? "Student OS is active, but many students still need monitoring."
              : "Student OS health is currently strong."}
          </p>
        </InfoBox>
      </div>

      <div className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white p-5 shadow-[0_10px_26px_rgba(18,56,101,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Intervention Queue
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10233f]">
              Student Journey Watchlist
            </h3>
          </div>
          <div className="rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] p-2 text-orange-700">
            <HeartPulse size={18} />
          </div>
        </div>

        {watchlist.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            No major student journey risks detected right now.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {watchlist.map((student) => (
              <div
                key={`${student.displayType}-${student.id}`}
                className="flex min-w-0 flex-col gap-3 rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A]"
              >
                <div className="min-w-0">
                  <p className="break-words font-black text-[#10233f]">{student.displayName}</p>
                  <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                    {student.displayType} • {student.journeyStage} • {student.score}/100
                  </p>
                  <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">{student.reason}</p>
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
        </div>
      ) : null}
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

function HealthSignal({ label, value, detail, tone = "default" }) {
  const styles = {
    good: "border-[#34D399] bg-[#F0FFF8]",
    warning: "border-[#F59E0B] bg-[#FFF7ED]",
    risk: "border-[#FB7185] bg-[#FFF4F4]",
    navy: "border-[#123865] bg-[#F2F7FF]",
    default: "border-[#F97316] bg-[#FFF4E8]",
  };

  const valueTone =
    tone === "risk"
      ? "text-red-700"
      : tone === "warning"
      ? "text-amber-800"
      : tone === "good"
      ? "text-emerald-700"
      : tone === "navy"
      ? "text-[#123865]"
      : "text-orange-700";

  return (
    <div className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] ${styles[tone] || styles.default}`}>
      <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${valueTone}`}>
        {value}
      </p>
      <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function InfoBox({ icon: Icon, title, children }) {
  return (
    <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_8px_24px_rgba(18,56,101,0.05)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
          <Icon size={18} />
        </div>
        <h3 className="break-words text-lg font-black text-[#10233f]">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-sm font-semibold leading-5 text-slate-600">
        {children}
      </div>
    </div>
  );
}

function Badge({ text, red, yellow, blue, purple, green, orange, cyan }) {
  const cls = red
    ? "border-[#FB7185] bg-[#FFF4F4] text-red-700"
    : yellow
    ? "border-[#F59E0B] bg-[#FFF7ED] text-amber-800"
    : blue
    ? "border-blue-400/20 bg-blue-500/10 text-blue-700"
    : purple
    ? "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700"
    : green
    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
    : orange
    ? "border-[#F97316] bg-[#FFF4E8] text-orange-700"
    : cyan
    ? "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
    : "border-white/10 bg-white/[0.04] text-slate-600";

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
      textColor: "text-emerald-700",
      color: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      text: "Stable but can improve.",
      textColor: "text-emerald-700",
      color: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      text: "Student journey pressure detected.",
      textColor: "text-amber-800",
      color: "border-[#F59E0B] bg-[#FFF7ED] text-amber-800",
    };
  }

  return {
    label: "Critical",
    text: "Immediate cleanup needed.",
    textColor: "text-red-700",
    color: "border-[#FB7185] bg-[#FFF4F4] text-red-700",
  };
}

function RiskCard({ label, value, color }) {
  return (
    <div className={`min-w-0 rounded-xl border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.04)] ${color}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.1em]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}
function MiniFunnel({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white p-3 transition hover:border-[#F97316]">
      <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}
export default LeadHealthPanel;