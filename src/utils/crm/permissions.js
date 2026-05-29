export const roleLabels = {
  staff: "Staff",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const permissions = {
  staff: {
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
  },

  admin: {
    canDelete: true,
    canClearAll: false,
    canExport: true,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
  },

  super_admin: {
    canDelete: true,
    canClearAll: true,
    canExport: true,
    canManageAdmins: true,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    canUpdateAppointmentPipeline: true,
  },
};