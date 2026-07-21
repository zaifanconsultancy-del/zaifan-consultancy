import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

const TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

function formatDate(value) {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatType(value = "") {
  return String(value || "student")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getName(student = {}) {
  return student.full_name || student.student_name || student.name || "Student";
}

function getEmail(student = {}) {
  return student.email || student.student_email || "No email";
}

function getPhone(student = {}) {
  return student.phone || student.phone_number || student.whatsapp || "No phone";
}

function getStatus(student = {}) {
  return (
    student.status ||
    student.pipeline_stage ||
    student.appointment_stage ||
    student.stage ||
    "Record"
  );
}

function MiniPortalCount({ label, value }) {
  const hasData = Number(value) > 0;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-center ${
        hasData
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-65">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black">{value || 0}</p>
    </div>
  );
}

function StudentPortalAuth({
  email = "",
  setEmail = () => {},
  password = "",
  setPassword = () => {},

  identifier = "",
  setIdentifier = () => {},

  loading = false,
  legacyLoading = false,
  error = "",
  matches = [],

  onSelectMatch = () => {},
  onSubmit = () => {},
  onLegacySubmit = () => {},
}) {
  const [accessMode, setAccessMode] = useState("account");
  const [showPassword, setShowPassword] = useState(false);

  const hasMatches = matches.length > 0;

  const matchSummary = useMemo(() => {
    const withData = matches.filter(
      (student) => Number(student.portalCounts?.total || 0) > 0
    ).length;

    return {
      total: matches.length,
      withData,
      empty: Math.max(matches.length - withData, 0),
    };
  }, [matches]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7f8fa] px-3 py-4 text-slate-950 sm:px-5 sm:py-6 lg:px-6">
      <div className="pointer-events-none absolute -left-32 -top-32 h-[440px] w-[440px] rounded-full bg-orange-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-[-8%] h-[480px] w-[480px] rounded-full bg-amber-100/75 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1500px] items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_30px_110px_rgba(15,23,42,0.11)] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative overflow-hidden border-b border-orange-200 bg-gradient-to-br from-orange-50 via-[#fffaf3] to-amber-50 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-amber-100/80 blur-3xl" />

            <div className="relative flex h-full flex-col">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-orange-700 shadow-sm">
                  <Sparkles size={12} />
                  Zaifan Student OS
                </div>

                <h1 className="mt-5 max-w-xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-[2.7rem] lg:leading-[1.02]">
                  Your complete study journey,
                  <span className="block text-orange-600">in one secure place.</span>
                </h1>

                <p className="mt-4 max-w-lg text-sm leading-6 text-slate-600">
                  Access your applications, documents, tasks, universities, payments,
                  counselor support and journey updates from one connected student workspace.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <FeatureCard
                  icon={GraduationCap}
                  title="Study Journey"
                  text="Follow applications, offers, CAS and visa progress."
                />
                <FeatureCard
                  icon={ShieldCheck}
                  title="Secure Access"
                  text="Your portal account keeps student-only information protected."
                />
                <FeatureCard
                  icon={BadgeCheck}
                  title="Action Center"
                  text="See tasks, document needs and urgent next steps."
                />
                <FeatureCard
                  icon={UserRoundCheck}
                  title="Counselor Support"
                  text="Stay connected with the Zaifan team throughout your journey."
                />
              </div>

              <div className="mt-auto pt-7">
                <div className="rounded-[1.4rem] border border-orange-200 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                      <LockKeyhole size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        Official portal access is the primary login.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Legacy lookup remains available only for students still being migrated
                        to a dedicated portal account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="p-5 sm:p-7 lg:p-8 xl:p-10">
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
                    Secure student access
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    Welcome back
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose the access method connected to your student record.
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-600">
                  <Fingerprint size={22} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <AccessModeButton
                  active={accessMode === "account"}
                  onClick={() => setAccessMode("account")}
                  icon={KeyRound}
                  label="Portal Login"
                  description="Email + password"
                />
                <AccessModeButton
                  active={accessMode === "legacy"}
                  onClick={() => setAccessMode("legacy")}
                  icon={Search}
                  label="Legacy Lookup"
                  description="Migration access"
                />
              </div>

              {error ? (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <CircleAlert size={18} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {accessMode === "account" ? (
                <form onSubmit={onSubmit} className="mt-6">
                  <div className="rounded-[1.6rem] border border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                          Official Portal Login
                        </p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">
                          Sign in to Student OS
                        </h3>
                      </div>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-700">
                        Accounts Active
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Use the portal email and password assigned to your student account.
                    </p>

                    <div className="mt-5 space-y-4">
                      <FieldShell icon={Mail} label="Portal email">
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="student@example.com"
                          type="email"
                          autoComplete="email"
                          required
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </FieldShell>

                      <FieldShell icon={LockKeyhole} label="Password">
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter your password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </FieldShell>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(249,115,22,0.2)] hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 ${TRANSITION}`}
                    >
                      {loading ? "Opening Student OS..." : "Login to Student OS"}
                      {!loading ? <ArrowRight size={17} /> : null}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={onLegacySubmit} className="mt-6">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                        <UsersRound size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Migration Access
                        </p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">
                          Find an older student record
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Use the email or WhatsApp number originally provided to Zaifan.
                          This route exists for records that have not yet been fully migrated
                          to portal-account login.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <FieldShell icon={Search} label="Email or WhatsApp">
                        <input
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          placeholder="Email or WhatsApp number"
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                          required
                        />
                      </FieldShell>
                    </div>

                    <button
                      type="submit"
                      disabled={legacyLoading}
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-5 py-4 text-sm font-black text-orange-700 shadow-sm hover:-translate-y-0.5 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 ${TRANSITION}`}
                    >
                      {legacyLoading ? "Searching Student Records..." : "Find My Student Record"}
                      {!legacyLoading ? <Search size={17} /> : null}
                    </button>
                  </div>
                </form>
              )}

              {hasMatches ? (
                <section className="mt-6 overflow-hidden rounded-[1.7rem] border border-orange-200 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
                          Identity Resolution
                        </p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">
                          Choose your correct student record
                        </h3>
                      </div>

                      <div className="flex gap-2">
                        <SummaryChip label="Found" value={matchSummary.total} />
                        <SummaryChip label="With Data" value={matchSummary.withData} positive />
                      </div>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Multiple records matched your details. Review the information below
                      before opening a workspace.
                    </p>
                  </div>

                  <div className="grid gap-3 p-4 sm:p-5">
                    {matches.map((student) => {
                      const hasPortalData = Number(student.portalCounts?.total || 0) > 0;

                      return (
                        <button
                          key={
                            student.portal_student_key ||
                            `${student.student_type}-${student.id}`
                          }
                          type="button"
                          onClick={() => onSelectMatch(student)}
                          className={`group rounded-[1.4rem] border p-4 text-left shadow-sm hover:-translate-y-0.5 hover:shadow-md ${TRANSITION} ${
                            hasPortalData
                              ? "border-emerald-200 bg-emerald-50/45 hover:border-emerald-300"
                              : "border-slate-200 bg-white hover:border-orange-200"
                          }`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-black text-slate-950">
                                  {getName(student)}
                                </p>

                                <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                                  {formatType(student.student_type)}
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                                    hasPortalData
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {hasPortalData ? "Student OS Data" : "Empty Record"}
                                </span>
                              </div>

                              <p className="mt-2 text-xs font-semibold text-slate-600">
                                {getEmail(student)} · {getPhone(student)}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                <span>
                                  Created:{" "}
                                  {formatDate(
                                    student.created_at || student.appointment_date
                                  )}
                                </span>
                                <span>ID {student.id}</span>
                                <span>{getStatus(student)}</span>
                              </div>

                              {student.country ||
                              student.country_interest ||
                              student.preferred_country ? (
                                <p className="mt-2 text-xs text-slate-500">
                                  <span className="font-black text-slate-700">Country:</span>{" "}
                                  {student.country ||
                                    student.country_interest ||
                                    student.preferred_country}
                                </p>
                              ) : null}

                              {student.field_of_interest ||
                              student.course ||
                              student.program ||
                              student.consultation_type ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  <span className="font-black text-slate-700">Interest:</span>{" "}
                                  {student.field_of_interest ||
                                    student.course ||
                                    student.program ||
                                    student.consultation_type}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex shrink-0 items-center gap-2 text-xs font-black text-orange-600">
                              Open workspace
                              <ChevronRight
                                size={17}
                                className={`group-hover:translate-x-1 ${TRANSITION}`}
                              />
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                            <MiniPortalCount
                              label="Apps"
                              value={student.portalCounts?.applications || 0}
                            />
                            <MiniPortalCount
                              label="Docs"
                              value={student.portalCounts?.documents || 0}
                            />
                            <MiniPortalCount
                              label="Tasks"
                              value={student.portalCounts?.tasks || 0}
                            />
                            <MiniPortalCount
                              label="Unis"
                              value={student.portalCounts?.universities || 0}
                            />
                            <MiniPortalCount
                              label="Msgs"
                              value={student.portalCounts?.communications || 0}
                            />
                            <MiniPortalCount
                              label="Timeline"
                              value={student.portalCounts?.timeline || 0}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              <div className="mt-6 flex items-start gap-3 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                    Secure migration mode
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Portal accounts are active for testing and primary access. Legacy lookup
                    remains available during migration so existing student records are not
                    locked out while account management is completed.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[1.25rem] border border-orange-100 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        <Icon size={17} />
      </div>
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function AccessModeButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-left ${TRANSITION} ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          className={active ? "text-orange-600" : "text-slate-400"}
        />
        <span className="text-xs font-black">{label}</span>
      </div>
      <p className="mt-1 hidden pl-[23px] text-[9px] font-semibold text-slate-400 sm:block">
        {description}
      </p>
    </button>
  );
}

function FieldShell({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
        <Icon size={17} className="shrink-0 text-slate-400" />
        {children}
      </div>
    </label>
  );
}

function SummaryChip({ label, value, positive = false }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-center ${
        positive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}

export default StudentPortalAuth;
