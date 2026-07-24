// StaffLeaderboard V10 — Safe Unified Four-Card Fix
// src/components/admin/StaffLeaderboard.jsx
//
// Maximum pass:
// - preserves inquiries / appointments / admins / cardClass props
// - preserves the existing deterministic scoring model and tier thresholds
// - makes the scoring model visible instead of presenting it as unexplained "smart" logic
// - fixes appointment progression checks by reading appointment_stage OR status
// - fixes navy-surface readability: navy surfaces use explicit white text
// - distinguishes roster staff from genuinely active staff
// - top performer is selected from staff with owned CRM activity
// - VIP specialist is only shown when someone actually owns VIP/high-priority cases
// - "converted" wording changed to "progressed" because the existing statuses are not all final conversions
// - adds staff search, tier filter, workload filter, and sort controls
// - adds unassigned inquiry / appointment pressure
// - adds team workload balance, average conversion/progression rate, and roster coverage
// - adds transparent performance formula reference
// - safer malformed arrays, names, ids and status casing
// - reduced-motion support
// - stronger Admin OS cream/orange/navy hierarchy
// - no backend writes, no fake AI, no invented staff metrics

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Scale,
  Crown,
  Flame,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const SCORE_WEIGHTS = {
  inquiryOwned: 8,
  inquiryPriority: 12,
  inquiryProgressed: 18,
  appointmentOwned: 10,
  appointmentProgressed: 14,
  appointmentPriority: 10,
};

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function cleanName(value, fallback = "Unknown Staff") {
  const name = String(value || "").trim();
  return name || fallback;
}

function getInquiryProgressed(status) {
  return [
    "applied",
    "under_review",
    "offer_letter",
    "offer_received",
    "offer_accepted",
    "visa_process",
    "visa_pending",
    "visa_approved",
    "approved",
  ].includes(normalize(status));
}

function getAppointmentProgressed(appointment = {}) {
  const stage = normalize(
    appointment.appointment_stage || appointment.status
  );

  return [
    "confirmed",
    "consultation_done",
    "completed",
    "converted_to_lead",
    "converted",
  ].includes(stage);
}

function isPriorityLead(priority) {
  return ["vip", "high"].includes(normalize(priority));
}

function getTier(score) {
  if (score >= 140) return "Elite";
  if (score >= 90) return "Gold";
  if (score >= 50) return "Silver";
  return "Bronze";
}

function getWorkload(totalOwned) {
  if (totalOwned >= 20) return "Heavy";
  if (totalOwned >= 10) return "Balanced";
  if (totalOwned > 0) return "Light";
  return "No Activity";
}

