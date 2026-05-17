function Testimonials() {
  const reviews = [
    {
      name: "Ahmed Khan",
      text: "Zaifan Consultancy guided me clearly from university selection to document preparation.",
    },
    {
      name: "Sara Ali",
      text: "The process was simple, professional, and easy to understand.",
    },
    {
      name: "Usman Raza",
      text: "Their honest guidance helped me choose the right study destination.",
    },
  ]

  return (
    <section className="py-20 bg-gray-50 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900">
          Student Feedback
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg">
              <p className="text-gray-600">"{review.text}"</p>
              <h3 className="mt-5 font-bold text-blue-900">
                {review.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials