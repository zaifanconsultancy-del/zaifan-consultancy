function AppointmentCard({
  appointment,
  cardClass,
  updateAppointmentStatus,
  deleteAppointment,
}) {
  const status = appointment.status || "pending";

  const statusStyles = {
    pending:
      "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    confirmed:
      "border-green-500/30 bg-green-500/10 text-green-400",
    completed:
      "border-blue-500/30 bg-blue-500/10 text-blue-400",
    cancelled:
      "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <div
      className={`${cardClass} group relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-7 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/40`}
    >
      {/* TOP HOVER LINE */}
      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      {/* HEADER */}
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
            Consultation Booking
          </p>

          <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
            {appointment.full_name || "Unnamed Student"}
          </h2>
        </div>

        <span
          className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
            statusStyles[status]
          }`}
        >
          {status}
        </span>
      </div>

      {/* BOOKING SLOT */}
      <div className="mt-7 rounded-[1.7rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
          Appointment Slot
        </p>

        <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-2xl font-bold text-white">
            {appointment.appointment_date || "No Date"}
          </h3>

          <span className="w-fit rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-gray-300">
            {appointment.appointment_time || "No Time"}
          </span>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <InfoCard
          label="Email"
          value={appointment.email}
          singleLine={true}
        />

        <InfoCard
          label="Phone"
          value={appointment.phone}
        />

        <InfoCard
          label="Country Interest"
          value={appointment.country_interest}
        />

        <InfoCard
          label="Consultation Type"
          value={appointment.consultation_type}
        />
      </div>

      {/* MESSAGE */}
      <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-black/25 p-6">
        <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500">
          Student Message
        </p>

        <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-gray-300">
          {appointment.message || "No message provided."}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <select
          value={status}
          onChange={(event) =>
            updateAppointmentStatus(appointment.id, event.target.value)
          }
          className="rounded-full border border-white/10 bg-black/40 px-6 py-3 pr-12 text-sm font-semibold text-white outline-none transition duration-300 focus:border-[#D4AF37]"
        >
          <option value="pending" className="bg-[#111111] text-white">
            Pending
          </option>

          <option value="confirmed" className="bg-[#111111] text-white">
            Confirmed
          </option>

          <option value="completed" className="bg-[#111111] text-white">
            Completed
          </option>

          <option value="cancelled" className="bg-[#111111] text-white">
            Cancelled
          </option>
        </select>

        <button
          onClick={() => deleteAppointment(appointment.id)}
          className="rounded-full border border-red-500/30 px-7 py-3 text-sm font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/10"
        >
          Delete Appointment
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

export default AppointmentCard;