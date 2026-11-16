// Small formatting helpers shared by every admin page. Plain English everywhere.

export const NAVY = "#071f50";
export const ORANGE = "#ff4b12";
export const CREAM = "#fff7ed";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fmtDate(value, { withYear = "auto" } = {}) {
  const date = toDate(value);
  if (!date) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear === true || (withYear === "auto" && !sameYear) ? { year: "numeric" } : {}),
  });
}

export function fmtTime(value) {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function fmtDateTime(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${fmtDate(date)}, ${fmtTime(date)}`;
}

export function timeAgo(value) {
  const date = toDate(value);
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.round(days / 7)} wk ago`;
  return fmtDate(date);
}

export function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysUntil(value) {
  const date = toDate(value);
  if (!date) return null;
  return Math.round((startOfDay(date) - startOfDay()) / DAY_MS);
}

export function isToday(value) {
  return daysUntil(value) === 0;
}

/** "in 3 days", "today", "tomorrow", "4 days overdue" */
export function dueLabel(value) {
  const days = daysUntil(value);
  if (days === null) return "";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days < 14) return `in ${days} days`;
  return fmtDate(value);
}

export function fmtMoney(amount, currency = "PKR") {
  const number = Number(amount || 0);
  const code = String(currency || "PKR").toUpperCase();
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: code,
      maximumFractionDigits: number % 1 === 0 ? 0 : 2,
    }).format(number);
  } catch {
    return `${code} ${number.toLocaleString()}`;
  }
}

export function humanize(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(/[_-]+/g, " ").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const AVATAR_COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899", "#ff4b12", "#071f50"];

export function avatarColor(seed = "") {
  let hash = 0;
  for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Pakistani numbers: "0323 5718151" -> "923235718151" for WhatsApp links. */
export function phoneDigits(phone = "") {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("3")) digits = `92${digits}`;
  return digits;
}

export function waLink(phone, text = "") {
  const digits = phoneDigits(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(phone) {
  const digits = phoneDigits(phone);
  return digits ? `tel:+${digits}` : "";
}

export function mailLink(email, subject = "") {
  if (!email) return "";
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}

const SOURCE_LABELS = {
  website_home_boarding_pass: "Home page form",
  website_contact: "Contact page",
  website_contact_italy: "Contact page (Italy)",
  website_appointment: "Booked online",
  admin_manual: "Added by team",
};

export function sourceLabel(value, fallback = "Website") {
  if (!value) return fallback;
  if (SOURCE_LABELS[value]) return SOURCE_LABELS[value];
  const key = Object.keys(SOURCE_LABELS).find((item) => String(value).startsWith(item));
  if (key) return SOURCE_LABELS[key];
  return humanize(String(value).replace(/^website_/, "website "));
}

export function firstName(name = "") {
  return String(name).trim().split(/\s+/)[0] || "";
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function sortBy(list, getter, direction = "desc") {
  const sign = direction === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const left = getter(a);
    const right = getter(b);
    if (left === right) return 0;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    return left > right ? sign : -sign;
  });
}

export function uniq(list) {
  return Array.from(new Set(list.filter(Boolean)));
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

/** Adds amounts per currency: [[currency, amount], …], rupees first. */
export function sumByCurrency(rows, getAmount, getCurrency) {
  const totals = new Map();
  for (const row of rows) {
    const amount = Number(getAmount(row) || 0);
    if (!amount) continue;
    const currency = String(getCurrency(row) || "PKR").toUpperCase();
    totals.set(currency, (totals.get(currency) || 0) + amount);
  }
  return Array.from(totals.entries()).sort((a, b) => (a[0] === "PKR" ? -1 : b[0] === "PKR" ? 1 : b[1] - a[1]));
}

/** "Rs 302,000 + €50" — never adds euros to rupees. */
export function fmtMoneyList(list, empty = "Rs 0") {
  if (!list?.length) return empty;
  return list.map(([currency, amount]) => fmtMoney(amount, currency)).join(" + ");
}

/** Merges several per-currency lists into one. */
export function mergeMoney(lists) {
  return sumByCurrency(lists.flat(), (entry) => entry[1], (entry) => entry[0]);
}

/** The old portal stored notes as "text ZAIFAN_REQUEST_META::{json}". Show only the human part. */
export function cleanNote(text) {
  const raw = String(text || "");
  const marker = raw.indexOf("ZAIFAN_REQUEST_META::");
  if (marker === -1) return raw.trim();
  const before = raw.slice(0, marker).trim();
  let instructions = "";
  try {
    instructions = JSON.parse(raw.slice(marker + "ZAIFAN_REQUEST_META::".length).trim())?.instructions || "";
  } catch {
    // not JSON: drop it
  }
  return [before, instructions].filter(Boolean).join(" ").trim();
}
