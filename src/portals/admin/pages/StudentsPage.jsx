// Students: everyone who decided to go ahead. A navy "departures board" on
// top (one column per stage, click to filter), then one dense strip per
// student: where they are going, how far along, document progress, money
// owed and the very next thing to do.

import { useMemo, useState } from "react";
import { path } from "../lib/paths";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowUpDown, Download, GraduationCap, Plane, Search } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { downloadPeopleList } from "../lib/exportList";
import { classNames, dueLabel, daysUntil, fmtMoneyList, mergeMoney, sortBy, timeAgo } from "../lib/format";
import { personMatches, STAGE_BY_ID, STUDENT_STAGES } from "../lib/people";
import { Avatar, Button, Card, EmptyState, Input, Segmented, Select, Spinner, useToast } from "../ui/kit";
import { ContactButtons, PriorityChip, StageRunway } from "../ui/person";

const DONE_DOCS = ["verified", "approved"];

function needsAttention(person) {
  return Boolean(person.counts.overdueTasks || person.counts.overdueInvoices || person.counts.receiptsToReview || person.counts.pendingDocs || person.counts.openSupport);
}

const SORTS = {
  activity: { label: "Recently active", get: (p) => p.lastActivityAt, dir: "desc" },
  attention: {
    label: "Needs attention",
    get: (p) => p.counts.overdueTasks * 100 + p.counts.overdueInvoices * 50 + p.counts.receiptsToReview * 10 + p.counts.openSupport * 10 + p.counts.pendingDocs,
    dir: "desc",
  },
  due: { label: "Money due", get: (p) => p.counts.outstanding, dir: "desc" },
  name: { label: "Name A–Z", get: (p) => p.name.toLowerCase(), dir: "asc" },
};

