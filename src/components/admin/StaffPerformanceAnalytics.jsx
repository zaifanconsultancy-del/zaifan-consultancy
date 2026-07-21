// StaffPerformanceAnalytics V2 — Team Intelligence
// Preserves staff grouping, inquiry/appointment counts, VIP/high pressure,
// completed outcomes and ownership aggregation.
// Visual layer aligned with the approved Zaifan Admin OS.

import { motion } from "framer-motion";

function StaffPerformanceAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const allLeads = [
    ...inquiries.map((item) => ({ ...item, lead_type: "Inquiry" })),
    ...appointments.map((item) => ({ ...item, lead_type: "Appointment" })),
  ];

  const staffMap = new Map();

  allLeads.forEach((lead) => {
    const staffId = lead.assigned_admin_id || "unassigned";
    const staffName = lead.assigned_admin_name || "Unassigned";

    if (!staffMap.has(staffId)) {
      staffMap.set(staffId, {
        id: staffId,
        name: staffName,
        total: 0,
        inquiries: 0,
        appointments: 0,
        vip: 0,
        high: 0,
        completed: 0,
      });
    }

    const record = staffMap.get(staffId);

    record.total += 1;

    if (lead.lead_type === "Inquiry") record.inquiries += 1;
    if (lead.lead_type === "Appointment") record.appointments += 1;
    if (lead.priority === "vip") record.vip += 1;
    if (lead.priority === "high") record.high += 1;

    if (
      ["approved", "completed", "visa_process", "offer_letter", "applied"].includes(
        lead.status || lead.appointment_stage || ""
      )
    ) {
      record.completed += 1;
    }
  });

  const staffRows = Array.from(staffMap.values()).sort(
    (a, b) => b.total - a.total
  );

  return (
    <motion.section
      key="staff-performance"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} overflow-hidden rounded-[1.9rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]`}
    >
      <div className="bg-[#102f5c] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-300">
              Team Intelligence
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Staff Performance
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
              See workload, assigned ownership, priority pressure, and completed
              lead outcomes by staff member.
            </p>
          </div>

          <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black text-slate-100">
            {staffRows.length} staff groups
          </div>
        </div>
      </div>

      <div className="bg-[#fff8ee] p-6 sm:p-8">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
          <div className="hidden grid-cols-7 gap-3 border-b border-slate-300 bg-[#fffaf2] px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 lg:grid">
            <span>Staff</span>
            <span>Total</span>
            <span>Inquiries</span>
            <span>Appointments</span>
            <span>VIP</span>
            <span>High</span>
            <span>Completed</span>
          </div>

          {staffRows.length ? (
            staffRows.map((staff, index) => (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="grid gap-4 border-b border-slate-200 bg-white px-5 py-5 last:border-b-0 lg:grid-cols-7 lg:items-center"
              >
                <div>
                  <p className="text-sm font-black text-[#10233f]">{staff.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {staff.id === "unassigned" ? "No owner yet" : "Assigned owner"}
                  </p>
                </div>

                <Metric label="Total" value={staff.total} tone="text-orange-700" />
                <Metric label="Inquiries" value={staff.inquiries} tone="text-blue-700" />
                <Metric
                  label="Appointments"
                  value={staff.appointments}
                  tone="text-emerald-700"
                />
                <Metric label="VIP" value={staff.vip} tone="text-violet-700" />
                <Metric label="High" value={staff.high} tone="text-red-700" />
                <Metric
                  label="Completed"
                  value={staff.completed}
                  tone="text-emerald-700"
                />
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              No staff performance data yet.
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 lg:hidden">
        {label}
      </p>
      <p className={`mt-1 text-lg font-black lg:mt-0 ${tone}`}>{value}</p>
    </div>
  );
}

export default StaffPerformanceAnalytics;