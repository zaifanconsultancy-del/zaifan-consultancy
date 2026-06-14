import React, { useMemo, useState } from "react";
import EmployeeWorkspace from "./EmployeeWorkspace";
import LeaveManagementPanel from "./LeaveManagementPanel";
import PerformanceManagementPanel from "./PerformanceManagementPanel";
import RecruitmentPanel from "./RecruitmentPanel";
import TrainingCenter from "./TrainingCenter";
import OrganizationChart from "./OrganizationChart";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function getRole(person = {}) {
  return person.role || person.job_title || person.position || person.department_role || "Team Member";
}

function getDepartment(person = {}) {
  const role = lower(getRole(person));
  if (person.department) return person.department;
  if (role.includes("counselor") || role.includes("advisor")) return "Counseling";
  if (role.includes("visa")) return "Visa";
  if (role.includes("application") || role.includes("admission")) return "Admissions";
  if (role.includes("marketing")) return "Marketing";
  if (role.includes("finance")) return "Finance";
  if (role.includes("admin") || role.includes("executive")) return "Administration";
  return "Operations";
}

function getName(person = {}) {
  return person.full_name || person.name || person.displayName || person.email || "Team Member";
}

function getStatus(person = {}) {
  return person.status || person.employment_status || person.account_status || "Active";
}

function getJoinDate(person = {}) {
  return person.joined_at || person.join_date || person.created_at || person.createdAt || null;
}

function isActive(person = {}) {
  const status = lower(getStatus(person));
  return !status.includes("inactive") && !status.includes("terminated") && !status.includes("left");
}

function buildHROSData(snapshot = {}) {
  const employees = safeArray(snapshot.employees || snapshot.staff || snapshot.counselors || snapshot.users || snapshot.team);
  const counselors = safeArray(snapshot.counselors || snapshot.counselorProfiles);
  const tasks = safeArray(snapshot.tasks || snapshot.studentTasks || snapshot.counselorTasks);
  const support = safeArray(snapshot.supportRequests || snapshot.support || snapshot.studentSupportRequests);
  const applications = safeArray(snapshot.applications || snapshot.studentApplications);
  const leaves = safeArray(snapshot.leaves || snapshot.leaveRequests || snapshot.timeOff);
  const candidates = safeArray(snapshot.candidates || snapshot.recruitment || snapshot.applicants);
  const training = safeArray(snapshot.training || snapshot.trainingRecords || snapshot.courses);

  const mergedPeople = employees.length ? employees : counselors;

  const people = mergedPeople.map((person, index) => {
    const name = getName(person);
    const department = getDepartment(person);
    const role = getRole(person);
    const personTasks = tasks.filter((task) =>
      lower(task.assigned_to || task.assigned_counselor || task.counselor_name || task.owner).includes(lower(name))
    );
    const personSupport = support.filter((item) =>
      lower(item.assigned_to || item.assigned_counselor || item.counselor_name || item.owner).includes(lower(name))
    );
    const personApplications = applications.filter((item) =>
      lower(item.assigned_to || item.assigned_counselor || item.counselor_name || item.owner).includes(lower(name))
    );

    const completedTasks = personTasks.filter((task) => lower(task.status).includes("complete") || lower(task.status).includes("done")).length;
    const openTasks = personTasks.length - completedTasks;
    const score = Math.max(
      0,
      Math.min(
        100,
        65 +
          completedTasks * 2 +
          personApplications.length * 3 +
          personSupport.length -
          openTasks * 1.5
      )
    );

    return {
      id: person.id || person.user_id || person.email || `employee-${index}`,
      name,
      email: person.email || person.user_email || "",
      phone: person.phone || person.mobile || "",
      role,
      department,
      status: getStatus(person),
      active: isActive(person),
      joinDate: getJoinDate(person),
      tasks: personTasks.length,
      openTasks,
      completedTasks,
      support: personSupport.length,
      applications: personApplications.length,
      performanceScore: Math.round(score),
      manager: person.manager || person.reports_to || "Founder / Admin",
    };
  });

  const departmentMap = new Map();
  people.forEach((person) => {
    const current = departmentMap.get(person.department) || {
      name: person.department,
      headcount: 0,
      active: 0,
      tasks: 0,
      applications: 0,
      performanceTotal: 0,
    };

    current.headcount += 1;
    if (person.active) current.active += 1;
    current.tasks += person.tasks;
    current.applications += person.applications;
    current.performanceTotal += person.performanceScore;
    departmentMap.set(person.department, current);
  });

  const departments = Array.from(departmentMap.values()).map((department) => ({
    ...department,
    avgPerformance: department.headcount ? Math.round(department.performanceTotal / department.headcount) : 0,
  }));

  const leaveRows = leaves.map((leave, index) => ({
    id: leave.id || `leave-${index}`,
    employee: leave.employee_name || leave.staff_name || leave.name || leave.email || "Employee",
    type: leave.type || leave.leave_type || "Leave",
    status: leave.status || "Pending",
    start: leave.start_date || leave.from_date || leave.date,
    end: leave.end_date || leave.to_date || leave.date,
    reason: leave.reason || leave.notes || "No reason provided",
  }));

  const candidateRows = candidates.map((candidate, index) => ({
    id: candidate.id || `candidate-${index}`,
    name: candidate.name || candidate.full_name || candidate.email || "Candidate",
    role: candidate.role || candidate.position || candidate.applied_for || "Open Role",
    stage: candidate.stage || candidate.status || "Screening",
    score: number(candidate.score || candidate.match_score || candidate.rating, 60),
    source: candidate.source || candidate.channel || "Direct",
  }));

  const trainingRows = training.map((item, index) => ({
    id: item.id || `training-${index}`,
    title: item.title || item.course_name || item.name || "Training",
    employee: item.employee_name || item.staff_name || item.assigned_to || "Team",
    status: item.status || "Assigned",
    progress: number(item.progress || item.completion_percent || item.percent, 0),
    category: item.category || item.type || "General",
  }));

  const openLeaves = leaveRows.filter((leave) => lower(leave.status).includes("pending") || lower(leave.status).includes("requested")).length;
  const openCandidates = candidateRows.filter((candidate) => !lower(candidate.stage).includes("hired") && !lower(candidate.stage).includes("rejected")).length;
  const trainingDue = trainingRows.filter((item) => item.progress < 100).length;

  return {
    people,
    departments,
    leaves: leaveRows,
    candidates: candidateRows,
    training: trainingRows,
    totals: {
      employees: people.length,
      active: people.filter((person) => person.active).length,
      departments: departments.length,
      avgPerformance: people.length ? Math.round(people.reduce((sum, person) => sum + person.performanceScore, 0) / people.length) : 0,
      openTasks: people.reduce((sum, person) => sum + person.openTasks, 0),
      openLeaves,
      openCandidates,
      trainingDue,
    },
  };
}

function MetricCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function HROSDashboard({ snapshot, adminProfile, onRefresh }) {
  const [activeView, setActiveView] = useState("overview");
  const hr = useMemo(() => buildHROSData(snapshot || {}), [snapshot]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "employees", label: "Employees" },
    { key: "leave", label: "Leave" },
    { key: "performance", label: "Performance" },
    { key: "recruitment", label: "Recruitment" },
    { key: "training", label: "Training" },
    { key: "org", label: "Org Chart" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-white shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-300">HR OS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Team Operating System</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Employee workspace, leave management, team performance, recruitment, training, and organization structure for Zaifan operations.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-slate-500">HR view for {adminProfile.email}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                activeView === view.key
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {view.label}
            </button>
          ))}
          {onRefresh ? (
            <button type="button" onClick={onRefresh} className="rounded-2xl border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/20">
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <MetricCard label="Employees" value={hr.totals.employees} helper={`${hr.totals.active} active`} tone="cyan" />
            <MetricCard label="Departments" value={hr.totals.departments} helper="operating units" tone="violet" />
            <MetricCard label="Performance" value={`${hr.totals.avgPerformance}%`} helper="team average" tone={hr.totals.avgPerformance >= 75 ? "emerald" : "amber"} />
            <MetricCard label="Open Tasks" value={hr.totals.openTasks} helper="team workload" tone="amber" />
            <MetricCard label="Leave" value={hr.totals.openLeaves} helper="pending requests" tone="rose" />
            <MetricCard label="Candidates" value={hr.totals.openCandidates} helper="open pipeline" tone="emerald" />
            <MetricCard label="Training" value={hr.totals.trainingDue} helper="due modules" tone="violet" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <EmployeeWorkspace hr={hr} compact />
            <PerformanceManagementPanel hr={hr} compact />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <LeaveManagementPanel hr={hr} compact />
            <OrganizationChart hr={hr} compact />
          </div>
        </>
      ) : null}

      {activeView === "employees" ? <EmployeeWorkspace hr={hr} /> : null}
      {activeView === "leave" ? <LeaveManagementPanel hr={hr} /> : null}
      {activeView === "performance" ? <PerformanceManagementPanel hr={hr} /> : null}
      {activeView === "recruitment" ? <RecruitmentPanel hr={hr} /> : null}
      {activeView === "training" ? <TrainingCenter hr={hr} /> : null}
      {activeView === "org" ? <OrganizationChart hr={hr} /> : null}
    </div>
  );
}

export { buildHROSData };
