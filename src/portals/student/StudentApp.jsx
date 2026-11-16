// Entry point for /student: sign-in → (first time) choose a password → portal.
// The student signs in with a real Supabase Auth account. Everything they see
// comes from ONE server call (student_portal_file) that only returns their own
// file.

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Hash, KeyRound, LockKeyhole, Mail } from "lucide-react";

import { LoginAlert, LoginButton, LoginField, PasswordField, PortalLoginFrame } from "../../components/portal-login/PortalLoginKit";
import { isEmail } from "../../components/portal-login/portalLoginUtils";
import { studentSupabase } from "../../lib/studentSupabase";
import { Button, Spinner, ToastProvider } from "../admin/ui/kit";

const StudentShell = lazy(() => import("./StudentShell"));

const EMAIL_KEY = "zaifan-student-login-email";

function friendlyAuthError(error) {
  const message = String(error?.message || "");
  if (/banned/i.test(message)) return "Your portal access is switched off. Please contact Zaifan.";
  if (/invalid login|invalid credentials/i.test(message)) return "That email or password is not right. Check the email Zaifan sent you.";
  if (/network|fetch/i.test(message)) return "No internet connection. Please try again.";
  return message || "We could not sign you in. Please try again.";
}

export default function StudentApp() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [file, setFile] = useState(undefined); // undefined = loading, null = not a student login
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;
    studentSupabase.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session || null);
    });
    const { data: listener } = studentSupabase.auth.onAuthStateChange((_event, next) => {
      if (alive) setSession(next || null);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id || null;

  const loadFile = useCallback(async () => {
    const { data, error } = await studentSupabase.rpc("student_portal_file");
    if (error) {
      setLoadError("Your file could not be loaded. Check your internet and try again.");
      return;
    }
    setLoadError("");
    setFile(data || null);
  }, []);

  useEffect(() => {
    if (!userId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load once the student is signed in
    loadFile();
  }, [loadFile, userId]);

  const logout = useCallback(async () => {
    await studentSupabase.auth.signOut();
    setFile(undefined);
  }, []);

  if (session === undefined) return <FullScreen text="Opening your portal…" />;
  if (!session) return <LoginScreen />;

  if (session.user?.user_metadata?.must_change_password) {
    return <ChoosePasswordScreen name={session.user.user_metadata.full_name} onLogout={logout} />;
  }

  if (loadError && file === undefined) {
    return (
      <FullScreen title="Something went wrong" text={loadError}>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="primary" onClick={loadFile}>
            Try again
          </Button>
          <Button onClick={logout}>Log out</Button>
        </div>
      </FullScreen>
    );
  }

  if (file === undefined) return <FullScreen text="Loading your file…" />;

  if (file === null) {
    return (
      <FullScreen title="This login has no student file" text={`You are signed in as ${session.user?.email || "this account"}, but there is no student file linked to it. Please contact Zaifan.`}>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="primary" onClick={logout}>
            Log out
          </Button>
          <Link to="/contact" className="inline-flex h-11 items-center rounded-2xl border border-[#071f50]/12 bg-white px-4 text-sm font-bold text-[#071f50]">
            Contact Zaifan
          </Link>
        </div>
      </FullScreen>
    );
  }

  return (
    <ToastProvider>
      <Suspense fallback={<FullScreen text="Loading your file…" />}>
        <StudentShell file={file} reload={loadFile} onLogout={logout} />
      </Suspense>
    </ToastProvider>
  );
}

function FullScreen({ title, text, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7ed] px-6 text-center text-[#071f50]">
      <div className="w-full max-w-sm">
        {title ? <h1 className="text-2xl font-black tracking-[-0.02em]">{title}</h1> : <Spinner label="" />}
        <p className="mt-2 text-[14.5px] font-medium leading-6 text-[#071f50]/60">{text}</p>
        {children}
      </div>
    </main>
  );
}

function LoginScreen() {
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState(() => {
    try {
      return window.localStorage.getItem(EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (forgot) return <ForgotPasswordScreen startEmail={email} onBack={() => setForgot(false)} />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const cleanEmail = email.trim().toLowerCase();
    const { error: signInError } = await studentSupabase.auth.signInWithPassword({ email: cleanEmail, password });
    setBusy(false);
    if (signInError) {
      setError(friendlyAuthError(signInError));
      return;
    }
    try {
      window.localStorage.setItem(EMAIL_KEY, cleanEmail);
    } catch {
      // Storage is optional.
    }
  };

  return (
    <PortalLoginFrame
      portal="student"
      title="Welcome to your portal"
      subtitle="See your applications, upload documents and follow every step of your journey."
      footer={
        <>
          No login yet? Ask your counselor or{" "}
          <Link to="/contact" className="font-bold text-[#ff4b12] underline-offset-2 hover:underline">
            contact the office
          </Link>
          .
        </>
      }
    >
      <form onSubmit={submit} className="mt-6">
        {error ? (
          <div className="mb-5">
            <LoginAlert onClose={() => setError("")}>{error}</LoginAlert>
          </div>
        ) : null}
        <div className="space-y-4">
          <LoginField
            id="zaifan-student-email"
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="The email Zaifan has for you"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            valid={isEmail(email)}
            required
          />
          <PasswordField id="zaifan-student-password" icon={LockKeyhole} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          <button type="button" onClick={() => setForgot(true)} className="-mt-1 block text-[13px] font-bold text-[#ff4b12] underline-offset-2 hover:underline">
            Forgot your password?
          </button>
        </div>
        <div className="mt-6">
          <LoginButton label="Open my portal" busyLabel="Signing in…" busy={busy} disabled={!email.trim() || !password} />
        </div>
      </form>
    </PortalLoginFrame>
  );
}

function ChoosePasswordScreen({ name, onLogout }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError("Please use at least 8 characters.");
    if (password !== again) return setError("The two passwords are not the same.");
    setError("");
    setBusy(true);
    const { error: updateError } = await studentSupabase.auth.updateUser({ password, data: { must_change_password: false } });
    setBusy(false);
    if (updateError) {
      setError(/different from the old/i.test(updateError.message) ? "Please choose a password that is different from the one we emailed you." : updateError.message);
    }
    // On success the session updates itself and the portal opens.
  };

  return (
    <PortalLoginFrame
      portal="student"
      title={name ? `Hi ${String(name).split(" ")[0]}, choose your own password` : "Choose your own password"}
      subtitle="The password we emailed was temporary. Pick one only you know. You will use it from now on."
      footer={
        <button type="button" onClick={onLogout} className="font-bold text-[#ff4b12] underline-offset-2 hover:underline">
          Log out
        </button>
      }
    >
      <form onSubmit={submit} className="mt-6">
        {error ? (
          <div className="mb-5">
            <LoginAlert onClose={() => setError("")}>{error}</LoginAlert>
          </div>
        ) : null}
        <div className="space-y-4">
          <PasswordField id="zaifan-student-new-password" icon={KeyRound} label="New password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          <PasswordField id="zaifan-student-new-password-2" icon={KeyRound} label="Type it again" placeholder="Same password" value={again} onChange={(event) => setAgain(event.target.value)} disabled={busy} />
        </div>
        <div className="mt-6">
          <LoginButton label="Save and open my portal" busyLabel="Saving…" busy={busy} disabled={!password || !again} />
        </div>
      </form>
    </PortalLoginFrame>
  );
}

/** Forgot password: email → 6-digit code by email → new password. */
function ForgotPasswordScreen({ startEmail, onBack }) {
  const [step, setStep] = useState("email"); // 'email' | 'code'
  const [email, setEmail] = useState(startEmail || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const sendCode = async (event) => {
    event?.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!isEmail(cleanEmail)) return setError("Please type the email you use for the portal.");
    setError("");
    setBusy(true);
    // The server always says OK (so nobody can test which emails exist).
    await studentSupabase.functions.invoke("student-forgot-password", { body: { email: cleanEmail } }).catch(() => null);
    setBusy(false);
    setStep("code");
    setNotice(`If ${cleanEmail} has a Zaifan portal login, a code is on its way. Check your inbox and spam folder.`);
  };

  const reset = async (event) => {
    event.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) return setError("Type the code from the email.");
    if (password.length < 8) return setError("Please use at least 8 characters for the new password.");
    if (password !== again) return setError("The two passwords are not the same.");
    setError("");
    setBusy(true);
    const { error: codeError } = await studentSupabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token, type: "recovery" });
    if (codeError) {
      setBusy(false);
      setError(/expired|invalid/i.test(codeError.message) ? "That code is wrong or has expired. Ask for a new one below." : codeError.message);
      return;
    }
    // Signed in by the code. Save the new password; if that fails, the portal asks for one again.
    const { error: saveError } = await studentSupabase.auth.updateUser({ password, data: { must_change_password: false } });
    if (saveError) await studentSupabase.auth.updateUser({ data: { must_change_password: true } });
    setBusy(false);
  };

  return (
    <PortalLoginFrame
      portal="student"
      title={step === "email" ? "Forgot your password?" : "Check your email"}
      subtitle={step === "email" ? "Type the email you use for the portal. We'll send you a code to choose a new password." : "Type the code we emailed you and choose a new password."}
      footer={
        <button type="button" onClick={onBack} className="font-bold text-[#ff4b12] underline-offset-2 hover:underline">
          ← Back to sign in
        </button>
      }
    >
      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-6">
          {error ? (
            <div className="mb-5">
              <LoginAlert onClose={() => setError("")}>{error}</LoginAlert>
            </div>
          ) : null}
          <LoginField
            id="zaifan-student-forgot-email"
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="The email Zaifan has for you"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            valid={isEmail(email)}
            required
          />
          <div className="mt-6">
            <LoginButton label="Email me a code" busyLabel="Sending…" busy={busy} disabled={!email.trim()} />
          </div>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-6">
          {notice ? <p className="mb-4 rounded-2xl bg-sky-50 px-4 py-3 text-[13px] font-semibold leading-5 text-sky-900">{notice}</p> : null}
          {error ? (
            <div className="mb-5">
              <LoginAlert onClose={() => setError("")}>{error}</LoginAlert>
            </div>
          ) : null}
          <div className="space-y-4">
            <LoginField
              id="zaifan-student-reset-code"
              label="Code from the email"
              icon={Hash}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^\d\s]/g, "").slice(0, 10))}
              disabled={busy}
              valid={code.replace(/\D/g, "").length >= 6}
              required
            />
            <PasswordField id="zaifan-student-reset-password" icon={KeyRound} label="New password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
            <PasswordField id="zaifan-student-reset-password-2" icon={KeyRound} label="Type it again" placeholder="Same password" value={again} onChange={(event) => setAgain(event.target.value)} disabled={busy} />
          </div>
          <div className="mt-6">
            <LoginButton label="Save and open my portal" busyLabel="Saving…" busy={busy} disabled={!code || !password || !again} />
          </div>
          <button type="button" onClick={sendCode} disabled={busy} className="mt-4 block w-full text-center text-[13px] font-bold text-[#071f50]/60 hover:text-[#071f50]">
            Didn't get it? Send a new code
          </button>
        </form>
      )}
    </PortalLoginFrame>
  );
}
