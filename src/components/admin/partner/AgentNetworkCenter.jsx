import React, { useMemo, useState } from 'react';

const agents = [
  { name: 'Lahore Study Link', city: 'Lahore', tier: 'Gold', counselors: 6, leads: 126, applications: 43, offers: 18, compliance: 94, payout: 620000, status: 'Active' },
  { name: 'Karachi Global Admissions', city: 'Karachi', tier: 'Silver', counselors: 4, leads: 91, applications: 25, offers: 9, compliance: 87, payout: 410000, status: 'Review' },
  { name: 'Punjab Student Desk', city: 'Multan', tier: 'Bronze', counselors: 2, leads: 48, applications: 8, offers: 2, compliance: 62, payout: 98000, status: 'Paused' },
  { name: 'Capital Edu Partners', city: 'Islamabad', tier: 'Gold', counselors: 5, leads: 102, applications: 37, offers: 15, compliance: 91, payout: 540000, status: 'Active' },
];

const playbooks = ['Lead qualification SOP', 'Document collection checklist', 'Offer follow-up workflow', 'CAS readiness workflow', 'Ethical recruitment policy'];

export default function AgentNetworkCenter({ compact = false }) {
  const [tier, setTier] = useState('All');
  const visibleAgents = useMemo(() => agents.filter((agent) => tier === 'All' || agent.tier === tier), [tier]);
  const totals = useMemo(() => ({ leads: agents.reduce((s, a) => s + a.leads, 0), apps: agents.reduce((s, a) => s + a.applications, 0), offers: agents.reduce((s, a) => s + a.offers, 0), compliance: Math.round(agents.reduce((s, a) => s + a.compliance, 0) / agents.length) }), []);

  return <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card title="Agent Leads" value={totals.leads} />
      <Card title="Applications" value={totals.apps} />
      <Card title="Offers" value={totals.offers} />
      <Card title="Compliance Avg" value={`${totals.compliance}%`} />
    </div>
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex justify-between gap-3 flex-wrap mb-4"><div><h2 className="text-xl font-bold text-slate-950">Agent Network Center</h2><p className="text-sm text-slate-500">Manage agent productivity, compliance, payouts, and counselor capacity.</p></div><select value={tier} onChange={(e) => setTier(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm"><option>All</option><option>Gold</option><option>Silver</option><option>Bronze</option></select></div>
      <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Agent</th><th>Tier</th><th>Counselors</th><th>Leads</th><th>Applications</th><th>Offers</th><th>Compliance</th><th>Payout</th><th>Status</th></tr></thead><tbody>{visibleAgents.map((agent) => <tr key={agent.name} className="border-b last:border-0"><td className="py-3"><b>{agent.name}</b><div className="text-xs text-slate-500">{agent.city}</div></td><td>{agent.tier}</td><td>{agent.counselors}</td><td>{agent.leads}</td><td>{agent.applications}</td><td>{agent.offers}</td><td>{agent.compliance}%</td><td>PKR {agent.payout.toLocaleString()}</td><td>{agent.status}</td></tr>)}</tbody></table></div>
    </section>
    {!compact && <section className="grid grid-cols-1 lg:grid-cols-2 gap-5"><Panel title="Agent Enablement Playbooks" items={playbooks} /><Panel title="Agent Risk Controls" items={['Duplicate student detection', 'Document authenticity review', 'False promise monitoring', 'Commission dispute audit', 'Inactive partner escalation']} /></section>}
  </div>;
}
function Card({ title, value }) { return <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-bold text-slate-950 mt-2">{value}</p></div>; }
function Panel({ title, items }) { return <div className="bg-white rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-900 mb-3">{title}</h3><div className="space-y-2">{items.map((item) => <div key={item} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700">{item}</div>)}</div></div>; }
