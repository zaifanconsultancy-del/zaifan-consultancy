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
  Search,
  X,
  Mail,
  UserRoundCheck,
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


function hrStatusTone(status = "") {
  const value = lower(status);

  if (value.includes("active")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("inactive") ||
    value.includes("terminated") ||
    value.includes("disabled") ||
    value.includes("left")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (value.includes("leave") || value.includes("pending")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function HRPersonRow({ person }) {
  const scoreAvailable =
    person.performanceAvailable &&
    Number.isFinite(Number(person.performanceScore));

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.5fr)_11rem_9rem_9rem_11rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-[#F2F7FF] text-[#123865]">
              <UsersRound size={17} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words font-black text-[#10233F]">
                  {person.name}
                </p>

                <span
                  className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${hrStatusTone(
                    person.status
                  )}`}
                >
                  {person.status || "Unknown"}
                </span>
              </div>

              <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                {person.role || "Team Member"} · {person.department || "Operations"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black text-slate-600">
              <Mail size={11} />
              {person.email || "Email unavailable"}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black ${
                person.userId
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                  : "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
              }`}
            >
              <UserRoundCheck size={11} />
              {person.userId ? "Identity linked" : "Legacy identity"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Workload
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {person.workloadCount || 0} linked
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Open Tasks
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {person.openTasks || 0}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Overdue
          </p>
          <p
            className={`mt-1 text-xs font-black ${
              Number(person.overdueTasks || 0) > 0
                ? "text-red-700"
                : "text-[#10233F]"
            }`}
          >
            {person.overdueTasks || 0}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Operating Index
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {scoreAvailable ? `${person.performanceScore}%` : "Not measured"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function HROSDashboard({
  snapshot,
  adminProfile,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState("overview");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const hr = useMemo(
    () => buildHROSData(snapshot || {}),
    [snapshot]
  );

  const currentView =
    VIEW_CONFIG.find((view) => view.key === activeView) ||
    VIEW_CONFIG[0];

  const CurrentIcon = currentView.icon;

  const departments = useMemo(
    () => [
      "All",
      ...new Set(
        hr.people
          .map((person) => String(person.department || "").trim())
          .filter(Boolean)
      ),
    ],
    [hr.people]
  );

  const filteredPeople = useMemo(() => {
    const needle = lower(peopleSearch);

    return hr.people.filter((person) => {
      if (
        departmentFilter !== "All" &&
        String(person.department || "") !== departmentFilter
      ) {
        return false;
      }

      if (!needle) return true;

      return [
        person.name,
        person.email,
        person.role,
        person.department,
        person.status,
      ]
        .map(lower)
        .join(" ")
        .includes(needle);
    });
  }, [hr.people, peopleSearch, departmentFilter]);

  const peopleFiltersActive =
    Boolean(peopleSearch.trim()) || departmentFilter !== "All";

  function clearPeopleFilters() {
    setPeopleSearch("");
    setDepartmentFilter("All");
  }

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Building2 size={12} />
                HR OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                People operations
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Team Operating Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Employees, leave, operational performance evidence, recruitment,
              training and organization structure. Zaifan keeps identities
              deduplicated and refuses to present synthetic workload math as a
              formal appraisal score.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">
              {currentView.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin people view for ${adminProfile.email}`
                : "Admin people operations workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {hr.totals.employees} people
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {hr.totals.active} active
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {VIEW_CONFIG.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              aria-pressed={activeView === key}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                activeView === key
                  ? "border-[#F97316] bg-[#FF5A0A] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#F97316]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
          >
            <RefreshCw size={13} />
            Refresh HR
          </button>
        ) : null}
      </nav>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Employee Records"
              value={hr.totals.employees}
              helper={`${hr.totals.active} active unique people across the current HR identity snapshot.`}
              tone="navy"
              icon={UsersRound}
              badge="Deduplicated"
            />

            <MetricCard
              label="Departments"
              value={hr.totals.departments}
              helper="Operating units inferred only from real people records."
              tone="green"
              icon={Building2}
            />

            <MetricCard
              label="Open Tasks"
              value={hr.totals.openTasks}
              helper={`${hr.totals.overdueTasks} overdue tasks across linked employee workload.`}
              tone={hr.totals.overdueTasks > 0 ? "amber" : "blue"}
              icon={BriefcaseBusiness}
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
                  ? "Not measured until linked workload evidence exists."
                  : `Average across ${hr.totals.measurableEmployees} measurable team member${
                      hr.totals.measurableEmployees === 1 ? "" : "s"
                    }.`
              }
              tone="blue"
              icon={UserCheck2}
              badge={
                hr.totals.avgPerformance === null
                  ? "Not measured"
                  : "Operational only"
              }
            />
          </div>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#B84F0E]">
                  People Command
                </p>
                <h2 className="mt-1 text-xl font-black text-[#10233F]">
                  Team portfolio
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Search and review the real deduplicated people records
                  currently supplied to HR OS.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_11rem_auto]">
                <label className="relative block">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={peopleSearch}
                    onChange={(event) => setPeopleSearch(event.target.value)}
                    placeholder="Search team member..."
                    className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
                  />
                </label>

                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
                >
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={clearPeopleFilters}
                  disabled={!peopleFiltersActive}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-40"
                >
                  <X size={13} />
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredPeople.length ? (
                filteredPeople.map((person) => (
                  <HRPersonRow key={person.id} person={person} />
                ))
              ) : (
                <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
                  <UsersRound size={24} className="mx-auto text-[#B84F0E]" />
                  <p className="mt-3 font-black text-[#10233F]">
                    {hr.people.length
                      ? "No team members match these filters."
                      : "No real employee records yet."}
                  </p>
                  <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                    {hr.people.length
                      ? "Clear or change the people filters."
                      : "Connect genuine Admin, Counselor or staff records before HR OS reports headcount, workload or performance evidence."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Identity Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    One human = one HR identity
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Admin and Counselor roles are deduplicated by UUID before
                    headcount and workload are calculated.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Database size={17} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Evidence Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {hr.sourceCount}/7 real data domains
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    People, tasks, support, applications, leave, recruitment
                    and training remain independently measurable.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Performance Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Workload signal ≠ formal appraisal
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    The operating index is evidence from linked work, not a
                    salary, promotion or disciplinary score.
                  </p>
                </div>
              </div>
            </div>
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
