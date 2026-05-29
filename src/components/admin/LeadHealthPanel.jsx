import { motion } from "framer-motion";
import {
  AlertTriangle,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";

function LeadHealthPanel({
  inquiries = [],
  appointments = [],
  reminders = [],
}) {
  const allLeads = [...inquiries, ...appointments];

  const healthy = [];
  const attention = [];
  const risk = [];

  allLeads.forEach((lead) => {
    const createdAt = lead.created_at
      ? new Date(lead.created_at)
      : new Date();

    const ageDays = Math.floor(
      (Date.now() - createdAt.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const status = String(
      lead.status ||
      lead.pipeline_stage ||
      ""
    ).toLowerCase();

    const hasOverdueReminder = reminders.some(
      (reminder) =>
        reminder.student_id === lead.id &&
        reminder.status !== "completed" &&
        reminder.due_date &&
        new Date(reminder.due_date) < new Date()
    );

    const isVip =
      String(lead.priority || "").toLowerCase() === "vip";

    const isConfirmed =
      status.includes("confirmed") ||
      status.includes("contacted") ||
      status.includes("completed");

    if (
      hasOverdueReminder ||
      (ageDays > 7 && status.includes("pending"))
    ) {
      risk.push(lead);
      return;
    }

    if (
      ageDays > 3 ||
      !isConfirmed
    ) {
      attention.push(lead);
      return;
    }

    if (isVip || isConfirmed) {
      healthy.push(lead);
      return;
    }

    attention.push(lead);
  });

  const cards = [
    {
      label: "Healthy Leads",
      value: healthy.length,
      icon: ShieldCheck,
      color:
        "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
      description:
        "Actively progressing through the CRM.",
    },
    {
      label: "Attention Needed",
      value: attention.length,
      icon: HeartPulse,
      color:
        "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
      description:
        "Needs follow-up or monitoring.",
    },
    {
      label: "At Risk",
      value: risk.length,
      icon: AlertTriangle,
      color:
        "border-red-400/20 bg-red-500/10 text-red-300",
      description:
        "Potentially lost or overdue leads.",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
          Lead Health Engine
        </p>

        <h2 className="mt-2 text-3xl font-black text-white">
          CRM Health Monitor
        </h2>

        <p className="mt-2 text-sm text-white/50">
          Detect lead decay, overdue follow-ups,
          and CRM bottlenecks before conversions are lost.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className={`rounded-[1.75rem] border p-5 ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">
                    {card.label}
                  </p>

                  <h3 className="mt-3 text-4xl font-black">
                    {card.value}
                  </h3>
                </div>

                <Icon size={28} />
              </div>

              <p className="mt-4 text-xs opacity-70">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-lg font-bold text-white">
          Lead Health Interpretation
        </h3>

        <div className="mt-4 space-y-3 text-sm text-white/60">
          <p>
            🟢 Healthy leads are actively moving
            through the consultancy pipeline.
          </p>

          <p>
            🟡 Attention leads may require
            follow-up, reminders, or counselor review.
          </p>

          <p>
            🔴 At-risk leads have overdue activity
            and may be close to being lost.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

export default LeadHealthPanel;