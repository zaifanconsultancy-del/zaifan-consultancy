export const roleLabels = Object.freeze({
  staff: "Staff",
  admin: "Admin",
  super_admin: "Super Admin",
});

export const rolePermissions = Object.freeze({
  staff: Object.freeze({
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
  }),

  admin: Object.freeze({
    canDelete: true,
    canClearAll: false,
    canExport: true,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
  }),

  super_admin: Object.freeze({
    canDelete: true,
    canClearAll: true,
    canExport: true,
    canManageAdmins: true,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
  }),
});

function normalizeRole(role = "") {
  return String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getPermissionsForRole(role) {
  const normalizedRole = normalizeRole(role);
  return rolePermissions[normalizedRole] || rolePermissions.staff;
}