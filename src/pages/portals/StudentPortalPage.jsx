import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

const StudentPortalAuth = lazy(() => import("../../components/student/StudentPortalAuth"));
const StudentPortalDashboard = lazy(() =>
  import("../../components/student/StudentPortalDashboard")
);
import { supabase } from "../../lib/supabaseClient";
import {
  fetchStudentPortalAccountForStudent,
  fetchStudentPortalData,
  fetchStudentPortalOverview,
  findStudentsForPortal,
  loginStudentPortalAccount,
  changeStudentPortalPassword,
  getStudentPortalRealtimeTables,
} from "../../lib/studentPortal";

const SESSION_KEY = "zaifan_student_portal_session_v2";
const AUTO_REFRESH_COOLDOWN_MS = 5000;
const REALTIME_REFRESH_DEBOUNCE_MS = 650;

const STUDENT_REALTIME_TABLES = getStudentPortalRealtimeTables();

const EMPTY_PORTAL_DATA = {
  applications: [],
  documents: [],
  tasks: [],
  communications: [],
  timeline: [],
  universities: [],
  invoices: [],
  payments: [],
  receipts: [],
  counselorPaymentRequests: [],
  paymentRequests: [],
  paymentAccounts: [],
  supportRequests: [],
  studentSupportRequests: [],
  counts: {
    applications: 0,
    documents: 0,
    tasks: 0,
    communications: 0,
    timeline: 0,
    universities: 0,
    invoices: 0,
    payments: 0,
    receipts: 0,
    counselorPaymentRequests: 0,
    paymentRequests: 0,
    supportRequests: 0,
    studentSupportRequests: 0,
    total: 0,
  },
  error: null,
};

function getFirstArray(candidates = [], key) {
  for (const source of candidates) {
    if (Array.isArray(source?.[key])) return source[key];
  }
  return [];
}

function getFirstCount(candidates = [], key, fallbackLength = 0) {
  const possibleKeys = [key, `${key}Count`, `${key}_count`];

  for (const source of candidates) {
    const counts = source?.counts || source || {};

    for (const possibleKey of possibleKeys) {
      const number = Number(counts?.[possibleKey]);
      if (Number.isFinite(number) && number >= 0) {
        return Math.max(fallbackLength, number);
      }
    }
  }

  return fallbackLength;
}

function normalizePortalDataResult(result = {}) {
  const candidates = [
    result?.portalData,
    result?.data,
    result?.payload,
    result?.result,
    result,
  ].filter(Boolean);

  const applications = getFirstArray(candidates, "applications");
  const documents = getFirstArray(candidates, "documents");
  const tasks = getFirstArray(candidates, "tasks");
  const communications = getFirstArray(candidates, "communications");
  const timeline = getFirstArray(candidates, "timeline");
  const universities = getFirstArray(candidates, "universities");
  const invoices = getFirstArray(candidates, "invoices");
  const payments = getFirstArray(candidates, "payments");
  const receipts = getFirstArray(candidates, "receipts");
  const counselorPaymentRequests = getFirstArray(candidates, "counselorPaymentRequests");
  const paymentRequests =
    getFirstArray(candidates, "paymentRequests").length
      ? getFirstArray(candidates, "paymentRequests")
      : counselorPaymentRequests;
  const paymentAccounts = getFirstArray(candidates, "paymentAccounts");
  const supportRequests = getFirstArray(candidates, "supportRequests");
  const studentSupportRequests =
    getFirstArray(candidates, "studentSupportRequests").length
      ? getFirstArray(candidates, "studentSupportRequests")
      : supportRequests;

  const counts = {
    applications: getFirstCount(candidates, "applications", applications.length),
    documents: getFirstCount(candidates, "documents", documents.length),
    tasks: getFirstCount(candidates, "tasks", tasks.length),
    communications: getFirstCount(candidates, "communications", communications.length),
    timeline: getFirstCount(candidates, "timeline", timeline.length),
    universities: getFirstCount(candidates, "universities", universities.length),
    invoices: getFirstCount(candidates, "invoices", invoices.length),
    payments: getFirstCount(candidates, "payments", payments.length),
    receipts: getFirstCount(candidates, "receipts", receipts.length),
    counselorPaymentRequests: getFirstCount(
      candidates,
      "counselorPaymentRequests",
      counselorPaymentRequests.length
    ),
    paymentRequests: getFirstCount(candidates, "paymentRequests", paymentRequests.length),
    supportRequests: getFirstCount(candidates, "supportRequests", supportRequests.length),
    studentSupportRequests: getFirstCount(
      candidates,
      "studentSupportRequests",
      studentSupportRequests.length
    ),
  };

  counts.total =
    counts.applications +
    counts.documents +
    counts.tasks +
    counts.communications +
    counts.timeline +
    counts.universities +
    counts.invoices +
    counts.payments +
    counts.receipts +
    counts.counselorPaymentRequests +
    counts.supportRequests;

  return {
    applications,
    documents,
    tasks,
    communications,
    timeline,
    universities,
    invoices,
    payments,
    receipts,
    counselorPaymentRequests,
    paymentRequests,
    paymentAccounts,
    supportRequests,
    studentSupportRequests,
    counts,
    error: result?.error || result?.portalData?.error || result?.data?.error || null,
  };
}


