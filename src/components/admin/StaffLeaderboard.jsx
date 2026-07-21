// StaffLeaderboard V2 — Team Performance Ranking
// Preserves leaderboard scoring, tiering, VIP specialist logic, conversion rate,
// workload classification, admin inclusion and animated ranking.
// Full mature component retained; visual layer aligned with Zaifan Admin OS.

import { motion } from "framer-motion";
import {
  Award,
  Crown,
  Flame,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

function StaffLeaderboard({
  cardClass = "",
  inquiries = [],
  appointments = [],
  admins = [],
}) {
  const leaderboard = buildLeaderboardData({
    inquiries,
    appointments,
    admins,
  });

  const topPerformer = leaderboard[0];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[1.9rem] border-2 border-orange-300 bg-[#102f5c] p-5 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)] sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/15 px-3 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-orange-300" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-300">
                Staff Leaderboard
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Team Performance Ranking
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-200">
              Smart CRM ranking based on assigned leads, appointments,
              conversion progress, VIP handling, and staff workload.
            </p>
          </div>

          {topPerformer ? (
            <div className="rounded-[1.5rem] border border-orange-400/40 bg-orange-500/15 p-5 backdrop-blur-xl xl:min-w-[320px]">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/40 bg-white/10 text-3xl">
                  👑
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-orange-300">
                    Top Performer
                  </p>

                  <h3 className="mt-1 text-xl font-black text-[#10233f]">
                    {topPerformer.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-200">
                    {topPerformer.totalScore} performance score
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className={`${cardClass} rounded-[2rem] border border-slate-300 bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,35,63,0.04)]`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15">
            <Users className="h-8 w-8 text-orange-300" />
          </div>

          <h3 className="mt-4 text-xl font-black text-[#10233f]">
            No staff assignment data yet
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-200">
            Once staff start receiving lead assignments, the leaderboard will
            automatically rank their CRM performance.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`${cardClass} rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)] sm:p-6`}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-300">
                  Staff Rankings
                </p>

                <h3 className="mt-2 text-xl font-black text-[#10233f]">
                  CRM Performance Table
                </h3>
              </div>

              <div className="rounded-full border border-orange-400/40 bg-orange-500/15 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">
                {leaderboard.length} active staff
              </div>
            </div>

            <div className="space-y-3">
              {leaderboard.map((staff, index) => (
                <motion.div
                  key={`${staff.id}-${index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-[1.5rem] border ${
                    index === 0
                      ? "border-orange-300 bg-orange-50"
                      : "border-slate-300 bg-white"
                  } p-4 transition duration-500 hover:-translate-y-0.5 hover:border-orange-300`}
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-lg font-black ${getRankStyle(
                          index
                        )}`}
                      >
                        {index === 0
                          ? "👑"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-lg font-black text-[#10233f]">
                            {staff.name}
                          </h4>

                          <span className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${getTierStyle(staff.tier)}`}>
                            {staff.tier}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-200">
                          <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1">
                            {staff.totalLeads} leads
                          </span>

                          <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1">
                            {staff.totalAppointments} appointments
                          </span>

                          <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1">
                            {staff.vipLeads} VIP
                          </span>

                          <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1">
                            {staff.completedCases} converted
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
                      <MiniMetric
                        icon={Target}
                        label="Score"
                        value={staff.totalScore}
                        accent="text-orange-300"
                      />

                      <MiniMetric
                        icon={TrendingUp}
                        label="Conversion"
                        value={`${staff.conversionRate}%`}
                        accent="text-emerald-700"
                      />

                      <MiniMetric
                        icon={Flame}
                        label="Hot Leads"
                        value={staff.hotLeads}
                        accent="text-red-700"
                      />

                      <MiniMetric
                        icon={ShieldCheck}
                        label="Workload"
                        value={staff.workload}
                        accent="text-blue-700"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <InsightCard
              cardClass={cardClass}
              icon={Crown}
              title="Best Staff"
              value={topPerformer?.name || "No staff"}
              text="Top overall CRM performer based on ownership, conversion progress, and VIP lead management."
              accent="text-orange-300"
            />

            <InsightCard
              cardClass={cardClass}
              icon={Sparkles}
              title="VIP Specialist"
              value={getVipSpecialist(leaderboard)?.name || "No VIP owner"}
              text="Currently handling the highest number of VIP/high-value student cases."
              accent="text-violet-700"
            />

            <InsightCard
              cardClass={cardClass}
              icon={Award}
              title="CRM Insight"
              value="Optimization"
              text="Balance lead distribution if one staff member has significantly higher workload than others."
              accent="text-emerald-700"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function buildLeaderboardData({ inquiries = [], appointments = [], admins = [] }) {
  const map = new Map();

  const ensureStaff = (id, name = "Unknown Staff") => {
    const key = String(id || name);

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name,
        totalLeads: 0,
        totalAppointments: 0,
        vipLeads: 0,
        completedCases: 0,
        hotLeads: 0,
        totalScore: 0,
        workload: 0,
      });
    }

    return map.get(key);
  };

  inquiries.forEach((lead) => {
    const assignedId =
      lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.assigned_admin_name;

    const assignedName =
      lead.assigned_admin_name ||
      lead.assigned_to_name ||
      "Unassigned";

    if (!assignedId && assignedName === "Unassigned") return;

    const staff = ensureStaff(assignedId, assignedName);

    staff.totalLeads += 1;
    staff.totalScore += 8;

    if (["vip", "high"].includes(String(lead.priority || "").toLowerCase())) {
      staff.vipLeads += 1;
      staff.totalScore += 12;
    }

    if (
      ["approved", "offer_letter", "visa_process", "applied"].includes(
        String(lead.status || "").toLowerCase()
      )
    ) {
      staff.completedCases += 1;
      staff.totalScore += 18;
    }

    if (
      ["vip", "high"].includes(String(lead.priority || "").toLowerCase()) ||
      ["offer_letter", "visa_process"].includes(
        String(lead.status || "").toLowerCase()
      )
    ) {
      staff.hotLeads += 1;
    }
  });

  appointments.forEach((appointment) => {
    const assignedId =
      appointment.assigned_admin_id ||
      appointment.assigned_to ||
      appointment.assigned_admin_name;

    const assignedName =
      appointment.assigned_admin_name ||
      appointment.assigned_to_name ||
      "Unassigned";

    if (!assignedId && assignedName === "Unassigned") return;

    const staff = ensureStaff(assignedId, assignedName);

    staff.totalAppointments += 1;
    staff.totalScore += 10;

    if (
      ["confirmed", "consultation_done", "converted_to_lead"].includes(
        String(appointment.appointment_stage || "").toLowerCase()
      )
    ) {
      staff.completedCases += 1;
      staff.totalScore += 14;
    }

    if (
      ["vip", "high"].includes(
        String(appointment.priority || "").toLowerCase()
      )
    ) {
      staff.vipLeads += 1;
      staff.totalScore += 10;
    }
  });

  admins.forEach((admin) => {
    ensureStaff(admin.id, admin.full_name);
  });

  const leaderboard = [...map.values()].map((staff) => {
    const totalOwned = staff.totalLeads + staff.totalAppointments;

    const conversionRate = totalOwned
      ? Math.round((staff.completedCases / totalOwned) * 100)
      : 0;

    const workload =
      totalOwned >= 20
        ? "Heavy"
        : totalOwned >= 10
        ? "Balanced"
        : "Light";

    let tier = "Bronze";

    if (staff.totalScore >= 140) {
      tier = "Elite";
    } else if (staff.totalScore >= 90) {
      tier = "Gold";
    } else if (staff.totalScore >= 50) {
      tier = "Silver";
    }

    return {
      ...staff,
      totalOwned,
      conversionRate,
      workload,
      tier,
    };
  });

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  return leaderboard;
}

function getVipSpecialist(leaderboard = []) {
  return [...leaderboard].sort((a, b) => b.vipLeads - a.vipLeads)[0];
}

function getRankStyle(index) {
  if (index === 0) {
    return "border-[#F97316]/25 bg-[#F97316]/10 text-orange-300";
  }

  if (index === 1) {
    return "border-gray-400/25 bg-gray-500/10 text-slate-200";
  }

  if (index === 2) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-white/10 bg-white/[0.04] text-slate-200";
}

function getTierStyle(tier) {
  if (tier === "Elite") {
    return "border-purple-400/25 bg-purple-500/10 text-violet-700";
  }

  if (tier === "Gold") {
    return "border-[#F97316]/25 bg-[#F97316]/10 text-orange-300";
  }

  if (tier === "Silver") {
    return "border-gray-400/25 bg-gray-500/10 text-slate-200";
  }

  return "border-orange-300 bg-orange-50 text-orange-700";
}

function MiniMetric({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-[#fffaf2] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>

        <Icon className={`h-3.5 w-3.5 ${accent}`} />
      </div>

      <p className={`mt-2 text-lg font-black ${accent}`}>{value}</p>
    </div>
  );
}

function InsightCard({ cardClass, icon: Icon, title, value, text, accent }) {
  return (
    <div className={`${cardClass} rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)] sm:p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-400/40 bg-orange-500/15">
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>

          <h3 className={`mt-2 text-lg font-black ${accent}`}>{value}</h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-200">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default StaffLeaderboard;