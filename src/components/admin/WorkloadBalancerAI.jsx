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
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/40 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
          Workload AI
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          Workload Balancer AI
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Detects overloaded counselors, unassigned leads, and assignment imbalance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={Users} label="Tracked Leads" value={allLeads.length} />
        <Metric icon={UserPlus} label="Unassigned" value={unassigned.length} />
        <Metric icon={Scale} label="Counselors" value={Math.max(0, workloads.length - (grouped.Unassigned ? 1 : 0))} />
      </div>

      <div className="space-y-3">
        {workloads.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-black text-white">{item.name}</h3>
                <p className="mt-1 text-xs text-white/45">
                  {item.count} leads • {item.vip} VIP/high priority • Load {item.loadScore}
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-4 py-2 text-xs font-black ${
                  item.level === "Overloaded"
                    ? "border-red-400/20 bg-red-500/10 text-red-300"
                    : item.level === "Busy"
                    ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                }`}
              >
                {item.level}
              </span>
            </div>
          </motion.div>
        ))}

        {unassigned.length > 0 && (
          <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-5 text-red-200">
            <div className="flex gap-3">
              <AlertTriangle />
              <p>{unassigned.length} lead(s) need assignment ownership.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 text-[#D4AF37]">
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-75">{label}</p>
        <Icon size={22} />
      </div>
      <h3 className="mt-3 text-3xl font-black">{value}</h3>
    </div>
  );
}

export default WorkloadBalancerAI;