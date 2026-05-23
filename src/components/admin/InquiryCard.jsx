function InquiryCard({
  inquiry,
  cardClass,
  updateInquiryStatus,
  deleteInquiry,
}) {
  const status = inquiry.status || "new";

  return (
    <div className={cardClass}>
      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Student Name
          </p>

          <h2 className="mt-2 break-words text-2xl font-bold text-white">
            {inquiry.full_name || "Unnamed Student"}
          </h2>

          <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Email
              </p>
              <p className="mt-2 break-all text-sm text-gray-300">
                {inquiry.email || "-"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Phone
              </p>
              <p className="mt-2 break-all text-sm text-gray-300">
                {inquiry.phone || "-"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Country
              </p>
              <p className="mt-2 break-words text-gray-300">
                {inquiry.country || "-"}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                Status
              </p>
              <p className="mt-2 break-words text-[#D4AF37]">
                {status}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Message
            </p>

            <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-gray-300">
              {inquiry.message || "-"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3 lg:w-40 lg:flex-col">
          <button
            onClick={() =>
              updateInquiryStatus(
                inquiry.id,
                status === "contacted" ? "new" : "contacted"
              )
            }
            className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E7C768]"
          >
            {status === "contacted" ? "Mark New" : "Mark Contacted"}
          </button>

          <button
            onClick={() => deleteInquiry(inquiry.id)}
            className="rounded-full border border-red-400/30 px-5 py-3 text-sm text-red-400 transition hover:bg-red-400/10"
          >
            Delete Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}

export default InquiryCard;