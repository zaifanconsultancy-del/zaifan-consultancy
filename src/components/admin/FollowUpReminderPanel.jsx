import { useEffect, useRef, useState } from "react";
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
  const [statusSavingId, setStatusSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const today = new Date().toISOString().slice(0, 10);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
  let mounted = true;

  const run = async () => {
    if (!mounted) return;

    setReminders([]);
    setErrorMessage("");
    setSuccessMessage("");

    await loadReminders();
  };

  run();

  return () => {
    mounted = false;
  };
}, [studentId, studentType]);

  const loadReminders = async () => {
    const requestId = Date.now();
    requestRef.current = requestId;

    if (!studentId || !studentType) {
      safeSet(() => {
        setReminders([]);
        setLoading(false);
        setErrorMessage("Missing student ID or student type.");
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
    });

    try {
      const { data, error } = await fetchFollowUpReminders(
        studentId,
        studentType
      );

      if (requestRef.current !== requestId) return;

      if (error) {
        throw error;
      }

      safeSet(() => {
        setReminders(data || []);
        setErrorMessage("");
      });
    } catch (error) {
      if (requestRef.current !== requestId) return;

      console.error("Reminder load crashed:", error);

      safeSet(() => {
        setReminders([]);
        setErrorMessage(error.message || "Reminders failed to load.");
      });
    } finally {
      if (requestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const addReminder = async () => {
    if (!title.trim() || !dueDate || saving) return;

    const cleanTitle = title.trim();
    const cleanNotes = notes.trim();

    safeSet(() => {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
    });

    try {
      const { data, error } = await createFollowUpReminder({
        studentId,
        studentType,
        title: cleanTitle,
        notes: cleanNotes,
        dueDate,
        dueTime,
        adminProfile,
      });

      if (error) {
        throw error;
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

      safeSet(() => {
        setTitle("");
        setNotes("");
        setDueDate("");
        setDueTime("");
        setSuccessMessage("Reminder created successfully.");
        setReminders((prev) => [
          data || {
            id: `local-${Date.now()}`,
            student_id: String(studentId),
            student_type: studentType,
            title: cleanTitle,
            notes: cleanNotes,
            due_date: dueDate,
            due_time: dueTime || null,
            status: "pending",
            created_by_name:
              adminProfile?.full_name ||
              adminProfile?.email ||
              adminProfile?.role ||
              "Admin",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      });

      await loadReminders();
    } catch (error) {
      console.error("Reminder save crashed:", error);

      safeSet(() => {
        setErrorMessage(error.message || "Reminder save failed.");
      });
    } finally {
      safeSet(() => {
        setSaving(false);
      });
    }
  };

  const updateStatus = async (id, status) => {
    if (!id || statusSavingId) return;

    const reminder = reminders.find((item) => item.id === id);
    const oldStatus = reminder?.status || "";

    safeSet(() => {
      setStatusSavingId(id);
      setErrorMessage("");
      setSuccessMessage("");
    });

    try {
      const { error } = await updateFollowUpReminderStatus(id, status);

      if (error) {
        throw error;
      }

      await addTimelineEvent({
        studentId,
        studentType,
        actionType: "followup_status_changed",
        title: "Follow-up Status Updated",
        description: reminder?.title || "Follow-up reminder updated.",
        oldValue: oldStatus,
        newValue: status,
        adminProfile,
      });

      safeSet(() => {
        setSuccessMessage("Reminder status updated.");
        setReminders((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  completed_at:
                    status === "done" ? new Date().toISOString() : null,
                }
              : item
          )
        );
      });

      await loadReminders();
    } catch (error) {
      console.error("Reminder status update crashed:", error);

      safeSet(() => {
        setErrorMessage(error.message || "Reminder status update failed.");
      });
    } finally {
      safeSet(() => {
        setStatusSavingId("");
      });
    }
  };

  const removeReminder = async (id) => {
    if (!id || deletingId) return;

    const confirmed = window.confirm("Delete this follow-up reminder?");
    if (!confirmed) return;

    const reminder = reminders.find((item) => item.id === id);

    safeSet(() => {
      setDeletingId(id);
      setErrorMessage("");
      setSuccessMessage("");
    });

    try {
      const { error } = await deleteFollowUpReminder(id);

      if (error) {
        throw error;
      }

      await addTimelineEvent({
        studentId,
        studentType,
        actionType: "followup_deleted",
        title: "Follow-up Reminder Deleted",
        description: reminder?.title || "Follow-up reminder deleted.",
        adminProfile,
      });

      safeSet(() => {
        setSuccessMessage("Reminder deleted.");
        setReminders((prev) => prev.filter((item) => item.id !== id));
      });

      await loadReminders();
    } catch (error) {
      console.error("Reminder delete crashed:", error);

      safeSet(() => {
        setErrorMessage(error.message || "Reminder delete failed.");
      });
    } finally {
      safeSet(() => {
        setDeletingId("");
      });
    }
  };

  const getDueBadge = (reminder) => {
    if ((reminder.status || "pending") !== "pending") return null;

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

  const formatDate = (value) => {
    if (!value) return "No date";
    return String(value);
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

      {errorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

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
            disabled={loading}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
            Loading reminders. If Supabase is slow, this will safely stop.
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No follow-up reminders yet.
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const dueBadge = getDueBadge(reminder);
              const isStatusSaving = statusSavingId === reminder.id;
              const isDeleting = deletingId === reminder.id;

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
                        <p className="mt-1 whitespace-pre-wrap text-sm text-white/45">
                          {reminder.notes}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        reminder.status
                      )}`}
                    >
                      {reminder.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
                    <span>
                      Due: {formatDate(reminder.due_date)}
                      {reminder.due_time ? ` · ${reminder.due_time}` : ""}
                    </span>
                    <span>By {reminder.created_by_name || "Admin"}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {reminder.status !== "done" ? (
                      <button
                        onClick={() => updateStatus(reminder.id, "done")}
                        disabled={Boolean(statusSavingId || deletingId)}
                        className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 disabled:opacity-50"
                      >
                        {isStatusSaving ? "Saving..." : "Mark Done"}
                      </button>
                    ) : null}

                    {reminder.status !== "cancelled" ? (
                      <button
                        onClick={() => updateStatus(reminder.id, "cancelled")}
                        disabled={Boolean(statusSavingId || deletingId)}
                        className="rounded-full border border-yellow-400/25 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-300 disabled:opacity-50"
                      >
                        {isStatusSaving ? "Saving..." : "Cancel"}
                      </button>
                    ) : null}

                    <button
                      onClick={() => removeReminder(reminder.id)}
                      disabled={Boolean(statusSavingId || deletingId)}
                      className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
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