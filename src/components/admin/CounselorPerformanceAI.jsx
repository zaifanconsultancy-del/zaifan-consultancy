import { useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, Target, TrendingUp, Users } from "lucide-react";

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function CounselorPerformanceAI({ inquiries = [], appointments = [] }) {
  const counselors = useMemo(() => {
    const allLeads = [...inquiries, ...appointments];
    const assigned = allLeads.filter((lead) => lead.assigned_admin_name);

    const grouped = assigned.reduce((acc, lead) => {
      const name = lead.assigned_admin_name || "Unassigned";
      if (!acc[name]) acc[name] = [];
      acc[name].push(lead);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, leads]) => {
        const converted = leads.filter((lead) =>
          ["approved", "converted", "completed", "confirmed"].includes(
            normalize(lead.status)
          )
        ).length;

        const vip = leads.filter((lead) =>
          ["vip", "high"].includes(normalize(lead.priority))
        ).length;

        const score = Math.min(
          100,
          Math.round(leads.length * 8 + converted * 18 + vip * 10)
        );

        const conversionRate = leads.length
          ? Math.round((converted / leads.length) * 100)
          : 0;

        return {
          name,
          leads: leads.length,
          converted,
          vip,
          score,
          conversionRate,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [inquiries, appointments]);

  const assignedCount = counselors.reduce((sum, item) => sum + item.leads, 0);
  const vipOwned = counselors.reduce((sum, item) => sum + item.vip, 0);
  const convertedCount = counselors.reduce(
    (sum, item) => sum + item.converted,
    0
  );

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
              Counselor Intelligence
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#17243D]">
              Counselor Performance AI
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
              Scores counselor workload, priority ownership, and conversion
              handling from live inquiry and appointment records.
            </p>
          </div>

          <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-4 py-2 text-xs font-black text-[#B84F0E]">
            Live CRM scoring
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Counselors" value={counselors.length} />
        <Metric icon={Target} label="Assigned Leads" value={assignedCount} />
        <Metric icon={Crown} label="VIP Owned" value={vipOwned} />
        <Metric icon={TrendingUp} label="Converted" value={convertedCount} />
      </div>

      <div className="rounded-[1.75rem] border border-[#243A60]/18 bg-[#FFFDF8] p-5 shadow-[0_14px_36px_rgba(23,36,61,0.06)] sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8992A1]">
              Ranked Team
            </p>
            <h3 className="mt-2 text-xl font-black text-[#17243D]">
              Workload and conversion performance
            </h3>
          </div>
          <span className="text-xs font-bold text-[#667085]">
            Higher scores reflect stronger activity and outcomes.
          </span>
        </div>

        <div className="space-y-3">
          {counselors.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[#243A60]/20 bg-white p-8 text-center">
              <p className="font-black text-[#17243D]">
                No assigned counselor data yet.
              </p>
              <p className="mt-2 text-sm text-[#667085]">
                Assign inquiries or appointments to counselors to begin scoring.
              </p>
            </div>
          ) : (
            counselors.map((counselor, index) => (
              <motion.article
                key={counselor.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="rounded-[1.5rem] border border-[#243A60]/18 bg-white p-5 shadow-[0_10px_24px_rgba(23,36,61,0.045)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E9802D]/35 bg-[#FFF1E3] text-sm font-black text-[#B84F0E]">
                        {index + 1}
                      </span>
                      <h3 className="font-black text-[#17243D]">
                        {counselor.name}
                      </h3>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-[#667085]">
                      {counselor.leads} leads · {counselor.converted} converted or
                      advanced · {counselor.vip} VIP/high priority
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <SmallMetric label="Conversion" value={`${counselor.conversionRate}%`} />
                    <SmallMetric label="VIP Owned" value={counselor.vip} />
                    <div className="rounded-2xl border border-[#E9802D]/35 bg-[#FFF1E3] px-5 py-3 text-[#B84F0E]">
                      <span className="text-[10px] font-black uppercase tracking-[0.14em]">
                        AI Score
                      </span>
                      <p className="mt-1 text-2xl font-black">{counselor.score}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EDF0F4]">
                  <div
                    className="h-full rounded-full bg-[#E9802D]"
                    style={{ width: `${counselor.score}%` }}
                  />
                </div>
              </motion.article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-[#243A60]/18 bg-white p-5 shadow-[0_10px_26px_rgba(23,36,61,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#667085]">
          {label}
        </p>
        <span className="rounded-xl border border-[#E9802D]/30 bg-[#FFF1E3] p-2 text-[#B84F0E]">
          <Icon size={20} />
        </span>
      </div>
      <h3 className="mt-4 text-3xl font-black text-[#17243D]">{value}</h3>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#243A60]/16 bg-[#FFFDF8] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#8992A1]">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[#17243D]">{value}</p>
    </div>
  );
}

export default CounselorPerformanceAI;