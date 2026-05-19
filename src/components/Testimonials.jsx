import { motion } from "framer-motion";

function Testimonials() {
  const reviews = [
    {
      name: "Ahmad Khan",
      country: "Italy",
      review:
        "Zaifan Consultancy guided me throughout the admission and visa process professionally.",
    },
    {
      name: "Hassan Ali",
      country: "Germany",
      review:
        "Everything was explained clearly from university applications to documents.",
    },
    {
      name: "Usman Tariq",
      country: "Turkey",
      review:
        "The consultation process felt honest and supportive from start to finish.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0b0b0b] py-32 px-6 text-white">

      {/* Glow */}
      <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Testimonials
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Students trust{" "}
            <span className="text-[#D4AF37]">
              Zaifan Consultancy.
            </span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            Real student experiences from admissions and study abroad guidance.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: index * 0.1,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/30"
            >

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

              {/* Quote */}
              <div className="relative z-10 text-6xl leading-none text-[#D4AF37]/25">
                “
              </div>

              {/* Review */}
              <p className="relative z-10 mt-6 leading-relaxed text-gray-300">
                {review.review}
              </p>

              {/* Footer */}
              <div className="relative z-10 mt-8 border-t border-white/10 pt-6">
                <h3 className="text-lg font-bold text-white">
                  {review.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Student — {review.country}
                </p>
              </div>

              {/* Bottom Accent */}
              <div className="relative z-10 mt-8 h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full"></div>

            </motion.div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default Testimonials;