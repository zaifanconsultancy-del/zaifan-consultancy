import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserCheck,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { enrichLeadWithAi } from "../../../../services/aiLeadEngine";

const MOTION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
};

const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const PRIORITY_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
  vip: 4,
};

const PRIORITY_STYLES = {
  vip: {
    badge: "border-orange-300 bg-orange-100 text-orange-800",
    card:
      "border-orange-200 hover:border-orange-300 hover:shadow-[0_20px_60px_rgba(124,58,237,0.08)]",
    glow: "bg-orange-100/70 group-hover:bg-orange-200/70",
    icon: Crown,
    dot: "bg-orange-500",
    label: "VIP",
  },
  high: {
    badge: "border-red-200 bg-red-50 text-red-700",
    card:
      "border-red-200 hover:border-red-300 hover:shadow-[0_20px_60px_rgba(239,68,68,0.08)]",
    glow: "bg-red-100/70 group-hover:bg-red-200/70",
    icon: Flame,
    dot: "bg-red-500",
    label: "High",
  },
  medium: {
    badge: "border-orange-300 bg-[#fff0e8] text-[#c2410c]",
    card:
      "border-orange-200 hover:border-orange-300 hover:shadow-[0_20px_60px_rgba(255,75,18,0.08)]",
    glow: "bg-orange-100/70 group-hover:bg-orange-200/70",
    icon: Star,
    dot: "bg-orange-500",
    label: "Medium",
  },
  low: {
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    card:
      "border-slate-200 hover:border-slate-300 hover:shadow-[0_20px_60px_rgba(7,31,80,0.07)]",
    glow: "bg-slate-100/70 group-hover:bg-slate-200/70",
    icon: Target,
    dot: "bg-slate-400",
    label: "Low",
  },
};

const ROLE_CONFIG = {
  staff: {
    label: "Staff",
    icon: UserRound,
    badge: "border-sky-200 bg-sky-50 text-sky-700",
  },
  admin: {
    label: "Admin",
    icon: UserCheck,
    badge: "border-orange-300 bg-[#fff0e8] text-[#c2410c]",
  },
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    badge: "border-orange-200 bg-orange-50 text-orange-700",
  },
};

const PIPELINE_STAGES = [
  {
    value: "new",
    label: "New Student",
    shortLabel: "New",
    icon: Sparkles,
    emoji: "✨",
    badge: "border-orange-300 bg-[#fff0e8] text-[#c2410c]",
    dot: "bg-orange-500",
    progress: 12,
  },
  {
    value: "contacted",
    label: "Contacted",
    shortLabel: "Contacted",
    icon: Phone,
    emoji: "📞",
    badge: "border-orange-300 bg-[#fff0e8] text-[#c2410c]",
    dot: "bg-orange-500",
    progress: 25,
  },
  {
    value: "documents_pending",
    label: "Documents Pending",
    shortLabel: "Docs Pending",
    icon: FileText,
    emoji: "📄",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    progress: 40,
  },
  {
    value: "applied",
    label: "Application Submitted",
    shortLabel: "Applied",
    icon: ClipboardCheck,
    emoji: "📨",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    progress: 55,
  },
  {
    value: "offer_letter",
    label: "Offer Letter",
    shortLabel: "Offer",
    icon: BadgeCheck,
    emoji: "🏆",
    badge: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
    progress: 70,
  },
  {
    value: "visa_process",
    label: "Visa Process",
    shortLabel: "Visa",
    icon: BriefcaseBusiness,
    emoji: "🛂",
    badge: "border-cyan-200 bg-cyan-50 text-cyan-700",
    dot: "bg-cyan-500",
    progress: 85,
  },
  {
    value: "approved",
    label: "Approved",
    shortLabel: "Approved",
    icon: CheckCircle2,
    emoji: "✅",
    badge: "border-orange-300 bg-[#fff0e8] text-[#c2410c]",
    dot: "bg-orange-500",
    progress: 100,
  },
];

