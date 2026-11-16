import { useEffect, useState } from "react";

const PAKISTAN_OFFSET = 5 * 60;

// Minutes ahead of UTC in a time zone right now (handles summer time).
function offsetMinutes(zone, date) {
  const label =
    new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value || "GMT";
  const match = label.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] || 0));
}

/** "4 hours behind Pakistan", worked out for this moment. */
export function versusPakistan(zone, date) {
  const hours = (offsetMinutes(zone, date) - PAKISTAN_OFFSET) / 60;
  if (hours === 0) return "Same time as Pakistan";
  const amount = Math.abs(hours);
  return `${amount} hour${amount === 1 ? "" : "s"} ${hours > 0 ? "ahead of" : "behind"} Pakistan`;
}

/** The current time, refreshed every half minute so clocks stay right. */
export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}
