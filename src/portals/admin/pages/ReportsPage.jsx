// Reports: one month at a time. How many people reached out and from where,
// how many became students, money collected, and what each worker did.
// Admin only.

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { classNames, fmtMoneyList, sourceLabel, sumByCurrency, toDate } from "../lib/format";
import { CLOSE_REASON_LABEL, isDone, STUDENT_STAGES } from "../lib/people";
import { Avatar, Button, Card, Spinner } from "../ui/kit";

const BAD_PAYMENT = ["cancelled", "void", "refunded", "failed", "pending"];

function monthRange(month) {
  return { start: new Date(month.getFullYear(), month.getMonth(), 1), end: new Date(month.getFullYear(), month.getMonth() + 1, 1) };
}

const inRange = (value, { start, end }) => {
  const date = toDate(value);
  return Boolean(date && date >= start && date < end);
};

function countBy(list, getKey) {
  const map = new Map();
  for (const item of list) {
    const key = getKey(item) || "Not given";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function monthStats(people, range) {
  const arrived = people.filter((person) => inRange(person.createdAt, range));
  const won = people.filter((person) => STUDENT_STAGES.includes(person.stage) && person.stageIsManual && inRange(person.identity?.stage_changed_at, range));
  const payments = people.flatMap((person) => person.payments).filter((payment) => !BAD_PAYMENT.includes(String(payment.status || "").toLowerCase()) && inRange(payment.paid_at || payment.created_at, range));
  const calls = people.flatMap((person) => person.sources).filter((source) => source.type === "appointment" && inRange(source.createdAt, range));
  return { arrived, won, payments, collected: sumByCurrency(payments, (row) => row.amount, (row) => row.currency), calls };
}

export default function ReportsPage() {
  const { people, staff, loading } = useAdminData();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const range = monthRange(month);
  const before = monthRange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  const stats = useMemo(() => monthStats(people, monthRange(month)), [people, month]);
  const prev = useMemo(() => monthStats(people, monthRange(new Date(month.getFullYear(), month.getMonth() - 1, 1))), [people, month]);

  const trend = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const m = new Date(month.getFullYear(), month.getMonth() - 5 + index, 1);
        const s = monthStats(people, monthRange(m));
        return { month: m, arrived: s.arrived.length, pkr: s.collected.find(([currency]) => currency === "PKR")?.[1] || 0 };
      }),
    [people, month]
  );

  if (loading) return <Spinner label="Loading reports…" />;

  const sources = countBy(stats.arrived, (person) => person.sources[person.sources.length - 1]?.label);
  const countries = countBy(stats.arrived, (person) => person.country);
  const closedWhy = countBy(people.filter((person) => person.closed && inRange(person.closed.at, range)), (person) => CLOSE_REASON_LABEL[person.closed.reason] || "No reason written down");
  const label = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const isCurrent = range.start <= new Date() && new Date() < range.end;

  const team = staff.map((member) => {
    const mine = people.filter((person) => person.assignedTo === member.id);
    const tasks = people.flatMap((person) => person.tasks).filter((task) => task.assigned_to === member.id);
    const myPayments = stats.payments.filter((payment) => mine.some((person) => person.payments.includes(payment)));
    return {
      member,
      active: mine.filter((person) => !["closed", "departed"].includes(person.stage)).length,
      students: mine.filter((person) => STUDENT_STAGES.includes(person.stage)).length,
      newThisMonth: mine.filter((person) => inRange(person.createdAt, range)).length,
      done: tasks.filter((task) => isDone(task.status) && inRange(task.completed_at, range)).length,
      late: tasks.filter((task) => !isDone(task.status) && task.due_date && toDate(task.due_date) < new Date()).length,
      collected: sumByCurrency(myPayments, (row) => row.amount, (row) => row.currency),
    };
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff4b12]">Reports</p>
          <h1 className="mt-1 text-[1.65rem] font-black tracking-[-0.02em] text-[#071f50] sm:text-[2rem]">{label}</h1>
          <p className="mt-1 text-[14.5px] text-[#071f50]/60">{isCurrent ? "This month so far, compared with last month." : "Compared with the month before."}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month">
            <ChevronLeft size={16} />
          </Button>
          <Button size="sm" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            This month
          </Button>
          <Button size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" disabled={isCurrent}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile label="New people" value={stats.arrived.length} before={prev.arrived.length} />
        <Tile label="Became students" value={stats.won.length} before={prev.won.length} hint="moved to Applying or later" />
        <Tile label="Calls booked" value={stats.calls.length} before={prev.calls.length} />
        <Tile label="Money collected" value={fmtMoneyList(stats.collected)} hint={`${stats.payments.length} payment${stats.payments.length === 1 ? "" : "s"} · last month ${fmtMoneyList(prev.collected)}`} small />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarCard title="Where new people came from" subtitle="The first form they used" rows={sources} empty={`Nobody new in ${label}.`} />
        <BarCard title="Countries they asked about" rows={countries} empty={`Nobody new in ${label}.`} />
      </div>

      <BarCard wide title="Why files were closed" subtitle={`People who did not go ahead in ${label}, by the reason the team picked.`} rows={closedWhy} empty={`No file was closed in ${label}.`} />

      <Card className="p-5">
        <h2 className="text-[15px] font-black text-[#071f50]">Last 6 months</h2>
        <p className="text-[13px] text-[#071f50]/55">New people (navy) and rupees collected (orange) per month.</p>
        <div className="mt-4 grid grid-cols-6 gap-3">
          {trend.map((item) => {
            const maxPeople = Math.max(1, ...trend.map((t) => t.arrived));
            const maxPkr = Math.max(1, ...trend.map((t) => t.pkr));
            const active = item.month.getMonth() === month.getMonth() && item.month.getFullYear() === month.getFullYear();
            return (
              <button key={item.month.toISOString()} type="button" onClick={() => setMonth(item.month)} className="flex flex-col items-center gap-1.5">
                <span className="flex h-32 w-full items-end justify-center gap-1.5 border-b border-[#071f50]/15">
                  <span className="w-1/3 max-w-[18px] rounded-t-[4px] bg-[#071f50]" style={{ height: item.arrived ? `${Math.max(6, (item.arrived / maxPeople) * 100)}%` : 2 }} title={`${item.arrived} new people`} />
                  <span className="w-1/3 max-w-[18px] rounded-t-[4px] bg-[#ff4b12]" style={{ height: item.pkr ? `${Math.max(6, (item.pkr / maxPkr) * 100)}%` : 2 }} title={`Rs ${item.pkr.toLocaleString()} collected`} />
                </span>
                <span className={classNames("text-[11px] font-black", active ? "text-[#ff4b12]" : "text-[#071f50]/50")}>{item.month.toLocaleDateString("en-GB", { month: "short" })}</span>
                <span className="text-[11px] font-bold text-[#071f50]/60">{item.arrived} · Rs {item.pkr >= 1000 ? `${Math.round(item.pkr / 1000)}k` : item.pkr}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="text-[15px] font-black text-[#071f50]">The team in {label}</h2>
          <p className="text-[13px] text-[#071f50]/55">Who looks after how many people, tasks finished this month, tasks late right now, and money from their students.</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-y border-[#071f50]/8 bg-[#071f50]/[0.025] text-[10.5px] font-black uppercase tracking-[0.14em] text-[#071f50]/45">
                <th className="px-5 py-2.5">Person</th>
                <th className="px-3 py-2.5 text-right">Active people</th>
                <th className="px-3 py-2.5 text-right">Students</th>
                <th className="px-3 py-2.5 text-right">New this month</th>
                <th className="px-3 py-2.5 text-right">Tasks done</th>
                <th className="px-3 py-2.5 text-right">Late now</th>
                <th className="px-5 py-2.5 text-right">Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#071f50]/[0.06]">
              {team.map((row) => (
                <tr key={row.member.id} className="text-[13.5px] font-bold text-[#071f50]">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar name={row.member.name} size={28} />
                      {row.member.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{row.active}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{row.students}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{row.newThisMonth}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{row.done}</td>
                  <td className={classNames("px-3 py-3 text-right tabular-nums", row.late ? "text-rose-600" : "")}>{row.late}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{fmtMoneyList(row.collected, "—")}</td>
                </tr>
              ))}
              <tr className="text-[13px] font-semibold text-[#071f50]/55">
                <td className="px-5 py-3">Nobody assigned</td>
                <td className="px-3 py-3 text-right tabular-nums">{people.filter((person) => !person.assignedTo && !["closed", "departed"].includes(person.stage)).length}</td>
                <td className="px-3 py-3 text-right tabular-nums">{people.filter((person) => !person.assignedTo && STUDENT_STAGES.includes(person.stage)).length}</td>
                <td className="px-3 py-3 text-right tabular-nums">{stats.arrived.filter((person) => !person.assignedTo).length}</td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-[12px] font-semibold text-[#071f50]/40">
        Comparing {label} with {before.start.toLocaleDateString("en-GB", { month: "long" })}. "Became students" counts people moved to Applying or later in that month.
      </p>
    </div>
  );
}

function Tile({ label, value, before, hint, small = false }) {
  const delta = typeof value === "number" && typeof before === "number" ? value - before : null;
  return (
    <Card className="p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#071f50]/45">{label}</p>
      <p className={classNames("mt-2 font-black leading-none tracking-[-0.03em] text-[#071f50] tabular-nums", small ? "text-[1.35rem]" : "text-[2.1rem]")}>{value}</p>
      <p className="mt-2 text-[12px] font-semibold text-[#071f50]/50">
        {hint || (delta === null ? "" : delta === 0 ? "same as last month" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} vs last month`)}
      </p>
    </Card>
  );
}

function BarCard({ title, subtitle, rows, empty, wide = false }) {
  const max = Math.max(1, ...rows.map(([, count]) => count));
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-black text-[#071f50]">{title}</h2>
      {subtitle ? <p className="text-[13px] text-[#071f50]/55">{subtitle}</p> : null}
      {rows.length ? (
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 8).map(([name, count]) => (
            <li key={name} className={classNames("grid items-center gap-3", wide ? "grid-cols-[minmax(0,150px)_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto]")}>
              <span className="truncate text-[13px] font-bold text-[#071f50]">{sourceLabel(name, name)}</span>
              <span className="block h-3 overflow-hidden rounded-full bg-[#071f50]/[0.05]">
                <span className="block h-full rounded-r-full bg-[#071f50]" style={{ width: `${Math.max(4, (count / max) * 100)}%` }} />
              </span>
              <span className="w-6 text-right text-[14px] font-black tabular-nums text-[#071f50]">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] font-semibold text-[#071f50]/45">{empty}</p>
      )}
    </Card>
  );
}
