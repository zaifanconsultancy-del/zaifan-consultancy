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
    <section className="space-y-5">
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
          <div className="space-y-4">
            <PerformanceViewSwitcher
              activeView={performanceView}
              setActiveView={setPerformanceView}
            />

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
  return (
    <div className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_12px_30px_rgba(15,35,63,0.07)]">
      <div className="flex flex-col gap-3 bg-[#123865] px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
            Team Performance Views
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            Choose what you want to inspect
          </h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
            Switch between counselor intelligence, staff analytics and the team leaderboard.
            Only one workspace opens at a time.
          </p>
        </div>

        <div className="shrink-0 rounded-xl border-2 border-white/20 bg-white/10 px-4 py-2">
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-orange-200">
            Active View
          </p>
          <p className="mt-0.5 text-sm font-black text-white">
            {PERFORMANCE_VIEWS.find((view) => view.id === activeView)?.label}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-3 md:grid-cols-3">
        {PERFORMANCE_VIEWS.map((view, index) => {
          const active = activeView === view.id;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              aria-pressed={active}
              className={`group relative min-w-0 rounded-[1.2rem] border-[3px] p-4 text-left transition ${
                active
                  ? "border-orange-500 bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)]"
                  : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#123865] hover:bg-blue-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-xs font-black ${
                    active
                      ? "border-white/35 bg-white/15 text-white"
                      : "border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]"
                  }`}
                >
                  0{index + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[10px] font-black uppercase tracking-[0.11em] ${
                      active ? "text-white" : "text-[#10233F]"
                    }`}
                  >
                    {view.label}
                  </span>

                  <span
                    className={`mt-1 block text-[10px] font-semibold leading-4 ${
                      active ? "text-white/90" : "text-slate-500"
                    }`}
                  >
                    {view.description}
                  </span>
                </span>

                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
                    active
                      ? "border-white/30 bg-white/15 text-white"
                      : "border-[#C9D7E6] bg-[#FFF8EF] text-slate-500"
                  }`}
                >
                  {active ? "Open" : "View"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border-[3px] border-orange-300 bg-[#FFF8EF]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening team workspace
        </p>
      </div>
    </div>
  );
}

export default TeamPage;