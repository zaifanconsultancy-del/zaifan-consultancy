import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function OverdueEscalationPanel({ cardClass = "" }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);

  const fetchReminders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("follow_up_reminders")
      .select("*")
      .neq("status", "completed")
      .order("due_date", { ascending: true })
      .limit(100);

    setLoading(false);

    if (error) {
      console.error(error);
      return;
    }

    setReminders(data || []);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const overdueItems = useMemo(
    () =>
      reminders
        .filter((item) => item.due_date && String(item.due_date).slice(0, 10) < todayKey)
        .map((item) => {
          const due = new Date(item.due_date);
          const now = new Date();
          const daysLate = Math.max(
            1,
            Math.ceil((now - due) / (1000 * 60 * 60 * 24))
          );

          return {
            ...item,
            daysLate,
            escalation:
              daysLate >= 7 ? "Critical" : daysLate >= 3 ? "High" : "Medium",
          };
        }),
    [reminders, todayKey]
  );

  return (
    <motion.section
      key="overdue-escalation"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} p-6 sm:p-8`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Escalation Intelligence
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Smart Overdue Alerts
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            Detects overdue reminders and ranks them by urgency so staff can
            rescue important leads before they go cold.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReminders}
          disabled={loading}
          className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh Alerts"}
        </button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <EscalationStat
          label="Overdue"
          value={overdueItems.length}
          tone="text-red-300"
        />
        <EscalationStat
          label="Critical"
          value={overdueItems.filter((item) => item.escalation === "Critical").length}
          tone="text-red-400"
        />
        <EscalationStat
          label="High Risk"
          value={overdueItems.filter((item) => item.escalation === "High").length}
          tone="text-orange-300"
        />
      </div>

      <div className="mt-7 space-y-3">
        {overdueItems.length ? (
          overdueItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="rounded-[1.5rem] border border-red-400/15 bg-red-500/5 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                      {item.escalation}
                    </span>

                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                      {item.daysLate} day{item.daysLate > 1 ? "s" : ""} late
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-white">
                    {item.title || "Overdue follow-up"}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {item.note || "This student follow-up is overdue and needs action."}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-gray-400">
                  Due Date
                  <p className="mt-1 font-mono text-red-300">
                    {String(item.due_date).slice(0, 10)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/20 bg-green-500/10 text-3xl">
              ✅
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              No overdue escalations
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Your follow-up queue is currently under control.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function EscalationStat({ label, value, tone }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
        {label}
      </p>
      <h3 className={`mt-3 text-3xl font-black ${tone}`}>{value}</h3>
    </div>
  );
}

export default OverdueEscalationPanel;