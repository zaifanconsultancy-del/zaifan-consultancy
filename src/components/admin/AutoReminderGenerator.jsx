import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { buildAutoReminderSuggestions } from "../../services/autoReminderEngine";

function AutoReminderGenerator({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const [creatingId, setCreatingId] = useState("");

  const suggestions = useMemo(
    () => buildAutoReminderSuggestions({ inquiries, appointments }),
    [inquiries, appointments]
  );

  const createReminder = async (suggestion) => {
    try {
      setCreatingId(suggestion.id);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + suggestion.dueInDays);

      const { data, error } = await supabase
        .from("follow_up_reminders")
        .insert({
          student_id: suggestion.studentId,
          student_type: suggestion.studentType,
          title: suggestion.title,
          notes: suggestion.note,
          due_date: dueDate.toISOString().slice(0, 10),
          status: "pending",
        })
        .select();

      console.log("Reminder insert result:", data);

      if (error) {
        console.error(error);
        alert(error.message || "Failed to create auto reminder.");
        return;
      }

      alert("Auto reminder created.");
    } catch (err) {
      console.error(err);
      alert("Unexpected reminder creation error.");
    } finally {
      setCreatingId("");
    }
  };

  return (
    <motion.section
      key="auto-reminder-generator"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} overflow-hidden rounded-[2rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]`}
    >
      <div className="flex flex-col gap-3 border-b border-orange-200 bg-[#102f5c] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-300">
            Workflow Automation
          </p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Auto Reminder Generator
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
            Automatically suggests follow-up reminders for new inquiries,
            contacted leads, pending appointments, and confirmed consultations.
          </p>
        </div>

        <div className="rounded-full border-2 border-orange-300 bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-sm">
          {suggestions.length} Suggestions
        </div>
      </div>

      <div className="space-y-3 bg-[#fff8ee] p-6 sm:p-8">
        {suggestions.length ? (
          suggestions.slice(0, 20).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.025 }}
              className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_5px_16px_rgba(15,35,63,0.035)] transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_10px_24px_rgba(15,35,63,0.06)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                      {item.studentType}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                      Due in {item.dueInDays} day{item.dueInDays > 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-[#10233f]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.note}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => createReminder(item)}
                  disabled={creatingId === item.id}
                  className="rounded-full border-2 border-orange-600 bg-orange-500 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingId === item.id ? "Creating..." : "Create Reminder"}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="rounded-[1.5rem] border-2 border-emerald-300 bg-emerald-50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-3xl">
              ✅
            </div>
            <h3 className="mt-4 text-xl font-black text-[#10233f]">
              No reminder suggestions
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Your active CRM records do not need auto-generated reminders right now.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default AutoReminderGenerator;