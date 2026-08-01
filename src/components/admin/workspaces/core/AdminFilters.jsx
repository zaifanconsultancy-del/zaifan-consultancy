// AdminFilters V4 PARTNER OS — CRM Workspace Tab Switcher
// src/components/admin/core/AdminFilters.jsx
//
// Maximum pass:
// - preserves the existing activeTab / setActiveTab API
// - proper accessible tab semantics and keyboard navigation
// - reduced-motion support
// - locked Partner OS navy/orange/cream hierarchy
// - mobile-safe full-width layout
// - no fake Supabase logic: this component is a pure workspace navigation control

import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck2, Inbox, CheckCircle2 } from "lucide-react";

const TABS = [
  {
    id: "inquiries",
    label: "Inquiries",
    helper: "Student leads",
    description: "Open student inquiry pipeline",
    icon: Inbox,
  },
  {
    id: "appointments",
    label: "Appointments",
    helper: "Consultation bookings",
    description: "Open consultation booking workspace",
    icon: CalendarCheck2,
  },
];

function AdminFilters({ activeTab, setActiveTab }) {
  const shouldReduceMotion = useReducedMotion();

  const safeActiveTab = TABS.some((tab) => tab.id === activeTab)
    ? activeTab
    : TABS[0].id;

  const activateTab = (tabId) => {
    if (tabId === safeActiveTab) return;
    if (typeof setActiveTab === "function") {
      setActiveTab(tabId);
    }
  };

  const handleKeyDown = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextIndex = index;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    }

    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }

    const nextTab = TABS[nextIndex];
    activateTab(nextTab.id);

    window.requestAnimationFrame(() => {
      document
        .querySelector(`[data-admin-filter-tab="${nextTab.id}"]`)
        ?.focus();
    });
  };

  return (
    <section
      className="mb-6 min-w-0"
      aria-label="CRM workspace switcher"
    >
      <div className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_14px_34px_rgba(15,35,63,0.09)]">
        <div className="bg-[#123865] px-4 py-3 text-white sm:px-5">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
            CRM Workspace
          </p>

          <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">
                Lead & Appointment Operations
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-white">
                Switch between live inquiry and consultation workflows.
              </p>
            </div>

            <span className="mt-2 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white sm:mt-0">
              2 workspaces
            </span>
          </div>
        </div>

        <div className="bg-[#FFF8EF] p-2 sm:p-3">
          <div
            role="tablist"
            aria-label="Admin CRM workspaces"
            className="grid gap-2 sm:grid-cols-2"
          >
            {TABS.map((tab, index) => {
              const active = safeActiveTab === tab.id;
              const Icon = tab.icon;

              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`admin-workspace-panel-${tab.id}`}
                  tabIndex={active ? 0 : -1}
                  data-admin-filter-tab={tab.id}
                  onClick={() => activateTab(tab.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                  className={`relative overflow-hidden rounded-[1.35rem] border-[3px] px-4 py-4 text-left outline-none transition duration-300 focus-visible:ring-4 focus-visible:ring-[#FF5A0A]/25 ${
                    active
                      ? "border-[#FF5A0A] text-white shadow-[0_10px_24px_rgba(255,90,10,0.20)]"
                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A] hover:bg-[#FFF4EA]"
                  }`}
                >
                  {active ? (
                    <motion.div
                      layoutId="active-admin-tab"
                      className="absolute inset-0 bg-[#FF5A0A]"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", bounce: 0.18, duration: 0.45 }
                      }
                    />
                  ) : null}

                  <span className="relative z-10 flex items-center justify-between gap-4">
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 ${
                          active
                            ? "border-white/25 bg-white/10 text-white"
                            : "border-[#FFB38A] bg-[#FFF4EA] text-[#B84F0E]"
                        }`}
                      >
                        <Icon size={18} />
                      </span>

                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm font-black ${
                            active ? "text-white" : "text-[#10233F]"
                          }`}
                        >
                          {tab.label}
                        </span>

                        <span
                          className={`mt-0.5 block text-[10px] font-black uppercase tracking-[0.14em] ${
                            active ? "text-white" : "text-slate-600"
                          }`}
                        >
                          {tab.helper}
                        </span>

                        <span
                          className={`mt-1 block text-[11px] font-semibold leading-5 ${
                            active ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {tab.description}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        active
                          ? "border-white/25 bg-white/10 text-white"
                          : "border-[#C9D7E6] bg-white text-slate-500"
                      }`}
                      aria-hidden="true"
                    >
                      {active ? <CheckCircle2 size={15} /> : index + 1}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminFilters;
