// CrmCommandCenter PARTNER OS EXTREME — Compact Executive CRM Command
// src/components/admin/CrmCommandCenter.jsx
//
// Maximum pass:
// - preserves cardClass / inquiries / appointments / followUpReminders API
// - preserves buildAiLeadInsights + buildAutoStageSuggestions integrations
// - safer reminder matching and overdue logic
// - stronger assignment detection
// - safer age/stale calculations
// - more balanced CRM health formula
// - clear data-quality / ownership / follow-up / stage-pressure signals
// - better explainability around the health score
// - avoids pretending local scoring is GPT
// - reduced-motion support
// - explicit white text on navy surfaces
// - fixes inconsistent gold/black gradient direction
// - stronger responsive/mobile behavior
// - keeps this read-only: no Supabase writes invented here

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Crown,
  Flame,
  Gauge,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { buildAiLeadInsights } from "../../../../services/aiLeadEngine";
import { buildAutoStageSuggestions } from "../../../../services/autoStageEngine";

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

function validDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLeadType(lead = {}) {
  const explicit = normalize(
    lead.student_type ||
      lead.__leadType ||
      lead.lead_type ||
      lead.type
  );

  if (explicit.includes("appointment")) {
    return "appointment";
  }

  if (explicit.includes("inquiry")) {
    return "inquiry";
  }

  return lead.appointment_date || lead.appointment_time
    ? "appointment"
    : "inquiry";
}

function isAssigned(lead = {}) {
  return Boolean(
    lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.counselor_id ||
      lead.owner_id ||
      lead.assigned_counselor_id
  );
}

function getStatus(lead = {}) {
  return normalize(
    lead.status ||
      lead.appointment_stage ||
      lead.pipeline_stage ||
      "pending"
  );
}

function getPriority(lead = {}) {
  return normalize(lead.priority || "medium");
}

function getAgeDays(lead = {}) {
  const source =
    lead.last_activity_at ||
    lead.updated_at ||
    lead.last_contacted_at ||
    lead.created_at ||
    lead.submitted_at ||
    lead.appointment_date ||
    lead.date;

  const date = validDate(source);

  if (!date) return null;

  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / DAY_MS)
  );
}

function reminderMatchesLead(reminder = {}, lead = {}) {
  const reminderId = String(
    reminder.student_id ||
      reminder.lead_id ||
      ""
  );

  const leadId = String(lead.id || "");

  if (!leadId || reminderId !== leadId) {
    return false;
  }

  const reminderType = normalize(
    reminder.student_type ||
      reminder.lead_type ||
      ""
  );

  if (!reminderType) {
    return true;
  }

  return reminderType === getLeadType(lead);
}

function isOpenReminder(reminder = {}) {
  const status = normalize(
    reminder.status || "pending"
  );

  return ![
    "completed",
    "done",
    "closed",
    "cancelled",
    "canceled",
  ].includes(status);
}

function clamp(value, min = 0, max = 100) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

function CrmCommandCenter({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
}) {
  const reduceMotion = useReducedMotion();
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);

  const model = useMemo(() => {
    const safeInquiries = safeArray(inquiries).map((lead) => ({
      ...lead,
      __leadType: "inquiry",
    }));

    const safeAppointments = safeArray(appointments).map((lead) => ({
      ...lead,
      __leadType: "appointment",
    }));

    const safeReminders = safeArray(followUpReminders);

    const allLeads = [
      ...safeInquiries,
      ...safeAppointments,
    ];

    const aiInsightsRaw =
      buildAiLeadInsights({
        inquiries: safeInquiries,
        appointments: safeAppointments,
      }) || {};

    const aiInsights = {
      hotLeads: safeArray(aiInsightsRaw.hotLeads),
      immediateLeads: safeArray(
        aiInsightsRaw.immediateLeads
      ),
      averageScore: clamp(
        aiInsightsRaw.averageScore,
        0,
        100
      ),
    };

    const stageSuggestionsRaw =
      buildAutoStageSuggestions({
        inquiries: safeInquiries,
        appointments: safeAppointments,
      }) || {};

    const stageSuggestions = {
      total: Number(stageSuggestionsRaw.total || 0),
      highUrgency: safeArray(
        stageSuggestionsRaw.highUrgency
      ),
    };

    const pendingReminders =
      safeReminders.filter(isOpenReminder);

    const overdueReminders =
      pendingReminders.filter((item) => {
        const dueDate = validDate(item.due_date);

        return (
          dueDate &&
          dueDate.getTime() < Date.now()
        );
      });

    const enrichedLeads =
      allLeads.map((lead) => {
        const status = getStatus(lead);
        const priority = getPriority(lead);
        const ageDays = getAgeDays(lead);

        const matchingReminders =
          safeReminders.filter((reminder) =>
            reminderMatchesLead(
              reminder,
              lead
            )
          );

        const activeReminders =
          matchingReminders.filter(
            isOpenReminder
          );

        const hasReminder =
          activeReminders.length > 0;

        const leadOverdue =
          activeReminders.some(
            (reminder) => {
              const due = validDate(
                reminder.due_date
              );

              return (
                due &&
                due.getTime() <
                  Date.now()
              );
            }
          );

        const isUnassigned =
          !isAssigned(lead);

        const isVip =
          priority === "vip" ||
          [
            "high",
            "urgent",
            "critical",
          ].includes(priority);

        const inactiveStatus =
          status.includes("closed") ||
          status.includes("cancelled") ||
          status.includes("canceled") ||
          status.includes("rejected") ||
          status.includes("not interested");

        const isStale =
          !inactiveStatus &&
          ageDays !== null &&
          ageDays >= 7 &&
          (
            status.includes("new") ||
            status.includes("pending") ||
            status.includes("contacted")
          );

        return {
          ...lead,
          status,
          priority,
          ageDays,
          hasReminder,
          leadOverdue,
          isUnassigned,
          isVip,
          isStale,
          inactiveStatus,
          leadType:
            getLeadType(lead),
        };
      });

    const activeLeads =
      enrichedLeads.filter(
        (lead) =>
          !lead.inactiveStatus
      );

    const unassignedLeads =
      activeLeads.filter(
        (lead) =>
          lead.isUnassigned
      );

    const staleLeads =
      activeLeads.filter(
        (lead) =>
          lead.isStale
      );

    const noReminderLeads =
      activeLeads.filter(
        (lead) =>
          !lead.hasReminder
      );

    const vipRiskLeads =
      activeLeads.filter(
        (lead) =>
          lead.isVip &&
          (
            lead.isStale ||
            !lead.hasReminder ||
            lead.isUnassigned ||
            lead.leadOverdue
          )
      );

    const totalLeads =
      allLeads.length;

    const activeLeadCount =
      activeLeads.length;

    const contactedCount =
      safeInquiries.filter((item) => {
        const status = normalize(
          item.status ||
            item.pipeline_stage ||
            "new"
        );

        return ![
          "new",
          "new lead",
          "new inquiry",
        ].includes(status);
      }).length;

    const approvedCount =
      safeInquiries.filter((item) => {
        const status = normalize(
          item.status ||
            item.pipeline_stage
        );

        return (
          status === "approved" ||
          status.includes("visa approved")
        );
      }).length;

    const confirmedAppointments =
      safeAppointments.filter((item) => {
        const status = normalize(
          item.appointment_stage ||
            item.status ||
            "pending"
        );

        return (
          status === "confirmed" ||
          status === "consultation done" ||
          status === "completed"
        );
      }).length;

    const engagementRate =
      safeInquiries.length
        ? Math.round(
            (contactedCount /
              safeInquiries.length) *
              100
          )
        : 0;

    const approvalRate =
      safeInquiries.length
        ? Math.round(
            (approvedCount /
              safeInquiries.length) *
              100
          )
        : 0;

    const appointmentConfirmationRate =
      safeAppointments.length
        ? Math.round(
            (confirmedAppointments /
              safeAppointments.length) *
              100
          )
        : 0;

    const assignmentCoverage =
      activeLeadCount
        ? Math.round(
            ((activeLeadCount -
              unassignedLeads.length) /
              activeLeadCount) *
              100
          )
        : 100;

    const reminderCoverage =
      activeLeadCount
        ? Math.round(
            ((activeLeadCount -
              noReminderLeads.length) /
              activeLeadCount) *
              100
          )
        : 100;

    const staleRate =
      activeLeadCount
        ? Math.round(
            (staleLeads.length /
              activeLeadCount) *
              100
          )
        : 0;

    const overdueRate =
      pendingReminders.length
        ? Math.round(
            (overdueReminders.length /
              pendingReminders.length) *
              100
          )
        : 0;

    const positiveScore =
      engagementRate * 0.18 +
      approvalRate * 0.22 +
      appointmentConfirmationRate * 0.16 +
      aiInsights.averageScore * 0.14 +
      assignmentCoverage * 0.15 +
      reminderCoverage * 0.15;

    const pressurePenalty =
      overdueRate * 0.18 +
      staleRate * 0.16 +
      Math.min(
        20,
        vipRiskLeads.length * 3
      ) +
      Math.min(
        15,
        stageSuggestions.highUrgency
          .length * 1.5
      );

    const crmHealthScore =
      totalLeads === 0
        ? 0
        : clamp(
            Math.round(
              positiveScore -
                pressurePenalty +
                12
            ),
            0,
            100
          );

    const health =
      getHealthConfig(
        crmHealthScore,
        totalLeads
      );

    const priorityAction =
      getPriorityAction({
        hotLeads:
          aiInsights.hotLeads.length,
        immediateLeads:
          aiInsights.immediateLeads.length,
        overdueReminders:
          overdueReminders.length,
        stageSuggestions:
          stageSuggestions.highUrgency.length,
        pendingReminders:
          pendingReminders.length,
        engagementRate,
        unassignedLeads:
          unassignedLeads.length,
        staleLeads:
          staleLeads.length,
        vipRiskLeads:
          vipRiskLeads.length,
        totalLeads,
      });

    return {
      safeInquiries,
      safeAppointments,
      safeReminders,
      allLeads,
      activeLeads,
      aiInsights,
      stageSuggestions,
      pendingReminders,
      overdueReminders,
      unassignedLeads,
      staleLeads,
      noReminderLeads,
      vipRiskLeads,
      totalLeads,
      engagementRate,
      approvalRate,
      appointmentConfirmationRate,
      assignmentCoverage,
      reminderCoverage,
      crmHealthScore,
      health,
      priorityAction,
    };
  }, [
    inquiries,
    appointments,
    followUpReminders,
  ]);

  const metricCards = [
    {
      label: "CRM Health",
      value: `${model.crmHealthScore}%`,
      icon: Gauge,
      tone: model.health.tone,
    },
    {
      label: "Total Leads",
      value: model.totalLeads,
      icon: Target,
      tone: "orange",
    },
    {
      label: "Hot Leads",
      value:
        model.aiInsights.hotLeads.length,
      icon: Flame,
      tone: "red",
    },
    {
      label: "Overdue Follow-ups",
      value:
        model.overdueReminders.length,
      icon: AlertTriangle,
      tone: "amber",
    },
    {
      label: "Unassigned",
      value:
        model.unassignedLeads.length,
      icon: Users,
      tone: "blue",
    },
    {
      label: "Stale Leads",
      value:
        model.staleLeads.length,
      icon: Radar,
      tone: "amber",
    },
    {
      label: "No Reminder",
      value:
        model.noReminderLeads.length,
      icon: ShieldCheck,
      tone: "blue",
    },
    {
      label: "VIP Risk",
      value:
        model.vipRiskLeads.length,
      icon: Crown,
      tone: "orange",
    },
  ];

  const intelligenceRows = [
    {
      title: "Lead quality",
      value: `${model.aiInsights.averageScore}/100`,
      text:
        model.aiInsights.averageScore >= 70
          ? "Local lead scoring indicates a relatively strong opportunity mix."
          : "Lead quality is mixed; strengthen qualification and follow-up discipline.",
      icon: Brain,
      tone: "orange",
    },
    {
      title: "Pipeline movement",
      value: `${model.stageSuggestions.total} suggestion${
        model.stageSuggestions.total === 1 ? "" : "s"
      }`,
      text:
        model.stageSuggestions.total > 0
          ? "The stage engine found records that may need pipeline movement review."
          : "No strong stage-movement cleanup signal is active right now.",
      icon: Radar,
      tone: "blue",
    },
    {
      title: "Reminder discipline",
      value: `${model.pendingReminders.length} pending`,
      text:
        model.overdueReminders.length > 0
          ? `${model.overdueReminders.length} reminder(s) are overdue and should be cleared or rescheduled.`
          : "Open reminder workload is currently under control.",
      icon: ShieldCheck,
      tone:
        model.overdueReminders.length > 0
          ? "red"
          : "green",
    },
    {
      title: "Assignment coverage",
      value: `${model.assignmentCoverage}%`,
      text:
        model.unassignedLeads.length > 0
          ? `${model.unassignedLeads.length} active lead(s) still need a clear owner.`
          : "All active tracked leads currently have ownership coverage.",
      icon: Users,
      tone:
        model.unassignedLeads.length > 0
          ? "amber"
          : "green",
    },
  ];

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 14,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.3,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="min-w-0 space-y-4 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_20px_55px_rgba(18,56,101,0.12)] sm:p-3"
    >
      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_46px_rgba(18,56,101,0.10)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)]">
          <div className="min-w-0 bg-[#123865] p-4 text-white sm:p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Crown size={12} />
                CRM Command Center
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Sparkles size={12} />
                Executive Operating View
              </span>
            </div>

            <h1 className="mt-4 break-words text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
              Executive Operating View
            </h1>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              See CRM health, urgent work, pipeline pressure, lead quality,
              ownership gaps, reminder discipline, and the first action staff
              should take today.
            </p>

            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Engagement"
                value={`${model.engagementRate}%`}
              />
              <DarkMetric
                label="Approval"
                value={`${model.approvalRate}%`}
              />
              <DarkMetric
                label="Appointment"
                value={`${model.appointmentConfirmationRate}%`}
              />
              <DarkMetric
                label="Ownership"
                value={`${model.assignmentCoverage}%`}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 text-white sm:p-5 lg:border-l-[3px] lg:border-t-0 lg:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              Health Score
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-black text-white">
                {model.crmHealthScore}
              </p>

              <p className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-white">
                {model.health.label}
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : {
                        width: 0,
                      }
                }
                animate={{
                  width: `${model.crmHealthScore}%`,
                }}
                transition={{
                  duration:
                    reduceMotion
                      ? 0
                      : 0.7,
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {model.health.message}
            </p>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {metricCards.map(
          (metric, index) => (
            <MetricCard
              key={
                metric.label
              }
              {...metric}
              index={index}
              reduceMotion={
                reduceMotion
              }
            />
          )
        )}
      </div>

      <section className="rounded-[1.45rem] border-[3px] border-[#123865] bg-white p-3">
        <button
          type="button"
          onClick={() =>
            setWorkspaceExpanded((current) => !current)
          }
          aria-expanded={workspaceExpanded}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Executive CRM Workspace
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {workspaceExpanded
                ? "Hide priority command, intelligence summary and methodology."
                : "Open priority command, intelligence summary and methodology."}
            </p>
          </div>

          <Gauge
            size={17}
            className={`shrink-0 text-[#123865] transition ${
              workspaceExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </section>

      {workspaceExpanded ? (
        <div className="min-w-0 space-y-4">
      <div className="grid min-w-0 gap-4">
        <section
          className={`${cardClass} min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#FB7185] bg-white shadow-[0_12px_30px_rgba(18,56,101,0.06)]`}
        >
          <div className="bg-[#123865] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
                <Zap size={18} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white">
                  First Priority
                </p>

                <h3 className="mt-1 text-xl font-black text-white">
                  Start here
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-5">
            <h3 className="text-xl font-black text-[#10233f]">
              {model.priorityAction.title}
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              {model.priorityAction.message}
            </p>

            <div className="mt-4 rounded-xl border-2 border-red-300 bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-red-700">
                Human Review Required
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This command center identifies pressure and priorities. It does
                not automatically reassign, contact, or move student records.
              </p>
            </div>
          </div>
        </section>

        <section
          className={`${cardClass} min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_12px_30px_rgba(18,56,101,0.06)]`}
        >
          <div className="bg-[#123865] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white">
                  Intelligence Summary
                </p>

                <h3 className="mt-1 text-xl font-black text-white">
                  What the CRM sees right now
                </h3>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-3 bg-[#FFF8EF] p-4 sm:p-5">
            {intelligenceRows.map(
              (row) => (
                <IntelligenceRow
                  key={row.title}
                  {...row}
                />
              )
            )}
          </div>
        </section>
      </div>

      <MethodologyNote />
        </div>
      ) : null}
    </motion.section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
  index,
  reduceMotion,
}) {
  const styles = {
    orange:
      "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    amber:
      "border-amber-300 bg-amber-50 text-amber-900",
    blue:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
  };

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 10,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.22,
        delay:
          reduceMotion
            ? 0
            : index * 0.035,
      }}
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${
        styles[tone] ||
        styles.orange
      }`}
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

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white">
          <Icon size={17} />
        </div>
      </div>
    </motion.article>
  );
}

function IntelligenceRow({
  title,
  value,
  text,
  icon: Icon,
  tone = "orange",
}) {
  const styles = {
    orange:
      "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    amber:
      "border-amber-300 bg-amber-50 text-amber-900",
    blue:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
  };

  const style =
    styles[tone] ||
    styles.orange;

  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${style}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-current/20 bg-white">
          <Icon size={15} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-[#10233f]">
              {title}
            </p>

            <span className="text-xs font-black">
              {value}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function MethodologyNote() {
  return (
    <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#123865] bg-[#F2F7FF] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.04)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865] bg-[#123865] text-white">
          <Gauge size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            CRM health methodology
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            The health score combines engagement, approval, appointment
            confirmation, local lead quality, ownership coverage and reminder
            coverage, then subtracts pressure from overdue reminders, stale
            leads, VIP risk and urgent stage-movement suggestions. It is an
            operational signal, not a financial or student-success guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
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
        "CRM health is strong. Keep response speed, ownership, and reminder discipline consistent.",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      tone: "orange",
      message:
        "CRM health is generally good, with manageable pressure in ownership, reminders, or pipeline movement.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      tone: "amber",
      message:
        "CRM health needs attention. Clear overdue follow-ups, assign loose leads, and resolve stale pipeline records.",
    };
  }

  return {
    label: "Critical",
    tone: "red",
    message:
      "CRM pressure is high. Work through urgent follow-ups, VIP risk, stale leads, and ownership gaps before adding more workload.",
  };
}

function getPriorityAction({
  hotLeads,
  immediateLeads,
  overdueReminders,
  stageSuggestions,
  pendingReminders,
  engagementRate,
  unassignedLeads,
  staleLeads,
  vipRiskLeads,
  totalLeads,
}) {
  if (totalLeads === 0) {
    return {
      title: "CRM is waiting for live records",
      message:
        "Add inquiry or appointment records to begin executive CRM monitoring.",
    };
  }

  if (vipRiskLeads > 0) {
    return {
      title: "Handle VIP risk leads first",
      message: `${vipRiskLeads} VIP/high-priority lead(s) are exposed by overdue follow-up, stale movement, missing reminders, or ownership gaps.`,
    };
  }

  if (immediateLeads > 0) {
    return {
      title: "Call immediate-priority leads first",
      message: `${immediateLeads} high-intent lead(s) require fast counselor review before they cool down.`,
    };
  }

  if (overdueReminders > 0) {
    return {
      title: "Clear overdue follow-ups",
      message: `${overdueReminders} overdue reminder(s) are creating CRM pressure. Complete or reschedule them before normal follow-up work.`,
    };
  }

  if (unassignedLeads > 0) {
    return {
      title: "Assign lead ownership",
      message: `${unassignedLeads} active lead(s) do not have a clear counselor owner.`,
    };
  }

  if (staleLeads > 0) {
    return {
      title: "Revive stale leads",
      message: `${staleLeads} active lead(s) have remained new/pending/contacted without recent movement for at least seven days.`,
    };
  }

  if (hotLeads > 0) {
    return {
      title: "Prioritize hot leads",
      message: `${hotLeads} hot lead(s) are available. Review them before lower-priority inquiries.`,
    };
  }

  if (stageSuggestions > 0) {
    return {
      title: "Review pipeline movement",
      message: `${stageSuggestions} high-urgency stage suggestion(s) should be reviewed for CRM cleanup.`,
    };
  }

  if (pendingReminders > 0) {
    return {
      title: "Process pending reminders",
      message: `${pendingReminders} active reminder(s) should be handled to keep follow-up rhythm strong.`,
    };
  }

  if (engagementRate < 50) {
    return {
      title: "Improve first response coverage",
      message:
        "A large share of inquiry records still appear to be in an early contact stage.",
    };
  }

  return {
    title: "CRM is stable",
    message:
      "No major pressure signal is active. Continue nurturing students and keeping ownership, reminders, and pipeline stages current.",
  };
}

export default CrmCommandCenter;
