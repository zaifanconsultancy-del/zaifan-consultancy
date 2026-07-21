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
      if (error) throw error;

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

      if (error) throw error;

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

      if (error) throw error;

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

      if (error) throw error;

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
    if (reminder.due_date < today) return "Overdue";
    if (reminder.due_date === today) return "Due Today";
    return "Upcoming";
  };

  const getBadgeStyle = (badge) => {
    if (badge === "Overdue") {
      return "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]";
    }

    if (badge === "Due Today") {
      return "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]";
    }

    return "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]";
  };

  const getStatusStyle = (status) => {
    if (status === "done") {
      return "border-[#E9802D]/35 bg-[#FFF3E7] text-[#B84F0E]";
    }

    if (status === "cancelled") {
      return "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]";
    }

    return "border-[#243A60]/20 bg-[#F3F5F8] text-[#596579]";
  };

  const formatDate = (value) => {
    if (!value) return "No date";
    return String(value);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_14px_34px_rgba(23,36,61,0.06)]">
        <h3 className="text-lg font-black text-[#17243D]">
          Add Follow-up Reminder
        </h3>

        <p className="mt-1 text-sm leading-6 text-[#667085]">
          Schedule a future follow-up for this student.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Reminder title"
            className="rounded-2xl border border-[#243A60]/22 bg-white px-4 py-3 text-sm font-semibold text-[#17243D] outline-none placeholder:text-[#98A0AE] focus:border-[#E9802D]/55 focus:ring-4 focus:ring-[#E9802D]/10"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="date"
              value={dueDate}
              min={today}
              onChange={(event) => setDueDate(event.target.value)}
              className="rounded-2xl border border-[#243A60]/22 bg-white px-4 py-3 text-sm font-semibold text-[#17243D] outline-none focus:border-[#E9802D]/55 focus:ring-4 focus:ring-[#E9802D]/10"
            />

            <input
              type="time"
              value={dueTime}
              onChange={(event) => setDueTime(event.target.value)}
              className="rounded-2xl border border-[#243A60]/22 bg-white px-4 py-3 text-sm font-semibold text-[#17243D] outline-none focus:border-[#E9802D]/55 focus:ring-4 focus:ring-[#E9802D]/10"
            />
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Reminder notes"
          className="mt-3 min-h-[90px] w-full resize-none rounded-2xl border border-[#243A60]/22 bg-white p-4 text-sm font-semibold text-[#17243D] outline-none placeholder:text-[#98A0AE] focus:border-[#E9802D]/55 focus:ring-4 focus:ring-[#E9802D]/10"
        />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={addReminder}
            disabled={!title.trim() || !dueDate || saving}
            className="rounded-full border border-[#E9802D] bg-[#E9802D] px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#D96C1F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Add Reminder"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm font-semibold text-[#A8342F]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-[#E9802D]/35 bg-[#FFF3E7] p-4 text-sm font-semibold text-[#B84F0E]">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border-2 border-[#243A60]/28 bg-[#FFFDF8] p-5 shadow-[0_14px_34px_rgba(23,36,61,0.06)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-[#17243D]">
              Follow-up Reminders
            </h3>

            <p className="text-sm leading-6 text-[#667085]">
              Pending future actions for this student.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReminders}
            disabled={loading}
            className="rounded-full border border-[#243A60]/22 bg-white px-4 py-2 text-xs font-black text-[#596579] transition hover:border-[#E9802D]/40 hover:text-[#B84F0E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#243A60]/20 bg-white p-4 text-sm font-semibold text-[#667085]">
            Loading reminders. If Supabase is slow, this will safely stop.
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#243A60]/25 bg-[#F7F3EB] p-5 text-sm font-semibold text-[#667085]">
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
                  className="rounded-2xl border border-[#243A60]/22 bg-white p-4 transition duration-300 hover:border-[#E9802D]/40 hover:shadow-[0_10px_24px_rgba(23,36,61,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black text-[#17243D]">
                          {reminder.title}
                        </p>

                        {dueBadge ? (
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${getBadgeStyle(
                              dueBadge
                            )}`}
                          >
                            {dueBadge}
                          </span>
                        ) : null}
                      </div>

                      {reminder.notes ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#667085]">
                          {reminder.notes}
                        </p>
                      ) : null}
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                        reminder.status
                      )}`}
                    >
                      {reminder.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#7A8392]">
                    <span>
                      Due: {formatDate(reminder.due_date)}
                      {reminder.due_time ? ` · ${reminder.due_time}` : ""}
                    </span>
                    <span>By {reminder.created_by_name || "Admin"}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {reminder.status !== "done" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(reminder.id, "done")}
                        disabled={Boolean(statusSavingId || deletingId)}
                        className="rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1.5 text-xs font-black text-[#B84F0E] disabled:opacity-50"
                      >
                        {isStatusSaving ? "Saving..." : "Mark Done"}
                      </button>
                    ) : null}

                    {reminder.status !== "cancelled" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(reminder.id, "cancelled")}
                        disabled={Boolean(statusSavingId || deletingId)}
                        className="rounded-full border border-[#A36A18]/30 bg-[#FFF7E8] px-3 py-1.5 text-xs font-black text-[#8A5611] disabled:opacity-50"
                      >
                        {isStatusSaving ? "Saving..." : "Cancel"}
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => removeReminder(reminder.id)}
                      disabled={Boolean(statusSavingId || deletingId)}
                      className="rounded-full border border-[#C2413B]/30 bg-[#FFF0EE] px-3 py-1.5 text-xs font-black text-[#A8342F] disabled:opacity-50"
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