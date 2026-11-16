// Leads: people who asked something or booked a call, before they become
// students. Laid out as an "arrivals hall": a navy board with the numbers that
// matter (who is waiting for a reply, calls coming up), then two lanes —
// New and In conversation — so it is obvious who to answer first.

import { useMemo, useState } from "react";
import { path } from "../lib/paths";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Check,
  Columns2,
  Download,
  Hourglass,
  Inbox,
  LayoutList,
  MessageSquareText,
  Search,
  Sparkles,
  StickyNote,
  UserCheck,
} from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { downloadPeopleList } from "../lib/exportList";
import { classNames, daysUntil, fmtDate, fmtDateTime, humanize, sortBy, startOfDay, timeAgo, toDate } from "../lib/format";
import { CLOSE_REASONS, LEAD_STAGES, PRIORITIES, personMatches, STAGE_BY_ID, STUDENT_STAGES } from "../lib/people";
import { Avatar, Button, Card, Chip, Drawer, EmptyState, Field, Input, KeyValue, Notice, Segmented, Select, Spinner, Textarea, useConfirm, useToast } from "../ui/kit";
import { ContactButtons, PriorityChip, StageChip } from "../ui/person";
import MessageComposer from "../ui/MessageComposer";
import useCloseFile from "../ui/useCloseFile";
import DuplicateNotice from "../ui/DuplicateNotice";

const HOUR = 3600000;

/** How long a new lead has been waiting for a first reply, with a traffic-light colour. */
function replyClock(person) {
  const since = toDate(person.sources[0]?.createdAt || person.createdAt);
  if (!since) return null;
  const hours = (Date.now() - since.getTime()) / HOUR;
  const text = hours < 1 ? "under an hour" : hours < 24 ? `${Math.round(hours)} hr${Math.round(hours) === 1 ? "" : "s"}` : `${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"}`;
  const color = hours < 4 ? "#10b981" : hours < 24 ? "#f59e0b" : "#ef4444";
  return { hours, text, color };
}

/** Calls booked by leads from today onwards, soonest first. */
function upcomingCalls(people) {
  const today = startOfDay();
  const calls = [];
  for (const person of people) {
    for (const source of person.sources) {
      if (source.type !== "appointment") continue;
      const status = String(source.row.status || "pending").toLowerCase();
      if (["cancelled", "completed"].includes(status)) continue;
      const date = toDate(source.row.appointment_date);
      if (!date || date < today) continue;
      calls.push({ person, source, date, time: source.row.appointment_time || "", status });
    }
  }
  return calls.sort((a, b) => a.date - b.date || String(a.time).localeCompare(String(b.time)));
}

/** Share of everyone who ever reached out who went on to become a student. */
function conversion(people) {
  const converted = people.filter((person) => STUDENT_STAGES.includes(person.stage)).length;
  return { total: people.length, converted, rate: people.length ? Math.round((converted / people.length) * 100) : 0 };
}

