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
    <section className="relative overflow-hidden bg-[#0b0b0b] px-6 py-32 text-white">
      <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/10 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-base font-semibold uppercase tracking-[0.3em] text-amber-200/70 md:text-lg">
            Testimonials
          </span>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Students trust{" "}
            <span className="text-[#D4AF37]">Zaifan Consultancy.</span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            Real student experiences from admissions and study abroad guidance.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] hover:shadow-[0_25px_80px_rgba(212,175,55,0.1)]"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37] text-lg font-extrabold text-black">
                  {review.name.charAt(0)}
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {review.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">
                    {review.country}
                  </p>
                </div>
              </div>

              <p className="relative z-10 mt-8 text-lg leading-relaxed text-gray-300">
                “{review.review}”
              </p>

              <div className="relative z-10 mt-8 flex gap-1 text-[#D4AF37]">
                ★★★★★
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;