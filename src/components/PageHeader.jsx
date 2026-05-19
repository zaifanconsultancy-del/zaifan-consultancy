import { motion } from "framer-motion";

function PageHeader({ badge, title, highlight, text }) {
  return (
    <section className="relative overflow-hidden bg-[#0b0b0b] px-6 pb-20 pt-36 text-white">

      {/* Glow */}
      <div className="absolute left-[-10%] top-[-20%] h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">

        <motion.div
          initial={{ opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-[#D4AF37]/20 bg-white/5 px-5 py-2 text-sm uppercase tracking-[0.25em] text-[#E7C768] backdrop-blur-xl">
            {badge}
          </div>

          {/* Title */}
          <h1 className="mt-8 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            {title}{" "}
            <span className="text-[#D4AF37]">
              {highlight}
            </span>
          </h1>

          {/* Text */}
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-gray-400">
            {text}
          </p>
        </motion.div>

      </div>
    </section>
  );
}

export default PageHeader;