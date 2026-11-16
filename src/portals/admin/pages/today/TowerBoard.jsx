/* eslint-disable react-refresh/only-export-components */
// The top of the Today page: the navy "tower board" with the headline numbers,
// the priority queue, the pipeline and the weekly arrivals chart.

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

import { classNames, firstName, fmtMoney, greeting, mergeMoney, startOfDay, toDate } from "../../lib/format";
import { path } from "../../lib/paths";
import { Avatar, Card } from "../../ui/kit";

/* ------------------------------- numbers -------------------------------- */

function moneyByCurrency(rows, getAmount, getCurrency) {
  const totals = new Map();
  for (const row of rows) {
    const amount = Number(getAmount(row) || 0);
    if (!amount) continue;
    const currency = getCurrency(row) || "PKR";
    totals.set(currency, (totals.get(currency) || 0) + amount);
  }
  // Biggest first, PKR preferred when it exists.
  return Array.from(totals.entries()).sort((a, b) => (a[0] === "PKR" ? -1 : b[0] === "PKR" ? 1 : b[1] - a[1]));
}

function moneyLabel(totals) {
  if (!totals.length) return { main: "Rs 0", extra: "" };
  const [first, ...rest] = totals;
  return { main: fmtMoney(first[1], first[0]), extra: rest.map(([currency, amount]) => `+ ${fmtMoney(amount, currency)}`).join(" ") };
}

export function buildHeadline(people) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
  const created = people.map((person) => toDate(person.createdAt)).filter(Boolean);
  const newThisWeek = created.filter((date) => date >= weekAgo).length;
  const newLastWeek = created.filter((date) => date >= twoWeeksAgo && date < weekAgo).length;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const payments = people.flatMap((person) => person.payments).filter((payment) => {
    const when = toDate(payment.paid_at || payment.created_at);
    return when && when >= monthStart && !["cancelled", "void", "refunded", "failed"].includes(String(payment.status || "").toLowerCase());
  });
  const openInvoices = people.flatMap((person) => person.invoices).filter((invoice) => !["paid", "void", "cancelled", "draft"].includes(String(invoice.status || "").toLowerCase()));

  return {
    active: people.filter((person) => !["closed", "departed"].includes(person.stage)).length,
    students: people.filter((person) => ["applying", "offer", "visa"].includes(person.stage)).length,
    newThisWeek,
    newLastWeek,
    collected: moneyLabel(moneyByCurrency(payments, (row) => row.amount, (row) => row.currency)),
    outstanding: moneyLabel(mergeMoney(people.map((person) => person.money.due))),
    openInvoiceCount: openInvoices.length,
  };
}

/* --------------------------------- hero --------------------------------- */

export function TowerHero({ admin, isCounselor, headline, waiting }) {
  const now = new Date();
  const delta = headline.newThisWeek - headline.newLastWeek;

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_24px_60px_rgba(7,31,80,0.2)]">
      {/* faint radar rings */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[520px] w-[520px] rounded-full border border-white/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-20 h-[340px] w-[340px] rounded-full border border-white/[0.07]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-16 top-0 h-[170px] w-[170px] rounded-full border border-white/[0.08]" />

      <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:items-end">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a5c]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4b12] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff4b12]" />
            </span>
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-2 text-[1.9rem] font-black leading-tight tracking-[-0.02em] sm:text-[2.4rem]">
            {greeting()}, {firstName(admin.name)}.
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-6 text-white/65">
            {waiting
              ? `${waiting} thing${waiting === 1 ? "" : "s"} ${waiting === 1 ? "needs" : "need"} a human today. Start with the list just below.`
              : isCounselor && !headline.active
                ? "No students are assigned to you yet. When an admin picks you as someone's counselor, they appear here."
                : "Nothing is waiting on you. The board is clear."}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <BoardTile label={isCounselor ? "Your active people" : "Active people"} value={headline.active} hint={`${headline.students} are students`} to={path("/students")} />
          <BoardTile
            label="New in the last 7 days"
            value={headline.newThisWeek}
            hint={
              <span className="inline-flex items-center gap-1">
                {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : null}
                {delta === 0 ? "same as the 7 days before" : `${Math.abs(delta)} ${delta > 0 ? "more" : "fewer"} than the 7 days before`}
              </span>
            }
            to={path("/leads")}
          />
          <BoardTile label={`Collected in ${now.toLocaleDateString("en-GB", { month: "long" })}`} value={headline.collected.main} hint={headline.collected.extra || "confirmed payments"} small />
          <BoardTile label="Still to collect" value={headline.outstanding.main} hint={headline.outstanding.extra || `${headline.openInvoiceCount} open invoice${headline.openInvoiceCount === 1 ? "" : "s"}`} small accent />
        </dl>
      </div>
    </section>
  );
}

