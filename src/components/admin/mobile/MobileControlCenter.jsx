import React, { useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  CheckCircle2,
  CircleHelp,
  Cpu,
  GraduationCap,
  HeartPulse,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  UsersRound,
  Wifi,
  XCircle,
} from "lucide-react";

import StudentAppControlPanel from "./StudentAppControlPanel";
import CounselorAppControlPanel from "./CounselorAppControlPanel";
import PushNotificationPanel from "./PushNotificationPanel";
import MobileAnalyticsPanel from "./MobileAnalyticsPanel";
import DeviceHealthPanel from "./DeviceHealthPanel";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value ?? "").trim().toLowerCase();
}

function validDate(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function isRecent(value, days = 7) {
  const time = validDate(value);
  if (time === null) return false;

  const age = Date.now() - time;
  return age >= 0 && age <= days * 24 * 60 * 60 * 1000;
}

function getSessionRole(item = {}) {
  const explicit = lower(
    item.role ||
      item.user_type ||
      item.userType ||
      item.account_type ||
      item.accountType
  );

  if (explicit.includes("student")) return "student";
  if (explicit.includes("counselor") || explicit.includes("counsellor")) {
    return "counselor";
  }

  if (item.student_id || item.studentId) return "student";
  if (item.counselor_id || item.counselorId) return "counselor";

  return "unknown";
}

function getDeviceStatus(item = {}) {
  return lower(
    item.status ||
      item.device_status ||
      item.deviceStatus ||
      item.token_status ||
      item.tokenStatus
  );
}

function isActiveDevice(item = {}) {
  const status = getDeviceStatus(item);

  if (
    status.includes("inactive") ||
    status.includes("disabled") ||
    status.includes("revoked") ||
    status.includes("expired") ||
    status.includes("invalid")
  ) {
    return false;
  }

  if (
    status.includes("active") ||
    status.includes("enabled") ||
    status.includes("registered")
  ) {
    return true;
  }

  return isRecent(
    item.last_seen_at ||
      item.lastSeenAt ||
      item.updated_at ||
      item.updatedAt,
    30
  );
}

function notificationState(item = {}) {
  const status = lower(
    item.status ||
      item.delivery_status ||
      item.deliveryStatus
  );

  if (
    status.includes("fail") ||
    status.includes("error") ||
    status.includes("bounce") ||
    status.includes("invalid")
  ) {
    return "failed";
  }

  if (
    status.includes("delivered") ||
    status.includes("sent") ||
    status.includes("success")
  ) {
    return "sent";
  }

  if (
    status.includes("pending") ||
    status.includes("queued") ||
    status.includes("scheduled")
  ) {
    return "pending";
  }

  return "unknown";
}

function percent(part, total) {
  const numerator = safeNumber(part);
  const denominator = safeNumber(total);

  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function displayPercent(value) {
  return value === null || value === undefined
    ? "Not measured"
    : `${Math.round(safeNumber(value))}%`;
}

function evidenceState(count) {
  return safeNumber(count) > 0 ? "Connected" : "No evidence";
}

export function buildMobileControlData(snapshot = {}) {
  const students = safeArray(
    snapshot.students ||
      snapshot.studentProfiles ||
      snapshot.inquiries ||
      snapshot.leads
  );

  const counselors = safeArray(
    snapshot.counselors ||
      snapshot.counselorProfiles ||
      snapshot.staff
  );

  const sessions = safeArray(
    snapshot.mobileSessions ||
      snapshot.sessions ||
      snapshot.studentSessions
  );

  const devices = safeArray(
    snapshot.mobileDevices ||
      snapshot.devices ||
      snapshot.pushDevices
  );

  const notifications = safeArray(
    snapshot.pushNotifications ||
      snapshot.mobileNotifications ||
      snapshot.notifications
  );

  const support = safeArray(
    snapshot.supportRequests ||
      snapshot.studentSupportRequests ||
      snapshot.support
  );

  const tasks = safeArray(
    snapshot.tasks ||
      snapshot.studentTasks ||
      snapshot.counselorTasks
  );

  const documents = safeArray(
    snapshot.documents ||
      snapshot.studentDocuments
  );

  const payments = safeArray(
    snapshot.payments ||
      snapshot.studentPayments
  );

  const studentSessions = sessions.filter(
    (item) => getSessionRole(item) === "student"
  );

  const counselorSessions = sessions.filter(
    (item) => getSessionRole(item) === "counselor"
  );

  const unknownSessions = sessions.filter(
    (item) => getSessionRole(item) === "unknown"
  );

  const recentSessions = sessions.filter((item) =>
    isRecent(
      item.last_seen_at ||
        item.lastSeenAt ||
        item.updated_at ||
        item.updatedAt ||
        item.created_at ||
        item.createdAt,
      7
    )
  );

  const recentStudentSessions = studentSessions.filter((item) =>
    isRecent(
      item.last_seen_at ||
        item.lastSeenAt ||
        item.updated_at ||
        item.updatedAt ||
        item.created_at ||
        item.createdAt,
      7
    )
  );

  const recentCounselorSessions = counselorSessions.filter((item) =>
    isRecent(
      item.last_seen_at ||
        item.lastSeenAt ||
        item.updated_at ||
        item.updatedAt ||
        item.created_at ||
        item.createdAt,
      7
    )
  );

  const activeDevices = devices.filter(isActiveDevice);

  const sentNotifications = notifications.filter(
    (item) => notificationState(item) === "sent"
  );

  const failedNotifications = notifications.filter(
    (item) => notificationState(item) === "failed"
  );

  const pendingNotifications = notifications.filter(
    (item) => notificationState(item) === "pending"
  );

  const unknownNotifications = notifications.filter(
    (item) => notificationState(item) === "unknown"
  );

  const deviceTypes = new Map();
  devices.forEach((device) => {
    const type =
      device.platform ||
      device.os ||
      device.device_type ||
      device.deviceType ||
      "Unknown";

    deviceTypes.set(
      String(type),
      (deviceTypes.get(String(type)) || 0) + 1
    );
  });

  const notificationCategories = new Map();
  notifications.forEach((notification) => {
    const category =
      notification.category ||
      notification.type ||
      notification.topic ||
      "General";

    notificationCategories.set(
      String(category),
      (notificationCategories.get(String(category)) || 0) + 1
    );
  });

  const studentAdoption =
    sessions.length > 0 && students.length > 0
      ? percent(recentStudentSessions.length, students.length)
      : null;

  const counselorAdoption =
    sessions.length > 0 && counselors.length > 0
      ? percent(recentCounselorSessions.length, counselors.length)
      : null;

  const deviceActivation =
    devices.length > 0
      ? percent(activeDevices.length, devices.length)
      : null;

  const knownDeliveryOutcomes =
    sentNotifications.length + failedNotifications.length;

  const pushSuccess =
    knownDeliveryOutcomes > 0
      ? percent(sentNotifications.length, knownDeliveryOutcomes)
      : null;

  return {
    students,
    counselors,
    sessions,
    studentSessions,
    counselorSessions,
    unknownSessions,
    devices,
    notifications,
    support,
    tasks,
    documents,
    payments,

    totals: {
      students: students.length,
      counselors: counselors.length,
      sessions: sessions.length,
      recentSessions: recentSessions.length,
      studentActive: recentStudentSessions.length,
      counselorActive: recentCounselorSessions.length,
      unknownSessions: unknownSessions.length,
      devices: devices.length,
      activeDevices: activeDevices.length,
      notifications: notifications.length,
      sentNotifications: sentNotifications.length,
      failedNotifications: failedNotifications.length,
      pendingNotifications: pendingNotifications.length,
      unknownNotifications: unknownNotifications.length,
    },

    deviceTypes: Array.from(deviceTypes.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),

    notificationCategories: Array.from(
      notificationCategories.entries()
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),

    readiness: {
      // Kept under the existing property name so child components can migrate
      // without breaking. Values are now evidence-derived, never invented.
      studentApp: studentAdoption,
      counselorApp: counselorAdoption,
      push: pushSuccess,
      devices: deviceActivation,
    },

    evidence: {
      students: students.length > 0,
      counselors: counselors.length > 0,
      sessions: sessions.length > 0,
      devices: devices.length > 0,
      notifications: notifications.length > 0,
      support: support.length > 0,
      tasks: tasks.length > 0,
      documents: documents.length > 0,
      pushDelivery: knownDeliveryOutcomes > 0,
    },
  };
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#173F6B] bg-[#173F6B]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
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
            className={`mt-2 break-words text-2xl font-black ${
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
                : "border-[#173F6B]/15 bg-white text-[#173F6B]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex max-w-full rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}

function EvidenceCard({
  label,
  connected,
  detail,
  icon: Icon,
}) {
  return (
    <div
      className={`rounded-[1.3rem] border-[3px] p-4 ${
        connected
          ? "border-[#34D399] bg-[#F0FFF8]"
          : "border-[#C9D7E6] bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            connected
              ? "border-emerald-300 bg-white text-emerald-700"
              : "border-[#C9D7E6] bg-[#F7FAFC] text-slate-500"
          }`}
        >
          {Icon ? <Icon size={16} /> : null}
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 font-black text-[#10233F]">
            {connected ? "Evidence connected" : "No evidence yet"}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MobileControlCenter({
  snapshot,
  adminProfile,
  onRefresh,
  onPreparePush,
}) {
  const [activeView, setActiveView] = useState("overview");

  const mobile = useMemo(
    () => buildMobileControlData(snapshot || {}),
    [snapshot]
  );

  const views = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "student-app", label: "Student App", icon: GraduationCap },
    { key: "counselor-app", label: "Counselor App", icon: UserRoundCheck },
    { key: "push", label: "Push", icon: BellRing },
    { key: "analytics", label: "Analytics", icon: HeartPulse },
    { key: "devices", label: "Devices", icon: Smartphone },
  ];

  const currentView =
    views.find((view) => view.key === activeView) || views[0];

  return (
    <div className="min-w-0 space-y-5 rounded-[2rem] border-[3px] border-[#173F6B] bg-[#FFF8EE] p-4 shadow-[0_18px_50px_rgba(23,63,107,0.12)] sm:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Smartphone size={12} />
                Mobile OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                No synthetic readiness
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Student & Counselor Mobile Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Operational control for mobile sessions, devices, push delivery,
              student access and counselor access. Readiness and adoption are
              shown only when the underlying mobile evidence actually exists.
            </p>
          </div>

          <div className="bg-[#E96512] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">
              {currentView.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin mobile view for ${adminProfile.email}`
                : "Admin mobile operations workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {mobile.totals.sessions} sessions
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {mobile.totals.devices} devices
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {views.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              aria-pressed={activeView === key}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                activeView === key
                  ? "border-[#F97316] bg-[#F05A0D] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EE] text-[#10233F] hover:border-[#F97316]"
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
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#173F6B] bg-[#173F6B] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
          >
            <RefreshCw size={13} />
            Refresh Mobile
          </button>
        ) : null}
      </nav>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Student Sessions"
              value={
                mobile.evidence.sessions
                  ? mobile.totals.studentActive
                  : "—"
              }
              helper={
                mobile.evidence.sessions
                  ? `${mobile.totals.studentActive} recent student sessions from ${mobile.totals.sessions} recorded sessions.`
                  : "No mobile session evidence connected."
              }
              tone="navy"
              icon={GraduationCap}
              badge={evidenceState(mobile.totals.sessions)}
            />

            <MetricCard
              label="Counselor Sessions"
              value={
                mobile.evidence.sessions
                  ? mobile.totals.counselorActive
                  : "—"
              }
              helper={
                mobile.evidence.sessions
                  ? `${mobile.totals.counselorActive} recent counselor sessions.`
                  : "No counselor mobile session evidence connected."
              }
              tone="violet"
              icon={UsersRound}
              badge={evidenceState(mobile.totals.sessions)}
            />

            <MetricCard
              label="Device Activation"
              value={displayPercent(mobile.readiness.devices)}
              helper={
                mobile.evidence.devices
                  ? `${mobile.totals.activeDevices}/${mobile.totals.devices} registered devices currently active/recent.`
                  : "Device activation cannot be measured without device records."
              }
              tone={
                mobile.readiness.devices === null
                  ? "blue"
                  : mobile.readiness.devices >= 80
                    ? "green"
                    : "amber"
              }
              icon={Cpu}
              badge={
                mobile.evidence.devices
                  ? "Measured"
                  : "Not measured"
              }
            />

            <MetricCard
              label="Push Success"
              value={displayPercent(mobile.readiness.push)}
              helper={
                mobile.evidence.pushDelivery
                  ? `${mobile.totals.sentNotifications} sent/delivered · ${mobile.totals.failedNotifications} failed.`
                  : "Push success needs known sent/delivered or failed outcomes."
              }
              tone={
                mobile.readiness.push === null
                  ? "blue"
                  : mobile.readiness.push >= 90
                    ? "green"
                    : mobile.readiness.push >= 70
                      ? "amber"
                      : "red"
              }
              icon={BellRing}
              badge={
                mobile.evidence.pushDelivery
                  ? "Measured"
                  : "Not measured"
              }
            />
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <StudentAppControlPanel mobile={mobile} compact />
            <CounselorAppControlPanel mobile={mobile} compact />
          </div>

          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <PushNotificationPanel mobile={mobile} compact onPreparePush={onPreparePush} />
            <DeviceHealthPanel mobile={mobile} compact />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <EvidenceCard
              label="Session Evidence"
              connected={mobile.evidence.sessions}
              detail={
                mobile.evidence.sessions
                  ? `${mobile.totals.sessions} mobile session records are available for adoption analysis.`
                  : "Connect real student/counselor mobile sessions before judging adoption."
              }
              icon={Wifi}
            />

            <EvidenceCard
              label="Device Evidence"
              connected={mobile.evidence.devices}
              detail={
                mobile.evidence.devices
                  ? `${mobile.totals.devices} device/token records are available for activation health.`
                  : "No device/token records are connected yet."
              }
              icon={Smartphone}
            />

            <EvidenceCard
              label="Push Evidence"
              connected={mobile.evidence.pushDelivery}
              detail={
                mobile.evidence.pushDelivery
                  ? `${mobile.totals.sentNotifications + mobile.totals.failedNotifications} known delivery outcomes are measurable.`
                  : "Notification records without known delivery outcomes do not create a synthetic success rate."
              }
              icon={
                mobile.evidence.pushDelivery
                  ? CheckCircle2
                  : CircleHelp
              }
            />
          </div>

          {mobile.totals.failedNotifications > 0 ? (
            <div className="rounded-[1.35rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4">
              <div className="flex items-start gap-3">
                <XCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Delivery Attention
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {mobile.totals.failedNotifications} push failure
                    {mobile.totals.failedNotifications === 1 ? "" : "s"} recorded
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Review failed delivery outcomes before treating push as a
                    reliable operational channel.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Mobile OS Integrity Rule
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Missing mobile evidence stays unmeasured
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  This parent no longer creates 60%, 70%, 78% or other
                  readiness values simply because a module exists. Child
                  panels can now migrate to the same evidence-first model.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {activeView === "student-app" ? (
        <StudentAppControlPanel mobile={mobile} />
      ) : null}

      {activeView === "counselor-app" ? (
        <CounselorAppControlPanel mobile={mobile} />
      ) : null}

      {activeView === "push" ? (
        <PushNotificationPanel mobile={mobile} onPreparePush={onPreparePush} />
      ) : null}

      {activeView === "analytics" ? (
        <MobileAnalyticsPanel mobile={mobile} />
      ) : null}

      {activeView === "devices" ? (
        <DeviceHealthPanel mobile={mobile} />
      ) : null}
    </div>
  );
}
