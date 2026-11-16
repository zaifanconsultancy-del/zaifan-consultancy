// Today: what needs you right now, the pipeline runway, today's calls, recent history.

import { useMemo } from "react";
import { path } from "../lib/paths";
import { Link, useNavigate } from "react-router-dom";
import {
  BellRing,
  CalendarDays,
  CheckSquare,
  FileCheck2,
  History,
  Inbox,
  MessageSquareWarning,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { daysUntil, dueLabel, firstName, fmtDate, fmtMoney, timeAgo, toDate } from "../lib/format";
import { isDone, JOURNEY_STAGES } from "../lib/people";
import { Avatar, Card, CardHeader, Chip, EmptyState, Spinner } from "../ui/kit";
import { ContactButtons, PersonLine } from "../ui/person";
import { buildHeadline, nameList, NeedsYou, Pipeline, TowerHero, WeeklyArrivals } from "./today/TowerBoard";

export default function TodayPage() {
  const { admin, isCounselor, people, data, loading } = useAdminData();
  const navigate = useNavigate();

  const view = useMemo(() => {
    const newLeads = people.filter((person) => person.stage === "lead");
    const stale = people.filter(
      (person) => person.stage === "consulting" && person.lastActivityAt && daysUntil(person.lastActivityAt) <= -5
    );

    const appointments = data.appointments
      .map((row) => ({
        row,
        when: toDate(`${row.appointment_date}T00:00:00`),
        person: people.find((p) => p.sources.some((s) => s.type === "appointment" && s.id === row.id)),
      }))
      .filter((item) => !isCounselor || item.person)
      .filter((item) => item.when && daysUntil(item.when) >= 0 && daysUntil(item.when) <= 7 && !["cancelled", "completed"].includes(String(item.row.status || "")))
      .sort((a, b) => a.when - b.when);

    const tasks = [];
    for (const person of people) {
      for (const task of person.tasks) {
        if (isDone(task.status)) continue;
        const days = task.due_date ? daysUntil(task.due_date) : null;
        if (days === null || days <= 1) tasks.push({ task, person, days });
      }
      for (const reminder of person.reminders) {
        if (isDone(reminder.status)) continue;
        const days = reminder.due_date ? daysUntil(reminder.due_date) : null;
        if (days === null || days <= 1) tasks.push({ task: { ...reminder, isReminder: true }, person, days });
      }
    }
    tasks.sort((a, b) => (a.days ?? 99) - (b.days ?? 99));

    const receipts = people.flatMap((person) =>
      person.receipts
        .filter((receipt) => String(receipt.review_status || receipt.status || "").includes("pending"))
        .map((receipt) => ({ receipt, person }))
    );
    const documents = people.flatMap((person) =>
      person.documents
        .filter((doc) => ["pending", "pending_review", "submitted", "uploaded"].includes(String(doc.status || "").toLowerCase()))
        .map((doc) => ({ doc, person }))
    );
    const support = people.flatMap((person) =>
      person.supportRequests
        .filter((request) => !["resolved", "closed"].includes(String(request.status || "").toLowerCase()))
        .map((request) => ({ request, person }))
    );
    const overdueInvoices = people.flatMap((person) =>
      person.invoices
        .filter((invoice) => !["paid", "void", "cancelled"].includes(String(invoice.status || "")) && invoice.due_date && daysUntil(invoice.due_date) < 0)
        .map((invoice) => ({ invoice, person }))
    );

    const stageCounts = JOURNEY_STAGES.map((stage) => ({
      ...stage,
      count: people.filter((person) => person.stage === stage.id).length,
    }));

    const history = data.timeline
      .map((event) => ({
        event,
        person: people.find((p) => p.sources.some((s) => s.type === event.student_type && String(s.id) === String(event.student_id))),
      }))
      .filter((item) => !isCounselor || item.person)
      .slice(0, 12);

    const headline = buildHeadline(people);

    return { headline, newLeads, stale, appointments, tasks, receipts, documents, support, overdueInvoices, stageCounts, history };
  }, [data.appointments, data.timeline, isCounselor, people]);

  if (loading) return <Spinner label="Loading today…" />;

  const todayCalls = view.appointments.filter((item) => daysUntil(item.when) === 0);
  const attention = [
    { key: "leads", Icon: Inbox, color: "#ff4b12", count: view.newLeads.length, title: "New leads nobody has replied to", names: nameList(view.newLeads), to: path("/leads?filter=lead") },
    { key: "appointments", Icon: CalendarDays, color: "#0ea5e9", count: todayCalls.length, title: "Calls booked for today", names: todayCalls.map((item) => firstName(item.row.full_name)).slice(0, 3).join(", "), to: "#calls" },
    { key: "invoices", Icon: Wallet, color: "#ef4444", count: view.overdueInvoices.length, title: "Invoices past their due date", names: nameList(view.overdueInvoices.map((item) => item.person)), to: "#invoices" },
    { key: "receipts", Icon: Receipt, color: "#f59e0b", count: view.receipts.length, title: "Payment receipts to check", names: nameList(view.receipts.map((item) => item.person)), to: "#receipts" },
    { key: "support", Icon: MessageSquareWarning, color: "#ec4899", count: view.support.length, title: "Student questions waiting", names: nameList(view.support.map((item) => item.person)), to: "#support" },
    { key: "documents", Icon: FileCheck2, color: "#10b981", count: view.documents.length, title: "Documents to review", names: nameList(view.documents.map((item) => item.person)), to: "#documents" },
    { key: "tasks", Icon: CheckSquare, color: "#8b5cf6", count: view.tasks.length, title: "Tasks due today or overdue", names: nameList(view.tasks.map((item) => item.person)), to: "#tasks" },
    { key: "stale", Icon: BellRing, color: "#64748b", count: view.stale.length, title: "Conversations gone quiet (5+ days)", names: nameList(view.stale), to: path("/leads?filter=consulting") },
  ];
  const waiting = attention.reduce((sum, item) => sum + item.count, 0);
  const openItem = (item) => (item.to.startsWith("#") ? document.getElementById(item.to.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }) : navigate(item.to));

  return (
    <div className="space-y-5">
      <TowerHero admin={admin} isCounselor={isCounselor} headline={view.headline} waiting={waiting} />

      <NeedsYou items={attention} onOpen={openItem} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Pipeline stages={view.stageCounts} people={people} />
        <WeeklyArrivals people={people} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Calls */}
        <Card id="calls" className="scroll-mt-24 pb-2">
          <CardHeader icon={CalendarDays} title="Calls booked this week" subtitle="From the website booking form." />
          <div className="mt-3 px-2">
            {view.appointments.length ? (
              view.appointments.map(({ row, when, person }) => (
                <div key={row.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-[#071f50]/[0.025]">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-[#071f50] py-1.5 text-white">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/60">{daysUntil(when) === 0 ? "Today" : daysUntil(when) === 1 ? "Tmrw" : when.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                    <span className="text-[15px] font-black leading-tight">{when.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={person ? path(`/people/${person.id}`) : "#"} className="truncate text-[14px] font-black text-[#071f50] hover:underline">
                      {row.full_name}
                    </Link>
                    <p className="truncate text-[12.5px] font-semibold text-[#071f50]/55">
                      {row.appointment_time} · {row.country_interest || "Country not chosen"} · {row.consultation_type || "Consultation"}
                    </p>
                  </div>
                  {person ? <ContactButtons person={person} /> : null}
                </div>
              ))
            ) : (
              <EmptyState compact icon={CalendarDays} title="No calls in the next 7 days" text="New bookings from the website appear here." />
            )}
          </div>
        </Card>

        {/* Tasks */}
        <Card id="tasks" className="scroll-mt-24 pb-2">
          <CardHeader icon={CheckSquare} title="Due today or overdue" subtitle="Tasks and reminders across all students." />
          <div className="mt-3 px-2">
            {view.tasks.length ? (
              view.tasks.slice(0, 8).map(({ task, person, days }) => (
                <Link key={task.id} to={path(`/people/${person.id}?tab=tasks`)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-[#071f50]/[0.025]">
                  <Avatar name={person.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-black text-[#071f50]">{task.title}</p>
                    <p className="truncate text-[12.5px] font-semibold text-[#071f50]/55">{person.name}{task.isReminder ? " · reminder" : ""}</p>
                  </div>
                  <Chip color={days !== null && days < 0 ? "#ef4444" : days === 0 ? "#f59e0b" : "#64748b"} dot={false}>
                    {task.due_date ? dueLabel(task.due_date) : "no date"}
                  </Chip>
                </Link>
              ))
            ) : (
              <EmptyState compact icon={Sparkles} title="Nothing due" text="Add tasks from any student's file." />
            )}
          </div>
        </Card>

        {/* Receipts + documents + support + invoices */}
        <Card id="receipts" className="scroll-mt-24 pb-2">
          <CardHeader icon={Receipt} title="Money to check" subtitle="Receipts students uploaded, and invoices past their date." />
          <div className="mt-3 px-2">
            {view.receipts.map(({ receipt, person }) => (
              <PersonLine
                key={receipt.id}
                person={person}
                to={path(`/people/${person.id}?tab=payments`)}
                showStage={false}
                subtitle={`Sent a receipt for ${fmtMoney(receipt.amount, receipt.currency)} · ${timeAgo(receipt.submitted_at || receipt.created_at)}`}
                right={<Chip color="#f59e0b">Check receipt</Chip>}
              />
            ))}
            <div id="invoices" className="scroll-mt-24" />
            {view.overdueInvoices.map(({ invoice, person }) => (
              <PersonLine
                key={invoice.id}
                person={person}
                to={path(`/people/${person.id}?tab=payments`)}
                showStage={false}
                subtitle={`${invoice.title || invoice.invoice_number} · ${fmtMoney(invoice.outstanding_amount || invoice.total_amount, invoice.currency)} · due ${fmtDate(invoice.due_date)}`}
                right={<Chip color="#ef4444">Overdue</Chip>}
              />
            ))}
            {!view.receipts.length && !view.overdueInvoices.length ? (
              <EmptyState compact icon={Wallet} title="All money matters are up to date" />
            ) : null}
          </div>
        </Card>

        <Card id="documents" className="scroll-mt-24 pb-2">
          <CardHeader icon={FileCheck2} title="Documents and questions" subtitle="Files waiting for a verdict, and students who asked something." />
          <div className="mt-3 px-2">
            {view.documents.map(({ doc, person }) => (
              <PersonLine
                key={doc.id}
                person={person}
                to={path(`/people/${person.id}?tab=documents`)}
                showStage={false}
                subtitle={`${doc.document_name} · uploaded ${timeAgo(doc.created_at)}`}
                right={<Chip color="#10b981">Review</Chip>}
              />
            ))}
            <div id="support" className="scroll-mt-24" />
            {view.support.map(({ request, person }) => (
              <PersonLine
                key={request.id}
                person={person}
                to={path(`/people/${person.id}?tab=messages`)}
                showStage={false}
                subtitle={`${request.subject || request.request_type || "Question"} · ${timeAgo(request.created_at)}`}
                right={<Chip color="#ec4899">Reply</Chip>}
              />
            ))}
            {!view.documents.length && !view.support.length ? <EmptyState compact icon={FileCheck2} title="Nothing waiting for review" /> : null}
          </div>
        </Card>
      </div>

      {/* History */}
      <Card className="pb-3">
        <CardHeader icon={History} title="What happened recently" subtitle="Every change the team makes is written down here." />
        <ol className="mt-3 px-5">
          {view.history.length ? (
            view.history.map(({ event, person }) => (
              <li key={event.id} className="flex gap-3 border-l-2 border-[#071f50]/8 py-2 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[#071f50]">
                    {person ? (
                      <Link to={path(`/people/${person.id}`)} className="font-black hover:underline">
                        {person.name}
                      </Link>
                    ) : (
                      "Someone"
                    )}{" "}
                    <span className="font-semibold text-[#071f50]/70">· {event.title}</span>
                  </p>
                  {event.description ? <p className="text-[12.5px] text-[#071f50]/50">{event.description}</p> : null}
                </div>
                <span className="shrink-0 text-[11.5px] font-bold text-[#071f50]/40">
                  {timeAgo(event.created_at)} · {event.created_by_name || "system"}
                </span>
              </li>
            ))
          ) : (
            <EmptyState compact icon={History} title="No history yet" />
          )}
        </ol>
      </Card>

    </div>
  );
}
