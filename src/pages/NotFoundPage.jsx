import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function NotFoundPage() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080807] px-6 text-white">

      {/* Glow */}
      <div className="absolute left-[-10%] top-[-10%] h-[400px] w-[400px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 text-center"
      >
        <h1 className="text-8xl font-black text-[#D4AF37] md:text-[10rem]">
          404
        </h1>

        <h2 className="mt-6 text-3xl font-extrabold md:text-5xl">
          Page Not Found
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link
          to="/"
          className="mt-10 inline-flex rounded-full bg-[#D4AF37] px-8 py-4 font-semibold text-black transition hover:scale-105 hover:bg-[#E7C768]"
        >
          Return Home
        </Link>
      </motion.div>
    </section>
  );
}

export default NotFoundPage;