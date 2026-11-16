import { lazy, Suspense, useEffect, useState } from "react";
import { KeyRound, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import useCounselorAuth from "../../hooks/useCounselorAuth";
import loadingLogo from "../../assets/images/brand/loading-logo.webp";
import {
  LoginAlert,
  LoginButton,
  LoginField,
  PasswordField,
  PortalLoginFrame,
  RememberEmail,
} from "../../components/portal-login/PortalLoginKit";
import { isEmail } from "../../components/portal-login/portalLoginUtils";

const CounselorApp = lazy(() => import("../../portals/admin/CounselorApp"));

const COUNSELOR_EMAIL_MEMORY_KEY = "zaifan-counselor-login-email";

function AuthLoader({
  title = "Opening your desk",
  detail = "Checking your login…",
  phase = "session",
}) {
  const phaseLabel =
    phase === "session"
      ? "Checking secure session"
      : phase === "permissions"
        ? "Verifying counselor access"
        : "Opening counselor workspace";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF8EF] px-6 text-[#10233F]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF5A0A]/[0.045] blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-[430px] flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-[#FF5A0A]/20 bg-white shadow-[0_18px_55px_rgba(16,35,63,0.08)]">
          <div className="absolute h-12 w-12 animate-spin rounded-full border-[3px] border-[#123865]/10 border-t-[#FF5A0A]" />
          <img
            src={loadingLogo}
            alt=""
            aria-hidden="true"
            className="relative h-7 w-7 object-contain"
            decoding="async"
          />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#123865]/10 bg-white/80 px-3.5 py-1.5 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF5A0A]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#123865]/70">
            Zaifan Counselor
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-[#10233F]">
          {title}
        </h1>

        <p className="mt-2 max-w-[350px] text-sm font-medium leading-6 text-[#58708D]">
          {detail}
        </p>

        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#123865]/45">
          {phaseLabel}
        </p>
      </div>
    </main>
  );
}

/** Simple sign-in card for counselors. */
function LoginPanel({ email, setEmail, password, setPassword, authError, verifying, onSubmit }) {
  const [rememberEmail, setRememberEmail] = useState(true);
  const [dismissedError, setDismissedError] = useState("");

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(COUNSELOR_EMAIL_MEMORY_KEY);
      if (!email && remembered) {
        setEmail(remembered);
      }
    } catch {
      // Storage is optional.
    }
    // Only on first load: re-running would refill the field if the counselor clears it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleError = authError && authError !== dismissedError ? authError : "";
  const emailValid = isEmail(email);

  const handleLoginSubmit = (event) => {
    setDismissedError("");

    try {
      if (rememberEmail) {
        window.localStorage.setItem(COUNSELOR_EMAIL_MEMORY_KEY, String(email || "").trim());
      } else {
        window.localStorage.removeItem(COUNSELOR_EMAIL_MEMORY_KEY);
      }
    } catch {
      // Storage is optional.
    }

    return onSubmit(event);
  };

  return (
    <PortalLoginFrame
      portal="counselor"
      title="Welcome back"
      subtitle="Sign in to see your students and today's tasks."
      footer="Can't sign in? Ask a Zaifan admin to check your access or reset your password."
    >
      <form onSubmit={handleLoginSubmit} className="mt-6">
        {visibleError ? (
          <div className="mb-5">
            <LoginAlert onClose={() => setDismissedError(authError)}>{visibleError}</LoginAlert>
          </div>
        ) : null}

        <div className="space-y-4">
          <LoginField
            id="zaifan-counselor-email"
            label="Email"
            icon={Mail}
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@zaifanconsultancy.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={verifying}
            valid={emailValid}
            required
          />

          <PasswordField
            id="zaifan-counselor-password"
            icon={LockKeyhole}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={verifying}
          />
        </div>

        <div className="mt-4">
          <RememberEmail checked={rememberEmail} onChange={setRememberEmail} disabled={verifying} />
        </div>

        <div className="mt-6">
          <LoginButton
            label="Sign in"
            busyLabel="Signing in…"
            busy={verifying}
            disabled={!email.trim() || !password}
          />
        </div>
      </form>
    </PortalLoginFrame>
  );
}

