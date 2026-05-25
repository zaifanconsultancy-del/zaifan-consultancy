import { motion } from "framer-motion";

function InquiryCard({
  inquiry,
  cardClass,
  updateInquiryStatus,
  updateInquiryPriority,
  deleteInquiry,
  openModal,
  compact = false,
  role = "staff",
  permissions = {},
}) {
  const status = inquiry.status || "new";
  const priority = inquiry.priority || "low";

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
    },
    high: {
      badge: "border-red-400/40 bg-red-500/10 text-red-300",
      card:
        "border-red-400/25 hover:border-red-400/50 hover:shadow-[0_20px_60px_rgba(239,68,68,0.12)]",
      glow: "bg-red-500/10 group-hover:bg-red-500/20",
    },
    medium: {
      badge: "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]",
      card:
        "border-[#D4AF37]/20 hover:border-[#D4AF37]/45 hover:shadow-[0_20px_60px_rgba(212,175,55,0.08)]",
      glow: "bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20",
    },
    low: {
      badge: "border-white/10 bg-white/[0.04] text-gray-400",
      card:
        "border-white/10 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.04)]",
      glow: "bg-white/5 group-hover:bg-white/10",
    },
  };

  const activePriority = priorityStyles[priority] || priorityStyles.low;

  const handleDelete = () => {
    if (!safePermissions.canDelete || !deleteInquiry) {
      alert("Only Admin and Super Admin can delete inquiries.");
      return;
    }

    deleteInquiry(inquiry.id);
  };

  const handleStatusUpdate = () => {
    if (!safePermissions.canUpdateStatus) {
      alert("You do not have permission to update inquiry status.");
      return;
    }

    updateInquiryStatus(inquiry.id, status);
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

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-3 border-b border-white/10 pb-4 sm:gap-4 sm:pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
              Student Name
            </p>

            <h2 className="mt-1.5 break-words text-xl font-bold leading-tight text-white sm:mt-2 sm:text-2xl">
              {inquiry.full_name || "Unnamed Student"}
            </h2>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] ${currentRole.badge}`}
          >
            <span>{currentRole.icon}</span>
            {currentRole.label}
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${activePriority.badge}`}
          >
            {priority}
          </span>

          <span
            className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              status === "contacted"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
            }`}
          >
            {status}
          </span>

          {!safePermissions.canDelete && (
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
          onClick={() => openModal(inquiry)}
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white transition duration-300 hover:border-[#D4AF37]/30 hover:bg-white/[0.08] sm:px-6 sm:py-3 sm:text-sm"
        >
          Open CRM
        </button>

        {!compact && (
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={handleStatusUpdate}
              disabled={!safePermissions.canUpdateStatus}
              className={`w-full rounded-full px-4 py-2.5 text-xs font-semibold transition duration-300 sm:px-6 sm:py-3 sm:text-sm ${
                safePermissions.canUpdateStatus
                  ? "bg-[#D4AF37] text-black hover:-translate-y-0.5 hover:bg-[#E7C768]"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-gray-500"
              }`}
            >
              {status === "contacted"
                ? "Mark as New"
                : "Mark Contacted"}
            </button>

            <button
              onClick={handleDelete}
              disabled={!safePermissions.canDelete}
              className={`w-full rounded-full px-4 py-2.5 text-xs font-semibold transition duration-300 sm:px-6 sm:py-3 sm:text-sm ${
                safePermissions.canDelete
                  ? "border border-red-500/30 text-red-400 hover:-translate-y-0.5 hover:bg-red-500/10"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-gray-500"
              }`}
            >
              {safePermissions.canDelete
                ? "Delete Inquiry"
                : "Delete Locked"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] sm:rounded-[1.25rem] sm:p-4">
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