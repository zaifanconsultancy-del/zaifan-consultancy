import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  Users,
  Globe2,
  Building2,
  Award,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

import consultationMascot from "../assets/images/contact/consultation-mascot.png";

const countries = [
  "Italy",
  "Germany",
  "Turkey",
  "United Kingdom",
  "Canada",
  "Australia",
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

const stats = [
  {
    icon: Building2,
    value: "500+",
    label: "Partner Universities",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Globe2,
    value: "20+",
    label: "Countries Covered",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: FileText,
    value: "10K+",
    label: "Applications Processed",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Award,
    value: "₹50Cr+",
    label: "Scholarships Helped",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Users,
    value: "Expert",
    label: "Counselor Support",
    color: "bg-rose-50 text-rose-600",
  },
];

const defaultFormState = {
  name: "",
  email: "",
  phone: "",
  country: "",
  studyLevel: "",
  intake: "",
  fieldOfInterest: "",
  message: "",
};

function getInitialFormState() {
  if (typeof window === "undefined") return defaultFormState;

  const params = new URLSearchParams(window.location.search);
  const countryParam = params.get("country");
  const serviceParam = params.get("service");
  const fieldParam = params.get("field");

  return {
    ...defaultFormState,
    country: countries.includes(countryParam) ? countryParam : "",
    fieldOfInterest: fields.includes(fieldParam) ? fieldParam : "",
    message: serviceParam
      ? `I want guidance about ${serviceParam.replaceAll("-", " ")}.`
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
    if (typeof window === "undefined") return "website_contact";
    const params = new URLSearchParams(window.location.search);
    return params.get("source") || params.get("utm_source") || "website_contact";
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
    "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  const selectClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  const labelClass = "text-sm font-bold text-[#2d145f]";

  const updateField = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (submissionError) setSubmissionError("");
  };

  const buildWhatsAppMessage = (formData) => `
Hello Zaifan Consultancy,

I submitted an inquiry from the website.

Name: ${formData.full_name}
Email: ${formData.email}
Phone: ${formData.phone}
Preferred Country: ${formData.country}
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
      country: formValues.country || "Not sure yet",
      study_level: formValues.studyLevel || "Not sure yet",
      field_of_interest: formValues.fieldOfInterest || "Not sure yet",
      counseling_mode: formValues.intake || "Not sure yet",
      lead_source: sourceLabel,
      message:
        formValues.message ||
        "I want help planning my study abroad journey.",
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
      className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-8 text-[#071b3a] sm:px-6 sm:pt-10 lg:px-8"
    >
      <style>{`
        @keyframes contactTrailMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -150; }
        }

        @keyframes contactFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }

        @keyframes contactPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.04); opacity: 1; }
        }

        .contact-trail {
          animation: contactTrailMove 9s linear infinite;
        }

        .contact-float {
          animation: contactFloat 4.8s ease-in-out infinite;
        }

        .contact-pulse {
          animation: contactPulse 2.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-trail,
          .contact-float,
          .contact-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute right-[-12%] bottom-[-20%] h-[560px] w-[560px] rounded-full bg-orange-100/80 blur-3xl" />
        <div className="absolute left-[38%] top-[22%] h-24 w-24 rounded-full bg-white/80 blur-2xl" />

        <div className="contact-float absolute left-[4%] top-3 hidden text-5xl lg:block">
          🛫
        </div>
        <div className="contact-float absolute right-[8%] top-8 hidden text-5xl opacity-80 lg:block">
          ☁️
        </div>

        <svg
          className="absolute left-0 top-0 h-[250px] w-full opacity-80"
          viewBox="0 0 1440 250"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            className="contact-trail"
            d="M-30 120 C140 20 260 180 420 85 C610 -25 735 165 920 70 C1110 -30 1240 60 1490 15"
            stroke="#fb923c"
            strokeWidth="2.5"
            strokeDasharray="10 14"
            strokeLinecap="round"
            opacity="0.72"
          />
        </svg>

        <div className="absolute left-[46%] top-[82px] text-4xl text-orange-400">
          ✦
        </div>
        <div className="absolute right-[42%] top-[16%] text-4xl text-orange-400">
          ✦
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Inquiry submitted successfully"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
            >
              <div className="contact-pulse mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-3xl font-black text-white">
                ✓
              </div>

              <h3 className="mt-6 text-3xl font-black text-[#2d145f]">
                Inquiry Submitted
              </h3>

              <p className="mt-4 leading-relaxed text-slate-600">
                {lastInquiryName ? `${lastInquiryName}, your` : "Your"} inquiry
                has been added. Our team will review your profile and contact
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
        <div className="rounded-[2.2rem] border border-orange-100 bg-white/55 p-4 shadow-[0_28px_90px_rgba(251,146,60,0.16)] backdrop-blur-xl sm:p-6">
          <div className="grid gap-8 lg:grid-cols-[1.42fr_1fr]">
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative min-h-[720px] overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-white via-[#fff7ed] to-orange-50 p-7 sm:p-10"
            >
              <div className="absolute right-10 top-8 hidden select-none text-[120px] font-black leading-none text-orange-100/80 xl:block">
                PLAN
              </div>

              <div className="relative z-20 max-w-xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-5 py-2 text-sm font-black text-orange-600 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Let&apos;s Plan Your Future Together
                </div>

                <h2 className="text-5xl font-black leading-[0.98] tracking-tight text-[#2d145f] sm:text-6xl lg:text-7xl">
                  Book Your
                  <br />
                  <span className="text-orange-600">
                    Free Consultation
                  </span>
                </h2>

                <p className="mt-6 max-w-md text-lg font-semibold leading-8 text-slate-700">
                  Get personalized guidance from our experts and take the next
                  step toward your study abroad journey.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {["Free profile review", "University shortlist", "Visa roadmap"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-[#2d145f] shadow-sm ring-1 ring-orange-100"
                    >
                      <CheckCircle2 className="h-4 w-4 text-orange-600" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute left-8 top-[44%] z-30 hidden max-w-[230px] rounded-[2rem] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.12)] sm:block">
                <h3 className="text-xl font-black leading-tight text-orange-600">
                  Not sure where to start?
                </h3>
                <p className="mt-3 text-base font-bold leading-7 text-[#2d145f]">
                  We&apos;re here to help you find the best path forward!
                </p>
                <div className="mt-2 text-2xl text-orange-500">♡</div>
              </div>

              <div className="absolute right-8 top-[26%] z-20 hidden max-w-[250px] rounded-[2rem] bg-white/90 px-6 py-5 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur xl:block">
                <p className="text-lg font-black text-orange-600">
                  Ready to study abroad?
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                  Let&apos;s build your plan together.
                </p>
              </div>

              <div className="absolute right-10 top-[43%] z-20 hidden flex-col gap-3 xl:flex">
                <div className="w-fit rounded-full bg-white/90 px-4 py-2 text-sm font-black text-purple-700 shadow-lg">
                  🎓 University Match
                </div>
                <div className="ml-8 w-fit rounded-full bg-white/90 px-4 py-2 text-sm font-black text-orange-600 shadow-lg">
                  💰 Scholarships
                </div>
                <div className="ml-3 w-fit rounded-full bg-white/90 px-4 py-2 text-sm font-black text-blue-600 shadow-lg">
                  ✈️ Visa Help
                </div>
              </div>

              <img
                src={consultationMascot}
                alt="Zaifan consultation mascot filling a form"
                className="absolute bottom-0 left-1/2 z-10 w-[96%] max-w-[930px] -translate-x-1/2 object-contain drop-shadow-[0_30px_40px_rgba(15,23,42,0.12)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="rounded-[1.8rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8 lg:p-9"
            >
              <div className="mb-6 flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <CalendarCheck className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#2d145f]">
                    Tell Us About Yourself
                  </h3>
                  <p className="mt-2 text-base font-semibold leading-6 text-slate-600">
                    Fill in your details and our expert will connect with you
                    soon.
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-100">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Profile progress
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

              {submissionError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {submissionError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
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

                <div className="grid gap-5 md:grid-cols-2">
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
                    <span className={labelClass}>Preferred Country *</span>
                    <select
                      name="country"
                      required
                      value={formValues.country}
                      onChange={(event) => updateField("country", event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country}>{country}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
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
                    onChange={(event) => updateField("fieldOfInterest", event.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select your field of interest</option>
                    {fields.map((field) => (
                      <option key={field}>{field}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className={labelClass}>
                    Tell us about your study goals
                  </span>
                  <textarea
                    name="message"
                    placeholder="Write a few words about your goals..."
                    required
                    value={formValues.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    className="mt-2 h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-orange-600 text-lg font-black text-white shadow-xl shadow-orange-600/20 transition hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-5 w-5" />
                  {isSubmitting ? "Submitting..." : "Get Free Consultation"}
                </button>
<a
  href="/appointment"
  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-orange-200 bg-white text-lg font-black text-orange-600 transition hover:-translate-y-1 hover:border-orange-600 hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-orange-100"
>
  <CalendarCheck className="h-5 w-5" />
  Book Appointment Instead
</a>
                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-sm font-bold text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <a
                  href={whatsappPreviewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-green-300 bg-white text-lg font-black text-green-600 transition hover:-translate-y-1 hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat on WhatsApp
                </a>

                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="flex items-start gap-2 text-xs font-bold leading-5 text-orange-700">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    Your details will be saved as a new inquiry for advisor
                    follow-up.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-[2rem] bg-white/85 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-2 lg:grid-cols-5">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="group flex items-center justify-center gap-4 border-orange-100 px-4 py-3 transition duration-300 hover:-translate-y-1 lg:border-r lg:last:border-r-0"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${item.color} transition duration-300 group-hover:scale-105`}
                >
                  <Icon className="h-8 w-8" />
                </div>

                <div>
                  <div className="text-3xl font-black text-[#2d145f]">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-600">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-orange-100">
            Response within 24 hours
          </span>
          <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-orange-100">
            Free consultation
          </span>
          <span className="rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-orange-100">
            No hidden charges
          </span>
        </div>
      </div>
    </section>
  );
}

export default Contact;
