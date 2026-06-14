import React, { useMemo, useState } from "react";
import EmailCenter from "./EmailCenter";
import WhatsAppCenter from "./WhatsAppCenter";
import CallCenter from "./CallCenter";
import MeetingCenter from "./MeetingCenter";
import CommunicationAnalytics from "./CommunicationAnalytics";

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

const channelSummary = [
  { channel: "Email", volume: 842, response: "2.1h", health: 91, risk: "12 stale replies", owner: "Admissions" },
  { channel: "WhatsApp", volume: 1284, response: "18m", health: 94, risk: "7 unassigned", owner: "Counselors" },
  { channel: "Calls", volume: 316, response: "41m", health: 83, risk: "18 missed callbacks", owner: "Support" },
  { channel: "Meetings", volume: 104, response: "1.4d", health: 88, risk: "9 follow-ups due", owner: "Counselors" },
];
const recentUpdates = [
  { title: "Offer follow-up campaign", channel: "Email", status: "Live", impact: "+21 replies" },
  { title: "CAS document reminder", channel: "WhatsApp", status: "Queued", impact: "46 students" },
  { title: "Visa interview prep calls", channel: "Calls", status: "Review", impact: "12 booked" },
  { title: "Counselor onboarding meetings", channel: "Meetings", status: "Scheduled", impact: "8 sessions" },
];
const tabs = ["overview", "email", "whatsapp", "calls", "meetings", "analytics"];
export default function CommunicationOSDashboard({ compact = false, adminProfile = null }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [query, setQuery] = useState("");
  const totals = useMemo(() => {
    const volume = channelSummary.reduce((sum, row) => sum + row.volume, 0);
    const health = Math.round(channelSummary.reduce((sum, row) => sum + row.health, 0) / channelSummary.length);
    return { volume, health, open: 168, automation: 74 };
  }, []);
  const filtered = channelSummary.filter(row => [row.channel,row.owner,row.risk].join(" ").toLowerCase().includes(query.toLowerCase()));
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Conversations" value={totals.volume.toLocaleString()} sub="30 days" tone="excellent" />
        <StatCard label="Open Follow-ups" value={totals.open} sub="needs action" tone="warning" />
        <StatCard label="Automation Coverage" value={`${totals.automation}%`} sub="active" tone="good" />
        <StatCard label="Communication Health" value={`${totals.health}%`} sub="stable" tone="excellent" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className={`${card} p-5 xl:col-span-2`}>
          <SectionHeader title="Channel Command Table" description="Operational health across email, WhatsApp, calls, and meetings." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-3">Channel</th><th>Volume</th><th>Avg Response</th><th>Owner</th><th>Risk</th><th>Health</th></tr></thead>
              <tbody>{filtered.map(row => <tr key={row.channel} className="border-b last:border-0"><td className="py-3 font-semibold text-slate-900">{row.channel}</td><td>{row.volume}</td><td>{row.response}</td><td>{row.owner}</td><td>{row.risk}</td><td><HealthBadge value={row.health}/></td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className={`${card} p-5`}>
          <SectionHeader title="Recent Communication Updates" description="Latest system actions and campaign changes." />
          <div className="space-y-3">{recentUpdates.map(item => <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">{item.title}</p><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">{item.status}</span></div><p className="mt-1 text-xs text-slate-500">{item.channel} • {item.impact}</p></div>)}</div>
        </div>
      </div>
      {!compact && <CommunicationAnalytics compact />}
    </div>
  );
  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className={`${card} p-5`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className={muted}>Zaifan Enterprise OS</p><h1 className="text-2xl font-black text-slate-950 md:text-3xl">Communication OS</h1><p className="mt-1 text-sm text-slate-500">Central command for student, counselor, partner, and internal communication workflows.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search channels, owners, risks..." className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"/><button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Create Campaign</button></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{tabs.map(tab => <button key={tab} onClick={()=>setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${activeTab===tab?"bg-slate-950 text-white":"bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{tab}</button>)}</div>
        </div>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "email" && <EmailCenter compact={compact}/>} 
        {activeTab === "whatsapp" && <WhatsAppCenter compact={compact}/>} 
        {activeTab === "calls" && <CallCenter compact={compact}/>} 
        {activeTab === "meetings" && <MeetingCenter compact={compact}/>} 
        {activeTab === "analytics" && <CommunicationAnalytics />}
      </div>
    </div>
  );
}
