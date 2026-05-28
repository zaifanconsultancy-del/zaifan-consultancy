import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import AdminLogin from "../components/admin/AdminLogin";
import AdminHeader from "../components/admin/AdminHeader";
import AdminStats from "../components/admin/AdminStats";
import SearchToolbar from "../components/admin/SearchToolbar";
import DashboardContent from "../components/admin/DashboardContent";
import DashboardOverview from "../components/admin/DashboardOverview";
import ActivityTimeline from "../components/admin/ActivityTimeline";
import NotificationCenter from "../components/admin/NotificationCenter";
import AdminSidebar from "../components/admin/AdminSidebar";
import DashboardAnalytics from "../components/admin/DashboardAnalytics";
import AdminManagement from "../components/admin/AdminManagement";
import AdminActivityLogs from "../components/admin/AdminActivityLogs";
import MyLeadsPanel from "../components/admin/MyLeadsPanel";
import FollowUpDashboard from "../components/admin/FollowUpDashboard";
import CrmAutomationPanel from "../components/admin/CrmAutomationPanel";
import CrmKpiAnalytics from "../components/admin/CrmKpiAnalytics";
import StaffPerformanceAnalytics from "../components/admin/StaffPerformanceAnalytics";
import LeadScoringAnalytics from "../components/admin/LeadScoringAnalytics";
import ConversionAnalytics from "../components/admin/ConversionAnalytics";
import OverdueEscalationPanel from "../components/admin/OverdueEscalationPanel";
import AutoReminderGenerator from "../components/admin/AutoReminderGenerator";
import LuxuryAnalyticsCharts from "../components/admin/LuxuryAnalyticsCharts";
import AiLeadPrioritizationPanel from "../components/admin/AiLeadPrioritizationPanel";
import StaffLeaderboard from "../components/admin/StaffLeaderboard";
import AutoStageMovementPanel from "../components/admin/AutoStageMovementPanel";
import ProductivityHeatmap from "../components/admin/ProductivityHeatmap";
import useRealtimeCRM from "../hooks/useRealtimeCRM";
import NotificationActionCenter from "../components/admin/NotificationActionCenter";
import ReminderCompletionAnalytics from "../components/admin/ReminderCompletionAnalytics";
import ConversionFunnelChart from "../components/admin/ConversionFunnelChart";
import CrmCommandCenter from "../components/admin/CrmCommandCenter";
import AiLeadIntelligenceFeed from "../components/admin/AiLeadIntelligenceFeed";
import AnalyticsSectionWrapper from "../components/admin/AnalyticsSectionWrapper";
import CommandPalette from "../components/admin/CommandPalette";

const REQUEST_TIMEOUT_MS = 25000;
const PROFILE_RETRY_LIMIT = 3;
const PROFILE_RETRY_DELAY_MS = 650;

