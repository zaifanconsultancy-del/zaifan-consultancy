// "Key dates": the next deadlines and appointments in the student's file,
// each with a big day countdown so nothing sneaks up on them.

import { CalendarDays } from "lucide-react";

import { classNames, fmtDate } from "../../admin/lib/format";
import { Card, CardHeader } from "../../admin/ui/kit";

function countdown(days) {
  if (days < 0) return { big: String(-days), small: "days late" };
  if (days === 0) return { big: "Today", small: "" };
  if (days === 1) return { big: "1", small: "day" };
  return { big: String(days), small: "days" };
}

export default function KeyDates({ dates, goTo }) {
  return (
    <Card className="pb-3">
      <CardHeader icon={CalendarDays} title="Key dates" subtitle="Deadlines and appointments coming up." />
      {dates.length ? (
        <ol className="mt-3 space-y-1.5 px-3">
          {dates.slice(0, 5).map((item) => {
            const left = countdown(item.days);
            const late = item.days < 0;
            const soon = item.days <= 7;
            return (
              <li key={item.id}>
                <button type="button" onClick={() => goTo(item.tab)} className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition hover:bg-[#071f50]/[0.03]">
                  <span
                    className={classNames(
                      "flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-2xl leading-none",
                      late ? "bg-rose-600 text-white" : soon ? "bg-[#ff4b12] text-white" : "bg-[#071f50]/[0.06] text-[#071f50]"
                    )}
                  >
                    <span className={classNames("font-black tabular-nums", left.small ? "text-[1.35rem]" : "text-[13px]")}>{left.big}</span>
                    {left.small ? <span className={classNames("mt-0.5 text-[10px] font-extrabold uppercase", soon ? "text-white/80" : "text-[#071f50]/50")}>{left.small}</span> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-black leading-5 text-[#071f50]">{item.title}</span>
                    <span className={classNames("block truncate text-[12.5px] font-semibold", late ? "text-rose-600" : "text-[#071f50]/55")}>
                      {late ? `Was due ${fmtDate(item.date)}` : fmtDate(item.date)} · {item.sub}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mx-5 mt-4 rounded-2xl bg-[#071f50]/[0.035] px-4 py-5 text-center text-[13.5px] font-semibold leading-5 text-[#071f50]/55">
          No deadlines yet. When your counselor adds offer, payment or visa dates, the countdown shows here.
        </p>
      )}
    </Card>
  );
}
