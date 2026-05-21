import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    const form = event.target;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const country = form.country.value;
    const message = form.message.value.trim();

    const nameValid = /^[A-Za-z\s]{3,}$/.test(name);
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = /^[0-9+\-\s]{10,15}$/.test(phone);

    if (!nameValid) {
      alert("Please enter a valid full name.");
      setIsSubmitting(false);
      return;
    }

    if (!emailValid) {
      alert("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    if (!phoneValid) {
      alert("Please enter a valid phone number.");
      setIsSubmitting(false);
      return;
    }

    if (!country) {
      alert("Please select a preferred country.");
      setIsSubmitting(false);
      return;
    }

    // OPEN WHATSAPP EARLY
    const whatsappWindow = window.open("", "_blank");

    // SAVE TO DATABASE
    const { error } = await supabase.from("inquiries").insert([
      {
        full_name: name,
        email,
        phone,
        country,
        message,
        status: "new",
      },
    ]);

    if (error) {
      console.error(error);

      alert("Something went wrong. Inquiry was not saved.");

      if (whatsappWindow) {
        whatsappWindow.close();
      }

      setIsSubmitting(false);
      return;
    }

    // SEND EMAIL
    try {
      const { error: emailError } = await supabase.functions.invoke(
        "send-email",
        {
          body: {
            name,
            email,
            phone,
            country,
            message,
          },
        }
      );

      if (emailError) {
        console.error("Email notification failed:", emailError);
      }
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
    }

    // WHATSAPP
    const whatsappNumber = "923305718131";

    const whatsappMessage = `
Hello Zaifan Consultancy,

I want study abroad guidance.

Name: ${name}
Email: ${email}
Phone: ${phone}
Preferred Country: ${country}
Message: ${message}
`;

    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    // REDIRECT OPENED WINDOW
    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappLink;
    } else {
      window.location.href = whatsappLink;
    }

    form.reset();

    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#0b0b0b] py-32 px-6 text-white"
    >
      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="relative max-w-md rounded-[2rem] border border-[#D4AF37]/30 bg-[#101010] p-8 text-center shadow-[0_0_80px_rgba(212,175,55,0.18)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37] text-3xl text-black shadow-[0_0_35px_rgba(212,175,55,0.4)]">
                ✓
              </div>

              <h3 className="mt-6 text-2xl font-bold text-white">
                Inquiry Submitted Successfully
              </h3>

              <p className="mt-4 leading-relaxed text-gray-400">
                Thank you for contacting Zaifan Consultancy. Our team has
                received your details and will contact you soon for study abroad
                guidance.
              </p>

              <button
                onClick={() => setShowSuccess(false)}
                className="mt-7 w-full rounded-2xl bg-[#D4AF37] py-3 font-semibold text-black transition hover:scale-[1.02] hover:bg-[#E7C768]"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND GLOWS */}
      <div className="absolute top-[-15%] right-[-10%] h-[520px] w-[520px] rounded-full bg-amber-300/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[520px] w-[520px] rounded-full bg-yellow-100/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
        >
          <span className="text-base font-semibold uppercase tracking-[0.3em] text-amber-200/70 md:text-lg">
            Contact
          </span>

          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Start your study abroad{" "}
            <span className="text-[#D4AF37]">journey today.</span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            Speak with Zaifan Consultancy for admissions guidance,
            scholarships, documentation and visa preparation support.
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

        {/* RIGHT SIDE */}
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
                placeholder="Enter your full name"
                required
                minLength="3"
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
                placeholder="example@gmail.com"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Phone Number
              </label>

              <input
                name="phone"
                type="tel"
                placeholder="03001234567"
                required
                minLength="10"
                maxLength="15"
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
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#D4AF37] py-4 font-semibold text-black shadow-[0_0_35px_rgba(212,175,55,0.18)] transition hover:scale-[1.02] hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

export default Contact;