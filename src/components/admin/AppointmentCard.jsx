import { motion } from "framer-motion";

function AppointmentCard({
  appointment,
  cardClass,
  updateAppointmentStatus,
  updateAppointmentPriority,
  deleteAppointment,
  openModal,
  compact = false,
}) {
  const status = appointment.status || "pending";
  const priority = appointment.priority || "low";

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

  const statusStyles = {
    pending: "border-orange-400/30 bg-orange-500/10 text-orange-300",
    confirmed: "border-green-400/30 bg-green-500/10 text-green-300",
    completed: "border-blue-400/30 bg-blue-500/10 text-blue-300",
    cancelled: "border-red-400/30 bg-red-500/10 text-red-300",
  };

  const activePriority = priorityStyles[priority] || priorityStyles.low;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      onClick={() => openModal(appointment)}
      className={`${cardClass} group relative cursor-pointer overflow-hidden rounded-[1.5rem] border ${activePriority.card} bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-black/30 p-4 backdrop-blur-xl transition duration-500 sm:rounded-[2rem] sm:p-5`}
    >
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl transition duration-700 sm:h-48 sm:w-48 ${activePriority.glow}`}
      ></div>

      <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

      <div className="relative flex flex-col gap-3 border-b border-white/10 pb-4 sm:gap-4 sm:pb-5">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Appointment Student
          </p>

          <h2 className="mt-1.5 break-words text-xl font-bold leading-tight text-white sm:mt-2 sm:text-2xl">
            {appointment.full_name || "Unnamed Student"}
          </h2>
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
              statusStyles[status] || statusStyles.pending
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="relative mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-2">
        <InfoCard label="Email" value={appointment.email} />
        {!compact && <InfoCard label="Phone" value={appointment.phone} />}
        <InfoCard
          label="Date"
          value={
            appointment.appointment_date && appointment.appointment_time
              ? `${appointment.appointment_date} · ${appointment.appointment_time}`
              : appointment.appointment_date || appointment.appointment_time
          }
        />

        <div
          onClick={(event) => event.stopPropagation()}
          className="rounded-[1rem] border border-white/10 bg-white/[0.035] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] sm:rounded-[1.25rem] sm:p-4"
        >
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
            Priority
          </p>

          <select
            value={priority}
            onChange={(event) =>
              updateAppointmentPriority(appointment.id, event.target.value)
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

      {!compact && (
        <div className="relative mt-4 rounded-[1.2rem] border border-white/10 bg-black/25 p-4 transition duration-300 group-hover:border-[#D4AF37]/20 sm:mt-5 sm:rounded-[1.4rem] sm:p-5">
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Message
          </p>

          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300 sm:mt-3">
            {appointment.message || "No message provided."}
          </p>
        </div>
      )}

      <div
        onClick={(event) => event.stopPropagation()}
        className="relative mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4 sm:mt-5 sm:gap-3 sm:pt-5"
      >
        <button
          onClick={() => openModal(appointment)}
          className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white transition duration-300 hover:border-[#D4AF37]/30 hover:bg-white/[0.08] sm:px-6 sm:py-3 sm:text-sm"
        >
          Open CRM
        </button>

        {!compact && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {["pending", "confirmed", "completed", "cancelled"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => updateAppointmentStatus(appointment.id, item)}
                className={`rounded-full px-4 py-2.5 text-xs font-semibold capitalize transition duration-300 hover:-translate-y-0.5 sm:px-5 sm:py-3 sm:text-sm ${
                  status === item
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/10 bg-white/[0.04] text-gray-300 hover:border-[#D4AF37]/30 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}

            <button
              onClick={() => deleteAppointment(appointment.id)}
              className="rounded-full border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/10 sm:col-span-2 sm:px-6 sm:py-3 sm:text-sm"
            >
              Delete Appointment
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

export default AppointmentCard;