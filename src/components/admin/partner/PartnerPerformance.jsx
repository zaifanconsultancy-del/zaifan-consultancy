import React from 'react';

const scorecards = [
  { name: 'Lahore Study Link', score: 92, growth: '+18%', quality: 88, compliance: 94, speed: 91 },
  { name: 'Northbridge University', score: 89, growth: '+11%', quality: 93, compliance: 97, speed: 86 },
  { name: 'Karachi Global Admissions', score: 76, growth: '+5%', quality: 73, compliance: 87, speed: 72 },
  { name: 'Punjab Student Desk', score: 54, growth: '-9%', quality: 58, compliance: 62, speed: 49 },
];

export default function PartnerPerformance({ compact = false }) {
  return <div className="space-y-5">
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Partner Performance</h2><p className="text-sm text-slate-500 mb-4">Balanced scorecard across volume, quality, compliance, response speed, and growth trend.</p><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{scorecards.map((p)=><article key={p.name} className="border border-slate-200 rounded-2xl p-4"><div className="flex justify-between"><div><h3 className="font-bold text-slate-900">{p.name}</h3><p className="text-sm text-slate-500">Growth {p.growth}</p></div><div className="text-2xl font-bold text-slate-950">{p.score}</div></div><Bar label="Lead Quality" value={p.quality} /><Bar label="Compliance" value={p.compliance} /><Bar label="Response Speed" value={p.speed} /></article>)}</div></section>
    {!compact && <section className="grid grid-cols-1 md:grid-cols-3 gap-4"><Insight title="Top Performer" value="Lahore Study Link" note="Best volume-quality balance" /><Insight title="Fastest Partner" value="Northbridge" note="2.1 day average response" /><Insight title="Needs Recovery" value="Punjab Desk" note="Compliance and speed below threshold" /></section>}
  </div>;
}
function Bar({ label, value }) { return <div className="mt-3"><div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span>{value}%</span></div><div className="h-2 bg-slate-100 rounded-full"><div className="h-2 bg-slate-900 rounded-full" style={{ width: `${value}%` }} /></div></div>; }
function Insight({ title, value, note }) { return <div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-sm text-slate-500">{title}</p><p className="text-xl font-bold text-slate-950 mt-2">{value}</p><p className="text-xs text-slate-500 mt-2">{note}</p></div>; }
