import { motion } from "framer-motion";
import studentImage from "../assets/student.jpg";

function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden bg-[#0b0b0b] text-white px-6 pt-32 pb-20"
    >
      {/* Premium background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.20),transparent_30%),radial-gradient(circle_at_80%_60%,rgba(245,222,179,0.10),transparent_30%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#0b0b0b]/70 to-[#050505]"></div>

      <motion.div
        initial={{ opacity: 0, y: 55 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center min-h-[75vh]"
      >
        {/* Left */}
        <div>
          <div className="inline-flex items-center rounded-full border border-[#D4AF37]/30 bg-white/5 px-5 py-2 text-sm text-[#E8D8B0] mb-8 backdrop-blur-md">
            Study Abroad Consultancy
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
            Global Education.
            <br />
            Clear Guidance.
            <br />
            <span className="text-[#D4AF37]">Better Future.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-gray-300">
            Zaifan Consultancy helps students with admissions, scholarships,
            visa guidance, SOPs, documentation and complete study abroad
            planning.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="rounded-full bg-[#E2BC48] px-8 py-4 font-semibold text-black shadow-[0_0_35px_rgba(212,175,55,0.25)] transition hover:scale-105"
            >
              Book Free Consultation
            </a>

            <a
              href="#countries"
              className="rounded-full border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-md transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              Explore Countries
            </a>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-white/10 pt-8 max-w-lg">
            <div>
              <h3 className="text-3xl font-bold text-white">10+</h3>
              <p className="text-sm text-gray-400">Countries</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">500+</h3>
              <p className="text-sm text-gray-400">Students Guided</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">24/7</h3>
              <p className="text-sm text-gray-400">Support</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <div className="absolute -inset-8 rounded-[45px] bg-[#D4AF37]/10 blur-3xl"></div>

          <div className="relative overflow-hidden rounded-[36px] border border-[#D4AF37]/20 bg-white/5 shadow-2xl">
            <img
              src={studentImage}
              alt="Student studying abroad"
              className="h-[520px] w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>

          <div className="absolute -bottom-7 -left-10 max-w-xs rounded-3xl border border-white/10 bg-[#f5efe3] p-5 text-black shadow-2xl">
            <p className="text-sm font-bold">
              Complete guidance from profile evaluation to visa preparation.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default Hero;