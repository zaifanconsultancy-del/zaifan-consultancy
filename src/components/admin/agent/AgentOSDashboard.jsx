import React, { useMemo, useState } from "react";
import AgentLeadSubmissionForm from "./AgentLeadSubmissionForm";
import AgentStudentsWorkspace from "./AgentStudentsWorkspace";
import AgentCommissionPanel from "./AgentCommissionPanel";
import AgentPerformancePanel from "./AgentPerformancePanel";
import AgentManagementDashboard from "./AgentManagementDashboard";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function getAgentName(record = {}) {
  return (
    record.agent_name ||
    record.partner_name ||
    record.referrer_name ||
    record.source_agent ||
    record.created_by_agent ||
    record.agent ||
    "Direct / Unassigned"
  );
}

function getStudentStage(record = {}) {
  const raw = lower(record.stage || record.status || record.application_status || record.journey_stage);

  if (raw.includes("visa")) return "Visa";
  if (raw.includes("cas")) return "CAS";
  if (raw.includes("offer")) return "Offer";
  if (raw.includes("application") || raw.includes("applied")) return "Application";
  if (raw.includes("planning") || raw.includes("university")) return "Planning";
  return "Lead";
}

function getStudentName(record = {}) {
  return record.student_name || record.full_name || record.name || record.lead_name || record.email || "Student";
}

function getCountry(record = {}) {
  return record.destination_country || record.country || record.study_country || record.preferred_country || "Unknown";
}

function getAmount(record = {}) {
  const value = Number(record.amount || record.commission_amount || record.invoice_amount || record.paid_amount || 0);
  return Number.isFinite(value) ? value : 0;
}

export function buildAgentOSData(snapshot = {}) {
  const students = safeArray(snapshot.students || snapshot.inquiries || snapshot.agentStudents || snapshot.leads);
  const applications = safeArray(snapshot.applications || snapshot.studentApplications);
  const offers = safeArray(snapshot.offers || snapshot.studentOffers);
  const casRecords = safeArray(snapshot.casRecords || snapshot.cas);
  const visas = safeArray(snapshot.visas || snapshot.studentVisas);
  const payments = safeArray(snapshot.payments || snapshot.studentPayments);
  const commissions = safeArray(snapshot.commissions || snapshot.agentCommissions);

  const agentMap = new Map();

  const ensureAgent = (name) => {
    const key = name || "Direct / Unassigned";
    if (!agentMap.has(key)) {
      agentMap.set(key, {
        name: key,
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

  students.forEach((student) => {
    const agent = ensureAgent(getAgentName(student));
    agent.leads += 1;
    agent.students.push(student);
    const country = getCountry(student);
    agent.countries.set(country, (agent.countries.get(country) || 0) + 1);
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
    ensureAgent(getAgentName(item)).revenue += getAmount(item);
  });

  commissions.forEach((item) => {
    ensureAgent(getAgentName(item)).commissionDue += getAmount(item);
  });

  const agents = Array.from(agentMap.values())
    .map((agent) => ({
      ...agent,
      countries: Array.from(agent.countries.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      conversionRate: agent.leads ? Math.round((agent.applications / agent.leads) * 100) : 0,
      offerRate: agent.applications ? Math.round((agent.offers / agent.applications) * 100) : 0,
      visaRate: agent.cas ? Math.round((agent.visas / agent.cas) * 100) : 0,
      score: agent.visas * 50 + agent.cas * 30 + agent.offers * 18 + agent.applications * 10 + agent.revenue / 1000,
    }))
    .sort((a, b) => b.score - a.score);

  const agentStudents = students.map((student) => ({
    id: student.id || student.student_id || student.email || Math.random(),
    name: getStudentName(student),
    email: student.email || student.student_email || "",
    phone: student.phone || student.mobile || student.whatsapp || "",
    agent: getAgentName(student),
    stage: getStudentStage(student),
    country: getCountry(student),
    status: student.status || student.application_status || "Active",
    createdAt: student.created_at || student.createdAt || student.date,
  }));

  const commissionRows = agents.map((agent) => ({
    id: agent.name,
    agent: agent.name,
    leads: agent.leads,
    visas: agent.visas,
    revenue: agent.revenue,
    commissionDue: agent.commissionDue || Math.round(agent.revenue * 0.08),
    status: agent.commissionDue > 0 ? "Pending" : agent.visas > 0 ? "Estimate" : "No commission",
  }));

  return {
    students: agentStudents,
    agents,
    commissions: commissionRows,
    totals: {
      agents: agents.length,
      students: students.length,
      applications: applications.length,
      offers: offers.length,
      cas: casRecords.length,
      visas: visas.length,
      revenue: payments.reduce((sum, item) => sum + getAmount(item), 0),
      commissionDue: commissionRows.reduce((sum, item) => sum + getAmount(item), 0),
    },
  };
}

function MetricCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AgentOSDashboard({ snapshot, adminProfile, onRefresh }) {
  const [activeView, setActiveView] = useState("overview");
  const agentOS = useMemo(() => buildAgentOSData(snapshot || {}), [snapshot]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "submit", label: "Submit Lead" },
    { key: "students", label: "Agent Students" },
    { key: "commissions", label: "Commissions" },
    { key: "performance", label: "Performance" },
    { key: "management", label: "Management" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-white shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Agent / Partner OS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Partner Growth Command</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Manage education agents, partner-submitted students, commissions, conversion quality, country demand, and agent performance.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-slate-500">Admin view for {adminProfile.email}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                activeView === view.key
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {view.label}
            </button>
          ))}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20"
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Agents" value={agentOS.totals.agents} helper="active partners" tone="cyan" />
            <MetricCard label="Students" value={agentOS.totals.students} helper="partner leads" tone="violet" />
            <MetricCard label="Applications" value={agentOS.totals.applications} helper="submitted" tone="amber" />
            <MetricCard label="Offers" value={agentOS.totals.offers} helper="generated" tone="emerald" />
            <MetricCard label="Visas" value={agentOS.totals.visas} helper="successful" tone="emerald" />
            <MetricCard label="Commission" value={money(agentOS.totals.commissionDue)} helper="estimated due" tone="rose" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <AgentPerformancePanel agentOS={agentOS} compact />
            <AgentCommissionPanel agentOS={agentOS} compact />
          </div>

          <AgentStudentsWorkspace agentOS={agentOS} compact />
        </>
      ) : null}

      {activeView === "submit" ? <AgentLeadSubmissionForm adminProfile={adminProfile} /> : null}
      {activeView === "students" ? <AgentStudentsWorkspace agentOS={agentOS} /> : null}
      {activeView === "commissions" ? <AgentCommissionPanel agentOS={agentOS} /> : null}
      {activeView === "performance" ? <AgentPerformancePanel agentOS={agentOS} /> : null}
      {activeView === "management" ? <AgentManagementDashboard agentOS={agentOS} /> : null}
    </div>
  );
}
