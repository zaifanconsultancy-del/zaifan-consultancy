const HIDDEN_STATS_TABS = new Set([
  "analytics",
  "settings",
  "admin-management",
  "activity-logs",
  "my-leads",
  "followups",
]);

export function shouldShowStats(activeTab) {
  const normalizedTab = String(activeTab ?? "").trim().toLowerCase();
  return !HIDDEN_STATS_TABS.has(normalizedTab);
}