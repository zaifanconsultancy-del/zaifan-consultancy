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
      className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white transition duration-300 hover:border-[#D4AF37]/35 hover:bg-white/[0.07]"
    >
      <span className="text-lg transition duration-300 group-hover:text-[#F5D76E]">
        🔔
      </span>

      {unreadCount ? (
        <>
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full bg-red-500" />

          <span className="absolute -right-1 -top-1 flex min-w-[22px] items-center justify-center rounded-full border border-red-400/30 bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/20">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </>
      ) : null}
    </button>
  );
}

export default NotificationBell;