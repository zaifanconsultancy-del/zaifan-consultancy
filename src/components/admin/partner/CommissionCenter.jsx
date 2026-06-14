import React, { useMemo, useState } from 'react';

const commissions = [
  { id: 'COM-1001', partner: 'Lahore Study Link', student: 'Nadeem Khan', stage: 'Paid Tuition', amount: 145000, status: 'Approved', invoice: 'INV-551' },
  { id: 'COM-1002', partner: 'Northbridge University', student: 'Amina Tariq', stage: 'CAS Issued', amount: 220000, status: 'Pending', invoice: 'INV-552' },
  { id: 'COM-1003', partner: 'Karachi Global Admissions', student: 'Usman Ali', stage: 'Offer Accepted', amount: 98000, status: 'Review', invoice: 'INV-553' },
  { id: 'COM-1004', partner: 'Capital Edu Partners', student: 'Hira Shah', stage: 'Visa Approved', amount: 175000, status: 'Approved', invoice: 'INV-554' },
];

export default function CommissionCenter({ compact = false }) {
  const [status, setStatus] = useState('All');
  const rows = useMemo(() => commissions.filter((item) => status === 'All' || item.status === status), [status]);
  const total = commissions.reduce((sum, item) => sum + item.amount, 0);
  const approved = commissions.filter((item) => item.status === 'Approved').reduce((sum, item) => sum + item.amount, 0);

  return <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card label="Total Commission" value={`PKR ${total.toLocaleString()}`} /><Card label="Approved" value={`PKR ${approved.toLocaleString()}`} /><Card label="Pending Items" value={commissions.filter(i=>i.status==='Pending').length} /><Card label="Review Items" value={commissions.filter(i=>i.status==='Review').length} /></div>
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex justify-between mb-4 gap-3 flex-wrap"><div><h2 className="text-xl font-bold text-slate-950">Commission Center</h2><p className="text-sm text-slate-500">Track partner commission eligibility, approvals, reconciliation, and payout readiness.</p></div><select value={status} onChange={(e)=>setStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm"><option>All</option><option>Approved</option><option>Pending</option><option>Review</option></select></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-slate-500 border-b"><th className="py-3">ID</th><th>Partner</th><th>Student</th><th>Trigger Stage</th><th>Amount</th><th>Status</th><th>Invoice</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id} className="border-b last:border-0"><td className="py-3 font-semibold">{row.id}</td><td>{row.partner}</td><td>{row.student}</td><td>{row.stage}</td><td>PKR {row.amount.toLocaleString()}</td><td>{row.status}</td><td>{row.invoice}</td></tr>)}</tbody></table></div></section>
    {!compact && <section className="grid grid-cols-1 lg:grid-cols-2 gap-5"><Box title="Payout Controls" items={['Invoice matched', 'Student payment confirmed', 'Partner agreement active', 'No compliance hold', 'Finance approval complete']} /><Box title="Dispute Queue" items={['Duplicate claim check', 'Wrong partner attribution', 'Missing tuition proof', 'Stage trigger mismatch', 'Manual executive override']} /></section>}
  </div>;
}
function Card({ label, value }) { return <div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-950 mt-2">{value}</p></div>; }
function Box({ title, items }) { return <div className="bg-white border border-slate-200 rounded-2xl p-5"><h3 className="font-bold mb-3 text-slate-900">{title}</h3>{items.map(item=><div key={item} className="p-3 border border-slate-100 bg-slate-50 rounded-xl text-sm mb-2">{item}</div>)}</div>; }
