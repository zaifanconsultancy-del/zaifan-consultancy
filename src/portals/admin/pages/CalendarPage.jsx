// Calendar: every dated thing in one place. Booked calls, visa appointments
// and biometrics, task due dates, payment due dates, offer and application
// deadlines. Month grid on the left, the chosen day's list on the right.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { classNames, fmtMoney, startOfDay, toDate } from "../lib/format";
import { path } from "../lib/paths";
import { isDone } from "../lib/people";
import { Avatar, Button, Card, Chip, Spinner } from "../ui/kit";

const KINDS = {
  call: { label: "Call", color: "#0ea5e9" },
  visa: { label: "Visa", color: "#ff4b12" },
  task: { label: "Task", color: "#8b5cf6" },
  payment: { label: "Payment due", color: "#ef4444" },
  deadline: { label: "Deadline", color: "#f59e0b" },
};

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Dates stored as "YYYY-MM-DD" must not shift with the time zone. */
function parseDay(value) {
  if (!value) return null;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return toDate(value);
}

function buildEvents(people, viewerId, mineOnly) {
  const events = [];
  const add = (kind, value, person, title, extra = {}) => {
    const date = parseDay(value);
    if (!date) return;
    events.push({ id: `${kind}-${events.length}`, kind, date, key: dayKey(date), person, title, ...extra });
  };
  for (const person of people) {
    if (person.stage === "closed") continue;
    for (const source of person.sources) {
      if (source.type !== "appointment") continue;
      const status = String(source.row.status || "pending").toLowerCase();
      if (status === "cancelled") continue;
      add("call", source.row.appointment_date, person, `Call · ${source.row.consultation_type || "consultation"}`, { time: source.row.appointment_time, note: status === "pending" ? "not confirmed yet" : status });
    }
    for (const visa of person.visas) {
      add("visa", visa.appointment_date, person, "Visa appointment", { time: visa.appointment_time, note: visa.visa_center || visa.embassy_or_consulate });
      add("visa", visa.biometrics_date, person, "Biometrics", { note: visa.visa_center });
      add("visa", visa.passport_collection_date, person, "Passport collection");
    }
    for (const task of person.tasks) {
      if (isDone(task.status)) continue;
      if (mineOnly && task.assigned_to !== viewerId) continue;
      add("task", task.due_date, person, task.title, { assignedTo: task.assigned_to });
    }
    for (const invoice of person.invoices) {
      const status = String(invoice.status || "").toLowerCase();
      if (["paid", "void", "cancelled", "draft"].includes(status)) continue;
      add("payment", invoice.due_date, person, `${invoice.title || "Invoice"} · ${fmtMoney(invoice.outstanding_amount > 0 ? invoice.outstanding_amount : invoice.total_amount, invoice.currency)}`);
    }
    for (const app of person.applications) {
      const uni = app.university || "University";
      if (!app.submitted_at) add("deadline", app.submission_deadline, person, `Apply by · ${uni}`);
      if (!/accepted|declined/i.test(String(app.offer_status || ""))) add("deadline", app.offer_acceptance_deadline, person, `Accept offer by · ${uni}`);
      if (app.deposit_required && !app.deposit_paid) add("deadline", app.deposit_deadline, person, `Deposit due · ${uni}`);
    }
  }
  return events.sort((a, b) => a.date - b.date || String(a.time || "").localeCompare(String(b.time || "")));
}

