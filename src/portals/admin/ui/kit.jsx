/* eslint-disable react-refresh/only-export-components */
// The admin's building blocks. One look everywhere: cream page, white cards,
// navy text, orange for the main action. Keep these boring and predictable.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, CircleAlert, Info, Loader2, X } from "lucide-react";

import { avatarColor, classNames, initials } from "../lib/format";

/* -------------------------------------------------------------------------- */
/* Toasts                                                                     */
/* -------------------------------------------------------------------------- */

const ToastContext = createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const push = useCallback((toast) => {
    const id = ++counter.current;
    const item = { id, tone: "success", ...(typeof toast === "string" ? { message: toast } : toast) };
    setToasts((current) => [...current, item]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, item.tone === "error" ? 7000 : 3500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={classNames(
                "pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_16px_40px_rgba(7,31,80,0.18)]",
                toast.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : toast.tone === "info"
                    ? "border-sky-200 bg-sky-50 text-sky-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
              )}
            >
              {toast.tone === "error" ? (
                <CircleAlert size={18} className="mt-0.5 shrink-0" />
              ) : toast.tone === "info" ? (
                <Info size={18} className="mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              )}
              <span className="leading-5">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

const BUTTON_VARIANTS = {
  primary:
    "bg-[#ff4b12] text-white shadow-[0_8px_18px_rgba(255,75,18,0.22)] hover:bg-[#f2410a] focus-visible:ring-[#ff4b12]/30",
  navy: "bg-[#071f50] text-white hover:bg-[#0b2a6b] focus-visible:ring-[#071f50]/30",
  ghost:
    "border border-[#071f50]/12 bg-white text-[#071f50] hover:border-[#071f50]/30 hover:bg-[#071f50]/[0.03] focus-visible:ring-[#071f50]/15",
  soft: "bg-[#071f50]/[0.06] text-[#071f50] hover:bg-[#071f50]/[0.1] focus-visible:ring-[#071f50]/15",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-rose-200",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-200",
};

const BUTTON_SIZES = {
  sm: "h-9 px-3 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-4 text-sm gap-2 rounded-2xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-2xl",
  icon: "h-9 w-9 rounded-xl",
};

export function Button({
  variant = "ghost",
  size = "md",
  icon: Icon,
  busy = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={classNames(
        "inline-flex shrink-0 items-center justify-center font-bold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={size === "sm" || size === "icon" ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "ghost", size = "sm", icon: Icon, className = "", children, ...props }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className={classNames(
        "inline-flex shrink-0 items-center justify-center font-bold transition focus-visible:outline-none focus-visible:ring-4",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      {...props}
    >
      {Icon ? <Icon size={15} /> : null}
      {children}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Cards, headings, chips                                                     */
/* -------------------------------------------------------------------------- */

export function Card({ className = "", children, as: Tag = "section", ...props }) {
  return (
    <Tag
      className={classNames(
        "rounded-[22px] border border-[#071f50]/8 bg-white shadow-[0_1px_2px_rgba(7,31,80,0.04)]",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, className = "" }) {
  return (
    <div className={classNames("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#071f50]/[0.06] text-[#071f50]">
            <Icon size={17} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[15px] font-black tracking-[-0.01em] text-[#071f50]">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-[13px] leading-5 text-[#071f50]/55">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="flex max-w-full flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff4b12]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-[1.65rem] font-black leading-tight tracking-[-0.02em] text-[#071f50] sm:text-[2rem]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-[#071f50]/60">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Chip({ color = "#64748b", children, className = "", dot = true, size = "sm" }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full font-extrabold whitespace-nowrap",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        className
      )}
      style={{ background: `${color}1a`, color }}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> : null}
      {children}
    </span>
  );
}

export function Avatar({ name, size = 40, className = "", src }) {
  const dimension = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) };
  if (src) {
    return <img src={src} alt="" className={classNames("shrink-0 rounded-full object-cover", className)} style={dimension} />;
  }
  return (
    <span
      className={classNames("flex shrink-0 items-center justify-center rounded-full font-black text-white", className)}
      style={{ ...dimension, background: avatarColor(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Stat({ label, value, hint, tone = "navy", onClick, icon: Icon }) {
  const Tag = onClick ? "button" : "div";
  const toneColor = tone === "orange" ? "#ff4b12" : tone === "green" ? "#10b981" : tone === "red" ? "#ef4444" : tone === "sky" ? "#0ea5e9" : "#071f50";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={classNames(
        "flex min-w-0 flex-col items-start rounded-[20px] border border-[#071f50]/8 bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(7,31,80,0.04)]",
        onClick && "transition hover:-translate-y-0.5 hover:border-[#071f50]/20 hover:shadow-[0_10px_24px_rgba(7,31,80,0.08)]"
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#071f50]/50">{label}</span>
        {Icon ? <Icon size={16} style={{ color: toneColor }} /> : null}
      </div>
      <span className="mt-2 text-[2rem] font-black leading-none tracking-[-0.03em]" style={{ color: toneColor }}>
        {value}
      </span>
      {hint ? <span className="mt-1.5 text-[12px] font-semibold text-[#071f50]/50">{hint}</span> : null}
    </Tag>
  );
}

export function EmptyState({ icon: Icon, title, text, action, compact = false }) {
  return (
    <div className={classNames("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14")}>
      {Icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071f50]/[0.05] text-[#071f50]/50">
          <Icon size={22} />
        </span>
      ) : null}
      <p className="mt-3 text-[15px] font-black text-[#071f50]">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-[13px] leading-5 text-[#071f50]/55">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Divider({ className = "" }) {
  return <hr className={classNames("border-0 border-t border-[#071f50]/8", className)} />;
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

const INPUT_CLASS =
  "h-11 w-full rounded-xl border-2 border-[#071f50]/10 bg-white px-3.5 text-[14px] font-semibold text-[#071f50] outline-none transition placeholder:font-medium placeholder:text-[#071f50]/35 focus:border-[#ff4b12] focus:shadow-[0_0_0_4px_rgba(255,75,18,0.12)] disabled:cursor-not-allowed disabled:bg-[#071f50]/[0.03]";

export function Field({ label, hint, error, children, className = "", required = false }) {
  return (
    <label className={classNames("block min-w-0", className)}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-extrabold text-[#071f50]">
          {label}
          {required ? <span className="text-[#ff4b12]"> *</span> : null}
        </span>
        {hint ? <span className="text-[11px] font-semibold text-[#071f50]/45">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1 block text-xs font-bold text-rose-700">{error}</span> : null}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={classNames(INPUT_CLASS, className)} {...props} />;
}

export function Textarea({ className = "", rows = 3, ...props }) {
  return <textarea rows={rows} className={classNames(INPUT_CLASS, "h-auto resize-y py-2.5 leading-5", className)} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <span className="relative block">
      <select className={classNames(INPUT_CLASS, "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#071f50]/40" />
    </span>
  );
}

export function FormRow({ children, cols = 2, className = "" }) {
  return (
    <div className={classNames("grid gap-3", cols === 3 ? "sm:grid-cols-3" : cols === 1 ? "" : "sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

/** Small helper for controlled forms: const [form, set] = useForm({...}) */
export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const set = useCallback((key) => (event) => {
    const value = event && event.target ? (event.target.type === "checkbox" ? event.target.checked : event.target.value) : event;
    setForm((current) => ({ ...current, [key]: value }));
  }, []);
  const reset = useCallback((next = initial) => setForm(next), [initial]);
  return [form, set, reset, setForm];
}

/* -------------------------------------------------------------------------- */
/* Segmented filter, tabs                                                     */
/* -------------------------------------------------------------------------- */

export function Segmented({ options, value, onChange, className = "" }) {
  return (
    <div className={classNames("inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-[#071f50]/[0.06] p-1", className)}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={classNames(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-extrabold transition",
              active ? "bg-white text-[#071f50] shadow-[0_2px_8px_rgba(7,31,80,0.12)]" : "text-[#071f50]/55 hover:text-[#071f50]"
            )}
          >
            {option.color ? <span className="h-2 w-2 rounded-full" style={{ background: option.color }} /> : null}
            {option.label}
            {option.count !== undefined ? (
              <span className={classNames("rounded-full px-1.5 text-[11px]", active ? "bg-[#071f50]/[0.08]" : "bg-[#071f50]/[0.06]")}>
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-px">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={classNames(
              "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-[13.5px] font-extrabold transition",
              active ? "text-[#071f50]" : "text-[#071f50]/50 hover:text-[#071f50]"
            )}
          >
            {tab.icon ? <tab.icon size={15} /> : null}
            {tab.label}
            {tab.count ? (
              <span className={classNames("rounded-full px-1.5 py-0.5 text-[10.5px]", tab.alert ? "bg-[#ff4b12] text-white" : "bg-[#071f50]/[0.08] text-[#071f50]")}>
                {tab.count}
              </span>
            ) : null}
            {active ? <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-[#ff4b12]" /> : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drawer + Modal                                                             */
/* -------------------------------------------------------------------------- */

function useEscape(onClose, open) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, open]);
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = "max-w-xl" }) {
  useEscape(onClose, open);
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-[#071f50]/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            className={classNames("relative flex h-full w-full flex-col bg-[#fff7ed] shadow-[-20px_0_60px_rgba(7,31,80,0.25)]", width)}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-start justify-between gap-3 border-b border-[#071f50]/8 bg-white px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black tracking-[-0.01em] text-[#071f50]">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-[13px] text-[#071f50]/55">{subtitle}</p> : null}
              </div>
              <Button variant="soft" size="icon" onClick={onClose} aria-label="Close panel">
                <X size={17} />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer ? <footer className="border-t border-[#071f50]/8 bg-white px-5 py-3">{footer}</footer> : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = "max-w-lg" }) {
  useEscape(onClose, open);
  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-[#071f50]/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={classNames("relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[26px] bg-white shadow-[0_30px_80px_rgba(7,31,80,0.3)] sm:rounded-[26px]", width)}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
          >
            <header className="flex items-start justify-between gap-3 px-6 pt-5">
              <div className="min-w-0">
                <h2 className="text-lg font-black tracking-[-0.01em] text-[#071f50]">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-[13px] leading-5 text-[#071f50]/55">{subtitle}</p> : null}
              </div>
              <Button variant="soft" size="icon" onClick={onClose} aria-label="Close">
                <X size={17} />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[#071f50]/8 px-6 py-4">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Yes/no confirmation. Usage: const confirm = useConfirm(); await confirm({ title, text, confirmLabel })
 * With `choices: [{ id, label }]` it shows a pick-one list (plus an optional
 * note when `noteLabel` is set) and resolves to { choice, note } instead of true.
 * With only `noteLabel` (no choices) it asks for a short text and resolves to
 * { note }; `quickNotes: ["…"]` adds one-tap suggestions, `noteValue` pre-fills.
 */
const ConfirmContext = createContext(() => Promise.resolve(false));

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setChoice("");
        setNote(options.noteValue || "");
        setState({ ...options, resolve });
      }),
    []
  );

  const close = (answer) => {
    state?.resolve(answer && (state.choices || state.noteLabel) ? { choice, note: note.trim() } : answer);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(state)}
        onClose={() => close(false)}
        title={state?.title || "Are you sure?"}
        subtitle={state?.text}
        width="max-w-md"
        footer={
          <>
            <Button onClick={() => close(false)}>{state?.cancelLabel || "Cancel"}</Button>
            <Button variant={state?.danger ? "danger" : "primary"} disabled={Boolean(state?.choices) && !choice} onClick={() => close(true)}>
              {state?.confirmLabel || "Yes, continue"}
            </Button>
          </>
        }
      >
        {state?.body || null}
        {state?.choices ? (
          <div className="space-y-2">
            {state.choices.map((option) => (
              <label
                key={option.id}
                className={classNames(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-[14px] font-bold transition",
                  choice === option.id ? "border-[#ff4b12] bg-[#fff1e8] text-[#071f50]" : "border-[#071f50]/10 text-[#071f50]/75 hover:border-[#071f50]/25"
                )}
              >
                <input type="radio" name="zaifan-confirm-choice" className="h-4 w-4 accent-[#ff4b12]" checked={choice === option.id} onChange={() => setChoice(option.id)} />
                {option.label}
              </label>
            ))}
            {state.noteLabel ? (
              <Field label={state.noteLabel} hint="optional" className="pt-1">
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={400} />
              </Field>
            ) : null}
          </div>
        ) : state?.noteLabel ? (
          <div className="space-y-2.5">
            {state.quickNotes?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {state.quickNotes.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setNote(text)}
                    className={classNames(
                      "rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition",
                      note === text ? "border-[#ff4b12] bg-[#fff1e8] text-[#071f50]" : "border-[#071f50]/12 text-[#071f50]/70 hover:border-[#071f50]/30"
                    )}
                  >
                    {text}
                  </button>
                ))}
              </div>
            ) : null}
            <Field label={state.noteLabel}>
              <Textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={400} />
            </Field>
          </div>
        ) : null}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-[#071f50]/50">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

export function KeyValue({ items, className = "" }) {
  const visible = items.filter((item) => item.value !== undefined && item.value !== null && item.value !== "");
  if (!visible.length) return null;
  return (
    <dl className={classNames("grid gap-x-6 gap-y-3 sm:grid-cols-2", className)}>
      {visible.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#071f50]/45">{item.label}</dt>
          <dd className="mt-0.5 break-words text-[14px] font-semibold leading-5 text-[#071f50]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({ tone = "info", children, className = "" }) {
  const styles =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-sky-200 bg-sky-50 text-sky-900";
  return <div className={classNames("rounded-2xl border px-4 py-3 text-[13px] font-semibold leading-5", styles, className)}>{children}</div>;
}
