import { lazy, Suspense, useMemo } from "react";
import {
  Activity,
  BellRing,
  Command,
  KeyRound,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

const ActivityLogsPage = lazy(() => import("./ActivityLogsPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));

const WORKSPACES = Object.freeze({
  "system-overview": {
    eyebrow: "System",
    title: "Admin System",
    description:
      "Shell controls, access context and system destinations in one place.",
    icon: SlidersHorizontal,
  },
  "system-activity": {
    eyebrow: "System",
    title: "Activity & Audit",
    description:
      "Admin activity history and audit visibility without mixing it into business operations.",
    icon: Activity,
  },
  "system-settings": {
    eyebrow: "System",
    title: "Settings",
    description:
      "Admin preferences and system configuration stay in one dedicated destination.",
    icon: Settings,
  },
});

function SystemPage({
  workspaceMode = "system-overview",
  cardClass = "",
  role,
  roleLabel,
  adminProfile,
  permissions = {},
  setActiveTab,
}) {
  const workspace =
    WORKSPACES[workspaceMode] || WORKSPACES["system-overview"];
  const WorkspaceIcon = workspace.icon;

  return (
    <section className="space-y-5">
      {workspaceMode === "system-overview" ? (
        <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_16px_42px_rgba(15,35,63,0.08)]">
          <div className="grid xl:grid-cols-[1.3fr_0.7fr]">
            <div className="bg-[#123865] p-5 text-white sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      System Control
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      Admin OS
                    </span>
                  </div>

                  <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    System Command Center
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
                    Keep global Admin controls, audit visibility, permissions context
                    and system destinations clear without duplicating operational tools.
                  </p>
                </div>

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
                  <SlidersHorizontal size={20} />
                </span>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <HeaderMetric
                  label="Role"
                  value={roleLabel || role || "Admin"}
                />
                <HeaderMetric
                  label="Session"
                  value="Authenticated"
                />
                <HeaderMetric
                  label="System"
                  value="Operational"
                />
              </div>
            </div>

            <div className="bg-orange-500 p-5 text-white sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                Current Session
              </p>

              <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
                {adminProfile?.full_name || roleLabel || "Admin"}
              </p>

              <p className="mt-1 break-words text-xs font-black uppercase tracking-[0.08em] text-white">
                {adminProfile?.email || "Signed in securely"}
              </p>

              <div className="mt-5 rounded-2xl border border-white/30 bg-white/10 p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                  Access Context
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {permissions?.canManageAdmins
                    ? "Full administrative access"
                    : "Role-aware administrative access"}
                </p>
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <Suspense fallback={<WorkspaceLoader />}>
        {workspaceMode === "system-overview" ? (
          <SystemOverview
            role={role}
            roleLabel={roleLabel}
            adminProfile={adminProfile}
            permissions={permissions}
            setActiveTab={setActiveTab}
          />
        ) : null}

        {workspaceMode === "system-activity" ? (
          <ActivityLogsPage cardClass={cardClass} />
        ) : null}

        {workspaceMode === "system-settings" ? (
          <SettingsPage
            cardClass={cardClass}
            role={role}
            adminProfile={adminProfile}
            permissions={permissions}
          />
        ) : null}
      </Suspense>
    </section>
  );
}

function SystemOverview({
  role,
  roleLabel,
  adminProfile,
  permissions,
  setActiveTab,
}) {
  const permissionRows = useMemo(
    () => [
      ["Delete records", permissions?.canDelete],
      ["Export data", permissions?.canExport],
      ["Clear all", permissions?.canClearAll],
      ["Manage admins", permissions?.canManageAdmins],
    ],
    [permissions]
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white">
          <div className="border-b-2 border-[#D7E1EB] bg-[#FFF8EF] px-4 py-3.5">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-600">
              Global shell
            </p>
            <h2 className="mt-1 text-lg font-black text-[#10233F]">
              One Admin operating system
            </h2>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <ShellCard
              icon={Command}
              title="Command Palette"
              description="Use the global command palette to jump across Admin destinations without memorising where features live."
              badge="Global"
            />
            <ShellCard
              icon={Search}
              title="Navigation Search"
              description="Sidebar and command search both follow the same central Admin navigation source."
              badge="Unified"
            />
            <ShellCard
              icon={BellRing}
              title="Operational Notifications"
              description="CRM alerts have one primary home under Communications → Notifications."
              onClick={() => setActiveTab?.("communication-notifications")}
              actionLabel="Open Notifications"
            />
            <ShellCard
              icon={ShieldCheck}
              title="Access & Roles"
              description="Staff access and permissions have one primary home under Team → Access & Roles."
              onClick={() => setActiveTab?.("team-access")}
              actionLabel="Open Access"
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.55rem] border-[3px] border-orange-300 bg-white">
          <div className="border-b-2 border-[#D7E1EB] bg-[#FFF8EF] px-4 py-3.5">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-600">
              System destinations
            </p>
            <h2 className="mt-1 text-lg font-black text-[#10233F]">
              Audit and configuration
            </h2>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <DestinationCard
              icon={Activity}
              title="Activity & Audit"
              description="Review Admin activity and audit history."
              onClick={() => setActiveTab?.("system-activity")}
            />
            <DestinationCard
              icon={Settings}
              title="Settings"
              description="Open Admin preferences and configuration."
              onClick={() => setActiveTab?.("system-settings")}
            />
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-[1.5rem] border-[3px] border-orange-400 bg-[#123865] p-5 text-white shadow-[0_14px_36px_rgba(15,35,63,0.12)]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-orange-200">
              <KeyRound size={17} />
            </span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                Current session
              </p>
              <h3 className="mt-0.5 text-lg font-black text-white">
                {roleLabel || role || "Admin"}
              </h3>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/55">
              Signed in as
            </p>
            <p className="mt-1 break-words text-sm font-black text-white">
              {adminProfile?.full_name ||
                adminProfile?.email ||
                "Authenticated admin"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {permissionRows.map(([label, enabled]) => (
              <div
                key={label}
                className={`rounded-xl border px-3 py-2.5 ${
                  enabled
                    ? "border-white/20 bg-white/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/55">
                  {label}
                </p>
                <p
                  className={`mt-1 text-xs font-black ${
                    enabled ? "text-white" : "text-white/45"
                  }`}
                >
                  {enabled ? "Allowed" : "Restricted"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.55rem] border-[3px] border-orange-400 bg-[#FFF8EF] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-600">
            Ownership rule
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-[#10233F]">
            One system = one primary home.
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Search and the command palette may link everywhere, but they do not
            create duplicate feature ownership.
          </p>
        </section>
      </aside>
    </div>
  );
}

function ShellCard({
  icon: Icon,
  title,
  description,
  badge = "",
  onClick,
  actionLabel,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-700">
          <Icon size={15} />
        </span>
        {badge ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-sm font-black text-[#10233F]">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>

      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="mt-3 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 text-[10px] font-black text-orange-700 transition hover:border-orange-500"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function DestinationCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border-2 border-slate-200 bg-white p-4 text-left transition hover:border-orange-400 hover:bg-orange-50/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#123865] transition group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700">
        <Icon size={15} />
      </span>
      <h3 className="mt-3 text-sm font-black text-[#10233F]">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

function HeaderMetric({ label, value }) {
  return (
    <div className="min-w-[110px] rounded-xl border border-white/15 bg-white/10 px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-white/55">
        {label}
      </p>
      <p className="mt-1 max-w-[180px] truncate text-xs font-black text-white">
        {value}
      </p>
    </div>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border-[3px] border-orange-300 bg-[#FFF8EF]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening system workspace
        </p>
      </div>
    </div>
  );
}

export default SystemPage;