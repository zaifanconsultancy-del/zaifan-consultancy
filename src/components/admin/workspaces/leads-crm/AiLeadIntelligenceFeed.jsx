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
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";
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

    const hasLeadEvidence = allLeads.length > 0;

    const assignedRate = hasLeadEvidence
      ? Math.round(
          ((allLeads.length - unassigned.length) /
            allLeads.length) *
            100
        )
      : null;

    const progressionRate = hasLeadEvidence
      ? Math.round(
          (contactedOrProgressed.length /
            allLeads.length) *
            100
        )
      : null;

    const attentionScore = hasLeadEvidence
      ? unassigned.length +
        vipLeads.length +
        highPriorityLeads.length +
        staleLeads.length +
        pendingAppointments.length +
        unreachable.length
      : null;

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

    if (hasLeadEvidence) {
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
    }

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
      hasLeadEvidence,
      insights,
    };
  }, [inquiries, appointments]);

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      className="min-w-0"
    >
      <div className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] shadow-[0_16px_42px_rgba(16,35,63,0.09)]">
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.7fr)_minmax(250px,0.3fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CommandPill icon={Radar}>CRM Intelligence</CommandPill>
                  <CommandPill icon={Sparkles}>Live Rule Engine</CommandPill>
                </div>

                <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                  Lead Command Feed
                </p>
                <h3 className="mt-1 max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                  See the pressure, opportunity and ownership gaps before they cost a conversion.
                </h3>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/80">
                  A focused operating view across priority, lead age, appointment pressure, contactability and counselor ownership.
                </p>
              </div>

              <div className="grid w-full max-w-4xl grid-cols-2 gap-2 sm:grid-cols-4">
                <HeroMetric label="Total Leads" value={intelligence.allLeads.length} />
                <HeroMetric
                  label="Assigned"
                  value={
                    intelligence.assignedRate === null
                      ? "N/A"
                      : `${intelligence.assignedRate}%`
                  }
                />
                <HeroMetric
                  label="Progressed"
                  value={
                    intelligence.progressionRate === null
                      ? "N/A"
                      : `${intelligence.progressionRate}%`
                  }
                />
                <HeroMetric label="Signals" value={intelligence.insights.length} />
              </div>
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#123865] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:p-7 xl:border-l-[3px] xl:border-t-0">
            <div className="flex h-full min-w-0 flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white">
                    Attention Pressure
                  </p>
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-5xl font-black leading-none text-white sm:text-6xl">
                    {intelligence.attentionScore === null ? "N/A" : intelligence.attentionScore}
                  </p>
                  <p className="max-w-[150px] pb-1 text-xs font-black leading-5 text-white/90">
                    combined operating exceptions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <PressureMetric
                  label="VIP + High"
                  value={intelligence.vipLeads.length + intelligence.highPriorityLeads.length}
                />
                <PressureMetric label="Stale" value={intelligence.staleLeads.length} />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5 p-4 sm:p-5 lg:p-6">
          <div className="grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SignalSummary
              icon={UserCheck}
              label="Open Pool"
              value={intelligence.unassigned.length}
              detail="Leads without ownership"
              tone={intelligence.unassigned.length ? "orange" : "green"}
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
              detail="Without phone or WhatsApp"
              tone={intelligence.missingPhone.length ? "blue" : "green"}
            />
            <SignalSummary
              icon={MailWarning}
              label="Unreachable"
              value={intelligence.unreachable.length}
              detail="No phone and no email"
              tone={intelligence.unreachable.length ? "red" : "green"}
            />
          </div>

          <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#123865] bg-white shadow-[0_10px_28px_rgba(16,35,63,0.06)]">
            <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Brain size={16} />
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
                    Live Signal Queue
                  </p>
                </div>
                <h4 className="mt-1 text-xl font-black text-white">
                  What needs counselor attention now?
                </h4>
              </div>

              <div className="inline-flex w-fit shrink-0 items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                <CircleSignal />
                <span>{intelligence.insights.length} active signals</span>
              </div>
            </div>

            <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
              {intelligence.insights.length ? (
                <div className="grid min-w-0 auto-rows-fr gap-3 xl:grid-cols-2">
                  {intelligence.insights.map((item, index) => (
                    <InsightRow
                      key={item.id}
                      item={item}
                      index={index}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-6 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]">
                    <UsersRound size={18} />
                  </div>
                  <p className="mt-3 font-black text-[#10233F]">
                    No lead intelligence to assess yet
                  </p>
                  <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#60728A]">
                    Lead counts can remain zero, but assignment, progression and attention pressure are not assessed until inquiry or appointment records exist.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.section>
  );
}

function CommandPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
      <Icon size={13} />
      {children}
    </span>
  );
}

function HeroMetric({ label, value }) {
  return <ZaifanMetricCard level="baby" surface="navy" label={label} value={value} tone="navy" />;
}

function PressureMetric({ label, value }) {
  return <ZaifanMetricCard level="baby" surface="navy" label={label} value={value} tone="orange" />;
}

function CircleSignal() {
  return <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]" />;
}

