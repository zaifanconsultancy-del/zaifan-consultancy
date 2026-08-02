import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  LockKeyhole,
  MessagesSquare,
  BookOpenCheck,
  Building2,
  Wallet,
  Landmark,
  Award,
  ArrowRight,
  CircleHelp,
  ClipboardCheck,
  X,
} from "lucide-react";

import consultantMascot from "../../assets/images/appointment/consultant-mascot.webp";
import globeBooks from "../../assets/images/appointment/globe-books.webp";
import { supabase } from "../../lib/supabaseClient";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
  stagger: 0.06,
};

const ACCORDION_MOTION = {
  duration: 0.32,
  ease: MOTION.ease,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const fadeSide = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const initialFormData = {
  full_name: "",
  email: "",
  phone: "",
  country_interest: "Italy",
  consultation_type: "Free Italy Study Plan",
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
  "Free Italy Study Plan",
  "Italy University Selection",
  "Italy Admission Guidance",
  "Italy Scholarship Guidance",
  "Italy Visa Guidance",
  "SOP & Documentation",
];

const countries = ["Italy"];

const journeySteps = [
  { title: "Profile", body: "Share your goals", color: "bg-[#071d43]" },
  { title: "Match", body: "We shortlist Italy options", color: "bg-orange-500" },
  { title: "Scholarship", body: "We map DSU and merit routes", color: "bg-sky-500" },
  { title: "Visa", body: "We plan your documents", color: "bg-emerald-500" },
];

const stats = [
  { icon: GraduationCap, value: "Italy", label: "Focused Guidance", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: UsersRound, value: "8", label: "City Guides", color: "text-[#071d43]", bg: "bg-blue-50" },
  { icon: FileCheck2, value: "DSU", label: "Scholarship Guidance", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: BadgeDollarSign, value: "Visa", label: "Planning Support", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Trophy, value: "Free", label: "First Consultation", color: "text-rose-500", bg: "bg-rose-50" },
];

const trustCards = [
  { icon: Clock, title: "Response time", body: "Usually within 24 hours", color: "text-orange-500", bg: "bg-orange-50", ring: "ring-orange-100" },
  { icon: CheckCircle2, title: "Personalized", body: "Advice for your unique goals", color: "text-orange-500", bg: "bg-orange-50", ring: "ring-orange-100" },
  { icon: LockKeyhole, title: "Secure & Private", body: "Your information is protected", color: "text-[#071d43]", bg: "bg-blue-50", ring: "ring-blue-100" },
  { icon: MessagesSquare, title: "Expert Guidance", body: "From experienced counselors", color: "text-sky-500", bg: "bg-sky-50", ring: "ring-sky-100" },
];

const italyRoutes = [
  { icon: BookOpenCheck, title: "Computer Science", body: "English-taught programs, DSU routes and tech-city options." },
  { icon: Building2, title: "Business", body: "Milan, Rome, Bologna and strong public university pathways." },
  { icon: GraduationCap, title: "Engineering", body: "Technical universities, public options and practical intake planning." },
  { icon: Award, title: "Medicine & Health", body: "Admission timelines, document planning and realistic fit checks." },
];

const italyBenefits = [
  "Low public university tuition",
  "DSU and regional scholarships",
  "English-taught study options",
  "Strong student cities",
  "Clear visa document roadmap",
];

const popularCities = ["Milan", "Rome", "Bologna", "Padua", "Florence", "Turin", "Pisa", "Venice"];


const afterBookingSteps = [
  {
    icon: Send,
    title: "Submit Request",
    body: "Share your profile, preferred date, service focus and study goals.",
  },
  {
    icon: ClipboardCheck,
    title: "Profile Review",
    body: "We review your education, budget, target course, city interest and scholarship needs.",
  },
  {
    icon: MessagesSquare,
    title: "Consultation Call",
    body: "A counselor discusses realistic Italy options, risks and next actions with you.",
  },
  {
    icon: Route,
    title: "Study Roadmap",
    body: "You get a clear direction for universities, DSU, documents and visa preparation.",
  },
];

const whoShouldBook = [
  {
    icon: MapPin,
    title: "Still Researching",
    body: "You like Italy but do not know which city, university or course direction fits yet.",
  },
  {
    icon: BadgeDollarSign,
    title: "Need Scholarship Help",
    body: "You want to understand DSU, regional support, merit awards and realistic affordability.",
  },
  {
    icon: GraduationCap,
    title: "Choosing Universities",
    body: "You are comparing Milan, Rome, Bologna, Padua, Turin or other Italian study routes.",
  },
  {
    icon: Plane,
    title: "Ready To Apply",
    body: "You need an organized plan for deadlines, documents, admission steps and visa readiness.",
  },
];

const consultationCards = [
  {
    icon: Sparkles,
    type: "Free Italy Study Plan",
    title: "Italy Starter Call",
    body: "Best if you are new and want a complete first direction.",
  },
  {
    icon: BadgeDollarSign,
    type: "Italy Scholarship Guidance",
    title: "Scholarship Strategy",
    body: "DSU, regional support, affordability and document planning.",
  },
  {
    icon: GraduationCap,
    type: "Italy University Selection",
    title: "University Selection",
    body: "Compare universities by program, city, tuition and student fit.",
  },
  {
    icon: FileCheck2,
    type: "Italy Admission Guidance",
    title: "Application Roadmap",
    body: "Plan requirements, deadlines and file preparation clearly.",
  },
  {
    icon: ShieldCheck,
    type: "Italy Visa Guidance",
    title: "Visa Preparation",
    body: "Understand the visa file, financial proof and appointment direction.",
  },
  {
    icon: BookOpenCheck,
    type: "SOP & Documentation",
    title: "SOP & Documents",
    body: "Organize academic, financial, scholarship and supporting documents.",
  },
];

const readinessCards = [
  {
    icon: CircleHelp,
    title: "Just Researching",
    message: "I am just researching Italy and need help understanding universities, cities, scholarships and cost.",
    body: "You need a simple first roadmap before making decisions.",
  },
  {
    icon: GraduationCap,
    title: "Shortlisting Universities",
    message: "I am shortlisting Italian universities and need help comparing course fit, city, tuition and scholarship route.",
    body: "You have a direction but need help choosing smartly.",
  },
  {
    icon: FileCheck2,
    title: "Preparing Documents",
    message: "I want to prepare my Italy admission, DSU scholarship and visa documents correctly.",
    body: "You need document clarity before deadlines become stressful.",
  },
  {
    icon: Plane,
    title: "Ready To Apply",
    message: "I am ready to apply for Italy and need a complete application, scholarship and visa roadmap.",
    body: "You need a focused execution plan, not random browsing.",
  },
];

const promiseCards = [
  {
    title: "What we will do",
    tone: "green",
    items: [
      "University matching",
      "Scholarship and DSU guidance",
      "Application strategy",
      "Visa roadmap direction",
      "Document planning",
      "Realistic next steps",
    ],
  },
  {
    title: "What we will not do",
    tone: "orange",
    items: [
      "Fake admission guarantees",
      "Guaranteed DSU claims",
      "Guaranteed visa promises",
      "One-size-fits-all advice",
      "Pressure without clarity",
      "Fake success outcomes",
    ],
  },
];

const consultationFaqs = [
  {
    q: "Is the Italy consultation free?",
    a: "Yes. The first Italy consultation request is free. The goal is to understand your profile and guide you toward a realistic study direction.",
  },
  {
    q: "How long does the consultation take?",
    a: "The exact duration can vary, but the focus is to clarify your university direction, scholarship route, document needs and next steps.",
  },
  {
    q: "Can parents join the call?",
    a: "Yes. Parents can join, especially when budget, scholarship, documents and long-term planning need to be discussed together.",
  },
  {
    q: "Is DSU scholarship guaranteed?",
    a: "No. DSU and regional support depend on eligibility, ranking, deadlines, documents and current regional rules. We help you plan, not fake guarantees.",
  },
  {
    q: "Do I need documents before booking?",
    a: "Not always. You can book early. If you already have transcripts, passport, income documents or target universities, mention them in the message box.",
  },
  {
    q: "Can you help me choose universities?",
    a: "Yes. The consultation can focus on matching your course, budget, city preference, scholarship potential and application readiness with Italian universities.",
  },
  {
    q: "What happens after the consultation?",
    a: "You should have a clearer direction for university shortlisting, scholarship planning, documents, deadlines and possible next steps with Zaifan.",
  },
  {
    q: "Do you help with visa planning?",
    a: "Yes. We can help you understand the visa roadmap, document preparation and file direction after your admission and study route are clearer.",
  },
];

const normalizeValue = (value) => value?.trim().toLowerCase();

const findMatchingOption = (options, value) => {
  const normalized = normalizeValue(value);
  return options.find((option) => normalizeValue(option) === normalized) || "";
};

function AppointmentPage() {
  const prefersReducedMotion = useReducedMotion();
  const [formData, setFormData] = useState(initialFormData);
  const [submittedAppointment, setSubmittedAppointment] = useState(null);
  const [prefillNotice, setPrefillNotice] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const countryParam = params.get("country") || "Italy";
    const serviceParam = params.get("service") || params.get("consultation");
    const universityParam = params.get("university");
    const cityParam = params.get("city");
    const dateParam = params.get("date");
    const timeParam = params.get("time");
    const nameParam = params.get("name");
    const emailParam = params.get("email");
    const phoneParam = params.get("phone");
    const messageParam = params.get("message");

    const matchedService = findMatchingOption(consultationTypes, serviceParam);
    const matchedTime = findMatchingOption(timeSlots, timeParam);

    const nextData = {
      country_interest: "Italy",
      consultation_type: matchedService || "Free Italy Study Plan",
    };

    if (nameParam) nextData.full_name = nameParam;
    if (emailParam) nextData.email = emailParam;
    if (phoneParam) nextData.phone = phoneParam;
    if (matchedTime) nextData.appointment_time = matchedTime;
    if (dateParam && dateParam >= minDate) nextData.appointment_date = dateParam;

    const messageParts = [];

    if (messageParam) messageParts.push(messageParam);

    if (cityParam) {
      setSelectedCity(cityParam);
      messageParts.push(`Preferred Italy city: ${cityParam}.`);
    }

    if (universityParam) {
      setSelectedUniversity(universityParam);
      messageParts.push(
        `I would like guidance for ${universityParam}${
          cityParam ? ` in ${cityParam}` : ""
        } in ${countryParam || "Italy"}.`
      );
    }

    if (serviceParam && !matchedService) {
      messageParts.push(`Requested service: ${serviceParam}`);
    }

    if (messageParts.length) {
      nextData.message = messageParts.join("\n");
    }

    setFormData((prev) => ({ ...prev, ...nextData }));

    if (universityParam || cityParam || serviceParam || countryParam) {
      setPrefillNotice("We prefilled your appointment details from the link.");
    }
  }, [minDate]);

  const appointmentSummary = useMemo(() => {
    return [
      { icon: MapPin, label: "Country", value: formData.country_interest },
      { icon: Sparkles, label: "Service", value: formData.consultation_type },
      { icon: MapPin, label: "City", value: selectedCity },
      { icon: GraduationCap, label: "University", value: selectedUniversity },
      { icon: CalendarDays, label: "Date", value: formData.appointment_date },
      { icon: Clock, label: "Time", value: formData.appointment_time },
    ].filter((item) => item.value);
  }, [formData, selectedCity, selectedUniversity]);

  const completionPercentage = useMemo(() => {
    const fields = [
      formData.full_name,
      formData.email,
      formData.phone,
      formData.country_interest,
      formData.consultation_type,
      formData.appointment_date,
      formData.appointment_time,
      formData.message,
    ];

    const completed = fields.filter((value) =>
      String(value || "").trim()
    ).length;

    return Math.round((completed / fields.length) * 100);
  }, [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const selectConsultationType = (type) => {
    setFormData((prev) => ({ ...prev, consultation_type: type }));
  };

  const selectReadiness = (message) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message ? `${prev.message}\n\n${message}` : message,
    }));
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi Zaifan Consultancy, I want to book an Italy study consultation.\n\nName: ${
        formData.full_name || "-"
      }\nCountry: Italy\nCity: ${selectedCity || "-"}\nUniversity: ${
        selectedUniversity || "-"
      }\nService: ${formData.consultation_type || "-"}\nPreferred Date: ${
        formData.appointment_date || "-"
      }\nPreferred Time: ${
        formData.appointment_time || "-"
      }\nMessage: ${formData.message || "-"}`
    );

    window.open(
      `https://wa.me/923305718131?text=${text}`,
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
      const finalMessage = [
        selectedCity ? `Selected city: ${selectedCity}` : "",
        selectedUniversity ? `Selected university: ${selectedUniversity}` : "",
        formData.message.trim(),
      ]
        .filter(Boolean)
        .join("\n\n");

      const appointmentData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country_interest: "Italy",
        consultation_type: formData.consultation_type || "Free Italy Study Plan",
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        message: finalMessage,
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

      setSuccess("Your Italy consultation request is confirmed. Our team will contact you soon.");
      setFormData(initialFormData);
      setSelectedCity("");
      setSelectedUniversity("");
      setPrefillNotice("");
    } catch (err) {
      console.log("APPOINTMENT SUBMIT ERROR:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <section
      id="appointment-page"
      className="relative overflow-hidden bg-[linear-gradient(180deg,#fff7ee_0%,#fff4e8_58%,#fff1e2_100%)] px-4 pb-10 pt-28 text-[#071d43] sm:px-6 lg:px-8"
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #appointment-page *,
          #appointment-page *::before,
          #appointment-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
      <div className="pointer-events-none absolute left-[-180px] top-20 h-[420px] w-[420px] rounded-full bg-orange-200/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-90px] right-[-120px] h-[320px] w-[320px] rounded-full bg-[#ffd7a8]/60 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[260px] w-[520px] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px]">
        <div className="grid items-start gap-7 xl:grid-cols-[1.02fr_0.9fr_260px]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="overflow-hidden rounded-[2.5rem] bg-[#fff7ee] shadow-[0_30px_90px_rgba(120,70,20,0.14)] ring-1 ring-orange-100"
          >
            <div className="relative p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.95),transparent_36%),radial-gradient(circle_at_28%_80%,rgba(255,180,90,0.22),transparent_32%)]" />

              <div className="relative z-10">
                <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-600 shadow-sm ring-1 ring-orange-100">
                  <Sparkles size={15} />
                  Free Italy Consultation
                </p>

                <h1 className="mt-5 max-w-[520px] text-4xl font-black leading-[1.04] tracking-tight text-[#071d43] md:text-5xl">
                  Book your Italy study appointment
                </h1>

                <p className="mt-3 max-w-[430px] text-base font-bold leading-relaxed text-[#17335d]">
                  Let&apos;s map your Italian university, scholarship and visa roadmap together.
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
                    width="1024"
                    height="1024"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="relative z-10 mx-auto mt-8 w-full max-w-[490px] object-contain drop-shadow-[0_24px_35px_rgba(120,70,20,0.18)]"
                  />

                  <div className="absolute right-0 -top-20 z-20 max-w-[240px] rounded-[1.35rem] bg-white p-4 shadow-[0_20px_45px_rgba(60,35,15,0.14)] ring-1 ring-orange-100 sm:right-2 sm:-top-16">
                    <p className="text-sm font-extrabold leading-relaxed text-[#54321c]">
                      We help you choose the right Italian university, scholarship path and visa steps.
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
                      <div key={stat.label} className="rounded-[1.25rem] px-2 py-2 text-center transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#fff8ec]">
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

              <div className="relative z-10 mt-4 rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_45px_rgba(120,70,20,0.08)] ring-1 ring-orange-100 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                      Popular Italy Routes
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#071d43]">
                      Pick your study direction
                    </h3>
                  </div>
                  <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600 sm:grid">
                    <Landmark size={24} />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {italyRoutes.map((route) => {
                    const Icon = route.icon;

                    return (
                      <div key={route.title} className="rounded-[1.35rem] border border-orange-100 bg-[#fffaf4] p-4 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                            <Icon size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-[#071d43]">{route.title}</h4>
                            <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{route.body}</p>
                          </div>
                        </div>
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
                <span>Italy Roadmap</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="rounded-[2.5rem] bg-white p-5 shadow-[0_30px_90px_rgba(120,70,20,0.14)] ring-1 ring-orange-100 sm:p-6"
          >
            <div className="mb-5 rounded-[1.7rem] border border-orange-100 bg-[linear-gradient(135deg,#fff8ef_0%,#fffdf9_100%)] p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <CalendarDays size={25} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
                    Italy Appointment Form
                  </p>
                  <h2 className="mt-1 text-2xl font-black leading-tight text-[#071d43]">
                    Get Your Italy Study Plan
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#244263]">
                    Italy is selected by default for now. Pick your university focus, date and time — our counselor will build the roadmap.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-[1.5rem] bg-[#fff8ef] p-4 ring-1 ring-orange-100">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-black uppercase tracking-[0.15em] text-orange-600">
                  Profile Progress
                </span>
                <span className="text-sm font-black text-[#071d43]">
                  {completionPercentage}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ff5a0a_0%,#0a4aa6_100%)]"
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: MOTION.duration,
                          ease: MOTION.ease,
                        }
                  }
                />
              </div>
            </div>

            {prefillNotice && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-black leading-relaxed text-orange-700">
                <Sparkles className="mt-0.5 shrink-0" size={18} />
                {prefillNotice}
              </div>
            )}

            {(selectedCity || selectedUniversity) && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {selectedCity && (
                  <div className="rounded-[1.6rem] border border-orange-100 bg-[#fff8ef] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                      Selected City
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#071d43]">
                      {selectedCity}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-slate-600">
                      We will include city fit, costs and local study routes.
                    </p>
                  </div>
                )}

                {selectedUniversity && (
                  <div className="rounded-[1.6rem] border border-orange-100 bg-[#fff8ef] p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                      Selected University
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#071d43]">
                      {selectedUniversity}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-slate-600">
                      Your consultation will focus on this university.
                    </p>
                  </div>
                )}
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
                <label>
                  <span className="mb-2 block text-xs font-black text-[#071d43]">Full Name *</span>
                  <input type="text" name="full_name" autoComplete="name" placeholder="Enter your full name" value={formData.full_name} onChange={handleChange} required className="w-full rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100" />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black text-[#071d43]">Email Address *</span>
                  <input type="email" name="email" autoComplete="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required className="w-full rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100" />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-xs font-black text-[#071d43]">Phone / WhatsApp Number *</span>
                <input type="tel" name="phone" autoComplete="tel" placeholder="+92 330 5718131" value={formData.phone} onChange={handleChange} required className="w-full rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-black text-[#071d43]">Destination Focus *</span>
                  <select name="country_interest" value="Italy" disabled className="w-full cursor-not-allowed rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 font-black text-orange-700 outline-none">
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black text-[#071d43]">Consultation Type *</span>
                  <select name="consultation_type" value={formData.consultation_type} onChange={handleChange} required className="w-full rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100">
                    {consultationTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-black text-[#071d43]">Preferred Date *</span>
                  <input type="date" name="appointment_date" min={minDate} value={formData.appointment_date} onChange={handleChange} required className="w-full rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100" />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black text-[#071d43]">Preferred Time *</span>
                  <select name="appointment_time" value={formData.appointment_time} onChange={handleChange} required className="w-full rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100">
                    <option value="">Select Time Slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span className="mb-2 block text-xs font-black text-[#071d43]">Your Italy Study Goals</span>
                <textarea name="message" placeholder="Example: I want to study in Italy, need university matching, scholarship options and visa roadmap..." value={formData.message} onChange={handleChange} rows="5" className="w-full resize-none rounded-2xl border border-orange-100 bg-white px-5 py-4 font-semibold text-[#071d43] outline-none transition duration-300 placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100" />
              </label>

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

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-full bg-orange-500 px-8 py-4 font-black text-white shadow-[0_16px_34px_rgba(234,88,12,0.24)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60">
                <Send size={18} />
                {loading ? "Submitting..." : "Request Italy Appointment"}
              </button>

              <button type="button" onClick={openWhatsApp} className="flex w-full items-center justify-center gap-3 rounded-full bg-green-500 px-8 py-4 font-black text-white shadow-[0_16px_34px_rgba(34,197,94,0.2)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-green-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-200">
                <MessageCircle size={18} />
                Continue on WhatsApp
              </button>

              <p className="text-center text-xs font-bold text-slate-500">
                WhatsApp: 03305718131
              </p>
            </form>
          </motion.div>

          <motion.aside
            initial="hidden"
            animate="show"
            variants={fadeSide}
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

              <div className="rounded-[2rem] bg-white/90 p-5 shadow-[0_18px_48px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <Wallet size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Why Italy</p>
                    <h3 className="mt-1 text-lg font-black text-[#071d43]">A smarter first destination</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {italyBenefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2 rounded-2xl bg-[#fff8ef] px-3 py-2 text-xs font-black leading-5 text-[#244263] ring-1 ring-orange-100">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>

              

              <img
                src={globeBooks}
                alt="Study abroad books and globe"
                width="992"
                height="1070"
                loading="lazy"
                decoding="async"
                className="mx-auto -mt-8 w-[190px] drop-shadow-[0_24px_35px_rgba(120,70,20,0.18)]"
              />

              <div className="rounded-[1.5rem] bg-white/90 p-4 shadow-[0_14px_34px_rgba(120,70,20,0.10)] ring-1 ring-orange-100">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500">
                    <Sparkles size={20} />
                  </div>

                  <p className="text-sm font-black leading-relaxed text-[#7c3f16]">
                    Italy-first guidance now. More countries come after real data is ready.
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            variants={fadeUp}
            className="rounded-[2.5rem] bg-white/92 p-6 shadow-[0_24px_70px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 sm:p-7"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                  <Route size={15} />
                  What happens after booking
                </p>
                <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#071d43] md:text-4xl">
                  Your request turns into a clear Italy study roadmap.
                </h2>
              </div>
              <p className="max-w-xl text-sm font-bold leading-7 text-[#244263]">
                Students should know what happens after they submit the form. This makes the booking feel safe, organized and purposeful.
              </p>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {afterBookingSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.title}
                    className="rounded-[1.8rem] bg-[#fff8ef] p-5 ring-1 ring-orange-100 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(120,70,20,0.08)]"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                        <Icon size={22} />
                      </div>
                      <span className="text-3xl font-black tracking-[-0.06em] text-orange-100">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#071d43]">{step.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            variants={fadeUp}
            className="rounded-[2.5rem] bg-[#071d43] p-6 text-white shadow-[0_24px_70px_rgba(7,29,67,0.18)] sm:p-7"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200 ring-1 ring-white/10">
              <UsersRound size={15} />
              Who should book
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-white md:text-4xl">
              This call is useful at every planning stage.
            </h2>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {whoShouldBook.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-[1.6rem] bg-white/10 p-4 ring-1 ring-white/10">
                    <Icon className="text-orange-300" size={24} />
                    <h3 className="mt-3 font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-6 text-white/70">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
          variants={fadeUp}
          className="mt-8 rounded-[2.5rem] bg-white/92 p-6 shadow-[0_24px_70px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 sm:p-7"
        >
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                <Sparkles size={15} />
                Choose your consultation type
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#071d43] md:text-4xl">
                Pick the support you need before submitting.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-bold leading-7 text-[#244263]">
              These cards connect directly with the form dropdown, so users understand the options instead of seeing only a plain select field.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {consultationCards.map((card) => {
              const Icon = card.icon;
              const isActive = formData.consultation_type === card.type;

              return (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => selectConsultationType(card.type)}
                  className={`rounded-[1.8rem] p-5 text-left ring-1 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${
                    isActive
                      ? "bg-orange-500 text-white ring-orange-500 shadow-[0_20px_45px_rgba(249,115,22,0.20)]"
                      : "bg-[#fff8ef] text-[#071d43] ring-orange-100 hover:bg-white hover:shadow-[0_18px_45px_rgba(120,70,20,0.08)]"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-2xl ${
                        isActive ? "bg-white/16 text-white" : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      <Icon size={23} />
                    </div>
                    {isActive && <CheckCircle2 size={22} />}
                  </div>
                  <h3 className="text-lg font-black">{card.title}</h3>
                  <p className={`mt-2 text-sm font-bold leading-6 ${isActive ? "text-white/82" : "text-slate-600"}`}>
                    {card.body}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            variants={fadeUp}
            className="rounded-[2.5rem] bg-white/92 p-6 shadow-[0_24px_70px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 sm:p-7"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
              <ClipboardCheck size={15} />
              Student readiness checker
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#071d43]">
              Tell us where you are in the journey.
            </h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#244263]">
              Click a stage and we will add it to your message field. This helps the counselor understand your situation faster.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {readinessCards.map((card) => {
                const Icon = card.icon;

                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => selectReadiness(card.message)}
                    className="rounded-[1.6rem] bg-[#fff8ef] p-4 text-left ring-1 ring-orange-100 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(120,70,20,0.08)]"
                  >
                    <Icon className="text-orange-600" size={24} />
                    <h3 className="mt-3 font-black text-[#071d43]">{card.title}</h3>
                    <p className="mt-2 text-xs font-bold leading-6 text-slate-600">{card.body}</p>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            variants={fadeUp}
            className="rounded-[2.5rem] bg-white/92 p-6 shadow-[0_24px_70px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 sm:p-7"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
              <ShieldCheck size={15} />
              Clear expectations
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#071d43]">
              Honest guidance, not fake promises.
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {promiseCards.map((group) => {
                const isPositive = group.tone === "green";

                return (
                  <div
                    key={group.title}
                    className={`rounded-[1.8rem] p-5 ring-1 ${
                      isPositive ? "bg-green-50 ring-green-100" : "bg-orange-50 ring-orange-100"
                    }`}
                  >
                    <h3 className={`text-xl font-black ${isPositive ? "text-green-800" : "text-orange-800"}`}>
                      {group.title}
                    </h3>
                    <div className="mt-4 space-y-2">
                      {group.items.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-3 py-2 text-xs font-black leading-5 text-[#244263] ring-1 ring-white/70">
                          {isPositive ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          ) : (
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                          )}
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.18 }}
          variants={fadeUp}
          className="mt-8 rounded-[2.5rem] bg-white/92 p-6 shadow-[0_24px_70px_rgba(120,70,20,0.10)] ring-1 ring-orange-100 sm:p-7"
        >
          <div className="mx-auto max-w-4xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
              <CircleHelp size={15} />
              Consultation FAQs
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-[#071d43] md:text-4xl">
              Questions students ask before booking.
            </h2>
          </div>

          <div className="mx-auto mt-7 max-w-[1050px] space-y-3">
            {consultationFaqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={faq.q} className="overflow-hidden rounded-[1.5rem] bg-[#fff8ef] ring-1 ring-orange-100">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-black text-[#071d43] transition duration-300 hover:bg-orange-50/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-200"
                  >
                    <span className="flex items-center gap-3">
                      <CircleHelp className="text-orange-600" size={20} />
                      {faq.q}
                    </span>
                    <span
                      className={`text-orange-600 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : ACCORDION_MOTION
                        }
                        className="overflow-hidden"
                      >
                        <motion.p
                          initial={{ y: -6 }}
                          animate={{ y: 0 }}
                          exit={{ y: -4 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : ACCORDION_MOTION
                          }
                          className="px-5 pb-5 text-sm font-bold leading-7 text-slate-600"
                        >
                          {faq.a}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

      </div>
    </section>
  );
}

export default AppointmentPage;
