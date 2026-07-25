import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronRight,
  Crown,
  ExternalLink,
  FileClock,
  Gauge,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];
const ADMIN_SIDEBAR_COLLAPSED_KEY = "zaifan_admin_sidebar_collapsed";

const DEFAULT_PERMISSIONS = Object.freeze({
  canDelete: false,
  canClearAll: false,
  canExport: false,
  canManageAdmins: false,
  canUpdateStatus: true,
  canUpdatePriority: true,
  canConfirmAppointments: true,
});

const ROLE_CONFIG = Object.freeze({
  staff: {
    label: "Staff",
    shortLabel: "Staff",
    icon: UsersRound,
    description: "Student & lead operations",
    badge: "border-sky-300 bg-sky-50 text-sky-700",
    avatar: "border-sky-300 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  admin: {
    label: "Admin",
    shortLabel: "Admin",
    icon: ShieldCheck,
    description: "Operations & CRM control",
    badge: "border-orange-300 bg-orange-50 text-orange-700",
    avatar: "border-orange-300 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  super_admin: {
    label: "Super Admin",
    shortLabel: "Owner",
    icon: Crown,
    description: "Full Zaifan OS control",
    badge: "border-orange-300 bg-orange-50 text-orange-700",
    avatar: "border-orange-300 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
});

function readStoredCollapsedState() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "true";
}

