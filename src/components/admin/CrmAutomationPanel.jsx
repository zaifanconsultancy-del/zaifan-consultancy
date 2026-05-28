import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildAutomationSuggestions } from "../../services/crmAutomationEngine";

function CrmAutomationPanel({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const suggestions = useMemo(
    () =>
      buildAutomationSuggestions({
        inquiries,
        appointments,
        reminders,
      }),
    [inquiries, appointments, reminders]
  );

  const urgentCount = suggestions.filter(
    (item) => item.priority === "urgent"
  ).length;

  const highCount = suggestions.filter((item) => item.priority === "high").length;

  const mediumCount = suggestions.filter(
    (item) => item.priority === "medium"
  ).length;

  return (
    <motion.div
      key="crm-automation"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <section className={`${cardClass} p-6 sm:p-8`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
              CRM Automation Engine
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Smart Next Actions
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
              This engine scans inquiries, appointments, and follow-up reminders
              to suggest the highest priority actions your team should take next.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReminders}
            disabled={loading}
            className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Engine"}
          </button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AutomationStat
            label="Total Actions"
            value={suggestions.length}
            tone="text-[#D4AF37]"
          />
          <AutomationStat
            label="Urgent"
            value={urgentCount}
            tone="text-red-300"
          />
          <AutomationStat label="High" value={highCount} tone="text-orange-300" />
          <AutomationStat label="Medium" value={mediumCount} tone="text-blue-300" />
        </div>
      </section>

      <section className="grid gap-4">
        {suggestions.length ? (
          suggestions.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.03 }}
              className="group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/30 hover:bg-white/[0.055]"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition group-hover:opacity-80"></div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                        item.priority === "urgent"
                          ? "border border-red-400/25 bg-red-500/10 text-red-300"
                          : item.priority === "high"
                          ? "border border-orange-400/25 bg-orange-500/10 text-orange-300"
                          : "border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
                      }`}
                    >
                      {item.priority}
                    </span>

                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                      {item.studentType}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {item.message}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs text-gray-400">
                  Action ID
                  <p className="mt-1 max-w-[180px] truncate font-mono text-[#D4AF37]">
                    {item.id}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className={`${cardClass} p-10 text-center`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl">
              ✨
            </div>

            <h3 className="mt-5 text-2xl font-black text-white">
              No automation actions right now
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
              Your CRM has no urgent pending actions. New leads, pending
              appointments, and follow-up reminders will appear here
              automatically.
            </p>
          </div>
        )}
      </section>
    </motion.div>
  );
}

function AutomationStat({ label, value, tone }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
        {label}
      </p>
      <h3 className={`mt-3 text-3xl font-black ${tone}`}>{value}</h3>
    </div>
  );
}

export default CrmAutomationPanel;