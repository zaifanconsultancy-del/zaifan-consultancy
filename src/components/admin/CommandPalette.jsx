import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

function CommandPalette({
  activeTab,
  setActiveTab,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  permissions = {},
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const commands = useMemo(
    () => [
      {
        id: "inquiries",
        label: "Open Inquiries",
        description: `${inquiries.length} inquiry records`,
        icon: "📩",
        group: "CRM",
        keywords: "students leads inquiry pipeline records",
        action: () => setActiveTab("inquiries"),
      },
      {
        id: "appointments",
        label: "Open Appointments",
        description: `${appointments.length} appointment records`,
        icon: "📅",
        group: "CRM",
        keywords: "consultations bookings meetings students",
        action: () => setActiveTab("appointments"),
      },
      {
        id: "my-leads",
        label: "Open My Leads",
        description: "Assigned lead ownership dashboard",
        icon: "🎯",
        group: "CRM",
        keywords: "assigned ownership staff counselor",
        action: () => setActiveTab("my-leads"),
      },
      {
        id: "followups",
        label: "Open Follow-ups",
        description: `${followUpReminders.length} reminder records`,
        icon: "⏰",
        group: "Workflow",
        keywords: "reminders next actions pending overdue",
        action: () => setActiveTab("followups"),
      },
      {
        id: "notifications",
        label: "Open Notifications",
        description: "Realtime CRM alerts and updates",
        icon: "🔔",
        group: "Workflow",
        keywords: "alerts notification center bell updates",
        action: () => setActiveTab("notifications"),
      },
      {
        id: "automation",
        label: "Open Automation",
        description: "CRM automation and workflow engines",
        icon: "⚡",
        group: "Workflow",
        keywords: "engine auto reminders escalation stage movement",
        action: () => setActiveTab("automation"),
      },
      {
        id: "analytics",
        label: "Open Analytics",
        description: "KPI, staff, conversion, scoring and command center",
        icon: "📊",
        group: "Analytics",
        keywords: "dashboard reports kpi metrics conversion staff scoring",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "lead-health",
        label: "Open Lead Health",
        description: "Lead risk, health score and watchlist",
        icon: "❤️",
        group: "Analytics",
        keywords: "risk health monitor watchlist overdue decay",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "ai-actions",
        label: "Open AI Action Center",
        description: "AI counselor copilot and student intelligence",
        icon: "🤖",
        group: "AI",
        keywords: "copilot summary whatsapp email reminder generator",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "activity-logs",
        label: "Open Activity Logs",
        description: "Audit trail and admin activity history",
        icon: "🧾",
        group: "Admin",
        keywords: "logs audit history tracking",
        action: () => setActiveTab("activity-logs"),
      },
      ...(permissions.canManageAdmins
        ? [
            {
              id: "admin-management",
              label: "Open Admin Management",
              description: "Manage team roles and admin permissions",
              icon: "🛡️",
              group: "Admin",
              keywords: "roles permissions super admin staff users",
              action: () => setActiveTab("admin-management"),
            },
          ]
        : []),
      {
        id: "settings",
        label: "Open Settings",
        description: "CRM configuration and preferences",
        icon: "⚙️",
        group: "Admin",
        keywords: "configuration preferences setup",
        action: () => setActiveTab("settings"),
      },
    ],
    [
      appointments.length,
      followUpReminders.length,
      inquiries.length,
      permissions.canManageAdmins,
      setActiveTab,
    ]
  );

  const filteredCommands = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) return commands;

    return commands.filter((command) => {
      const searchable = [
        command.id,
        command.label,
        command.description,
        command.group,
        command.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(searchText);
    });
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce((groups, command) => {
      const groupName = command.group || "Commands";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(command);
      return groups;
    }, {});
  }, [filteredCommands]);

  const runCommand = (command) => {
    command.action();
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const shortcutPressed = isMac
        ? event.metaKey && key === "k"
        : event.ctrlKey && key === "k";

      if (shortcutPressed) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37] px-5 py-3 text-xs font-black text-black shadow-2xl shadow-[#D4AF37]/20 transition hover:bg-[#f1cf65]"
      >
        <span>⌘ / Ctrl K</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-3 pt-20 backdrop-blur-xl sm:px-4 sm:pt-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl shadow-black/60"
            >
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <span className="text-lg">🔎</span>

                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search pages, analytics, AI, reminders..."
                    className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-gray-600 sm:text-lg"
                  />

                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/45 transition hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="max-h-[58vh] overflow-y-auto p-3 sm:max-h-[430px]">
                {filteredCommands.length > 0 ? (
                  <div className="space-y-5">
                    {Object.entries(groupedCommands).map(
                      ([groupName, groupCommands]) => (
                        <div key={groupName}>
                          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#D4AF37]/70">
                            {groupName}
                          </p>

                          <div className="space-y-2">
                            {groupCommands.map((command) => {
                              const isActive = activeTab === command.id;

                              return (
                                <button
                                  key={command.id}
                                  type="button"
                                  onClick={() => runCommand(command)}
                                  className={`flex w-full items-center gap-4 rounded-[1.3rem] p-4 text-left transition ${
                                    isActive
                                      ? "border border-[#D4AF37]/30 bg-[#D4AF37]/10"
                                      : "border border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                                  }`}
                                >
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl">
                                    {command.icon}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-black text-white">
                                      {command.label}
                                    </h4>

                                    <p className="mt-1 truncate text-xs text-gray-500">
                                      {command.description}
                                    </p>
                                  </div>

                                  {isActive ? (
                                    <span className="hidden rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] sm:inline-flex">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="hidden text-xs text-white/25 sm:block">
                                      Enter
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-14 text-center">
                    <p className="text-3xl">🔎</p>

                    <h4 className="mt-3 text-lg font-black text-white">
                      No command found
                    </h4>

                    <p className="mt-2 text-sm text-gray-500">
                      Try searching analytics, AI, reminders, leads, or
                      settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 px-5 py-3 text-[11px] text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <span>Press Ctrl K / Cmd K to open</span>
                <span>Esc to close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CommandPalette;