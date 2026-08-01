// NotificationBell V6 PARTNER OS — lightweight Admin shell notification gateway
// src/components/admin/workspaces/communications/NotificationBell.jsx
//
// Ownership rule:
// - this component is only a trigger/gateway
// - full CRM notification work belongs in Communications -> Notifications
// - backwards compatible with notifications/open/setOpen
// - optional onClick allows direct routing without owning another popover

import { Bell, BellRing } from "lucide-react";

function safeCount(value) {
  if (Array.isArray(value)) return value.length;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function NotificationBell({
  notifications = [],
  open = false,
  setOpen = () => {},
  onClick = null,
  label = "Notifications",
}) {
  const unreadCount = safeCount(notifications);
  const hasUnread = unreadCount > 0;
  const Icon = hasUnread ? BellRing : Bell;

  const accessibleLabel = hasUnread
    ? `${label}, ${unreadCount} active alert${unreadCount === 1 ? "" : "s"}`
    : `${label}, no active alerts`;

  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick();
      return;
    }

    if (typeof setOpen === "function") {
      setOpen((current) => !current);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={accessibleLabel}
      aria-expanded={typeof onClick === "function" ? undefined : Boolean(open)}
      aria-haspopup={typeof onClick === "function" ? undefined : "dialog"}
      title={accessibleLabel}
      className={`group relative inline-flex h-11 min-w-11 shrink-0 items-center justify-center overflow-visible rounded-[0.95rem] border-[3px] px-2.5 shadow-[0_6px_16px_rgba(15,35,63,0.06)] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5A0A]/20 active:translate-y-px ${
        open
          ? "border-[#FF5A0A] bg-[#123865] text-white shadow-[0_8px_20px_rgba(18,56,101,0.18)]"
          : hasUnread
            ? "border-[#FF5A0A] bg-[#FFF8EF] text-[#123865] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_9px_22px_rgba(15,35,63,0.10)]"
            : "border-[#C9D7E6] bg-white text-[#123865] hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF8EF] hover:shadow-[0_9px_22px_rgba(15,35,63,0.09)]"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 transition ${
          open
            ? "border-white/20 bg-white/10 text-orange-200"
            : hasUnread
              ? "border-[#FF5A0A]/25 bg-white text-[#FF5A0A]"
              : "border-[#123865]/10 bg-[#F7FAFC] text-[#123865] group-hover:bg-white"
        }`}
      >
        <Icon size={16} strokeWidth={2.4} />
      </span>

      {hasUnread ? (
        <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-black leading-none text-white shadow-[0_5px_12px_rgba(185,28,28,0.22)]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}

      <span className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#FF5A0A] opacity-0 transition group-hover:opacity-100" />
    </button>
  );
}

export default NotificationBell;
