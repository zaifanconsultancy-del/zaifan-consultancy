import { lazy, Suspense, useMemo, useState } from "react";
import { CalendarClock, PhoneCall } from "lucide-react";

const CommunicationOSDashboard = lazy(() =>
  import("../communication/CommunicationOSDashboard")
);
const EmailCenter = lazy(() => import("../communication/EmailCenter"));
const WhatsAppCenter = lazy(() => import("../communication/WhatsAppCenter"));
const CallCenter = lazy(() => import("../communication/CallCenter"));
const MeetingCenter = lazy(() => import("../communication/MeetingCenter"));
const CommunicationAnalytics = lazy(() =>
  import("../communication/CommunicationAnalytics")
);
const NotificationActionCenter = lazy(() =>
  import("../workspaces/communications/NotificationActionCenter")
);

function CommunicationsPage({
  workspaceMode = "communications",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  adminProfile = null,
  setActiveTab,
  toggleInquiryStatus,
  updateAppointmentStatus,
}) {
  const [contactMode, setContactMode] = useState("calls");

  const communicationData = useMemo(
    () => ({
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  const openRecord = (record) => {
    const type = String(
      record?.student_type ||
        record?.__leadType ||
        record?.type ||
        ""
    ).toLowerCase();

    if (type === "appointment") {
      setActiveTab?.("appointments");
      return;
    }

    setActiveTab?.("inquiries");
  };

  return (
    <section className="space-y-5">
      <Suspense fallback={<WorkspaceLoader />}>
        {workspaceMode === "communications" ? (
          <CommunicationOSDashboard
            adminProfile={adminProfile}
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            communicationData={communicationData}
            onOpenRecord={openRecord}
            onOpenEmail={() => setActiveTab?.("communication-email")}
            onOpenWhatsApp={() => setActiveTab?.("communication-whatsapp")}
            onOpenCall={() => setActiveTab?.("communication-calls-meetings")}
            onOpenMeeting={() => setActiveTab?.("communication-calls-meetings")}
          />
        ) : null}

        {workspaceMode === "communication-email" ? (
          <EmailCenter
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            communicationData={communicationData}
            onOpenRecord={openRecord}
          />
        ) : null}

        {workspaceMode === "communication-whatsapp" ? (
          <WhatsAppCenter
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            communicationData={communicationData}
            onOpenRecord={openRecord}
          />
        ) : null}

        {workspaceMode === "communication-calls-meetings" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[1.35rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="px-1">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                  Calls & Meetings
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Switch the active communication workspace without duplicating its command header.
                </p>
              </div>

              <div className="inline-flex self-start rounded-xl border-2 border-[#123865] bg-white p-1 sm:self-auto">
                <ModeButton
                  active={contactMode === "calls"}
                  onClick={() => setContactMode("calls")}
                  icon={PhoneCall}
                >
                  Calls
                </ModeButton>

                <ModeButton
                  active={contactMode === "meetings"}
                  onClick={() => setContactMode("meetings")}
                  icon={CalendarClock}
                >
                  Meetings
                </ModeButton>
              </div>
            </div>

            {contactMode === "calls" ? (
              <CallCenter
                inquiries={inquiries}
                appointments={appointments}
                followUpReminders={followUpReminders}
                communicationData={communicationData}
                onOpenRecord={openRecord}
              />
            ) : (
              <MeetingCenter
                inquiries={inquiries}
                appointments={appointments}
                followUpReminders={followUpReminders}
                communicationData={communicationData}
                onOpenRecord={openRecord}
              />
            )}
          </div>
        ) : null}

        {workspaceMode === "communication-notifications" ? (
          <NotificationActionCenter
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            updateInquiryStatus={toggleInquiryStatus}
            updateAppointmentStatus={updateAppointmentStatus}
            setActiveTab={setActiveTab}
          />
        ) : null}

        {workspaceMode === "communication-analytics" ? (
          <CommunicationAnalytics
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            communicationData={communicationData}
          />
        ) : null}
      </Suspense>
    </section>
  );
}

function ModeButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
        active
          ? "bg-[#123865] text-white shadow-sm"
          : "text-[#526984] hover:bg-orange-50 hover:text-orange-700"
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border-[3px] border-orange-300 bg-[#FFF8EF] shadow-[0_10px_28px_rgba(15,35,63,0.05)]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening communications workspace
        </p>
      </div>
    </div>
  );
}

export default CommunicationsPage;
