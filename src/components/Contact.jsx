import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inputClass =
    "mt-2 w-full rounded-2xl border border-[#D4AF37]/20 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 backdrop-blur-xl transition duration-300 focus:border-[#D4AF37]";

  const selectClass =
    "mt-2 w-full rounded-2xl border border-[#D4AF37]/20 bg-[#161616] px-5 py-4 text-white outline-none backdrop-blur-xl transition duration-300 focus:border-[#D4AF37]";

  const optionClass = "bg-[#161616] text-white";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    const form = event.target;

    const formData = {
      full_name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      field_of_interest: form.fieldOfInterest.value,
      study_level: form.studyLevel.value,
      country: form.country.value,
      counseling_mode: form.counselingMode.value,
      preferred_date: form.preferredDate.value,
      city: form.city.value.trim(),
      message: form.message.value.trim(),
      status: "new",
    };

    const whatsappWindow = window.open("", "_blank");

    const { error } = await supabase
      .from("inquiries")
      .insert([formData]);

    if (error) {
      console.error(error);

      alert("Something went wrong.");

      if (whatsappWindow) {
        whatsappWindow.close();
      }

      setIsSubmitting(false);
      return;
    }

    try {
      await supabase.functions.invoke("send-email", {
        body: formData,
      });
    } catch (err) {
      console.error(err);
    }

    const whatsappMessage = `
Hello Zaifan Consultancy,

Name: ${formData.full_name}
Email: ${formData.email}
Phone: ${formData.phone}
Field: ${formData.field_of_interest}
Study Level: ${formData.study_level}
Preferred Country: ${formData.country}
Counseling Mode: ${formData.counseling_mode}
Preferred Date: ${formData.preferred_date}
City: ${formData.city}

Message:
${formData.message}
`;

    const whatsappLink = `https://wa.me/923305718131?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappLink;
    }

    form.reset();

    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#0b0b0b] px-6 py-32 text-white"
    >
      {/* BLOBS */}
      <div className="absolute top-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      {/* SUCCESS */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] border border-[#D4AF37]/25 bg-[#111111] p-8 text-center shadow-[0_0_80px_rgba(212,175,55,0.15)]"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37] text-3xl text-black">
                ✓
              </div>

              <h3 className="mt-6 text-2xl font-bold">
                Inquiry Submitted
              </h3>

              <p className="mt-4 leading-relaxed text-gray-400">
                Thank you for contacting Zaifan Consultancy.
                Our team will contact you soon.
              </p>

              <button
                onClick={() => setShowSuccess(false)}
                className="mt-7 w-full rounded-2xl bg-[#D4AF37] py-4 font-semibold text-black transition hover:bg-[#e7c768]"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="text-base font-semibold uppercase tracking-[0.3em] text-[#D4AF37]/80">
            Contact
          </span>

          <h2 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
            Start your study abroad{" "}
            <span className="text-[#D4AF37]">
              journey today.
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            Speak with Zaifan Consultancy for admissions,
            scholarships, documentation and visa guidance.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Phone
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                +92 330 5718131
              </h3>

              <h3 className="mt-1 text-xl font-semibold">
                +92 333 9396336
              </h3>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Email
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                zaifanconsultancy@gmail.com
              </h3>
            </div>

            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
                Location
              </p>

              <h3 className="mt-2 text-xl font-semibold">
                Pakistan
              </h3>
            </div>
          </div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] border border-[#D4AF37]/20 bg-white/[0.04] p-8 shadow-[0_25px_80px_rgba(212,175,55,0.08)] backdrop-blur-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                required
                className={inputClass}
              />

              <input
                name="email"
                type="email"
                placeholder="Email Address"
                required
                className={inputClass}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <input
                name="phone"
                type="tel"
                placeholder="Phone Number"
                required
                className={inputClass}
              />

              <input
                name="city"
                type="text"
                placeholder="Your City"
                required
                className={inputClass}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <select
                name="fieldOfInterest"
                required
                className={selectClass}
              >
                <option className={optionClass} value="">
                  Field Of Interest
                </option>

                <option className={optionClass}>
                  Computer Science
                </option>

                <option className={optionClass}>
                  Business
                </option>

                <option className={optionClass}>
                  Engineering
                </option>

                <option className={optionClass}>
                  Medical
                </option>
              </select>

              <select
                name="studyLevel"
                required
                className={selectClass}
              >
                <option className={optionClass} value="">
                  Preferred Study Level
                </option>

                <option className={optionClass}>
                  Bachelor
                </option>

                <option className={optionClass}>
                  Master
                </option>

                <option className={optionClass}>
                  PhD
                </option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <select
                name="country"
                required
                className={selectClass}
              >
                <option className={optionClass} value="">
                  Preferred Country
                </option>

                <option className={optionClass}>
                  Italy
                </option>

                <option className={optionClass}>
                  Germany
                </option>

                <option className={optionClass}>
                  Turkey
                </option>

                <option className={optionClass}>
                  Canada
                </option>

                <option className={optionClass}>
                  Australia
                </option>
              </select>

              <select
                name="counselingMode"
                required
                className={selectClass}
              >
                <option className={optionClass} value="">
                  Counseling Mode
                </option>

                <option className={optionClass}>
                  Online
                </option>

                <option className={optionClass}>
                  WhatsApp
                </option>

                <option className={optionClass}>
                  Phone Call
                </option>

                <option className={optionClass}>
                  Office Meeting
                </option>
              </select>
            </div>

            <input
              name="preferredDate"
              type="date"
              className={`${inputClass} [color-scheme:dark]`}
            />

            <textarea
              name="message"
              placeholder="Tell us about your study plans..."
              required
              className="h-36 w-full rounded-2xl border border-[#D4AF37]/20 bg-white/[0.04] px-5 py-4 text-white outline-none placeholder:text-gray-500 backdrop-blur-xl transition duration-300 focus:border-[#D4AF37]"
            ></textarea>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#D4AF37] py-4 font-semibold text-black transition duration-300 hover:scale-[1.01] hover:bg-[#E7C768]"
            >
              {isSubmitting
                ? "Submitting..."
                : "Submit Inquiry"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

export default Contact;