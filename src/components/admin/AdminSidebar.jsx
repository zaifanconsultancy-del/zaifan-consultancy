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
      description: "Limited CRM access",
    },

    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
      description: "Management access",
    },

    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-purple-400/25 bg-purple-500/10 text-purple-300",
      description: "Full system control",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;

  const navItems = [
    {
      id: "inquiries",
      label: "Inquiries",
      icon: "📨",
      locked: false,
    },

    {
      id: "appointments",
      label: "Appointments",
      icon: "📅",
      locked: false,
    },

    {
      id: "my-leads",
      label: "My Leads",
      icon: "📌",
      locked: false,
    },

    {
      id: "analytics",
      label: "Analytics",
      icon: "📊",
      locked: false,
    },

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
  ];

  const handleTabClick = (item) => {
    if (item.locked) {
      alert(item.lockText);
      return;
    }

    setActiveTab(item.id);
  };

  const openWebsite = () => {
    window.open("/", "_blank");
  };

  return (
    <>
      {/* MOBILE */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/95 px-3 py-3 backdrop-blur-2xl xl:hidden">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">
              Zaifan
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              CRM Panel
            </h2>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400"
          >
            Logout
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-semibold transition ${
                  item.locked
                    ? "border border-white/10 bg-white/[0.02] text-gray-600"
                    : isActive
                    ? "bg-[#D4AF37] text-black"
                    : "border border-white/10 bg-white/[0.04] text-gray-400"
                }`}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP */}
      <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 overflow-y-auto border-r border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl xl:flex xl:flex-col">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
              Zaifan
            </p>

            <h2 className="mt-3 text-4xl font-black text-white">
              CRM Panel
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Premium student management
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6 rounded-[1.8rem] border border-white/10 bg-black/25 p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
                {currentRole.icon}
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  {adminProfile?.full_name || "Admin User"}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {currentRole.description}
                </p>
              </div>
            </div>

            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${currentRole.badge}`}
            >
              <span>{currentRole.icon}</span>
              {currentRole.label}
            </div>
          </motion.div>

          <div className="space-y-3">
            {navItems.map((item, index) => {
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.05,
                  }}
                  onClick={() => handleTabClick(item)}
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-sm font-semibold transition duration-300 ${
                    item.locked
                      ? "cursor-not-allowed border border-white/10 bg-white/[0.02] text-gray-600"
                      : isActive
                      ? "bg-[#D4AF37] text-black shadow-[0_0_25px_rgba(212,175,55,0.2)]"
                      : "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#D4AF37]/20 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>

                  {item.locked && <span>🔒</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            onClick={openWebsite}
            className="w-full rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-4 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
          >
            🌐 Open Website
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            onClick={logout}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;