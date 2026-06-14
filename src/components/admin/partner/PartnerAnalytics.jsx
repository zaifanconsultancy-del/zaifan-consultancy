import React from 'react';

const funnels = [
  { label: 'Referred Leads', value: 367, width: 100 },
  { label: 'Qualified Leads', value: 241, width: 66 },
  { label: 'Applications', value: 113, width: 31 },
  { label: 'Offers', value: 55, width: 15 },
  { label: 'Enrolled', value: 28, width: 8 },
];

const trends = [
  { month: 'Jan', revenue: 720000, students: 9 },
  { month: 'Feb', revenue: 880000, students: 12 },
  { month: 'Mar', revenue: 1150000, students: 15 },
  { month: 'Apr', revenue: 1420000, students: 18 },
  { month: 'May', revenue: 1690000, students: 22 },
  { month: 'Jun', revenue: 2130000, students: 29 },
];

export default function PartnerAnalytics({ compact = false }) {
  const maxRevenue = Math.max(...trends.map((item) => item.revenue));
  return <div className="space-y-5">
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Partner Funnel Analytics</h2><p className="text-sm text-slate-500 mb-4">Referral to enrollment movement across partner channels.</p>{funnels.map((f)=><div key={f.label} className="mb-3"><div className="flex justify-between text-sm mb-1"><span>{f.label}</span><b>{f.value}</b></div><div className="h-3 bg-slate-100 rounded-full"><div className="h-3 bg-indigo-600 rounded-full" style={{ width: `${f.width}%` }} /></div></div>)}</div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h2 className="text-xl font-bold text-slate-950">Revenue Trend</h2><p className="text-sm text-slate-500 mb-4">Monthly partner revenue and student contribution.</p><div className="space-y-3">{trends.map((t)=><div key={t.month} className="grid grid-cols-6 gap-3 items-center text-sm"><span className="font-semibold">{t.month}</span><div className="col-span-4 h-3 bg-slate-100 rounded-full"><div className="h-3 bg-slate-900 rounded-full" style={{ width: `${Math.round((t.revenue / maxRevenue) * 100)}%` }} /></div><span>{t.students}</span></div>)}</div></div>
    </section>
    {!compact && <section className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-bold text-slate-900 mb-3">Executive Partner Intelligence</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{['Double down on Gold agents with high offer yield.', 'Create recovery workflow for paused partners.', 'Use university SLA as ranking factor in recommendations.', 'Connect commission release with payment verification.', 'Trigger partner training when compliance drops below 80%.', 'Prioritize UK strategic universities for September intake.'].map(item=><div key={item} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">{item}</div>)}</div></section>}
  </div>;
}