export default function CalendarPage() {
  const { people, loading, admin, staffById } = useAdminData();
  const today = startOfDay();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(dayKey(today));
  const [kinds, setKinds] = useState(() => new Set(Object.keys(KINDS)));
  const [mineOnly, setMineOnly] = useState(false);

  const events = useMemo(() => buildEvents(people, admin.id, mineOnly), [people, admin.id, mineOnly]);
  const shown = events.filter((event) => kinds.has(event.kind));
  const byDay = useMemo(() => {
    const map = new Map();
    for (const event of shown) {
      if (!map.has(event.key)) map.set(event.key, []);
      map.get(event.key).push(event);
    }
    return map;
  }, [shown]);

  if (loading) return <Spinner label="Loading calendar…" />;

  // Monday-first grid covering the whole month.
  const first = new Date(month);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const weeks = cells[35].getMonth() === month.getMonth() ? 6 : 5;

  const dayEvents = byDay.get(selected) || [];
  const upcoming = shown.filter((event) => event.date >= today).slice(0, 8);
  const selectedDate = parseDay(selected);

  const toggleKind = (kind) =>
    setKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next.size ? next : new Set(Object.keys(KINDS));
    });

  const go = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff4b12]">Calendar</p>
          <h1 className="mt-1 text-[1.65rem] font-black tracking-[-0.02em] text-[#071f50] sm:text-[2rem]">Everything with a date</h1>
          <p className="mt-1 text-[14.5px] text-[#071f50]/60">Calls, visa appointments, tasks, payments and deadlines. Click a day to see its list.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(KINDS).map(([id, meta]) => (
            <button
              key={id}
              type="button"
              onClick={() => toggleKind(id)}
              className={classNames("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-extrabold transition", kinds.has(id) ? "bg-white text-[#071f50] shadow-[0_1px_3px_rgba(7,31,80,0.12)]" : "text-[#071f50]/35")}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: meta.color, opacity: kinds.has(id) ? 1 : 0.35 }} />
              {meta.label}
            </button>
          ))}
          <button type="button" onClick={() => setMineOnly(!mineOnly)} className={classNames("ml-1 rounded-full px-3 py-1.5 text-[12.5px] font-extrabold transition", mineOnly ? "bg-[#071f50] text-white" : "bg-[#071f50]/[0.06] text-[#071f50]")}>
            Only my tasks
          </button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[18px] font-black text-[#071f50]">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
            <div className="flex items-center gap-1.5">
              <Button size="icon" onClick={() => go(-1)} aria-label="Previous month">
                <ChevronLeft size={16} />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelected(dayKey(today));
                }}
              >
                Today
              </Button>
              <Button size="icon" onClick={() => go(1)} aria-label="Next month">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-black uppercase tracking-[0.12em] text-[#071f50]/40">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.slice(0, weeks * 7).map((date) => {
              const key = dayKey(date);
              const list = byDay.get(key) || [];
              const inMonth = date.getMonth() === month.getMonth();
              const isToday = key === dayKey(today);
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={classNames(
                    "flex min-h-[74px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[96px]",
                    isSelected ? "border-[#ff4b12] bg-[#fff7ed]" : "border-[#071f50]/[0.06] hover:border-[#071f50]/20",
                    inMonth ? "" : "opacity-40"
                  )}
                >
                  <span className={classNames("flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-black", isToday ? "bg-[#ff4b12] text-white" : "text-[#071f50]")}>{date.getDate()}</span>
                  <span className="mt-1 hidden w-full space-y-0.5 sm:block">
                    {list.slice(0, 3).map((event) => (
                      <span key={event.id} className="block truncate rounded-md px-1 py-0.5 text-[10.5px] font-bold" style={{ background: `${KINDS[event.kind].color}1a`, color: KINDS[event.kind].color }}>
                        {event.person.name.split(" ")[0]} · {event.title}
                      </span>
                    ))}
                    {list.length > 3 ? <span className="block px-1 text-[10px] font-black text-[#071f50]/45">+{list.length - 3} more</span> : null}
                  </span>
                  <span className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                    {list.slice(0, 4).map((event) => (
                      <span key={event.id} className="h-1.5 w-1.5 rounded-full" style={{ background: KINDS[event.kind].color }} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[15px] font-black text-[#071f50]">{selectedDate?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2>
            <EventList events={dayEvents} staffById={staffById} empty="Nothing on this day." />
          </Card>
          <Card className="p-5">
            <h2 className="text-[15px] font-black text-[#071f50]">Coming up</h2>
            <EventList events={upcoming} staffById={staffById} showDate empty="Nothing dated from today on." />
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventList({ events, staffById, showDate = false, empty }) {
  if (!events.length) return <p className="mt-3 text-[13px] font-semibold text-[#071f50]/45">{empty}</p>;
  return (
    <ul className="mt-3 space-y-2">
      {events.map((event) => {
        const meta = KINDS[event.kind];
        const who = event.assignedTo ? staffById.get(event.assignedTo) : null;
        return (
          <li key={event.id}>
            <Link to={path(`/people/${event.person.id}`)} className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-[#071f50]/[0.03]">
              <span className="mt-1 h-8 w-1 shrink-0 rounded-full" style={{ background: meta.color }} />
              <Avatar name={event.person.name} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-black text-[#071f50]">{event.person.name}</span>
                <span className="block truncate text-[12.5px] font-semibold text-[#071f50]/60">{event.title}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] font-bold text-[#071f50]/45">
                  <Chip color={meta.color} dot={false}>
                    {meta.label}
                  </Chip>
                  {showDate ? event.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null}
                  {event.time ? <span>{String(event.time).slice(0, 8)}</span> : null}
                  {event.note ? <span>· {event.note}</span> : null}
                  {who ? <span>· {who.name.split(" ")[0]}</span> : null}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
