import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function useStudentSupportActions({
  studentIdentity,
  studentId,
  studentType,
  adminProfile,
  studentSupportRequests = [],
  setStudentSupportRequests,
  loadStudentOsData,
  runWithTimeout,
  fireTimelineEvent,
}) {
  const [supportResponseDrafts, setSupportResponseDrafts] = useState({});
  const [savingSupportResponseId, setSavingSupportResponseId] = useState(null);
  const [supportActionStatus, setSupportActionStatus] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    setSupportResponseDrafts({});
    setSavingSupportResponseId(null);
    setSupportActionStatus({ type: "", message: "" });
  }, [studentIdentity]);

  useEffect(() => {
    setSupportResponseDrafts((current) => {
      const next = { ...current };

      studentSupportRequests.forEach((request) => {
        if (!request?.id) return;
        if (Object.prototype.hasOwnProperty.call(next, request.id)) return;

        next[request.id] =
          request.counselor_response ??
          request.admin_response ??
          request.response ??
          "";
      });

      return next;
    });
  }, [studentSupportRequests]);

  const patchLocalSupportRequest = useCallback(
    (requestId, patch = {}) => {
      if (typeof setStudentSupportRequests !== "function") return;

      setStudentSupportRequests((prev) =>
        (Array.isArray(prev) ? prev : []).map((request) =>
          String(request.id) === String(requestId)
            ? { ...request, ...patch }
            : request
        )
      );
    },
    [setStudentSupportRequests]
  );

  const updateSupportRequestSafely = useCallback(
    async (requestId, payload = {}) => {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );

      let result = await supabase
        .from("student_support_requests")
        .update(cleanPayload)
        .eq("id", requestId)
        .select("*")
        .single();

      if (!result.error) return result.data;

      const message = String(result.error?.message || "").toLowerCase();
      const shouldRetryMinimal =
        message.includes("updated_at") ||
        message.includes("resolved_at") ||
        message.includes("column");

      if (!shouldRetryMinimal) throw result.error;

      const minimalPayload = { ...cleanPayload };
      delete minimalPayload.updated_at;

      if (message.includes("resolved_at")) {
        delete minimalPayload.resolved_at;
      }

      result = await supabase
        .from("student_support_requests")
        .update(minimalPayload)
        .eq("id", requestId)
        .select("*")
        .single();

      if (result.error) throw result.error;
      return result.data;
    },
    []
  );

  const handleSupportResponseChange = useCallback((requestId, value) => {
    setSupportResponseDrafts((prev) => ({
      ...prev,
      [requestId]: value,
    }));
  }, []);

  const handleSupportResponseSubmit = useCallback(
    async (request) => {
      if (!request?.id || savingSupportResponseId === request.id) return;

      const responseText = String(
        supportResponseDrafts[request.id] ??
          request.counselor_response ??
          ""
      ).trim();

      if (!responseText) {
        setSupportActionStatus({
          type: "warning",
          message: "Write a counselor response before sending.",
        });
        return;
      }

      const now = new Date().toISOString();

      setSavingSupportResponseId(request.id);
      setSupportActionStatus({
        type: "info",
        message: "Sending counselor response...",
      });

      try {
        const optimisticPatch = {
          counselor_response: responseText,
          responded_at: now,
          status: "resolved",
          resolved_at: request.resolved_at || now,
          updated_at: now,
        };

        patchLocalSupportRequest(request.id, optimisticPatch);

        const savedRequest = await runWithTimeout(
          updateSupportRequestSafely(request.id, optimisticPatch),
          "Counselor response",
          18000
        );

        if (savedRequest?.id) {
          patchLocalSupportRequest(request.id, savedRequest);
        }

        setSupportResponseDrafts((prev) => ({
          ...prev,
          [request.id]: responseText,
        }));

        setSupportActionStatus({
          type: "success",
          message:
            "Counselor response sent. Student can now see it in Support Center.",
        });

        if (typeof fireTimelineEvent === "function") {
          await fireTimelineEvent({
            actionType: "support_response",
            title: "Counselor Responded",
            description: `Counselor responded to support request: ${
              request.category ||
              request.request_type ||
              "Support Request"
            }.`,
            request,
            metadata: { status: "resolved" },
          });
        }

        await loadStudentOsData();
      } catch (error) {
        console.error("Support response failed:", error);

        setSupportActionStatus({
          type: "warning",
          message: error?.message || "Counselor response failed.",
        });

        await loadStudentOsData();
      } finally {
        setSavingSupportResponseId(null);
      }
    },
    [
      fireTimelineEvent,
      loadStudentOsData,
      patchLocalSupportRequest,
      runWithTimeout,
      savingSupportResponseId,
      supportResponseDrafts,
      updateSupportRequestSafely,
    ]
  );

  const handleSupportStatusChange = useCallback(
    async (request, nextStatus) => {
      if (!request?.id || savingSupportResponseId === request.id) return;

      const currentStatus = normalize(request.status || "open");
      const cleanNextStatus = normalize(nextStatus || "open");

      if (currentStatus === cleanNextStatus) return;

      setSavingSupportResponseId(request.id);
      setSupportActionStatus({
        type: "info",
        message: `Updating support request to ${cleanNextStatus.replace(
          /_/g,
          " "
        )}...`,
      });

      try {
        const now = new Date().toISOString();
        const payload = {
          status: cleanNextStatus,
          updated_at: now,
        };

        if (["resolved", "closed"].includes(cleanNextStatus)) {
          payload.resolved_at = request.resolved_at || now;
        }

        patchLocalSupportRequest(request.id, payload);

        const savedRequest = await runWithTimeout(
          updateSupportRequestSafely(request.id, payload),
          "Support status update",
          15000
        );

        if (savedRequest?.id) {
          patchLocalSupportRequest(request.id, savedRequest);
        }

        setSupportActionStatus({
          type: "success",
          message: `Support request marked ${cleanNextStatus.replace(
            /_/g,
            " "
          )}.`,
        });

        if (typeof fireTimelineEvent === "function") {
          await fireTimelineEvent({
            actionType: "support_status_changed",
            title: "Support Request Updated",
            description: `Support request status changed from ${currentStatus.replace(
              /_/g,
              " "
            )} to ${cleanNextStatus.replace(/_/g, " ")}.`,
            oldValue: currentStatus,
            newValue: cleanNextStatus,
            request,
            metadata: { status: cleanNextStatus },
          });
        }

        await loadStudentOsData();
      } catch (error) {
        console.error("Support status update failed:", error);

        setSupportActionStatus({
          type: "warning",
          message:
            error?.message || "Support status could not be updated.",
        });

        await loadStudentOsData();
      } finally {
        setSavingSupportResponseId(null);
      }
    },
    [
      fireTimelineEvent,
      loadStudentOsData,
      patchLocalSupportRequest,
      runWithTimeout,
      savingSupportResponseId,
      updateSupportRequestSafely,
    ]
  );

  const openSupportRequests = useMemo(
    () =>
      studentSupportRequests.filter(
        (request) =>
          !["resolved", "closed"].includes(
            normalize(request.status || "open")
          )
      ).length,
    [studentSupportRequests]
  );

  return {
    supportResponseDrafts,
    savingSupportResponseId,
    supportActionStatus,
    openSupportRequests,
    handleSupportResponseChange,
    handleSupportResponseSubmit,
    handleSupportStatusChange,
  };
}
