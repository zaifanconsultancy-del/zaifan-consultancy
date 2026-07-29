import React, { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  CircleDollarSign,
  ClipboardCheck,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Target,
  UserRoundCog,
  UsersRound,
} from "lucide-react";

import AgentLeadSubmissionForm from "./AgentLeadSubmissionForm";
import AgentStudentsWorkspace from "./AgentStudentsWorkspace";
import AgentCommissionPanel from "./AgentCommissionPanel";
import AgentPerformancePanel from "./AgentPerformancePanel";
import AgentManagementDashboard from "./AgentManagementDashboard";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).trim().toLowerCase();
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getAgentName(record = {}) {
  return (
    record.agent_name ||
    record.agentName ||
    record.referrer_name ||
    record.referrerName ||
    record.source_agent ||
    record.sourceAgent ||
    record.created_by_agent ||
    record.createdByAgent ||
    record.agent ||
    "Direct / Unassigned"
  );
}

function getAgentId(record = {}) {
  return (
    record.agent_id ||
    record.agentId ||
    record.partner_agent_id ||
    record.partnerAgentId ||
    record.referrer_id ||
    record.referrerId ||
    record.id ||
    null
  );
}

function getStudentStage(record = {}) {
  const raw = lower(
    record.stage ||
      record.status ||
      record.application_status ||
      record.applicationStatus ||
      record.journey_stage ||
      record.journeyStage
  );

  if (raw.includes("visa")) return "Visa";
  if (raw.includes("cas")) return "CAS";
  if (raw.includes("offer")) return "Offer";
  if (raw.includes("application") || raw.includes("applied")) {
    return "Application";
  }
  if (raw.includes("planning") || raw.includes("university")) {
    return "Planning";
  }
  return "Lead";
}

function getStudentName(record = {}) {
  return (
    record.student_name ||
    record.studentName ||
    record.full_name ||
    record.fullName ||
    record.name ||
    record.lead_name ||
    record.leadName ||
    record.email ||
    "Student"
  );
}

function getCountry(record = {}) {
  return (
    record.destination_country ||
    record.destinationCountry ||
    record.country ||
    record.study_country ||
    record.studyCountry ||
    record.preferred_country ||
    record.preferredCountry ||
    "Unknown"
  );
}

function getAmount(record = {}) {
  const candidates = [
    record.amount,
    record.commission_amount,
    record.commissionAmount,
    record.invoice_amount,
    record.invoiceAmount,
    record.paid_amount,
    record.paidAmount,
  ];

  const raw = candidates.find(
    (value) => value !== null && value !== undefined && value !== ""
  );

  return raw === undefined ? 0 : safeNumber(raw);
}

function hasRecordedAmount(record = {}) {
  return [
    record.amount,
    record.commission_amount,
    record.commissionAmount,
    record.invoice_amount,
    record.invoiceAmount,
    record.paid_amount,
    record.paidAmount,
  ].some(
    (value) => value !== null && value !== undefined && value !== ""
  );
}

function stableStudentId(student = {}, index = 0) {
  return (
    student.id ||
    student.student_id ||
    student.studentId ||
    student.lead_id ||
    student.leadId ||
    student.inquiry_id ||
    student.inquiryId ||
    student.email ||
    student.student_email ||
    student.studentEmail ||
    `agent-student-${index}`
  );
}

