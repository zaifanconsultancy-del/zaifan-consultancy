export function shouldShowStats(activeTab) {
  return ![
    "analytics",
    "settings",
    "admin-management",
    "activity-logs",
    "my-leads",
    "followups",
  ].includes(activeTab);
}