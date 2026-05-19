function Process() {
  const steps = [
    {
      number: "01",
      title: "Profile Evaluation",
      text: "We analyze academics, budget, goals and study preferences before suggesting options.",
    },
    {
      number: "02",
      title: "Country Selection",
      text: "Students are guided toward countries and universities suitable for their profile.",
    },
    {
      number: "03",
      title: "Application Process",
      text: "We assist with university applications, SOPs and required documentation.",
    },
    {
      number: "04",
      title: "Visa Preparation",
      text: "Complete support for financial documents, interview preparation and visa filing.",
    },
    {
      number: "05",
      title: "Departure Support",
      text: "Students receive final guidance before travelling abroad for studies.",
    },
  ]

  return (
    <section className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-300/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Process
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Your study abroad journey step by step.
          </h2>

          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            A structured process designed to make international admissions simple and clear.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-white/5 rounded-[2rem] p-8 border border-white/10 hover:border-amber-200/30 hover:bg-amber-200/5 transition duration-300"
            >
              <div className="text-5xl font-extrabold text-amber-100/40">
                {step.number}
              </div>

              <h3 className="mt-8 text-xl font-bold">
                {step.title}
              </h3>

              <p className="mt-4 text-gray-400 leading-relaxed text-sm">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Process