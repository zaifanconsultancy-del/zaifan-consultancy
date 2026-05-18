import studentImage from "../assets/student.jpg"
import { motion } from "framer-motion"

function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex items-center px-6 pt-24"
    >
      <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <span className="inline-block mb-5 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
            Trusted Study Abroad Guidance
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Build Your Future With{" "}
            <span className="text-yellow-400">Global Education</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-gray-300 leading-relaxed">
            Zaifan Consultancy helps students with university admissions, visa
            guidance, scholarships, SOPs, documentation, and complete study
            abroad planning.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="bg-yellow-400 text-black px-7 py-3 rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg shadow-yellow-500/20 text-center"
            >
              Book Free Consultation
            </a>

            <a
              href="#countries"
              className="border border-white/30 px-7 py-3 rounded-xl font-semibold hover:bg-white hover:text-black transition text-center"
            >
              Explore Countries
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <h3 className="text-2xl font-bold text-yellow-400">10+</h3>
              <p className="text-sm text-gray-400">Countries</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-yellow-400">500+</h3>
              <p className="text-sm text-gray-400">Students Guided</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-yellow-400">24/7</h3>
              <p className="text-sm text-gray-400">Support</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="relative flex justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
        >
          <div className="absolute -inset-4 rounded-3xl bg-yellow-400/20 blur-2xl"></div>

          <img
            src={studentImage}
            alt="Study abroad student"
            className="relative rounded-3xl shadow-2xl w-full max-w-md h-[520px] object-cover border border-white/10"
          />

          <div className="absolute -bottom-6 left-2 bg-white text-black rounded-2xl shadow-xl p-4 max-w-xs">
            <p className="text-sm font-semibold">
              Complete guidance from profile evaluation to visa preparation.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero