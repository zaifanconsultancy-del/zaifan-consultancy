function Testimonials() {
  const reviews = [
    {
      name: "Ahmad Khan",
      country: "Italy",
      review:
        "Zaifan Consultancy guided me throughout the admission and visa process professionally.",
    },
    {
      name: "Hassan Ali",
      country: "Germany",
      review:
        "Everything was explained clearly from university applications to documents.",
    },
    {
      name: "Usman Tariq",
      country: "Turkey",
      review:
        "The consultation process felt honest and supportive from start to finish.",
    },
  ]

  return (
    <section className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-200/10 blur-3xl rounded-full"></div>

      <div className="relative max-w-7xl mx-auto">

        <div className="text-center max-w-3xl mx-auto">
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Testimonials
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight">
            Students trust Zaifan Consultancy.
          </h2>

          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            Real student experiences from admissions and study abroad guidance.
          </p>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-amber-200/5 transition duration-300"
            >
              <div className="text-5xl text-amber-200/30">
                "
              </div>

              <p className="mt-6 text-gray-300 leading-relaxed">
                {review.review}
              </p>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="font-bold text-white">
                  {review.name}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Student — {review.country}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Testimonials