// WorkloadBalancerAI PARTNER OS EXTREME V3 — Executive Capacity Operations
// src/components/admin/WorkloadBalancerAI.jsx
//
// Maximum Zaifan Admin OS pass:
// - preserves inquiry + appointment workload aggregation
// - no GPT calls; workload intelligence is deterministic and explainable
// - identity-safe grouping by admin ID first, name second
// - prevents duplicate counselor rows caused by name variations
// - distinguishes unassigned ownership from real counselor workload
// - weights VIP/high-priority leads more heavily
// - adds appointment pressure and stale/no-contact pressure where fields exist
// - adds portfolio balance, overload spread and assignment recommendations
// - supports optional admin roster to show staff with zero workload
// - exposes transparent workload scoring formula
// - stronger empty/loading-safe behavior for malformed props
// - responsive Admin OS cream/orange/navy visual system

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Flame,
  Gauge,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from "lucide-react";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const isPriorityLead = (lead = {}) =>
  ["vip", "high"].includes(normalize(lead.priority));

const isPendingAppointment = (lead = {}) => {
  const status = normalize(
    lead.appointment_stage ||
      lead.status ||
      lead.appointment_status
  );

  return ["", "pending", "new", "requested"].includes(status);
};

const isCompletedLead = (lead = {}) => {
  const status = normalize(
    lead.status ||
      lead.appointment_stage ||
      lead.pipeline_stage
  );

  return [
    "completed",
    "converted",
    "approved",
    "closed",
    "consultation done",
  ].includes(status);
};

function getOwnerKey(lead = {}) {
  const id =
    lead.assigned_admin_id ||
    lead.assigned_to ||
    lead.owner_id ||
    null;

  if (id !== null && id !== undefined && String(id).trim()) {
    return `id:${String(id)}`;
  }

  const name =
    lead.assigned_admin_name ||
    lead.assigned_to_name ||
    lead.owner_name ||
    "";

  if (String(name).trim()) {
    return `name:${normalize(name)}`;
  }

  return "unassigned";
}

function getOwnerName(lead = {}) {
  return (
    lead.assigned_admin_name ||
    lead.assigned_to_name ||
    lead.owner_name ||
    "Unassigned"
  );
}

