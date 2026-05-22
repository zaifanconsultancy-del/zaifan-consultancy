import { useState } from "react";
import { motion } from "framer-motion";
import { FaCalendarAlt, FaClock, FaWhatsapp } from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";

function AppointmentBooking() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    country_interest: "",
    consultation_type: "",
    appointment_date: "",
    appointment_time: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const timeSlots = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ];

  const consultationTypes = [
    "Free Initial Consultation",
    "University Selection",
    "Admission Guidance",
    "Scholarship Guidance",
    "Visa Guidance",
    "SOP & Documentation",
  ];

  const countries = [
    "Italy",
    "Germany",
    "Turkey",
    "United Kingdom",
    "Canada",
    "Australia",
    "Other",
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    const { error } = await supabase.from("appointments").insert([
      {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        country_interest: formData.country_interest,
        consultation_type: formData.consultation_type,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        message: formData.message,
        status: "pending",
      },
    ]);

    if (error) {
      console.log("FULL SUPABASE ERROR:", error);
      setError(error.message || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess("Your consultation booking request has been submitted.");

    setFormData({
      full_name: "",
      email: "",
      phone: "",
      country_interest: "",
      consultation_type: "",
      appointment_date: "",
      appointment_time: "",
      message: "",
    });

    setLoading(false);
  };

  return (
    <section
      id="appointment"
      className="relative min-h-screen overflow-hidden bg-[#050505] px-6 py-32 text-white"
    >
      <div className="absolute right-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl"></div>
      <div className="absolute bottom-[-25%] left-[-12%] h-[520px] w-[520px] rounded-full bg-[#D4AF37]/5 blur-3xl"></div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -45 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Book Appointment
          </p>

          <h2 className="mt-6 text-4xl font-extrabold leading-tight md:text-6xl">
            Schedule your{" "}
            <span className="text-[#D4AF37]">study abroad consultation.</span>
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-gray-400">
            Select your preferred date, time and consultation type. Our team
            will review your request and contact you with confirmation.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

              <FaCalendarAlt className="text-3xl text-[#D4AF37]" />

              <h3 className="mt-5 text-xl font-bold">Flexible Booking</h3>

              <p className="mt-3 leading-relaxed text-gray-400">
                Choose a date that works best for your consultation.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/35 hover:bg-white/[0.055]">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

              <FaClock className="text-3xl text-[#D4AF37]" />

              <h3 className="mt-5 text-xl font-bold">Time Slot Selection</h3>

              <p className="mt-3 leading-relaxed text-gray-400">
                Pick a preferred time slot for your appointment.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 45 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85 }}
          viewport={{ once: true }}
          className="group relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition duration-500 hover:border-[#D4AF37]/35 hover:bg-white/[0.055] md:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-100"></div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition placeholder:text-gray-500 focus:border-[#D4AF37]/50"
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition placeholder:text-gray-500 focus:border-[#D4AF37]/50"
              />
            </div>

            <input
              type="tel"
              name="phone"
              placeholder="Phone / WhatsApp Number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition placeholder:text-gray-500 focus:border-[#D4AF37]/50"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <select
                name="country_interest"
                value={formData.country_interest}
                onChange={handleChange}
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-[#D4AF37]/50"
              >
                <option value="">Country Interest</option>
                {countries.map((country) => (
                  <option key={country} value={country} className="text-black">
                    {country}
                  </option>
                ))}
              </select>

              <select
                name="consultation_type"
                value={formData.consultation_type}
                onChange={handleChange}
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-[#D4AF37]/50"
              >
                <option value="">Consultation Type</option>
                {consultationTypes.map((type) => (
                  <option key={type} value={type} className="text-black">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <input
                type="date"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-[#D4AF37]/50"
              />

              <select
                name="appointment_time"
                value={formData.appointment_time}
                onChange={handleChange}
                required
                className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-[#D4AF37]/50"
              >
                <option value="">Select Time Slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot} className="text-black">
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              name="message"
              placeholder="Tell us briefly about your study plan..."
              value={formData.message}
              onChange={handleChange}
              rows="5"
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition placeholder:text-gray-500 focus:border-[#D4AF37]/50"
            ></textarea>

            {success && (
              <p className="rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-4 text-green-300">
                {success}
              </p>
            )}

            {error && (
              <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-8 py-4 font-bold text-black transition duration-300 hover:-translate-y-1 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaWhatsapp />
              {loading ? "Submitting..." : "Request Appointment"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}

export default AppointmentBooking;