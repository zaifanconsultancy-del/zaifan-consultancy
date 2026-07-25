import { useCallback } from "react";

import { createActivityLogRow } from "../services/crm/activityLogService";
import { withTimeout } from "../utils/crm/requestUtils";

const DEFAULT_ADMIN_NAME = "Unknown Admin";

const normalizeLogValue = (value) => {
  if (value === undefined || value === null) return null;
  return value;
};

export default function useAdminActivityLogger({ adminUser, adminProfile }) {
  const logActivity = useCallback(
    async ({ action, targetType, targetId, details } = {}) => {
      if (!action || !targetType) {
        console.warn("Activity log skipped: action and targetType are required.");
        return { ok: false, skipped: true };
      }

      try {
        const { error } = await withTimeout(
          createActivityLogRow({
            adminId: adminUser?.id || null,
            adminName: adminProfile?.full_name || DEFAULT_ADMIN_NAME,
            action: String(action).trim(),
            targetType: String(targetType).trim(),
            targetId: normalizeLogValue(targetId),
            details: normalizeLogValue(details),
          }),
          "Activity log insert"
        );

        if (error) {
          console.error("Activity log failed:", error);
          return { ok: false, error };
        }

        return { ok: true };
      } catch (error) {
        console.error("Activity log timeout/error:", error);
        return { ok: false, error };
      }
    },
    [adminProfile?.full_name, adminUser?.id]
  );

  return { logActivity };
}
