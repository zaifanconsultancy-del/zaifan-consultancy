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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-6 text-white">
      <div className="absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="absolute bottom-[-10%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
            <span className="h-2 w-2 rounded-full bg-[#D4AF37]"></span>
            Enterprise Access
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Admin Login
          </p>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
            Welcome Back
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Access the Zaifan CRM dashboard to manage students,
            appointments, analytics, and enterprise workflows.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-gray-500">
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
            <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-gray-500">
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
            className="group relative w-full overflow-hidden rounded-2xl bg-[#D4AF37] py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768]"
          >
            <span className="relative z-10">Enter CRM Dashboard</span>

            <span className="absolute inset-0 translate-y-full bg-white/20 transition duration-500 group-hover:translate-y-0"></span>
          </button>
        </form>

        <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                Security Layer
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                Protected enterprise CRM access.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3 text-2xl">
              🔐
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default AdminLogin;
