// ComplianceReportingPanel V3 EXTREME — Zaifan Compliance OS
// Full replacement for:
// src/components/admin/compliance/ComplianceReportingPanel.jsx
//
// Production principles:
// - no fake overall compliance score
// - no pretending that summary cards are exported compliance reports
// - report readiness is derived only from connected evidence
// - no fake executive risk conclusions
// - unified Zaifan navy/orange/cream Compliance OS visual language
//
// Supported props:
// compliance?: normalized object from ComplianceOSDashboard
// compact?: boolean
// onGenerateReport?: (reportType, compliance) => void
// onExportReport?: (reportType, compliance) => void

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  FileSearch,
  FileText,
  Info,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

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

function hasEvidence(compliance = {}) {
  const totals = compliance.totals || {};
  return Number(totals.connectedDomainCount || 0) > 0;
}

function reportDefinitions(compliance = {}) {
  const totals = compliance.totals || {};
  const verification = compliance.verification || {};

  return [
    {
      id: "executive-summary",
      title: "Executive Compliance Summary",
      description:
        "Evidence coverage, open risk pressure, overdue policy reviews, incidents and privacy inventory.",
      ready: hasEvidence(compliance),
      tone: "navy",
      icon: ClipboardList,
      evidence: `${totals.connectedDomainCount || 0}/6 evidence domains`,
    },
    {
      id: "risk-escalation",
      title: "Risk Escalation Report",
      description:
        "High/critical compliance risks, overdue mitigation actions and ownership gaps.",
      ready: Number(totals.risks || 0) > 0,
      tone: Number(totals.criticalRisks || 0) > 0 ? "red" : "orange",
      icon: ShieldAlert,
      evidence: `${totals.criticalRisks || 0} high/critical`,
    },
    {
      id: "policy-review",
      title: "Policy Review Report",
      description:
        "Policy lifecycle, overdue reviews, unscheduled reviews, ownership and acknowledgement evidence.",
      ready: Number(totals.policies || 0) > 0,
      tone: Number(totals.overduePolicies || 0) > 0 ? "orange" : "blue",
      icon: BookOpenCheck,
      evidence: `${totals.overduePolicies || 0} overdue`,
    },
    {
      id: "data-protection",
      title: "Data Protection Inventory",
      description:
        "Documents, consent records, sensitivity classifications and privacy-attention signals.",
      ready: Number(totals.dataRecords || 0) > 0,
      tone: Number(totals.criticalData || 0) > 0 ? "red" : "blue",
      icon: LockKeyhole,
      evidence: `${totals.dataRecords || 0} data records`,
    },
    {
      id: "audit-evidence",
      title: "Audit Evidence Report",
      description:
        "Audit trail coverage and event evidence available to the Compliance OS.",
      ready: Number(totals.audits || 0) > 0,
      tone: "blue",
      icon: FileSearch,
      evidence: `${totals.audits || 0} audit events`,
    },
    {
      id: "incident-summary",
      title: "Incident Summary",
      description:
        "Connected incident evidence and current open-incident pressure.",
      ready: Number(totals.incidents || 0) > 0,
      tone: Number(totals.openIncidents || 0) > 0 ? "red" : "navy",
      icon: AlertTriangle,
      evidence: `${totals.openIncidents || 0} open incidents`,
    },
  ];
}

