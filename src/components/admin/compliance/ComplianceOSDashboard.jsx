// ComplianceOSDashboard V5.2 EXACT PARTNER-OS HERO — Zaifan Compliance OS
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
  Database,
  FileSearch,
  LockKeyhole,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import AuditCenter from "./AuditCenter";
import PolicyManagementPanel from "./PolicyManagementPanel";
import RiskRegisterPanel from "./RiskRegisterPanel";
import DataProtectionPanel from "./DataProtectionPanel";
import ComplianceReportingPanel from "./ComplianceReportingPanel";


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

function statusTone(status = "") {
  const value = normalize(status);

  if (
    ["approved", "resolved", "closed", "complete", "completed", "archived"].some(
      (token) => value.includes(token)
    )
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    ["critical", "failed", "rejected", "breach", "overdue"].some((token) =>
      value.includes(token)
    )
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    ["pending", "review", "open", "unknown", "unassigned"].some((token) =>
      value.includes(token)
    )
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function severityTone(severity = "") {
  const value = normalize(severity);

  if (value.includes("critical") || value.includes("high")) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (value.includes("medium")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (value.includes("low")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
    orange: "border-[#F97316] bg-[#FFF4EA]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
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
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
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

function buildCompliancePortfolio(compliance) {
  const audits = compliance.auditRows.map((row) => ({
    id: row.id,
    type: "Audit",
    title: row.action,
    category: row.category,
    owner: row.actor,
    status: row.status,
    severity: row.severity,
    date: row.createdAt,
    detail: row.description,
    source: row.source || "Audit trail",
  }));

  const policies = compliance.policyRows.map((row) => ({
    id: row.id,
    type: "Policy",
    title: row.title,
    category: row.category,
    owner: row.owner,
    status: row.status,
    severity: isOverdueDate(row.nextReview) ? "High" : "Unknown",
    date: row.nextReview,
    detail:
      row.acknowledgementRate === null
        ? `Version ${row.version} · acknowledgement not measured`
        : `Version ${row.version} · ${Math.round(
            row.acknowledgementRate
          )}% acknowledged`,
    source: row.source || "Policy register",
  }));

  const risks = compliance.riskRows.map((row) => ({
    id: row.id,
    type: "Risk",
    title: row.title,
    category: row.category,
    owner: row.owner,
    status: row.status,
    severity: row.severity,
    date: row.dueDate,
    detail: row.mitigation,
    source: row.source || "Risk register",
  }));

  const incidents = compliance.incidentRows.map((row) => ({
    id: row.id,
    type: "Incident",
    title: row.title,
    category: row.category,
    owner: row.owner,
    status: row.status,
    severity: row.severity,
    date: row.reportedAt,
    detail: "Incident evidence supplied to Compliance OS.",
    source: row.source || "Incident register",
  }));

  const data = compliance.dataRows.map((row) => ({
    id: row.id,
    type: row.type || "Data",
    title: row.title,
    category: row.category,
    owner: row.owner,
    status: row.status,
    severity: row.sensitivity,
    date: null,
    detail: `${row.sensitivity} sensitivity classification`,
    source: row.source || "Data inventory",
  }));

  return [...audits, ...policies, ...risks, ...incidents, ...data].sort(
    (a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0;
      const bTime = b.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    }
  );
}

function ComplianceRow({ item }) {
  const Icon =
    item.type === "Audit"
      ? Activity
      : item.type === "Policy"
        ? BookOpenCheck
        : item.type === "Risk"
          ? ShieldAlert
          : item.type === "Incident"
            ? AlertTriangle
            : LockKeyhole;

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.5fr)_9rem_11rem_10rem_10rem_11rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-[#F2F7FF] text-[#123865]">
              <Icon size={17} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
                  {item.title}
                </p>

                <span
                  className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-500">
                {item.detail}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Type
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">{item.type}</p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Category
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {item.category}
          </p>
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Severity
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${severityTone(
              item.severity
            )}`}
          >
            {item.severity}
          </span>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Date
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {formatDate(item.date)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Owner
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {item.owner}
          </p>
        </div>
      </div>
    </article>
  );
}

function IntegrityCard({ icon: Icon, eyebrow, title, helper, tone = "blue" }) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon
          size={17}
          className={`mt-0.5 shrink-0 ${
            tone === "green"
              ? "text-emerald-700"
              : tone === "amber"
                ? "text-amber-700"
                : "text-blue-700"
          }`}
        />
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ComplianceOSDashboard({
  snapshot = {},
  adminProfile = null,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState("overview");
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("All");
  const [severity, setSeverity] = useState("All");

  const compliance = useMemo(
    () => buildComplianceOSData(snapshot || {}),
    [snapshot]
  );

  const portfolio = useMemo(
    () => buildCompliancePortfolio(compliance),
    [compliance]
  );

  const filteredPortfolio = useMemo(() => {
    const needle = normalize(search);

    return portfolio.filter((item) => {
      if (recordType !== "All" && item.type !== recordType) return false;
      if (severity !== "All" && item.severity !== severity) return false;

      if (!needle) return true;

      return [
        item.title,
        item.category,
        item.owner,
        item.status,
        item.severity,
        item.type,
        item.source,
      ]
        .map(normalize)
        .join(" ")
        .includes(needle);
    });
  }, [portfolio, search, recordType, severity]);

  const metrics = useMemo(() => {
    const pressure =
      compliance.totals.criticalRisks +
      compliance.totals.overdueRisks +
      compliance.totals.openIncidents +
      compliance.totals.overduePolicies;

    return {
      pressure,
      connected: compliance.totals.connectedDomainCount,
      openRisks: compliance.totals.openRisks,
      classifiedData: compliance.totals.classifiedData,
    };
  }, [compliance]);

  const views = [
    { key: "overview", label: "Overview", icon: ShieldCheck },
    { key: "audit", label: "Audit", icon: Activity },
    { key: "policies", label: "Policies", icon: BookOpenCheck },
    { key: "risks", label: "Risk Register", icon: ShieldAlert },
    { key: "data", label: "Data Protection", icon: LockKeyhole },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  const currentView =
    views.find((view) => view.key === activeView) || views[0];

  const filtersActive =
    Boolean(search.trim()) || recordType !== "All" || severity !== "All";

  function clearFilters() {
    setSearch("");
    setRecordType("All");
    setSeverity("All");
  }

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <ShieldCheck size={12} />
                Compliance OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Governance command
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Audit, Risk & Data Protection
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Audit trails, policies, risk controls, incidents, privacy evidence
              and reporting readiness. Unknown fields remain unknown, and
              missing evidence never becomes a fake compliance percentage.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">{currentView.label}</p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin compliance view for ${adminProfile.email}`
                : "Admin governance and evidence workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {compliance.totals.connectedDomainCount}/6 domains
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {compliance.verification.status}
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
            Refresh Compliance
          </button>
        ) : null}
      </nav>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Evidence Domains"
              value={`${metrics.connected}/6`}
              helper="Audit, policies, risks, incidents, data and access evidence currently connected."
              tone="navy"
              icon={Database}
              badge="Coverage"
            />

            <MetricCard
              label="Open Risks"
              value={metrics.openRisks}
              helper={`${compliance.totals.overdueRisks} open risk action${
                compliance.totals.overdueRisks === 1 ? "" : "s"
              } currently overdue.`}
              tone={compliance.totals.overdueRisks ? "red" : "blue"}
              icon={ShieldAlert}
              badge="Risk register"
            />

            <MetricCard
              label="Control Pressure"
              value={metrics.pressure}
              helper="High/critical risks, overdue mitigations, open incidents and overdue policy reviews."
              tone={metrics.pressure ? "amber" : "green"}
              icon={AlertTriangle}
              badge="Attention"
            />

            <MetricCard
              label="Classified Data"
              value={metrics.classifiedData}
              helper={`${compliance.totals.criticalData} record${
                compliance.totals.criticalData === 1 ? "" : "s"
              } classified High or Critical.`}
              tone="blue"
              icon={LockKeyhole}
              badge="Privacy"
            />
          </div>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                  Compliance Command
                </p>
                <h2 className="mt-1 text-xl font-black text-[#10233F]">
                  Governance evidence portfolio
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Search and review the real audit, policy, risk, incident and
                  data-protection records supplied to Compliance OS.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_9rem_10rem_auto]">
                <label className="relative block">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search compliance..."
                    className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
                  />
                </label>

                <select
                  value={recordType}
                  onChange={(event) => setRecordType(event.target.value)}
                  className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
                >
                  <option>All</option>
                  <option>Audit</option>
                  <option>Policy</option>
                  <option>Risk</option>
                  <option>Incident</option>
                  <option>Document</option>
                  <option>Consent</option>
                </select>

                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value)}
                  className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
                >
                  <option>All</option>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                  <option>Unknown</option>
                  <option>Unclassified</option>
                </select>

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!filtersActive}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-40"
                >
                  <X size={13} />
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredPortfolio.length ? (
                filteredPortfolio.map((item) => (
                  <ComplianceRow
                    key={`${item.type}-${item.id}`}
                    item={item}
                  />
                ))
              ) : (
                <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
                  <Scale size={24} className="mx-auto text-orange-700" />
                  <p className="mt-3 font-black text-[#10233F]">
                    {portfolio.length
                      ? "No compliance records match these filters."
                      : "No real compliance evidence yet."}
                  </p>
                  <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                    {portfolio.length
                      ? "Clear or change the compliance filters."
                      : "Connect genuine audit, policy, risk, incident, consent or document evidence before Compliance OS reports operational governance activity."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            <IntegrityCard
              icon={ShieldCheck}
              eyebrow="Compliance Integrity"
              title="No synthetic health score"
              helper="Evidence coverage is reported directly; missing controls never become an invented percentage."
              tone="green"
            />

            <IntegrityCard
              icon={FileSearch}
              eyebrow="Evidence Boundary"
              title="Unknown remains unknown"
              helper="Missing statuses, owners and classifications stay visible instead of silently becoming healthy defaults."
              tone="blue"
            />

            <IntegrityCard
              icon={AlertTriangle}
              eyebrow="Action Boundary"
              title={`${metrics.pressure} pressure signal${
                metrics.pressure === 1 ? "" : "s"
              }`}
              helper="Only supplied high-risk, overdue, incident and policy-review evidence contributes to this count."
              tone={metrics.pressure ? "amber" : "green"}
            />
          </div>
        </>
      ) : null}

      {activeView === "audit" ? <AuditCenter compliance={compliance} /> : null}
      {activeView === "policies" ? (
        <PolicyManagementPanel compliance={compliance} />
      ) : null}
      {activeView === "risks" ? (
        <RiskRegisterPanel compliance={compliance} />
      ) : null}
      {activeView === "data" ? (
        <DataProtectionPanel compliance={compliance} />
      ) : null}
      {activeView === "reports" ? (
        <ComplianceReportingPanel compliance={compliance} />
      ) : null}
    </div>
  );
}

export { buildComplianceOSData };
