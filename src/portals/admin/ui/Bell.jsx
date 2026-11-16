// The bell in the top bar: everything that is waiting for the team, on every
// page. Each line opens the right tab of the right person's file.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell as BellIcon, CheckSquare, FileCheck2, Inbox, MessageSquareWarning, Moon, Receipt, Sparkles, Wallet } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { classNames, daysUntil, dueLabel, fmtMoney, timeAgo, toDate } from "../lib/format";
import { path } from "../lib/paths";
import { isDone } from "../lib/people";

const KINDS = {
  lead: { label: "New leads", Icon: Inbox, color: "#ff4b12" },
  receipt: { label: "Receipts to check", Icon: Receipt, color: "#f59e0b" },
  question: { label: "Questions", Icon: MessageSquareWarning, color: "#ec4899" },
  document: { label: "Documents to check", Icon: FileCheck2, color: "#10b981" },
  invoice: { label: "Late invoices", Icon: Wallet, color: "#ef4444" },
  task: { label: "My late tasks", Icon: CheckSquare, color: "#8b5cf6" },
  quiet: { label: "Gone quiet", Icon: Moon, color: "#64748b" },
};

// A student in one of these stages with nothing planned and no activity for
// two weeks is probably being forgotten.
const MOVING_STAGES = ["applying", "offer", "visa"];
const QUIET_DAYS = 14;

const PENDING_DOC = ["pending", "pending_review", "submitted", "uploaded"];

function buildItems(people, viewerId) {
  const items = [];
  for (const person of people) {
    const file = (tab) => path(`/people/${person.id}${tab ? `?tab=${tab}` : ""}`);
    if (person.stage === "lead") {
      items.push({ kind: "lead", person, text: "Reached out and has no reply yet", when: person.createdAt, to: path(`/leads?open=${person.id}`) });
    }
    for (const receipt of person.receipts) {
      if (!String(receipt.review_status || receipt.status || "").includes("pending")) continue;
      items.push({ kind: "receipt", person, text: `Says they paid ${fmtMoney(receipt.amount, receipt.currency)}`, when: receipt.submitted_at || receipt.created_at, to: file("payments") });
    }
    for (const request of person.supportRequests) {
      if (["resolved", "closed"].includes(String(request.status || "").toLowerCase())) continue;
      items.push({ kind: "question", person, text: request.subject || "Asked a question", when: request.updated_at || request.created_at, to: file("messages") });
    }
    // One line per person, however many files they sent (documents are newest first).
    const docs = person.documents.filter((doc) => PENDING_DOC.includes(String(doc.status || "").toLowerCase()));
    if (docs.length) {
      const names = docs.map((doc) => doc.document_name || "a document");
      const text = docs.length === 1 ? `Uploaded ${names[0]}` : `Uploaded ${docs.length} documents: ${names.slice(0, 3).join(", ")}${docs.length > 3 ? "…" : ""}`;
      items.push({ kind: "document", person, text, when: docs[0].created_at, to: file("documents") });
    }
    for (const invoice of person.invoices) {
      if (["paid", "void", "cancelled", "draft"].includes(String(invoice.status || "").toLowerCase())) continue;
      if (!invoice.due_date || daysUntil(invoice.due_date) >= 0) continue;
      items.push({ kind: "invoice", person, text: `${invoice.title || "Invoice"} was ${dueLabel(invoice.due_date)}`, when: invoice.due_date, to: file("payments"), fixedTime: true });
    }
    for (const task of person.tasks) {
      if (isDone(task.status) || task.assigned_to !== viewerId) continue;
      if (!task.due_date || daysUntil(task.due_date) > 0) continue;
      items.push({ kind: "task", person, text: `${task.title} · ${dueLabel(task.due_date)}`, when: task.due_date, to: file("tasks"), fixedTime: true });
    }
    const idleDays = person.lastActivityAt ? -daysUntil(person.lastActivityAt) : null;
    if (MOVING_STAGES.includes(person.stage) && !person.counts.openTasks && idleDays !== null && idleDays >= QUIET_DAYS) {
      items.push({ kind: "quiet", person, text: `Nothing happened for ${idleDays} days and no next step is planned`, when: person.lastActivityAt, to: file("tasks"), fixedTime: true });
    }
  }
  return items.sort((a, b) => (toDate(b.when)?.getTime() || 0) - (toDate(a.when)?.getTime() || 0));
}

export default function Bell() {
  const { people, admin } = useAdminData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("all");
  const box = useRef(null);

  const items = useMemo(() => buildItems(people, admin.id), [people, admin.id]);
  const counts = useMemo(() => {
    const map = {};
    for (const item of items) map[item.kind] = (map[item.kind] || 0) + 1;
    return map;
  }, [items]);
  const shown = (kind === "all" || !counts[kind] ? items : items.filter((item) => item.kind === kind)).slice(0, 40);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`${items.length} thing${items.length === 1 ? "" : "s"} waiting for the team`}
        aria-expanded={open}
        title="Waiting for the team"
        className={classNames(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-[#071f50] transition hover:border-[#071f50]/25",
          open ? "border-[#071f50]/30" : "border-[#071f50]/10"
        )}
      >
        <BellIcon size={17} />
        {items.length ? (
          <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full bg-[#ff4b12] px-1.5 py-0.5 text-center text-[10.5px] font-black leading-none text-white ring-2 ring-[#fff7ed]">
            {items.length > 99 ? "99+" : items.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-[68px] z-40 overflow-hidden rounded-[22px] border border-[#071f50]/10 bg-white shadow-[0_30px_80px_rgba(7,31,80,0.28)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[420px]">
          <div className="border-b border-[#071f50]/8 px-4 pb-3 pt-4">
            <p className="text-[15px] font-black text-[#071f50]">Waiting for the team</p>
            <p className="text-[12.5px] font-semibold text-[#071f50]/55">{items.length ? "Newest first. Click a line to open it." : "Nothing is waiting. Everything is answered."}</p>
            {items.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <FilterChip active={kind === "all" || !counts[kind]} onClick={() => setKind("all")} label="All" count={items.length} color="#071f50" />
                {Object.entries(KINDS)
                  .filter(([id]) => counts[id])
                  .map(([id, meta]) => (
                    <FilterChip key={id} active={kind === id} onClick={() => setKind(id)} label={meta.label} count={counts[id]} color={meta.color} />
                  ))}
              </div>
            ) : null}
          </div>

          {items.length ? (
            <ul className="max-h-[min(60vh,460px)] overflow-y-auto p-2">
              {shown.map((item, index) => {
                const meta = KINDS[item.kind];
                return (
                  <li key={`${item.kind}-${item.person.id}-${index}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(item.to);
                      }}
                      className="flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-[#fff1e8]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>
                        <meta.Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-black text-[#071f50]">{item.person.name}</span>
                        <span className="block truncate text-[12.5px] font-semibold text-[#071f50]/60">{item.text}</span>
                      </span>
                      {!item.fixedTime && item.when ? <span className="shrink-0 pt-0.5 text-[11px] font-bold text-[#071f50]/40">{timeAgo(item.when)}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <Sparkles size={22} className="text-[#ff4b12]" />
              <p className="mt-2 text-[13.5px] font-bold text-[#071f50]/60">New leads, receipts, documents and questions will show up here.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, label, count, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-extrabold transition", active ? "border-transparent text-white" : "border-[#071f50]/10 text-[#071f50]/70 hover:border-[#071f50]/25")}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
      <span className={classNames("tabular-nums", active ? "text-white/80" : "")} style={active ? undefined : { color }}>
        {count}
      </span>
    </button>
  );
}
