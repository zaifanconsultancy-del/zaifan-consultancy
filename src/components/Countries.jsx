import { motion } from "framer-motion";

function Countries() {
  const countries = [
    {
      name: "Italy",
      flag: "🇮🇹",
      highlight: "Scholarship Friendly",
      desc: "Popular for affordable education, regional scholarships and manageable living costs.",
      points: ["Scholarship routes", "Affordable tuition", "Good for budget students"],
    },
    {
      name: "Germany",
      flag: "🇩🇪",
      highlight: "Low Tuition Options",
      desc: "Known for quality education, engineering programs and strong career pathways.",
      points: ["Low tuition", "Strong academics", "Career-focused programs"],
    },
    {
      name: "Turkey",
      flag: "🇹🇷",
      highlight: "Budget Friendly",
      desc: "A practical option for students looking for affordable universities close to Pakistan.",
      points: ["Affordable fees", "Easy travel access", "Growing demand"],
    },
    {
      name: "United Kingdom",
      flag: "🇬🇧",
      highlight: "Global Recognition",
      desc: "Ideal for students looking for globally recognized degrees and strong academic exposure.",
      points: ["Top universities", "Shorter degrees", "Career exposure"],
    },
    {
      name: "Canada",
      flag: "🇨🇦",
      highlight: "Future Pathways",
      desc: "Popular for quality education, multicultural environment and long-term opportunities.",
      points: ["Student-friendly", "Quality education", "Work pathways"],
    },
    {
      name: "Australia",
      flag: "🇦🇺",
      highlight: "Modern Education",
      desc: "Known for modern campuses, student lifestyle and internationally respected degrees.",
      points: ["Modern universities", "Student lifestyle", "Global degrees"],
    },
  ];

  return (
    <section
      id="countries"
      className="relative overflow-hidden bg-[#0b0b0b] py-32 px-6 text-white"
    >
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>
      <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Destinations
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
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
              key={index}
              initial={{ opacity: 0, y: 55 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="text-5xl">{country.flag}</div>

                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#E7C768]">
                  {country.highlight}
                </span>
              </div>

              <h3 className="relative z-10 mt-8 text-2xl font-bold">
                {country.name}
              </h3>

              <p className="relative z-10 mt-4 leading-relaxed text-gray-400">
                {country.desc}
              </p>

              <ul className="relative z-10 mt-6 space-y-3">
                {country.points.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]"></span>
                    {point}
                  </li>
                ))}
              </ul>

              <div className="relative z-10 mt-8 h-[2px] w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-full"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Countries;