import React, { useMemo, useState } from "react";
import KPICommandCenter from "./KPICommandCenter";
import BusinessIntelligencePanel from "./BusinessIntelligencePanel";
import ForecastEnginePanel from "./ForecastEnginePanel";
import TrendAnalysisPanel from "./TrendAnalysisPanel";
import ExecutiveReportingPanel from "./ExecutiveReportingPanel";

const safeArray = (v) => Array.isArray(v) ? v : [];
const number = (v, d=0) => Number.isFinite(Number(v)) ? Number(v) : d;

export function buildAnalyticsOSData(snapshot = {}) {
  const students = safeArray(snapshot.students || snapshot.inquiries);
  const applications = safeArray(snapshot.applications);
  const offers = safeArray(snapshot.offers);
  const visas = safeArray(snapshot.visas);
  const payments = safeArray(snapshot.payments);

  const revenue = payments.reduce((s,p)=>s+number(p.amount || p.paid_amount),0);

  return {
    students,
    applications,
    offers,
    visas,
    revenue,
    metrics: {
      students: students.length,
      applications: applications.length,
      offers: offers.length,
      visas: visas.length,
      revenue
    }
  };
}

function MetricCard({label,value}) {
  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default function AnalyticsOSDashboard({
  snapshot,
  adminProfile,
  onRefresh
}) {
  const [activeView,setActiveView] = useState("overview");
  const analytics = useMemo(()=>buildAnalyticsOSData(snapshot || {}),[snapshot]);

  const views = [
    ["overview","Overview"],
    ["kpi","KPI Command"],
    ["bi","Business Intelligence"],
    ["forecast","Forecast Engine"],
    ["trends","Trend Analysis"],
    ["reports","Executive Reports"]
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
            Analytics OS
          </p>
          <h1 className="text-3xl font-black">
            Business Intelligence Command Center
          </h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {views.map(([key,label]) => (
            <button
              key={key}
              onClick={()=>setActiveView(key)}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs"
            >
              {label}
            </button>
          ))}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-xl bg-cyan-500/20 px-3 py-2 text-xs"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Students" value={analytics.metrics.students} />
        <MetricCard label="Applications" value={analytics.metrics.applications} />
        <MetricCard label="Offers" value={analytics.metrics.offers} />
        <MetricCard label="Visas" value={analytics.metrics.visas} />
        <MetricCard label="Revenue" value={`£${analytics.metrics.revenue}`} />
      </div>

      {activeView === "overview" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/10 p-6">
            <h2 className="font-black text-xl">Executive Snapshot</h2>
            <ul className="mt-4 space-y-2 text-slate-300">
              <li>Total Students: {analytics.metrics.students}</li>
              <li>Applications: {analytics.metrics.applications}</li>
              <li>Offers: {analytics.metrics.offers}</li>
              <li>Visas: {analytics.metrics.visas}</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 p-6">
            <h2 className="font-black text-xl">Analytics Health</h2>
            <p className="mt-3 text-slate-400">
              Foundation dashboard for KPI, BI, Forecasting,
              Trend Analysis and Executive Reporting.
            </p>
          </div>
        </div>
      )}

      {activeView === "kpi" && <KPICommandCenter analytics={analytics} />}
      {activeView === "bi" && <BusinessIntelligencePanel analytics={analytics} />}
      {activeView === "forecast" && <ForecastEnginePanel analytics={analytics} />}
      {activeView === "trends" && <TrendAnalysisPanel analytics={analytics} />}
      {activeView === "reports" && <ExecutiveReportingPanel analytics={analytics} />}
    </div>
  );
}
