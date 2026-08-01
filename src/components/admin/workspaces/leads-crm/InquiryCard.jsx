// InquiryCard PARTNER OS EXTREME V3 — Compact Framed Lead Command Record
// src/components/admin/InquiryCard.jsx
//
// Complete visual redesign:
// - preserves every prop, callback, permission check, AI enrichment, contact action,
//   clipboard action, pipeline action, delete confirmation, compact mode and state
// - establishes the benchmark card system for the future AppointmentCard redesign
// - uses the locked Partner OS navy / orange / cream hierarchy
// - removes decorative blobs, soft toy-like styling and weak nested card treatment
// - introduces a mature command header, action rail, intelligence brief,
//   operational controls, pipeline command strip and protected destructive action
// - adds stronger min-w-0 containment, responsive wrapping and focus states

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
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const PRIORITY_STYLES = {
  vip: {
    badge: "border-[#FF5A0A] bg-[#FFF1E8] text-orange-800",
    icon: Crown,
    dot: "bg-[#FF5A0A]",
    label: "VIP",
  },
  high: {
    badge: "border-red-400 bg-red-50 text-red-800",
    icon: Flame,
    dot: "bg-red-500",
    label: "High",
  },
  medium: {
    badge: "border-orange-300 bg-orange-50 text-orange-800",
    icon: Star,
    dot: "bg-orange-500",
    label: "Medium",
  },
  low: {
    badge: "border-slate-300 bg-slate-50 text-slate-700",
    icon: Target,
    dot: "bg-slate-400",
    label: "Low",
  },
};

const ROLE_CONFIG = {
  staff: {
    label: "Staff",
    icon: UserRound,
    badge: "border-blue-300 bg-blue-50 text-blue-800",
  },
  admin: {
    label: "Admin",
    icon: UserCheck,
    badge: "border-[#FF5A0A] bg-[#FFF1E8] text-orange-800",
  },
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    badge: "border-violet-300 bg-violet-50 text-violet-800",
  },
};

