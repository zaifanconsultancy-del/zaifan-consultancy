import { motion } from "framer-motion";

function InquiryCard({
  inquiry,
  cardClass,
  updateInquiryStatus,
  updateInquiryPriority,
  deleteInquiry,
}) {
  const status = inquiry.status || "new";
  const priority = inquiry.priority || "low";

  const priorityStyles = {
    vip: {
      badge:
        "border-purple-400/40 bg-purple-500/10 text-purple-300",
      card:
        "border-purple-400/25 hover:border-purple-400/50 hover:shadow-[0_20px_60px_rgba(168,85,247,0.12)]",
      glow: "bg-purple-500/10 group-hover:bg-purple-500/20",
    },

    high: {
      badge:
        "border-red-400/40 bg-red-500/10 text-red-300",
      card:
        "border-red-400/25 hover:border-red-400/50 hover:shadow-[0_20px_60px_rgba(239,68,68,0.12)]",
      glow: "bg-red-500/10 group-hover:bg-red-500/20",
    },

    medium: {
      badge:
        "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]",
      card:
        "border-[#D4AF37]/20 hover:border-[#D4AF37]/45 hover:shadow-[0_20px_60px_rgba(212,175,55,0.08)]",
      glow: "bg-[#D4AF37]/10 group-hover:bg-[#D4AF37]/20",
    },

    low: {
      badge:
        "border-white/10 bg-white/[0.04] text-gray-400",
      card:
        "border-white/10 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.04)]",
      glow: "bg-white/5 group-hover:bg-white/10",
    },
  };

  const activePriority =
    priorityStyles[priority] || priorityStyles.low;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} group relative overflow-hidden rounded-[1.5rem] border ${activePriority.card} bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-black/30 p-4 backdrop-blur-xl transition duration-500 sm:rounded-[2rem] sm:p-5`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition duration-700 sm:h-48 sm:w-48 ${activePriority.glow}`}
      ></div>

      <div className="pointer-events-none absolute -bottom-20 left-10 h-36 w-36 rounded-full bg-white/5 blur-3xl sm:h-44 sm:w-44"></div>

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-3 border-b border-white/10 pb-4 sm:gap-4 sm:pb-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Student Name
          </p>

          <h2 className="mt-1.5 break-words text-xl font-bold leading-tight text-white sm:mt-2 sm:text-2xl">
            {inquiry.full_name || "Unnamed Student"}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="relative mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-2">
        <InfoCard label="Email" value={inquiry.email} />
        <InfoCard label="Phone" value={inquiry.phone} />
        <InfoCard label="Country" value={inquiry.country} />

        <div className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] sm:rounded-[1.25rem] sm:p-4">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
            Priority
          </p>

          <select
            value={priority}
            onChange={(event) =>
              updateInquiryPriority(
                inquiry.id,
                event.target.value
              )
            }
            className={`mt-2 w-full rounded-xl border bg-black/30 px-3 py-2 text-sm font-semibold outline-none transition duration-300 ${activePriority.badge}`}
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

      <div className="relative mt-4 rounded-[1.2rem] border border-white/10 bg-black/25 p-4 transition duration-300 group-hover:border-[#D4AF37]/20 sm:mt-5 sm:rounded-[1.4rem] sm:p-5">
        <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
          Message
        </p>

        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300 sm:mt-3">
          {inquiry.message || "No message provided."}
        </p>
      </div>

      <div className="relative mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4 sm:mt-5 sm:gap-3 sm:pt-5 sm:flex-row sm:justify-end">
        <button
          onClick={() =>
            updateInquiryStatus(inquiry.id, status)
          }
          className="w-full rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768] sm:w-fit sm:px-6 sm:py-3 sm:text-sm"
        >
          {status === "contacted"
            ? "Mark as New"
            : "Mark Contacted"}
        </button>

        <button
          onClick={() => deleteInquiry(inquiry.id)}
          className="w-full rounded-full border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/10 sm:w-fit sm:px-6 sm:py-3 sm:text-sm"
        >
          Delete Inquiry
        </button>
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