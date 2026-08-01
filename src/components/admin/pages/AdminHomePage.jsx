import { lazy, Suspense } from "react";

import AdminHeader from "../workspaces/core/AdminHeader";

const AdminStats = lazy(() => import("../workspaces/core/AdminStats"));
const NotificationCenter = lazy(() => import("../workspaces/communications/NotificationCenter"));

// AdminHomePage PARTNER OS EXTREME V2 — Executive Admin Command Home

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
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
          <div className="relative min-w-0 overflow-hidden bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
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

              <h1 className="mt-1 break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.7rem]">
                Welcome back, {adminProfile?.full_name || "Admin User"}
              </h1>

              <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
                See what needs attention, then jump straight into the right workspace
                without losing operational context.
              </p>

              <div className="mt-5 grid min-w-0 max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3">
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
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-4 text-[11px] font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                >
                  Open students
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("inquiries")}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-4 text-[11px] font-black text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                >
                  Review leads
                </button>
              </div>
            </div>
          </div>

          <aside className="relative min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
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

              <div className="mt-5 rounded-[1.2rem] border-2 border-white/25 bg-white/10 p-4">
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

        <div className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:p-5">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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

      <div className="zaifan-admin-embedded-dark relative z-20 min-w-0 overflow-visible rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-2 shadow-[0_12px_34px_rgba(18,56,101,0.06)] sm:p-3">
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

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Live Operating Picture
            </p>

            <h2 className="mt-2 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
              What needs attention right now
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Global CRM, student, finance, access and support signals remain
              visible here without duplicating their operational workspaces.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-5 lg:border-l-[3px] lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Command Scope
            </p>

            <p className="mt-2 text-sm font-black leading-5 text-[#10233F]">
              Attention, health and executive summaries only
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Open the owning workspace to perform detailed actions.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={<InsightLoader />}>
        <div className="zaifan-admin-embedded-dark min-w-0 rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-2 shadow-[0_12px_34px_rgba(18,56,101,0.06)] sm:p-3">
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
      shell: "border-[#123865] bg-[#F2F7FF]",
      value: "text-[#123865]",
    },
    orange: {
      shell: "border-orange-500 bg-[#FFF4E8]",
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
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${selected.shell}`}
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
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3.5 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-white/70">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PermissionRow({ label, enabled }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2.5">
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
          className="h-28 animate-pulse rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white shadow-[0_7px_18px_rgba(18,56,101,0.05)]"
        />
      ))}
    </div>
  );
}

export default AdminHomePage;
