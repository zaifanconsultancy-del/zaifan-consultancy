import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  FileText,
  GraduationCap,
  HelpCircle,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
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

function featureTone(state = "unknown") {
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

function FeatureRow({
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
      className={`rounded-[1.3rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 ${featureTone(
        state
      )}`}
    >
      <div
        className={
          compact
            ? "flex min-w-0 items-start gap-3"
            : "flex min-w-0 items-start justify-between gap-4"
        }
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
            {Icon ? <Icon size={16} /> : null}
          </div>

          <div className="min-w-0">
            <p className="font-black text-[#10233F]">{label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {helper}
            </p>
          </div>
        </div>

        {!compact ? (
          <div className="shrink-0 text-right">
            <p className="text-sm font-black text-[#10233F]">{value}</p>
            <span
              className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
        ) : null}
      </div>

      {compact ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-[#10233F]">{value}</p>
          <span
            className={`inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      ) : null}
    </article>
  );
}

export default function StudentAppControlPanel({
  mobile = {},
  compact = false,
}) {
  const totals = mobile.totals || {};
  const readiness = mobile.readiness || {};
  const evidence = mobile.evidence || {};

  const support = safeArray(mobile.support);
  const documents = safeArray(mobile.documents);
  const notifications = safeArray(mobile.notifications);

  const studentSessionCount = safeNumber(totals.studentActive);
  const totalStudents = safeNumber(totals.students);

  const features = useMemo(
    () => [
      {
        label: "Login & Sessions",
        value: displayPercent(readiness.studentApp),
        helper:
          readiness.studentApp === null || readiness.studentApp === undefined
            ? "Student mobile adoption cannot be measured until real student-session evidence is connected."
            : `${studentSessionCount} recent student session${
                studentSessionCount === 1 ? "" : "s"
              } across ${totalStudents} student record${
                totalStudents === 1 ? "" : "s"
              }.`,
        state:
          readiness.studentApp === null ||
          readiness.studentApp === undefined
            ? "unknown"
            : "connected",
        icon: Smartphone,
      },
      {
        label: "Dashboard",
        value: evidence.students ? "Available data" : "No evidence",
        helper:
          "Journey data may support a mobile dashboard, but this panel does not invent a readiness percentage for the dashboard itself.",
        state: evidence.students ? "connected" : "unknown",
        icon: GraduationCap,
      },
      {
        label: "Support Center",
        value: support.length ? `${support.length} item${support.length === 1 ? "" : "s"}` : "No evidence",
        helper:
          support.length
            ? "Real support records are available for future mobile handling."
            : "No support records are connected to this mobile snapshot.",
        state: support.length ? "connected" : "unknown",
        icon: HelpCircle,
      },
      {
        label: "Documents",
        value: documents.length
          ? `${documents.length} record${documents.length === 1 ? "" : "s"}`
          : "No evidence",
        helper:
          documents.length
            ? "Document evidence exists for future mobile upload/review workflows."
            : "No student document evidence is connected here yet.",
        state: documents.length ? "connected" : "unknown",
        icon: FileText,
      },
      {
        label: "Payments",
        value: mobile.payments?.length
          ? `${mobile.payments.length} record${mobile.payments.length === 1 ? "" : "s"}`
          : "Not connected",
        helper:
          "Payment readiness is not inferred from unrelated mobile data. A real payment source must be wired explicitly.",
        state: mobile.payments?.length ? "connected" : "unknown",
        icon: ReceiptText,
      },
      {
        label: "Push Notices",
        value: displayPercent(readiness.push),
        helper:
          readiness.push === null || readiness.push === undefined
            ? "Push reliability is not measured until known delivery outcomes exist."
            : `${safeNumber(totals.sentNotifications)} sent/delivered · ${safeNumber(
                totals.failedNotifications
              )} failed.`,
        state:
          readiness.push === null || readiness.push === undefined
            ? notifications.length
              ? "partial"
              : "unknown"
            : "connected",
        icon: BellRing,
      },
    ],
    [
      readiness.studentApp,
      readiness.push,
      evidence.students,
      support.length,
      documents.length,
      notifications.length,
      mobile.payments,
      studentSessionCount,
      totalStudents,
      totals.sentNotifications,
      totals.failedNotifications,
    ]
  );

  const visible = compact ? features.slice(0, 4) : features;

  const connectedCount = features.filter(
    (feature) => feature.state === "connected"
  ).length;

  const partialCount = features.filter(
    (feature) => feature.state === "partial"
  ).length;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <GraduationCap size={12} />
            Student App
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Student Mobile Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Student mobile capability is now judged from connected records only.
            Zaifan no longer labels dashboard, support, documents, payments or
            push as 72%, 78%, 90% or 92% ready without measurable evidence.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Evidence Coverage
          </p>

          <p className="mt-2 text-3xl font-black">
            {connectedCount}/{features.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {connectedCount} connected · {partialCount} partial ·{" "}
            {features.length - connectedCount - partialCount} unmeasured.
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
              : "grid gap-3 lg:grid-cols-2"
          }
        >
          {visible.map((feature) => (
            <FeatureRow
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
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Session Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Adoption needs session evidence
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Student adoption is measured only when both student records
                    and real mobile sessions exist.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <UserRoundCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Capability Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Existing portal ≠ mobile readiness
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A working Student Portal does not automatically mean a native
                    mobile app feature is production-ready.
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
                    Payment Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Payment mobile evidence must be explicit
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Payment capability is left unmeasured until a real payment
                    source is intentionally connected to Mobile OS.
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
