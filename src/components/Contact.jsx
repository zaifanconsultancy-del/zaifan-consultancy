function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault()

    const form = event.target
    const name = form.name.value
    const email = form.email.value
    const country = form.country.value
    const message = form.message.value

    const phoneNumber = "923305718131"

    const whatsappMessage = `
Hello Zaifan Consultancy,

I want study abroad guidance.

Name: ${name}
Email: ${email}
Preferred Country: ${country}
Message: ${message}
`

    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`

    window.open(whatsappLink, "_blank")
  }

  return (
    <section id="contact" className="py-20 bg-blue-900 text-white px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-4xl font-bold">
            Start Your Study Abroad Journey
          </h2>

          <p className="mt-4 text-gray-200">
            Fill out the form and our team will contact you for admissions,
            scholarships, and visa guidance.
          </p>

          <div className="mt-8 space-y-4">
            <p className="text-lg">📞 +92 330 5718131</p>
            <p className="text-lg">📞 +92 333 9396336</p>
            <p className="text-lg">📧 zaifanconsultancy@gmail.com</p>
            <p className="text-lg">
              📍 Hayatabad Phase 5, Sector C-2, Street 1-A, House 45, Peshawar,
              KPK, Pakistan
            </p>
          </div>
        </div>

        <div className="bg-white text-black rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              required
              className="w-full border p-3 rounded-lg"
            />

            <input
              name="email"
              type="email"
              placeholder="Your Email"
              required
              className="w-full border p-3 rounded-lg"
            />

            <input
              name="country"
              type="text"
              placeholder="Preferred Country"
              required
              className="w-full border p-3 rounded-lg"
            />

            <textarea
              name="message"
              placeholder="Your Message"
              required
              className="w-full border p-3 rounded-lg h-32"
            ></textarea>

            <button
              type="submit"
              className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400"
            >
              Submit Inquiry on WhatsApp
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Contact