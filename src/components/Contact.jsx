import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  FileText,
  GraduationCap,
  Landmark,
  MessageCircle,
  Plane,
  Send,
  Sparkles,
  Stars,
  Target,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

import consultationMascot from "../assets/images/contact/consultation-mascot.png";

const countries = [
  "Italy",
  "Germany (Coming Soon)",
  "United Kingdom (Coming Soon)",
  "Canada (Coming Soon)",
  "Australia (Coming Soon)",
  "Turkey (Coming Soon)",
  "Other / Not sure yet",
];

const studyLevels = [
  "Bachelor",
  "Master",
  "PhD",
  "Diploma / Foundation",
  "Language Program",
  "Not sure yet",
];

const fields = [
  "Computer Science",
  "Business",
  "Engineering",
  "Medical / Health Sciences",
  "Social Sciences",
  "Arts & Design",
  "Not sure yet",
];

const intakes = [
  "January / February",
  "April / May",
  "September / October",
  "Next available intake",
  "Not sure yet",
];

const bottomStrip = [
  { icon: Landmark, label: "Italy Focused" },
  { icon: GraduationCap, label: "University Match" },
  { icon: Award, label: "Scholarships" },
  { icon: FileText, label: "Visa Guidance" },
  { icon: CalendarCheck, label: "Free Consultation" },
];

const defaultFormState = {
  name: "",
  email: "",
  phone: "",
  country: "Italy",
  studyLevel: "",
  intake: "",
  fieldOfInterest: "",
  message: "",
};

function normalizeCountryValue(value) {
  if (!value) return "Italy";
  if (value === "Germany") return "Germany (Coming Soon)";
  if (value === "United Kingdom") return "United Kingdom (Coming Soon)";
  if (value === "Canada") return "Canada (Coming Soon)";
  if (value === "Australia") return "Australia (Coming Soon)";
  if (value === "Turkey") return "Turkey (Coming Soon)";
  return countries.includes(value) ? value : "Italy";
}

function getInitialFormState() {
  if (typeof window === "undefined") return defaultFormState;

  const params = new URLSearchParams(window.location.search);
  const countryParam = params.get("country");
  const serviceParam = params.get("service");
  const fieldParam = params.get("field");

  return {
    ...defaultFormState,
    country: normalizeCountryValue(countryParam),
    fieldOfInterest: fields.includes(fieldParam) ? fieldParam : "",
    message: serviceParam
      ? `I want Italy-focused guidance about ${serviceParam.replaceAll("-", " ")}.`
      : "",
  };
}

