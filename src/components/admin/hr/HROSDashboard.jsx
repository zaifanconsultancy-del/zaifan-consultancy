import React, { useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Database,
  GraduationCap,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck2,
  UsersRound,
} from "lucide-react";

import EmployeeWorkspace from "./EmployeeWorkspace";
import LeaveManagementPanel from "./LeaveManagementPanel";
import PerformanceManagementPanel from "./PerformanceManagementPanel";
import RecruitmentPanel from "./RecruitmentPanel";
import TrainingCenter from "./TrainingCenter";
import OrganizationChart from "./OrganizationChart";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId(value) {
  return String(value || "").trim();
}

function getRole(person = {}) {
  return (
    person.role ||
    person.job_title ||
    person.position ||
    person.department_role ||
    "Team Member"
  );
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
  return (
    person.full_name ||
    person.name ||
    person.displayName ||
    person.display_name ||
    person.email ||
    "Team Member"
  );
}

function getEmail(person = {}) {
  return person.email || person.user_email || "";
}

function getStatus(person = {}) {
  return person.status || person.employment_status || person.account_status || "Active";
}

function getJoinDate(person = {}) {
  return (
    person.joined_at ||
    person.join_date ||
    person.created_at ||
    person.createdAt ||
    null
  );
}

function isActive(person = {}) {
  const status = lower(getStatus(person));

  return ![
    "inactive",
    "terminated",
    "left",
    "disabled",
    "suspended",
  ].some((token) => status.includes(token));
}

function getIdentityId(person = {}) {
  return normalizeId(
    person.auth_id ||
      person.user_id ||
      person.id ||
      person.profile_id ||
      person.email
  );
}

function getAssignmentIds(record = {}) {
  return [
    record.assigned_user_id,
    record.assigned_admin_id,
    record.assigned_counselor_id,
    record.counselor_id,
    record.owner_id,
    record.assigned_to_id,
    record.user_id,
  ]
    .map(normalizeId)
    .filter(Boolean);
}

