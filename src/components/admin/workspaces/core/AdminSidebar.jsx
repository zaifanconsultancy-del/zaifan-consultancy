import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Crown,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import {
  getAdminNavigationItem,
  getAdminNavigationZones,
} from "./adminNavigation";

const EASE = [0.22, 1, 0.36, 1];
const ADMIN_SIDEBAR_COLLAPSED_KEY = "zaifan_admin_sidebar_collapsed";
const ADMIN_SIDEBAR_OPEN_GROUPS_KEY = "zaifan_admin_sidebar_open_groups";

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
    badge: "border-sky-300/70 bg-sky-400/10 text-sky-100",
    avatar: "border-sky-300/50 bg-sky-400/10 text-sky-100",
    dot: "bg-sky-400",
  },
  admin: {
    label: "Admin",
    shortLabel: "Admin",
    icon: ShieldCheck,
    description: "Operations & CRM control",
    badge: "border-orange-300/60 bg-orange-400/10 text-orange-100",
    avatar: "border-orange-300/60 bg-orange-400/10 text-orange-100",
    dot: "bg-orange-400",
  },
  super_admin: {
    label: "Super Admin",
    shortLabel: "Owner",
    icon: Crown,
    description: "Full Zaifan OS control",
    badge: "border-orange-300/60 bg-orange-400/10 text-orange-100",
    avatar: "border-orange-300/60 bg-orange-400/10 text-orange-100",
    dot: "bg-orange-400",
  },
});

function readStoredCollapsedState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "true";
}

