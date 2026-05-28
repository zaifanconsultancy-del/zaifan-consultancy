import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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

  const commands = useMemo(
    () => [
      {
        id: "inquiries",
        label: "Open Inquiries",
        description: `${inquiries.length} inquiry records`,
        icon: "📩",
        action: () => setActiveTab("inquiries"),
      },
      {
        id: "appointments",
        label: "Open Appointments",
        description: `${appointments.length} appointment records`,
        icon: "📅",
        action: () => setActiveTab("appointments"),
      },
      {
        id: "analytics",
        label: "Open Analytics",
        description: "KPI, staff, conversion, scoring and command center",
        icon: "📊",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "followups",
        label: "Open Follow-ups",
        description: `${followUpReminders.length} reminder records`,
        icon: "⏰",
        action: () => setActiveTab("followups"),
      },
      {
        id: "automation",
        label: "Open Automation",
        description: "CRM automation and workflow engines",
        icon: "⚡",
        action: () => setActiveTab("automation"),
      },
      {
        id: "my-leads",
        label: "Open My Leads",
        description: "Assigned lead ownership dashboard",
        icon: "🎯",
        action: () => setActiveTab("my-leads"),
      },
      {
        id: "activity-logs",
        label: "Open Activity Logs",
        description: "Audit trail and admin activity history",
        icon: "🧾",
        action: () => setActiveTab("activity-logs"),
      },
      ...(permissions.canManageAdmins
        ? [
            {
              id: "admin-management",
              label: "Open Admin Management",
              description: "Manage team roles and admin permissions",
              icon: "🛡️",
              action: () => setActiveTab("admin-management"),
            },
          ]
        : []),
      {
        id: "settings",
        label: "Open Settings",
        description: "CRM configuration and preferences",
        icon: "⚙️",
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

  const filteredCommands = commands.filter((command) => {
    const searchText = query.toLowerCase();

    return (
      command.label.toLowerCase().includes(searchText) ||
      command.description.toLowerCase().includes(searchText) ||
      command.id.toLowerCase().includes(searchText)
    );
  });

  const runCommand = (command) => {
    command.action();
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const shortcutPressed = isMac
        ? event.metaKey && event.key.toLowerCase() === "k"
        : event.ctrlKey && event.key.toLowerCase() === "k";

      if (shortcutPressed) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
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
        className="fixed bottom-5 right-5 z-40 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37] px-5 py-3 text-xs font-black text-black shadow-2xl shadow-[#D4AF37]/20 transition hover:bg-[#f1cf65]"
      >
        ⌘ / Ctrl K
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl shadow-black/60"
            >
              <div className="border-b border-white/10 p-4">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search commands, pages, analytics..."
                  className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-gray-600"
                />
              </div>

              <div className="max-h-[420px] overflow-y-auto p-3">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((command) => {
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

                        {isActive && (
                          <span className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-14 text-center">
                    <p className="text-3xl">🔎</p>
                    <h4 className="mt-3 text-lg font-black text-white">
                      No command found
                    </h4>
                    <p className="mt-2 text-sm text-gray-500">
                      Try searching analytics, leads, follow-ups, or settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-gray-500">
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