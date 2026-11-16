// Shared building blocks for the three portal sign-in pages (Admin, Counselor,
// Student). Deliberately simple: a navy top bar that drips into a cream page,
// one white card with the form, and a switch between the three portals.

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";

import logoLight from "../../assets/images/brand/logo-light.webp";
import { DripDivider } from "../public/destinations/DestinationUI";
import { CREAM, NAVY } from "./portalLoginUtils";

const PORTALS = [
  { id: "admin", label: "Admin", to: "/admin", Icon: ShieldCheck },
  { id: "counselor", label: "Counselor", to: "/counselor", Icon: UsersRound },
  { id: "student", label: "Student", to: "/student", Icon: GraduationCap },
];

function PortalSwitch({ current }) {
  return (
    <nav aria-label="Choose your portal" className="grid grid-cols-3 gap-1 rounded-2xl bg-[#071f50]/[0.06] p-1">
      {PORTALS.map(({ id, label, to, Icon }) => {
        const active = id === current;

        return (
          <Link
            key={id}
            to={to}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[13px] font-extrabold transition ${
              active
                ? "bg-[#071f50] text-white shadow-[0_6px_14px_rgba(7,31,80,0.2)]"
                : "text-[#071f50]/60 hover:bg-white hover:text-[#071f50]"
            }`}
          >
            <Icon size={15} className={active ? "text-[#ff8a5c]" : ""} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Navy top bar → drip → one centred white card. */
export function PortalLoginFrame({ portal, title, subtitle, children, footer }) {
  return (
    <main className="min-h-screen bg-[#fff7ed] text-[#071f50]">
      <div style={{ background: NAVY }}>
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" aria-label="Zaifan Consultancy home" className="shrink-0">
            <img src={logoLight} alt="Zaifan Consultancy" className="h-11 w-auto sm:h-12" decoding="async" />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1.5 text-xs font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to website
          </Link>
        </header>
        <div className="h-16 sm:h-20" />
      </div>

      <DripDivider color={NAVY} background={CREAM} />

      <div className="relative z-10 mx-auto -mt-28 w-full max-w-[460px] px-4 pb-12 sm:-mt-36">
        <div className="rounded-[28px] border border-[#071f50]/8 bg-white p-6 shadow-[0_24px_60px_rgba(7,31,80,0.12)] sm:p-8">
          <PortalSwitch current={portal} />

          <div className="mt-7">
            <h1 className="text-[1.75rem] font-black leading-tight tracking-[-0.02em] text-[#071f50] sm:text-[2rem]">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 text-[15px] leading-6 text-[#071f50]/60">{subtitle}</p> : null}
          </div>

          {children}
        </div>

        {footer ? (
          <p className="mx-auto mt-6 max-w-[380px] text-center text-[13px] leading-5 text-[#071f50]/55">{footer}</p>
        ) : null}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Form parts                                                                 */
/* -------------------------------------------------------------------------- */

export function LoginField({
  id,
  label,
  icon: Icon,
  hint = null,
  error = "",
  trailing = null,
  valid = false,
  inputRef,
  ...inputProps
}) {
  return (
    <div>
      <div className="flex min-h-6 items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-extrabold text-[#071f50]">
          {label}
        </label>
        {hint}
      </div>

      <div
        className={`group mt-1.5 flex items-center gap-3 rounded-2xl border-2 bg-white px-4 transition focus-within:border-[#ff4b12] focus-within:shadow-[0_0_0_4px_rgba(255,75,18,0.12)] ${
          error ? "border-rose-300" : valid ? "border-emerald-300" : "border-[#071f50]/12"
        }`}
      >
        {Icon ? (
          <Icon size={18} className="shrink-0 text-[#071f50]/35 transition group-focus-within:text-[#ff4b12]" />
        ) : null}

        <input
          id={id}
          ref={inputRef}
          aria-invalid={error ? true : undefined}
          className="h-13 min-w-0 flex-1 bg-transparent py-3.5 text-[15px] font-semibold text-[#071f50] outline-none placeholder:font-medium placeholder:text-[#071f50]/35 disabled:cursor-not-allowed disabled:opacity-60"
          {...inputProps}
        />

        {trailing}
      </div>

      {error ? <p className="mt-1.5 text-xs font-bold text-rose-700">{error}</p> : null}
    </div>
  );
}

export function PasswordField({
  id,
  value,
  onChange,
  disabled,
  inputRef,
  icon,
  label = "Password",
  placeholder = "Your password",
}) {
  const [show, setShow] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCapsLock = (event) => {
    if (typeof event.getModifierState === "function") {
      setCapsLock(event.getModifierState("CapsLock"));
    }
  };

  return (
    <LoginField
      id={id}
      label={label}
      icon={icon}
      inputRef={inputRef}
      type={show ? "text" : "password"}
      autoComplete="current-password"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={checkCapsLock}
      onKeyUp={checkCapsLock}
      disabled={disabled}
      hint={
        capsLock ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-800">
            Caps Lock is on
          </span>
        ) : null
      }
      trailing={
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          disabled={disabled}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className="-mr-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#071f50]/55 transition hover:bg-[#071f50]/5 hover:text-[#071f50] disabled:opacity-50"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
          {show ? "Hide" : "Show"}
        </button>
      }
    />
  );
}

export function RememberEmail({ checked, onChange, disabled }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-[#071f50]/65">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="h-4 w-4 accent-[#ff4b12]"
      />
      Remember my email
    </label>
  );
}

export function LoginButton({ label, busyLabel, busy = false, disabled = false }) {
  return (
    <button
      type="submit"
      disabled={disabled || busy}
      className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff4b12] py-3.5 text-[15px] font-black text-white shadow-[0_12px_26px_rgba(255,75,18,0.25)] transition hover:bg-[#f2410a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff4b12]/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {busy ? busyLabel : label}
      {!busy ? <ArrowRight size={18} className="transition group-hover:translate-x-0.5" /> : null}
    </button>
  );
}

export function LoginAlert({ children, onClose }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
      <CircleAlert size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-bold leading-6">{children}</p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="shrink-0 rounded-lg p-1 transition hover:bg-rose-100"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
