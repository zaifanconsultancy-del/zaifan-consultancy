// CrmNotificationCenter V4 MAXIMUM — Live CRM Notification Command Drawer
// src/components/admin/CrmNotificationCenter.jsx
//
// Maximum pass:
// - preserves open / notifications / onClose / onOpenStudent API
// - keeps compact notification-center behavior (not a dashboard)
// - safer notification normalization
// - real unread semantics when read/is_read/read_at exists
// - priority sorting + newest-first fallback
// - keyboard Escape close
// - body scroll lock while open
// - focus restoration to previously focused element
// - click-outside overlay close preserved
// - safer student opening with guarded callback
// - search + priority filter for larger alert volumes
// - active alert / unread / urgent counts
// - date formatting hardened
// - reduced-motion support
// - accessible dialog semantics
// - replaces emoji bell with Lucide icon
// - explicit white text on navy surfaces
// - stronger Zaifan Admin OS orange/navy visual system
//
// NOTE:
// This component is intentionally read-only. It displays notification data
// provided by the parent. It does not invent Supabase writes for read/dismiss
// state because no mutation callbacks currently exist in this API.

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
  Sparkles,
  UserRoundSearch,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const PRIORITY_ORDER = {
  urgent: 4,
  critical: 4,
  high: 3,
  medium: 2,
  normal: 1,
  low: 0,
};

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function validDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = validDate(value);

  if (!date) return "Just now";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUnread(item = {}) {
  if (typeof item.is_read === "boolean") {
    return !item.is_read;
  }

  if (typeof item.read === "boolean") {
    return !item.read;
  }

  if (item.read_at) {
    return false;
  }

  // Existing notification payloads had no read field, so preserve prior
  // behavior by treating them as active/unread.
  return true;
}

function getPriority(item = {}) {
  const priority = normalize(
    item.priority ||
      item.severity ||
      item.level ||
      "normal"
  );

  if (priority === "critical") return "urgent";
  if (priority === "urgent") return "urgent";
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  if (priority === "low") return "low";

  return "normal";
}

function getCreatedAt(item = {}) {
  return (
    item.createdAt ||
    item.created_at ||
    item.timestamp ||
    item.date ||
    null
  );
}

function getStudentId(item = {}) {
  return (
    item.studentId ||
    item.student_id ||
    item.leadId ||
    item.lead_id ||
    null
  );
}

function getStudentType(item = {}) {
  return (
    item.studentType ||
    item.student_type ||
    item.leadType ||
    item.lead_type ||
    null
  );
}

