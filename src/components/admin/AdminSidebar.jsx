import { useMemo, useState } from "react";
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
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  X,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

function AdminSidebar({
  activeTab,
  setActiveTab,
  logout,
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const safePermissions = {
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    ...permissions,
  };

  const roleConfig = {
    staff: {
      label: "Staff",
      shortLabel: "Staff",
      icon: UsersRound,
      description: "Student & lead operations",
      badge:
        "border-sky-200 bg-sky-50 text-sky-700",
      avatar:
        "border-sky-200 bg-sky-50 text-sky-700",
      dot: "bg-sky-500",
    },
    admin: {
      label: "Admin",
      shortLabel: "Admin",
      icon: ShieldCheck,
      description: "Operations & CRM control",
      badge:
        "border-orange-200 bg-orange-50 text-orange-700",
      avatar:
        "border-orange-200 bg-orange-50 text-orange-700",
      dot: "bg-orange-500",
    },
    super_admin: {
      label: "Super Admin",
      shortLabel: "Owner",
      icon: Crown,
      description: "Full Zaifan OS control",
      badge:
        "border-orange-200 bg-orange-50 text-orange-700",
      avatar:
        "border-orange-200 bg-orange-50 text-orange-700",
      dot: "bg-orange-500/100",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;
  const RoleIcon = currentRole.icon;

  const navGroups = useMemo(
    () => [
      {
        title: "Workspace",
        description: "Daily operations",
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
        description: "AI & performance",
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
        description: "Administration",
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

  const navItems = navGroups.flatMap((group) => group.items);
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
      {/* Mobile top bar */}
      <div className="sticky top-0 z-50 border-b border-orange-100 bg-[#fffaf5]/96 px-3 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl xl:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-100 bg-white text-[#071f50] shadow-sm transition duration-300 hover:border-orange-200 hover:text-orange-600 active:scale-95"
            aria-label="Open admin navigation"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.28em] text-orange-600">
                Zaifan OS
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Admin
              </span>
            </div>

            <p className="mt-1 truncate text-base font-black text-[#071f50]">
              {activeItem?.label || "Workspace"}
            </p>
          </div>

          <div
            className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] sm:flex ${currentRole.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`} />
            {currentRole.shortLabel}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
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
              className="fixed inset-0 z-[70] bg-[#071f50]/20 backdrop-blur-sm xl:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.38, ease: EASE }}
              className="fixed inset-y-0 left-0 z-[80] flex w-[min(88vw,340px)] flex-col border-r border-orange-100 bg-[#fffaf5] shadow-[32px_0_90px_rgba(121,72,40,0.16)] xl:hidden"
            >
              <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
                <BrandBlock compact />

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-500 transition hover:border-orange-200 hover:text-orange-600"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
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

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[304px] shrink-0 border-r border-orange-100 bg-[#fffaf5] text-[#071f50] shadow-[24px_0_70px_rgba(121,72,40,0.12)] xl:flex xl:flex-col">
        <div className="pointer-events-none absolute left-[-120px] top-[-100px] h-72 w-72 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-140px] right-[-140px] h-72 w-72 rounded-full bg-sky-200/20 blur-3xl" />

        <div className="relative border-b border-orange-100 px-5 py-5">
          <BrandBlock />
        </div>

        <div className="zaifan-admin-sidebar-scroll relative flex-1 overflow-y-auto px-4 py-5">
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

        <div className="relative">
          <SidebarFooter openWebsite={openWebsite} logout={logout} />
        </div>

        <style>{`
          .zaifan-admin-sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(249, 115, 22, 0.28) transparent;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(249, 115, 22, 0.22);
            border-radius: 999px;
          }

          .zaifan-admin-sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(249, 115, 22, 0.38);
          }
        `}</style>
      </aside>
    </>
  );
}

function BrandBlock({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_10px_28px_rgba(249,115,22,0.22)] ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <Sparkles size={compact ? 18 : 21} strokeWidth={2.3} />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#fffaf5] bg-emerald-500" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xl font-black tracking-tight text-[#071f50]">
            Zaifan
          </p>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-orange-600">
            OS
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
}) {
  const name = adminProfile?.full_name || adminProfile?.name || "Admin User";
  const firstName = name.split(" ")[0] || "Admin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="mb-6 overflow-hidden rounded-[1.4rem] border border-orange-100 bg-white p-4 shadow-[0_10px_30px_rgba(121,72,40,0.08)]"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${currentRole.avatar}`}
        >
          <RoleIcon size={19} strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#071f50]">
            {firstName}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
            {currentRole.description}
          </p>
        </div>

        <span className={`h-2 w-2 shrink-0 rounded-full ${currentRole.dot}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${currentRole.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${currentRole.dot}`} />
          {currentRole.label}
        </span>

        {canManageAdmins && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Crown size={11} />
            Owner tools
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Navigation({ navGroups, activeTab, onTabClick }) {
  return (
    <nav className="space-y-6" aria-label="Admin navigation">
      {navGroups.map((group) => (
        <div key={group.title}>
          <div className="mb-2 px-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              {group.title}
            </p>
          </div>

          <div className="space-y-1.5">
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              const ItemIcon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabClick(item)}
                  title={item.locked ? item.lockText : item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${
                    item.locked
                      ? "cursor-not-allowed bg-white/60 text-slate-400 opacity-70"
                      : isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_12px_30px_rgba(249,115,22,0.30)]"
                      : "border border-transparent bg-white text-orange-700 shadow-[0_3px_12px_rgba(121,72,40,0.035)] hover:border-orange-100 hover:bg-[#fff1e7] hover:text-orange-700 hover:shadow-[0_8px_24px_rgba(121,72,40,0.08)]"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition duration-300 ${
                      item.locked
                        ? "border border-slate-200 bg-slate-50 text-slate-400"
                        : isActive
                        ? "bg-white/15 text-white"
                        : "border border-orange-100 bg-[#fffaf5] text-orange-600 group-hover:border-orange-200 group-hover:bg-white group-hover:text-orange-700"
                    }`}
                  >
                    <ItemIcon size={17} strokeWidth={2.1} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-extrabold ${
                        isActive ? "text-white" : item.locked ? "text-slate-400" : "text-orange-700"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-[11px] font-semibold ${
                        item.locked
                          ? "text-slate-500"
                          : isActive
                          ? "text-orange-100"
                          : "text-[#7c4a2f]"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>

                  <ChevronRight
                    size={15}
                    className={`shrink-0 transition duration-300 ${
                      item.locked
                        ? "opacity-20"
                        : isActive
                        ? "translate-x-0 text-white"
                        : "-translate-x-1 text-orange-400 opacity-0 group-hover:translate-x-0 group-hover:text-orange-600 group-hover:opacity-100"
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

function SidebarFooter({ openWebsite, logout }) {
  return (
    <div className="relative overflow-hidden border-t border-orange-100 bg-[#fffaf5] p-4 shadow-[0_-10px_28px_rgba(121,72,40,0.06)]">
      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-orange-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-36 w-36 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative">
        <button
          type="button"
          onClick={openWebsite}
          className="group mb-2 flex w-full items-center justify-between rounded-2xl border border-orange-200 bg-white px-4 py-3 text-left text-sm font-black text-[#071f50] shadow-[0_6px_18px_rgba(121,72,40,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-[#fff3e8] hover:text-orange-700 hover:shadow-[0_10px_24px_rgba(121,72,40,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-[0_6px_16px_rgba(249,115,22,0.22)]">
              <ExternalLink size={15} />
            </span>
            <span>Open public website</span>
          </span>
          <ChevronRight
            size={15}
            className="text-orange-400 transition duration-300 group-hover:translate-x-0.5 group-hover:text-orange-700"
          />
        </button>

        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-black text-[#071f50] transition duration-300 hover:border-orange-200 hover:bg-white hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-100 bg-white text-orange-600 shadow-sm transition group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700">
            <LogOut size={15} />
          </span>
          Sign out
        </button>

        <div className="mt-3 flex items-center justify-between border-t border-orange-100 px-1 pt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
          <span>Zaifan Consultancy</span>
          <span>Internal</span>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
