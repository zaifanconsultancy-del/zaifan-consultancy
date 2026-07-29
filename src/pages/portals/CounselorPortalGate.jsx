import React, { lazy, Suspense, useEffect, useState } from "react";
import useCounselorAuth from "../../hooks/useCounselorAuth";
import loadingLogo from "../../assets/images/brand/loading-logo.webp";
import counselorLoginMascot from "../../assets/images/counselor/counselor-login-workspace.png";

const CounselorPortalPage = lazy(() => import("./CounselorPortalPage"));

const COUNSELOR_EMAIL_MEMORY_KEY = "zaifan-counselor-login-email";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
        <img
          src={loadingLogo}
          alt="Zaifan Consultancy"
          className="h-9 w-9 object-contain"
          decoding="async"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
          Zaifan Consultancy
        </p>
        <p className="mt-0.5 text-sm font-black text-white">Counselor OS</p>
      </div>
    </div>
  );
}

function LaunchStep({ index, title, detail, active = false, complete = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition duration-300 ${
        active
          ? "border-orange-300/50 bg-orange-400/10"
          : complete
            ? "border-emerald-300/25 bg-emerald-400/10"
            : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            active
              ? "bg-orange-500 text-white"
              : complete
                ? "bg-emerald-400 text-[#102b4c]"
                : "bg-white/10 text-white/65"
          }`}
        >
          {complete ? "✓" : index}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function AuthLoader({
  title = "Opening Counselor workspace",
  detail = "Verifying your session and preparing Counselor OS.",
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
            Zaifan Counselor OS
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

function LoginPanel({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  authError,
  verifying,
  onSubmit,
}) {
  const [rememberEmail, setRememberEmail] = useState(true);

  useEffect(() => {
    try {
      const remembered = window.sessionStorage.getItem(COUNSELOR_EMAIL_MEMORY_KEY);

      if (!email && remembered) {
        setEmail(remembered);
      }
    } catch {
      // Session storage is optional.
    }
  }, [email, setEmail]);

  const handleLoginSubmit = (event) => {
    try {
      if (rememberEmail) {
        window.sessionStorage.setItem(
          COUNSELOR_EMAIL_MEMORY_KEY,
          String(email || "").trim()
        );
      } else {
        window.sessionStorage.removeItem(COUNSELOR_EMAIL_MEMORY_KEY);
      }
    } catch {
      // Session storage is optional.
    }

    return onSubmit(event);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fff5e9] text-[#0b2b4b]">
      <div className="pointer-events-none absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-orange-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 bottom-0 h-[36rem] w-[36rem] rounded-full bg-[#dcebf3]/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1680px] items-center px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
        <div className="grid w-full overflow-hidden rounded-[2.1rem] border border-[#e8c49f] bg-[#fffaf4] shadow-[0_32px_95px_rgba(39,67,91,0.13)] lg:min-h-[900px] lg:grid-cols-[1.02fr_0.98fr]">

          {/* LEFT — counselor story / mascot world */}
          <section className="relative isolate flex min-h-[780px] flex-col overflow-hidden border-b border-[#efd4b6] bg-[linear-gradient(145deg,#fff2e1_0%,#fff8ef_49%,#ffe7cd_100%)] px-6 pb-5 pt-6 sm:px-9 sm:pt-8 lg:min-h-0 lg:border-b-0 lg:border-r lg:px-11 lg:pt-9">

            <div className="relative z-20 flex items-center justify-between gap-4">
              <div>
                <p className="text-xl font-black tracking-[0.22em] text-[#102f4d] sm:text-2xl">
                  ZAIFAN
                </p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.36em] text-orange-600">
                  Consultancy
                </p>
              </div>

              <span className="rounded-full border border-orange-200 bg-white/75 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 backdrop-blur">
                Counselor OS
              </span>
            </div>

            <div className="relative z-20 mt-8 max-w-xl sm:mt-10">
              <p className="font-serif text-3xl italic text-orange-600 sm:text-4xl">
                Welcome back,
              </p>

              <h1 className="mt-1 text-5xl font-black leading-[0.92] tracking-[-0.045em] text-[#102f4d] sm:text-6xl lg:text-[4.8rem]">
                Counselor.
              </h1>

              <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#526d82] sm:text-base">
                Sign in to your secure workspace and continue guiding students
                toward their next big milestone.
              </p>
            </div>

            {/* Counselor artwork — large 900×721 transparent WebP, no artificial globe/circle */}
            <div className="relative z-10 mt-auto flex min-h-[430px] items-end justify-center overflow-visible pt-4 sm:min-h-[490px] lg:min-h-[520px]">
              <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-[23rem] w-[30rem] -translate-x-1/2 rounded-[50%] bg-orange-300/12 blur-3xl" />

              <img
                src={counselorLoginMascot}
                alt="Zaifan counselor workspace"
                className="relative z-10 -mb-5 block w-[136%] max-w-none object-contain object-bottom drop-shadow-[0_30px_38px_rgba(74,43,20,0.18)] sm:-mb-7 sm:w-[132%] lg:-mb-8 lg:w-[128%]"
                decoding="async"
                fetchPriority="high"
              />
            </div>

            <div className="relative z-20 mt-3 grid grid-cols-2 gap-2 rounded-[1.6rem] border border-[#ebc69e] bg-white/84 p-3 shadow-[0_16px_40px_rgba(62,78,91,0.09)] backdrop-blur-md sm:grid-cols-4 sm:gap-3 sm:p-4">
              {[
                ["A", "Assigned", "Students"],
                ["P", "Application", "Tracking"],
                ["T", "Task", "Management"],
                ["C", "Communication", "Hub"],
              ].map(([icon, top, bottom]) => (
                <div
                  key={`${top}-${bottom}`}
                  className="rounded-2xl px-2 py-3 text-center transition duration-300 hover:bg-orange-50"
                >
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-sm font-black text-orange-600">
                    {icon}
                  </div>

                  <p className="text-xs font-black leading-4 text-[#123250]">
                    {top}
                    <br />
                    {bottom}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative z-20 mt-4 flex items-center gap-3 text-xs font-semibold text-[#526d82]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 font-black text-orange-600">
                ✓
              </div>

              <div>
                <p className="font-black text-[#123250]">
                  Protected by Zaifan Security Layer
                </p>
                <p className="mt-0.5 text-[11px] text-[#718496]">
                  Your counselor workspace remains private, scoped and authenticated.
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT — real Supabase login */}
          <section className="relative flex items-center bg-[#fffdf9] p-6 sm:p-10 lg:p-14 xl:p-16">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-bl-[8rem] bg-orange-50/80" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-tr-[9rem] bg-[#f8fbfd]/80" />

            <form onSubmit={handleLoginSubmit} className="relative mx-auto w-full max-w-[580px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.19em] text-orange-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-300 bg-white">
                  ✓
                </span>
                Secure Counselor Access
              </div>

              <div className="mt-9">
                <h2 className="text-4xl font-black leading-[1.02] tracking-[-0.035em] text-[#0d2c4b] sm:text-5xl">
                  Counselor Portal
                  <span className="block text-orange-600">Login</span>
                </h2>
                <div className="mt-4 h-1 w-16 rounded-full bg-orange-500" />
                <p className="mt-6 max-w-lg text-sm leading-7 text-[#5d7284] sm:text-base">
                  Access your assigned students, tasks, applications, communication,
                  documents and counselor operations in one secure place.
                </p>
              </div>

              {authError ? (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-800"
                >
                  {authError}
                </div>
              ) : null}

              <div className="mt-9 space-y-6">
                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#183b59]">
                    Counselor Email
                  </span>

                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-orange-500">
                      ✉
                    </span>

                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="counselor@zaifanconsultancy.com"
                      disabled={verifying}
                      required
                      className="w-full rounded-2xl border border-[#dfc4a6] bg-white px-12 py-4 text-sm font-semibold text-[#0b2b4b] outline-none transition duration-200 placeholder:font-medium placeholder:text-[#9aa7b2] focus:border-orange-500 focus:ring-4 focus:ring-orange-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#183b59]">
                    Password
                  </span>

                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-orange-500">
                      ▣
                    </span>

                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      disabled={verifying}
                      required
                      className="w-full rounded-2xl border border-[#dfc4a6] bg-white px-12 py-4 pr-24 text-sm font-semibold text-[#0b2b4b] outline-none transition duration-200 placeholder:font-medium placeholder:text-[#9aa7b2] focus:border-orange-500 focus:ring-4 focus:ring-orange-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={verifying}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl border border-[#ead0b3] bg-[#fffaf4] px-3 py-2 text-[11px] font-black text-[#35536b] transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(event) => setRememberEmail(event.target.checked)}
                    disabled={verifying}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span className="text-xs font-semibold text-[#718496]">
                    Remember email this session
                  </span>
                </label>

                <span className="text-xs font-black text-orange-600">
                  Supabase protected
                </span>
              </div>

              <button
                type="submit"
                disabled={verifying || !email.trim() || !password}
                className="group mt-7 flex w-full items-center justify-between rounded-2xl border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-sm font-black text-white shadow-[0_16px_35px_rgba(234,88,12,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(234,88,12,0.28)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                <span>
                  {verifying ? "Verifying Counselor Access..." : "Sign In to Counselor OS"}
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/10 text-lg transition group-hover:translate-x-0.5">
                  →
                </span>
              </button>

              <div className="mt-7 rounded-[1.5rem] border border-[#ead0b3] bg-[#fff8ef] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-white text-lg font-black text-orange-600">
                    ✓
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#123250]">
                      Private. Secure. Counselor Approved.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#687c8d]">
                      Only authorized counselors can access assigned student data.
                      Your existing Supabase authentication and role verification remain unchanged.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-xs font-semibold text-[#82909b]">
                Zaifan Consultancy · Counselor Operations System
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function UnauthorizedPanel({
  user,
  authError,
  authorizationSource,
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
            This account is not verified as a counselor.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#607487]">
            You are signed in{user?.email ? ` as ${user.email}` : ""}, but the account
            does not currently pass the Counselor Portal authorization check.
          </p>

          {authError ? (
            <div className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-800">
              {authError}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-[#d8b892] bg-[#fff7ea] p-4 text-xs leading-5 text-[#6d6258]">
            Verification source: <strong>{authorizationSource || "not verified"}</strong>.
            The recommended production setup is server-controlled Supabase
            <strong> app_metadata.role = "counselor"</strong>, optionally enriched by a
            <strong> counselor_profiles</strong> row.
          </div>

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

  if (!auth.sessionChecked) {
    return (
      <AuthLoader
        phase="session"
        title="Starting secure session"
        detail="Zaifan is confirming your Supabase session before checking Counselor OS access."
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
        showPassword={auth.showPassword}
        setShowPassword={auth.setShowPassword}
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
        title="Verifying counselor access"
        detail="Your Supabase session is valid. Zaifan is confirming counselor authorization and preparing your scoped workspace."
      />
    );
  }

  if (!auth.isCounselor || !auth.counselorProfile) {
    return (
      <UnauthorizedPanel
        user={auth.user}
        authError={auth.authError}
        authorizationSource={auth.authorizationSource}
        verifying={auth.verifying}
        onRetry={auth.retryAuthorization}
        onLogout={auth.logout}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <AuthLoader
          phase="workspace"
          title="Opening Counselor Command Workspace"
          detail="Access is verified. Zaifan is loading the counselor dashboard and assigned operational modules."
        />
      }
    >
      <CounselorPortalPage
        counselorProfile={auth.counselorProfile}
        onLogout={auth.logout}
      />
    </Suspense>
  );
}