function InquiryCard({
  inquiry,
  cardClass = "",
  updateInquiryStatus = () => {},
  updateInquiryPriority = () => {},
  deleteInquiry = null,
  openModal = () => {},
  compact = false,
  role = "staff",
  permissions = {},
}) {
  const [detailsExpanded, setDetailsExpanded] = useState(!compact);
  const [pipelineExpanded, setPipelineExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const status = inquiry.status || "new";
  const priority = inquiry.priority || "low";
  const aiLead = useMemo(() => enrichLeadWithAi(inquiry, "inquiry"), [inquiry]);

  const safePermissions = useMemo(
    () => ({
      canDelete: false,
      canUpdateStatus: true,
      canUpdatePriority: true,
      ...permissions,
    }),
    [permissions]
  );

  const currentRole = ROLE_CONFIG[role] || ROLE_CONFIG.staff;
  const CurrentRoleIcon = currentRole.icon;

  const activePriority =
    PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;

  const ActivePriorityIcon = activePriority.icon;

  const activeStage =
    PIPELINE_STAGES.find((stage) => stage.value === status) ||
    PIPELINE_STAGES[0];

  const ActiveStageIcon = activeStage.icon;

  const assignedAdminName =
    inquiry.assigned_admin_name ||
    inquiry.assigned_to_name ||
    inquiry.assigned_to ||
    inquiry.assigned_admin_email ||
    null;

  const assignedAdminInitial = assignedAdminName
    ? assignedAdminName.trim().charAt(0).toUpperCase()
    : "?";

  const normalizedPhone = useMemo(() => {
    const raw = String(inquiry.phone || "").trim();
    if (!raw) return "";

    return raw.replace(/[^\d+]/g, "");
  }, [inquiry.phone]);

  const whatsappPhone = useMemo(() => {
    const digits = normalizedPhone.replace(/\D/g, "");
    if (!digits) return "";

    if (digits.startsWith("0")) {
      return `92${digits.slice(1)}`;
    }

    return digits;
  }, [normalizedPhone]);

  const contactLinks = useMemo(
    () => ({
      email: inquiry.email ? `mailto:${inquiry.email}` : "",
      phone: normalizedPhone ? `tel:${normalizedPhone}` : "",
      whatsapp: whatsappPhone
        ? `https://wa.me/${whatsappPhone}`
        : "",
    }),
    [inquiry.email, normalizedPhone, whatsappPhone]
  );

  const completeness = useMemo(() => {
    const fields = [
      inquiry.full_name,
      inquiry.email,
      inquiry.phone,
      inquiry.country,
      inquiry.field_of_interest || inquiry.study_level,
      inquiry.message,
      assignedAdminName,
      inquiry.priority,
      inquiry.status,
    ];

    const completed = fields.filter((value) =>
      String(value || "").trim()
    ).length;

    return Math.round((completed / fields.length) * 100);
  }, [
    inquiry.full_name,
    inquiry.email,
    inquiry.phone,
    inquiry.country,
    inquiry.field_of_interest,
    inquiry.study_level,
    inquiry.message,
    inquiry.priority,
    inquiry.status,
    assignedAdminName,
  ]);

  const nextStage = useMemo(() => {
    const index = PIPELINE_STAGES.findIndex(
      (stage) => stage.value === activeStage.value
    );

    if (index < 0 || index >= PIPELINE_STAGES.length - 1) {
      return null;
    }

    return PIPELINE_STAGES[index + 1];
  }, [activeStage.value]);

  const healthSignals = useMemo(() => {
    const signals = [];

    if (!assignedAdminName) {
      signals.push({
        label: "Unassigned",
        tone: "warning",
        icon: UserRound,
      });
    }

    if (!inquiry.phone) {
      signals.push({
        label: "Phone missing",
        tone: "warning",
        icon: Phone,
      });
    }

    if (!inquiry.email) {
      signals.push({
        label: "Email missing",
        tone: "warning",
        icon: Mail,
      });
    }

    if (priority === "vip" || priority === "high") {
      signals.push({
        label: `${activePriority.label} priority`,
        tone: "danger",
        icon: Flame,
      });
    }

    if (aiLead.ai_urgency?.label) {
      signals.push({
        label: aiLead.ai_urgency.label,
        tone:
          String(aiLead.ai_urgency.label).toLowerCase().includes("high") ||
          String(aiLead.ai_urgency.label).toLowerCase().includes("urgent")
            ? "danger"
            : "info",
        icon: ShieldAlert,
      });
    }

    if (completeness >= 80) {
      signals.push({
        label: "Profile ready",
        tone: "success",
        icon: CheckCircle2,
      });
    }

    return signals.slice(0, 4);
  }, [
    assignedAdminName,
    inquiry.phone,
    inquiry.email,
    priority,
    activePriority.label,
    aiLead.ai_urgency?.label,
    completeness,
  ]);

  const handleDelete = () => {
    if (!safePermissions.canDelete || !deleteInquiry) {
      alert("Only Admin and Super Admin can delete inquiries.");
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteInquiry(inquiry.id);
    setShowDeleteConfirm(false);
  };

  const handlePipelineUpdate = (value) => {
    if (!safePermissions.canUpdateStatus) {
      alert("You do not have permission to update inquiry pipeline stage.");
      return;
    }

    updateInquiryStatus(inquiry.id, value);
  };

  const handlePriorityUpdate = (value) => {
    if (!safePermissions.canUpdatePriority) {
      alert("You do not have permission to update priorities.");
      return;
    }

    updateInquiryPriority(inquiry.id, value);
  };

  const openRealGptWorkspace = () => {
    openModal({
      ...inquiry,
      __preferredPanel: "ai-workspace",
    });
  };

  const copyValue = async (field, value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);

      window.setTimeout(() => {
        setCopiedField("");
      }, 1800);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const openExternal = (event, url) => {
    event.stopPropagation();
    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <motion.article
        whileHover={{ y: -2 }}
        transition={MOTION}
        onClick={() => openModal(inquiry)}
        className={`${cardClass} group relative cursor-pointer overflow-hidden rounded-[1.55rem] border-[3px] ${activePriority.card} !border-[#123865] hover:!border-[#FF5A0A] bg-[#FFF8EF] p-4 shadow-[0_16px_48px_rgba(7,31,80,0.07)] ${TRANSITION} sm:rounded-[2rem] sm:p-5`}
      >
        <div
          className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition duration-700 sm:h-48 sm:w-48 ${activePriority.glow}`}
        />

        {!assignedAdminName ? (
          <div className="pointer-events-none absolute -left-24 top-10 h-44 w-44 rounded-full bg-orange-500/5 blur-3xl transition duration-700 group-hover:bg-orange-500/10" />
        ) : null}

        <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#FF5A0A] to-transparent transition duration-500 group-hover:scale-x-100" />

        <div className="relative">
          <header className="border-b border-orange-100 pb-4 sm:pb-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300 bg-[#FFF8EF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#FF5A0A]">
                    <GraduationCap size={11} />
                    Student Inquiry
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${activeStage.badge}`}
                  >
                    <ActiveStageIcon size={11} />
                    {activeStage.shortLabel}
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${activePriority.badge}`}
                  >
                    <ActivePriorityIcon size={11} />
                    {activePriority.label}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-black leading-tight tracking-[-0.025em] text-[#123865] sm:text-2xl">
                      {inquiry.full_name || "Unnamed Student"}
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-[#71809a]">
                      {inquiry.country || "Country not provided"}
                      {" · "}
                      {inquiry.field_of_interest ||
                        inquiry.study_level ||
                        "Study interest not provided"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border-2 border-orange-300 bg-[#FFF2E8] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#c2410c] shadow-sm`}
                    >
                      <Bot size={11} />
                      {aiLead.ai_tier.badge} · {aiLead.ai_score}/100
                    </div>

                    {!compact ? (
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${currentRole.badge}`}
                      >
                        <CurrentRoleIcon size={11} />
                        {currentRole.label}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="mt-4 flex flex-wrap gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              <AssignmentBadge
                assignedAdminName={assignedAdminName}
                assignedAdminInitial={assignedAdminInitial}
              />

              {healthSignals.map((signal) => (
                <SignalBadge
                  key={`${signal.label}-${signal.tone}`}
                  {...signal}
                />
              ))}

              {!safePermissions.canDelete && !compact ? (
                <SignalBadge
                  label="Delete locked"
                  tone="muted"
                  icon={Trash2}
                />
              ) : null}
            </div>
          </header>

          {!compact ? (
            <section className="mt-4 grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-[1.35rem] border-2 border-orange-300 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF5A0A] text-white shadow-[0_12px_26px_rgba(255,75,18,0.20)]">
                    <WandSparkles size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FF5A0A]">
                          AI Counselor Signal
                        </p>
                        <h3 className="mt-1 text-sm font-black text-[#123865]">
                          Recommended next move
                        </h3>
                      </div>

                      <span className="rounded-full border-2 border-orange-300 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#FF5A0A]">
                        Conversion {aiLead.ai_conversion_probability}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-medium leading-6 text-[#526178]">
                      {aiLead.ai_recommended_action}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-[#71809a]">
                      Open the real GPT workspace for counselor-facing analysis
                      and response drafting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <MetricMiniCard
                  label="AI Score"
                  value={aiLead.ai_score}
                  helper="Lead intelligence"
                  tone="orange"
                />

                <MetricMiniCard
                  label="Profile Completeness"
                  value={`${completeness}%`}
                  helper={
                    completeness >= 80
                      ? "Ready for detailed counseling"
                      : "More student data would help"
                  }
                  tone={completeness >= 80 ? "green" : "blue"}
                />
              </div>
            </section>
          ) : null}

          <section
            onClick={(event) => event.stopPropagation()}
            className="mt-4"
          >
            <div className="rounded-[1.4rem] border-2 border-orange-300 bg-white p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#71809a]">
                    Quick Contact
                  </p>

                  <p className="mt-1 text-xs font-semibold text-[#526178]">
                    Reach the student without opening another screen.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <QuickAction
                    label="Email"
                    icon={Mail}
                    disabled={!contactLinks.email}
                    onClick={(event) =>
                      openExternal(event, contactLinks.email)
                    }
                  />

                  <QuickAction
                    label="Call"
                    icon={Phone}
                    disabled={!contactLinks.phone}
                    onClick={(event) =>
                      openExternal(event, contactLinks.phone)
                    }
                  />

                  <QuickAction
                    label="WhatsApp"
                    icon={MessageCircle}
                    disabled={!contactLinks.whatsapp}
                    onClick={(event) =>
                      openExternal(event, contactLinks.whatsapp)
                    }
                    primary
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setDetailsExpanded((current) => !current);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-[1.2rem] border-2 border-orange-300 bg-[#FFF8EF] px-4 py-3 text-left hover:border-orange-200 hover:bg-[#FFF2E8] ${TRANSITION}`}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#FF5A0A]">
                  Student Snapshot
                </p>

                <p className="mt-1 text-xs font-semibold text-[#526178]">
                  Contact, destination, study interest and ownership.
                </p>
              </div>

              <ChevronDown
                size={17}
                className={`shrink-0 text-[#FF5A0A] ${TRANSITION} ${
                  detailsExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {detailsExpanded ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={MOTION}
                  className="overflow-hidden"
                >
                  <div className="grid gap-2.5 pt-3 sm:grid-cols-2 sm:gap-3">
                    <InfoCard
                      label="Email"
                      value={inquiry.email}
                      icon={Mail}
                      onCopy={() => copyValue("email", inquiry.email)}
                      copied={copiedField === "email"}
                    />

                    {!compact ? (
                      <InfoCard
                        label="Phone"
                        value={inquiry.phone}
                        icon={Phone}
                        onCopy={() => copyValue("phone", inquiry.phone)}
                        copied={copiedField === "phone"}
                      />
                    ) : null}

                    {!compact ? (
                      <InfoCard
                        label="Country"
                        value={inquiry.country}
                        icon={MapPin}
                      />
                    ) : null}

                    {!compact ? (
                      <InfoCard
                        label="Interest"
                        value={
                          inquiry.field_of_interest ||
                          inquiry.study_level
                        }
                        icon={GraduationCap}
                      />
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>

          <section
            onClick={(event) => event.stopPropagation()}
            className="mt-4 grid gap-3 lg:grid-cols-2"
          >
            <ControlCard
              label="Priority"
              helper="Controls lead attention and queue ordering."
              icon={ActivePriorityIcon}
              iconClass={activePriority.badge}
            >
              <select
                value={priority}
                onChange={(event) =>
                  handlePriorityUpdate(event.target.value)
                }
                disabled={!safePermissions.canUpdatePriority}
                className={`mt-3 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-100 ${activePriority.badge} ${
                  !safePermissions.canUpdatePriority
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }`}
              >
                <option value="low" className="bg-white text-[#123865]">
                  Low
                </option>
                <option value="medium" className="bg-white text-[#123865]">
                  Medium
                </option>
                <option value="high" className="bg-white text-[#123865]">
                  High
                </option>
                <option value="vip" className="bg-white text-[#123865]">
                  VIP
                </option>
              </select>
            </ControlCard>

            <ControlCard
              label="Consultancy Pipeline"
              helper="Move the student through the operational journey."
              icon={ActiveStageIcon}
              iconClass={activeStage.badge}
            >
              <select
                value={status}
                onChange={(event) =>
                  handlePipelineUpdate(event.target.value)
                }
                disabled={!safePermissions.canUpdateStatus}
                className={`mt-3 w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-100 ${activeStage.badge} ${
                  !safePermissions.canUpdateStatus
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }`}
              >
                {PIPELINE_STAGES.map((stage) => (
                  <option
                    key={stage.value}
                    value={stage.value}
                    className="bg-white text-[#123865]"
                  >
                    {stage.emoji} {stage.label}
                  </option>
                ))}
              </select>
            </ControlCard>
          </section>

          <section
            onClick={(event) => event.stopPropagation()}
            className="mt-4"
          >
            <div className="overflow-hidden rounded-[1.4rem] border-2 border-orange-300 bg-[#123865] text-white shadow-[0_18px_44px_rgba(7,31,80,0.14)]">
              <button
                type="button"
                onClick={() =>
                  setPipelineExpanded((current) => !current)
                }
                className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb36d] ring-1 ring-white/10">
                      <Target size={11} />
                      Pipeline Progress
                    </span>

                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
                      {activeStage.progress}% complete
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-black">
                    {activeStage.label}
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-white/65">
                    {nextStage
                      ? `Next recommended stage: ${nextStage.label}`
                      : "This student has reached the final pipeline stage."}
                  </p>
                </div>

                <ChevronDown
                  size={19}
                  className={`shrink-0 text-[#ffb36d] ${TRANSITION} ${
                    pipelineExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={false}
                    animate={{ width: `${activeStage.progress}%` }}
                    transition={{ duration: 0.55, ease: MOTION.ease }}
                    className="h-full rounded-full bg-gradient-to-r from-[#FF5A0A] via-[#ff7b1c] to-[#ffb36d]"
                  />
                </div>

                <AnimatePresence initial={false}>
                  {pipelineExpanded ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={MOTION}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
                        {PIPELINE_STAGES.map((stage) => {
                          const StageIcon = stage.icon;
                          const isActive =
                            stage.value === activeStage.value;
                          const isPassed =
                            stage.progress < activeStage.progress;

                          return (
                            <button
                              key={stage.value}
                              type="button"
                              onClick={() =>
                                handlePipelineUpdate(stage.value)
                              }
                              disabled={
                                !safePermissions.canUpdateStatus
                              }
                              className={`rounded-2xl border p-3 text-left ${TRANSITION} ${
                                isActive
                                  ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_12px_26px_rgba(255,75,18,0.20)]"
                                  : isPassed
                                  ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-[0_10px_22px_rgba(255,75,18,0.18)] hover:bg-[#ff642f]"
                                  : "border-white/10 bg-white/10 text-white/70 hover:-translate-y-0.5 hover:bg-white/14"
                              } ${
                                !safePermissions.canUpdateStatus
                                  ? "cursor-not-allowed opacity-60"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <StageIcon size={15} />
                                {isPassed ? (
                                  <Check size={13} />
                                ) : (
                                  <span className="text-[9px] font-black">
                                    {stage.progress}%
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-[10px] font-black">
                                {stage.shortLabel}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {!compact ? (
            <section className="mt-4 rounded-[1.35rem] border-2 border-orange-300 bg-[#FFF8EF] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-[#FF5A0A]" />

                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FF5A0A]">
                  Student Message
                </p>
              </div>

              <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-[#526178]">
                {inquiry.message || "No message provided."}
              </p>
            </section>
          ) : null}

          <footer
            onClick={(event) => event.stopPropagation()}
            className="mt-4 border-t border-orange-100 pt-4 sm:mt-5 sm:pt-5"
          >
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={openRealGptWorkspace}
                className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#FF5A0A] px-5 py-3 text-xs font-black text-white shadow-[0_14px_30px_rgba(255,75,18,0.18)] hover:-translate-y-1 hover:bg-[#ff642f] sm:text-sm ${TRANSITION}`}
              >
                <Bot size={16} />
                Real GPT Workspace
              </button>

              <button
                type="button"
                onClick={() => openModal(inquiry)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border-2 border-orange-300 bg-white px-5 py-3 text-xs font-black text-[#123865] hover:-translate-y-1 hover:border-orange-200 hover:bg-[#FFF2E8] hover:text-[#FF5A0A] sm:text-sm ${TRANSITION}`}
              >
                <Eye size={16} />
                Open CRM Profile
              </button>

              {!compact ? (
                <button
                  type="button"
                  onClick={() =>
                    handlePipelineUpdate("contacted")
                  }
                  disabled={
                    !safePermissions.canUpdateStatus ||
                    status === "contacted"
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-black sm:text-sm ${TRANSITION} ${
                    safePermissions.canUpdateStatus &&
                    status !== "contacted"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:-translate-y-1 hover:bg-emerald-100"
                      : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  <CheckCircle2 size={16} />
                  {status === "contacted"
                    ? "Already Contacted"
                    : "Mark Contacted"}
                </button>
              ) : null}

              {!compact ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!safePermissions.canDelete}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-black sm:text-sm ${TRANSITION} ${
                    safePermissions.canDelete
                      ? "border border-red-200 bg-white text-red-700 hover:-translate-y-1 hover:bg-red-50"
                      : "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  <Trash2 size={16} />
                  {safePermissions.canDelete
                    ? "Delete Inquiry"
                    : "Delete Locked"}
                </button>
              ) : null}
            </div>

            {!compact && nextStage ? (
              <div className="mt-3 flex flex-col gap-3 rounded-[1.2rem] border-2 border-orange-300 bg-[#FFF8EF] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#71809a]">
                    Suggested workflow move
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#123865]">
                    Advance to {nextStage.label}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handlePipelineUpdate(nextStage.value)
                  }
                  disabled={!safePermissions.canUpdateStatus}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-white px-4 py-2.5 text-xs font-black text-[#FF5A0A] hover:-translate-y-0.5 hover:bg-[#FFF2E8] ${TRANSITION} ${
                    !safePermissions.canUpdateStatus
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  }`}
                >
                  Advance Stage
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : null}
          </footer>
        </div>
      </motion.article>

      <AnimatePresence>
        {showDeleteConfirm ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-[#123865]/35 px-4 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={MOTION}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-6 shadow-[0_28px_90px_rgba(7,31,80,0.20)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={24} />
              </div>

              <h3 className="mt-4 text-2xl font-black tracking-tight text-[#123865]">
                Delete this inquiry?
              </h3>

              <p className="mt-3 text-sm font-medium leading-6 text-[#526178]">
                This will remove{" "}
                <span className="font-black text-[#123865]">
                  {inquiry.full_name || "this student inquiry"}
                </span>{" "}
                from the CRM. This action should only be used when the record is
                truly no longer needed.
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`rounded-full border-2 border-orange-300 bg-white px-5 py-3 text-sm font-black text-[#123865] hover:bg-[#FFF2E8] ${TRANSITION}`}
                >
                  Keep Inquiry
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  className={`rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white hover:-translate-y-0.5 hover:bg-red-700 ${TRANSITION}`}
                >
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

function QuickAction({
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION} ${
        disabled
          ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400"
          : primary
          ? "bg-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,75,18,0.18)] hover:-translate-y-0.5 hover:bg-[#ff642f]"
          : "border-2 border-orange-300 bg-white text-[#123865] hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#FFF2E8] hover:text-[#FF5A0A]"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function MetricMiniCard({
  label,
  value,
  helper,
  tone = "orange",
}) {
  const tones = {
    orange:
      "border-orange-300 bg-[#fff0e8] text-[#c2410c]",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-[1.25rem] border p-4 ${tones[tone] || tones.orange}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">{value}</p>

      <p className="mt-1 text-[10px] font-semibold opacity-70">
        {helper}
      </p>
    </div>
  );
}

function ControlCard({
  label,
  helper,
  icon: Icon,
  iconClass,
  children,
}) {
  return (
    <div className="rounded-[1.3rem] border-2 border-orange-300 bg-[#FFF8EF] p-4 hover:border-[#FF7A2F] hover:bg-white">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
        >
          <Icon size={16} />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#123865]">
            {label}
          </p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#71809a]">
            {helper}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function AssignmentBadge({
  assignedAdminName,
  assignedAdminInitial,
}) {
  if (!assignedAdminName) {
    return (
      <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border-2 border-orange-300 bg-[#FFF2E8] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FF5A0A] shadow-sm sm:px-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-orange-300 bg-white text-[9px]">
          !
        </span>

        <span className="truncate">Unassigned</span>
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700 shadow-sm sm:px-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-200 bg-white text-[9px] font-black text-cyan-700">
        {assignedAdminInitial}
      </span>

      <span className="max-w-[150px] truncate sm:max-w-[220px]">
        Assigned: {assignedAdminName}
      </span>
    </span>
  );
}

function SignalBadge({
  label,
  tone = "info",
  icon: Icon,
}) {
  const tones = {
    danger:
      "border-red-200 bg-red-50 text-red-700",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    info:
      "border-blue-200 bg-blue-50 text-blue-700",
    muted:
      "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] ${
        tones[tone] || tones.info
      }`}
    >
      {Icon ? <Icon size={11} /> : null}
      {label}
    </span>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  onCopy,
  copied = false,
}) {
  return (
    <div className="group/info min-w-0 rounded-[1.15rem] border border-[#123865]/20 bg-[#FFF8EF] p-3 shadow-[0_1px_0_rgba(7,31,80,0.03)] hover:-translate-y-0.5 hover:border-[#FF7A2F] hover:bg-white sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon size={13} className="text-[#FF5A0A]" />
            ) : null}

            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#71809a]">
              {label}
            </p>
          </div>

          <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#526178]">
            {value || "-"}
          </p>
        </div>

        {onCopy && value ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCopy();
            }}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-[#71809a] opacity-100 hover:border-orange-200 hover:text-[#FF5A0A] sm:opacity-0 sm:group-hover/info:opacity-100 ${TRANSITION}`}
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check size={13} />
            ) : (
              <Copy size={13} />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default InquiryCard;
