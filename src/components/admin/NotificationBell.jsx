function NotificationBell({
  notifications = [],
  open = false,
  setOpen = () => {},
}) {
  const unreadCount = notifications.length;

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      aria-expanded={open}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-white text-[#10233f] shadow-[0_5px_16px_rgba(15,35,63,0.04)] transition duration-300 ${
        open
          ? "border-orange-500 bg-orange-50 text-orange-700"
          : "border-slate-300 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
      }`}
    >
      <span className="text-lg transition duration-300">
        🔔
      </span>

      {unreadCount ? (
        <>
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />

          <span className="absolute -right-2 -top-2 flex min-w-[24px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow-[0_6px_14px_rgba(239,68,68,0.24)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </>
      ) : null}
    </button>
  );
}

export default NotificationBell;