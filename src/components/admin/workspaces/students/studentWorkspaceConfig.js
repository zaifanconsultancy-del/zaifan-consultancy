import {
  Activity,
  Bot,
  BrainCircuit,
  Building2,
  CalendarCheck2,
  GraduationCap,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Map as MapIcon,
  MessageSquareText,
  Sparkles,
  Target,
  UsersRound,
  WalletCards,
  WandSparkles,
  FolderOpen,
} from "lucide-react";

export const STUDENT_WORKSPACE_GROUPS = Object.freeze([
  {
    id: "case",
    title: "Student Case",
    description: "The student's actual study-abroad journey",
    items: [
      ["overview", "Case Overview", "Identity, readiness & next actions", LayoutDashboard],
      ["applications", "Applications", "University application workflow", GraduationCap],
      ["documents", "Documents", "Permanent case vault & verification", FolderOpen],
      ["universities", "Universities", "Shortlist & destination planning", Building2],
      ["visa", "Visa", "Visa readiness & workflow", MapIcon],
    ],
  },
  {
    id: "service",
    title: "Service & Finance",
    description: "Access, money, support and communication",
    items: [
      ["portal-account", "Portal Access", "Student login & security", LockKeyhole],
      ["payments", "Finance", "Invoices, payments & receipts", WalletCards],
      ["support-requests", "Support", "Student requests & responses", LifeBuoy],
      ["communication", "Communication", "Student outreach history", MessageSquareText],
    ],
  },
  {
    id: "operations",
    title: "Case Operations",
    description: "Internal ownership and workflow controls",
    items: [
      ["pipeline", "Journey Pipeline", "Workflow stage tracking", Target],
      ["assignment", "Ownership", "Counselor & staff assignment", UsersRound],
      ["followups", "Follow-ups", "Reminders & next actions", CalendarCheck2],
      ["timeline", "Timeline", "Complete CRM history", History],
      ["operations", "Tasks", "Tasks, queue & smart actions", ListChecks],
      ["analytics", "Case Analytics", "Journey intelligence", Activity],
    ],
  },
  {
    id: "ai",
    title: "AI Tools",
    description: "Optional intelligence tools, not the main case workflow",
    items: [
      ["ai-workspace", "GPT Workspace", "Deep counselor copilot", Bot],
      ["gpt-intelligence", "GPT Intelligence", "Stored analysis & strategy", BrainCircuit],
      ["ai", "Quick AI Actions", "Fast counselor generation", WandSparkles],
      ["executive-ai", "Executive AI", "Student intelligence dashboard", Sparkles],
    ],
  },
]);

export const STUDENT_WORKSPACE_ITEMS = Object.freeze(
  STUDENT_WORKSPACE_GROUPS.flatMap((group) => group.items)
);

export function getStudentWorkspaceDefinition(panelId) {
  const item = STUDENT_WORKSPACE_ITEMS.find(([id]) => id === panelId);

  if (!item) {
    return {
      id: "overview",
      label: "Student Case",
      description: "Complete Student 360 operating workspace",
      icon: LayoutDashboard,
    };
  }

  return {
    id: item[0],
    label: item[1],
    description: item[2],
    icon: item[3],
  };
}

export function filterStudentWorkspaceGroups(query = "") {
  const normalized = String(query || "").trim().toLowerCase();

  if (!normalized) return STUDENT_WORKSPACE_GROUPS;

  return STUDENT_WORKSPACE_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(([, label, description]) =>
      `${label} ${description} ${group.title} ${group.description}`
        .toLowerCase()
        .includes(normalized)
    ),
  })).filter((group) => group.items.length > 0);
}
