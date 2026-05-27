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

  const stats = useMemo(() => {
    return {
      total: reminders.length,
      pending: reminders.filter((item) => item.status === "pending").length,
      today: reminders.filter(
        (item) => item.status === "pending" && item.due_date === today
      ).length,
      overdue: reminders.filter(
        (item) => item.status === "pending" && item.due_date < today
      ).length,
      done: reminders.filter((item) => item.status === "done").length,
    };
  }, [reminders, today]);

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
      return "border-red-400/25 bg-red-500/10 text-red-300";
    }

    if (badge === "due today") {
      return "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]";
    }

    if (badge === "done") {
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
    }

    if (badge === "cancelled") {
      return "border-yellow-400/25 bg-yellow-500/10 text-yellow-300";
    }

    return "border-blue-400/25 bg-blue-500/10 text-blue-300";
  };

  return (
    <section className={`space-y-5 ${cardClass}`}>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
              Follow-up Center
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              CRM Follow-up Dashboard
            </h2>
            <p className="mt-2 text-sm text-white/45">
              Track overdue, due today, pending, and completed reminders.
            </p>
          </div>

          <button
            onClick={fetchReminders}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/60 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total", stats.total],
            ["Pending", stats.pending],
            ["Due Today", stats.today],
            ["Overdue", stats.overdue],
            ["Done", stats.done],
          ].map(([label, value]) => (
            <button
              key={label}
              onClick={() =>
                setFilter(
                  label === "Due Today"
                    ? "today"
                    : label.toLowerCase()
                )
              }
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-[#D4AF37]/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["pending", "today", "overdue", "done", "cancelled", "all"].map(
            (item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                  filter === item
                    ? "border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "border-white/10 bg-black/20 text-white/45 hover:border-white/20 hover:text-white"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/50">
            Loading reminders...
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/45">
            No reminders found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => {
              const badge = getBadge(reminder);

              return (
                <div
                  key={reminder.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {reminder.title}
                        </h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase ${getBadgeStyle(
                            badge
                          )}`}
                        >
                          {badge}
                        </span>
                      </div>

                      {reminder.notes ? (
                        <p className="mt-1 text-sm text-white/45">
                          {reminder.notes}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/35">
                        <span>
                          Due: {reminder.due_date}
                          {reminder.due_time ? ` · ${reminder.due_time}` : ""}
                        </span>
                        <span>•</span>
                        <span className="capitalize">
                          {reminder.student_type}
                        </span>
                        <span>•</span>
                        <span>By {reminder.created_by_name || "Admin"}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {reminder.status !== "done" ? (
                        <button
                          onClick={() => updateStatus(reminder.id, "done")}
                          className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                        >
                          Done
                        </button>
                      ) : null}

                      {reminder.status !== "cancelled" ? (
                        <button
                          onClick={() =>
                            updateStatus(reminder.id, "cancelled")
                          }
                          className="rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-300"
                        >
                          Cancel
                        </button>
                      ) : null}

                      <button
                        onClick={() => removeReminder(reminder.id)}
                        className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300"
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