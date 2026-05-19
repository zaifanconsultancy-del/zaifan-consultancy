import studentImage from "../assets/student.jpg"
import { motion } from "framer-motion"

function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0F0F10] via-[#171717] to-[#111111] text-white flex items-center px-6 pt-32 pb-20"
    >
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl"></div>

      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-200/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <span className="inline-block mb-6 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-gray-300 backdrop-blur-md">
            Study Abroad Consultancy
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight max-w-2xl">
            Global Education.
            <br />
            Clear Guidance.
            <br />
            Better Future.
          </h1>

          <p className="mt-7 max-w-xl text-base md:text-lg text-gray-300 leading-relaxed">
            Zaifan Consultancy helps students with admissions,
            scholarships, visa guidance, SOPs, documentation and
            complete study abroad planning.
          </p>

          {/* Buttons */}
          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <a
              href="#contact"
              className="bg-[#D6CEC2] text-[#111111] px-7 py-3 rounded-full font-bold hover:bg-[#E4DBCF] transition text-center shadow-xl"
            >
              Book Free Consultation
            </a>

            <a
              href="#countries"
              className="border border-white/20 bg-white/5 backdrop-blur-md px-7 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition text-center"
            >
              Explore Countries
            </a>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg border-t border-white/10 pt-8">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold">
                10+
              </h3>

              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Countries
              </p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold">
                500+
              </h3>

              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Students Guided
              </p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold">
                24/7
              </h3>

              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Support
              </p>
            </div>
          </div>
        </motion.div>

        {/* RIGHT SIDE IMAGE */}
        <motion.div
          className="relative hidden lg:flex justify-end"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9 }}
        >
          <div className="absolute inset-0 bg-amber-200/10 blur-3xl rounded-full"></div>

          <img
            src={studentImage}
            alt="Study abroad student"
            className="relative rounded-[2.5rem] shadow-2xl w-full max-w-lg h-[620px] object-cover border border-white/10"
          />

          {/* Floating Card */}
          <div className="absolute -bottom-6 left-0 bg-white/95 backdrop-blur-xl text-black rounded-3xl shadow-2xl p-6 max-w-sm border border-white/30">
            <p className="text-sm font-semibold leading-relaxed">
              Complete guidance from profile evaluation to visa preparation.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

export default Hero