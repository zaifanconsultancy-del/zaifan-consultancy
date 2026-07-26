import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const CounselorPortalDashboard = lazy(() =>
  import("../../components/counselor/CounselorPortalDashboard")
);
import {
  buildCounselorExecutiveBrief,
  buildCounselorPerformanceAnalytics,
  buildCounselorPortalMetrics,
  buildCounselorWorkloadAnalytics,
  fetchCounselorPortalSnapshot,
  normalizeCounselorProfile,
} from "../../lib/counselorPortal";

const FALLBACK_COUNSELOR = {
  displayName: "Counselor",
  role: "counselor",
};

const EMPTY_ARRAY_KEYS = [
  "students",
  "applications",
  "universities",
  "documents",
  "tasks",
  "support",
  "communications",
  "appointments",
  "timeline",
];

const STORAGE_KEYS = [
  "zaifan_counselor_profile",
  "zaifan_admin_profile",
  "adminProfile",
  "zaifan_user_profile",
];

const LOAD_TIMEOUT_MS = 22000;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function withTimeout(promise, timeoutMs = LOAD_TIMEOUT_MS) {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = globalThis.setTimeout(() => {
      reject(
        new Error(
          `Counselor Portal load timed out after ${Math.round(timeoutMs / 1000)} seconds.`
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    globalThis.clearTimeout(timer);
  });
}

function buildSafeSnapshot(snapshot, counselor) {
  const base = safeObject(snapshot);

  const safeSnapshot = {
    ...base,
    loadedAt: base.loadedAt || null,
    counselor,
    assignmentScope: base.assignmentScope || "fallback",
    diagnostics: safeObject(base.diagnostics),
  };

  EMPTY_ARRAY_KEYS.forEach((key) => {
    safeSnapshot[key] = safeArray(base[key]);
  });

  return safeSnapshot;
}

function readStoredCounselor() {
  if (typeof window === "undefined") return null;

  for (const key of STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const profile = parsed?.profile || parsed?.user || parsed?.admin || parsed;

      if (profile && typeof profile === "object") return profile;
    } catch {
      continue;
    }
  }

  return null;
}

function buildPortalHealth(snapshot, metrics, workload, performance, error) {
  const diagnostics = safeObject(snapshot?.diagnostics);
  const readErrors = safeArray(diagnostics.readErrors);

  const assignedTotal =
    safeArray(snapshot?.students).length +
    safeArray(snapshot?.applications).length +
    safeArray(snapshot?.universities).length +
    safeArray(snapshot?.documents).length +
    safeArray(snapshot?.tasks).length +
    safeArray(snapshot?.support).length +
    safeArray(snapshot?.communications).length +
    safeArray(snapshot?.appointments).length;

  if (error) {
    return {
      label: "Needs attention",
      tone: "border-rose-300 bg-rose-50 text-rose-800",
      detail: "The portal load failed. Check connectivity, table names, and Supabase RLS policies.",
    };
  }

  if (readErrors.length > 0) {
    return {
      label: "Partial Supabase",
      tone: "border-amber-300 bg-amber-50 text-amber-900",
      detail: `${readErrors.length} data source${readErrors.length === 1 ? "" : "s"} could not be read. Visible data may be incomplete.`,
    };
  }

  if (assignedTotal > 0) {
    return {
      label: "Live Supabase",
      tone: "border-emerald-300 bg-emerald-50 text-emerald-800",
      detail: `${assignedTotal} assigned records loaded. ${
        workload?.pressureLabel || "Workload calculated."
      }`,
    };
  }

  if (snapshot?.assignmentScope === "missing-counselor-identity") {
    return {
      label: "Identity required",
      tone: "border-rose-300 bg-rose-50 text-rose-800",
      detail: "No counselor id/email is available, so the portal is safely refusing to expose unscoped student data.",
    };
  }

  if (metrics?.assignedStudents === 0 && performance?.studentsManaged === 0) {
    return {
      label: "No assigned data",
      tone: "border-[#f2a65a] bg-[#fff4df] text-[#7a3d00]",
      detail: "Supabase is reachable, but no records are currently assigned to this counselor.",
    };
  }

  return {
    label: "Operational",
    tone: "border-[#2d4f6c] bg-[#eef4f8] text-[#17324d]",
    detail: "Counselor workspace is ready.",
  };
}


function CommandPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8b892] bg-[#fffdf8] px-3 py-1.5 text-[11px] text-[#4b6072] shadow-sm">
      <span className="font-black text-[#7d8d9a]">{label}</span>
      <span className="max-w-[190px] truncate font-bold text-slate-800">{value || "—"}</span>
    </span>
  );
}

