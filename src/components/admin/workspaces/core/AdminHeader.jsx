// AdminHeader V4 — compact Admin OS utility shell
// src/components/admin/AdminHeader.jsx
//
// Batch 19 ownership cleanup:
// - keeps the existing public prop API for safe replacement
// - removes the second dashboard/mission-control/notification centre
// - no Supabase realtime subscription inside the header
// - Notifications routes to Communications -> Notifications
// - Refresh and Logout remain global shell actions
// - Export/Clear remain accepted props but are intentionally not global-header actions
// - role/session and basic live counts stay visible without overwhelming Home

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import NotificationBell from "../communications/NotificationBell";

const ROLE_CONFIG = {
  staff: {
    label: "Staff",
    Icon: UserRound,
  },
  admin: {
    label: "Admin",
    Icon: ShieldCheck,
  },
  super_admin: {
    label: "Super Admin",
    Icon: ShieldCheck,
  },
};

const safeArray = (value) => (Array.isArray(value) ? value : []);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isDone(value) {
  const status = normalize(value);

  return [
    "completed",
    "complete",
    "done",
    "approved",
    "verified",
    "resolved",
    "closed",
    "paid",
    "cancelled",
    "canceled",
  ].some((token) => status.includes(token));
}

function AdminHeader({
  inquiries = [],
  appointments = [],
  appointmentPendingCount = 0,
  fetchAllData = () => {},
  activeTab = "home",

  // Preserved public API. Contextual export/clear actions intentionally do not
  // live in the global shell anymore.
  exportInquiriesToCSV = () => {},
  exportAppointmentsToCSV = () => {},
  clearInquiries = () => {},
  clearAppointments = () => {},

  logout = () => {},
  role = "staff",
  adminProfile = null,
  permissions = {},

  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],

  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  studentPortalAccounts = [],
  supportRequests = [],
  counselorPaymentRequests = [],
  executiveExecutionLogs = [],

  setActiveTab = null,
  setActiveAnalyticsSection = null,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  const currentRole = ROLE_CONFIG[role] || ROLE_CONFIG.staff;
  const RoleIcon = currentRole.Icon;

  const safeInquiries = safeArray(inquiries);
  const safeAppointments = safeArray(appointments);
  const safeApplications = safeArray(studentApplications);
  const safeDocuments = safeArray(studentDocuments);
  const safeTasks = safeArray(studentTasks);
  const safeInvoices = safeArray(studentInvoices);
  const safeReceipts = safeArray(studentReceipts);
  const safeSupport = safeArray(supportRequests);
  const safeRisk = safeArray(studentRiskScores);

  const shellSignals = useMemo(() => {
    const newInquiries = safeInquiries.filter(
      (item) => normalize(item?.status || "new") === "new"
    ).length;

    const pendingDocuments = safeDocuments.filter(
      (item) =>
        !isDone(
          item?.status ||
            item?.document_status ||
            item?.verification_status
        )
    ).length;

    const openTasks = safeTasks.filter(
      (item) => !isDone(item?.status || item?.task_status)
    ).length;

    const pendingApplications = safeApplications.filter((item) => {
      const status = normalize(
        item?.application_status || item?.status
      );

      return (
        !isDone(status) &&
        !status.includes("rejected") &&
        !status.includes("withdrawn")
      );
    }).length;

    const unpaidInvoices = safeInvoices.filter(
      (item) =>
        !isDone(item?.status || item?.payment_status)
    ).length;

    const pendingReceipts = safeReceipts.filter((item) => {
      const status = normalize(
        item?.status ||
          item?.receipt_status ||
          item?.approval_status
      );

      return !status.includes("approved") && !status.includes("rejected");
    }).length;

    const openSupport = safeSupport.filter(
      (item) =>
        !["resolved", "closed", "completed"].includes(
          normalize(item?.status || item?.request_status)
        )
    ).length;

    const highRisk = safeRisk.filter((item) => {
      const score = Number(
        item?.risk_score || item?.score || item?.overall_score || 0
      );
      const level = normalize(
        item?.risk_level || item?.priority || item?.level
      );

      return (
        score >= 70 ||
        level.includes("high") ||
        level.includes("critical")
      );
    }).length;

    const alertCount =
      Number(appointmentPendingCount || 0) +
      newInquiries +
      pendingDocuments +
      openTasks +
      pendingApplications +
      unpaidInvoices +
      pendingReceipts +
      openSupport +
      highRisk;

    return {
      alertCount,
      totalLeads: safeInquiries.length + safeAppointments.length,
      openTasks,
    };
  }, [
    appointmentPendingCount,
    safeApplications,
    safeAppointments,
    safeDocuments,
    safeInquiries,
    safeInvoices,
    safeReceipts,
    safeRisk,
    safeSupport,
    safeTasks,
  ]);

  const safePermissions = useMemo(
    () => ({
      canDelete: false,
      canClearAll: false,
      canExport: false,
      canManageAdmins: false,
      ...permissions,
    }),
    [permissions]
  );

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    setRefreshMessage("");

    try {
      await Promise.resolve(
        fetchAllData({
          force: true,
          source: "admin_header_manual_refresh",
        })
      );

      setRefreshMessage("Admin data refreshed.");
    } catch (error) {
      console.error("AdminHeader refresh failed:", error);
      setRefreshMessage(
        error?.message || "Refresh failed. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const openNotifications = () => {
    if (typeof setActiveTab === "function") {
      setActiveTab("communication-notifications");
    }
  };

  return (
    <header className="rounded-[1.35rem] border-2 border-[#C9D7E6] bg-white shadow-[0_10px_30px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 p-3.5 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-200 bg-orange-50 text-orange-700">
            <RoleIcon size={17} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-black text-[#10233F]">
                {adminProfile?.full_name || "Admin User"}
              </p>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                {currentRole.label}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700">
                <CheckCircle2 size={10} />
                Online
              </span>
            </div>

            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              {shellSignals.totalLeads} leads · {shellSignals.openTasks} open tasks
              {activeTab ? ` · ${String(activeTab).replace(/-/g, " ")}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {refreshMessage ? (
            <span className="mr-1 max-w-[260px] truncate text-[10px] font-bold text-slate-500">
              {refreshMessage}
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#123865] transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Refreshing" : "Refresh"}
            </span>
          </button>

          <NotificationBell
            notifications={shellSignals.alertCount}
            onClick={openNotifications}
            label="Open CRM notifications"
          />

          {safePermissions.canManageAdmins ? (
            <button
              type="button"
              onClick={() => setActiveTab?.("system-overview")}
              className="hidden h-10 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 text-xs font-black text-[#123865] transition hover:border-orange-400 hover:bg-orange-50 md:inline-flex"
            >
              <UsersRound size={15} />
              System
            </button>
          ) : null}

          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 px-3 text-xs font-black text-orange-700 transition hover:border-orange-500 hover:bg-orange-100"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
