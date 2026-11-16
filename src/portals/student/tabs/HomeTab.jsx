// Home: the boarding pass (where you are on the journey), what you need to do
// next, three quick numbers and how to reach Zaifan.

import { AlertTriangle, ArrowRight, Check, CheckCircle2, Clock3, CreditCard, FileText, GraduationCap, MessageCircle, Plane } from "lucide-react";

import { classNames, firstName, fmtMoneyList, greeting, sumByCurrency, waLink } from "../../admin/lib/format";
import KeyDates from "./KeyDates";
import { Card, CardHeader } from "../../admin/ui/kit";
import { invoiceOutstanding, isDocOk, JOURNEY, journeyStage, keyDates, OFFICE_WHATSAPP } from "../lib";

export default function HomeTab({ file, goTo, todo }) {
  const stage = journeyStage(file);
  const closed = file.person.stage === "closed";
  const mustDo = todo.filter((item) => item.tone !== "waiting");

  const approved = file.documents.filter(isDocOk).length;
  // Per currency, so a EUR invoice is never added to PKR ones.
  const live = file.invoices.filter((invoice) => !["void", "cancelled"].includes(String(invoice.status || "").toLowerCase()));
  const leftList = sumByCurrency(live, invoiceOutstanding, (invoice) => invoice.currency);
  const billedList = sumByCurrency(live, (invoice) => invoice.total, (invoice) => invoice.currency);
  const main = billedList[0]?.[0];
  const billed = billedList[0]?.[1] || 0;
  const mainLeft = leftList.find(([currency]) => currency === main)?.[1] || 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[1.7rem] font-black tracking-[-0.02em] sm:text-[2.1rem]">
          {greeting()}, {firstName(file.person.name)}.
        </h1>
        <p className="mt-1 text-[15px] text-[#071f50]/60">
          {mustDo.length ? `You have ${mustDo.length} thing${mustDo.length === 1 ? "" : "s"} to do. They are listed below.` : "Nothing is waiting on you right now."}
        </p>
      </header>

      <BoardingPass file={file} stage={stage} closed={closed} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <Card className="pb-3">
        <CardHeader icon={CheckCircle2} title="What you need to do" subtitle="Tap an item to go to the right page." />
        {todo.length ? (
          <ul className="mt-3 space-y-1.5 px-3">
            {todo.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goTo(item.tab)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#071f50]/[0.03]"
                >
                  <span
                    className={classNames(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      item.tone === "urgent" ? "bg-rose-50 text-rose-600" : item.tone === "waiting" ? "bg-sky-50 text-sky-600" : "bg-[#fff1e8] text-[#ff4b12]"
                    )}
                  >
                    {item.tone === "urgent" ? <AlertTriangle size={18} /> : item.tone === "waiting" ? <Clock3 size={18} /> : <ArrowRight size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-black leading-5 text-[#071f50]">{item.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-5 text-[#071f50]/60">{item.text}</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 text-[#071f50]/30" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mx-5 mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-900">
            <Check size={20} className="shrink-0" />
            <p className="text-[14px] font-bold leading-5">You are all caught up. We will list the next step here as soon as there is one.</p>
          </div>
        )}
      </Card>
      <div className="min-w-0 space-y-3">
      <KeyDates dates={keyDates(file)} goTo={goTo} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <QuickCard Icon={FileText} label="Documents accepted" value={`${approved} of ${file.documents.length}`} meter={file.documents.length ? approved / file.documents.length : 0} color="#8b5cf6" onClick={() => goTo("documents")} />
        <QuickCard Icon={GraduationCap} label="University applications" value={file.applications.length} onClick={() => goTo("applications")} />
        <QuickCard Icon={CreditCard} label="Left to pay" value={leftList.length ? fmtMoneyList(leftList) : "Nothing"} meter={billed ? (billed - mainLeft) / billed : undefined} meterLabel={billed && leftList.length < 2 ? `${Math.round(((billed - mainLeft) / billed) * 100)}% paid` : ""} color="#10b981" onClick={() => goTo("payments")} />
      </div>
      </div>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[15px] font-black">{file.person.counselor?.name ? `Your counselor is ${file.person.counselor.name}` : "The Zaifan team is looking after your file"}</p>
          <p className="mt-0.5 text-[13.5px] leading-5 text-[#071f50]/60">Have a question? Ask it in Help, or message the office on WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => goTo("help")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#071f50] px-4 text-sm font-bold text-white transition hover:bg-[#0b2a6b]">
            Ask a question
          </button>
          <a
            href={waLink(OFFICE_WHATSAPP, `Assalam o Alaikum, this is ${file.person.name}. I have a question about my file.`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={17} />
            WhatsApp
          </a>
        </div>
      </Card>
    </div>
  );
}

function BoardingPass({ file, stage, closed }) {
  const index = Math.max(0, JOURNEY.findIndex((step) => step.id === stage));
  const current = JOURNEY[index];
  const destination = file.person.country || file.applications[0]?.country || "";
  const progress = (index / (JOURNEY.length - 1)) * 100;

  return (
    <section className="overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_24px_60px_rgba(7,31,80,0.22)] md:flex">
      <div className="min-w-0 flex-1 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/45">Passenger</p>
            <p className="mt-1 truncate text-[1.25rem] font-black tracking-[-0.01em] sm:text-[1.5rem]">{file.person.name}</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.2em] text-white/70">Boarding pass</span>
        </div>

        <div className="mt-5 flex items-center gap-3 sm:gap-5">
          <div>
            <p className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/45">From</p>
            <p className="mt-0.5 text-[1.5rem] font-black leading-none sm:text-[2rem]">Pakistan</p>
          </div>
          <div className="relative flex min-w-[48px] flex-1 items-center">
            <span className="h-px w-full border-t-2 border-dashed border-white/25" />
            <Plane size={20} className="absolute left-1/2 -translate-x-1/2 text-[#ff8a5c]" />
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/45">To</p>
            <p className="mt-0.5 text-[1.5rem] font-black leading-none sm:text-[2rem]">{destination || "Deciding"}</p>
          </div>
        </div>

        {/* Journey line */}
        <div className="mt-8">
          <div className="relative mx-3 h-1.5 rounded-full bg-white/15">
            <span className="absolute inset-y-0 left-0 rounded-full bg-[#ff4b12] transition-all duration-700" style={{ width: closed ? "0%" : `${progress}%` }} />
            {JOURNEY.map((step, stepIndex) => {
              const reached = !closed && stepIndex <= index;
              const active = !closed && stepIndex === index;
              return (
                <span
                  key={step.id}
                  className={classNames(
                    "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 transition",
                    active ? "h-8 w-8 border-[#ff4b12] bg-white text-[#ff4b12]" : reached ? "h-4 w-4 border-[#ff4b12] bg-[#ff4b12]" : "h-4 w-4 border-white/30 bg-[#071f50]"
                  )}
                  style={{ left: `${(stepIndex / (JOURNEY.length - 1)) * 100}%` }}
                >
                  {active ? <Plane size={15} /> : null}
                </span>
              );
            })}
          </div>
          <ol className="mt-4 grid grid-cols-5 text-center">
            {JOURNEY.map((step, stepIndex) => (
              <li
                key={step.id}
                className={classNames(
                  "text-[10.5px] font-extrabold uppercase tracking-[0.06em] sm:text-[11.5px]",
                  stepIndex === 0 && "text-left",
                  stepIndex === JOURNEY.length - 1 && "text-right",
                  !closed && stepIndex === index ? "text-white" : "text-white/40"
                )}
              >
                <span className="sm:hidden">{step.short}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Stub */}
      <div className="border-t-2 border-dashed border-white/20 bg-white/[0.05] p-5 sm:p-7 md:w-[270px] md:shrink-0 md:border-l-2 md:border-t-0">
        <p className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/45">You are here</p>
        <p className="mt-1 text-[1.35rem] font-black text-[#ff8a5c]">{closed ? "On hold" : `Step ${index + 1} of ${JOURNEY.length}: ${current.label}`}</p>
        <p className="mt-2 text-[13.5px] leading-5 text-white/70">
          {closed ? "Your file is paused for now. Message us whenever you want to continue." : current.text}
        </p>
        {!closed && JOURNEY[index + 1] ? (
          <p className="mt-4 text-[12px] font-bold text-white/45">
            Next: <span className="text-white/80">{JOURNEY[index + 1].label}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

function QuickCard({ Icon, label, value, onClick, meter, meterLabel = "", color = "#071f50" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col rounded-[22px] border border-[#071f50]/8 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#071f50]/25 hover:shadow-[0_12px_26px_rgba(7,31,80,0.08)]"
    >
      <span className="flex w-full items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}14`, color }}>
          <Icon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.15rem] font-black leading-6">{value}</span>
          <span className="block text-[12.5px] font-semibold text-[#071f50]/55">
            {label}
            {meterLabel ? ` · ${meterLabel}` : ""}
          </span>
        </span>
        <ArrowRight size={16} className="text-[#071f50]/30" />
      </span>
      {meter !== undefined ? (
        <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-[#071f50]/[0.07]">
          <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, meter * 100))}%`, background: color }} />
        </span>
      ) : null}
    </button>
  );
}
