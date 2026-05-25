import { motion } from "framer-motion";

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
  const status = inquiry.status || "new";
  const priority = inquiry.priority || "low";

  const assignedAdminName =
    inquiry.assigned_admin_name ||
    inquiry.assigned_to_name ||
    inquiry.assigned_to ||
    inquiry.assigned_admin_email ||
    null;

  const assignedAdminInitial = assignedAdminName
    ? assignedAdminName.trim().charAt(0).toUpperCase()
    : "?";

  const safePermissions = {
    canDelete: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    ...permissions,
  };

  const roleConfig = {
    staff: {
      label: "Staff",
      icon: "🧑‍💼",
      badge: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    },
    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    },
    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-purple-400/25 bg-purple-500/10 text-purple-300",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;

  const priorityStyles = {
    vip: {
      badge: "border-purple-400/40 bg-purple-500/10 text-purple-300",
      card:
        "border-purple-400/25 hover:border-purple-400/50 hover:shadow-[0_20px_60px_rgba(168,85,247,0.12)]",
      glow: "bg-purple-500/10 group-hover:bg-purple-500/20",
      icon: "👑",
    },
    high: {
      badge: "border-red-400/40 bg-red-500/10 text-red-300",
      card:
        "border-red-400/25 hover:border-red-400/50 hover:shadow-[0_20px_60px_rgba(239,68,68,0.12)]",
      glow: "bg-red-500/10 group-hover:bg-red-500/20",
      icon: "🔥",
    },
    medium: {
      badge: "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]",
      card:
        "border-[#D4AF37]/20 hover:border-[#D4AF37]/45 hover:shadow-[0_20px_60px_rgba(212,175,55,0.08)]",
      glow: "bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20",
      icon: "⭐",
    },
    low: {
      badge: "border-white/10 bg-white/[0.04] text-gray-400",
      card:
        "border-white/10 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.04)]",
      glow: "bg-white/5 group-hover:bg-white/10",
      icon: "🌙",
    },
  };

  const pipelineStages = [
    {
      value: "new",
      label: "New Lead",
      shortLabel: "New",
      icon: "✨",
      badge: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
      dot: "bg-[#D4AF37]",
      progress: 12,
    },
    {
      value: "contacted",
      label: "Contacted",
      shortLabel: "Contacted",
      icon: "📞",
      badge: "border-green-500/30 bg-green-500/10 text-green-400",
      dot: "bg-green-400",
      progress: 25,
    },
    {
      value: "documents_pending",
      label: "Documents Pending",
      shortLabel: "Docs Pending",
      icon: "📄",
      badge: "border-orange-400/30 bg-orange-500/10 text-orange-300",
      dot: "bg-orange-300",
      progress: 40,
    },
    {
      value: "applied",
      label: "Application Submitted",
      shortLabel: "Applied",
      icon: "📨",
      badge: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      dot: "bg-blue-300",
      progress: 55,
    },
    {
      value: "offer_letter",
      label: "Offer Letter",
      shortLabel: "Offer",
      icon: "🏆",
      badge: "border-purple-400/30 bg-purple-500/10 text-purple-300",
      dot: "bg-purple-300",
      progress: 70,
    },
    {
      value: "visa_process",
      label: "Visa Process",
      shortLabel: "Visa",
      icon: "🛂",
      badge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
      dot: "bg-cyan-300",
      progress: 85,
    },
    {
      value: "approved",
      label: "Approved",
      shortLabel: "Approved",
      icon: "✅",
      badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      dot: "bg-emerald-300",
      progress: 100,
    },
  ];

  const activePriority = priorityStyles[priority] || priorityStyles.low;
  const activeStage =
    pipelineStages.find((stage) => stage.value === status) || pipelineStages[0];

  const handleDelete = () => {
    if (!safePermissions.canDelete || !deleteInquiry) {
      alert("Only Admin and Super Admin can delete inquiries.");
      return;
    }

    deleteInquiry(inquiry.id);
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

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      onClick={() => openModal(inquiry)}
      className={`${cardClass} group relative cursor-pointer overflow-hidden rounded-[1.5rem] border ${activePriority.card} bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-black/30 p-4 backdrop-blur-xl transition duration-500 sm:rounded-[2rem] sm:p-5`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition duration-700 sm:h-48 sm:w-48 ${activePriority.glow}`}
      ></div>

      {!assignedAdminName && (
        <div className="pointer-events-none absolute -left-24 top-10 h-44 w-44 rounded-full bg-orange-500/5 blur-3xl transition duration-700 group-hover:bg-orange-500/10"></div>
      )}

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-3 border-b border-white/10 pb-4 sm:gap-4 sm:pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
              Inquiry Lead
            </p>

            <h2 className="mt-1.5 break-words text-xl font-bold leading-tight text-white sm:mt-2 sm:text-2xl">
              {inquiry.full_name || "Unnamed Student"}
            </h2>
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

        <div
          className="flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${activePriority.badge}`}
          >
            {activePriority.icon} {priority}
          </span>

          <span
            className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${activeStage.badge}`}
          >
            {activeStage.icon} {activeStage.shortLabel}
          </span>

          <AssignmentBadge
            assignedAdminName={assignedAdminName}
            assignedAdminInitial={assignedAdminInitial}
          />

          {!safePermissions.canDelete && !compact && (
            <span className="w-fit shrink-0 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">
              Delete Locked
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-2">
        <InfoCard label="Email" value={inquiry.email} />

        {!compact && <InfoCard label="Phone" value={inquiry.phone} />}

        {!compact && <InfoCard label="Country" value={inquiry.country} />}

        {!compact && (
          <InfoCard
            label="Interest"
            value={inquiry.field_of_interest || inquiry.study_level}
          />
        )}

        <div
          onClick={(event) => event.stopPropagation()}
          className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] sm:rounded-[1.25rem] sm:p-4"
        >
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
            Priority
          </p>

          <select
            value={priority}
            onChange={(event) => handlePriorityUpdate(event.target.value)}
            disabled={!safePermissions.canUpdatePriority}
            className={`mt-2 w-full rounded-xl border bg-black/30 px-3 py-2 text-sm font-semibold outline-none transition duration-300 ${activePriority.badge} ${
              !safePermissions.canUpdatePriority
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
          >
            <option value="low" className="bg-[#111111] text-white">
              Low
            </option>
            <option value="medium" className="bg-[#111111] text-white">
              Medium
            </option>
            <option value="high" className="bg-[#111111] text-white">
              High
            </option>
            <option value="vip" className="bg-[#111111] text-white">
              VIP
            </option>
          </select>
        </div>

        <div
          onClick={(event) => event.stopPropagation()}
          className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] sm:rounded-[1.25rem] sm:p-4 lg:col-span-2"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
              Consultancy Pipeline
            </p>

            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
              {activeStage.progress}%
            </span>
          </div>

          <select
            value={status}
            onChange={(event) => handlePipelineUpdate(event.target.value)}
            disabled={!safePermissions.canUpdateStatus}
            className={`mt-2 w-full rounded-xl border bg-black/30 px-3 py-2 text-sm font-semibold outline-none transition duration-300 ${activeStage.badge} ${
              !safePermissions.canUpdateStatus
                ? "cursor-not-allowed opacity-60"
                : ""
            }`}
          >
            {pipelineStages.map((stage) => (
              <option key={stage.value} value={stage.value} className="bg-[#111111] text-white">
                {stage.icon} {stage.label}
              </option>
            ))}
          </select>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-cyan-300 to-emerald-300 transition-all duration-500"
              style={{ width: `${activeStage.progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="relative mt-4 rounded-[1.2rem] border border-white/10 bg-black/25 p-4 transition duration-300 group-hover:border-[#D4AF37]/20 sm:mt-5 sm:rounded-[1.4rem] sm:p-5">
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Message
          </p>

          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300 sm:mt-3">
            {inquiry.message || "No message provided."}
          </p>
        </div>
      )}

      <div
        onClick={(event) => event.stopPropagation()}
        className="relative mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4 sm:mt-5 sm:gap-3 sm:pt-5"
      >
        <button
          type="button"
          onClick={() => openModal(inquiry)}
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white transition duration-300 hover:border-[#D4AF37]/30 hover:bg-white/[0.08] sm:px-6 sm:py-3 sm:text-sm"
        >
          Open CRM Profile
        </button>

        {!compact && (
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => handlePipelineUpdate("contacted")}
              disabled={!safePermissions.canUpdateStatus || status === "contacted"}
              className={`w-full rounded-full px-4 py-2.5 text-xs font-semibold transition duration-300 sm:px-6 sm:py-3 sm:text-sm ${
                safePermissions.canUpdateStatus && status !== "contacted"
                  ? "bg-[#D4AF37] text-black hover:-translate-y-0.5 hover:bg-[#E7C768]"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-gray-500"
              }`}
            >
              Mark Contacted
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!safePermissions.canDelete}
              className={`w-full rounded-full px-4 py-2.5 text-xs font-semibold transition duration-300 sm:px-6 sm:py-3 sm:text-sm ${
                safePermissions.canDelete
                  ? "border border-red-500/30 text-red-400 hover:-translate-y-0.5 hover:bg-red-500/10"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-gray-500"
              }`}
            >
              {safePermissions.canDelete ? "Delete Inquiry" : "Delete Locked"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AssignmentBadge({ assignedAdminName, assignedAdminInitial }) {
  if (!assignedAdminName) {
    return (
      <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300 shadow-[0_0_24px_rgba(249,115,22,0.08)] sm:px-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-300/20 bg-orange-400/10 text-[9px]">
          !
        </span>
        <span className="truncate">Unassigned</span>
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.08)] sm:px-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/15 text-[9px] font-black text-cyan-200">
        {assignedAdminInitial}
      </span>
      <span className="max-w-[150px] truncate sm:max-w-[220px]">
        Assigned: {assignedAdminName}
      </span>
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] sm:rounded-[1.25rem] sm:p-4">
      <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm leading-relaxed text-gray-200 sm:mt-2">
        {value || "-"}
      </p>
    </div>
  );
}

export default InquiryCard;