import React, { useMemo } from "react";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const muted = "text-xs font-medium uppercase tracking-wide text-slate-500";
const statusTone = {
  excellent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200"
};
function StatCard({ label, value, sub, tone = "neutral" }) {
  return (
    <div className={`${card} p-4`}>
      <p className={muted}>{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-950">{value}</h3>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone[tone] || statusTone.neutral}`}>{sub}</span>
      </div>
    </div>
  );
}
function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
function HealthBadge({ value }) {
  const tone = value >= 90 ? "excellent" : value >= 75 ? "good" : value >= 60 ? "warning" : "critical";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusTone[tone]}`}>{value}% health</span>;
}

const trends = [
  { metric: "Inquiry response", current: 94, previous: 87, owner: "Admissions" },
  { metric: "Document follow-up", current: 89, previous: 82, owner: "Operations" },
  { metric: "Offer conversion", current: 71, previous: 64, owner: "Counselors" },
  { metric: "Visa readiness", current: 84, previous: 78, owner: "Visa Team" },
  { metric: "Payment recovery", current: 76, previous: 69, owner: "Finance" },
];
const intelligence = [
  "WhatsApp reminders reduce document delays by 31% for CAS-stage students.",
  "Offer holders contacted within 6 hours show stronger deposit conversion.",
  "Missed-call recovery should be routed to the same counselor within 24 hours.",
  "Parent finance meetings are the highest-impact communication before payment due dates."
];
export default function CommunicationAnalytics({ compact = false }) {
  const summary = useMemo(() => {
    const avg = Math.round(trends.reduce((sum, row) => sum + row.current, 0) / trends.length);
    const gain = Math.round(trends.reduce((sum, row) => sum + (row.current - row.previous), 0) / trends.length);
    return { avg, gain };
  }, []);
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Engagement Index" value={`${summary.avg}%`} sub="weighted" tone="excellent" />
      <StatCard label="Monthly Lift" value={`+${summary.gain}%`} sub="improved" tone="good" />
      <StatCard label="Risk Conversations" value="43" sub="open" tone="warning" />
      <StatCard label="Automation Candidates" value="28" sub="ready" tone="excellent" />
    </div>
    <div className="grid gap-5 xl:grid-cols-3">
      <div className={`${card} p-5 xl:col-span-2`}><SectionHeader title="Communication Performance Trends" description="Team-level performance by journey objective." /><div className="space-y-3">{trends.map(row => <div key={row.metric} className="rounded-xl border border-slate-100 p-3"><div className="mb-2 flex items-center justify-between"><div><p className="font-bold text-slate-900">{row.metric}</p><p className="text-xs text-slate-500">Owner: {row.owner}</p></div><span className="text-sm font-black text-slate-950">{row.current}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900" style={{ width: `${row.current}%` }} /></div><p className="mt-1 text-xs text-emerald-700">+{row.current-row.previous}% vs previous period</p></div>)}</div></div>
      <div className={`${card} p-5`}><SectionHeader title="Executive Intelligence" description="Actionable communication insights." /><div className="space-y-3">{intelligence.map((item,index) => <div key={item} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">Insight {index+1}</p><p className="mt-1 text-sm font-medium text-slate-700">{item}</p></div>)}</div></div>
    </div>
    {!compact && <div className={`${card} p-5`}><SectionHeader title="Recommended Automations" description="Ready-to-connect actions for Automation OS." /><div className="grid gap-3 md:grid-cols-3">{["CAS missing document chase", "Payment deadline reminder", "Visa interview prep sequence"].map((item,i)=><div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="font-bold text-slate-900">{item}</p><p className="mt-1 text-sm text-slate-500">Estimated impact: {["High","Medium","High"][i]}</p><button className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-sm">Send to Automation OS</button></div>)}</div></div>}
  </div>;
}
