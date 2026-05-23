import { motion } from "framer-motion";

function InquiryCard({
  inquiry,
  cardClass,
  updateInquiryStatus,
  deleteInquiry,
}) {
  const status = inquiry.status || "new";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} group relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-black/30 p-5 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/45 hover:shadow-[0_20px_60px_rgba(212,175,55,0.07)]`}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl transition duration-700 group-hover:bg-[#D4AF37]/20"></div>
      <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-white/5 blur-3xl"></div>

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
            Student Name
          </p>

          <h2 className="mt-2 break-words text-2xl font-bold leading-tight text-white">
            {inquiry.full_name || "Unnamed Student"}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]
          ${
            status === "contacted"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 lg:grid-cols-2">
        <InfoCard label="Email" value={inquiry.email} singleLine />
        <InfoCard label="Phone" value={inquiry.phone} />
        <InfoCard label="Country" value={inquiry.country} />
        <InfoCard label="Inquiry ID" value={inquiry.id} />
      </div>

      <div className="relative mt-5 rounded-[1.4rem] border border-white/10 bg-black/25 p-5 transition duration-300 group-hover:border-[#D4AF37]/20">
        <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
          Message
        </p>

        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300">
          {inquiry.message || "No message provided."}
        </p>
      </div>

      <div className="relative mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
        <button
          onClick={() =>
            updateInquiryStatus(
              inquiry.id,
              status === "contacted" ? "new" : "contacted"
            )
          }
          className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768]"
        >
          {status === "contacted" ? "Mark as New" : "Mark Contacted"}
        </button>

        <button
          onClick={() => deleteInquiry(inquiry.id)}
          className="rounded-full border border-red-500/30 px-6 py-3 text-sm font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/10"
        >
          Delete Inquiry
        </button>
      </div>
    </motion.div>
  );
}

function InfoCard({ label, value, singleLine = false }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055]">
      <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">
        {label}
      </p>

      <p
        className={`mt-2 text-sm text-gray-200 ${
          singleLine
            ? "overflow-hidden text-ellipsis whitespace-nowrap"
            : "break-words"
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
}

export default InquiryCard;