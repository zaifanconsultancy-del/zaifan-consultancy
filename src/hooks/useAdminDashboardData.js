import { useEffect, useRef, useState } from "react";

import useRealtimeCRM from "./useRealtimeCRM";
import { supabase } from "../lib/supabaseClient";

import { fetchInquiryRows } from "../services/crm/inquiryService";
import { fetchAppointmentRows } from "../services/crm/appointmentService";
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

  const [studentApplications, setStudentApplications] = useState([]);
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentUniversities, setStudentUniversities] = useState([]);
  const [studentRiskScores, setStudentRiskScores] = useState([]);

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
    const { data, error } = await withTimeout(
      fetchInquiryRows(),
      "Inquiries fetch"
    );

    if (error) throw new Error("Failed to load inquiries.");

    const inquiryRows = data || [];
    const inquiryIds = inquiryRows.map((item) => String(item.id));

    const assignments = await fetchAssignmentsForLeadType("inquiry", inquiryIds);

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
  };

  const fetchAppointments = async () => {
    const { data, error } = await withTimeout(
      fetchAppointmentRows(),
      "Appointments fetch"
    );

    if (error) throw new Error("Failed to load appointments.");

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

      const rows = data || [];
      safeSetState(() => setFollowUpReminders(rows));
      return rows;
    } catch (error) {
      console.error("Follow-up reminders fetch timeout/error:", error);
      safeSetState(() => setFollowUpReminders([]));
      return [];
    }
  };

  const fetchStudentApplications = async () => {
    const { data, error } = await withTimeout(
      supabase
        .from("student_applications")
        .select("*")
        .order("created_at", { ascending: false }),
      "Student applications fetch"
    );

    if (error) {
      console.error("Student applications fetch error:", error);
      return [];
    }

    const rows = data || [];
    safeSetState(() => setStudentApplications(rows));
    return rows;
  };

  const fetchStudentDocuments = async () => {
    const { data, error } = await withTimeout(
      supabase
        .from("student_documents")
        .select("*")
        .order("created_at", { ascending: false }),
      "Student documents fetch"
    );

    if (error) {
      console.error("Student documents fetch error:", error);
      return [];
    }

    const rows = data || [];
    safeSetState(() => setStudentDocuments(rows));
    return rows;
  };

  const fetchStudentTasks = async () => {
    const { data, error } = await withTimeout(
      supabase
        .from("student_tasks")
        .select("*")
        .order("created_at", { ascending: false }),
      "Student tasks fetch"
    );

    if (error) {
      console.error("Student tasks fetch error:", error);
      return [];
    }

    const rows = data || [];
    safeSetState(() => setStudentTasks(rows));
    return rows;
  };

  const fetchStudentUniversities = async () => {
    const { data, error } = await withTimeout(
      supabase
        .from("student_universities")
        .select("*")
        .order("created_at", { ascending: false }),
      "Student universities fetch"
    );

    if (error) {
      console.error("Student universities fetch error:", error);
      return [];
    }

    const rows = data || [];
    safeSetState(() => setStudentUniversities(rows));
    return rows;
  };

  const fetchStudentRiskScores = async () => {
    const { data, error } = await withTimeout(
      supabase
        .from("ai_student_risk_scores")
        .select("*")
        .order("created_at", { ascending: false }),
      "Student risk scores fetch"
    );

    if (error) {
      console.error("Student risk scores fetch error:", error);
      return [];
    }

    const rows = data || [];
    safeSetState(() => setStudentRiskScores(rows));
    return rows;
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
        fetchStudentApplications(),
        fetchStudentDocuments(),
        fetchStudentTasks(),
        fetchStudentUniversities(),
        fetchStudentRiskScores(),
      ]);

      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        console.error("Admin fetch failures:", failed);

        safeSetState(() => {
          setLoadError(
            "Some admin data could not load. Check your internet and refresh."
          );
        });
      } else {
        safeSetState(() => setLoadError(""));
      }
    } catch (error) {
      console.error("Fetch all data crash:", error);

      safeSetState(() => {
        setLoadError("Admin refresh timed out. Check your internet and retry.");
      });
    } finally {
      loadingRef.current = false;
      safeSetState(() => setLoading(false));
    }
  };

  useRealtimeCRM({
    enabled: isLoggedIn && !!adminProfile,

    onInquiryChange: () => fetchAllData({ silent: true }),
    onAppointmentChange: () => fetchAllData({ silent: true }),
    onReminderChange: () => fetchAllData({ silent: true }),
    onAnyChange: () => fetchAllData({ silent: true }),
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

      setStudentApplications([]);
      setStudentDocuments([]);
      setStudentTasks([]);
      setStudentUniversities([]);
      setStudentRiskScores([]);

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

    studentApplications,
    studentDocuments,
    studentTasks,
    studentUniversities,
    studentRiskScores,

    loading,
    loadError,

    fetchAllData,
    clearLocalData,
  };
}