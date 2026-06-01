import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { createFollowUpReminder } from "../../lib/followUpReminders";
import { addTimelineEvent } from "../../lib/crmTimeline";

const ACTION_TIMEOUT_MS = 12000;

async function withActionTimeout(promise, message = "Action timed out.") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ACTION_TIMEOUT_MS)
    ),
  ]);
}

function AIActionPanel({
  student = {},
  parsed = null,
  activeModule = "",
  adminProfile = null,
}) {
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");

  const studentId = student?.id;
  const studentType = student?.student_type || student?.type || "inquiry";

  const studentName =
    student?.full_name || student?.name || student?.student_name || "Student";

  const recommendedText = useMemo(() => {
    const actions =
      parsed?.recommendedActions ||
      parsed?.recommended_actions ||
      parsed?.priorityActions ||
      parsed?.followUpPlan ||
      [];

    if (Array.isArray(actions) && actions.length > 0) {
      return actions.map(formatActionItem).join("\n");
    }

    return parsed?.summary || "AI recommended counselor follow-up.";
  }, [parsed]);

  const emailText =
    parsed?.emailBody ||
    parsed?.email_body ||
    parsed?.summary ||
    recommendedText;

  const whatsappText =
    parsed?.whatsappMessage ||
    parsed?.whatsapp_message ||
    parsed?.summary ||
    recommendedText;

  const emailSubject =
    parsed?.subject ||
    parsed?.emailSubject ||
    parsed?.email_subject ||
    "AI Generated Email Draft";

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const runAction = async (type, callback) => {
    if (!studentId) {
      setMessage("Student ID missing. Action skipped.");
      return;
    }

    if (busyAction) return;

    setBusyAction(type);
    setMessage("");

    try {
      await withActionTimeout(
        callback(),
        "AI action took too long. Please refresh and check if it was created."
      );

      setMessage("AI action completed successfully.");
    } catch (error) {
      console.error("AI action failed:", error);
      setMessage(error.message || "AI action failed.");
    } finally {
      setBusyAction("");
    }
  };

  const saveCommunicationLog = async ({
    channel,
    subject = "",
    message = "",
  }) => {
    if (!studentId || !message) {
      throw new Error("Missing communication message.");
    }

    const payload = {
      student_id: String(studentId),
      student_type: studentType,
      channel,
      subject,
      message,
      status: "draft",
    };

    const { error } = await supabase
      .from("student_communications")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
  };

  const createTask = async () => {
    const payload = {
      student_id: Number(studentId),
      student_type: studentType,
      title: `AI Task: Follow up with ${studentName}`,
      description: recommendedText,
      status: "pending",
      due_date: tomorrow,
      created_by: adminProfile?.id || null,
    };

    const { error } = await supabase
      .from("student_tasks")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    await addTimelineEvent({
      studentId,
      studentType,
      actionType: "ai_task_created",
      title: "AI created a task",
      description: recommendedText,
      adminProfile,
      metadata: {
        source: "ai_action_panel",
        module: activeModule,
      },
    });
  };

  const createReminder = async () => {
    const { error } = await createFollowUpReminder({
      studentId,
      studentType,
      title: `AI Reminder: Follow up with ${studentName}`,
      notes: recommendedText,
      dueDate: tomorrow,
      dueTime: null,
      adminProfile,
    });

    if (error) throw error;

    await addTimelineEvent({
      studentId,
      studentType,
      actionType: "ai_reminder_created",
      title: "AI created a follow-up reminder",
      description: recommendedText,
      adminProfile,
      metadata: {
        source: "ai_action_panel",
        module: activeModule,
      },
    });
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(emailText || "");

    await saveCommunicationLog({
      channel: "email",
      subject: emailSubject,
      message: emailText || "",
    });

    await addTimelineEvent({
      studentId,
      studentType,
      actionType: "ai_email_generated",
      title: "AI email draft copied and saved",
      description: emailText,
      adminProfile,
      metadata: {
        source: "ai_action_panel",
        module: activeModule,
        saved_to: "student_communications",
      },
    });
  };

  const copyWhatsApp = async () => {
    await navigator.clipboard.writeText(whatsappText || "");

    await saveCommunicationLog({
      channel: "whatsapp",
      subject: "AI Generated WhatsApp Draft",
      message: whatsappText || "",
    });

    await addTimelineEvent({
      studentId,
      studentType,
      actionType: "ai_whatsapp_generated",
      title: "AI WhatsApp draft copied and saved",
      description: whatsappText,
      adminProfile,
      metadata: {
        source: "ai_action_panel",
        module: activeModule,
        saved_to: "student_communications",
      },
    });
  };

  return (
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4AF37]">
            AI Actions Layer
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            Turn GPT recommendation into CRM action
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Human-approved actions only. GPT suggests, admin clicks, CRM
            executes.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold text-white/45">
          {activeModule || "AI Module"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActionButton
          label="Create Task"
          icon="✅"
          loading={busyAction === "task"}
          disabled={Boolean(busyAction)}
          onClick={() => runAction("task", createTask)}
        />

        <ActionButton
          label="Create Reminder"
          icon="⏰"
          loading={busyAction === "reminder"}
          disabled={Boolean(busyAction)}
          onClick={() => runAction("reminder", createReminder)}
        />

        <ActionButton
          label="Copy Email"
          icon="✉️"
          loading={busyAction === "email"}
          disabled={Boolean(busyAction)}
          onClick={() => runAction("email", copyEmail)}
        />

        <ActionButton
          label="Copy WhatsApp"
          icon="💬"
          loading={busyAction === "whatsapp"}
          disabled={Boolean(busyAction)}
          onClick={() => runAction("whatsapp", copyWhatsApp)}
        />
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">
          {message}
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-white/35">
          Action Source
        </p>

        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-white/55">
          {recommendedText}
        </p>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, loading, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/35 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-55"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl">{icon}</span>

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35 group-hover:text-[#D4AF37]">
          AI
        </span>
      </div>

      <p className="mt-3 font-black text-white">
        {loading ? "Working..." : label}
      </p>
    </button>
  );
}

function formatActionItem(item) {
  if (typeof item === "string") return item;

  if (item?.title && item?.description) {
    return `${item.title}: ${item.description}`;
  }

  return (
    item?.title ||
    item?.description ||
    item?.action ||
    item?.reason ||
    JSON.stringify(item)
  );
}

export default AIActionPanel;