export default function ComplianceReportingPanel({
  compliance = {},
  compact = false,
  onGenerateReport,
  onExportReport,
}) {
  const [query, setQuery] = useState("");

  const totals = compliance.totals || {};
  const verification = compliance.verification || {};

  const reports = useMemo(
    () => reportDefinitions(compliance),
    [compliance]
  );

  const visibleReports = useMemo(() => {
    const search = normalize(query);
    if (!search) return reports;

    return reports.filter((report) =>
      normalize(
        [
          report.title,
          report.description,
          report.evidence,
          report.ready ? "ready" : "not ready",
        ].join(" ")
      ).includes(search)
    );
  }, [reports, query]);

  const readyReports = reports.filter((report) => report.ready).length;

  const canGenerate = typeof onGenerateReport === "function";
  const canExport = typeof onExportReport === "function";

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EF]">
        <SectionHeader
          eyebrow="Reporting Readiness"
          title="Compliance Reporting Snapshot"
          description="Report readiness derived from connected evidence."
          icon={BarChart3}
          count={`${readyReports}/${reports.length}`}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <CompactMetric
            label="Evidence Domains"
            value={`${totals.connectedDomainCount || 0}/6`}
          />
          <CompactMetric
            label="Ready Reports"
            value={`${readyReports}/${reports.length}`}
          />
          <CompactMetric
            label="Open Risks"
            value={totals.openRisks || 0}
          />
          <CompactMetric
            label="Open Incidents"
            value={totals.openIncidents || 0}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_16px_42px_rgba(23,36,61,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={BarChart3} label="Compliance Reporting" />
              <HeaderChip icon={ShieldCheck} label="Evidence Readiness" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Compliance Reporting Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Review which compliance reports are actually supported by current
              evidence. Reporting actions remain disabled until a real
              generation/export handler is connected.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Evidence"
                value={`${totals.connectedDomainCount || 0}/6`}
              />
              <DarkMetric label="Ready Reports" value={readyReports} />
              <DarkMetric label="Open Risks" value={totals.openRisks || 0} />
              <DarkMetric
                label="Open Incidents"
                value={totals.openIncidents || 0}
              />
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Assessment status
                </p>

                <p className="mt-2 text-3xl font-black leading-tight text-white">
                  {verification.status || "Not assessed"}
                </p>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                  no synthetic score
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <FileText size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                {verification.reason ||
                  "No compliance assessment evidence has been supplied."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#FFF8EF] p-3">
        <Search
          size={17}
          className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reports, evidence or readiness..."
          aria-label="Search Compliance Reports"
          className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear compliance report search"
            className="absolute right-6 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Database}
          label="Evidence Domains"
          value={totals.connectedDomainCount || 0}
          detail="Connected evidence families available to reporting."
          tone="blue"
        />
        <MetricCard
          icon={ShieldAlert}
          label="High / Critical Risks"
          value={totals.criticalRisks || 0}
          detail="Risk records explicitly classified High or Critical."
          tone="red"
        />
        <MetricCard
          icon={BookOpenCheck}
          label="Overdue Policies"
          value={totals.overduePolicies || 0}
          detail="Policy reviews with a supplied date already passed."
          tone="orange"
        />
        <MetricCard
          icon={LockKeyhole}
          label="Data Records"
          value={totals.dataRecords || 0}
          detail="Privacy/data inventory evidence currently supplied."
          tone="navy"
        />
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Report Catalogue"
          title="Evidence-Backed Compliance Reports"
          description="A report is marked ready only when its underlying evidence exists."
          icon={FileText}
          count={visibleReports.length}
        />

        <div className="p-4">
          {visibleReports.length ? (
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {visibleReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  canGenerate={canGenerate}
                  canExport={canExport}
                  onGenerate={() =>
                    onGenerateReport?.(report.id, compliance)
                  }
                  onExport={() =>
                    onExportReport?.(report.id, compliance)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reports match this search"
              text="Clear the search or try another report term."
              onClear={() => setQuery("")}
            />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EF]">
        <SectionHeader
          eyebrow="Executive Readiness"
          title="Current Reporting Gaps"
          description="Missing evidence areas that limit compliance reporting confidence."
          icon={Sparkles}
          count={6 - Number(totals.connectedDomainCount || 0)}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          <GapCard
            title="Audit Trail"
            ready={Number(totals.audits || 0) > 0}
            detail="Activity/audit events required for evidence-based audit reporting."
          />
          <GapCard
            title="Policy Repository"
            ready={Number(totals.policies || 0) > 0}
            detail="Policy lifecycle records required for policy governance reporting."
          />
          <GapCard
            title="Risk Register"
            ready={Number(totals.risks || 0) > 0}
            detail="Compliance-risk records required for escalation and mitigation reporting."
          />
          <GapCard
            title="Incident Register"
            ready={Number(totals.incidents || 0) > 0}
            detail="Incident evidence required for incident reporting."
          />
          <GapCard
            title="Data Inventory"
            ready={Number(totals.dataRecords || 0) > 0}
            detail="Privacy/data evidence required for data-protection reporting."
          />
          <GapCard
            title="Access Evidence"
            ready={Number(totals.accessLogs || 0) > 0}
            detail="Access/session evidence required for stronger access-control reporting."
          />
        </div>
      </section>

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <GovernanceCard
          icon={ShieldCheck}
          title="Reporting integrity"
          text="This center no longer labels summary cards as completed compliance reports or invents an overall score."
          tone="blue"
        />
        <GovernanceCard
          icon={Info}
          title="Export boundary"
          text="Generate/Export controls activate only when real report handlers are connected."
          tone="orange"
        />
      </footer>
    </section>
  );
}

function ReportCard({
  report,
  canGenerate,
  canExport,
  onGenerate,
  onExport,
}) {
  const Icon = report.icon;
  const generateEnabled = report.ready && canGenerate;
  const exportEnabled = report.ready && canExport;

  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(report.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{report.title}</p>
            <span
              className={`rounded-lg border-2 px-2 py-1 text-[8px] font-black uppercase ${
                report.ready
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 bg-slate-50 text-slate-600"
              }`}
            >
              {report.ready ? "Evidence ready" : "Not ready"}
            </span>
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {report.description}
          </p>

          <span className="mt-3 inline-flex rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
            {report.evidence}
          </span>
        </div>

        <Icon size={18} className="shrink-0 text-[#123865]" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!generateEnabled}
          onClick={onGenerate}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border-2 border-orange-500 bg-orange-50 px-3 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <FileText size={12} />
          {canGenerate ? "Generate" : "Generator Not Connected"}
        </button>

        <button
          type="button"
          disabled={!exportEnabled}
          onClick={onExport}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-white px-3 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865] transition hover:bg-[#123865] hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
        >
          <Download size={12} />
          {canExport ? "Export" : "Export Not Connected"}
        </button>
      </div>
    </article>
  );
}

function GapCard({ title, ready, detail }) {
  return (
    <article
      className={`rounded-xl border-2 p-4 ${
        ready
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {ready ? (
          <CheckCircle2
            size={17}
            className="mt-0.5 shrink-0 text-emerald-700"
          />
        ) : (
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0 text-orange-700"
          />
        )}

        <div>
          <p className="font-black text-[#10233F]">{title}</p>
          <p
            className={`mt-1 text-[9px] font-black uppercase tracking-[0.07em] ${
              ready ? "text-emerald-700" : "text-orange-700"
            }`}
          >
            {ready ? "Evidence available" : "Evidence gap"}
          </p>

          <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </article>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-black text-white">
        {value}
      </p>
    </div>
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

function MetricCard({ icon: Icon, label, value, detail, tone }) {
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

function CompactMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function GovernanceCard({ icon: Icon, title, text, tone }) {
  return (
    <article className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {text}
          </p>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
        >
          Clear search
        </button>
      ) : null}
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
