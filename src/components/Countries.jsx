import { motion } from "framer-motion";
import gate from "../assets/images/countries/gate.jpg";

function Countries() {
  const countries = [
    {
      name: "Italy",
      code: "IT",
      highlight: "Scholarship Friendly",
      desc: "Affordable education, regional scholarships and manageable living costs.",
      points: [
        "Scholarship routes",
        "Affordable tuition",
        "Budget friendly",
      ],
    },
    {
      name: "Germany",
      code: "DE",
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
      code: "TR",
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
      code: "UK",
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
      code: "CA",
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
      code: "AU",
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
      {/* BLOBS */}
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="absolute right-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl">
        {/* TOP */}
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
            <span className="text-[#D4AF37]">
              real direction.
            </span>
          </h2>

          <p className="mt-5 text-lg leading-relaxed text-gray-400">
            We help students compare countries based on budget,
            academics, opportunities and long-term goals.
          </p>
        </motion.div>

        {/* MAIN IMAGE */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative mt-16 overflow-hidden rounded-[2.5rem] border border-white/10"
        >
          <img
            src={gate}
            alt="Study Abroad"
            className="h-[280px] w-full object-cover opacity-45"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-[#0b0b0b]"></div>

          <div className="absolute inset-0 bg-[#D4AF37]/5"></div>
        </motion.div>

        {/* CARDS */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {countries.map((country, index) => (
            <motion.div
              key={country.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]"
            >
              {/* PREMIUM STRIP */}
              <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="text-5xl font-black tracking-tight text-white">
                    {country.code}
                  </div>

                  <h3 className="mt-5 text-3xl font-extrabold text-white">
                    {country.name}
                  </h3>
                </div>

                <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
                  {country.highlight}
                </span>
              </div>

              <p className="mt-6 leading-relaxed text-gray-400">
                {country.desc}
              </p>

              <ul className="mt-8 space-y-4">
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

              <button className="mt-10 w-full rounded-full border border-[#D4AF37]/25 bg-white/[0.03] py-4 text-sm font-semibold text-[#D4AF37] transition duration-300 hover:bg-[#D4AF37]/10">
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