function CrmNotificationCenter({
  open = false,
  notifications = [],
  onClose = () => {},
  onOpenStudent = null,
}) {
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const searchRef = useRef(null);
  const previousFocusRef = useRef(null);

  const normalizedNotifications = useMemo(() => {
    const source = Array.isArray(notifications)
      ? notifications
      : [];

    return source
      .map((item, index) => {
        const priority = getPriority(item);
        const createdAt = getCreatedAt(item);
        const createdDate = validDate(createdAt);

        return {
          ...item,
          __id:
            item.id ||
            `${priority}-${createdAt || "now"}-${index}`,
          __priority: priority,
          __createdAt: createdAt,
          __createdTime: createdDate?.getTime() || 0,
          __unread: isUnread(item),
          __studentId: getStudentId(item),
          __studentType: getStudentType(item),
          __title:
            item.title ||
            item.name ||
            "CRM Alert",
          __message:
            item.message ||
            item.description ||
            "This CRM alert needs review.",
        };
      })
      .sort((a, b) => {
        const priorityDifference =
          (PRIORITY_ORDER[b.__priority] || 0) -
          (PRIORITY_ORDER[a.__priority] || 0);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return b.__createdTime - a.__createdTime;
      });
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const searchText = query
      .trim()
      .toLowerCase();

    return normalizedNotifications.filter((item) => {
      if (
        priorityFilter !== "all" &&
        item.__priority !== priorityFilter
      ) {
        return false;
      }

      if (!searchText) {
        return true;
      }

      const searchable = [
        item.__title,
        item.__message,
        item.__priority,
        item.__studentType,
        item.studentName,
        item.student_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(searchText);
    });
  }, [
    normalizedNotifications,
    query,
    priorityFilter,
  ]);

  const counts = useMemo(() => {
    const unread = normalizedNotifications.filter(
      (item) => item.__unread
    ).length;

    const urgent = normalizedNotifications.filter(
      (item) => item.__priority === "urgent"
    ).length;

    const high = normalizedNotifications.filter(
      (item) => item.__priority === "high"
    ).length;

    return {
      total: normalizedNotifications.length,
      unread,
      urgent,
      high,
    };
  }, [normalizedNotifications]);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current =
      document.activeElement;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, reduceMotion ? 0 : 80);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.clearTimeout(timer);

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;

      window.setTimeout(() => {
        previousFocusRef.current?.focus?.();
      }, 0);
    };
  }, [open, onClose, reduceMotion]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPriorityFilter("all");
    }
  }, [open]);

  const openNotification = (item) => {
    if (
      typeof onOpenStudent === "function" &&
      item.__studentId
    ) {
      try {
        onOpenStudent(
          item.__studentId,
          item.__studentType
        );
      } catch (error) {
        console.error(
          "Notification student navigation failed:",
          error
        );
      }
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            onClick={onClose}
            initial={
              reduceMotion
                ? false
                : { opacity: 0 }
            }
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration:
                reduceMotion
                  ? 0
                  : 0.14,
            }}
            className="fixed inset-0 z-40 cursor-default bg-[#10233f]/45 backdrop-blur-[2px]"
            aria-label="Close notifications"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="CRM notifications"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: -10,
                    scale: 0.985,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -10,
              scale: 0.985,
            }}
            transition={{
              duration:
                reduceMotion
                  ? 0
                  : 0.17,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="absolute right-0 top-14 z-50 w-[min(94vw,440px)] overflow-hidden rounded-[1.75rem] border-[3px] border-orange-300 bg-white shadow-[0_26px_80px_rgba(15,35,63,0.24)]"
          >
            <header className="bg-[#123866] p-4 text-white sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
                    <BellRing size={17} />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      CRM Alerts
                    </p>

                    <h3 className="mt-1 text-lg font-black text-white">
                      Smart Notifications
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-white">
                      {counts.unread
                        ? `${counts.unread} unread / active alert${
                            counts.unread === 1 ? "" : "s"
                          }`
                        : "No unread alerts"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Close notification center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <HeaderMetric
                  label="Total"
                  value={counts.total}
                />

                <HeaderMetric
                  label="Urgent"
                  value={counts.urgent}
                />

                <HeaderMetric
                  label="High"
                  value={counts.high}
                />
              </div>
            </header>

            <div className="border-b-2 border-orange-200 bg-[#fff8ee] p-3">
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search CRM alerts..."
                  className="h-10 w-full rounded-xl border-2 border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {[
                  ["all", "All"],
                  ["urgent", "Urgent"],
                  ["high", "High"],
                  ["medium", "Medium"],
                  ["normal", "Normal"],
                ].map(
                  ([value, label]) => {
                    const active =
                      priorityFilter === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setPriorityFilter(
                            value
                          )
                        }
                        className={`shrink-0 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] transition ${
                          active
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:border-orange-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="max-h-[470px] overflow-y-auto bg-[#fffaf4] p-3">
              {filteredNotifications.length ? (
                <div className="space-y-2.5">
                  {filteredNotifications.map(
                    (item, index) => (
                      <NotificationRow
                        key={item.__id}
                        item={item}
                        index={index}
                        reduceMotion={
                          reduceMotion
                        }
                        onOpen={() =>
                          openNotification(
                            item
                          )
                        }
                        canOpenStudent={Boolean(
                          onOpenStudent &&
                            item.__studentId
                        )}
                      />
                    )
                  )}
                </div>
              ) : normalizedNotifications.length ? (
                <FilteredEmptyState />
              ) : (
                <AllClearState />
              )}
            </div>

            <footer className="border-t-2 border-orange-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-[9px] font-bold text-slate-500">
                <span>
                  Sorted by priority, then newest
                </span>

                <span>
                  Esc closes
                </span>
              </div>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function NotificationRow({
  item,
  index,
  reduceMotion,
  onOpen,
  canOpenStudent,
}) {
  const style =
    getPriorityStyle(
      item.__priority
    );

  const Icon =
    item.__priority === "urgent"
      ? ShieldAlert
      : item.__priority === "high"
      ? AlertTriangle
      : item.__priority === "medium"
      ? Zap
      : Sparkles;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 7,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.18,
        delay:
          reduceMotion
            ? 0
            : Math.min(
                index * 0.02,
                0.1
              ),
      }}
      className={`group w-full rounded-[1.2rem] border-2 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-[0_7px_18px_rgba(15,35,63,0.045)] ${style.card}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 bg-white ${style.icon}`}
        >
          <Icon size={15} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-[#10233f]">
                  {item.__title}
                </h4>

                {item.__unread ? (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-orange-500"
                    aria-label="Unread notification"
                  />
                ) : null}
              </div>

              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                {item.__message}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full border-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.07em] ${style.badge}`}
            >
              {item.__priority}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
              <Clock3 size={11} />
              {formatDateTime(
                item.__createdAt
              )}
            </span>

            {canOpenStudent ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-700">
                <UserRoundSearch size={11} />
                Open student
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400">
                Alert only
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function HeaderMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-2.5 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function AllClearState() {
  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center rounded-[1.4rem] border-[3px] border-emerald-300 bg-emerald-50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
        <CheckCircle2 size={22} />
      </div>

      <h4 className="mt-4 text-base font-black text-[#10233f]">
        All clear
      </h4>

      <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-slate-600">
        No active CRM alerts are currently being supplied to the notification center.
      </p>
    </div>
  );
}

function FilteredEmptyState() {
  return (
    <div className="flex min-h-[210px] flex-col items-center justify-center rounded-[1.4rem] border-[3px] border-slate-300 bg-white px-6 text-center">
      <Search
        size={20}
        className="text-orange-600"
      />

      <h4 className="mt-3 text-sm font-black text-[#10233f]">
        No matching alerts
      </h4>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        Alerts exist, but none match the current search or priority filter.
      </p>
    </div>
  );
}

function getPriorityStyle(priority = "normal") {
  if (priority === "urgent") {
    return {
      card:
        "border-red-300 bg-red-50",
      icon:
        "border-red-300 text-red-700",
      badge:
        "border-red-300 bg-white text-red-800",
    };
  }

  if (priority === "high") {
    return {
      card:
        "border-amber-300 bg-amber-50",
      icon:
        "border-amber-300 text-amber-800",
      badge:
        "border-amber-300 bg-white text-amber-900",
    };
  }

  if (priority === "medium") {
    return {
      card:
        "border-orange-300 bg-orange-50",
      icon:
        "border-orange-300 text-orange-700",
      badge:
        "border-orange-300 bg-white text-orange-800",
    };
  }

  if (priority === "low") {
    return {
      card:
        "border-emerald-300 bg-emerald-50",
      icon:
        "border-emerald-300 text-emerald-700",
      badge:
        "border-emerald-300 bg-white text-emerald-800",
    };
  }

  return {
    card:
      "border-slate-300 bg-white",
    icon:
      "border-blue-300 text-blue-700",
    badge:
      "border-slate-300 bg-[#fffaf4] text-slate-600",
  };
}

export default CrmNotificationCenter;
