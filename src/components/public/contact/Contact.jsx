import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  BadgeCheck,
  CalendarCheck,
  FileText,
  GraduationCap,
  Landmark,
  MessageCircle,
  Plane,
  Send,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

import consultationMascot from "../../../assets/images/contact/contact-mascot-pointing.webp";
import contactWindow from "../../../assets/images/contact/contact-window-italy.webp";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

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

function normalizeCountryValue() {
  return "Italy";
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
    `mt-2 h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 hover:-translate-y-0.5 hover:shadow-sm focus:-translate-y-0.5 focus:border-orange-400 focus:shadow-md focus:ring-4 focus:ring-orange-100 ${INTERACTIVE_TRANSITION}`;

  const selectClass =
    `mt-2 h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none hover:-translate-y-0.5 hover:shadow-sm focus:-translate-y-0.5 focus:border-orange-400 focus:shadow-md focus:ring-4 focus:ring-orange-100 ${INTERACTIVE_TRANSITION}`;

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

    const { error } = await supabase.from("inquiries").insert([formData]);

    if (error) {
      console.error("Inquiry submission failed:", error);
      setSubmissionError(
        "Your inquiry could not be submitted right now. Please message us on WhatsApp or try again."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: formData,
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
      }
    } catch (err) {
      console.error("Email notification failed:", err);
    }

    setLastInquiryName(formData.full_name);
    setFormValues(defaultFormState);
    setShowSuccess(true);
    setIsSubmitting(false);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#fff8f1] px-4 py-12 text-[#071f50] sm:px-6 lg:px-8"
    >
      <style>{`
        @keyframes contactTrail {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -220; }
        }

        @keyframes softFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes tinyPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .contact-trail {
          animation: contactTrail 12s linear infinite;
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

          #contact *,
          #contact *::before,
          #contact *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 top-20 h-[440px] w-[440px] rounded-full bg-orange-200/28 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[#0a4aa6]/10 blur-3xl" />

        <svg
          className="absolute left-0 top-6 h-[260px] w-full opacity-55"
          viewBox="0 0 1440 260"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            className="contact-trail"
            d="M-60 160 C150 50 310 190 510 88 C750 -30 920 178 1110 92 C1260 24 1380 38 1510 8"
            stroke="#fb923c"
            strokeWidth="2.5"
            strokeDasharray="10 15"
            strokeLinecap="round"
          />
        </svg>

        <div className="soft-float absolute left-[5%] top-16 hidden text-5xl lg:block">
          🛫
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              className="w-full max-w-lg rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
            >
              <div className="tiny-pulse mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-3xl font-black text-white">
                ✓
              </div>

              <h3 className="mt-6 text-3xl font-black text-[#071f50]">
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
                className="mt-7 w-full rounded-2xl bg-orange-600 py-4 font-black text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus:ring-orange-200"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-[1460px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(249,115,22,0.22)]">
            <Plane className="h-4 w-4" />
            Let&apos;s Plan Your Italy Journey
          </div>

          <h2 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.05em] text-[#071f50] sm:text-6xl lg:text-7xl">
            Get Your <span className="text-orange-600">Italy Study Plan</span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
            Personalized university matches, scholarships, visa roadmap and clear
            next-step guidance for studying in Italy.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {[
              ["🎓", "University Match"],
              ["🏆", "Scholarships"],
              ["🛂", "Visa Roadmap"],
              ["👤", "Expert Guidance"],
            ].map(([icon, item]) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-105 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
              >
                <span>{icon}</span>
                {item}
              </span>
            ))}
          </div>

        </motion.div>

        <div className="mt-8 overflow-hidden rounded-[2.7rem] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.10)] ring-1 ring-orange-100 transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_34px_110px_rgba(15,23,42,0.14)]">
          <div className="grid lg:grid-cols-[1.03fr_0.97fr]">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              viewport={{ once: true }}
              className="group relative hidden min-h-[890px] overflow-hidden border-b border-orange-100 p-7 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(7,31,80,0.10)] sm:p-9 lg:block lg:border-b-0 lg:border-r"
            >
              <img
                src={contactWindow}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-left opacity-95"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/96 via-white/58 to-white/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/8 via-transparent to-white/10" />

              {/* Covers the blue/orange decorative arc baked into the background image */}
              <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-[12%] bg-white" />

              <div className="relative z-20 max-w-[540px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-orange-600 shadow-sm ring-1 ring-orange-100">
                  🇮🇹 Italy-Focused Guidance
                </div>

                <h3 className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.055em] text-[#071f50] sm:text-6xl">
                  Your dream
                  <span className="block">deserves a</span>
                  <span className="block text-orange-600">clear plan.</span>
                </h3>

                <p className="mt-5 max-w-md text-base font-semibold leading-7 text-slate-600">
                  Tell us your goals and we&apos;ll help shape your personalized Italy study roadmap.
                </p>
              </div>

              <div className="absolute left-7 top-[330px] z-30 hidden w-[240px] space-y-3 xl:block">
                {[
                  ["🎯", "Personalized University Match", "Shortlist universities that fit your profile."],
                  ["🏆", "Scholarships & Funding", "Understand DSU and regional funding routes."],
                  ["🛂", "Visa & Documentation", "Build a clearer document and visa preparation path."],
                  ["🎧", "End-to-End Support", "Keep the journey connected from shortlist to next steps."],
                ].map(([icon, title, text]) => (
                  <div
                    key={title}
                    className="group/card rounded-[1.5rem] bg-white/95 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.10)] ring-1 ring-orange-100 backdrop-blur transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.025] hover:shadow-[0_20px_50px_rgba(15,23,42,0.14)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <h4 className="text-sm font-black text-[#071f50]">{title}</h4>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <img
                src={consultationMascot}
                alt="Zaifan consultation mascot pointing toward the Italy study plan form"
                loading="lazy"
                decoding="async"
                className="
                  absolute
                  bottom-[72px]
                  left-[57%]
                  z-20
                  w-[62%]
                  max-w-[500px]
                  -translate-x-1/2
                  object-contain
                  object-bottom
                  drop-shadow-[0_28px_38px_rgba(7,31,80,0.16)]
                  lg:left-[58%]
                  lg:w-[64%]
                  xl:left-[60%]
                  xl:w-[66%]
                "
              />

              <div className="absolute bottom-6 left-7 right-7 z-30 rounded-[1.8rem] bg-[#071f50] p-5 text-white shadow-[0_18px_45px_rgba(7,31,80,0.24)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(7,31,80,0.32)]">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-100 text-2xl ring-2 ring-white/20">
                    🧭
                  </div>

                  <div>
                    <p className="text-sm font-black">Not sure where to start?</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/65">
                      Share your profile and goals — we&apos;ll help you identify the smartest next step for studying in Italy.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              viewport={{ once: true }}
              className="bg-white p-6 transition-all duration-500 sm:p-8 lg:p-10"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#071f50] text-white">
                  <CalendarCheck className="h-7 w-7" />
                </div>

                <div>
                  <h3 className="text-3xl font-black leading-tight text-[#071f50]">
                    Get Your Italy Study Plan
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Fill in the details below and we&apos;ll understand your next useful step.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-[#fff8f1] p-4 ring-1 ring-orange-100">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.15em] text-orange-600">
                    Profile Progress
                  </span>
                  <span className="text-sm font-black text-[#071f50]">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#0a4aa6] transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {submissionError && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {submissionError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                    <div
                      aria-label="Destination Focus"
                      aria-disabled="true"
                      className="mt-2 flex h-12 w-full cursor-not-allowed items-center rounded-2xl border border-orange-200 bg-[#fff8f1] px-4 text-sm font-black text-orange-600"
                    >
                      Italy
                    </div>
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
                    className={`mt-2 h-28 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 hover:-translate-y-0.5 hover:shadow-sm focus:-translate-y-0.5 focus:border-[#0a4aa6] focus:shadow-md focus:ring-4 focus:ring-blue-100 ${INTERACTIVE_TRANSITION}`}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 text-lg font-black text-white shadow-xl shadow-orange-600/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                  {isSubmitting ? "Submitting..." : "Get My Italy Study Plan"}
                </button>

                <a
                  href="/appointment?country=Italy"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-orange-300 bg-white text-lg font-black text-orange-600 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-50 focus:outline-none focus-visible:ring-4 focus:ring-orange-100"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Book Free Consultation Instead
                </a>

                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-sm font-black text-slate-400">OR</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <a
                  href={whatsappPreviewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-green-300 bg-white text-lg font-black text-green-600 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-green-50 focus:outline-none focus-visible:ring-4 focus:ring-green-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat with Us on WhatsApp
                </a>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="flex items-start gap-2 text-xs font-bold leading-5 text-slate-600">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0a4aa6]" />
                    Your details will be saved as an Italy-focused inquiry for advisor follow-up.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {bottomStrip.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="group flex items-center gap-3 rounded-[1.5rem] bg-white px-5 py-4 text-sm font-black text-[#071f50] shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.025] hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]"
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:rotate-3 ${
                    index % 2 === 0
                      ? "bg-[#071f50] text-white"
                      : "bg-orange-600 text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
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