function dayWord(date) {
  const days = daysUntil(date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

export default function LeadsPage() {
  const { people, loading, staff, staffById, isCounselor, setStage, assignPerson, updatePerson, update } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  // List view: tick several leads, then do one thing to all of them.
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "open";
  const [view, setView] = useState(() => {
    try {
      return window.localStorage.getItem("zaifan-leads-view") || "board";
    } catch {
      return "board";
    }
  });
  const [query, setQuery] = useState("");
  const [localOpenId, setOpenId] = useState(null);
  const openId = localOpenId || params.get("open");

  const changeView = (next) => {
    setView(next);
    try {
      window.localStorage.setItem("zaifan-leads-view", next);
    } catch {
      // private mode: fine
    }
  };

  const leads = useMemo(() => people.filter((person) => LEAD_STAGES.includes(person.stage) || person.stage === "closed"), [people]);
  const openLeads = useMemo(() => leads.filter((person) => LEAD_STAGES.includes(person.stage)), [leads]);
  const calls = useMemo(() => upcomingCalls(openLeads), [openLeads]);

  const counts = {
    open: openLeads.length,
    lead: leads.filter((p) => p.stage === "lead").length,
    consulting: leads.filter((p) => p.stage === "consulting").length,
    closed: leads.filter((p) => p.stage === "closed").length,
  };

  const searched = useMemo(() => leads.filter((person) => personMatches(person, query)), [leads, query]);

  const visible = useMemo(() => {
    const byStage = searched.filter((person) => (filter === "open" ? LEAD_STAGES.includes(person.stage) : person.stage === filter));
    return sortBy(byStage, (person) => person.createdAt);
  }, [filter, searched]);

  // New leads: oldest wait first, so the person waiting longest is on top.
  const lanes = useMemo(
    () => ({
      lead: sortBy(searched.filter((p) => p.stage === "lead"), (p) => p.sources[0]?.createdAt || p.createdAt, "asc"),
      consulting: sortBy(searched.filter((p) => p.stage === "consulting"), (p) => p.lastActivityAt),
    }),
    [searched]
  );

  const open = openId ? people.find((person) => person.id === openId) : null;

  const chosen = view === "list" ? visible.filter((person) => selected.has(person.id)) : [];
  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runBulk = async (doneText, action) => {
    setBulkBusy(true);
    let done = 0;
    try {
      for (const person of chosen) {
        await action(person);
        done += 1;
      }
    } catch {
      // the provider already showed what went wrong
    } finally {
      setBulkBusy(false);
      setSelected(new Set());
      if (done) toast.push(`${done} lead${done === 1 ? "" : "s"} ${doneText}.`);
    }
  };

  const bulkAssign = (staffId) => runBulk(staffId ? `given to ${staffById.get(staffId)?.name || "them"}` : "unassigned", (person) => assignPerson(person, staffId || null, { quiet: true }));
  const bulkPriority = (priority) => runBulk(`set to ${priority} priority`, (person) => (person.priority === priority ? null : updatePerson(person, { priority })));
  const bulkSpoken = () =>
    runBulk("moved to “In conversation”", async (person) => {
      if (person.stage !== "lead") return;
      await setStage(person, "consulting", { quiet: true });
      for (const source of person.sources) {
        if (source.type === "inquiry" && source.row.status === "new") await update("inquiries", source.id, { status: "contacted" });
      }
    });
  const bulkClose = async () => {
    const answer = await confirm({
      title: `Close ${chosen.length} lead${chosen.length === 1 ? "" : "s"}?`,
      text: "Pick one reason for all of them. You can reopen any of them later.",
      choices: CLOSE_REASONS,
      noteLabel: "Anything to remember",
      confirmLabel: "Close them",
      danger: true,
    });
    if (!answer) return;
    await runBulk("closed", (person) => (person.stage === "closed" ? null : setStage(person, "closed", { reason: answer.choice, note: answer.note, quiet: true })));
  };
  const bulkReopen = () => runBulk("reopened", (person) => (person.stage === "closed" ? setStage(person, "consulting", { quiet: true }) : null));

  if (loading) return <Spinner label="Loading leads…" />;

  return (
    <div className="space-y-5">
      <ArrivalsBoard people={people} openLeads={openLeads} calls={calls} onOpen={setOpenId} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={view}
            onChange={changeView}
            options={[
              { id: "board", label: <span className="inline-flex items-center gap-1.5"><Columns2 size={14} /> Board</span> },
              { id: "list", label: <span className="inline-flex items-center gap-1.5"><LayoutList size={14} /> List</span> },
            ]}
          />
          {view === "list" ? (
            <Segmented
              value={filter}
              onChange={(value) => setParams(value === "open" ? {} : { filter: value })}
              options={[
                { id: "open", label: "Open", count: counts.open },
                { id: "lead", label: "New", color: STAGE_BY_ID.lead.color, count: counts.lead },
                { id: "consulting", label: "Talking", color: STAGE_BY_ID.consulting.color, count: counts.consulting },
                { id: "closed", label: "Closed", color: STAGE_BY_ID.closed.color, count: counts.closed },
              ]}
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#071f50]/35" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, phone, country" className="pl-10 sm:w-72" />
          </label>
          {!isCounselor ? (
            <Button
              icon={Download}
              disabled={!(view === "list" ? visible : searched.filter((person) => LEAD_STAGES.includes(person.stage))).length}
              title="Save the leads shown below as a file that opens in Excel"
              onClick={() => {
                const list = view === "list" ? visible : searched.filter((person) => LEAD_STAGES.includes(person.stage));
                const count = downloadPeopleList(list, { staffById, name: "leads" });
                toast.push(`Saved ${count} lead${count === 1 ? "" : "s"} to your Downloads folder. Open the file with Excel.`);
              }}
            >
              Download list
            </Button>
          ) : null}
        </div>
      </div>

      {view === "board" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Lane
            stage="lead"
            title="New — reply to these"
            hint="Oldest first. The clock shows how long they have waited for a first reply."
            people={lanes.lead}
            onOpen={setOpenId}
            empty={query ? "No new leads match that search." : "Nobody is waiting for a reply. Nice."}
          />
          <Lane
            stage="consulting"
            title="In conversation"
            hint="You have spoken. Press “Make a student” when they decide to go ahead."
            people={lanes.consulting}
            onOpen={setOpenId}
            empty={query ? "Nobody here matches that search." : "Nobody in conversation right now."}
          />
          {counts.closed ? (
            <button
              type="button"
              onClick={() => {
                changeView("list");
                setParams({ filter: "closed" });
              }}
              className="text-left text-[13px] font-extrabold text-[#071f50]/50 hover:text-[#071f50] lg:col-span-2"
            >
              {counts.closed} closed lead{counts.closed === 1 ? "" : "s"} hidden · show them →
            </button>
          ) : null}
        </div>
      ) : visible.length ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-bold text-[#071f50]/55">
            <span>Tick the box on a card to change several leads at once.</span>
            <button type="button" className="font-extrabold text-[#ff4b12] hover:underline" onClick={() => setSelected(chosen.length === visible.length ? new Set() : new Set(visible.map((person) => person.id)))}>
              {chosen.length === visible.length ? "Untick all" : `Tick all ${visible.length}`}
            </button>
          </div>
          <ul className={classNames("grid gap-3 md:grid-cols-2 2xl:grid-cols-3", chosen.length ? "pb-24" : "")}>
            {visible.map((person) => (
              <li key={person.id}>
                <LeadCard person={person} onOpen={() => setOpenId(person.id)} selected={selected.has(person.id)} onSelect={() => toggle(person.id)} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={Inbox}
            title={query ? "No leads match that search" : filter === "lead" ? "No new leads waiting" : "No leads here"}
            text="Website forms and bookings land here automatically. Use “Add a person” for walk-ins and phone calls."
          />
        </Card>
      )}

      {chosen.length ? (
        <div className="fixed inset-x-3 bottom-[76px] z-40 mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-[22px] bg-[#071f50] px-4 py-3 text-white shadow-[0_20px_50px_rgba(7,31,80,0.4)] lg:bottom-6 lg:left-[248px]">
          <span className="mr-1 text-[13.5px] font-black">{chosen.length} ticked</span>
          {!isCounselor ? (
            <Select aria-label="Give to" value="" disabled={bulkBusy} onChange={(event) => event.target.value && bulkAssign(event.target.value === "none" ? "" : event.target.value)} className="!h-9 !w-auto min-w-[140px] !text-[13px]">
              <option value="">Give to…</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
              <option value="none">Nobody</option>
            </Select>
          ) : null}
          <Select aria-label="Priority" value="" disabled={bulkBusy} onChange={(event) => event.target.value && bulkPriority(event.target.value)} className="!h-9 !w-auto min-w-[120px] !text-[13px]">
            <option value="">Priority…</option>
            {PRIORITIES.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.label}
              </option>
            ))}
          </Select>
          {chosen.some((person) => person.stage === "lead") ? (
            <Button size="sm" variant="primary" busy={bulkBusy} onClick={bulkSpoken}>
              We've spoken
            </Button>
          ) : null}
          {chosen.some((person) => person.stage !== "closed") ? (
            <Button size="sm" variant="danger" disabled={bulkBusy} onClick={bulkClose}>
              Close
            </Button>
          ) : null}
          {chosen.some((person) => person.stage === "closed") ? (
            <Button size="sm" disabled={bulkBusy} onClick={bulkReopen}>
              Reopen
            </Button>
          ) : null}
          <button type="button" className="ml-auto text-[12.5px] font-extrabold text-white/60 hover:text-white" onClick={() => setSelected(new Set())} disabled={bulkBusy}>
            Clear
          </button>
        </div>
      ) : null}

      <LeadDrawer
        key={open?.id || "none"}
        person={open}
        onClose={() => {
          setOpenId(null);
          if (params.get("open")) setParams({});
        }}
      />
    </div>
  );
}

/* ------------------------------ arrivals board ------------------------------ */

function ArrivalsBoard({ people, openLeads, calls, onOpen }) {
  const waiting = openLeads.filter((person) => person.stage === "lead");
  const clocks = waiting.map(replyClock).filter(Boolean);
  const longest = clocks.reduce((max, clock) => (clock.hours > (max?.hours ?? -1) ? clock : max), null);
  const late = clocks.filter((clock) => clock.hours >= 24).length;

  const { total, converted, rate } = conversion(people);

  const nextCalls = calls.slice(0, 4);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_24px_60px_rgba(7,31,80,0.2)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -bottom-40 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-6 -bottom-20 h-[250px] w-[250px] rounded-full border border-white/[0.07]" />

      <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a5c]">Leads · arrivals</p>
          <h1 className="mt-2 text-[1.9rem] font-black leading-tight tracking-[-0.02em] sm:text-[2.3rem]">People who reached out</h1>
          <p className="mt-2 max-w-lg text-[15px] leading-6 text-white/65">
            {waiting.length
              ? `${waiting.length} ${waiting.length === 1 ? "person is" : "people are"} waiting for a first reply${late ? `, ${late} for over a day` : ""}. Answer them from the left lane below.`
              : "Everyone who wrote in has had a reply. Keep the conversations moving."}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Tile label="Waiting for reply" value={waiting.length} hint={longest ? `longest ${longest.text}` : "none waiting"} accent={late > 0} />
            <Tile label="In conversation" value={openLeads.length - waiting.length} hint="deciding" />
            <Tile label="Calls booked" value={calls.length} hint={calls[0] ? `next ${dayWord(calls[0].date).toLowerCase()}` : "none coming up"} />
            <Tile label="Became students" value={`${rate}%`} hint={`${converted} of ${total} so far`} />
          </dl>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
            <CalendarClock size={14} /> Calls coming up
          </p>
          {nextCalls.length ? (
            <ul className="mt-3 divide-y divide-white/10">
              {nextCalls.map((call) => (
                <li key={call.source.key}>
                  <button type="button" onClick={() => onOpen(call.person.id)} className="flex w-full items-center gap-3 py-2.5 text-left transition hover:opacity-80">
                    <span className="w-[74px] shrink-0">
                      <span className={classNames("block text-[12px] font-black uppercase tracking-[0.08em]", daysUntil(call.date) === 0 ? "text-[#ff8a5c]" : "text-white")}>{dayWord(call.date)}</span>
                      <span className="block font-mono text-[13px] font-bold text-white/60">{call.time || "—"}</span>
                    </span>
                    <Avatar name={call.person.name} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-black">{call.person.name}</span>
                      <span className="block truncate text-[12px] font-semibold text-white/50">
                        {[call.source.row.consultation_type, call.source.row.country_interest].filter(Boolean).join(" · ") || "Consultation"}
                      </span>
                    </span>
                    {call.status === "pending" ? <span className="shrink-0 rounded-full bg-[#ff4b12]/20 px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.08em] text-[#ff8a5c]">confirm</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-center text-[13.5px] font-semibold text-white/45">No calls booked from today on. Bookings from the website appear here.</p>
          )}
          {calls.length > nextCalls.length ? <p className="mt-2 text-[12px] font-bold text-white/40">+{calls.length - nextCalls.length} more later</p> : null}
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, hint, accent = false }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
      <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{label}</dt>
      <dd className={classNames("mt-1.5 text-[1.9rem] font-black leading-none tracking-[-0.03em] tabular-nums", accent ? "text-[#ff8a5c]" : "text-white")}>{value}</dd>
      <dd className="mt-1.5 truncate text-[11.5px] font-semibold text-white/50">{hint}</dd>
    </div>
  );
}

/* ---------------------------------- lanes ---------------------------------- */

function Lane({ stage, title, hint, people, onOpen, empty }) {
  const meta = STAGE_BY_ID[stage];
  return (
    <section className="flex min-w-0 flex-col rounded-[24px] bg-[#071f50]/[0.035] p-2.5">
      <header className="flex items-start justify-between gap-3 px-2.5 pb-3 pt-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[15px] font-black text-[#071f50]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
            {title}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-5 text-[#071f50]/55">{hint}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[13px] font-black tabular-nums text-[#071f50] shadow-[0_1px_2px_rgba(7,31,80,0.08)]">{people.length}</span>
      </header>
      {people.length ? (
        <ul className="space-y-2">
          {people.map((person) => (
            <li key={person.id}>
              <LeadCard person={person} onOpen={() => onOpen(person.id)} showClock={stage === "lead"} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-[#071f50]/10 px-4 py-8 text-center text-[13.5px] font-semibold text-[#071f50]/45">{empty}</p>
      )}
    </section>
  );
}

function LeadCard({ person, onOpen, showClock = false, selected = false, onSelect }) {
  const newest = person.sources[0];
  const isAppointment = newest?.type === "appointment";
  const row = newest?.row || {};
  const detail = isAppointment
    ? `${row.consultation_type || "Consultation"} · ${fmtDate(row.appointment_date)} ${row.appointment_time || ""}`
    : [row.study_level, row.field_of_interest].filter((v) => v && !/not sure/i.test(v)).join(" · ");
  const clock = showClock || person.stage === "lead" ? replyClock(person) : null;
  const lastNote = person.notes[0];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={classNames(
        "group flex w-full cursor-pointer flex-col rounded-[20px] border bg-white p-4 text-left shadow-[0_1px_2px_rgba(7,31,80,0.04)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(7,31,80,0.09)] focus-visible:ring-4 focus-visible:ring-[#ff4b12]/20",
        selected ? "border-[#ff4b12] ring-2 ring-[#ff4b12]/20" : "border-[#071f50]/8 hover:border-[#071f50]/20"
      )}
    >
      <div className="flex w-full items-start gap-3">
        {onSelect ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Tick ${person.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            onKeyDown={(event) => event.stopPropagation()}
            className={classNames(
              "mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition",
              selected ? "border-[#ff4b12] bg-[#ff4b12] text-white" : "border-[#071f50]/20 bg-white text-transparent hover:border-[#071f50]/45"
            )}
          >
            <Check size={15} strokeWidth={3.5} />
          </button>
        ) : null}
        <Avatar name={person.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[15.5px] font-black text-[#071f50]">{person.name}</span>
            <PriorityChip priority={person.priority} />
          </div>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-[#071f50]/60">
            {person.country || "Country not chosen"}
            {detail ? ` · ${detail}` : ""}
          </p>
        </div>
        {clock ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black" style={{ background: `${clock.color}1a`, color: clock.color }} title="Time since they reached out">
            <Hourglass size={11} />
            {clock.text}
          </span>
        ) : (
          <span className="shrink-0 text-[11.5px] font-bold text-[#071f50]/40">{timeAgo(person.lastActivityAt || person.createdAt)}</span>
        )}
      </div>

      {row.message && !/^Added by/.test(row.message) ? (
        <p className="mt-3 line-clamp-2 rounded-xl bg-[#fff7ed] px-3 py-2 text-[13px] leading-5 text-[#071f50]/75">“{row.message}”</p>
      ) : null}
      {person.stage === "consulting" && lastNote ? (
        <p className="mt-2 line-clamp-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#071f50]/55">
          <StickyNote size={12} className="shrink-0" /> {lastNote.note}
        </p>
      ) : null}

      <div className="mt-3 flex w-full items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Chip color={isAppointment ? "#0ea5e9" : "#64748b"} dot={false}>
            {isAppointment ? <CalendarDays size={11} /> : <MessageSquareText size={11} />}
            {isAppointment ? "Booked a call" : newest?.label || "Website"}
          </Chip>
          {person.stage === "closed" ? <StageChip stage={person.stage} /> : null}
        </div>
        <ContactButtons person={person} />
      </div>
    </div>
  );
}

function LeadDrawer({ person, onClose }) {
  const { setStage, assignPerson, updatePerson, addNote, insert, update, staff, admin, logEvent, isCounselor } = useAdminData();
  const confirm = useConfirm();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [reminder, setReminder] = useState({ title: "", due_date: "" });
  const [busy, setBusy] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const closeFile = useCloseFile();

  if (!person) return <Drawer open={false} onClose={onClose} />;

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      // toast shown by provider
    } finally {
      setBusy("");
    }
  };

  const makeStudent = () =>
    confirm({
      title: `Make ${person.name} a student?`,
      text: "They move to the Students page, where you manage applications, documents, visa and payments.",
      confirmLabel: "Yes, make a student",
    }).then((yes) => yes && run("student", () => setStage(person, "applying")));

  const closeLead = () => run("close", () => closeFile(person));

  const markContacted = () =>
    run("contacted", async () => {
      await setStage(person, "consulting");
      for (const source of person.sources) {
        if (source.type === "inquiry" && source.row.status === "new") await update("inquiries", source.id, { status: "contacted" });
      }
    });

  const saveNote = () =>
    run("note", async () => {
      await addNote(person, note);
      await logEvent(person, { actionType: "note_added", title: "Note added", description: note.slice(0, 140) });
      setNote("");
      toast.push("Note saved.");
    });

  const saveReminder = () =>
    run("reminder", async () => {
      if (!reminder.title.trim() || !reminder.due_date) return toast.push({ tone: "error", message: "Give the reminder a title and a date." });
      await insert("reminders", {
        student_id: String(person.primary.student_id),
        student_type: person.primary.student_type,
        title: reminder.title.trim(),
        due_date: reminder.due_date,
        status: "pending",
        created_by: admin.id,
        created_by_name: admin.name,
      });
      setReminder({ title: "", due_date: "" });
      toast.push("Reminder set.");
    });

  return (
    <Drawer
      open
      onClose={onClose}
      title={person.name}
      subtitle={[person.phone, person.email].filter(Boolean).join(" · ")}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to={path(`/people/${person.id}`)} className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#071f50] hover:underline">
            Open full file <ArrowUpRight size={15} />
          </Link>
          <div className="flex gap-2">
            {person.stage !== "closed" ? (
              <Button variant="danger" size="sm" busy={busy === "close"} onClick={closeLead}>
                Close
              </Button>
            ) : (
              <Button size="sm" busy={busy === "reopen"} onClick={() => run("reopen", () => setStage(person, "consulting"))}>
                Reopen
              </Button>
            )}
            {person.stage !== "closed" ? (
              <Button variant="primary" size="sm" icon={UserCheck} busy={busy === "student"} onClick={makeStudent}>
                Make a student
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StageChip stage={person.stage} size="md" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" icon={Sparkles} onClick={() => setComposeOpen(true)}>
              Send a message
            </Button>
            <ContactButtons person={person} />
          </div>
          {composeOpen ? <MessageComposer person={person} open onClose={() => setComposeOpen(false)} /> : null}
        </div>

        <DuplicateNotice person={person} onMerged={onClose} />

        {person.stage === "lead" ? (
          <Notice tone="warning">
            Nobody has replied yet. Message them, then press{" "}
            <button type="button" onClick={markContacted} className="underline">
              “We've spoken”
            </button>
            .
          </Notice>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {person.stage === "lead" ? (
            <Button variant="navy" icon={Sparkles} busy={busy === "contacted"} onClick={markContacted} className="col-span-2">
              We've spoken — move to “In conversation”
            </Button>
          ) : null}
          <Field label="Who looks after them">
            <Select disabled={isCounselor} value={person.assignedTo || ""} onChange={(event) => run("assign", () => assignPerson(person, event.target.value || null))}>
              <option value="">Nobody yet</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({humanize(member.role)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={person.priority} onChange={(event) => run("priority", () => updatePerson(person, { priority: event.target.value }))}>
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {person.sources.map((source) => (
          <Card key={source.key} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-black uppercase tracking-[0.14em] text-[#071f50]/50">
                {source.type === "appointment" ? "Booked a call" : "Sent a message"} · {fmtDateTime(source.createdAt)}
              </p>
              <Chip color="#64748b" dot={false}>
                {source.label}
              </Chip>
            </div>
            {source.row.message ? <p className="mt-2 text-[14px] leading-6 text-[#071f50]">“{source.row.message}”</p> : null}
            <KeyValue
              className="mt-3"
              items={
                source.type === "appointment"
                  ? [
                      { label: "When", value: `${fmtDate(source.row.appointment_date)} · ${source.row.appointment_time || ""}` },
                      { label: "Type", value: source.row.consultation_type },
                      { label: "Country", value: source.row.country_interest },
                      { label: "Status", value: humanize(source.row.status) },
                    ]
                  : [
                      { label: "Country", value: source.row.country },
                      { label: "Level", value: source.row.study_level },
                      { label: "Subject", value: source.row.field_of_interest },
                      { label: "Prefers", value: source.row.counseling_mode },
                      { label: "City", value: source.row.city },
                    ]
              }
            />
          </Card>
        ))}

        <Card className="p-4">
          <p className="flex items-center gap-2 text-[13px] font-black text-[#071f50]">
            <StickyNote size={15} /> Notes
          </p>
          <div className="mt-3 space-y-2">
            {person.notes.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl bg-[#fff7ed] px-3 py-2 text-[13px] leading-5 text-[#071f50]">
                {item.note}
                <span className="mt-0.5 block text-[11px] font-bold text-[#071f50]/40">{timeAgo(item.created_at)}</span>
              </div>
            ))}
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did they say? What's next?" rows={2} />
            <Button size="sm" variant="navy" busy={busy === "note"} disabled={!note.trim()} onClick={saveNote}>
              Save note
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-[13px] font-black text-[#071f50]">Remind me</p>
          {person.reminders.filter((r) => r.status !== "completed").map((item) => (
            <p key={item.id} className="mt-2 text-[13px] font-semibold text-[#071f50]/70">
              • {item.title} — {fmtDate(item.due_date)}
            </p>
          ))}
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Input value={reminder.title} onChange={(event) => setReminder({ ...reminder, title: event.target.value })} placeholder="Call back about budget" />
            <Input type="date" value={reminder.due_date} onChange={(event) => setReminder({ ...reminder, due_date: event.target.value })} />
            <Button size="md" busy={busy === "reminder"} onClick={saveReminder}>
              Set
            </Button>
          </div>
        </Card>
      </div>
    </Drawer>
  );
}
