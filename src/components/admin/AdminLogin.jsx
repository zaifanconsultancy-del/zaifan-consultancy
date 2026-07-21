// AdminLogin V2 — High Contrast Admin OS
// Preserves controlled email/password fields, submit flow, and Framer Motion entry animation.
// Rebuilt to match the approved Zaifan Admin OS foundation.

import { motion } from "framer-motion";

function AdminLogin({
  email,
  password,
  setEmail,
  setPassword,
  handleLogin,
  inputClass,
}) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff8ee] px-6 text-[#10233f]">
      <div className="absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-orange-200/40 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[420px] rounded-full bg-amber-100/60 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border-2 border-orange-300 bg-white p-8 shadow-[0_28px_90px_rgba(15,35,63,0.12)]"
      >
        <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500"></span>
            Enterprise Access
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.35em] text-orange-700">
            Admin Login
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight text-[#10233f] sm:text-5xl">
            Welcome Back
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Access the Zaifan CRM dashboard to manage students,
            appointments, analytics, and enterprise workflows.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Admin Email
            </p>

            <input
              type="email"
              placeholder="admin@zaifan.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
              Password
            </p>

            <input
              type="password"
              placeholder="Enter secure password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="group relative w-full overflow-hidden rounded-2xl bg-orange-500 py-4 text-sm font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(249,115,22,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-orange-600"
          >
            <span className="relative z-10">Enter CRM Dashboard</span>
            <span className="absolute inset-0 translate-y-full bg-white/15 transition duration-500 group-hover:translate-y-0"></span>
          </button>
        </form>

        <div className="mt-6 rounded-[1.4rem] border border-slate-300 bg-[#fffaf2] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Security Layer
              </p>

              <p className="mt-2 text-sm font-black text-[#10233f]">
                Protected enterprise CRM access.
              </p>
            </div>

            <div className="rounded-2xl border border-orange-300 bg-orange-50 p-3 text-2xl">
              🔐
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default AdminLogin;