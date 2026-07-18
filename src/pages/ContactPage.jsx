import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import Contact from "../components/Contact";

const supportCards = [
  {
    icon: GraduationCap,
    title: "University Direction",
    text: "Get help understanding which Italian universities, cities and courses deserve your attention first.",
  },
  {
    icon: Target,
    title: "Scholarship Planning",
    text: "Connect university choice with DSU, regional funding, documents and a realistic backup budget.",
  },
  {
    icon: Route,
    title: "Application Roadmap",
    text: "Understand the next steps for admission, documents, deadlines and visa preparation.",
  },
];

const journeySteps = [
  {
    step: "01",
    icon: MessageCircle,
    title: "Tell us where you are",
    text: "Share your current education, target field, budget and what you are confused about.",
  },
  {
    step: "02",
    icon: Target,
    title: "We identify the real problem",
    text: "University selection, scholarships, admissions, documents or visa — we start with the right issue.",
  },
  {
    step: "03",
    icon: Route,
    title: "You get a clear next step",
    text: "The goal is to leave the conversation knowing what to research, prepare or do next.",
  },
];

const trustPoints = [
  "No fake admission guarantees",
  "No guaranteed scholarship claims",
  "No guaranteed visa promises",
  "Italy-first guidance built around live university and city data",
];

function ContactPage() {
  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071b3a]">
      <section className="relative px-5 pb-12 pt-28 sm:px-6 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(255,91,18,0.14),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(255,184,96,0.16),transparent_24%)]" />

        <div className="relative mx-auto max-w-[1450px]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-stretch">
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65 }}
              className="flex flex-col justify-center"
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm ring-1 ring-orange-100">
                <Sparkles className="h-4 w-4 fill-orange-500" />
                Contact Zaifan
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                Start with the question you actually
                <span className="text-orange-600"> need answered.</span>
              </h1>

              <p className="mt-6 max-w-3xl text-lg font-semibold leading-9 text-slate-700">
                Not every student needs the same service. Tell us where you are in your Italy journey,
                and we will help you identify the most useful next step.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {["University selection", "Scholarships", "Admissions", "Documents", "Visa"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#071b3a] shadow-sm ring-1 ring-orange-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65 }}
              className="rounded-[2.8rem] bg-[#071f50] p-7 text-white shadow-[0_30px_90px_rgba(7,31,80,0.2)] sm:p-8"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                Before you contact us
              </p>

              <h2 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em]">
                The more context you share, the more useful the conversation can be.
              </h2>

              <div className="mt-7 grid gap-3">
                {[
                  ["Academic background", "Your current qualification and field"],
                  ["Target", "Bachelor, master or another study route"],
                  ["Budget", "Your realistic affordability range"],
                  ["Main question", "What decision is blocking you right now?"],
                ].map(([label, text]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-300">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white/82">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-[1.6rem] bg-white p-5 text-[#071b3a]">
                <ShieldCheck className="mt-0.5 shrink-0 text-orange-600" />
                <p className="text-sm font-bold leading-6 text-slate-600">
                  We guide and explain, but final admission, scholarship and visa decisions remain
                  with the relevant universities and authorities.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {supportCards.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                viewport={{ once: true }}
                className={`rounded-[2rem] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ${
                  index === 0
                    ? "bg-orange-600 text-white"
                    : index === 1
                      ? "bg-[#071f50] text-white"
                      : "bg-white text-[#071b3a] ring-1 ring-orange-100"
                }`}
              >
                <div
                  className={`grid h-14 w-14 place-items-center rounded-2xl ${
                    index < 2 ? "bg-white/10 text-orange-200" : "bg-orange-50 text-orange-600"
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className={`mt-3 text-sm font-semibold leading-7 ${
                  index < 2 ? "text-white/72" : "text-slate-600"
                }`}>
                  {item.text}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1300px] rounded-[2.8rem] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
                <Route className="h-4 w-4" />
                How the conversation works
              </div>

              <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                One conversation should create momentum.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                You should leave with a clearer understanding of what to do next — not another pile of vague advice.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {journeySteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[1.8rem] bg-[#fff8f1] p-5 ring-1 ring-orange-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600 text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-black text-orange-100">{item.step}</span>
                  </div>

                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Contact />

      <section className="bg-[#071f50] px-5 py-16 text-white sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1300px] gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
              Honest guidance promise
            </p>
            <h2 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em]">
              Clear support without fake certainty.
            </h2>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">
              Our role is to improve your planning, preparation and decision-making — not to sell guarantees that no consultancy can honestly control.
            </p>
          </div>

          <div className="grid gap-3">
            {trustPoints.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-sm font-bold leading-6 text-white/80 ring-1 ring-white/10"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ContactPage;
