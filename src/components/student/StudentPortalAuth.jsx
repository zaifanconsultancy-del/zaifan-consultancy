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
  return (
    <span
      className={`rounded-xl border px-3 py-2 text-center text-[11px] font-black ${
        Number(value) > 0
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-white/10 bg-black/20 text-white/35"
      }`}
    >
      {label}: {value || 0}
    </span>
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
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050505] px-5 py-20 text-white">
      <div className="absolute left-[-10%] top-[-15%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
        <div className="w-full max-w-4xl rounded-[2rem] border border-[#D4AF37]/20 bg-white/[0.035] p-7 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-9">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#D4AF37]">
                Student Portal V2
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight text-white">
                Login to Your Study Dashboard
              </h1>
            </div>

            <div className="hidden h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-3xl sm:flex">
              🎓
            </div>
          </div>

          <p className="text-sm leading-6 text-white/50">
            Login with your official student portal account. During migration, legacy
            duplicate-safe lookup is still available below.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                Official Portal Login
              </p>
<div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
  Portal Accounts are active for testing. Use the assigned student email and password.
</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Portal email"
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]/60"
                />

                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]/60"
                />
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
  type="submit"
  disabled={loading}
  className="mt-4 w-full rounded-2xl bg-[#D4AF37] px-5 py-4 font-black text-black transition hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
>
  {loading ? "Opening Portal..." : "Login to Portal"}
</button>
            </div>
          </form>

          <form onSubmit={onLegacySubmit} className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/35">
                Legacy Lookup During Migration
              </p>

              <p className="mt-2 text-xs leading-5 text-white/45">
                Use the email or WhatsApp number you gave to Zaifan.
              </p>

              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Email or WhatsApp number"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]/60"
              />

              <button
                type="submit"
                disabled={legacyLoading}
                className="mt-4 w-full rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-5 py-4 font-black text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {legacyLoading ? "Checking Student Records..." : "Find Legacy Portal Record"}
              </button>
            </div>
          </form>

          {matches.length ? (
            <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]">
                Multiple Records Found
              </p>

              <p className="mt-2 text-sm text-white/45">
                Choose the correct record to open the portal.
              </p>

              <div className="mt-4 grid gap-3">
                {matches.map((student) => (
                  <button
                    key={student.portal_student_key || `${student.student_type}-${student.id}`}
                    type="button"
                    onClick={() => onSelectMatch(student)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      student.portalCounts?.total > 0
                        ? "border-emerald-400/25 bg-emerald-500/10 hover:border-emerald-400/45"
                        : "border-white/10 bg-black/25 hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/10"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-white">{getName(student)}</p>

                        <p className="mt-1 text-xs text-white/45">
                          {getEmail(student)} · {getPhone(student)}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          Created: {formatDate(student.created_at || student.appointment_date)}
                        </p>

                        {student.country || student.country_interest || student.preferred_country ? (
                          <p className="mt-1 text-xs text-white/35">
                            Country:{" "}
                            {student.country || student.country_interest || student.preferred_country}
                          </p>
                        ) : null}

                        {student.field_of_interest ||
                        student.course ||
                        student.program ||
                        student.consultation_type ? (
                          <p className="mt-1 text-xs text-white/35">
                            Interest:{" "}
                            {student.field_of_interest ||
                              student.course ||
                              student.program ||
                              student.consultation_type}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#D4AF37]">
                          {formatType(student.student_type)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                          ID {student.id}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                          {getStatus(student)}
                        </span>

                        {student.portalCounts?.total > 0 ? (
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                            Has OS Data
                          </span>
                        ) : (
                          <span className="rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-300">
                            Empty Record
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <MiniPortalCount label="Apps" value={student.portalCounts?.applications || 0} />
                      <MiniPortalCount label="Docs" value={student.portalCounts?.documents || 0} />
                      <MiniPortalCount label="Tasks" value={student.portalCounts?.tasks || 0} />
                      <MiniPortalCount label="Unis" value={student.portalCounts?.universities || 0} />
                      <MiniPortalCount label="Msgs" value={student.portalCounts?.communications || 0} />
                      <MiniPortalCount label="Timeline" value={student.portalCounts?.timeline || 0} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Stable Portal Login
            </p>
            <p className="mt-2 text-xs leading-5 text-white/45">
  Current Production Mode: Legacy Lookup.
  Student Portal Accounts will be activated after Admin OS account management is completed.
</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudentPortalAuth;