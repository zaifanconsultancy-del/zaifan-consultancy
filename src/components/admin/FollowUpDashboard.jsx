import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  updateFollowUpReminderStatus,
  deleteFollowUpReminder,
} from "../../lib/followUpReminders";

function FollowUpDashboard({ cardClass = "" }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");

  const today = new Date().toISOString().slice(0, 10);

  const fetchReminders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("follow_up_reminders")
      .select("*")
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true });

    if (error) {
      console.error("Failed to load follow-up dashboard:", error);
      setReminders([]);
      setLoading(false);
      return;
    }

    setReminders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const filteredReminders = useMemo(() => {
    if (filter === "all") return reminders;

    if (filter === "today") {
      return reminders.filter(
        (reminder) =>
          reminder.status === "pending" && reminder.due_date === today
      );
    }

    if (filter === "overdue") {
      return reminders.filter(
        (reminder) =>
          reminder.status === "pending" && reminder.due_date < today
      );
    }

    return reminders.filter((reminder) => reminder.status === filter);
  }, [reminders, filter, today]);

  const stats = useMemo(
    () => ({
      total: reminders.length,
      pending: reminders.filter((item) => item.status === "pending").length,
      today: reminders.filter(
        (item) => item.status === "pending" && item.due_date === today
      ).length,
      overdue: reminders.filter(
        (item) => item.status === "pending" && item.due_date < today
      ).length,
      done: reminders.filter((item) => item.status === "done").length,
    }),
    [reminders, today]
  );

  const updateStatus = async (id, status) => {
    await updateFollowUpReminderStatus(id, status);
    await fetchReminders();
  };

  const removeReminder = async (id) => {
    const confirmed = window.confirm("Delete this reminder?");
    if (!confirmed) return;

    await deleteFollowUpReminder(id);
    await fetchReminders();
  };

  const getBadge = (reminder) => {
    if (reminder.status !== "pending") return reminder.status;
    if (reminder.due_date < today) return "overdue";
    if (reminder.due_date === today) return "due today";
    return "upcoming";
  };

  const getBadgeStyle = (badge) => {
    if (badge === "overdue") {
      return "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]";
    }

    if (badge === "due today") {
      return "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]";
    }

    if (badge === "done") {
      return "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]";
    }

    if (badge === "cancelled") {
      return "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]";
    }

    return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";
  };

  const statCards = [
    ["Total", stats.total, "all"],
    ["Pending", stats.pending, "pending"],
    ["Due Today", stats.today, "today"],
    ["Overdue", stats.overdue, "overdue"],
    ["Done", stats.done, "done"],
  ];

  return (
    <section className={`space-y-5 ${cardClass}`}>
      <div className="rounded-[2rem] border-2 border-[#E9802D]/45 bg-[#FFFDF8] p-5 shadow-[0_18px_50px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-[#243A60]/15 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#B84F0E]">
              Follow-up Center
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#17243D]">
              CRM Follow-up Dashboard
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Track overdue, due today, pending, cancelled, and completed reminders.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReminders}
            disabled={loading}
            className="rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-5 py-2.5 text-sm font-black text-[#B84F0E] transition hover:-translate-y-0.5 hover:bg-[#FFE8D3] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(([label, value, nextFilter]) => {
            const active = filter === nextFilter;
            const danger = label === "Overdue";

            return (
              <button
                key={label}
                type="button"
                onClick={() => setFilter(nextFilter)}
                className={`rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 ${
                  active
                    ? danger
                      ? "border-[#C2413B]/45 bg-[#FFF0EE] shadow-[0_10px_24px_rgba(194,65,59,0.08)]"
                      : "border-[#E9802D]/50 bg-[#FFF3E7] shadow-[0_10px_24px_rgba(233,128,45,0.09)]"
                    : "border-[#243A60]/22 bg-white hover:border-[#E9802D]/35"
                }`}
              >
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                    danger ? "text-[#A8342F]" : "text-[#667085]"
                  }`}
                >
                  {label}
                </p>

                <p
                  className={`mt-2 text-2xl font-black ${
                    danger ? "text-[#A8342F]" : "text-[#17243D]"
                  }`}
                >
                  {value}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["pending", "today", "overdue", "done", "cancelled", "all"].map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-2 text-xs font-black capitalize transition ${
                  filter === item
                    ? "border-[#E9802D]/45 bg-[#E9802D] text-white"
                    : "border-[#243A60]/20 bg-white text-[#596579] hover:border-[#E9802D]/35 hover:text-[#B84F0E]"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border-2 border-[#243A60]/28 bg-[#FFFDF8] p-5 shadow-[0_14px_38px_rgba(23,36,61,0.06)]">
        {loading ? (
          <div className="rounded-2xl border border-[#243A60]/20 bg-white p-5 text-sm font-semibold text-[#667085]">
            Loading reminders...
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#243A60]/25 bg-[#F7F3EB] p-6 text-sm font-semibold text-[#667085]">
            No reminders found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => {
              const badge = getBadge(reminder);

              return (
                <div
                  key={reminder.id}
                  className="rounded-2xl border border-[#243A60]/22 bg-white p-4 transition duration-300 hover:border-[#E9802D]/40 hover:shadow-[0_10px_24px_rgba(23,36,61,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-black text-[#17243D]">
                          {reminder.title}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getBadgeStyle(
                            badge
                          )}`}
                        >
                          {badge}
                        </span>
                      </div>

                      {reminder.notes ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#667085]">
                          {reminder.notes}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#7A8392]">
                        <span>
                          Due: {reminder.due_date}
                          {reminder.due_time ? ` · ${reminder.due_time}` : ""}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{reminder.student_type}</span>
                        <span>•</span>
                        <span>By {reminder.created_by_name || "Admin"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {reminder.status !== "done" ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(reminder.id, "done")}
                          className="rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1.5 text-xs font-black text-[#B84F0E]"
                        >
                          Done
                        </button>
                      ) : null}

                      {reminder.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(reminder.id, "cancelled")
                          }
                          className="rounded-full border border-[#A36A18]/30 bg-[#FFF7E8] px-3 py-1.5 text-xs font-black text-[#8A5611]"
                        >
                          Cancel
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => removeReminder(reminder.id)}
                        className="rounded-full border border-[#C2413B]/30 bg-[#FFF0EE] px-3 py-1.5 text-xs font-black text-[#A8342F]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default FollowUpDashboard;