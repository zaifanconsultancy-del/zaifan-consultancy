import React, { useEffect, useMemo, useState } from "react";
import {
  buildCounselorSupportQueue,
  formatRelativeTime,
  replyCounselorSupportRequest,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "urgent", label: "Urgent" },
  { key: "visa", label: "Visa / Pre-enrolment" },
  { key: "documents", label: "Documents" },
  { key: "callback", label: "Callback" },
  { key: "application", label: "Application" },
  { key: "resolved", label: "Resolved" },
];

const SORTS = [
  { key: "priority", label: "Priority" },
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "student", label: "Student" },
  { key: "category", label: "Category" },
];

const RESPONSE_TEMPLATES = [
  {
    key: "acknowledge",
    label: "Acknowledge",
    text: "Thanks for reaching out. I have reviewed your request and will guide you on the next step. Please keep your documents and application details ready.",
  },
  {
    key: "documents",
    label: "Document Help",
    text: "I reviewed your document-related request. Please upload the latest clear copy of the required document, and I will verify it against your application checklist.",
  },
  {
    key: "visa",
    label: "Visa Help",
    text: "I reviewed your visa-related request. Please confirm your Universitaly pre-enrolment status, latest financial documents, passport details, and any visa deadline so I can guide the next action.",
  },
  {
    key: "callback",
    label: "Callback",
    text: "I have noted your callback request. I will follow up with you and update your student timeline after the conversation.",
  },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_support_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_support_sort";

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function isResolvedSupport(item = {}) {
  const status = lower(item.status);
  return (
    status.includes("resolved") ||
    status.includes("closed") ||
    status.includes("completed")
  );
}

function hasCounselorReply(item = {}) {
  return safeArray(item.threadMessages).some((message) =>
    ["counselor", "admin"].includes(lower(message.sender_type))
  );
}

function safeDateMs(value) {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function readSessionValue(key, fallback = "") {
  if (typeof window === "undefined") return fallback;

  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Draft/filter persistence is optional.
  }
}

function supportStudent(item = {}) {
  return {
    id:
      item.student_id ||
      item.inquiry_id ||
      item.appointment_id ||
      item.studentId ||
      item.id ||
      null,
    name: item.studentName || item.student_name || item.name || "Student",
    studentType:
      item.student_type ||
      item.record_type ||
      item.source_type ||
      "inquiry",
  };
}

function supportSearchText(item = {}) {
  return lower(
    [
      item.subject,
      item.studentName,
      item.category,
      item.status,
      item.priority,
      item.message,
      item.nextAction,
      item.assigned_to,
      item.source,
    ].join(" ")
  );
}

function isUrgent(item = {}) {
  const priority = lower(item.priority);
  const body = supportSearchText(item);

  return (
    priority.includes("urgent") ||
    priority.includes("high") ||
    body.includes("urgent") ||
    body.includes("deadline") ||
    body.includes("immediate")
  );
}

function categoryMatches(item = {}, key) {
  const text = supportSearchText(item);

  if (key === "visa") {
    return (
      text.includes("visa") ||
      text.includes("pre-enrol") ||
      text.includes("universitaly") ||
      text.includes("financial")
    );
  }

  if (key === "documents") {
    return (
      text.includes("document") ||
      text.includes("passport") ||
      text.includes("statement")
    );
  }

  if (key === "callback") {
    return (
      text.includes("callback") ||
      text.includes("call back") ||
      text.includes("call")
    );
  }

  if (key === "application") {
    return (
      text.includes("application") ||
      text.includes("offer") ||
      text.includes("university")
    );
  }

  return true;
}

function priorityRank(item = {}) {
  const priority = lower(item.priority);

  if (priority.includes("urgent")) return 4;
  if (priority.includes("high")) return 3;
  if (priority.includes("medium") || priority.includes("normal")) return 2;
  if (priority.includes("low")) return 1;

  if (isUrgent(item)) return 3;
  return 0;
}

function supportPressureScore(item = {}) {
  if (isResolvedSupport(item)) return 0;

  let score = priorityRank(item) * 20;

  const ageHours = Math.max(
    0,
    (Date.now() - safeDateMs(item.createdAt)) / (1000 * 60 * 60)
  );

  if (ageHours >= 72) score += 25;
  else if (ageHours >= 24) score += 15;
  else if (ageHours >= 8) score += 8;

  if (categoryMatches(item, "visa")) score += 10;
  if (categoryMatches(item, "documents")) score += 8;
  if (categoryMatches(item, "callback")) score += 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function replySupportThroughPortal({
  item,
  counselor,
  response,
  close = false,
}) {
  const student = supportStudent(item);

  return replyCounselorSupportRequest({
    supportId: item.id,
    studentId: student.id,
    studentName: student.name,
    response,
    counselor,
    close,
    metadata: {
      source: "CounselorSupportWorkspace",
      supportId: item.id,
      category: item.category,
      priority: item.priority,
      studentType: student.studentType,
      pressureScore: supportPressureScore(item),
      nextAction: item.nextAction,
    },
  });
}

function categoryTone(item = {}) {
  const text = supportSearchText(item);

  if (text.includes("visa") || text.includes("cas")) {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  if (text.includes("document")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  if (text.includes("application")) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (text.includes("callback") || text.includes("call")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function priorityTone(priority = "") {
  const value = lower(priority);

  if (value.includes("urgent") || value.includes("high")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  if (value.includes("normal") || value.includes("medium")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("resolved") || value.includes("closed")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("escalat")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-[#123865] bg-[#123865] text-white";
}

function StatusToast({ status, onClear }) {
  if (!status?.message) return null;

  const tone =
    status.type === "error"
      ? "border-rose-300 bg-rose-50 text-rose-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${tone}`}
    >
      <span>{status.message}</span>

      <button
        type="button"
        onClick={onClear}
        className="rounded-lg px-2 py-1 text-xs font-black transition hover:bg-black/5"
      >
        Clear
      </button>
    </div>
  );
}

function SupportStat({
  label,
  value,
  helper,
  tone = "navy",
  active = false,
  onClick,
}) {
  const tones = {
    navy: "border-[#123865] bg-[#F1F6FA]",
    orange: "border-orange-300 bg-orange-50",
    rose: "border-rose-300 bg-rose-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const className = `relative overflow-hidden rounded-[1.3rem] border-2 p-4 text-left shadow-[0_9px_22px_rgba(16,35,63,0.08)] transition ${
    tones[tone] || tones.navy
  } ${
    onClick
      ? "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
      : ""
  } ${active ? "ring-2 ring-orange-200" : ""}`;

  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5B6D80]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs font-medium text-[#5B6D80]">{helper}</p>
      ) : null}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function PressureMeter({ item }) {
  const score = supportPressureScore(item);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#5B6D80]">Support pressure</span>
        <span className="font-black text-[#10233F]">{score}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#E4EBF2]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 75
              ? "bg-rose-500"
              : score >= 50
                ? "bg-orange-500"
                : "bg-[#123865]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SupportThread({ item }) {
  const messages = safeArray(item.threadMessages);

  if (!messages.length) {
    return (
      <div className="mt-4 rounded-2xl border-2 border-dashed border-[#B9C8D8] bg-[#FFFCF7] p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5B6D80]">
          Conversation Timeline
        </p>
        <p className="mt-2 text-sm leading-6 text-[#5B6D80]">
          No permanent thread messages were returned for this request yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#C9D6E2] bg-[#FFFCF7]">
      <div className="flex flex-col gap-2 border-b border-[#C9D6E2] bg-[#F7FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5B6D80]">
            Conversation Timeline
          </p>
          <p className="mt-1 text-xs text-[#6B7D8F]">
            Student, Admin and Counselor messages remain in one permanent thread.
          </p>
        </div>
        <span className="self-start rounded-full border border-[#AFC0D0] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#123865]">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-3 p-4">
        {messages.map((message, index) => {
          const senderType = lower(message.sender_type);
          const isStudent = senderType === "student";
          const isAdmin = senderType === "admin";
          const senderLabel = isStudent
            ? "Student"
            : isAdmin
              ? "Admin"
              : "Counselor";

          return (
            <div
              key={message.id || `${item.id}-message-${index}`}
              className={`rounded-2xl border-2 p-3.5 ${
                isStudent
                  ? "border-sky-200 bg-sky-50"
                  : isAdmin
                    ? "border-orange-200 bg-orange-50"
                    : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${
                      isStudent
                        ? "border-sky-300 bg-white text-sky-700"
                        : isAdmin
                          ? "border-orange-300 bg-white text-orange-700"
                          : "border-emerald-300 bg-white text-emerald-700"
                    }`}
                  >
                    {senderLabel}
                  </span>
                  <span className="text-xs font-black text-[#10233F]">
                    {message.sender_name || senderLabel}
                  </span>
                </div>

                <span className="text-[10px] font-bold text-[#6B7D8F]">
                  {message.created_at
                    ? new Date(message.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Time unavailable"}
                </span>
              </div>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#415674]">
                {message.message || "Message unavailable"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReplyBox({ item, counselor, onRefresh, setStatus }) {
  const draftKey = `zaifan_support_reply_${item.id || "draft"}`;

  const [response, setResponse] = useState(() =>
    readSessionValue(draftKey, "")
  );
  const [saving, setSaving] = useState("");
  const [activeTemplate, setActiveTemplate] = useState("");

  useEffect(() => {
    writeSessionValue(draftKey, response);
  }, [draftKey, response]);

  const applyTemplate = (template) => {
    setActiveTemplate(template.key);
    setResponse(template.text);
  };

  const clearDraft = () => {
    setResponse("");
    setActiveTemplate("");
    writeSessionValue(draftKey, "");
  };

  async function sendReply(close = false) {
    const replyText = response.trim();

    if (!replyText) {
      setStatus({ type: "error", message: "Write a reply first." });
      return;
    }

    setSaving(close ? "close" : "reply");
    setStatus(null);

    try {
      await replySupportThroughPortal({
        item,
        counselor,
        response: replyText,
        close,
      });

      clearDraft();

      setStatus({
        type: "success",
        message: close
          ? "Support reply sent and request resolved."
          : "Support reply sent and logged.",
      });

      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Support reply failed", error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "Support reply failed. Check Supabase support access and RLS.",
      });
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-orange-200 bg-[#FFF8EF] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Counselor Response
          </p>

          <p className="mt-1 text-xs leading-5 text-[#5B6D80]">
            Reply is logged into support history. Resolve only when the student issue
            is genuinely complete.
          </p>
        </div>

        {response ? (
          <button
            type="button"
            onClick={clearDraft}
            disabled={Boolean(saving)}
            className="self-start rounded-xl border-2 border-[#B9C8D8] bg-[#FFFCF7] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#5B6D80] transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
          >
            Clear Draft
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {RESPONSE_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => applyTemplate(template)}
            disabled={Boolean(saving)}
            aria-pressed={activeTemplate === template.key}
            className={`rounded-xl border-2 px-3 py-2 text-xs font-black transition disabled:opacity-50 ${
              activeTemplate === template.key
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-[#B9C8D8] bg-[#FFFCF7] text-[#123865] hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>

      <textarea
        value={response}
        onChange={(event) => setResponse(event.target.value)}
        rows={4}
        maxLength={2500}
        placeholder="Write counselor response visible in support and workflow history..."
        aria-label={`Support reply for ${item.studentName || "student"}`}
        className={`mt-3 resize-y ${INPUT_CLASS}`}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#6B7D8F]">
          {response.trim().length}/2500 characters · draft saved in this tab
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => sendReply(false)}
            disabled={Boolean(saving) || !response.trim()}
            className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving === "reply" ? "Sending..." : "Send Reply"}
          </button>

          <button
            type="button"
            onClick={() => sendReply(true)}
            disabled={Boolean(saving) || !response.trim()}
            className="rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving === "close" ? "Resolving..." : "Reply + Resolve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupportCard({
  item,
  counselor,
  onRefresh,
  setStatus,
  compact,
  resolveRequest,
  savingId,
}) {
  const pressure = supportPressureScore(item);
  const resolved = isResolvedSupport(item);
  const urgent = !resolved && isUrgent(item);
  const [expanded, setExpanded] = useState(false);
  const messageCount = safeArray(item.threadMessages).length;

  return (
    <article
      className={`overflow-hidden rounded-[1.65rem] border-[3px] shadow-[0_14px_34px_rgba(16,35,63,0.10)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(16,35,63,0.14)] ${
        resolved
          ? "border-emerald-300 bg-emerald-50/45"
          : urgent
            ? "border-rose-300 bg-rose-50/55"
            : "border-[#B9C8D8] bg-[#FFFCF7] hover:border-orange-300"
      }`}
    >
      <div className={`h-1.5 ${resolved ? "bg-emerald-500" : urgent ? "bg-rose-500" : "bg-orange-500"}`} />

      <div className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_310px] xl:items-start sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-lg font-black text-[#10233F]">{item.subject || "Student support request"}</h3>
                {urgent ? <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-rose-700">Urgent</span> : null}
              </div>
              <p className="mt-1 text-sm font-semibold text-[#5B6D80]">{item.studentName || "Student"}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${statusTone(item.status)}`}>{item.status || "Open"}</span>
          </div>

          {!compact && item.message ? (
            <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words rounded-xl border border-[#e6d7c6] bg-[#FFF8EF] px-3 py-3 text-sm leading-6 text-[#415674]">{item.message}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${categoryTone(item)}`}>{item.category || "General"}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${priorityTone(item.priority)}`}>{item.priority || "Normal"}</span>
            <span className="rounded-full border border-[#B9C8D8] bg-[#F1F6FA] px-3 py-1 text-xs font-black text-[#123865]">{messageCount} messages</span>
            <span className="rounded-full border border-[#D8B07B] bg-white px-3 py-1 text-xs font-black text-[#5B6D80]">Opened {formatRelativeTime(item.createdAt)}</span>
          </div>
        </div>

        <aside className="rounded-[1.25rem] border-2 border-[#D8B07B] bg-[#FFF8EF] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">Next Counselor Move</p>
              <p className="mt-2 text-sm font-bold leading-5 text-[#10233F]">{resolved ? "Conversation closed. The complete history remains available." : item.nextAction || "Review the thread and send the next clear response."}</p>
            </div>
            <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${pressure >= 70 ? "bg-rose-100 text-rose-700" : pressure >= 45 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{pressure}</span>
          </div>

          {!compact ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#0B2A4B]">
                {expanded ? "Close Conversation" : "Open Conversation"}
              </button>
              {!resolved ? (
                <button type="button" onClick={() => resolveRequest(item)} disabled={savingId === item.id} className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                  {savingId === item.id ? "Resolving..." : "Quick Resolve"}
                </button>
              ) : (
                <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2.5 text-center text-xs font-black text-emerald-700">Resolved</div>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      {!compact && expanded ? (
        <div className="border-t-2 border-[#e2c8a9] bg-white/65 p-4 sm:p-5">
          <SupportThread item={item} />
          {!resolved ? <ReplyBox item={item} counselor={counselor} onRefresh={onRefresh} setStatus={setStatus} /> : null}
        </div>
      ) : null}
    </article>
  );
}


function SupportInboxRow({ item, active, onSelect }) {
  const resolved = isResolvedSupport(item);
  const urgent = !resolved && isUrgent(item);
  const pressure = supportPressureScore(item);
  const messageCount = safeArray(item.threadMessages).length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group w-full overflow-hidden rounded-[1.2rem] border-2 text-left transition ${
        active
          ? "border-[#123865] bg-[#123865] text-white shadow-[0_12px_26px_rgba(16,35,63,0.18)]"
          : resolved
            ? "border-emerald-200 bg-emerald-50/55 hover:border-emerald-400"
            : urgent
              ? "border-rose-200 bg-rose-50/70 hover:border-rose-400"
              : "border-[#C9D6E2] bg-white hover:border-[#123865] hover:shadow-md"
      }`}
    >
      <div
        className={`h-1.5 ${
          resolved ? "bg-emerald-500" : urgent ? "bg-rose-500" : "bg-orange-500"
        }`}
      />

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`truncate text-sm font-black ${
                active ? "text-white" : "text-[#10233F]"
              }`}
            >
              {item.subject || "Student support request"}
            </p>
            <p
              className={`mt-1 truncate text-xs font-semibold ${
                active ? "text-blue-100" : "text-[#5B6D80]"
              }`}
            >
              {item.studentName || "Student"} · {item.category || "General"}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-black ${
              active
                ? "border-white/20 bg-white/10 text-white"
                : pressure >= 70
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : pressure >= 45
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]"
            }`}
          >
            {pressure}
          </span>
        </div>

        <p
          className={`mt-2 line-clamp-2 text-xs font-medium leading-5 ${
            active ? "text-blue-100" : "text-[#5B6D80]"
          }`}
        >
          {item.message || item.nextAction || "Open the conversation for details."}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                active
                  ? "border-white/20 bg-white/10 text-white"
                  : statusTone(item.status)
              }`}
            >
              {item.status || "Open"}
            </span>

            {urgent ? (
              <span
                className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                  active
                    ? "border-rose-200/30 bg-rose-300/15 text-rose-100"
                    : "border-rose-300 bg-rose-50 text-rose-700"
                }`}
              >
                Urgent
              </span>
            ) : null}
          </div>

          <span
            className={`text-[10px] font-bold ${
              active ? "text-blue-200" : "text-[#6B7D8F]"
            }`}
          >
            {messageCount} messages · {formatRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

function SupportConversationWorkspace({
  item,
  counselor,
  onRefresh,
  setStatus,
  resolveRequest,
  savingId,
}) {
  if (!item) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[1.65rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#F7FAFC] p-8 text-center">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-xl font-black text-orange-700">
            S
          </div>
          <p className="mt-4 text-lg font-black text-[#10233F]">
            Select a support conversation
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5B6D80]">
            The student request, permanent message timeline and reply controls will open here.
          </p>
        </div>
      </div>
    );
  }

  const resolved = isResolvedSupport(item);
  const urgent = !resolved && isUrgent(item);
  const pressure = supportPressureScore(item);

  return (
    <article className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFFCF7] shadow-[0_16px_40px_rgba(16,35,63,0.12)]">
      <div className="border-b-[3px] border-orange-500 bg-[#123865] p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-300/70 bg-orange-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-200">
                Active Conversation
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                  resolved
                    ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-200"
                    : urgent
                      ? "border-rose-300/60 bg-rose-400/15 text-rose-200"
                      : "border-white/20 bg-white/10 text-white"
                }`}
              >
                {resolved ? "Resolved" : urgent ? "Urgent" : item.status || "Open"}
              </span>
            </div>

            <h3 className="mt-3 break-words text-2xl font-black text-white">
              {item.subject || "Student support request"}
            </h3>
            <p className="mt-1 text-sm font-semibold text-blue-100">
              {item.studentName || "Student"} · {item.category || "General"} ·{" "}
              {item.priority || "Normal"} priority
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-200">
                Pressure
              </p>
              <p className="mt-1 text-xl font-black text-white">{pressure}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-blue-200">
                Messages
              </p>
              <p className="mt-1 text-xl font-black text-white">
                {safeArray(item.threadMessages).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-[1.35rem] border-2 border-[#D8B07B] bg-[#FFF8EF] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
              Original Student Request
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm font-semibold leading-7 text-[#415674]">
              {item.message || "The original request message is unavailable."}
            </p>
          </div>

          <aside className="rounded-[1.35rem] border-2 border-orange-300 bg-[#FFF4E8] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
              Next Counselor Move
            </p>
            <p className="mt-2 text-sm font-black leading-6 text-[#10233F]">
              {resolved
                ? "The request is closed. Keep the permanent timeline available for future reference."
                : item.nextAction ||
                  "Read the complete thread, send one clear response and resolve only when the issue is genuinely complete."}
            </p>

            <div className="mt-4">
              <PressureMeter item={item} />
            </div>

            {!resolved ? (
              <button
                type="button"
                onClick={() => resolveRequest(item)}
                disabled={savingId === item.id}
                className="mt-4 w-full rounded-xl border-2 border-emerald-500 bg-emerald-500 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-50"
              >
                {savingId === item.id ? "Resolving..." : "Quick Resolve"}
              </button>
            ) : (
              <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-xs font-black text-emerald-700">
                Conversation Resolved
              </div>
            )}
          </aside>
        </div>

        <SupportThread item={item} />

        {!resolved ? (
          <ReplyBox
            item={item}
            counselor={counselor}
            onRefresh={onRefresh}
            setStatus={setStatus}
          />
        ) : null}
      </div>
    </article>
  );
}

export default function CounselorSupportWorkspace({
  snapshot,
  counselor,
  onRefresh,
  compact = false,
}) {
  const queue = useMemo(
    () => buildCounselorSupportQueue(snapshot || {}),
    [snapshot]
  );

  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });

  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "priority");
    return VALID_SORTS.has(saved) ? saved : "priority";
  });

  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [status, setStatus] = useState(null);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const stats = useMemo(() => {
    const urgent = queue.filter((item) => !isResolvedSupport(item) && isUrgent(item)).length;
    const visa = queue.filter((item) => categoryMatches(item, "visa")).length;
    const documents = queue.filter((item) =>
      categoryMatches(item, "documents")
    ).length;
    const callback = queue.filter((item) =>
      categoryMatches(item, "callback")
    ).length;
    const application = queue.filter((item) =>
      categoryMatches(item, "application")
    ).length;

    const students = new Set(
      queue.map((item) => lower(item.studentName)).filter(Boolean)
    ).size;

    const averagePressure = queue.length
      ? Math.round(
          queue.reduce(
            (sum, item) => sum + supportPressureScore(item),
            0
          ) / queue.length
        )
      : 0;

    const resolved = queue.filter((item) => isResolvedSupport(item)).length;
    const open = queue.length - resolved;
    const responses = queue.filter((item) => hasCounselorReply(item)).length;

    return {
      total: queue.length,
      open,
      resolved,
      responses,
      urgent,
      visa,
      documents,
      callback,
      application,
      students,
      averagePressure,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "open") {
      next = next.filter((item) => !isResolvedSupport(item));
    }

    if (filter === "resolved") {
      next = next.filter((item) => isResolvedSupport(item));
    }

    if (filter === "urgent") {
      next = next.filter((item) => !isResolvedSupport(item) && isUrgent(item));
    }

    if (filter === "visa") {
      next = next.filter((item) => categoryMatches(item, "visa"));
    }

    if (filter === "documents") {
      next = next.filter((item) => categoryMatches(item, "documents"));
    }

    if (filter === "callback") {
      next = next.filter((item) => categoryMatches(item, "callback"));
    }

    if (filter === "application") {
      next = next.filter((item) => categoryMatches(item, "application"));
    }

    if (search) {
      next = next.filter((item) => supportSearchText(item).includes(search));
    }

    return [...next].sort((a, b) => {
      if (sort === "newest") {
        return safeDateMs(b.createdAt) - safeDateMs(a.createdAt);
      }

      if (sort === "oldest") {
        return safeDateMs(a.createdAt) - safeDateMs(b.createdAt);
      }

      if (sort === "student") {
        return safeString(a.studentName).localeCompare(
          safeString(b.studentName)
        );
      }

      if (sort === "category") {
        return safeString(a.category).localeCompare(
          safeString(b.category)
        );
      }

      const pressureDifference =
        supportPressureScore(b) - supportPressureScore(a);

      if (pressureDifference !== 0) {
        return pressureDifference;
      }

      return safeDateMs(a.createdAt) - safeDateMs(b.createdAt);
    });
  }, [queue, filter, query, sort]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const selectedItem = useMemo(
    () =>
      visible.find((item) => String(item.id) === String(selectedId)) ||
      visible[0] ||
      null,
    [visible, selectedId]
  );

  useEffect(() => {
    if (!visible.length) {
      if (selectedId) setSelectedId("");
      return;
    }

    if (!visible.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(String(visible[0].id || ""));
    }
  }, [visible, selectedId]);

  const reset = () => {
    setFilter("all");
    setSort("priority");
    setQuery("");
    setStatus(null);
  };

  async function resolveRequest(item) {
    if (!item?.id || savingId) return;

    setSavingId(item.id);
    setStatus(null);

    try {
      await replySupportThroughPortal({
        item,
        counselor,
        response:
          "Resolved from Counselor Portal OS. Counselor reviewed and closed this support item.",
        close: true,
      });

      setStatus({
        type: "success",
        message: `Support request resolved for ${
          item.studentName || "student"
        }.`,
      });

      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Resolve support request failed", error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "Support request could not be resolved. Check Supabase support access and RLS.",
      });
    } finally {
      setSavingId("");
    }
  }

  const hasActiveControls =
    Boolean(query.trim()) || filter !== "all" || sort !== "priority";

  return (
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1] grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
              Counselor Support OS
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
              One inbox. One permanent thread. One clear owner.
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
              Triage assigned student requests on the left, continue the complete Student–Admin–Counselor conversation on the right, and resolve only after the real issue is complete.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["Open", stats.open, "text-amber-200"],
              ["Urgent", stats.urgent, "text-rose-200"],
              ["Resolved", stats.resolved, "text-emerald-200"],
            ].map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-xl border border-white/15 bg-white/10 p-3 text-center"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-blue-200">
                  {label}
                </p>
                <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_12px_28px_rgba(16,35,63,0.08)] sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <SupportStat
            label="Total Threads"
            value={stats.total}
            helper="all assigned requests"
            tone="orange"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <SupportStat
            label="Open"
            value={stats.open}
            helper="still active"
            tone="amber"
            active={filter === "open"}
            onClick={() => setFilter("open")}
          />
          <SupportStat
            label="Urgent"
            value={stats.urgent}
            helper="needs fast reply"
            tone="rose"
            active={filter === "urgent"}
            onClick={() => setFilter("urgent")}
          />
          <SupportStat
            label="Responses"
            value={stats.responses}
            helper="threads with counselor reply"
            tone="violet"
          />
          <SupportStat
            label="Resolved"
            value={stats.resolved}
            helper="completed requests"
            tone="emerald"
            active={filter === "resolved"}
            onClick={() => setFilter("resolved")}
          />
          <SupportStat
            label="Students"
            value={stats.students}
            helper="assigned scope"
          />
        </div>
      ) : null}

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <div className="mb-5 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,90,10,0.12)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_210px_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search support, student, category, priority, message or next action..."
            className={INPUT_CLASS}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Filter support queue"
          >
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Sort support queue"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                Sort: {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={reset}
            disabled={!hasActiveControls}
            className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] disabled:cursor-default disabled:opacity-45"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="rounded-[1.65rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_16px_40px_rgba(16,35,63,0.10)]">
          <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-orange-500 px-1 pb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                Support Inbox
              </p>
              <p className="mt-1 text-sm font-black text-[#10233F]">
                {visible.length} visible conversation{visible.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="rounded-xl border-2 border-[#AFC0D0] bg-[#F1F6FA] px-2.5 py-1.5 text-xs font-black text-[#123865]">
              Pressure {stats.averagePressure}
            </span>
          </div>

          <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
            {visible.length ? (
              visible.map((item, index) => (
                <SupportInboxRow
                  key={item.id || `${item.studentName || "student"}-${index}`}
                  item={item}
                  active={String(selectedItem?.id) === String(item.id)}
                  onSelect={() => setSelectedId(String(item.id || ""))}
                />
              ))
            ) : (
              <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#F7FAFC] p-7 text-center">
                <p className="text-sm font-black text-[#10233F]">
                  No support requests match this view.
                </p>
                <p className="mt-2 text-xs leading-5 text-[#5B6D80]">
                  Clear the search or choose another filter.
                </p>
                {hasActiveControls ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700"
                  >
                    Clear Search & Filters
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </aside>

        <SupportConversationWorkspace
          item={selectedItem}
          counselor={counselor}
          onRefresh={onRefresh}
          setStatus={setStatus}
          resolveRequest={resolveRequest}
          savingId={savingId}
        />
      </div>

      {compact && filtered.length > visible.length ? (
        <p className="mt-4 text-center text-xs font-semibold text-[#6B7D8F]">
          Showing {visible.length} of {filtered.length} support items.
        </p>
      ) : null}
    </section>
  );
}
