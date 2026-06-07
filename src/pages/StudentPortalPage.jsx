import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StudentPortalAuth from "../components/student/StudentPortalAuth";
import StudentPortalDashboard from "../components/student/StudentPortalDashboard";
import {
  fetchStudentPortalAccountForStudent,
  fetchStudentPortalData,
  fetchStudentPortalOverview,
  findStudentsForPortal,
  loginStudentPortalAccount,
  changeStudentPortalPassword,
} from "../lib/studentPortal";

const SESSION_KEY = "zaifan_student_portal_session_v2";

const EMPTY_PORTAL_DATA = {
  applications: [],
  documents: [],
  tasks: [],
  communications: [],
  timeline: [],
  universities: [],
  counts: {
    applications: 0,
    documents: 0,
    tasks: 0,
    communications: 0,
    timeline: 0,
    universities: 0,
    total: 0,
  },
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

  const counts = {
    applications: getFirstCount(candidates, "applications", applications.length),
    documents: getFirstCount(candidates, "documents", documents.length),
    tasks: getFirstCount(candidates, "tasks", tasks.length),
    communications: getFirstCount(candidates, "communications", communications.length),
    timeline: getFirstCount(candidates, "timeline", timeline.length),
    universities: getFirstCount(candidates, "universities", universities.length),
  };

  counts.total =
    counts.applications +
    counts.documents +
    counts.tasks +
    counts.communications +
    counts.timeline +
    counts.universities;

  return {
    applications,
    documents,
    tasks,
    communications,
    timeline,
    universities,
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
  return {
    applications: next.applications?.length ? next.applications : previous.applications || [],
    documents: next.documents?.length ? next.documents : previous.documents || [],
    tasks: next.tasks?.length ? next.tasks : previous.tasks || [],
    communications: next.communications?.length
      ? next.communications
      : previous.communications || [],
    timeline: next.timeline?.length ? next.timeline : previous.timeline || [],
    universities: next.universities?.length ? next.universities : previous.universities || [],
    counts: next.counts || previous.counts || EMPTY_PORTAL_DATA.counts,
  };
}

function StudentPortalPage() {
  const mountedRef = useRef(false);
  const restoreStartedRef = useRef(false);
  const activeLoadIdRef = useRef(0);

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

    setPortalData(nextPortalData);

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
  setTimeout(async () => {
    await loadOverviewData(nextStudent, { keepError: true });

    setTimeout(() => {
      loadPortalData(nextStudent, { keepError: true });
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

          loadPortalData(saved.student, { keepError: true });
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
  }, [clearSession, loadLinkedAccount, loadPortalData]);

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

async function handleRefresh() {
  if (!student?.id || loadingData) return;

  await loadPortalData(student, {
    keepError: false,
  });

  loadLinkedAccount(student, {
    save: true,
    mode: sessionMode,
  });
}
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
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-5 py-20 text-white">
        <div className="absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative w-full max-w-xl rounded-[2rem] border border-[#D4AF37]/20 bg-white/[0.035] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl">
            🎓
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.32em] text-[#D4AF37]">
            Zaifan Student Portal
          </p>

          <h1 className="mt-3 text-3xl font-black text-white">Restoring Portal Session</h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            Checking saved student session and loading the latest Student OS data.
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4AF37]" />
          </div>
        </div>
      </section>
    );
  }

  if (!hasStudent) {
    return (
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
    );
  }

  return (
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
  );
}

export default StudentPortalPage;