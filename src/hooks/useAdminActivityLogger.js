import { createActivityLogRow } from "../services/crm/activityLogService";
import { withTimeout } from "../utils/crm/requestUtils";

export default function useAdminActivityLogger({ adminUser, adminProfile }) {
  const logActivity = async ({ action, targetType, targetId, details }) => {
    try {
      const { error } = await withTimeout(
        createActivityLogRow({
          adminId: adminUser?.id || null,
          adminName: adminProfile?.full_name || "Unknown Admin",
          action,
          targetType,
          targetId,
          details,
        }),
        "Activity log insert"
      );

      if (error) {
        console.error("Activity log failed:", error);
      }
    } catch (error) {
      console.error("Activity log timeout/error:", error);
    }
  };

  return { logActivity };
}