function ratio(part, total) {
  const numerator = safeNumber(part);
  const denominator = safeNumber(total);

  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function money(value) {
  if (value === null || value === undefined) return "Not recorded";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function isDirectOrUnassigned(name = "") {
  return lower(name) === "direct / unassigned";
}

function buildConfirmedAgentDirectory(snapshot = {}) {
  const rows = safeArray(
    snapshot.agentAccounts ||
      snapshot.agents ||
      snapshot.agentDirectory ||
      snapshot.agentProfiles
  );

  const directory = new Map();

  rows.forEach((row) => {
    const name = getAgentName(row);

    if (!name || isDirectOrUnassigned(name)) return;

    directory.set(lower(name), {
      id: getAgentId(row),
      name,
      email:
        row.email ||
        row.agent_email ||
        row.agentEmail ||
        "",
      phone:
        row.phone ||
        row.mobile ||
        row.whatsapp ||
        row.agent_phone ||
        row.agentPhone ||
        "",
      status:
        row.status ||
        row.account_status ||
        row.accountStatus ||
        "Recorded",
      organization:
        row.organization ||
        row.organization_name ||
        row.organizationName ||
        row.agency ||
        "",
      explicitPerformanceScore:
        nullableNumber(
          row.performance_score ??
            row.performanceScore ??
            row.score
        ),
      source: row,
    });
  });

  return directory;
}

export function buildAgentOSData(snapshot = {}) {
  const students = safeArray(
    snapshot.students ||
      snapshot.inquiries ||
      snapshot.agentStudents ||
      snapshot.leads
  );
  const applications = safeArray(
    snapshot.applications ||
      snapshot.studentApplications
  );
  const offers = safeArray(
    snapshot.offers ||
      snapshot.studentOffers
  );
  const casRecords = safeArray(
    snapshot.casRecords ||
      snapshot.cas
  );
  const visas = safeArray(
    snapshot.visas ||
      snapshot.studentVisas
  );
  const payments = safeArray(
    snapshot.payments ||
      snapshot.studentPayments
  );
  const commissions = safeArray(
    snapshot.commissions ||
      snapshot.agentCommissions
  );

  const confirmedDirectory = buildConfirmedAgentDirectory(snapshot);
  const agentMap = new Map();

  const ensureAgent = (name) => {
    const cleanName = safeString(name || "Direct / Unassigned").trim() || "Direct / Unassigned";
    const key = lower(cleanName);
    const confirmed = confirmedDirectory.get(key);

    if (!agentMap.has(key)) {
      agentMap.set(key, {
        id: confirmed?.id || null,
        name: cleanName,
        email: confirmed?.email || "",
        phone: confirmed?.phone || "",
        organization: confirmed?.organization || "",
        accountStatus: confirmed?.status || null,
        identityConfirmed: Boolean(confirmed),
        explicitPerformanceScore:
          confirmed?.explicitPerformanceScore ?? null,
        leads: 0,
        applications: 0,
        offers: 0,
        cas: 0,
        visas: 0,
        revenue: 0,
        commissionDue: 0,
        countries: new Map(),
        students: [],
      });
    }

    return agentMap.get(key);
  };

  // Confirmed agent accounts exist even when they have no student activity yet.
  confirmedDirectory.forEach((agent) => {
    ensureAgent(agent.name);
  });

  students.forEach((student) => {
    const agent = ensureAgent(getAgentName(student));
    agent.leads += 1;
    agent.students.push(student);

    const country = getCountry(student);
    agent.countries.set(
      country,
      (agent.countries.get(country) || 0) + 1
    );
  });

  applications.forEach((item) => {
    ensureAgent(getAgentName(item)).applications += 1;
  });

  offers.forEach((item) => {
    ensureAgent(getAgentName(item)).offers += 1;
  });

  casRecords.forEach((item) => {
    ensureAgent(getAgentName(item)).cas += 1;
  });

  visas.forEach((item) => {
    ensureAgent(getAgentName(item)).visas += 1;
  });

  payments.forEach((item) => {
    if (!hasRecordedAmount(item)) return;
    ensureAgent(getAgentName(item)).revenue += getAmount(item);
  });

  commissions.forEach((item) => {
    if (!hasRecordedAmount(item)) return;
    ensureAgent(getAgentName(item)).commissionDue += getAmount(item);
  });

  const agents = Array.from(agentMap.values())
    .map((agent) => ({
      ...agent,
      countries: Array.from(agent.countries.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),

      conversionRate: ratio(agent.applications, agent.leads),
      offerRate: ratio(agent.offers, agent.applications),
      visaRate: ratio(agent.visas, agent.cas),

      // Backward-compatible field for current child components.
      // It is ONLY populated from an explicit stored performance score.
      // No synthetic performance formula is created here.
      score: agent.explicitPerformanceScore,
    }))
    .sort((a, b) => {
      if (a.identityConfirmed !== b.identityConfirmed) {
        return a.identityConfirmed ? -1 : 1;
      }

      const aActivity =
        a.visas * 5 +
        a.cas * 4 +
        a.offers * 3 +
        a.applications * 2 +
        a.leads;

      const bActivity =
        b.visas * 5 +
        b.cas * 4 +
        b.offers * 3 +
        b.applications * 2 +
        b.leads;

      return bActivity - aActivity;
    });

  const agentStudents = students.map((student, index) => {
    const agentName = getAgentName(student);
    const confirmed = confirmedDirectory.has(lower(agentName));

    return {
      id: stableStudentId(student, index),
      name: getStudentName(student),
      email:
        student.email ||
        student.student_email ||
        student.studentEmail ||
        "",
      phone:
        student.phone ||
        student.mobile ||
        student.whatsapp ||
        "",
      agent: agentName,
      agentIdentityConfirmed:
        !isDirectOrUnassigned(agentName) && confirmed,
      stage: getStudentStage(student),
      country: getCountry(student),
      status:
        student.status ||
        student.application_status ||
        student.applicationStatus ||
        "Recorded",
      createdAt:
        student.created_at ||
        student.createdAt ||
        student.date ||
        null,
    };
  });

  const commissionAgents = new Set(
    commissions
      .filter(hasRecordedAmount)
      .map((item) => lower(getAgentName(item)))
  );

  const commissionRows = agents
    .filter((agent) => !isDirectOrUnassigned(agent.name))
    .map((agent) => {
      const hasCommissionEvidence = commissionAgents.has(
        lower(agent.name)
      );

      return {
        id: agent.id || agent.name,
        agent: agent.name,
        identityConfirmed: agent.identityConfirmed,
        leads: agent.leads,
        visas: agent.visas,
        revenue:
          agent.revenue > 0 ? agent.revenue : null,
        commissionDue: hasCommissionEvidence
          ? agent.commissionDue
          : null,
        hasCommissionEvidence,
        status: hasCommissionEvidence
          ? agent.commissionDue > 0
            ? "Recorded · pending review"
            : "Recorded · £0"
          : "Not recorded",
      };
    });

  const evidence = {
    agentIdentities: confirmedDirectory.size > 0,
    students: students.length > 0,
    applications: applications.length > 0,
    offers: offers.length > 0,
    cas: casRecords.length > 0,
    visas: visas.length > 0,
    payments: payments.some(hasRecordedAmount),
    commissions: commissions.some(hasRecordedAmount),
  };

  const evidenceCount = Object.values(evidence).filter(Boolean).length;

  const unassignedStudents = agentStudents.filter(
    (student) => isDirectOrUnassigned(student.agent)
  ).length;

  const observedButUnconfirmed = agents.filter(
    (agent) =>
      !isDirectOrUnassigned(agent.name) &&
      !agent.identityConfirmed &&
      agent.leads > 0
  ).length;

  return {
    students: agentStudents,
    agents,
    commissions: commissionRows,
    evidence,

    integrity: {
      connectedDomains: evidenceCount,
      totalDomains: Object.keys(evidence).length,
      commissionEvidence: evidence.commissions,
      revenueEvidence: evidence.payments,
      confirmedAgents: confirmedDirectory.size,
      unassignedStudents,
      observedButUnconfirmed,
    },

    totals: {
      agents: agents.filter(
        (agent) =>
          !isDirectOrUnassigned(agent.name) &&
          agent.identityConfirmed
      ).length,
      observedAgentSources: agents.filter(
        (agent) =>
          !isDirectOrUnassigned(agent.name) &&
          !agent.identityConfirmed
      ).length,
      students: students.length,
      applications: applications.length,
      offers: offers.length,
      cas: casRecords.length,
      visas: visas.length,
      revenue: payments.some(hasRecordedAmount)
        ? payments.reduce(
            (sum, item) =>
              sum +
              (hasRecordedAmount(item) ? getAmount(item) : 0),
            0
          )
        : null,
      commissionDue: commissions.some(hasRecordedAmount)
        ? commissionRows.reduce(
            (sum, item) =>
              sum + safeNumber(item.commissionDue),
            0
          )
        : null,
    },
  };
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex max-w-full rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}

function IntegrityCard({
  label,
  title,
  helper,
  tone,
  icon: Icon,
}) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <article
      className={`rounded-[1.35rem] border-[3px] p-4 ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
          <Icon size={16} />
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function AgentOSDashboard({
  snapshot,
  adminProfile,
  onRefresh,
  onSubmitLead,
  onCheckDuplicate,
}) {
  const [activeView, setActiveView] = useState("overview");

  const agentOS = useMemo(
    () => buildAgentOSData(snapshot || {}),
    [snapshot]
  );

  const views = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "submit", label: "Submit Lead", icon: Send },
    { key: "students", label: "Agent Students", icon: UsersRound },
    { key: "commissions", label: "Commission Claims", icon: CircleDollarSign },
    { key: "performance", label: "Agent Performance", icon: Target },
    { key: "management", label: "Agent Management", icon: UserRoundCog },
  ];

  const currentView =
    views.find((view) => view.key === activeView) || views[0];

  const integrity = agentOS.integrity || {};
  const totals = agentOS.totals || {};

  return (
    <div className="min-w-0 space-y-5 rounded-[2rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 shadow-[0_18px_50px_rgba(23,63,107,0.12)] sm:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <UserRoundCog size={12} />
                Agent Operations OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Individual agent operations
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Separate from Partner OS
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Agent Operations Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Operational workspace for individual agent identities, submitted
              students, attribution quality, commission claims and agent-level
              execution. Partner OS manages commercial relationships; this
              workspace manages the people and activity operating inside that
              channel.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">
              {currentView.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin agent-operations view for ${adminProfile.email}`
                : "Admin agent operations workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {totals.agents || 0} confirmed agents
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {totals.students || 0} students
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {views.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              aria-pressed={activeView === key}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                activeView === key
                  ? "border-[#F97316] bg-[#FF5A0A] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#F97316]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
          >
            <RefreshCw size={13} />
            Refresh Agents
          </button>
        ) : null}
      </nav>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Confirmed Agents"
              value={totals.agents || 0}
              helper={`${totals.observedAgentSources || 0} additional observed source name${
                totals.observedAgentSources === 1 ? "" : "s"
              } are not yet confirmed agent identities.`}
              tone="navy"
              icon={BadgeCheck}
              badge="Identity first"
            />

            <MetricCard
              label="Agent Students"
              value={totals.students || 0}
              helper={`${integrity.unassignedStudents || 0} student${
                integrity.unassignedStudents === 1 ? "" : "s"
              } currently have direct or missing agent attribution.`}
              tone={
                integrity.unassignedStudents > 0 ? "amber" : "green"
              }
              icon={UsersRound}
            />

            <MetricCard
              label="Applications"
              value={totals.applications || 0}
              helper={`${totals.offers || 0} offers · ${totals.cas || 0} CAS · ${totals.visas || 0} visa-stage records.`}
              tone="blue"
              icon={ClipboardCheck}
            />

            <MetricCard
              label="Commission Evidence"
              value={
                totals.commissionDue === null
                  ? "—"
                  : money(totals.commissionDue)
              }
              helper={
                totals.commissionDue === null
                  ? "Not recorded until real agent commission records exist."
                  : "Recorded commission amounts only; no percentage is estimated from revenue."
              }
              tone={
                totals.commissionDue === null ? "blue" : "violet"
              }
              icon={CircleDollarSign}
              badge={
                totals.commissionDue === null
                  ? "Not recorded"
                  : "Recorded"
              }
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <IntegrityCard
              label="Agent Identity"
              title={`${integrity.confirmedAgents || 0} confirmed identities`}
              helper="Observed source names are not automatically promoted into verified agent accounts."
              tone="green"
              icon={ShieldCheck}
            />

            <IntegrityCard
              label="Connected Evidence"
              title={`${integrity.connectedDomains || 0}/${integrity.totalDomains || 8} domains`}
              helper="Agent identities, students, applications, offers, CAS, visas, payments and commissions remain independently measurable."
              tone="blue"
              icon={Activity}
            />

            <IntegrityCard
              label="Attribution Queue"
              title={
                integrity.unassignedStudents
                  ? `${integrity.unassignedStudents} student${
                      integrity.unassignedStudents === 1 ? "" : "s"
                    } need attribution`
                  : "No unassigned students"
              }
              helper={`${integrity.observedButUnconfirmed || 0} observed agent source name${
                integrity.observedButUnconfirmed === 1 ? "" : "s"
              } also lack a confirmed agent identity.`}
              tone="amber"
              icon={ShieldAlert}
            />
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <AgentStudentsWorkspace agentOS={agentOS} compact />
            <AgentCommissionPanel agentOS={agentOS} compact />
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <AgentPerformancePanel agentOS={agentOS} compact />
            <AgentManagementDashboard agentOS={agentOS} compact />
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Architecture Boundary
                </p>

                <p className="mt-1 font-black text-[#10233F]">
                  Partner OS manages the relationship. Agent OS manages the operator.
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  University contracts, partner-level commercial agreements and
                  relationship analytics stay in Partner OS. Agent lead
                  submission, agent-attributed students, individual agent
                  commission evidence and agent-account operations belong here.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {activeView === "submit" ? (
        <AgentLeadSubmissionForm
          adminProfile={adminProfile}
          onSubmitLead={onSubmitLead}
          onCheckDuplicate={onCheckDuplicate}
          existingStudents={safeArray(snapshot?.students)}
        />
      ) : null}

      {activeView === "students" ? (
        <AgentStudentsWorkspace agentOS={agentOS} />
      ) : null}

      {activeView === "commissions" ? (
        <AgentCommissionPanel agentOS={agentOS} />
      ) : null}

      {activeView === "performance" ? (
        <AgentPerformancePanel agentOS={agentOS} />
      ) : null}

      {activeView === "management" ? (
        <AgentManagementDashboard agentOS={agentOS} />
      ) : null}
    </div>
  );
}