function withTimeout(promise, label = "Request") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out.`)),
        REQUEST_TIMEOUT_MS
      )
    ),
  ]);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeTab, setActiveTab] = useState("inquiries");
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followUpReminders, setFollowUpReminders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileRetryCount, setProfileRetryCount] = useState(0);
  const [loadError, setLoadError] = useState("");

  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const profileFetchIdRef = useRef(0);

  const cardClass =
    "group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] sm:rounded-[2rem] sm:p-6";

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]";

  const role = adminProfile?.role || "staff";

  const roleLabels = {
    staff: "Staff",
    admin: "Admin",
    super_admin: "Super Admin",
  };

  const permissions = {
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

  const currentPermissions = permissions[role] || permissions.staff;

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  const fetchAssignmentsForLeadType = async (leadType, ids = []) => {
    if (!ids.length) return [];

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("lead_assignments")
          .select("*")
          .eq("lead_type", leadType)
          .in(
            "lead_id",
            ids.map((id) => String(id))
          ),
        `${leadType} assignments fetch`
      );

      if (error) {
        console.error("Assignment fetch error:", error);
        return [];
      }

      const uniqueAssignments = [];
      const seen = new Set();

      for (const assignment of data || []) {
        const key = `${assignment.lead_type}-${assignment.lead_id}`;

        if (!seen.has(key)) {
          seen.add(key);
          uniqueAssignments.push(assignment);
        }
      }

      return uniqueAssignments;
    } catch (error) {
      console.error("Assignment timeout/error:", error);
      return [];
    }
  };

  const loadAdminProfile = async (userId, options = {}) => {
    if (!userId) return null;

    const { force = false } = options;
    const fetchId = profileFetchIdRef.current + 1;
    profileFetchIdRef.current = fetchId;

    safeSetState(() => {
      setProfileLoading(true);
      setProfileError("");
      if (force) setAdminProfile(null);
    });

    const cachedProfileKey = `zaifan-admin-profile-${userId}`;
    const cachedProfile = (() => {
      try {
        return JSON.parse(localStorage.getItem(cachedProfileKey) || "null");
      } catch {
        return null;
      }
    })();

    for (let attempt = 1; attempt <= PROFILE_RETRY_LIMIT; attempt += 1) {
      safeSetState(() => setProfileRetryCount(attempt));

      try {
        const { data, error } = await withTimeout(
          supabase
            .from("admin_profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle(),
          `Admin profile fetch attempt ${attempt}`
        );

        if (profileFetchIdRef.current !== fetchId) return null;

        if (error) {
          console.error("Admin profile error:", error);
          throw error;
        }

        if (data) {
          try {
            localStorage.setItem(cachedProfileKey, JSON.stringify(data));
          } catch {
            // ignore localStorage issues
          }

          safeSetState(() => {
            setAdminProfile(data);
            setProfileLoading(false);
            setProfileError("");
            setProfileRetryCount(0);
          });

          return data;
        }

        if (attempt < PROFILE_RETRY_LIMIT) {
          await wait(PROFILE_RETRY_DELAY_MS * attempt);
        }
      } catch (error) {
        console.error("Admin profile timeout/error:", error);

        if (attempt < PROFILE_RETRY_LIMIT) {
          await wait(PROFILE_RETRY_DELAY_MS * attempt);
          continue;
        }

        if (cachedProfile?.id === userId) {
          safeSetState(() => {
            setAdminProfile(cachedProfile);
            setProfileLoading(false);
            setProfileError(
              "Using cached admin profile because the live profile check timed out."
            );
            setProfileRetryCount(0);
          });

          return cachedProfile;
        }
      }
    }

    if (profileFetchIdRef.current !== fetchId) return null;

    safeSetState(() => {
      setAdminProfile(null);
      setProfileLoading(false);
      setProfileError(
        "Admin profile could not be verified after multiple attempts."
      );
      setProfileRetryCount(0);
    });

    return null;
  };

  const fetchInquiries = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("inquiries")
          .select("*")
          .order("created_at", { ascending: false }),
        "Inquiries fetch"
      );

      if (error) {
        console.error(error);
        throw new Error("Failed to load inquiries.");
      }

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
    } catch (error) {
      console.error("Inquiries fetch crash:", error);
      throw error;
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("appointments")
          .select("*")
          .order("created_at", { ascending: false }),
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
        supabase
          .from("follow_up_reminders")
          .select("*")
          .order("due_date", { ascending: true }),
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
    mountedRef.current = true;

    const checkSession = async () => {
      try {
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          "Session check"
        );

        if (data.session?.user) {
          safeSetState(() => {
            setIsLoggedIn(true);
            setAdminUser(data.session.user);
          });

          await loadAdminProfile(data.session.user.id);
        } else {
          safeSetState(() => {
            setIsLoggedIn(false);
            setAdminUser(null);
            setAdminProfile(null);
            setProfileLoading(false);
          });
        }
      } catch (error) {
        console.error("Session check failed:", error);
        safeSetState(() => {
          setIsLoggedIn(false);
          setAdminUser(null);
          setAdminProfile(null);
          setProfileLoading(false);
        });
      } finally {
        safeSetState(() => setSessionChecked(true));
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      safeSetState(() => {
        setIsLoggedIn(!!session);
        setAdminUser(session?.user || null);
      });

      if (session?.user) {
        await loadAdminProfile(session.user.id);
      } else {
        safeSetState(() => {
          setAdminProfile(null);
          setProfileLoading(false);
        });
      }

      safeSetState(() => setSessionChecked(true));
    });

    return () => {
      mountedRef.current = false;

      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && adminProfile) {
      fetchAllData();
    }
  }, [isLoggedIn, adminProfile?.id]);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        "Login"
      );

      if (error) {
        alert(error.message);
        return;
      }

      if (data.user) {
        safeSetState(() => setAdminUser(data.user));
        await loadAdminProfile(data.user.id);
      }

      safeSetState(() => {
        setEmail("");
        setPassword("");
      });
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login request timed out or failed. Check internet and try again.");
    }
  };

  const logout = async () => {
    try {
      await withTimeout(supabase.auth.signOut(), "Logout");
    } catch (error) {
      console.error("Logout timeout/error:", error);
    }

    safeSetState(() => {
      setIsLoggedIn(false);
      setSessionChecked(true);
      setAdminUser(null);
      setAdminProfile(null);
      setInquiries([]);
      setAppointments([]);
      setFollowUpReminders([]);
      setLoading(false);
      setLoadError("");
    });
  };

  const blockAction = (message) => {
    alert(message);
  };

  const logActivity = async ({ action, targetType, targetId, details }) => {
    try {
      const { error } = await withTimeout(
        supabase.from("activity_logs").insert({
          admin_id: adminUser?.id || null,
          admin_name: adminProfile?.full_name || "Unknown Admin",
          action,
          target_type: targetType,
          target_id: String(targetId || ""),
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

  const deleteInquiry = async (id) => {
    if (!currentPermissions.canDelete) {
      blockAction("Only Admin and Super Admin can delete inquiries.");
      return;
    }

    const confirmDelete = confirm("Delete this inquiry?");
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        supabase.from("inquiries").delete().eq("id", id),
        "Delete inquiry"
      );

      if (error) {
        console.error(error);
        alert("Failed to delete inquiry.");
        return;
      }

      safeSetState(() =>
        setInquiries((current) => current.filter((inquiry) => inquiry.id !== id))
      );

      await logActivity({
        action: "Deleted inquiry",
        targetType: "inquiry",
        targetId: id,
        details: "Inquiry deleted",
      });
    } catch (error) {
      console.error(error);
      alert("Delete inquiry request timed out or failed.");
    }
  };

  const deleteAppointment = async (id) => {
    if (!currentPermissions.canDelete) {
      blockAction("Only Admin and Super Admin can delete appointments.");
      return;
    }

    const confirmDelete = confirm("Delete this appointment?");
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        supabase.from("appointments").delete().eq("id", id),
        "Delete appointment"
      );

      if (error) {
        console.error(error);
        alert("Failed to delete appointment.");
        return;
      }

      safeSetState(() =>
        setAppointments((current) =>
          current.filter((appointment) => appointment.id !== id)
        )
      );

      await logActivity({
        action: "Deleted appointment",
        targetType: "appointment",
        targetId: id,
        details: "Appointment deleted",
      });
    } catch (error) {
      console.error(error);
      alert("Delete appointment request timed out or failed.");
    }
  };

  const toggleInquiryStatus = async (id, newStatus) => {
    if (!currentPermissions.canUpdateStatus) {
      blockAction("You do not have permission to update inquiry status.");
      return;
    }

    const selectedInquiry = inquiries.find((inquiry) => inquiry.id === id);
    const oldStatus = selectedInquiry?.status || "new";

    try {
      const { error } = await withTimeout(
        supabase.from("inquiries").update({ status: newStatus }).eq("id", id),
        "Update inquiry status"
      );

      if (error) {
        console.error(error);
        alert("Failed to update inquiry status.");
        return;
      }

      safeSetState(() =>
        setInquiries((current) =>
          current.map((inquiry) =>
            inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
          )
        )
      );

      await logActivity({
        action: "Updated inquiry pipeline",
        targetType: "inquiry",
        targetId: id,
        details: `Changed inquiry stage from ${oldStatus} to ${newStatus}.`,
      });
    } catch (error) {
      console.error(error);
      alert("Pipeline update timed out or failed.");
    }
  };

  const updateInquiryPriority = async (id, newPriority) => {
    if (!currentPermissions.canUpdatePriority) {
      blockAction("You do not have permission to update inquiry priority.");
      return;
    }

    try {
      const { error } = await withTimeout(
        supabase.from("inquiries").update({ priority: newPriority }).eq("id", id),
        "Update inquiry priority"
      );

      if (error) {
        console.error(error);
        alert("Failed to update inquiry priority.");
        return;
      }

      safeSetState(() =>
        setInquiries((current) =>
          current.map((inquiry) =>
            inquiry.id === id ? { ...inquiry, priority: newPriority } : inquiry
          )
        )
      );

      await logActivity({
        action: "Updated inquiry priority",
        targetType: "inquiry",
        targetId: id,
        details: `Changed inquiry priority to ${newPriority}.`,
      });
    } catch (error) {
      console.error(error);
      alert("Priority update timed out or failed.");
    }
  };

  const updateAppointmentPriority = async (id, newPriority) => {
    if (!currentPermissions.canUpdatePriority) {
      blockAction("You do not have permission to update appointment priority.");
      return;
    }

    try {
      const { error } = await withTimeout(
        supabase
          .from("appointments")
          .update({ priority: newPriority })
          .eq("id", id),
        "Update appointment priority"
      );

      if (error) {
        console.error(error);
        alert("Failed to update appointment priority.");
        return;
      }

      safeSetState(() =>
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === id
              ? { ...appointment, priority: newPriority }
              : appointment
          )
        )
      );

      await logActivity({
        action: "Updated appointment priority",
        targetType: "appointment",
        targetId: id,
        details: `Changed appointment priority to ${newPriority}.`,
      });
    } catch (error) {
      console.error(error);
      alert("Priority update timed out or failed.");
    }
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    if (!currentPermissions.canUpdateStatus) {
      blockAction("You do not have permission to update appointment status.");
      return;
    }

    const selectedAppointment = appointments.find(
      (appointment) => appointment.id === id
    );

    const oldStatus = selectedAppointment?.status || "pending";

    try {
      const { error } = await withTimeout(
        supabase.from("appointments").update({ status: newStatus }).eq("id", id),
        "Update appointment status"
      );

      if (error) {
        console.error(error);
        alert("Failed to update appointment status.");
        return;
      }

      safeSetState(() =>
        setAppointments((current) =>
          current.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status: newStatus }
              : appointment
          )
        )
      );

      await logActivity({
        action: "Updated appointment status",
        targetType: "appointment",
        targetId: id,
        details: `Changed appointment status from ${oldStatus} to ${newStatus}.`,
      });

      if (newStatus === "confirmed" && oldStatus !== "confirmed") {
        const { data: emailData, error: emailError } = await withTimeout(
          supabase.functions.invoke("send-appointment-status-email", {
            body: {
              fullName: selectedAppointment?.full_name,
              email: selectedAppointment?.email,
              phone: selectedAppointment?.phone,
              country: selectedAppointment?.country_interest,
              service: selectedAppointment?.consultation_type,
              appointmentDate: selectedAppointment?.appointment_date,
              appointmentTime: selectedAppointment?.appointment_time,
              status: newStatus,
            },
          }),
          "Appointment status email"
        );

        console.log("STATUS EMAIL DATA:", emailData);
        console.log("STATUS EMAIL ERROR:", emailError);

        if (emailError) {
          alert("Status updated, but confirmation email failed.");
          return;
        }

        alert("Appointment confirmed and confirmation email sent.");
      }
    } catch (error) {
      console.error(error);
      alert("Appointment status update timed out or failed.");
    }
  };

  const updateAppointmentStage = async (id, newStage) => {
    if (!currentPermissions.canUpdateAppointmentPipeline) {
      blockAction("You do not have permission to update appointment pipeline.");
      return;
    }

    const selectedAppointment = appointments.find(
      (appointment) => String(appointment.id) === String(id)
    );

    const oldStage = selectedAppointment?.appointment_stage || "new_booking";

    const stageToStatus = {
      new_booking: "pending",
      confirmed: "confirmed",
      consultation_done: "completed",
      follow_up_needed: "pending",
      converted_to_lead: "completed",
      not_interested: "completed",
      cancelled: "cancelled",
    };

    const nextStatus = stageToStatus[newStage] || "pending";

    safeSetState(() =>
      setAppointments((current) =>
        current.map((appointment) =>
          String(appointment.id) === String(id)
            ? {
                ...appointment,
                appointment_stage: newStage,
                status: nextStatus,
              }
            : appointment
        )
      )
    );

    try {
      const { error } = await withTimeout(
        supabase
          .from("appointments")
          .update({
            appointment_stage: newStage,
            status: nextStatus,
          })
          .eq("id", id),
        "Update appointment pipeline"
      );

      if (error) {
        console.error("Appointment pipeline update error:", error);

        safeSetState(() =>
          setAppointments((current) =>
            current.map((appointment) =>
              String(appointment.id) === String(id)
                ? {
                    ...appointment,
                    appointment_stage: oldStage,
                    status: selectedAppointment?.status || appointment.status,
                  }
                : appointment
            )
          )
        );

        alert(
          error.message ||
            "Failed to update appointment pipeline. Check Supabase column/RLS."
        );
        return;
      }

      await logActivity({
        action: "Updated appointment pipeline",
        targetType: "appointment",
        targetId: id,
        details: `Changed appointment pipeline from ${oldStage} to ${newStage}.`,
      });
    } catch (error) {
      console.error("Appointment pipeline timeout/error:", error);

      safeSetState(() =>
        setAppointments((current) =>
          current.map((appointment) =>
            String(appointment.id) === String(id)
              ? {
                  ...appointment,
                  appointment_stage: oldStage,
                  status: selectedAppointment?.status || appointment.status,
                }
              : appointment
          )
        )
      );

      alert(
        "Appointment pipeline update timed out. If it still happens, run the appointments SQL/RLS fix."
      );
    }
  };

  const clearInquiries = async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all inquiries.");
      return;
    }

    const confirmDelete = confirm("Are you sure you want to delete all inquiries?");
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        supabase.from("inquiries").delete().neq("id", 0),
        "Clear inquiries"
      );

      if (error) {
        console.error(error);
        alert("Failed to clear inquiries.");
        return;
      }

      safeSetState(() => setInquiries([]));

      await logActivity({
        action: "Cleared all inquiries",
        targetType: "inquiries",
        targetId: "all",
        details: "Super Admin cleared all inquiry records.",
      });
    } catch (error) {
      console.error(error);
      alert("Clear inquiries request timed out or failed.");
    }
  };

  const clearAppointments = async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all appointments.");
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete all appointments?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await withTimeout(
        supabase.from("appointments").delete().neq("id", 0),
        "Clear appointments"
      );

      if (error) {
        console.error(error);
        alert("Failed to clear appointments.");
        return;
      }

      safeSetState(() => setAppointments([]));

      await logActivity({
        action: "Cleared all appointments",
        targetType: "appointments",
        targetId: "all",
        details: "Super Admin cleared all appointment records.",
      });
    } catch (error) {
      console.error(error);
      alert("Clear appointments request timed out or failed.");
    }
  };

  const downloadCSV = (filename, headers, rows) => {
    if (!currentPermissions.canExport) {
      blockAction("Only Admin and Super Admin can export data.");
      return;
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportInquiriesToCSV = () => {
    if (!currentPermissions.canExport) {
      blockAction("Only Admin and Super Admin can export inquiries.");
      return;
    }

    if (inquiries.length === 0) {
      alert("No inquiries to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Field Of Interest",
      "Study Level",
      "Country",
      "Counseling Mode",
      "Preferred Date",
      "Time Slot",
      "City",
      "Message",
      "Status",
      "Priority",
      "Assigned Admin",
      "Date",
    ];

    const rows = inquiries.map((inquiry) => [
      inquiry.full_name,
      inquiry.email,
      inquiry.phone,
      inquiry.field_of_interest,
      inquiry.study_level,
      inquiry.country,
      inquiry.counseling_mode,
      inquiry.preferred_date,
      inquiry.time_slot,
      inquiry.city,
      inquiry.message,
      inquiry.status || "new",
      inquiry.priority || "low",
      inquiry.assigned_admin_name || "Unassigned",
      inquiry.created_at,
    ]);

    downloadCSV("zaifan-inquiries.csv", headers, rows);
  };

  const exportAppointmentsToCSV = () => {
    if (!currentPermissions.canExport) {
      blockAction("Only Admin and Super Admin can export appointments.");
      return;
    }

    if (appointments.length === 0) {
      alert("No appointments to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Country Interest",
      "Consultation Type",
      "Appointment Date",
      "Appointment Time",
      "Message",
      "Status",
      "Appointment Stage",
      "Priority",
      "Assigned Admin",
      "Created At",
    ];

    const rows = appointments.map((appointment) => [
      appointment.full_name,
      appointment.email,
      appointment.phone,
      appointment.country_interest,
      appointment.consultation_type,
      appointment.appointment_date,
      appointment.appointment_time,
      appointment.message,
      appointment.status || "pending",
      appointment.appointment_stage || "new_booking",
      appointment.priority || "low",
      appointment.assigned_admin_name || "Unassigned",
      appointment.created_at,
    ]);

    downloadCSV("zaifan-appointments.csv", headers, rows);
  };

  const normalizeFilterValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replaceAll("-", "_")
      .replaceAll(" ", "_");

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchText = search.toLowerCase();
    const status = inquiry.status || "new";
    const priority = inquiry.priority || "low";
    const filterValue = normalizeFilterValue(statusFilter);

    const matchesSearch =
      inquiry.full_name?.toLowerCase().includes(searchText) ||
      inquiry.email?.toLowerCase().includes(searchText) ||
      inquiry.phone?.toLowerCase().includes(searchText) ||
      priority.toLowerCase().includes(searchText) ||
      inquiry.country?.toLowerCase().includes(searchText) ||
      inquiry.city?.toLowerCase().includes(searchText) ||
      inquiry.field_of_interest?.toLowerCase().includes(searchText) ||
      inquiry.study_level?.toLowerCase().includes(searchText) ||
      inquiry.assigned_admin_name?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || status === filterValue || priority === filterValue;

    return matchesSearch && matchesStatus;
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const searchText = search.toLowerCase();
    const status = appointment.status || "pending";
    const appointmentStage = appointment.appointment_stage || "new_booking";
    const priority = appointment.priority || "low";
    const filterValue = normalizeFilterValue(statusFilter);

    const matchesSearch =
      appointment.full_name?.toLowerCase().includes(searchText) ||
      appointment.email?.toLowerCase().includes(searchText) ||
      appointment.phone?.toLowerCase().includes(searchText) ||
      appointment.country_interest?.toLowerCase().includes(searchText) ||
      appointment.consultation_type?.toLowerCase().includes(searchText) ||
      appointment.appointment_date?.toLowerCase().includes(searchText) ||
      appointment.appointment_time?.toLowerCase().includes(searchText) ||
      appointmentStage.toLowerCase().includes(searchText) ||
      priority.toLowerCase().includes(searchText) ||
      appointment.assigned_admin_name?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      status === filterValue ||
      appointmentStage === filterValue ||
      priority === filterValue;

    return matchesSearch && matchesStatus;
  });

  const inquiryNewCount = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const inquiryContactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;

  const appointmentPendingCount = appointments.filter(
    (appointment) => (appointment.status || "pending") === "pending"
  ).length;

  const appointmentConfirmedCount = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const appointmentCompletedCount = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  const appointmentCancelledCount = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  ).length;

  const latestInquiry = inquiries[0];
  const latestAppointment = appointments[0];
  const todayDate = new Date().toDateString();

  const todayInquiriesCount = inquiries.filter((inquiry) =>
    inquiry.created_at
      ? new Date(inquiry.created_at).toDateString() === todayDate
      : false
  ).length;

  const todayAppointmentsCount = appointments.filter((appointment) =>
    appointment.created_at
      ? new Date(appointment.created_at).toDateString() === todayDate
      : false
  ).length;

  const statusOptions =
    activeTab === "inquiries"
      ? [
          "All",
          "New",
          "Contacted",
          "Documents Pending",
          "Applied",
          "Offer Letter",
          "Visa Process",
          "Approved",
          "VIP",
          "High",
          "Medium",
          "Low",
        ]
      : [
          "All",
          "New Booking",
          "Confirmed",
          "Consultation Done",
          "Follow Up Needed",
          "Converted To Lead",
          "Not Interested",
          "Cancelled",
          "Pending",
          "Completed",
          "VIP",
          "High",
          "Medium",
          "Low",
        ];

  const analyticsNavItems = [
    ["command", "Command"],
    ["kpi", "KPI"],
    ["intelligence", "AI Feed"],
    ["staff", "Staff"],
    ["scoring", "Scoring"],
    ["conversion", "Conversion"],
    ["charts", "Charts"],
    ["automation", "Automation"],
    ["actions", "Actions"],
    ["funnel", "Funnel"],
    ["overview", "Overview"],
  ];

  const AnalyticsSection = AnalyticsSectionWrapper;

  if (!sessionChecked || (profileLoading && !adminProfile)) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className={`${cardClass} max-w-md text-center`}>
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
          <h1 className="text-2xl font-black text-white">Checking Admin Role</h1>
          <p className="mt-3 text-sm text-gray-400">
            Please wait while Zaifan CRM verifies your permissions.
          </p>
          {profileRetryCount > 0 && (
            <p className="mt-3 text-xs text-[#D4AF37]">
              Profile check attempt {profileRetryCount}/{PROFILE_RETRY_LIMIT}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminLogin
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        handleLogin={handleLogin}
        inputClass={inputClass}
      />
    );
  }

  if (sessionChecked && isLoggedIn && !profileLoading && !adminProfile) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className={`${cardClass} max-w-lg text-center`}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-red-400/20 bg-red-500/10 text-3xl">
            🔒
          </div>

          <p className="text-[11px] uppercase tracking-[0.35em] text-red-300">
            Access Check Paused
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Admin Profile Not Verified Yet
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Your login session is active, but Zaifan CRM could not verify your
            admin profile after several attempts. This can happen during Vite hot
            reload or temporary Supabase delay.
          </p>

          {profileError && (
            <div className="mt-5 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 text-left text-xs leading-relaxed text-orange-200">
              {profileError}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-xs text-gray-300">
            <p className="text-gray-500">Your user ID:</p>
            <p className="mt-1 break-all font-mono text-[#D4AF37]">
              {adminUser?.id || "No user ID found"}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => loadAdminProfile(adminUser?.id, { force: true })}
              className="rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-black text-black transition hover:bg-[#f1cf65]"
            >
              Retry Profile Check
            </button>

            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/10 bg-white/[0.04] px-7 py-3 text-sm font-bold text-white transition hover:border-red-400/30 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="absolute right-[-35%] top-[-12%] h-[320px] w-[320px] rounded-full bg-[#D4AF37]/10 blur-3xl sm:right-[-12%] sm:top-[-18%] sm:h-[520px] sm:w-[520px]"></div>
      <div className="absolute bottom-[-18%] left-[-35%] h-[320px] w-[320px] rounded-full bg-[#D4AF37]/5 blur-3xl sm:bottom-[-25%] sm:left-[-12%] sm:h-[520px] sm:w-[520px]"></div>

      <div className="relative flex flex-col xl:flex-row">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logout={logout}
          role={role}
          adminProfile={adminProfile}
          permissions={currentPermissions}
        />

        <CommandPalette
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          inquiries={inquiries}
          appointments={appointments}
          followUpReminders={followUpReminders}
          permissions={currentPermissions}
        />

        <main className="min-w-0 flex-1 overflow-hidden px-3 py-4 sm:px-6 sm:py-6 xl:px-10">
          <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]">
                Role System Active
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                {adminProfile.full_name || "Admin User"}
              </h2>
              <p className="mt-1 text-xs text-gray-400">
                Logged in as{" "}
                <span className="font-bold text-[#D4AF37]">
                  {roleLabels[role] || role}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-300">
                Delete: {currentPermissions.canDelete ? "Yes" : "No"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-300">
                Export: {currentPermissions.canExport ? "Yes" : "No"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-gray-300">
                Clear All: {currentPermissions.canClearAll ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {profileError && adminProfile && (
            <div className="mb-5 rounded-[1.5rem] border border-orange-400/20 bg-orange-500/10 p-4 text-sm text-orange-200">
              {profileError}
            </div>
          )}

          {loadError && (
            <div className="mb-5 rounded-[1.5rem] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchAllData()}
                  className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#E7C768]"
                >
                  Retry Refresh
                </button>
              </div>
            </div>
          )}

          <AdminHeader
            inquiries={inquiries}
            appointments={appointments}
            appointmentPendingCount={appointmentPendingCount}
            fetchAllData={fetchAllData}
            activeTab={activeTab}
            exportInquiriesToCSV={exportInquiriesToCSV}
            exportAppointmentsToCSV={exportAppointmentsToCSV}
            logout={logout}
            clearInquiries={clearInquiries}
            clearAppointments={clearAppointments}
            role={role}
            adminProfile={adminProfile}
            permissions={currentPermissions}
          />

          {activeTab !== "analytics" &&
            activeTab !== "settings" &&
            activeTab !== "admin-management" &&
            activeTab !== "activity-logs" &&
            activeTab !== "my-leads" &&
            activeTab !== "followups" && (
              <>
                <NotificationCenter
                  cardClass={cardClass}
                  inquiryNewCount={inquiryNewCount}
                  appointmentPendingCount={appointmentPendingCount}
                  appointmentConfirmedCount={appointmentConfirmedCount}
                  role={role}
                  permissions={currentPermissions}
                />

                <AdminStats
                  cardClass={cardClass}
                  inquiries={inquiries}
                  inquiryNewCount={inquiryNewCount}
                  inquiryContactedCount={inquiryContactedCount}
                  appointments={appointments}
                  appointmentPendingCount={appointmentPendingCount}
                  appointmentConfirmedCount={appointmentConfirmedCount}
                  appointmentCompletedCount={appointmentCompletedCount}
                  appointmentCancelledCount={appointmentCancelledCount}
                />
              </>
            )}

          {activeTab === "followups" ? (
            <FollowUpDashboard cardClass={cardClass} />
          ) : activeTab === "automation" ? (
            <CrmAutomationPanel
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
          ) : activeTab === "my-leads" ? (
            <MyLeadsPanel cardClass={cardClass} adminProfile={adminProfile} />
          ) : activeTab === "activity-logs" ? (
            <AdminActivityLogs cardClass={cardClass} />
          ) : activeTab === "admin-management" ? (
            <AdminManagement
              cardClass={cardClass}
              role={role}
              adminProfile={adminProfile}
              permissions={currentPermissions}
            />
          ) : activeTab === "analytics" ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >
              <div className="sticky top-3 z-20 rounded-[1.5rem] border border-white/10 bg-black/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {analyticsNavItems.map(([id, label]) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-gray-300 transition hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <AnalyticsSection
                id="command"
                eyebrow="Enterprise Control"
                title="CRM Command Center"
              >
                <CrmCommandCenter
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                />
              </AnalyticsSection>

              <AnalyticsSection
                id="kpi"
                eyebrow="Performance Overview"
                title="KPI Analytics"
              >
                <CrmKpiAnalytics
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                />
              </AnalyticsSection>

              <AnalyticsSection
                id="intelligence"
                eyebrow="AI Intelligence"
                title="Lead Intelligence Feed"
              >
                <div className="grid gap-6 2xl:grid-cols-2">
                  <AiLeadIntelligenceFeed
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                  />

                  <AiLeadPrioritizationPanel
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                  />
                </div>
              </AnalyticsSection>

              <AnalyticsSection
                id="staff"
                eyebrow="Team Performance"
                title="Staff Analytics"
              >
                <div className="grid gap-6 2xl:grid-cols-2">
                  <StaffPerformanceAnalytics
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                  />

                  <StaffLeaderboard
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                  />
                </div>
              </AnalyticsSection>

              <AnalyticsSection
                id="scoring"
                eyebrow="Lead Quality"
                title="Lead Scoring"
              >
                <LeadScoringAnalytics
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                />
              </AnalyticsSection>

              <AnalyticsSection
                id="conversion"
                eyebrow="Revenue Movement"
                title="Conversion Analytics"
              >
                <ConversionAnalytics
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                />
              </AnalyticsSection>

              <AnalyticsSection
                id="charts"
                eyebrow="Visual Intelligence"
                title="Luxury Charts"
              >
                <LuxuryAnalyticsCharts
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                  followUpReminders={followUpReminders}
                />
              </AnalyticsSection>

              <AnalyticsSection
                id="automation"
                eyebrow="Automation Layer"
                title="Escalations, Reminders & Stage Movement"
              >
                <div className="grid gap-6 2xl:grid-cols-2">
                  <OverdueEscalationPanel cardClass={cardClass} />

                  <AutoReminderGenerator
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                  />

                  <AutoStageMovementPanel
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                    updateInquiryStatus={toggleInquiryStatus}
                    updateAppointmentStage={updateAppointmentStage}
                    updateAppointmentStatus={updateAppointmentStatus}
                  />

                  <ProductivityHeatmap
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                    followUpReminders={followUpReminders}
                  />
                </div>
              </AnalyticsSection>

              <AnalyticsSection
                id="actions"
                eyebrow="Action Center"
                title="Notification Actions & Reminder Analytics"
              >
                <div className="grid gap-6 2xl:grid-cols-2">
                  <NotificationActionCenter
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                    followUpReminders={followUpReminders}
                    updateInquiryStatus={toggleInquiryStatus}
                    updateAppointmentStatus={updateAppointmentStatus}
                    setActiveTab={setActiveTab}
                  />

                  <ReminderCompletionAnalytics
                    cardClass={cardClass}
                    followUpReminders={followUpReminders}
                  />
                </div>
              </AnalyticsSection>

              <AnalyticsSection
                id="funnel"
                eyebrow="Pipeline Health"
                title="Conversion Funnel"
              >
                <ConversionFunnelChart
                  cardClass={cardClass}
                  inquiries={inquiries}
                />
              </AnalyticsSection>

              <AnalyticsSection
                id="overview"
                eyebrow="Classic Dashboard"
                title="Overview, Analytics & Timeline"
              >
                <div className="grid gap-6 2xl:grid-cols-2">
                  <DashboardAnalytics
                    cardClass={cardClass}
                    inquiries={inquiries}
                    appointments={appointments}
                  />

                  <DashboardOverview
                    cardClass={cardClass}
                    todayInquiriesCount={todayInquiriesCount}
                    todayAppointmentsCount={todayAppointmentsCount}
                    latestInquiry={latestInquiry}
                    latestAppointment={latestAppointment}
                  />

                  <div className="2xl:col-span-2">
                    <ActivityTimeline
                      cardClass={cardClass}
                      inquiries={inquiries}
                      appointments={appointments}
                    />
                  </div>
                </div>
              </AnalyticsSection>
            </motion.div>
          ) : activeTab === "settings" ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className={`${cardClass} flex flex-col items-center justify-center px-6 py-16 text-center`}
            >
              <div className="rounded-[1.7rem] border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-6 text-5xl">
                ⚙️
              </div>

              <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
                Settings Panel
              </p>

              <h2 className="mt-3 text-4xl font-black text-white">
                Coming Soon
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400">
                Advanced CRM customization, admin preferences, notification
                controls, integrations, analytics configuration, branding
                settings, and automation tools will be added here.
              </p>

              {currentPermissions.canManageAdmins && (
                <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-4 text-sm text-[#D4AF37]">
                  Super Admin access detected. Use Admin Management for role
                  controls.
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <SearchToolbar
                activeTab={activeTab}
                search={search}
                setSearch={setSearch}
                statusOptions={statusOptions}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                >
                  <DashboardContent
                    loading={loading}
                    activeTab={activeTab}
                    inquiries={inquiries}
                    filteredInquiries={filteredInquiries}
                    appointments={appointments}
                    filteredAppointments={filteredAppointments}
                    cardClass={cardClass}
                    updateInquiryStatus={toggleInquiryStatus}
                    updateInquiryPriority={updateInquiryPriority}
                    updateAppointmentPriority={updateAppointmentPriority}
                    deleteInquiry={deleteInquiry}
                    updateAppointmentStatus={updateAppointmentStatus}
                    updateAppointmentStage={updateAppointmentStage}
                    deleteAppointment={deleteAppointment}
                    role={role}
                    adminProfile={adminProfile}
                    permissions={currentPermissions}
                  />
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </main>
      </div>
    </section>
  );
}

export default AdminPage;