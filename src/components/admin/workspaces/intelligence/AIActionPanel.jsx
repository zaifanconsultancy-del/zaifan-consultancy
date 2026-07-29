// AIActionPanel V4 MAXIMUM — Human-Approved CRM Execution Engine
// src/components/admin/AIActionPanel.jsx
//
// Maximum pass:
// - preserves existing component props and parent compatibility
// - preserves Supabase student_tasks + student_communications integration
// - preserves follow-up reminder helper + CRM timeline integration
// - adds stronger input normalization and student identity validation
// - uses student_id without unsafe forced Number conversion
// - separates clipboard failure from CRM persistence where possible
// - prevents duplicate clicks while an action is running
// - returns useful action-specific success/error feedback
// - adds execution preview for task/reminder/email/WhatsApp
// - adds explicit human-review / no-auto-send guardrails
// - adds safer timeouts around every remote operation
// - handles missing AI output instead of silently creating weak records
// - uses icons rather than emoji for Admin OS consistency
// - responsive, accessible, high-contrast Zaifan Admin OS styling
// - navy surfaces contain white text only

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Copy,
  FileCheck2,
  ListTodo,
  Loader2,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { createFollowUpReminder } from "../../../../lib/followUpReminders";
import { addTimelineEvent } from "../../../../lib/crmTimeline";

const ACTION_TIMEOUT_MS = 15000;

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeStudentType(value) {
  const normalized = normalizeText(value).toLowerCase();
  return normalized || "inquiry";
}

function getErrorMessage(error, fallback = "Action failed.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error?.message || error?.error_description || error?.details || fallback;
}

async function withActionTimeout(
  promise,
  message = "Action timed out. Refresh the student record before retrying."
) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ACTION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function copyToClipboard(text) {
  const cleanText = normalizeText(text);

  if (!cleanText) {
    throw new Error("There is no generated text to copy.");
  }

  if (!navigator?.clipboard?.writeText) {
    throw new Error("Clipboard access is unavailable in this browser.");
  }

  await navigator.clipboard.writeText(cleanText);
}

