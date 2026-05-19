import { motion } from "framer-motion";

function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault();

    const form = event.target;

    const name = form.name.value;
    const email = form.email.value;
    const country = form.country.value;
    const message = form.message.value;

    const phoneNumber = "923305718131";

    const whatsappMessage = `
Hello Zaifan Consultancy,

I want study abroad guidance.

Name: ${name}
Email: ${email}
Preferred Country: ${country}
Message: ${message}
`;

    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    window.open(whatsappLink, "_blank");
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#0b0b0b] py-32 px-6 text-white"
    >
      <div className="absolute top-[-15%] right-[-10%] h-[520px] w-[520px] rounded-full bg-amber-300/10 blur-3xl"></div>
      <div className="absolute bottom-[-20%] left-[-10%] h-[520px] w-[520px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
        >
          <span className="text-base md:text-lg uppercase tracking-[0.3em] font-semibold text-amber-200/70">
            Contact
          </span>

          <h2 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Start your study abroad{" "}
            <span className="text-[#D4AF37]">journey today.</span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            Speak with Zaifan Consultancy for admissions guidance, scholarships,
            documentation and visa preparation support.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Phone
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                +92 330 5718131
              </h3>
              <h3 className="mt-1 text-xl font-semibold text-white">
                +92 333 9396336
              </h3>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Email
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                zaifanconsultancy@gmail.com
              </h3>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Location
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                Pakistan
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 45 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] border border-white/10 bg-white/[0.05] p-8 shadow-2xl backdrop-blur-2xl md:p-10"
        >
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
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
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
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Preferred Country
              </label>
              <select
                name="country"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#151515] px-5 py-4 text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="">Select Country</option>
                <option>Italy</option>
                <option>Germany</option>
                <option>Turkey</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
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
                className="mt-2 h-36 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#D4AF37] py-4 font-semibold text-black shadow-[0_0_35px_rgba(212,175,55,0.18)] transition hover:scale-[1.02] hover:bg-[#E7C768]"
            >
              Submit Inquiry on WhatsApp
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

export default Contact;