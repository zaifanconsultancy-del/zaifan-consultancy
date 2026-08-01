// SystemPage PARTNER OS EXTREME V2 — Admin System Command Center
// src/components/admin/pages/SystemPage.jsx
//
// Partner OS page pass:
// - preserves lazy imports, workspace modes, permissions and navigation callbacks
// - keeps System ownership clear without duplicating child destinations
// - strengthens the page-level Partner OS frame and command hierarchy
// - upgrades session/access visibility and system destination cards
// - preserves all Activity Logs and Settings child ownership

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
    <section className="min-w-0 space-y-5 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_22px_60px_rgba(18,56,101,0.14)] sm:p-4 lg:p-5">
      {workspaceMode === "system-overview" ? (
        <header className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
            <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      System Control
                    </span>

                    <span className="rounded-full border-2 border-orange-300/40 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-100">
                      Admin OS
                    </span>
                  </div>

                  <h1 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                    System Command Center
                  </h1>

                  <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
                    Keep global Admin controls, audit visibility, permission
                    context and system destinations clear without duplicating
                    operational tools.
                  </p>
                </div>

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200 shadow-inner">
                  <WorkspaceIcon size={20} />
                </span>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
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

            <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Current Session
              </p>

              <p className="mt-3 break-words text-2xl font-black leading-tight text-white sm:text-3xl">
                {adminProfile?.full_name || roleLabel || "Admin"}
              </p>

              <p className="mt-1 break-all text-xs font-black uppercase tracking-[0.08em] text-orange-50 sm:break-words">
                {adminProfile?.email || "Signed in securely"}
              </p>

              <div className="mt-5 rounded-[1.2rem] border-2 border-white/25 bg-white/10 p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
                  Access Context
                </p>

                <p className="mt-1 text-sm font-black leading-5 text-white">
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
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <div className="min-w-0 space-y-5">
        <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
          <div className="border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Global Shell
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              One Admin operating system
            </h2>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">
              Global navigation and access tools remain unified while feature
              ownership stays inside its proper workspace.
            </p>
          </div>

          <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2">
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
              onClick={() =>
                setActiveTab?.("communication-notifications")
              }
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

        <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
          <div className="border-b-[3px] border-[#FF5A0A] bg-white px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
              System Destinations
            </p>

            <h2 className="mt-1 text-xl font-black text-[#10233F]">
              Audit and configuration
            </h2>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Open the two dedicated System workspaces without duplicating
              their functionality in this overview.
            </p>
          </div>

          <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2">
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

      <aside className="min-w-0 space-y-5">
        <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-[#123865] text-white shadow-[0_14px_38px_rgba(18,56,101,0.14)]">
          <div className="border-b-[3px] border-[#FF5A0A] p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
                <KeyRound size={18} />
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                  Current Session
                </p>

                <h3 className="mt-0.5 break-words text-xl font-black text-white">
                  {roleLabel || role || "Admin"}
                </h3>
              </div>
            </div>

            <div className="mt-4 rounded-xl border-2 border-white/20 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
                Signed in as
              </p>

              <p className="mt-1 break-all text-sm font-black text-white sm:break-words">
                {adminProfile?.full_name ||
                  adminProfile?.email ||
                  "Authenticated admin"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#0f3159] p-4">
            {permissionRows.map(([label, enabled]) => (
              <div
                key={label}
                className={`rounded-xl border-2 px-3 py-3 ${
                  enabled
                    ? "border-emerald-200/30 bg-emerald-400/10"
                    : "border-white/15 bg-white/5"
                }`}
              >
                <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
                  {label}
                </p>

                <p
                  className={`mt-1 text-xs font-black ${
                    enabled ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  {enabled ? "Allowed" : "Restricted"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
            Ownership Rule
          </p>

          <p className="mt-2 text-base font-black leading-6 text-[#10233F]">
            One system = one primary home.
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Search and the command palette may link everywhere, but they do not
            create duplicate feature ownership.
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100">
            <div className="h-full w-full rounded-full bg-[#FF5A0A]" />
          </div>
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
    <article className="min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#123865] hover:shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] text-orange-700">
          <Icon size={16} />
        </span>

        {badge ? (
          <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 break-words text-sm font-black text-[#10233F]">
        {title}
      </h3>

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>

      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border-2 border-[#123865] bg-white px-3 text-[10px] font-black text-[#123865] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

function DestinationCard({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 text-left shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] text-[#123865] transition group-hover:border-[#FF5A0A] group-hover:bg-white group-hover:text-orange-700">
        <Icon size={16} />
      </span>

      <h3 className="mt-3 break-words text-sm font-black text-[#10233F]">
        {title}
      </h3>

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">
        {description}
      </p>

      <span className="mt-3 inline-flex rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500 transition group-hover:border-[#FF5A0A] group-hover:bg-white group-hover:text-orange-700">
        Open Workspace
      </span>
    </button>
  );
}

function HeaderMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2.5 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black text-white">
        {value}
      </p>
    </div>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-6 shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-[#FF5A0A] bg-[#FFF4E8]">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-100 border-t-[#FF5A0A]" />
        </div>

        <p className="mt-4 text-sm font-black text-[#10233F]">
          Opening system workspace
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          Loading the selected Partner OS system destination.
        </p>
      </div>
    </div>
  );
}

export default SystemPage;
