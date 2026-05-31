import { useMemo } from "react";
import RiskMonitoringPanel from "./RiskMonitoringPanel";
import OpportunityFeedPanel from "./OpportunityFeedPanel";

function ExecutiveAIDashboard({ students = [] }) {
  const metrics = useMemo(() => {
    const total = students.length;

    const gptAnalyzed = students.filter(
      (student) => student?.gpt_analyzed_at || student?.gpt_summary
    ).length;

    const hotLeads = students.filter((student) => {
      const score = Number(student?.gpt_score || student?.lead_score || 0);
      const priority = student?.priority || "";
      return score >= 75 || priority === "vip" || priority === "high";
    }).length;

    const riskLeads = students.filter((student) => {
      const risk = String(student?.gpt_risk || student?.risk_level || "").toLowerCase();
      return risk.includes("high") || risk.includes("risk");
    }).length;

    const applicationActive = students.filter(
      (student) =>
        student?.application_status &&
        student.application_status !== "not_started"
    ).length;

    const visaActive = students.filter(
      (student) => student?.visa_status && student.visa_status !== "not_started"
    ).length;

    return {
      total,
      gptAnalyzed,
      hotLeads,
      riskLeads,
      applicationActive,
      visaActive,
      gptCoverage: total ? Math.round((gptAnalyzed / total) * 100) : 0,
    };
  }, [students]);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          Executive Intelligence
        </p>

        <h2 className="mt-2 text-2xl font-black text-white">
          AI Command Dashboard
        </h2>

        <p className="mt-2 text-white/60">
          Executive level consultancy insights from CRM, GPT, applications, and visa workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Students Loaded" value={metrics.total} />
        <MetricCard label="GPT Coverage" value={`${metrics.gptCoverage}%`} />
        <MetricCard label="Hot Leads" value={metrics.hotLeads} />
        <MetricCard label="Risk Leads" value={metrics.riskLeads} />
        <MetricCard label="Applications Active" value={metrics.applicationActive} />
        <MetricCard label="Visa Active" value={metrics.visaActive} />
      </div>

      <RiskMonitoringPanel students={students} />
      <OpportunityFeedPanel students={students} />
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-[#D4AF37]">{value}</p>
    </div>
  );
}

export default ExecutiveAIDashboard;