function readStoredOpenGroups() {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(ADMIN_SIDEBAR_OPEN_GROUPS_KEY) || "[]"
    );
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function findActiveGroupId(zones, activeTab) {
  for (const zone of zones) {
    for (const group of zone.groups || []) {
      if ((group.items || []).some((item) => item.id === activeTab)) {
        return group.id;
      }
    }
  }

  return "";
}

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
  const [openGroups, setOpenGroups] = useState(readStoredOpenGroups);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      ADMIN_SIDEBAR_COLLAPSED_KEY,
      String(desktopCollapsed)
    );
  }, [desktopCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      ADMIN_SIDEBAR_OPEN_GROUPS_KEY,
      JSON.stringify(openGroups)
    );
  }, [openGroups]);

  const safePermissions = useMemo(
    () => ({
      ...DEFAULT_PERMISSIONS,
      ...permissions,
    }),
    [permissions]
  );

  const currentRole = ROLE_CONFIG[role] || ROLE_CONFIG.staff;
  const RoleIcon = currentRole.icon;

  const navZones = useMemo(
    () => getAdminNavigationZones(safePermissions),
    [safePermissions]
  );

  const activeGroupId = useMemo(
    () => findActiveGroupId(navZones, activeTab),
    [activeTab, navZones]
  );

  useEffect(() => {
    if (!activeGroupId) return;

    setOpenGroups((current) =>
      current.includes(activeGroupId)
        ? current
        : [...current, activeGroupId]
    );
  }, [activeGroupId]);

  const activeItem = useMemo(
    () => getAdminNavigationItem(activeTab, safePermissions),
    [activeTab, safePermissions]
  );

  const handleTabClick = (item) => {
    if (item.locked) {
      window.alert(item.lockText || "This section is locked for your role.");
      return;
    }

    setActiveTab(item.id);
    setMobileOpen(false);
  };

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => {
      if (current.includes(groupId)) {
        if (groupId === activeGroupId) return current;
        return current.filter((id) => id !== groupId);
      }

      return [...current, groupId];
    });
  };

  const openWebsite = () => {
    window.open("/", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="h-[72px] xl:hidden" aria-hidden="true" />

      <div className="fixed inset-x-0 top-0 z-50 border-b border-orange-400/70 bg-[#0F3159]/95 px-3 py-3 shadow-[0_12px_32px_rgba(7,31,80,0.26)] backdrop-blur-2xl xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-white transition hover:border-orange-300/60 hover:bg-white/[0.12] active:scale-95"
            aria-label="Open admin navigation"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-orange-300">
                Zaifan OS
              </span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="truncate text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                Admin
              </span>
            </div>

            <p className="mt-1 truncate text-[15px] font-black text-white">
              {activeItem?.label || "Workspace"}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white/80 sm:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`} />
            {currentRole.shortLabel}
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close admin navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-[#071F50]/50 backdrop-blur-sm xl:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.34, ease: EASE }}
              className="fixed inset-y-0 left-0 z-[80] flex w-[min(90vw,340px)] flex-col overflow-hidden border-r border-orange-400/80 bg-[linear-gradient(180deg,#123A67_0%,#0F315A_58%,#0C294D_100%)] text-white shadow-[34px_0_100px_rgba(7,31,80,0.38)] xl:hidden"
            >
              <SidebarAmbient />

              <div className="relative flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
                <BrandBlock compact />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white/80 transition hover:border-orange-300/50 hover:bg-white/[0.1] hover:text-white"
                  aria-label="Close navigation"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="zaifan-admin-sidebar-scroll relative flex-1 overflow-y-auto px-3.5 py-4">
                <ProfileCard
                  adminProfile={adminProfile}
                  currentRole={currentRole}
                  RoleIcon={RoleIcon}
                  canManageAdmins={safePermissions.canManageAdmins}
                />

                <Navigation
                  navZones={navZones}
                  activeTab={activeTab}
                  activeGroupId={activeGroupId}
                  openGroups={openGroups}
                  onToggleGroup={toggleGroup}
                  onTabClick={handleTabClick}
                />
              </div>

              <SidebarFooter openWebsite={openWebsite} logout={logout} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* DESKTOP LAYOUT SPACER */}
      <motion.div
        initial={false}
        animate={{ width: desktopCollapsed ? 84 : 288 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="hidden h-screen shrink-0 xl:block"
        aria-hidden="true"
      />

      {/* DESKTOP FIXED SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: desktopCollapsed ? 84 : 288 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="fixed bottom-0 left-0 top-0 z-[60] hidden overflow-hidden border-r border-orange-400/80 bg-[linear-gradient(180deg,#123A67_0%,#0F315A_58%,#0C294D_100%)] text-white shadow-[18px_0_55px_rgba(7,31,80,0.20)] xl:flex xl:flex-col"
      >
        <SidebarAmbient />

        <div
          className={`relative border-b border-white/[0.08] ${
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
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] text-white/75 transition hover:border-orange-300/50 hover:bg-white/[0.11] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50"
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
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
          </div>
        </div>

        <div
          className={`zaifan-admin-sidebar-scroll relative flex-1 overflow-y-auto ${
            desktopCollapsed ? "px-2 py-3.5" : "px-3 py-4"
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
            <div className="mb-3 flex items-center gap-2 px-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <p className="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                {activeItem?.label || "Workspace"}
              </p>
            </div>
          ) : null}

          <Navigation
            navZones={navZones}
            activeTab={activeTab}
            activeGroupId={activeGroupId}
            openGroups={openGroups}
            onToggleGroup={toggleGroup}
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
            scrollbar-color: rgba(249, 115, 22, 0.78) transparent;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar {
            width: 5px;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(
              to bottom,
              rgba(249,115,22,0.94),
              rgba(251,146,60,0.68)
            );
            border-radius: 999px;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(249, 115, 22, 0.95);
          }
        `}</style>
      </motion.aside>
    </>
  );
}

function SidebarAmbient() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.035] to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-orange-400/[0.055] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-24 h-72 w-72 rounded-full bg-sky-300/[0.045] blur-3xl" />
    </>
  );
}

function BrandBlock({ compact = false, collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex w-full justify-center">
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-orange-300/70 bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)]"
          title="Zaifan OS"
        >
          <Sparkles size={18} strokeWidth={2.3} />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#123A67] bg-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-[14px] border border-orange-300/70 bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)] ${
          compact ? "h-10 w-10" : "h-11 w-11"
        }`}
      >
        <Sparkles size={compact ? 17 : 19} strokeWidth={2.3} />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#123A67] bg-emerald-400" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[19px] font-black tracking-tight text-white">
            Zaifan
          </p>

          <span className="rounded-full border border-orange-300/40 bg-orange-400/[0.08] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.16em] text-orange-200">
            OS
          </span>
        </div>

        <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/38">
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
      <div className="mb-4 flex justify-center">
        <div
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl border bg-white/[0.06] shadow-[0_8px_22px_rgba(7,31,80,0.18)] ${currentRole.avatar}`}
          title={`${firstName} · ${currentRole.label}`}
        >
          <RoleIcon size={18} strokeWidth={2.2} />
          <span
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#123A67] ${currentRole.dot}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 overflow-hidden rounded-[15px] border border-white/[0.08] bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${currentRole.avatar}`}
        >
          <RoleIcon size={17} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black text-white">
            {firstName}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-semibold text-white/38">
            {currentRole.description}
          </p>
        </div>

        <span className={`h-2 w-2 shrink-0 rounded-full ${currentRole.dot}`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.09em] ${currentRole.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`} />
          {currentRole.label}
        </span>

        {canManageAdmins ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/30 bg-orange-400/[0.07] px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.09em] text-orange-100">
            <Crown size={9} />
            Owner tools
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Navigation({
  navZones,
  activeTab,
  activeGroupId,
  openGroups,
  onToggleGroup,
  onTabClick,
  collapsed = false,
}) {
  return (
    <nav
      className={collapsed ? "space-y-2.5" : "space-y-3"}
      aria-label="Admin navigation"
    >
      {navZones.map((zone, zoneIndex) => (
        <section
          key={zone.id}
          aria-label={zone.label}
          className={collapsed ? "" : "relative"}
        >
          {!collapsed ? (
            <div className="mb-1.5 flex items-center justify-between gap-3 px-1.5">
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-orange-200/90">
                  {zone.label}
                </p>
                <p className="mt-0.5 truncate text-[8px] font-semibold text-white/25">
                  {zone.description}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[7px] font-black text-white/30">
                {zone.groups.reduce(
                  (sum, group) => sum + group.items.length,
                  0
                )}
              </span>
            </div>
          ) : zoneIndex > 0 ? (
            <div className="mx-auto my-2 h-px w-8 bg-white/10" />
          ) : null}

          <div className={collapsed ? "space-y-1.5" : "space-y-1"}>
            {zone.groups.map((group) => {
              const groupActive = group.id === activeGroupId;
              const groupOpen =
                collapsed || groupActive || openGroups.includes(group.id);

              if (collapsed) {
                return (
                  <div key={group.id} className="space-y-1.5">
                    {group.items.map((item) => {
                      const isActive = activeTab === item.id;
                      const ItemIcon = item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onTabClick(item)}
                          title={
                            item.locked
                              ? `${item.label} — ${item.lockText}`
                              : `${group.title} · ${item.label}`
                          }
                          aria-current={isActive ? "page" : undefined}
                          className={`group relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 ${
                            item.locked
                              ? "cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-white/20 opacity-55"
                              : isActive
                              ? "border-orange-300/70 bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-[0_9px_20px_rgba(249,115,22,0.22)]"
                              : "border-transparent bg-transparent text-white/55 hover:border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <ItemIcon size={17} strokeWidth={2.1} />
                        </button>
                      );
                    })}
                  </div>
                );
              }

              return (
                <div
                  key={group.id}
                  className={`relative rounded-xl transition ${
                    groupActive ? "bg-white/[0.035]" : ""
                  }`}
                >
                  {groupActive ? (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-orange-400" />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onToggleGroup(group.id)}
                    aria-expanded={groupOpen}
                    className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                      groupActive
                        ? "text-orange-100"
                        : "text-white/58 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        groupActive ? "bg-orange-400" : "bg-white/18"
                      }`}
                    />

                    <span className="min-w-0 flex-1 truncate text-[9px] font-black uppercase tracking-[0.11em]">
                      {group.title}
                    </span>

                    <span className="text-[7px] font-black text-white/22">
                      {group.items.length}
                    </span>

                    <ChevronDown
                      size={12}
                      className={`shrink-0 text-white/30 transition duration-200 ${
                        groupOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {groupOpen ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pb-1 pl-2 pr-1">
                          {group.items.map((item) => {
                            const isActive = activeTab === item.id;
                            const ItemIcon = item.icon;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabClick(item)}
                                title={
                                  item.locked
                                    ? item.lockText
                                    : item.description
                                }
                                aria-current={isActive ? "page" : undefined}
                                className={`group relative flex min-h-[40px] w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/50 ${
                                  item.locked
                                    ? "cursor-not-allowed border-transparent bg-transparent text-white/20 opacity-55"
                                    : isActive
                                    ? "border-orange-300/55 bg-gradient-to-r from-orange-500/95 to-orange-500/80 text-white shadow-[0_7px_18px_rgba(249,115,22,0.18)]"
                                    : "border-transparent bg-transparent text-white/76 hover:border-white/[0.07] hover:bg-white/[0.055]"
                                }`}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition duration-200 ${
                                    item.locked
                                      ? "border-white/[0.04] bg-white/[0.02] text-white/18"
                                      : isActive
                                      ? "border-white/20 bg-white/10 text-white"
                                      : "border-white/[0.07] bg-white/[0.04] text-orange-100/90 group-hover:bg-white/[0.08] group-hover:text-white"
                                  }`}
                                >
                                  <ItemIcon size={15} strokeWidth={2.05} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span
                                    className={`block truncate text-[11px] font-extrabold ${
                                      item.locked ? "text-white/22" : "text-white"
                                    }`}
                                  >
                                    {item.label}
                                  </span>

                                  <span className="mt-0.5 block truncate text-[8px] font-semibold text-white/30">
                                    {item.description}
                                  </span>
                                </span>

                                <ChevronRight
                                  size={12}
                                  className={`shrink-0 transition ${
                                    item.locked
                                      ? "opacity-10"
                                      : isActive
                                      ? "text-white/80"
                                      : "text-white/18 group-hover:translate-x-0.5 group-hover:text-orange-200"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function SidebarFooter({ openWebsite, logout, collapsed = false }) {
  if (collapsed) {
    return (
      <div className="relative border-t border-white/[0.08] bg-[#0C294D]/95 px-2 py-3">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={openWebsite}
            title="Open public website"
            aria-label="Open public website"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-white/70 transition hover:border-orange-300/50 hover:bg-white/[0.09] hover:text-white"
          >
            <ExternalLink size={16} />
          </button>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-white/70 transition hover:border-orange-300/50 hover:bg-white/[0.09] hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-t border-white/[0.08] bg-[#0C294D]/96 px-3 py-3">
      <div className="grid gap-2">
        <button
          type="button"
          onClick={openWebsite}
          className="group flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-orange-300/45 hover:bg-white/[0.08]"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-300/50 bg-orange-500 text-white">
              <ExternalLink size={14} />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[11px] font-black text-white">
                Open public website
              </span>
              <span className="mt-0.5 block truncate text-[8px] font-semibold text-white/28">
                zaifanconsultancy.com
              </span>
            </span>
          </span>

          <ChevronRight
            size={13}
            className="shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-orange-200"
          />
        </button>

        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-white/15 hover:bg-white/[0.08]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 transition group-hover:text-white">
            <LogOut size={14} />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-[11px] font-black text-white">
              Sign out
            </span>
            <span className="mt-0.5 block truncate text-[8px] font-semibold text-white/28">
              Securely end this session
            </span>
          </span>
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between px-1 text-[7px] font-black uppercase tracking-[0.12em] text-white/18">
        <span>Zaifan Consultancy</span>
        <span>Internal</span>
      </div>
    </div>
  );
}

export default AdminSidebar;
