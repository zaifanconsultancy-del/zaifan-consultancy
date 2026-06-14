import React, { useMemo, useState } from "react";
import { BookOpen, ClipboardList, GraduationCap, Landmark, ShieldCheck, Search, Activity, AlertTriangle, TrendingUp, Users, RefreshCw, FileText, CheckCircle2, Clock, BarChart3, Layers, Filter, Sparkles } from "lucide-react";
import SOPCenter from "./SOPCenter";
import TrainingKnowledgeBase from "./TrainingKnowledgeBase";
import UniversityKnowledgeHub from "./UniversityKnowledgeHub";
import VisaKnowledgeHub from "./VisaKnowledgeHub";
import PolicyKnowledgeHub from "./PolicyKnowledgeHub";

const knowledgeModules = [
  { key: "overview", label: "Overview", icon: BookOpen },
  { key: "sop", label: "SOP Center", icon: ClipboardList },
  { key: "training", label: "Training Center", icon: GraduationCap },
  { key: "university", label: "University Hub", icon: Landmark },
  { key: "visa", label: "Visa Hub", icon: ShieldCheck },
  { key: "policy", label: "Policy Hub", icon: FileText }
];

const knowledgeItems = [
  { id: "SOP-001", title: "Inquiry to Application Conversion SOP", module: "SOP", category: "Admissions", owner: "Counselor Ops", status: "Approved", priority: "Critical", updatedAt: "2026-06-10", views: 184, health: 97, tags: ["inquiry", "application", "conversion"], summary: "Standard workflow for moving qualified inquiries into active applications with required checks." },
  { id: "SOP-014", title: "CAS Readiness Checklist", module: "SOP", category: "CAS", owner: "Application Team", status: "Approved", priority: "Critical", updatedAt: "2026-06-09", views: 143, health: 95, tags: ["CAS", "offer", "deposit"], summary: "Verification sequence before CAS request, including offer acceptance, payment proof, and document validation." },
  { id: "TRN-006", title: "Counselor Portal Operating Guide", module: "Training", category: "Internal Training", owner: "Training Lead", status: "Live", priority: "High", updatedAt: "2026-06-08", views: 221, health: 92, tags: ["counselor", "portal", "tasks"], summary: "Role-based guide for daily counselor actions, student follow-up, and escalation handling." },
  { id: "UNI-021", title: "UK University Intake Rules", module: "University", category: "University Rules", owner: "University Desk", status: "Review", priority: "High", updatedAt: "2026-06-07", views: 118, health: 84, tags: ["UK", "intake", "requirements"], summary: "Current intake, deadline, deposit, and offer conditions used by planning and application teams." },
  { id: "VISA-011", title: "Pakistan Student Visa Evidence Matrix", module: "Visa", category: "Visa Evidence", owner: "Visa Desk", status: "Approved", priority: "Critical", updatedAt: "2026-06-11", views: 176, health: 96, tags: ["visa", "Pakistan", "evidence"], summary: "Evidence checklist for funds, sponsor documents, CAS, accommodation, and interview readiness." },
  { id: "POL-004", title: "Document Handling & Compliance Policy", module: "Policy", category: "Compliance", owner: "Compliance OS", status: "Approved", priority: "Critical", updatedAt: "2026-06-06", views: 99, health: 93, tags: ["documents", "privacy", "compliance"], summary: "Internal policy for document collection, verification, visibility, retention, and staff access." },
  { id: "TRN-019", title: "Executive AI Recovery Queue Training", module: "Training", category: "Executive AI", owner: "Automation Lead", status: "Draft", priority: "Medium", updatedAt: "2026-06-05", views: 64, health: 76, tags: ["executive", "automation", "recovery"], summary: "How managers should read recovery queues, broken-stage metrics, and verification snapshots." }
];

const recentUpdates = [
  { title: "Visa evidence matrix refreshed", owner: "Visa Desk", type: "Visa", date: "2026-06-11", impact: "High" },
  { title: "CAS readiness SOP approved", owner: "Application Team", type: "SOP", date: "2026-06-09", impact: "Critical" },
  { title: "Counselor training guide updated", owner: "Training Lead", type: "Training", date: "2026-06-08", impact: "Medium" },
  { title: "University intake rulebook needs review", owner: "University Desk", type: "University", date: "2026-06-07", impact: "High" }
];

function StatCard({ label, value, subtext, icon: Icon, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100"
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">{value}</h3>
          <p className="mt-1 text-xs text-slate-500">{subtext}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${tones[tone] || tones.blue}`}><Icon size={22} /></div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Live: "bg-blue-50 text-blue-700 border-blue-200",
    Review: "bg-amber-50 text-amber-700 border-amber-200",
    Draft: "bg-slate-50 text-slate-600 border-slate-200"
  };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${map[status] || map.Draft}`}>{status}</span>;
}

