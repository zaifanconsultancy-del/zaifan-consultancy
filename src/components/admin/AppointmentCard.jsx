function AppointmentCard({
  appointment,
  cardClass,
  updateAppointmentStatus,
  deleteAppointment,
}) {
  const status = appointment.status || "pending";

  return (
    <div className={cardClass}>
      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold text-white">
            {appointment.full_name || "Unnamed Student"}
          </h2>

          <p className="mt-2 break-all text-sm text-gray-400">
            {appointment.email || "-"}
          </p>

          <p className="mt-1 break-words text-sm text-gray-500">
            {appointment.phone || "-"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            status === "confirmed"
              ? "bg-green-400/10 text-green-400"
              : status === "completed"
              ? "bg-blue-400/10 text-blue-400"
              : status === "cancelled"
              ? "bg-red-400/10 text-red-400"
              : "bg-[#D4AF37]/10 text-[#D4AF37]"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-[#D4AF37]">
          Booking Slot
        </p>

        <h3 className="mt-3 break-words text-2xl font-extrabold text-white">
          {appointment.appointment_date || "No date"} ·{" "}
          {appointment.appointment_time || "No time"}
        </h3>
      </div>

      <div className="mt-6 grid min-w-0 gap-3 text-sm text-gray-300 sm:grid-cols-2">
        <p className="min-w-0 break-words">
          <span className="text-[#D4AF37]">Email:</span>{" "}
          <span className="break-all">{appointment.email || "-"}</span>
        </p>

        <p className="min-w-0 break-words">
          <span className="text-[#D4AF37]">Phone:</span>{" "}
          <span className="break-all">{appointment.phone || "-"}</span>
        </p>

        <p className="min-w-0 break-words">
          <span className="text-[#D4AF37]">Country:</span>{" "}
          {appointment.country_interest || "-"}
        </p>

        <p className="min-w-0 break-words">
          <span className="text-[#D4AF37]">Type:</span>{" "}
          {appointment.consultation_type || "-"}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm text-[#D4AF37]">Message</p>

        <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-gray-300">
          {appointment.message || "-"}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <select
          value={status}
          onChange={(event) =>
            updateAppointmentStatus(appointment.id, event.target.value)
          }
          className="min-w-0 rounded-full border border-white/10 bg-black/30 px-5 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#D4AF37]"
        >
          <option value="pending" className="text-black">
            Pending
          </option>
          <option value="confirmed" className="text-black">
            Confirmed
          </option>
          <option value="completed" className="text-black">
            Completed
          </option>
          <option value="cancelled" className="text-black">
            Cancelled
          </option>
        </select>

        <button
          onClick={() => deleteAppointment(appointment.id)}
          className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-red-400 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default AppointmentCard;