// Pieces that show a person: the stage "runway", contact buttons, list rows.

import { Link } from "react-router-dom";
import { Mail, MessageCircle, Phone, Plane } from "lucide-react";

import { classNames, fmtMoneyList, mailLink, telLink, timeAgo, waLink } from "../lib/format";
import { JOURNEY_STAGES, PRIORITIES, STAGE_BY_ID, stageIndex } from "../lib/people";
import { Avatar, Chip } from "./kit";

export function StageChip({ stage, size = "sm" }) {
  const meta = STAGE_BY_ID[stage] || STAGE_BY_ID.lead;
  return (
    <Chip color={meta.color} size={size}>
      {meta.label}
    </Chip>
  );
}

export function PriorityChip({ priority }) {
  const meta = PRIORITIES.find((item) => item.id === priority);
  if (!meta || meta.id === "normal") return null;
  return (
    <Chip color={meta.color} dot={false}>
      {meta.label} priority
    </Chip>
  );
}

/**
 * The journey as a runway: Lead → Talking → Applying → Offer → Visa → Flown.
 * A little plane sits on the current stage. Click a stage to move the person.
 */
export function StageRunway({ stage, onChange, compact = false, closed = false }) {
  const current = stageIndex(stage);
  return (
    <ol
      className={classNames("relative flex w-full items-stretch gap-1", compact ? "h-2" : "")}
      aria-label="Journey stage"
    >
      {JOURNEY_STAGES.map((item, index) => {
        const reached = !closed && index <= current;
        const active = !closed && index === current;
        const Tag = onChange ? "button" : "div";
        return (
          <li key={item.id} className="relative min-w-0 flex-1">
            <Tag
              type={onChange ? "button" : undefined}
              onClick={onChange ? () => onChange(item.id) : undefined}
              title={`${item.label}: ${item.hint}`}
              className={classNames(
                "group flex w-full flex-col items-stretch text-left",
                onChange && "cursor-pointer"
              )}
            >
              <span
                className={classNames("block w-full rounded-full transition", compact ? "h-2" : "h-2.5")}
                style={{
                  background: reached ? item.color : "rgba(7,31,80,0.1)",
                  opacity: reached && !active ? 0.55 : 1,
                }}
              />
              {!compact ? (
                <span
                  className={classNames(
                    "mt-2 flex items-center gap-1 truncate text-[9.5px] font-extrabold uppercase tracking-[0.02em] transition sm:text-[10.5px] 2xl:text-[11px] 2xl:tracking-[0.08em]",
                    active ? "text-[#071f50]" : "text-[#071f50]/40 group-hover:text-[#071f50]/70"
                  )}
                >
                  {active ? <Plane size={12} className="hidden shrink-0 2xl:block" style={{ color: item.color }} /> : null}
                  {item.short}
                </span>
              ) : null}
            </Tag>
          </li>
        );
      })}
    </ol>
  );
}

export function ContactButtons({ person, size = "icon", withLabels = false, message }) {
  const items = [
    {
      key: "wa",
      href: waLink(person.phone, message ?? `Assalam o Alaikum ${person.name.split(" ")[0]}, this is Zaifan Consultancy.`),
      Icon: MessageCircle,
      label: "WhatsApp",
      color: "#25D366",
    },
    { key: "tel", href: telLink(person.phone), Icon: Phone, label: "Call", color: "#0ea5e9" },
    { key: "mail", href: mailLink(person.email, "Zaifan Consultancy"), Icon: Mail, label: "Email", color: "#8b5cf6" },
  ].filter((item) => item.href);

  if (!items.length) return <span className="text-[12px] font-semibold text-[#071f50]/40">No contact details</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      {items.map(({ key, href, Icon, label, color }) => (
        <a
          key={key}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          aria-label={label}
          title={label}
          className={classNames(
            "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#071f50]/10 bg-white font-extrabold transition hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(7,31,80,0.1)]",
            withLabels || size !== "icon" ? "h-10 px-3 text-[13px]" : "h-9 w-9"
          )}
          style={{ color }}
        >
          <Icon size={16} />
          {withLabels ? <span className="text-[#071f50]">{label}</span> : null}
        </a>
      ))}
    </div>
  );
}

export function PersonLine({ person, right, to, onClick, showStage = true, subtitle, className = "" }) {
  const body = (
    <>
      <Avatar name={person.name} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-[15px] font-black text-[#071f50]">{person.name}</span>
          {showStage ? <StageChip stage={person.stage} /> : null}
          <PriorityChip priority={person.priority} />
        </div>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-[#071f50]/55">
          {subtitle ?? [person.country, person.email || person.phone, person.lastActivityAt ? `active ${timeAgo(person.lastActivityAt)}` : ""].filter(Boolean).join(" · ")}
        </p>
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </>
  );
  const base = classNames(
    "flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-[#071f50]/10 hover:bg-[#071f50]/[0.025]",
    className
  );
  if (to) {
    return (
      <Link to={to} className={base}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      {body}
    </button>
  );
}

export function FlagList({ person }) {
  const flags = [];
  if (person.counts.overdueTasks) flags.push({ text: `${person.counts.overdueTasks} overdue`, color: "#ef4444" });
  else if (person.counts.openTasks) flags.push({ text: `${person.counts.openTasks} to do`, color: "#0ea5e9" });
  if (person.counts.receiptsToReview) flags.push({ text: `${person.counts.receiptsToReview} receipt to check`, color: "#f59e0b" });
  if (person.counts.pendingDocs) flags.push({ text: `${person.counts.pendingDocs} docs to review`, color: "#8b5cf6" });
  if (person.counts.overdueInvoices) flags.push({ text: `${person.counts.overdueInvoices} invoice${person.counts.overdueInvoices === 1 ? "" : "s"} overdue`, color: "#ef4444" });
  if (person.counts.outstanding > 0) flags.push({ text: `${fmtMoneyList(person.money.due)} due`, color: "#ff4b12" });
  if (person.counts.openSupport) flags.push({ text: `${person.counts.openSupport} question`, color: "#0ea5e9" });
  if (!flags.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Chip key={flag.text} color={flag.color} dot={false}>
          {flag.text}
        </Chip>
      ))}
    </div>
  );
}
