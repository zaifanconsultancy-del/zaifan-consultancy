import React, { useMemo, useState } from "react";

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

const workflows = ["New inquiry callback", "Offer explanation call", "Visa refusal recovery", "Finance settlement call"].map((name, index) => ({ id: index + 1, name, owner: ["Ayesha", "Hamza", "Muneeb", "Sara"][index % 4], sla: ["15m", "2h", "1d", "3d"][index % 4], status: ["Active", "Review", "Queued", "Needs Update"][index % 4], success: [94, 88, 81, 76][index % 4] }));
const categories = ["Missed", "Scheduled", "Completed", "Escalated", "No answer"];
const queue = Array.from({ length: 8 }).map((_, index) => ({
  student: ["Nadeem Khan", "Ali Raza", "Mariam Shah", "Hassan Ali", "Zara Noor", "Bilal Ahmed", "Iqra Khan", "Sameer Malik"][index],
  stage: ["Inquiry", "Application", "Offer", "CAS", "Visa", "Payment", "Enrollment", "Support"][index],
  priority: ["High", "Medium", "Low", "High", "Medium", "Critical", "Low", "Medium"][index],
  status: ["Open", "Waiting", "Assigned", "Resolved"][index % 4],
  age: ["12m", "43m", "2h", "5h", "1d", "2d", "3d", "4d"][index]
}));
export default function CallCenter({ compact = false }) {
  const [filter, setFilter] = useState("All");
  const visibleQueue = useMemo(() => filter === "All" ? queue : queue.filter(row => row.stage === filter || row.priority === filter), [filter]);
  const avgSuccess = Math.round(workflows.reduce((sum, item) => sum + item.success, 0) / workflows.length);
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active Workflows" value={workflows.length} sub="live" tone="excellent" />
      <StatCard label="Queue Items" value={queue.length} sub="tracked" tone="good" />
      <StatCard label="Avg Success" value={`${avgSuccess}%`} sub="conversion" tone="excellent" />
      <StatCard label="SLA Risk" value="14" sub="watch" tone="warning" />
    </div>
    <div className={`${card} p-5`}>
      <SectionHeader title="Call Center" description="Callback pipeline, missed call recovery, call outcomes, and counselor productivity." action={<button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">New Workflow</button>} />
      <div className="flex flex-wrap gap-2">{["All", ...categories].map(cat => <button key={cat} onClick={()=>setFilter(cat)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter===cat?"bg-slate-950 text-white":"bg-slate-100 text-slate-600"}`}>{cat}</button>)}</div>
    </div>
    <div className="grid gap-5 xl:grid-cols-3">
      <div className={`${card} p-5 xl:col-span-2`}>
        <SectionHeader title="Live Queue" description="Students and operational records requiring communication action." />
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-3">Student</th><th>Stage</th><th>Priority</th><th>Status</th><th>Age</th><th>Action</th></tr></thead><tbody>{visibleQueue.map(row => <tr key={row.student} className="border-b last:border-0"><td className="py-3 font-semibold text-slate-900">{row.student}</td><td>{row.stage}</td><td><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.priority==="Critical"?"bg-rose-100 text-rose-700":row.priority==="High"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-600"}`}>{row.priority}</span></td><td>{row.status}</td><td>{row.age}</td><td><button className="text-xs font-bold text-slate-950 underline">Open</button></td></tr>)}</tbody></table></div>
      </div>
      <div className={`${card} p-5`}>
        <SectionHeader title="Workflow Library" description="Reusable communication workflows for the team." />
        <div className="space-y-3">{workflows.map(flow => <div key={flow.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{flow.name}</p><p className="text-xs text-slate-500">Owner {flow.owner} • SLA {flow.sla}</p></div><HealthBadge value={flow.success} /></div><p className="mt-2 text-xs text-slate-500">Status: {flow.status}</p></div>)}</div>
      </div>
    </div>
    {!compact && <div className={`${card} p-5`}><SectionHeader title="Operational Analytics" description="Performance indicators for this communication channel." /><div className="grid gap-3 md:grid-cols-4">{["Response Rate", "Resolution Rate", "Escalations", "Automation Fit"].map((label, i) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className={muted}>{label}</p><p className="mt-2 text-xl font-black text-slate-950">{["92%","86%","11","78%"][i]}</p></div>)}</div></div>}
  </div>;
}
