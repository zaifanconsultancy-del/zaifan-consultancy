// AdminLogin V4 — Mascot Command Center MAXIMUM
// src/components/admin/AdminLogin.jsx
//
// IMPORTANT ASSET PATH:
// Place the mascot image at:
// src/assets/images/admin/admin-login-mascot.webp
//
// Then this import will work:
// import adminLoginMascot from "../../assets/images/admin/admin-login-mascot.webp";
//
// Preserves the existing controlled email/password + handleLogin API.

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import adminLoginMascot from "../../assets/images/admin/admin-login-mascot.webp";

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
          // Optional.
        }
      } else {
        try {
          window.sessionStorage.removeItem(EMAIL_MEMORY_KEY);
        } catch {
          // Optional.
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

  const baseInputClass =
    "h-14 w-full rounded-[1.05rem] border-2 border-[#d8dee8] bg-white px-12 pr-12 text-sm font-bold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fffaf5] text-[#10233f]">
      <WarmBackground shouldReduceMotion={shouldReduceMotion} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1640px] items-center px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[2.35rem] border-[3px] border-orange-200 bg-white shadow-[0_34px_110px_rgba(79,48,20,0.12)] xl:grid-cols-[1.18fr_0.82fr]">
          <BrandSide shouldReduceMotion={shouldReduceMotion} />

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.42,
              delay: shouldReduceMotion ? 0 : 0.05,
            }}
            className="relative flex min-h-[720px] items-center bg-white p-5 sm:p-8 lg:p-10 xl:min-h-[820px]"
          >
            <div className="mx-auto w-full max-w-[520px]">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-200 bg-orange-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
                  <LockKeyhole size={13} />
                  Secure Admin Access
                </span>

                <span className="hidden rounded-full border-2 border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 sm:inline-flex">
                  Internal Portal
                </span>
              </div>

              <p className="mt-9 text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">
                Zaifan Consultancy
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-[#10233f] sm:text-5xl">
                Admin{" "}
                <span className="text-orange-500">
                  Login
                </span>
              </h1>

              <div className="mt-4 h-1 w-16 rounded-full bg-orange-500" />

              <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-slate-600">
                Use your authorized Admin credentials to access the Zaifan Admin OS.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5"
                noValidate
              >
                {submitMessage ? (
                  <LoginMessage
                    type={submitMessage.type}
                    text={submitMessage.text}
                    onClose={() => setSubmitMessage(null)}
                  />
                ) : null}

                <div>
                  <label
                    htmlFor="zaifan-admin-email"
                    className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-[#10233f]"
                  >
                    Admin Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-600"
                    />

                    <input
                      id="zaifan-admin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="admin@zaifan.com"
                      value={email}
                      onChange={(event) => {
                        setEmail?.(event.target.value);
                        if (submitMessage) setSubmitMessage(null);
                      }}
                      disabled={submitting}
                      aria-invalid={Boolean(email) && !emailLooksValid}
                      className={`${baseInputClass} ${inputClass}`}
                    />

                    {emailLooksValid ? (
                      <Check
                        size={17}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600"
                      />
                    ) : null}
                  </div>

                  {email && !emailLooksValid ? (
                    <p className="mt-2 text-xs font-bold text-red-700">
                      Enter a complete email address.
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="zaifan-admin-password"
                      className="text-[10px] font-black uppercase tracking-[0.16em] text-[#10233f]"
                    >
                      Password
                    </label>

                    {capsLockOn ? (
                      <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                        Caps Lock on
                      </span>
                    ) : null}
                  </div>

                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-600"
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
                      className={`${baseInputClass} ${inputClass}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-500 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(event) =>
                      setRememberEmail(event.target.checked)
                    }
                    className="h-4 w-4 accent-orange-500"
                  />
                  <span className="text-xs font-bold text-slate-600">
                    Remember email this session
                  </span>
                </label>

                <motion.button
                  type="submit"
                  disabled={!formReady}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                  className="group flex min-h-14 w-full items-center justify-between rounded-[1.05rem] border-[3px] border-orange-500 bg-orange-500 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    {submitting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Fingerprint size={18} />
                    )}
                    {submitting ? "Opening Admin OS..." : "Access Admin OS"}
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white transition group-hover:translate-x-0.5">
                    <ArrowRight size={17} />
                  </span>
                </motion.button>
              </form>

              <div className="mt-7 rounded-[1.25rem] border-2 border-orange-200 bg-[#fffaf4] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-200 bg-white text-orange-600">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#10233f]">
                      Protected by Zaifan Security Layer
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Private access for authorized team members only.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BrandSide({ shouldReduceMotion }) {
  const features = [
    {
      Icon: UsersRound,
      title: "Student CRM",
      text: "Inquiries, appointments and follow-ups",
    },
    {
      Icon: BriefcaseBusiness,
      title: "Case Operations",
      text: "Applications, documents and workflows",
    },
    {
      Icon: BarChart3,
      title: "Intelligence",
      text: "AI insights and operational signals",
    },
    {
      Icon: ShieldCheck,
      title: "Controlled Access",
      text: "Role-based security and audit trail",
    },
  ];

  return (
    <motion.aside
      initial={shouldReduceMotion ? false : { opacity: 0, x: -22 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
      className="relative hidden min-h-[820px] overflow-hidden bg-[#fff8ee] p-8 lg:p-10 xl:block"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full border-[46px] border-orange-200/35" />
        <div className="absolute bottom-12 left-[-80px] h-56 w-56 rounded-full bg-orange-100/30 blur-3xl" />
        <div className="absolute right-[19%] top-[14%] h-48 w-48 rounded-full border border-dashed border-orange-400/45" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-lg font-black text-orange-600">
            Z
          </div>
          <div>
            <p className="text-lg font-black tracking-[0.08em] text-[#10233f]">
              ZAIFAN
            </p>
            <p className="text-[8px] font-black uppercase tracking-[0.28em] text-orange-600">
              Consultancy
            </p>
          </div>
        </div>

        <div className="mt-14 max-w-[470px]">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-orange-700">
            <ShieldCheck size={13} />
            Enterprise Command Center
          </span>

          <h2 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.045em] text-[#10233f]">
            Welcome back,
            <span className="block text-orange-500">
              command the day.
            </span>
          </h2>

          <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-slate-600">
            Sign in to your private Admin OS to manage students,
            appointments, applications, finance, support, analytics and
            counselor operations.
          </p>
        </div>

        <div className="mt-8 grid max-w-[430px] grid-cols-2 gap-3">
          {features.map(({ Icon, title, text }) => (
            <FeatureCard
              key={title}
              Icon={Icon}
              title={title}
              text={text}
            />
          ))}
        </div>
      </div>

      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                y: [0, -7, 0],
                rotate: [0, 0.4, 0],
              }
        }
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute bottom-0 right-[-4%] z-[5] w-[62%] max-w-[700px]"
      >
        <img
          src={adminLoginMascot}
          alt="Zaifan Admin OS mascot working with a transparent digital laptop interface"
          className="h-auto w-full object-contain drop-shadow-[0_24px_32px_rgba(74,48,22,0.16)]"
          draggable="false"
        />
      </motion.div>

      <div className="absolute bottom-8 left-8 z-20 w-[44%] max-w-[410px] rounded-[1.25rem] border-2 border-[#24517f] bg-[#123866] p-4 shadow-[0_14px_32px_rgba(16,47,92,0.18)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
            <BadgeCheck size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-white">
              Secure. Private. Controlled.
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-white">
              Admin access is protected by the existing Zaifan authentication system.
            </p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function FeatureCard({ Icon, title, text }) {
  const navyCards = title === "Student CRM" || title === "Controlled Access";

  if (navyCards) {
    return (
      <div className="rounded-[1.25rem] border-2 border-[#24517f] bg-[#123866] p-4 shadow-[0_10px_24px_rgba(16,47,92,0.16)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white">
          <Icon size={17} />
        </div>
        <p className="mt-3 text-sm font-black text-white">
          {title}
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-white">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.25rem] border-2 border-orange-400 bg-orange-500 p-4 shadow-[0_10px_24px_rgba(249,115,22,0.18)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-white">
        <Icon size={17} />
      </div>
      <p className="mt-3 text-sm font-black text-white">
        {title}
      </p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-white">
        {text}
      </p>
    </div>
  );
}

function LoginMessage({ type = "error", text, onClose }) {
  const isError = type === "error";

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-[1.1rem] border-2 p-4 ${
        isError
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        {isError ? (
          <LockKeyhole size={17} className="mt-0.5 shrink-0" />
        ) : (
          <Check size={17} className="mt-0.5 shrink-0" />
        )}
        <p className="text-sm font-black leading-6">
          {text}
        </p>
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

function WarmBackground({ shouldReduceMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, 18, 0],
                y: [0, -8, 0],
              }
        }
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-orange-100/45 blur-3xl"
      />

      <motion.div
        animate={
          shouldReduceMotion
            ? undefined
            : {
                x: [0, -14, 0],
                y: [0, 10, 0],
              }
        }
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-orange-200/35 blur-3xl"
      />
    </div>
  );
}

export default AdminLogin;
