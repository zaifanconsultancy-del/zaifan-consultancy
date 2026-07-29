// NotificationBell V4 — lightweight Admin shell notification gateway
// src/components/admin/NotificationBell.jsx
//
// Ownership rule:
// - this component is only a trigger/gateway
// - full CRM notification work belongs in Communications -> Notifications
// - backwards compatible with notifications/open/setOpen
// - optional onClick allows direct routing without owning another popover

import { Bell, BellRing } from "lucide-react";

function NotificationBell({
  notifications = [],
  open = false,
  setOpen = () => {},
  onClick = null,
  label = "Notifications",
}) {
  const unreadCount = Array.isArray(notifications)
    ? notifications.length
    : Number(notifications) || 0;

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
      title={accessibleLabel}
      className={`group relative inline-flex h-10 min-w-10 items-center justify-center rounded-xl border-2 px-2.5 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        open
          ? "border-orange-500 bg-orange-500 text-white"
          : hasUnread
          ? "border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-500 hover:bg-orange-100"
          : "border-slate-300 bg-white text-[#123865] hover:border-orange-400 hover:bg-orange-50"
      }`}
    >
      <Icon size={17} strokeWidth={2.3} />

      {hasUnread ? (
        <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[9px] font-black leading-none text-white shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

export default NotificationBell;