function BoardTile({ label, value, hint, to, small = false, accent = false }) {
  const body = (
    <>
      <dt className="text-[10.5px] font-black uppercase tracking-[0.16em] text-white/45">{label}</dt>
      <dd className={classNames("mt-2 font-black leading-none tracking-[-0.03em] tabular-nums", small ? "text-[1.35rem] sm:text-[1.5rem]" : "text-[2.2rem]", accent ? "text-[#ff8a5c]" : "text-white")}>{value}</dd>
      <dd className="mt-2 text-[12px] font-semibold leading-4 text-white/55">{hint}</dd>
    </>
  );
  const className = "block rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition";
  return to ? (
    <Link to={to} className={classNames(className, "hover:border-white/25 hover:bg-white/[0.1]")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* ----------------------------- needs you now ---------------------------- */

export function NeedsYou({ items, onOpen }) {
  const waiting = items.filter((item) => item.count > 0);

  return (
    <Card className="pb-3">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-[16px] font-black tracking-[-0.01em] text-[#071f50]">Needs you now</h2>
          <p className="text-[13px] text-[#071f50]/55">Most urgent first. Click a line to deal with it.</p>
        </div>
        {waiting.length ? <span className="rounded-full bg-[#ff4b12] px-3 py-1 text-[12px] font-black text-white">{waiting.reduce((sum, item) => sum + item.count, 0)} open</span> : null}
      </div>

      {waiting.length ? (
        <ul className="mt-3 grid gap-x-2 px-3 lg:grid-cols-2">
          {waiting.map((item) => (
            <li key={item.key}>
              <button type="button" onClick={() => onOpen(item)} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#071f50]/[0.035]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${item.color}1a`, color: item.color }}>
                  <item.Icon size={20} />
                </span>
                <span className="w-9 shrink-0 text-center text-[1.6rem] font-black leading-none tracking-[-0.03em] tabular-nums text-[#071f50]">{item.count}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-black text-[#071f50]">{item.title}</span>
                  <span className="block truncate text-[12.5px] font-semibold text-[#071f50]/50">{item.names || item.hint}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-[#071f50]/25 transition group-hover:translate-x-0.5 group-hover:text-[#ff4b12]" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mx-5 mt-4 mb-2 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-900">
          <CheckCircle2 size={20} className="shrink-0" />
          <p className="text-[14px] font-bold">All clear. No leads, receipts, documents or questions are waiting.</p>
        </div>
      )}
    </Card>
  );
}

/** "Malik, Affan +2" from a list of people (unique, in order). */
export function nameList(people, max = 2) {
  const names = [...new Set(people.filter(Boolean).map((person) => firstName(person.name)))];
  if (!names.length) return "";
  return names.slice(0, max).join(", ") + (names.length > max ? ` +${names.length - max}` : "");
}

/* -------------------------------- pipeline ------------------------------ */

export function Pipeline({ stages, people }) {
  const max = Math.max(1, ...stages.map((stage) => stage.count));
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-black tracking-[-0.01em] text-[#071f50]">The runway</h2>
          <p className="text-[13px] text-[#071f50]/55">
            {total} {total === 1 ? "person" : "people"} from first hello to take-off. Click a stage to open it.
          </p>
        </div>
        <Link to={path("/students")} className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#ff4b12] hover:underline">
          All students <ArrowUpRight size={14} />
        </Link>
      </div>

      <ol className="mt-4 space-y-1">
        {stages.map((stage) => {
          const here = people.filter((person) => person.stage === stage.id);
          return (
            <li key={stage.id}>
              <Link
                to={["lead", "consulting"].includes(stage.id) ? path(`/leads?filter=${stage.id}`) : path(`/students?filter=${stage.id}`)}
                title={stage.hint}
                className="group grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[#071f50]/[0.035] sm:grid-cols-[120px_minmax(0,1fr)_auto]"
              >
                <span className="flex items-center gap-2 truncate text-[13px] font-extrabold text-[#071f50]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stage.color }} />
                  <span className="sm:hidden">{stage.short}</span>
                  <span className="hidden truncate sm:inline">{stage.label}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="block h-3 w-full overflow-hidden rounded-full bg-[#071f50]/[0.05]">
                    <span className="block h-full rounded-r-full transition-all duration-500" style={{ width: `${stage.count ? Math.max(4, (stage.count / max) * 100) : 0}%`, background: stage.color }} />
                  </span>
                  <span className="w-6 shrink-0 text-right text-[15px] font-black tabular-nums text-[#071f50]">{stage.count}</span>
                </span>
                <span className="hidden w-[84px] justify-end -space-x-2 sm:flex">
                  {here.slice(0, 3).map((person) => (
                    <Avatar key={person.id} name={person.name} size={26} className="ring-2 ring-white" />
                  ))}
                  {here.length > 3 ? <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#071f50]/[0.08] text-[10px] font-black text-[#071f50] ring-2 ring-white">+{here.length - 3}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ------------------------------ weekly chart ---------------------------- */

const WEEKS = 8;

function buildWeeks(people) {
  const today = startOfDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weeks = [];
  for (let index = WEEKS - 1; index >= 0; index -= 1) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - index * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weeks.push({ start, end, count: 0 });
  }
  for (const person of people) {
    const created = toDate(person.createdAt);
    if (!created) continue;
    const week = weeks.find((item) => created >= item.start && created < item.end);
    if (week) week.count += 1;
  }
  return weeks;
}

export function WeeklyArrivals({ people }) {
  const weeks = buildWeeks(people);
  const max = Math.max(1, ...weeks.map((week) => week.count));
  const total = weeks.reduce((sum, week) => sum + week.count, 0);
  const [hover, setHover] = useState(null);
  const shown = hover ?? weeks.length - 1;
  const label = (week) => week.start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <Card className="flex flex-col p-5">
      <h2 className="text-[16px] font-black tracking-[-0.01em] text-[#071f50]">New people per week</h2>
      <p className="text-[13px] text-[#071f50]/55">
        {total} in the last {WEEKS} weeks, from the website and added by the team.
      </p>

      <p className="mt-4 text-[13px] font-semibold text-[#071f50]/60" aria-live="polite">
        <span className="text-[1.5rem] font-black leading-none tabular-nums text-[#071f50]">{weeks[shown].count}</span>{" "}
        {shown === weeks.length - 1 ? "so far this week" : `in the week of ${label(weeks[shown])}`}
      </p>

      <div className="mt-3 flex flex-1 items-end gap-[6px] border-b border-[#071f50]/15" style={{ minHeight: 120 }} onMouseLeave={() => setHover(null)}>
        {weeks.map((week, index) => (
          <button
            key={week.start.toISOString()}
            type="button"
            onMouseEnter={() => setHover(index)}
            onFocus={() => setHover(index)}
            onBlur={() => setHover(null)}
            aria-label={`Week of ${label(week)}: ${week.count} new ${week.count === 1 ? "person" : "people"}`}
            className="flex h-full min-w-0 flex-1 cursor-default items-end outline-none"
          >
            <span
              className="mx-auto block w-full max-w-[26px] rounded-t-[4px] transition-colors"
              style={{
                height: week.count ? `${Math.max(6, (week.count / max) * 100)}%` : 2,
                background: index === shown ? "#ff4b12" : week.count ? "#071f50" : "rgba(7,31,80,0.15)",
              }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[6px]">
        {weeks.map((week, index) => (
          <span key={week.start.toISOString()} className={classNames("min-w-0 flex-1 truncate text-center text-[10px] font-bold", index === shown ? "text-[#071f50]" : "text-[#071f50]/40")}>
            {index === 0 || index === weeks.length - 1 || index === shown ? label(week) : ""}
          </span>
        ))}
      </div>
    </Card>
  );
}
