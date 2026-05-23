import { motion } from "framer-motion";

function AdminFilters({
  activeTab,
  setActiveTab,
}) {
  const tabs = [
    {
      id: "inquiries",
      label: "Inquiries",
      icon: "📨",
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: "📅",
    },
  ];

  return (
    <div className="mb-6">
      <div className="inline-flex rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-3 rounded-[1.2rem] px-5 py-3 text-sm font-semibold transition duration-300 ${
                active
                  ? "bg-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.22)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span className="text-base">{tab.icon}</span>

              {tab.label}

              {active && (
                <motion.div
                  layoutId="active-admin-tab"
                  className="absolute inset-0 -z-10 rounded-[1.2rem] bg-[#D4AF37]"
                  transition={{
                    type: "spring",
                    bounce: 0.2,
                    duration: 0.5,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default AdminFilters;