import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CounselorPortalDashboard from "../../components/counselor/CounselorPortalDashboard";
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
      tone: "border-rose-400/30 bg-rose-500/10 text-rose-100",
      detail: "Backend load failed or RLS blocked the query.",
    };
  }

  if (assignedTotal > 0) {
    return {
      label: "Live Supabase",
      tone: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
      detail: `${assignedTotal} assigned records loaded. ${workload?.pressureLabel || "Workload calculated."}`,
    };
  }

  if (rawTotal > 0) {
    return {
      label: "Backend reachable",
      tone: "border-amber-400/30 bg-amber-500/10 text-amber-100",
      detail: "Raw records found, but counselor assignment filtering returned empty.",
    };
  }

  if (metrics?.assignedStudents === 0 && performance?.studentsManaged === 0) {
    return {
      label: "No assigned data",
      tone: "border-slate-400/20 bg-white/[0.04] text-slate-200",
      detail: "Portal is connected, but no assigned counselor records were found.",
    };
  }

  return {
    label: "Operational",
    tone: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    detail: "Counselor workspace is ready.",
  };
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

  const handleRefresh = useCallback(() => {
    loadPortal({ silent: true, preserveCurrent: true });
  }, [loadPortal]);

  const handleHardReload = useCallback(() => {
    snapshotRef.current = null;
    setSnapshot(null);
    loadPortal({ silent: false, preserveCurrent: false });
  }, [loadPortal]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <section className="relative border-b border-white/10 bg-slate-950/90 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Zaifan Counselor Portal OS
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Counselor Command Workspace
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Assigned student execution, application movement, document readiness, university planning,
              support response, communication history, appointments, performance intelligence, and workload control.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${portalHealth.tone}`}>
                {portalHealth.label}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                Scope: {safeSnapshot.assignmentScope}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                Loads: {loadCount}
              </span>
              {lastLoadedAt && (
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                  Last sync: {new Date(lastLoadedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-400">{portalHealth.detail}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[500px]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-cyan-950/30">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in as</p>
              <p className="mt-1 text-lg font-bold">{counselor.displayName}</p>
              <p className="truncate text-xs text-slate-400">{counselor.email || counselor.role}</p>
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">Executive focus</p>
              <p className="mt-1 line-clamp-1 text-lg font-black text-white">
                {executiveBrief.focus || "Pipeline nurturing"}
              </p>
              <p className="line-clamp-2 text-xs text-emerald-100/70">
                {executiveBrief.headline || "Healthy workload"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh Counselor Data"}
            </button>

            <button
              type="button"
              onClick={handleHardReload}
              disabled={refreshing || loading}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hard Reload Snapshot
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-auto mt-4 max-w-7xl rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
            <p className="text-sm font-bold text-rose-100">{error}</p>
            {lastErrorDetail && <p className="mt-1 text-xs text-rose-100/70">{lastErrorDetail}</p>}
          </div>
        )}

        {!error && booted && safeArray(safeSnapshot.students).length === 0 && (
          <div className="mx-auto mt-4 max-w-7xl rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm font-bold text-amber-100">
              No assigned students loaded for this counselor yet.
            </p>
            <p className="mt-1 text-xs text-amber-100/70">
              Backend is probably reachable, but assignment fields may need counselor ID/email mapping:
              assigned_counselor_id, assigned_counselor_email, assigned_to, counselor_id, or owner_id.
            </p>
          </div>
        )}
      </section>

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
    </main>
  );
}