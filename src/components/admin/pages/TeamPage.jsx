// TeamPage PARTNER OS EXTREME V2 — Team Command Router
// src/components/admin/pages/TeamPage.jsx
//
// Partner OS page pass:
// - preserves all lazy imports, workspace modes, props and child ownership
// - keeps this file as a page coordinator rather than duplicating child UI
// - adds a restrained Partner OS page shell
// - upgrades the performance view switcher into a compact command selector
// - improves responsive containment and loading states
// - keeps only one performance workspace mounted at a time

import { lazy, Suspense, useState } from "react";

const CounselorCommandCenter = lazy(() =>
  import("../workspaces/team/CounselorCommandCenter")
);
const CounselorPerformanceAI = lazy(() =>
  import("../workspaces/team/CounselorPerformanceAI")
);
const WorkloadBalancerAI = lazy(() =>
  import("../workspaces/team/WorkloadBalancerAI")
);
const StaffPerformanceAnalytics = lazy(() =>
  import("../workspaces/team/StaffPerformanceAnalytics")
);
const StaffLeaderboard = lazy(() =>
  import("../workspaces/team/StaffLeaderboard")
);
const AdminManagementPage = lazy(() =>
  import("./AdminManagementPage")
);

const PERFORMANCE_VIEWS = [
  {
    id: "counselor",
    label: "Counselor Intelligence",
    description: "Workload, conversion, ownership and counselor scoring",
  },
  {
    id: "staff",
    label: "Staff Analytics",
    description: "Staff workload, pressure and portfolio performance",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    description: "Transparent ranking and top-performer view",
  },
];

function TeamPage({
  workspaceMode = "team-command",
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  role,
  adminProfile,
  permissions,
}) {
  const [performanceView, setPerformanceView] = useState("counselor");

  return (
    <section className="min-w-0 space-y-5 rounded-[2.15rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_22px_60px_rgba(18,56,101,0.14)] sm:p-4 lg:p-5">
      <Suspense fallback={<WorkspaceLoader />}>
        {workspaceMode === "team-command" ? (
          <CounselorCommandCenter
            inquiries={inquiries}
            appointments={appointments}
            reminders={followUpReminders}
          />
        ) : null}

        {workspaceMode === "team-workload" ? (
          <WorkloadBalancerAI
            inquiries={inquiries}
            appointments={appointments}
          />
        ) : null}

        {workspaceMode === "team-performance" ? (
          <div className="min-w-0 space-y-4">
            <PerformanceViewSwitcher
              activeView={performanceView}
              setActiveView={setPerformanceView}
            />

            <div className="min-w-0">
              {performanceView === "counselor" ? (
                <CounselorPerformanceAI
                  inquiries={inquiries}
                  appointments={appointments}
                />
              ) : null}

              {performanceView === "staff" ? (
                <StaffPerformanceAnalytics
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                />
              ) : null}

              {performanceView === "leaderboard" ? (
                <StaffLeaderboard
                  cardClass={cardClass}
                  inquiries={inquiries}
                  appointments={appointments}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {workspaceMode === "team-access" ? (
          <AdminManagementPage
            cardClass={cardClass}
            role={role}
            adminProfile={adminProfile}
            permissions={permissions}
          />
        ) : null}
      </Suspense>
    </section>
  );
}

function PerformanceViewSwitcher({
  activeView,
  setActiveView,
}) {
  const activeDefinition =
    PERFORMANCE_VIEWS.find((view) => view.id === activeView) ||
    PERFORMANCE_VIEWS[0];

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_16px_42px_rgba(18,56,101,0.09)]">
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="min-w-0 bg-[#123865] px-5 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Team Performance OS
            </span>

            <span className="inline-flex items-center rounded-full border-2 border-orange-300/40 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-100">
              One workspace at a time
            </span>
          </div>

          <h3 className="mt-3 break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">
            Performance Intelligence Views
          </h3>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Move between counselor intelligence, staff portfolio analytics and
            transparent leaderboard performance without duplicating workspaces.
          </p>
        </div>

        <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] px-5 py-4 text-white sm:px-6 sm:py-5 lg:border-l-[3px] lg:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
            Active Performance View
          </p>

          <p className="mt-2 break-words text-xl font-black text-white">
            {activeDefinition.label}
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-orange-50">
            {activeDefinition.description}
          </p>

          <div className="mt-3 rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2.5">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
              Workspace Position
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {String(
                PERFORMANCE_VIEWS.findIndex(
                  (view) => view.id === activeView
                ) + 1
              ).padStart(2, "0")}{" "}
              / {String(PERFORMANCE_VIEWS.length).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-3 md:grid-cols-3 sm:p-4">
        {PERFORMANCE_VIEWS.map((view, index) => {
          const active = activeView === view.id;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              aria-pressed={active}
              className={`group min-w-0 rounded-[1.25rem] border-[3px] p-4 text-left shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                active
                  ? "border-[#FF5A0A] bg-white"
                  : "border-[#C9D7E6] bg-white hover:border-[#123865] hover:bg-[#F2F7FF]"
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-xs font-black ${
                    active
                      ? "border-[#FF5A0A] bg-[#FF5A0A] text-white"
                      : "border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[10px] font-black uppercase tracking-[0.1em] text-[#10233F]">
                    {view.label}
                  </span>

                  <span className="mt-1 block break-words text-[10px] font-semibold leading-4 text-slate-500">
                    {view.description}
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
        })}
      </div>
    </section>
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
          Opening team workspace
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          Loading the selected Partner OS team command surface.
        </p>
      </div>
    </div>
  );
}

export default TeamPage;
