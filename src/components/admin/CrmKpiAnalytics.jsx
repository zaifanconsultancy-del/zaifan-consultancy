import { motion } from "framer-motion";

function CrmKpiAnalytics({ cardClass = "", inquiries = [], appointments = [] }) {
  const totalLeads = inquiries.length + appointments.length;

  const convertedInquiries = inquiries.filter((item) =>
    ["approved", "visa_process", "offer_letter", "applied"].includes(
      item.status || ""
    )
  ).length;

  const completedAppointments = appointments.filter(
    (item) => item.status === "completed"
  ).length;

  const vipLeads = [...inquiries, ...appointments].filter(
    (item) => item.priority === "vip"
  ).length;

  const highLeads = [...inquiries, ...appointments].filter(
    (item) => item.priority === "high"
  ).length;

  const assignedLeads = [...inquiries, ...appointments].filter(
    (item) => item.assigned_admin_id
  ).length;

  const conversionRate =
    totalLeads > 0
      ? Math.round(((convertedInquiries + completedAppointments) / totalLeads) * 100)
      : 0;

  const assignedRate =
    totalLeads > 0 ? Math.round((assignedLeads / totalLeads) * 100) : 0;

  const kpis = [
    {
      label: "Total CRM Leads",
      value: totalLeads,
      helper: "Inquiries + appointments",
      icon: "🧲",
      color: "text-[#D4AF37]",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      helper: "Applied, approved, or completed",
      icon: "📈",
      color: "text-green-400",
    },
    {
      label: "Assigned Rate",
      value: `${assignedRate}%`,
      helper: "Leads with staff ownership",
      icon: "👥",
      color: "text-blue-300",
    },
    {
      label: "Priority Leads",
      value: vipLeads + highLeads,
      helper: `${vipLeads} VIP / ${highLeads} High`,
      icon: "🔥",
      color: "text-red-300",
    },
  ];

  return (
    <motion.section
      key="crm-kpi-analytics"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} p-6 sm:p-8`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Executive CRM Intelligence
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            KPI Analytics
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            High-level performance snapshot for leads, conversions, ownership,
            and priority workload.
          </p>
        </div>

        <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]">
          Live CRM Data
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.04 }}
            className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/25 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:bg-white/[0.055]"
          >
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition group-hover:opacity-80"></div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                  {item.label}
                </p>

                <h3 className={`mt-3 text-4xl font-black ${item.color}`}>
                  {item.value}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                  {item.helper}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
                {item.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

export default CrmKpiAnalytics;