function StaffLeaderboard({
  cardClass = "",
  inquiries = [],
  appointments = [],
  admins = [],
}) {
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [workloadFilter, setWorkloadFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  const leaderboardData = useMemo(
    () =>
      buildLeaderboardData({
        inquiries: safeArray(inquiries),
        appointments: safeArray(appointments),
        admins: safeArray(admins),
      }),
    [inquiries, appointments, admins]
  );

  const {
    leaderboard,
    unassignedInquiries,
    unassignedAppointments,
    activeStaff,
    rosterStaff,
  } = leaderboardData;

  const topPerformer = activeStaff[0] || null;
  const vipSpecialist = getVipSpecialist(activeStaff);

  const teamMetrics = useMemo(() => {
    const totalOwned = activeStaff.reduce(
      (sum, staff) => sum + staff.totalOwned,
      0
    );

    const totalProgressed = activeStaff.reduce(
      (sum, staff) => sum + staff.progressedCases,
      0
    );

    const averageProgression = totalOwned
      ? Math.round((totalProgressed / totalOwned) * 100)
      : 0;

    const averageWorkload = activeStaff.length
      ? Math.round((totalOwned / activeStaff.length) * 10) / 10
      : 0;

    const workloads = activeStaff.map((staff) => staff.totalOwned);

    const highestWorkload = workloads.length
      ? Math.max(...workloads)
      : 0;

    const lowestWorkload = workloads.length
      ? Math.min(...workloads)
      : 0;

    const workloadSpread = Math.max(
      0,
      highestWorkload - lowestWorkload
    );

    const rosterCoverage = rosterStaff
      ? Math.round((activeStaff.length / rosterStaff) * 100)
      : 0;

    const imbalance =
      activeStaff.length >= 2 &&
      averageWorkload > 0 &&
      highestWorkload >= averageWorkload * 1.6;

    return {
      totalOwned,
      totalProgressed,
      averageProgression,
      averageWorkload,
      highestWorkload,
      lowestWorkload,
      workloadSpread,
      rosterCoverage,
      imbalance,
    };
  }, [activeStaff, rosterStaff]);

  const filteredLeaderboard = useMemo(() => {
    const cleanQuery = normalize(query);

    const filtered = leaderboard.filter((staff) => {
      if (
        tierFilter !== "all" &&
        normalize(staff.tier) !== normalize(tierFilter)
      ) {
        return false;
      }

      if (
        workloadFilter !== "all" &&
        normalize(staff.workload) !== normalize(workloadFilter)
      ) {
        return false;
      }

      if (!cleanQuery) return true;

      return [
        staff.name,
        staff.tier,
        staff.workload,
        staff.id,
      ]
        .map(normalize)
        .some((value) => value.includes(cleanQuery));
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "conversion") {
        if (b.conversionRate !== a.conversionRate) {
          return b.conversionRate - a.conversionRate;
        }
      } else if (sortBy === "workload") {
        if (b.totalOwned !== a.totalOwned) {
          return b.totalOwned - a.totalOwned;
        }
      } else if (sortBy === "vip") {
        if (b.vipLeads !== a.vipLeads) {
          return b.vipLeads - a.vipLeads;
        }
      } else if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }

      if (b.conversionRate !== a.conversionRate) {
        return b.conversionRate - a.conversionRate;
      }

      return b.totalOwned - a.totalOwned;
    });
  }, [
    leaderboard,
    query,
    tierFilter,
    workloadFilter,
    sortBy,
  ]);

  const hasActiveFilters =
    Boolean(query.trim()) ||
    tierFilter !== "all" ||
    workloadFilter !== "all" ||
    sortBy !== "score";

  const resetControls = () => {
    setQuery("");
    setTierFilter("all");
    setWorkloadFilter("all");
    setSortBy("score");
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5 text-[#10233f]"
    >
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_40px_rgba(15,35,63,0.09)] sm:p-4">
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <div
            className="min-w-0 bg-[#173F6B] p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Trophy
                size={13}
                style={{ color: "#FDBA74" }}
              />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Staff Leaderboard
              </p>
            </div>

            <h2
              className="mt-3 text-2xl font-black tracking-tight sm:text-3xl"
              style={{ color: "#FFFFFF" }}
            >
              Team Performance Ranking
            </h2>

            <p
              className="mt-2 max-w-3xl text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Transparent CRM ranking based on owned leads, appointments,
              progression milestones, priority-case handling, and workload.
            </p>
          </div>

          <div
            className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 sm:p-6 xl:border-l-[3px] xl:border-t-0"
            style={{ color: "#FFFFFF" }}
          >
            {topPerformer ? (
              <>
                <div className="flex items-center gap-2">
                  <Crown size={18} />

                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                    Top Active Performer
                  </p>
                </div>

                <p className="mt-3 break-words text-2xl font-black leading-tight text-white">
                  {topPerformer.name}
                </p>

                <p className="mt-1 text-4xl font-black text-white">
                  {topPerformer.totalScore}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  Performance Score
                </p>

                <p className="mt-3 text-xs font-semibold leading-5 text-white">
                  {topPerformer.totalOwned} owned records ·{" "}
                  {topPerformer.conversionRate}% progression.
                </p>
              </>
            ) : (
              <>
                <Users size={18} />

                <p className="mt-3 text-xl font-black text-white">
                  No active staff data yet
                </p>

                <p className="mt-2 text-xs font-semibold leading-5 text-white">
                  Rankings activate when staff receive owned CRM records.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
        <TeamMetric
          label="Active Staff"
          value={activeStaff.length}
          helper={`${rosterStaff} staff in roster`}
          icon={UserRoundCheck}
          tone="orange"
        />

        <TeamMetric
          label="Roster Coverage"
          value={`${teamMetrics.rosterCoverage}%`}
          helper="Staff with owned CRM activity"
          icon={Users}
          tone="navy"
        />

        <TeamMetric
          label="Avg Progression"
          value={`${teamMetrics.averageProgression}%`}
          helper={`${teamMetrics.totalProgressed} progressed records`}
          icon={TrendingUp}
          tone="good"
        />

        <TeamMetric
          label="Unassigned"
          value={unassignedInquiries + unassignedAppointments}
          helper={`${unassignedInquiries} inquiries · ${unassignedAppointments} appointments`}
          icon={AlertTriangle}
          tone={
            unassignedInquiries + unassignedAppointments > 0
              ? "danger"
              : "good"
          }
        />
      </div>

      {leaderboard.length === 0 ? (
        <div
          className={`${cardClass} rounded-[2rem] border-[3px] border-slate-300 bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,35,63,0.04)]`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50">
            <Users className="h-8 w-8 text-orange-700" />
          </div>

          <h3 className="mt-4 text-xl font-black text-[#10233f]">
            No staff data available
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Add staff records or lead assignments before using the leaderboard
            for team-performance decisions.
          </p>
        </div>
      ) : (
        <>
          <section
            className={`${cardClass} rounded-[1.55rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)]`}
          >
            <div className="grid min-w-0 gap-3 lg:grid-cols-2 2xl:grid-cols-[minmax(18rem,1fr)_repeat(4,minmax(9.5rem,auto))]">
              <label className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search staff, tier, workload..."
                  className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <select
                value={tierFilter}
                onChange={(event) =>
                  setTierFilter(event.target.value)
                }
                className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
              >
                <option value="all">All Tiers</option>
                <option value="elite">Elite</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>

              <select
                value={workloadFilter}
                onChange={(event) =>
                  setWorkloadFilter(event.target.value)
                }
                className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
              >
                <option value="all">All Workloads</option>
                <option value="heavy">Heavy</option>
                <option value="balanced">Balanced</option>
                <option value="light">Light</option>
                <option value="no activity">No Activity</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
              >
                <option value="score">Sort: Score</option>
                <option value="conversion">Sort: Progression</option>
                <option value="workload">Sort: Workload</option>
                <option value="vip">Sort: VIP Cases</option>
              </select>

              <button
                type="button"
                onClick={resetControls}
                disabled={!hasActiveFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={13} />
                Reset
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500">
              Showing {filteredLeaderboard.length} of {leaderboard.length} staff.
              Staff with no activity remain visible instead of disappearing from
              the roster.
            </p>
          </section>

          <div
            className={`${cardClass} rounded-[2rem] border-[3px] border-[#F97316] bg-[#FFFDF8] p-4 shadow-[0_8px_24px_rgba(15,35,63,0.05)] sm:p-5`}
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                  Staff Rankings
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233f]">
                  CRM Performance Ranking
                </h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Full-width staff cards keep scoring, progression and workload readable instead of squeezing them beside an insight rail.
                </p>
              </div>

              <span className="w-fit shrink-0 rounded-full border-2 border-[#F59E0B] bg-[#FFF7ED] px-4 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-orange-700">
                {activeStaff.length} active staff
              </span>
            </div>

            <div className="space-y-3">
              {filteredLeaderboard.length ? (
                filteredLeaderboard.map((staff, index) => (
                  <StaffRow
                    key={staff.id}
                    staff={staff}
                    index={index}
                    reduceMotion={reduceMotion}
                  />
                ))
              ) : (
                <div className="rounded-[1.3rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-orange-700" />
                  <h4 className="mt-3 font-black text-[#10233f]">
                    No matching staff
                  </h4>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Change the search, tier, workload, or sort controls.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <UnifiedInsightCard
              cardClass={cardClass}
              icon={Crown}
              eyebrow="Best Active Staff"
              title={topPerformer?.name || "No active staff"}
              tone="orange"
              badge="Top Performer"
              stats={
                topPerformer
                  ? [
                      ["Score", topPerformer.totalScore],
                      ["Owned", topPerformer.totalOwned],
                      ["Progression", `${topPerformer.conversionRate}%`],
                    ]
                  : [
                      ["Score", 0],
                      ["Owned", 0],
                      ["Progression", "0%"],
                    ]
              }
              description={
                topPerformer
                  ? `${topPerformer.totalScore} score · ${topPerformer.conversionRate}% progression across ${topPerformer.totalOwned} owned records.`
                  : "No staff currently owns enough CRM activity to rank."
              }
              footer={
                topPerformer
                  ? "Leading current owned-case execution."
                  : "Waiting for owned CRM activity."
              }
            />

            <UnifiedInsightCard
              cardClass={cardClass}
              icon={Sparkles}
              eyebrow="VIP Specialist"
              title={vipSpecialist?.name || "No VIP owner"}
              tone="violet"
              badge="Specialist Signal"
              stats={[
                ["VIP/High", vipSpecialist?.vipLeads || 0],
                ["Score", vipSpecialist?.totalScore || 0],
                ["Progression", `${vipSpecialist?.conversionRate || 0}%`],
              ]}
              description={
                vipSpecialist
                  ? `${vipSpecialist.vipLeads} VIP/high-priority case${
                      vipSpecialist.vipLeads === 1 ? "" : "s"
                    } currently attributed to this staff member.`
                  : "No staff member currently owns a VIP/high-priority case."
              }
              footer={
                vipSpecialist
                  ? "Protect high-value case ownership and follow-up."
                  : "Assign VIP/high-priority cases to a clear owner."
              }
            />

            <UnifiedInsightCard
              cardClass={cardClass}
              icon={Scale}
              eyebrow="Workload Balance"
              title={
                teamMetrics.imbalance
                  ? "Needs Rebalancing"
                  : "Reasonably Balanced"
              }
              tone={teamMetrics.imbalance ? "amber" : "green"}
              badge={teamMetrics.imbalance ? "Review Balance" : "Healthy Balance"}
              stats={[
                ["Average", teamMetrics.averageWorkload],
                ["Highest", teamMetrics.highestWorkload],
                ["Spread", teamMetrics.workloadSpread],
              ]}
              description={
                activeStaff.length < 2
                  ? "More active staff data is required before workload balance can be judged."
                  : `Average workload is ${teamMetrics.averageWorkload} records per active staff member. Current spread is ${teamMetrics.workloadSpread} records.`
              }
              footer={
                teamMetrics.imbalance
                  ? "Redistribute new assignments before adding pressure."
                  : "Current workload distribution is within a healthy range."
              }
            />

            <ScoreModelCard compact />
          </div>
        </>
      )}
    </motion.section>
  );
}

function buildLeaderboardData({
  inquiries = [],
  appointments = [],
  admins = [],
}) {
  const map = new Map();

  const ensureStaff = (
    id,
    name = "Unknown Staff",
    rosterMember = false
  ) => {
    const safeName = cleanName(name);
    const key = String(id || safeName);

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: safeName,
        rosterMember,
        totalLeads: 0,
        totalAppointments: 0,
        vipLeads: 0,
        progressedCases: 0,
        hotLeads: 0,
        totalScore: 0,
      });
    } else if (rosterMember) {
      map.get(key).rosterMember = true;

      if (
        map.get(key).name === "Unknown Staff" ||
        map.get(key).name === "Unassigned"
      ) {
        map.get(key).name = safeName;
      }
    }

    return map.get(key);
  };

  safeArray(admins).forEach((admin) => {
    ensureStaff(
      admin.id || admin.user_id || admin.email,
      admin.full_name || admin.name || admin.email,
      true
    );
  });

  let unassignedInquiries = 0;
  let unassignedAppointments = 0;

  safeArray(inquiries).forEach((lead) => {
    const assignedId =
      lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.assigned_admin_name;

    const assignedName =
      lead.assigned_admin_name ||
      lead.assigned_to_name ||
      "Unassigned";

    if (!assignedId && assignedName === "Unassigned") {
      unassignedInquiries += 1;
      return;
    }

    const staff = ensureStaff(
      assignedId,
      assignedName
    );

    staff.totalLeads += 1;
    staff.totalScore += SCORE_WEIGHTS.inquiryOwned;

    if (isPriorityLead(lead.priority)) {
      staff.vipLeads += 1;
      staff.totalScore +=
        SCORE_WEIGHTS.inquiryPriority;
    }

    if (getInquiryProgressed(lead.status)) {
      staff.progressedCases += 1;
      staff.totalScore +=
        SCORE_WEIGHTS.inquiryProgressed;
    }

    if (
      isPriorityLead(lead.priority) ||
      [
        "offer_letter",
        "offer_received",
        "visa_process",
        "visa_pending",
      ].includes(normalize(lead.status))
    ) {
      staff.hotLeads += 1;
    }
  });

  safeArray(appointments).forEach((appointment) => {
    const assignedId =
      appointment.assigned_admin_id ||
      appointment.assigned_to ||
      appointment.assigned_admin_name;

    const assignedName =
      appointment.assigned_admin_name ||
      appointment.assigned_to_name ||
      "Unassigned";

    if (!assignedId && assignedName === "Unassigned") {
      unassignedAppointments += 1;
      return;
    }

    const staff = ensureStaff(
      assignedId,
      assignedName
    );

    staff.totalAppointments += 1;
    staff.totalScore +=
      SCORE_WEIGHTS.appointmentOwned;

    if (getAppointmentProgressed(appointment)) {
      staff.progressedCases += 1;
      staff.totalScore +=
        SCORE_WEIGHTS.appointmentProgressed;
    }

    if (isPriorityLead(appointment.priority)) {
      staff.vipLeads += 1;
      staff.totalScore +=
        SCORE_WEIGHTS.appointmentPriority;
    }

    if (
      isPriorityLead(appointment.priority) ||
      [
        "confirmed",
        "consultation_done",
        "completed",
      ].includes(
        normalize(
          appointment.appointment_stage ||
            appointment.status
        )
      )
    ) {
      staff.hotLeads += 1;
    }
  });

  const leaderboard = [...map.values()].map((staff) => {
    const totalOwned =
      staff.totalLeads + staff.totalAppointments;

    const conversionRate = totalOwned
      ? Math.round(
          (staff.progressedCases / totalOwned) * 100
        )
      : 0;

    return {
      ...staff,
      totalOwned,
      conversionRate,
      workload: getWorkload(totalOwned),
      tier: getTier(staff.totalScore),
      isActive: totalOwned > 0,
    };
  });

  leaderboard.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    if (b.conversionRate !== a.conversionRate) {
      return b.conversionRate - a.conversionRate;
    }

    return b.totalOwned - a.totalOwned;
  });

  return {
    leaderboard,
    activeStaff: leaderboard.filter(
      (staff) => staff.isActive
    ),
    rosterStaff: leaderboard.filter(
      (staff) => staff.rosterMember
    ).length,
    unassignedInquiries,
    unassignedAppointments,
  };
}