function getAssignmentNames(record = {}) {
  return [
    record.assigned_user_name,
    record.assigned_admin_name,
    record.assigned_counselor_name,
    record.counselor_name,
    record.owner_name,
    record.assigned_to,
    record.assigned_counselor,
    record.owner,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function recordBelongsToPerson(record = {}, person = {}) {
  const personId = getIdentityId(person);

  if (personId) {
    const assignmentIds = getAssignmentIds(record);
    if (assignmentIds.includes(personId)) return true;
  }

  // Legacy fallback only. UUID ownership is always preferred.
  const personName = lower(getName(person));
  const personEmail = lower(getEmail(person));

  if (!personName && !personEmail) return false;

  const names = getAssignmentNames(record).map(lower);

  return names.some(
    (value) =>
      (personEmail && value === personEmail) ||
      (personName && value === personName)
  );
}

function mergePeople(snapshot = {}) {
  const sources = [
    ...safeArray(snapshot.employees),
    ...safeArray(snapshot.staff),
    ...safeArray(snapshot.counselors),
    ...safeArray(snapshot.counselorProfiles),
    ...safeArray(snapshot.users),
    ...safeArray(snapshot.team),
    ...safeArray(snapshot.adminProfiles),
  ];

  const map = new Map();

  sources.forEach((person, index) => {
    const identity = getIdentityId(person) || `anonymous-${index}`;

    const existing = map.get(identity) || {
      ...person,
      __identity: identity,
      __roles: [],
      __sources: [],
    };

    const roles = new Set(existing.__roles || []);
    const sourcesSet = new Set(existing.__sources || []);

    const role = getRole(person);
    if (role) roles.add(role);

    if (snapshot.employees?.includes?.(person)) sourcesSet.add("employees");
    if (snapshot.staff?.includes?.(person)) sourcesSet.add("staff");
    if (snapshot.counselors?.includes?.(person)) sourcesSet.add("counselors");
    if (snapshot.counselorProfiles?.includes?.(person)) sourcesSet.add("counselorProfiles");
    if (snapshot.users?.includes?.(person)) sourcesSet.add("users");
    if (snapshot.team?.includes?.(person)) sourcesSet.add("team");
    if (snapshot.adminProfiles?.includes?.(person)) sourcesSet.add("adminProfiles");

    map.set(identity, {
      ...existing,
      ...person,
      id: existing.id || person.id || person.user_id || identity,
      user_id: existing.user_id || person.user_id || person.auth_id || identity,
      full_name: existing.full_name || person.full_name || person.name || getName(person),
      email: existing.email || getEmail(person),
      role: existing.role || getRole(person),
      department: existing.department || getDepartment(person),
      status: existing.status || getStatus(person),
      __identity: identity,
      __roles: [...roles],
      __sources: [...sourcesSet],
    });
  });

  return [...map.values()];
}

function getEvidenceScore(person, taskRows, supportRows, applicationRows) {
  const completedTasks = taskRows.filter((task) => {
    const status = lower(task.status);
    return status.includes("complete") || status.includes("done");
  }).length;

  const openTasks = Math.max(0, taskRows.length - completedTasks);
  const overdueTasks = taskRows.filter((task) => {
    const status = lower(task.status);
    return status.includes("overdue") || status.includes("late");
  }).length;

  const taskCompletionRate = taskRows.length
    ? Math.round((completedTasks / taskRows.length) * 100)
    : null;

  const workloadCount = taskRows.length + supportRows.length + applicationRows.length;

  const evidenceParts = [
    taskRows.length > 0,
    supportRows.length > 0,
    applicationRows.length > 0,
  ].filter(Boolean).length;

  // This is an operational evidence index, not an HR appraisal score.
  let operatingIndex = null;

  if (evidenceParts > 0) {
    const taskFactor = taskCompletionRate === null ? 50 : taskCompletionRate;
    const overduePenalty = Math.min(30, overdueTasks * 10);
    const deliveryBonus = Math.min(15, applicationRows.length * 2 + supportRows.length);

    operatingIndex = Math.max(
      0,
      Math.min(
        100,
        Math.round(taskFactor - overduePenalty + deliveryBonus)
      )
    );
  }

  return {
    completedTasks,
    openTasks,
    overdueTasks,
    taskCompletionRate,
    workloadCount,
    evidenceParts,
    operatingIndex,
  };
}

export function buildHROSData(snapshot = {}) {
  const peopleSource = mergePeople(snapshot);

  const tasks = safeArray(
    snapshot.tasks ||
      snapshot.studentTasks ||
      snapshot.counselorTasks
  );

  const support = safeArray(
    snapshot.supportRequests ||
      snapshot.support ||
      snapshot.studentSupportRequests
  );

  const applications = safeArray(
    snapshot.applications ||
      snapshot.studentApplications
  );

  const leaves = safeArray(
    snapshot.leaves ||
      snapshot.leaveRequests ||
      snapshot.timeOff
  );

  const candidates = safeArray(
    snapshot.candidates ||
      snapshot.recruitment ||
      snapshot.applicants
  );

  const training = safeArray(
    snapshot.training ||
      snapshot.trainingRecords ||
      snapshot.courses
  );

  const people = peopleSource.map((person, index) => {
    const name = getName(person);
    const personTasks = tasks.filter((task) => recordBelongsToPerson(task, person));
    const personSupport = support.filter((item) => recordBelongsToPerson(item, person));
    const personApplications = applications.filter((item) =>
      recordBelongsToPerson(item, person)
    );

    const evidence = getEvidenceScore(
      person,
      personTasks,
      personSupport,
      personApplications
    );

    return {
      id: person.__identity || person.id || `employee-${index}`,
      userId: person.user_id || person.auth_id || person.id || null,
      name,
      email: getEmail(person),
      phone: person.phone || person.mobile || "",
      role: getRole(person),
      roles: person.__roles || [getRole(person)],
      department: getDepartment(person),
      status: getStatus(person),
      active: isActive(person),
      joinDate: getJoinDate(person),
      tasks: personTasks.length,
      openTasks: evidence.openTasks,
      completedTasks: evidence.completedTasks,
      overdueTasks: evidence.overdueTasks,
      taskCompletionRate: evidence.taskCompletionRate,
      support: personSupport.length,
      applications: personApplications.length,
      workloadCount: evidence.workloadCount,
      performanceScore: evidence.operatingIndex,
      performanceAvailable: evidence.operatingIndex !== null,
      performanceBasis:
        evidence.operatingIndex !== null
          ? `${evidence.evidenceParts}/3 operational evidence domains`
          : "No workload evidence",
      manager:
        person.manager ||
        person.reports_to ||
        person.manager_name ||
        "Founder / Admin",
      sourceCount: person.__sources?.length || 1,
      sourceLabels: person.__sources || [],
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
      measurablePerformanceTotal: 0,
      measurablePerformanceCount: 0,
    };

    current.headcount += 1;
    if (person.active) current.active += 1;
    current.tasks += person.tasks;
    current.applications += person.applications;

    if (person.performanceAvailable) {
      current.measurablePerformanceTotal += person.performanceScore;
      current.measurablePerformanceCount += 1;
    }

    departmentMap.set(person.department, current);
  });

  const departments = Array.from(departmentMap.values()).map((department) => ({
    ...department,
    avgPerformance: department.measurablePerformanceCount
      ? Math.round(
          department.measurablePerformanceTotal /
            department.measurablePerformanceCount
        )
      : null,
    performanceAvailable: department.measurablePerformanceCount > 0,
  }));

  const leaveRows = leaves.map((leave, index) => ({
    id: leave.id || `leave-${index}`,
    employee:
      leave.employee_name ||
      leave.staff_name ||
      leave.name ||
      leave.email ||
      "Employee",
    employeeId:
      leave.employee_id ||
      leave.user_id ||
      leave.staff_id ||
      null,
    type: leave.type || leave.leave_type || "Leave",
    status: leave.status || "Pending",
    start: leave.start_date || leave.from_date || leave.date || null,
    end: leave.end_date || leave.to_date || leave.date || null,
    reason: leave.reason || leave.notes || "No reason provided",
  }));

  const candidateRows = candidates.map((candidate, index) => ({
    id: candidate.id || `candidate-${index}`,
    name:
      candidate.name ||
      candidate.full_name ||
      candidate.email ||
      "Candidate",
    role:
      candidate.role ||
      candidate.position ||
      candidate.applied_for ||
      "Open Role",
    stage: candidate.stage || candidate.status || "Screening",
    score:
      candidate.score === null ||
      candidate.score === undefined ||
      !Number.isFinite(Number(candidate.score ?? candidate.match_score ?? candidate.rating))
        ? null
        : number(candidate.score ?? candidate.match_score ?? candidate.rating),
    scoreAvailable:
      Number.isFinite(Number(candidate.score ?? candidate.match_score ?? candidate.rating)),
    source: candidate.source || candidate.channel || "Direct",
  }));

  const trainingRows = training.map((item, index) => {
    const progressValue =
      item.progress ??
      item.completion_percent ??
      item.percent;

    const progressAvailable = Number.isFinite(Number(progressValue));

    return {
      id: item.id || `training-${index}`,
      title: item.title || item.course_name || item.name || "Training",
      employee:
        item.employee_name ||
        item.staff_name ||
        item.assigned_to ||
        "Team",
      employeeId:
        item.employee_id ||
        item.user_id ||
        item.staff_id ||
        null,
      status: item.status || "Assigned",
      progress: progressAvailable ? number(progressValue) : null,
      progressAvailable,
      category: item.category || item.type || "General",
    };
  });

  const openLeaves = leaveRows.filter((leave) => {
    const status = lower(leave.status);
    return status.includes("pending") || status.includes("requested");
  }).length;

  const openCandidates = candidateRows.filter((candidate) => {
    const stage = lower(candidate.stage);
    return !stage.includes("hired") && !stage.includes("rejected");
  }).length;

  const trainingDue = trainingRows.filter(
    (item) => item.progressAvailable && item.progress < 100
  ).length;

  const measurablePeople = people.filter((person) => person.performanceAvailable);

  const avgPerformance = measurablePeople.length
    ? Math.round(
        measurablePeople.reduce(
          (sum, person) => sum + number(person.performanceScore),
          0
        ) / measurablePeople.length
      )
    : null;

  const dataSources = {
    people: peopleSource.length > 0,
    tasks: tasks.length > 0,
    support: support.length > 0,
    applications: applications.length > 0,
    leaves: leaveRows.length > 0,
    candidates: candidateRows.length > 0,
    training: trainingRows.length > 0,
  };

  const sourceCount = Object.values(dataSources).filter(Boolean).length;

  return {
    people,
    departments,
    leaves: leaveRows,
    candidates: candidateRows,
    training: trainingRows,
    dataSources,
    sourceCount,
    totals: {
      employees: people.length,
      active: people.filter((person) => person.active).length,
      departments: departments.length,
      avgPerformance,
      measurableEmployees: measurablePeople.length,
      openTasks: people.reduce((sum, person) => sum + person.openTasks, 0),
      overdueTasks: people.reduce((sum, person) => sum + person.overdueTasks, 0),
      openLeaves,
      openCandidates,
      trainingDue,
    },
    metadata: {
      identityModel: "UUID-first, deduplicated multi-role people",
      performanceModel:
        "Operational evidence index only; not a formal HR appraisal score",
      generatedAt: new Date().toISOString(),
    },
  };
}

const VIEW_CONFIG = [
  { key: "overview", label: "Overview", icon: Sparkles },
  { key: "employees", label: "Employees", icon: UsersRound },
  { key: "leave", label: "Leave", icon: CalendarDays },
  { key: "performance", label: "Performance", icon: UserCheck2 },
  { key: "recruitment", label: "Recruitment", icon: BriefcaseBusiness },
  { key: "training", label: "Training", icon: GraduationCap },
  { key: "org", label: "Org Chart", icon: Network },
];

function toneClass(tone = "blue") {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    orange: "border-[#F97316] bg-[#FFF4E8]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    violet: "border-[#60A5FA] bg-[#F2F7FF]",
  };

  return tones[tone] || tones.blue;
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${toneClass(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black leading-tight ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      {helper ? (
        <p
          className={`mt-2 text-xs font-semibold leading-5 ${
            dark ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {helper}
        </p>
      ) : null}

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function EvidenceStrip({ hr }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
        <div className="flex items-start gap-3">
          <BadgeCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
              Identity Model
            </p>
            <p className="mt-1 font-black text-[#10233F]">
              One human = one HR identity
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Admin + Counselor roles are deduplicated by UUID before headcount
              and workload are calculated.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
        <div className="flex items-start gap-3">
          <Database size={17} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
              Connected Evidence
            </p>
            <p className="mt-1 font-black text-[#10233F]">
              {hr.sourceCount}/7 data domains
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              People, tasks, support, applications, leave, recruitment and
              training are tracked independently.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
              Performance Integrity
            </p>
            <p className="mt-1 font-black text-[#10233F]">
              Operational index only
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Zaifan does not present synthetic workload math as a formal
              employee appraisal score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HROSDashboard({
  snapshot,
  adminProfile,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState("overview");

  const hr = useMemo(
    () => buildHROSData(snapshot || {}),
    [snapshot]
  );

  const currentView =
    VIEW_CONFIG.find((view) => view.key === activeView) ||
    VIEW_CONFIG[0];

  const CurrentIcon = currentView.icon;

  return (
    <div className="space-y-5 text-[#10233F]">
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#123865] bg-[#FFFDF8] shadow-[0_18px_50px_rgba(15,35,63,0.10)]">
        <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Building2 size={12} />
                HR OS
              </span>

              <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                {hr.totals.employees} unique people
              </span>

              <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                {hr.sourceCount}/7 evidence domains
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Team Operating System
            </h1>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
              Identity-safe people operations for employees, leave,
              operational performance evidence, recruitment, training and
              organization structure. Missing HR evidence stays missing instead
              of being turned into fake scores.
            </p>

            {adminProfile?.email ? (
              <p className="mt-4 text-xs font-bold text-orange-200">
                HR workspace for {adminProfile.email}
              </p>
            ) : null}
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <div className="flex items-center gap-2">
              <CurrentIcon size={17} />
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Current Workspace
              </p>
            </div>

            <p className="mt-3 text-2xl font-black text-white">
              {currentView.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {hr.metadata.identityModel}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                {hr.totals.active} active
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                {hr.totals.departments} departments
              </span>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="HR OS modules"
        className="sticky top-3 z-20 rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_34px_rgba(15,35,63,0.08)]"
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIEW_CONFIG.map((view) => {
            const Icon = view.icon;
            const active = activeView === view.key;

            return (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition ${
                  active
                    ? "border-[#F97316] bg-[#FF5A0A] text-white shadow-[0_6px_16px_rgba(249,115,22,0.18)]"
                    : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4E8]"
                }`}
              >
                <Icon size={14} />
                {view.label}
              </button>
            );
          })}

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:border-[#F97316]"
            >
              <RefreshCw size={14} />
              Refresh HR
            </button>
          ) : null}
        </div>
      </nav>

      {activeView === "overview" ? (
        <>
          <EvidenceStrip hr={hr} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Employees"
              value={hr.totals.employees}
              helper={`${hr.totals.active} active unique people`}
              tone="navy"
              icon={UsersRound}
              badge="Deduplicated"
            />

            <MetricCard
              label="Departments"
              value={hr.totals.departments}
              helper="Operating units inferred from real people records."
              tone="violet"
              icon={Building2}
            />

            <MetricCard
              label="Operating Index"
              value={
                hr.totals.avgPerformance === null
                  ? "—"
                  : `${hr.totals.avgPerformance}%`
              }
              helper={
                hr.totals.avgPerformance === null
                  ? "Awaiting linked workload evidence."
                  : `${hr.totals.measurableEmployees} measurable team member${
                      hr.totals.measurableEmployees === 1 ? "" : "s"
                    }`
              }
              tone={
                hr.totals.avgPerformance === null
                  ? "blue"
                  : hr.totals.avgPerformance >= 75
                    ? "green"
                    : "amber"
              }
              icon={UserCheck2}
              badge={
                hr.totals.avgPerformance === null
                  ? "Not measured"
                  : "Not appraisal"
              }
            />

            <MetricCard
              label="Open Tasks"
              value={hr.totals.openTasks}
              helper={`${hr.totals.overdueTasks} overdue`}
              tone={hr.totals.overdueTasks > 0 ? "amber" : "green"}
              icon={BriefcaseBusiness}
            />

            <MetricCard
              label="Leave"
              value={hr.totals.openLeaves}
              helper="Pending/requested records"
              tone={hr.totals.openLeaves > 0 ? "amber" : "green"}
              icon={CalendarDays}
            />

            <MetricCard
              label="Candidates"
              value={hr.totals.openCandidates}
              helper="Open recruitment pipeline"
              tone="blue"
              icon={BriefcaseBusiness}
            />

            <MetricCard
              label="Training"
              value={hr.totals.trainingDue}
              helper="Incomplete modules with measurable progress"
              tone={hr.totals.trainingDue > 0 ? "violet" : "green"}
              icon={GraduationCap}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <EmployeeWorkspace hr={hr} compact />
            <PerformanceManagementPanel hr={hr} compact />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <LeaveManagementPanel hr={hr} compact />
            <OrganizationChart hr={hr} compact />
          </div>
        </>
      ) : null}

      {activeView === "employees" ? (
        <EmployeeWorkspace hr={hr} />
      ) : null}

      {activeView === "leave" ? (
        <LeaveManagementPanel hr={hr} />
      ) : null}

      {activeView === "performance" ? (
        <PerformanceManagementPanel hr={hr} />
      ) : null}

      {activeView === "recruitment" ? (
        <RecruitmentPanel hr={hr} />
      ) : null}

      {activeView === "training" ? (
        <TrainingCenter hr={hr} />
      ) : null}

      {activeView === "org" ? (
        <OrganizationChart hr={hr} />
      ) : null}
    </div>
  );
}
