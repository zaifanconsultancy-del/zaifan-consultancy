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
        .filter(
          (item) =>
            item.due_date &&
            String(item.due_date).slice(0, 10) < todayKey
        )
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
              daysLate >= 7
                ? "Critical"
                : daysLate >= 3
                ? "High"
                : "Medium",
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
      className={`${cardClass} overflow-hidden rounded-[2rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]`}
    >
      <div className="flex flex-col gap-4 border-b border-orange-200 bg-[#102f5c] p-6 text-white sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-300">
            Escalation Intelligence
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Smart Overdue Alerts
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
            Detect overdue reminders and rank them by urgency so staff can
            rescue important leads before they go cold.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReminders}
          disabled={loading}
          className="rounded-full border-2 border-orange-300 bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh Alerts"}
        </button>
      </div>

      <div className="bg-[#fff8ee] p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <EscalationStat
            label="Overdue"
            value={overdueItems.length}
            tone="red"
          />

          <EscalationStat
            label="Critical"
            value={
              overdueItems.filter(
                (item) => item.escalation === "Critical"
              ).length
            }
            tone="critical"
          />

          <EscalationStat
            label="High Risk"
            value={
              overdueItems.filter(
                (item) => item.escalation === "High"
              ).length
            }
            tone="orange"
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
                className="rounded-[1.5rem] border-2 border-red-300 bg-red-50 p-5 shadow-[0_5px_16px_rgba(15,35,63,0.035)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-red-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-700">
                        {item.escalation}
                      </span>

                      <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                        {item.daysLate} day{item.daysLate > 1 ? "s" : ""} late
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-[#10233f]">
                      {item.title || "Overdue follow-up"}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {item.note ||
                        "This student follow-up is overdue and needs action."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-red-300 bg-white px-4 py-3 text-xs text-slate-600">
                    Due Date
                    <p className="mt-1 font-mono font-black text-red-700">
                      {String(item.due_date).slice(0, 10)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border-2 border-emerald-300 bg-emerald-50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-3xl">
                ✅
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233f]">
                No overdue escalations
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Your follow-up queue is currently under control.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function EscalationStat({ label, value, tone }) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-700",
    critical: "border-red-400 bg-red-100 text-red-800",
    orange: "border-orange-300 bg-orange-50 text-orange-700",
  };

  return (
    <div
      className={`rounded-[1.4rem] border-2 p-5 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${styles[tone]}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <h3 className="mt-3 text-3xl font-black text-[#10233f]">{value}</h3>
    </div>
  );
}

export default OverdueEscalationPanel;