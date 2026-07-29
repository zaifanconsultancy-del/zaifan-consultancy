// AiLeadIntelligenceFeed V4 MAXIMUM — Live CRM Intelligence Command Feed
// src/components/admin/AiLeadIntelligenceFeed.jsx
//
// Maximum pass:
// - preserves existing inquiries / appointments prop API
// - fixes duplicate VIP/hot logic by separating urgency vs conversion signals
// - safer date parsing and stale-age calculation
// - richer live CRM intelligence: ownership, priority, staleness, conversion,
//   appointment pressure, contactability, data gaps and counselor focus
// - no fake AI claims: recommendations remain rule-based / local intelligence
// - reduced-motion support
// - stronger Admin OS navy / orange / cream hierarchy
// - explicit white text on all navy surfaces
// - avoids unreadable text-on-dark-card issues
// - responsive, denser, clearer operational hierarchy

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Crown,
  Flame,
  MailWarning,
  PhoneCall,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function safeDateMs(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAgeDays(value) {
  const timestamp = safeDateMs(value);
  if (!timestamp) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 86400000)
  );
}

function hasPhone(lead = {}) {
  return Boolean(
    lead.phone ||
      lead.phone_number ||
      lead.whatsapp ||
      lead.whatsapp_number
  );
}

function hasEmail(lead = {}) {
  return Boolean(lead.email);
}

