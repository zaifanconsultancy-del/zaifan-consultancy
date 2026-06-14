import React from "react";

function ReportCard({ label, value, helper, tone = "cyan" }) {
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

function ReportAction({ title, detail, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-4 ${tones[tone] || tones.cyan}`}>
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

export default function ComplianceReportingPanel({ compliance = {}, compact = false }) {
  const totals = compliance.totals || {};

  const actions = [
    {
      title: "Monthly compliance summary",
      detail: "Export audit, open risks, policy reviews, incidents, and data protection status for founder review.",
      tone: "cyan",
    },
    {
      title: "Risk escalation report",
      detail: `${totals.criticalRisks || 0} high/critical risks need executive visibility and mitigation ownership.`,
      tone: totals.criticalRisks ? "rose" : "emerald",
    },
    {
      title: "Policy review report",
      detail: `${totals.overduePolicies || 0} policies are overdue for review. Assign owners before real audit season.`,
      tone: totals.overduePolicies ? "amber" : "emerald",
    },
    {
      title: "Data protection inventory",
      detail: `${totals.dataRecords || 0} data records are currently visible in the compliance data inventory.`,
      tone: "violet",
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Compliance Reporting</p>
        <h2 className="mt-2 text-2xl font-black text-white">Founder Compliance Reports</h2>
        <p className="mt-1 text-sm text-slate-400">Reporting layer for audit readiness, risks, policies, incidents, and privacy controls.</p>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-2" : "grid gap-3 md:grid-cols-2 xl:grid-cols-5"}>
        <ReportCard label="Score" value={`${totals.complianceScore || 0}%`} helper="overall compliance" tone={(totals.complianceScore || 0) >= 75 ? "emerald" : "amber"} />
        <ReportCard label="Audits" value={totals.audits || 0} helper="logged events" tone="cyan" />
        <ReportCard label="Risks" value={totals.openRisks || 0} helper="open risks" tone={totals.openRisks ? "rose" : "emerald"} />
        {!compact ? (
          <>
            <ReportCard label="Policies" value={totals.policies || 0} helper={`${totals.overduePolicies || 0} overdue`} tone="violet" />
            <ReportCard label="Incidents" value={totals.openIncidents || 0} helper="open incidents" tone={totals.openIncidents ? "rose" : "emerald"} />
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {actions.map((action) => <ReportAction key={action.title} {...action} />)}
        </div>
      ) : null}
    </section>
  );
}