export default function StudentsPage() {
  const { people, staff, staffById, loading, isCounselor } = useAdminData();
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") || "active";
  const [query, setQuery] = useState("");
  const [counselor, setCounselor] = useState("");
  const [sort, setSort] = useState("activity");
  const toast = useToast();

  const students = useMemo(() => people.filter((person) => STUDENT_STAGES.includes(person.stage)), [people]);

  const visible = useMemo(() => {
    let list = students;
    if (filter === "attention") list = list.filter(needsAttention);
    else if (filter !== "active") list = list.filter((person) => person.stage === filter);
    if (counselor) list = list.filter((person) => (counselor === "none" ? !person.assignedTo : person.assignedTo === counselor));
    list = list.filter((person) => personMatches(person, query));
    return sortBy(list, SORTS[sort].get, SORTS[sort].dir);
  }, [counselor, filter, query, sort, students]);

  if (loading) return <Spinner label="Loading students…" />;

  const setFilter = (value) => setParams(value === "active" ? {} : { filter: value });

  return (
    <div className="space-y-5">
      <DeparturesBoard students={students} filter={filter} onFilter={setFilter} isCounselor={isCounselor} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { id: "active", label: "All", count: students.length },
            ...STUDENT_STAGES.map((id) => ({
              id,
              label: STAGE_BY_ID[id].short,
              color: STAGE_BY_ID[id].color,
              count: students.filter((person) => person.stage === id).length,
            })),
            { id: "attention", label: "Needs attention", color: "#ef4444", count: students.filter(needsAttention).length },
          ]}
        />
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#071f50]/35" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, university, country" className="pl-10 sm:w-64" />
          </label>
          {staff.length > 1 && !isCounselor ? (
            <Select value={counselor} onChange={(event) => setCounselor(event.target.value)} className="sm:w-44" aria-label="Counselor">
              <option value="">Any counselor</option>
              <option value="none">Nobody assigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          ) : null}
          <label className="relative block">
            <ArrowUpDown size={14} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#071f50]/40" />
            <Select value={sort} onChange={(event) => setSort(event.target.value)} className="pl-9 sm:w-48" aria-label="Sort">
              {Object.entries(SORTS).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>
          {!isCounselor ? (
            <Button
              icon={Download}
              disabled={!visible.length}
              title="Save the students shown below as a file that opens in Excel"
              onClick={() => {
                const count = downloadPeopleList(visible, { staffById, name: "students" });
                toast.push(`Saved ${count} student${count === 1 ? "" : "s"} to your Downloads folder. Open the file with Excel.`);
              }}
            >
              Download list
            </Button>
          ) : null}
        </div>
      </div>

      {visible.length ? (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1fr)_auto] gap-4 border-b border-[#071f50]/8 bg-[#071f50]/[0.025] px-5 py-2.5 text-[10.5px] font-black uppercase tracking-[0.16em] text-[#071f50]/45 xl:grid">
            <span>Student · going to</span>
            <span>Journey</span>
            <span>Documents</span>
            <span>Next step</span>
            <span className="w-[120px] text-right">Contact</span>
          </div>
          <ul className="divide-y divide-[#071f50]/[0.07]">
            {visible.map((person) => (
              <li key={person.id}>
                <StudentStrip person={person} counselor={person.assignedTo ? staffById.get(person.assignedTo) : null} />
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title={students.length ? "No students match" : "No students yet"}
            text={students.length ? "Try another stage or clear the search." : "Open a lead and press “Make a student” when they decide to go ahead."}
            action={
              !students.length ? (
                <Link to={path("/leads")} className="text-[13px] font-extrabold text-[#ff4b12] hover:underline">
                  Go to leads →
                </Link>
              ) : null
            }
          />
        </Card>
      )}
    </div>
  );
}

/* ------------------------------ departures board ----------------------------- */

function DeparturesBoard({ students, filter, onFilter, isCounselor }) {
  const attention = students.filter(needsAttention);
  const owed = mergeMoney(students.map((person) => person.money.due));
  const unassigned = students.filter((person) => !person.assignedTo).length;

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_24px_60px_rgba(7,31,80,0.2)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[460px] w-[460px] rounded-full border border-white/[0.06]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-16 h-[260px] w-[260px] rounded-full border border-white/[0.07]" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a5c]">Students · departures</p>
            <h1 className="mt-2 text-[1.9rem] font-black leading-tight tracking-[-0.02em] sm:text-[2.3rem]">{isCounselor ? "Your students" : "Everyone on the journey"}</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/65">
              {students.length
                ? `${students.length} student${students.length === 1 ? "" : "s"} between “applying” and “flown”. Click a column to see only that stage.`
                : "Nobody has become a student yet. They appear here once a lead says yes."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFilter(filter === "attention" ? "active" : "attention")}
              className={classNames(
                "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-left transition",
                filter === "attention" ? "border-[#ff8a5c] bg-[#ff4b12]/20" : "border-white/10 bg-white/[0.06] hover:border-white/25"
              )}
            >
              <AlertTriangle size={17} className={attention.length ? "text-[#ff8a5c]" : "text-white/40"} />
              <span>
                <span className="block text-[18px] font-black leading-none tabular-nums">{attention.length}</span>
                <span className="block text-[11px] font-bold text-white/55">need attention</span>
              </span>
            </button>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5">
              <span className="block text-[18px] font-black leading-none tabular-nums text-[#ff8a5c]">{fmtMoneyList(owed)}</span>
              <span className="block text-[11px] font-bold text-white/55">still owed by students</span>
            </div>
            {!isCounselor && unassigned ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5">
                <span className="block text-[18px] font-black leading-none tabular-nums">{unassigned}</span>
                <span className="block text-[11px] font-bold text-white/55">without a counselor</span>
              </div>
            ) : null}
          </div>
        </div>

        <ol className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {STUDENT_STAGES.map((id, index) => {
            const meta = STAGE_BY_ID[id];
            const here = students.filter((person) => person.stage === id);
            const active = filter === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onFilter(active ? "active" : id)}
                  aria-pressed={active}
                  className={classNames(
                    "group relative flex h-full w-full flex-col rounded-2xl border p-4 text-left transition",
                    active ? "border-white/60 bg-white/[0.14]" : "border-white/10 bg-white/[0.05] hover:border-white/25 hover:bg-white/[0.09]"
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-white/40">GATE {index + 1}</span>
                    {id === "departed" ? <Plane size={15} className="text-white/40" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />}
                  </span>
                  <span className="mt-2 text-[14px] font-black">{meta.label}</span>
                  <span className="mt-1 text-[2.2rem] font-black leading-none tracking-[-0.03em] tabular-nums">{here.length}</span>
                  <span className="mt-3 flex flex-wrap gap-1">
                    {here.slice(0, 5).map((person) => (
                      <Avatar key={person.id} name={person.name} size={26} className="ring-2 ring-[#071f50]" />
                    ))}
                    {here.length > 5 ? <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/15 text-[10px] font-black ring-2 ring-[#071f50]">+{here.length - 5}</span> : null}
                  </span>
                  <span className="absolute inset-x-4 bottom-0 h-[3px] rounded-t-full" style={{ background: meta.color, opacity: active ? 1 : 0.5 }} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------- one row --------------------------------- */

function DocMeter({ documents }) {
  const total = documents.length;
  const done = documents.filter((doc) => DONE_DOCS.includes(String(doc.status || "").toLowerCase())).length;
  const toReview = total - done;
  if (!total) return <span className="text-[12.5px] font-semibold text-[#071f50]/40">None uploaded</span>;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[12.5px] font-bold text-[#071f50]">
        <span>
          <span className="font-black tabular-nums">{done}</span>
          <span className="text-[#071f50]/45">/{total} checked</span>
        </span>
        {toReview ? <span className="text-[11.5px] font-black text-[#8b5cf6]">{toReview} to review</span> : null}
      </div>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#071f50]/[0.07]">
        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${(done / total) * 100}%` }} />
      </span>
    </div>
  );
}

function NextStep({ person }) {
  const task = person.nextAction;
  const lines = [];
  if (task) {
    const days = task.due_date ? daysUntil(task.due_date) : null;
    lines.push({ text: task.title, sub: task.due_date ? dueLabel(task.due_date) : "no date", color: days !== null && days < 0 ? "#ef4444" : days === 0 ? "#f59e0b" : "#071f50" });
  }
  if (person.counts.overdueInvoices) lines.push({ text: `Chase overdue payment (${fmtMoneyList(person.money.due)})`, sub: `${person.counts.overdueInvoices} invoice${person.counts.overdueInvoices === 1 ? "" : "s"} past due date`, color: "#ef4444" });
  if (person.counts.receiptsToReview) lines.push({ text: `Check ${person.counts.receiptsToReview} payment receipt${person.counts.receiptsToReview === 1 ? "" : "s"}`, color: "#f59e0b" });
  if (person.counts.openSupport) lines.push({ text: `Answer ${person.counts.openSupport} question${person.counts.openSupport === 1 ? "" : "s"}`, color: "#0ea5e9" });
  if (!lines.length) return <span className="text-[12.5px] font-semibold text-[#071f50]/40">Nothing waiting</span>;
  const [first, ...rest] = lines;
  return (
    <div className="min-w-0">
      <p className="truncate text-[13px] font-extrabold" style={{ color: first.color }}>
        {first.text}
      </p>
      <p className="truncate text-[11.5px] font-semibold text-[#071f50]/45">
        {[first.sub, rest.length ? `+${rest.length} more` : ""].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}

function StudentStrip({ person, counselor }) {
  const application = person.applications[0];
  const target = application ? [application.university || "University TBC", application.program].filter(Boolean).join(" · ") : "No application yet";
  const meta = STAGE_BY_ID[person.stage];
  const navigate = useNavigate();
  const go = () => navigate(path(`/people/${person.id}`));

  // A div, not a <Link>: the WhatsApp/call/email buttons inside are links too.
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(event) => {
        if (event.key === "Enter") go();
      }}
      className="group relative grid cursor-pointer outline-none focus-visible:bg-[#071f50]/[0.04] gap-3 px-5 py-4 transition hover:bg-[#071f50]/[0.025] sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1fr)_auto] xl:items-center xl:gap-4"
    >
      <span className="absolute inset-y-3 left-0 w-[4px] rounded-r-full" style={{ background: meta.color }} />
      <div className="flex min-w-0 items-center gap-3 sm:col-span-2 xl:col-span-1">
        <Avatar name={person.name} size={42} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[15px] font-black text-[#071f50] group-hover:underline">{person.name}</span>
            <PriorityChip priority={person.priority} />
          </div>
          <p className="truncate text-[12.5px] font-semibold text-[#071f50]/60">
            <span className="font-extrabold text-[#071f50]/80">{person.country || "Country TBC"}</span> · {target}
          </p>
          <p className="truncate text-[11.5px] font-semibold text-[#071f50]/40">
            {counselor ? `With ${counselor.name}` : "No counselor"}
            {person.applications.length > 1 ? ` · ${person.applications.length} applications` : ""}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <StageRunway stage={person.stage} compact />
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#071f50]/45">
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span className="truncate normal-case tracking-normal">{person.lastActivityAt ? `active ${timeAgo(person.lastActivityAt)}` : ""}</span>
        </div>
      </div>

      <div className="min-w-0">
        <DocMeter documents={person.documents} />
        {person.counts.outstanding > 0 ? <p className="mt-1 text-[11.5px] font-black text-[#ff4b12]">{fmtMoneyList(person.money.due)} due</p> : null}
      </div>

      <NextStep person={person} />

      <div className="flex justify-start xl:w-[120px] xl:justify-end">
        <ContactButtons person={person} />
      </div>
    </div>
  );
}
