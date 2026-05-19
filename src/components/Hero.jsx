import { motion } from "framer-motion";
import studentImage from "../assets/student.jpg";

function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden bg-[#080807] px-6 pt-32 pb-20 text-white"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(212,175,55,0.18),transparent_32%),radial-gradient(circle_at_85%_60%,rgba(255,244,214,0.08),transparent_30%)]"></div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#080807]/80 to-[#050505]"></div>

      <motion.div
        initial={{ opacity: 0, y: 45 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative z-10 mx-auto grid min-h-[76vh] max-w-7xl items-center gap-16 lg:grid-cols-[1fr_0.95fr]"
      >
        {/* LEFT */}
        <div>
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.45em] text-[#D4AF37]">
            Study Abroad Consultancy
          </p>

          <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
            Your Gateway To
            <br />
            <span className="text-[#D4AF37]">Global Success</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-gray-300">
            Premium overseas education consultancy helping students achieve
            international dreams with expert admission, scholarship and visa
            guidance.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded-full bg-[#D4AF37] px-9 py-4 font-bold text-black shadow-[0_0_35px_rgba(212,175,55,0.24)] transition hover:scale-105 hover:bg-[#E7C768]"
            >
              Book Free Consultation
            </a>

            <a
              href="#countries"
              className="rounded-full border border-[#D4AF37]/40 bg-white/[0.04] px-9 py-4 font-bold text-white backdrop-blur-md transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Explore Countries
            </a>
          </div>

          <div className="mt-14 grid max-w-xl grid-cols-3 gap-5 border-t border-white/10 pt-8">
            <div>
              <h3 className="text-3xl font-extrabold text-white">10+</h3>
              <p className="mt-1 text-sm text-gray-400">Countries</p>
            </div>

            <div>
              <h3 className="text-3xl font-extrabold text-white">500+</h3>
              <p className="mt-1 text-sm text-gray-400">Students Guided</p>
            </div>

            <div>
              <h3 className="text-3xl font-extrabold text-white">24/7</h3>
              <p className="mt-1 text-sm text-gray-400">Support</p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="relative hidden justify-center lg:flex"
        >
          <div className="absolute -inset-8 rounded-[3rem] bg-[#D4AF37]/12 blur-3xl"></div>

          <div className="relative w-full max-w-[530px] rounded-[2.7rem] bg-white/[0.03] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="overflow-hidden rounded-[2.2rem]">
              <img
                src={studentImage}
                alt="Student studying abroad"
                className="h-[470px] w-full object-cover"
              />
            </div>

            <div className="absolute inset-3 rounded-[2.2rem] bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>

            <div className="absolute -bottom-7 left-8 max-w-xs rounded-[1.7rem] border border-white/10 bg-[#F3EBDD] px-6 py-5 text-black shadow-2xl">
              <p className="text-sm font-bold leading-relaxed">
                From profile evaluation to visa preparation — guided with
                clarity.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;