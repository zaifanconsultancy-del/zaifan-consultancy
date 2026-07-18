import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Lightbulb,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import aboutDocuments from "../assets/images/about/about-documents.jpg";

const principles = [
  {
    icon: ShieldCheck,
    title: "Honest before impressive",
    text: "We would rather explain the real limits, risks and requirements than make a promise we cannot control.",
  },
  {
    icon: Target,
    title: "Profile before recommendation",
    text: "A university, city or scholarship route only makes sense when it matches the student's academics, budget and goals.",
  },
  {
    icon: Route,
    title: "One connected journey",
    text: "Country, university, scholarship, documents and visa planning should work together instead of being treated as separate tasks.",
  },
  {
    icon: FileCheck2,
    title: "Preparation before pressure",
    text: "Strong planning starts early, especially for documents, funding routes and application deadlines.",
  },
];

const journey = [
  {
    step: "01",
    icon: Compass,
    title: "Understand the student",
    text: "Start with education, budget, interests, readiness and long-term direction.",
  },
  {
    step: "02",
    icon: GraduationCap,
    title: "Build the shortlist",
    text: "Connect the student with universities, cities and courses that actually make sense.",
  },
  {
    step: "03",
    icon: Landmark,
    title: "Plan affordability",
    text: "Review tuition, living costs, scholarship routes and backup budgeting together.",
  },
  {
    step: "04",
    icon: CheckCircle2,
    title: "Prepare the route",
    text: "Turn the decision into documents, applications, timelines and the next practical steps.",
  },
];

function About() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#fff7ed] px-5 pb-16 pt-28 text-[#071b3a] sm:px-6 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,91,18,0.14),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(255,186,108,0.16),transparent_24%)]" />
      <div className="pointer-events-none absolute -left-28 top-16 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1450px]">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm ring-1 ring-orange-100">
              <Sparkles className="h-4 w-4 fill-orange-500" />
              About Zaifan
            </div>

            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              Built for students who need
              <span className="text-orange-600"> clarity before commitment.</span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-9 text-slate-700">
              Zaifan Consultancy is building a student guidance ecosystem around one simple idea:
              major study-abroad decisions should be easier to understand, easier to compare and
              harder to get wrong.
            </p>

            <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600">
              Italy is our first fully developed destination. Instead of pretending to cover every
              country equally, we are building one ecosystem properly — universities, cities,
              scholarships, documents, services and student decision tools — then expanding only
              when the next destination is ready.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/appointment?country=Italy&service=Free Italy Study Plan"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 text-sm font-black text-white shadow-[0_18px_38px_rgba(234,88,12,0.25)] transition hover:-translate-y-1 hover:bg-orange-700"
              >
                Start With A Free Consultation
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="/universities"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-sm font-black text-[#071b3a] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-orange-600"
              >
                Explore The Italy Ecosystem
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.8rem] bg-[#071f50] p-3 shadow-[0_32px_90px_rgba(7,31,80,0.20)]"
          >
            <div className="relative h-full min-h-[620px] overflow-hidden rounded-[2.2rem]">
              <img
                src={aboutDocuments}
                alt="Zaifan Consultancy student document guidance"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/96 via-[#071f50]/58 to-[#071f50]/10" />

              <div className="absolute left-6 top-6 rounded-2xl bg-white/92 px-4 py-3 text-[#071b3a] shadow-lg backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                  Our operating principle
                </p>
                <p className="mt-1 text-sm font-black">Guide first. Sell later.</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-7 text-white sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  The Zaifan Approach
                </p>
                <h2 className="mt-3 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.05em]">
                  One decision should connect to the next.
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/72">
                  University selection, scholarship planning, documents, city choice and visa
                  preparation all affect one another. Our job is to help students see the full
                  picture before they move.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Italy", "Live destination"],
                    ["50+", "University profiles"],
                    ["DSU", "Funding ecosystem"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur"
                    >
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="mt-1 text-xs font-bold text-white/58">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {principles.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
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

              <p
                className={`mt-6 text-[10px] font-black uppercase tracking-[0.15em] ${
                  index < 2 ? "text-orange-200" : "text-orange-600"
                }`}
              >
                Principle 0{index + 1}
              </p>

              <h3 className="mt-2 text-xl font-black">{item.title}</h3>
              <p
                className={`mt-3 text-sm font-semibold leading-7 ${
                  index < 2 ? "text-white/72" : "text-slate-600"
                }`}
              >
                {item.text}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 rounded-[2.8rem] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
                <Route className="h-4 w-4" />
                How We Think
              </div>

              <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                From “I want to study abroad” to a real plan.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                Good consultancy should reduce confusion. These four stages guide the way we
                structure student decisions.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {journey.map((item) => (
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
                  <h3 className="mt-4 text-lg font-black text-[#071b3a]">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
