import { AnimatePresence, motion } from "framer-motion";

function CrmNotificationCenter({
  open = false,
  notifications = [],
  onClose = () => {},
  onOpenStudent = null,
}) {
  const unreadCount = notifications.length;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <button
            type="button"
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default bg-[#17243D]/20"
            aria-label="Close notifications"
          />

          <motion.aside
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-14 z-50 w-[min(92vw,420px)] overflow-hidden rounded-[1.75rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8]/95 shadow-[0_24px_70px_rgba(23,36,61,0.18)] backdrop-blur-2xl"
          >
            <div className="border-b border-[#243A60]/12 bg-white px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B84F0E]">CRM Alerts</p>
                  <h3 className="mt-1 text-sm font-black text-[#17243D]">Smart Notifications</h3>
                  <p className="mt-1 text-xs text-[#667085]">
                    {unreadCount ? `${unreadCount} CRM alert${unreadCount > 1 ? "s" : ""}` : "No active alerts"}
                  </p>
                </div>

                <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-3 py-1 text-xs font-black text-[#B84F0E]">Live</span>
              </div>
            </div>

            <div className="max-h-[440px] overflow-y-auto p-3">
              {notifications.length ? (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (onOpenStudent && item.studentId) {
                          onOpenStudent(item.studentId, item.studentType);
                        }
                        onClose();
                      }}
                      className={`group w-full rounded-2xl border p-4 text-left shadow-[0_8px_20px_rgba(23,36,61,0.04)] transition hover:-translate-y-0.5 hover:border-[#E9802D]/40 ${priorityStyle(item.priority)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black text-[#17243D]">{item.title}</h4>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">{item.message}</p>
                        </div>

                        <span className="rounded-full border border-[#243A60]/14 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#596579]">
                          {item.priority}
                        </span>
                      </div>

                      <p className="mt-3 text-[11px] text-[#8992A1]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-[#243A60]/18 bg-white px-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E9802D]/35 bg-[#FFF1E3] text-2xl">🔔</div>
                  <h4 className="text-sm font-black text-[#17243D]">All clear</h4>
                  <p className="mt-2 text-xs leading-5 text-[#667085]">
                    No overdue reminders, urgent leads, or appointments need attention right now.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function priorityStyle(priority = "normal") {
  if (priority === "urgent") return "border-[#C2413B]/32 bg-[#FFF0EE]";
  if (priority === "high") return "border-[#A36A18]/30 bg-[#FFF7E8]";
  if (priority === "medium") return "border-[#E9802D]/30 bg-[#FFF1E3]";
  return "border-[#243A60]/18 bg-white";
}

export default CrmNotificationCenter;