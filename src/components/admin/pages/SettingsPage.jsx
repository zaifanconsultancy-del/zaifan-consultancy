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
      className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4`}
    >
      <div className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400">
        <div className="grid xl:grid-cols-[1.3fr_0.7fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
                <Settings2 size={21} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    System Preferences
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    Configuration
                  </span>
                </div>

                <h2 className="mt-4 break-words text-2xl font-black leading-tight text-white sm:text-3xl">
                  Settings Command Center
                </h2>

                <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
                  Central configuration for Admin preferences, notifications,
                  integrations, automation behaviour, branding and AI controls.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <SettingsHeroMetric label="Planned Areas" value={plannedAreas.length} />
              <SettingsHeroMetric label="Access Model" value="Role-aware" />
              <SettingsHeroMetric label="Status" value="Deferred" />
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
              Configuration Status
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              Planned
            </p>

            <p className="mt-2 text-sm font-semibold leading-6 text-white">
              Settings remain intentionally lightweight until the live Admin,
              Counselor and Student operating areas are fully stable.
            </p>

            <div className="mt-5 rounded-2xl border border-white/30 bg-white/10 p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                Governance Rule
              </p>
              <p className="mt-1 text-sm font-black text-white">
                No duplicate access or operational controls
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF8EF] p-4 sm:p-5">
          <div className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-6 text-center shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-[#F97316] bg-[#FFF4E8] text-orange-700">
              <Settings2 size={28} />
            </div>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              Settings Workspace
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#10233F]">
              Configuration Center Coming Later
            </h3>

            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              The Settings system will be completed after the main Admin,
              Counselor and Student operating areas are fully polished and
              stable.
            </p>

            <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plannedAreas.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex min-w-0 items-center gap-3 rounded-xl border-2 border-[#D1DCE7] bg-[#FFFDF8] px-4 py-3 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#F97316]/40 bg-[#FFF4E8] text-orange-700">
                    <Icon size={15} />
                  </div>

                  <span className="break-words text-xs font-black text-[#10233F]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {currentPermissions?.canManageAdmins ? (
              <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-[1.3rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#60A5FA] bg-white text-blue-700">
                  <ShieldCheck size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-black text-[#10233F]">
                    Super Admin access detected
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Team roles and access permissions remain managed from
                    <strong className="text-[#10233F]"> Team Access</strong>.
                    Settings will not duplicate those controls.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.section>
  );
}


function SettingsHeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

export default SettingsPage;