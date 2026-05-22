import { motion } from "framer-motion";
import studentImage from "../assets/student.jpg";
import MagneticButton from "./MagneticButton";

function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden bg-[#050505] px-6 pt-32 pb-20 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_85%_60%,rgba(255,244,214,0.06),transparent_30%)]"></div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#050505]/80 to-[#050505]"></div>

      <motion.div
        initial={{ opacity: 0, y: 45 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative z-10 mx-auto grid min-h-[76vh] max-w-7xl items-center gap-16 lg:grid-cols-[1fr_0.95fr]"
      >
        {/* LEFT */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mb-6 text-sm font-semibold uppercase tracking-[0.45em] text-[#D4AF37]"
          >
            Study Abroad Consultancy
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.25 }}
            className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl"
          >
            Your Gateway To
            <br />
            <span className="text-[#D4AF37]">Global Success</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35 }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-gray-300"
          >
            Premium overseas education consultancy helping students achieve
            international dreams with expert admission, scholarship and visa
            guidance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <MagneticButton
              href="/appointment"
              className="block rounded-full bg-[#D4AF37] px-9 py-4 font-bold text-black shadow-[0_0_35px_rgba(212,175,55,0.24)] transition hover:bg-[#E7C768]"
            >
              Book Free Consultation
            </MagneticButton>

            <MagneticButton
              href="#countries"
              className="block rounded-full bg-white/[0.05] px-9 py-4 font-bold text-white backdrop-blur-md transition hover:bg-white/[0.08] hover:text-[#D4AF37]"
            >
              Explore Countries
            </MagneticButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.55 }}
            className="mt-14 grid max-w-xl grid-cols-3 gap-5 border-t border-white/10 pt-8"
          >
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
          </motion.div>
        </div>

        {/* RIGHT IMAGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="relative hidden justify-center lg:flex"
        >
          <div className="absolute -inset-8 rounded-[3rem] bg-[#D4AF37]/10 blur-3xl"></div>

          <div className="relative w-full max-w-[530px] overflow-hidden rounded-[2rem] bg-white/[0.03] p-2 shadow-2xl shadow-black/60">
            <div className="relative h-[470px] overflow-hidden rounded-[1.6rem]">
              <img
                src={studentImage}
                alt="Student studying abroad"
                className="h-full w-full object-cover brightness-[0.8] contrast-110 transition duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                  Guided Process
                </p>

                <p className="mt-3 max-w-sm text-base font-semibold leading-relaxed text-white">
                  From profile evaluation to visa preparation — guided with
                  clarity and confidence.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;