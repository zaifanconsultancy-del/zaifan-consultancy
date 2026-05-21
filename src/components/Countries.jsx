import { motion } from "framer-motion";

function Countries() {
  const countries = [
    {
      name: "Italy",
      flag: "🇮🇹",
      highlight: "Scholarship Friendly",
      desc: "Affordable education, regional scholarships and manageable living costs.",
      points: [
        "Scholarship routes",
        "Affordable tuition",
        "Good for budget students",
      ],
    },
    {
      name: "Germany",
      flag: "🇩🇪",
      highlight: "Low Tuition Options",
      desc: "Quality education, strong academics and career-focused study pathways.",
      points: [
        "Low tuition",
        "Strong academics",
        "Career-focused programs",
      ],
    },
    {
      name: "Turkey",
      flag: "🇹🇷",
      highlight: "Budget Friendly",
      desc: "Affordable universities, easy travel access and growing student demand.",
      points: [
        "Affordable fees",
        "Easy travel access",
        "Growing demand",
      ],
    },
    {
      name: "United Kingdom",
      flag: "🇬🇧",
      highlight: "Global Recognition",
      desc: "Globally recognized degrees with strong academic and career exposure.",
      points: [
        "Top universities",
        "Shorter degrees",
        "Career exposure",
      ],
    },
    {
      name: "Canada",
      flag: "🇨🇦",
      highlight: "Future Pathways",
      desc: "Quality education, multicultural environment and long-term opportunities.",
      points: [
        "Student-friendly",
        "Quality education",
        "Work pathways",
      ],
    },
    {
      name: "Australia",
      flag: "🇦🇺",
      highlight: "Modern Education",
      desc: "Modern campuses, respected degrees and excellent student lifestyle.",
      points: [
        "Modern universities",
        "Student lifestyle",
        "Global degrees",
      ],
    },
  ];

  return (
    <section
      id="countries"
      className="relative overflow-hidden bg-[#0b0b0b] px-6 py-32 text-white"
    >
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="absolute right-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-base font-semibold uppercase tracking-[0.3em] text-amber-200/70 md:text-lg">
            Destinations
          </span>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Study destinations with{" "}
            <span className="text-[#D4AF37]">real direction.</span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            We help students compare countries based on budget, academics,
            opportunities and long-term goals.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {countries.map((country, index) => (
            <motion.div
              key={country.name}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] hover:shadow-[0_25px_80px_rgba(212,175,55,0.1)]"
            >
              <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#D4AF37]/0 blur-3xl transition duration-500 group-hover:bg-[#D4AF37]/10"></div>

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="text-5xl drop-shadow-[0_0_20px_rgba(212,175,55,0.18)]">
                  {country.flag}
                </div>

                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E7C768]">
                  {country.highlight}
                </span>
              </div>

              <h3 className="relative z-10 mt-8 text-3xl font-extrabold text-white">
                {country.name}
              </h3>

              <p className="relative z-10 mt-4 min-h-[72px] leading-relaxed text-gray-400">
                {country.desc}
              </p>

              <ul className="relative z-10 mt-6 space-y-3">
                {country.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-3 text-sm text-gray-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]"></span>
                    {point}
                  </li>
                ))}
              </ul>

              <button className="relative z-10 mt-8 w-full rounded-full border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white transition duration-500 group-hover:border-[#D4AF37]/40 group-hover:text-[#D4AF37]">
                Explore {country.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Countries;