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
    () =>
      buildAutoReminderSuggestions({
        inquiries,
        appointments,
      }),
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
      className={`${cardClass} p-6 sm:p-8`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Workflow Automation
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Auto Reminder Generator
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            Automatically suggests follow-up reminders for new inquiries,
            contacted leads, pending appointments, and confirmed consultations.
          </p>
        </div>

        <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]">
          {suggestions.length} Suggestions
        </div>
      </div>

      <div className="mt-7 space-y-3">
        {suggestions.length ? (
          suggestions.slice(0, 20).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.025 }}
              className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5 transition hover:border-[#D4AF37]/25 hover:bg-white/[0.045]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                      {item.studentType}
                    </span>

                    <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                      Due in {item.dueInDays} day{item.dueInDays > 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-white">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {item.note}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => createReminder(item)}
                  disabled={creatingId === item.id}
                  className="rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingId === item.id
                    ? "Creating..."
                    : "Create Reminder"}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/20 bg-green-500/10 text-3xl">
              ✅
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              No reminder suggestions
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Your active CRM records do not need auto-generated reminders right now.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default AutoReminderGenerator;