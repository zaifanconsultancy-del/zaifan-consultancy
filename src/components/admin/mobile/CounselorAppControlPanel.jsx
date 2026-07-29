import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  ClipboardList,
  HelpCircle,
  Smartphone,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayPercent(value) {
  return value === null || value === undefined
    ? "Not measured"
    : `${Math.round(safeNumber(value))}%`;
}

function cardTone(state = "unknown") {
  if (state === "connected") {
    return "border-[#34D399] bg-[#F0FFF8]";
  }

  if (state === "partial") {
    return "border-[#F59E0B] bg-[#FFF8E8]";
  }

  return "border-[#C9D7E6] bg-white";
}

function stateBadge(state = "unknown") {
  if (state === "connected") {
    return {
      label: "Evidence connected",
      className:
        "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    };
  }

  if (state === "partial") {
    return {
      label: "Partial evidence",
      className:
        "border-[#F59E0B] bg-[#FFF8E8] text-amber-800",
    };
  }

  return {
    label: "Not measured",
    className:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
  };
}

function ModuleCard({
  label,
  value,
  helper,
  state,
  icon: Icon,
  compact = false,
}) {
  const badge = stateBadge(state);

  return (
    <article
      className={`rounded-[1.3rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] ${cardTone(
        state
      )}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#173F6B]/15 bg-white text-[#173F6B]">
          {Icon ? <Icon size={16} /> : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-black text-[#10233F]">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p
              className={`font-black text-[#10233F] ${
                compact ? "text-base" : "text-lg"
              }`}
            >
              {value}
            </p>

            <span
              className={`inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CounselorAppControlPanel({
  mobile = {},
  compact = false,
}) {
  const totals = mobile.totals || {};
  const readiness = mobile.readiness || {};
  const evidence = mobile.evidence || {};

  const tasks = safeArray(mobile.tasks);
  const support = safeArray(mobile.support);

  const features = useMemo(
    () => [
      {
        label: "Counselor Sessions",
        value: displayPercent(readiness.counselorApp),
        helper:
          readiness.counselorApp === null ||
          readiness.counselorApp === undefined
            ? "Counselor mobile adoption cannot be measured until real counselor-session evidence exists."
            : `${safeNumber(
                totals.counselorActive
              )} recent counselor session${
                safeNumber(totals.counselorActive) === 1 ? "" : "s"
              } across ${safeNumber(totals.counselors)} counselor record${
                safeNumber(totals.counselors) === 1 ? "" : "s"
              }.`,
        state:
          readiness.counselorApp === null ||
          readiness.counselorApp === undefined
            ? "unknown"
            : "connected",
        icon: Smartphone,
      },
      {
        label: "Assigned Students",
        value: safeNumber(totals.students),
        helper:
          evidence.students
            ? "Student records are available as portfolio evidence."
            : "No student portfolio evidence is connected to Mobile OS.",
        state: evidence.students ? "connected" : "unknown",
        icon: UsersRound,
      },
      {
        label: "Open Tasks",
        value: tasks.length,
        helper:
          tasks.length
            ? "Real task records are available for future counselor mobile execution."
            : "No counselor/student task evidence is connected.",
        state: tasks.length ? "connected" : "unknown",
        icon: ClipboardList,
      },
      {
        label: "Support Items",
        value: support.length,
        helper:
          support.length
            ? "Real support records are available for counselor mobile follow-up."
            : "No support-request evidence is connected.",
        state: support.length ? "connected" : "unknown",
        icon: HelpCircle,
      },
      {
        label: "Push Reliability",
        value: displayPercent(readiness.push),
        helper:
          readiness.push === null || readiness.push === undefined
            ? "Push reliability is not measured until delivery outcomes exist."
            : `${safeNumber(
                totals.sentNotifications
              )} sent/delivered · ${safeNumber(
                totals.failedNotifications
              )} failed.`,
        state:
          readiness.push === null || readiness.push === undefined
            ? mobile.notifications?.length
              ? "partial"
              : "unknown"
            : "connected",
        icon: BellRing,
      },
      {
        label: "Counselor Account Evidence",
        value: safeNumber(totals.counselors),
        helper:
          evidence.counselors
            ? "Counselor records exist for future mobile access mapping."
            : "No counselor account evidence is connected.",
        state: evidence.counselors ? "connected" : "unknown",
        icon: UserRoundCheck,
      },
    ],
    [
      readiness.counselorApp,
      readiness.push,
      totals.counselorActive,
      totals.counselors,
      totals.students,
      totals.sentNotifications,
      totals.failedNotifications,
      evidence.students,
      evidence.counselors,
      tasks.length,
      support.length,
      mobile.notifications,
    ]
  );

  const visible = compact ? features.slice(0, 4) : features;

  const connected = features.filter(
    (feature) => feature.state === "connected"
  ).length;

  const partial = features.filter(
    (feature) => feature.state === "partial"
  ).length;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#173F6B] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <UserRoundCheck size={12} />
            Counselor App
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Counselor Mobile Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Counselor mobile capability is now based on real counselor sessions,
            student portfolio records, tasks, support and notification evidence.
            Zaifan no longer invents a counselor-app readiness percentage simply
            because those desktop systems exist.
          </p>
        </div>

        <div className="bg-[#E96512] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Evidence Coverage
          </p>

          <p className="mt-2 text-3xl font-black">
            {connected}/{features.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {connected} connected · {partial} partial ·{" "}
            {features.length - connected - partial} unmeasured.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            No synthetic readiness
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-2"
              : "grid gap-3 lg:grid-cols-2 xl:grid-cols-3"
          }
        >
          {visible.map((feature) => (
            <ModuleCard
              key={feature.label}
              {...feature}
              compact={compact}
            />
          ))}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Session Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Adoption needs counselor sessions
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A counselor account alone does not prove mobile adoption.
                    Real mobile-session evidence is required.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <ClipboardList
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Execution Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Desktop tasks ≠ mobile completion
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Task records show work exists. They do not prove that the
                    counselor can execute that workflow safely from a mobile app.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Assignment Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Student count is portfolio evidence only
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Student records are not presented as proof that assignment,
                    messaging or case-management actions are mobile-ready.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
