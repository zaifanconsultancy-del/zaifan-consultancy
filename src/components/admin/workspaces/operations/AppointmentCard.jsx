// AppointmentCard PARTNER OS EXTREME V6 — True Inquiry Composition Match
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  appointmentStages,
  appointmentStageToStatus,
  legacyAppointmentStatusToStage,
  getPipelineStage,
} from "../../../../data/crmPipelineConfig";
import { enrichLeadWithAi } from "../../../../services/aiLeadEngine";


const MOTION = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

function normalizePhone(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");
}

function toWhatsAppNumber(value = "") {
  const digits = normalizePhone(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

function safeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAppointmentDate(dateValue, timeValue) {
  if (!dateValue && !timeValue) return "Not scheduled";

  const date = safeDate(dateValue);
  const dateLabel = date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date)
    : String(dateValue || "");

  return [dateLabel, timeValue].filter(Boolean).join(" · ");
}

function getTimingSignal(dateValue, timeValue, status = "") {
  const normalizedStatus = String(status || "").toLowerCase();

  if (["completed", "cancelled"].includes(normalizedStatus)) {
    return {
      label: normalizedStatus === "completed" ? "Completed" : "Cancelled",
      tone:
        normalizedStatus === "completed"
          ? "border-[#FF5A0A] bg-orange-50 text-orange-800"
          : "border-red-300 bg-red-50 text-red-700",
      helper:
        normalizedStatus === "completed"
          ? "Consultation workflow is closed."
          : "Booking is cancelled.",
    };
  }

  if (!dateValue) {
    return {
      label: "Unscheduled",
      tone: "border-amber-300 bg-amber-50 text-amber-800",
      helper: "Appointment date is missing.",
    };
  }

  const date = safeDate(`${dateValue}${timeValue ? `T${timeValue}` : "T23:59:59"}`);

  if (!date) {
    return {
      label: "Check Date",
      tone: "border-amber-300 bg-amber-50 text-amber-800",
      helper: "Appointment date/time could not be interpreted.",
    };
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;

  if (diffHours < -24) {
    return {
      label: "Past Due",
      tone: "border-red-300 bg-red-50 text-red-700",
      helper: "Appointment date has passed and still needs workflow resolution.",
    };
  }

  if (diffHours < 0) {
    return {
      label: "Due / Passed",
      tone: "border-red-300 bg-red-50 text-red-700",
      helper: "Appointment time has passed today.",
    };
  }

  if (diffHours <= 24) {
    return {
      label: "Within 24h",
      tone: "border-[#FF5A0A] bg-orange-50 text-orange-800",
      helper: "High scheduling attention recommended.",
    };
  }

  if (diffHours <= 72) {
    return {
      label: "Within 3 Days",
      tone: "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]",
      helper: "Upcoming consultation window.",
    };
  }

  return {
    label: "Upcoming",
    tone: "border-slate-300 bg-slate-50 text-slate-700",
    helper: "Appointment is scheduled ahead.",
  };
}

async function copyText(value) {
  if (!value) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(value));
      return true;
    }
  } catch {
    // Fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = String(value);
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}


