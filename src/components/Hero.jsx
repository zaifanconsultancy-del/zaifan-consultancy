import studentImage from "../assets/student.jpg"
import { motion } from "framer-motion"

function Hero() {
  return (
    <section
      id="home"
      className="min-h-screen bg-gradient-to-r from-blue-900 to-black text-white flex items-center justify-center px-6"
    >
      <div className="max-w-6xl grid md:grid-cols-2 gap-10 items-center">
        
        {/* Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Your Gateway To Global Education
          </h1>

          <p className="mt-6 text-lg text-gray-300">
            Zaifan Consultancy helps students secure admissions, scholarships,
            visas, and career opportunities abroad.
          </p>

          <div className="mt-8 flex gap-4">
              <a
                href="#contact"
                className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400"
              >
                Book Free Consultation
              </a>

              <a
                href="#countries"
                className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-black"
              >
                Explore Countries
              </a>
          </div>
        </motion.div>

        {/* Right Side */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <img
            src={studentImage}
            alt="Students"
            className="rounded-2xl shadow-2xl w-full max-w-md h-[500px] object-cover"
          />
        </motion.div>

      </div>
    </section>
  )
}

export default Hero