// AdminSidebar V5 MAXIMUM — Navy Glass Rail Navigation
function AdminSidebar({
  activeTab,
  setActiveTab,
  logout,
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(
    readStoredCollapsedState
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      ADMIN_SIDEBAR_COLLAPSED_KEY,
      String(desktopCollapsed)
    );
  }, [desktopCollapsed]);

  const safePermissions = useMemo(
    () => ({
      ...DEFAULT_PERMISSIONS,
      ...permissions,
    }),
    [permissions]
  );

  const currentRole = ROLE_CONFIG[role] || ROLE_CONFIG.staff;
  const RoleIcon = currentRole.icon;

  const navGroups = useMemo(
    () => [
      {
        title: "Workspace",
        items: [
          {
            id: "inquiries",
            label: "Inquiries",
            description: "New student leads",
            icon: Gauge,
            locked: false,
          },
          {
            id: "appointments",
            label: "Appointments",
            description: "Consultation bookings",
            icon: CalendarDays,
            locked: false,
          },
          {
            id: "my-leads",
            label: "My Leads",
            description: "Assigned pipeline",
            icon: Target,
            locked: false,
          },
          {
            id: "followups",
            label: "Follow-ups",
            description: "Tasks & reminders",
            icon: FileClock,
            locked: false,
          },
          {
            id: "automation",
            label: "Automation",
            description: "Rules & workflows",
            icon: Bot,
            locked: false,
          },
        ],
      },
      {
        title: "Intelligence",
        items: [
          {
            id: "analytics",
            label: "Intelligence",
            description: "Analytics & AI center",
            icon: BarChart3,
            locked: false,
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            id: "admin-management",
            label: "Team Access",
            description: "Admins & permissions",
            icon: UsersRound,
            locked: !safePermissions.canManageAdmins,
            lockText: "Only Super Admin can manage admins.",
          },
          {
            id: "activity-logs",
            label: "Activity Logs",
            description: "Audit trail",
            icon: Activity,
            locked: !safePermissions.canManageAdmins,
            lockText: "Only Super Admin can view activity logs.",
          },
          {
            id: "settings",
            label: "Settings",
            description: "System preferences",
            icon: Settings,
            locked: !safePermissions.canManageAdmins,
            lockText: "Only Super Admin can open settings.",
          },
        ],
      },
    ],
    [safePermissions.canManageAdmins]
  );

  const navItems = useMemo(() => navGroups.flatMap((group) => group.items), [navGroups]);
  const activeItem =
    navItems.find((item) => item.id === activeTab) || navItems[0];

  const handleTabClick = (item) => {
    if (item.locked) {
      window.alert(item.lockText || "This section is locked for your role.");
      return;
    }

    setActiveTab(item.id);
    setMobileOpen(false);
  };

  const openWebsite = () => {
    window.open("/", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <>
      <div className="h-[68px] xl:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 top-0 z-50 border-b-[3px] border-[#F97316] bg-[#123865]/98 px-3 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.20)] backdrop-blur-xl xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white shadow-sm transition duration-300 hover:border-orange-300/60 hover:bg-white/15 active:scale-95"
            aria-label="Open admin navigation"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-300">
                Zaifan OS
              </span>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <span className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-white/65">
                Admin
              </span>
            </div>

            <p className="mt-1 truncate text-base font-black text-white">
              {activeItem?.label || "Workspace"}
            </p>
          </div>

          <div
            className="hidden items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white sm:flex"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`} />
            {currentRole.shortLabel}
          </div>
        </div>
      </div>
      </>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close admin navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-[#071f50]/45 backdrop-blur-sm xl:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.38, ease: EASE }}
              className="fixed inset-y-0 left-0 z-[80] flex w-[min(88vw,330px)] flex-col border-r-2 border-[#F97316] bg-[#123865] text-white shadow-[32px_0_90px_rgba(15,35,63,0.34)] xl:hidden"
            >
              <div className="flex items-center justify-between border-b-2 border-white/10 px-5 py-4">
                <BrandBlock compact />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-white transition hover:border-orange-300/60 hover:bg-white/15"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="zaifan-admin-sidebar-scroll flex-1 overflow-y-auto px-4 py-5">
                <ProfileCard
                  adminProfile={adminProfile}
                  currentRole={currentRole}
                  RoleIcon={RoleIcon}
                  canManageAdmins={safePermissions.canManageAdmins}
                />

                <Navigation
                  navGroups={navGroups}
                  activeTab={activeTab}
                  onTabClick={handleTabClick}
                />
              </div>

              <SidebarFooter openWebsite={openWebsite} logout={logout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP LAYOUT SPACER
          This reserves the correct horizontal width while the real sidebar
          itself is fixed to the viewport, so the sidebar follows you forever. */}
      <motion.div
        initial={false}
        animate={{ width: desktopCollapsed ? 88 : 304 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="hidden h-screen shrink-0 xl:block"
        aria-hidden="true"
      />

      {/* DESKTOP FIXED SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: desktopCollapsed ? 88 : 304 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="fixed bottom-0 left-0 top-0 z-[60] hidden overflow-hidden border-r-2 border-[#F97316] bg-[#123865] text-white shadow-[22px_0_60px_rgba(15,35,63,0.24)] xl:flex xl:flex-col"
      >
        <div className="pointer-events-none absolute left-[-120px] top-[-100px] h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-140px] right-[-140px] h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div
          className={`relative border-b-2 border-white/10 ${
            desktopCollapsed ? "px-3 py-3.5" : "px-4 py-4"
          }`}
        >
          <div
            className={`flex items-center ${
              desktopCollapsed ? "flex-col gap-3" : "justify-between gap-3"
            }`}
          >
            <BrandBlock collapsed={desktopCollapsed} />

            <button
              type="button"
              onClick={() => setDesktopCollapsed((current) => !current)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.07] text-white/90 transition duration-300 hover:border-orange-300/60 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
              aria-label={
                desktopCollapsed
                  ? "Expand admin sidebar"
                  : "Collapse admin sidebar"
              }
              title={
                desktopCollapsed
                  ? "Expand admin sidebar"
                  : "Collapse admin sidebar"
              }
            >
              {desktopCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>
        </div>

        <div
          className={`zaifan-admin-sidebar-scroll relative flex-1 overflow-y-auto ${
            desktopCollapsed ? "px-2 py-4" : "px-4 py-5"
          }`}
        >
          <ProfileCard
            adminProfile={adminProfile}
            currentRole={currentRole}
            RoleIcon={RoleIcon}
            canManageAdmins={safePermissions.canManageAdmins}
            collapsed={desktopCollapsed}
          />

          {!desktopCollapsed ? (
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <p className="min-w-0 truncate text-[10px] font-black uppercase tracking-[0.12em] text-white/55">
                {activeItem?.label || "Workspace"}
              </p>
            </div>
          ) : null}

          <Navigation
            navGroups={navGroups}
            activeTab={activeTab}
            onTabClick={handleTabClick}
            collapsed={desktopCollapsed}
          />
        </div>

        <SidebarFooter
          openWebsite={openWebsite}
          logout={logout}
          collapsed={desktopCollapsed}
        />

        <style>{`
          .zaifan-admin-sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(249, 115, 22, 0.70) transparent;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(249, 115, 22, 0.62);
            border-radius: 999px;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(249, 115, 22, 0.65);
          }
        `}</style>
      </motion.aside>
    </>
  );
}

function BrandBlock({ compact = false, collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex w-full justify-center">
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#E96512] text-white shadow-[0_7px_18px_rgba(249,115,22,0.18)]"
          title="Zaifan OS"
        >
          <Sparkles size={19} strokeWidth={2.3} />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#173F6B] bg-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#E96512] text-white shadow-[0_7px_18px_rgba(249,115,22,0.18)] ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <Sparkles size={compact ? 18 : 21} strokeWidth={2.3} />

        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#173F6B] bg-emerald-400" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xl font-black tracking-tight text-white">
            Zaifan
          </p>

          <span className="rounded-full border border-orange-300/50 bg-orange-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-orange-200">
            OS
          </span>
        </div>

        <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
          Operations Console
        </p>
      </div>
    </div>
  );
}

function ProfileCard({
  adminProfile,
  currentRole,
  RoleIcon,
  canManageAdmins,
  collapsed = false,
}) {
  const name = adminProfile?.full_name || adminProfile?.name || "Admin User";
  const firstName = name.split(" ")[0] || "Admin";

  if (collapsed) {
    return (
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="mb-5 flex justify-center"
      >
        <div
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl border-2 bg-white shadow-[0_8px_24px_rgba(15,35,63,0.12)] ${currentRole.avatar}`}
          title={`${firstName} · ${currentRole.label}`}
        >
          <RoleIcon size={19} strokeWidth={2.2} />

          <span
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${currentRole.dot}`}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="mb-4 w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] p-3.5"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${currentRole.avatar}`}
        >
          <RoleIcon size={19} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white">
            {firstName}
          </p>

          <p className="mt-0.5 truncate text-[11px] font-semibold text-white/60">
            {currentRole.description}
          </p>
        </div>

        <span className={`h-2 w-2 shrink-0 rounded-full ${currentRole.dot}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.10em] ${currentRole.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`} />
          {currentRole.label}
        </span>

        {canManageAdmins && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/40 bg-orange-400/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.10em] text-orange-200">
            <Crown size={11} />
            Owner tools
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Navigation({
  navGroups,
  activeTab,
  onTabClick,
  collapsed = false,
}) {
  return (
    <nav
      className={collapsed ? "space-y-4" : "space-y-4"}
      aria-label="Admin navigation"
    >
      {navGroups.map((group) => (
        <div key={group.title}>
          {!collapsed && (
            <div className="mb-1.5 px-2">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                {group.title}
              </p>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto mb-2 h-px w-8 bg-white/15 first:hidden" />
          )}

          <div className="space-y-2">
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              const ItemIcon = item.icon;

              if (collapsed) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onTabClick(item)}
                    title={
                      item.locked
                        ? `${item.label} — ${item.lockText}`
                        : `${item.label} — ${item.description}`
                    }
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
                      item.locked
                        ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-white/20 opacity-60"
                        : isActive
                        ? "border-[#F97316] bg-[#E96512] text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)]"
                        : "border-white/[0.08] bg-white/[0.045] text-white/80 hover:border-white/15 hover:bg-white/[0.08]"
                    }`}
                  >
                    <ItemIcon size={18} strokeWidth={2.15} />

                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabClick(item)}
                  title={item.locked ? item.lockText : item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex min-h-[54px] w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
                    item.locked
                      ? "cursor-not-allowed border-white/5 bg-white/[0.03] text-white/25 opacity-60"
                      : isActive
                      ? "border-[#F97316] bg-[#E96512] text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)]"
                      : "border-white/[0.07] bg-white/[0.045] text-white hover:border-white/15 hover:bg-white/[0.08]"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition duration-300 ${
                      item.locked
                        ? "border-white/5 bg-white/[0.03] text-white/25"
                        : isActive
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.05] text-orange-200 group-hover:border-white/20 group-hover:text-white"
                    }`}
                  >
                    <ItemIcon size={17} strokeWidth={2.1} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-extrabold ${
                        isActive
                          ? "text-white"
                          : item.locked
                          ? "text-white/25"
                          : "text-white"
                      }`}
                    >
                      {item.label}
                    </span>

                    <span
                      className={`mt-0.5 block truncate text-[11px] font-semibold ${
                        item.locked
                          ? "text-white/20"
                          : isActive
                          ? "text-orange-100"
                          : "text-white/50"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>

                  <ChevronRight
                    size={15}
                    className={`shrink-0 transition duration-300 ${
                      item.locked
                        ? "opacity-10"
                        : isActive
                        ? "text-white"
                        : "text-white/25 group-hover:translate-x-0.5 group-hover:text-orange-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ openWebsite, logout, collapsed = false }) {
  if (collapsed) {
    return (
      <div className="relative border-t-2 border-white/10 bg-[#123865] px-2 py-3 shadow-[0_-10px_28px_rgba(15,35,63,0.12)]">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={openWebsite}
            title="Open public website"
            aria-label="Open public website"
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/15 bg-white/10 text-white shadow-sm transition duration-300 hover:border-orange-300/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
          >
            <ExternalLink size={17} />
          </button>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white/15 bg-white/10 text-white shadow-sm transition duration-300 hover:border-orange-300/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-t border-white/10 bg-[#102F5C] px-3.5 py-3.5">
      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-white/5 blur-3xl" />

      <div className="relative">
        <button
          type="button"
          onClick={openWebsite}
          className="group mb-2 flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-left text-sm font-black text-white shadow-[0_6px_18px_rgba(15,35,63,0.10)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#F97316] bg-[#E96512] text-white shadow-[0_6px_16px_rgba(249,115,22,0.20)]">
              <ExternalLink size={15} />
            </span>

            <span>Open public website</span>
          </span>

          <ChevronRight
            size={15}
            className="text-orange-300 transition duration-300 group-hover:translate-x-0.5 group-hover:text-white"
          />
        </button>

        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm font-black text-white shadow-sm transition duration-300 hover:border-orange-300/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.05] text-white shadow-sm transition group-hover:border-orange-300/60 group-hover:bg-white/15">
            <LogOut size={15} />
          </span>

          Sign out
        </button>

        <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.07] px-1 pt-2.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/25">
          <span>Zaifan Consultancy</span>
          <span>Internal</span>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
