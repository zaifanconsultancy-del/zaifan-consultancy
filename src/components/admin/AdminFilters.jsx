import { motion } from "framer-motion";

function AdminFilters({ activeTab, setActiveTab }) {
  const tabs = [
    {
      id: "inquiries",
      label: "Inquiries",
      icon: "📨",
      helper: "Student leads",
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: "📅",
      helper: "Consultation bookings",
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex w-full flex-col gap-2 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl sm:inline-flex sm:w-auto sm:flex-row">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
              className={`relative overflow-hidden rounded-[1.2rem] px-5 py-3 text-left transition duration-300 sm:min-w-[190px] ${
                active
                  ? "bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.22)]"
                  : "border border-white/10 bg-black/20 text-gray-400 hover:border-[#D4AF37]/25 hover:text-white"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-admin-tab"
                  className="absolute inset-0 bg-[#D4AF37]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}

              <span className="relative z-10 flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span className="text-base">{tab.icon}</span>
                  <span>
                    <span className="block text-sm font-black">{tab.label}</span>
                    <span
                      className={`mt-0.5 block text-[10px] uppercase tracking-[0.18em] ${
                        active ? "text-black/60" : "text-gray-600"
                      }`}
                    >
                      {tab.helper}
                    </span>
                  </span>
                </span>

                {active && <span className="text-xs font-black">●</span>}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default AdminFilters;
