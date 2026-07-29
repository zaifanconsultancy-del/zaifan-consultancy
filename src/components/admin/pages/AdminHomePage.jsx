import { lazy, Suspense } from "react";

import AdminHeader from "../workspaces/core/AdminHeader";

const AdminStats = lazy(() => import("../workspaces/core/AdminStats"));
const NotificationCenter = lazy(() => import("../workspaces/communications/NotificationCenter"));

function AdminHomePage({
  cardClass,
  role,
  roleLabel,
  adminProfile,
  permissions,
  inquiries,
  appointments,
  inquiryNewCount,
  inquiryContactedCount,
  appointmentPendingCount,
  appointmentConfirmedCount,
  appointmentCompletedCount,
  appointmentCancelledCount,
  studentApplications,
  studentDocuments,
  studentTasks,
  studentUniversities,
  studentRiskScores,
  studentInvoices,
  studentPayments,
  studentReceipts,
  studentPortalAccounts,
  supportRequests,
  counselorPaymentRequests,
  executiveExecutionLogs,
  adminCommandMetrics,
  aiCoverageStats,
  fetchAllData,
  exportInquiriesToCSV,
  exportAppointmentsToCSV,
  clearInquiries,
  clearAppointments,
  logout,
  setActiveTab,
  setActiveAnalyticsSection,
}) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-orange-500 bg-[#fff9f2] shadow-[0_18px_44px_rgba(16,49,86,0.08)]">
        <div className="grid min-[1180px]:grid-cols-[minmax(0,1fr)_330px]">
          <div className="relative overflow-hidden bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  System online
                </span>

                <span className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  GPT coverage {aiCoverageStats.percent}%
                </span>
              </div>

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">
                Admin command home
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">
                Welcome back, {adminProfile?.full_name || "Admin User"}
              </h1>

              <p className="mt-2 max-w-3xl text-[14px] font-semibold leading-6 text-white/80">
                See what needs attention, then jump straight into the right workspace
                without losing operational context.
              </p>

              <div className="mt-5 grid max-w-3xl gap-2 sm:grid-cols-3">
                <CommandStat
                  label="Open leads"
                  value={adminCommandMetrics.totalLeads}
                />
                <CommandStat
                  label="Open tasks"
                  value={adminCommandMetrics.pendingTasks}
                />
                <CommandStat
                  label="Support queue"
                  value={adminCommandMetrics.openSupport}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("students")}
                  className="rounded-xl border-2 border-orange-400 bg-[#ff5a0a] px-4 py-2.5 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(255,90,10,0.22)] transition hover:bg-[#e94f05]"
                >
                  Open students
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("inquiries")}
                  className="rounded-xl border-2 border-white/20 bg-white/10 px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-white/15"
                >
                  Review leads
                </button>
              </div>
            </div>
          </div>

          <aside className="relative bg-[#ff5a0a] p-5 text-white sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/80">
                Admin OS health
              </p>

              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black leading-none text-white">
                    Ready
                  </h2>
                  <p className="mt-2 text-xs font-bold leading-5 text-white/85">
                    Core Admin systems are online and permission gates are active.
                  </p>
                </div>

                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 text-lg font-black">
                  OS
                </span>
              </div>

              <div className="mt-5 rounded-2xl border-2 border-white/35 bg-white/10 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/75">
                  Session access
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {roleLabel || role}
                </p>
              </div>

              <div className="mt-3 grid gap-2">
                <PermissionRow
                  label="Delete records"
                  enabled={permissions.canDelete}
                />
                <PermissionRow
                  label="Export data"
                  enabled={permissions.canExport}
                />
                <PermissionRow
                  label="Clear all data"
                  enabled={permissions.canClearAll}
                />
              </div>
            </div>
          </aside>
        </div>

        <div className="border-t-[3px] border-orange-500 bg-[#fff9f2] p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <Metric
              label="Student leads"
              value={adminCommandMetrics.totalLeads}
              detail="Inquiry + appointment portfolio"
            />
            <Metric
              label="Pending"
              value={adminCommandMetrics.pendingAppointments}
              detail="Consultations awaiting action"
              tone="blue"
            />
            <Metric
              label="Open tasks"
              value={adminCommandMetrics.pendingTasks}
              detail="Student operations still active"
              tone="orange"
            />
            <Metric
              label="Support"
              value={adminCommandMetrics.openSupport}
              detail="Unresolved student requests"
              tone={adminCommandMetrics.openSupport ? "red" : "green"}
            />
            <Metric
              label="Portal accounts"
              value={adminCommandMetrics.activePortalAccounts}
              detail="Active Student OS access"
              tone="green"
            />
            <Metric
              label="GPT coverage"
              value={`${adminCommandMetrics.gptCoverage}%`}
              detail="Stored lead intelligence"
              tone="orange"
            />
          </div>
        </div>
      </section>

      <div className="zaifan-admin-embedded-dark relative z-20 overflow-visible">
        <AdminHeader
          inquiries={inquiries}
          appointments={appointments}
          appointmentPendingCount={appointmentPendingCount}
          fetchAllData={fetchAllData}
          activeTab="home"
          exportInquiriesToCSV={exportInquiriesToCSV}
          exportAppointmentsToCSV={exportAppointmentsToCSV}
          logout={logout}
          clearInquiries={clearInquiries}
          clearAppointments={clearAppointments}
          role={role}
          adminProfile={adminProfile}
          permissions={permissions}
          studentApplications={studentApplications}
          studentDocuments={studentDocuments}
          studentTasks={studentTasks}
          studentUniversities={studentUniversities}
          studentRiskScores={studentRiskScores}
          studentInvoices={studentInvoices}
          studentPayments={studentPayments}
          studentReceipts={studentReceipts}
          studentPortalAccounts={studentPortalAccounts}
          supportRequests={supportRequests}
          counselorPaymentRequests={counselorPaymentRequests}
          executiveExecutionLogs={executiveExecutionLogs}
          setActiveTab={setActiveTab}
          setActiveAnalyticsSection={setActiveAnalyticsSection}
        />
      </div>

      <section className="rounded-[1.6rem] border-[3px] border-[#123865] bg-[#fff9f2] p-4 shadow-[0_12px_30px_rgba(16,49,86,0.06)] sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5a0a]">
              Live operating picture
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#10233f] sm:text-3xl">
              What needs attention right now
            </h2>
          </div>

          <p className="max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Global CRM, student, finance, access and support signals live here only.
          </p>
        </div>
      </section>

      <Suspense fallback={<InsightLoader />}>
        <div className="zaifan-admin-embedded-dark">
          <NotificationCenter
            cardClass={cardClass}
            inquiryNewCount={inquiryNewCount}
            appointmentPendingCount={appointmentPendingCount}
            appointmentConfirmedCount={appointmentConfirmedCount}
            role={role}
            permissions={permissions}
            studentApplications={studentApplications}
            studentDocuments={studentDocuments}
            studentTasks={studentTasks}
            studentUniversities={studentUniversities}
            studentRiskScores={studentRiskScores}
            studentInvoices={studentInvoices}
            studentPayments={studentPayments}
            studentReceipts={studentReceipts}
            studentPortalAccounts={studentPortalAccounts}
            supportRequests={supportRequests}
            counselorPaymentRequests={counselorPaymentRequests}
            executiveExecutionLogs={executiveExecutionLogs}
            setActiveTab={setActiveTab}
            setActiveAnalyticsSection={setActiveAnalyticsSection}
          />
        </div>

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
          studentApplications={studentApplications}
          studentDocuments={studentDocuments}
          studentTasks={studentTasks}
          studentUniversities={studentUniversities}
          studentRiskScores={studentRiskScores}
          studentInvoices={studentInvoices}
          studentPayments={studentPayments}
          studentReceipts={studentReceipts}
          studentPortalAccounts={studentPortalAccounts}
          supportRequests={supportRequests}
          counselorPaymentRequests={counselorPaymentRequests}
          executiveExecutionLogs={executiveExecutionLogs}
        />
      </Suspense>
    </div>
  );
}

