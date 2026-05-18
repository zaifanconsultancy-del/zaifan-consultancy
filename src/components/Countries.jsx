function Countries() {
  const countries = [
    {
      name: "United Kingdom",
      flag: "🇬🇧",
      desc: "Top universities, strong career pathways and global recognition."
    },
    {
      name: "Canada",
      flag: "🇨🇦",
      desc: "Affordable education with post-study work opportunities."
    },
    {
      name: "Australia",
      flag: "🇦🇺",
      desc: "Excellent education system and student-friendly lifestyle."
    },
    {
      name: "Germany",
      flag: "🇩🇪",
      desc: "Low tuition options and high-quality engineering programs."
    },
    {
      name: "Italy",
      flag: "🇮🇹",
      desc: "Scholarship opportunities and affordable living costs."
    },
    {
      name: "Turkey",
      flag: "🇹🇷",
      desc: "Budget-friendly universities with growing international demand."
    },
  ]

  return (
    <section
      id="countries"
      className="py-24 bg-slate-950 text-white px-6"
    >
      <div className="max-w-7xl mx-auto">

        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold">
            Popular Study Destinations
          </h2>

          <p className="text-gray-400 mt-4 text-lg">
            Explore countries where we help students build their future.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {countries.map((country, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:border-yellow-400 hover:-translate-y-2 transition duration-300"
            >
              <div className="text-5xl mb-5">
                {country.flag}
              </div>

              <h3 className="text-2xl font-bold mb-3">
                {country.name}
              </h3>

              <p className="text-gray-400 leading-relaxed">
                {country.desc}
              </p>

              <button className="mt-6 text-yellow-400 font-semibold hover:text-yellow-300">
                Learn More →
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Countries