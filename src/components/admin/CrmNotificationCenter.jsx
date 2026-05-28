import { motion, AnimatePresence } from "framer-motion";

function CrmNotificationCenter({
  open = false,
  notifications = [],
  onClose = () => {},
  onOpenStudent = null,
}) {
  const unreadCount = notifications.length;

  const priorityClass = {
    urgent: "border-red-400/40 bg-red-500/10 text-red-200",
    high: "border-orange-400/40 bg-orange-500/10 text-orange-200",
    medium: "border-yellow-400/40 bg-yellow-500/10 text-yellow-200",
    normal: "border-white/10 bg-white/[0.04] text-white/70",
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <button
            type="button"
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            aria-label="Close notifications"
          />

          <motion.aside
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-14 z-50 w-[min(92vw,420px)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090909]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Smart Notifications
                  </h3>
                  <p className="mt-1 text-xs text-white/45">
                    {unreadCount
                      ? `${unreadCount} CRM alert${unreadCount > 1 ? "s" : ""}`
                      : "No active alerts"}
                  </p>
                </div>

                <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#F5D76E]">
                  Live
                </span>
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
                      className={`group w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/35 hover:bg-white/[0.07] ${
                        priorityClass[item.priority] || priorityClass.normal
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {item.title}
                          </h4>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60">
                            {item.message}
                          </p>
                        </div>

                        <span className="rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                          {item.priority}
                        </span>
                      </div>

                      <p className="mt-3 text-[11px] text-white/35">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "Just now"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-2xl">
                    🔔
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    All clear
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    No overdue reminders, urgent leads, or appointments need
                    attention right now.
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

export default CrmNotificationCenter;