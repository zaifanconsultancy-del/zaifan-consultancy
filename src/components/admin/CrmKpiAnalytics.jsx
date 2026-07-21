import { motion } from "framer-motion";

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function CrmKpiAnalytics({ cardClass = "", inquiries = [], appointments = [] }) {
  const allLeads = [...inquiries, ...appointments];
  const totalLeads = allLeads.length;

  const convertedInquiries = inquiries.filter((item) =>
    ["approved", "visa_process", "offer_letter", "applied"].includes(normalize(item.status))
  ).length;

  const completedAppointments = appointments.filter(
    (item) => normalize(item.status) === "completed"
  ).length;

  const vipLeads = allLeads.filter((item) => normalize(item.priority) === "vip").length;
  const highLeads = allLeads.filter((item) => normalize(item.priority) === "high").length;
  const assignedLeads = allLeads.filter((item) => item.assigned_admin_id).length;

  const conversionRate = totalLeads
    ? Math.round(((convertedInquiries + completedAppointments) / totalLeads) * 100)
    : 0;

  const assignedRate = totalLeads
    ? Math.round((assignedLeads / totalLeads) * 100)
    : 0;

  const kpis = [
    { label: "Total CRM Leads", value: totalLeads, helper: "Inquiries + appointments", icon: "🧲", tone: "orange" },
    { label: "Conversion Rate", value: `${conversionRate}%`, helper: "Applied, approved, or completed", icon: "📈", tone: "orange" },
    { label: "Assigned Rate", value: `${assignedRate}%`, helper: "Leads with staff ownership", icon: "👥", tone: "navy" },
    { label: "Priority Leads", value: vipLeads + highLeads, helper: `${vipLeads} VIP / ${highLeads} High`, icon: "🔥", tone: "red" },
  ];

  return (
    <motion.section
      key="crm-kpi-analytics"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} rounded-[2rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#B84F0E]">Executive CRM Intelligence</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#17243D] sm:text-4xl">KPI Analytics</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">
            High-level performance snapshot for leads, conversions, ownership, and priority workload.
          </p>
        </div>

        <div className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-4 py-2 text-xs font-black text-[#B84F0E]">Live CRM Data</div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <motion.article
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: index * 0.04 }}
            className="rounded-[1.6rem] border border-[#243A60]/18 bg-white p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)] transition hover:-translate-y-0.5 hover:border-[#E9802D]/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">{item.label}</p>
                <h3 className={`mt-3 text-4xl font-black ${toneText(item.tone)}`}>{item.value}</h3>
                <p className="mt-2 text-xs leading-5 text-[#667085]">{item.helper}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-2xl ${toneBox(item.tone)}`}>{item.icon}</div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}

function toneText(tone) {
  if (tone === "red") return "text-[#A8342F]";
  if (tone === "navy") return "text-[#243A60]";
  return "text-[#B84F0E]";
}

function toneBox(tone) {
  if (tone === "red") return "border-[#C2413B]/30 bg-[#FFF0EE]";
  if (tone === "navy") return "border-[#243A60]/22 bg-[#F3F5F8]";
  return "border-[#E9802D]/35 bg-[#FFF1E3]";
}

export default CrmKpiAnalytics;