function KnowledgeOverview({ filteredItems, activeCategory, setActiveCategory, searchTerm, setSearchTerm }) {
  const metrics = useMemo(() => {
    const total = knowledgeItems.length;
    const approved = knowledgeItems.filter((item) => ["Approved", "Live"].includes(item.status)).length;
    const review = knowledgeItems.filter((item) => item.status === "Review").length;
    const avgHealth = Math.round(knowledgeItems.reduce((sum, item) => sum + item.health, 0) / total);
    return { total, approved, review, avgHealth };
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(knowledgeItems.map((item) => item.category)))], []);
  const moduleCounts = useMemo(() => knowledgeItems.reduce((acc, item) => ({ ...acc, [item.module]: (acc[item.module] || 0) + 1 }), {}), []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Knowledge Assets" value={metrics.total} subtext="SOPs, policies, guides and hubs" icon={Layers} tone="blue" />
        <StatCard label="Approved / Live" value={metrics.approved} subtext="Ready for team execution" icon={CheckCircle2} tone="green" />
        <StatCard label="Needs Review" value={metrics.review} subtext="Rules or docs requiring attention" icon={AlertTriangle} tone="amber" />
        <StatCard label="Health Score" value={`${metrics.avgHealth}%`} subtext="Freshness, ownership and usage" icon={Activity} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Knowledge Command Center</h2>
              <p className="text-sm text-slate-500">Search, filter and monitor operational knowledge across the enterprise OS.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search knowledge..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400" />
              </div>
              <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.id} · {item.module} · {item.category}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.owner}</td>
                    <td className="px-4 py-3"><StatusPill status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-800" style={{ width: `${item.health}%` }} /></div>
                        <span className="text-xs font-semibold text-slate-700">{item.health}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Knowledge Health</h3>
              <RefreshCw size={16} className="text-slate-400" />
            </div>
            <div className="space-y-3">
              {Object.entries(moduleCounts).map(([module, count]) => (
                <div key={module} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{module}</span><span className="text-slate-500">{count} assets</span></div>
                  <div className="mt-2 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, count * 18)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Recent Updates</h3>
            <div className="mt-4 space-y-3">
              {recentUpdates.map((update) => (
                <div key={update.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Clock size={15} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{update.title}</div>
                    <div className="text-xs text-slate-500">{update.owner} · {update.date} · {update.impact} impact</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2"><BarChart3 size={18} className="text-blue-600" /><h3 className="font-bold text-slate-900">Knowledge Analytics</h3></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Total Views</div><div className="mt-1 text-2xl font-bold text-slate-900">1,005</div><div className="mt-1 text-xs text-emerald-600">+18% this week</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Team Adoption</div><div className="mt-1 text-2xl font-bold text-slate-900">89%</div><div className="mt-1 text-xs text-emerald-600">+7% vs last cycle</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Review SLA</div><div className="mt-1 text-2xl font-bold text-slate-900">2.3d</div><div className="mt-1 text-xs text-amber-600">1 overdue item</div></div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
          <div className="flex items-center gap-2"><Sparkles size={18} /><h3 className="font-bold">AI Knowledge Signals</h3></div>
          <p className="mt-3 text-sm text-slate-300">Recommended next action: update university intake rules and convert Executive AI recovery training from draft to live.</p>
          <button className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">Open Review Queue</button>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeOSDashboard({ compact = false, adminProfile = null }) {
  const [activeModule, setActiveModule] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return knowledgeItems.filter((item) => {
      const matchesTerm = !term || [item.title, item.summary, item.owner, item.category, item.module, ...item.tags].join(" ").toLowerCase().includes(term);
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesTerm && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const renderActiveModule = () => {
    if (activeModule === "sop") return <SOPCenter compact={compact} />;
    if (activeModule === "training") return <TrainingKnowledgeBase compact={compact} />;
    if (activeModule === "university") return <UniversityKnowledgeHub compact={compact} />;
    if (activeModule === "visa") return <VisaKnowledgeHub compact={compact} />;
    if (activeModule === "policy") return <PolicyKnowledgeHub compact={compact} />;
    return <KnowledgeOverview filteredItems={filteredItems} activeCategory={activeCategory} setActiveCategory={setActiveCategory} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><BookOpen size={17} /> Zaifan Enterprise Knowledge OS</div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Knowledge Command Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">Central operating layer for SOPs, training, university rules, visa guidance, policies, search, knowledge health, recent updates, and executive analytics.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Mode</div><div className="font-bold">{compact ? "Compact" : "Full"}</div></div>
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs text-slate-500">User</div><div className="font-bold">{adminProfile?.name || "Executive"}</div></div>
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Coverage</div><div className="font-bold">94%</div></div>
              <div className="rounded-2xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Risk</div><div className="font-bold text-amber-600">Low</div></div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {knowledgeModules.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveModule(key)} className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeModule === key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {renderActiveModule()}
      </div>
    </div>
  );
}
