import { motion } from "framer-motion";
import girl from "../assets/images/testimonials/girl.jpg";

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
    <section className="relative overflow-hidden bg-[#050505] px-6 py-32 text-white">
      <div className="absolute right-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Testimonials
          </span>

          <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
            Students trust{" "}
            <span className="text-[#D4AF37]">Zaifan Consultancy.</span>
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-gray-400">
            Real student experiences from admissions and study abroad guidance.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
            initial={{ opacity: 0, x: -45 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.8rem] border border-[#D4AF37]/20 bg-white/[0.04] p-2 backdrop-blur-xl"
          >
            <div className="relative h-[620px] overflow-hidden rounded-[2.2rem]">
              <img
                src={girl}
                alt="Student success"
                className="h-full w-full object-cover brightness-[0.75] contrast-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/25 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-sm uppercase tracking-[0.3em] text-[#D4AF37]">
                  Student Success
                </p>

                <h3 className="mt-4 max-w-md text-3xl font-bold leading-tight">
                  Guidance students can confidently trust.
                </h3>
              </div>
            </div>
          </motion.div>

          <div className="grid content-center gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/20 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/45 hover:bg-white/[0.06] hover:shadow-[0_25px_80px_rgba(212,175,55,0.10)]"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] scale-x-0 bg-[#D4AF37] transition duration-500 group-hover:scale-x-100"></div>

                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{review.name}</h3>
                    <p className="mt-1 text-sm uppercase tracking-[0.25em] text-[#D4AF37]">
                      {review.country}
                    </p>
                  </div>

                  <div className="text-[#D4AF37]">★★★★★</div>
                </div>

                <p className="relative z-10 mt-7 text-lg leading-relaxed text-gray-300">
                  “{review.review}”
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;