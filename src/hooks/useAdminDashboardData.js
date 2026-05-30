import { useEffect, useRef, useState } from "react";

import useRealtimeCRM from "./useRealtimeCRM";

import {
  fetchInquiryRows,
} from "../services/crm/inquiryService";

import {
  fetchAppointmentRows,
} from "../services/crm/appointmentService";

import { fetchFollowUpReminderRows } from "../services/crm/reminderService";

import {
  fetchAssignmentsForLeadTypeRows,
  getUniqueAssignments,
} from "../services/crm/assignmentService";

import { withTimeout } from "../utils/crm/requestUtils";

export default function useAdminDashboardData({ isLoggedIn, adminProfile }) {
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followUpReminders, setFollowUpReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAssignmentsForLeadType = async (leadType, ids = []) => {
    if (!ids.length) return [];

    try {
      const { data, error } = await withTimeout(
        fetchAssignmentsForLeadTypeRows(leadType, ids),
        `${leadType} assignments fetch`
      );

      if (error) {
        console.error("Assignment fetch error:", error);
        return [];
      }

      return getUniqueAssignments(data || []);
    } catch (error) {
      console.error("Assignment timeout/error:", error);
      return [];
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data, error } = await withTimeout(
        fetchInquiryRows(),
        "Inquiries fetch"
      );

      if (error) {
        console.error(error);
        throw new Error("Failed to load inquiries.");
      }

      const inquiryRows = data || [];
      const inquiryIds = inquiryRows.map((item) => String(item.id));

      const assignments = await fetchAssignmentsForLeadType(
        "inquiry",
        inquiryIds
      );

      const mergedInquiries = inquiryRows.map((inquiry) => {
        const assignment = assignments.find(
          (item) => String(item.lead_id) === String(inquiry.id)
        );

        return {
          ...inquiry,
          assigned_admin_id: assignment?.assigned_admin_id || null,
          assigned_admin_name: assignment?.assigned_admin_name || null,
        };
      });

      safeSetState(() => setInquiries(mergedInquiries));
      return mergedInquiries;
    } catch (error) {
      console.error("Inquiries fetch crash:", error);
      throw error;
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await withTimeout(
        fetchAppointmentRows(),
        "Appointments fetch"
      );

      if (error) {
        console.error(error);
        throw new Error("Failed to load appointments.");
      }

      const appointmentRows = data || [];
      const appointmentIds = appointmentRows.map((item) => String(item.id));

      const assignments = await fetchAssignmentsForLeadType(
        "appointment",
        appointmentIds
      );

      const mergedAppointments = appointmentRows.map((appointment) => {
        const assignment = assignments.find(
          (item) => String(item.lead_id) === String(appointment.id)
        );

        return {
          ...appointment,
          assigned_admin_id: assignment?.assigned_admin_id || null,
          assigned_admin_name: assignment?.assigned_admin_name || null,
        };
      });

      safeSetState(() => setAppointments(mergedAppointments));
      return mergedAppointments;
    } catch (error) {
      console.error("Appointments fetch crash:", error);
      throw error;
    }
  };

  const fetchFollowUpReminders = async () => {
    try {
      const { data, error } = await withTimeout(
        fetchFollowUpReminderRows(),
        "Follow-up reminders fetch"
      );

      if (error) {
        console.error(error);
        return [];
      }

      const reminderRows = data || [];
      safeSetState(() => setFollowUpReminders(reminderRows));
      return reminderRows;
    } catch (error) {
      console.error("Follow-up reminders fetch timeout/error:", error);
      safeSetState(() => setFollowUpReminders([]));
      return [];
    }
  };

  const fetchAllData = async ({ silent = false } = {}) => {
    if (loadingRef.current && !silent) return;

    loadingRef.current = true;

    safeSetState(() => {
      setLoadError("");
      if (!silent) setLoading(true);
    });

    try {
      const results = await Promise.allSettled([
        fetchInquiries(),
        fetchAppointments(),
        fetchFollowUpReminders(),
      ]);

      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        console.error("CRM fetch failures:", failed);

        safeSetState(() => {
          setLoadError(
            "Some CRM data could not load. Check your internet and refresh."
          );
        });
      } else {
        safeSetState(() => setLoadError(""));
      }
    } catch (error) {
      console.error("Fetch all data crash:", error);

      safeSetState(() => {
        setLoadError("CRM refresh timed out. Check your internet and retry.");
      });
    } finally {
      loadingRef.current = false;
      safeSetState(() => setLoading(false));
    }
  };

  useRealtimeCRM({
    enabled: isLoggedIn && !!adminProfile,

    onInquiryChange: () => {
      fetchAllData({ silent: true });
    },

    onAppointmentChange: () => {
      fetchAllData({ silent: true });
    },

    onReminderChange: () => {
      fetchAllData({ silent: true });
    },

    onAnyChange: () => {
      fetchAllData({ silent: true });
    },
  });

  useEffect(() => {
    if (isLoggedIn && adminProfile) {
      fetchAllData();
    }
  }, [isLoggedIn, adminProfile?.id]);

  const clearLocalData = () => {
    safeSetState(() => {
      setInquiries([]);
      setAppointments([]);
      setFollowUpReminders([]);
      setLoading(false);
      setLoadError("");
    });
  };

  return {
    inquiries,
    setInquiries,

    appointments,
    setAppointments,

    followUpReminders,
    setFollowUpReminders,

    loading,
    loadError,

    fetchAllData,
    clearLocalData,
  };
}