function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function buildSessionPayload({ account = null, student = null, mode = "legacy" }) {
  if (!student?.id) return null;

  return {
    mode,
    saved_at: new Date().toISOString(),
    account: account
      ? {
          id: account.id || account.account_id || null,
          email: account.email || null,
          student_id: account.student_id || student.id,
          student_type: account.student_type || student.student_type || "inquiry",
          is_active: account.is_active ?? true,
        }
      : null,
    student,
  };
}

function mergePortalData(previous = EMPTY_PORTAL_DATA, next = EMPTY_PORTAL_DATA) {
  const merged = {
    applications: next.applications?.length ? next.applications : previous.applications || [],
    documents: next.documents?.length ? next.documents : previous.documents || [],
    tasks: next.tasks?.length ? next.tasks : previous.tasks || [],
    communications: next.communications?.length
      ? next.communications
      : previous.communications || [],
    timeline: next.timeline?.length ? next.timeline : previous.timeline || [],
    universities: next.universities?.length ? next.universities : previous.universities || [],
    invoices: next.invoices?.length ? next.invoices : previous.invoices || [],
    payments: next.payments?.length ? next.payments : previous.payments || [],
    receipts: next.receipts?.length ? next.receipts : previous.receipts || [],
    counselorPaymentRequests: next.counselorPaymentRequests?.length
      ? next.counselorPaymentRequests
      : previous.counselorPaymentRequests || [],
    paymentRequests: next.paymentRequests?.length
      ? next.paymentRequests
      : previous.paymentRequests || previous.counselorPaymentRequests || [],
    paymentAccounts: next.paymentAccounts?.length ? next.paymentAccounts : previous.paymentAccounts || [],
    supportRequests: next.supportRequests?.length ? next.supportRequests : previous.supportRequests || [],
    studentSupportRequests: next.studentSupportRequests?.length
      ? next.studentSupportRequests
      : previous.studentSupportRequests || previous.supportRequests || [],
    counts: {
      ...(previous.counts || EMPTY_PORTAL_DATA.counts),
      ...(next.counts || {}),
    },
    error: next.error || previous.error || null,
  };

  merged.counts.total =
    Number(merged.counts.applications || merged.applications.length || 0) +
    Number(merged.counts.documents || merged.documents.length || 0) +
    Number(merged.counts.tasks || merged.tasks.length || 0) +
    Number(merged.counts.communications || merged.communications.length || 0) +
    Number(merged.counts.timeline || merged.timeline.length || 0) +
    Number(merged.counts.universities || merged.universities.length || 0) +
    Number(merged.counts.invoices || merged.invoices.length || 0) +
    Number(merged.counts.payments || merged.payments.length || 0) +
    Number(merged.counts.receipts || merged.receipts.length || 0) +
    Number(merged.counts.counselorPaymentRequests || merged.counselorPaymentRequests.length || 0) +
    Number(merged.counts.supportRequests || merged.supportRequests.length || 0);

  return merged;
}

function PortalRestoreStep({ label }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
      {label}
    </div>
  );
}

function StudentPortalSurfaceLoader({ label = "Loading Student OS" }) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fa] px-5">
      <div className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-5 text-base font-black text-slate-950">{label}</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Loading only the portal experience required for this session.
        </p>
      </div>
    </section>
  );
}

