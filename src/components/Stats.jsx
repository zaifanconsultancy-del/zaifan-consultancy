function Stats() {
  const stats = [
    { number: "500+", label: "Students Guided" },
    { number: "10+", label: "Study Destinations" },
    { number: "95%", label: "Visa Guidance Support" },
    { number: "24/7", label: "Student Assistance" },
  ]

  return (
    <section className="py-20 bg-[#111111] text-white px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center hover:border-amber-200/30 hover:bg-amber-200/5 transition"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-amber-100">
              {stat.number}
            </h2>
            <p className="mt-3 text-sm md:text-base text-gray-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Stats