function AIActionPanel({
  student = {},
  parsed = null,
  activeModule = "",
  adminProfile = null,
}) {
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [selectedAction, setSelectedAction] = useState("task");

  const studentId = student?.id;
  const studentType = normalizeStudentType(
    student?.student_type || student?.type
  );

  const studentName =
    normalizeText(
      student?.full_name || student?.name || student?.student_name
    ) || "Student";

  const recommendedText = useMemo(() => {
    const actions =
      parsed?.recommendedActions ||
      parsed?.recommended_actions ||
      parsed?.priorityActions ||
      parsed?.priority_actions ||
      parsed?.followUpPlan ||
      parsed?.follow_up_plan ||
      [];

    if (Array.isArray(actions) && actions.length > 0) {
      return actions
        .map(formatActionItem)
        .filter(Boolean)
        .join("\n");
    }

    return normalizeText(
      parsed?.recommendation ||
        parsed?.nextAction ||
        parsed?.next_action ||
        parsed?.summary
    );
  }, [parsed]);

  const emailText = normalizeText(
    parsed?.emailBody ||
      parsed?.email_body ||
      parsed?.emailDraft ||
      parsed?.email_draft ||
      parsed?.summary ||
      recommendedText
  );

  const whatsappText = normalizeText(
    parsed?.whatsappMessage ||
      parsed?.whatsapp_message ||
      parsed?.whatsAppMessage ||
      parsed?.whatsappDraft ||
      parsed?.whatsapp_draft ||
      parsed?.summary ||
      recommendedText
  );

  const emailSubject =
    normalizeText(
      parsed?.subject ||
        parsed?.emailSubject ||
        parsed?.email_subject
    ) || `Zaifan follow-up for ${studentName}`;

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  const hasRecommendation = Boolean(recommendedText);
  const hasEmail = Boolean(emailText);
  const hasWhatsApp = Boolean(whatsappText);
  const canExecute = Boolean(studentId);

  const actions = [
    {
      id: "task",
      label: "Create Task",
      shortLabel: "Task",
      Icon: ListTodo,
      description: "Write a counselor follow-up task to Student OS.",
      previewTitle: `AI Task: Follow up with ${studentName}`,
      previewBody:
        recommendedText || "No AI recommendation is available yet.",
      available: hasRecommendation,
      execute: createTask,
      tone: "orange",
    },
    {
      id: "reminder",
      label: "Create Reminder",
      shortLabel: "Reminder",
      Icon: Clock3,
      description: "Create a follow-up reminder due tomorrow.",
      previewTitle: `AI Reminder: Follow up with ${studentName}`,
      previewBody:
        recommendedText || "No AI recommendation is available yet.",
      available: hasRecommendation,
      execute: createReminder,
      tone: "blue",
    },
    {
      id: "email",
      label: "Copy + Save Email",
      shortLabel: "Email",
      Icon: Mail,
      description: "Copy the draft and store it in communication history.",
      previewTitle: emailSubject,
      previewBody: emailText || "No email draft is available yet.",
      available: hasEmail,
      execute: copyEmail,
      tone: "emerald",
    },
    {
      id: "whatsapp",
      label: "Copy + Save WhatsApp",
      shortLabel: "WhatsApp",
      Icon: MessageCircle,
      description: "Copy the message and store it in communication history.",
      previewTitle: `WhatsApp draft for ${studentName}`,
      previewBody:
        whatsappText || "No WhatsApp draft is available yet.",
      available: hasWhatsApp,
      execute: copyWhatsApp,
      tone: "amber",
    },
  ];

  const activeAction =
    actions.find((action) => action.id === selectedAction) || actions[0];

  async function runAction(action) {
    if (!studentId) {
      setFeedback({
        type: "error",
        title: "Student identity missing",
        detail:
          "This action was blocked because the current student record has no ID.",
      });
      return;
    }

    if (!action?.available) {
      setFeedback({
        type: "warning",
        title: "Nothing to execute yet",
        detail:
          "Generate or load AI output first, then review it before creating the CRM action.",
      });
      return;
    }

    if (busyAction) return;

    setBusyAction(action.id);
    setFeedback(null);

    try {
      const result = await withActionTimeout(
        Promise.resolve(action.execute()),
        `${action.label} took too long. Refresh the student record and verify whether it was created before retrying.`
      );

      setFeedback({
        type: "success",
        title: `${action.shortLabel} completed`,
        detail:
          result?.message ||
          getSuccessMessage(action.id),
      });
    } catch (error) {
      console.error(`[AIActionPanel] ${action.id} failed:`, error);

      setFeedback({
        type: "error",
        title: `${action.shortLabel} failed`,
        detail: getErrorMessage(
          error,
          `${action.label} could not be completed.`
        ),
      });
    } finally {
      setBusyAction("");
    }
  }

  async function writeTimelineEvent(payload) {
    try {
      await withActionTimeout(
        Promise.resolve(
          addTimelineEvent({
            studentId,
            studentType,
            adminProfile,
            ...payload,
          })
        ),
        "CRM timeline logging timed out."
      );
    } catch (error) {
      // The core action has already succeeded. Timeline logging should not
      // create duplicate tasks/reminders if the admin retries.
      console.warn("[AIActionPanel] Timeline event was not recorded:", error);
    }
  }

  async function saveCommunicationLog({
    channel,
    subject = "",
    message = "",
  }) {
    const cleanMessage = normalizeText(message);

    if (!studentId) {
      throw new Error("Student ID is missing.");
    }

    if (!cleanMessage) {
      throw new Error("Communication draft is empty.");
    }

    const payload = {
      student_id: String(studentId),
      student_type: studentType,
      channel,
      subject: normalizeText(subject),
      message: cleanMessage,
      status: "draft",
    };

    const response = await withActionTimeout(
      supabase
        .from("student_communications")
        .insert(payload)
        .select()
        .single(),
      "Saving communication history timed out."
    );

    if (response?.error) throw response.error;

    return response?.data;
  }

  async function createTask() {
    if (!recommendedText) {
      throw new Error("No AI recommendation is available for the task.");
    }

    const payload = {
      // Do not force Number(studentId). UUID/string IDs would otherwise become NaN.
      student_id: studentId,
      student_type: studentType,
      title: `AI Task: Follow up with ${studentName}`,
      description: recommendedText,
      status: "pending",
      due_date: tomorrow,
      created_by: adminProfile?.id || null,
    };

    const response = await withActionTimeout(
      supabase
        .from("student_tasks")
        .insert(payload)
        .select()
        .single(),
      "Creating the student task timed out."
    );

    if (response?.error) throw response.error;

    await writeTimelineEvent({
      actionType: "ai_task_created",
      title: "AI-assisted task created",
      description: recommendedText,
      metadata: {
        source: "ai_action_panel",
        module: activeModule || null,
        task_id: response?.data?.id || null,
        human_approved: true,
      },
    });

    return {
      message:
        "Task saved to Student OS. The recommendation was executed only after admin approval.",
    };
  }

  async function createReminder() {
    if (!recommendedText) {
      throw new Error("No AI recommendation is available for the reminder.");
    }

    const result = await withActionTimeout(
      Promise.resolve(
        createFollowUpReminder({
          studentId,
          studentType,
          title: `AI Reminder: Follow up with ${studentName}`,
          notes: recommendedText,
          dueDate: tomorrow,
          dueTime: null,
          adminProfile,
        })
      ),
      "Creating the follow-up reminder timed out."
    );

    if (result?.error) throw result.error;

    await writeTimelineEvent({
      actionType: "ai_reminder_created",
      title: "AI-assisted follow-up reminder created",
      description: recommendedText,
      metadata: {
        source: "ai_action_panel",
        module: activeModule || null,
        human_approved: true,
      },
    });

    return {
      message:
        "Follow-up reminder created for tomorrow and linked to the student workflow.",
    };
  }

  async function copyEmail() {
    if (!emailText) {
      throw new Error("No email draft is available.");
    }

    // Save first so a clipboard permission failure does not lose the CRM record.
    const communication = await saveCommunicationLog({
      channel: "email",
      subject: emailSubject,
      message: emailText,
    });

    let copied = true;

    try {
      await copyToClipboard(emailText);
    } catch (error) {
      copied = false;
      console.warn("[AIActionPanel] Email clipboard copy failed:", error);
    }

    await writeTimelineEvent({
      actionType: "ai_email_generated",
      title: copied
        ? "AI email draft saved and copied"
        : "AI email draft saved",
      description: emailText,
      metadata: {
        source: "ai_action_panel",
        module: activeModule || null,
        saved_to: "student_communications",
        communication_id: communication?.id || null,
        copied_to_clipboard: copied,
        human_approved: true,
      },
    });

    return {
      message: copied
        ? "Email draft saved to communication history and copied to clipboard."
        : "Email draft was saved to communication history, but browser clipboard access was blocked.",
    };
  }

  async function copyWhatsApp() {
    if (!whatsappText) {
      throw new Error("No WhatsApp draft is available.");
    }

    const communication = await saveCommunicationLog({
      channel: "whatsapp",
      subject: "AI Generated WhatsApp Draft",
      message: whatsappText,
    });

    let copied = true;

    try {
      await copyToClipboard(whatsappText);
    } catch (error) {
      copied = false;
      console.warn("[AIActionPanel] WhatsApp clipboard copy failed:", error);
    }

    await writeTimelineEvent({
      actionType: "ai_whatsapp_generated",
      title: copied
        ? "AI WhatsApp draft saved and copied"
        : "AI WhatsApp draft saved",
      description: whatsappText,
      metadata: {
        source: "ai_action_panel",
        module: activeModule || null,
        saved_to: "student_communications",
        communication_id: communication?.id || null,
        copied_to_clipboard: copied,
        human_approved: true,
      },
    });

    return {
      message: copied
        ? "WhatsApp draft saved to communication history and copied to clipboard."
        : "WhatsApp draft was saved, but browser clipboard access was blocked.",
    };
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.08)]">
      <header className="bg-[#123866] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Zap size={12} />
                AI Execution Layer
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <UserCheck size={12} />
                Human Approved
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Turn AI guidance into controlled CRM action
            </h3>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white">
              AI prepares the next move. An admin reviews it. Zaifan OS then
              writes the approved task, reminder or communication record.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:min-w-[390px]">
            <HeaderSignal
              label="Student"
              value={studentName}
              Icon={UserCheck}
            />
            <HeaderSignal
              label="Module"
              value={activeModule || "AI Module"}
              Icon={Bot}
            />
            <HeaderSignal
              label="Execution"
              value={canExecute ? "Ready" : "Blocked"}
              Icon={canExecute ? ShieldCheck : XCircle}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </header>

      <div className="bg-[#fff8ee] p-4 sm:p-6">
        {!canExecute ? (
          <FeedbackBanner
            feedback={{
              type: "error",
              title: "CRM execution is blocked",
              detail:
                "The current student object has no ID. AI output can be reviewed, but nothing will be written to Supabase until a valid student record is loaded.",
            }}
          />
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <section className="rounded-[1.6rem] border-[3px] border-orange-300 bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                    Execution Controls
                  </p>
                  <h4 className="mt-1 text-lg font-black text-[#10233f]">
                    Choose one approved action
                  </h4>
                </div>

                <span className="rounded-full border-2 border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-800">
                  No Auto-Send
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {actions.map((action) => (
                  <ActionSelector
                    key={action.id}
                    action={action}
                    selected={selectedAction === action.id}
                    busy={busyAction === action.id}
                    globallyBusy={Boolean(busyAction)}
                    onSelect={() => setSelectedAction(action.id)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[1.6rem] border-[3px] border-[#123866] bg-[#123866] p-5 text-white shadow-[0_8px_22px_rgba(15,35,63,0.10)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
                    Human Control Policy
                  </p>
                  <h4 className="mt-1 font-black text-white">
                    AI cannot silently contact a student
                  </h4>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white">
                    Email and WhatsApp actions save drafts and copy text only.
                    They do not send messages. Tasks and reminders are created
                    only after this button is intentionally pressed.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-[1.6rem] border-[3px] border-orange-300 bg-white shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
            <div className="border-b-2 border-orange-200 bg-[#fffaf2] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                    Review Before Execution
                  </p>
                  <h4 className="mt-1 text-lg font-black text-[#10233f]">
                    {activeAction.label}
                  </h4>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {activeAction.description}
                  </p>
                </div>

                <AvailabilityBadge available={activeAction.available} />
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <PreviewField
                label="Action Title / Subject"
                value={activeAction.previewTitle}
              />

              <PreviewField
                label="AI Output Used"
                value={activeAction.previewBody}
                multiline
              />

              <div className="grid gap-2 sm:grid-cols-3">
                <ReviewFact
                  label="Student Type"
                  value={studentType}
                />
                <ReviewFact
                  label="Due Date"
                  value={
                    ["task", "reminder"].includes(activeAction.id)
                      ? tomorrow
                      : "Not applicable"
                  }
                />
                <ReviewFact
                  label="CRM Mode"
                  value={
                    ["email", "whatsapp"].includes(activeAction.id)
                      ? "Save Draft"
                      : "Create Record"
                  }
                />
              </div>

              <button
                type="button"
                onClick={() => runAction(activeAction)}
                disabled={
                  Boolean(busyAction) ||
                  !canExecute ||
                  !activeAction.available
                }
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[1.15rem] border-2 border-orange-600 bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {busyAction === activeAction.id ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Executing safely...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Approve & {activeAction.label}
                  </>
                )}
              </button>

              {feedback ? <FeedbackBanner feedback={feedback} /> : null}
            </div>
          </section>
        </div>

        <section className="mt-4 rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                Recommendation Source
              </p>
              <h4 className="mt-1 font-black text-[#10233f]">
                AI reasoning passed into the execution layer
              </h4>
            </div>

            <div className="flex flex-wrap gap-2">
              <MiniState
                label="AI Output"
                good={hasRecommendation || hasEmail || hasWhatsApp}
              />
              <MiniState label="Student ID" good={canExecute} />
              <MiniState label="Human Review" good />
            </div>
          </div>

          <div className="mt-4 max-h-48 overflow-y-auto rounded-[1.2rem] border-2 border-slate-300 bg-[#fffaf2] p-4">
            <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
              {recommendedText ||
                "No structured AI recommendation is currently available. Open the AI workspace or GPT Intelligence, generate an analysis, then return here to execute the reviewed result."}
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

function ActionSelector({
  action,
  selected,
  busy,
  globallyBusy,
  onSelect,
}) {
  const Icon = action.Icon;
  const tone = getActionTone(action.tone);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={globallyBusy}
      aria-pressed={selected}
      className={`group rounded-[1.25rem] border-[3px] p-4 text-left transition ${
        selected
          ? `${tone.selected} shadow-[0_7px_18px_rgba(15,35,63,0.07)]`
          : "border-slate-300 bg-[#fffaf2] hover:border-orange-300 hover:bg-white"
      } disabled:cursor-wait`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${
            selected ? tone.icon : "border-slate-300 bg-white text-[#10233f]"
          }`}
        >
          {busy ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Icon size={17} />
          )}
        </div>

        <span
          className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${
            action.available
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {action.available ? "Ready" : "Needs AI"}
        </span>
      </div>

      <p className="mt-3 text-sm font-black text-[#10233f]">
        {action.label}
      </p>
      <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
        {action.description}
      </p>
    </button>
  );
}

function PreviewField({ label, value, multiline = false }) {
  return (
    <div>
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <div
        className={`overflow-y-auto rounded-[1.15rem] border-2 border-slate-300 bg-[#fffaf2] p-4 text-sm font-semibold leading-6 text-[#10233f] ${
          multiline ? "max-h-56 min-h-[130px] whitespace-pre-wrap" : ""
        }`}
      >
        {value || "Not available"}
      </div>
    </div>
  );
}

function ReviewFact({ label, value }) {
  return (
    <div className="rounded-[1rem] border-2 border-slate-300 bg-[#fffaf2] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233f]">
        {value || "Not available"}
      </p>
    </div>
  );
}

function HeaderSignal({ label, value, Icon, className = "" }) {
  return (
    <div
      className={`rounded-[1.1rem] border-2 border-white/20 bg-white/10 p-3 text-white ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
          {label}
        </p>
        <Icon size={13} />
      </div>
      <p className="mt-1 truncate text-xs font-black text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function AvailabilityBadge({ available }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] ${
        available
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      {available ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {available ? "Ready to review" : "AI output missing"}
    </span>
  );
}

function FeedbackBanner({ feedback }) {
  const config = {
    success: {
      wrapper: "border-emerald-300 bg-emerald-50",
      icon: "border-emerald-300 bg-white text-emerald-700",
      title: "text-emerald-900",
      detail: "text-emerald-800",
      Icon: CheckCircle2,
    },
    warning: {
      wrapper: "border-amber-300 bg-amber-50",
      icon: "border-amber-300 bg-white text-amber-800",
      title: "text-amber-950",
      detail: "text-amber-900",
      Icon: AlertCircle,
    },
    error: {
      wrapper: "border-red-300 bg-red-50",
      icon: "border-red-300 bg-white text-red-700",
      title: "text-red-900",
      detail: "text-red-800",
      Icon: XCircle,
    },
  };

  const tone = config[feedback?.type] || config.warning;
  const Icon = tone.Icon;

  return (
    <div className={`rounded-[1.2rem] border-2 p-4 ${tone.wrapper}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${tone.icon}`}
        >
          <Icon size={16} />
        </div>
        <div>
          <p className={`text-sm font-black ${tone.title}`}>
            {feedback?.title}
          </p>
          <p className={`mt-1 text-xs font-semibold leading-5 ${tone.detail}`}>
            {feedback?.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniState({ label, good }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] ${
        good
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-amber-300 bg-amber-50 text-amber-900"
      }`}
    >
      {good ? <FileCheck2 size={11} /> : <AlertCircle size={11} />}
      {label}
    </span>
  );
}

function getActionTone(tone) {
  const tones = {
    orange: {
      selected: "border-orange-400 bg-orange-50",
      icon: "border-orange-300 bg-white text-orange-700",
    },
    blue: {
      selected: "border-blue-400 bg-blue-50",
      icon: "border-blue-300 bg-white text-blue-700",
    },
    emerald: {
      selected: "border-emerald-400 bg-emerald-50",
      icon: "border-emerald-300 bg-white text-emerald-700",
    },
    amber: {
      selected: "border-amber-400 bg-amber-50",
      icon: "border-amber-300 bg-white text-amber-800",
    },
  };

  return tones[tone] || tones.orange;
}

function getSuccessMessage(actionId) {
  const messages = {
    task: "Task created successfully.",
    reminder: "Reminder created successfully.",
    email: "Email draft saved and copied.",
    whatsapp: "WhatsApp draft saved and copied.",
  };

  return messages[actionId] || "Action completed successfully.";
}

function formatActionItem(item) {
  if (typeof item === "string") return normalizeText(item);

  if (!item || typeof item !== "object") {
    return normalizeText(item);
  }

  const title = normalizeText(item?.title);
  const description = normalizeText(item?.description);

  if (title && description) {
    return `${title}: ${description}`;
  }

  return normalizeText(
    title ||
      description ||
      item?.action ||
      item?.reason ||
      item?.recommendation
  );
}

export default AIActionPanel;
