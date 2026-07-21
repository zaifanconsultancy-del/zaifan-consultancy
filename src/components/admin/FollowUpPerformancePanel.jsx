import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

function FollowUpPerformancePanel({
  cardClass = "",
  reminders = [],
  inquiries = [],
  appointments = [],
}) {
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

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
    const rawDueDate = reminder.due_date || reminder.dueDate;

    if (!rawDueDate) return false;

    const dueDate = new Date(rawDueDate);
    const today = new Date();

    if (Number.isNaN(dueDate.getTime())) return false;

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

  const trackedRecords = safeInquiries.length + safeAppointments.length;

  const stats = [
    {
      label: "Total Follow-Ups",
      value: totalReminders,
      icon: CalendarCheck,
      helper: "All created follow-up reminders",
      tone: "orange",
    },
    {
      label: "Completed",
      value: completedReminders,
      icon: CheckCircle2,
      helper: `${completionRate}% completion rate`,
      tone: "orange",
    },
    {
      label: "Pending",
      value: pendingReminders,
      icon: Clock,
      helper: "Still waiting for action",
      tone: "navy",
    },
    {
      label: "Overdue",
      value: overdueReminders,
      icon: AlertTriangle,
      helper: "Needs urgent attention",
      tone: "danger",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`${cardClass} space-y-6 rounded-[2rem] border-2 border-[#E9802D]/45 bg-[#FFFDF8] p-5 shadow-[0_18px_50px_rgba(23,36,61,0.08)] sm:p-6`}
    >
      <div className="flex flex-col gap-4 border-b border-[#243A60]/15 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1.5">
            <TrendingUp className="h-4 w-4 text-[#D96C1F]" />

            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#B84F0E]">
              Follow-Up Performance
            </p>
          </div>

          <h2 className="mt-3 text-2xl font-black tracking-tight text-[#17243D]">
            Reminder Completion Analytics
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
            Track reminder pressure, overdue follow-ups, and completion health
            across inquiries and appointments.
          </p>
        </div>

        <div className="flex min-w-[180px] items-center gap-3 rounded-2xl border border-[#E9802D]/35 bg-[#FFF3E7] px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9802D]/30 bg-white">
            <TrendingUp className="h-5 w-5 text-[#D96C1F]" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B84F0E]">
              Completion
            </p>
            <p className="mt-0.5 text-xl font-black text-[#17243D]">
              {completionRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          const danger = item.tone === "danger";
          const navy = item.tone === "navy";

          return (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`group relative overflow-hidden rounded-[1.5rem] border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(23,36,61,0.07)] ${
                danger
                  ? "border-[#C2413B]/30 bg-[#FFF0EE]"
                  : navy
                  ? "border-[#243A60]/28 bg-[#F3F5F8]"
                  : "border-[#E9802D]/35 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-black uppercase tracking-[0.16em] ${
                      danger
                        ? "text-[#A8342F]"
                        : navy
                        ? "text-[#243A60]"
                        : "text-[#667085]"
                    }`}
                  >
                    {item.label}
                  </p>

                  <p
                    className={`mt-3 text-3xl font-black ${
                      danger ? "text-[#A8342F]" : "text-[#17243D]"
                    }`}
                  >
                    {item.value}
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-3 ${
                    danger
                      ? "border-[#C2413B]/30 bg-white text-[#C2413B]"
                      : navy
                      ? "border-[#243A60]/25 bg-white text-[#243A60]"
                      : "border-[#E9802D]/30 bg-[#FFF3E7] text-[#D96C1F]"
                  }`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-xs font-semibold leading-5 text-[#747D8D]">
                {item.helper}
              </p>
            </motion.article>
          );
        })}
      </div>

      <div className="rounded-[1.5rem] border border-[#243A60]/25 bg-white p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#17243D]">
              Completion Progress
            </p>

            <p className="mt-1 text-xs font-medium text-[#747D8D]">
              {completedReminders} of {totalReminders} reminders completed
            </p>
          </div>

          <p className="text-sm font-black text-[#B84F0E]">
            {completionRate}%
          </p>
        </div>

        <div className="h-3 overflow-hidden rounded-full border border-[#243A60]/10 bg-[#EEF0F3]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-[#E9802D]"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-[#747D8D]">
            Reads existing reminder records safely without requiring a priority
            column.
          </p>

          <span className="rounded-full border border-[#243A60]/20 bg-[#F3F5F8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#596579]">
            {trackedRecords} linked CRM records
          </span>
        </div>
      </div>
    </motion.section>
  );
}

export default FollowUpPerformancePanel;