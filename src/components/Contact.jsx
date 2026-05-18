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
    <section
      id="contact"
      className="py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white px-6"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-block mb-5 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
            Free Consultation
          </span>

          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Start Your Study Abroad Journey Today
          </h2>

          <p className="mt-5 text-gray-300 text-lg leading-relaxed">
            Share your details and our team will guide you about admissions,
            scholarships, documents, and visa preparation.
          </p>

          <div className="mt-10 space-y-5 text-gray-200">
            <p>📞 +92 330 5718131</p>
            <p>📞 +92 333 9396336</p>
            <p>📧 zaifanconsultancy@gmail.com</p>
            <p>
              📍 Hayatabad Phase 5, Sector C-2, Street 1-A, House 45, Peshawar,
              KPK, Pakistan
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              name="name"
              type="text"
              placeholder="Your Name"
              required
              className="w-full bg-white text-black border border-white/20 p-4 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <input
              name="email"
              type="email"
              placeholder="Your Email"
              required
              className="w-full bg-white text-black border border-white/20 p-4 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <input
              name="country"
              type="text"
              placeholder="Preferred Country"
              required
              className="w-full bg-white text-black border border-white/20 p-4 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <textarea
              name="message"
              placeholder="Tell us about your education background"
              required
              className="w-full bg-white text-black border border-white/20 p-4 rounded-xl h-32 outline-none focus:ring-2 focus:ring-yellow-400"
            ></textarea>

            <button
              type="submit"
              className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg shadow-yellow-500/20"
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