function CounselorMetric({ label, value, detail, tone = "slate" }) {
  const tones = {
    slate: "bg-white border-t-[#17324d]",
    orange: "bg-orange-50/80 border-t-orange-400",
    blue: "bg-sky-50/80 border-t-sky-400",
    violet: "bg-violet-50/80 border-t-violet-400",
    amber: "bg-amber-50/80 border-t-amber-400",
    red: "bg-rose-50/80 border-t-rose-400",
    green: "bg-emerald-50/80 border-t-emerald-400",
  };

  const values = {
    slate: "text-[#17324d]",
    orange: "text-orange-700",
    blue: "text-sky-700",
    violet: "text-violet-700",
    amber: "text-amber-700",
    red: "text-rose-700",
    green: "text-emerald-700",
  };

  return (
    <div className={`border-b border-r border-t-4 border-[#ead9c5] px-4 py-3.5 ${tones[tone] || tones.slate}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7d8d9a]">
        {label}
      </p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className={`text-xl font-black ${values[tone] || values.slate}`}>{value}</p>
        <p className="text-[10px] font-semibold text-[#718292]">{detail}</p>
      </div>
    </div>
  );
}

function CounselorWorkspaceLoader() {
  return (
    <div className="flex min-h-[440px] items-center justify-center rounded-[2rem] border border-[#d8b892] bg-[#fffdf8] shadow-sm">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-900">
          Opening Counselor Command Workspace
        </p>
        <p className="mt-1 text-xs text-[#7d8d9a]">
          Loading the counselor operating system only when required.
        </p>
      </div>
    </div>
  );
}

export default function CounselorPortalPage({ counselorProfile = FALLBACK_COUNSELOR }) {
  const mountedRef = useRef(false);
  const snapshotRef = useRef(null);
  const requestIdRef = useRef(0);

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState("");
  const [lastErrorDetail, setLastErrorDetail] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [loadCount, setLoadCount] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  const counselor = useMemo(() => {
    const stored = readStoredCounselor();
    return normalizeCounselorProfile(stored || counselorProfile || FALLBACK_COUNSELOR);
  }, [counselorProfile]);

  const commitSnapshot = useCallback(
    (nextSnapshot) => {
      const safeSnapshot = buildSafeSnapshot(nextSnapshot, counselor);
      snapshotRef.current = safeSnapshot;
      setSnapshot(safeSnapshot);
      setLastLoadedAt(new Date().toISOString());
      setLoadCount((count) => count + 1);
    },
    [counselor]
  );

  const loadPortal = useCallback(
    async ({ silent = false, preserveCurrent = true } = {}) => {
      const requestId = ++requestIdRef.current;
      const hasCurrentSnapshot = Boolean(snapshotRef.current);

      if (!silent && !hasCurrentSnapshot) setLoading(true);
      if (silent || hasCurrentSnapshot) setRefreshing(true);

      setError("");
      setLastErrorDetail("");

      try {
        const data = await withTimeout(fetchCounselorPortalSnapshot({ counselor }));

        if (!mountedRef.current || requestId !== requestIdRef.current) return null;

        commitSnapshot(data);
        return data;
      } catch (err) {
        console.error("Counselor Portal load failed", err);

        if (!mountedRef.current || requestId !== requestIdRef.current) return null;

        const fallbackSnapshot = preserveCurrent
          ? snapshotRef.current || buildSafeSnapshot(null, counselor)
          : buildSafeSnapshot(null, counselor);

        snapshotRef.current = fallbackSnapshot;
        setSnapshot(fallbackSnapshot);
        setError(
          "Counselor Portal could not load right now. Check Supabase connectivity, table access, and RLS policies, then refresh."
        );
        setLastErrorDetail(err?.message || String(err));
        return null;
      } finally {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setBooted(true);
        }
      }
    },
    [commitSnapshot, counselor]
  );

  useEffect(() => {
    mountedRef.current = true;
    loadPortal({ silent: false, preserveCurrent: true });

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [loadPortal]);

  const safeSnapshot = useMemo(() => buildSafeSnapshot(snapshot, counselor), [snapshot, counselor]);

  const metrics = useMemo(
    () => safeSnapshot.metrics || buildCounselorPortalMetrics(safeSnapshot),
    [safeSnapshot]
  );
  const workload = useMemo(
    () => safeSnapshot.workload || buildCounselorWorkloadAnalytics(safeSnapshot),
    [safeSnapshot]
  );
  const performance = useMemo(
    () => safeSnapshot.performance || buildCounselorPerformanceAnalytics(safeSnapshot),
    [safeSnapshot]
  );
  const executiveBrief = useMemo(
    () => safeSnapshot.executiveBrief || buildCounselorExecutiveBrief(safeSnapshot),
    [safeSnapshot]
  );

  const portalHealth = useMemo(
    () => buildPortalHealth(safeSnapshot, metrics, workload, performance, error),
    [safeSnapshot, metrics, workload, performance, error]
  );

  const commandMetrics = useMemo(() => {
    const tasks = safeArray(safeSnapshot.tasks);
    const support = safeArray(safeSnapshot.support);
    const documents = safeArray(safeSnapshot.documents);
    const applications = safeArray(safeSnapshot.applications);
    const appointments = safeArray(safeSnapshot.appointments);

    const openTasks = tasks.filter(
      (item) => !["completed", "done"].includes(String(item.status || "").toLowerCase())
    ).length;

    const openSupport = support.filter(
      (item) => !["resolved", "closed"].includes(String(item.status || "").toLowerCase())
    ).length;

    const pendingDocuments = documents.filter(
      (item) =>
        !["verified", "approved"].includes(
          String(item.status || item.verification_status || "").toLowerCase()
        )
    ).length;

    const activeApplications = applications.filter(
      (item) =>
        !["completed", "rejected", "withdrawn"].includes(
          String(item.status || "").toLowerCase()
        )
    ).length;

    const upcomingAppointments = appointments.filter(
      (item) =>
        !["completed", "cancelled", "canceled"].includes(
          String(item.status || "").toLowerCase()
        )
    ).length;

    return {
      students: safeArray(safeSnapshot.students).length,
      activeApplications,
      pendingDocuments,
      openTasks,
      openSupport,
      upcomingAppointments,
    };
  }, [safeSnapshot]);

  const handleRefresh = useCallback(() => {
    loadPortal({ silent: true, preserveCurrent: true });
  }, [loadPortal]);

  const handleHardReload = useCallback(() => {
    snapshotRef.current = null;
    setSnapshot(null);
    loadPortal({ silent: false, preserveCurrent: false });
  }, [loadPortal]);

  const handleSignOut = useCallback(async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      STORAGE_KEYS.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Ignore storage cleanup failures.
        }
      });

      window.location.replace("/counselor");
    } catch (signOutError) {
      console.error("Counselor sign out failed", signOutError);
      window.alert(
        signOutError?.message ||
          "Sign out failed. Please check your connection and try again."
      );
      setSigningOut(false);
    }
  }, [signingOut]);

  return (
    <main className="min-h-screen bg-[#fff7ee] text-[#17324d]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-orange-100/35 blur-3xl" />
        <div className="absolute right-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-[#e9f0f6]/55 blur-3xl" />
      </div>

      <section className="relative border-b border-[#ead6bf] bg-[#fffaf2]/92 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-[1800px]">
          <div className="relative overflow-hidden rounded-[1.8rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-[0_16px_45px_rgba(23,50,77,0.07)]">
            <div className="h-1 bg-orange-500" />

            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
                    Zaifan Counselor OS
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${portalHealth.tone}`}
                  >
                    {portalHealth.label}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-3xl font-black tracking-tight text-[#17324d] sm:text-4xl">
                      Counselor Command Workspace
                    </h1>

                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[#607487]">
                      Secure counselor access, assigned-scope health and live Supabase status.
                      Operational work continues in the dashboard below.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CommandPill label="Counselor" value={counselor.displayName} />
                    <CommandPill label="Scope" value={safeSnapshot.assignmentScope} />
                    <CommandPill label="Syncs" value={loadCount} />
                    {lastLoadedAt ? (
                      <CommandPill
                        label="Last sync"
                        value={new Date(lastLoadedAt).toLocaleTimeString()}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#e4d2bd] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold leading-5 text-[#607487]">
                    {portalHealth.detail}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#17324d] bg-[#17324d] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      {executiveBrief.focus || "Pipeline nurturing"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-[320px] border-t-2 border-[#17324d] bg-[#173955] xl:w-[410px] xl:border-l-2 xl:border-t-0">
                <div className="relative overflow-hidden p-5">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border-[22px] border-white/[0.035]" />

                  <div className="relative flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-black text-orange-300 shadow-inner">
                      {String(counselor.displayName || counselor.email || "C")
                        .trim()
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
                        Signed in as
                      </p>

                      <p className="mt-1 truncate text-sm font-black text-white">
                        {counselor.displayName}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] font-medium text-white/60">
                        {counselor.email || counselor.role}
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/45">
                        Access
                      </p>
                      <p className="mt-1 text-[11px] font-black text-white">
                        Counselor OS
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/45">
                        Status
                      </p>
                      <p className="mt-1 text-[11px] font-black text-emerald-300">
                        Authenticated
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#14324b] p-3">
                  <div className="grid grid-cols-[1.15fr_0.85fr] gap-2">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={refreshing || loading}
                      className="group rounded-2xl border-2 border-orange-500 bg-orange-500 px-4 py-3 text-left text-xs font-black text-white shadow-[0_8px_20px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200/30 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span className="block text-[9px] uppercase tracking-[0.14em] text-white/70">
                        Live sync
                      </span>
                      <span className="mt-1 block">
                        {refreshing ? "Refreshing..." : "Refresh Data"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleHardReload}
                      disabled={refreshing || loading}
                      className="rounded-2xl border-2 border-white/15 bg-white/[0.07] px-4 py-3 text-left text-xs font-black text-white transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <span className="block text-[9px] uppercase tracking-[0.14em] text-white/45">
                        Recovery
                      </span>
                      <span className="mt-1 block">Hard Reload</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/15 bg-[#0f2a40] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-orange-300/50 hover:bg-[#0b2336] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/20 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <span>
                      <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
                        Account
                      </span>
                      <span className="mt-1 block text-xs font-black text-white">
                        {signingOut ? "Signing Out..." : "Sign Out"}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-base font-black text-orange-300"
                    >
                      →
                    </span>
                  </button>

                  <p className="mt-2 px-1 text-[10px] leading-4 text-white/45">
                    Refresh keeps the session. Hard reload rebuilds the counselor snapshot.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid border-t-2 border-[#ead9c5] bg-[#fff8ef] sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <CounselorMetric
                label="Assigned"
                value={commandMetrics.students}
                detail="active students"
                tone="orange"
              />
              <CounselorMetric
                label="Applications"
                value={commandMetrics.activeApplications}
                detail="active workflows"
                tone="blue"
              />
              <CounselorMetric
                label="Documents"
                value={commandMetrics.pendingDocuments}
                detail="need readiness"
                tone="violet"
              />
              <CounselorMetric
                label="Tasks"
                value={commandMetrics.openTasks}
                detail="still open"
                tone="amber"
              />
              <CounselorMetric
                label="Support"
                value={commandMetrics.openSupport}
                detail="awaiting closure"
                tone={commandMetrics.openSupport ? "red" : "green"}
              />
              <CounselorMetric
                label="Appointments"
                value={commandMetrics.upcomingAppointments}
                detail="active workload"
                tone="green"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[1.4rem] border border-rose-200 bg-rose-50 p-4 shadow-sm">
              <p className="text-sm font-black text-rose-700">{error}</p>
              {lastErrorDetail ? (
                <p className="mt-1 text-xs leading-5 text-rose-600">{lastErrorDetail}</p>
              ) : null}
            </div>
          ) : null}

          {!error && booted && safeArray(safeSnapshot.students).length === 0 ? (
            <div className="mt-3 flex flex-col gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-black text-amber-800">
                No assigned students loaded yet.
              </p>
              <p className="text-[11px] leading-5 text-amber-700">
                Check assignment mapping / RLS only if assigned records should already exist.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[1800px] px-3 py-4 sm:px-6 xl:px-8">
        <Suspense fallback={<CounselorWorkspaceLoader />}>
          <CounselorPortalDashboard
            counselor={counselor}
            snapshot={safeSnapshot}
            metrics={metrics}
            workload={workload}
            performance={performance}
            executiveBrief={executiveBrief}
            loading={loading}
            refreshing={refreshing}
            error={error}
            errorDetail={lastErrorDetail}
            onRefresh={handleRefresh}
            onHardReload={handleHardReload}
            onSilentRefresh={() => loadPortal({ silent: true, preserveCurrent: true })}
          />
        </Suspense>
      </section>
    </main>
  );
}