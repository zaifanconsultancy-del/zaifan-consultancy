// Turns each country's loose timing text ("9–12 months before", "October –
// March", "Spring – early summer") into real months for the next intake, so
// the guide always reads from today's date and never goes stale.

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const SEASONS = { spring: [2, 4], summer: [5, 7], autumn: [8, 10], fall: [8, 10], winter: [11, 1] };
const TOKEN = /\b(early|late)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|spring|summer|autumn|fall|winter)[a-z]*\b/gi;
const RELATIVE = /(\d+)(?:\s*[–-]\s*(\d+))?\+?\s*months?\s+before/i;

// Students need at least this long between starting and flying.
export const MIN_LEAD_MONTHS = 6;

// A month is a plain number: year * 12 + month index.
const toIndex = (date) => date.getFullYear() * 12 + date.getMonth();
const fromIndex = (index) => new Date(Math.floor(index / 12), index % 12, 1);

export function formatMonth(index, withYear = true) {
  return fromIndex(index).toLocaleDateString("en-GB", withYear ? { month: "long", year: "numeric" } : { month: "long" });
}

function shortMonth(index) {
  return fromIndex(index).toLocaleDateString("en-US", { month: "short" });
}

/** "Oct – Dec 2026", "Dec 2026 – Mar 2027" or "Sep 2026". */
export function formatRange(start, end) {
  const year = (index) => Math.floor(index / 12);
  if (start === end) return `${shortMonth(start)} ${year(start)}`;
  if (year(start) === year(end)) return `${shortMonth(start)} – ${shortMonth(end)} ${year(end)}`;
  return `${shortMonth(start)} ${year(start)} – ${shortMonth(end)} ${year(end)}`;
}

/** The main intake month (0–11): the first month named in "September (main) · February (some)". */
export function mainIntakeMonth(intakes = "") {
  const match = intakes.toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  return match ? MONTH_NAMES.indexOf(match[1]) : 8;
}

/**
 * The next two starts of the main intake. The first one under six months away
 * is flagged as rushed, and the suggested one is the first that isn't.
 */
export function upcomingIntakes(intakes, today = new Date()) {
  const month = mainIntakeMonth(intakes);
  const now = toIndex(today);
  let first = Math.floor(now / 12) * 12 + month;
  if (first <= now) first += 12;

  const options = [first, first + 12, first + 24].map((index) => ({
    index,
    monthsAway: index - now,
    rushed: index - now < MIN_LEAD_MONTHS,
  }));
  return { options: options.slice(0, 2), suggested: options.find((option) => !option.rushed) };
}

function monthsOf(timing) {
  return [...timing.matchAll(TOKEN)].map(([, modifier = "", word]) => {
    const name = word.toLowerCase();
    if (!SEASONS[name]) {
      const index = MONTH_NAMES.indexOf(name);
      return [index, index];
    }
    const [from, to] = SEASONS[name];
    // "early summer" is just its first month; "late summer" just its last.
    if (modifier.toLowerCase() === "early") return [from, from];
    if (modifier.toLowerCase() === "late") return [to, to];
    return [from, to];
  });
}

const firstAtOrAfter = (month, anchor) => {
  let index = Math.floor(anchor / 12) * 12 + month;
  if (index < anchor) index += 12;
  return index;
};

/**
 * Real month ranges for each timeline phase, ending at `intake` (a month index).
 * Phases without a date ("As soon as you're admitted") get `range: null`.
 * Each phase is also marked done / now / next relative to today.
 */
export function scheduleFor(timeline = [], intake, today = new Date()) {
  const now = toIndex(today);
  let anchor = intake - 15;

  return timeline.map((phase) => {
    let range = null;
    let relative = null;
    const rel = phase.timing.match(RELATIVE);

    if (rel) {
      const near = Number(rel[1]);
      const far = Number(rel[2] || rel[1]);
      relative = near === far ? `${near} months before you start` : `${near}–${far} months before you start`;
      range = { start: intake - far, end: intake - near };
    } else {
      const months = monthsOf(phase.timing);
      if (months.length) {
        // Two months of slack lets "Winter" (December) follow a January step.
        const start = firstAtOrAfter(months[0][0], anchor - 2);
        const end = firstAtOrAfter(months[months.length - 1][1], start);
        range = { start, end };
      }
    }

    if (range) anchor = range.start;
    const status = !range ? null : range.end < now ? "done" : range.start <= now ? "now" : "next";
    return { ...phase, range, relative, status };
  });
}

export function monthsBetween(today, index) {
  return index - toIndex(today);
}
