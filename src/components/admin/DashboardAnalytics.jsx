// DashboardAnalytics V5 MAXIMUM — Italy-First Executive CRM Analytics
// src/components/admin/DashboardAnalytics.jsx
//
// Maximum pass:
// - preserves cardClass / inquiries / appointments API
// - preserves Recharts analytics architecture
// - safer data normalization for statuses, priorities, ownership, dates and countries
// - fixes misleading "conversion" math (appointments / inquiries was not a conversion rate)
// - adds separate inquiry progression, appointment completion and ownership KPIs
// - stronger CRM health formula
// - better 7-day date handling
// - safer top-country and top-counselor aggregation
// - removes "Unknown" from top rankings when useful data exists
// - fixes unreadable tooltip colors
// - fixes decorative absolute bars by making panels relative
// - replaces emoji KPI icons with Lucide icons
// - reduced-motion support
// - cleaner Recharts axes/grid for light Admin OS surfaces
// - stronger zero states for empty charts
// - explicit white text on navy surfaces
// - mobile-safe chart containers
// - no fake AI/GPT claims
// - read-only analytics only; no Supabase writes invented here

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Crown,
  Gauge,
  Globe2,
  Target,
  TrendingUp,
  UserCheck2,
  Users,
  Zap,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import { useMemo } from "react";

const DAY_MS = 86400000;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function clamp(value, min = 0, max = 100) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return min;
  }

  return Math.min(max, Math.max(min, numeric));
}

function percent(numerator, denominator) {
  const top = Number(numerator) || 0;
  const bottom = Number(denominator) || 0;

  if (bottom <= 0) return 0;

  return clamp(
    Math.round((top / bottom) * 100)
  );
}

function validDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(value) {
  const date = value instanceof Date
    ? value
    : validDate(value);

  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isAssigned(lead = {}) {
  return Boolean(
    lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.counselor_id ||
      lead.owner_id ||
      lead.assigned_counselor_id ||
      lead.assigned_admin_name ||
      lead.assigned_counselor_name ||
      lead.counselor_name
  );
}

function getCounselorName(lead = {}) {
  return (
    lead.assigned_admin_name ||
    lead.assigned_counselor_name ||
    lead.counselor_name ||
    lead.owner_name ||
    ""
  );
}

function getInquiryStatus(item = {}) {
  return normalize(
    item.status ||
      item.pipeline_stage ||
      "new"
  );
}

function getAppointmentStatus(item = {}) {
  return normalize(
    item.appointment_stage ||
      item.status ||
      "pending"
  );
}

function inquiryHasProgressed(item = {}) {
  const status = getInquiryStatus(item);

  return ![
    "",
    "new",
    "new lead",
    "new inquiry",
    "pending",
  ].includes(status);
}

function inquiryHasOutcome(item = {}) {
  const status = getInquiryStatus(item);

  return (
    status === "approved" ||
    status.includes("visa approved") ||
    status.includes("completed")
  );
}

function appointmentHasProgressed(item = {}) {
  const status = getAppointmentStatus(item);

  return [
    "confirmed",
    "consultation done",
    "completed",
    "converted to lead",
  ].some((token) => status.includes(token));
}

function appointmentHasOutcome(item = {}) {
  const status = getAppointmentStatus(item);

  return (
    status === "completed" ||
    status.includes("consultation done") ||
    status.includes("converted to lead")
  );
}

function isInactive(lead = {}) {
  const status = normalize(
    lead.status ||
      lead.pipeline_stage ||
      lead.appointment_stage
  );

  return [
    "cancelled",
    "canceled",
    "closed",
    "rejected",
    "not interested",
  ].some((token) => status.includes(token));
}

function DashboardAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const safeInquiries = safeArray(inquiries);
    const safeAppointments = safeArray(appointments);

    const allLeads = [
      ...safeInquiries.map((item) => ({
        ...item,
        __type: "inquiry",
      })),
      ...safeAppointments.map((item) => ({
        ...item,
        __type: "appointment",
      })),
    ];

    const totalInquiries = safeInquiries.length;
    const totalAppointments = safeAppointments.length;
    const totalLeads = allLeads.length;

    const activeLeads = allLeads.filter(
      (lead) => !isInactive(lead)
    );

    const assignedLeads = activeLeads.filter(
      isAssigned
    ).length;

    const unassignedLeads =
      activeLeads.length - assignedLeads;

    const assignedPercent = percent(
      assignedLeads,
      activeLeads.length
    );

    const unassignedPercent = percent(
      unassignedLeads,
      activeLeads.length
    );

    const todayKey = dateKey(new Date());

    const todayInquiries = safeInquiries.filter(
      (inquiry) =>
        dateKey(
          inquiry.created_at ||
            inquiry.submitted_at
        ) === todayKey
    ).length;

    const todayAppointments = safeAppointments.filter(
      (appointment) =>
        dateKey(
          appointment.created_at ||
            appointment.submitted_at ||
            appointment.appointment_date
        ) === todayKey
    ).length;

    const progressedInquiries = safeInquiries.filter(
      inquiryHasProgressed
    ).length;

    const inquiryOutcomes = safeInquiries.filter(
      inquiryHasOutcome
    ).length;

    const progressedAppointments = safeAppointments.filter(
      appointmentHasProgressed
    ).length;

    const appointmentOutcomes = safeAppointments.filter(
      appointmentHasOutcome
    ).length;

    const engagementRate = percent(
      progressedInquiries +
        progressedAppointments,
      totalLeads
    );

    const outcomeRate = percent(
      inquiryOutcomes +
        appointmentOutcomes,
      totalLeads
    );

    const inquiryNewCount = safeInquiries.filter(
      (inquiry) =>
        [
          "",
          "new",
          "new lead",
          "new inquiry",
        ].includes(
          getInquiryStatus(inquiry)
        )
    ).length;

    const inquiryContactedCount = safeInquiries.filter(
      (inquiry) => {
        const status =
          getInquiryStatus(inquiry);

        return (
          status === "contacted" ||
          status.includes("contacted")
        );
      }
    ).length;

    const appointmentStatusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      other: 0,
    };

    safeAppointments.forEach((appointment) => {
      const status =
        getAppointmentStatus(appointment);

      if (
        status === "pending" ||
        status === "new booking" ||
        status === "new"
      ) {
        appointmentStatusCounts.pending += 1;
      } else if (
        status === "confirmed"
      ) {
        appointmentStatusCounts.confirmed += 1;
      } else if (
        status === "completed" ||
        status.includes("consultation done")
      ) {
        appointmentStatusCounts.completed += 1;
      } else if (
        status.includes("cancel")
      ) {
        appointmentStatusCounts.cancelled += 1;
      } else {
        appointmentStatusCounts.other += 1;
      }
    });

    const priorityCounts = {
      vip: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    allLeads.forEach((lead) => {
      const priority =
        normalize(lead.priority);

      if (priority === "vip") {
        priorityCounts.vip += 1;
      } else if (
        ["high", "urgent", "critical"].includes(priority)
      ) {
        priorityCounts.high += 1;
      } else if (
        priority === "medium"
      ) {
        priorityCounts.medium += 1;
      } else {
        priorityCounts.low += 1;
      }
    });

    const priorityData = [
      {
        name: "VIP",
        value: priorityCounts.vip,
        color: "#F97316",
      },
      {
        name: "High",
        value: priorityCounts.high,
        color: "#DC2626",
      },
      {
        name: "Medium",
        value: priorityCounts.medium,
        color: "#D97706",
      },
      {
        name: "Low",
        value: priorityCounts.low,
        color: "#64748B",
      },
    ];

    const appointmentStatusData = [
      {
        name: "Pending",
        value: appointmentStatusCounts.pending,
        color: "#F59E0B",
      },
      {
        name: "Confirmed",
        value: appointmentStatusCounts.confirmed,
        color: "#2563EB",
      },
      {
        name: "Completed",
        value: appointmentStatusCounts.completed,
        color: "#059669",
      },
      {
        name: "Cancelled",
        value: appointmentStatusCounts.cancelled,
        color: "#DC2626",
      },
    ];

    if (appointmentStatusCounts.other > 0) {
      appointmentStatusData.push({
        name: "Other",
        value: appointmentStatusCounts.other,
        color: "#64748B",
      });
    }

    const inquiryStatusData = [
      {
        name: "New",
        value: inquiryNewCount,
        color: "#F97316",
      },
      {
        name: "Contacted",
        value: inquiryContactedCount,
        color: "#2563EB",
      },
      {
        name: "Progressed",
        value: Math.max(
          progressedInquiries -
            inquiryContactedCount,
          0
        ),
        color: "#059669",
      },
    ];

    const ownershipData = [
      {
        name: "Assigned",
        value: assignedLeads,
        color: "#123865",
      },
      {
        name: "Unassigned",
        value: unassignedLeads,
        color: "#F97316",
      },
    ];

    const weeklyData = getWeeklyData({
      inquiries: safeInquiries,
      appointments: safeAppointments,
    });

    const italyInterest = getItalyInterest(
      safeInquiries,
      safeAppointments
    );

    const topCounselors =
      getTopCounselors(
        activeLeads
      );

    const activeRate = percent(
      activeLeads.length,
      totalLeads
    );

    const todayActivity =
      todayInquiries + todayAppointments;

    const crmHealthScore =
      totalLeads === 0
        ? 0
        : clamp(
            Math.round(
              assignedPercent * 0.35 +
                engagementRate * 0.25 +
                outcomeRate * 0.2 +
                activeRate * 0.1 +
                (todayActivity > 0
                  ? 10
                  : 0)
            )
          );

    return {
      safeInquiries,
      safeAppointments,
      allLeads,
      totalInquiries,
      totalAppointments,
      totalLeads,
      activeLeads: activeLeads.length,
      assignedLeads,
      unassignedLeads,
      assignedPercent,
      unassignedPercent,
      todayInquiries,
      todayAppointments,
      todayActivity,
      progressedInquiries,
      inquiryOutcomes,
      progressedAppointments,
      appointmentOutcomes,
      engagementRate,
      outcomeRate,
      priorityCounts,
      priorityData,
      appointmentStatusData,
      inquiryStatusData,
      ownershipData,
      weeklyData,
      italyInterest,
      topCounselors,
      crmHealthScore,
    };
  }, [inquiries, appointments]);

  const health =
    getHealthConfig(
      model.crmHealthScore,
      model.totalLeads
    );

  const analyticsCards = [
    {
      label: "Total Leads",
      value: model.totalLeads,
      helper: `${model.totalInquiries} inquiries · ${model.totalAppointments} appointments`,
      icon: Target,
      tone: "orange",
    },
    {
      label: "CRM Health",
      value: `${model.crmHealthScore}%`,
      helper: health.label,
      icon: Gauge,
      tone: health.tone,
    },
    {
      label: "Today Activity",
      value: model.todayActivity,
      helper: `${model.todayInquiries} inquiries · ${model.todayAppointments} appointments`,
      icon: Zap,
      tone: "green",
    },
    {
      label: "VIP / High Leads",
      value:
        model.priorityCounts.vip +
        model.priorityCounts.high,
      helper: `${model.priorityCounts.vip} VIP · ${model.priorityCounts.high} high/urgent`,
      icon: Crown,
      tone: "amber",
    },
  ];

  return (
    <motion.div
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 18 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="space-y-5 xl:space-y-6"
    >
      <section className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4">
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderBadge>
                <BarChart3 size={12} />
                Dashboard Analytics
              </HeaderBadge>

              <HeaderBadge>
                <TrendingUp size={12} />
                Live CRM Snapshot
              </HeaderBadge>
            </div>

            <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              Executive CRM Analytics
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              Track weekly activity, ownership, pipeline movement, priority
              workload, Italy demand and counselor distribution from live CRM records.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Engagement"
                value={`${model.engagementRate}%`}
              />

              <DarkMetric
                label="Outcome"
                value={`${model.outcomeRate}%`}
              />

              <DarkMetric
                label="Ownership"
                value={`${model.assignedPercent}%`}
              />

              <DarkMetric
                label="Active"
                value={model.activeLeads}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              CRM Health
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-black text-white">
                {model.crmHealthScore}
              </p>

              <p className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-white">
                {health.label}
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : { width: 0 }
                }
                animate={{
                  width: `${model.crmHealthScore}%`,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.65,
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {health.message}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-4">
        {analyticsCards.map(
          (item, index) => (
            <AnalyticsCard
              key={item.label}
              {...item}
              index={index}
              reduceMotion={reduceMotion}
              cardClass={cardClass}
            />
          )
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <ChartPanel
          cardClass={cardClass}
          eyebrow="Weekly CRM Analytics"
          title="Inquiry & Appointment Activity"
          description="Actual CRM records created during the last seven calendar days."
          icon={TrendingUp}
        >
          {hasChartData(model.weeklyData, [
            "Inquiries",
            "Appointments",
          ]) ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={model.weeklyData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -24,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Area
                  type="monotone"
                  dataKey="Inquiries"
                  stroke="#F97316"
                  fill="#FDBA74"
                  fillOpacity={0.28}
                  strokeWidth={2.4}
                />

                <Area
                  type="monotone"
                  dataKey="Appointments"
                  stroke="#123865"
                  fill="#93C5FD"
                  fillOpacity={0.22}
                  strokeWidth={2.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              text="No inquiry or appointment activity was recorded in the last seven days."
            />
          )}
        </ChartPanel>

        <ChartPanel
          cardClass={cardClass}
          eyebrow="Lead Ownership"
          title="Assigned vs Open Leads"
          description="Active CRM records with a responsible owner versus records still in the open pool."
          icon={UserCheck2}
        >
          {model.activeLeads > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={model.ownershipData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={5}
                  >
                    {model.ownershipData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    content={<CustomTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>

              <LegendList
                data={model.ownershipData}
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat
                  label="Assigned"
                  value={`${model.assignedPercent}%`}
                />

                <MiniStat
                  label="Open Pool"
                  value={`${model.unassignedPercent}%`}
                />
              </div>
            </>
          ) : (
            <ChartEmptyState
              text="No active CRM records are available for ownership analysis."
            />
          )}
        </ChartPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ChartPanel
          cardClass={cardClass}
          eyebrow="Lead Priority"
          title="Priority Distribution"
          description="Priority mix across inquiries and appointments."
          icon={Crown}
        >
          {hasChartData(
            model.priorityData,
            ["value"]
          ) ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={model.priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {model.priorityData.map(
                      (entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    content={<CustomTooltip />}
                  />
                </PieChart>
              </ResponsiveContainer>

              <LegendList
                data={model.priorityData}
              />
            </>
          ) : (
            <ChartEmptyState
              text="No priority data is available yet."
            />
          )}
        </ChartPanel>

        <ChartPanel
          cardClass={cardClass}
          eyebrow="Appointments"
          title="Status Breakdown"
          description="Current distribution of consultation bookings."
          icon={CalendarCheck2}
        >
          {hasChartData(
            model.appointmentStatusData,
            ["value"]
          ) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={model.appointmentStatusData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -24,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  barSize={34}
                >
                  {model.appointmentStatusData.map(
                    (entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              text="No appointment records are available yet."
            />
          )}
        </ChartPanel>

        <ChartPanel
          cardClass={cardClass}
          eyebrow="Inquiries"
          title="Inquiry Follow-up"
          description="New, contacted, and further-progressed inquiry records."
          icon={CheckCircle2}
        >
          {hasChartData(
            model.inquiryStatusData,
            ["value"]
          ) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={model.inquiryStatusData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -24,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="value"
                  radius={[10, 10, 0, 0]}
                  barSize={42}
                >
                  {model.inquiryStatusData.map(
                    (entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                      />
                    )
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              text="No inquiry records are available yet."
            />
          )}
        </ChartPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <ItalyFocusPanel
          cardClass={cardClass}
          data={model.italyInterest}
        />

        <InsightPanel
          cardClass={cardClass}
          eyebrow="Team Ownership"
          title="Top Assigned Counselors"
          description="Current active-lead ownership distribution across named counselors."
          emptyText="No named counselor assignment data available yet."
          data={model.topCounselors}
          icon={Users}
          tone="blue"
        />
      </div>

      <MethodologyNote />
    </motion.div>
  );
}

function AnalyticsCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  index,
  reduceMotion,
  cardClass,
}) {
  const style = getToneStyle(tone);

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : index * 0.035,
      }}
      className={`${cardClass} rounded-[1.5rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.04)] ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-[#10233f]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </motion.article>
  );
}

function ChartPanel({
  cardClass,
  eyebrow,
  title,
  description,
  icon: Icon = BarChart3,
  children,
}) {
  return (
    <section
      className={`${cardClass} relative min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_32px_rgba(15,35,63,0.055)]`}
    >
      <div className="overflow-hidden rounded-[1.45rem] border-[3px] border-[#F97316] bg-[#173F6B] p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
            <Icon size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white">
              {eyebrow}
            </p>

            <h2 className="mt-1 break-words text-xl font-black leading-6 text-white">
              {title}
            </h2>

            <p className="mt-1 break-words text-xs font-semibold leading-5 text-white">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-[280px] bg-[#FFF8EE] p-3 pt-4 sm:p-4">
        <div className="h-full min-h-[250px] rounded-[1.3rem] border-2 border-slate-300 bg-white p-3">
          {children}
        </div>
      </div>
    </section>
  );
}

function ItalyFocusPanel({
  cardClass,
  data,
}) {
  const {
    italyLeads = 0,
    inquiryItaly = 0,
    appointmentItaly = 0,
    taggedRecords = 0,
    share = 0,
    untaggedRecords = 0,
  } = data || {};

  return (
    <section
      className={`${cardClass} min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_32px_rgba(15,35,63,0.06)]`}
    >
      <div className="overflow-hidden rounded-[1.55rem] border-[3px] border-[#F97316]">
        <div className="min-w-0 bg-[#173F6B] p-5 text-white">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
              <Globe2 size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
                  Italy-First CRM
                </p>

                <span className="rounded-full border-2 border-orange-300/40 bg-orange-400/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-orange-200">
                  Active Destination
                </span>
              </div>

              <h2 className="mt-1 break-words text-xl font-black leading-6 text-white">
                Italy Student Demand
              </h2>

              <p className="mt-1 max-w-xl break-words text-xs font-semibold leading-5 text-white">
                Italy-only demand intelligence from live inquiry and appointment country-interest fields.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF8EE] p-4">
          <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.35rem] border-[3px] border-[#F97316] bg-[#FFF4E8] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                Italy Leads
              </p>

              <div className="mt-2 flex min-w-0 items-end justify-between gap-3">
                <p className="text-4xl font-black leading-none text-[#10233F]">
                  {italyLeads}
                </p>

                <span className="shrink-0 rounded-full border-2 border-[#F97316] bg-white px-3 py-1 text-sm font-black text-orange-700">
                  {share}%
                </span>
              </div>

              <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                Share of CRM records that currently contain a destination value.
              </p>

              <div className="mt-4 h-3 overflow-hidden rounded-full border border-orange-200 bg-white">
                <div
                  className="h-full rounded-full bg-[#E96512]"
                  style={{ width: `${Math.max(0, Math.min(100, share))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              <ItalyMiniMetric
                label="Inquiries"
                value={inquiryItaly}
                tone="orange"
              />

              <ItalyMiniMetric
                label="Appointments"
                value={appointmentItaly}
                tone="blue"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <ItalyMiniMetric
              label="Tagged CRM Records"
              value={taggedRecords}
              tone="green"
            />

            <ItalyMiniMetric
              label="Missing Destination"
              value={untaggedRecords}
              tone="amber"
            />
          </div>

          <div className="mt-3 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-3">
            <p className="text-xs font-semibold leading-5 text-slate-600">
              Zaifan is currently operating Italy-first, so Germany, Canada, Turkey and other destinations are intentionally excluded from this Admin demand panel.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ItalyMiniMetric({
  label,
  value,
  tone = "orange",
}) {
  const tones = {
    orange:
      "border-[#F97316] bg-[#FFF4E8] text-orange-700",
    blue:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    amber:
      "border-[#F59E0B] bg-[#FFF7ED] text-amber-800",
  };

  return (
    <div className={`min-w-0 rounded-xl border-[3px] p-3 ${tones[tone] || tones.orange}`}>
      <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.07em] opacity-80">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function InsightPanel({
  cardClass,
  eyebrow,
  title,
  description,
  emptyText,
  data,
  icon: Icon,
  tone = "orange",
}) {
  const style = getToneStyle(tone);

  return (
    <section
      className={`${cardClass} relative min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_32px_rgba(15,35,63,0.055)]`}
    >
      <div className="overflow-hidden rounded-[1.45rem] border-[3px] border-[#F97316] bg-[#173F6B] p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
            <Icon size={17} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white">
              {eyebrow}
            </p>

            <h2 className="mt-1 break-words text-xl font-black leading-6 text-white">
              {title}
            </h2>

            <p className="mt-1 break-words text-xs font-semibold leading-5 text-white">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-[#FFF8EE] p-4">
        {data.length === 0 ? (
          <div className="rounded-[1.2rem] border-2 border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-slate-600">
              {emptyText}
            </p>
          </div>
        ) : (
          data.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="min-w-0 rounded-[1.2rem] border-[3px] border-[#D1DCE7] bg-white p-4 transition hover:border-[#F97316]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#10233f]">
                    #{index + 1} {item.name}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.value} lead
                    {item.value === 1 ? "" : "s"}
                  </p>
                </div>

                <span
                  className={`rounded-full border-2 px-3 py-1 text-xs font-black ${style.badge}`}
                >
                  {item.percent}%
                </span>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <div
                  className={`h-full rounded-full ${style.bar}`}
                  style={{
                    width: `${item.percent}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function LegendList({ data }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {data.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-xl border-2 border-slate-300 bg-white px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: item.color,
              }}
            />

            <span className="text-xs font-semibold text-slate-600">
              {item.name}
            </span>
          </div>

          <span className="text-xs font-black text-[#10233f]">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-orange-300 bg-white px-4 py-3 text-xs shadow-[0_14px_36px_rgba(15,35,63,0.14)]">
      {label ? (
        <p className="mb-2 font-black text-orange-700">
          {label}
        </p>
      ) : null}

      <div className="space-y-1">
        {payload.map(
          (item, index) => (
            <p
              key={`${item.name}-${item.value}-${index}`}
              className="font-semibold text-slate-600"
            >
              {item.name}:{" "}
              <span className="font-black text-[#10233f]">
                {item.value}
              </span>
            </p>
          )
        )}
      </div>
    </div>
  );
}

function ChartEmptyState({ text }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <BarChart3 size={22} />
      </div>

      <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function HeaderBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      {children}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function MethodologyNote() {
  return (
    <div className="rounded-[1.45rem] border-[3px] border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-blue-300 bg-white text-blue-700">
          <Gauge size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            Analytics methodology
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            Engagement means a record moved beyond its initial stage. Outcome
            rate only counts approved/completed/converted records. CRM Health
            combines ownership, engagement, outcomes, active workload and recent
            activity. It is an operational snapshot, not a guaranteed business,
            admission, or visa-success metric.
          </p>
        </div>
      </div>
    </div>
  );
}

function getWeeklyData({
  inquiries,
  appointments,
}) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const last7Days = [
    ...Array(7),
  ].map((_, index) => {
    const date = new Date(today);

    date.setDate(
      today.getDate() -
        (6 - index)
    );

    return {
      key: dateKey(date),
      day: date.toLocaleDateString(
        "en-GB",
        {
          weekday: "short",
        }
      ),
      Inquiries: 0,
      Appointments: 0,
    };
  });

  const byDate = new Map(
    last7Days.map((item) => [
      item.key,
      item,
    ])
  );

  inquiries.forEach((inquiry) => {
    const key = dateKey(
      inquiry.created_at ||
        inquiry.submitted_at
    );

    if (
      key &&
      byDate.has(key)
    ) {
      byDate.get(key).Inquiries += 1;
    }
  });

  appointments.forEach(
    (appointment) => {
      const key = dateKey(
        appointment.created_at ||
          appointment.submitted_at ||
          appointment.appointment_date
      );

      if (
        key &&
        byDate.has(key)
      ) {
        byDate.get(
          key
        ).Appointments += 1;
      }
    }
  );

  return last7Days.map(
    ({ key, ...item }) => item
  );
}

function getItalyInterest(
  inquiries,
  appointments
) {
  const isItaly = (value) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();

    return [
      "italy",
      "italia",
      "italian",
    ].includes(normalized);
  };

  const getCountry = (record = {}) =>
    String(
      record.country_interest ||
        record.country ||
        record.destination_country ||
        ""
    ).trim();

  const inquiryItaly = inquiries.filter((item) =>
    isItaly(getCountry(item))
  ).length;

  const appointmentItaly = appointments.filter((item) =>
    isItaly(getCountry(item))
  ).length;

  const taggedInquiries = inquiries.filter((item) =>
    Boolean(getCountry(item))
  ).length;

  const taggedAppointments = appointments.filter((item) =>
    Boolean(getCountry(item))
  ).length;

  const italyLeads = inquiryItaly + appointmentItaly;
  const taggedRecords = taggedInquiries + taggedAppointments;

  const share = taggedRecords
    ? Math.round((italyLeads / taggedRecords) * 100)
    : 0;

  return {
    italyLeads,
    inquiryItaly,
    appointmentItaly,
    taggedRecords,
    share,
    untaggedRecords:
      inquiries.length +
      appointments.length -
      taggedRecords,
  };
}

function getTopCounselors(
  allLeads
) {
  const counselorMap = {};

  allLeads.forEach((lead) => {
    const counselor =
      String(
        getCounselorName(lead)
      ).trim();

    if (!counselor) return;

    counselorMap[counselor] =
      (counselorMap[
        counselor
      ] || 0) + 1;
  });

  return buildTopList(
    counselorMap,
    5
  );
}

function buildTopList(
  map,
  limit = 5
) {
  const entries =
    Object.entries(map);

  const total =
    entries.reduce(
      (sum, [, value]) =>
        sum + value,
      0
    );

  return entries
    .map(([name, value]) => ({
      name,
      value,
      percent:
        total === 0
          ? 0
          : Math.round(
              (value /
                total) *
                100
            ),
    }))
    .sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }

      return a.name.localeCompare(
        b.name
      );
    })
    .slice(0, limit);
}

function hasChartData(
  data,
  keys
) {
  return safeArray(data).some(
    (item) =>
      keys.some(
        (key) =>
          Number(item?.[key]) >
          0
      )
  );
}

function getToneStyle(tone) {
  const styles = {
    orange: {
      card:
        "border-orange-300 bg-orange-50 text-orange-800",
      icon:
        "border-orange-300 text-orange-700",
      badge:
        "border-orange-300 bg-orange-50 text-orange-800",
      bar: "bg-orange-500",
    },
    green: {
      card:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
      icon:
        "border-emerald-300 text-emerald-700",
      badge:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
      bar: "bg-emerald-500",
    },
    blue: {
      card:
        "border-blue-300 bg-blue-50 text-blue-800",
      icon:
        "border-blue-300 text-blue-700",
      badge:
        "border-blue-300 bg-blue-50 text-blue-800",
      bar: "bg-blue-500",
    },
    amber: {
      card:
        "border-amber-300 bg-amber-50 text-amber-900",
      icon:
        "border-amber-300 text-amber-800",
      badge:
        "border-amber-300 bg-amber-50 text-amber-900",
      bar: "bg-amber-500",
    },
    red: {
      card:
        "border-red-300 bg-red-50 text-red-800",
      icon:
        "border-red-300 text-red-700",
      badge:
        "border-red-300 bg-red-50 text-red-800",
      bar: "bg-red-500",
    },
  };

  return (
    styles[tone] ||
    styles.orange
  );
}

function getHealthConfig(
  score,
  totalLeads
) {
  if (totalLeads === 0) {
    return {
      label: "No Data",
      tone: "blue",
      message:
        "CRM health will activate when inquiry or appointment records are available.",
    };
  }

  if (score >= 80) {
    return {
      label: "Excellent",
      tone: "green",
      message:
        "Ownership, engagement, outcomes and recent CRM activity are currently strong.",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      tone: "orange",
      message:
        "CRM performance is generally healthy with manageable room for improvement.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      tone: "amber",
      message:
        "CRM performance needs attention. Review ownership gaps, weak progression and low recent activity.",
    };
  }

  return {
    label: "Critical",
    tone: "red",
    message:
      "The CRM snapshot shows weak ownership, progression, outcomes or activity and needs operational cleanup.",
  };
}

export default DashboardAnalytics;