const PIPELINE_STAGES = [
  {
    value: "new",
    label: "New Student",
    shortLabel: "New",
    icon: Sparkles,
    emoji: "✨",
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
    progress: 12,
  },
  {
    value: "contacted",
    label: "Contacted",
    shortLabel: "Contacted",
    icon: Phone,
    emoji: "📞",
    badge: "border-cyan-300 bg-cyan-50 text-cyan-800",
    dot: "bg-cyan-500",
    progress: 25,
  },
  {
    value: "documents_pending",
    label: "Documents Pending",
    shortLabel: "Docs Pending",
    icon: FileText,
    emoji: "📄",
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    progress: 40,
  },
  {
    value: "applied",
    label: "Application Submitted",
    shortLabel: "Applied",
    icon: ClipboardCheck,
    emoji: "📨",
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    dot: "bg-blue-500",
    progress: 55,
  },
  {
    value: "offer_letter",
    label: "Offer Letter",
    shortLabel: "Offer",
    icon: BadgeCheck,
    emoji: "🏆",
    badge: "border-violet-300 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
    progress: 70,
  },
  {
    value: "visa_process",
    label: "Visa Process",
    shortLabel: "Visa",
    icon: BriefcaseBusiness,
    emoji: "🛂",
    badge: "border-cyan-300 bg-cyan-50 text-cyan-800",
    dot: "bg-cyan-500",
    progress: 85,
  },
  {
    value: "approved",
    label: "Approved",
    shortLabel: "Approved",
    icon: CheckCircle2,
    emoji: "✅",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
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
        className={`${cardClass} group relative min-w-0 cursor-pointer overflow-hidden rounded-[1.85rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2 shadow-[0_18px_50px_rgba(18,56,101,0.12)] ${TRANSITION} hover:border-[#FF5A0A] hover:shadow-[0_24px_65px_rgba(18,56,101,0.16)] sm:p-2.5`}
      >
        <div className="min-w-0 overflow-hidden rounded-[1.35rem] border-[2px] border-[#FF5A0A] bg-white">
        <div className="min-w-0">
          <header className="min-w-0 bg-[#123865] p-4 text-white sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CommandBadge icon={GraduationCap}>
                Student Inquiry
              </CommandBadge>

              <span
                className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${activeStage.badge}`}
              >
                <ActiveStageIcon size={11} />
                {activeStage.shortLabel}
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${activePriority.badge}`}
              >
                <ActivePriorityIcon size={11} />
                {activePriority.label}
              </span>
            </div>

            <div className="mt-3 flex min-w-0 flex-col gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                  Lead Command Record
                </p>

                <h2 className="mt-1 min-w-0 whitespace-normal [overflow-wrap:break-word] text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
                  {inquiry.full_name || "Unnamed Student"}
                </h2>

                <p className="mt-2 min-w-0 whitespace-normal [overflow-wrap:break-word] text-sm font-semibold leading-6 text-slate-200">
                  {inquiry.country || "Country not provided"}
                  <span className="mx-2 text-orange-300">·</span>
                  {inquiry.field_of_interest ||
                    inquiry.study_level ||
                    "Study interest not provided"}
                </p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <AssignmentBadge
                  assignedAdminName={assignedAdminName}
                  assignedAdminInitial={assignedAdminInitial}
                  dark
                />

                {!compact ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${currentRole.badge}`}
                  >
                    <CurrentRoleIcon size={11} />
                    {currentRole.label}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              className="mt-4 flex min-w-0 flex-wrap gap-2"
              onClick={(event) => event.stopPropagation()}
            >
              {healthSignals.map((signal) => (
                <SignalBadge
                  key={`${signal.label}-${signal.tone}`}
                  {...signal}
                  dark
                />
              ))}

              {!safePermissions.canDelete && !compact ? (
                <SignalBadge
                  label="Delete locked"
                  tone="muted"
                  icon={Trash2}
                  dark
                />
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
                  AI Lead Intelligence
                </p>

                <p className="mt-1 text-xs font-semibold text-orange-50">
                  Evidence-led priority signal
                </p>
              </div>

              <Bot size={23} className="shrink-0 text-white" />
            </div>

            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
              <OrangeMetric
                label={aiLead.ai_tier.badge}
                value={`${aiLead.ai_score}/100`}
              />

              <OrangeMetric
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
              <Bot size={15} />
              Open AI Workspace
              <ChevronRight size={14} />
            </button>
          </aside>
        </div>

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
                Contact the student or open the complete CRM record without
                losing this queue position.
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap gap-2 [container-type:inline-size]">
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

              <QuickAction
                label="Open Profile"
                icon={Eye}
                onClick={() => openModal(inquiry)}
                navy
              />
            </div>
          </div>
        </div>

        <div
          className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-3"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() =>
              setWorkspaceExpanded((current) => !current)
            }
            aria-expanded={workspaceExpanded}
            className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl border-[3px] border-[#123865] bg-white px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
          >
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Operational Workspace
              </p>
              <p className="mt-1 break-words text-xs font-semibold text-slate-600">
                {workspaceExpanded
                  ? "Hide counselor controls, pipeline, snapshot and record actions."
                  : "Open counselor controls, pipeline, snapshot and record actions."}
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
              transition={MOTION}
              className="min-w-0 overflow-hidden"
            >
              <div className="min-w-0 space-y-4 bg-[#FFF8EF] p-4 sm:p-5">
          {!compact ? (
            <section className="grid min-w-0 gap-3">
              <div className="min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-4 shadow-[0_8px_24px_rgba(18,56,101,0.05)] sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865] bg-[#123865] text-white">
                    <WandSparkles size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                          Counselor Intelligence Brief
                        </p>

                        <h3 className="mt-1 text-base font-black text-[#10233F]">
                          Recommended next move
                        </h3>
                      </div>

                      <span className="inline-flex shrink-0 rounded-full border-2 border-[#FF5A0A] bg-[#FFF4E8] px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-orange-800">
                        AI score {aiLead.ai_score}
                      </span>
                    </div>

                    <p className="mt-3 break-words text-sm font-semibold leading-6 text-slate-700">
                      {aiLead.ai_recommended_action}
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <EvidenceMetric
                        label="Conversion Signal"
                        value={aiLead.ai_conversion_probability}
                        helper="AI-estimated lead movement potential"
                      />

                      <EvidenceMetric
                        label="Profile Readiness"
                        value={`${completeness}%`}
                        helper={
                          completeness >= 80
                            ? "Enough information for detailed counseling"
                            : "Additional student information is still needed"
                        }
                        success={completeness >= 80}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_24px_rgba(18,56,101,0.05)] sm:p-5">
                <SectionTitle
                  eyebrow="Lead Ownership"
                  title="Record health"
                  icon={ShieldAlert}
                />

                <div className="mt-4 space-y-2">
                  <HealthRow
                    label="Assigned owner"
                    value={assignedAdminName || "Unassigned"}
                    tone={assignedAdminName ? "info" : "warning"}
                  />

                  <HealthRow
                    label="Primary contact"
                    value={
                      inquiry.phone || inquiry.email
                        ? "Contact channel available"
                        : "No contact channel"
                    }
                    tone={
                      inquiry.phone || inquiry.email
                        ? "success"
                        : "danger"
                    }
                  />

                  <HealthRow
                    label="Current stage"
                    value={activeStage.label}
                    tone="info"
                  />

                  <HealthRow
                    label="Record priority"
                    value={activePriority.label}
                    tone={
                      priority === "high" || priority === "vip"
                        ? "danger"
                        : "neutral"
                    }
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section
            onClick={(event) => event.stopPropagation()}
            className="grid min-w-0 gap-3"
          >
            <ControlCard
              label="Priority Command"
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
                className={`mt-3 min-h-11 min-w-0 w-full max-w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm font-black outline-none transition focus:ring-4 focus:ring-orange-100 ${activePriority.badge} ${
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
              label="Pipeline Command"
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
                className={`mt-3 min-h-11 min-w-0 w-full max-w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm font-black outline-none transition focus:ring-4 focus:ring-orange-100 ${activeStage.badge} ${
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
            className="min-w-0"
          >
            <button
              type="button"
              onClick={() =>
                setPipelineExpanded((current) => !current)
              }
              className="flex min-w-0 w-full items-center justify-between gap-4 rounded-t-[1.45rem] border-[3px] border-[#123865] bg-[#123865] p-4 text-left text-white transition hover:bg-[#174775] sm:p-5"
            >
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-200">
                    <Target size={11} />
                    Pipeline Command
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-300">
                    {activeStage.progress}% complete
                  </span>
                </div>

                <h3 className="mt-2 break-words text-lg font-black text-white">
                  {activeStage.label}
                </h3>

                <p className="mt-1 break-words text-xs font-semibold text-slate-300">
                  {nextStage
                    ? `Next operational stage: ${nextStage.label}`
                    : "This student has reached the final pipeline stage."}
                </p>
              </div>

              <ChevronDown
                size={19}
                className={`shrink-0 text-orange-200 ${TRANSITION} ${
                  pipelineExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            <div className="rounded-b-[1.45rem] border-x-[3px] border-b-[3px] border-[#123865] bg-white p-4 sm:p-5">
              <div className="h-3 overflow-hidden rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF]">
                <motion.div
                  initial={false}
                  animate={{ width: `${activeStage.progress}%` }}
                  transition={{ duration: 0.55, ease: MOTION.ease }}
                  className="h-full rounded-full bg-[#FF5A0A]"
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
                    <div className="mt-5 grid min-w-0 grid-cols-2 gap-2">
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
                            className={`min-w-0 overflow-hidden rounded-xl border-2 p-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION} ${
                              isActive
                                ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-sm"
                                : isPassed
                                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                : "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600 hover:border-[#FF5A0A] hover:bg-orange-50"
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

                            <p className="mt-2 whitespace-normal [overflow-wrap:break-word] text-[10px] font-black leading-4">
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
          </section>

          <section className="min-w-0">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setDetailsExpanded((current) => !current);
              }}
              className="flex min-w-0 w-full items-center justify-between gap-3 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white px-4 py-3 text-left transition hover:border-[#FF5A0A] hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                  Student Snapshot
                </p>

                <p className="mt-1 break-words text-xs font-semibold text-slate-600">
                  Contact, destination, study interest and ownership.
                </p>
              </div>

              <ChevronDown
                size={17}
                className={`shrink-0 text-orange-700 ${TRANSITION} ${
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
                  <div className="grid min-w-0 gap-3 pt-3 sm:grid-cols-2">
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

          {!compact ? (
            <section className="grid min-w-0 gap-3">
              <div className="min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-orange-700" />

                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                    Student Message
                  </p>
                </div>

                <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700">
                  {inquiry.message || "No message provided."}
                </p>
              </div>

              <div
                className="min-w-0 rounded-[1.3rem] border-[3px] border-[#123865] bg-[#123865] p-4 text-white sm:p-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <Clipboard size={15} className="text-orange-200" />

                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-200">
                    Suggested Move
                  </p>
                </div>

                <p className="mt-3 text-sm font-black text-white">
                  {nextStage
                    ? `Advance to ${nextStage.label}`
                    : "Pipeline complete"}
                </p>

                {nextStage ? (
                  <button
                    type="button"
                    onClick={() =>
                      handlePipelineUpdate(nextStage.value)
                    }
                    disabled={!safePermissions.canUpdateStatus}
                    className={`mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-white/25 bg-white/10 px-4 text-xs font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 ${
                      !safePermissions.canUpdateStatus
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    Advance Stage
                    <ArrowRight size={14} />
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <footer
            onClick={(event) => event.stopPropagation()}
            className="min-w-0 rounded-[1.3rem] border-[3px] border-[#123865] bg-white p-3"
          >
            <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
              <FooterAction
                icon={Bot}
                label="Real GPT Workspace"
                onClick={openRealGptWorkspace}
                tone="orange"
              />

              <FooterAction
                icon={Eye}
                label="Open CRM Profile"
                onClick={() => openModal(inquiry)}
                tone="navy"
              />

              {!compact ? (
                <FooterAction
                  icon={CheckCircle2}
                  label={
                    status === "contacted"
                      ? "Already Contacted"
                      : "Mark Contacted"
                  }
                  onClick={() =>
                    handlePipelineUpdate("contacted")
                  }
                  disabled={
                    !safePermissions.canUpdateStatus ||
                    status === "contacted"
                  }
                  tone={
                    status === "contacted"
                      ? "disabled"
                      : "success"
                  }
                />
              ) : null}

              {!compact ? (
                <FooterAction
                  icon={Trash2}
                  label={
                    safePermissions.canDelete
                      ? "Delete Inquiry"
                      : "Delete Locked"
                  }
                  onClick={handleDelete}
                  disabled={!safePermissions.canDelete}
                  tone={
                    safePermissions.canDelete
                      ? "danger"
                      : "disabled"
                  }
                />
              ) : null}
            </div>
          </footer>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </motion.article>

      <AnimatePresence>
        {showDeleteConfirm ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-[#123865]/55 px-4 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-inquiry-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={MOTION}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-[1.8rem] border-[3px] border-red-500 bg-white shadow-[0_28px_90px_rgba(7,31,80,0.24)]"
            >
              <div className="bg-[#123865] p-5 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-red-300/30 bg-red-400/10 text-red-200">
                  <AlertTriangle size={22} />
                </div>

                <h3
                  id="delete-inquiry-title"
                  className="mt-4 text-2xl font-black tracking-tight text-white"
                >
                  Delete this inquiry?
                </h3>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-sm font-semibold leading-6 text-slate-700">
                  This will remove{" "}
                  <span className="font-black text-[#10233F]">
                    {inquiry.full_name || "this student inquiry"}
                  </span>{" "}
                  from the CRM. Use permanent deletion only when the record
                  should no longer exist.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-xl border-2 border-[#123865] bg-white px-5 py-3 text-sm font-black text-[#123865] transition hover:bg-[#FFF8EF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
                  >
                    Keep Inquiry
                  </button>

                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="rounded-xl border-2 border-red-600 bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function CommandBadge({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-orange-200">
      <Icon size={11} />
      {children}
    </span>
  );
}

function OrangeMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3">
      <p className="break-words text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  primary = false,
  navy = false,
}) {
  const enabledStyle = primary
    ? "border-[#FF5A0A] bg-[#FF5A0A] text-white hover:bg-orange-600"
    : navy
    ? "border-[#123865] bg-[#123865] text-white hover:bg-[#174775]"
    : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#FF5A0A] hover:bg-orange-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : enabledStyle
      }`}
    >
      <Icon size={14} />
      {label}
      {!disabled ? <ExternalLink size={11} className="opacity-60" /> : null}
    </button>
  );
}

function EvidenceMetric({
  label,
  value,
  helper,
  success = false,
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border-2 p-3 ${
        success
          ? "border-emerald-300 bg-emerald-50"
          : "border-[#C9D7E6] bg-[#FFF8EF]"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-black text-[#10233F]">
        {value}
      </p>

      <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  icon: Icon,
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865] bg-[#123865] text-white">
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-base font-black text-[#10233F]">
          {title}
        </h3>
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  tone = "neutral",
}) {
  const tones = {
    success: "border-emerald-300 bg-emerald-50",
    danger: "border-red-300 bg-red-50",
    warning: "border-amber-300 bg-amber-50",
    info: "border-blue-300 bg-blue-50",
    neutral: "border-[#C9D7E6] bg-[#FFF8EF]",
  };

  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border-2 px-3 py-2.5 ${
        tones[tone] || tones.neutral
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="min-w-0 break-words text-right text-xs font-black text-[#10233F]">
        {value}
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
    <div className="min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A]">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${iconClass}`}
        >
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#10233F]">
            {label}
          </p>

          <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
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
  dark = false,
}) {
  if (!assignedAdminName) {
    return (
      <span
        className={`inline-flex max-w-full items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] ${
          dark
            ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
            : "border-amber-300 bg-amber-50 text-amber-800"
        }`}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current text-[9px]">
          !
        </span>
        Unassigned
      </span>
    );
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] ${
        dark
          ? "border-white/20 bg-white/10 text-white"
          : "border-blue-300 bg-blue-50 text-blue-800"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-current text-[9px]">
        {assignedAdminInitial}
      </span>

      <span className="max-w-[190px] truncate">
        {assignedAdminName}
      </span>
    </span>
  );
}

function SignalBadge({
  label,
  tone = "info",
  icon: Icon,
  dark = false,
}) {
  if (dark) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
        {Icon ? <Icon size={11} /> : null}
        {label}
      </span>
    );
  }

  const tones = {
    danger: "border-red-300 bg-red-50 text-red-800",
    warning: "border-amber-300 bg-amber-50 text-amber-800",
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    info: "border-blue-300 bg-blue-50 text-blue-800",
    muted: "border-slate-300 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${
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
    <div className="group/info min-w-0 rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-3 shadow-[0_5px_16px_rgba(18,56,101,0.035)] transition hover:border-[#FF5A0A] sm:p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon size={13} className="shrink-0 text-orange-700" />
            ) : null}

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
              {label}
            </p>
          </div>

          <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
            {value || "Not provided"}
          </p>
        </div>

        {onCopy && value ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCopy();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#C9D7E6] bg-[#FFF8EF] text-slate-600 transition hover:border-[#FF5A0A] hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
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

function FooterAction({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  tone = "navy",
}) {
  const tones = {
    orange:
      "border-[#FF5A0A] bg-[#FF5A0A] text-white hover:bg-orange-600",
    navy:
      "border-[#123865] bg-[#123865] text-white hover:bg-[#174775]",
    success:
      "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600",
    danger:
      "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
    disabled:
      "border-slate-300 bg-slate-50 text-slate-400",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border-2 px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed ${
        tones[tone] || tones.navy
      }`}
    >
      <Icon size={15} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default InquiryCard;
