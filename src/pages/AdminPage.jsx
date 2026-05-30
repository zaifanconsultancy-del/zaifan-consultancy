import { useState } from "react";

import AdminLogin from "../components/admin/AdminLogin";
import AdminHeader from "../components/admin/AdminHeader";
import AdminStats from "../components/admin/AdminStats";
import NotificationCenter from "../components/admin/NotificationCenter";
import AdminSidebar from "../components/admin/AdminSidebar";
import CommandPalette from "../components/admin/CommandPalette";

import AnalyticsPage from "../components/admin/pages/AnalyticsPage";
import FollowUpsPage from "../components/admin/pages/FollowUpsPage";
import AutomationPage from "../components/admin/pages/AutomationPage";
import MyLeadsPage from "../components/admin/pages/MyLeadsPage";
import ActivityLogsPage from "../components/admin/pages/ActivityLogsPage";
import AdminManagementPage from "../components/admin/pages/AdminManagementPage";
import SettingsPage from "../components/admin/pages/SettingsPage";
import PipelinePage from "../components/admin/pages/PipelinePage";

import useAdminAuth from "../hooks/useAdminAuth";
import useAdminDashboardData from "../hooks/useAdminDashboardData";
import useAdminActivityLogger from "../hooks/useAdminActivityLogger";
import useAdminLeadActions from "../hooks/useAdminLeadActions";

import {
  filterInquiries,
  filterAppointments,
  getCrmCounts,
  getTodayCounts,
  getPermissionsForRole,
  getStatusOptions,
  roleLabels,
} from "../utils/crm";

import { shouldShowStats } from "../utils/crm/dashboardFilters";

import { PROFILE_RETRY_LIMIT } from "../utils/crm/constants";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("inquiries");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeAnalyticsSection, setActiveAnalyticsSection] =
    useState("command");

  const cardClass =
    "group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] sm:rounded-[2rem] sm:p-6";

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]";

  const auth = useAdminAuth();

  const {
    isLoggedIn,
    sessionChecked,
    adminUser,
    adminProfile,

    email,
    setEmail,
    password,
    setPassword,

    profileLoading,
    profileError,
    profileRetryCount,

    handleLogin,
    logout,
    loadAdminProfile,
  } = auth;

  const {
    inquiries,
    setInquiries,
    appointments,
    setAppointments,
    followUpReminders,
    loading,
    loadError,
    fetchAllData,
    clearLocalData,
  } = useAdminDashboardData({
    isLoggedIn,
    adminProfile,
  });

  const role = adminProfile?.role || "staff";
  const currentPermissions = getPermissionsForRole(role);

  const { logActivity } = useAdminActivityLogger({
    adminUser,
    adminProfile,
  });

  const {
    deleteInquiry,
    deleteAppointment,

    toggleInquiryStatus,
    updateInquiryPriority,
    updateAppointmentPriority,
    updateAppointmentStatus,
    updateAppointmentStage,

    clearInquiries,
    clearAppointments,

    exportInquiriesToCSV,
    exportAppointmentsToCSV,
  } = useAdminLeadActions({
    inquiries,
    setInquiries,
    appointments,
    setAppointments,
    currentPermissions,
    logActivity,
  });

  const handleLogout = async () => {
    await logout();
    clearLocalData();
  };

  const filteredInquiries = filterInquiries({
    inquiries,
    search,
    statusFilter,
  });

  const filteredAppointments = filterAppointments({
    appointments,
    search,
    statusFilter,
  });

  const {
    inquiryNewCount,
    inquiryContactedCount,
    appointmentPendingCount,
    appointmentConfirmedCount,
    appointmentCompletedCount,
    appointmentCancelledCount,
  } = getCrmCounts({ inquiries, appointments });

  const latestInquiry = inquiries[0];
  const latestAppointment = appointments[0];

  const { todayInquiriesCount, todayAppointmentsCount } = getTodayCounts({
    inquiries,
    appointments,
  });

  const statusOptions = getStatusOptions(activeTab);

  if (!sessionChecked || (profileLoading && !adminProfile)) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
        <div className={`${cardClass} max-w-md text-center`}>
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>

          <h1 className="text-2xl font-black text-white">
            Checking Admin Role
          </h1>

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
              onClick={handleLogout}
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
          logout={handleLogout}
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
            logout={handleLogout}
            clearInquiries={clearInquiries}
            clearAppointments={clearAppointments}
            role={role}
            adminProfile={adminProfile}
            permissions={currentPermissions}
          />

          {shouldShowStats(activeTab) && (
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
            <FollowUpsPage cardClass={cardClass} />
          ) : activeTab === "automation" ? (
            <AutomationPage
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
            />
          ) : activeTab === "my-leads" ? (
            <MyLeadsPage cardClass={cardClass} adminProfile={adminProfile} />
          ) : activeTab === "activity-logs" ? (
            <ActivityLogsPage cardClass={cardClass} />
          ) : activeTab === "admin-management" ? (
            <AdminManagementPage
              cardClass={cardClass}
              role={role}
              adminProfile={adminProfile}
              permissions={currentPermissions}
            />
          ) : activeTab === "analytics" ? (
            <AnalyticsPage
              cardClass={cardClass}
              inquiries={inquiries}
              appointments={appointments}
              followUpReminders={followUpReminders}
              activeAnalyticsSection={activeAnalyticsSection}
              setActiveAnalyticsSection={setActiveAnalyticsSection}
              toggleInquiryStatus={toggleInquiryStatus}
              updateAppointmentStage={updateAppointmentStage}
              updateAppointmentStatus={updateAppointmentStatus}
              setActiveTab={setActiveTab}
              todayInquiriesCount={todayInquiriesCount}
              todayAppointmentsCount={todayAppointmentsCount}
              latestInquiry={latestInquiry}
              latestAppointment={latestAppointment}
            />
          ) : activeTab === "settings" ? (
            <SettingsPage
              cardClass={cardClass}
              currentPermissions={currentPermissions}
            />
          ) : (
            <PipelinePage
              activeTab={activeTab}
              search={search}
              setSearch={setSearch}
              statusOptions={statusOptions}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              loading={loading}
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
              updateAppointmentStage={updateAppointmentStage}
              deleteAppointment={deleteAppointment}
              role={role}
              adminProfile={adminProfile}
              permissions={currentPermissions}
            />
          )}
        </main>
      </div>
    </section>
  );
}

export default AdminPage;