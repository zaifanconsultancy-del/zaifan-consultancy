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
      className="py-28 bg-[#111111] text-white px-6 relative overflow-hidden"
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-300/10 blur-3xl rounded-full"></div>

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Contact
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Start your study abroad journey today.
          </h2>

          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl">
            Speak with Zaifan Consultancy for admissions guidance,
            scholarships, documentation and visa preparation support.
          </p>

          <div className="mt-10 space-y-8">

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Phone
              </p>

              <h3 className="text-xl font-semibold text-white mt-2">
                +92 330 5718131
              </h3>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Email
              </p>

              <h3 className="text-xl font-semibold text-white mt-2">
                zaifanconsultancy@gmail.com
              </h3>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Location
              </p>

              <h3 className="text-xl font-semibold text-white mt-2">
                Peshawar, KPK, Pakistan
              </h3>
            </div>

          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10">

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-sm font-medium text-gray-300">
                Full Name
              </label>

              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                required
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-300 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>

              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-300 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Preferred Country
              </label>

              <select
                name="country"
                required
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-amber-300 text-white"
              >
                <option value="" className="bg-[#111111]">
                  Select Country
                </option>

                <option className="bg-[#111111]">Italy</option>
                <option className="bg-[#111111]">Germany</option>
                <option className="bg-[#111111]">Turkey</option>
                <option className="bg-[#111111]">United Kingdom</option>
                <option className="bg-[#111111]">Canada</option>
                <option className="bg-[#111111]">Australia</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Message
              </label>

              <textarea
                name="message"
                placeholder="Tell us about your study plans..."
                required
                className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 h-36 outline-none focus:border-amber-300 text-white placeholder:text-gray-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-[#D6CEC2] text-[#111111] py-4 rounded-2xl font-semibold hover:bg-[#E4DBCF] transition shadow-lg"
            >
              Submit Inquiry
            </button>

          </form>
        </div>

      </div>
    </section>
  )
}

export default Contact