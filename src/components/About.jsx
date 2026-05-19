function About() {
  const features = [
    "Profile evaluation based on academics & budget",
    "University shortlist guidance",
    "Visa & documentation support",
    "Scholarship assistance",
    "Transparent consultation process",
    "Step-by-step student guidance",
  ]

  return (
    <section
      id="about"
      className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-200/10 blur-3xl rounded-full"></div>

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

        {/* LEFT SIDE */}
        <div>
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            About
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Honest guidance for students planning to study abroad.
          </h2>

          <p className="mt-6 text-lg text-gray-400 leading-relaxed">
            Zaifan Consultancy helps students navigate the study abroad process with clarity, structure and professional support.
          </p>

          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            From university applications to scholarships, documents and visa preparation — every step is handled with careful guidance.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl">

          <h3 className="text-3xl font-bold text-white">
            Why Students Choose Us
          </h3>

          <div className="mt-10 space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-amber-200/10 flex items-center justify-center text-amber-200 font-bold">
                  ✓
                </div>

                <p className="text-lg text-gray-300">
                  {feature}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}

export default About