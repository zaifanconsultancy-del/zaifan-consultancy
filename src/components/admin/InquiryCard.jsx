function InquiryCard({
  inquiry,
  cardClass,
  updateInquiryStatus,
  deleteInquiry,
}) {
  const status = inquiry.status || "new";

  return (
    <div
      className={`${cardClass} group relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-7 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/40`}
    >
      {/* TOP HOVER LINE */}
      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      {/* HEADER */}
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
            Student Name
          </p>

          <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
            {inquiry.full_name || "Unnamed Student"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]
            ${
              status === "contacted"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <InfoCard
          label="Email"
          value={inquiry.email}
          singleLine={true}
        />

        <InfoCard
          label="Phone"
          value={inquiry.phone}
        />

        <InfoCard
          label="Country"
          value={inquiry.country}
        />

        <InfoCard
          label="Inquiry ID"
          value={inquiry.id}
        />
      </div>

      {/* MESSAGE */}
      <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-black/25 p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Message
        </p>

        <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-300">
          {inquiry.message || "No message provided."}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <button
          onClick={() =>
            updateInquiryStatus(
              inquiry.id,
              status === "contacted" ? "new" : "contacted"
            )
          }
          className="rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-semibold text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768]"
        >
          {status === "contacted"
            ? "Mark as New"
            : "Mark Contacted"}
        </button>

        <button
          onClick={() => deleteInquiry(inquiry.id)}
          className="rounded-full border border-red-500/30 px-7 py-3 text-sm font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/10"
        >
          Delete Inquiry
        </button>
      </div>
    </div>
  );
}

function InfoCard({ label, value, singleLine = false }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:border-[#D4AF37]/20 hover:bg-white/[0.05]">
      <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
        {label}
      </p>

      <p
        className={`mt-3 text-[15px] text-gray-200 ${
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