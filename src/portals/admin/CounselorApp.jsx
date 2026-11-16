// Entry point for /counselor/*. Same pages as the admin, but the counselor
// only sees the people assigned to them and has no Team / Settings pages.
// The login check happens in pages/portals/CounselorPortalGate.jsx.

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminDataProvider } from "./data/AdminDataProvider";
import AdminShell from "./AdminShell";
import { setPortalBase } from "./lib/paths";
import { ConfirmProvider, Spinner, ToastProvider } from "./ui/kit";

const TodayPage = lazy(() => import("./pages/TodayPage"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const PersonPage = lazy(() => import("./pages/PersonPage"));

/** A readable name: never show a raw email address as someone's name. */
function displayName(profile) {
  const candidates = [profile.full_name, profile.displayName, profile.name].filter((value) => value && !String(value).includes("@"));
  if (candidates.length) return String(candidates[0]);
  const local = String(profile.email || "").split("@")[0].replace(/[._-]+/g, " ").replace(/\d+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Counselor";
}

export default function CounselorApp({ counselorProfile, onLogout }) {
  setPortalBase("/counselor");

  const viewer = {
    // People are assigned by login id, so that is the id we filter on.
    id: counselorProfile.auth_id || counselorProfile.user_id || counselorProfile.id,
    name: displayName(counselorProfile),
    role: "counselor",
    kind: "counselor",
    email: counselorProfile.email || "",
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminDataProvider admin={viewer}>
          <Routes>
            <Route element={<AdminShell onLogout={onLogout} />}>
              <Route index element={<Lazy page={TodayPage} />} />
              <Route path="leads" element={<Lazy page={LeadsPage} />} />
              <Route path="students" element={<Lazy page={StudentsPage} />} />
              <Route path="tasks" element={<Lazy page={TasksPage} />} />
              <Route path="calendar" element={<Lazy page={CalendarPage} />} />
              <Route path="people/:personId" element={<Lazy page={PersonPage} />} />
              <Route path="*" element={<Navigate to="/counselor" replace />} />
            </Route>
          </Routes>
        </AdminDataProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

function Lazy({ page: Page }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Page />
    </Suspense>
  );
}
