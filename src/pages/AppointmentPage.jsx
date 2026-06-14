import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  MapPin,
  MessageCircle,
  Plane,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  LockKeyhole,
  MessagesSquare,
} from "lucide-react";

import consultantMascot from "../assets/images/appointment/consultant-mascot.png";
import globeBooks from "../assets/images/appointment/globe-books.png";
import { supabase } from "../lib/supabaseClient";

const initialFormData = {
  full_name: "",
  email: "",
  phone: "",
  country_interest: "",
  consultation_type: "",
  appointment_date: "",
  appointment_time: "",
  message: "",
};

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

const journeySteps = [
  { title: "Dream", body: "Share your goals", color: "bg-purple-500" },
  { title: "Choose", body: "We suggest the best options", color: "bg-orange-500" },
  { title: "Apply", body: "We guide your application", color: "bg-sky-500" },
  { title: "Fly", body: "Begin your journey abroad", color: "bg-emerald-500" },
];

const stats = [
  { icon: GraduationCap, value: "500+", label: "Universities", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: UsersRound, value: "20+", label: "Countries", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: FileCheck2, value: "10K+", label: "Students Guided", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: BadgeDollarSign, value: "₹50Cr+", label: "Scholarships Helped", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Trophy, value: "Expert", label: "Counselor Support", color: "text-rose-500", bg: "bg-rose-50" },
];

const trustCards = [
  { icon: Clock, title: "Response time", body: "Usually within 24 hours", color: "text-orange-500", bg: "bg-orange-50", ring: "ring-orange-100" },
  { icon: CheckCircle2, title: "Personalized", body: "Advice for your unique goals", color: "text-orange-500", bg: "bg-orange-50", ring: "ring-orange-100" },
  { icon: LockKeyhole, title: "Secure & Private", body: "Your information is protected", color: "text-purple-500", bg: "bg-purple-50", ring: "ring-purple-100" },
  { icon: MessagesSquare, title: "Expert Guidance", body: "From experienced counselors", color: "text-sky-500", bg: "bg-sky-50", ring: "ring-sky-100" },
];

const normalizeValue = (value) => value?.trim().toLowerCase();

const findMatchingOption = (options, value) => {
  const normalized = normalizeValue(value);
  return options.find((option) => normalizeValue(option) === normalized) || "";
};

function AppointmentPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [submittedAppointment, setSubmittedAppointment] = useState(null);
  const [prefillNotice, setPrefillNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const countryParam = params.get("country");
    const serviceParam = params.get("service") || params.get("consultation");
    const universityParam = params.get("university");
    const dateParam = params.get("date");
    const timeParam = params.get("time");
    const nameParam = params.get("name");
    const emailParam = params.get("email");
    const phoneParam = params.get("phone");
    const messageParam = params.get("message");

    const matchedCountry = findMatchingOption(countries, countryParam);
    const matchedService = findMatchingOption(consultationTypes, serviceParam);
    const matchedTime = findMatchingOption(timeSlots, timeParam);

    const nextData = {};

    if (nameParam) nextData.full_name = nameParam;
    if (emailParam) nextData.email = emailParam;
    if (phoneParam) nextData.phone = phoneParam;
    if (matchedCountry) nextData.country_interest = matchedCountry;
    if (matchedService) nextData.consultation_type = matchedService;
    if (matchedTime) nextData.appointment_time = matchedTime;
    if (dateParam && dateParam >= minDate) nextData.appointment_date = dateParam;

    const messageParts = [];

    if (messageParam) messageParts.push(messageParam);
    if (universityParam) messageParts.push(`Interested university: ${universityParam}`);
    if (countryParam && !matchedCountry) messageParts.push(`Interested country: ${countryParam}`);
    if (serviceParam && !matchedService) messageParts.push(`Requested service: ${serviceParam}`);

    if (messageParts.length) {
      nextData.message = messageParts.join("\n");
    }

    if (Object.keys(nextData).length) {
      setFormData((prev) => ({ ...prev, ...nextData }));
      setPrefillNotice("We prefilled your appointment details from the link.");
    }
  }, [minDate]);

  const appointmentSummary = useMemo(() => {
    return [
      { icon: MapPin, label: "Country", value: formData.country_interest },
      { icon: Sparkles, label: "Service", value: formData.consultation_type },
      { icon: CalendarDays, label: "Date", value: formData.appointment_date },
      { icon: Clock, label: "Time", value: formData.appointment_time },
    ].filter((item) => item.value);
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi Zaifan Consultancy, I want to book a study abroad consultation.\n\nName: ${
        formData.full_name || "-"
      }\nCountry: ${formData.country_interest || "-"}\nService: ${
        formData.consultation_type || "-"
      }\nPreferred Date: ${formData.appointment_date || "-"}\nPreferred Time: ${
        formData.appointment_time || "-"
      }\nMessage: ${formData.message || "-"}`
    );

    window.open(
      `https://wa.me/923001234567?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const appointmentData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country_interest: formData.country_interest,
        consultation_type: formData.consultation_type,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        message: formData.message.trim(),
        status: "pending",
      };

      const { error: insertError } = await supabase
        .from("appointments")
        .insert([appointmentData]);

      if (insertError) {
        console.log("FULL SUPABASE ERROR:", insertError);
        setError(insertError.message || "Appointment could not be saved.");
        setLoading(false);
        return;
      }

      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-appointment-email", {
          body: {
            fullName: appointmentData.full_name,
            email: appointmentData.email,
            phone: appointmentData.phone,
            country: appointmentData.country_interest,
            service: appointmentData.consultation_type,
            appointmentDate: appointmentData.appointment_date,
            appointmentTime: appointmentData.appointment_time,
            message: appointmentData.message,
          },
        });

      console.log("EMAIL FUNCTION DATA:", emailData);
      console.log("EMAIL FUNCTION ERROR:", emailError);

      setSubmittedAppointment(appointmentData);

      if (emailError) {
        setError(
          "Appointment saved, but confirmation email was not sent. Please check Supabase function logs."
        );
        setLoading(false);
        return;
      }

      setSuccess("Your consultation request is confirmed. Our team will contact you soon.");
      setFormData(initialFormData);
      setPrefillNotice("");
    } catch (err) {
      console.log("APPOINTMENT SUBMIT ERROR:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <section className="relative overflow-hidden bg-[#fff4e8] px-4 pb-6 pt-28 text-[#071d43] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-180px] top-20 h-[420px] w-[420px] rounded-full bg-orange-200/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-90px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[#ffd7a8]/60 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[260px] w-[520px] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid items-start gap-7 xl:grid-cols-[1.02fr_0.9fr_260px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="overflow-hidden rounded-[2.5rem] bg-[#fff7ee] shadow-[0_24px_70px_rgba(120,70,20,0.12)] ring-1 ring-orange-100"
          >
            <div className="relative p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.95),transparent_36%),radial-gradient(circle_at_28%_80%,rgba(255,180,90,0.22),transparent_32%)]" />

              <div className="relative z-10">
                <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-600 shadow-sm ring-1 ring-orange-100">
                  <Sparkles size={15} />
                  Free Consultation
                </p>

                <h1 className="mt-5 max-w-[450px] text-4xl font-black leading-[1.06] tracking-tight text-[#071d43] md:text-5xl">
                  Book your study abroad appointment
                </h1>

                <p className="mt-3 max-w-[360px] text-base font-bold leading-relaxed text-[#17335d]">
                  Let&apos;s plan your global education journey together.
                </p>
              </div>

              <Plane className="absolute right-[38%] top-7 z-10 rotate-12 text-orange-400" size={44} />

              <div className="relative z-10 mt-4 grid items-end gap-4 lg:grid-cols-[255px_1fr]">
                <div className="order-2 rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_45px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 backdrop-blur lg:order-1">
                  <div className="space-y-5">
                    {journeySteps.map((step, index) => (
                      <div key={step.title} className="relative flex items-start gap-3">
                        {index !== journeySteps.length - 1 && (
                          <div className="absolute left-[22px] top-11 h-8 w-[2px] bg-orange-100" />
                        )}

                        <div className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full ${step.color} text-white shadow-lg`}>
                          <Check size={18} strokeWidth={3} />
                        </div>

                        <div>
                          <p className="text-lg font-black text-[#071d43]">{step.title}</p>
                          <p className="text-sm font-semibold leading-relaxed text-slate-600">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative order-1 min-h-[380px] lg:order-2">
                  <div className="absolute inset-x-0 bottom-0 mx-auto h-[270px] max-w-[520px] rounded-[3rem] bg-orange-200/20 blur-2xl" />

                  <img
                    src={consultantMascot}
                    alt="Study abroad consultant"
                    className="relative z-10 mx-auto mt-8 w-full max-w-[490px] object-contain drop-shadow-[0_24px_35px_rgba(120,70,20,0.18)]"
                  />

                  <div className="absolute right-0 -top-20 z-20 max-w-[240px] rounded-[1.35rem] bg-white p-4 shadow-[0_20px_45px_rgba(60,35,15,0.14)] ring-1 ring-orange-100 sm:right-2 sm:-top-16">
                    <p className="text-sm font-extrabold leading-relaxed text-[#54321c]">
                      We help you choose the right country, university and the best path forward.
                    </p>
                    <div className="absolute -bottom-2 right-5 grid h-5 w-5 place-items-center rounded-full bg-orange-500 text-white">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-3 rounded-[1.75rem] bg-white/95 p-3 shadow-[0_18px_45px_rgba(120,70,20,0.08)] ring-1 ring-orange-100 backdrop-blur">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div key={stat.label} className="rounded-[1.25rem] px-2 py-2 text-center transition duration-300 hover:-translate-y-1 hover:bg-[#fff8ec]">
                        <div className={`mx-auto grid h-10 w-10 place-items-center rounded-full ${stat.bg} ${stat.color}`}>
                          <Icon size={21} />
                        </div>
                        <p className="mt-2 text-lg font-black leading-none text-[#071d43]">{stat.value}</p>
                        <p className="mt-1 text-xs font-bold leading-tight text-slate-600">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 mx-auto mt-3 flex max-w-[540px] flex-wrap items-center justify-center gap-3 rounded-full bg-white/95 px-5 py-3 text-sm font-black text-[#7c3f16] shadow-[0_14px_35px_rgba(120,70,20,0.08)] ring-1 ring-orange-100">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={17} />
                  100% Free
                </span>
                <span className="text-orange-400">•</span>
                <span>No Hidden Charges</span>
                <span className="text-orange-400">•</span>
                <span>Personalized Guidance</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-[2.5rem] bg-white p-5 shadow-[0_24px_70px_rgba(120,70,20,0.12)] ring-1 ring-orange-100 sm:p-6"
          >
            {prefillNotice && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-black leading-relaxed text-orange-700">
                <Sparkles className="mt-0.5 shrink-0" size={18} />
                {prefillNotice}
              </div>
            )}

            {success && submittedAppointment && (
              <div className="mb-4 rounded-[1.6rem] border border-green-200 bg-green-50 p-5 text-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
                  <div>
                    <p className="text-base font-black">{success}</p>
                    <p className="mt-1 text-sm font-bold leading-relaxed">
                      {submittedAppointment.consultation_type} for {submittedAppointment.country_interest} on{" "}
                      {submittedAppointment.appointment_date} at {submittedAppointment.appointment_time}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
                <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />
              </div>

              <input type="tel" name="phone" placeholder="Phone / WhatsApp Number" value={formData.phone} onChange={handleChange} required className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />

              <div className="grid gap-4 sm:grid-cols-2">
                <select name="country_interest" value={formData.country_interest} onChange={handleChange} required className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                  <option value="">Country Interest</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>

                <select name="consultation_type" value={formData.consultation_type} onChange={handleChange} required className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                  <option value="">Consultation Type</option>
                  {consultationTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input type="date" name="appointment_date" min={minDate} value={formData.appointment_date} onChange={handleChange} required className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />

                <select name="appointment_time" value={formData.appointment_time} onChange={handleChange} required className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100">
                  <option value="">Select Time Slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <textarea name="message" placeholder="Tell us briefly about your study plan..." value={formData.message} onChange={handleChange} rows="5" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" />

              {appointmentSummary.length > 0 && (
                <div className="rounded-[1.5rem] border border-orange-100 bg-[#fff8ef] p-4">
                  <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-orange-600">
                    Appointment Summary
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {appointmentSummary.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-orange-100">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                            <p className="text-sm font-black text-[#071d43]">{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-relaxed text-red-700">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-full bg-orange-500 px-8 py-4 font-black text-white shadow-[0_16px_34px_rgba(234,88,12,0.24)] transition duration-300 hover:-translate-y-1 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={18} />
                {loading ? "Submitting..." : "Request Appointment"}
              </button>

              <button type="button" onClick={openWhatsApp} className="flex w-full items-center justify-center gap-3 rounded-full bg-green-500 px-8 py-4 font-black text-white shadow-[0_16px_34px_rgba(34,197,94,0.2)] transition duration-300 hover:-translate-y-1 hover:bg-green-600">
                <MessageCircle size={18} />
                Continue on WhatsApp
              </button>
            </form>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.14 }}
            className="hidden xl:block"
          >
            <div className="sticky top-28 space-y-5">
              <div className="space-y-5">
                {trustCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div key={card.title} className="flex items-center gap-4 rounded-[2rem] bg-white/90 p-5 shadow-[0_18px_48px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 backdrop-blur">
                      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${card.bg} ${card.color} ring-1 ${card.ring}`}>
                        <Icon size={24} />
                      </div>

                      <div>
                        <p className="font-black text-[#071d43]">{card.title}</p>
                        <p className="mt-1 text-sm font-bold leading-relaxed text-[#244263]">{card.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <img src={globeBooks} alt="Study abroad books and globe" className="mx-auto w-[190px] drop-shadow-[0_24px_35px_rgba(120,70,20,0.18)]" />

              <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-[0_14px_34px_rgba(120,70,20,0.10)] ring-1 ring-orange-100">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                    <Sparkles size={20} />
                  </div>

                  <p className="text-sm font-black leading-relaxed text-[#7c3f16]">
                    Guiding students to top universities worldwide.
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}

export default AppointmentPage;