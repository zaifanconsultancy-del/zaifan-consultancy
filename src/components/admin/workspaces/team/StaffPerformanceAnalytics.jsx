// StaffPerformanceAnalytics PARTNER OS EXTREME — Executive Team Operations Intelligence
// src/components/admin/StaffPerformanceAnalytics.jsx
//
// Maximum pass:
// - preserves cardClass / inquiries / appointments props
// - preserves staff grouping and ownership aggregation
// - fixes case-sensitive priority/status matching
// - separates progressed records from genuinely completed outcomes
// - reads appointment_stage OR status safely
// - keeps unassigned CRM work visible instead of treating it like staff performance
// - adds progression rate, priority-pressure rate, workload classification and ownership share
// - adds search, workload filter, priority-pressure filter and sort controls
// - adds team-level workload / assignment / progression metrics
// - adds explicit unassigned-work pressure card
// - safer IDs, names, arrays and malformed values
// - reduced-motion support
// - approved Admin OS cream/orange/navy contrast
// - no backend writes, no fake AI, no invented performance data

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Flame,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function safeName(value, fallback = "Unknown Staff") {
  const name = String(value || "").trim();
  return name || fallback;
}

function percent(part, total) {
  if (!total) return 0;

  return Math.max(
    0,
    Math.min(100, Math.round((Number(part || 0) / Number(total || 1)) * 100))
  );
}

function isPriority(priority, target) {
  return normalize(priority) === normalize(target);
}

function isHighValue(priority) {
  return ["vip", "high"].includes(normalize(priority));
}

function getAppointmentStage(appointment = {}) {
  return normalize(
    appointment.appointment_stage ||
      appointment.status ||
      appointment.stage ||
      ""
  );
}

function isInquiryProgressed(inquiry = {}) {
  return [
    "contacted",
    "interested",
    "qualified",
    "applied",
    "under_review",
    "offer_letter",
    "offer_received",
    "offer_accepted",
    "visa_process",
    "visa_pending",
    "visa_approved",
    "approved",
    "converted",
  ].includes(normalize(inquiry.status));
}

function isInquiryCompleted(inquiry = {}) {
  return ["approved", "visa_approved", "converted"].includes(
    normalize(inquiry.status)
  );
}

function isAppointmentProgressed(appointment = {}) {
  return [
    "confirmed",
    "consultation_done",
    "completed",
    "converted_to_lead",
    "converted",
  ].includes(getAppointmentStage(appointment));
}

function isAppointmentCompleted(appointment = {}) {
  return ["completed", "consultation_done", "converted_to_lead", "converted"].includes(
    getAppointmentStage(appointment)
  );
}

function getWorkload(total) {
  if (total >= 20) return "Heavy";
  if (total >= 10) return "Balanced";
  if (total > 0) return "Light";
  return "No Activity";
}

function getPressureLevel(vip, high, total) {
  const pressure = percent(vip + high, total);

  if (pressure >= 45) return "High";
  if (pressure >= 20) return "Medium";
  return "Low";
}

