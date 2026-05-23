function AdminStats({
  cardClass,
  inquiries,
  inquiryNewCount,
  inquiryContactedCount,
  appointments,
  appointmentPendingCount,
  appointmentConfirmedCount,
  appointmentCompletedCount,
  appointmentCancelledCount,
}) {
  return (
    <div className="mb-8 grid gap-5 md:grid-cols-4">
      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Total Inquiries
        </p>

        <h2 className="mt-3 text-4xl font-extrabold text-[#D4AF37]">
          {inquiries.length}
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          New: {inquiryNewCount} / Contacted:{" "}
          {inquiryContactedCount}
        </p>
      </div>

      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Appointments
        </p>

        <h2 className="mt-3 text-4xl font-extrabold text-[#D4AF37]">
          {appointments.length}
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Pending: {appointmentPendingCount}
        </p>
      </div>

      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Confirmed
        </p>

        <h2 className="mt-3 text-4xl font-extrabold text-green-400">
          {appointmentConfirmedCount}
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Ready for consultation
        </p>
      </div>

      <div className={cardClass}>
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
          Completed
        </p>

        <h2 className="mt-3 text-4xl font-extrabold text-white">
          {appointmentCompletedCount}
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Cancelled: {appointmentCancelledCount}
        </p>
      </div>
    </div>
  );
}

export default AdminStats;