const PRIORITY_CHOICES = [
  {
    value: "low",
    label: "Low",
    icon: "◉",
    idle: "border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-white",
    active: "border-[#123865] bg-[#123865] text-white shadow-[0_10px_24px_rgba(7,31,80,0.18)]",
  },
  {
    value: "medium",
    label: "Medium",
    icon: "★",
    idle: "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C] hover:border-[#FF7A2F] hover:bg-white",
    active: "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)]",
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
    idle: "border-[#FF5A0A] bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-white",
    active: "border-orange-600 bg-orange-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.20)]",
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
    idle: "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C] hover:border-[#FF7A2F] hover:bg-white",
    active: "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)]",
  },
  {
    value: "completed",
    label: "Completed",
    icon: "✓",
    helper: "Done",
    idle: "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C] hover:border-[#FF7A2F] hover:bg-white",
    active: "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)]",
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

const ROLE_CONFIG = {
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
      badge: "border-[#FF5A0A] bg-orange-100 text-orange-800",
    },
  };

const PRIORITY_STYLES = {
    vip: {
      badge: "border-orange-200 bg-orange-50 text-orange-700",
      card:
        "border-orange-200 hover:border-[#FF5A0A] hover:shadow-[0_18px_50px_rgba(124,58,237,0.08)]",
      glow: "bg-orange-100/70 group-hover:bg-orange-200/70",
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
        "border-orange-200 hover:border-[#FF5A0A] hover:shadow-[0_18px_50px_rgba(249,115,22,0.08)]",
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

const STATUS_STYLES = {
    pending: "border-amber-300 bg-amber-50 text-amber-800",
    confirmed: "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]",
    completed: "border-[#FF5A0A] bg-[#FF5A0A] text-white",
    cancelled: "border-red-300 bg-red-50 text-red-700",
  };

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
  const shouldReduceMotion = useReducedMotion();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const feedbackTimerRef = useRef(null);

  const status = appointment.status || "pending";
  const priority = appointment.priority || "low";
  const aiLead = useMemo(() => enrichLeadWithAi(appointment, "appointment"), [appointment]);
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


  const normalizedPhone = useMemo(
    () => normalizePhone(appointment.phone || appointment.phone_number || appointment.whatsapp),
    [appointment.phone, appointment.phone_number, appointment.whatsapp]
  );

  const whatsappPhone = useMemo(
    () => toWhatsAppNumber(normalizedPhone),
    [normalizedPhone]
  );

  const contactLinks = useMemo(
    () => ({
      email: appointment.email ? `mailto:${appointment.email}` : "",
      phone: normalizedPhone ? `tel:${normalizedPhone}` : "",
      whatsapp: whatsappPhone ? `https://wa.me/${whatsappPhone}` : "",
    }),
    [appointment.email, normalizedPhone, whatsappPhone]
  );

  const appointmentDate = formatAppointmentDate(
    appointment.appointment_date,
    appointment.appointment_time
  );

  const timingSignal = useMemo(
    () =>
      getTimingSignal(
        appointment.appointment_date,
        appointment.appointment_time,
        status
      ),
    [appointment.appointment_date, appointment.appointment_time, status]
  );

  const completeness = useMemo(() => {
    const fields = [
      appointment.full_name,
      appointment.email,
      appointment.phone,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.consultation_type,
      appointment.country_interest,
      assignedAdminName,
      appointment.status,
      appointment.priority,
    ];

    const completed = fields.filter((value) => String(value || "").trim()).length;
    return Math.round((completed / fields.length) * 100);
  }, [
    appointment.full_name,
    appointment.email,
    appointment.phone,
    appointment.appointment_date,
    appointment.appointment_time,
    appointment.consultation_type,
    appointment.country_interest,
    appointment.status,
    appointment.priority,
    assignedAdminName,
  ]);

  const safePermissions = useMemo(
    () => ({
      canDelete: false,
      canUpdateStatus: true,
      canUpdatePriority: true,
      canConfirmAppointments: true,
      canUpdateAppointmentPipeline: permissions.canUpdateStatus ?? true,
      ...permissions,
    }),
    [permissions]
  );



  const currentRole = ROLE_CONFIG[role] || ROLE_CONFIG.staff;





  const activePriority = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;

  const showFeedback = (message) => {
    setFeedback(message);
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 2200);
  };

  const handleDelete = () => {
    if (!safePermissions.canDelete || !deleteAppointment) {
      showFeedback("Delete is locked for your current role.");
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteAppointment(appointment.id);
    setShowDeleteConfirm(false);
  };

  const handlePriorityUpdate = (value) => {
    if (!safePermissions.canUpdatePriority) {
      showFeedback("You do not have permission to update appointment priority.");
      return;
    }

    updateAppointmentPriority(appointment.id, value);
  };

  const handleStatusUpdate = (newStatus) => {
    if (!safePermissions.canUpdateStatus) {
      showFeedback("You do not have permission to update appointment status.");
      return;
    }

    if (newStatus === "confirmed" && !safePermissions.canConfirmAppointments) {
      showFeedback("You do not have permission to confirm appointments.");
      return;
    }

    updateAppointmentStatus(appointment.id, newStatus);
  };

  const handleStageUpdate = (newStage) => {
    if (!safePermissions.canUpdateAppointmentPipeline) {
      showFeedback("You do not have permission to update appointment pipeline.");
      return;
    }

    if (newStage === "confirmed" && !safePermissions.canConfirmAppointments) {
      showFeedback("You do not have permission to confirm appointments.");
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

  const copyValue = async (field, value) => {
    if (!value) return;

    const copied = await copyText(value);

    if (!copied) {
      showFeedback("Copy failed. Please copy the value manually.");
      return;
    }

    setCopiedField(field);
    showFeedback(`${field} copied.`);

    window.setTimeout(() => {
      setCopiedField("");
    }, 1600);
  };

  const openExternal = (event, url) => {
    event.stopPropagation();
    if (!url) return;

    if (url.startsWith("mailto:") || url.startsWith("tel:")) {
      window.location.href = url;
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openRealGptWorkspace = () => {
    openModal({
      ...appointment,
      __preferredPanel: "ai-workspace",
    });
  };

  return (
    <>
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => openModal(appointment)}
      className={`${cardClass} group relative min-w-0 cursor-pointer overflow-hidden rounded-[1.85rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2 shadow-[0_18px_50px_rgba(18,56,101,0.12)] ${TRANSITION} hover:border-[#FF5A0A] hover:shadow-[0_24px_65px_rgba(18,56,101,0.16)] sm:p-2.5`}
    >
      <div
        className="hidden"
      ></div>

      {!assignedAdminName && (
        <div className="hidden"></div>
      )}

      <div className="absolute inset-x-6 top-0 h-[3px] rounded-b-full bg-[#FF5A0A]"></div>

      {feedback ? (
        <div
          role="status"
          className="relative mb-3 flex items-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-orange-50 px-4 py-3 text-xs font-black text-orange-800"
          onClick={(event) => event.stopPropagation()}
        >
          <CheckCircle2 size={14} />
          {feedback}
        </div>
      ) : null}

      <div className="min-w-0 overflow-hidden rounded-[1.35rem] border-[2px] border-[#FF5A0A] bg-white">
      <header className="min-w-0 bg-[#123865] p-4 text-white sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/45 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-orange-100">
            <CalendarClock size={11} />
            Student Appointment
          </span>

          <span className="inline-flex items-center gap-2 rounded-full border-2 border-blue-300 bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-blue-800">
            <span aria-hidden="true">{activeStage.icon}</span>
            {formatCompactAppointmentStageLabel(activeStage.label)}
          </span>

          <span className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${activePriority.badge}`}>
            <span aria-hidden="true">{activePriority.icon}</span>
            {priority}
          </span>
        </div>

        <div className="mt-3 flex min-w-0 flex-col gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Appointment Command Record
            </p>

            <h2 className="mt-1 min-w-0 whitespace-normal [overflow-wrap:break-word] text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              {appointment.full_name || "Unnamed Student"}
            </h2>

            <p className="mt-2 min-w-0 whitespace-normal [overflow-wrap:break-word] text-sm font-semibold leading-6 text-slate-200">
              {appointment.country_interest || "Destination not provided"}
              <span className="mx-2 text-orange-300">·</span>
              {appointment.consultation_type || "Consultation type not provided"}
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <AssignmentBadge
              assignedAdminName={assignedAdminName}
              assignedAdminInitial={assignedAdminInitial}
            />

            {!compact ? (
              <span className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${currentRole.badge}`}>
                <span aria-hidden="true">{currentRole.icon}</span>
                {currentRole.label}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="mt-4 flex min-w-0 flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${timingSignal.tone}`}>
            <CalendarClock size={11} />
            {timingSignal.label}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
            <ShieldCheck size={11} />
            {status}
          </span>

          <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${
            completeness >= 80
              ? "border-emerald-200/55 bg-emerald-400/10 text-emerald-100"
              : "border-amber-200/55 bg-amber-400/10 text-amber-100"
          }`}>
            <CheckCircle2 size={11} />
            {completeness >= 80 ? "Profile Ready" : `${completeness}% Profile`}
          </span>

          {!safePermissions.canDelete && !compact ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-red-200/55 bg-red-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-red-100">
              <Trash2 size={11} />
              Delete Locked
            </span>
          ) : null}
        </div>
      </header>

      <aside
        className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-4 text-white sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              AI Appointment Intelligence
            </p>
            <p className="mt-1 text-xs font-semibold text-orange-50">
              Evidence-led consultation signal
            </p>
          </div>

          <ShieldCheck size={23} className="shrink-0 text-white" />
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
          <AppointmentOrangeMetric
            label={aiLead.ai_tier.badge}
            value={`${aiLead.ai_score}/100`}
          />

          <AppointmentOrangeMetric
            label="Profile Complete"
            value={`${completeness}%`}
          />
        </div>

        <div className="mt-3 min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
            Conversion Probability
          </p>

          <p className="mt-1 text-lg font-black text-white">
            {aiLead.ai_conversion_probability}
          </p>
        </div>

        <button
          type="button"
          onClick={openRealGptWorkspace}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white px-4 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
        >
          <ShieldCheck size={15} />
          Open AI Workspace
          <ExternalLink size={13} />
        </button>
      </aside>

      {!compact ? (
        <div
          className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-white p-3.5 sm:p-4"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex min-w-0 flex-col gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Immediate Actions
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Contact the student or open the complete appointment record without losing this queue position.
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap gap-2 [container-type:inline-size]">
              <ContactAction
                label="Email"
                icon={Mail}
                disabled={!contactLinks.email}
                onClick={(event) => openExternal(event, contactLinks.email)}
              />

              <ContactAction
                label="Call"
                icon={Phone}
                disabled={!contactLinks.phone}
                onClick={(event) => openExternal(event, contactLinks.phone)}
              />

              <ContactAction
                label="WhatsApp"
                icon={MessageCircle}
                disabled={!contactLinks.whatsapp}
                primary
                onClick={(event) => openExternal(event, contactLinks.whatsapp)}
              />

              <ContactAction
                label="Open Profile"
                icon={ExternalLink}
                onClick={() => openModal(appointment)}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setWorkspaceExpanded((current) => !current)}
          aria-expanded={workspaceExpanded}
          className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-[3px] border-[#123865] bg-white px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Operational Workspace
            </p>

            <p className="mt-1 break-words text-xs font-semibold text-slate-600">
              {workspaceExpanded
                ? "Hide appointment controls, journey, snapshot and protected actions."
                : "Open appointment controls, journey, snapshot and protected actions."}
            </p>
          </div>

          <ChevronDown
            size={18}
            className={`shrink-0 text-[#123865] ${TRANSITION} ${
              workspaceExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {workspaceExpanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : MOTION}
            className="min-w-0 overflow-hidden"
          >
            <div
              className="min-w-0 space-y-4 bg-[#FFF8EF] p-4 sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >
      {!compact && (
        <div className="relative mt-4 grid min-w-0 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
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
          <SummaryCard
            label="Profile Readiness"
            value={`${completeness}%`}
            accent={completeness >= 80 ? "orange" : "navy"}
          />
        </div>
      )}

      {!compact && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="relative mt-4 overflow-hidden rounded-[1.45rem] border-[3px] border-[#123865] bg-[#123865] p-4 shadow-[0_14px_32px_rgba(18,56,101,0.14)] sm:mt-5 sm:p-5" style={{ color: "#FFFFFF" }}
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
                      ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_12px_26px_rgba(255,75,18,0.20)]"
                      : isCompleted
                      ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_10px_22px_rgba(255,75,18,0.18)] hover:bg-[#ff642f]"
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
                    className="bg-white text-[#123865]"
                  >
                    {formatAppointmentStageLabel(stage.label)}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={() => nextStage && handleStageUpdate(nextStage.key)}
              disabled={!nextStage || !safePermissions.canUpdateAppointmentPipeline}
              className={`rounded-xl border-2 px-4 py-2.5 text-xs font-semibold transition duration-300 sm:text-sm ${
                nextStage && safePermissions.canUpdateAppointmentPipeline
                  ? "bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,75,18,0.20)] hover:-translate-y-0.5 hover:bg-[#ff642f]"
                  : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {nextStage ? `Move to ${formatAppointmentStageLabel(nextStage.label)}` : "Journey Complete"}
            </button>
          </div>
        </div>
      )}

      <section className="relative mt-4">
        <div className="rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_24px_rgba(18,56,101,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#FF5A0A]">
                Appointment Snapshot
              </p>
              <p className="mt-1 text-xs font-semibold text-[#526178]">
                Contact, schedule, service and appointment ownership.
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <InfoCard label="Email" value={appointment.email} onCopy={() => void copyValue("email", appointment.email)} copied={copiedField === "email"} />

            {!compact && <InfoCard label="Phone" value={appointment.phone} onCopy={() => void copyValue("phone", appointment.phone)} copied={copiedField === "phone"} />}

            <InfoCard label="Schedule" value={appointmentDate} />

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
          className="relative mt-4 grid min-w-0 gap-3 lg:grid-cols-2"
        >
          <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_8px_24px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md sm:p-5">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${activePriority.badge}`}>
                <span>{activePriority.icon}</span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#123865]">
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
                    className={`group flex min-h-[62px] min-w-0 items-center gap-3 overflow-hidden rounded-xl border-2 px-4 py-3 text-left transition-all duration-300 ${
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

            <div className="mt-3 rounded-xl border-2 border-[#FF5A0A] bg-white/80 px-3 py-2">
              <p className="text-[9px] font-bold leading-4 text-[#71809a]">
                Priority controls how quickly this appointment should surface in
                the operational queue. Use VIP for the most important cases,
                High for urgent follow-up, Medium for standard attention, and Low
                when no immediate action is required.
              </p>
            </div>
          </div>

          <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_8px_24px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]">
                <span>{activeStage.icon}</span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#123865]">
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

            <div className="mt-3 rounded-xl border-2 border-[#FF5A0A] bg-white/80 px-3 py-2">
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
        <section className="relative mt-4 rounded-[1.35rem] border-2 border-[#FF5A0A] bg-[#FFF8EF] p-4 sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FF5A0A]">
            Student Message
          </p>

          <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-[#526178]">
            {appointment.message || "No message provided."}
          </p>
        </section>
      )}

      <footer
        onClick={(event) => event.stopPropagation()}
        className="relative mt-4 rounded-[1.35rem] border-2 border-[#FF5A0A] bg-white p-4 sm:p-5"
      >
        <div className="grid gap-2.5 md:grid-cols-2">
          <button
            type="button"
            onClick={openRealGptWorkspace}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF5A0A] px-5 py-3 text-xs font-black text-white shadow-[0_14px_30px_rgba(255,75,18,0.18)] transition duration-300 hover:-translate-y-1 hover:bg-[#ff642f] sm:text-sm"
          >
            Open GPT Intelligence Workspace
          </button>

          <button
            type="button"
            onClick={() => openModal(appointment)}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#FF5A0A] bg-white px-5 py-3 text-xs font-black text-[#123865] transition duration-300 hover:-translate-y-1 hover:border-[#FF7A2F] hover:bg-[#FFF4E8] hover:text-[#FF5A0A] sm:text-sm"
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
                  className={`rounded-xl border-2 px-4 py-2.5 text-xs font-black capitalize transition duration-300 sm:px-5 sm:py-3 sm:text-sm ${
                    isActive
                      ? item === "cancelled"
                        ? "border border-red-500 bg-red-500 text-white"
                        : "border border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,75,18,0.18)]"
                      : safePermissions.canUpdateStatus && !isConfirmBlocked
                      ? "border border-[#123865]/20 bg-[#FFF8EF] text-[#123865] hover:-translate-y-0.5 hover:border-[#FF7A2F] hover:bg-white"
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
            className={`mt-3 w-full rounded-xl border-2 px-4 py-2.5 text-xs font-black transition duration-300 sm:px-6 sm:py-3 sm:text-sm ${
              safePermissions.canDelete
                ? "border border-red-200 bg-white text-red-700 hover:-translate-y-0.5 hover:bg-red-50"
                : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            {safePermissions.canDelete ? "Delete Appointment" : "Delete Locked"}
          </button>
        )}
      </footer>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </div>
    </motion.div>

      <AnimatePresence>
        {showDeleteConfirm ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-[#123865]/45 px-4 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={shouldReduceMotion ? { duration: 0 } : MOTION}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[1.8rem] border-[3px] border-red-200 bg-white p-6 shadow-[0_28px_90px_rgba(7,31,80,0.22)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700">
                  <AlertTriangle size={22} />
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  aria-label="Close delete confirmation"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="mt-4 text-2xl font-black text-[#123865]">
                Delete this appointment?
              </h3>

              <p className="mt-3 text-sm font-medium leading-6 text-[#526178]">
                This will remove{" "}
                <strong className="text-[#123865]">
                  {appointment.full_name || "this appointment"}
                </strong>{" "}
                from the CRM. Use permanent deletion only when the booking record is
                genuinely no longer required.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#123865] hover:bg-slate-50"
                >
                  Keep Appointment
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-700 bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700"
                >
                  <Trash2 size={15} />
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function AssignmentBadge({ assignedAdminName, assignedAdminInitial }) {
  if (!assignedAdminName) {
    return (
      <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-700 shadow-sm sm:px-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#FF5A0A] bg-white text-[9px]">
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

function AppointmentOrangeMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}


function SummaryCard({ label, value, accent = "navy" }) {
  const accentClass =
    accent === "orange"
      ? "border-[#FF5A0A] bg-[#FFF4E8]"
      : "border-[#123865]/20 bg-[#FFF8EF]";

  return (
    <div
      className={`min-w-0 rounded-[1.1rem] border p-3.5 shadow-[0_1px_0_rgba(7,31,80,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-[#FF7A2F] ${accentClass}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FF5A0A]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-bold leading-relaxed text-[#123865]">
        {value}
      </p>
    </div>
  );
}

function ContactAction({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  primary = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION} ${
        disabled
          ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
          : primary
          ? "border border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_8px_20px_rgba(255,75,18,0.18)] hover:-translate-y-0.5 hover:bg-[#ff642f]"
          : "border-2 border-[#FF5A0A] bg-[#FFF8EF] text-[#123865] hover:-translate-y-0.5 hover:border-[#FF7A2F] hover:bg-white"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function InfoCard({ label, value, onCopy = null, copied = false }) {
  return (
    <div className="min-w-0 rounded-[1.15rem] border border-[#123865]/20 bg-[#FFF8EF] p-3 shadow-[0_1px_0_rgba(7,31,80,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-[#FF7A2F] hover:bg-white sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>

        {onCopy && value ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCopy();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-black text-slate-600 hover:border-[#FF5A0A] hover:text-orange-700"
          >
            {copied ? <CheckCircle2 size={11} /> : <Clipboard size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>

      <p className="mt-1.5 break-words text-sm font-bold leading-relaxed text-[#123865] sm:mt-2">
        {value || "-"}
      </p>
    </div>
  );
}

export default AppointmentCard;
