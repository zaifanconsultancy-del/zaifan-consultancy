function DashboardOverview({
  cardClass,
  todayInquiriesCount,
  todayAppointmentsCount,
  latestInquiry,
  latestAppointment,
}) {
  return (
    <div className="mb-10 grid gap-6 xl:grid-cols-3">
      {/* TODAY ACTIVITY */}
      <div
        className={`${cardClass} group relative rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent`}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
              Today Activity
            </p>

            <h2 className="mt-4 text-5xl font-black leading-none text-[#D4AF37]">
              {todayInquiriesCount + todayAppointmentsCount}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              {todayInquiriesCount} new inquiries ·{" "}
              {todayAppointmentsCount} appointments
            </p>
          </div>

          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4 text-2xl">
            ✦
          </div>
        </div>
      </div>

      {/* LATEST INQUIRY */}
      <div className={`${cardClass} group relative`}>
        <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
              Latest Inquiry
            </p>

            <h2 className="mt-4 break-words text-3xl font-bold text-white">
              {latestInquiry?.full_name || "No inquiry yet"}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              {latestInquiry?.country || "Waiting for first inquiry"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xl">
            📨
          </div>
        </div>
      </div>

      {/* LATEST APPOINTMENT */}
      <div className={`${cardClass} group relative`}>
        <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
              Latest Appointment
            </p>

            <h2 className="mt-4 break-words text-3xl font-bold text-white">
              {latestAppointment?.full_name || "No booking yet"}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              {latestAppointment
                ? `${latestAppointment.appointment_date || "No date"} · ${
                    latestAppointment.appointment_time || "No time"
                  }`
                : "Waiting for first appointment"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xl">
            📅
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;