function Trust() {
  const items = [
    "Transparent consultation process",
    "Step-by-step student guidance",
    "Support from admission to visa",
    "Profile-based country recommendations",
  ]

  return (
    <section className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-200/10 blur-3xl rounded-full"></div>

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

        <div>
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Why Choose Us
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Honest guidance for students planning to study abroad.
          </h2>

          <p className="mt-6 text-lg text-gray-400 leading-relaxed">
            Zaifan Consultancy focuses on clarity, transparency and professional support for students aiming for international education.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
          <div className="space-y-6">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-amber-200/10 flex items-center justify-center text-amber-200 font-bold">
                  ✓
                </div>

                <p className="text-lg text-gray-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

export default Trust