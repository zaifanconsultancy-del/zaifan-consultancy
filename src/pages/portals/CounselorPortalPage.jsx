import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

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
    timer = window.setTimeout(() => {
      reject(new Error(`Counselor Portal load timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timer);
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

  const rawTotal =
    safeNumber(diagnostics.rawApplications) +
    safeNumber(diagnostics.rawUniversities) +
    safeNumber(diagnostics.rawDocuments) +
    safeNumber(diagnostics.rawTasks) +
    safeNumber(diagnostics.rawSupport) +
    safeNumber(diagnostics.rawCommunications) +
    safeNumber(diagnostics.rawAppointments) +
    safeNumber(diagnostics.rawTimeline);

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
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      detail: "Backend load failed or RLS blocked the query.",
    };
  }

  if (assignedTotal > 0) {
    return {
      label: "Live Supabase",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      detail: `${assignedTotal} assigned records loaded. ${workload?.pressureLabel || "Workload calculated."}`,
    };
  }

  if (rawTotal > 0) {
    return {
      label: "Backend reachable",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      detail: "Raw records found, but counselor assignment filtering returned empty.",
    };
  }

  if (metrics?.assignedStudents === 0 && performance?.studentsManaged === 0) {
    return {
      label: "No assigned data",
      tone: "border-slate-200 bg-slate-50 text-slate-600",
      detail: "Portal is connected, but no assigned counselor records were found.",
    };
  }

  return {
    label: "Operational",
    tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
    detail: "Counselor workspace is ready.",
  };
}


function CommandPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm">
      <span className="font-black text-slate-400">{label}</span>
      <span className="max-w-[190px] truncate font-bold text-slate-800">{value || "—"}</span>
    </span>
  );
}

function CounselorMetric({ label, value, detail, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white/90",
    orange: "border-orange-200 bg-orange-50/90",
    blue: "border-blue-200 bg-blue-50/90",
    violet: "border-violet-200 bg-violet-50/90",
    amber: "border-amber-200 bg-amber-50/90",
    red: "border-rose-200 bg-rose-50/90",
    green: "border-emerald-200 bg-emerald-50/90",
  };

  const values = {
    slate: "text-slate-950",
    orange: "text-orange-700",
    blue: "text-blue-700",
    violet: "text-violet-700",
    amber: "text-amber-700",
    red: "text-rose-700",
    green: "text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-3.5 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-black ${values[tone] || values.slate}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function CounselorWorkspaceLoader() {
  return (
    <div className="flex min-h-[440px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-slate-900">
          Opening Counselor Command Workspace
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Loading the counselor operating system only when required.
        </p>
      </div>
    </div>
  );
}

export default function CounselorPortalPage({ counselorProfile = FALLBACK_COUNSELOR }) {
  const mountedRef = useRef(false);
  const snapshotRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState("");
  const [lastErrorDetail, setLastErrorDetail] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [loadCount, setLoadCount] = useState(0);

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
      const hasCurrentSnapshot = Boolean(snapshotRef.current);

      if (!silent && !hasCurrentSnapshot) setLoading(true);
      if (silent || hasCurrentSnapshot) setRefreshing(true);

      setError("");
      setLastErrorDetail("");

      try {
        const data = await withTimeout(fetchCounselorPortalSnapshot({ counselor }));

        if (!mountedRef.current) return null;

        commitSnapshot(data);
        return data;
      } catch (err) {
        console.error("Counselor Portal load failed", err);

        if (!mountedRef.current) return null;

        const fallbackSnapshot = preserveCurrent
          ? snapshotRef.current || buildSafeSnapshot(null, counselor)
          : buildSafeSnapshot(null, counselor);

        snapshotRef.current = fallbackSnapshot;
        setSnapshot(fallbackSnapshot);
        setError("Counselor Portal could not load right now. Check Supabase table names/RLS, then refresh.");
        setLastErrorDetail(err?.message || String(err));
        return null;
      } finally {
        if (mountedRef.current) {
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
    };
  }, [loadPortal]);

  const safeSnapshot = useMemo(() => buildSafeSnapshot(snapshot, counselor), [snapshot, counselor]);

  const metrics = useMemo(() => buildCounselorPortalMetrics(safeSnapshot), [safeSnapshot]);
  const workload = useMemo(() => buildCounselorWorkloadAnalytics(safeSnapshot), [safeSnapshot]);
  const performance = useMemo(() => buildCounselorPerformanceAnalytics(safeSnapshot), [safeSnapshot]);
  const executiveBrief = useMemo(() => buildCounselorExecutiveBrief(safeSnapshot), [safeSnapshot]);

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

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-orange-200/25 blur-3xl" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-amber-100/45 blur-3xl" />
      </div>

      <section className="relative border-b border-slate-200/80 bg-white/90 px-4 py-5 backdrop-blur-xl sm:px-6">
        <div className="mx-auto max-w-[1800px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.07)] sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-amber-100/80 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-orange-200 bg-orange-100/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                    Zaifan Counselor OS
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${portalHealth.tone}`}>
                    {portalHealth.label}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Counselor Command Workspace
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  One operating workspace for assigned students, applications, documents,
                  appointments, support, communication, follow-ups, workload and counselor intelligence.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
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

                <p className="mt-3 text-xs leading-5 text-slate-500">{portalHealth.detail}</p>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[590px]">
                <div className="rounded-[1.4rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Signed in as
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {counselor.displayName}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {counselor.email || counselor.role}
                  </p>
                </div>

                <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">
                    Executive focus
                  </p>
                  <p className="mt-2 line-clamp-1 text-lg font-black text-slate-950">
                    {executiveBrief.focus || "Pipeline nurturing"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-700/75">
                    {executiveBrief.headline || "Healthy workload"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshing ? "Refreshing counselor data..." : "Refresh Counselor Data"}
                </button>

                <button
                  type="button"
                  onClick={handleHardReload}
                  disabled={refreshing || loading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hard Reload Snapshot
                </button>
              </div>
            </div>

            <div className="relative mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <CounselorMetric label="Assigned students" value={commandMetrics.students} detail="Students in your active portfolio" tone="orange" />
              <CounselorMetric label="Applications" value={commandMetrics.activeApplications} detail="Active application workflows" tone="blue" />
              <CounselorMetric label="Documents" value={commandMetrics.pendingDocuments} detail="Files still needing readiness" tone="violet" />
              <CounselorMetric label="Open tasks" value={commandMetrics.openTasks} detail="Operational actions remaining" tone="amber" />
              <CounselorMetric label="Support queue" value={commandMetrics.openSupport} detail="Student requests awaiting closure" tone={commandMetrics.openSupport ? "red" : "green"} />
              <CounselorMetric label="Appointments" value={commandMetrics.upcomingAppointments} detail="Active consultation workload" tone="green" />
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
            <div className="mt-4 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <p className="text-sm font-black text-amber-800">
                No assigned students loaded for this counselor yet.
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-700">
                The backend appears reachable, but assignment mapping may need to match
                assigned_counselor_id, assigned_counselor_email, assigned_to, counselor_id,
                or owner_id.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-[1800px] px-3 py-4 sm:px-6 sm:py-6 xl:px-8">
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