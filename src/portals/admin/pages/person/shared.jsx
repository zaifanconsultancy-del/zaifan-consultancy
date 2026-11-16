/* eslint-disable react-refresh/only-export-components */
// Bits shared by the tabs of one person's file.

import { classNames } from "../../lib/format";
import { Button, Chip } from "../../ui/kit";

export function toInputDate(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function orNull(value) {
  if (value === "" || value === undefined) return null;
  return value;
}

export function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function generatePassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

export function SectionTitle({ title, subtitle, action, className = "" }) {
  return (
    <div className={classNames("flex flex-wrap items-end justify-between gap-2", className)}>
      <div>
        <h3 className="text-[15px] font-black text-[#071f50]">{title}</h3>
        {subtitle ? <p className="text-[13px] text-[#071f50]/55">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Chip whose colour follows a status word. */
const STATUS_COLORS = {
  // good
  verified: "#10b981",
  approved: "#10b981",
  paid: "#10b981",
  confirmed: "#10b981",
  granted: "#10b981",
  enrolled: "#10b981",
  completed: "#10b981",
  done: "#10b981",
  resolved: "#10b981",
  offer_accepted: "#10b981",
  offer_received: "#8b5cf6",
  conditional_offer: "#8b5cf6",
  accepted: "#10b981",
  // in progress
  submitted: "#0ea5e9",
  under_review: "#0ea5e9",
  in_progress: "#0ea5e9",
  appointment_booked: "#0ea5e9",
  preparing: "#f59e0b",
  planning: "#64748b",
  pending: "#f59e0b",
  pending_review: "#f59e0b",
  partially_paid: "#f59e0b",
  waiting: "#f59e0b",
  decision_pending: "#f59e0b",
  open: "#f59e0b",
  unpaid: "#ff4b12",
  overdue: "#ef4444",
  // bad
  rejected: "#ef4444",
  refused: "#ef4444",
  cancelled: "#94a3b8",
  void: "#94a3b8",
  withdrawn: "#94a3b8",
  offer_declined: "#94a3b8",
  not_started: "#94a3b8",
  none: "#94a3b8",
};

export function StatusChip({ status, label, size = "sm" }) {
  const key = String(status || "").toLowerCase();
  const color = STATUS_COLORS[key] || "#64748b";
  return (
    <Chip color={color} size={size}>
      {label || key.replace(/_/g, " ") || "—"}
    </Chip>
  );
}

export function AddButton({ children, onClick }) {
  return (
    <Button variant="primary" size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}

export function DetailLine({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <p className="text-[13px] text-[#071f50]/70">
      <span className="font-extrabold text-[#071f50]/45">{label}: </span>
      <span className="font-semibold text-[#071f50]">{value}</span>
    </p>
  );
}