function Contact() {
  const [formValues, setFormValues] = useState(getInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [lastInquiryName, setLastInquiryName] = useState("");

  const sourceLabel = useMemo(() => {
    if (typeof window === "undefined") return "website_contact_italy";
    const params = new URLSearchParams(window.location.search);
    return params.get("source") || params.get("utm_source") || "website_contact_italy";
  }, []);

  const completedFields = useMemo(() => {
    const requiredValues = [
      formValues.name,
      formValues.email,
      formValues.phone,
      formValues.country,
      formValues.studyLevel,
      formValues.intake,
      formValues.fieldOfInterest,
      formValues.message,
    ];

    return requiredValues.filter((value) => String(value || "").trim()).length;
  }, [formValues]);

  const completionPercentage = Math.round((completedFields / 8) * 100);

  const inputClass =
    "mt-2 h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  const selectClass =
    "mt-2 h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  const labelClass = "text-sm font-black text-[#2d145f]";

  const updateField = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (submissionError) setSubmissionError("");
  };

  const buildWhatsAppMessage = (formData) => `
Hello Zaifan Consultancy,

I submitted an Italy-focused inquiry from the website.

Name: ${formData.full_name}
Email: ${formData.email}
Phone: ${formData.phone}
Destination Focus: ${formData.country}
Study Level: ${formData.study_level}
Field: ${formData.field_of_interest}
Intake: ${formData.counseling_mode}
Lead Source: ${formData.lead_source}

Message:
${formData.message}
`;

  const whatsappPreviewLink = useMemo(() => {
    const previewData = {
      full_name: formValues.name || "Not provided yet",
      email: formValues.email || "Not provided yet",
      phone: formValues.phone || "Not provided yet",
      country: formValues.country || "Italy",
      study_level: formValues.studyLevel || "Not sure yet",
      field_of_interest: formValues.fieldOfInterest || "Not sure yet",
      counseling_mode: formValues.intake || "Not sure yet",
      lead_source: sourceLabel,
      message:
        formValues.message ||
        "I want help planning my Italy study journey, university options, scholarships, tuition and visa steps.",
    };

    return `https://wa.me/923305718131?text=${encodeURIComponent(
      buildWhatsAppMessage(previewData)
    )}`;
  }, [formValues, sourceLabel]);

  useEffect(() => {
    if (!showSuccess) return undefined;

    const timer = window.setTimeout(() => {
      setShowSuccess(false);
    }, 7000);

    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError("");

    const phoneDigits = formValues.phone.replace(/[^\d+]/g, "");

    if (phoneDigits.length < 9) {
      setSubmissionError("Please enter a valid phone number so our advisor can contact you.");
      setIsSubmitting(false);
      return;
    }

    const formData = {
      full_name: formValues.name.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      field_of_interest: formValues.fieldOfInterest,
      study_level: formValues.studyLevel,
      country: formValues.country,
      counseling_mode: formValues.intake,
      preferred_date: null,
      city: "",
      message: formValues.message.trim(),
      status: "new",
      lead_source: sourceLabel,
    };

    const whatsappWindow = window.open("", "_blank");

    const { error } = await supabase.from("inquiries").insert([formData]);

    if (error) {
      console.error("Inquiry submission failed:", error);
      setSubmissionError(
        "Your inquiry could not be submitted right now. Please message us on WhatsApp or try again."
      );

      if (whatsappWindow) {
        whatsappWindow.location.href = `https://wa.me/923305718131?text=${encodeURIComponent(
          buildWhatsAppMessage(formData)
        )}`;
      }

      setIsSubmitting(false);
      return;
    }

    try {
      await supabase.functions.invoke("send-email", {
        body: formData,
      });
    } catch (err) {
      console.error("Email notification failed:", err);
    }

    const whatsappLink = `https://wa.me/923305718131?text=${encodeURIComponent(
      buildWhatsAppMessage(formData)
    )}`;

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappLink;
    }

    setLastInquiryName(formData.full_name);
    setFormValues(defaultFormState);
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#fff7ed] px-4 py-14 text-[#071b3a] sm:px-6 lg:px-8"
    >
      <style>{`
        @keyframes contactTrail {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -180; }
        }

        @keyframes softFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        @keyframes tinyPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .contact-trail {
          animation: contactTrail 10s linear infinite;
        }

        .soft-float {
          animation: softFloat 5s ease-in-out infinite;
        }

        .tiny-pulse {
          animation: tinyPulse 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-trail,
          .soft-float,
          .tiny-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12%] top-[-24%] h-[560px] w-[560px] rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute right-[-14%] bottom-[-28%] h-[620px] w-[620px] rounded-full bg-orange-100/95 blur-3xl" />
        <div className="absolute left-[30%] top-[24%] h-40 w-40 rounded-full bg-white/80 blur-3xl" />

        <svg
          className="absolute left-0 top-0 h-[260px] w-full opacity-70"
          viewBox="0 0 1440 260"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            className="contact-trail"
            d="M-60 120 C140 30 290 175 455 86 C650 -20 785 158 955 76 C1155 -20 1305 68 1510 20"
            stroke="#fb923c"
            strokeWidth="2.5"
            strokeDasharray="10 15"
            strokeLinecap="round"
          />
        </svg>

        <div className="soft-float absolute left-[6%] top-10 hidden text-5xl lg:block">
          🛫
        </div>
        <div className="soft-float absolute right-[8%] top-10 hidden text-5xl lg:block">
          ☁️
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
            >
              <div className="tiny-pulse mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-3xl font-black text-white">
                ✓
              </div>

              <h3 className="mt-6 text-3xl font-black text-[#2d145f]">
                Italy Plan Request Sent
              </h3>

              <p className="mt-4 leading-relaxed text-slate-600">
                {lastInquiryName ? `${lastInquiryName}, your` : "Your"} inquiry has
                been added. Our team will review your Italy study profile and contact
                you soon.
              </p>

              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="mt-7 w-full rounded-2xl bg-orange-600 py-4 font-black text-white transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-[1500px]">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-black text-orange-600 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Let&apos;s Plan Your Italian Journey
          </div>

          <h2 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-[#2d145f] sm:text-6xl lg:text-7xl">
            Get Your <span className="text-orange-600">Italy Study Plan</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Get a personalized university match, scholarship opportunities, visa
            roadmap, and expert guidance for studying in Italy.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {["University Match", "Scholarships", "Visa Roadmap"].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-2.5 text-sm font-black text-[#2d145f] shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-orange-600" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="mt-11 rounded-[2.6rem] border border-orange-100 bg-white/70 p-4 shadow-[0_30px_100px_rgba(251,146,60,0.18)] backdrop-blur-xl sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1.03fr_0.97fr]">
            <motion.div
              initial={{ opacity: 0, x: -34 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75 }}
              viewport={{ once: true }}
              className="relative min-h-[720px] overflow-hidden rounded-[2.1rem] bg-gradient-to-br from-white via-[#fff8f1] to-orange-50 p-8 sm:p-10"
            >
              <div className="absolute inset-x-10 bottom-6 h-[360px] rounded-full bg-orange-200/35 blur-3xl" />

              <div className="relative z-20 max-w-[620px]">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-600 shadow-sm">
                  <Stars className="h-4 w-4" />
                  Italy-first study roadmap
                </div>

                <h3 className="max-w-[600px] text-5xl font-black leading-[0.92] tracking-tight sm:text-6xl xl:text-[4.65rem]">
                  <span className="block text-[#2d145f]">Your dream</span>
                  <span className="block text-[#2d145f]">deserves a</span>
                  <span className="block text-orange-600">clear plan.</span>
                </h3>

                <div className="mt-5 flex max-w-[520px] gap-4 rounded-[1.7rem] border border-orange-100 bg-white/75 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.07)] backdrop-blur">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <p className="text-base font-bold leading-7 text-slate-600">
                    Tell us your goals and we&apos;ll shape your Italian university,
                    scholarship and visa direction step by step.
                  </p>
                </div>

              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-8 top-[34%] z-30 hidden max-w-[230px] rounded-[1.6rem] border border-orange-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] xl:block"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Target className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-lg font-black text-[#2d145f]">
                  Study. <span className="text-orange-600">Apply.</span> Fly.
                </h4>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                  One focused roadmap for university fit, DSU routes, budget and visa steps.
                </p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-8 bottom-20 z-30 hidden max-w-[230px] rounded-[1.6rem] border border-orange-100 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:block"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-lg font-black text-[#2d145f]">
                  Personal shortlist
                </h4>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                  We help you understand which Italian universities match your profile.
                </p>
              </motion.div>

              <div className="absolute right-10 bottom-24 z-30 hidden flex-col gap-3 xl:flex">
                {["University Match", "Scholarship Route", "Visa Roadmap"].map(
                  (item, index) => (
                    <motion.div
                      key={item}
                      animate={{ x: [0, index % 2 === 0 ? 8 : -8, 0] }}
                      transition={{
                        duration: 4 + index,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-fit rounded-full border border-orange-100 bg-white/95 px-4 py-2 text-sm font-black text-[#2d145f] shadow-lg"
                    >
                      <span className="text-orange-600">✦</span> {item}
                    </motion.div>
                  )
                )}
              </div>

              <img
                src={consultationMascot}
                alt="Zaifan consultation mascot pointing toward the Italy study plan form"
                className="absolute -bottom-8 left-1/2 z-10 w-[84%] max-w-[650px] -translate-x-1/2 object-contain drop-shadow-[0_34px_40px_rgba(15,23,42,0.14)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 34 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.75 }}
              viewport={{ once: true }}
              className="rounded-[2.1rem] border border-orange-100 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.09)] sm:p-7 lg:p-8"
            >
              <div className="mb-6 flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <CalendarCheck className="h-8 w-8" />
                </div>

                <div>
                  <h3 className="text-3xl font-black leading-tight text-[#2d145f]">
                    Get Your Italy Study Plan
                  </h3>
                  <p className="mt-2 text-base font-semibold leading-6 text-slate-600">
                    Fill this once. We&apos;ll turn it into your Italy study roadmap.
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-orange-100 bg-[#fff8f1] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Profile Progress
                  </span>
                  <span className="text-sm font-black text-[#2d145f]">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-orange-600 transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mb-6 grid gap-3 sm:grid-cols-3">
                {["Match", "DSU", "Visa"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-center"
                  >
                    <p className="text-sm font-black text-orange-600">{item}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Included</p>
                  </div>
                ))}
              </div>

              {submissionError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {submissionError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className={labelClass}>Full Name *</span>
                    <input
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      required
                      value={formValues.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Email Address *</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={formValues.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className={labelClass}>Phone Number *</span>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+92 98765 43210"
                      required
                      value={formValues.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </label>

                  <label>
                    <span className={labelClass}>Destination Focus *</span>
                    <select
                      name="country"
                      required
                      value={formValues.country}
                      onChange={(event) => updateField("country", event.target.value)}
                      className={selectClass}
                    >
                      {countries.map((country) => (
                        <option key={country}>{country}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className={labelClass}>Current Qualification *</span>
                    <select
                      name="studyLevel"
                      required
                      value={formValues.studyLevel}
                      onChange={(event) => updateField("studyLevel", event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select your qualification</option>
                      {studyLevels.map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className={labelClass}>Intake Preference *</span>
                    <select
                      name="intake"
                      required
                      value={formValues.intake}
                      onChange={(event) => updateField("intake", event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select intake</option>
                      {intakes.map((intake) => (
                        <option key={intake}>{intake}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <span className={labelClass}>Field of Interest *</span>
                  <select
                    name="fieldOfInterest"
                    required
                    value={formValues.fieldOfInterest}
                    onChange={(event) =>
                      updateField("fieldOfInterest", event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="">Select your field of interest</option>
                    {fields.map((field) => (
                      <option key={field}>{field}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelClass}>Tell us about your Italy study goals</span>
                  <textarea
                    name="message"
                    placeholder="Example: I want to study Computer Science in Italy, need scholarship options, and want to understand tuition and visa steps..."
                    required
                    value={formValues.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    className="mt-2 h-28 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 text-lg font-black text-white shadow-xl shadow-orange-600/20 transition hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                  {isSubmitting ? "Submitting..." : "Get My Italy Study Plan"}
                </button>

                <a
                  href="/appointment?country=Italy"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-orange-200 bg-white text-lg font-black text-orange-600 transition hover:-translate-y-1 hover:border-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-orange-100"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Book Italy Appointment Instead
                </a>

                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-orange-100" />
                  <span className="text-sm font-black text-slate-400">or</span>
                  <div className="h-px flex-1 bg-orange-100" />
                </div>

                <a
                  href={whatsappPreviewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-green-300 bg-white text-lg font-black text-green-600 transition hover:-translate-y-1 hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat About Italy on WhatsApp
                </a>

                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="flex items-start gap-2 text-xs font-bold leading-5 text-orange-700">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    Your details will be saved as an Italy-focused inquiry for advisor
                    follow-up.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 rounded-[2rem] border border-orange-100 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur">
          {bottomStrip.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-full border border-orange-100 bg-[#fff8f1] px-5 py-3 text-sm font-black text-[#2d145f] transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
              >
                <Icon className="h-4 w-4 text-orange-600" />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Contact;