function StaffRow({
  staff,
  index,
  reduceMotion,
}) {
  const top = staff.isActive && index === 0;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.24,
        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.18),
      }}
      className={`group min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] bg-white shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition duration-300 hover:-translate-y-0.5 ${
        top
          ? "border-[#F97316]"
          : staff.isActive
          ? "border-[#D1DCE7] hover:border-[#F59E0B]"
          : "border-slate-300 bg-slate-50"
      }`}
    >
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${getRankStyle(
                index,
                staff.isActive
              )}`}
            >
              {!staff.isActive
                ? "—"
                : index === 0
                ? "👑"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `#${index + 1}`}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h4 className="break-words text-lg font-black leading-6 text-[#10233f]">
                  {staff.name}
                </h4>

                <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getTierStyle(staff.tier)}`}>
                  {staff.tier}
                </span>

                {!staff.isActive ? (
                  <span className="rounded-full border-2 border-slate-300 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                    No Activity
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                <Tag value={`${staff.totalLeads} leads`} />
                <Tag value={`${staff.totalAppointments} appointments`} />
                <Tag value={`${staff.vipLeads} VIP/high`} />
                <Tag value={`${staff.progressedCases} progressed`} />
              </div>
            </div>
          </div>

          <div className={`w-fit shrink-0 rounded-xl border-2 px-4 py-2.5 ${
            top
              ? "border-[#F97316] bg-[#E96512] text-white"
              : "border-[#C9D7E6] bg-[#FFF8EE] text-[#10233f]"
          }`}>
            <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${top ? "text-white" : "text-slate-500"}`}>
              Performance Score
            </p>
            <p className={`mt-1 text-2xl font-black ${top ? "text-white" : "text-[#10233f]"}`}>
              {staff.totalScore}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniMetric
            icon={Target}
            label="Score"
            value={staff.totalScore}
            tone="orange"
          />
          <MiniMetric
            icon={TrendingUp}
            label="Progression"
            value={`${staff.conversionRate}%`}
            tone="good"
          />
          <MiniMetric
            icon={Flame}
            label="Hot Leads"
            value={staff.hotLeads}
            tone="danger"
          />
          <MiniMetric
            icon={ShieldCheck}
            label="Workload"
            value={staff.workload}
            tone="navy"
          />
        </div>
      </div>
    </motion.article>
  );
}

function TeamMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-[#FB7185] bg-[#FFF4F4]"
      : tone === "good"
      ? "border-[#34D399] bg-[#F0FFF8]"
      : tone === "navy"
      ? "border-[#173F6B] bg-[#173F6B]"
      : "border-[#F97316] bg-[#FFF4E8]";

  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_5px_14px_rgba(15,35,63,0.04)] ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              color: dark ? "#FDBA74" : "#64748B",
            }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{
              color: dark ? "#FFFFFF" : "#10233F",
            }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{
            color: dark ? "#FDBA74" : "#C2410C",
          }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{
          color: dark ? "#F8FAFC" : "#64748B",
        }}
      >
        {helper}
      </p>
    </div>
  );
}

function Tag({ value }) {
  return (
    <span className="rounded-full border-2 border-slate-300 bg-[#fffaf2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-slate-600">
      {value}
    </span>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-[#FB7185] bg-[#FFF4F4]"
      : tone === "good"
      ? "border-[#34D399] bg-[#F0FFF8]"
      : tone === "navy"
      ? "border-[#173F6B] bg-[#173F6B]"
      : "border-[#F97316] bg-[#FFF4E8]";

  return (
    <div
      className={`min-w-0 rounded-xl border-2 p-3 ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-[8px] font-black uppercase tracking-[0.08em]"
          style={{
            color: dark ? "#FDBA74" : "#64748B",
          }}
        >
          {label}
        </p>

        <Icon
          size={13}
          style={{
            color: dark ? "#FDBA74" : "#C2410C",
          }}
        />
      </div>

      <p
        className="mt-2 text-base font-black"
        style={{
          color: dark ? "#FFFFFF" : "#10233F",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function UnifiedInsightCard({
  cardClass,
  icon: Icon,
  eyebrow,
  title,
  tone = "orange",
  badge,
  stats = [],
  description,
  footer,
}) {
  const themes = {
    orange: {
      border: "border-[#F97316]",
      surface: "bg-[#FFF4E8]",
      accent: "bg-[#F97316]",
      iconBorder: "border-[#F97316]/45",
      iconText: "text-[#D94F08]",
      badge: "border-[#F97316]/45 bg-white text-[#C2410C]",
      statBorder: "border-[#F97316]/30",
      statSurface: "bg-white/75",
      statValue: "text-[#C2410C]",
      footerBorder: "border-[#F97316]/25",
      footerSurface: "bg-white/70",
      footerText: "text-[#9A3412]",
    },
    violet: {
      border: "border-[#8B5CF6]",
      surface: "bg-[#F5F0FF]",
      accent: "bg-[#8B5CF6]",
      iconBorder: "border-[#8B5CF6]/45",
      iconText: "text-[#6D28D9]",
      badge: "border-[#8B5CF6]/45 bg-white text-[#6D28D9]",
      statBorder: "border-[#8B5CF6]/30",
      statSurface: "bg-white/75",
      statValue: "text-[#6D28D9]",
      footerBorder: "border-[#8B5CF6]/25",
      footerSurface: "bg-white/70",
      footerText: "text-[#6D28D9]",
    },
    green: {
      border: "border-[#22C55E]",
      surface: "bg-[#ECFDF3]",
      accent: "bg-[#22C55E]",
      iconBorder: "border-[#22C55E]/45",
      iconText: "text-[#047857]",
      badge: "border-[#22C55E]/45 bg-white text-[#047857]",
      statBorder: "border-[#22C55E]/30",
      statSurface: "bg-white/75",
      statValue: "text-[#047857]",
      footerBorder: "border-[#22C55E]/25",
      footerSurface: "bg-white/70",
      footerText: "text-[#047857]",
    },
    amber: {
      border: "border-[#F59E0B]",
      surface: "bg-[#FFF7ED]",
      accent: "bg-[#F59E0B]",
      iconBorder: "border-[#F59E0B]/45",
      iconText: "text-[#B45309]",
      badge: "border-[#F59E0B]/45 bg-white text-[#B45309]",
      statBorder: "border-[#F59E0B]/30",
      statSurface: "bg-white/75",
      statValue: "text-[#B45309]",
      footerBorder: "border-[#F59E0B]/25",
      footerSurface: "bg-white/70",
      footerText: "text-[#92400E]",
    },
  };

  const theme = themes[tone] || themes.orange;

  return (
    <div
      className={`${cardClass} relative flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border-[3px] p-4 shadow-[0_8px_24px_rgba(15,35,63,0.055)] ${theme.border} ${theme.surface}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${theme.accent}`} />

      <div className="flex min-w-0 items-start gap-3 pt-1">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${theme.iconBorder} ${theme.iconText}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
            {eyebrow}
          </p>

          <h3 className="mt-1 whitespace-normal break-normal text-lg font-black leading-6 text-[#10233f]">
            {title}
          </h3>
        </div>
      </div>

      {badge ? (
        <div className="mt-3">
          <span
            className={`inline-flex rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${theme.badge}`}
          >
            {badge}
          </span>
        </div>
      ) : null}

      <p className="mt-4 min-h-[3.75rem] whitespace-normal break-normal text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-4 grid min-w-0 grid-cols-3 gap-2">
        {stats.slice(0, 3).map(([label, value]) => (
          <div
            key={label}
            className={`flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 px-1 py-3 text-center ${theme.statBorder} ${theme.statSurface}`}
          >
            <p className="w-full min-w-0 whitespace-normal text-[7px] font-black uppercase leading-[11px] tracking-normal text-slate-500 [overflow-wrap:anywhere]">
              {label}
            </p>

            <p className={`mt-1 text-base font-black leading-5 ${theme.statValue}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`mt-auto pt-4`}
      >
        <div
          className={`rounded-xl border-2 px-3 py-2.5 ${theme.footerBorder} ${theme.footerSurface}`}
        >
          <p className={`whitespace-normal break-normal text-xs font-bold leading-5 ${theme.footerText}`}>
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScoreModelCard() {
  return (
    <UnifiedInsightCard
      icon={Award}
      eyebrow="Score Model"
      title="Transparent Ranking Weights"
      tone="orange"
      badge="Explainable Scoring"
      stats={[
        ["Inquiry", `+${SCORE_WEIGHTS.inquiryOwned}`],
        ["Priority", `+${SCORE_WEIGHTS.inquiryPriority}`],
        ["Progressed", `+${SCORE_WEIGHTS.inquiryProgressed}`],
      ]}
      description={`Owned inquiry +${SCORE_WEIGHTS.inquiryOwned}. VIP/high inquiry +${SCORE_WEIGHTS.inquiryPriority}. Progressed inquiry +${SCORE_WEIGHTS.inquiryProgressed}.`}
      footer={`Appointments: owned +${SCORE_WEIGHTS.appointmentOwned} · progressed +${SCORE_WEIGHTS.appointmentProgressed} · VIP/high +${SCORE_WEIGHTS.appointmentPriority}. Rules-based ranking only.`}
    />
  );
}

function getVipSpecialist(leaderboard = []) {
  const eligible = safeArray(leaderboard)
    .filter((staff) => staff.vipLeads > 0)
    .sort((a, b) => {
      if (b.vipLeads !== a.vipLeads) {
        return b.vipLeads - a.vipLeads;
      }

      return b.totalScore - a.totalScore;
    });

  return eligible[0] || null;
}

function getRankStyle(index, isActive) {
  if (!isActive) {
    return "border-slate-300 bg-white text-slate-500";
  }

  if (index === 0) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (index === 1) {
    return "border-slate-400 bg-slate-100 text-slate-700";
  }

  if (index === 2) {
    return "border-amber-400 bg-amber-50 text-amber-800";
  }

  return "border-slate-300 bg-white text-slate-700";
}

function getTierStyle(tier) {
  if (tier === "Elite") {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  if (tier === "Gold") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (tier === "Silver") {
    return "border-slate-400 bg-slate-100 text-slate-700";
  }

  return "border-amber-300 bg-amber-50 text-amber-800";
}

export default StaffLeaderboard;
