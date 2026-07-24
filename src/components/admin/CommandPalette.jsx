// CommandPalette V5 COMPACT MAXIMUM — Zaifan Admin OS
// src/components/admin/CommandPalette.jsx
//
// Direction:
// Keep the original compact command-palette feel, but upgrade the functionality
// to maximum production quality without turning it into a dashboard.
//
// Maximum pass:
// - preserves existing prop API
// - compact modal size and old visual density
// - Ctrl/Cmd + K global shortcut
// - ArrowUp / ArrowDown keyboard navigation
// - Enter to execute selected command
// - Escape to close
// - selected-command highlight
// - focus restoration after close
// - focus input on open
// - body scroll lock while open
// - permission-aware Admin Management command
// - multi-token search across labels/descriptions/groups/keywords
// - active-tab awareness, including commands that share the analytics tab
// - accessible dialog/listbox semantics
// - reduced-motion support
// - mobile-safe max height
// - Lucide icons instead of emojis
// - explicit white text on navy surfaces
// - preserves the familiar lightweight command-palette look

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Command,
  Gauge,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function CommandPalette({
  activeTab,
  setActiveTab,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  permissions = {},
}) {
  const shouldReduceMotion = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const optionRefs = useRef({});

  const inquiryCount = safeArray(inquiries).length;
  const appointmentCount = safeArray(appointments).length;
  const reminderCount = safeArray(followUpReminders).length;

  const commands = useMemo(
    () => [
      {
        id: "inquiries",
        targetTab: "inquiries",
        label: "Open Inquiries",
        description: `${inquiryCount} inquiry record${
          inquiryCount === 1 ? "" : "s"
        }`,
        icon: Users,
        group: "CRM",
        keywords:
          "students leads inquiry pipeline records new leads",
        action: () => setActiveTab("inquiries"),
      },
      {
        id: "appointments",
        targetTab: "appointments",
        label: "Open Appointments",
        description: `${appointmentCount} appointment record${
          appointmentCount === 1 ? "" : "s"
        }`,
        icon: CalendarDays,
        group: "CRM",
        keywords:
          "consultations bookings meetings students calendar",
        action: () => setActiveTab("appointments"),
      },
      {
        id: "my-leads",
        targetTab: "my-leads",
        label: "Open My Leads",
        description:
          "Assigned lead ownership dashboard",
        icon: Target,
        group: "CRM",
        keywords:
          "assigned ownership staff counselor leads",
        action: () => setActiveTab("my-leads"),
      },
      {
        id: "followups",
        targetTab: "followups",
        label: "Open Follow-ups",
        description: `${reminderCount} reminder record${
          reminderCount === 1 ? "" : "s"
        }`,
        icon: Clock3,
        group: "Workflow",
        keywords:
          "reminders next actions pending overdue follow up",
        action: () => setActiveTab("followups"),
      },
      {
        id: "notifications",
        targetTab: "notifications",
        label: "Open Notifications",
        description:
          "Realtime CRM alerts and updates",
        icon: Bell,
        group: "Workflow",
        keywords:
          "alerts notification center bell updates realtime",
        action: () => setActiveTab("notifications"),
      },
      {
        id: "automation",
        targetTab: "automation",
        label: "Open Automation",
        description:
          "CRM automation and workflow engines",
        icon: Workflow,
        group: "Workflow",
        keywords:
          "engine auto reminders escalation stage movement pipeline automation",
        action: () => setActiveTab("automation"),
      },
      {
        id: "analytics",
        targetTab: "analytics",
        label: "Open Analytics",
        description:
          "KPI, staff, conversion, scoring and command center",
        icon: BarChart3,
        group: "Analytics",
        keywords:
          "dashboard reports kpi metrics conversion staff scoring forecast",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "lead-health",
        targetTab: "analytics",
        label: "Open Lead Health",
        description:
          "Lead risk, health score and watchlist",
        icon: Gauge,
        group: "Analytics",
        keywords:
          "risk health monitor watchlist overdue decay lead health",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "ai-actions",
        targetTab: "analytics",
        label: "Open AI Action Center",
        description:
          "Counselor copilot and student intelligence",
        icon: Bot,
        group: "AI",
        keywords:
          "copilot summary whatsapp email reminder generator intelligence gpt",
        action: () => setActiveTab("analytics"),
      },
      {
        id: "activity-logs",
        targetTab: "activity-logs",
        label: "Open Activity Logs",
        description:
          "Audit trail and admin activity history",
        icon: Activity,
        group: "Admin",
        keywords:
          "logs audit history tracking actions timeline",
        action: () => setActiveTab("activity-logs"),
      },
      ...(permissions?.canManageAdmins
        ? [
            {
              id: "admin-management",
              targetTab: "admin-management",
              label: "Open Admin Management",
              description:
                "Manage team roles and admin permissions",
              icon: ShieldCheck,
              group: "Admin",
              keywords:
                "roles permissions super admin staff users access security",
              action: () =>
                setActiveTab("admin-management"),
            },
          ]
        : []),
      {
        id: "settings",
        targetTab: "settings",
        label: "Open Settings",
        description:
          "CRM configuration and preferences",
        icon: Settings,
        group: "Admin",
        keywords:
          "configuration preferences setup settings",
        action: () => setActiveTab("settings"),
      },
    ],
    [
      appointmentCount,
      inquiryCount,
      reminderCount,
      permissions?.canManageAdmins,
      setActiveTab,
    ]
  );

  const filteredCommands = useMemo(() => {
    const searchText = query
      .trim()
      .toLowerCase();

    if (!searchText) return commands;

    const tokens = searchText
      .split(/\s+/)
      .filter(Boolean);

    return commands.filter((command) => {
      const searchable = [
        command.id,
        command.targetTab,
        command.label,
        command.description,
        command.group,
        command.keywords,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return tokens.every((token) =>
        searchable.includes(token)
      );
    });
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce(
      (groups, command) => {
        const groupName =
          command.group || "Commands";

        if (!groups[groupName]) {
          groups[groupName] = [];
        }

        groups[groupName].push(command);
        return groups;
      },
      {}
    );
  }, [filteredCommands]);

  const activeCommand =
    filteredCommands[selectedIndex] || null;

  const closePalette = ({
    restoreFocus = true,
  } = {}) => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);

    if (restoreFocus) {
      window.setTimeout(() => {
        launcherRef.current?.focus();
      }, 0);
    }
  };

  const runCommand = (command) => {
    if (
      !command ||
      typeof command.action !== "function"
    ) {
      return;
    }

    command.action();
    closePalette();
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const timer = window.setTimeout(
      () => {
        inputRef.current?.focus();
      },
      shouldReduceMotion ? 0 : 60
    );

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open, shouldReduceMotion]);

  useEffect(() => {
    if (!open || !activeCommand) return;

    optionRefs.current[
      activeCommand.id
    ]?.scrollIntoView({
      block: "nearest",
      behavior: shouldReduceMotion
        ? "auto"
        : "smooth",
    });
  }, [
    activeCommand,
    open,
    shouldReduceMotion,
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = String(
        event.key || ""
      ).toLowerCase();

      const shortcutPressed =
        (event.ctrlKey ||
          event.metaKey) &&
        key === "k";

      if (shortcutPressed) {
        event.preventDefault();

        setOpen((current) => {
          const next = !current;

          if (!next) {
            setQuery("");
            setSelectedIndex(0);
          }

          return next;
        });

        return;
      }

      if (
        event.key === "Escape" &&
        open
      ) {
        event.preventDefault();
        closePalette();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [open]);

  const handlePaletteKeyDown = (
    event
  ) => {
    if (!filteredCommands.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setSelectedIndex((current) =>
        current >=
        filteredCommands.length - 1
          ? 0
          : current + 1
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setSelectedIndex((current) =>
        current <= 0
          ? filteredCommands.length - 1
          : current - 1
      );

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      runCommand(
        filteredCommands[selectedIndex]
      );
    }
  };

  return (
    <>
      <motion.button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        whileTap={
          shouldReduceMotion
            ? undefined
            : { scale: 0.96 }
        }
        aria-label="Open Admin command palette"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border-2 border-orange-600 bg-orange-500 px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200"
      >
        <Command
          size={14}
          className="text-white"
        />

        <span className="text-white">
          Ctrl K
        </span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0 }
            }
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration:
                shouldReduceMotion
                  ? 0
                  : 0.15,
            }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#10233f]/65 px-3 pt-14 backdrop-blur-md sm:px-4 sm:pt-20"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closePalette();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Admin command palette"
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 12,
                      scale: 0.98,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
              }}
              transition={{
                duration:
                  shouldReduceMotion
                    ? 0
                    : 0.17,
                ease: [0.22, 1, 0.36, 1],
              }}
              onKeyDown={
                handlePaletteKeyDown
              }
              className="w-full max-w-2xl overflow-hidden rounded-[1.7rem] border-[3px] border-orange-300 bg-[#fffaf2] shadow-[0_22px_70px_rgba(0,0,0,0.34)]"
            >
              <div className="border-b-2 border-orange-200 bg-white p-3 sm:p-4">
                <div className="flex items-center gap-3 rounded-[1.1rem] border-2 border-slate-300 bg-white px-3 py-2.5 transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                  <Search
                    size={17}
                    className="shrink-0 text-orange-700"
                  />

                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) =>
                      setQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search pages, analytics, AI, reminders..."
                    autoComplete="off"
                    aria-label="Search Admin commands"
                    aria-controls="admin-command-results"
                    aria-activedescendant={
                      activeCommand
                        ? `command-option-${activeCommand.id}`
                        : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#10233f] outline-none placeholder:text-slate-400 sm:text-base"
                  />

                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        inputRef.current?.focus();
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-slate-300 bg-[#fffaf4] text-slate-500 transition hover:border-orange-300 hover:text-orange-700"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                id="admin-command-results"
                role="listbox"
                aria-label="Available Admin commands"
                className="max-h-[62vh] overflow-y-auto p-2.5 sm:max-h-[470px] sm:p-3"
              >
                {filteredCommands.length ? (
                  <div className="space-y-4">
                    {Object.entries(
                      groupedCommands
                    ).map(
                      ([
                        groupName,
                        groupCommands,
                      ]) => (
                        <section
                          key={groupName}
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-3 px-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                              {groupName}
                            </p>

                            <span className="text-[9px] font-black text-slate-400">
                              {
                                groupCommands.length
                              }
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {groupCommands.map(
                              (
                                command
                              ) => {
                                const Icon =
                                  command.icon;

                                const globalIndex =
                                  filteredCommands.findIndex(
                                    (
                                      item
                                    ) =>
                                      item.id ===
                                      command.id
                                  );

                                const selected =
                                  globalIndex ===
                                  selectedIndex;

                                const isActive =
                                  activeTab ===
                                  command.targetTab;

                                return (
                                  <button
                                    id={`command-option-${command.id}`}
                                    ref={(
                                      node
                                    ) => {
                                      if (
                                        node
                                      ) {
                                        optionRefs.current[
                                          command.id
                                        ] =
                                          node;
                                      }
                                    }}
                                    role="option"
                                    aria-selected={
                                      selected
                                    }
                                    key={
                                      command.id
                                    }
                                    type="button"
                                    onMouseEnter={() =>
                                      setSelectedIndex(
                                        globalIndex
                                      )
                                    }
                                    onClick={() =>
                                      runCommand(
                                        command
                                      )
                                    }
                                    className={`flex w-full items-center gap-3 rounded-[1.05rem] border-2 px-3 py-2.5 text-left transition ${
                                      selected
                                        ? "border-orange-500 bg-orange-50"
                                        : "border-transparent bg-transparent hover:border-orange-300 hover:bg-orange-50/70"
                                    }`}
                                  >
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
                                        isActive
                                          ? "border-[#123866] bg-[#123866] text-white"
                                          : "border-slate-300 bg-white text-orange-700"
                                      }`}
                                    >
                                      <Icon
                                        size={
                                          15
                                        }
                                      />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-black text-[#10233f]">
                                          {
                                            command.label
                                          }
                                        </h4>

                                        {isActive ? (
                                          <span className="inline-flex items-center gap-1 rounded-full border-2 border-orange-500 bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] text-orange-700">
                                            <Check
                                              size={
                                                9
                                              }
                                            />
                                            Active
                                          </span>
                                        ) : null}
                                      </div>

                                      <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                                        {
                                          command.description
                                        }
                                      </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                      {!isActive ? (
                                        <span className="hidden text-[9px] font-bold text-slate-300 sm:inline">
                                          Enter
                                        </span>
                                      ) : null}

                                      <ChevronRight
                                        size={
                                          13
                                        }
                                        className={
                                          selected
                                            ? "text-orange-600"
                                            : "text-slate-300"
                                        }
                                      />
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </section>
                      )
                    )}
                  </div>
                ) : (
                  <EmptyState
                    query={query}
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 border-t-2 border-orange-200 bg-white px-4 py-2.5 text-[9px] font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  ↑ ↓ navigate · Enter open
                </span>
                <span>
                  Ctrl/Cmd K · Esc close
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ query }) {
  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Search size={19} />
      </div>

      <h4 className="mt-3 text-base font-black text-[#10233f]">
        No command found
      </h4>

      <p className="mx-auto mt-1.5 max-w-sm text-xs font-semibold leading-5 text-slate-500">
        {query
          ? `Nothing matches "${query}". Try analytics, AI, reminders, leads or settings.`
          : "No Admin commands are available."}
      </p>
    </div>
  );
}

export default CommandPalette;
