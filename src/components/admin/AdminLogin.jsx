function AdminLogin({
  email,
  password,
  setEmail,
  setPassword,
  handleLogin,
  inputClass,
}) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <div className="absolute h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

        <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
          Admin Login
        </p>

        <h1 className="mt-4 text-4xl font-extrabold">
          Enter Admin Details
        </h1>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />

          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#D4AF37] py-4 font-semibold text-black transition hover:bg-[#E7C768]"
          >
            Login
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminLogin;