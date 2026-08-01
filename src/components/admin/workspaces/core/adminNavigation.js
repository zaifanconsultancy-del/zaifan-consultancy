import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  CalendarDays,
  BellRing,
  FileClock,
  Gauge,
  GraduationCap,
  ListChecks,
  Mail,
  Megaphone,
  MessageCircle,
  PhoneCall,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Smartphone,
  Radar,
  RadioTower,
  Network,
  Target,
  UsersRound,
} from "lucide-react";

export const DEFAULT_ADMIN_TAB = "home";

export const ADMIN_TAB_ALIASES = Object.freeze({
  dashboard: "home",
  overview: "home",
  leads: "inquiries",
  pipeline: "inquiries",
  automation: "operations-automation",
  notifications: "communication-notifications",
  "operations-actions": "communication-notifications",
  communication: "communications",
  analytics: "crm-analytics",
  intelligence: "ai-command",
  "team-intelligence": "team-performance",
  "admin-management": "team-access",
  team: "team-command",
  logs: "system-activity",
  "activity-logs": "system-activity",
  settings: "system-settings",
  system: "system-overview",
  knowledge: "knowledge-os",
  mobile: "mobile-os",
});

export const ADMIN_NAVIGATION_ZONES = Object.freeze([
  {
    id: "daily-work",
    label: "Daily Work",
    description: "Students, leads and day-to-day delivery",
    groupIds: ["home", "leads", "students"],
  },
  {
    id: "service-ops",
    label: "Service & Operations",
    description: "Communication, execution and team ownership",
    groupIds: ["communications", "operations", "team"],
  },
  {
    id: "business",
    label: "Business & Network",
    description: "Intelligence, growth, partners and governance",
    groupIds: ["intelligence", "growth", "network", "governance"],
  },
  {
    id: "system",
    label: "System",
    description: "Audit, configuration and shell controls",
    groupIds: ["system"],
  },
]);

