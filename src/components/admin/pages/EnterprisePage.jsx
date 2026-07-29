import { lazy, Suspense } from "react";

const FinanceOSDashboard = lazy(() =>
  import("../finance/FinanceOSDashboard")
);
const MarketingOSDashboard = lazy(() =>
  import("../marketing/MarketingOSDashboard")
);
const PartnerOSDashboard = lazy(() =>
  import("../partner/PartnerOSDashboard")
);
const AgentOSDashboard = lazy(() =>
  import("../agent/AgentOSDashboard")
);
const ComplianceOSDashboard = lazy(() =>
  import("../compliance/ComplianceOSDashboard")
);
const HROSDashboard = lazy(() =>
  import("../hr/HROSDashboard")
);

function EnterprisePage({
  workspaceMode,
  adminProfile,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentInvoices = [],
  studentPayments = [],
  counselorPaymentRequests = [],
}) {
  const sharedProps = {
    adminProfile,
    inquiries,
    appointments,
    followUpReminders,
    studentApplications,
    studentDocuments,
    studentTasks,
    studentUniversities,
    studentInvoices,
    studentPayments,
    counselorPaymentRequests,
  };

  return (
    <section className="space-y-5">
      <Suspense fallback={<WorkspaceLoader />}>
        {workspaceMode === "enterprise-finance" ? (
          <FinanceOSDashboard {...sharedProps} />
        ) : null}

        {workspaceMode === "enterprise-marketing" ? (
          <MarketingOSDashboard {...sharedProps} />
        ) : null}

        {workspaceMode === "enterprise-partners" ? (
          <PartnerOSDashboard {...sharedProps} />
        ) : null}

        {workspaceMode === "enterprise-agents" ? (
          <AgentOSDashboard {...sharedProps} />
        ) : null}

        {workspaceMode === "enterprise-compliance" ? (
          <ComplianceOSDashboard {...sharedProps} />
        ) : null}

        {workspaceMode === "enterprise-hr" ? (
          <HROSDashboard {...sharedProps} />
        ) : null}
      </Suspense>
    </section>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-[1.5rem] border-[3px] border-orange-300 bg-[#FFF8EF] shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening enterprise workspace
        </p>
      </div>
    </div>
  );
}

export default EnterprisePage;
