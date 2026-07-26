// AdminLogin V5 — Unified Zaifan Portal Login
// src/components/admin/AdminLogin.jsx
//
// ASSET:
// src/assets/images/admin/admin-login-workspace.png
//
// Unified with the approved Counselor login visual system while preserving:
// - controlled email/password props
// - handleLogin API
// - session email memory
// - validation
// - Caps Lock detection
// - show/hide password
// - submit/error handling
// - reduced-motion support

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import adminLoginMascot from "../../assets/images/admin/admin-login-workspace.png";

const EMAIL_MEMORY_KEY = "zaifan-admin-login-email";

function AdminLogin({
  email,
  password,
  setEmail,
  setPassword,
  handleLogin,
  inputClass = "",
}) {
  const shouldReduceMotion = useReducedMotion();
  const passwordRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  useEffect(() => {
    try {
      const remembered = window.sessionStorage.getItem(EMAIL_MEMORY_KEY);

      if (!email && remembered && typeof setEmail === "function") {
        setEmail(remembered);
      }
    } catch {
      // Session storage is optional.
    }
  }, [email, setEmail]);

  useEffect(() => {
    if (!submitMessage) return undefined;

    const timer = window.setTimeout(() => {
      setSubmitMessage(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [submitMessage]);

  const emailLooksValid = useMemo(() => {
    const value = String(email || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, [email]);

  const passwordReady = String(password || "").length > 0;
  const formReady = emailLooksValid && passwordReady && !submitting;

  const handleCapsLock = (event) => {
    if (typeof event.getModifierState === "function") {
      setCapsLockOn(event.getModifierState("CapsLock"));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!emailLooksValid) {
      setSubmitMessage({
        type: "error",
        text: "Enter a valid Admin email address.",
      });
      return;
    }

    if (!passwordReady) {
      setSubmitMessage({
        type: "error",
        text: "Enter your Admin password.",
      });
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      if (rememberEmail) {
        try {
          window.sessionStorage.setItem(
            EMAIL_MEMORY_KEY,
            String(email || "").trim()
          );
        } catch {
          // Session storage is optional.
        }
      } else {
        try {
          window.sessionStorage.removeItem(EMAIL_MEMORY_KEY);
        } catch {
          // Session storage is optional.
        }
      }

      await Promise.resolve(
        handleLogin?.({
          preventDefault: () => {},
          currentTarget: event.currentTarget,
          target: event.target,
          type: event.type,
          nativeEvent: event.nativeEvent,
        })
      );
    } catch (error) {
      console.error("Admin login failed:", error);

      setSubmitMessage({
        type: "error",
        text:
          error?.message ||
          "Admin sign-in failed. Check your credentials and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fff5e9] text-[#0b2b4b]">
      <WarmBackground shouldReduceMotion={shouldReduceMotion} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1680px] items-center px-3 py-4 sm:px-5 lg:px-7 lg:py-6">
        <div className="grid w-full overflow-hidden rounded-[2.1rem] border border-[#e8c49f] bg-[#fffaf4] shadow-[0_32px_95px_rgba(39,67,91,0.13)] lg:min-h-[820px] lg:grid-cols-[1.02fr_0.98fr]">
          <BrandSide shouldReduceMotion={shouldReduceMotion} />

          <section className="relative flex items-center bg-[#fffdf9] p-6 sm:p-10 lg:p-14 xl:p-16">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-bl-[8rem] bg-orange-50/80" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-tr-[9rem] bg-[#f8fbfd]/80" />

            <motion.form
              initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.42 }}
              onSubmit={handleSubmit}
              className="relative mx-auto w-full max-w-[580px]"
              noValidate
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.19em] text-orange-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-orange-300 bg-white">
                  <LockKeyhole size={11} />
                </span>
                Secure Admin Access
              </div>

              <div className="mt-6">
                <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.035em] text-[#0d2c4b] sm:text-5xl">
                  Admin Portal
                  <span className="block text-orange-600">Login</span>
                </h1>

                <div className="mt-4 h-1 w-16 rounded-full bg-orange-500" />

                <p className="mt-6 max-w-lg text-sm leading-7 text-[#5d7284] sm:text-base">
                  Access students, applications, operations, analytics and team
                  controls from one secure Zaifan Admin workspace.
                </p>
              </div>

              {submitMessage ? (
                <div className="mt-6">
                  <LoginMessage
                    type={submitMessage.type}
                    text={submitMessage.text}
                    onClose={() => setSubmitMessage(null)}
                  />
                </div>
              ) : null}

              <div className="mt-9 space-y-6">
                <label className="block" htmlFor="zaifan-admin-email">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#183b59]">
                    Admin Email
                  </span>

                  <div className="relative mt-2">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"
                    />

                    <input
                      id="zaifan-admin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="admin@zaifanconsultancy.com"
                      value={email}
                      onChange={(event) => {
                        setEmail?.(event.target.value);
                        if (submitMessage) setSubmitMessage(null);
                      }}
                      disabled={submitting}
                      aria-invalid={Boolean(email) && !emailLooksValid}
                      className={`w-full rounded-2xl border border-[#dfc4a6] bg-white px-12 py-4 pr-12 text-sm font-semibold text-[#0b2b4b] outline-none transition duration-200 placeholder:font-medium placeholder:text-[#9aa7b2] focus:border-orange-500 focus:ring-4 focus:ring-orange-100/80 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                    />

                    {emailLooksValid ? (
                      <Check
                        size={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600"
                      />
                    ) : null}
                  </div>

                  {email && !emailLooksValid ? (
                    <p className="mt-2 text-xs font-bold text-rose-700">
                      Enter a complete email address.
                    </p>
                  ) : null}
                </label>

                <label className="block" htmlFor="zaifan-admin-password">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#183b59]">
                      Password
                    </span>

                    {capsLockOn ? (
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                        Caps Lock on
                      </span>
                    ) : null}
                  </div>

                  <div className="relative mt-2">
                    <KeyRound
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"
                    />

                    <input
                      ref={passwordRef}
                      id="zaifan-admin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your secure password"
                      value={password}
                      onChange={(event) => {
                        setPassword?.(event.target.value);
                        if (submitMessage) setSubmitMessage(null);
                      }}
                      onKeyDown={handleCapsLock}
                      onKeyUp={handleCapsLock}
                      disabled={submitting}
                      className={`w-full rounded-2xl border border-[#dfc4a6] bg-white px-12 py-4 pr-24 text-sm font-semibold text-[#0b2b4b] outline-none transition duration-200 placeholder:font-medium placeholder:text-[#9aa7b2] focus:border-orange-500 focus:ring-4 focus:ring-orange-100/80 disabled:cursor-not-allowed disabled:opacity-60 ${inputClass}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={submitting}
                      className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl border border-[#ead0b3] bg-[#fffaf4] px-3 py-2 text-[11px] font-black text-[#35536b] transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:opacity-50"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span className="hidden sm:inline">
                        {showPassword ? "Hide" : "Show"}
                      </span>
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
                    disabled={submitting}
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

              <motion.button
                type="submit"
                disabled={!formReady}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                className="group mt-7 flex w-full items-center justify-between rounded-2xl border border-orange-600 bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-sm font-black text-white shadow-[0_16px_35px_rgba(234,88,12,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(234,88,12,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
              >
                <span className="flex items-center gap-3">
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <ShieldCheck size={17} />
                  )}

                  {submitting ? "Opening Admin OS..." : "Sign In to Admin OS"}
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-white/10 text-lg transition group-hover:translate-x-0.5">
                  <ArrowRight size={17} />
                </span>
              </motion.button>

              <div className="mt-7 rounded-[1.5rem] border border-[#ead0b3] bg-[#fff8ef] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-200 bg-white text-orange-600">
                    <ShieldCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#123250]">
                      Private. Secure. Admin Approved.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#687c8d]">
                      Only authorized administrators can access sensitive Zaifan
                      operations. Your existing authentication flow remains unchanged.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-center text-xs font-semibold text-[#82909b]">
                Zaifan Consultancy · Admin Operations System
              </p>
            </motion.form>
          </section>
        </div>
      </div>
    </main>
  );
}

function BrandSide({ shouldReduceMotion }) {
  const features = [
    {
      Icon: UsersRound,
      short: "S",
      top: "Student",
      bottom: "Management",
    },
    {
      Icon: Workflow,
      short: "A",
      top: "Application",
      bottom: "Tracking",
    },
    {
      Icon: ShieldCheck,
      short: "O",
      top: "Operations",
      bottom: "Control",
    },
    {
      Icon: BarChart3,
      short: "R",
      top: "Reports &",
      bottom: "Analytics",
    },
  ];

  return (
    <motion.aside
      initial={shouldReduceMotion ? false : { opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
      className="relative isolate flex min-h-[780px] flex-col overflow-hidden border-b border-[#efd4b6] bg-[linear-gradient(145deg,#fff2e1_0%,#fff8ef_49%,#ffe7cd_100%)] px-6 pb-5 pt-6 sm:px-9 sm:pt-8 lg:min-h-0 lg:border-b-0 lg:border-r lg:px-11 lg:pt-9"
    >
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
          Admin OS
        </span>
      </div>

      <div className="relative z-20 mt-8 max-w-xl sm:mt-10">
        <p className="font-serif text-3xl italic text-orange-600 sm:text-4xl">
          Welcome back,
        </p>

        <h2 className="mt-1 text-5xl font-black leading-[0.92] tracking-[-0.045em] text-[#102f4d] sm:text-6xl lg:text-[4.8rem]">
          Admin.
        </h2>

        <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#526d82] sm:text-base">
          Sign in to your secure command workspace and keep Zaifan operations
          moving with control, clarity and confidence.
        </p>
      </div>

      <div className="relative z-10 mt-auto flex min-h-[430px] items-end justify-center overflow-visible pt-4 sm:min-h-[490px] lg:min-h-[520px]">
        <div className="pointer-events-none absolute bottom-[4%] left-1/2 h-[23rem] w-[30rem] -translate-x-1/2 rounded-[50%] bg-orange-300/12 blur-3xl" />

        <motion.img
          src={adminLoginMascot}
          alt="Zaifan Admin workspace"
          draggable="false"
          decoding="async"
          fetchPriority="high"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -4, 0],
                }
          }
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 -mb-5 block w-[136%] max-w-none object-contain object-bottom drop-shadow-[0_30px_38px_rgba(74,43,20,0.18)] sm:-mb-7 sm:w-[132%] lg:-mb-8 lg:w-[128%]"
        />
      </div>

      <div className="relative z-20 mt-3 grid grid-cols-2 gap-2 rounded-[1.6rem] border border-[#ebc69e] bg-white/84 p-3 shadow-[0_16px_40px_rgba(62,78,91,0.09)] backdrop-blur-md sm:grid-cols-4 sm:gap-3 sm:p-4">
        {features.map(({ Icon, short, top, bottom }) => (
          <div
            key={`${top}-${bottom}`}
            className="group rounded-2xl px-2 py-3 text-center transition duration-300 hover:bg-orange-50"
          >
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600 transition group-hover:border-orange-300 group-hover:bg-white">
              <Icon size={15} className="hidden sm:block" />
              <span className="text-sm font-black sm:hidden">{short}</span>
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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-600">
          <ShieldCheck size={16} />
        </div>

        <div>
          <p className="font-black text-[#123250]">
            Protected by Zaifan Security Layer
          </p>
          <p className="mt-0.5 text-[11px] text-[#718496]">
            Your Admin workspace remains private, authenticated and controlled.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

function LoginMessage({ type = "error", text, onClose }) {
  const isError = type === "error";

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 ${
        isError
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        {isError ? (
          <LockKeyhole size={16} className="mt-0.5 shrink-0" />
        ) : (
          <Check size={16} className="mt-0.5 shrink-0" />
        )}

        <p className="text-sm font-bold leading-6">{text}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function WarmBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-orange-200/35 blur-3xl" />
      <div className="absolute -right-36 bottom-0 h-[36rem] w-[36rem] rounded-full bg-[#dcebf3]/60 blur-3xl" />
    </div>
  );
}

export default AdminLogin;
