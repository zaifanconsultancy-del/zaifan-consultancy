import { motion } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

function FollowUpPerformancePanel({
  cardClass = "",
  reminders = [],
  inquiries = [],
  appointments = [],
}) {
  const safeReminders = Array.isArray(reminders) ? reminders : [];

  const totalReminders = safeReminders.length;

  const completedReminders = safeReminders.filter((reminder) =>
    ["completed", "done", "closed"].includes(
      String(reminder.status || "").toLowerCase()
    )
  ).length;

  const pendingReminders = safeReminders.filter((reminder) =>
    ["pending", "open", "active"].includes(
      String(reminder.status || "").toLowerCase()
    )
  ).length;

  const overdueReminders = safeReminders.filter((reminder) => {
    if (!reminder.due_date && !reminder.dueDate) return false;

    const dueDate = new Date(reminder.due_date || reminder.dueDate);
    const today = new Date();

    return (
      dueDate < today &&
      !["completed", "done", "closed"].includes(
        String(reminder.status || "").toLowerCase()
      )
    );
  }).length;

  const completionRate =
    totalReminders > 0
      ? Math.round((completedReminders / totalReminders) * 100)
      : 0;

  const stats = [
    {
      label: "Total Follow-Ups",
      value: totalReminders,
      icon: CalendarCheck,
      helper: "All created follow-up reminders",
    },
    {
      label: "Completed",
      value: completedReminders,
      icon: CheckCircle2,
      helper: `${completionRate}% completion rate`,
    },
    {
      label: "Pending",
      value: pendingReminders,
      icon: Clock,
      helper: "Still waiting for action",
    },
    {
      label: "Overdue",
      value: overdueReminders,
      icon: AlertTriangle,
      helper: "Needs urgent attention",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`${cardClass} space-y-6`}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
            Follow-Up Performance
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Reminder Completion Analytics
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Track reminder pressure, overdue follow-ups, and completion health
            across inquiries and appointments.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37]">
          <TrendingUp size={18} />
          <span>{completionRate}% completed</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]"
            >
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-300 group-hover:opacity-70" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/50">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {item.value}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-[#D4AF37]">
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-xs text-white/45">{item.helper}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-white">
            Completion Progress
          </p>
          <p className="text-sm text-[#D4AF37]">{completionRate}%</p>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <p className="mt-4 text-xs text-white/45">
          This clean version only reads existing reminder data. It does not
          require a priority column and uses notes-safe reminder logic.
        </p>
      </div>
    </motion.section>
  );
}

export default FollowUpPerformancePanel;