function InsightRow({
  item,
  index,
  shouldReduceMotion,
}) {
  const Icon = item.icon;
  const tone = getTone(item.tone);
  const isNavy = item.tone === "navy";
  const hasValue =
    item.value !== null &&
    item.value !== undefined;

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
      className={`h-full min-w-0 rounded-[1.45rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(16,35,63,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_11px_26px_rgba(16,35,63,0.09)] sm:p-5 ${tone.card}`}
    >
      <div className="flex h-full min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 shadow-[0_3px_8px_rgba(18,56,101,0.05)] ${tone.icon}`}
          >
            <Icon size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`break-words text-base font-black leading-6 ${
                isNavy
                  ? "text-white"
                  : "text-[#10233F]"
              }`}
            >
              {item.title}
            </h4>

            <p
              className={`mt-1.5 text-sm font-semibold leading-6 ${
                isNavy
                  ? "text-white/85"
                  : "text-[#52677F]"
              }`}
            >
              {item.description}
            </p>
          </div>
        </div>

        {hasValue ? (
          <div className="shrink-0 text-right">
            <p
              className={`text-3xl font-black leading-none ${tone.value}`}
            >
              {item.value}
            </p>
          </div>
        ) : null}
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
  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={detail}
      icon={Icon}
      tone={tone}
      className="h-full"
    />
  );
}

function getTone(tone) {
  const tones = {
    orange: {
      card: "border-orange-400 bg-[#FFF7ED]",
      icon: "border-orange-300 bg-white text-orange-700",
      value: "text-[#C2410C]",
    },
    red: {
      card: "border-red-400 bg-[#FFF5F5]",
      icon: "border-red-300 bg-white text-red-700",
      value: "text-[#C8102E]",
    },
    blue: {
      card: "border-blue-400 bg-[#F3F8FF]",
      icon: "border-blue-300 bg-white text-blue-700",
      value: "text-[#0B5EAA]",
    },
    amber: {
      card: "border-amber-400 bg-[#FFFBEB]",
      icon: "border-amber-300 bg-white text-amber-800",
      value: "text-[#B45309]",
    },
    green: {
      card: "border-emerald-400 bg-[#F1FCF7]",
      icon: "border-emerald-300 bg-white text-emerald-700",
      value: "text-[#0F8A64]",
    },
    navy: {
      card: "border-[#123865] bg-[#123865]",
      icon: "border-white/30 bg-white/10 text-white",
      value: "text-white",
    },
  };

  return tones[tone] || tones.orange;
}

function getLightTone(tone) {
  const tones = {
    orange: {
      card: "border-orange-400 bg-[#FFF7ED]",
      bar: "bg-[#FF5A0A]",
      icon: "border-orange-300 bg-white text-orange-700",
    },
    red: {
      card: "border-red-400 bg-[#FFF5F5]",
      bar: "bg-red-500",
      icon: "border-red-300 bg-white text-red-700",
    },
    green: {
      card: "border-emerald-400 bg-[#F1FCF7]",
      bar: "bg-emerald-500",
      icon: "border-emerald-300 bg-white text-emerald-700",
    },
    blue: {
      card: "border-blue-400 bg-[#F3F8FF]",
      bar: "bg-blue-500",
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
