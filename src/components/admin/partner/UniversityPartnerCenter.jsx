import React, { useMemo, useState } from 'react';

const universities = [
  { name: 'Northbridge University', country: 'UK', rank: 'Strategic', intakes: 'Jan / May / Sep', apps: 88, offers: 41, cas: 21, scholarship: 'Up to £4,000', sla: '2.1 days', owner: 'Sara' },
  { name: 'Maple State College', country: 'Canada', rank: 'Growth', intakes: 'Jan / Sep', apps: 47, offers: 18, cas: 0, scholarship: 'CAD 2,500', sla: '3.4 days', owner: 'Hamza' },
  { name: 'Southern Tech Institute', country: 'Australia', rank: 'Emerging', intakes: 'Feb / Jul', apps: 26, offers: 11, cas: 0, scholarship: 'AUD 3,000', sla: '4.7 days', owner: 'Nimra' },
  { name: 'Dublin Business School', country: 'Ireland', rank: 'Strategic', intakes: 'Feb / Sep', apps: 36, offers: 19, cas: 0, scholarship: '€2,000', sla: '2.8 days', owner: 'Ayesha' },
];

export default function UniversityPartnerCenter({ compact = false }) {
  const [country, setCountry] = useState('All');
  const filtered = useMemo(() => universities.filter((u) => country === 'All' || u.country === country), [country]);
  const countries = ['All', ...new Set(universities.map((u) => u.country))];
  const totalOffers = universities.reduce((sum, item) => sum + item.offers, 0);

  return <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Metric label="University Partners" value={universities.length} /><Metric label="Applications Sent" value={universities.reduce((s,u)=>s+u.apps,0)} /><Metric label="Offers Received" value={totalOffers} /><Metric label="Avg Offer Rate" value={`${Math.round((totalOffers / universities.reduce((s,u)=>s+u.apps,0))*100)}%`} /></div>
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex justify-between gap-3 flex-wrap mb-4"><div><h2 className="text-xl font-bold text-slate-950">University Partner Center</h2><p className="text-sm text-slate-500">Partnership value, intakes, scholarship rules, offer speed, and owner accountability.</p></div><select value={country} onChange={(e)=>setCountry(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">{countries.map(c=><option key={c}>{c}</option>)}</select></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{filtered.map((u)=><article key={u.name} className="border border-slate-200 rounded-2xl p-4"><div className="flex justify-between"><div><h3 className="font-bold text-slate-900">{u.name}</h3><p className="text-sm text-slate-500">{u.country} · {u.rank} Partner</p></div><span className="text-xs bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 h-fit">{u.owner}</span></div><div className="grid grid-cols-3 gap-3 mt-4 text-sm"><Mini label="Apps" value={u.apps} /><Mini label="Offers" value={u.offers} /><Mini label="CAS" value={u.cas} /></div><div className="mt-4 text-sm text-slate-600"><p><b>Intakes:</b> {u.intakes}</p><p><b>Scholarship:</b> {u.scholarship}</p><p><b>Response SLA:</b> {u.sla}</p></div></article>)}</div></section>
    {!compact && <section className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-bold text-slate-900 mb-3">Partnership Expansion Queue</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{['Negotiate faster offer SLA', 'Request updated entry requirements', 'Collect scholarship confirmation', 'Schedule university training', 'Update course catalog', 'Review commission agreement'].map(x=><div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm" key={x}>{x}</div>)}</div></section>}
  </div>;
}
function Metric({ label, value }) { return <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold mt-2 text-slate-950">{value}</p></div>; }
function Mini({ label, value }) { return <div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-500">{label}</p><p className="font-bold text-slate-900">{value}</p></div>; }
