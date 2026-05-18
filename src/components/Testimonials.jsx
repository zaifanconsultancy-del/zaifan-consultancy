function Testimonials() {
  const reviews = [
    {
      name: "Ahmed Khan",
      country: "Italy",
      text: "Zaifan Consultancy made my admission process simple and helped me secure better opportunities abroad."
    },
    {
      name: "Sara Ali",
      country: "Turkey",
      text: "Their documentation support was extremely professional and saved me from making costly mistakes."
    },
    {
      name: "Usman Raza",
      country: "Germany",
      text: "They guided me honestly and helped me choose the best country based on my budget and goals."
    }
  ]

  return (
    <section className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">

        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            What Students Say
          </h2>

          <p className="text-gray-600 mt-4 text-lg">
            Trusted by students planning their future abroad.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-3xl shadow-md hover:shadow-xl transition"
            >
              <div className="text-yellow-400 text-3xl mb-4">
                ★★★★★
              </div>

              <p className="text-gray-600 leading-relaxed">
                "{review.text}"
              </p>

              <div className="mt-6">
                <h3 className="font-bold text-gray-900 text-lg">
                  {review.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Student - {review.country}
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