function Metric({ label, value, detail, tone = "slate" }) {
  const tones = {
    slate: {
      shell: "border-[#123865] bg-[#edf4fb]",
      value: "text-[#123865]",
    },
    orange: {
      shell: "border-orange-500 bg-[#fff6ec]",
      value: "text-[#c93208]",
    },
    blue: {
      shell: "border-blue-400 bg-[#eef5ff]",
      value: "text-[#164fa3]",
    },
    red: {
      shell: "border-rose-400 bg-[#fff1f3]",
      value: "text-[#c42145]",
    },
    green: {
      shell: "border-emerald-400 bg-[#ecfbf4]",
      value: "text-[#087f5b]",
    },
  };

  const selected = tones[tone] || tones.slate;

  return (
    <div
      className={`rounded-[1.2rem] border-[3px] p-4 shadow-[0_4px_10px_rgba(16,43,76,0.04)] ${selected.shell}`}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#4f617a]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${selected.value}`}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-[#50627b]">
        {detail}
      </p>
    </div>
  );
}

function CommandStat({ label, value }) {
  return (
    <div className="rounded-2xl border-2 border-white/20 bg-white/10 p-3.5">
      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-white/70">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PermissionRow({ label, enabled }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2.5">
      <span className="text-[9px] font-black uppercase tracking-[0.08em] text-white/80">
        {label}
      </span>
      <span
        className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
          enabled
            ? "border-white/40 bg-white/15 text-white"
            : "border-white/20 bg-[#123865]/20 text-white/60"
        }`}
      >
        {enabled ? "Allowed" : "Restricted"}
      </span>
    </div>
  );
}

function InsightLoader() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-[1.4rem] border border-slate-200 bg-white shadow-sm"
        />
      ))}
    </div>
  );
}

export default AdminHomePage;
