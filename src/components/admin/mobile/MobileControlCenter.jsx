import React, { useMemo, useState } from "react";
import StudentAppControlPanel from "./StudentAppControlPanel";
import CounselorAppControlPanel from "./CounselorAppControlPanel";
import PushNotificationPanel from "./PushNotificationPanel";
import MobileAnalyticsPanel from "./MobileAnalyticsPanel";
import DeviceHealthPanel from "./DeviceHealthPanel";

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

function isRecent(value, days = 7) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

export function buildMobileControlData(snapshot = {}) {
  const students = safeArray(snapshot.students || snapshot.inquiries || snapshot.leads);
  const counselors = safeArray(snapshot.counselors || snapshot.counselorProfiles || snapshot.staff);
  const sessions = safeArray(snapshot.sessions || snapshot.mobileSessions || snapshot.studentSessions);
  const devices = safeArray(snapshot.devices || snapshot.mobileDevices || snapshot.pushDevices);
  const notifications = safeArray(snapshot.notifications || snapshot.pushNotifications || snapshot.mobileNotifications);
  const support = safeArray(snapshot.supportRequests || snapshot.support || snapshot.studentSupportRequests);
  const tasks = safeArray(snapshot.tasks || snapshot.studentTasks || snapshot.counselorTasks);
  const documents = safeArray(snapshot.documents || snapshot.studentDocuments);

  const studentActive = sessions.filter((item) => lower(item.role || item.user_type).includes("student") || item.student_id).length;
  const counselorActive = sessions.filter((item) => lower(item.role || item.user_type).includes("counselor") || item.counselor_id).length;

  const recentSessions = sessions.filter((item) => isRecent(item.created_at || item.createdAt || item.last_seen_at || item.lastSeenAt, 7)).length;
  const activeDevices = devices.filter((item) => lower(item.status || "active").includes("active") || isRecent(item.last_seen_at || item.updated_at, 30)).length;
  const failedNotifications = notifications.filter((item) => lower(item.status).includes("fail") || lower(item.status).includes("error")).length;
  const sentNotifications = notifications.filter((item) => lower(item.status).includes("sent") || lower(item.status).includes("delivered")).length;

  const deviceTypes = new Map();
  devices.forEach((device) => {
    const type = device.platform || device.os || device.device_type || "Unknown";
    deviceTypes.set(type, (deviceTypes.get(type) || 0) + 1);
  });

  const notificationCategories = new Map();
  notifications.forEach((notification) => {
    const category = notification.category || notification.type || notification.topic || "General";
    notificationCategories.set(category, (notificationCategories.get(category) || 0) + 1);
  });

  const readiness = {
    studentApp: Math.min(100, 60 + (students.length > 0 ? 15 : 0) + (support.length > 0 ? 10 : 0) + (documents.length > 0 ? 10 : 0)),
    counselorApp: Math.min(100, 60 + (counselors.length > 0 ? 15 : 0) + (tasks.length > 0 ? 15 : 0) + (support.length > 0 ? 10 : 0)),
    push: notifications.length ? Math.max(0, 100 - Math.round((failedNotifications / Math.max(notifications.length, 1)) * 100)) : 70,
    devices: devices.length ? Math.round((activeDevices / devices.length) * 100) : 70,
  };

  return {
    students,
    counselors,
    sessions,
    devices,
    notifications,
    support,
    tasks,
    documents,
    totals: {
      students: students.length,
      counselors: counselors.length,
      sessions: sessions.length,
      recentSessions,
      studentActive,
      counselorActive,
      devices: devices.length,
      activeDevices,
      notifications: notifications.length,
      sentNotifications,
      failedNotifications,
    },
    deviceTypes: Array.from(deviceTypes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    notificationCategories: Array.from(notificationCategories.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    readiness,
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

export default function MobileControlCenter({ snapshot, adminProfile, onRefresh }) {
  const [activeView, setActiveView] = useState("overview");
  const mobile = useMemo(() => buildMobileControlData(snapshot || {}), [snapshot]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "student-app", label: "Student App" },
    { key: "counselor-app", label: "Counselor App" },
    { key: "push", label: "Push" },
    { key: "analytics", label: "Analytics" },
    { key: "devices", label: "Devices" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-white shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Mobile App Control Center</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Student & Counselor App Command</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Control layer for future mobile apps: student app, counselor app, push notifications, device health, sessions, and adoption analytics.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-slate-500">Mobile admin view for {adminProfile.email}</p> : null}
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
            <button type="button" onClick={onRefresh} className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20">
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Students" value={mobile.totals.students} helper="mobile-ready users" tone="cyan" />
            <MetricCard label="Counselors" value={mobile.totals.counselors} helper="team users" tone="violet" />
            <MetricCard label="Sessions" value={mobile.totals.sessions} helper={`${mobile.totals.recentSessions} recent`} tone="emerald" />
            <MetricCard label="Devices" value={mobile.totals.devices} helper={`${mobile.totals.activeDevices} active`} tone="amber" />
            <MetricCard label="Push Sent" value={mobile.totals.sentNotifications} helper={`${mobile.totals.failedNotifications} failed`} tone="emerald" />
            <MetricCard label="Push Health" value={`${mobile.readiness.push}%`} helper="delivery readiness" tone={mobile.readiness.push >= 80 ? "emerald" : "amber"} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <StudentAppControlPanel mobile={mobile} compact />
            <CounselorAppControlPanel mobile={mobile} compact />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <PushNotificationPanel mobile={mobile} compact />
            <DeviceHealthPanel mobile={mobile} compact />
          </div>
        </>
      ) : null}

      {activeView === "student-app" ? <StudentAppControlPanel mobile={mobile} /> : null}
      {activeView === "counselor-app" ? <CounselorAppControlPanel mobile={mobile} /> : null}
      {activeView === "push" ? <PushNotificationPanel mobile={mobile} /> : null}
      {activeView === "analytics" ? <MobileAnalyticsPanel mobile={mobile} /> : null}
      {activeView === "devices" ? <DeviceHealthPanel mobile={mobile} /> : null}
    </div>
  );
}
