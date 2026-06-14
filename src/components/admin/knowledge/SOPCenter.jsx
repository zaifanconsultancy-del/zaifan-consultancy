import React, { useMemo, useState } from "react";
import { ClipboardList, CheckCircle2, AlertTriangle, Clock, Search, Filter, Plus, FileCheck2, Workflow, Users, BarChart3 } from "lucide-react";

const sopRecords = [
  { code: "SOP-001", title: "Inquiry Qualification & Assignment", department: "Admissions", owner: "Counselor Ops", stage: "Inquiry", status: "Approved", priority: "Critical", steps: 9, completion: 98, lastReview: "2026-06-10", nextReview: "2026-07-10" },
  { code: "SOP-002", title: "University Shortlist Creation", department: "University Desk", owner: "Planning Team", stage: "Planning", status: "Approved", priority: "High", steps: 8, completion: 94, lastReview: "2026-06-08", nextReview: "2026-07-08" },
  { code: "SOP-014", title: "CAS Readiness & Request Workflow", department: "Application", owner: "CAS Desk", stage: "CAS", status: "Approved", priority: "Critical", steps: 12, completion: 96, lastReview: "2026-06-09", nextReview: "2026-07-09" },
  { code: "SOP-022", title: "Student Receipt Approval Flow", department: "Finance", owner: "Payment OS", stage: "Payment", status: "Live", priority: "High", steps: 7, completion: 91, lastReview: "2026-06-07", nextReview: "2026-07-07" },
  { code: "SOP-031", title: "Escalation and Recovery Queue Handling", department: "Executive", owner: "Verification OS", stage: "Recovery", status: "Review", priority: "Critical", steps: 10, completion: 82, lastReview: "2026-06-05", nextReview: "2026-06-19" }
];

const workflowStages = ["Inquiry", "Planning", "Application", "Offer", "CAS", "Visa", "Payment", "Portal", "Recovery"];

function Badge({ children, tone = "slate" }) {
  const styles = { slate: "bg-slate-50 text-slate-700 border-slate-200", green: "bg-emerald-50 text-emerald-700 border-emerald-200", amber: "bg-amber-50 text-amber-700 border-amber-200", red: "bg-red-50 text-red-700 border-red-200", blue: "bg-blue-50 text-blue-700 border-blue-200" };
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${styles[tone]}`}>{children}</span>;
}

export default function SOPCenter({ compact = false }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All");

  const filtered = useMemo(() => sopRecords.filter((sop) => {
    const matchesQuery = !query || [sop.code, sop.title, sop.department, sop.owner, sop.stage].join(" ").toLowerCase().includes(query.toLowerCase());
    const matchesStage = stage === "All" || sop.stage === stage;
    return matchesQuery && matchesStage;
  }), [query, stage]);

  const metrics = useMemo(() => ({
    total: sopRecords.length,
    approved: sopRecords.filter((x) => ["Approved", "Live"].includes(x.status)).length,
    review: sopRecords.filter((x) => x.status === "Review").length,
    avgCompletion: Math.round(sopRecords.reduce((sum, x) => sum + x.completion, 0) / sopRecords.length)
  }), []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><ClipboardList className="text-blue-600" /><div className="mt-3 text-2xl font-black">{metrics.total}</div><div className="text-sm text-slate-500">Active SOPs</div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><CheckCircle2 className="text-emerald-600" /><div className="mt-3 text-2xl font-black">{metrics.approved}</div><div className="text-sm text-slate-500">Approved / Live</div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><AlertTriangle className="text-amber-600" /><div className="mt-3 text-2xl font-black">{metrics.review}</div><div className="text-sm text-slate-500">Review Queue</div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><BarChart3 className="text-purple-600" /><div className="mt-3 text-2xl font-black">{metrics.avgCompletion}%</div><div className="text-sm text-slate-500">Execution Readiness</div></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-lg font-black text-slate-900">SOP Center</h2><p className="text-sm text-slate-500">Operational procedures mapped to the full student journey and executive recovery workflows.</p></div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none" placeholder="Search SOPs" /></div>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"><option>All</option>{workflowStages.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">SOP</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Readiness</th><th className="px-4 py-3">Review</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{filtered.map((sop) => <tr key={sop.code} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="font-bold text-slate-900">{sop.title}</div><div className="text-xs text-slate-500">{sop.code} · {sop.department} · {sop.owner}</div></td><td className="px-4 py-3"><Badge tone="blue">{sop.stage}</Badge></td><td className="px-4 py-3"><Badge tone={sop.status === "Review" ? "amber" : "green"}>{sop.status}</Badge></td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-2 w-20 rounded bg-slate-100"><div className="h-2 rounded bg-slate-900" style={{ width: `${sop.completion}%` }} /></div><span className="text-xs font-bold">{sop.completion}%</span></div></td><td className="px-4 py-3 text-slate-500">{sop.nextReview}</td></tr>)}</tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Workflow className="text-blue-600" size={18} /><h3 className="font-black">Journey Coverage</h3></div><div className="mt-4 grid grid-cols-2 gap-2">{workflowStages.map((x) => <div key={x} className="rounded-2xl bg-slate-50 p-3 text-sm"><div className="font-bold text-slate-800">{x}</div><div className="text-xs text-slate-500">{sopRecords.some((s) => s.stage === x) ? "Covered" : "Pending"}</div></div>)}</div></div>
          {!compact && <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Users className="text-purple-600" size={18} /><h3 className="font-black">Ownership Matrix</h3></div><div className="mt-4 space-y-3">{["Counselor Ops", "Planning Team", "CAS Desk", "Payment OS", "Verification OS"].map((owner) => <div key={owner} className="flex justify-between rounded-2xl bg-slate-50 p-3 text-sm"><span className="font-semibold">{owner}</span><span className="text-slate-500">{sopRecords.filter((x) => x.owner === owner).length} SOP</span></div>)}</div></div>}
        </div>
      </div>
    </div>
  );
}
