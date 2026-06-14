import React, { useMemo, useState } from "react";
import AuditCenter from "./AuditCenter";
import PolicyManagementPanel from "./PolicyManagementPanel";
import RiskRegisterPanel from "./RiskRegisterPanel";
import DataProtectionPanel from "./DataProtectionPanel";
import ComplianceReportingPanel from "./ComplianceReportingPanel";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSeverity(record = {}) {
  const raw = lower(record.severity || record.risk_level || record.priority || record.level);
  if (raw.includes("critical")) return "Critical";
  if (raw.includes("high")) return "High";
  if (raw.includes("medium")) return "Medium";
  if (raw.includes("low")) return "Low";
  return "Medium";
}

function getStatus(record = {}) {
  return record.status || record.state || "Open";
}

function isOpen(record = {}) {
  const status = lower(getStatus(record));
  return !status.includes("closed") && !status.includes("resolved") && !status.includes("complete") && !status.includes("approved");
}

function isOverdue(record = {}) {
  const due = record.due_date || record.dueAt || record.review_due_at || record.next_review_at;
  if (!due) return false;
  const time = new Date(due).getTime();
  return Number.isFinite(time) && time < Date.now() && isOpen(record);
}

function getCategory(record = {}) {
  return record.category || record.type || record.area || record.domain || "General";
}

function buildComplianceOSData(snapshot = {}) {
  const audits = safeArray(snapshot.audits || snapshot.auditLogs || snapshot.activityLogs || snapshot.logs);
  const policies = safeArray(snapshot.policies || snapshot.companyPolicies || snapshot.policyDocuments);
  const risks = safeArray(snapshot.risks || snapshot.riskRegister || snapshot.complianceRisks);
  const incidents = safeArray(snapshot.incidents || snapshot.securityIncidents || snapshot.dataIncidents);
  const documents = safeArray(snapshot.documents || snapshot.studentDocuments || snapshot.companyDocuments);
  const users = safeArray(snapshot.users || snapshot.staff || snapshot.employees || snapshot.counselors);
  const consents = safeArray(snapshot.consents || snapshot.dataConsents || snapshot.privacyConsents);
  const accessLogs = safeArray(snapshot.accessLogs || snapshot.loginLogs || snapshot.sessions);

  const auditRows = audits.map((audit, index) => ({
    id: audit.id || `audit-${index}`,
    actor: audit.actor || audit.user_email || audit.email || audit.created_by || "System",
    action: audit.action || audit.event || audit.activity || "Activity",
    category: getCategory(audit),
    status: audit.status || "Logged",
    createdAt: audit.created_at || audit.createdAt || audit.timestamp || audit.date,
    severity: getSeverity(audit),
    description: audit.description || audit.details || audit.message || "Audit event captured.",
  }));

  const policyRows = policies.map((policy, index) => ({
    id: policy.id || `policy-${index}`,
    title: policy.title || policy.name || "Policy",
    category: getCategory(policy),
    owner: policy.owner || policy.created_by || "Admin",
    status: policy.status || "Active",
    version: policy.version || "1.0",
    nextReview: policy.next_review_at || policy.review_due_at || policy.updated_at,
    acknowledgementRate: number(policy.acknowledgement_rate || policy.acceptance_rate || policy.read_percent, 0),
  }));

  const riskRows = risks.map((risk, index) => ({
    id: risk.id || `risk-${index}`,
    title: risk.title || risk.name || risk.risk || "Compliance Risk",
    category: getCategory(risk),
    severity: getSeverity(risk),
    status: getStatus(risk),
    owner: risk.owner || risk.assigned_to || "Admin",
    dueDate: risk.due_date || risk.dueAt || risk.target_date,
    mitigation: risk.mitigation || risk.action_plan || risk.notes || "Mitigation not documented yet.",
  }));

  const incidentRows = incidents.map((incident, index) => ({
    id: incident.id || `incident-${index}`,
    title: incident.title || incident.name || incident.incident || "Incident",
    category: getCategory(incident),
    severity: getSeverity(incident),
    status: getStatus(incident),
    reportedAt: incident.reported_at || incident.created_at || incident.date,
    owner: incident.owner || incident.assigned_to || "Admin",
  }));

  const dataRows = [
    ...documents.map((doc, index) => ({
      id: doc.id || `document-${index}`,
      title: doc.document_name || doc.name || doc.title || "Document",
      type: "Document",
      category: doc.category || doc.document_type || "Student Data",
      owner: doc.student_name || doc.owner || "Student",
      status: doc.status || "Stored",
      sensitivity: lower(doc.document_name || doc.name || "").includes("passport") || lower(doc.document_name || doc.name || "").includes("bank") ? "High" : "Medium",
    })),
    ...consents.map((consent, index) => ({
      id: consent.id || `consent-${index}`,
      title: consent.title || consent.consent_type || "Consent Record",
      type: "Consent",
      category: consent.category || "Privacy",
      owner: consent.student_name || consent.email || "Student",
      status: consent.status || "Captured",
      sensitivity: "High",
    })),
  ];

  const accessRows = accessLogs.map((log, index) => ({
    id: log.id || `access-${index}`,
    user: log.user_email || log.email || log.user || "User",
    role: log.role || log.user_role || "User",
    action: log.action || log.event || "Access",
    status: log.status || "Logged",
    createdAt: log.created_at || log.createdAt || log.timestamp,
    risk: getSeverity(log),
  }));

  const openRisks = riskRows.filter(isOpen).length;
  const overdueRisks = riskRows.filter(isOverdue).length;
  const criticalRisks = riskRows.filter((risk) => risk.severity === "Critical" || risk.severity === "High").length;
  const openIncidents = incidentRows.filter(isOpen).length;
  const overduePolicies = policyRows.filter((policy) => {
    const time = new Date(policy.nextReview || 0).getTime();
    return Number.isFinite(time) && time < Date.now();
  }).length;

  const policyHealth = policyRows.length
    ? Math.round(policyRows.reduce((sum, policy) => sum + number(policy.acknowledgementRate), 0) / policyRows.length)
    : 70;

  const auditHealth = auditRows.length ? 85 : 65;
  const dataHealth = dataRows.length ? Math.max(50, 100 - dataRows.filter((item) => item.sensitivity === "High" && lower(item.status).includes("missing")).length * 8) : 70;

  const complianceScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (policyHealth + auditHealth + dataHealth) / 3 -
          criticalRisks * 3 -
          overdueRisks * 4 -
          openIncidents * 5 -
          overduePolicies * 3
      )
    )
  );

  return {
    auditRows,
    policyRows,
    riskRows,
    incidentRows,
    dataRows,
    accessRows,
    users,
    totals: {
      audits: auditRows.length,
      policies: policyRows.length,
      risks: riskRows.length,
      openRisks,
      criticalRisks,
      overdueRisks,
      incidents: incidentRows.length,
      openIncidents,
      dataRecords: dataRows.length,
      accessLogs: accessRows.length,
      overduePolicies,
      complianceScore,
      policyHealth,
      auditHealth,
      dataHealth,
    },
  };
}

function MetricCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function ComplianceOSDashboard({ snapshot, adminProfile, onRefresh }) {
  const [activeView, setActiveView] = useState("overview");
  const compliance = useMemo(() => buildComplianceOSData(snapshot || {}), [snapshot]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "audit", label: "Audit" },
    { key: "policies", label: "Policies" },
    { key: "risks", label: "Risk Register" },
    { key: "data", label: "Data Protection" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-white shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-300">Compliance OS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Audit, Risk & Data Protection</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Compliance control layer for audit trails, policies, risk register, incidents, data protection, and compliance reporting.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-slate-500">Compliance view for {adminProfile.email}</p> : null}
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
            <button type="button" onClick={onRefresh} className="rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-xs font-black text-rose-100 hover:bg-rose-400/20">
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Score" value={`${compliance.totals.complianceScore}%`} helper="compliance health" tone={compliance.totals.complianceScore >= 75 ? "emerald" : compliance.totals.complianceScore >= 50 ? "amber" : "rose"} />
            <MetricCard label="Audit Logs" value={compliance.totals.audits} helper="tracked events" tone="cyan" />
            <MetricCard label="Policies" value={compliance.totals.policies} helper={`${compliance.totals.overduePolicies} overdue`} tone="violet" />
            <MetricCard label="Open Risks" value={compliance.totals.openRisks} helper={`${compliance.totals.criticalRisks} high/critical`} tone={compliance.totals.criticalRisks ? "rose" : "emerald"} />
            <MetricCard label="Incidents" value={compliance.totals.openIncidents} helper="open incidents" tone={compliance.totals.openIncidents ? "rose" : "emerald"} />
            <MetricCard label="Data Records" value={compliance.totals.dataRecords} helper="privacy/data assets" tone="amber" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <RiskRegisterPanel compliance={compliance} compact />
            <DataProtectionPanel compliance={compliance} compact />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <PolicyManagementPanel compliance={compliance} compact />
            <ComplianceReportingPanel compliance={compliance} compact />
          </div>
        </>
      ) : null}

      {activeView === "audit" ? <AuditCenter compliance={compliance} /> : null}
      {activeView === "policies" ? <PolicyManagementPanel compliance={compliance} /> : null}
      {activeView === "risks" ? <RiskRegisterPanel compliance={compliance} /> : null}
      {activeView === "data" ? <DataProtectionPanel compliance={compliance} /> : null}
      {activeView === "reports" ? <ComplianceReportingPanel compliance={compliance} /> : null}
    </div>
  );
}

export { buildComplianceOSData };