function buildStaffPerformanceData({
  inquiries = [],
  appointments = [],
}) {
  const map = new Map();

  let unassignedInquiries = 0;
  let unassignedAppointments = 0;

  const ensureStaff = (id, name) => {
    const safeId = String(id || name || "unknown");
    const safeStaffName = safeName(name);

    if (!map.has(safeId)) {
      map.set(safeId, {
        id: safeId,
        name: safeStaffName,
        total: 0,
        inquiries: 0,
        appointments: 0,
        vip: 0,
        high: 0,
        progressed: 0,
        completed: 0,
      });
    } else if (
      map.get(safeId).name === "Unknown Staff" &&
      safeStaffName !== "Unknown Staff"
    ) {
      map.get(safeId).name = safeStaffName;
    }

    return map.get(safeId);
  };

  safeArray(inquiries).forEach((lead) => {
    const assignedId =
      lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.assigned_admin_name;

    const assignedName =
      lead.assigned_admin_name ||
      lead.assigned_to_name ||
      "";

    if (!assignedId && !assignedName) {
      unassignedInquiries += 1;
      return;
    }

    const staff = ensureStaff(
      assignedId || assignedName,
      assignedName || "Unknown Staff"
    );

    staff.total += 1;
    staff.inquiries += 1;

    if (isPriority(lead.priority, "vip")) {
      staff.vip += 1;
    }

    if (isPriority(lead.priority, "high")) {
      staff.high += 1;
    }

    if (isInquiryProgressed(lead)) {
      staff.progressed += 1;
    }

    if (isInquiryCompleted(lead)) {
      staff.completed += 1;
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
      "";

    if (!assignedId && !assignedName) {
      unassignedAppointments += 1;
      return;
    }

    const staff = ensureStaff(
      assignedId || assignedName,
      assignedName || "Unknown Staff"
    );

    staff.total += 1;
    staff.appointments += 1;

    if (isPriority(appointment.priority, "vip")) {
      staff.vip += 1;
    }

    if (isPriority(appointment.priority, "high")) {
      staff.high += 1;
    }

    if (isAppointmentProgressed(appointment)) {
      staff.progressed += 1;
    }

    if (isAppointmentCompleted(appointment)) {
      staff.completed += 1;
    }
  });

  const staffRows = [...map.values()]
    .map((staff) => ({
      ...staff,
      progressionRate: percent(staff.progressed, staff.total),
      completionRate: percent(staff.completed, staff.total),
      ownershipShare: 0,
      priorityPressure: percent(staff.vip + staff.high, staff.total),
      pressureLevel: getPressureLevel(staff.vip, staff.high, staff.total),
      workload: getWorkload(staff.total),
    }))
    .sort((a, b) => b.total - a.total);

  const assignedTotal = staffRows.reduce(
    (sum, staff) => sum + staff.total,
    0
  );

  return {
    staffRows: staffRows.map((staff) => ({
      ...staff,
      ownershipShare: percent(staff.total, assignedTotal),
    })),
    unassignedInquiries,
    unassignedAppointments,
    assignedTotal,
  };
}

function StaffPerformanceAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [workloadFilter, setWorkloadFilter] = useState("all");
  const [pressureFilter, setPressureFilter] = useState("all");
  const [sortBy, setSortBy] = useState("total");
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);

  const performance = useMemo(
    () =>
      buildStaffPerformanceData({
        inquiries,
        appointments,
      }),
    [inquiries, appointments]
  );

  const {
    staffRows,
    unassignedInquiries,
    unassignedAppointments,
    assignedTotal,
  } = performance;

  const unassignedTotal =
    unassignedInquiries + unassignedAppointments;

  const totalRecords =
    assignedTotal + unassignedTotal;

  const teamMetrics = useMemo(() => {
    const totalProgressed = staffRows.reduce(
      (sum, staff) => sum + staff.progressed,
      0
    );

    const totalCompleted = staffRows.reduce(
      (sum, staff) => sum + staff.completed,
      0
    );

    const highValue = staffRows.reduce(
      (sum, staff) => sum + staff.vip + staff.high,
      0
    );

    const averageWorkload = staffRows.length
      ? Math.round((assignedTotal / staffRows.length) * 10) / 10
      : 0;

    const heaviestStaff = [...staffRows].sort(
      (a, b) => b.total - a.total
    )[0];

    const highestPressure = [...staffRows].sort(
      (a, b) => b.priorityPressure - a.priorityPressure
    )[0];

    return {
      totalProgressed,
      totalCompleted,
      highValue,
      progressionRate: percent(totalProgressed, assignedTotal),
      completionRate: percent(totalCompleted, assignedTotal),
      assignmentRate: percent(assignedTotal, totalRecords),
      averageWorkload,
      heaviestStaff,
      highestPressure,
    };
  }, [staffRows, assignedTotal, totalRecords]);

  const filteredRows = useMemo(() => {
    const cleanQuery = normalize(query);

    const rows = staffRows.filter((staff) => {
      if (
        workloadFilter !== "all" &&
        normalize(staff.workload) !== normalize(workloadFilter)
      ) {
        return false;
      }

      if (
        pressureFilter !== "all" &&
        normalize(staff.pressureLevel) !== normalize(pressureFilter)
      ) {
        return false;
      }

      if (!cleanQuery) return true;

      return [
        staff.name,
        staff.id,
        staff.workload,
        staff.pressureLevel,
      ]
        .map(normalize)
        .some((value) => value.includes(cleanQuery));
    });

    return [...rows].sort((a, b) => {
      if (sortBy === "progression") {
        if (b.progressionRate !== a.progressionRate) {
          return b.progressionRate - a.progressionRate;
        }
      } else if (sortBy === "completion") {
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
      } else if (sortBy === "pressure") {
        if (b.priorityPressure !== a.priorityPressure) {
          return b.priorityPressure - a.priorityPressure;
        }
      } else if (sortBy === "vip") {
        if (b.vip !== a.vip) {
          return b.vip - a.vip;
        }
      } else if (b.total !== a.total) {
        return b.total - a.total;
      }

      return b.progressionRate - a.progressionRate;
    });
  }, [
    staffRows,
    query,
    workloadFilter,
    pressureFilter,
    sortBy,
  ]);

  const hasControls =
    Boolean(query.trim()) ||
    workloadFilter !== "all" ||
    pressureFilter !== "all" ||
    sortBy !== "total";

  const resetControls = () => {
    setQuery("");
    setWorkloadFilter("all");
    setPressureFilter("all");
    setSortBy("total");
  };

  return (
    <motion.section
      key="staff-performance"
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 14 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.25,
      }}
      className={`${cardClass} min-w-0 !space-y-4 rounded-[2.2rem] !border-[4px] !border-[#123865] !bg-[#FFF8EF] !p-4 shadow-[0_22px_60px_rgba(18,56,101,0.14)] sm:!p-4`}
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#FF5A0A] bg-white lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div
          className="min-w-0 bg-[#123865] p-5 sm:p-6 lg:p-7"
          style={{ color: "#FFFFFF" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
            <BarChart3
              size={13}
              style={{ color: "#FDBA74" }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ color: "#FFFFFF" }}
            >
              Team Intelligence
            </p>
          </div>

          <h2
            className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl"
            style={{ color: "#FFFFFF" }}
          >
            Staff Performance
          </h2>

          <p
            className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6"
            style={{ color: "#F8FAFC" }}
          >
            Analyze staff ownership, workload, high-priority pressure,
            progression, final outcomes, and unassigned CRM work.
          </p>
        </div>

        <div
          className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7"
          style={{ color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Active Staff Groups
            </p>
          </div>

          <p className="mt-3 text-4xl font-black text-white">
            {staffRows.length}
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            With Assigned CRM Work
          </p>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            {teamMetrics.assignmentRate}% of visible CRM records currently have
            an owner.
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-[1.65rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_12px_34px_rgba(18,56,101,0.06)] sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Assignment Rate"
            value={`${teamMetrics.assignmentRate}%`}
            helper={`${assignedTotal} assigned · ${unassignedTotal} unassigned`}
            icon={UserRoundCheck}
            tone="orange"
          />

          <SummaryCard
            label="Team Progression"
            value={`${teamMetrics.progressionRate}%`}
            helper={`${teamMetrics.totalProgressed} records progressed`}
            icon={TrendingUp}
            tone="good"
          />

          <SummaryCard
            label="Completed Outcomes"
            value={`${teamMetrics.completionRate}%`}
            helper={`${teamMetrics.totalCompleted} final outcomes`}
            icon={CheckCircle2}
            tone="navy"
          />

          <SummaryCard
            label="Priority Pressure"
            value={teamMetrics.highValue}
            helper="VIP + high-priority owned records"
            icon={Flame}
            tone={
              teamMetrics.highValue > 0
                ? "danger"
                : "good"
            }
          />
        </div>

        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InsightCard
            label="Average Workload"
            value={teamMetrics.averageWorkload}
            helper="Assigned records per active staff group"
            icon={BriefcaseBusiness}
          />

          <InsightCard
            label="Heaviest Owner"
            value={teamMetrics.heaviestStaff?.name || "No owner"}
            helper={
              teamMetrics.heaviestStaff
                ? `${teamMetrics.heaviestStaff.total} assigned records`
                : "No assigned workload yet"
            }
            icon={Target}
          />

          <InsightCard
            label="Highest Priority Pressure"
            value={teamMetrics.highestPressure?.name || "No owner"}
            helper={
              teamMetrics.highestPressure
                ? `${teamMetrics.highestPressure.priorityPressure}% of workload is VIP/high`
                : "No priority workload yet"
            }
            icon={ShieldCheck}
          />
        </div>

        <section className="mt-5 rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-3">
          <button
            type="button"
            onClick={() =>
              setWorkspaceExpanded((current) => !current)
            }
            aria-expanded={workspaceExpanded}
            className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
          >
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-200">
                Team Performance Workspace
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">
                {workspaceExpanded
                  ? "Hide filters, staff portfolio, unassigned pressure and metric definitions."
                  : "Open filters, staff portfolio, unassigned pressure and metric definitions."}
              </p>
            </div>

            <BarChart3
              size={17}
              className={`shrink-0 text-[#123865] transition ${
                workspaceExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </section>

        {workspaceExpanded ? (
          <div className="min-w-0 space-y-4">
        <div className="rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <label className="relative block min-w-0">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search staff, workload, pressure..."
                className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={workloadFilter}
              onChange={(event) =>
                setWorkloadFilter(event.target.value)
              }
              className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Workloads</option>
              <option value="heavy">Heavy</option>
              <option value="balanced">Balanced</option>
              <option value="light">Light</option>
            </select>

            <select
              value={pressureFilter}
              onChange={(event) =>
                setPressureFilter(event.target.value)
              }
              className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">All Pressure</option>
              <option value="high">High Pressure</option>
              <option value="medium">Medium Pressure</option>
              <option value="low">Low Pressure</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            >
              <option value="total">Sort: Workload</option>
              <option value="progression">Sort: Progression</option>
              <option value="completion">Sort: Completion</option>
              <option value="pressure">Sort: Priority Pressure</option>
              <option value="vip">Sort: VIP</option>
            </select>

            <button
              type="button"
              onClick={resetControls}
              disabled={!hasControls}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-xs font-black text-slate-700 transition hover:border-[#FF5A0A] hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Reset
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            Showing {filteredRows.length} of {staffRows.length} active staff
            groups.
          </p>
        </div>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
          <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] p-4 text-white sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Active Staff Portfolio
              </p>
              <h3 className="mt-1 text-xl font-black text-white">
                Ownership & Performance Detail
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Each staff member gets a full-width operating card so workload, progression and pressure remain readable.
              </p>
            </div>

            <span className="w-fit shrink-0 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white">
              {filteredRows.length} visible
            </span>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {filteredRows.length ? (
              filteredRows.map((staff, index) => (
                <StaffPerformanceRow
                  key={staff.id}
                  staff={staff}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))
            ) : (
              <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
                <Search className="mx-auto h-8 w-8 text-orange-700" />
                <h3 className="mt-3 font-black text-[#10233F]">
                  No matching staff performance
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Change the search, workload, pressure, or sort controls.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="grid min-w-0 gap-4">
          <UnassignedCard
            inquiries={unassignedInquiries}
            appointments={unassignedAppointments}
            total={unassignedTotal}
            rate={percent(unassignedTotal, totalRecords)}
          />

          <MethodCard />
        </div>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-red-300 bg-red-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-[#FF5A0A] bg-[#FFF4E8]";

  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.08em]"
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

function InsightCard({
  label,
  value,
  helper,
  icon: Icon,
}) {
  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>

          <p className="mt-2 break-words text-xl font-black leading-6 text-[#10233F]">
            {value}
          </p>
        </div>

        <Icon className="h-4 w-4 shrink-0 text-orange-700" />
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function StaffPerformanceRow({
  staff,
  index,
  reduceMotion,
}) {
  const isTop = index === 0;

  const metrics = [
    ["Inquiries", staff.inquiries, "navy"],
    ["Appointments", staff.appointments, "blue"],
    ["VIP", staff.vip, "violet"],
    ["High", staff.high, "danger"],
    ["Progressed", staff.progressed, "orange"],
    ["Completed", staff.completed, "good"],
  ];

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.15),
      }}
      className={`min-w-0 overflow-hidden rounded-[1.45rem] border-[3px] bg-white shadow-[0_7px_20px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${
        isTop ? "border-[#FF5A0A]" : "border-[#D1DCE7]"
      }`}
    >
      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
        <div className={`min-w-0 p-4 sm:p-5 ${isTop ? "bg-[#FFF4E8]" : "bg-white"}`}>
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${
                isTop
                  ? "border-[#FF5A0A] bg-[#E96512] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EE] text-[#123865]"
              }`}
            >
              #{index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-lg font-black leading-6 text-[#10233F]">
                {staff.name}
              </p>

              <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                <span className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase ${getWorkloadStyle(staff.workload)}`}>
                  {staff.workload}
                </span>
                <span className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase ${getPressureStyle(staff.pressureLevel)}`}>
                  {staff.pressureLevel} pressure
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <RowHeadlineMetric label="Owned" value={staff.total} />
            <RowHeadlineMetric label="Progress" value={`${staff.progressionRate}%`} />
            <RowHeadlineMetric label="Ownership" value={`${staff.ownershipShare}%`} />
          </div>
        </div>

        <div className="min-w-0 border-t-2 border-[#E1E8EF] p-4 sm:p-5 lg:border-l-2 lg:border-t-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {metrics.map(([label, value, tone]) => (
              <StaffDetailMetric
                key={label}
                label={label}
                value={value}
                tone={tone}
              />
            ))}
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
            <span className="rounded-full border-2 border-[#D1DCE7] bg-[#FFF9F1] px-2.5 py-1">
              {staff.progressionRate}% progressed
            </span>
            <span className="rounded-full border-2 border-[#D1DCE7] bg-[#FFF9F1] px-2.5 py-1">
              {staff.completionRate}% completed
            </span>
            <span className="rounded-full border-2 border-[#D1DCE7] bg-[#FFF9F1] px-2.5 py-1">
              {staff.priorityPressure}% VIP/high pressure
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function RowHeadlineMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white px-2 py-2.5 text-center">
      <p className="break-words text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function StaffDetailMetric({ label, value, tone = "orange" }) {
  const styles = {
    navy: "border-[#123865] bg-[#123865] text-white",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    violet: "border-[#9B6CFF] bg-[#F8F5FF] text-violet-800",
    danger: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    good: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    orange: "border-[#F59E0B] bg-[#FFF7ED] text-orange-800",
  };

  const dark = tone === "navy";

  return (
    <div className={`min-w-0 rounded-xl border-2 p-3 ${styles[tone] || styles.orange}`}>
      <p className={`break-words text-[8px] font-black uppercase leading-4 tracking-[0.07em] ${dark ? "text-orange-300" : "opacity-70"}`}>
        {label}
      </p>
      <p className={`mt-1 break-words text-lg font-black ${dark ? "text-white" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function UnassignedCard({
  inquiries,
  appointments,
  total,
  rate,
}) {
  const hasPressure = total > 0;

  return (
    <div
      className={`rounded-[1.45rem] border-[3px] p-5 ${
        hasPressure
          ? "border-red-300 bg-red-50"
          : "border-emerald-300 bg-emerald-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
            hasPressure
              ? "border-red-300 text-red-700"
              : "border-emerald-300 text-emerald-700"
          }`}
        >
          {hasPressure ? (
            <AlertTriangle size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
            Unassigned Work
          </p>

          <h3 className="mt-1 text-lg font-black text-[#10233F]">
            {total} CRM record{total === 1 ? "" : "s"} without an owner
          </h3>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {inquiries} inquiries · {appointments} appointments · {rate}% of
            visible CRM workload.
          </p>
        </div>
      </div>
    </div>
  );
}

function MethodCard() {
  return (
    <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_8px_22px_rgba(18,56,101,0.04)]">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-orange-700">
        Metric Definitions
      </p>

      <h3 className="mt-1 text-lg font-black text-[#10233F]">
        What these numbers actually mean
      </h3>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Definition
          label="Progressed"
          text="Record reached a meaningful later CRM/application/appointment stage."
        />

        <Definition
          label="Completed"
          text="Record reached a final/finished outcome recognized by this component."
        />

        <Definition
          label="Priority Pressure"
          text="VIP + High records as a share of the staff member’s assigned workload."
        />

        <Definition
          label="Ownership Share"
          text="Staff member’s share of all currently assigned CRM records."
        />
      </div>

      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
        This is operational workload intelligence, not an AI employee rating.
        Work complexity and assignment quality still require human review.
      </p>
    </div>
  );
}

function Definition({ label, text }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3">
      <p className="text-xs font-black text-[#10233F]">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function getWorkloadStyle(workload) {
  if (workload === "Heavy") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (workload === "Balanced") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  return "border-orange-300 bg-orange-50 text-orange-700";
}

function getPressureStyle(level) {
  if (level === "High") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (level === "Medium") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

export default StaffPerformanceAnalytics;
