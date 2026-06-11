import React, { useMemo, useState } from "react";
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

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}


function supportStudent(item = {}) {
  return {
    id: item.student_id || item.inquiry_id || item.appointment_id || item.studentId || item.id || null,
    name: item.studentName || item.student_name || item.name || "Student",
    studentType: item.student_type || item.record_type || item.source_type || "inquiry",
  };
}

async function replySupportThroughPortal({ item, counselor, response, close = false }) {
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
    },
  });
}


function categoryTone(item = {}) {
  const text = lower(`${item.category} ${item.subject} ${item.message}`);

  if (text.includes("visa")) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (text.includes("document")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (text.includes("application")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (text.includes("callback") || text.includes("call")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function priorityTone(priority = "") {
  const value = lower(priority);

  if (value.includes("urgent") || value.includes("high")) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  }

  if (value.includes("normal") || value.includes("medium")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }

  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

function StatusToast({ status, onClear }) {
  if (!status?.message) return null;

  const tone =
    status.type === "error"
      ? "border-rose-400/25 bg-rose-500/10 text-rose-100"
      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";

  return (
    <div className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${tone}`}>
      <span>{status.message}</span>
      <button type="button" onClick={onClear} className="text-xs opacity-70 hover:opacity-100">
        Clear
      </button>
    </div>
  );
}

function SupportStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    rose: "border-rose-400/20 bg-rose-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function ReplyBox({ item, counselor, onRefresh, setStatus }) {
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState("");

  async function sendReply(close = false) {
    if (!response.trim()) {
      setStatus({ type: "error", message: "Write a reply first." });
      return;
    }

    setSaving(close ? "close" : "reply");
    setStatus(null);

    try {
      const replyText = response.trim();

      await replySupportThroughPortal({
        item,
        counselor,
        response: replyText,
        close,
      });

      setResponse("");
      setStatus({
        type: "success",
        message: close ? "Support reply sent and request resolved." : "Support reply sent and logged.",
      });
      onRefresh?.();
    } catch (error) {
      console.error("Support reply failed", error);
      setStatus({
        type: "error",
        message: `Support reply failed: ${error.message}`,
      });
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        {RESPONSE_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => setResponse(template.text)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.08]"
          >
            {template.label}
          </button>
        ))}
      </div>

      <textarea
        value={response}
        onChange={(event) => setResponse(event.target.value)}
        rows={3}
        placeholder="Write counselor response visible for workflow history..."
        className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{response.trim().length} characters</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => sendReply(false)}
            disabled={Boolean(saving)}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {saving === "reply" ? "Sending..." : "Send Reply"}
          </button>

          <button
            type="button"
            onClick={() => sendReply(true)}
            disabled={Boolean(saving)}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {saving === "close" ? "Resolving..." : "Reply + Resolve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ item, counselor, onRefresh, setStatus, compact, resolveRequest, savingId }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-400/25 hover:bg-slate-900/70">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.45fr_0.55fr] lg:items-start">
        <div>
          <h3 className="text-lg font-black">{item.subject}</h3>
          <p className="text-sm text-slate-400">
            {item.studentName} · {item.category}
          </p>

          {!compact && item.message ? (
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">{item.message}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${categoryTone(item)}`}>
              {item.category}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityTone(item.priority)}`}>
              {item.priority}
            </span>
            <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
              {item.status}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Support Intelligence</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{item.nextAction}</p>
          <p className="mt-2 text-xs text-slate-500">Opened {formatRelativeTime(item.createdAt)}</p>
        </div>

        <div className="text-sm text-slate-300">
          <p className="font-semibold">Counselor Action</p>
          <p className="mt-1 text-xs text-slate-500">
            Reply for history, or resolve once the student issue is complete.
          </p>

          {!compact ? (
            <button
              type="button"
              onClick={() => resolveRequest(item)}
              disabled={savingId === item.id}
              className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
            >
              {savingId === item.id ? "Resolving..." : "Quick Resolve"}
            </button>
          ) : null}
        </div>
      </div>

      {!compact ? <ReplyBox item={item} counselor={counselor} onRefresh={onRefresh} setStatus={setStatus} /> : null}
    </article>
  );
}

export default function CounselorSupportWorkspace({ snapshot, counselor, onRefresh, compact = false }) {
  const queue = useMemo(() => buildCounselorSupportQueue(snapshot || {}), [snapshot]);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [status, setStatus] = useState(null);

  const stats = useMemo(() => {
    const urgent = queue.filter((item) => lower(item.priority).includes("urgent") || lower(item.priority).includes("high")).length;
    const visa = queue.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("visa")).length;
    const documents = queue.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("document")).length;
    const callback = queue.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("callback") || lower(`${item.category} ${item.subject} ${item.message}`).includes("call")).length;
    const application = queue.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("application")).length;

    return {
      total: queue.length,
      urgent,
      visa,
      documents,
      callback,
      application,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "urgent") {
      next = next.filter((item) => lower(item.priority).includes("urgent") || lower(item.priority).includes("high"));
    }

    if (filter === "visa") {
      next = next.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("visa"));
    }

    if (filter === "documents") {
      next = next.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("document"));
    }

    if (filter === "callback") {
      next = next.filter((item) => {
        const text = lower(`${item.category} ${item.subject} ${item.message}`);
        return text.includes("callback") || text.includes("call");
      });
    }

    if (filter === "application") {
      next = next.filter((item) => lower(`${item.category} ${item.subject} ${item.message}`).includes("application"));
    }

    if (search) {
      next = next.filter((item) =>
        [item.subject, item.studentName, item.category, item.status, item.priority, item.message, item.nextAction]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return next;
  }, [queue, filter, query]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  async function resolveRequest(item) {
    setSavingId(item.id);
    setStatus(null);

    try {
      await replySupportThroughPortal({
        item,
        counselor,
        response: "Resolved from Counselor Portal OS. Counselor reviewed and closed this support item.",
        close: true,
      });

      setStatus({ type: "success", message: "Support request resolved." });
      onRefresh?.();
    } catch (error) {
      console.error("Resolve support request failed", error);
      setStatus({
        type: "error",
        message: `Support request could not be resolved: ${error.message}`,
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Support Queue</p>
          <h2 className="mt-2 text-2xl font-black">Student Support Command</h2>
          <p className="mt-1 text-sm text-slate-400">
            Open support requests, escalations, document reviews, visa help, callback needs, and counselor replies.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length}
        </span>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SupportStat label="Open" value={stats.total} helper="support items" tone="cyan" />
          <SupportStat label="Urgent" value={stats.urgent} helper="needs fast reply" tone="rose" />
          <SupportStat label="Visa" value={stats.visa} helper="visa help" tone="violet" />
          <SupportStat label="Docs" value={stats.documents} helper="document issues" tone="amber" />
          <SupportStat label="Calls" value={stats.callback} helper="callback needs" tone="emerald" />
          <SupportStat label="Apps" value={stats.application} helper="application help" />
        </div>
      ) : null}

      {!compact ? (
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search support, student, category, priority, message..."
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/40"
          >
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key} className="bg-slate-950">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.slice(0, 4).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                filter === item.key ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <div className="grid gap-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No open support requests.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Support queue is clear for the selected filter. New student support requests will appear here after Supabase refresh.
            </p>
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        ) : (
          visible.map((item) => (
            <SupportCard
              key={item.id}
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
        <p className="mt-4 text-center text-xs text-slate-500">
          Showing {visible.length} of {filtered.length} support items. Open Support Queue for full triage.
        </p>
      ) : null}
    </div>
  );
}