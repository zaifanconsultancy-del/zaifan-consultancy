// AdminFilters V2 — High Contrast Admin OS
// Preserves active-tab switching and Framer Motion layout animation.
// Visual layer aligned with the approved Zaifan Admin OS.

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
      <div className="flex w-full flex-col gap-2 rounded-[1.6rem] border border-slate-300 bg-[#fffaf2] p-2 shadow-[0_6px_18px_rgba(15,35,63,0.04)] sm:inline-flex sm:w-auto sm:flex-row">
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
                  ? "text-white shadow-[0_8px_20px_rgba(249,115,22,0.18)]"
                  : "border border-slate-300 bg-white text-[#10233f] hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-admin-tab"
                  className="absolute inset-0 bg-orange-500"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}

              <span className="relative z-10 flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span className="text-base">{tab.icon}</span>
                  <span>
                    <span className="block text-sm font-black">{tab.label}</span>
                    <span
                      className={`mt-0.5 block text-[10px] font-bold uppercase tracking-[0.18em] ${
                        active ? "text-orange-100" : "text-slate-500"
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