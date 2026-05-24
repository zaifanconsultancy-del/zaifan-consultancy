import { motion } from "framer-motion";

function AdminSidebar({ activeTab, setActiveTab, logout }) {
  const navItems = [
    { id: "inquiries", label: "Inquiries", icon: "📨", active: true },
    { id: "appointments", label: "Appointments", icon: "📅", active: true },
    { id: "analytics", label: "Analytics Soon", icon: "📊", active: false },
    { id: "settings", label: "Settings Soon", icon: "⚙️", active: false },
  ];

  const openWebsite = () => {
    window.open("/", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/90 px-3 py-3 backdrop-blur-2xl xl:hidden">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.26em] text-[#D4AF37]">
              Zaifan
            </p>

            <h2 className="mt-1 truncate text-lg font-black text-white">
              CRM Panel
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={openWebsite}
              className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-2 text-[11px] font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15"
            >
              Website
            </button>

            <button
              onClick={logout}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-400 transition hover:bg-red-500/15"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems
            .filter((item) => item.active)
            .map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[11px] font-semibold transition duration-300 ${
                    isActive
                      ? "bg-[#D4AF37] text-black shadow-[0_0_24px_rgba(212,175,55,0.2)]"
                      : "border border-white/10 bg-white/[0.04] text-gray-400"
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
        </div>
      </div>

      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col justify-between border-r border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl xl:flex">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-[#D4AF37]">
              Zaifan
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">CRM Panel</h2>

            <p className="mt-2 text-sm text-gray-500">
              Premium student management
            </p>
          </motion.div>

          <div className="space-y-3">
            {navItems.map((item, index) => {
              const isActive = activeTab === item.id;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  onClick={() => item.active && setActiveTab(item.id)}
                  disabled={!item.active}
                  className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-sm font-semibold transition duration-300 ${
                    isActive
                      ? "bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.22)]"
                      : item.active
                      ? "border border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#D4AF37]/20 hover:text-white"
                      : "cursor-not-allowed border border-white/10 bg-white/[0.02] text-gray-600"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            onClick={openWebsite}
            className="w-full rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-4 text-sm font-semibold text-[#D4AF37] transition duration-300 hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/15"
          >
            🌐 Open Website
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            onClick={logout}
            className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-400 transition duration-300 hover:bg-red-500/20"
          >
            Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;