function UnauthorizedPanel({
  user,
  authError,
  verifying,
  onRetry,
  onLogout,
}) {
  return (
    <main className="min-h-screen bg-[#fff4e8] px-4 py-10 text-[#071d43] sm:px-6">
      <div className="mx-auto flex min-h-[75vh] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[2rem] border-2 border-[#17324d] bg-[#fffdf8] p-7 shadow-[0_24px_80px_rgba(23,50,77,0.13)] sm:p-10">
          <span className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">
            Access Denied
          </span>

          <h1 className="mt-4 text-3xl font-black sm:text-4xl">
            This login is not on the counselor list.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607487]">
            You are signed in{user?.email ? ` as ${user.email}` : ""}, but this account
            is not set up as a Zaifan counselor. Ask an admin to add you.
          </p>

          {authError ? (
            <div className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
              {authError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRetry}
              disabled={verifying}
              className="rounded-2xl border-2 border-orange-600 bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {verifying ? "Checking..." : "Retry Verification"}
            </button>

            <button
              type="button"
              onClick={onLogout}
              disabled={verifying}
              className="rounded-2xl border-2 border-[#17324d] bg-[#17324d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0d2740] disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CounselorPortalGate() {
  const auth = useCounselorAuth();
  const [passwordDone, setPasswordDone] = useState(false);

  if (!auth.sessionChecked) {
    return (
      <AuthLoader
        phase="session"
        title="Opening your desk"
        detail="Checking your login…"
      />
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <LoginPanel
        email={auth.email}
        setEmail={auth.setEmail}
        password={auth.password}
        setPassword={auth.setPassword}
        authError={auth.authError}
        verifying={auth.verifying}
        onSubmit={auth.login}
      />
    );
  }

  if (auth.verifying || !auth.authorizationChecked) {
    return (
      <AuthLoader
        phase="permissions"
        title="Almost there"
        detail="Checking that this account is a Zaifan counselor…"
      />
    );
  }

  if (!auth.isCounselor || !auth.counselorProfile) {
    return (
      <UnauthorizedPanel
        user={auth.user}
        authError={auth.authError}
        verifying={auth.verifying}
        onRetry={auth.retryAuthorization}
        onLogout={auth.logout}
      />
    );
  }

  // New counselors (and password resets) log in with a temporary password.
  if (auth.user?.user_metadata?.must_change_password && !passwordDone) {
    return <ChoosePasswordPanel key={auth.user.id} onDone={() => setPasswordDone(true)} name={auth.counselorProfile.full_name || auth.user.user_metadata.full_name} onLogout={auth.logout} />;
  }

  return (
    <Suspense
      fallback={
        <AuthLoader
          phase="workspace"
          title="Loading your students"
          detail="One moment…"
        />
      }
    >
      <CounselorApp
        counselorProfile={auth.counselorProfile}
        onLogout={auth.logout}
      />
    </Suspense>
  );
}

function ChoosePasswordPanel({ name, onLogout, onDone }) {
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
    const { error: updateError } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    setBusy(false);
    if (updateError) {
      setError(/different from the old/i.test(updateError.message) ? "Please choose a password that is different from the one we emailed you." : updateError.message);
      return;
    }
    // The session refreshes with the new details and the portal opens.
    await supabase.auth.refreshSession();
    onDone();
  };

  return (
    <PortalLoginFrame
      portal="counselor"
      title={name ? `Hi ${String(name).split(" ")[0]}, choose your own password` : "Choose your own password"}
      subtitle="The password in your email was temporary. Pick one only you know. You will use it from now on."
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
          <PasswordField id="zaifan-counselor-new-password" icon={KeyRound} label="New password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          <PasswordField id="zaifan-counselor-new-password-2" icon={KeyRound} label="Type it again" placeholder="Same password" value={again} onChange={(event) => setAgain(event.target.value)} disabled={busy} />
        </div>
        <div className="mt-6">
          <LoginButton label="Save and open my desk" busyLabel="Saving…" busy={busy} disabled={!password || !again} />
        </div>
      </form>
    </PortalLoginFrame>
  );
}