export const ADMIN_NAVIGATION = Object.freeze([
  {
    id: "home",
    title: "Home",
    description: "One operating picture",
    items: [
      {
        id: "home",
        label: "Command Home",
        shortLabel: "Home",
        description: "Urgent work and system health",
        icon: LayoutDashboard,
        keywords: "home dashboard overview command urgent system health",
      },
    ],
  },
  {
    id: "leads",
    title: "Leads",
    description: "Acquisition and follow-through",
    items: [
      {
        id: "inquiries",
        label: "Inquiries",
        shortLabel: "Inquiries",
        description: "New student leads",
        icon: Gauge,
        keywords: "lead inquiry new student crm pipeline",
      },
      {
        id: "appointments",
        label: "Appointments",
        shortLabel: "Appointments",
        description: "Consultation bookings",
        icon: CalendarDays,
        keywords: "appointment consultation booking calendar",
      },
      {
        id: "my-leads",
        label: "My Leads",
        shortLabel: "My Leads",
        description: "Assigned ownership",
        icon: Target,
        keywords: "assigned lead owner counselor staff",
      },
      {
        id: "followups",
        label: "Follow-ups",
        shortLabel: "Follow-ups",
        description: "Next actions and reminders",
        icon: FileClock,
        keywords: "follow up reminder overdue next action",
      },
    ],
  },
  {
    id: "students",
    title: "Students",
    description: "Canonical student case ownership",
    items: [
      {
        id: "students",
        label: "Master Students",
        shortLabel: "Students",
        description: "One person, linked source history",
        icon: GraduationCap,
        keywords: "students directory master identity person portal application documents visa",
      },
    ],
  },
  {
    id: "communications",
    title: "Communications",
    description: "Student outreach and channel operations",
    items: [
      {
        id: "communications",
        label: "Communication Hub",
        shortLabel: "Comms Hub",
        description: "One communication operating picture",
        icon: RadioTower,
        keywords: "communication hub outreach channels student engagement",
      },
      {
        id: "communication-email",
        label: "Email",
        shortLabel: "Email",
        description: "Email-ready CRM queue",
        icon: Mail,
        keywords: "email mail outreach inbox workflow",
      },
      {
        id: "communication-whatsapp",
        label: "WhatsApp",
        shortLabel: "WhatsApp",
        description: "WhatsApp student queue",
        icon: MessageCircle,
        keywords: "whatsapp message phone student contact",
      },
      {
        id: "communication-calls-meetings",
        label: "Calls & Meetings",
        shortLabel: "Calls",
        description: "Callbacks and scheduled meetings",
        icon: PhoneCall,
        keywords: "calls callbacks phone meetings schedule appointments",
      },
      {
        id: "communication-notifications",
        label: "Notifications",
        shortLabel: "Alerts",
        description: "CRM alerts requiring action",
        icon: BellRing,
        keywords: "notification alerts action center reminders",
      },
      {
        id: "communication-analytics",
        label: "Comm Analytics",
        shortLabel: "Comm Analytics",
        description: "Channel-level reporting",
        icon: BarChart3,
        keywords: "communication analytics channel reporting metrics",
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    description: "Tasks and workflow automation",
    items: [
      {
        id: "operations-tasks",
        label: "Tasks",
        shortLabel: "Tasks",
        description: "Cross-student task inbox",
        icon: ListChecks,
        keywords: "tasks student tasks work queue overdue",
      },
      {
        id: "operations-automation",
        label: "Automation",
        shortLabel: "Automation",
        description: "Rules and workflow intelligence",
        icon: Bot,
        keywords: "automation workflow rules engine stages reminders",
      },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    description: "Focused intelligence workspaces",
    items: [
      {
        id: "ai-command",
        label: "AI Command",
        shortLabel: "AI Command",
        description: "Executive AI and lead intelligence",
        icon: BrainCircuit,
        keywords: "ai executive copilot lead intelligence prioritization",
      },
      {
        id: "crm-analytics",
        label: "CRM Analytics",
        shortLabel: "CRM Analytics",
        description: "KPIs, scoring, conversion and funnel",
        icon: BarChart3,
        keywords: "analytics kpi lead scoring conversion charts funnel",
      },
      {
        id: "risk-intelligence",
        label: "Risk & Health",
        shortLabel: "Risk",
        description: "Visa risk and student health signals",
        icon: ShieldCheck,
        keywords: "visa risk health student lead risk monitoring",
      },
      {
        id: "executive-intelligence",
        label: "Executive",
        shortLabel: "Executive",
        description: "Mission control and CRM command",
        icon: Radar,
        keywords: "mission control crm command executive portfolio",
      },
    ],
  },
  {
    id: "team",
    title: "Team",
    description: "Counselors, capacity and access",
    items: [
      {
        id: "team-command",
        label: "Counselor Command",
        shortLabel: "Team Command",
        description: "Counselor operating picture",
        icon: UsersRound,
        keywords: "counselor command queue ownership team operations",
      },
      {
        id: "team-workload",
        label: "Workload",
        shortLabel: "Workload",
        description: "Capacity and assignment balance",
        icon: Gauge,
        keywords: "workload capacity assignment unassigned overloaded counselor",
      },
      {
        id: "team-performance",
        label: "Performance",
        shortLabel: "Performance",
        description: "Staff analytics and counselor AI",
        icon: BarChart3,
        keywords: "staff performance counselor ai leaderboard analytics team",
      },
      {
        id: "team-access",
        label: "Access & Roles",
        shortLabel: "Access",
        description: "Admins and permissions",
        icon: ShieldCheck,
        keywords: "team admin staff role permission access",
        permission: "canManageAdmins",
        lockText: "Only Super Admin can manage admins.",
      },
    ],
  },
  {
    id: "growth",
    title: "Growth & Revenue",
    description: "Money and acquisition systems",
    items: [
      {
        id: "enterprise-finance",
        label: "Finance OS",
        shortLabel: "Finance",
        description: "Revenue, cashflow and commissions",
        icon: BadgeDollarSign,
        keywords: "finance revenue cashflow commission expense profit loss forecast",
      },
      {
        id: "enterprise-marketing",
        label: "Marketing OS",
        shortLabel: "Marketing",
        description: "Campaigns, sources and ROI",
        icon: Megaphone,
        keywords: "marketing campaign source roi funnel content lead acquisition",
      },
    ],
  },
  {
    id: "network",
    title: "Network",
    description: "Partners and external agents",
    items: [
      {
        id: "enterprise-partners",
        label: "Partner OS",
        shortLabel: "Partners",
        description: "University and partner network",
        icon: Network,
        keywords: "partner university network commission relationship",
      },
      {
        id: "enterprise-agents",
        label: "Agent Operations",
        shortLabel: "Agents",
        description: "Agent leads, students and commissions",
        icon: UsersRound,
        keywords: "agent network lead submission students commission performance",
      },
    ],
  },
  {
    id: "governance",
    title: "Governance",
    description: "Compliance and internal people systems",
    items: [
      {
        id: "enterprise-compliance",
        label: "Compliance OS",
        shortLabel: "Compliance",
        description: "Policy, audit and data protection",
        icon: ShieldCheck,
        keywords: "compliance audit policy risk register data protection governance",
      },
      {
        id: "enterprise-hr",
        label: "People & HR",
        shortLabel: "HR",
        description: "Employees, leave and development",
        icon: UsersRound,
        keywords: "hr people employee leave recruitment training performance",
      },
    ],
  },
  {
    id: "system",
    title: "System",
    description: "Shell, audit and configuration",
    items: [
      {
        id: "knowledge-os",
        label: "Knowledge OS",
        shortLabel: "Knowledge",
        description: "SOPs, visa, universities and policy",
        icon: BookOpen,
        keywords: "knowledge sop visa university policy training playbook",
      },
      {
        id: "mobile-os",
        label: "Mobile OS",
        shortLabel: "Mobile",
        description: "Student, counselor, devices and push",
        icon: Smartphone,
        keywords: "mobile student counselor app devices push notifications sessions",
      },
      {
        id: "system-overview",
        label: "System Overview",
        shortLabel: "System",
        description: "Admin shell and ownership map",
        icon: ShieldCheck,
        keywords: "system admin shell command palette search ownership access",
      },
      {
        id: "system-activity",
        label: "Activity & Audit",
        shortLabel: "Activity",
        description: "Admin audit trail",
        icon: Activity,
        keywords: "activity logs audit history admin action timeline",
        permission: "canManageAdmins",
        lockText: "Only Super Admin can view activity logs.",
      },
      {
        id: "system-settings",
        label: "Settings",
        shortLabel: "Settings",
        description: "System preferences",
        icon: Settings,
        keywords: "settings preferences configuration system",
        permission: "canManageAdmins",
        lockText: "Only Super Admin can open settings.",
      },
    ],
  },
]);

export function normalizeAdminTab(tab) {
  const value = String(tab || "").trim();
  if (!value) return DEFAULT_ADMIN_TAB;

  const normalized = ADMIN_TAB_ALIASES[value] || value;
  const exists = ADMIN_NAVIGATION.some((group) =>
    group.items.some((item) => item.id === normalized)
  );

  return exists ? normalized : DEFAULT_ADMIN_TAB;
}

export function getAdminNavigationZones(permissions = {}) {
  const groups = getAdminNavigationGroups(permissions);
  const groupsById = new Map(groups.map((group) => [group.id, group]));

  return ADMIN_NAVIGATION_ZONES.map((zone) => ({
    ...zone,
    groups: zone.groupIds
      .map((groupId) => groupsById.get(groupId))
      .filter(Boolean),
  })).filter((zone) => zone.groups.length > 0);
}

export function getAdminNavigationGroups(permissions = {}) {
  return ADMIN_NAVIGATION.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const locked = item.permission ? !permissions?.[item.permission] : false;

      return {
        ...item,
        locked,
      };
    }),
  }));
}

export function getAdminNavigationItems(permissions = {}) {
  return getAdminNavigationGroups(permissions).flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupId: group.id,
      groupTitle: group.title,
    }))
  );
}

export function getAdminNavigationItem(tab, permissions = {}) {
  const normalized = normalizeAdminTab(tab);

  return (
    getAdminNavigationItems(permissions).find((item) => item.id === normalized) ||
    getAdminNavigationItems(permissions)[0] ||
    null
  );
}
