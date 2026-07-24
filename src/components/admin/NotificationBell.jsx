// NotificationBell V3 MAXIMUM — Admin OS Notification Trigger
// src/components/admin/NotificationBell.jsx
//
// Focused maximum pass for this small component:
// - preserves notifications / open / setOpen contract
// - safer notification-array handling
// - accessible unread announcement and tooltip/title
// - Lucide icon instead of emoji for consistent Admin OS visuals
// - reduced-motion support
// - clearer open/unread/clear states
// - capped 99+ badge
// - explicit contrast protection
// - no backend or notification-state assumptions

import { motion, useReducedMotion } from "framer-motion";
import { Bell, BellRing } from "lucide-react";

function NotificationBell({
  notifications = [],
  open = false,
  setOpen = () => {},
}) {
  const reduceMotion = useReducedMotion();

  const unreadCount = Array.isArray(notifications)
    ? notifications.length
    : 0;

  const hasUnread = unreadCount > 0;
  const Icon = hasUnread ? BellRing : Bell;

  const label = hasUnread
    ? `Notifications, ${unreadCount} active alert${unreadCount === 1 ? "" : "s"}`
    : "Notifications, no active alerts";

  return (
    <motion.button
      type="button"
      onClick={() => setOpen((current) => !current)}
      aria-label={label}
      aria-expanded={Boolean(open)}
      aria-haspopup="dialog"
      title={label}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
      className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[3px] shadow-[0_6px_18px_rgba(15,35,63,0.05)] transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        open
          ? "border-orange-500 bg-orange-500"
          : hasUnread
          ? "border-orange-300 bg-orange-50 hover:border-orange-500 hover:bg-orange-100"
          : "border-slate-300 bg-white hover:border-orange-400 hover:bg-orange-50"
      }`}
      style={{ color: open ? "#FFFFFF" : hasUnread ? "#C2410C" : "#10233F" }}
    >
      {hasUnread && !reduceMotion ? (
        <motion.span
          aria-hidden="true"
          className="absolute inset-1 rounded-xl border-2 border-orange-300/60"
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ) : null}

      <Icon
        aria-hidden="true"
        className="relative z-10 h-5 w-5"
        strokeWidth={2.4}
      />

      {hasUnread ? (
        <>
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 z-20 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"
          />

          <span
            aria-hidden="true"
            className="absolute -right-2.5 -top-2.5 z-30 flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-[0_7px_16px_rgba(220,38,38,0.24)]"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </>
      ) : null}

      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

export default NotificationBell;