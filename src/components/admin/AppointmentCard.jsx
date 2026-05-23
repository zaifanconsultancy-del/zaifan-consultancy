import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} group relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-black/30 p-5 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/45 hover:shadow-[0_20px_60px_rgba(212,175,55,0.07)]`}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl transition duration-700 group-hover:bg-[#D4AF37]/20"></div>

      <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-white/5 blur-3xl"></div>

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
            Consultation Booking
          </p>

          <h2 className="mt-2 break-words text-2xl font-bold leading-tight text-white">
            {appointment.full_name || "Unnamed Student"}
          </h2>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${
            statusStyles[status]
          }`}
        >
          {status}
        </span>
      </div>

      <div className="relative mt-5 rounded-[1.4rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 transition duration-300 group-hover:border-[#D4AF37]/35">
        <p className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]">
          Appointment Slot
        </p>

        <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="break-words text-xl font-bold text-white">
            {appointment.appointment_date || "No Date"}
          </h3>

          <span className="w-fit rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-medium text-gray-300">
            {appointment.appointment_time || "No Time"}
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 lg:grid-cols-2">
        <InfoCard label="Email" value={appointment.email} singleLine />
        <InfoCard label="Phone" value={appointment.phone} />
        <InfoCard
          label="Country Interest"
          value={appointment.country_interest}
        />
        <InfoCard
          label="Consultation Type"
          value={appointment.consultation_type}
        />
      </div>

      <div className="relative mt-5 rounded-[1.4rem] border border-white/10 bg-black/25 p-5 transition duration-300 group-hover:border-[#D4AF37]/20">
        <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
          Student Message
        </p>

        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300">
          {appointment.message || "No message provided."}
        </p>
      </div>

      <div className="relative mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
        <select
          value={status}
          onChange={(event) =>
            updateAppointmentStatus(appointment.id, event.target.value)
          }
          className={`rounded-full border px-5 py-3 pr-10 text-sm font-semibold outline-none transition duration-300 backdrop-blur-xl hover:scale-[1.02]
          ${statusStyles[status]}
          focus:border-[#D4AF37]`}
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
          className="rounded-full border border-red-500/30 px-6 py-3 text-sm font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/10"
        >
          Delete Appointment
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

export default AppointmentCard;