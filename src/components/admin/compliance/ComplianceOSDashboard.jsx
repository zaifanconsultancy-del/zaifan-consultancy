// ComplianceOSDashboard V3 EXTREME — Zaifan Compliance OS
// Full replacement for:
// src/components/admin/compliance/ComplianceOSDashboard.jsx
//
// Core rules:
// - Compliance never guesses.
// - Missing evidence stays "Not assessed", "Unknown", or "Not connected".
// - No synthetic health percentages.
// - No default "Active" policy, "Open" risk, or fake owner.
// - Derived totals are allowed only when they come from supplied records.
// - Visual system matches the Zaifan Admin OS: cream, navy, orange, strong borders.

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  Database,
  FileSearch,
  Info,
  LockKeyhole,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

import AuditCenter from "./AuditCenter";
import PolicyManagementPanel from "./PolicyManagementPanel";
import RiskRegisterPanel from "./RiskRegisterPanel";
import DataProtectionPanel from "./DataProtectionPanel";
import ComplianceReportingPanel from "./ComplianceReportingPanel";

const VIEWS = [
  { key: "overview", label: "Overview", icon: ShieldCheck },
  { key: "audit", label: "Audit", icon: Activity },
  { key: "policies", label: "Policies", icon: BookOpenCheck },
  { key: "risks", label: "Risk Register", icon: ShieldAlert },
  { key: "data", label: "Data Protection", icon: LockKeyhole },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSeverity(record = {}) {
  const raw = normalize(
    record.severity ||
      record.risk_level ||
      record.priority ||
      record.level ||
      ""
  );

  if (!raw) return "Unknown";
  if (raw.includes("critical")) return "Critical";
  if (raw.includes("high")) return "High";
  if (raw.includes("medium")) return "Medium";
  if (raw.includes("low")) return "Low";
  return "Unknown";
}

function getStatus(record = {}) {
  const raw =
    record.status ??
    record.state ??
    record.review_status ??
    record.policy_status ??
    record.incident_status ??
    "";

  return hasValue(raw) ? String(raw).trim() : "Unknown";
}

function isResolvedLike(record = {}) {
  const status = normalize(getStatus(record));

  return [
    "closed",
    "resolved",
    "complete",
    "completed",
    "approved",
    "archived",
    "dismissed",
  ].some((token) => status.includes(token));
}

function isOpenLike(record = {}) {
  const status = normalize(getStatus(record));
  if (!status || status === "unknown") return false;
  return !isResolvedLike(record);
}

function isOverdueDate(value) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function getCategory(record = {}) {
  const raw =
    record.category ??
    record.type ??
    record.area ??
    record.domain ??
    record.module ??
    "";

  return hasValue(raw) ? String(raw).trim() : "Unclassified";
}

function getOwner(record = {}) {
  const raw =
    record.owner ??
    record.assigned_to ??
    record.created_by ??
    record.user_email ??
    record.email ??
    record.student_name ??
    "";

  return hasValue(raw) ? String(raw).trim() : "Unassigned";
}

function isDevelopmentArtifact(record = {}) {
  const text = normalize(
    [
      record.document_name,
      record.name,
      record.title,
      record.file_name,
      record.filename,
      record.file_path,
      record.file_url,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (!text) return false;

  const codeFilePattern =
    /\.(jsx?|tsx?|css|scss|sass|less|html?|json|md|sql|py|java|c|cpp|cs|php|rb|go|rs|vue|svelte|txt)(\b|$)/i;

  const developmentTerms = [
    "component",
    "dashboard",
    "panel",
    "modal",
    "service",
    "hook",
    "utils",
    "utility",
    "timeoutfix",
    "unlinkandactionfeedback",
    "adminpage",
    "studentdocumentspanel",
    "universitymanagementpanel",
    "pasted code",
  ];

  return (
    codeFilePattern.test(text) ||
    developmentTerms.some((term) => text.includes(term))
  );
}

function classifySensitivity(record = {}) {
  const explicit =
    record.sensitivity ||
    record.data_sensitivity ||
    record.classification ||
    record.security_classification;

  if (hasValue(explicit)) {
    const raw = normalize(explicit);
    if (raw.includes("critical") || raw.includes("restricted")) return "Critical";
    if (raw.includes("high") || raw.includes("confidential")) return "High";
    if (raw.includes("medium") || raw.includes("internal")) return "Medium";
    if (raw.includes("low") || raw.includes("public")) return "Low";
  }

  if (isDevelopmentArtifact(record)) return "Unclassified";

  const typeText = normalize(
    [record.document_type, record.category, record.type]
      .filter(Boolean)
      .join(" ")
  );

  const criticalTypes = [
    "passport",
    "cnic",
    "national id",
    "identity card",
    "bank statement",
    "financial statement",
    "medical",
    "police clearance",
    "police certificate",
    "birth certificate",
    "visa",
  ];

  const highTypes = [
    "academic transcript",
    "transcript",
    "degree",
    "certificate",
    "offer letter",
    "cas",
    "personal statement",
    "resume",
    "cv",
  ];

  if (criticalTypes.some((term) => typeText.includes(term))) return "Critical";
  if (highTypes.some((term) => typeText.includes(term))) return "High";

  return "Unclassified";
}

function buildComplianceOSData(snapshot = {}) {
  const audits = safeArray(
    snapshot.audits ||
      snapshot.auditLogs ||
      snapshot.activityLogs ||
      snapshot.logs
  );
  const policies = safeArray(
    snapshot.policies ||
      snapshot.companyPolicies ||
      snapshot.policyDocuments
  );
  const risks = safeArray(
    snapshot.risks ||
      snapshot.riskRegister ||
      snapshot.complianceRisks
  );
  const incidents = safeArray(
    snapshot.incidents ||
      snapshot.securityIncidents ||
      snapshot.dataIncidents
  );
  const documents = safeArray(
    snapshot.documents ||
      snapshot.studentDocuments ||
      snapshot.companyDocuments
  );
  const users = safeArray(
    snapshot.users ||
      snapshot.staff ||
      snapshot.employees ||
      snapshot.counselors
  );
  const consents = safeArray(
    snapshot.consents ||
      snapshot.dataConsents ||
      snapshot.privacyConsents
  );
  const accessLogs = safeArray(
    snapshot.accessLogs ||
      snapshot.loginLogs ||
      snapshot.sessions
  );

  const auditRows = audits.map((audit, index) => ({
    id: audit.id || `audit-${index}`,
    actor: hasValue(audit.actor || audit.user_email || audit.email || audit.created_by)
      ? String(audit.actor || audit.user_email || audit.email || audit.created_by).trim()
      : "Unknown actor",
    action: hasValue(audit.action || audit.event || audit.activity)
      ? String(audit.action || audit.event || audit.activity).trim()
      : "Unclassified event",
    category: getCategory(audit),
    status: getStatus(audit),
    createdAt:
      audit.created_at ||
      audit.createdAt ||
      audit.timestamp ||
      audit.occurred_at ||
      audit.occurredAt ||
      audit.event_at ||
      audit.eventAt ||
      audit.logged_at ||
      audit.loggedAt ||
      audit.executed_at ||
      audit.executedAt ||
      audit.updated_at ||
      audit.updatedAt ||
      audit.date ||
      null,
    severity: getSeverity(audit),
    description: hasValue(audit.description || audit.details || audit.message)
      ? String(audit.description || audit.details || audit.message).trim()
      : "No event detail supplied.",
    source: audit.source || audit.table_name || audit.module || "",
  }));

  const policyRows = policies.map((policy, index) => ({
    id: policy.id || `policy-${index}`,
    title: hasValue(policy.title || policy.name)
      ? String(policy.title || policy.name).trim()
      : "Untitled policy",
    category: getCategory(policy),
    owner: getOwner(policy),
    status: getStatus(policy),
    version: hasValue(policy.version) ? String(policy.version).trim() : "Unknown",
    nextReview:
      policy.next_review_at ||
      policy.review_due_at ||
      policy.review_date ||
      null,
    acknowledgementRate: safeNumber(
      policy.acknowledgement_rate ??
        policy.acceptance_rate ??
        policy.read_percent
    ),
    source: policy.source || "",
  }));

  const riskRows = risks.map((risk, index) => ({
    id: risk.id || `risk-${index}`,
    title: hasValue(risk.title || risk.name || risk.risk)
      ? String(risk.title || risk.name || risk.risk).trim()
      : "Untitled compliance risk",
    category: getCategory(risk),
    severity: getSeverity(risk),
    status: getStatus(risk),
    owner: getOwner(risk),
    dueDate:
      risk.due_date ||
      risk.dueAt ||
      risk.target_date ||
      risk.mitigation_due_at ||
      null,
    mitigation: hasValue(risk.mitigation || risk.action_plan || risk.notes)
      ? String(risk.mitigation || risk.action_plan || risk.notes).trim()
      : "Mitigation not documented.",
    source: risk.source || "",
  }));

  const incidentRows = incidents.map((incident, index) => ({
    id: incident.id || `incident-${index}`,
    title: hasValue(incident.title || incident.name || incident.incident)
      ? String(incident.title || incident.name || incident.incident).trim()
      : "Untitled incident",
    category: getCategory(incident),
    severity: getSeverity(incident),
    status: getStatus(incident),
    reportedAt:
      incident.reported_at ||
      incident.created_at ||
      incident.date ||
      null,
    owner: getOwner(incident),
    source: incident.source || "",
  }));

  const documentRows = documents
    .filter((doc) => !isDevelopmentArtifact(doc))
    .map((doc, index) => ({
      id: doc.id || `document-${index}`,
      title: hasValue(doc.document_name || doc.name || doc.title)
        ? String(doc.document_name || doc.name || doc.title).trim()
        : "Unnamed document",
      type: "Document",
      category: hasValue(doc.category || doc.document_type)
        ? String(doc.category || doc.document_type).trim()
        : "Unclassified",
      owner: getOwner(doc),
      status: getStatus(doc),
      sensitivity: classifySensitivity(doc),
      source: doc.source || "Student documents",
    }));

  const consentRows = consents.map((consent, index) => ({
    id: consent.id || `consent-${index}`,
    title: hasValue(consent.title || consent.consent_type)
      ? String(consent.title || consent.consent_type).trim()
      : "Consent record",
    type: "Consent",
    category: hasValue(consent.category)
      ? String(consent.category).trim()
      : "Privacy",
    owner: getOwner(consent),
    status: getStatus(consent),
    sensitivity: classifySensitivity({
      ...consent,
      sensitivity:
        consent.sensitivity ||
        consent.data_sensitivity ||
        consent.classification ||
        consent.security_classification,
    }),
    source: consent.source || "Consent records",
  }));

  const dataRows = [...documentRows, ...consentRows];

  const accessRows = accessLogs.map((log, index) => ({
    id: log.id || `access-${index}`,
    user: hasValue(log.user_email || log.email || log.user)
      ? String(log.user_email || log.email || log.user).trim()
      : "Unknown user",
    role: hasValue(log.role || log.user_role)
      ? String(log.role || log.user_role).trim()
      : "Unknown role",
    action: hasValue(log.action || log.event)
      ? String(log.action || log.event).trim()
      : "Unclassified access event",
    status: getStatus(log),
    createdAt:
      log.created_at ||
      log.createdAt ||
      log.timestamp ||
      null,
    risk: getSeverity(log),
    source: log.source || "",
  }));

  const openRisks = riskRows.filter(isOpenLike).length;
  const overdueRisks = riskRows.filter(
    (risk) => isOpenLike(risk) && isOverdueDate(risk.dueDate)
  ).length;
  const criticalRisks = riskRows.filter((risk) =>
    ["Critical", "High"].includes(risk.severity)
  ).length;
  const openIncidents = incidentRows.filter(isOpenLike).length;
  const overduePolicies = policyRows.filter((policy) =>
    isOverdueDate(policy.nextReview)
  ).length;
  const acknowledgedPolicies = policyRows.filter(
    (policy) =>
      Number.isFinite(policy.acknowledgementRate) &&
      policy.acknowledgementRate >= 80
  ).length;
  const classifiedData = dataRows.filter(
    (item) => item.sensitivity !== "Unclassified"
  ).length;
  const criticalData = dataRows.filter((item) =>
    ["Critical", "High"].includes(item.sensitivity)
  ).length;

  const evidenceDomains = {
    audit: auditRows.length > 0,
    policies: policyRows.length > 0,
    risks: riskRows.length > 0,
    incidents: incidentRows.length > 0,
    data: dataRows.length > 0,
    access: accessRows.length > 0,
  };

  const connectedDomainCount = Object.values(evidenceDomains).filter(Boolean).length;

  const verification = {
    score: null,
    status:
      connectedDomainCount === 0
        ? "Not assessed"
        : connectedDomainCount < 3
          ? "Partial evidence"
          : "Evidence available",
    reason:
      connectedDomainCount === 0
        ? "No compliance evidence sources are connected."
        : connectedDomainCount < 3
          ? "Some evidence exists, but there is not enough coverage for a trustworthy compliance score."
          : "Evidence sources are available, but no synthetic compliance percentage is generated.",
  };

  return {
    auditRows,
    policyRows,
    riskRows,
    incidentRows,
    dataRows,
    accessRows,
    users,
    evidenceDomains,
    verification,
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
      acknowledgedPolicies,
      classifiedData,
      criticalData,
      connectedDomainCount,
    },
  };
}

export default function ComplianceOSDashboard({
  snapshot = {},
  adminProfile = null,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState("overview");
  const [query, setQuery] = useState("");

  const compliance = useMemo(
    () => buildComplianceOSData(snapshot || {}),
    [snapshot]
  );

  const queryText = normalize(query);

  const evidenceRows = [
    {
      id: "audit",
      label: "Audit Trail",
      connected: compliance.evidenceDomains.audit,
      count: compliance.totals.audits,
      icon: Activity,
    },
    {
      id: "policies",
      label: "Policies",
      connected: compliance.evidenceDomains.policies,
      count: compliance.totals.policies,
      icon: BookOpenCheck,
    },
    {
      id: "risks",
      label: "Risk Register",
      connected: compliance.evidenceDomains.risks,
      count: compliance.totals.risks,
      icon: ShieldAlert,
    },
    {
      id: "incidents",
      label: "Incidents",
      connected: compliance.evidenceDomains.incidents,
      count: compliance.totals.incidents,
      icon: AlertTriangle,
    },
    {
      id: "data",
      label: "Data Inventory",
      connected: compliance.evidenceDomains.data,
      count: compliance.totals.dataRecords,
      icon: Database,
    },
    {
      id: "access",
      label: "Access Logs",
      connected: compliance.evidenceDomains.access,
      count: compliance.totals.accessLogs,
      icon: Users,
    },
  ].filter((item) =>
    normalize(`${item.label} ${item.connected ? "connected" : "not connected"}`)
      .includes(queryText)
  );

  return (
    <section className="space-y-5 p-3 sm:p-5">
      <header className="overflow-hidden rounded-[1.9rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_18px_48px_rgba(23,36,61,0.08)]">
        <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={ShieldCheck} label="Compliance OS" />
              <HeaderChip icon={Scale} label="Evidence First" />
              <HeaderChip
                icon={Database}
                label={`${compliance.totals.connectedDomainCount}/6 evidence domains`}
              />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  Audit, Risk & Data Protection
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Governance workspace for audit trails, policies, compliance
                  risks, incidents, privacy evidence and reporting readiness.
                  Missing evidence is never converted into a fake compliance
                  score.
                </p>

                {adminProfile?.email ? (
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.08em] text-orange-200">
                    Compliance view: {adminProfile.email}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
                <DarkMetric
                  label="Evidence"
                  value={`${compliance.totals.connectedDomainCount}/6`}
                />
                <DarkMetric
                  label="Open Risks"
                  value={compliance.totals.openRisks}
                />
                <DarkMetric
                  label="High/Critical"
                  value={compliance.totals.criticalRisks}
                />
                <DarkMetric
                  label="Open Incidents"
                  value={compliance.totals.openIncidents}
                />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Compliance assessment
                </p>

                <p className="mt-3 text-3xl font-black leading-tight text-white">
                  {compliance.verification.status}
                </p>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.09em] text-white">
                  no synthetic score
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <ClipboardCheck size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                {compliance.verification.reason}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFF8EF] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)_auto]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {VIEWS.map((view) => {
              const Icon = view.icon;
              const active = activeView === view.key;

              return (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => setActiveView(view.key)}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                    active
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  <Icon size={14} />
                  {view.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search evidence domains..."
              aria-label="Search Compliance OS"
              className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {typeof onRefresh === "function" ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-5 text-xs font-black text-white transition hover:bg-orange-600"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          ) : (
            <div className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-100 px-4 text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
              Refresh not connected
            </div>
          )}
        </div>
      </div>

      {activeView === "overview" ? (
        <Overview
          compliance={compliance}
          evidenceRows={evidenceRows}
          onOpenView={setActiveView}
        />
      ) : null}

      {activeView === "audit" ? <AuditCenter compliance={compliance} /> : null}
      {activeView === "policies" ? <PolicyManagementPanel compliance={compliance} /> : null}
      {activeView === "risks" ? <RiskRegisterPanel compliance={compliance} /> : null}
      {activeView === "data" ? <DataProtectionPanel compliance={compliance} /> : null}
      {activeView === "reports" ? <ComplianceReportingPanel compliance={compliance} /> : null}

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#123865]" />
            <div>
              <p className="font-black text-[#10233F]">Compliance integrity</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Unknown fields remain unknown. Missing evidence does not become
                a healthy percentage or approved status.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <FileSearch size={18} className="mt-0.5 shrink-0 text-orange-700" />
            <div>
              <p className="font-black text-[#10233F]">Evidence before scoring</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                A real compliance score should only be introduced after Zaifan
                defines measurable controls and connects evidence for them.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function Overview({ compliance, evidenceRows, onOpenView }) {
  const totals = compliance.totals;
  const pressure =
    totals.criticalRisks +
    totals.overdueRisks +
    totals.openIncidents +
    totals.overduePolicies;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Activity}
          label="Audit Events"
          value={totals.audits}
          detail="Actual audit/activity evidence currently supplied."
          tone="blue"
        />
        <MetricCard
          icon={BookOpenCheck}
          label="Policies"
          value={totals.policies}
          detail={`${totals.overduePolicies} review dates currently overdue.`}
          tone="navy"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Risk Pressure"
          value={pressure}
          detail="High/critical risks, overdue mitigations, incidents and overdue policy reviews."
          tone={pressure ? "red" : "green"}
        />
        <MetricCard
          icon={Database}
          label="Data Records"
          value={totals.dataRecords}
          detail={`${totals.classifiedData} records have a sensitivity classification.`}
          tone="orange"
        />
      </div>

      <InlineNotice
        icon={Info}
        title="Compliance score intentionally disabled"
        detail="The old dashboard invented 65–85% health values when evidence was missing. This version reports evidence coverage instead."
      />

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Evidence Coverage"
          title="Connected Compliance Domains"
          description="Shows which compliance evidence families are actually present."
          icon={Database}
          count={totals.connectedDomainCount}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {evidenceRows.length ? (
            evidenceRows.map((item) => (
              <EvidenceCard key={item.id} item={item} />
            ))
          ) : (
            <EmptyState
              title="No evidence domains match this search"
              text="Clear the search or try another term."
            />
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EF]">
          <SectionHeader
            eyebrow="Control Pressure"
            title="Compliance Attention Queue"
            description="Only real supplied records contribute to these counts."
            icon={AlertTriangle}
            count={pressure}
          />

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <AttentionCard
              label="High / Critical Risks"
              value={totals.criticalRisks}
              text="Risk entries explicitly classified High or Critical."
              onClick={() => onOpenView("risks")}
            />
            <AttentionCard
              label="Overdue Risk Actions"
              value={totals.overdueRisks}
              text="Open risks whose mitigation due date has passed."
              onClick={() => onOpenView("risks")}
            />
            <AttentionCard
              label="Open Incidents"
              value={totals.openIncidents}
              text="Incident records with a non-terminal status."
              onClick={() => onOpenView("reports")}
            />
            <AttentionCard
              label="Overdue Policy Reviews"
              value={totals.overduePolicies}
              text="Policy records with a past review date."
              onClick={() => onOpenView("policies")}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Privacy Inventory"
            title="Data Protection Readiness"
            description="Sensitivity classification is evidence-based where possible."
            icon={LockKeyhole}
            count={totals.dataRecords}
          />

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <PrivacyStat
              label="Data Records"
              value={totals.dataRecords}
              detail="Documents + consent records currently supplied."
            />
            <PrivacyStat
              label="Classified"
              value={totals.classifiedData}
              detail="Records with a known/derived sensitivity class."
            />
            <PrivacyStat
              label="High / Critical"
              value={totals.criticalData}
              detail="Records requiring stronger handling discipline."
            />
            <PrivacyStat
              label="Access Logs"
              value={totals.accessLogs}
              detail="Access/session evidence currently supplied."
            />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RiskRegisterPanel compliance={compliance} compact />
        <DataProtectionPanel compliance={compliance} compact />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PolicyManagementPanel compliance={compliance} compact />
        <ComplianceReportingPanel compliance={compliance} compact />
      </div>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/80">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-black text-white">{value}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "navy" }) {
  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {Number(value || 0).toLocaleString("en-GB")}
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function SectionHeader({ eyebrow, title, description, icon: Icon, count }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
          {count}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function EvidenceCard({ item }) {
  const Icon = item.icon;

  return (
    <article
      className={`rounded-xl border-2 p-4 ${
        item.connected
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">{item.label}</p>
          <p
            className={`mt-1 text-[9px] font-black uppercase tracking-[0.07em] ${
              item.connected ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            {item.connected ? "Evidence connected" : "Not connected"}
          </p>
        </div>

        <Icon
          size={18}
          className={item.connected ? "text-emerald-700" : "text-slate-400"}
        />
      </div>

      <p className="mt-3 text-xl font-black text-[#10233F]">
        {item.count.toLocaleString("en-GB")}
      </p>
    </article>
  );
}

function AttentionCard({ label, value, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border-2 border-orange-300 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-50"
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-orange-700">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
        {text}
      </p>
    </button>
  );
}

function PrivacyStat({ label, value, detail }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-[#EEF4FA] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-[#10233F]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function InlineNotice({ icon: Icon, title, detail }) {
  return (
    <div className="rounded-[1.25rem] border-[3px] border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-blue-700" />
        <div>
          <p className="font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}

export { buildComplianceOSData };
