import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
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
  X,
} from "lucide-react";

import studentLoginMascot from "../../assets/images/student/student-login-mascot.png";

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
  const [showMatchesModal, setShowMatchesModal] = useState(false);

  const hasMatches = matches.length > 0;

  useEffect(() => {
    if (hasMatches) {
      setShowMatchesModal(true);
    }
  }, [hasMatches]);

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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff5e9] px-3 py-4 text-[#082d50] sm:px-5 lg:px-7 lg:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,205,155,0.16),transparent_32%),radial-gradient(circle_at_84%_76%,rgba(224,241,244,0.32),transparent_31%)]" />

      <div className="relative mx-auto w-full max-w-[1680px]">
        <div className="grid w-full overflow-hidden rounded-[2.1rem] border border-[#f2b27d] bg-[#fffaf4] shadow-[0_24px_70px_rgba(81,52,25,0.10)] lg:grid-cols-[0.94fr_1.06fr]">
          <aside className="relative flex min-h-[760px] overflow-hidden border-b border-[#f2b27d] bg-[#fff2e3] lg:min-h-[820px] lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_64%_50%,rgba(255,175,105,0.14),transparent_34%)]" />

            <div className="relative flex w-full flex-col">
              <div className="relative z-20 px-9 pt-9 sm:px-11 sm:pt-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black tracking-[0.22em] text-[#082d50]">
                      ZAIFAN
                    </p>
                    <p className="-mt-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-[#ff4b13]">
                      Consultancy
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f2b27d] bg-[#fffaf4]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b13]">
                    <GraduationCap size={11} />
                    Student OS
                  </div>
                </div>

                <h1 className="mt-7 max-w-[610px] text-[42px] font-black leading-[0.98] tracking-[-0.035em] text-[#082d50] sm:text-[52px]">
                  Your complete study journey,
                  <span className="mt-1 block text-[#ff4b13]">in one secure place.</span>
                </h1>

                <p className="mt-5 max-w-[590px] text-sm leading-[1.65] text-[#38546d] sm:text-base">
                  Access your applications, documents, tasks, universities, payments,
                  counselor support and journey updates from your connected student workspace.
                </p>
              </div>

              <div className="relative mt-1 flex min-h-[390px] flex-1 items-end lg:min-h-[430px]">
                <img
                  src={studentLoginMascot}
                  alt="Zaifan Student OS mascot"
                  className="pointer-events-none absolute bottom-0 left-1/2 z-10 w-[118%] max-w-none -translate-x-1/2 select-none object-contain object-bottom sm:w-[112%]"
                  draggable="false"
                />
              </div>

              <div className="relative z-20 mx-7 mb-4 rounded-[1.15rem] border border-[#efb47e] bg-[#fffdf9]/95 px-4 py-4 shadow-[0_8px_24px_rgba(111,65,28,0.06)] backdrop-blur-sm sm:mx-9">
                <div className="grid grid-cols-4 gap-1.5">
                  <CompactFeature icon={GraduationCap} label="Study Journey" />
                  <CompactFeature icon={ShieldCheck} label="Secure Access" />
                  <CompactFeature icon={BadgeCheck} label="Action Center" />
                  <CompactFeature icon={UserRoundCheck} label="Counselor Support" />
                </div>
              </div>

              <div className="relative z-20 flex items-center gap-2.5 px-9 pb-5 text-[#173b59]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#f1b985] bg-[#fffaf4] text-[#ff4b13]">
                  <ShieldCheck size={13} />
                </div>
                <div>
                  <p className="text-[10px] font-black">Protected by Zaifan Security Layer</p>
                  <p className="mt-0.5 text-[9px] text-[#60778a]">
                    Your student workspace remains private, authenticated and controlled.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="relative flex min-h-[760px] bg-[#fffdf9] px-7 py-8 sm:px-10 lg:min-h-[820px] lg:px-11">
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-bl-[5rem] bg-[#fff7ed]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-tr-[5rem] bg-[#f7fbfb]" />

            <div className="relative z-10 my-auto w-full max-w-[700px]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f2b27d] bg-[#fffaf4] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b13]">
                <ShieldCheck size={11} />
                Secure Student Access
              </div>

              <h2 className="mt-6 text-[40px] font-black leading-[0.95] tracking-[-0.035em] text-[#082d50] sm:text-[48px]">
                Student Portal
                <span className="block text-[#ff4b13]">Login</span>
              </h2>
              <div className="mt-2 h-[3px] w-9 rounded-full bg-[#ff4b13]" />

              <p className="mt-5 max-w-[540px] text-sm leading-[1.65] text-[#5a7083] sm:text-[15px]">
                Access your applications, documents, tasks, payments, universities and
                counselor support from one secure Zaifan Student workspace.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-1 rounded-2xl border border-[#e4e9ee] bg-[#f7f9fb] p-1">
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
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] text-red-700">
                  <CircleAlert size={14} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              {accessMode === "account" ? (
                <form onSubmit={onSubmit} className="mt-6">
                  <div className="space-y-5">
                    <FieldShell icon={Mail} label="Portal email">
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="student@example.com"
                        type="email"
                        autoComplete="email"
                        required
                        className="w-full bg-transparent text-sm font-semibold text-[#25455f] outline-none placeholder:text-[#8aa0b1]"
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
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#25455f] outline-none placeholder:text-[#8aa0b1]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="rounded-lg border border-[#efc39d] bg-[#fffaf4] px-2 py-1 text-[10px] font-black text-[#173b59] transition hover:bg-[#fff2e3]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </FieldShell>

                    <div className="flex items-center justify-between gap-3 text-[10px]">
                      <label className="flex cursor-pointer items-center gap-1.5 text-[#5a7083]">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 accent-[#ff4b13]"
                        />
                        Remember email this session
                      </label>
                      <span className="font-black text-[#ff4b13]">Supabase protected</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex w-full items-center justify-between rounded-xl bg-[#ff986e] px-5 py-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,112,61,0.16)] hover:-translate-y-0.5 hover:bg-[#ff875a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 ${TRANSITION}`}
                    >
                      <span>{loading ? "Opening Student OS..." : "Sign In to Student OS"}</span>
                      {!loading ? (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70">
                          <ArrowRight size={16} />
                        </span>
                      ) : null}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={onLegacySubmit} className="mt-4">
                  <div className="rounded-[1rem] border border-[#efc39d] bg-[#fffaf4] p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#f1c59e] bg-white text-[#ff4b13]">
                        <UsersRound size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b13]">
                          Migration Access
                        </p>
                        <h3 className="mt-1 text-sm font-black text-[#082d50]">
                          Find an older student record
                        </h3>
                        <p className="mt-1 text-[9px] leading-4 text-[#64798a]">
                          Use the email or WhatsApp number originally provided to Zaifan.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <FieldShell icon={Search} label="Email or WhatsApp">
                        <input
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          placeholder="Email or WhatsApp number"
                          className="w-full bg-transparent text-sm font-semibold text-[#25455f] outline-none placeholder:text-[#8aa0b1]"
                          required
                        />
                      </FieldShell>
                    </div>

                    <button
                      type="submit"
                      disabled={legacyLoading}
                      className={`mt-3 flex w-full items-center justify-between rounded-xl bg-[#ff986e] px-4 py-3 text-[10px] font-black text-white hover:bg-[#ff875a] disabled:cursor-not-allowed disabled:opacity-50 ${TRANSITION}`}
                    >
                      {legacyLoading ? "Searching Student Records..." : "Find My Student Record"}
                      {!legacyLoading ? <Search size={13} /> : null}
                    </button>
                  </div>
                </form>
              )}

              {hasMatches && !showMatchesModal ? (
                <button
                  type="button"
                  onClick={() => setShowMatchesModal(true)}
                  className={`mt-4 flex w-full items-center justify-between rounded-xl border border-[#efc39d] bg-[#fff7ef] px-4 py-3 text-left hover:border-[#ff9a63] hover:bg-[#fff2e3] ${TRANSITION}`}
                >
                  <span>
                    <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[#ff4b13]">
                      Student records found
                    </span>
                    <span className="mt-0.5 block text-xs font-black text-[#082d50]">
                      {matchSummary.total} matching record{matchSummary.total === 1 ? "" : "s"} ready to review
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#ff4b13]">
                    View records
                    <ChevronRight size={13} />
                  </span>
                </button>
              ) : null}

              <div className="mt-6 rounded-[1.25rem] border border-[#efc39d] bg-[#fffaf4] px-4 py-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#f1c59e] bg-white text-[#ff4b13]">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-[#082d50]">
                      Private. Secure. Student Approved.
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-[#64798a]">
                      Only authorized students can access assigned records. Your existing
                      Supabase authentication and portal verification remain unchanged.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-[9px] text-[#6e8292]">
                Zaifan Consultancy · Student Operations System
              </p>
            </div>
          </main>
        </div>
      </div>

      {showMatchesModal && hasMatches ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#082d50]/55 px-3 py-4 backdrop-blur-[3px] sm:px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-record-picker-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowMatchesModal(false);
            }
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[1.8rem] border-2 border-[#f0a96d] bg-[#fffdf9] shadow-[0_32px_100px_rgba(8,45,80,0.32)]">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#efd3ba] bg-[#fff2e3] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#efb47e] bg-white text-[#ff4b13] shadow-sm">
                  <Fingerprint size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#ff4b13]">
                    Legacy Record Picker
                  </p>
                  <h3
                    id="student-record-picker-title"
                    className="mt-1 text-xl font-black text-[#082d50] sm:text-2xl"
                  >
                    Choose your Student ID
                  </h3>
                  <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#64798a] sm:text-[11px]">
                    We found {matchSummary.total} matching records. Check the Student ID,
                    name, record type, status and date, then open the correct workspace.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMatchesModal(false)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e4b98f] bg-white text-[#173b59] hover:border-[#ff9a63] hover:bg-[#fff7ef] ${TRANSITION}`}
                aria-label="Close student record picker"
              >
                <X size={17} />
              </button>
            </div>

            <div className="shrink-0 border-b border-[#edf1f3] bg-white px-4 py-3 sm:px-6">
              <div className="grid grid-cols-3 gap-2">
                <RecordPickerStat
                  label="Matches"
                  value={matchSummary.total}
                  tone="navy"
                />
                <RecordPickerStat
                  label="Connected"
                  value={matchSummary.withData}
                  tone="green"
                />
                <RecordPickerStat
                  label="Older Records"
                  value={matchSummary.empty}
                  tone="orange"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fffaf4] p-3 [scrollbar-color:#d8a578_#fff4e8] [scrollbar-width:thin] sm:p-5">
              <div className="grid gap-3 md:grid-cols-2">
                {matches.map((student, index) => {
                  const hasPortalData =
                    Number(student.portalCounts?.total || 0) > 0;
                  const studentType = formatType(student.student_type);
                  const status = getStatus(student);
                  const date = formatDate(
                    student.created_at || student.appointment_date
                  );
                  const studentId =
                    student.id ||
                    student.student_id ||
                    student.portal_student_id ||
                    "—";

                  return (
                    <button
                      key={
                        student.portal_student_key ||
                        `${student.student_type}-${student.id}`
                      }
                      type="button"
                      onClick={() => {
                        setShowMatchesModal(false);
                        onSelectMatch(student);
                      }}
                      className={`group relative overflow-hidden rounded-[1.25rem] border-2 bg-white p-4 text-left shadow-[0_6px_18px_rgba(8,45,80,0.05)] hover:-translate-y-0.5 hover:border-[#ff9a63] hover:shadow-[0_14px_32px_rgba(80,50,24,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${TRANSITION} ${
                        hasPortalData
                          ? "border-emerald-200"
                          : "border-[#ead7c5]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={`flex h-12 min-w-12 shrink-0 items-center justify-center rounded-xl border px-2 text-sm font-black ${
                              hasPortalData
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-[#f1c59e] bg-[#fff7ef] text-[#ff4b13]"
                            }`}
                          >
                            #{studentId}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-black text-[#082d50]">
                              {getName(student)}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              <span className="rounded-full border border-[#c9d8e3] bg-[#f4f8fb] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.09em] text-[#31536d]">
                                {studentType}
                              </span>
                              <span className="rounded-full border border-[#f0c7a3] bg-[#fff6ed] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.09em] text-[#a84a19]">
                                {status}
                              </span>
                              {hasPortalData ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.09em] text-emerald-700">
                                  <BadgeCheck size={8} />
                                  Portal Data
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className={`mt-1 shrink-0 text-[#ff4b13] group-hover:translate-x-1 ${TRANSITION}`}
                        />
                      </div>

                      <div className="mt-4 grid gap-2 border-t border-[#edf1f3] pt-3 text-[9px] text-[#64798a]">
                        <p className="truncate">
                          <span className="font-black text-[#31536d]">Email:</span>{" "}
                          {getEmail(student)}
                        </p>
                        <p className="truncate">
                          <span className="font-black text-[#31536d]">Phone:</span>{" "}
                          {getPhone(student)}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <p>
                            <span className="font-black text-[#31536d]">Date:</span>{" "}
                            {date}
                          </p>
                          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#ff4b13]">
                            Open workspace
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex shrink-0 items-start gap-2 border-t border-[#efd3ba] bg-[#fffdf9] px-4 py-3 text-[9px] leading-4 text-[#718493] sm:px-6">
              <ShieldCheck size={12} className="mt-0.5 shrink-0 text-[#ff4b13]" />
              <p>
                Older records may contain historical contact details. Student ID, record type,
                status and date are the safest details to compare before opening a record.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}


function RecordPickerStat({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#c8d7e2] bg-[#f4f8fb] text-[#173b59]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 text-center ${tones[tone] || tones.navy}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.12em] opacity-65">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}

function CompactFeature({ icon: Icon, label }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-1 py-1 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#f1c59e] bg-[#fffaf4] text-[#ff4b13]">
        <Icon size={16} />
      </div>
      <p className="mt-1.5 text-[9px] font-black leading-[1.15] text-[#082d50]">
        {label}
      </p>
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
      className={`rounded-xl px-4 py-3 text-left ${TRANSITION} ${
        active
          ? "border border-[#efc39d] bg-[#fffdf9] text-[#082d50] shadow-sm"
          : "border border-transparent text-[#64798a] hover:bg-white/70 hover:text-[#173b59]"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} className={active ? "text-[#ff4b13]" : "text-[#91a1ae]"} />
        <span className="text-xs font-black">{label}</span>
      </div>
      <p className="mt-0.5 hidden pl-5 text-[9px] font-semibold text-[#91a1ae] sm:block">
        {description}
      </p>
    </button>
  );
}

function FieldShell({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-[#082d50]">
        {label}
      </span>
      <div className="flex items-center gap-2.5 rounded-2xl border border-[#b8cbd9] bg-[#fffdf9] px-4 py-3.5 transition focus-within:border-[#f2a36d] focus-within:ring-2 focus-within:ring-orange-100">
        <Icon size={17} className="shrink-0 text-[#ff6b35]" />
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
      <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-60">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black">{value}</p>
    </div>
  );
}

export default StudentPortalAuth;
