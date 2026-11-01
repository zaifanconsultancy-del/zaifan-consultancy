import { countryIndex as countryList } from "../../../data/countries/countryIndex";

export const NOT_SURE = "Not sure yet";
export const ZONE = "Asia/Karachi";

// Call slots, in Pakistan time.
export const TIME_SLOTS = ["10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

const destinationNames = new Set(countryList.map((item) => item.name));

// Every destination gets the same country-specific services (e.g. "Free
// Germany Study Plan"), followed by the general ones. Guide and service links
// already use these names, so they keep pre-selecting correctly.
export const GENERAL_TYPES = [
  "Free Consultation",
  "Study Planning",
  "Country Comparison",
  "University Selection",
  "Admission Guidance",
  "Scholarship Guidance",
  "Visa Guidance",
  "SOP & Documentation",
];

export function countryTypes(country) {
  if (!destinationNames.has(country)) return [];
  return [`Free ${country} Study Plan`, `${country} University Selection`, `${country} Admission Guidance`, `${country} Scholarship Guidance`, `${country} Visa Guidance`];
}

export function consultationTypes(country) {
  return [...countryTypes(country), ...GENERAL_TYPES];
}

export function defaultType(country) {
  return destinationNames.has(country) ? `Free ${country} Study Plan` : "Free Consultation";
}

export function isSpecificCountry(country) {
  return destinationNames.has(country);
}

export function matchOption(options, value) {
  const normalized = String(value || "").trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) || "";
}

// Where the student is, added to the message so the advisor can prepare.
export const STAGES = [
  { label: "Just researching", line: "I am just researching study abroad options and need help understanding countries, universities, scholarships and cost." },
  { label: "Shortlisting universities", line: "I am shortlisting universities and need help comparing course fit, city, tuition and scholarship route." },
  { label: "Preparing documents", line: "I want to prepare my admission, scholarship and visa documents correctly." },
  { label: "Ready to apply", line: "I am ready to apply and need a complete application, scholarship and visa roadmap." },
];

/* ---------- Dates and times, always in Pakistan time ---------- */

function partsIn(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** Today's date in Pakistan as YYYY-MM-DD. */
export function pakistanToday(now = new Date()) {
  const { year, month, day } = partsIn(now);
  return `${year}-${month}-${day}`;
}

/** Minutes since midnight in Pakistan right now. */
export function pakistanMinutes(now = new Date()) {
  const { hour, minute } = partsIn(now);
  return Number(hour) * 60 + Number(minute);
}

export function slotMinutes(slot) {
  const [, hours, minutes, meridiem] = slot.match(/(\d+):(\d+)\s*(AM|PM)/);
  return ((Number(hours) % 12) + (meridiem === "PM" ? 12 : 0)) * 60 + Number(minutes);
}

/** A slot today is gone once it starts in less than an hour. */
export function slotPassed(slot, date, now = new Date()) {
  return date === pakistanToday(now) && slotMinutes(slot) - 60 < pakistanMinutes(now);
}

function fromIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, days) {
  const date = fromIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** The next `count` days from today, for the date strip. */
export function upcomingDays(count, now = new Date()) {
  const today = pakistanToday(now);
  return Array.from({ length: count }, (_, index) => {
    const iso = addDays(today, index);
    const date = fromIso(iso);
    return {
      iso,
      weekday: index === 0 ? "Today" : index === 1 ? "Tomorrow" : date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
      day: date.getUTCDate(),
      month: date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
    };
  });
}

export function formatDate(iso, long = false) {
  if (!iso) return "";
  return fromIso(iso).toLocaleDateString("en-GB", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: long ? "long" : "short",
    timeZone: "UTC",
  });
}

/** "Add to Google Calendar" link for a booked call (30 minutes, Pakistan time). */
export function calendarLink({ consultation_type: service, appointment_date: date, appointment_time: time }) {
  const start = slotMinutes(time);
  const stamp = (minutes) => `${date.replaceAll("-", "")}T${String(Math.floor(minutes / 60)).padStart(2, "0")}${String(minutes % 60).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Zaifan Consultancy: ${service}`,
    dates: `${stamp(start)}/${stamp(start + 30)}`,
    ctz: ZONE,
    details: "Your free study abroad consultation with Zaifan Consultancy. Questions? WhatsApp +92 330 5718131.",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
