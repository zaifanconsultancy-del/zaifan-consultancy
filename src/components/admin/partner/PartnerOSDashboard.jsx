import React, { useMemo, useState } from 'react';
import AgentNetworkCenter from './AgentNetworkCenter';
import UniversityPartnerCenter from './UniversityPartnerCenter';
import CommissionCenter from './CommissionCenter';
import PartnerPerformance from './PartnerPerformance';
import PartnerAnalytics from './PartnerAnalytics';

const partners = [
  { id: 'AG-001', name: 'Lahore Study Link', type: 'Agent', country: 'Pakistan', status: 'Active', students: 42, revenue: 1850000, conversion: 34, risk: 'Low', owner: 'Ayesha Khan', lastActivity: 'Today' },
  { id: 'AG-002', name: 'Karachi Global Admissions', type: 'Agent', country: 'Pakistan', status: 'Review', students: 28, revenue: 1190000, conversion: 27, risk: 'Medium', owner: 'Bilal Ahmed', lastActivity: 'Yesterday' },
  { id: 'UN-001', name: 'Northbridge University', type: 'University', country: 'UK', status: 'Active', students: 63, revenue: 4200000, conversion: 41, risk: 'Low', owner: 'Sara Malik', lastActivity: '2 days ago' },
  { id: 'UN-002', name: 'Maple State College', type: 'University', country: 'Canada', status: 'Active', students: 31, revenue: 2400000, conversion: 32, risk: 'Low', owner: 'Hamza Ali', lastActivity: 'Today' },
  { id: 'AG-003', name: 'Punjab Student Desk', type: 'Agent', country: 'Pakistan', status: 'Paused', students: 11, revenue: 370000, conversion: 16, risk: 'High', owner: 'Nimra Shah', lastActivity: '9 days ago' },
];

const updates = [
  { title: 'Commission reconciliation completed', detail: '18 partner payouts matched with invoices.', severity: 'success' },
  { title: 'University intake update', detail: 'Northbridge September intake deadline moved forward.', severity: 'warning' },
  { title: 'Agent compliance review', detail: 'Punjab Student Desk requires document verification audit.', severity: 'danger' },
  { title: 'New partner opportunity', detail: 'Maple State College requested counselor training session.', severity: 'info' },
];

function currency(value) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(value);
}

export default function PartnerOSDashboard({ compact = false }) {
  const [activeView, setActiveView] = useState('overview');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesType = type === 'All' || partner.type === type;
      const text = `${partner.name} ${partner.country} ${partner.owner} ${partner.status}`.toLowerCase();
      return matchesType && text.includes(search.toLowerCase());
    });
  }, [search, type]);

  const metrics = useMemo(() => {
    const totalRevenue = partners.reduce((sum, partner) => sum + partner.revenue, 0);
    const totalStudents = partners.reduce((sum, partner) => sum + partner.students, 0);
    const active = partners.filter((partner) => partner.status === 'Active').length;
    const avgConversion = Math.round(partners.reduce((sum, partner) => sum + partner.conversion, 0) / partners.length);
    return { totalRevenue, totalStudents, active, avgConversion };
  }, []);

  const tabs = [
    ['overview', 'Overview'],
    ['agents', 'Agent Network'],
    ['universities', 'University Partners'],
    ['commissions', 'Commissions'],
    ['performance', 'Performance'],
    ['analytics', 'Analytics'],
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Partner Revenue" value={currency(metrics.totalRevenue)} note="Across active partner channels" />
        <MetricCard label="Partner Students" value={metrics.totalStudents} note="Assigned or referred students" />
        <MetricCard label="Active Partners" value={metrics.active} note={`${partners.length} total tracked partners`} />
        <MetricCard label="Avg Conversion" value={`${metrics.avgConversion}%`} note="Inquiry to application conversion" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Partner Command Table</h3>
              <p className="text-sm text-slate-500">Live partner health, contribution, risk, and ownership.</p>
            </div>
            <div className="flex gap-2">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search partners..." className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <select value={type} onChange={(event) => setType(event.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm">
                <option>All</option><option>Agent</option><option>University</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b"><th className="py-3">Partner</th><th>Status</th><th>Students</th><th>Revenue</th><th>Conversion</th><th>Risk</th><th>Owner</th></tr></thead>
              <tbody>
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-3"><div className="font-semibold text-slate-900">{partner.name}</div><div className="text-xs text-slate-500">{partner.id} · {partner.type} · {partner.country}</div></td>
                    <td><Badge tone={partner.status === 'Active' ? 'green' : partner.status === 'Review' ? 'amber' : 'red'}>{partner.status}</Badge></td>
                    <td>{partner.students}</td>
                    <td>{currency(partner.revenue)}</td>
                    <td>{partner.conversion}%</td>
                    <td><Badge tone={partner.risk === 'Low' ? 'green' : partner.risk === 'Medium' ? 'amber' : 'red'}>{partner.risk}</Badge></td>
                    <td><div>{partner.owner}</div><div className="text-xs text-slate-400">{partner.lastActivity}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Partner Health Feed</h3>
          <div className="space-y-3">
            {updates.map((item) => <UpdateCard key={item.title} item={item} />)}
          </div>
        </div>
      </section>

      {!compact && <PartnerAnalytics compact />}
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <header className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Zaifan Enterprise OS</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-950">Partner OS</h1>
          <p className="text-slate-600 mt-1">Agent network, university partners, commissions, partner performance, and executive analytics.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <StatusPill label="Network Health" value="91%" />
          <StatusPill label="Payout Readiness" value="96%" />
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setActiveView(key)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border ${activeView === key ? 'bg-slate-950 text-white border-slate-950' : 'bg-white text-slate-700 border-slate-200'}`}>{label}</button>
        ))}
      </nav>

      {activeView === 'overview' && renderOverview()}
      {activeView === 'agents' && <AgentNetworkCenter compact={compact} />}
      {activeView === 'universities' && <UniversityPartnerCenter compact={compact} />}
      {activeView === 'commissions' && <CommissionCenter compact={compact} />}
      {activeView === 'performance' && <PartnerPerformance compact={compact} />}
      {activeView === 'analytics' && <PartnerAnalytics compact={compact} />}
    </div>
  );
}

function MetricCard({ label, value, note }) { return <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><div className="text-2xl font-bold text-slate-950 mt-2">{value}</div><p className="text-xs text-slate-500 mt-2">{note}</p></div>; }
function StatusPill({ label, value }) { return <div className="bg-white rounded-xl border border-slate-200 px-4 py-3"><p className="text-xs text-slate-500">{label}</p><p className="font-bold text-slate-900">{value}</p></div>; }
function Badge({ tone, children }) { const tones = { green: 'bg-emerald-50 text-emerald-700 border-emerald-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', red: 'bg-red-50 text-red-700 border-red-200' }; return <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${tones[tone] || tones.green}`}>{children}</span>; }
function UpdateCard({ item }) { return <div className="border border-slate-200 rounded-xl p-3"><p className="font-semibold text-slate-900 text-sm">{item.title}</p><p className="text-xs text-slate-500 mt-1">{item.detail}</p></div>; }