function getDaysSinceUpdate(lead = {}) {
  const raw =
    lead.updated_at ||
    lead.last_contacted_at ||
    lead.last_activity_at ||
    lead.created_at;

  if (!raw) return null;

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return null;

  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function getWorkloadScore({
  count = 0,
  vip = 0,
  pendingAppointments = 0,
  stale = 0,
}) {
  // Transparent deterministic formula:
  // base owned work + high-value complexity + appointment pressure + stale follow-up risk
  return (
    safeNumber(count) * 10 +
    safeNumber(vip) * 15 +
    safeNumber(pendingAppointments) * 8 +
    safeNumber(stale) * 5
  );
}

function getLoadLevel(score) {
  if (score >= 130) return "Critical";
  if (score >= 90) return "Overloaded";
  if (score >= 55) return "Busy";
  return "Balanced";
}

function WorkloadBalancerAI({
  inquiries = [],
  appointments = [],
  admins = [],
}) {
  const safeInquiries = safeArray(inquiries);
  const safeAppointments = safeArray(appointments);
  const safeAdmins = safeArray(admins);
  const [showFormula, setShowFormula] = useState(false);

  const workloadData = useMemo(() => {
    const rows = [
      ...safeInquiries.map((lead) => ({
        ...lead,
        __leadType: "inquiry",
      })),
      ...safeAppointments.map((lead) => ({
        ...lead,
        __leadType: "appointment",
      })),
    ];

    const grouped = new Map();

    const ensure = (key, name, id = null) => {
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          id,
          name: name || "Unknown Counselor",
          count: 0,
          inquiries: 0,
          appointments: 0,
          vip: 0,
          pendingAppointments: 0,
          stale: 0,
          completed: 0,
        });
      }

      return grouped.get(key);
    };

    safeAdmins.forEach((admin) => {
      const id = admin?.id;

      if (id === null || id === undefined || !String(id).trim()) {
        return;
      }

      ensure(
        `id:${String(id)}`,
        admin.full_name ||
          admin.name ||
          admin.email ||
          "Unnamed Counselor",
        id
      );
    });

    rows.forEach((lead) => {
      const key = getOwnerKey(lead);

      if (key === "unassigned") {
        return;
      }

      const record = ensure(
        key,
        getOwnerName(lead),
        lead.assigned_admin_id || lead.assigned_to || null
      );

      record.count += 1;

      if (lead.__leadType === "inquiry") {
        record.inquiries += 1;
      }

      if (lead.__leadType === "appointment") {
        record.appointments += 1;

        if (isPendingAppointment(lead)) {
          record.pendingAppointments += 1;
        }
      }

      if (isPriorityLead(lead)) {
        record.vip += 1;
      }

      const daysSinceUpdate = getDaysSinceUpdate(lead);

      if (
        daysSinceUpdate !== null &&
        daysSinceUpdate >= 7 &&
        !isCompletedLead(lead)
      ) {
        record.stale += 1;
      }

      if (isCompletedLead(lead)) {
        record.completed += 1;
      }
    });

    const workloads = [...grouped.values()]
      .map((item) => {
        const loadScore = getWorkloadScore(item);

        return {
          ...item,
          loadScore,
          level: getLoadLevel(loadScore),
        };
      })
      .sort((a, b) => b.loadScore - a.loadScore);

    const unassigned = rows.filter(
      (lead) => getOwnerKey(lead) === "unassigned"
    );

    return {
      rows,
      workloads,
      unassigned,
    };
  }, [safeInquiries, safeAppointments, safeAdmins]);

  const { rows: allLeads, workloads, unassigned } = workloadData;

  const stats = useMemo(() => {
    const activeCounselors = workloads.filter(
      (item) => item.count > 0
    ).length;

    const overloaded = workloads.filter((item) =>
      ["Critical", "Overloaded"].includes(item.level)
    ).length;

    const balanced = workloads.filter(
      (item) => item.level === "Balanced"
    ).length;

    const totalScore = workloads.reduce(
      (sum, item) => sum + item.loadScore,
      0
    );

    const averageScore = workloads.length
      ? Math.round(totalScore / workloads.length)
      : 0;

    const highest = workloads[0] || null;

    const lowestActive = [...workloads]
      .filter((item) => item.count > 0)
      .sort((a, b) => a.loadScore - b.loadScore)[0] || null;

    const imbalance =
      highest && lowestActive
        ? highest.loadScore - lowestActive.loadScore
        : 0;

    return {
      tracked: allLeads.length,
      unassigned: unassigned.length,
      counselors: workloads.length,
      activeCounselors,
      overloaded,
      balanced,
      averageScore,
      imbalance,
      highest,
      lowestActive,
    };
  }, [allLeads, workloads, unassigned]);

  const recommendations = useMemo(() => {
    const items = [];

    if (stats.unassigned > 0) {
      items.push({
        tone: "red",
        title: "Assign unowned leads",
        text: `${stats.unassigned} lead${
          stats.unassigned === 1 ? "" : "s"
        } currently have no counselor owner.`,
      });
    }

    if (stats.overloaded > 0) {
      items.push({
        tone: "orange",
        title: "Redistribute overloaded portfolios",
        text: `${stats.overloaded} counselor${
          stats.overloaded === 1 ? "" : "s"
        } are above the recommended workload threshold.`,
      });
    }

    if (
      stats.highest &&
      stats.lowestActive &&
      stats.imbalance >= 50
    ) {
      items.push({
        tone: "orange",
        title: "Large workload imbalance",
        text: `${stats.highest.name} is ${stats.imbalance} load points above ${stats.lowestActive.name}.`,
      });
    }

    const staleTotal = workloads.reduce(
      (sum, item) => sum + item.stale,
      0
    );

    if (staleTotal > 0) {
      items.push({
        tone: "red",
        title: "Stale ownership pressure",
        text: `${staleTotal} owned lead${
          staleTotal === 1 ? "" : "s"
        } have gone 7+ days without recent activity.`,
      });
    }

    if (!items.length) {
      items.push({
        tone: "green",
        title: "Workload distribution looks stable",
        text:
          "No major ownership, overload, or stale-follow-up pressure is visible from the current CRM data.",
      });
    }

    return items;
  }, [stats, workloads]);

  return (
    <section className="min-w-0 space-y-4 text-[#10233F]">
      <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#FF5A0A] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.08)]">
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    <Scale size={12} className="shrink-0 text-orange-300" />
                    Workload Intelligence
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    <ShieldCheck size={12} className="shrink-0" />
                    Deterministic Scoring
                  </span>
                </div>

                <h2 className="mt-5 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                  Counselor Capacity Command Center
                </h2>

                <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-white sm:text-[15px]">
                  Detect overloaded counselors, unassigned students, VIP pressure,
                  pending appointments, stale ownership, and distribution imbalance
                  before service quality drops.
                </p>

                <p className="mt-4 inline-flex max-w-full rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                  No GPT call is made
                </p>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-[280px]">
                <HeaderMetric label="Average Load" value={stats.averageScore} />
                <HeaderMetric
                  label="Load Spread"
                  value={stats.imbalance}
                  warning={stats.imbalance >= 50}
                />
                <HeaderMetric label="Counselors" value={stats.counselors} />
                <HeaderMetric label="Active Staff" value={stats.activeCounselors} />
              </div>
            </div>
          </div>

          <div
            style={{ backgroundColor: "#FF5A0A" }}
            className="min-w-0 border-t-[3px] border-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
                  Capacity Health
                </p>

                <h3 className="mt-3 break-words text-3xl font-black leading-none text-white">
                  {stats.unassigned || stats.overloaded
                    ? "Needs action"
                    : "Load balanced"}
                </h3>

                <p className="mt-2 text-xs font-bold leading-5 text-white">
                  {stats.unassigned
                    ? `${stats.unassigned} unassigned lead${
                        stats.unassigned === 1 ? "" : "s"
                      } need ownership.`
                    : stats.overloaded
                      ? `${stats.overloaded} counselor${
                          stats.overloaded === 1 ? "" : "s"
                        } exceed the recommended load.`
                      : "No major capacity pressure is visible right now."}
                </p>
              </div>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-white">
                <Gauge size={22} />
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeCapacityMetric label="Tracked Leads" value={stats.tracked} />
              <OrangeCapacityMetric label="Unassigned" value={stats.unassigned} />
              <OrangeCapacityMetric label="Overloaded" value={stats.overloaded} />
              <OrangeCapacityMetric label="Balanced" value={stats.balanced} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={Users}
            label="Tracked Leads"
            value={stats.tracked}
          />

          <Metric
            icon={UserPlus}
            label="Unassigned"
            value={stats.unassigned}
            tone={stats.unassigned ? "red" : "slate"}
          />

          <Metric
            icon={Flame}
            label="Overloaded"
            value={stats.overloaded}
            tone={stats.overloaded ? "orange" : "slate"}
          />

          <Metric
            icon={Gauge}
            label="Active Staff"
            value={stats.activeCounselors}
            tone="blue"
          />
        </div>
      </section>

      <div className="grid min-w-0 gap-4">
        <div className="min-w-0 space-y-3 rounded-[1.6rem] border-[3px] border-[#123865] bg-white p-3 shadow-[0_12px_34px_rgba(18,56,101,0.07)] sm:p-4">
          {workloads.length ? (
            workloads.map((item, index) => (
              <motion.article
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.04, 0.25),
                }}
                className="min-w-0 rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-white hover:shadow-md sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-black text-[#10233F]">
                        {item.name}
                      </h3>

                      <LoadBadge level={item.level} />
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {item.count} owned • {item.inquiries} inquiries •{" "}
                      {item.appointments} appointments • {item.vip} VIP/high
                    </p>

                    <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
                      <MiniMetric
                        label="Load Score"
                        value={item.loadScore}
                        tone={getLevelTone(item.level)}
                      />

                      <MiniMetric
                        label="Pending Apps"
                        value={item.pendingAppointments}
                        tone={
                          item.pendingAppointments
                            ? "orange"
                            : "slate"
                        }
                      />

                      <MiniMetric
                        label="Stale 7d+"
                        value={item.stale}
                        tone={item.stale ? "red" : "slate"}
                      />

                      <MiniMetric
                        label="Completed"
                        value={item.completed}
                        tone="green"
                      />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="rounded-[1.45rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-8 text-center">
              <Users
                size={30}
                className="mx-auto text-slate-400"
              />

              <h3 className="mt-3 text-lg font-black text-[#10233F]">
                No counselor workload data yet
              </h3>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Assign leads or provide the admin roster to start workload
                balancing.
              </p>
            </div>
          )}
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
            <div className="flex items-center gap-2">
              <Target
                size={16}
                className="text-orange-700"
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                  Operations Guidance
                </p>

                <h3 className="mt-1 text-lg font-black text-[#10233F]">
                  Balancing Recommendations
                </h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {recommendations.map((item) => (
                <Recommendation
                  key={`${item.title}-${item.text}`}
                  {...item}
                />
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.05)]">
            <button
              type="button"
              onClick={() => setShowFormula((value) => !value)}
              className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl p-1 text-left transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
              aria-expanded={showFormula}
            >
              <div className="flex items-center gap-2">
                <Scale
                  size={16}
                  className="text-orange-700"
                />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                    Explainability
                  </p>
                  <h3 className="mt-0.5 text-sm font-black text-[#10233F]">
                    Workload Formula
                  </h3>
                </div>
              </div>

              <span className="rounded-full border-2 border-[#FF5A0A]/35 bg-[#FFF1E3] px-3 py-1 text-[10px] font-black text-[#B84F0E]">
                {showFormula ? "Hide" : "View"}
              </span>
            </button>

            {showFormula ? (
              <>
                <div className="mt-3 space-y-2">
                  <FormulaRow label="Owned lead" value="+10" />
                  <FormulaRow label="VIP / High priority" value="+15" />
                  <FormulaRow label="Pending appointment" value="+8" />
                  <FormulaRow label="Stale 7+ days" value="+5" />
                </div>

                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                  These weights are operational heuristics, not employee performance
                  scores. They estimate case pressure so assignment decisions are
                  easier to review.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                Deterministic load weights are available on demand instead of occupying the command view permanently.
              </p>
            )}
          </section>

          {stats.highest ? (
            <section className="min-w-0 rounded-[1.5rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white shadow-[0_10px_28px_rgba(18,56,101,0.10)]">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={17}
                  className="mt-0.5 shrink-0 text-orange-300"
                />

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-300">
                    Highest Current Pressure
                  </p>

                  <h3 className="mt-1 text-base font-black text-white">
                    {stats.highest.name}
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-white/90">
                    Load {stats.highest.loadScore} · {stats.highest.count} owned
                    cases · {stats.highest.vip} VIP/high priority.
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {unassigned.length > 0 ? (
        <section className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-5 shadow-[0_10px_28px_rgba(190,24,93,0.06)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-700">
                  Ownership Gap
                </p>

                <h3 className="mt-1 text-lg font-black text-red-900">
                  {unassigned.length} lead
                  {unassigned.length === 1 ? "" : "s"} need assignment
                </h3>

                <p className="mt-1 text-sm font-semibold leading-6 text-red-800">
                  Unassigned cases have no counselor ownership and should be
                  distributed before they become follow-up risks.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full border-2 border-red-400 bg-white px-4 py-2 text-xs font-black text-red-800">
              Action Required
            </span>
          </div>

          <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
            {unassigned.slice(0, 8).map((lead, index) => (
              <div
                key={`${lead.__leadType}-${lead.id || index}`}
                className="rounded-xl border-2 border-red-200 bg-white p-3"
              >
                <p className="truncate text-sm font-black text-[#10233F]">
                  {lead.full_name ||
                    lead.name ||
                    lead.email ||
                    "Unnamed Lead"}
                </p>

                <p className="mt-1 text-[10px] font-black uppercase text-red-700">
                  {lead.__leadType}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function OrangeCapacityMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-[1.1rem] border-2 border-white/30 bg-white/10 p-3 text-white shadow-inner">
      <p className="break-words text-[8px] font-black uppercase tracking-[0.09em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
  warning = false,
}) {
  return (
    <div
      className={`min-w-0 rounded-[1.15rem] border-[2px] p-4 shadow-inner ${
        warning
          ? "border-[#C84F08] bg-[#E96512]"
          : "border-white/25 bg-white/10"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "slate",
}) {
  const styles = {
    slate:
      "border-[#C9D7E6] bg-[#FFFDF8] text-[#10233F]",
    orange:
      "border-[#F59E0B] bg-[#FFF7ED] text-orange-800",
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    blue:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.45rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-md ${
        styles[tone] || styles.slate
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] opacity-70">
            {label}
          </p>

          <h3 className="mt-2 text-3xl font-black">
            {value}
          </h3>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/80 shadow-sm">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = "slate",
}) {
  const styles = {
    slate:
      "border-[#C9D7E6] bg-[#FFF9F1] text-slate-700",
    orange:
      "border-[#F59E0B] bg-[#FFF7ED] text-orange-800",
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
  };

  return (
    <div
      className={`min-w-0 rounded-xl border-2 p-3 shadow-[0_4px_12px_rgba(18,56,101,0.03)] ${
        styles[tone] || styles.slate
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] opacity-70">
        {label}
      </p>

      <p className="mt-1 text-lg font-black">
        {value}
      </p>
    </div>
  );
}

function LoadBadge({ level }) {
  const style =
    level === "Critical"
      ? "border-red-500 bg-red-100 text-red-900"
      : level === "Overloaded"
      ? "border-red-300 bg-red-50 text-red-800"
      : level === "Busy"
      ? "border-orange-300 bg-orange-50 text-orange-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <span
      className={`rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase ${style}`}
    >
      {level}
    </span>
  );
}

function Recommendation({
  tone,
  title,
  text,
}) {
  const styles = {
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-900",
    orange:
      "border-[#F59E0B] bg-[#FFF7ED] text-orange-900",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-900",
  };

  return (
    <div
      className={`min-w-0 rounded-xl border-2 p-3 shadow-[0_4px_12px_rgba(18,56,101,0.03)] ${
        styles[tone] || styles.orange
      }`}
    >
      <p className="text-sm font-black">
        {title}
      </p>

      <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
        {text}
      </p>
    </div>
  );
}

function FormulaRow({ label, value }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-600">
        {label}
      </p>

      <span className="text-xs font-black text-orange-700">
        {value}
      </span>
    </div>
  );
}

function getLevelTone(level) {
  if (level === "Critical" || level === "Overloaded") {
    return "red";
  }

  if (level === "Busy") {
    return "orange";
  }

  return "green";
}

export default WorkloadBalancerAI;
