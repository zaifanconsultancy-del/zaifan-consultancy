function About() {
  const features = [
    "Profile evaluation based on academics & budget",
    "University shortlist guidance",
    "Visa & documentation support",
    "Scholarship assistance",
    "Honest consultation process",
    "Step-by-step application guidance",
  ]

  return (
    <section
      id="about"
      className="py-24 bg-gray-100 px-6"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        
        {/* Left Side */}
        <div>
          <span className="inline-block mb-5 rounded-full bg-yellow-100 text-yellow-700 px-4 py-2 text-sm font-medium">
            About Zaifan Consultancy
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Helping Students Build Their Future Abroad
          </h2>

          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            Zaifan Consultancy was created to simplify the study abroad journey
            for students who want honest guidance and better opportunities.
          </p>

          <p className="mt-4 text-gray-600 text-lg leading-relaxed">
            From country selection to university admissions, scholarships,
            documents and visas — we guide students through every step.
          </p>
        </div>

        {/* Right Side */}
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Why Students Choose Us
          </h3>

          <div className="grid gap-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold">
                  ✓
                </div>

                <p className="text-gray-600">
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