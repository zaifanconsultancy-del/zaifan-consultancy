import { motion } from "framer-motion";
import { Brain, Crown, Target, TrendingUp, Users } from "lucide-react";

function CounselorPerformanceAI({ inquiries = [], appointments = [] }) {
  const allLeads = [...inquiries, ...appointments];

  const assigned = allLeads.filter((lead) => lead.assigned_admin_name);
  const grouped = assigned.reduce((acc, lead) => {
    const name = lead.assigned_admin_name || "Unassigned";
    if (!acc[name]) acc[name] = [];
    acc[name].push(lead);
    return acc;
  }, {});

  const counselors = Object.entries(grouped)
    .map(([name, leads]) => {
      const converted = leads.filter((lead) =>
        ["approved", "converted", "completed", "confirmed"].includes(
          String(lead.status || "").toLowerCase()
        )
      ).length;

      const vip = leads.filter((lead) =>
        ["vip", "high"].includes(String(lead.priority || "").toLowerCase())
      ).length;

      const score = Math.min(
        100,
        Math.round(leads.length * 8 + converted * 18 + vip * 10)
      );

      return { name, leads: leads.length, converted, vip, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/40 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
          Counselor AI
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">
          Counselor Performance AI
        </h2>
        <p className="mt-2 text-sm text-white/50">
          Scores counselor workload, conversion handling, and priority lead ownership.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Users} label="Counselors" value={counselors.length} />
        <Metric icon={Target} label="Assigned Leads" value={assigned.length} />
        <Metric icon={Crown} label="VIP Owned" value={counselors.reduce((s, c) => s + c.vip, 0)} />
        <Metric icon={TrendingUp} label="Top Score" value={counselors[0]?.score || 0} />
      </div>

      <div className="space-y-3">
        {counselors.length === 0 ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
            No assigned counselor data yet.
          </div>
        ) : (
          counselors.map((counselor, index) => (
            <motion.div
              key={counselor.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-black text-white">{counselor.name}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {counselor.leads} leads • {counselor.converted} converted/advanced • {counselor.vip} VIP
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-3 text-[#D4AF37]">
                  <span className="text-xs">AI Score</span>
                  <p className="text-2xl font-black">{counselor.score}</p>
                </div>
              </div>
            </motion.div>
          ))
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

export default CounselorPerformanceAI;