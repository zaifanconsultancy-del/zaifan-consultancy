import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 20000;

const emptyTaskForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  assigned_to: "",
  due_date: "",
  notes: "",
};

function TaskCenterPanel({ student = {}, adminProfile = null }) {
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);

  const [loading, setLoading] = useState(false);
  const [savingTitle, setSavingTitle] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  const studentId = student?.id;
  const numericStudentId = Number(studentId);
  const studentType = student?.student_type || student?.type || "inquiry";
  const hasValidStudentId = Number.isFinite(numericStudentId);

  const studentName =
    student?.full_name || student?.name || student?.student_name || "Student";

  const studentApplication = student?.application || null;
  const studentDocuments = Array.isArray(student?.documents)
    ? student.documents
    : [];

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setTasks([]);
    setError("");
    setSuccessMessage("");
    setTaskForm(emptyTaskForm);
    loadTasksOnly();
  }, [studentId]);

  const safeSet = (callback) => {
    if (mountedRef.current) callback();
  };

  const withTimeout = (promise, message = "Request timed out.") =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
      ),
    ]);

  const loadTasksOnly = async () => {
    const requestId = Date.now();
    requestRef.current = requestId;

    if (!hasValidStudentId) {
      safeSet(() => {
        setLoading(false);
        setError("Invalid student id. Tasks cannot load.");
      });
      return;
    }

    safeSet(() => {
      setLoading(true);
      setError("");
      setSuccessMessage("");
    });

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("student_tasks")
          .select(
            "id, student_id, student_type, title, description, status, priority, assigned_to, due_date, notes, completed_at, created_by, created_at, updated_at"
          )
          .eq("student_id", numericStudentId)
          .limit(100),
        "Task loading timed out."
      );

      if (requestRef.current !== requestId) return;
      if (error) throw error;

      const sortedTasks = [...(data || [])].sort((a, b) => {
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
        return bTime - aTime;
      });

      safeSet(() => {
        setTasks(sortedTasks);
        setError("");
      });
    } catch (error) {
      if (requestRef.current !== requestId) return;

      safeSet(() => {
        setTasks([]);
        setError(error.message || "Tasks failed to load.");
      });
    } finally {
      if (requestRef.current !== requestId) return;

      safeSet(() => {
        setLoading(false);
      });
    }
  };

  const createTimelineEvent = ({
    eventType,
    title,
    description = "",
    oldValue = "",
    newValue = "",
  }) => {
    if (!hasValidStudentId || !eventType || !title) return;

    supabase
      .from("student_application_timeline")
      .insert({
        student_id: numericStudentId,
        student_type: studentType,
        application_id: studentApplication?.id
          ? String(studentApplication.id)
          : null,
        event_type: eventType,
        title,
        description,
        old_value: oldValue ? String(oldValue) : null,
        new_value: newValue ? String(newValue) : null,
      })
      .then(() => {})
      .catch(() => {});
  };

  const suggestedTasks = useMemo(() => {
    const requiredDocuments = [
      "Passport",
      "Transcript",
      "Degree",
      "IELTS",
      "Personal Statement",
      "CV",
      "Financial Documents",
    ];

    const missingDocs = requiredDocuments.filter((doc) => {
      const existing = studentDocuments.find(
        (item) =>
          String(item.document_name || "").toLowerCase() ===
          String(doc).toLowerCase()
      );

      return (
        !existing ||
        existing.status === "missing" ||
        existing.status === "rejected"
      );
    });

    const generated = [];

    if (missingDocs.length) {
      generated.push({
        title: "Documents pending",
        description: `${missingDocs.length} document(s) still need attention.`,
        priority: "high",
        notes: missingDocs.join(", "),
      });
    }

    if (!studentApplication) {
      generated.push({
        title: "Create application profile",
        description: "Application record has not been created yet.",
        priority: "medium",
        notes:
          "Create target country, university, program, intake, and status record.",
      });
    }

    if (
      studentApplication?.offer_status === "offer_received" &&
      studentApplication?.visa_status === "not_started"
    ) {
      generated.push({
        title: "Start visa process",
        description: "Offer received. Visa workflow should begin.",
        priority: "high",
        notes:
          "Prepare financials, visa checklist, biometrics, and medical timeline.",
      });
    }

    if (student?.priority === "vip" || student?.priority === "high") {
      generated.push({
        title: "High priority follow-up",
        description: "This student should be contacted quickly.",
        priority: "high",
        notes: "Priority lead. Counselor follow-up required.",
      });
    }

    return generated;
  }, [studentDocuments, studentApplication, student]);

  const taskStats = useMemo(() => {
    const now = new Date();

    const pending = tasks.filter((task) => task.status === "pending").length;
    const inProgress = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    const completed = tasks.filter((task) => task.status === "completed").length;

    const overdue = tasks.filter((task) => {
      if (!task.due_date || task.status === "completed") return false;
      return new Date(task.due_date) < now;
    }).length;

    return {
      total: tasks.length,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }, [tasks]);

  const createTask = async (task, source = "suggested") => {
  if (!hasValidStudentId) return false;

  const title = String(task.title || "").trim();

  if (!title) {
    safeSet(() => setError("Task title is required."));
    return false;
  }

  safeSet(() => {
    setSavingTitle(title);
    setError("");
    setSuccessMessage("");
  });

  const payload = {
    student_id: numericStudentId,
    student_type: studentType,
    title,
    description: task.description || "",
    priority: task.priority || "medium",
    status: task.status || "pending",
    assigned_to: task.assigned_to || "",
    due_date: task.due_date || null,
    notes: task.notes || "",
    created_by: task.created_by || "CRM",
  };

  try {
    const result = await withTimeout(
  supabase.from("student_tasks").insert(payload),
  "Task save timed out. Please try again."
);

    if (result.error) {
      throw result.error;
    }

    safeSet(() => {
      setSuccessMessage("Task created successfully.");
      setTaskForm(emptyTaskForm);
      setTasks((prev) => [
        {
          id: `local-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    });

    createTimelineEvent({
      eventType: "task_created",
      title: "Task Created",
      description: `${
        source === "custom" ? "Custom" : "Suggested"
      } task created for ${studentName}: ${title}`,
      oldValue: "",
      newValue: title,
    });

    return true;
  } catch (error) {
    safeSet(() => {
      setError(error.message || "Task save failed.");
    });

    return false;
  } finally {
    safeSet(() => {
      setSavingTitle("");
      setSavingCustom(false);
    });
  }
};

  const createCustomTask = async () => {
    if (savingCustom) return;

    setSavingCustom(true);

    const success = await createTask(taskForm, "custom");

    if (success) {
      safeSet(() => {
        setTaskForm(emptyTaskForm);
      });
    }

    safeSet(() => {
      setSavingCustom(false);
    });
  };

  const updateTaskStatus = async (task, status) => {
    if (!task?.id || statusSavingId) return;

    const oldStatus = task.status || "pending";
    const completedAt = status === "completed" ? new Date().toISOString() : null;

    safeSet(() => {
      setStatusSavingId(task.id);
      setError("");
      setSuccessMessage("");
    });

    try {
      const { error } = await withTimeout(
        supabase
          .from("student_tasks")
          .update({
            status,
            completed_at: completedAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id),
        "Task status update timed out."
      );

      if (error) throw error;

      safeSet(() => {
        setSuccessMessage("Task status updated.");
        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status,
                  completed_at: completedAt,
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );
      });

      createTimelineEvent({
        eventType:
          status === "completed" ? "task_completed" : "task_status_changed",
        title: status === "completed" ? "Task Completed" : "Task Status Updated",
        description: `${task.title} changed from ${oldStatus} to ${status}.`,
        oldValue: oldStatus,
        newValue: status,
      });
    } catch (error) {
      safeSet(() => {
        setError(error.message || "Task status update failed.");
      });
    } finally {
      safeSet(() => {
        setStatusSavingId("");
      });
    }
  };

  const priorityStyle = (priority) => {
    const styles = {
      urgent: "border-red-400/30 bg-red-500/10 text-red-300",
      high: "border-orange-400/30 bg-orange-500/10 text-orange-300",
      medium: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    };

    return styles[priority] || styles.medium;
  };

  const statusStyle = (status) => {
    const styles = {
      pending: "border-yellow-400/30 bg-yellow-500/10 text-yellow-300",
      in_progress: "border-blue-400/30 bg-blue-500/10 text-blue-300",
      completed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
      blocked: "border-red-400/30 bg-red-500/10 text-red-300",
    };

    return styles[status] || styles.pending;
  };

  const isOverdue = (task) => {
    if (!task?.due_date || task.status === "completed") return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <div className="rounded-[1.75rem] border border-orange-400/20 bg-orange-500/[0.03] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">
            Operations Task Center
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            Student Task System
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Create counselor tasks, assign ownership, track deadlines, complete
            work, and keep the student journey moving without freezing the CRM.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTasksOnly}
          disabled={loading}
          className="rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-300 transition hover:border-orange-400/45 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Tasks"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <MiniStat label="Total" value={taskStats.total} />
        <MiniStat label="Pending" value={taskStats.pending} />
        <MiniStat label="In Progress" value={taskStats.inProgress} />
        <MiniStat label="Completed" value={taskStats.completed} />
        <MiniStat
          label="Overdue"
          value={taskStats.overdue}
          danger={taskStats.overdue > 0}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
          Loading tasks. If Supabase is slow, this will safely stop after a few
          seconds.
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
          Create Custom Task
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputField
            label="Task Title"
            value={taskForm.title}
            placeholder="Example: Collect passport copy"
            onChange={(value) =>
              setTaskForm((prev) => ({ ...prev, title: value }))
            }
          />

          <InputField
            label="Assigned To"
            value={taskForm.assigned_to}
            placeholder="Counselor / Staff name"
            onChange={(value) =>
              setTaskForm((prev) => ({ ...prev, assigned_to: value }))
            }
          />

          <SelectField
            label="Priority"
            value={taskForm.priority}
            options={["urgent", "high", "medium", "low"]}
            onChange={(value) =>
              setTaskForm((prev) => ({ ...prev, priority: value }))
            }
          />

          <InputField
            label="Due Date"
            type="datetime-local"
            value={taskForm.due_date}
            onChange={(value) =>
              setTaskForm((prev) => ({ ...prev, due_date: value }))
            }
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TextAreaField
            label="Description"
            value={taskForm.description}
            placeholder="What needs to be done?"
            onChange={(value) =>
              setTaskForm((prev) => ({ ...prev, description: value }))
            }
          />

          <TextAreaField
            label="Notes"
            value={taskForm.notes}
            placeholder="Internal task notes, staff context, student context..."
            onChange={(value) =>
              setTaskForm((prev) => ({ ...prev, notes: value }))
            }
          />
        </div>

        <button
          type="button"
          onClick={createCustomTask}
          disabled={savingCustom || !taskForm.title.trim()}
          className="mt-4 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingCustom ? "Creating Task..." : "Create Task"}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
          Suggested Tasks
        </p>

        {suggestedTasks.length ? (
          suggestedTasks.map((task) => (
            <div
              key={task.title}
              className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-orange-300">{task.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    {task.description}
                  </p>

                  {task.notes ? (
                    <p className="mt-2 text-xs text-white/35">{task.notes}</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={savingTitle === task.title}
                  onClick={() => createTask(task, "suggested")}
                  className="rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-300 transition hover:border-orange-400/40 disabled:opacity-50"
                >
                  {savingTitle === task.title ? "Saving..." : "Save Task"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            No urgent suggested tasks.
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
          Saved Tasks
        </p>

        {tasks.length ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl border p-4 ${
                isOverdue(task)
                  ? "border-red-400/25 bg-red-500/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words font-semibold text-white">
                      {task.title}
                    </p>

                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold capitalize ${priorityStyle(
                        task.priority
                      )}`}
                    >
                      {task.priority || "medium"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-bold capitalize ${statusStyle(
                        task.status
                      )}`}
                    >
                      {(task.status || "pending").replaceAll("_", " ")}
                    </span>

                    {isOverdue(task) ? (
                      <span className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-300">
                        Overdue
                      </span>
                    ) : null}
                  </div>

                  {task.description ? (
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      {task.description}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-2 text-xs text-white/35 md:grid-cols-2">
                    <p>
                      Assigned:{" "}
                      <span className="text-white/55">
                        {task.assigned_to || "Unassigned"}
                      </span>
                    </p>

                    <p>
                      Due:{" "}
                      <span
                        className={
                          isOverdue(task) ? "text-red-300" : "text-white/55"
                        }
                      >
                        {task.due_date
                          ? new Date(task.due_date).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No due date"}
                      </span>
                    </p>

                    <p>
                      Created By:{" "}
                      <span className="text-white/55">
                        {task.created_by || "CRM"}
                      </span>
                    </p>

                    <p>
                      Completed:{" "}
                      <span className="text-white/55">
                        {task.completed_at
                          ? new Date(task.completed_at).toLocaleString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Not completed"}
                      </span>
                    </p>
                  </div>

                  {task.notes ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/45">
                      {task.notes}
                    </div>
                  ) : null}
                </div>

                <select
                  value={task.status || "pending"}
                  disabled={statusSavingId === task.id}
                  onChange={(event) => updateTaskStatus(task, event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37]/40 disabled:opacity-50"
                >
                  <option className="bg-black" value="pending">
                    pending
                  </option>
                  <option className="bg-black" value="in_progress">
                    in progress
                  </option>
                  <option className="bg-black" value="completed">
                    completed
                  </option>
                  <option className="bg-black" value="blocked">
                    blocked
                  </option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
            No saved tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, danger = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-red-400/25 bg-red-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p
        className={
          danger
            ? "mt-2 text-2xl font-black text-red-300"
            : "mt-2 text-2xl font-black text-[#D4AF37]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options = [] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm capitalize text-white outline-none transition focus:border-[#D4AF37]/40"
      >
        {options.map((item) => (
          <option key={item} value={item} className="bg-black">
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#D4AF37]/40"
      />
    </div>
  );
}

export default TaskCenterPanel;