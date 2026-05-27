import { motion } from "framer-motion";

function AdminSidebar({
  activeTab,
  setActiveTab,
  logout,
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const safePermissions = {
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    ...permissions,
  };

  const roleConfig = {
    staff: {
      label: "Staff",
      icon: "🧑‍💼",
      badge: "border-blue-400/20 bg-blue-500/10 text-blue-300",
      description: "Focused lead follow-up",
      glow: "bg-blue-500/10 shadow-[0_0_35px_rgba(59,130,246,0.08)]",
      dot: "bg-blue-400",
    },
    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
      description: "Operations access",
      glow: "bg-[#D4AF37]/10 shadow-[0_0_35px_rgba(212,175,55,0.08)]",
      dot: "bg-[#D4AF37]",
    },
    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-purple-400/25 bg-purple-500/10 text-purple-300",
      description: "Full system control",
      glow: "bg-purple-500/10 shadow-[0_0_35px_rgba(168,85,247,0.08)]",
      dot: "bg-purple-400",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;

  const navGroups = [
    {
      title: "Workspace",
      items: [
  { id: "inquiries", label: "Inquiries", icon: "📩", locked: false },
  { id: "appointments", label: "Appointments", icon: "📅", locked: false },
  { id: "my-leads", label: "My Leads", icon: "🎯", locked: false },
  { id: "followups", label: "Follow-ups", icon: "⏰", locked: false },
],
    },
    {
      title: "Intelligence",
      items: [
        { id: "analytics", label: "Analytics", icon: "📊", locked: false },
      ],
    },
    {
      title: "System",
      items: [
        {
          id: "admin-management",
          label: "Admin Management",
          icon: "👑",
          locked: !safePermissions.canManageAdmins,
          lockText: "Only Super Admin can manage admins.",
        },
        {
          id: "activity-logs",
          label: "Activity Logs",
          icon: "🧾",
          locked: !safePermissions.canManageAdmins,
          lockText: "Only Super Admin can view activity logs.",
        },
        {
          id: "settings",
          label: "Settings",
          icon: "⚙️",
          locked: !safePermissions.canManageAdmins,
          lockText: "Only Super Admin can open settings.",
        },
      ],
    },
  ];

  const navItems = navGroups.flatMap((group) => group.items);
  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleTabClick = (item) => {
    if (item.locked) {
      alert(item.lockText || "This section is locked for your role.");
      return;
    }

    setActiveTab(item.id);
  };

  const openWebsite = () => {
    window.open("/", "_blank");
  };

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 px-3 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl xl:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">
              Zaifan CRM
            </p>

            <h2 className="mt-1 truncate text-xl font-black text-white">
              {activeItem?.icon} {activeItem?.label || "CRM Panel"}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`hidden rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] sm:inline-flex ${currentRole.badge}`}
            >
              {currentRole.icon} {currentRole.label}
            </span>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition duration-300 hover:bg-red-500/20 active:scale-95"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mobile-crm-tabs flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item)}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-semibold transition duration-300 active:scale-95 ${
                  item.locked
                    ? "border border-white/10 bg-white/[0.02] text-gray-600"
                    : isActive
                    ? "bg-[#D4AF37] text-black shadow-[0_0_24px_rgba(212,175,55,0.25)]"
                    : "border border-white/10 bg-white/[0.04] text-gray-400 hover:border-[#D4AF37]/25 hover:text-white"
                }`}
              >
                {item.icon} {item.label} {item.locked ? "🔒" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 overflow-hidden border-r border-white/10 bg-[#070707]/90 shadow-[25px_0_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl xl:flex xl:flex-col">
        <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-[#D4AF37]/5 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-[#D4AF37]/4 blur-3xl"></div>

        <div className="premium-sidebar-scroll relative flex-1 overflow-y-auto px-5 py-5 scroll-smooth">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl"
          >
            <div className="inline-flex rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#D4AF37]">
              Zaifan
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
              CRM Panel
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Premium student management workspace.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/25 p-5"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-2xl ${currentRole.glow}`}
              >
                {currentRole.icon}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-white">
                  {adminProfile?.full_name || "Admin User"}
                </h3>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {currentRole.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${currentRole.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`}></span>
                {currentRole.label}
              </div>

              {safePermissions.canManageAdmins && (
                <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-purple-300">
                  Owner Tools
                </span>
              )}
            </div>
          </motion.div>

          <div className="space-y-5 pb-6">
            {navGroups.map((group, groupIndex) => (
              <div key={group.title}>
                <div className="mb-2 flex items-center gap-3 px-2">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-gray-600">
                    {group.title}
                  </p>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>

                <div className="space-y-2.5">
                  {group.items.map((item, index) => {
                    const isActive = activeTab === item.id;
                    const delay = groupIndex * 0.08 + index * 0.04;

                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay }}
                        onClick={() => handleTabClick(item)}
                        title={item.locked ? item.lockText : item.label}
                        className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-4 text-left text-sm font-semibold transition duration-300 active:scale-[0.98] ${
                          item.locked
                            ? "cursor-not-allowed border border-white/10 bg-white/[0.02] text-gray-600"
                            : isActive
                            ? "bg-[#D4AF37] text-black shadow-[0_0_28px_rgba(212,175,55,0.22)]"
                            : "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#D4AF37]/25 hover:bg-white/[0.055] hover:text-white"
                        }`}
                      >
                        {!item.locked && !isActive && (
                          <span className="absolute inset-y-0 left-0 w-[3px] scale-y-0 bg-[#D4AF37] transition duration-300 group-hover:scale-y-100"></span>
                        )}

                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base transition duration-300 ${
                              isActive
                                ? "border-black/10 bg-black/10"
                                : item.locked
                                ? "border-white/10 bg-white/[0.02]"
                                : "border-white/10 bg-black/20 group-hover:border-[#D4AF37]/20"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>

                        <span className="ml-3 shrink-0 text-xs opacity-80">
                          {item.locked ? "🔒" : isActive ? "●" : "›"}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-[#050505]/95 p-5 backdrop-blur-2xl">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
              Current View
            </p>
            <p className="mt-2 truncate text-sm font-black text-white">
              {activeItem?.icon} {activeItem?.label}
            </p>
          </div>

          <div className="grid gap-3">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              onClick={openWebsite}
              className="w-full rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-4 text-sm font-semibold text-[#D4AF37] transition duration-300 hover:-translate-y-0.5 hover:bg-[#D4AF37]/15 active:scale-95"
            >
              🌐 Open Website
            </motion.button>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              onClick={logout}
              className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-400 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/20 active:scale-95"
            >
              Logout
            </motion.button>
          </div>
        </div>

        <style>{`
          .premium-sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(212, 175, 55, 0.32) rgba(255, 255, 255, 0.03);
          }

          .premium-sidebar-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .premium-sidebar-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.025);
            border-radius: 999px;
            margin: 18px 0;
          }

          .premium-sidebar-scroll::-webkit-scrollbar-thumb {
            min-height: 56px;
            background: linear-gradient(
              180deg,
              rgba(212, 175, 55, 0.18),
              rgba(212, 175, 55, 0.45),
              rgba(212, 175, 55, 0.18)
            );
            border: 2px solid rgba(5, 5, 5, 0.9);
            border-radius: 999px;
          }

          .premium-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(
              180deg,
              rgba(212, 175, 55, 0.28),
              rgba(212, 175, 55, 0.65),
              rgba(212, 175, 55, 0.28)
            );
          }

          .mobile-crm-tabs {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .mobile-crm-tabs::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </aside>
    </>
  );
}

export default AdminSidebar;