// The top of one person's file, drawn as a boarding pass: navy pass with
// who they are and how to reach them, a cream stub with where they are going
// (country, university, intake, visa date), then a white strip with the
// journey runway, counselor, priority and the very next thing to do.

import { useState } from "react";
import { CalendarClock, Pencil, Plane, Printer, Sparkles } from "lucide-react";

import { classNames, daysUntil, dueLabel, fmtDate, humanize, toDate } from "../../lib/format";
import { CLOSE_REASON_LABEL, isDone, PRIORITIES, STAGE_BY_ID } from "../../lib/people";
import { Avatar, Button, Field, Select } from "../../ui/kit";
import { ContactButtons, FlagList, PriorityChip, StageRunway } from "../../ui/person";
import MessageComposer from "../../ui/MessageComposer";
import { FilePaper, usePaper } from "../../../shared/papers";

function daysOnFile(createdAt) {
  const created = toDate(createdAt);
  if (!created) return null;
  return Math.max(0, -daysUntil(created));
}

export default function PassHeader({ person, staff, isCounselor, onEdit, onStage, onAssign, onPriority }) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [paper, print] = usePaper();
  const stage = STAGE_BY_ID[person.stage];
  const application = person.applications.find((app) => /offer|accepted|enrolled/i.test(`${app.offer_status} ${app.application_status}`)) || person.applications[0];
  const visa = person.visas[0];
  const from = person.sources.map((source) => source.row.city).find(Boolean) || "Pakistan";
  const onFile = daysOnFile(person.createdAt);
  const task = person.nextAction;
  const taskDays = task?.due_date ? daysUntil(task.due_date) : null;

  const fileNumber = `ZC-${String(person.id).replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const printFile = () => {
    const low = (value) => String(value || "").trim().toLowerCase();
    const have = new Set(person.documents.map((doc) => low(doc.document_name)));
    print(
      <FilePaper
        student={{ name: person.name, phone: person.phone, email: person.email, destination: person.country, city: person.sources.map((source) => source.row.city).find(Boolean) }}
        stage={stage?.label}
        counselor={staff.find((member) => member.id === person.assignedTo)?.name}
        fileNumber={fileNumber}
        applications={person.applications.map((app) => ({
          id: app.id,
          university: app.university || app.source_university_name,
          program: app.program,
          intake: app.intake,
          status: humanize(/offer|accept/i.test(String(app.offer_status || "")) ? app.offer_status : app.application_status),
        }))}
        documents={person.documents.map((doc) => ({ id: doc.id, name: doc.document_name, status: doc.status }))}
        missing={person.requirements.filter((item) => item.required !== false && !["waived", "not_required"].includes(low(item.status)) && !have.has(low(item.document_name))).map((item) => item.document_name)}
        visa={
          visa
            ? {
                status: humanize(visa.visa_status || visa.status || "In progress"),
                appointment: visa.appointment_date ? `${fmtDate(visa.appointment_date, { withYear: true })}${visa.appointment_time ? ` · ${String(visa.appointment_time).slice(0, 5)}` : ""}` : "",
                where: visa.visa_center || visa.embassy_or_consulate || "",
              }
            : null
        }
        money={person.money}
        tasks={person.tasks.filter((item) => !isDone(item.status)).map((item) => ({ id: item.id, title: item.title, due: item.due_date }))}
      />
    );
  };

  const stub = [
    { label: "University", value: application?.university || application?.source_university_name || "Not chosen yet" },
    { label: "Course", value: application?.program || "—" },
    { label: "Intake", value: application?.intake || "—" },
    visa?.appointment_date && daysUntil(visa.appointment_date) >= 0
      ? { label: "Visa appointment", value: `${fmtDate(visa.appointment_date)}${visa.appointment_time ? ` · ${String(visa.appointment_time).slice(0, 5)}` : ""}` }
      : visa
        ? { label: "Visa", value: humanize(visa.visa_status || visa.status || "In progress") }
        : { label: "Applications", value: person.applications.length ? `${person.applications.length} sent or planned` : "None yet" },
  ];

  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(7,31,80,0.14)] ring-1 ring-[#071f50]/8">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* the pass */}
        <div className="relative overflow-hidden bg-[#071f50] p-6 text-white sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -bottom-32 h-[320px] w-[320px] rounded-full border border-white/[0.06]" />
          <p className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a5c]">
            <span>Student file</span>
            <span className="font-mono tracking-[0.12em] text-white/35">{fileNumber}</span>
          </p>
          <div className="relative mt-3 flex min-w-0 items-start gap-4">
            <Avatar name={person.name} size={68} className="ring-4 ring-white/10" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.75rem] font-black leading-tight tracking-[-0.02em] sm:text-[2rem]">{person.name}</h1>
                <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Edit details">
                  <Pencil size={15} />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ background: `${stage.color}33`, color: "#fff" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: stage.color }} />
                  {stage.label}
                </span>
                <PriorityChip priority={person.priority} />
                {onFile !== null ? <span className="text-[12px] font-semibold text-white/45">on file {onFile === 0 ? "since today" : `${onFile} day${onFile === 1 ? "" : "s"}`}</span> : null}
              </div>
              <p className="mt-2 truncate text-[14px] font-semibold text-white/65">{[person.phone, person.email].filter(Boolean).join(" · ") || "No contact details yet"}</p>
            </div>
          </div>

          {/* route line */}
          <div className="relative mt-6 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">From</p>
              <p className="truncate text-[1.25rem] font-black">{from}</p>
            </div>
            <div className="relative flex min-w-[60px] flex-1 items-center">
              <span className="h-px w-full border-t-2 border-dashed border-white/25" />
              <Plane size={18} className="absolute left-1/2 -translate-x-1/2 rotate-45 text-[#ff8a5c]" />
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">To</p>
              <p className={classNames("truncate text-[1.25rem] font-black", person.country ? "text-white" : "text-white/40")}>{person.country || "Not chosen"}</p>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setComposeOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#ff4b12] px-3.5 text-[13px] font-extrabold text-white shadow-[0_8px_18px_rgba(255,75,18,0.3)] transition hover:bg-[#f2410a]">
                <Sparkles size={15} /> Send a message
              </button>
              <ContactButtons person={person} withLabels />
              <button
                type="button"
                onClick={printFile}
                title="One-page summary of this file on Zaifan letterhead, to print or save as PDF"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/20 px-3.5 text-[13px] font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <Printer size={15} /> Print file
              </button>
            </div>
            {paper}
            {composeOpen ? <MessageComposer person={person} open onClose={() => setComposeOpen(false)} /> : null}
          </div>
        </div>

        {/* the stub */}
        <div className="relative bg-[#fff7ed] p-6 sm:p-7">
          <span aria-hidden="true" className="absolute inset-y-4 left-0 hidden border-l-2 border-dashed border-[#071f50]/15 lg:block" />
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#071f50]/45">Where they are going</p>
          <dl className="mt-3 space-y-3">
            {stub.map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-[#071f50]/40">{item.label}</dt>
                <dd className="truncate text-[15px] font-black text-[#071f50]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* white strip: next step + runway + owner */}
      <div className="grid gap-5 border-t border-[#071f50]/8 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,340px)] xl:items-start">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#071f50]/45">Next up</p>
          {task ? (
            <p className="mt-1.5 flex items-start gap-2 text-[14.5px] font-extrabold text-[#071f50]">
              <CalendarClock size={17} className={classNames("mt-0.5 shrink-0", taskDays !== null && taskDays < 0 ? "text-rose-500" : "text-[#ff4b12]")} />
              <span className="min-w-0">
                {task.title}
                {task.due_date ? <span className={classNames("block text-[12px] font-bold", taskDays < 0 ? "text-rose-600" : "text-[#071f50]/50")}>{dueLabel(task.due_date)}</span> : null}
              </span>
            </p>
          ) : (
            <p className="mt-1.5 text-[13.5px] font-semibold text-[#071f50]/50">No open task. Add one in the Tasks tab.</p>
          )}
          <div className="mt-2">
            <FlagList person={person} />
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#071f50]/45">Journey · click a stage to move them</p>
            {person.stage === "closed" ? (
              <Button size="sm" onClick={() => onStage("consulting")}>
                Reopen
              </Button>
            ) : (
              <button type="button" onClick={() => onStage("closed")} className="text-[12px] font-extrabold text-rose-600/80 hover:text-rose-700 hover:underline">
                Close file
              </button>
            )}
          </div>
          <StageRunway stage={person.stage} onChange={onStage} closed={person.stage === "closed"} />
          {person.closed ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12.5px] font-bold leading-5 text-rose-800">
              File closed{person.closed.at ? ` on ${fmtDate(person.closed.at)}` : ""}
              {person.closed.reason ? `: ${CLOSE_REASON_LABEL[person.closed.reason] || person.closed.reason}` : ". No reason was written down."}
              {person.closed.note ? <span className="block font-semibold text-rose-800/80">“{person.closed.note}”</span> : null}
            </p>
          ) : null}
          {!person.stageIsManual ? <p className="mt-2 text-[11.5px] font-semibold text-[#071f50]/40">Stage was worked out from their data. Click a stage once to set it yourself.</p> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Counselor">
            <Select disabled={isCounselor} value={person.assignedTo || ""} onChange={(event) => onAssign(event.target.value || null)}>
              <option value="">Nobody yet</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({humanize(member.role)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={person.priority} onChange={(event) => onPriority(event.target.value)}>
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </section>
  );
}
