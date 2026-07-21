import { motion } from "framer-motion";
import {
  appointmentStages,
  appointmentStageToStatus,
  legacyAppointmentStatusToStage,
  getPipelineStage,
} from "../../data/crmPipelineConfig";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";


const PRIORITY_CHOICES = [
  {
    value: "low",
    label: "Low",
    icon: "◉",
    idle: "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-white",
    active: "border-[#071f50] bg-[#071f50] text-white shadow-[0_10px_24px_rgba(7,31,80,0.18)]",
  },
  {
    value: "medium",
    label: "Medium",
    icon: "★",
    idle: "border-orange-300 bg-[#fff1ea] text-[#c2410c] hover:border-[#ff7a3d] hover:bg-white",
    active: "border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)]",
  },
  {
    value: "high",
    label: "High",
    icon: "!",
    idle: "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-white",
    active: "border-red-600 bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.18)]",
  },
  {
    value: "vip",
    label: "VIP",
    icon: "♛",
    idle: "border-violet-300 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-white",
    active: "border-violet-600 bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.20)]",
  },
];

const formatAppointmentStageLabel = (label = "") => {
  if (label === "Consultation Done") return "Consultation Complete";
  return label;
};

const formatCompactAppointmentStageLabel = (label = "") => {
  const normalized = formatAppointmentStageLabel(label);

  const compactLabels = {
    "New Booking": "New Booking",
    Confirmed: "Confirmed",
    "Consultation Complete": "Consultation",
    "Follow-up Needed": "Follow-up",
    "Converted to Lead": "Converted",
    "Not Interested": "Not Interested",
    Cancelled: "Cancelled",
  };

  return compactLabels[normalized] || normalized;
};

const STATUS_CHOICES = [
  {
    value: "pending",
    label: "Pending",
    icon: "◷",
    helper: "Waiting",
    idle: "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-white",
    active: "border-amber-500 bg-amber-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.20)]",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    icon: "✓",
    helper: "Booked",
    idle: "border-orange-300 bg-[#fff1ea] text-[#c2410c] hover:border-[#ff7a3d] hover:bg-white",
    active: "border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)]",
  },
  {
    value: "completed",
    label: "Completed",
    icon: "✓",
    helper: "Done",
    idle: "border-orange-300 bg-[#fff1ea] text-[#c2410c] hover:border-[#ff7a3d] hover:bg-white",
    active: "border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)]",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: "×",
    helper: "Cancelled",
    idle: "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-white",
    active: "border-red-600 bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.18)]",
  },
];

