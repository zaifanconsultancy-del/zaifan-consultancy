function Services() {
  const services = [
    {
      title: "University Admissions",
      text: "Guidance for selecting universities and completing admission applications properly.",
    },
    {
      title: "Scholarship Assistance",
      text: "Helping students explore scholarship opportunities based on profile strength.",
    },
    {
      title: "Visa Guidance",
      text: "Complete support for visa preparation, financial documents and interviews.",
    },
    {
      title: "SOP & Documentation",
      text: "Professional guidance for SOPs, motivation letters and required paperwork.",
    },
  ]

  return (
    <section className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-300/10 blur-3xl rounded-full"></div>

      <div className="relative max-w-7xl mx-auto">

        <div className="max-w-2xl">
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Services
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Professional guidance for your global education journey.
          </h2>

          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Zaifan Consultancy supports students throughout admissions,
            scholarships, documentation and visa preparation.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-amber-200/5 hover:border-amber-200/20 transition duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-200/10 flex items-center justify-center text-amber-200 text-2xl font-bold">
                0{index + 1}
              </div>

              <h3 className="mt-8 text-2xl font-bold">
                {service.title}
              </h3>

              <p className="mt-4 text-gray-400 leading-relaxed">
                {service.text}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Services