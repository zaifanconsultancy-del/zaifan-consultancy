// Entry point for /admin/*: checks the login, loads the data, mounts the routes.

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AdminLogin from "../../components/admin/workspaces/core/AdminLogin";
import useAdminAuth from "../../hooks/useAdminAuth";
import { PROFILE_RETRY_LIMIT } from "../../utils/crm/constants";
import { AdminDataProvider } from "./data/AdminDataProvider";
import AdminShell from "./AdminShell";
import { setPortalBase } from "./lib/paths";
import { Button, ConfirmProvider, Spinner, ToastProvider } from "./ui/kit";

const TodayPage = lazy(() => import("./pages/TodayPage"));
const LeadsPage = lazy(() => import("./pages/LeadsPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const MoneyPage = lazy(() => import("./pages/MoneyPage"));
const PersonPage = lazy(() => import("./pages/PersonPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export default function AdminApp() {
  setPortalBase("/admin");
  const auth = useAdminAuth();
  const {
    isLoggedIn,
    sessionChecked,
    adminUser,
    adminProfile,
    email,
    setEmail,
    password,
    setPassword,
    profileLoading,
    profileError,
    profileRetryCount,
    handleLogin,
    logout,
    loadAdminProfile,
  } = auth;

  if (!sessionChecked || (isLoggedIn && profileLoading && !adminProfile)) {
    return (
      <GateScreen title="Opening the control tower" text="Checking your login…">
        {profileRetryCount > 0 ? (
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">
            Profile check {profileRetryCount}/{PROFILE_RETRY_LIMIT}
          </p>
        ) : null}
      </GateScreen>
    );
  }

  if (!isLoggedIn) {
    return <AdminLogin email={email} password={password} setEmail={setEmail} setPassword={setPassword} handleLogin={handleLogin} />;
  }

  if (!adminProfile) {
    return (
      <GateScreen title="This login is not on the admin list" text={profileError || "You are signed in, but this account is not an admin."}>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={() => loadAdminProfile(adminUser?.id, { force: true })}>
            Check again
          </Button>
          <Button onClick={logout}>Log out</Button>
        </div>
      </GateScreen>
    );
  }

  const admin = {
    id: adminProfile.id,
    name: adminProfile.full_name || adminUser?.email || "Admin",
    role: adminProfile.role || "admin",
    kind: "admin",
    email: adminUser?.email || "",
  };

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminDataProvider admin={admin}>
          <Routes>
            <Route element={<AdminShell onLogout={logout} />}>
              <Route index element={<Lazy page={TodayPage} />} />
              <Route path="leads" element={<Lazy page={LeadsPage} />} />
              <Route path="students" element={<Lazy page={StudentsPage} />} />
              <Route path="tasks" element={<Lazy page={TasksPage} />} />
              <Route path="calendar" element={<Lazy page={CalendarPage} />} />
              <Route path="reports" element={<Lazy page={ReportsPage} />} />
              <Route path="money" element={<Lazy page={MoneyPage} />} />
              <Route path="people/:personId" element={<Lazy page={PersonPage} />} />
              <Route path="team" element={<Lazy page={TeamPage} />} />
              <Route path="settings" element={<Lazy page={SettingsPage} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
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

function GateScreen({ title, text, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7ed] px-6 text-center text-[#071f50]">
      <div className="w-full max-w-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#ff4b12]/20 bg-white shadow-[0_18px_55px_rgba(7,31,80,0.08)]">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#071f50]/10 border-t-[#ff4b12]" />
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-[-0.02em]">{title}</h1>
        <p className="mt-2 text-[14px] font-medium leading-6 text-[#071f50]/60">{text}</p>
        {children}
      </div>
    </main>
  );
}
