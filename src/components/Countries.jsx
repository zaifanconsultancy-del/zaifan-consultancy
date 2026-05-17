function Countries() {
  const countries = [
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "Italy",
    "Turkey",
  ]

  return (
    <section id="countries" className="py-20 bg-white px-6">
      <div className="max-w-6xl mx-auto">
        
        <h2 className="text-4xl font-bold text-center text-gray-900">
          Study Destinations
        </h2>

        <p className="text-center text-gray-600 mt-4">
          We help students apply to top countries worldwide.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {countries.map((country, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-900 to-black text-white p-8 rounded-2xl shadow-lg hover:scale-105 transition"
            >
              <h3 className="text-2xl font-bold">{country}</h3>
              <p className="mt-3 text-gray-300">
                Admissions, visa guidance, scholarships and university support.
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Countries