function AiLeadIntelligenceFeed({
  inquiries = [],
  appointments = [],
}) {
  const shouldReduceMotion = useReducedMotion();

  const intelligence = useMemo(() => {
    const safeInquiries = safeArray(inquiries);
    const safeAppointments = safeArray(appointments);

    const allLeads = [
      ...safeInquiries.map((lead) => ({
        ...lead,
        __leadType: "inquiry",
      })),
      ...safeAppointments.map((lead) => ({
        ...lead,
        __leadType: "appointment",
      })),
    ];

    const unassigned = [];
    const vipLeads = [];
    const highPriorityLeads = [];
    const staleLeads = [];
    const agingCritical = [];
    const contactedOrProgressed = [];
    const conversionReady = [];
    const missingPhone = [];
    const missingEmail = [];
    const unreachable = [];

    for (const lead of allLeads) {
      const priority = normalize(lead.priority);
      const status = normalize(
        lead.status ||
          lead.pipeline_stage ||
          lead.appointment_stage
      );
      const ageDays = getAgeDays(
        lead.updated_at || lead.created_at
      );
      const ownerMissing =
        !lead.assigned_admin_id &&
        !lead.assigned_to &&
        !lead.counselor_id;
      const phoneAvailable = hasPhone(lead);
      const emailAvailable = hasEmail(lead);

      if (ownerMissing) unassigned.push(lead);

      if (priority === "vip") {
        vipLeads.push(lead);
      }

      if (["high", "urgent", "critical"].includes(priority)) {
        highPriorityLeads.push(lead);
      }

      const isClosed =
        status.includes("completed") ||
        status.includes("closed") ||
        status.includes("cancelled") ||
        status.includes("canceled") ||
        status.includes("rejected");

      if (!isClosed && ageDays >= 7) {
        staleLeads.push(lead);
      }

      if (ageDays >= 14) {
        agingCritical.push(lead);
      }

      const progressed =
        status.includes("contacted") ||
        status.includes("confirmed") ||
        status.includes("documents") ||
        status.includes("applied") ||
        status.includes("offer") ||
        status.includes("visa");

      if (progressed) {
        contactedOrProgressed.push(lead);
      }

      const strongPriority =
        priority === "vip" || priority === "high";

      const conversionProgressed =
        status.includes("contacted") ||
        status.includes("confirmed") ||
        status.includes("documents") ||
        status.includes("applied");

      if (strongPriority && conversionProgressed) {
        conversionReady.push(lead);
      }

      if (!phoneAvailable) missingPhone.push(lead);
      if (!emailAvailable) missingEmail.push(lead);

      if (!phoneAvailable && !emailAvailable) {
        unreachable.push(lead);
      }
    }

    const pendingAppointments = safeAppointments.filter((lead) =>
      ["pending", "new", ""].includes(
        normalize(lead.status || "pending")
      )
    );

    const assignedRate = allLeads.length
      ? Math.round(
          ((allLeads.length - unassigned.length) /
            allLeads.length) *
            100
        )
      : 0;

    const progressionRate = allLeads.length
      ? Math.round(
          (contactedOrProgressed.length /
            allLeads.length) *
            100
        )
      : 0;

    const attentionScore =
      unassigned.length +
      vipLeads.length +
      highPriorityLeads.length +
      staleLeads.length +
      pendingAppointments.length +
      unreachable.length;

    const insights = [];

    if (vipLeads.length > 0) {
      insights.push({
        id: "vip",
        icon: Crown,
        title: "VIP Opportunity Detected",
        description: `${vipLeads.length} VIP lead${
          vipLeads.length === 1 ? "" : "s"
        } require highest-priority counselor handling.`,
        tone: "orange",
        severity: "high",
        value: vipLeads.length,
      });
    }

    if (highPriorityLeads.length > 0) {
      insights.push({
        id: "high-priority",
        icon: ShieldAlert,
        title: "High-Priority Queue",
        description: `${highPriorityLeads.length} high / urgent lead${
          highPriorityLeads.length === 1 ? "" : "s"
        } need faster follow-up than the standard queue.`,
        tone: "red",
        severity: "high",
        value: highPriorityLeads.length,
      });
    }

    if (unassigned.length > 0) {
      insights.push({
        id: "ownership",
        icon: Users,
        title: "Ownership Gap",
        description: `${unassigned.length} lead${
          unassigned.length === 1 ? "" : "s"
        } are still in the open pool without a counselor owner.`,
        tone: "blue",
        severity: "medium",
        value: unassigned.length,
      });
    }

    if (staleLeads.length > 0) {
      insights.push({
        id: "stale",
        icon: Clock3,
        title: "Stale Leads Found",
        description: `${staleLeads.length} active lead${
          staleLeads.length === 1 ? "" : "s"
        } have had no recent movement for at least 7 days.`,
        tone: "amber",
        severity: agingCritical.length ? "high" : "medium",
        value: staleLeads.length,
      });
    }

    if (agingCritical.length > 0) {
      insights.push({
        id: "aging",
        icon: Flame,
        title: "Aging Risk",
        description: `${agingCritical.length} lead${
          agingCritical.length === 1 ? "" : "s"
        } are 14+ days old and should be reviewed for recovery or closure.`,
        tone: "red",
        severity: "high",
        value: agingCritical.length,
      });
    }

    if (conversionReady.length > 0) {
      insights.push({
        id: "conversion",
        icon: Target,
        title: "Conversion Opportunity",
        description: `${conversionReady.length} progressed high-priority lead${
          conversionReady.length === 1 ? "" : "s"
        } show stronger near-term conversion potential.`,
        tone: "green",
        severity: "positive",
        value: conversionReady.length,
      });
    }

    if (pendingAppointments.length > 0) {
      insights.push({
        id: "appointments",
        icon: CalendarCheck2,
        title: "Appointment Confirmation Queue",
        description: `${pendingAppointments.length} appointment${
          pendingAppointments.length === 1 ? "" : "s"
        } are still pending confirmation.`,
        tone: "orange",
        severity: "medium",
        value: pendingAppointments.length,
      });
    }

    if (unreachable.length > 0) {
      insights.push({
        id: "unreachable",
        icon: MailWarning,
        title: "Contactability Risk",
        description: `${unreachable.length} lead${
          unreachable.length === 1 ? "" : "s"
        } have neither phone nor email available.`,
        tone: "red",
        severity: "high",
        value: unreachable.length,
      });
    }

    if (allLeads.length > 0 && insights.length === 0) {
      insights.push({
        id: "stable",
        icon: CheckCircle2,
        title: "CRM Queue Looks Stable",
        description:
          "No major ownership, urgency, staleness or contactability issue is visible in the currently loaded leads.",
        tone: "green",
        severity: "positive",
        value: 0,
      });
    }

    insights.push({
      id: "recommendation",
      icon: Brain,
      title: "Counselor Recommendation",
      description: buildRecommendation({
        vip: vipLeads.length,
        high: highPriorityLeads.length,
        unassigned: unassigned.length,
        stale: staleLeads.length,
        appointments: pendingAppointments.length,
        unreachable: unreachable.length,
      }),
      tone: "navy",
      severity: "recommendation",
      value: null,
    });

    return {
      allLeads,
      safeInquiries,
      safeAppointments,
      unassigned,
      vipLeads,
      highPriorityLeads,
      staleLeads,
      agingCritical,
      conversionReady,
      pendingAppointments,
      missingPhone,
      missingEmail,
      unreachable,
      assignedRate,
      progressionRate,
      attentionScore,
      insights,
    };
  }, [inquiries, appointments]);

  return (
    <motion.section
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.28,
      }}
      className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.07)]"
    >
      <div className="grid xl:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[#123866] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <Radar size={12} />
              AI Intelligence Feed
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <Sparkles size={12} />
              Local Rule Engine
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Live CRM Signals
          </h3>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white">
            Real-time operating signals across ownership, priority, lead age,
            appointment pressure and contactability.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkStat
              label="Total Leads"
              value={intelligence.allLeads.length}
            />
            <DarkStat
              label="Assigned"
              value={`${intelligence.assignedRate}%`}
            />
            <DarkStat
              label="Progressed"
              value={`${intelligence.progressionRate}%`}
            />
            <DarkStat
              label="Signals"
              value={intelligence.insights.length}
            />
          </div>
        </div>

        <div className="bg-orange-500 p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
            Attention Pressure
          </p>

          <p className="mt-3 text-5xl font-black text-white">
            {intelligence.attentionScore}
          </p>

          <p className="mt-1 text-sm font-black text-white">
            combined operating exceptions
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <OrangeStat
              label="VIP + High"
              value={
                intelligence.vipLeads.length +
                intelligence.highPriorityLeads.length
              }
            />
            <OrangeStat
              label="Stale"
              value={intelligence.staleLeads.length}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-[#fff8ee] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SignalSummary
            icon={UserCheck}
            label="Open Pool"
            value={intelligence.unassigned.length}
            detail="Leads without ownership"
            tone={
              intelligence.unassigned.length
                ? "amber"
                : "green"
            }
          />

          <SignalSummary
            icon={Target}
            label="Conversion Ready"
            value={intelligence.conversionReady.length}
            detail="High-priority progressed leads"
            tone="green"
          />

          <SignalSummary
            icon={PhoneCall}
            label="Missing Phone"
            value={intelligence.missingPhone.length}
            detail="Leads without phone/WhatsApp"
            tone={
              intelligence.missingPhone.length
                ? "blue"
                : "green"
            }
          />

          <SignalSummary
            icon={MailWarning}
            label="Unreachable"
            value={intelligence.unreachable.length}
            detail="No phone and no email"
            tone={
              intelligence.unreachable.length
                ? "red"
                : "green"
            }
          />
        </div>

        <section className="rounded-[1.55rem] border-[3px] border-orange-300 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
                Live Signal Queue
              </p>
              <h4 className="mt-1 text-xl font-black text-[#10233f]">
                What needs counselor attention?
              </h4>
            </div>

            <span className="inline-flex w-fit rounded-full border-2 border-slate-300 bg-[#fffaf2] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
              {intelligence.insights.length} signals
            </span>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {intelligence.insights.map((item, index) => (
              <InsightRow
                key={item.id}
                item={item}
                index={index}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </section>
      </div>
    </motion.section>
  );
}

function InsightRow({
  item,
  index,
  shouldReduceMotion,
}) {
  const Icon = item.icon;
  const tone = getTone(item.tone);
  const isNavy = item.tone === "navy";

  return (
    <motion.article
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 8 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.22,
        delay: shouldReduceMotion
          ? 0
          : Math.min(index * 0.025, 0.12),
      }}
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${tone.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${tone.icon}`}
        >
          <Icon size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4
              className={`font-black ${
                isNavy
                  ? "text-white"
                  : "text-[#10233f]"
              }`}
            >
              {item.title}
            </h4>

            {item.value !== null &&
            item.value !== undefined ? (
              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black ${
                  tone.badge
                }`}
              >
                {item.value}
              </span>
            ) : null}
          </div>

          <p
            className={`mt-1 text-sm font-semibold leading-6 ${
              isNavy
                ? "text-white"
                : "text-slate-700"
            }`}
          >
            {item.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function SignalSummary({
  icon: Icon,
  label,
  value,
  detail,
  tone = "blue",
}) {
  const config = getLightTone(tone);

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${config.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#10233f]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${config.icon}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function DarkStat({ label, value }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeStat({ label, value }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function getTone(tone) {
  const tones = {
    orange: {
      card: "border-orange-300 bg-orange-50",
      icon: "border-orange-300 bg-white text-orange-700",
      badge: "border-orange-300 bg-white text-orange-800",
    },
    red: {
      card: "border-red-300 bg-red-50",
      icon: "border-red-300 bg-white text-red-700",
      badge: "border-red-300 bg-white text-red-800",
    },
    blue: {
      card: "border-blue-300 bg-blue-50",
      icon: "border-blue-300 bg-white text-blue-700",
      badge: "border-blue-300 bg-white text-blue-800",
    },
    amber: {
      card: "border-amber-300 bg-amber-50",
      icon: "border-amber-300 bg-white text-amber-800",
      badge: "border-amber-300 bg-white text-amber-900",
    },
    green: {
      card: "border-emerald-300 bg-emerald-50",
      icon: "border-emerald-300 bg-white text-emerald-700",
      badge: "border-emerald-300 bg-white text-emerald-800",
    },
    navy: {
      card: "border-[#123866] bg-[#123866]",
      icon: "border-white/25 bg-white/10 text-white",
      badge: "border-white/25 bg-white/10 text-white",
    },
  };

  return tones[tone] || tones.orange;
}

function getLightTone(tone) {
  const tones = {
    amber: {
      card: "border-amber-300 bg-amber-50",
      icon: "border-amber-300 bg-white text-amber-800",
    },
    red: {
      card: "border-red-300 bg-red-50",
      icon: "border-red-300 bg-white text-red-700",
    },
    green: {
      card: "border-emerald-300 bg-emerald-50",
      icon: "border-emerald-300 bg-white text-emerald-700",
    },
    blue: {
      card: "border-blue-300 bg-blue-50",
      icon: "border-blue-300 bg-white text-blue-700",
    },
  };

  return tones[tone] || tones.blue;
}

function buildRecommendation({
  vip,
  high,
  unassigned,
  stale,
  appointments,
  unreachable,
}) {
  if (vip > 0 || high > 0) {
    return "Start with VIP and high-priority students, then clear stale and unassigned leads before working through the standard new-lead queue.";
  }

  if (unassigned > 0) {
    return "Assign ownership first so every open lead has one accountable counselor.";
  }

  if (stale > 0) {
    return "Recover stale leads before they become lost opportunities. Contact them and either move or close the case.";
  }

  if (appointments > 0) {
    return "Confirm pending appointments before spending time on lower-priority nurture work.";
  }

  if (unreachable > 0) {
    return "Resolve missing contact details before relying on automated follow-up planning.";
  }

  return "CRM pressure is currently low. Continue normal follow-up, qualification and pipeline progression.";
}

export default AiLeadIntelligenceFeed;
