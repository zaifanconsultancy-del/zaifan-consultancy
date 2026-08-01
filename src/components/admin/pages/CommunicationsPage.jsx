// CommunicationsPage PARTNER OS EXTREME V2 — Communications Workspace Router
// src/components/admin/pages/CommunicationsPage.jsx
//
// Partner OS page pass:
// - preserves every lazy import, workspace mode, callback and child ownership
// - keeps communicationData memoization and record-routing behaviour unchanged
// - upgrades only the Calls & Meetings selector and shared loader
// - avoids duplicate outer shells around finished communication workspaces

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
    <section className="min-w-0 space-y-5">
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
            onOpenWhatsApp={() =>
              setActiveTab?.("communication-whatsapp")
            }
            onOpenCall={() =>
              setActiveTab?.("communication-calls-meetings")
            }
            onOpenMeeting={() =>
              setActiveTab?.("communication-calls-meetings")
            }
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
          <div className="min-w-0 space-y-4">
            <ContactWorkspaceSwitcher
              contactMode={contactMode}
              setContactMode={setContactMode}
            />

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

function ContactWorkspaceSwitcher({
  contactMode,
  setContactMode,
}) {
  const activeLabel =
    contactMode === "calls"
      ? "Call Center"
      : "Meeting Center";

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="min-w-0 bg-[#123865] px-5 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Calls & Meetings
            </span>

            <span className="rounded-full border-2 border-orange-300/40 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-100">
              One workspace at a time
            </span>
          </div>

          <h3 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
            Communication Contact Workspace
          </h3>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Switch between call operations and meeting coordination without
            duplicating either workspace command header.
          </p>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] px-5 py-4 text-white sm:px-6 sm:py-5 lg:border-l-[3px] lg:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
            Active Contact Mode
          </p>

          <p className="mt-2 text-xl font-black text-white">
            {activeLabel}
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-orange-50">
            {contactMode === "calls"
              ? "Live call handling, contact activity and student follow-up."
              : "Meeting scheduling, consultation coordination and appointment context."}
          </p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-3 sm:p-4">
        <ModeButton
          active={contactMode === "calls"}
          onClick={() => setContactMode("calls")}
          icon={PhoneCall}
          label="Calls"
          description="Open call operations and contact activity."
          index="01"
        />

        <ModeButton
          active={contactMode === "meetings"}
          onClick={() => setContactMode("meetings")}
          icon={CalendarClock}
          label="Meetings"
          description="Open meeting and consultation coordination."
          index="02"
        />
      </div>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  index,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group min-w-0 rounded-[1.25rem] border-[3px] p-4 text-left shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        active
          ? "border-[#FF5A0A] bg-white"
          : "border-[#C9D7E6] bg-white hover:border-[#123865] hover:bg-[#F2F7FF]"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
            active
              ? "border-[#FF5A0A] bg-[#FF5A0A] text-white"
              : "border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Workspace {index}
          </span>

          <span className="mt-1 block break-words text-sm font-black text-[#10233F]">
            {label}
          </span>

          <span className="mt-1 hidden break-words text-[10px] font-semibold leading-4 text-slate-500 sm:block">
            {description}
          </span>
        </span>

        <span
          className={`shrink-0 rounded-full border-2 px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            active
              ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
              : "border-[#C9D7E6] bg-[#FFF8EF] text-slate-500"
          }`}
        >
          {active ? "Open" : "View"}
        </span>
      </div>

      <div
        className={`mt-3 h-1.5 overflow-hidden rounded-full ${
          active ? "bg-orange-100" : "bg-slate-100"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            active ? "w-full bg-[#FF5A0A]" : "w-0 bg-[#123865]"
          } group-hover:w-full`}
        />
      </div>
    </button>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-6 shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-[#FF5A0A] bg-[#FFF4E8]">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-100 border-t-[#FF5A0A]" />
        </div>

        <p className="mt-4 text-sm font-black text-[#10233F]">
          Opening communications workspace
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          Loading the selected Partner OS communication destination.
        </p>
      </div>
    </div>
  );
}

export default CommunicationsPage;
