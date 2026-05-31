import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function TaskCenterPanel({ student = {} }) {
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingTitle, setSavingTitle] = useState("");
  const [error, setError] = useState("");

  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  useEffect(() => {
    loadOperationalData();
  }, [studentId]);

  const loadOperationalData = async () => {
    if (!studentId) return;

    setLoading(true);
    setError("");

    const [taskResult, docsResult, appResult] = await Promise.all([
      supabase.from("student_tasks").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
      supabase.from("student_documents").select("*").eq("student_id", studentId),
      supabase.from("student_applications").select("*").eq("student_id", studentId).maybeSingle(),
    ]);

    if (taskResult.error) setError(taskResult.error.message);

    setTasks(taskResult.data || []);
    setDocuments(docsResult.data || []);
    setApplication(appResult.data || null);
    setLoading(false);
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
      const existing = documents.find((item) => item.document_name === doc);
      return !existing || existing.status === "missing" || existing.status === "rejected";
    });

    const generated = [];

    if (missingDocs.length) {
      generated.push({
        title: "Documents pending",
        description: `${missingDocs.length} document(s) still need attention.`,
        priority: "high",
      });
    }

    if (!application) {
      generated.push({
        title: "Create application profile",
        description: "Application record has not been created yet.",
        priority: "medium",
      });
    }

    if (application?.offer_status === "offer_received" && application?.visa_status === "not_started") {
      generated.push({
        title: "Start visa process",
        description: "Offer received. Visa workflow should begin.",
        priority: "high",
      });
    }

    if (student?.priority === "vip" || student?.priority === "high") {
      generated.push({
        title: "High priority follow-up",
        description: "This student should be contacted quickly.",
        priority: "high",
      });
    }

    return generated;
  }, [documents, application, student]);

  const createTask = async (task) => {
    if (!studentId) return;

    setSavingTitle(task.title);
    setError("");

    const { error } = await supabase.from("student_tasks").insert({
      student_id: studentId,
      student_type: studentType,
      title: task.title,
      description: task.description,
      priority: task.priority || "medium",
      status: "pending",
    });

    if (error) setError(error.message);
    else await loadOperationalData();

    setSavingTitle("");
  };

  const updateTaskStatus = async (taskId, status) => {
    const { error } = await supabase
      .from("student_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) setError(error.message);
    else await loadOperationalData();
  };

  return (
    <div className="rounded-[1.75rem] border border-orange-400/20 bg-orange-500/[0.03] p-6">
      <h3 className="font-bold text-white">Operations Task Center</h3>

      <p className="mt-2 text-sm text-white/50">
        Real task generation, task saving, and task completion for this student.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-white/45">Loading tasks...</p>
      ) : (
        <>
          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              Suggested Tasks
            </p>

            {suggestedTasks.length ? (
              suggestedTasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-xl border border-orange-400/20 bg-orange-500/10 p-4"
                >
                  <p className="font-semibold text-orange-300">{task.title}</p>
                  <p className="mt-1 text-sm text-white/50">{task.description}</p>

                  <button
                    type="button"
                    disabled={savingTitle === task.title}
                    onClick={() => createTask(task)}
                    className="mt-3 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-300 disabled:opacity-50"
                  >
                    {savingTitle === task.title ? "Saving..." : "Save Task"}
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-300">
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
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="mt-1 text-sm text-white/50">{task.description}</p>
                    </div>

                    <select
                      value={task.status || "pending"}
                      onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                      className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option className="bg-black" value="pending">pending</option>
                      <option className="bg-black" value="in_progress">in progress</option>
                      <option className="bg-black" value="completed">completed</option>
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
        </>
      )}
    </div>
  );
}

export default TaskCenterPanel;