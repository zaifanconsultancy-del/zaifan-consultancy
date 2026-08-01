// SettingsPage PARTNER OS EXTREME V2 — Deferred Configuration Command Center
// src/components/admin/pages/SettingsPage.jsx
//
// Partner OS page pass:
// - preserves the intentionally deferred settings scope
// - keeps permission handling and governance messaging unchanged
// - avoids fake controls or duplicate Team Access ownership
// - upgrades the page frame, command hierarchy and planned-area presentation
// - keeps all current props and motion behaviour intact

import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  Palette,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";

const plannedAreas = [
  {
    icon: SlidersHorizontal,
    label: "Admin Preferences",
  },
  {
    icon: Bell,
    label: "Notifications",
  },
  {
    icon: Workflow,
    label: "Automation",
  },
  {
    icon: Bot,
    label: "AI Controls",
  },
  {
    icon: Palette,
    label: "Branding",
  },
  {
    icon: Sparkles,
    label: "Integrations",
  },
];

function SettingsPage({
  cardClass = "",
  permissions = {},
  currentPermissions = permissions,
}) {
  return (
    <motion.section
      key="settings"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="min-w-0 space-y-5"
    >
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200 shadow-inner">
                <Settings2 size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap gap-2">
                  <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    System Preferences
                  </span>

                  <span className="rounded-full border-2 border-orange-300/40 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-100">
                    Configuration
                  </span>
                </div>

                <h2 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                  Settings Command Center
                </h2>

                <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
                  Central configuration for Admin preferences, notifications,
                  integrations, automation behaviour, branding and AI controls.
                </p>
              </div>
            </div>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
              <SettingsHeroMetric
                label="Planned Areas"
                value={plannedAreas.length}
              />
              <SettingsHeroMetric
                label="Access Model"
                value="Role-aware"
              />
              <SettingsHeroMetric
                label="Status"
                value="Deferred"
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Configuration Status
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              Planned
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">
              Settings remain intentionally lightweight until the live Admin,
              Counselor and Student operating areas are fully stable.
            </p>

            <div className="mt-5 rounded-[1.2rem] border-2 border-white/25 bg-white/10 p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
                Governance Rule
              </p>

              <p className="mt-1 text-sm font-black leading-5 text-white">
                No duplicate access or operational controls
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:px-6">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
            Deferred Configuration Workspace
          </p>

          <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Configuration Center Coming Later
          </h3>

          <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-200">
            The Settings system will be completed after the main Admin,
            Counselor and Student operating areas are fully polished and stable.
          </p>
        </div>

        <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <div className="min-w-0 rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)] sm:p-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-[3px] border-[#FF5A0A] bg-[#FFF4E8] text-orange-700">
                  <Settings2 size={24} />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
                    Settings Workspace
                  </p>

                  <h4 className="mt-1 break-words text-xl font-black text-[#10233F]">
                    Foundation prepared, controls intentionally deferred
                  </h4>

                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">
                    This page keeps the future configuration architecture visible
                    without pretending unfinished controls are production-ready.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
                {plannedAreas.map(({ icon: Icon, label }, index) => (
                  <div
                    key={label}
                    className="group min-w-0 rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] text-orange-700 transition group-hover:bg-white">
                        <Icon size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                          Planned Area {String(index + 1).padStart(2, "0")}
                        </p>

                        <p className="mt-1 break-words text-sm font-black text-[#10233F]">
                          {label}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
                        Deferred
                      </span>

                      <span className="text-[9px] font-black uppercase tracking-[0.08em] text-orange-700">
                        Architecture ready
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="min-w-0 space-y-4">
              <div className="min-w-0 rounded-[1.5rem] border-[3px] border-[#123865] bg-[#123865] p-5 text-white shadow-[0_12px_34px_rgba(18,56,101,0.12)]">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                  Implementation Rule
                </p>

                <p className="mt-2 text-lg font-black leading-6 text-white">
                  Real controls only when the workflow is ready.
                </p>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">
                  No placeholder switches, fake integrations or duplicate
                  permission management will be introduced here.
                </p>

                <div className="mt-4 space-y-2">
                  <GovernanceRow label="Role-aware access" />
                  <GovernanceRow label="No duplicate ownership" />
                  <GovernanceRow label="Production-safe controls only" />
                </div>
              </div>

              {currentPermissions?.canManageAdmins ? (
                <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#60A5FA] bg-white text-blue-700">
                      <ShieldCheck size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#10233F]">
                        Super Admin access detected
                      </p>

                      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                        Team roles and access permissions remain managed from
                        <strong className="text-[#10233F]">
                          {" "}
                          Team Access
                        </strong>
                        . Settings will not duplicate those controls.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-0 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                    Access Context
                  </p>

                  <p className="mt-2 text-sm font-black text-[#10233F]">
                    Role-aware configuration view
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    Future settings controls will respect the current Admin role
                    and permission model.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </motion.section>
  );
}

function SettingsHeroMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

function GovernanceRow({ label }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-white/15 bg-white/10 px-3 py-2.5">
      <ShieldCheck size={13} className="shrink-0 text-orange-200" />
      <span className="break-words text-xs font-black text-white">
        {label}
      </span>
    </div>
  );
}

export default SettingsPage;
