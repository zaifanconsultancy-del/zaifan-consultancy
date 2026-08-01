import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, ChevronUp,
  CircleDot, Clock3, ListFilter, RefreshCw, RotateCcw, Search, Sparkles,
  Trash2, XCircle,
} from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";
import { updateFollowUpReminderStatus, deleteFollowUpReminder } from "../../../../lib/followUpReminders";

const LOAD_TIMEOUT_MS = 12000;
const ACTION_TIMEOUT_MS = 12000;
const normalize = (value = "") => String(value || "").toLowerCase().trim();
const dateKey = (value) => value ? String(value).slice(0, 10) : "";

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => timer && clearTimeout(timer));
}
function getErrorMessage(error) {
  return error?.message || error?.details || error?.hint || (typeof error === "string" ? error : "Unknown error.");
}
function formatDue(reminder) {
  if (!reminder?.due_date) return "No deadline";
  return `${reminder.due_date}${reminder.due_time ? ` · ${String(reminder.due_time).slice(0,5)}` : ""}`;
}

function FollowUpDashboard({ cardClass = "" }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [compactQueue, setCompactQueue] = useState(false);
  const mountedRef = useRef(true);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const fetchReminders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const request = supabase.from("follow_up_reminders").select("*")
        .order("due_date", { ascending: true }).order("due_time", { ascending: true });
      const { data, error: fetchError } = await withTimeout(request, LOAD_TIMEOUT_MS, "Follow-up reminders took too long to load.");
      if (fetchError) throw fetchError;
      if (!mountedRef.current) return;
      setReminders(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load follow-up dashboard:", err);
      if (mountedRef.current) setError(getErrorMessage(err));
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const stats = useMemo(() => {
    let pending = 0;
    let dueToday = 0;
    let overdue = 0;
    let done = 0;
    let cancelled = 0;

    for (const item of reminders) {
      const status = normalize(item.status);
      const due = dateKey(item.due_date);

      if (status === "pending") {
        pending += 1;

        if (due === today) {
          dueToday += 1;
        } else if (due && due < today) {
          overdue += 1;
        }
      } else if (status === "done") {
        done += 1;
      } else if (status === "cancelled") {
        cancelled += 1;
      }
    }

    return {
      total: reminders.length,
      pending,
      today: dueToday,
      overdue,
      done,
      cancelled,
    };
  }, [reminders, today]);

  const filteredReminders = useMemo(() => {
    const cleanQuery = normalize(query);
    return reminders.filter((reminder) => {
      const status = normalize(reminder.status || "pending");
      const due = dateKey(reminder.due_date);
      let match = true;
      if (filter === "today") match = status === "pending" && due === today;
      else if (filter === "overdue") match = status === "pending" && Boolean(due) && due < today;
      else if (filter !== "all") match = status === filter;
      if (!match) return false;
      if (!cleanQuery) return true;
      return [reminder.title, reminder.notes, reminder.student_type, reminder.created_by_name, reminder.due_date, reminder.due_time]
        .map(normalize).join(" ").includes(cleanQuery);
    });
  }, [reminders, filter, query, today]);

  const runAction = async (id, action) => {
    if (busyId) return;
    setBusyId(id); setActionError("");
    try {
      await withTimeout(Promise.resolve(action()), ACTION_TIMEOUT_MS, "Reminder action timed out. The dashboard has been unlocked.");
      await fetchReminders({ silent: true });
    } catch (err) {
      console.error("Follow-up reminder action failed:", err);
      setActionError(getErrorMessage(err));
    } finally { if (mountedRef.current) setBusyId(null); }
  };
  const updateStatus = (id, status) => runAction(id, () => updateFollowUpReminderStatus(id, status));
  const removeReminder = async (id) => {
    if (!window.confirm("Delete this reminder permanently? This cannot be undone.")) return;
    await runAction(id, () => deleteFollowUpReminder(id));
  };
  const getBadge = (r) => {
    const status = normalize(r.status || "pending"), due = dateKey(r.due_date);
    if (status !== "pending") return status;
    if (due && due < today) return "overdue";
    if (due === today) return "due today";
    return "upcoming";
  };
  const queueHealth = stats.pending === 0 ? "Clear" : stats.overdue > 0 ? "Needs action" : stats.today > 0 ? "Due today" : "On track";
  const statCards = [
    ["Total", stats.total, "all", "navy"], ["Pending", stats.pending, "pending", "blue"],
    ["Due Today", stats.today, "today", "orange"], ["Overdue", stats.overdue, "overdue", "red"],
    ["Done", stats.done, "done", "green"], ["Cancelled", stats.cancelled, "cancelled", "slate"],
  ];

  return <section className={`${cardClass} min-w-0 space-y-5 !rounded-[2.2rem] !border-[4px] !border-solid !border-[#123865] !bg-[#FFF8EF] !p-5 shadow-[0_20px_55px_rgba(18,56,101,.12)] sm:!p-5`}>
    <div className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,.12)]">
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex min-w-0 flex-wrap gap-2">
                <Pill icon={CalendarClock}>Follow-up Operations</Pill><Pill>Live CRM Queue</Pill>
              </div>
              <h2 className="mt-4 max-w-4xl text-2xl font-black tracking-[-0.02em] text-white sm:text-3xl lg:text-[2.15rem]">Follow-up Command Center</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-100">Prioritize student contact, clear overdue work, and close every reminder without losing queue context.</p>
              <div className="mt-5 grid max-w-3xl gap-2 sm:grid-cols-3">
                <HeroMetric label="Open Queue" value={stats.pending}/><HeroMetric label="Due Today" value={stats.today}/><HeroMetric label="Overdue" value={stats.overdue}/>
              </div>
            </div>
            <button type="button" onClick={() => fetchReminders()} disabled={loading} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/10 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>{loading ? "Refreshing..." : "Refresh Queue"}
            </button>
          </div>
        </div>
        <aside className="border-t-[3px] border-orange-300 bg-[#FF5A0A] p-5 text-white lg:border-l-[3px] lg:border-t-0 lg:p-6">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-white">Queue Health</p>
          <div className="mt-3 flex items-start justify-between gap-3"><div><p className="text-3xl font-black text-white">{queueHealth}</p><p className="mt-1 text-xs font-bold text-white">{stats.pending} reminder{stats.pending===1?"":"s"} still operational.</p></div><Sparkles size={28}/></div>
          <div className="mt-5 rounded-2xl border-2 border-white/30 bg-white/10 p-4 shadow-inner"><p className="text-[9px] font-black uppercase tracking-[.12em] text-white">Last synced</p><p className="mt-1 text-lg font-black text-white">{lastUpdated ? lastUpdated.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "Waiting…"}</p></div>
        </aside>
      </div>
      <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{statCards.map(([label,value,f,tone]) => <StatCard key={label} label={label} value={value} tone={tone} active={filter===f} onClick={()=>setFilter(f)}/>)}</div>
        <div className="mt-4 min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-white p-3 shadow-[0_8px_24px_rgba(18,56,101,.06)]">
          <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <label className="relative min-w-0"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search title, notes, student type, creator or deadline..." className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] py-2.5 pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"/></label>
            <div className="flex flex-wrap gap-2">{["pending","today","overdue","done","cancelled","all"].map(item=><button key={item} type="button" onClick={()=>setFilter(item)} className={`rounded-xl border-2 px-4 py-2 text-xs font-black capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${filter===item?"border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-sm":"border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A] hover:bg-orange-50"}`}>{item}</button>)}</div>
          </div>
        </div>
      </div>
    </div>

    {error && <MessageBox title="Follow-up queue could not load" message={error} action={<button onClick={()=>fetchReminders()} className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-xs font-black text-red-700">Retry</button>}/>}
    {actionError && <MessageBox title="Reminder action failed" message={actionError} action={<button onClick={()=>setActionError("")} className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-xs font-black text-red-700">Dismiss</button>}/>}

    <div className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#123865] bg-white shadow-[0_16px_42px_rgba(18,56,101,.09)]">
      <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><ListFilter size={16}/><p className="text-[9px] font-black uppercase tracking-[.14em] text-white">Operational Queue</p></div><h3 className="mt-1 text-xl font-black text-white">{filteredReminders.length} reminder{filteredReminders.length===1?"":"s"} in view</h3></div>
        <div className="flex min-w-0 flex-wrap gap-2">{query && <button onClick={()=>setQuery("")} className="rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">Clear search</button>}<button onClick={()=>setCompactQueue(v=>!v)} className="inline-flex items-center gap-2 rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">{compactQueue?<ChevronDown size={15}/>:<ChevronUp size={15}/>} {compactQueue?"Expand Cards":"Compact Cards"}</button></div>
      </div>
      <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        {loading && reminders.length===0 ? <Empty icon={RefreshCw} text="Loading follow-up reminders..." spin/> :
        filteredReminders.length===0 ? <Empty icon={CheckCircle2} text="Queue is clear — nothing matches this view."/> :
        <div className="space-y-3">{filteredReminders.map(r=><ReminderCard key={r.id} reminder={r} badge={getBadge(r)} status={normalize(r.status||"pending")} busy={busyId===r.id} compact={compactQueue} onDone={()=>updateStatus(r.id,"done")} onReopen={()=>updateStatus(r.id,"pending")} onCancel={()=>updateStatus(r.id,"cancelled")} onDelete={()=>removeReminder(r.id)}/>)}</div>}
      </div>
    </div>
  </section>;
}

function Pill({icon:Icon,children}) { return <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-white">{Icon&&<Icon size={14}/>} {children}</span>; }
function HeroMetric({label,value}) { return <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3"><p className="text-[8px] font-black uppercase tracking-[.12em] text-white">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>; }
function StatCard({label,value,active,onClick,tone}) {
  const tones={navy:"border-[#123865] bg-[#edf3f9] text-[#123865]",blue:"border-blue-400 bg-blue-50 text-blue-700",orange:"border-orange-400 bg-orange-50 text-orange-700",red:"border-red-400 bg-red-50 text-red-700",green:"border-emerald-400 bg-emerald-50 text-emerald-700",slate:"border-slate-400 bg-slate-50 text-slate-700"};
  return <button type="button" onClick={onClick} className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 text-left shadow-[0_7px_20px_rgba(18,56,101,.05)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${tones[tone]} ${active?"ring-4 ring-orange-100 shadow-md":""}`}><p className="text-[9px] font-black uppercase tracking-[.1em]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></button>;
}
function ReminderCard({reminder,badge,status,busy,compact,onDone,onReopen,onCancel,onDelete}) {
  const t=getTone(badge), closed=status==="done"||status==="cancelled";
  return <article className={`min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] ${t.border} ${t.bg} shadow-[0_8px_24px_rgba(18,56,101,.06)] transition hover:-translate-y-0.5 hover:shadow-lg`}>
    <div className={`h-1.5 ${t.bar}`}/>
    <div className="min-w-0 p-4 sm:p-5"><div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3"><span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 ${t.icon}`}>{badge==="overdue"?<AlertTriangle size={18}/>:badge==="due today"?<Clock3 size={18}/>:closed?<CheckCircle2 size={18}/>:<CircleDot size={18}/>}</span><div><div className="flex flex-wrap items-center gap-2"><h4 className="break-words text-base font-black text-[#10233F] sm:text-lg">{reminder.title||"Untitled reminder"}</h4><Badge badge={badge}/></div><p className="mt-1 text-[9px] font-black uppercase tracking-[.1em] text-slate-500">{reminder.student_type||"Student"} · {reminder.created_by_name||"Admin"}</p></div></div>
        {!compact && <><div className="mt-4 rounded-[1.2rem] border-2 border-orange-200 bg-white/80 p-4"><div className="flex items-center gap-2"><Sparkles size={15} className="text-orange-600"/><p className="text-[9px] font-black uppercase tracking-[.12em] text-orange-700">Follow-up Context</p></div><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{reminder.notes||"No additional notes saved. Review the related student workflow before taking action."}</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Meta label="Deadline" value={formatDue(reminder)}/><Meta label="Student Type" value={reminder.student_type||"Unknown"}/><Meta label="Owner" value={reminder.created_by_name||"Admin"}/><Meta label="Workflow" value={status||"pending"}/></div></>}
      </div>
      <div className="min-w-0 shrink-0 xl:w-[320px]"><div className={`rounded-[1.25rem] border-2 ${t.actionBorder} bg-white/90 p-3 shadow-sm`}><p className="mb-2 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">Workflow Actions</p><div className="grid grid-cols-2 gap-2">{status!=="done"?<ActionButton icon={CheckCircle2} label={busy?"Working...":"Complete"} disabled={busy} onClick={onDone} tone="green"/>:<ActionButton icon={RotateCcw} label="Reopen" disabled={busy} onClick={onReopen} tone="navy"/>}{status!=="cancelled"?<ActionButton icon={XCircle} label="Cancel" disabled={busy} onClick={onCancel}/>:<ActionButton icon={RotateCcw} label="Reopen" disabled={busy} onClick={onReopen} tone="navy"/>}<div className="col-span-2"><ActionButton icon={Trash2} label={busy?"Working...":"Delete Permanently"} disabled={busy} onClick={onDelete} tone="red"/></div></div></div></div>
    </div></div>
  </article>;
}
function getTone(badge) {
  if(badge==="overdue") return {border:"border-red-400",bg:"bg-[#fff5f5]",bar:"bg-red-500",icon:"border-red-300 bg-red-50 text-red-700",actionBorder:"border-red-200"};
  if(badge==="due today") return {border:"border-orange-400",bg:"bg-[#fff7ed]",bar:"bg-orange-500",icon:"border-orange-300 bg-orange-50 text-orange-700",actionBorder:"border-orange-200"};
  if(badge==="done") return {border:"border-emerald-400",bg:"bg-[#f1fcf7]",bar:"bg-emerald-500",icon:"border-emerald-300 bg-emerald-50 text-emerald-700",actionBorder:"border-emerald-200"};
  if(badge==="cancelled") return {border:"border-slate-400",bg:"bg-slate-50",bar:"bg-slate-500",icon:"border-slate-300 bg-white text-slate-700",actionBorder:"border-slate-300"};
  return {border:"border-blue-400",bg:"bg-[#f3f8ff]",bar:"bg-blue-500",icon:"border-blue-300 bg-blue-50 text-blue-700",actionBorder:"border-blue-200"};
}
function Meta({label,value}) { return <div className="rounded-xl border-2 border-slate-300 bg-[#FFFDF8] px-3 py-2.5"><p className="text-[8px] font-black uppercase tracking-[.08em] text-slate-500">{label}</p><p className="mt-1 break-words text-xs font-black capitalize text-[#10233f]">{value}</p></div>; }
function Badge({badge}) {
  let s="border-blue-300 bg-blue-50 text-blue-700"; if(badge==="overdue")s="border-red-300 bg-red-50 text-red-700"; if(badge==="due today")s="border-orange-400 bg-orange-50 text-orange-800"; if(badge==="done")s="border-emerald-300 bg-emerald-50 text-emerald-800"; if(badge==="cancelled")s="border-slate-300 bg-slate-100 text-slate-700";
  return <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[.08em] ${s}`}>{badge}</span>;
}
function ActionButton({icon:Icon,label,onClick,disabled,tone="default"}) {
  const s={red:"border-red-300 bg-red-50 text-red-700 hover:bg-red-100",green:"border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600",navy:"border-[#123865] bg-[#123865] text-white hover:bg-[#0e2f55]",default:"border-slate-300 bg-white text-[#10233f] hover:border-orange-300 hover:bg-orange-50"};
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45 ${s[tone]}`}><Icon size={14}/>{label}</button>;
}
function MessageBox({title,message,action}) { return <div role="alert" aria-live="assertive" className="rounded-[1.4rem] border-[3px] border-red-300 bg-red-50 p-4 shadow-[0_8px_24px_rgba(239,68,68,.08)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-.5 text-red-700"/><div><p className="font-black text-[#10233f]">{title}</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{message}</p></div></div>{action}</div></div>; }
function Empty({icon:Icon,text,spin}) { return <div className="rounded-2xl border-[3px] border-dashed border-orange-300 bg-white p-8 text-center"><Icon className={`mx-auto text-orange-600 ${spin?"animate-spin":""}`} size={28}/><p className="mt-3 font-black text-[#10233f]">{text}</p></div>; }
export default FollowUpDashboard;