function AppointmentCard({
  appointment,
  cardClass = "",
  updateAppointmentStatus = () => {},
  updateAppointmentPriority = () => {},
  updateAppointmentStage = null,
  deleteAppointment = null,
  openModal = () => {},
  compact = false,
  role = "staff",
  permissions = {},
}) {
  const status = appointment.status || "pending";
  const priority = appointment.priority || "low";
  const aiLead = enrichLeadWithAi(appointment, "appointment");
  const appointmentStage =
    appointment.appointment_stage ||
    legacyAppointmentStatusToStage[status] ||
    "new_booking";

  const activeStage = getPipelineStage(
    appointmentStages,
    appointmentStage,
    "new_booking"
  );

  const activeStageIndex = Math.max(
    appointmentStages.findIndex((stage) => stage.key === appointmentStage),
    0
  );

  const nextStage = appointmentStages[activeStageIndex + 1] || null;

  const assignedAdminName =
    appointment.assigned_admin_name ||
    appointment.assigned_to_name ||
    appointment.assigned_to ||
    appointment.assigned_admin_email ||
    null;

  const assignedAdminInitial = assignedAdminName
    ? assignedAdminName.trim().charAt(0).toUpperCase()
    : "?";

  const safePermissions = {
    canDelete: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: permissions.canUpdateStatus ?? true,
    ...permissions,
  };

  const roleConfig = {
    staff: {
      label: "Staff",
      icon: "🧑‍💼",
      badge: "border-sky-200 bg-sky-50 text-sky-700",
    },
    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-orange-200 bg-orange-50 text-orange-700",
    },
    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-violet-300 bg-violet-100 text-violet-800",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;

  const priorityStyles = {
    vip: {
      badge: "border-violet-200 bg-violet-50 text-violet-700",
      card:
        "border-violet-200 hover:border-violet-300 hover:shadow-[0_18px_50px_rgba(124,58,237,0.08)]",
      glow: "bg-violet-100/70 group-hover:bg-violet-200/70",
      icon: "👑",
    },
    high: {
      badge: "border-red-200 bg-red-50 text-red-700",
      card:
        "border-red-200 hover:border-red-300 hover:shadow-[0_18px_50px_rgba(239,68,68,0.08)]",
      glow: "bg-red-100/70 group-hover:bg-red-200/70",
      icon: "🔥",
    },
    medium: {
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      card:
        "border-orange-200 hover:border-orange-300 hover:shadow-[0_18px_50px_rgba(249,115,22,0.08)]",
      glow: "bg-orange-100/70 group-hover:bg-orange-200/70",
      icon: "⭐",
    },
    low: {
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      card:
        "border-slate-200 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.07)]",
      glow: "bg-slate-100/70 group-hover:bg-slate-200/70",
      icon: "🌙",
    },
  };

  const statusStyles = {
    pending: "border-amber-300 bg-amber-50 text-amber-800",
    confirmed: "border-orange-300 bg-[#fff1ea] text-[#c2410c]",
    completed: "border-[#ff4b12] bg-[#ff4b12] text-white",
    cancelled: "border-red-300 bg-red-50 text-red-700",
  };

  const activePriority = priorityStyles[priority] || priorityStyles.low;

  const handleDelete = () => {
    if (!safePermissions.canDelete || !deleteAppointment) {
      alert("Only Admin and Super Admin can delete appointments.");
      return;
    }

    deleteAppointment(appointment.id);
  };

  const handlePriorityUpdate = (value) => {
    if (!safePermissions.canUpdatePriority) {
      alert("You do not have permission to update appointment priority.");
      return;
    }

    updateAppointmentPriority(appointment.id, value);
  };

  const handleStatusUpdate = (newStatus) => {
    if (!safePermissions.canUpdateStatus) {
      alert("You do not have permission to update appointment status.");
      return;
    }

    if (newStatus === "confirmed" && !safePermissions.canConfirmAppointments) {
      alert("You do not have permission to confirm appointments.");
      return;
    }

    updateAppointmentStatus(appointment.id, newStatus);
  };

  const handleStageUpdate = (newStage) => {
    if (!safePermissions.canUpdateAppointmentPipeline) {
      alert("You do not have permission to update appointment pipeline.");
      return;
    }

    if (newStage === "confirmed" && !safePermissions.canConfirmAppointments) {
      alert("You do not have permission to confirm appointments.");
      return;
    }

    if (updateAppointmentStage) {
      updateAppointmentStage(appointment.id, newStage);
      return;
    }

    updateAppointmentStatus(
      appointment.id,
      appointmentStageToStatus[newStage] || status
    );
  };

  const openRealGptWorkspace = () => {
    openModal({
      ...appointment,
      __preferredPanel: "ai-workspace",
    });
  };

  const appointmentDate =
    appointment.appointment_date && appointment.appointment_time
      ? `${appointment.appointment_date} · ${appointment.appointment_time}`
      : appointment.appointment_date || appointment.appointment_time;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openModal(appointment)}
      className={`${cardClass} group relative cursor-pointer overflow-hidden rounded-[1.55rem] border-2 ${activePriority.card} !border-[#ff7a3d] hover:!border-[#ff4b12] bg-gradient-to-br from-white via-[#fffdf9] to-[#fff7ef] p-4 shadow-[0_14px_42px_rgba(15,23,42,0.07)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:rounded-[2rem] sm:p-5`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition duration-700 sm:h-48 sm:w-48 ${activePriority.glow}`}
      ></div>

      {!assignedAdminName && (
        <div className="pointer-events-none absolute -left-24 top-10 h-44 w-44 rounded-full bg-orange-500/5 blur-3xl transition duration-700 group-hover:bg-orange-500/10"></div>
      )}

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-3 border-b border-slate-200 pb-4 sm:gap-4 sm:pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ffb36d] sm:text-[10px]">
              Appointment Command Record
            </p>

            <h2 className="mt-1.5 break-words text-xl font-bold leading-tight text-slate-950 sm:mt-2 sm:text-2xl">
              {appointment.full_name || "Unnamed Student"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-[#fff0e8] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#c2410c] shadow-sm"
            >
              {aiLead.ai_tier.badge} · {aiLead.ai_score}/100
            </div>

            {!compact && (
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${currentRole.badge}`}
              >
                <span>{currentRole.icon}</span>
                {currentRole.label}
              </div>
            )}
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${activePriority.badge}`}
          >
            {activePriority.icon} {priority}
          </span>

          <span className="w-fit shrink-0 rounded-full border border-orange-300 bg-[#fff0e8] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-600">
            {activeStage.icon} {formatAppointmentStageLabel(activeStage.label)}
          </span>

          <span
            className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              statusStyles[status] || statusStyles.pending
            }`}
          >
            Status: {status}
          </span>

          <span className="w-fit shrink-0 rounded-full border border-orange-300 bg-[#fff0e8] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-600">
            AI: {aiLead.ai_conversion_probability}
          </span>

          <span className="w-fit shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-700">
            Urgency: {aiLead.ai_urgency.label}
          </span>

          <AssignmentBadge
            assignedAdminName={assignedAdminName}
            assignedAdminInitial={assignedAdminInitial}
          />

          {!safePermissions.canDelete && !compact && (
            <span className="w-fit shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-700">
              Delete Locked
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="relative mt-4 grid gap-2.5 sm:grid-cols-3">
          <SummaryCard
            label="Schedule"
            value={appointmentDate || "Not scheduled"}
            accent="orange"
          />
          <SummaryCard
            label="Consultation"
            value={appointment.consultation_type || "Not specified"}
            accent="navy"
          />
          <SummaryCard
            label="Destination"
            value={appointment.country_interest || "Not specified"}
            accent="navy"
          />
        </div>
      )}

      {!compact && (
        <div className="relative mt-4 rounded-[1.2rem] border border-orange-300 bg-gradient-to-br from-[#fff1ea] via-[#fffaf5] to-white p-4 transition duration-300 group-hover:border-orange-300 sm:mt-5 sm:rounded-[1.4rem] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.24em] text-orange-600 sm:text-[10px] sm:tracking-[0.32em]">
                AI Appointment Intelligence
              </p>

              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {aiLead.ai_recommended_action}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Open the GPT workspace when deeper drafting, reasoning, or counselor assistance is required.
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-orange-300 bg-[#fff0e8] px-4 py-3 text-center">
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                Score
              </p>
              <p className="mt-1 text-2xl font-black text-orange-600">
                {aiLead.ai_score}
              </p>
            </div>
          </div>
        </div>
      )}

      {!compact && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="relative mt-4 rounded-[1.2rem] border border-[#071f50] bg-[#071f50] p-4 shadow-[0_14px_32px_rgba(7,31,80,0.12)] sm:mt-5 sm:rounded-[1.4rem] sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.24em] text-slate-400 sm:text-[10px] sm:tracking-[0.32em]">
                Appointment Journey
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {formatAppointmentStageLabel(activeStage.label)}
              </p>
            </div>

            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black text-white">
              {activeStageIndex + 1}/{appointmentStages.length}
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {appointmentStages
              .filter((stage) =>
                [
                  "new_booking",
                  "confirmed",
                  "consultation_done",
                  "converted_to_lead",
                  "cancelled",
                ].includes(stage.key)
              )
              .map((stage) => {
              const index = appointmentStages.findIndex(
                (pipelineStage) => pipelineStage.key === stage.key
              );
              const isActive = stage.key === appointmentStage;
              const isCompleted = index < activeStageIndex;
              const compactLabel = formatCompactAppointmentStageLabel(stage.label);
              const fullLabel = formatAppointmentStageLabel(stage.label);

              return (
                <button
                  key={stage.key}
                  type="button"
                  title={fullLabel}
                  aria-label={`Move appointment to ${fullLabel}`}
                  onClick={() => handleStageUpdate(stage.key)}
                  disabled={!safePermissions.canUpdateAppointmentPipeline}
                  className={`min-h-[88px] min-w-0 overflow-hidden rounded-2xl border px-2.5 py-3 text-left transition-all duration-300 ${
                    isActive
                      ? "border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_12px_26px_rgba(255,75,18,0.20)]"
                      : isCompleted
                      ? "border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_10px_22px_rgba(255,75,18,0.18)] hover:bg-[#ff642f]"
                      : "border-white/10 bg-white/10 text-white/70 hover:-translate-y-0.5 hover:bg-white/14"
                  } ${
                    !safePermissions.canUpdateAppointmentPipeline
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base leading-none">{stage.icon}</span>
                    <span className="text-[9px] font-black">
                      {isCompleted || isActive ? "✓" : `${index + 1}`}
                    </span>
                  </div>

                  <p className="mt-2 text-[10px] font-black leading-[1.3] sm:text-[11px]">
                    {fullLabel}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <select
              value={appointmentStage}
              onChange={(event) => handleStageUpdate(event.target.value)}
              disabled={!safePermissions.canUpdateAppointmentPipeline}
              className={`w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-bold text-white outline-none transition duration-300 focus:border-orange-400 sm:text-sm ${
                !safePermissions.canUpdateAppointmentPipeline
                  ? "cursor-not-allowed opacity-60"
                  : ""
              }`}
            >
              {appointmentStages
                .filter((stage) =>
                  [
                    "new_booking",
                    "confirmed",
                    "consultation_done",
                    "converted_to_lead",
                    "cancelled",
                  ].includes(stage.key)
                )
                .map((stage) => (
                  <option
                    key={stage.key}
                    value={stage.key}
                    className="bg-white text-[#071f50]"
                  >
                    {formatAppointmentStageLabel(stage.label)}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={() => nextStage && handleStageUpdate(nextStage.key)}
              disabled={!nextStage || !safePermissions.canUpdateAppointmentPipeline}
              className={`rounded-full px-4 py-2.5 text-xs font-semibold transition duration-300 sm:text-sm ${
                nextStage && safePermissions.canUpdateAppointmentPipeline
                  ? "bg-[#ff4b12] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)] hover:-translate-y-0.5 hover:bg-[#ff642f]"
                  : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {nextStage ? `Move to ${formatAppointmentStageLabel(nextStage.label)}` : "Journey Complete"}
            </button>
          </div>
        </div>
      )}

      <section className="relative mt-4">
        <div className="rounded-[1.25rem] border border-orange-200 bg-[#fffaf5] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                Appointment Snapshot
              </p>
              <p className="mt-1 text-xs font-semibold text-[#526178]">
                Contact, schedule, service and appointment ownership.
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <InfoCard label="Email" value={appointment.email} />

            {!compact && <InfoCard label="Phone" value={appointment.phone} />}

            <InfoCard label="Date" value={appointmentDate} />

            {!compact && (
              <InfoCard
                label="Service"
                value={appointment.consultation_type || appointment.country_interest}
              />
            )}
          </div>
        </div>
      </section>

      {!compact && (
        <section
          onClick={(event) => event.stopPropagation()}
          className="relative mt-4 grid gap-3 lg:grid-cols-2"
        >
          <div className="rounded-[1.3rem] border border-orange-200 bg-gradient-to-br from-[#fffaf5] via-white to-[#fff1ea]/55 p-4 shadow-[0_10px_28px_rgba(7,31,80,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff7a3d] hover:shadow-[0_16px_36px_rgba(255,75,18,0.08)]">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${activePriority.badge}`}>
                <span>{activePriority.icon}</span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#071f50]">
                  Priority
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-[#71809a]">
                  Controls appointment attention and queue ordering.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {PRIORITY_CHOICES.map((choice) => {
                const isActive = priority === choice.value;

                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => handlePriorityUpdate(choice.value)}
                    disabled={!safePermissions.canUpdatePriority}
                    aria-pressed={isActive}
                    className={`group flex min-h-[62px] min-w-0 items-center gap-3 overflow-hidden rounded-[1rem] border px-4 py-3 text-left transition-all duration-300 ${
                      isActive ? choice.active : choice.idle
                    } ${
                      !safePermissions.canUpdatePriority
                        ? "cursor-not-allowed opacity-50"
                        : "hover:-translate-y-0.5"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                        isActive
                          ? "border-white/30 bg-white/15 text-white"
                          : "border-current/20 bg-white/60"
                      }`}
                    >
                      {choice.icon}
                    </span>

                    <div className="min-w-0">
                      <p className="break-words text-[10px] font-black uppercase leading-4 tracking-[0.09em]">
                        {choice.label}
                      </p>
                      <p className={`mt-0.5 text-[9px] font-semibold ${
                        isActive ? "text-white/75" : "opacity-65"
                      }`}>
                        {choice.value === "vip"
                          ? "Highest attention"
                          : choice.value === "high"
                          ? "Urgent follow-up"
                          : choice.value === "medium"
                          ? "Standard priority"
                          : "Low urgency"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 rounded-xl border border-orange-100 bg-white/80 px-3 py-2">
              <p className="text-[9px] font-bold leading-4 text-[#71809a]">
                Priority controls how quickly this appointment should surface in
                the operational queue. Use VIP for the most important cases,
                High for urgent follow-up, Medium for standard attention, and Low
                when no immediate action is required.
              </p>
            </div>
          </div>

          <div className="rounded-[1.3rem] border border-orange-200 bg-gradient-to-br from-[#fffaf5] via-white to-[#fff1ea]/55 p-4 shadow-[0_10px_28px_rgba(7,31,80,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff7a3d] hover:shadow-[0_16px_36px_rgba(255,75,18,0.08)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-300 bg-[#fff0e8] text-[#c2410c]">
                <span>{activeStage.icon}</span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#071f50]">
                  Appointment Status
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-[#71809a]">
                  Keep operational appointment state synchronized.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {STATUS_CHOICES.map((choice) => {
                const isActive = status === choice.value;
                const isConfirmBlocked =
                  choice.value === "confirmed" &&
                  !safePermissions.canConfirmAppointments;
                const isDisabled =
                  !safePermissions.canUpdateStatus || isConfirmBlocked;

                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => handleStatusUpdate(choice.value)}
                    disabled={isDisabled}
                    aria-pressed={isActive}
                    className={`group flex min-h-[62px] min-w-0 items-center gap-3 overflow-hidden rounded-[1rem] border px-3 py-3 text-left transition-all duration-300 ${
                      isActive ? choice.active : choice.idle
                    } ${
                      isDisabled
                        ? "cursor-not-allowed opacity-45"
                        : "hover:-translate-y-0.5"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                        isActive
                          ? "border-white/30 bg-white/15 text-white"
                          : "border-current/20 bg-white/60"
                      }`}
                    >
                      {choice.icon}
                    </span>

                    <div className="min-w-0">
                      <p className="break-words text-[10px] font-black uppercase leading-4 tracking-[0.09em]">
                        {choice.label}
                      </p>
                      <p className={`mt-0.5 text-[9px] font-semibold leading-4 ${
                        isActive ? "text-white/75" : "opacity-65"
                      }`}>
                        {isConfirmBlocked
                          ? "Confirmation locked"
                          : choice.helper}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 rounded-xl border border-orange-100 bg-white/80 px-3 py-2">
              <p className="text-[9px] font-bold leading-4 text-[#71809a]">
                Status changes update this booking immediately. Confirmed and
                completed appointments use the Zaifan orange completion language;
                cancelled remains red for clear operational risk.
              </p>
            </div>
          </div>
        </section>
      )}

      {!compact && (
        <section className="relative mt-4 rounded-[1.35rem] border border-orange-200 bg-[#fffaf5] p-4 sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">
            Student Message
          </p>

          <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-[#526178]">
            {appointment.message || "No message provided."}
          </p>
        </section>
      )}

      <footer
        onClick={(event) => event.stopPropagation()}
        className="relative mt-4 rounded-[1.35rem] border border-orange-200 bg-white p-4 sm:p-5"
      >
        <div className="grid gap-2.5 md:grid-cols-2">
          <button
            type="button"
            onClick={openRealGptWorkspace}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black text-white shadow-[0_14px_30px_rgba(255,75,18,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#ff642f] sm:text-sm"
          >
            Open GPT Intelligence Workspace
          </button>

          <button
            type="button"
            onClick={() => openModal(appointment)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-3 text-xs font-black text-[#071f50] transition duration-300 hover:-translate-y-1 hover:border-[#ff7a3d] hover:bg-[#fff1ea] hover:text-[#ff4b12] sm:text-sm"
          >
            Open Full Student CRM
          </button>
        </div>

        {!compact && (
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {["pending", "confirmed", "completed", "cancelled"].map((item) => {
              const isConfirmBlocked =
                item === "confirmed" && !safePermissions.canConfirmAppointments;

              const isActive = status === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleStatusUpdate(item)}
                  disabled={!safePermissions.canUpdateStatus || isConfirmBlocked}
                  className={`rounded-full px-4 py-2.5 text-xs font-black capitalize transition duration-300 sm:px-5 sm:py-3 sm:text-sm ${
                    isActive
                      ? item === "cancelled"
                        ? "border border-red-500 bg-red-500 text-white"
                        : "border border-[#ff4b12] bg-[#ff4b12] text-white shadow-[0_10px_24px_rgba(255,75,18,0.18)]"
                      : safePermissions.canUpdateStatus && !isConfirmBlocked
                      ? "border border-[#071f50]/20 bg-[#fffaf5] text-[#071f50] hover:-translate-y-0.5 hover:border-[#ff7a3d] hover:bg-white"
                      : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        )}

        {!compact && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={!safePermissions.canDelete}
            className={`mt-3 w-full rounded-full px-4 py-2.5 text-xs font-black transition duration-300 sm:px-6 sm:py-3 sm:text-sm ${
              safePermissions.canDelete
                ? "border border-red-200 bg-white text-red-700 hover:-translate-y-0.5 hover:bg-red-50"
                : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {safePermissions.canDelete ? "Delete Appointment" : "Delete Locked"}
          </button>
        )}
      </footer>
    </motion.div>
  );
}

function AssignmentBadge({ assignedAdminName, assignedAdminInitial }) {
  if (!assignedAdminName) {
    return (
      <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-orange-300 bg-[#fff0e8] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-700 shadow-sm sm:px-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-200 bg-white text-[9px]">
          !
        </span>
        <span className="truncate">Unassigned</span>
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-cyan-300 bg-cyan-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700 shadow-sm sm:px-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-200 bg-white text-[9px] font-black text-cyan-700">
        {assignedAdminInitial}
      </span>
      <span className="max-w-[150px] truncate sm:max-w-[220px]">
        Assigned: {assignedAdminName}
      </span>
    </span>
  );
}

function SummaryCard({ label, value, accent = "navy" }) {
  const accentClass =
    accent === "orange"
      ? "border-orange-300 bg-[#fff0e8]"
      : "border-[#071f50]/20 bg-[#fffaf5]";

  return (
    <div
      className={`min-w-0 rounded-[1.1rem] border p-3.5 shadow-[0_1px_0_rgba(7,31,80,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-[#ff7a3d] ${accentClass}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-bold leading-relaxed text-[#071f50]">
        {value}
      </p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-[1.15rem] border border-[#071f50]/20 bg-[#fffaf5] p-3 shadow-[0_1px_0_rgba(7,31,80,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-[#ff7a3d] hover:bg-white sm:p-4">
      <p className="text-[9px] uppercase tracking-[0.22em] text-slate-400 sm:text-[10px] sm:tracking-[0.28em]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm leading-relaxed text-slate-700 sm:mt-2">
        {value || "-"}
      </p>
    </div>
  );
}

export default AppointmentCard;
