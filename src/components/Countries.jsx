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
  ]

  return (
    <section
      id="countries"
      className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden"
    >
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-300/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Destinations
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Study destinations with real direction.
          </h2>

          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            We help students compare countries based on budget, academics,
            opportunities and long-term goals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {countries.map((country, index) => (
            <div
              key={index}
              className="group bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-[#FFFCF6] hover:text-[#111111] transition duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="text-5xl">{country.flag}</div>

                <span className="text-xs uppercase tracking-[0.2em] text-amber-100 bg-white/10 px-3 py-2 rounded-full group-hover:bg-[#111111] group-hover:text-amber-100">
                  {country.highlight}
                </span>
              </div>

              <h3 className="text-2xl font-bold mt-8 mb-4">
                {country.name}
              </h3>

              <p className="text-gray-400 leading-relaxed group-hover:text-stone-700">
                {country.desc}
              </p>

              <ul className="mt-6 space-y-3">
                {country.points.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-stone-700"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-200"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Countries