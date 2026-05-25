import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

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
    },
    admin: {
      canDelete: true,
      canClearAll: false,
      canExport: true,
      canManageAdmins: false,
      canUpdateStatus: true,
      canUpdatePriority: true,
      canConfirmAppointments: true,
    },
    super_admin: {
      canDelete: true,
      canClearAll: true,
      canExport: true,
      canManageAdmins: true,
      canUpdateStatus: true,
      canUpdatePriority: true,
      canConfirmAppointments: true,
    },
  };

  const currentPermissions = permissions[role] || permissions.staff;

  const loadAdminProfile = async (userId) => {
  if (!adminProfile) {
    setProfileLoading(true);
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin profile error:", error);
    setAdminProfile(null);
    setProfileLoading(false);
    return null;
  }

  setAdminProfile(data);
  setProfileLoading(false);
  return data;
};

  const fetchInquiries = async () => {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Failed to load inquiries.");
    return;
  }

  const inquiryIds = (data || []).map((item) => String(item.id));

  const { data: assignments } = await supabase
    .from("lead_assignments")
    .select("*")
    .eq("lead_type", "inquiry")
    .in("lead_id", inquiryIds);

  const mergedInquiries = (data || []).map((inquiry) => {
    const assignment = assignments?.find(
      (item) => item.lead_id === String(inquiry.id)
    );

    return {
      ...inquiry,
      assigned_admin_id: assignment?.assigned_admin_id || null,
      assigned_admin_name: assignment?.assigned_admin_name || null,
    };
  });

  setInquiries(mergedInquiries);
};

  const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Failed to load appointments.");
    return;
  }

  const appointmentIds = (data || []).map((item) => String(item.id));

  const { data: assignments } = await supabase
    .from("lead_assignments")
    .select("*")
    .eq("lead_type", "appointment")
    .in("lead_id", appointmentIds);

  const mergedAppointments = (data || []).map((appointment) => {
    const assignment = assignments?.find(
      (item) => item.lead_id === String(appointment.id)
    );

    return {
      ...appointment,
      assigned_admin_id: assignment?.assigned_admin_id || null,
      assigned_admin_name: assignment?.assigned_admin_name || null,
    };
  });

  setAppointments(mergedAppointments);
};

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchInquiries(), fetchAppointments()]);
    setLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        setIsLoggedIn(true);
        setAdminUser(data.session.user);
        await loadAdminProfile(data.session.user.id);
      } else {
        setIsLoggedIn(false);
        setAdminUser(null);
        setAdminProfile(null);
        setProfileLoading(false);
      }

      setSessionChecked(true);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoggedIn(!!session);
      setAdminUser(session?.user || null);

      if (session?.user) {
        await loadAdminProfile(session.user.id);
      } else {
        setAdminProfile(null);
        setProfileLoading(false);
      }

      setSessionChecked(true);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && adminProfile) fetchAllData();
  }, [isLoggedIn, adminProfile]);

  useEffect(() => {
    if (!isLoggedIn || !adminProfile) return;

    const channel = supabase
      .channel("zaifan-crm-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        () => {
          fetchInquiries();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoggedIn, adminProfile]);

  const handleLogin = async (event) => {
    event.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      setAdminUser(data.user);
      await loadAdminProfile(data.user.id);
    }

    setEmail("");
    setPassword("");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setSessionChecked(true);
    setAdminUser(null);
    setAdminProfile(null);
    setInquiries([]);
    setAppointments([]);
  };

  const blockAction = (message) => {
    alert(message);
  };

  const logActivity = async ({ action, targetType, targetId, details }) => {
    const { error } = await supabase.from("activity_logs").insert({
      admin_id: adminUser?.id || null,
      admin_name: adminProfile?.full_name || "Unknown Admin",
      action,
      target_type: targetType,
      target_id: String(targetId || ""),
      details,
    });

    if (error) {
      console.error("Activity log failed:", error);
    }
  };

  const deleteInquiry = async (id) => {
    if (!currentPermissions.canDelete) {
      blockAction("Only Admin and Super Admin can delete inquiries.");
      return;
    }

    const confirmDelete = confirm("Delete this inquiry?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("inquiries").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete inquiry.");
      return;
    }

    setInquiries((current) => current.filter((inquiry) => inquiry.id !== id));

    await logActivity({
      action: "Deleted inquiry",
      targetType: "inquiry",
      targetId: id,
      details: "Inquiry deleted",
    });
  };

  const deleteAppointment = async (id) => {
    if (!currentPermissions.canDelete) {
      blockAction("Only Admin and Super Admin can delete appointments.");
      return;
    }

    const confirmDelete = confirm("Delete this appointment?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to delete appointment.");
      return;
    }

    setAppointments((current) =>
      current.filter((appointment) => appointment.id !== id)
    );

    await logActivity({
      action: "Deleted appointment",
      targetType: "appointment",
      targetId: id,
      details: "Appointment deleted",
    });
  };

  const toggleInquiryStatus = async (id, currentStatus) => {
    if (!currentPermissions.canUpdateStatus) {
      blockAction("You do not have permission to update inquiry status.");
      return;
    }

    const newStatus = currentStatus === "contacted" ? "new" : "contacted";

    const { error } = await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update inquiry status.");
      return;
    }

    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
      )
    );

    await logActivity({
      action: "Updated inquiry status",
      targetType: "inquiry",
      targetId: id,
      details: `Changed inquiry status from ${
        currentStatus || "new"
      } to ${newStatus}.`,
    });
  };

  const updateInquiryPriority = async (id, newPriority) => {
    if (!currentPermissions.canUpdatePriority) {
      blockAction("You do not have permission to update inquiry priority.");
      return;
    }

    const { error } = await supabase
      .from("inquiries")
      .update({ priority: newPriority })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update inquiry priority.");
      return;
    }

    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === id ? { ...inquiry, priority: newPriority } : inquiry
      )
    );

    await logActivity({
      action: "Updated inquiry priority",
      targetType: "inquiry",
      targetId: id,
      details: `Changed inquiry priority to ${newPriority}.`,
    });
  };

  const updateAppointmentPriority = async (id, newPriority) => {
    if (!currentPermissions.canUpdatePriority) {
      blockAction("You do not have permission to update appointment priority.");
      return;
    }

    const { error } = await supabase
      .from("appointments")
      .update({ priority: newPriority })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update appointment priority.");
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, priority: newPriority }
          : appointment
      )
    );

    await logActivity({
      action: "Updated appointment priority",
      targetType: "appointment",
      targetId: id,
      details: `Changed appointment priority to ${newPriority}.`,
    });
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

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update appointment status.");
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: newStatus }
          : appointment
      )
    );

    await logActivity({
      action: "Updated appointment status",
      targetType: "appointment",
      targetId: id,
      details: `Changed appointment status from ${oldStatus} to ${newStatus}.`,
    });

    if (newStatus === "confirmed" && oldStatus !== "confirmed") {
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-appointment-status-email", {
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
        });

      console.log("STATUS EMAIL DATA:", emailData);
      console.log("STATUS EMAIL ERROR:", emailError);

      if (emailError) {
        alert("Status updated, but confirmation email failed.");
        return;
      }

      alert("Appointment confirmed and confirmation email sent.");
    }
  };

  const clearInquiries = async () => {
    if (!currentPermissions.canClearAll) {
      blockAction("Only Super Admin can clear all inquiries.");
      return;
    }

    const confirmDelete = confirm(
      "Are you sure you want to delete all inquiries?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("inquiries").delete().neq("id", 0);

    if (error) {
      console.error(error);
      alert("Failed to clear inquiries.");
      return;
    }

    setInquiries([]);

    await logActivity({
      action: "Cleared all inquiries",
      targetType: "inquiries",
      targetId: "all",
      details: "Super Admin cleared all inquiry records.",
    });
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

    const { error } = await supabase.from("appointments").delete().neq("id", 0);

    if (error) {
      console.error(error);
      alert("Failed to clear appointments.");
      return;
    }

    setAppointments([]);

    await logActivity({
      action: "Cleared all appointments",
      targetType: "appointments",
      targetId: "all",
      details: "Super Admin cleared all appointment records.",
    });
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
      "Priority",
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
      appointment.priority || "low",
      appointment.created_at,
    ]);

    downloadCSV("zaifan-appointments.csv", headers, rows);
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchText = search.toLowerCase();
    const status = inquiry.status || "new";
    const priority = inquiry.priority || "low";

    const matchesSearch =
      inquiry.full_name?.toLowerCase().includes(searchText) ||
      inquiry.email?.toLowerCase().includes(searchText) ||
      inquiry.phone?.toLowerCase().includes(searchText) ||
      priority.toLowerCase().includes(searchText) ||
      inquiry.country?.toLowerCase().includes(searchText) ||
      inquiry.city?.toLowerCase().includes(searchText) ||
      inquiry.field_of_interest?.toLowerCase().includes(searchText) ||
      inquiry.study_level?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      status === statusFilter.toLowerCase() ||
      priority === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const filteredAppointments = appointments.filter((appointment) => {
    const searchText = search.toLowerCase();
    const status = appointment.status || "pending";
    const priority = appointment.priority || "low";

    const matchesSearch =
      appointment.full_name?.toLowerCase().includes(searchText) ||
      appointment.email?.toLowerCase().includes(searchText) ||
      appointment.phone?.toLowerCase().includes(searchText) ||
      appointment.country_interest?.toLowerCase().includes(searchText) ||
      appointment.consultation_type?.toLowerCase().includes(searchText) ||
      appointment.appointment_date?.toLowerCase().includes(searchText) ||
      appointment.appointment_time?.toLowerCase().includes(searchText) ||
      priority.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      status === statusFilter.toLowerCase() ||
      priority === statusFilter.toLowerCase();

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
      ? ["All", "New", "Contacted", "VIP", "High", "Medium", "Low"]
      : [
          "All",
          "Pending",
          "Confirmed",
          "Completed",
          "Cancelled",
          "VIP",
          "High",
          "Medium",
          "Low",
        ];

  if (!sessionChecked || (profileLoading && !adminProfile)) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className={`${cardClass} max-w-md text-center`}>
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
          <h1 className="text-2xl font-black text-white">Checking Admin Role</h1>
          <p className="mt-3 text-sm text-gray-400">
            Please wait while Zaifan CRM verifies your permissions.
          </p>
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
            Access Blocked
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">
            Admin Profile Missing
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Your auth login exists, but this user ID is not added inside the
            admin_profiles table.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-xs text-gray-300">
            <p className="text-gray-500">Your user ID:</p>
            <p className="mt-1 break-all font-mono text-[#D4AF37]">
              {adminUser?.id || "No user ID found"}
            </p>
          </div>

          <button
            onClick={logout}
            className="mt-6 rounded-full bg-[#D4AF37] px-7 py-3 text-sm font-black text-black transition hover:bg-[#f1cf65]"
          >
            Logout
          </button>
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
activeTab !== "my-leads" && (
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

          {activeTab === "my-leads" ? (
  <MyLeadsPanel
    cardClass={cardClass}
    adminProfile={adminProfile}
  />
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

              <ActivityTimeline
                cardClass={cardClass}
                inquiries={inquiries}
                appointments={appointments}
              />
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
                    toggleInquiryStatus={toggleInquiryStatus}
                    updateInquiryPriority={updateInquiryPriority}
                    updateAppointmentPriority={updateAppointmentPriority}
                    deleteInquiry={deleteInquiry}
                    updateAppointmentStatus={updateAppointmentStatus}
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
