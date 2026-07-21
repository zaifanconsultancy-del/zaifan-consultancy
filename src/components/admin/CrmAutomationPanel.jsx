import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildAutomationSuggestions } from "../../services/crmAutomationEngine";

function CrmAutomationPanel({ cardClass = "", inquiries = [], appointments = [] }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReminders = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("follow_up_reminders")
        .select("*")
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;
      setReminders(data || []);
    } catch (err) {
      console.error("CRM automation reminders failed:", err);
      setError(err.message || "Automation reminders could not load.");
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const suggestions = useMemo(
    () => buildAutomationSuggestions({ inquiries, appointments, reminders }),
    [inquiries, appointments, reminders]
  );

  const counts = useMemo(
    () => ({
      urgent: suggestions.filter((item) => item.priority === "urgent").length,
      high: suggestions.filter((item) => item.priority === "high").length,
      medium: suggestions.filter((item) => item.priority === "medium").length,
    }),
    [suggestions]
  );

  return (
    <motion.section
      key="crm-automation"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className={`${cardClass} rounded-[2rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#B84F0E]">CRM Automation Engine</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#17243D] sm:text-4xl">Smart Next Actions</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667085]">
              Scans inquiries, appointments, and follow-up reminders to surface the most important actions for your team.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReminders}
            disabled={loading}
            className="rounded-full border border-[#E9802D]/40 bg-[#FFF1E3] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#B84F0E] transition hover:-translate-y-0.5 hover:border-[#E9802D]/60 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Engine"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm text-[#A8342F]">{error}</div>
        ) : null}

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AutomationStat label="Total Actions" value={suggestions.length} tone="orange" />
          <AutomationStat label="Urgent" value={counts.urgent} tone="red" />
          <AutomationStat label="High" value={counts.high} tone="amber" />
          <AutomationStat label="Medium" value={counts.medium} tone="navy" />
        </div>
      </div>

      <div className="grid gap-4">
        {suggestions.length ? (
          suggestions.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.03 }}
              className="rounded-[1.7rem] border border-[#243A60]/18 bg-white p-5 shadow-[0_12px_28px_rgba(23,36,61,0.05)] transition hover:-translate-y-0.5 hover:border-[#E9802D]/40"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                    <span className="rounded-full border border-[#243A60]/16 bg-[#F3F5F8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#596579]">
                      {item.studentType}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-[#17243D]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{item.message}</p>
                </div>

                <div className="rounded-2xl border border-[#243A60]/16 bg-[#FFFDF8] px-4 py-3 text-xs text-[#667085]">
                  Action ID
                  <p className="mt-1 max-w-[180px] truncate font-mono font-bold text-[#B84F0E]">{item.id}</p>
                </div>
              </div>
            </motion.article>
          ))
        ) : (
          <div className={`${cardClass} rounded-[1.75rem] border border-[#243A60]/18 bg-[#FFFDF8] p-10 text-center shadow-[0_14px_34px_rgba(23,36,61,0.06)]`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E9802D]/35 bg-[#FFF1E3] text-3xl">✨</div>
            <h3 className="mt-5 text-2xl font-black text-[#17243D]">No automation actions right now</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085]">
              New leads, pending appointments, and follow-up reminders will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function AutomationStat({ label, value, tone = "orange" }) {
  const style =
    tone === "red" ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]" :
    tone === "amber" ? "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]" :
    tone === "navy" ? "border-[#243A60]/22 bg-[#F3F5F8] text-[#243A60]" :
    "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]";

  return (
    <div className={`rounded-[1.4rem] border p-5 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">{label}</p>
      <h3 className="mt-3 text-3xl font-black">{value}</h3>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const style =
    priority === "urgent" ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]" :
    priority === "high" ? "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]" :
    "border-[#E9802D]/30 bg-[#FFF1E3] text-[#B84F0E]";

  return <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style}`}>{priority}</span>;
}

export default CrmAutomationPanel;