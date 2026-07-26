import React, { useEffect, useMemo, useState } from "react";
import {
  buildCounselorSupportQueue,
  formatRelativeTime,
  replyCounselorSupportRequest,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "urgent", label: "Urgent" },
  { key: "visa", label: "Visa" },
  { key: "documents", label: "Documents" },
  { key: "callback", label: "Callback" },
  { key: "application", label: "Application" },
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
    text: "I reviewed your visa-related request. Please confirm your CAS status, latest financial documents, passport details, and any visa deadline so I can guide the next action.",
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
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

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

function lower(value) {
  return safeString(value).toLowerCase();
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
      text.includes("cas") ||
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

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function priorityTone(priority = "") {
  const value = lower(priority);

  if (value.includes("urgent") || value.includes("high")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  if (value.includes("normal") || value.includes("medium")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("resolved") || value.includes("closed")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("escalat")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-[#173f69] bg-[#173f69] text-white";
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
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    rose: "border-rose-300 bg-rose-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const className = `rounded-2xl border-2 p-4 text-left shadow-sm transition ${
    tones[tone] || tones.navy
  } ${
    onClick
      ? "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
      : ""
  } ${active ? "ring-2 ring-orange-200" : ""}`;

  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p>
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
        <span className="font-bold text-[#607487]">Support pressure</span>
        <span className="font-black text-[#102b4c]">{score}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 75
              ? "bg-rose-500"
              : score >= 50
                ? "bg-orange-500"
                : "bg-[#173f69]"
          }`}
          style={{ width: `${score}%` }}
        />
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
    <div className="mt-4 rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Counselor Response
          </p>

          <p className="mt-1 text-xs leading-5 text-[#607487]">
            Reply is logged into support history. Resolve only when the student issue
            is genuinely complete.
          </p>
        </div>

        {response ? (
          <button
            type="button"
            onClick={clearDraft}
            disabled={Boolean(saving)}
            className="self-start rounded-xl border-2 border-[#c9d5de] bg-[#fffdf8] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#607487] transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
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
                : "border-[#c9d5de] bg-[#fffdf8] text-[#173f69] hover:border-orange-300 hover:bg-orange-50"
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
        <p className="text-xs font-medium text-[#718292]">
          {response.trim().length}/2500 characters · draft saved in this tab
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => sendReply(false)}
            disabled={Boolean(saving) || !response.trim()}
            className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#102f52] disabled:cursor-not-allowed disabled:opacity-50"
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
  const urgent = isUrgent(item);

  return (
    <article
      className={`rounded-[1.6rem] border-2 p-4 shadow-[0_10px_30px_rgba(16,43,76,0.06)] transition duration-300 hover:-translate-y-0.5 sm:p-5 ${
        urgent
          ? "border-rose-300 bg-rose-50/70 hover:border-rose-400"
          : "border-[#c9d5de] bg-[#fffdf8] hover:border-orange-300"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_0.65fr_0.52fr] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-black text-[#102b4c]">
              {item.subject || "Student support request"}
            </h3>

            {urgent ? (
              <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-rose-700">
                Urgent
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#607487]">
            {item.studentName || "Student"} · {item.category || "General Support"}
          </p>

          {!compact && item.message ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#415674]">
              {item.message}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${categoryTone(
                item
              )}`}
            >
              {item.category || "General"}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${priorityTone(
                item.priority
              )}`}
            >
              {item.priority || "Normal"}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(
                item.status
              )}`}
            >
              {item.status || "Open"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Support Intelligence
          </p>

          <p className="mt-2 text-sm font-bold leading-6 text-[#102b4c]">
            {item.nextAction || "Review the support request and define the next counselor action."}
          </p>

          <div className="mt-3">
            <PressureMeter item={item} />
          </div>

          <p className="mt-3 text-xs font-medium text-[#718292]">
            Opened {formatRelativeTime(item.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
            Counselor Action
          </p>

          <p className="mt-2 text-xs leading-5 text-[#718292]">
            Reply for workflow history, or resolve only after the student issue is
            complete.
          </p>

          {!compact ? (
            <button
              type="button"
              onClick={() => resolveRequest(item)}
              disabled={savingId === item.id}
              className="mt-3 w-full rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingId === item.id ? "Resolving..." : "Quick Resolve"}
            </button>
          ) : (
            <div className="mt-3 rounded-xl border border-[#d6e0e7] bg-white px-3 py-2 text-center text-xs font-black text-[#173f69]">
              Pressure {pressure}
            </div>
          )}
        </div>
      </div>

      {!compact ? (
        <ReplyBox
          item={item}
          counselor={counselor}
          onRefresh={onRefresh}
          setStatus={setStatus}
        />
      ) : null}
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

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const stats = useMemo(() => {
    const urgent = queue.filter((item) => isUrgent(item)).length;
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

    return {
      total: queue.length,
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

    if (filter === "urgent") {
      next = next.filter((item) => isUrgent(item));
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
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Support OS
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Student Support Command
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Triage urgent support, visa questions, document problems, callback needs
            and application issues while preserving a clean counselor response trail.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} visible
          </span>

          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {stats.students} students
          </span>

          <span
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${
              stats.averagePressure >= 70
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : stats.averagePressure >= 45
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700"
            }`}
          >
            Pressure {stats.averagePressure}
          </span>
        </div>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <SupportStat
            label="Open"
            value={stats.total}
            helper="support items"
            tone="orange"
            active={filter === "all"}
            onClick={() => setFilter("all")}
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
            label="Visa"
            value={stats.visa}
            helper="visa/CAS help"
            tone="violet"
            active={filter === "visa"}
            onClick={() => setFilter("visa")}
          />

          <SupportStat
            label="Docs"
            value={stats.documents}
            helper="document issues"
            tone="amber"
            active={filter === "documents"}
            onClick={() => setFilter("documents")}
          />

          <SupportStat
            label="Calls"
            value={stats.callback}
            helper="callback needs"
            tone="emerald"
            active={filter === "callback"}
            onClick={() => setFilter("callback")}
          />

          <SupportStat
            label="Apps"
            value={stats.application}
            helper="application help"
            active={filter === "application"}
            onClick={() => setFilter("application")}
          />
        </div>
      ) : null}

      {!compact ? (
        <>
          <StatusToast
            status={status}
            onClear={() => setStatus(null)}
          />

          <div className="mb-5 rounded-[1.4rem] border-2 border-[#d8b892] bg-[#fff8ef] p-3.5">
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
                className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] disabled:cursor-default disabled:opacity-45"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
              Support triage · {visible.length} visible records
            </p>

            <p className="text-xs font-semibold text-[#607487]">
              Sort:{" "}
              {SORTS.find((item) => item.key === sort)?.label || "Priority"}
            </p>
          </div>
        </>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.slice(0, 4).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-black transition ${
                filter === item.key
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-[#c9d5de] bg-[#fffdf8] text-[#173f69]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50 text-lg font-black text-orange-700">
              S
            </div>

            <p className="mt-3 text-sm font-black text-[#102b4c]">
              No open support requests.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              Support is clear for the selected scope. New assigned student support
              requests will appear here after the next Counselor OS refresh.
            </p>

            {hasActiveControls ? (
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400"
              >
                Clear Search & Filters
              </button>
            ) : null}
          </div>
        ) : (
          visible.map((item, index) => (
            <SupportCard
              key={item.id || `${item.studentName || "student"}-${index}`}
              item={item}
              counselor={counselor}
              onRefresh={onRefresh}
              setStatus={setStatus}
              compact={compact}
              resolveRequest={resolveRequest}
              savingId={savingId}
            />
          ))
        )}
      </div>

      {compact && filtered.length > visible.length ? (
        <p className="mt-4 text-center text-xs font-semibold text-[#718292]">
          Showing {visible.length} of {filtered.length} support items. Open Support
          Queue for full triage.
        </p>
      ) : null}
    </section>
  );
}