function StudentPortalPage() {
  const mountedRef = useRef(false);
  const restoreStartedRef = useRef(false);
  const activeLoadIdRef = useRef(0);
  const lastAutoRefreshAtRef = useRef(0);
  const realtimeRefreshTimerRef = useRef(null);
  const refreshInFlightRef = useRef(false);
  const latestPortalDataRef = useRef(EMPTY_PORTAL_DATA);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [student, setStudent] = useState(null);
  const [account, setAccount] = useState(null);
  const [sessionMode, setSessionMode] = useState("legacy");

  const [matchingStudents, setMatchingStudents] = useState([]);
  const [portalData, setPortalData] = useState(EMPTY_PORTAL_DATA);

  const [loading, setLoading] = useState(false);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    latestPortalDataRef.current = portalData;
  }, [portalData]);

  const hasStudent = useMemo(() => Boolean(student?.id), [student]);

  const saveSession = useCallback(({ nextAccount = null, nextStudent, mode = "legacy" }) => {
    const payload = buildSessionPayload({
      account: nextAccount,
      student: nextStudent,
      mode,
    });

    if (!payload) return;

    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const loadLinkedAccount = useCallback(
    async (nextStudent, options = {}) => {
      if (!nextStudent?.id) return null;

      try {
        const result = await fetchStudentPortalAccountForStudent(nextStudent);

        if (!mountedRef.current) {
          return result?.account || null;
        }

        if (result?.account) {
          setAccount(result.account);

          if (options.save !== false) {
            saveSession({
              nextAccount: result.account,
              nextStudent,
              mode: options.mode || sessionMode || "legacy",
            });
          }
        }

        return result?.account || null;
      } catch {
        return null;
      }
    },
    [saveSession, sessionMode]
  );
const loadOverviewData = useCallback(async (nextStudent, options = {}) => {
  if (!nextStudent?.id) return EMPTY_PORTAL_DATA;

  setLoadingData(true);
  if (!options.keepError) setError("");

  try {
    const result = await fetchStudentPortalOverview(nextStudent);
    const nextPortalData = normalizePortalDataResult(result);

    setPortalData((previous) => mergePortalData(previous, nextPortalData));

    if (nextPortalData?.error) {
      setError(nextPortalData.error.message || "Some portal overview data could not be loaded.");
    }

    return nextPortalData;
  } catch (err) {
    setError(err?.message || "Portal overview failed.");
    return EMPTY_PORTAL_DATA;
  } finally {
    setLoadingData(false);
  }
}, []);
  const loadPortalData = useCallback(async (nextStudent, options = {}) => {
  if (!nextStudent?.id) return EMPTY_PORTAL_DATA;

  setLoadingData(true);
  if (!options.keepError) setError("");

  try {
    const result = await fetchStudentPortalData(nextStudent);
    const nextPortalData = normalizePortalDataResult(result);

    setPortalData((previous) =>
      options.merge ? mergePortalData(previous, nextPortalData) : nextPortalData
    );

    if (nextPortalData?.error) {
      setError(nextPortalData.error.message || "Some portal data could not be loaded.");
    }

    return nextPortalData;
  } catch (err) {
    setError(err?.message || "Portal refresh failed.");
    return EMPTY_PORTAL_DATA;
  } finally {
    setLoadingData(false);
  }
}, []);

  const openPortal = useCallback(
    ({ nextAccount = null, nextStudent, mode = "legacy", loadData = true }) => {
      if (!nextStudent?.id) {
        setError("Student record could not be opened.");
        return;
      }

      

      setStudent(nextStudent);
      setAccount(nextAccount);
      setSessionMode(mode);
      setMatchingStudents([]);
      setPortalData(EMPTY_PORTAL_DATA);
      setError("");

      saveSession({
        nextAccount,
        nextStudent,
        mode,
      });

      if (!nextAccount) {
        setTimeout(() => {
          loadLinkedAccount(nextStudent, {
            save: true,
            mode,
          });
        }, 0);
      }

      if (loadData) {
        const loadId = activeLoadIdRef.current + 1;
        activeLoadIdRef.current = loadId;

        setTimeout(async () => {
          if (!mountedRef.current || activeLoadIdRef.current !== loadId) return;

          await loadOverviewData(nextStudent, { keepError: true });

          setTimeout(() => {
            if (!mountedRef.current || activeLoadIdRef.current !== loadId) return;

            loadPortalData(nextStudent, {
              keepError: true,
              merge: true,
            });
          }, 250);
        }, 0);
      }
    },
    [loadLinkedAccount, loadOverviewData, loadPortalData, saveSession]
  );

  useEffect(() => {
    // React StrictMode runs mount effects twice in development.
    // Keep mountedRef true before the restore guard, otherwise async portal
    // data loads can complete but skip setPortalData(), leaving dashboard counts at 0.
    mountedRef.current = true;

    if (restoreStartedRef.current) {
      return () => {
        mountedRef.current = false;
        activeLoadIdRef.current += 1;
      };
    }

    restoreStartedRef.current = true;

    const saved = safeJsonParse(localStorage.getItem(SESSION_KEY));

    async function restoreSession() {
      if (!saved?.student?.id) {
        setRestoringSession(false);
        return;
      }

      try {
        setStudent(saved.student);
        setAccount(saved.account || null);
        setSessionMode(saved.mode || "legacy");
        setPortalData(EMPTY_PORTAL_DATA);
        setError("");
        setRestoringSession(false);

        setTimeout(async () => {
          if (!saved.account) {
            loadLinkedAccount(saved.student, {
              save: true,
              mode: saved.mode || "legacy",
            });
          }

          await loadOverviewData(saved.student, { keepError: true });

          setTimeout(() => {
            loadPortalData(saved.student, {
              keepError: true,
              merge: true,
            });
          }, 250);
        }, 50);
      } catch (err) {
        clearSession();
        setStudent(null);
        setAccount(null);
        setSessionMode("legacy");
        setPortalData(EMPTY_PORTAL_DATA);
        setError(err?.message || "Saved portal session could not be restored.");
        setRestoringSession(false);
      }
    }

    restoreSession();

    return () => {
      mountedRef.current = false;
      activeLoadIdRef.current += 1;
    };
  }, [clearSession, loadLinkedAccount, loadOverviewData, loadPortalData]);

  async function handleAccountLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMatchingStudents([]);

    try {
      const result = await loginStudentPortalAccount(email, password);

      if (result?.error || !result?.student) {
        setError(result?.error?.message || "Invalid email or password.");
        return;
      }

      openPortal({
        nextAccount: result.account || null,
        nextStudent: result.student,
        mode: "account",
        loadData: true,
      });

      setPassword("");
    } catch (err) {
      setError(err?.message || "Portal login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLegacyLookup(event) {
    event.preventDefault();

    setLegacyLoading(true);
    setError("");
    setMatchingStudents([]);

    try {
      const result = await findStudentsForPortal(identifier);

      if (result?.error || !result?.students?.length) {
        setError(result?.error?.message || "Student not found.");
        return;
      }

      if (result.students.length === 1) {
        openPortal({
          nextAccount: null,
          nextStudent: result.students[0],
          mode: "legacy",
          loadData: true,
        });
        return;
      }

      setMatchingStudents(result.students);
    } catch (err) {
      setError(err?.message || "Portal search failed.");
    } finally {
      setLegacyLoading(false);
    }
  }

  function handleSelectMatch(nextStudent) {
    openPortal({
      nextAccount: null,
      nextStudent,
      mode: "legacy",
      loadData: true,
    });
  }

const handleRefresh = useCallback(
    async (options = {}) => {
      if (!student?.id) return EMPTY_PORTAL_DATA;

      if (refreshInFlightRef.current && options.auto) {
        return latestPortalDataRef.current;
      }

      const now = Date.now();

      if (options.auto) {
        const elapsed = now - Number(lastAutoRefreshAtRef.current || 0);
        if (elapsed < AUTO_REFRESH_COOLDOWN_MS) {
          return latestPortalDataRef.current;
        }
        lastAutoRefreshAtRef.current = now;
      }

      const loadId = activeLoadIdRef.current + 1;
      activeLoadIdRef.current = loadId;
      refreshInFlightRef.current = true;

      if (!options.silent) setError("");

      try {
        const overviewData = await loadOverviewData(student, {
          keepError: true,
        });

        if (!mountedRef.current || activeLoadIdRef.current !== loadId) {
          return overviewData;
        }

        const fullData = await loadPortalData(student, {
          keepError: true,
          merge: true,
        });

        if (mountedRef.current && activeLoadIdRef.current === loadId) {
          void loadLinkedAccount(student, {
            save: true,
            mode: sessionMode,
          });
        }

        return fullData;
      } finally {
        if (activeLoadIdRef.current === loadId) {
          refreshInFlightRef.current = false;
        }
      }
    },
    [
      loadLinkedAccount,
      loadOverviewData,
      loadPortalData,
      sessionMode,
      student,
    ]
  );

  useEffect(() => {
    if (!student?.id) return undefined;

    const handleFocusRefresh = () => {
      if (document.visibilityState === "hidden") return;
      handleRefresh({ auto: true, silent: true });
    };

    window.addEventListener("focus", handleFocusRefresh);
    document.addEventListener("visibilitychange", handleFocusRefresh);

    return () => {
      window.removeEventListener("focus", handleFocusRefresh);
      document.removeEventListener("visibilitychange", handleFocusRefresh);
    };
  }, [handleRefresh, student?.id]);

  useEffect(() => {
    if (!student?.id) return undefined;

    const studentId = String(student.id || student.student_id || "").trim();
    if (!studentId) return undefined;

    const studentType =
      student.student_type || student.__leadType || student.type || "inquiry";

    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
      }

      realtimeRefreshTimerRef.current = window.setTimeout(() => {
        realtimeRefreshTimerRef.current = null;
        handleRefresh({ auto: true, silent: true });
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    };

    const channel = supabase.channel(
      `student-os-bridge-${studentType}-${studentId}`
    );

    STUDENT_REALTIME_TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `student_id=eq.${studentId}`,
        },
        scheduleRealtimeRefresh
      );
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info("Student OS bridge connected", {
          studentId,
          studentType,
          tables: STUDENT_REALTIME_TABLES.length,
        });
      }
    });

    return () => {
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [
    handleRefresh,
    student?.id,
    student?.student_type,
    student?.__leadType,
    student?.type,
  ]);
  async function handlePasswordChange({ currentPassword, newPassword }) {
  if (!account?.id && !account?.account_id) {
    return {
      success: false,
      message: "Portal account not found.",
    };
  }

  const result = await changeStudentPortalPassword({
    accountId: account.id || account.account_id,
    currentPassword,
    newPassword,
  });

  if (result.success) {
    const updatedAccount = {
      ...account,
      must_change_password: false,
      password_changed_at: result.password_changed_at,
    };

    setAccount(updatedAccount);

    saveSession({
      nextAccount: updatedAccount,
      nextStudent: student,
      mode: sessionMode,
    });
  }

  return result;
}
  function handleLogout() {
    

    clearSession();

    setEmail("");
    setPassword("");
    setIdentifier("");
    setStudent(null);
    setAccount(null);
    setSessionMode("legacy");
    setMatchingStudents([]);
    setPortalData(EMPTY_PORTAL_DATA);
    setLoading(false);
    setLegacyLoading(false);
    setLoadingData(false);
    setRestoringSession(false);
    setError("");
  }

  if (restoringSession) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f8fa] px-5 py-20 text-slate-950">
        <div className="pointer-events-none absolute -left-28 -top-28 h-[420px] w-[420px] rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-[-8%] h-[460px] w-[460px] rounded-full bg-amber-100/70 blur-3xl" />

        <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-orange-200/80 bg-white/95 p-8 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-orange-100 blur-3xl" />

          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-3xl shadow-sm">
            🎓
          </div>

          <p className="relative mt-6 text-xs font-black uppercase tracking-[0.32em] text-orange-600">
            Zaifan Student OS
          </p>

          <h1 className="relative mt-3 text-3xl font-black tracking-tight text-slate-950">
            Restoring Your Student Workspace
          </h1>

          <p className="relative mt-3 text-sm leading-6 text-slate-500">
            Reconnecting your secure portal session and preparing your latest applications,
            documents, tasks, payments, support and study journey.
          </p>

          <div className="relative mt-7 overflow-hidden rounded-full bg-slate-100 p-1">
            <div className="h-2 w-1/2 animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-600" />
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-2">
            <PortalRestoreStep label="Session" />
            <PortalRestoreStep label="Student data" />
            <PortalRestoreStep label="Workspace" />
          </div>
        </div>
      </section>
    );
  }

  if (!hasStudent) {
    return (
      <Suspense fallback={<StudentPortalSurfaceLoader label="Opening secure student access" />}>
        <StudentPortalAuth
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          identifier={identifier}
          setIdentifier={setIdentifier}
          loading={loading}
          legacyLoading={legacyLoading}
          error={error}
          matches={matchingStudents}
          onSelectMatch={handleSelectMatch}
          onSubmit={handleAccountLogin}
          onLegacySubmit={handleLegacyLookup}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<StudentPortalSurfaceLoader label="Opening your Student OS" />}>
      <StudentPortalDashboard
        account={account}
        student={student}
        portalData={portalData}
        loadingData={loadingData}
        error={error}
        sessionMode={sessionMode}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
        onPasswordChange={handlePasswordChange}
      />
    </Suspense>
  );
}

export default StudentPortalPage;