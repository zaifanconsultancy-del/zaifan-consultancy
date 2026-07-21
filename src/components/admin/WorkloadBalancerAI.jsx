// WorkloadBalancerAI V2 — Workload Command Center
// Preserves lead grouping, unassigned detection, VIP weighting, workload scoring,
// counselor counts and overload classification.
// Visual layer aligned with the approved Zaifan Admin OS.

import { motion } from "framer-motion";
import { AlertTriangle, Scale, UserPlus, Users } from "lucide-react";

function WorkloadBalancerAI({ inquiries = [], appointments = [] }) {
  const allLeads = [...inquiries, ...appointments];

  const unassigned = allLeads.filter((lead) => !lead.assigned_admin_id);

  const grouped = allLeads.reduce((acc, lead) => {
    const name = lead.assigned_admin_name || "Unassigned";
    if (!acc[name]) acc[name] = [];
    acc[name].push(lead);
    return acc;
  }, {});

  const workloads = Object.entries(grouped)
    .map(([name, leads]) => {
      const vip = leads.filter((lead) =>
        ["vip", "high"].includes(String(lead.priority || "").toLowerCase())
      ).length;

      const loadScore = leads.length * 10 + vip * 15;

      return {
        name,
        count: leads.length,
        vip,
        loadScore,
        level: loadScore >= 90 ? "Overloaded" : loadScore >= 50 ? "Busy" : "Balanced",
      };
    })
    .sort((a, b) => b.loadScore - a.loadScore);

  return (
    <section className="space-y-5 text-[#10233f]">
      <div className="rounded-[1.8rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)]">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">
          Workload AI
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          Workload Balancer AI
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Detect overloaded counselors, unassigned leads, and assignment imbalance before workload pressure affects student follow-up.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={Users} label="Tracked Leads" value={allLeads.length} />
        <Metric icon={UserPlus} label="Unassigned" value={unassigned.length} tone="warning" />
        <Metric icon={Scale} label="Counselors" value={Math.max(0, workloads.length - (grouped.Unassigned ? 1 : 0))} />
      </div>

      <div className="space-y-3">
        {workloads.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-black text-[#10233f]">{item.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.count} leads • {item.vip} VIP/high priority • Load {item.loadScore}
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${
                  item.level === "Overloaded"
                    ? "border-red-300 bg-red-50 text-red-700"
                    : item.level === "Busy"
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-emerald-300 bg-emerald-50 text-emerald-700"
                }`}
              >
                {item.level}
              </span>
            </div>
          </motion.div>
        ))}

        {unassigned.length > 0 && (
          <div className="rounded-[1.5rem] border border-red-300 bg-red-50 p-5 text-red-700">
            <div className="flex gap-3">
              <AlertTriangle />
              <p className="font-semibold">{unassigned.length} lead(s) need assignment ownership.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone = "default" }) {
  const style =
    tone === "warning"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : "border-slate-300 bg-white text-orange-700";

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)] ${style}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
          <Icon size={20} />
        </span>
      </div>
      <h3 className="mt-3 text-3xl font-black text-[#10233f]">{value}</h3>
    </div>
  );
}

export default WorkloadBalancerAI;