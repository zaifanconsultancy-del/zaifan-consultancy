import { useEffect, useState } from "react";
import { addTimelineEvent } from "../../lib/crmTimeline";
import {
  createFollowUpReminder,
  deleteFollowUpReminder,
  fetchFollowUpReminders,
  updateFollowUpReminderStatus,
} from "../../lib/followUpReminders";

function FollowUpReminderPanel({ studentId, studentType, adminProfile = null }) {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadReminders = async () => {
    if (!studentId || !studentType) return;

    setLoading(true);

    try {
      const { data, error } = await fetchFollowUpReminders(
        studentId,
        studentType
      );

      if (error) {
        console.error("Reminder load error:", error);
        setReminders([]);
        return;
      }

      setReminders(data || []);
    } catch (error) {
      console.error("Reminder load crashed:", error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [studentId, studentType]);

  const addReminder = async () => {
    if (!title.trim() || !dueDate || saving) return;

    const cleanTitle = title.trim();
    const cleanNotes = notes.trim();

    setSaving(true);

    try {
      const { error } = await createFollowUpReminder({
        studentId,
        studentType,
        title: cleanTitle,
        notes: cleanNotes,
        dueDate,
        dueTime,
        adminProfile,
      });

      if (error) {
        console.error("Reminder save error:", error);
        return;
      }

      await addTimelineEvent({
        studentId,
        studentType,
        actionType: "followup_created",
        title: "Follow-up Reminder Created",
        description: `${cleanTitle} — Due ${dueDate}${
          dueTime ? ` at ${dueTime}` : ""
        }`,
        adminProfile,
      });

      setTitle("");
      setNotes("");
      setDueDate("");
      setDueTime("");

      await loadReminders();
    } catch (error) {
      console.error("Reminder save crashed:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    const reminder = reminders.find((item) => item.id === id);

    try {
      const { error } = await updateFollowUpReminderStatus(id, status);

      if (error) {
        console.error("Reminder status update error:", error);
        return;
      }

      await addTimelineEvent({
        studentId,
        studentType,
        actionType: "followup_status_changed",
        title: "Follow-up Status Updated",
        description: reminder?.title || "Follow-up reminder updated.",
        oldValue: reminder?.status || "",
        newValue: status,
        adminProfile,
      });

      await loadReminders();
    } catch (error) {
      console.error("Reminder status update crashed:", error);
    }
  };

  const removeReminder = async (id) => {
    const confirmed = window.confirm("Delete this follow-up reminder?");
    if (!confirmed) return;

    const reminder = reminders.find((item) => item.id === id);

    try {
      const { error } = await deleteFollowUpReminder(id);

      if (error) {
        console.error("Reminder delete error:", error);
        return;
      }

      await addTimelineEvent({
        studentId,
        studentType,
        actionType: "followup_deleted",
        title: "Follow-up Reminder Deleted",
        description: reminder?.title || "Follow-up reminder deleted.",
        adminProfile,
      });

      await loadReminders();
    } catch (error) {
      console.error("Reminder delete crashed:", error);
    }
  };

  const getDueBadge = (reminder) => {
    if (reminder.status !== "pending") return null;

    if (reminder.due_date < today) {
      return "Overdue";
    }

    if (reminder.due_date === today) {
      return "Due Today";
    }

    return "Upcoming";
  };

  const getBadgeStyle = (badge) => {
    if (badge === "Overdue") {
      return "border-red-400/25 bg-red-500/10 text-red-300";
    }

    if (badge === "Due Today") {
      return "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]";
    }

    return "border-blue-400/25 bg-blue-500/10 text-blue-300";
  };

  const getStatusStyle = (status) => {
    if (status === "done") {
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "cancelled") {
      return "border-red-400/25 bg-red-500/10 text-red-300";
    }

    return "border-white/10 bg-black/20 text-white/50";
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
        <h3 className="text-lg font-semibold text-white">
          Add Follow-up Reminder
        </h3>
        <p className="mt-1 text-sm text-white/45">
          Schedule a future follow-up for this student.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Reminder title"
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/40"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/40"
            />

            <input
              type="time"
              value={dueTime}
              onChange={(event) => setDueTime(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/40"
            />
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Reminder notes"
          className="mt-3 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/40"
        />

        <div className="mt-3 flex justify-end">
          <button
            onClick={addReminder}
            disabled={!title.trim() || !dueDate || saving}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Add Reminder"}
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Follow-up Reminders
            </h3>
            <p className="text-sm text-white/45">
              Pending future actions for this student.
            </p>
          </div>

          <button
            onClick={loadReminders}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
            Loading reminders...
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No follow-up reminders yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const dueBadge = getDueBadge(reminder);

              return (
                <div
                  key={reminder.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {reminder.title}
                        </p>

                        {dueBadge ? (
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getBadgeStyle(
                              dueBadge
                            )}`}
                          >
                            {dueBadge}
                          </span>
                        ) : null}
                      </div>

                      {reminder.notes ? (
                        <p className="mt-1 text-sm text-white/45">
                          {reminder.notes}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        reminder.status
                      )}`}
                    >
                      {reminder.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
                    <span>
                      Due: {reminder.due_date}
                      {reminder.due_time ? ` · ${reminder.due_time}` : ""}
                    </span>
                    <span>By {reminder.created_by_name || "Admin"}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {reminder.status !== "done" ? (
                      <button
                        onClick={() => updateStatus(reminder.id, "done")}
                        className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
                      >
                        Mark Done
                      </button>
                    ) : null}

                    {reminder.status !== "cancelled" ? (
                      <button
                        onClick={() => updateStatus(reminder.id, "cancelled")}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowUpReminderPanel;